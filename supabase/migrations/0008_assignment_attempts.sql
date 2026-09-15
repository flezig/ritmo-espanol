-- Attempt-scoped, assignment-specific progress. Run after 0007_assignment_activity.sql.

alter table public.assignments add column if not exists current_attempt integer not null default 1 check (current_attempt > 0);
alter table public.assignments add column if not exists tracking_version integer not null default 1;
alter table public.assignments alter column tracking_version set default 2;
alter table public.assignment_activity_events add column if not exists session_id uuid;
alter table public.assignment_activity_events add column if not exists attempt_no integer not null default 1 check (attempt_no > 0);
alter table public.assignment_activity_events add column if not exists event_kind text not null default 'answer';
alter table public.assignment_activity_events add column if not exists item_key text not null default '';
alter table public.assignment_activity_events drop constraint if exists assignment_activity_events_event_kind_check;
alter table public.assignment_activity_events add constraint assignment_activity_events_event_kind_check check (event_kind in ('answer','session_complete'));
create unique index if not exists assignment_activity_one_completion_per_session
  on public.assignment_activity_events(assignment_id, session_id) where event_kind = 'session_complete';
create index if not exists assignment_activity_attempt_idx
  on public.assignment_activity_events(assignment_id, attempt_no, occurred_at desc);

drop function if exists public.record_assignment_activity(uuid, uuid, text, text, text, text, text, boolean, integer, jsonb);
drop function if exists public.record_assignment_activity(uuid, uuid, text, text, text, text, text, boolean, integer, jsonb, uuid, text, text);
create function public.record_assignment_activity(
  p_event_id uuid, p_assignment uuid, p_activity_type text, p_content_id text,
  p_prompt text, p_student_answer text, p_correct_answer text, p_is_correct boolean,
  p_score_delta integer default 0, p_metadata jsonb default '{}'::jsonb,
  p_session_id uuid default null, p_event_kind text default 'answer', p_item_key text default ''
) returns void language plpgsql security definer set search_path = '' as $$
declare item public.assignments; answers_in_session integer; declared_total integer;
begin
  select * into item from public.assignments where id = p_assignment for update;
  if item.id is null or item.student_id <> auth.uid() or item.status not in ('assigned','revision_requested','overdue') then raise exception 'Assignment unavailable'; end if;
  if p_activity_type not in ('lesson','practice','dictation','music') or item.assignment_type <> p_activity_type then raise exception 'Activity does not match assignment'; end if;
  if item.content_id is not null and item.content_id <> 'all' and item.content_id <> p_content_id then raise exception 'Content does not match assignment'; end if;
  if p_event_id is null or p_session_id is null or p_event_kind not in ('answer','session_complete')
    or length(trim(p_prompt)) = 0 or length(p_prompt) > 5000
    or length(coalesce(p_student_answer,'')) > 5000 or length(coalesce(p_correct_answer,'')) > 5000
    or p_score_delta not between 0 and 1000
    or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then raise exception 'Invalid activity'; end if;
  if p_event_kind = 'session_complete' then
    select count(*) into answers_in_session from public.assignment_activity_events
      where assignment_id = item.id and student_id = auth.uid() and session_id = p_session_id
        and attempt_no = item.current_attempt and event_kind = 'answer';
    begin declared_total := (p_metadata->>'total')::integer; exception when others then declared_total := null; end;
    if answers_in_session < 1 or declared_total is null or declared_total <> answers_in_session then raise exception 'Session answer count mismatch'; end if;
  end if;
  insert into public.assignment_activity_events(event_id, assignment_id, student_id, activity_type, content_id,
    prompt, student_answer, correct_answer, is_correct, score_delta, metadata, session_id, attempt_no, event_kind, item_key)
  values(p_event_id, item.id, auth.uid(), p_activity_type, coalesce(p_content_id,''), trim(p_prompt),
    coalesce(p_student_answer,''), coalesce(p_correct_answer,''), p_is_correct, p_score_delta,
    coalesce(p_metadata,'{}'::jsonb), p_session_id, item.current_attempt, p_event_kind, left(coalesce(p_item_key,''),500))
  on conflict(event_id) do nothing;
  if p_event_kind = 'session_complete' and (
    select count(*) from public.assignment_activity_events where assignment_id = item.id
      and attempt_no = item.current_attempt and event_kind = 'session_complete'
  ) >= item.target_count then
    update public.assignments set status = 'submitted', updated_at = clock_timestamp() where id = item.id;
    insert into public.assignment_submissions(assignment_id, student_id, attempt, text_answer, answers)
    values(item.id, item.student_id, item.current_attempt, 'Учебная цель выполнена на сайте.',
      jsonb_build_object('automatic', true, 'attempt', item.current_attempt, 'target', item.target_count))
    on conflict(assignment_id, attempt) do nothing;
    insert into public.notifications(user_id, kind, title, body, entity_type, entity_id)
    values(item.teacher_id, 'submission', 'Учебная цель выполнена', item.title, 'assignment', item.id);
  end if;
