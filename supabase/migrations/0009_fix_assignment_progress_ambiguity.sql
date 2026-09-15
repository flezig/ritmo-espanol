-- Fix PostgreSQL ambiguity between the RETURNS TABLE variable and the table column.
-- Run after 0008_assignment_attempts.sql.

create or replace function public.get_visible_assignment_progress()
returns table(assignment_id uuid, completed_count integer, target_count integer, correct_count integer, answer_count integer, earned_score integer, progress_percent integer)
language plpgsql stable security definer set search_path = '' as $$
declare item public.assignments; metric jsonb; current_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  for item in
    select a.* from public.assignments a
    where auth.uid() = a.teacher_id or (auth.uid() = a.student_id and a.status <> 'draft')
  loop
    if item.tracking_version >= 2 and item.metric_key <> 'manual' then
      select
        count(*) filter(where e.event_kind='session_complete'),
        count(*) filter(where e.event_kind='answer' and e.is_correct),
        count(*) filter(where e.event_kind='answer'),
        coalesce(sum(e.score_delta) filter(where e.event_kind='answer'),0)
      into current_count, correct_count, answer_count, earned_score
      from public.assignment_activity_events e
      where e.assignment_id=item.id and e.attempt_no=item.current_attempt;
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
    assignment_id := item.id;
    completed_count := least(item.target_count, current_count);
    target_count := item.target_count;
    progress_percent := least(100, floor(completed_count::numeric * 100 / item.target_count)::integer);
    return next;
  end loop;
end;
$$;

revoke all on function public.get_visible_assignment_progress() from public, anon;
grant execute on function public.get_visible_assignment_progress() to authenticated;
