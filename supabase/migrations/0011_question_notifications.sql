-- Allow notification kinds used by contextual teacher questions.
-- Run after 0010_assignment_context.sql.

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in (
    'invitation', 'assignment', 'submission', 'review', 'comment',
    'deadline', 'system', 'question', 'question_reply'
  ));