end;
$$;

create or replace function public.get_visible_assignment_progress()
returns table(assignment_id uuid, completed_count integer, target_count integer, correct_count integer, answer_count integer, earned_score integer, progress_percent integer)
language plpgsql stable security definer set search_path = '' as $$
declare item public.assignments; metric jsonb; current_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  for item in select * from public.assignments a where auth.uid() = a.teacher_id or (auth.uid() = a.student_id and a.status <> 'draft') loop
    if item.tracking_version >= 2 and item.metric_key <> 'manual' then
      select count(*) filter(where event_kind='session_complete'), count(*) filter(where event_kind='answer' and is_correct),
        count(*) filter(where event_kind='answer'), coalesce(sum(score_delta) filter(where event_kind='answer'),0)
      into current_count, correct_count, answer_count, earned_score
      from public.assignment_activity_events e where e.assignment_id=item.id and e.attempt_no=item.current_attempt;
    elsif item.metric_key = 'manual' then
      current_count := case when item.status in ('submitted','completed') then 1 else 0 end;
      correct_count := 0; answer_count := 0; earned_score := 0;
    else
      metric := public.student_metric(item.student_id, item.metric_key);
      current_count := greatest(0, coalesce((metric->>'count')::integer, 0) - item.progress_baseline);
      correct_count := greatest(0, coalesce((metric->>'correct')::integer, 0) - item.correct_baseline);
      answer_count := greatest(0, coalesce((metric->>'total')::integer, 0) - item.answer_baseline);
      earned_score := greatest(0, coalesce((metric->>'score')::integer, 0) - item.score_baseline);
    end if;
    assignment_id := item.id; completed_count := least(item.target_count, current_count); target_count := item.target_count;
    progress_percent := least(100, floor(completed_count::numeric * 100 / item.target_count)::integer); return next;
  end loop;
end;
$$;

create or replace function public.refresh_my_assignment_progress()
returns integer language plpgsql security definer set search_path = '' as $$
declare item public.assignments; metric jsonb; completed integer; changed integer := 0; next_attempt integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  for item in select * from public.assignments a where a.tracking_version < 2 and a.metric_key <> 'manual'
    and a.status in ('assigned','revision_requested','overdue') and auth.uid() in (a.teacher_id,a.student_id) loop
    metric := public.student_metric(item.student_id,item.metric_key);
    completed := greatest(0,coalesce((metric->>'count')::integer,0)-item.progress_baseline);
    if completed >= item.target_count then
      update public.assignments set status='submitted',updated_at=clock_timestamp() where id=item.id;
      select coalesce(max(attempt),0)+1 into next_attempt from public.assignment_submissions where assignment_id=item.id;
      insert into public.assignment_submissions(assignment_id,student_id,attempt,text_answer,answers)
      values(item.id,item.student_id,next_attempt,'Учебная цель выполнена на сайте.',jsonb_build_object('automatic',true,'completed',completed,'target',item.target_count));
      insert into public.notifications(user_id,kind,title,body,entity_type,entity_id)
      values(item.teacher_id,'submission','Учебная цель выполнена',item.title,'assignment',item.id); changed:=changed+1;
    end if;
  end loop; return changed;
end;
$$;

