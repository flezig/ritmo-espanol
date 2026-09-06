-- Run after 0001_user_progress.sql. All timestamps and revisions are server-owned.
alter table public.user_progress add column if not exists revision bigint not null default 0;
alter table public.content_reports add column if not exists event_id uuid;
alter table public.content_reports add column if not exists reported_at timestamptz not null default now();

create or replace function public.save_my_progress(p_data jsonb, p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  saved_row public.user_progress;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_data) <> 'object' or p_data is null then raise exception 'Invalid progress'; end if;
  if exists (select 1 from jsonb_each(p_data) e where jsonb_typeof(e.value) <> 'string') then
    raise exception 'Progress values must be serialized JSON strings';
  end if;
  insert into public.user_progress(user_id) values(auth.uid()) on conflict do nothing;
  select * into saved_row from public.user_progress where user_id = auth.uid() for update;
  if p_expected_revision is distinct from saved_row.revision then
    return jsonb_build_object('saved', false, 'progress', to_jsonb(saved_row) - 'user_id');
  end if;
  update public.user_progress set data = p_data, revision = revision + 1, updated_at = clock_timestamp()
    where user_id = auth.uid() returning * into saved_row;
  return jsonb_build_object('saved', true, 'progress', to_jsonb(saved_row) - 'user_id');
end;
$$;

create or replace function public.report_content(
  p_report_key text, p_kind text, p_section text, p_content jsonb,
  p_active boolean, p_event_id uuid, p_reported_at timestamptz
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_kind not in ('example', 'exercise') or length(p_report_key) > 4000
    or length(p_section) > 500 or jsonb_typeof(p_content) <> 'object'
    or octet_length(p_content::text) > 100000 or p_event_id is null then
    raise exception 'Invalid report';
  end if;
  insert into public.content_reports(user_id, report_key, kind, section, content, status, event_id, reported_at)
    values(auth.uid(), p_kind || ':' || p_report_key, p_kind, p_section, p_content,
      case when p_active then 'pending' else 'withdrawn' end, p_event_id, least(p_reported_at, now()))
  on conflict(user_id, report_key) do update set
    section = excluded.section,
    content = excluded.content,
    status = case
      when not p_active then 'withdrawn'
      when public.content_reports.status = 'resolved' and public.content_reports.content = excluded.content then 'resolved'
      else 'pending' end,
    event_id = excluded.event_id,
    reported_at = excluded.reported_at,
    updated_at = clock_timestamp()
  where public.content_reports.event_id is distinct from excluded.event_id
    and public.content_reports.reported_at <= excluded.reported_at;
end;
$$;

revoke all on function public.save_my_progress(jsonb, bigint) from public, anon;
revoke all on function public.report_content(text, text, text, jsonb, boolean, uuid, timestamptz) from public, anon;
grant execute on function public.save_my_progress(jsonb, bigint) to authenticated;
grant execute on function public.report_content(text, text, text, jsonb, boolean, uuid, timestamptz) to authenticated;
grant select, insert, update on public.user_progress, public.content_reports to authenticated;
grant usage, select on sequence public.content_reports_id_seq to authenticated;
