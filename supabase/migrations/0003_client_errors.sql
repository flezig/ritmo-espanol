-- Authenticated client error journal. Run after 0002_safe_sync.sql.
create table if not exists public.client_errors (
  id bigint generated always as identity primary key,
  event_id uuid not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('javascript', 'promise', 'sync', 'audio')),
  message text not null check (length(message) <= 1200),
  stack text check (length(stack) <= 6000),
  page text not null check (length(page) <= 500),
  user_agent text not null check (length(user_agent) <= 500),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists client_errors_created_at_idx
  on public.client_errors(created_at desc);
create index if not exists client_errors_kind_idx
  on public.client_errors(kind, created_at desc);

alter table public.client_errors enable row level security;

drop policy if exists "Users insert their own client errors" on public.client_errors;
create policy "Users insert their own client errors"
  on public.client_errors for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update their own client errors" on public.client_errors;
create policy "Users update their own client errors"
  on public.client_errors for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users read their own client errors" on public.client_errors;
create policy "Users read their own client errors"
  on public.client_errors for select to authenticated
  using (auth.uid() = user_id);

revoke all on public.client_errors from public, anon;
grant select, insert, update on public.client_errors to authenticated;
grant usage, select on sequence public.client_errors_id_seq to authenticated;
