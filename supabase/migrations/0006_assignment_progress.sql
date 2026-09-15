-- Measurable progress for assignments. Run after 0005_restrict_teacher_role.sql.

alter table public.assignments add column if not exists target_count integer not null default 1 check (target_count between 1 and 1000);
alter table public.assignments add column if not exists metric_key text not null default 'manual';
alter table public.assignments add column if not exists progress_baseline integer not null default 0;
alter table public.assignments add column if not exists score_baseline integer not null default 0;
alter table public.assignments add column if not exists correct_baseline integer not null default 0;
alter table public.assignments add column if not exists answer_baseline integer not null default 0;

create or replace function public.progress_fragment(p_user uuid, p_key text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare stored jsonb; result jsonb;
begin
  select data into stored from public.user_progress where user_id = p_user;
  begin result := coalesce((stored->>p_key)::jsonb, '{}'::jsonb); exception when others then result := '{}'::jsonb; end;
  return result;
end;
$$;

create or replace function public.student_metric(p_student uuid, p_metric text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare stats jsonb := public.progress_fragment(p_student, 'ritmo-achievement-stats'); lessons jsonb; lesson_id text;
declare metric_count integer := 0; metric_correct integer := 0; metric_total integer := 0; metric_score integer := 0;
begin
  if p_metric like 'lesson:%' then
    lesson_id := substring(p_metric from 8);
    lessons := public.progress_fragment(p_student, 'ritmo-lesson-progress');
    metric_count := case when coalesce((lessons->lesson_id->>'completed')::boolean, false) then 1 else 0 end;
    metric_correct := coalesce((lessons->lesson_id->>'correct')::integer, 0);
    metric_total := coalesce((lessons->lesson_id->>'done')::integer, 0);
    metric_score := metric_correct;
  elsif p_metric = 'practice:all' then
    metric_count := coalesce((stats->>'practiceSessions')::integer, 0)
      + coalesce((stats->>'articleSessions')::integer, 0)
      + coalesce((stats->>'rushSessions')::integer, 0)
      + coalesce((select sum(value::integer) from jsonb_each_text(coalesce(stats->'detectiveSessions', '{}'::jsonb))), 0);
    metric_correct := coalesce((stats->>'practiceCorrect')::integer, 0)
      + coalesce((stats->>'articleCorrect')::integer, 0)
      + coalesce((stats->>'detectiveCorrect')::integer, 0);
    metric_total := coalesce((stats->>'practiceTotal')::integer, 0)
      + coalesce((stats->>'articleTotal')::integer, 0)
      + coalesce((stats->>'detectiveTotal')::integer, 0);
    metric_score := coalesce((stats->>'rushTotalScore')::integer, 0);
  elsif p_metric like 'practice:words:%' then
    lesson_id := substring(p_metric from 16);
    metric_count := coalesce((stats->'practiceModeSessions'->>lesson_id)::integer, 0);
    metric_correct := coalesce((stats->'practiceCorrectByMode'->>lesson_id)::integer, 0);
    metric_total := coalesce((stats->'practiceTotalByMode'->>lesson_id)::integer, 0);
  elsif p_metric = 'practice:articles' then
    metric_count := coalesce((stats->>'articleSessions')::integer, 0);
    metric_correct := coalesce((stats->>'articleCorrect')::integer, 0);
    metric_total := coalesce((stats->>'articleTotal')::integer, 0);
  elsif p_metric = 'practice:rush' then
    metric_count := coalesce((stats->>'rushSessions')::integer, 0);
    metric_score := coalesce((stats->>'rushTotalScore')::integer, 0);
  elsif p_metric like 'practice:detective:%' then
    lesson_id := upper(substring(p_metric from 20));
    metric_count := coalesce((stats->'detectiveSessions'->>lesson_id)::integer, 0);
    metric_correct := coalesce((stats->'detectiveCorrectByLevel'->>lesson_id)::integer, 0);
    metric_total := coalesce((stats->'detectiveTotalByLevel'->>lesson_id)::integer, 0);
  elsif p_metric = 'dictation' then
    metric_count := coalesce((stats->>'dictationSessions')::integer, 0);
    metric_correct := coalesce((stats->>'dictationCorrect')::integer, 0);
    metric_total := coalesce((stats->>'dictationTotal')::integer, 0);
  elsif p_metric like 'music:%' then
    lesson_id := substring(p_metric from 7);
    metric_count := coalesce((stats->'songSessionsById'->>lesson_id)::integer, 0);
    metric_correct := coalesce((stats->'songCorrectById'->>lesson_id)::integer, 0);
    metric_total := coalesce((stats->'songTotalById'->>lesson_id)::integer, 0);
  end if;
  return jsonb_build_object('count', metric_count, 'correct', metric_correct, 'total', metric_total, 'score', metric_score);
exception when others then
  return jsonb_build_object('count', 0, 'correct', 0, 'total', 0, 'score', 0);
end;
$$;

drop function if exists public.create_assignment(uuid, text, text, text, timestamptz, numeric, text, text, text, text, text);
create or replace function public.create_assignment(
  p_student uuid, p_title text, p_description text default '', p_type text default 'manual',
  p_due_at timestamptz default null, p_max_score numeric default null, p_material_url text default null,
  p_content_type text default null, p_content_id text default null, p_content_title_snapshot text default null,
  p_status text default 'assigned', p_target_count integer default 1
) returns uuid language plpgsql security definer set search_path = '' as $$
declare assignment_id uuid; selected_metric text; baseline jsonb;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'teacher') or not public.teacher_has_student(auth.uid(), p_student) then raise exception 'Student unavailable'; end if;
  if p_status not in ('draft', 'assigned') or p_type not in ('manual', 'lesson', 'practice', 'dictation', 'music', 'mixed') or p_target_count not between 1 and 1000 then raise exception 'Invalid assignment'; end if;
  selected_metric := case
    when p_type = 'lesson' and p_content_id is not null then 'lesson:' || p_content_id
    when p_type = 'practice' and p_content_id is not null then 'practice:' || p_content_id
    when p_type = 'dictation' then 'dictation'
    when p_type = 'music' and p_content_id is not null then 'music:' || p_content_id
    else 'manual' end;
  baseline := public.student_metric(p_student, selected_metric);
  insert into public.assignments(teacher_id, student_id, title, description, assignment_type, status, due_at, max_score, material_url,
    content_type, content_id, content_title_snapshot, assigned_at, target_count, metric_key, progress_baseline, score_baseline, correct_baseline, answer_baseline)
  values(auth.uid(), p_student, trim(p_title), coalesce(p_description, ''), p_type, p_status, p_due_at, p_max_score, p_material_url,
    p_content_type, p_content_id, p_content_title_snapshot, case when p_status = 'assigned' then clock_timestamp() end,
    p_target_count, selected_metric, coalesce((baseline->>'count')::integer, 0), coalesce((baseline->>'score')::integer, 0),
    coalesce((baseline->>'correct')::integer, 0), coalesce((baseline->>'total')::integer, 0))
  returning id into assignment_id;
  if p_status = 'assigned' then
    insert into public.notifications(user_id, kind, title, body, entity_type, entity_id)
    values(p_student, 'assignment', 'Новое задание', trim(p_title), 'assignment', assignment_id);
  end if;
  return assignment_id;
end;
$$;

create or replace function public.get_visible_assignment_progress()
returns table(assignment_id uuid, completed_count integer, target_count integer, correct_count integer, answer_count integer, earned_score integer, progress_percent integer)
language plpgsql stable security definer set search_path = '' as $$
declare item public.assignments; metric jsonb; current_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  for item in select * from public.assignments a where auth.uid() = a.teacher_id or (auth.uid() = a.student_id and a.status <> 'draft')
  loop
    if item.metric_key = 'manual' then
      current_count := case when item.status in ('submitted','completed') then 1 else 0 end;
      metric := jsonb_build_object('count', current_count, 'correct', 0, 'total', 0, 'score', 0);
    else
      metric := public.student_metric(item.student_id, item.metric_key);
      current_count := greatest(0, coalesce((metric->>'count')::integer, 0) - item.progress_baseline);
    end if;
    assignment_id := item.id;
    completed_count := least(item.target_count, current_count);
    target_count := item.target_count;
    correct_count := greatest(0, coalesce((metric->>'correct')::integer, 0) - item.correct_baseline);
    answer_count := greatest(0, coalesce((metric->>'total')::integer, 0) - item.answer_baseline);
    earned_score := greatest(0, coalesce((metric->>'score')::integer, 0) - item.score_baseline);
    progress_percent := least(100, floor(completed_count::numeric * 100 / item.target_count)::integer);
    return next;
  end loop;
end;
$$;

create or replace function public.refresh_my_assignment_progress()
returns integer language plpgsql security definer set search_path = '' as $$
declare item public.assignments; metric jsonb; completed integer; changed integer := 0; next_attempt integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  for item in select * from public.assignments a
    where a.metric_key <> 'manual' and a.status in ('assigned','revision_requested','overdue')
      and auth.uid() in (a.teacher_id, a.student_id)
  loop
    metric := public.student_metric(item.student_id, item.metric_key);
    completed := greatest(0, coalesce((metric->>'count')::integer, 0) - item.progress_baseline);
    if completed >= item.target_count then
      update public.assignments set status = 'submitted', updated_at = clock_timestamp()
      where id = item.id and status in ('assigned','revision_requested','overdue');
      if found then
        select coalesce(max(attempt), 0) + 1 into next_attempt from public.assignment_submissions where assignment_id = item.id;
        insert into public.assignment_submissions(assignment_id, student_id, attempt, text_answer, answers)
        values(item.id, item.student_id, next_attempt, 'Учебная цель выполнена на сайте.',
          jsonb_build_object('automatic', true, 'completed', completed, 'target', item.target_count));
        insert into public.notifications(user_id, kind, title, body, entity_type, entity_id)
        values(item.teacher_id, 'submission', 'Учебная цель выполнена', item.title, 'assignment', item.id);
        changed := changed + 1;
      end if;
    end if;
  end loop;
  return changed;
end;
$$;

revoke all on function public.progress_fragment(uuid, text), public.student_metric(uuid, text) from public, anon, authenticated;
revoke all on function public.create_assignment(uuid, text, text, text, timestamptz, numeric, text, text, text, text, text, integer) from public, anon;
revoke all on function public.get_visible_assignment_progress() from public, anon;
revoke all on function public.refresh_my_assignment_progress() from public, anon;
grant execute on function public.create_assignment(uuid, text, text, text, timestamptz, numeric, text, text, text, text, text, integer) to authenticated;
grant execute on function public.get_visible_assignment_progress() to authenticated;
grant execute on function public.refresh_my_assignment_progress() to authenticated;
