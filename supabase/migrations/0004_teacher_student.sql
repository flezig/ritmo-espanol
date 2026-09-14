-- Teacher/student workspace. Run after 0003_client_errors.sql.
-- All privileged mutations derive the acting user from auth.uid().

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  preferred_role text not null default 'student' check (preferred_role in ('student', 'teacher')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists user_profiles_email_lower_idx on public.user_profiles(lower(email));

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'teacher')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.teacher_student_invitations (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (teacher_id, student_id),
  check (teacher_id <> student_id)
);

create table if not exists public.teacher_student_relationships (
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  invitation_id uuid references public.teacher_student_invitations(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (teacher_id, student_id),
  check (teacher_id <> student_id)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 200),
  description text not null default '' check (length(description) <= 10000),
  assignment_type text not null default 'manual' check (assignment_type in ('manual', 'lesson', 'practice', 'dictation', 'music', 'mixed')),
  status text not null default 'assigned' check (status in ('draft', 'assigned', 'submitted', 'revision_requested', 'completed', 'overdue', 'cancelled')),
  due_at timestamptz,
  max_score numeric(8,2) check (max_score is null or max_score > 0),
  material_url text check (material_url is null or length(material_url) <= 2000),
  content_type text,
  content_id text,
  content_title_snapshot text check (content_title_snapshot is null or length(content_title_snapshot) <= 500),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  assigned_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((content_id is null and content_type is null) or (content_id is not null and content_type is not null))
);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  attempt integer not null default 1 check (attempt > 0),
  text_answer text not null default '' check (length(text_answer) <= 30000),
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) in ('array', 'object')),
  link_url text check (link_url is null or length(link_url) <= 2000),
  attachment_paths jsonb not null default '[]'::jsonb check (jsonb_typeof(attachment_paths) = 'array'),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (assignment_id, attempt)
);

create table if not exists public.assignment_reviews (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  submission_id uuid not null references public.assignment_submissions(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  decision text not null check (decision in ('completed', 'revision_requested')),
  score numeric(8,2),
  comment text not null default '' check (length(comment) <= 10000),
  created_at timestamptz not null default now(),
  check (score is null or score >= 0)
);

create table if not exists public.assignment_comments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('invitation', 'assignment', 'submission', 'review', 'comment', 'deadline', 'system')),
  title text not null check (length(title) between 1 and 300),
  body text not null default '' check (length(body) <= 2000),
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invitations_student_status_idx on public.teacher_student_invitations(student_id, status, created_at desc);
create index if not exists relationships_student_idx on public.teacher_student_relationships(student_id, teacher_id);
create index if not exists assignments_teacher_idx on public.assignments(teacher_id, status, due_at);
create index if not exists assignments_student_idx on public.assignments(student_id, status, due_at);
create index if not exists submissions_assignment_idx on public.assignment_submissions(assignment_id, attempt desc);
create index if not exists reviews_assignment_idx on public.assignment_reviews(assignment_id, created_at desc);
create index if not exists comments_assignment_idx on public.assignment_comments(assignment_id, created_at);
create index if not exists notifications_user_idx on public.notifications(user_id, read_at, created_at desc);
create unique index if not exists notifications_deadline_once_idx on public.notifications(user_id, kind, entity_type, entity_id) where kind = 'deadline';

create or replace function public.has_role(p_user uuid, p_role text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_roles where user_id = p_user and role = p_role)
$$;
create or replace function public.teacher_has_student(p_teacher uuid, p_student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.teacher_student_relationships where teacher_id = p_teacher and student_id = p_student)
$$;
create or replace function public.can_access_assignment(p_assignment uuid, p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.assignments where id = p_assignment
    and (p_user = teacher_id or (p_user = student_id and status <> 'draft')))
$$;

