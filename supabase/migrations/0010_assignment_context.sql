-- Assignment matching outside the cabinet, topic-scoped Practice and contextual questions.
-- Run after 0009_fix_assignment_progress_ambiguity.sql.

alter table public.assignments add column if not exists topic_id text;
alter table public.assignments add column if not exists topic_title_snapshot text;
alter table public.assignment_activity_events add column if not exists source_event_id uuid;
update public.assignment_activity_events set source_event_id = event_id where source_event_id is null;
alter table public.assignment_activity_events alter column source_event_id set not null;
create unique index if not exists assignment_activity_source_event_idx
  on public.assignment_activity_events(assignment_id, source_event_id);

create or replace function public.get_my_student_assignments()
returns setof public.assignments language sql stable security definer set search_path = '' as $$
  select a.* from public.assignments a
  where a.student_id = auth.uid() and a.status <> 'draft'
  order by
    case a.status when 'revision_requested' then 0 when 'overdue' then 1 when 'assigned' then 2 when 'submitted' then 3 else 4 end,
    a.due_at nulls last, a.created_at desc;
$$;

create or replace function public.find_my_active_assignment(p_type text,p_content_id text,p_topic_id text default null)
returns uuid language sql stable security definer set search_path='' as $$
  select a.id from public.assignments a where a.student_id=auth.uid() and a.status in ('assigned','revision_requested','overdue')
    and a.assignment_type=p_type and (a.content_id is null or a.content_id='all' or a.content_id=p_content_id)
    and (a.topic_id is null or a.topic_id='all' or lower(a.topic_id)=lower(coalesce(p_topic_id,'')))
  order by case a.status when 'revision_requested' then 0 when 'overdue' then 1 else 2 end,a.due_at nulls last,a.created_at limit 1;
$$;

