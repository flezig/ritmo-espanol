-- Exact answer history for teacher-visible assignments. Run after 0006_assignment_progress.sql.

create table if not exists public.assignment_activity_events (
  id bigint generated always as identity primary key,
  event_id uuid not null unique,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null check (activity_type in ('lesson','practice','dictation','music')),
  content_id text not null default '',
  prompt text not null check (length(prompt) between 1 and 5000),
  student_answer text not null default '' check (length(student_answer) <= 5000),
  correct_answer text not null default '' check (length(correct_answer) <= 5000),
  is_correct boolean not null,
  score_delta integer not null default 0,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists assignment_activity_assignment_idx on public.assignment_activity_events(assignment_id, occurred_at desc);
create index if not exists assignment_activity_errors_idx on public.assignment_activity_events(assignment_id, is_correct, occurred_at desc);
alter table public.assignment_activity_events enable row level security;
create policy "Assignment parties read activity" on public.assignment_activity_events for select to authenticated
using (public.can_access_assignment(assignment_id, auth.uid()));

create or replace function public.record_assignment_activity(
  p_event_id uuid, p_assignment uuid, p_activity_type text, p_content_id text,
  p_prompt text, p_student_answer text, p_correct_answer text, p_is_correct boolean,
  p_score_delta integer default 0, p_metadata jsonb default '{}'::jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare item public.assignments;
begin
  select * into item from public.assignments where id = p_assignment;
  if item.id is null or item.student_id <> auth.uid() or item.status in ('draft','completed','cancelled') then raise exception 'Assignment unavailable'; end if;
  if p_activity_type not in ('lesson','practice','dictation','music') or item.assignment_type <> p_activity_type then raise exception 'Activity does not match assignment'; end if;
  if item.content_id is not null and item.content_id <> 'all' and item.content_id <> p_content_id then raise exception 'Content does not match assignment'; end if;
  if p_event_id is null or length(trim(p_prompt)) = 0 or length(p_prompt) > 5000
    or length(coalesce(p_student_answer,'')) > 5000 or length(coalesce(p_correct_answer,'')) > 5000
    or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object' then raise exception 'Invalid activity'; end if;
  insert into public.assignment_activity_events(event_id, assignment_id, student_id, activity_type, content_id,
    prompt, student_answer, correct_answer, is_correct, score_delta, metadata)
  values(p_event_id, item.id, auth.uid(), p_activity_type, coalesce(p_content_id,''), trim(p_prompt),
    coalesce(p_student_answer,''), coalesce(p_correct_answer,''), p_is_correct, greatest(0,p_score_delta), coalesce(p_metadata,'{}'::jsonb))
  on conflict(event_id) do nothing;
end;
$$;

revoke all on public.assignment_activity_events from public, anon;
grant select on public.assignment_activity_events to authenticated;
revoke all on function public.record_assignment_activity(uuid, uuid, text, text, text, text, text, boolean, integer, jsonb) from public, anon;
grant execute on function public.record_assignment_activity(uuid, uuid, text, text, text, text, text, boolean, integer, jsonb) to authenticated;