create or replace function public.review_assignment(p_assignment uuid, p_decision text, p_score numeric default null, p_comment text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare row_data public.assignments; submission_id uuid; review_id uuid;
begin
  select * into row_data from public.assignments where id=p_assignment for update;
  if row_data.id is null or row_data.teacher_id<>auth.uid() or row_data.status<>'submitted' then raise exception 'Assignment unavailable'; end if;
  if p_decision not in ('completed','revision_requested') then raise exception 'Invalid decision'; end if;
  if p_score is not null and (p_score<0 or (row_data.max_score is not null and p_score>row_data.max_score)) then raise exception 'Invalid score'; end if;
  select id into submission_id from public.assignment_submissions where assignment_id=p_assignment order by attempt desc limit 1;
  insert into public.assignment_reviews(assignment_id,submission_id,teacher_id,decision,score,comment)
  values(p_assignment,submission_id,auth.uid(),p_decision,p_score,coalesce(p_comment,'')) returning id into review_id;
  update public.assignments set status=p_decision, completed_at=case when p_decision='completed' then clock_timestamp() else null end,
    current_attempt=case when p_decision='revision_requested' then current_attempt+1 else current_attempt end,
    tracking_version=case when p_decision='revision_requested' then 2 else tracking_version end, updated_at=clock_timestamp() where id=p_assignment;
  insert into public.notifications(user_id,kind,title,body,entity_type,entity_id)
  values(row_data.student_id,'review',case when p_decision='completed' then 'Задание проверено' else 'Нужна доработка' end,row_data.title,'assignment',p_assignment);
  return review_id;
end;
$$;

create or replace function public.submit_assignment(p_assignment uuid, p_text text default '', p_answers jsonb default '[]'::jsonb, p_link text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare row_data public.assignments; submission_id uuid;
begin
  select * into row_data from public.assignments where id=p_assignment for update;
  if row_data.id is null or row_data.student_id<>auth.uid() or row_data.status not in ('assigned','revision_requested','overdue') then raise exception 'Assignment unavailable'; end if;
  if row_data.metric_key<>'manual' then raise exception 'Complete the assigned learning sessions'; end if;
  if coalesce(length(trim(p_text)),0)=0 and p_link is null and coalesce(p_answers,'[]'::jsonb)='[]'::jsonb then raise exception 'Answer required'; end if;
  insert into public.assignment_submissions(assignment_id,student_id,attempt,text_answer,answers,link_url)
  values(p_assignment,auth.uid(),row_data.current_attempt,coalesce(p_text,''),coalesce(p_answers,'[]'::jsonb),p_link) returning id into submission_id;
  update public.assignments set status='submitted',updated_at=clock_timestamp() where id=p_assignment;
  insert into public.notifications(user_id,kind,title,body,entity_type,entity_id)
  values(row_data.teacher_id,'submission','Работа отправлена',row_data.title,'assignment',p_assignment); return submission_id;
end;
$$;

do $$
declare item public.assignments; metric jsonb; already_done integer; n integer;
begin
  for item in select * from public.assignments where metric_key<>'manual' and tracking_version<2 loop
    metric := public.student_metric(item.student_id,item.metric_key);
    already_done := case when item.status='revision_requested' then 0 else least(item.target_count,greatest(0,coalesce((metric->>'count')::integer,0)-item.progress_baseline)) end;
    for n in 1..already_done loop
      insert into public.assignment_activity_events(event_id,assignment_id,student_id,activity_type,content_id,prompt,student_answer,
        correct_answer,is_correct,score_delta,metadata,session_id,attempt_no,event_kind)
      values(gen_random_uuid(),item.id,item.student_id,item.assignment_type,coalesce(item.content_id,''),'Прогресс до обновления системы',
        'Сессия завершена','Сессия завершена',true,0,jsonb_build_object('migrated',true),gen_random_uuid(),item.current_attempt,'session_complete');
    end loop;
  end loop;
  update public.assignments set tracking_version=2 where metric_key<>'manual';
end $$;

create or replace function public.mark_overdue_assignments()
returns integer language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  with updated as (
    update public.assignments set status='overdue',updated_at=clock_timestamp()
    where due_at<clock_timestamp() and status in ('assigned','revision_requested') returning id,student_id,title
  ), notices as (
    insert into public.notifications(user_id,kind,title,body,entity_type,entity_id)
    select student_id,'deadline','Срок задания истёк',title,'assignment',id from updated
    on conflict(user_id,kind,entity_type,entity_id) where kind='deadline' do nothing returning 1
  ) select count(*) into changed from updated; return changed;
end;
$$;

do $$ begin
  create extension if not exists pg_cron with schema extensions;
  if not exists(select 1 from cron.job where jobname='ritmo-mark-overdue-assignments') then
    perform cron.schedule('ritmo-mark-overdue-assignments','* * * * *','select public.mark_overdue_assignments();');
  end if;
exception when others then null;
end $$;

revoke all on function public.record_assignment_activity(uuid,uuid,text,text,text,text,text,boolean,integer,jsonb,uuid,text,text) from public,anon;
grant execute on function public.record_assignment_activity(uuid,uuid,text,text,text,text,text,boolean,integer,jsonb,uuid,text,text) to authenticated;
revoke all on function public.mark_overdue_assignments() from public,anon,authenticated;