create or replace function public.sync_user_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_profiles(user_id, email, display_name)
  values(new.id, lower(coalesce(new.email, '')), coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict(user_id) do update set email = excluded.email,
    display_name = case when excluded.display_name <> '' then excluded.display_name else public.user_profiles.display_name end,
    updated_at = clock_timestamp();
  insert into public.user_roles(user_id, role) values(new.id, 'student') on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_profile on auth.users;
create trigger on_auth_user_profile after insert or update on auth.users
for each row execute procedure public.sync_user_profile();

-- Backfill accounts created before this migration.
insert into public.user_profiles(user_id, email, display_name)
select id, lower(coalesce(email, '')), coalesce(raw_user_meta_data->>'name', '') from auth.users
on conflict(user_id) do nothing;
insert into public.user_roles(user_id, role)
select id, 'student' from auth.users on conflict do nothing;

alter table public.user_profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.teacher_student_invitations enable row level security;
alter table public.teacher_student_relationships enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.assignment_reviews enable row level security;
alter table public.assignment_comments enable row level security;
alter table public.notifications enable row level security;

create policy "Profiles visible to self or linked users" on public.user_profiles for select to authenticated using (
  auth.uid() = user_id or public.teacher_has_student(auth.uid(), user_id) or public.teacher_has_student(user_id, auth.uid()) or
  exists(select 1 from public.teacher_student_invitations i where i.teacher_id = auth.uid() and i.student_id = user_id and i.status in ('pending','accepted')) or
  exists(select 1 from public.teacher_student_invitations i where i.student_id = auth.uid() and i.teacher_id = user_id and i.status in ('pending','accepted'))
);
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "Invitation parties read" on public.teacher_student_invitations for select to authenticated using (auth.uid() in (teacher_id, student_id));
create policy "Relationship parties read" on public.teacher_student_relationships for select to authenticated using (auth.uid() in (teacher_id, student_id));
create policy "Assignment parties read" on public.assignments for select to authenticated using (auth.uid() = teacher_id or (auth.uid() = student_id and status <> 'draft'));
create policy "Submission parties read" on public.assignment_submissions for select to authenticated using (public.can_access_assignment(assignment_id, auth.uid()));
create policy "Review parties read" on public.assignment_reviews for select to authenticated using (public.can_access_assignment(assignment_id, auth.uid()));
create policy "Comment parties read" on public.assignment_comments for select to authenticated using (public.can_access_assignment(assignment_id, auth.uid()));
create policy "Users read own notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.enable_my_role(p_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or p_role not in ('student', 'teacher') then raise exception 'Invalid role'; end if;
  insert into public.user_roles(user_id, role) values(auth.uid(), p_role) on conflict do nothing;
  update public.user_profiles set preferred_role = p_role, updated_at = clock_timestamp() where user_id = auth.uid();
end;
$$;

create or replace function public.invite_student_by_email(p_email text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare target_id uuid; invitation_id uuid; teacher_name text;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'teacher') then raise exception 'Teacher role required'; end if;
  select user_id into target_id from public.user_profiles where lower(email) = lower(trim(p_email));
  if target_id is null then raise exception 'Registered user not found'; end if;
  if target_id = auth.uid() then raise exception 'Cannot invite yourself'; end if;
  select display_name into teacher_name from public.user_profiles where user_id = auth.uid();
  insert into public.teacher_student_invitations(teacher_id, student_id, status)
  values(auth.uid(), target_id, 'pending')
  on conflict(teacher_id, student_id) do update set status = 'pending', responded_at = null, updated_at = clock_timestamp()
  returning id into invitation_id;
  insert into public.notifications(user_id, kind, title, body, entity_type, entity_id)
  values(target_id, 'invitation', 'Новое приглашение', coalesce(nullif(teacher_name, ''), 'Учитель') || ' приглашает вас присоединиться.', 'invitation', invitation_id);
  return invitation_id;
end;
$$;

create or replace function public.respond_to_teacher_invitation(p_invitation uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare row_data public.teacher_student_invitations;
begin
  select * into row_data from public.teacher_student_invitations where id = p_invitation for update;
  if row_data.id is null or row_data.student_id <> auth.uid() or row_data.status <> 'pending' then raise exception 'Invitation unavailable'; end if;
  update public.teacher_student_invitations set status = case when p_accept then 'accepted' else 'declined' end,
    responded_at = clock_timestamp(), updated_at = clock_timestamp() where id = p_invitation;
  if p_accept then
    insert into public.teacher_student_relationships(teacher_id, student_id, invitation_id)
    values(row_data.teacher_id, row_data.student_id, row_data.id) on conflict do nothing;
  end if;
  insert into public.notifications(user_id, kind, title, body, entity_type, entity_id)
  values(row_data.teacher_id, 'invitation', case when p_accept then 'Приглашение принято' else 'Приглашение отклонено' end,
    '', 'invitation', row_data.id);
end;
$$;

create or replace function public.create_assignment(
  p_student uuid, p_title text, p_description text default '', p_type text default 'manual',
  p_due_at timestamptz default null, p_max_score numeric default null, p_material_url text default null,
  p_content_type text default null, p_content_id text default null, p_content_title_snapshot text default null,
  p_status text default 'assigned'
) returns uuid language plpgsql security definer set search_path = '' as $$
declare assignment_id uuid;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'teacher') or not public.teacher_has_student(auth.uid(), p_student) then raise exception 'Student unavailable'; end if;
  if p_status not in ('draft', 'assigned') or p_type not in ('manual', 'lesson', 'practice', 'dictation', 'music', 'mixed') then raise exception 'Invalid assignment'; end if;
  insert into public.assignments(teacher_id, student_id, title, description, assignment_type, status, due_at, max_score, material_url,
    content_type, content_id, content_title_snapshot, assigned_at)
  values(auth.uid(), p_student, trim(p_title), coalesce(p_description, ''), p_type, p_status, p_due_at, p_max_score, p_material_url,
    p_content_type, p_content_id, p_content_title_snapshot, case when p_status = 'assigned' then clock_timestamp() end)
  returning id into assignment_id;
  if p_status = 'assigned' then
    insert into public.notifications(user_id, kind, title, body, entity_type, entity_id)
    values(p_student, 'assignment', 'Новое задание', trim(p_title), 'assignment', assignment_id);
  end if;
  return assignment_id;
end;
$$;

create or replace function public.submit_assignment(p_assignment uuid, p_text text default '', p_answers jsonb default '[]'::jsonb, p_link text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare row_data public.assignments; submission_id uuid; next_attempt integer;
begin
  select * into row_data from public.assignments where id = p_assignment for update;
  if row_data.id is null or row_data.student_id <> auth.uid() or row_data.status not in ('assigned', 'revision_requested', 'overdue') then raise exception 'Assignment unavailable'; end if;
  if coalesce(length(trim(p_text)), 0) = 0 and p_link is null and coalesce(p_answers, '[]'::jsonb) = '[]'::jsonb then raise exception 'Answer required'; end if;
  select coalesce(max(attempt), 0) + 1 into next_attempt from public.assignment_submissions where assignment_id = p_assignment;
  insert into public.assignment_submissions(assignment_id, student_id, attempt, text_answer, answers, link_url)
  values(p_assignment, auth.uid(), next_attempt, coalesce(p_text, ''), coalesce(p_answers, '[]'::jsonb), p_link) returning id into submission_id;
  update public.assignments set status = 'submitted', updated_at = clock_timestamp() where id = p_assignment;
  insert into public.notifications(user_id, kind, title, body, entity_type, entity_id)
  values(row_data.teacher_id, 'submission', 'Работа отправлена', row_data.title, 'assignment', p_assignment);
  return submission_id;
end;
$$;

create or replace function public.review_assignment(p_assignment uuid, p_decision text, p_score numeric default null, p_comment text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare row_data public.assignments; submission_id uuid; review_id uuid;
begin
  select * into row_data from public.assignments where id = p_assignment for update;
  if row_data.id is null or row_data.teacher_id <> auth.uid() or row_data.status <> 'submitted' then raise exception 'Assignment unavailable'; end if;
  if p_decision not in ('completed', 'revision_requested') then raise exception 'Invalid decision'; end if;
  if p_score is not null and (p_score < 0 or (row_data.max_score is not null and p_score > row_data.max_score)) then raise exception 'Invalid score'; end if;
  select id into submission_id from public.assignment_submissions where assignment_id = p_assignment order by attempt desc limit 1;
  insert into public.assignment_reviews(assignment_id, submission_id, teacher_id, decision, score, comment)
  values(p_assignment, submission_id, auth.uid(), p_decision, p_score, coalesce(p_comment, '')) returning id into review_id;
  update public.assignments set status = p_decision, completed_at = case when p_decision = 'completed' then clock_timestamp() else null end,
    updated_at = clock_timestamp() where id = p_assignment;
  insert into public.notifications(user_id, kind, title, body, entity_type, entity_id)
  values(row_data.student_id, 'review', case when p_decision = 'completed' then 'Задание проверено' else 'Нужна доработка' end,
    row_data.title, 'assignment', p_assignment);
  return review_id;
end;
$$;

create or replace function public.add_assignment_comment(p_assignment uuid, p_body text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare row_data public.assignments; comment_id uuid; recipient uuid;
begin
  select * into row_data from public.assignments where id = p_assignment;
  if row_data.id is null or auth.uid() not in (row_data.teacher_id, row_data.student_id) then raise exception 'Assignment unavailable'; end if;
  insert into public.assignment_comments(assignment_id, author_id, body) values(p_assignment, auth.uid(), trim(p_body)) returning id into comment_id;
  recipient := case when auth.uid() = row_data.teacher_id then row_data.student_id else row_data.teacher_id end;
  insert into public.notifications(user_id, kind, title, body, entity_type, entity_id)
  values(recipient, 'comment', 'Новый комментарий', left(trim(p_body), 300), 'assignment', p_assignment);
  return comment_id;
end;
$$;

create or replace function public.mark_notification_read(p_notification uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.notifications set read_at = coalesce(read_at, clock_timestamp()) where id = p_notification and user_id = auth.uid();
end;
$$;

create or replace function public.refresh_my_assignment_deadlines()
returns integer language plpgsql security definer set search_path = '' as $$
declare changed integer := 0; item record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  for item in
    update public.assignments set status = 'overdue', updated_at = clock_timestamp()
    where due_at < clock_timestamp() and status in ('assigned', 'revision_requested')
      and auth.uid() in (teacher_id, student_id)
    returning id, student_id, title
  loop
    changed := changed + 1;
    insert into public.notifications(user_id, kind, title, body, entity_type, entity_id)
    values(item.student_id, 'deadline', 'Срок задания истёк', item.title, 'assignment', item.id)
    on conflict(user_id, kind, entity_type, entity_id) where kind = 'deadline' do nothing;
  end loop;
  return changed;
end;
$$;

create or replace function public.get_student_learning_summary(p_student uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare stored jsonb; profile_data jsonb := '{}'::jsonb; lesson_data jsonb := '{}'::jsonb; completed_lessons integer := 0;
begin
  if auth.uid() is null or not public.teacher_has_student(auth.uid(), p_student) then raise exception 'Student unavailable'; end if;
  select data into stored from public.user_progress where user_id = p_student;
  begin profile_data := coalesce((stored->>'ritmo-device-profile')::jsonb, '{}'::jsonb); exception when others then profile_data := '{}'::jsonb; end;
  begin lesson_data := coalesce((stored->>'ritmo-lesson-progress')::jsonb, '{}'::jsonb); exception when others then lesson_data := '{}'::jsonb; end;
  select count(*) into completed_lessons from jsonb_each(lesson_data) item where coalesce((item.value->>'completed')::boolean, false);
  return jsonb_build_object(
    'level', coalesce(profile_data->>'level', 'A1'), 'xp', coalesce((profile_data->>'xp')::integer, 0),
    'streak', coalesce((profile_data->>'streak')::integer, 0), 'activeDays', case when jsonb_typeof(profile_data->'activeDays') = 'array' then jsonb_array_length(profile_data->'activeDays') else 0 end,
    'totalReviews', coalesce((profile_data->>'totalReviews')::integer, 0), 'totalCorrect', coalesce((profile_data->>'totalCorrect')::integer, 0),
    'completedLessons', completed_lessons
  );
exception when invalid_text_representation or numeric_value_out_of_range then
  return jsonb_build_object('level','A1','xp',0,'streak',0,'activeDays',0,'totalReviews',0,'totalCorrect',0,'completedLessons',0);
end;
$$;

revoke all on all tables in schema public from anon;
revoke all on function public.has_role(uuid, text), public.teacher_has_student(uuid, uuid), public.can_access_assignment(uuid, uuid) from public, anon;
revoke all on function public.enable_my_role(text), public.invite_student_by_email(text), public.respond_to_teacher_invitation(uuid, boolean) from public, anon;
revoke all on function public.create_assignment(uuid, text, text, text, timestamptz, numeric, text, text, text, text, text) from public, anon;
revoke all on function public.submit_assignment(uuid, text, jsonb, text), public.review_assignment(uuid, text, numeric, text), public.add_assignment_comment(uuid, text), public.mark_notification_read(uuid) from public, anon;
revoke all on function public.refresh_my_assignment_deadlines() from public, anon;
revoke all on function public.get_student_learning_summary(uuid) from public, anon;
grant select on public.user_profiles, public.user_roles, public.teacher_student_invitations, public.teacher_student_relationships,
  public.assignments, public.assignment_submissions, public.assignment_reviews, public.assignment_comments, public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
grant execute on function public.has_role(uuid, text), public.teacher_has_student(uuid, uuid), public.can_access_assignment(uuid, uuid) to authenticated;
grant execute on function public.enable_my_role(text), public.invite_student_by_email(text), public.respond_to_teacher_invitation(uuid, boolean) to authenticated;
grant execute on function public.create_assignment(uuid, text, text, text, timestamptz, numeric, text, text, text, text, text) to authenticated;
grant execute on function public.submit_assignment(uuid, text, jsonb, text), public.review_assignment(uuid, text, numeric, text), public.add_assignment_comment(uuid, text), public.mark_notification_read(uuid) to authenticated;
grant execute on function public.refresh_my_assignment_deadlines() to authenticated;
grant execute on function public.get_student_learning_summary(uuid) to authenticated;