drop function if exists public.create_assignment(uuid,text,text,text,timestamptz,numeric,text,text,text,text,text,integer);
create function public.create_assignment(
  p_student uuid, p_title text, p_description text default '', p_type text default 'manual',
  p_due_at timestamptz default null, p_max_score numeric default null, p_material_url text default null,
  p_content_type text default null, p_content_id text default null, p_content_title_snapshot text default null,
  p_status text default 'assigned', p_target_count integer default 1,
  p_topic_id text default null, p_topic_title_snapshot text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid; selected_metric text; baseline jsonb;
begin
  if auth.uid() is null or not public.has_role(auth.uid(),'teacher') or not public.teacher_has_student(auth.uid(),p_student) then raise exception 'Student unavailable'; end if;
  if p_status not in ('draft','assigned') or p_type not in ('manual','lesson','practice','dictation','music','mixed') or p_target_count not between 1 and 1000 then raise exception 'Invalid assignment'; end if;
  selected_metric := case when p_type='lesson' and p_content_id is not null then 'lesson:'||p_content_id when p_type='practice' and p_content_id is not null then 'practice:'||p_content_id when p_type='dictation' then 'dictation' when p_type='music' and p_content_id is not null then 'music:'||p_content_id else 'manual' end;
  baseline := public.student_metric(p_student,selected_metric);
  insert into public.assignments(teacher_id,student_id,title,description,assignment_type,status,due_at,max_score,material_url,
    content_type,content_id,content_title_snapshot,topic_id,topic_title_snapshot,assigned_at,target_count,metric_key,
    progress_baseline,score_baseline,correct_baseline,answer_baseline,tracking_version)
  values(auth.uid(),p_student,trim(p_title),coalesce(p_description,''),p_type,p_status,p_due_at,p_max_score,p_material_url,
    p_content_type,p_content_id,p_content_title_snapshot,nullif(trim(coalesce(p_topic_id,'')),''),nullif(trim(coalesce(p_topic_title_snapshot,'')),''),
    case when p_status='assigned' then clock_timestamp() end,p_target_count,selected_metric,
    coalesce((baseline->>'count')::integer,0),coalesce((baseline->>'score')::integer,0),
    coalesce((baseline->>'correct')::integer,0),coalesce((baseline->>'total')::integer,0),2)
  returning id into new_id;
  if p_status='assigned' then insert into public.notifications(user_id,kind,title,body,entity_type,entity_id)
    values(p_student,'assignment','Новое задание',trim(p_title),'assignment',new_id); end if;
  return new_id;
end;
$$;

create or replace function public.record_learning_activity(
  p_event_id uuid, p_activity_type text, p_content_id text, p_topic_id text,
  p_prompt text, p_student_answer text, p_correct_answer text, p_is_correct boolean,
  p_score_delta integer default 0, p_metadata jsonb default '{}'::jsonb,
  p_session_id uuid default null, p_event_kind text default 'answer', p_item_key text default ''
) returns integer language plpgsql security definer set search_path = '' as $$
declare item public.assignments; inserted_count integer := 0; answer_total integer; declared_total integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_activity_type not in ('lesson','practice','dictation','music') or p_event_id is null or p_session_id is null
    or p_event_kind not in ('answer','session_complete') or length(trim(p_prompt))=0 or length(p_prompt)>5000
    or length(coalesce(p_student_answer,''))>5000 or length(coalesce(p_correct_answer,''))>5000
    or p_score_delta not between 0 and 1000 or jsonb_typeof(coalesce(p_metadata,'{}'::jsonb))<>'object' then raise exception 'Invalid activity'; end if;
  for item in select a.* from public.assignments a where a.student_id=auth.uid()
    and a.status in ('assigned','revision_requested','overdue') and a.assignment_type=p_activity_type
    and (a.content_id is null or a.content_id='all' or a.content_id=p_content_id)
    and (a.topic_id is null or a.topic_id='all' or lower(a.topic_id)=lower(coalesce(p_topic_id,'')))
    for update
  loop
    if p_event_kind='session_complete' then
      select count(*) into answer_total from public.assignment_activity_events e
      where e.assignment_id=item.id and e.student_id=auth.uid() and e.session_id=p_session_id
        and e.attempt_no=item.current_attempt and e.event_kind='answer';
      begin declared_total := (p_metadata->>'total')::integer; exception when others then declared_total := null; end;
      if answer_total<1 or declared_total is null or (item.assignment_type<>'lesson' and declared_total<>answer_total) or declared_total<answer_total then continue; end if;
    end if;
    insert into public.assignment_activity_events(event_id,source_event_id,assignment_id,student_id,activity_type,content_id,
      prompt,student_answer,correct_answer,is_correct,score_delta,metadata,session_id,attempt_no,event_kind,item_key)
    values(gen_random_uuid(),p_event_id,item.id,auth.uid(),p_activity_type,coalesce(p_content_id,''),trim(p_prompt),
      coalesce(p_student_answer,''),coalesce(p_correct_answer,''),p_is_correct,p_score_delta,coalesce(p_metadata,'{}'::jsonb),
      p_session_id,item.current_attempt,p_event_kind,left(coalesce(p_item_key,''),500))
    on conflict(assignment_id,source_event_id) do nothing;
    if found then inserted_count:=inserted_count+1; end if;
    if p_event_kind='session_complete' and (select count(*) from public.assignment_activity_events e where e.assignment_id=item.id and e.attempt_no=item.current_attempt and e.event_kind='session_complete')>=item.target_count then
      update public.assignments set status='submitted',updated_at=clock_timestamp() where id=item.id and status in ('assigned','revision_requested','overdue');
      if found then
        insert into public.assignment_submissions(assignment_id,student_id,attempt,text_answer,answers)
        values(item.id,item.student_id,item.current_attempt,'Учебная цель выполнена на сайте.',jsonb_build_object('automatic',true,'attempt',item.current_attempt,'target',item.target_count))
        on conflict(assignment_id,attempt) do nothing;
        insert into public.notifications(user_id,kind,title,body,entity_type,entity_id) values(item.teacher_id,'submission','Учебная цель выполнена',item.title,'assignment',item.id);
      end if;
    end if;
  end loop;
  return inserted_count;
end;
$$;

create or replace function public.get_visible_assignment_progress()
returns table(assignment_id uuid,completed_count integer,target_count integer,correct_count integer,answer_count integer,earned_score integer,progress_percent integer)
language plpgsql stable security definer set search_path='' as $$
declare item public.assignments; metric jsonb; current_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  for item in select a.* from public.assignments a where auth.uid()=a.teacher_id or (auth.uid()=a.student_id and a.status<>'draft') loop
    if item.assignment_type='lesson' and item.content_id is not null then
      metric:=public.student_metric(item.student_id,'lesson:'||item.content_id);
      current_count:=coalesce((metric->>'count')::integer,0);
      correct_count:=coalesce((metric->>'correct')::integer,0); answer_count:=coalesce((metric->>'total')::integer,0); earned_score:=correct_count;
      assignment_id:=item.id; completed_count:=least(item.target_count,current_count); target_count:=item.target_count;
      progress_percent:=case when current_count>=item.target_count then 100 else least(99,floor(answer_count::numeric*100/50)::integer) end;
      return next;
    elsif item.tracking_version>=2 and item.metric_key<>'manual' then
      select count(*) filter(where e.event_kind='session_complete'),count(*) filter(where e.event_kind='answer' and e.is_correct),count(*) filter(where e.event_kind='answer'),coalesce(sum(e.score_delta) filter(where e.event_kind='answer'),0)
      into current_count,correct_count,answer_count,earned_score from public.assignment_activity_events e where e.assignment_id=item.id and e.attempt_no=item.current_attempt;
    elsif item.metric_key='manual' then
      current_count:=case when item.status in ('submitted','completed') then 1 else 0 end; correct_count:=0; answer_count:=0; earned_score:=0;
    else
      metric:=public.student_metric(item.student_id,item.metric_key);
      current_count:=greatest(0,coalesce((metric->>'count')::integer,0)-item.progress_baseline);
      correct_count:=greatest(0,coalesce((metric->>'correct')::integer,0)-item.correct_baseline);
      answer_count:=greatest(0,coalesce((metric->>'total')::integer,0)-item.answer_baseline);
      earned_score:=greatest(0,coalesce((metric->>'score')::integer,0)-item.score_baseline);
    end if;
    assignment_id:=item.id; completed_count:=least(item.target_count,current_count); target_count:=item.target_count;
    progress_percent:=least(100,floor(completed_count::numeric*100/item.target_count)::integer); return next;
  end loop;
end; $$;

create table if not exists public.exercise_questions (
  id uuid primary key default gen_random_uuid(), assignment_id uuid references public.assignments(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade, student_id uuid not null references auth.users(id) on delete cascade,
  context_type text not null, content_id text not null default '', topic_id text, item_key text not null default '',
  prompt text not null, status text not null default 'open' check(status in ('open','answered','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.exercise_question_messages (
  id bigint generated always as identity primary key, question_id uuid not null references public.exercise_questions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade, body text not null check(length(trim(body)) between 1 and 2000), created_at timestamptz not null default now()
);
alter table public.exercise_questions enable row level security;
alter table public.exercise_question_messages enable row level security;
create policy "Question parties read" on public.exercise_questions for select to authenticated using(auth.uid() in (teacher_id,student_id));
create policy "Question parties read messages" on public.exercise_question_messages for select to authenticated using(exists(select 1 from public.exercise_questions q where q.id=question_id and auth.uid() in (q.teacher_id,q.student_id)));

create or replace function public.ask_teacher_question(p_assignment uuid,p_context_type text,p_content_id text,p_topic_id text,p_item_key text,p_prompt text,p_body text)
returns uuid language plpgsql security definer set search_path='' as $$
declare a public.assignments; qid uuid;
begin
  select * into a from public.assignments where id=p_assignment and student_id=auth.uid() and status in ('assigned','revision_requested','overdue');
  if a.id is null or length(trim(p_body)) not between 1 and 2000 then raise exception 'Assignment unavailable'; end if;
  insert into public.exercise_questions(assignment_id,teacher_id,student_id,context_type,content_id,topic_id,item_key,prompt)
  values(a.id,a.teacher_id,auth.uid(),p_context_type,coalesce(p_content_id,''),p_topic_id,coalesce(p_item_key,''),left(coalesce(p_prompt,''),5000)) returning id into qid;
  insert into public.exercise_question_messages(question_id,author_id,body) values(qid,auth.uid(),trim(p_body));
  insert into public.notifications(user_id,kind,title,body,entity_type,entity_id) values(a.teacher_id,'question','Вопрос ученика',a.title,'assignment',a.id);
  return qid;
end; $$;

create or replace function public.reply_to_exercise_question(p_question uuid,p_body text)
returns bigint language plpgsql security definer set search_path='' as $$
declare q public.exercise_questions; mid bigint;
begin
  select * into q from public.exercise_questions where id=p_question for update;
  if q.id is null or auth.uid() not in (q.teacher_id,q.student_id) or length(trim(p_body)) not between 1 and 2000 then raise exception 'Question unavailable'; end if;
  insert into public.exercise_question_messages(question_id,author_id,body) values(q.id,auth.uid(),trim(p_body)) returning id into mid;
  update public.exercise_questions set status=case when auth.uid()=q.teacher_id then 'answered' else 'open' end,updated_at=clock_timestamp() where id=q.id;
  insert into public.notifications(user_id,kind,title,body,entity_type,entity_id)
    values(case when auth.uid()=q.teacher_id then q.student_id else q.teacher_id end,'question_reply',case when auth.uid()=q.teacher_id then 'Учитель ответил' else 'Новый вопрос ученика' end,left(trim(p_body),160),'assignment',q.assignment_id);
  return mid;
end; $$;

revoke all on function public.create_assignment(uuid,text,text,text,timestamptz,numeric,text,text,text,text,text,integer,text,text), public.get_my_student_assignments(), public.find_my_active_assignment(text,text,text), public.record_learning_activity(uuid,text,text,text,text,text,text,boolean,integer,jsonb,uuid,text,text), public.ask_teacher_question(uuid,text,text,text,text,text,text), public.reply_to_exercise_question(uuid,text) from public,anon;
grant execute on function public.create_assignment(uuid,text,text,text,timestamptz,numeric,text,text,text,text,text,integer,text,text), public.get_my_student_assignments(), public.find_my_active_assignment(text,text,text), public.record_learning_activity(uuid,text,text,text,text,text,text,boolean,integer,jsonb,uuid,text,text), public.ask_teacher_question(uuid,text,text,text,text,text,text), public.reply_to_exercise_question(uuid,text) to authenticated;
revoke all on public.exercise_questions,public.exercise_question_messages from public,anon;
grant select on public.exercise_questions,public.exercise_question_messages to authenticated;
