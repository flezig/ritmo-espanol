import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const migrationPath = new URL('../supabase/migrations/0004_teacher_student.sql', import.meta.url);
const sql = readFileSync(migrationPath, 'utf8');
const roleLockSql = readFileSync(new URL('../supabase/migrations/0005_restrict_teacher_role.sql', import.meta.url), 'utf8');
const progressSql = readFileSync(new URL('../supabase/migrations/0006_assignment_progress.sql', import.meta.url), 'utf8');
const activitySql = readFileSync(new URL('../supabase/migrations/0007_assignment_activity.sql', import.meta.url), 'utf8');
const attemptsSql = readFileSync(new URL('../supabase/migrations/0008_assignment_attempts.sql', import.meta.url), 'utf8');
const assignmentTracking = readFileSync(new URL('../app/lib/assignment-tracking.ts', import.meta.url), 'utf8');

test('teacher/student migration contains the complete durable model', () => {
  for (const table of [
    'user_profiles', 'user_roles', 'teacher_student_invitations', 'teacher_student_relationships',
    'assignments', 'assignment_submissions', 'assignment_reviews', 'assignment_comments', 'notifications',
  ]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'), table);
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), `${table} RLS`);
  }
});

test('privileged flow uses auth.uid and RPC validation', () => {
  const revokes = sql.slice(sql.indexOf('revoke all on function'), sql.indexOf('grant select on public.user_profiles'));
  for (const fn of [
    'invite_student_by_email', 'respond_to_teacher_invitation', 'create_assignment',
    'submit_assignment', 'review_assignment', 'add_assignment_comment',
  ]) {
    const start = sql.indexOf(`function public.${fn}`);
    assert.notEqual(start, -1, fn);
    const body = sql.slice(start, sql.indexOf('$$;', start) + 3);
    assert.match(body, /auth\.uid\(\)/, `${fn} authenticates the actor`);
    assert.match(revokes, new RegExp(`public\\.${fn}\\(`, 'i'), `${fn} revokes public access`);
  }
  assert.match(sql, /not public\.teacher_has_student\(auth\.uid\(\), p_student\)/);
  assert.match(sql, /row_data\.student_id <> auth\.uid\(\)/);
  assert.match(sql, /row_data\.teacher_id <> auth\.uid\(\)/);
});

test('student drafts stay private and content references remain stable snapshots', () => {
  assert.match(sql, /auth\.uid\(\) = student_id and status <> 'draft'/);
  assert.match(sql, /content_id text/);
  assert.match(sql, /content_title_snapshot text/);
  assert.doesNotMatch(sql, /lesson_content|copied_lesson|lesson_body/);
});

test('all four requested application routes exist', () => {
  for (const route of [
    '../app/teacher/page.tsx', '../app/teacher/students/[studentId]/page.tsx',
    '../app/student/page.tsx', '../app/student/assignments/[assignmentId]/page.tsx',
  ]) assert.ok(existsSync(new URL(route, import.meta.url)), route);
});

test('assignment lifecycle is enforced in the database', () => {
  assert.match(sql, /status not in \('assigned', 'revision_requested', 'overdue'\)/);
  assert.match(sql, /row_data\.status <> 'submitted'/);
  assert.match(sql, /p_decision not in \('completed', 'revision_requested'\)/);
  assert.match(sql, /update public\.assignments set status = 'submitted'/);
  assert.match(sql, /update public\.assignments set status = p_decision/);
});

test('teacher role cannot be self-issued after the restriction migration', () => {
  assert.match(roleLockSql, /revoke execute on function public\.enable_my_role\(text\) from authenticated/i);
  assert.match(roleLockSql, /drop function if exists public\.enable_my_role\(text\)/i);
  assert.match(roleLockSql, /delete from public\.user_roles where role = 'teacher'/i);
});

test('assignment goals use a baseline and expose only linked progress', () => {
  assert.match(progressSql, /progress_baseline integer/);
  assert.match(progressSql, /target_count integer/);
  assert.match(progressSql, /function public\.get_visible_assignment_progress\(\)/);
  assert.match(progressSql, /auth\.uid\(\) = a\.teacher_id or \(auth\.uid\(\) = a\.student_id/);
  assert.match(progressSql, /practice:words:/);
  assert.match(progressSql, /practice:articles/);
  assert.match(progressSql, /practice:rush/);
  assert.match(progressSql, /practice:detective:/);
  assert.match(progressSql, /metric_key = 'manual'/);
});

test('exact assignment answers are private, idempotent and bound to the signed-in student', () => {
  assert.match(activitySql, /create table if not exists public\.assignment_activity_events/i);
  assert.match(activitySql, /alter table public\.assignment_activity_events enable row level security/i);
  assert.match(activitySql, /public\.can_access_assignment\(assignment_id, auth\.uid\(\)\)/i);
  assert.match(activitySql, /item\.student_id <> auth\.uid\(\)/i);
  assert.match(activitySql, /item\.assignment_type <> p_activity_type/i);
  assert.match(activitySql, /item\.content_id <> p_content_id/i);
  assert.match(activitySql, /on conflict\(event_id\) do nothing/i);
  assert.match(activitySql, /revoke all on public\.assignment_activity_events from public, anon/i);
  assert.match(activitySql, /grant select on public\.assignment_activity_events to authenticated/i);
  assert.doesNotMatch(activitySql, /grant insert on public\.assignment_activity_events/i);
});

test('new assignment progress is scoped to attempts and completed sessions', () => {
  assert.match(attemptsSql, /current_attempt=case when p_decision='revision_requested' then current_attempt\+1/i);
  assert.match(attemptsSql, /event_kind='session_complete'/i);
  assert.match(attemptsSql, /assignment_id=item\.id and attempt_no=item\.current_attempt/i);
  assert.match(attemptsSql, /Session answer count mismatch/i);
  assert.match(attemptsSql, /metric_key<>'manual'[\s\S]*raise exception 'Complete the assigned learning sessions'/i);
  assert.match(attemptsSql, /item_key text/i);
});

test('assignment activity queue is account-scoped, serialized and supports offline retry', () => {
  assert.match(assignmentTracking, /outboxKey = \(userId: string\)/);
  assert.match(assignmentTracking, /active\.userId !== userId/);
  assert.match(assignmentTracking, /flushPromise/);
  assert.match(assignmentTracking, /fetch\|network\|timeout/i);
  assert.match(assignmentTracking, /completeAssignedSession/);
});

test('deadlines have a server-side scheduled refresh when pg_cron is available', () => {
  assert.match(attemptsSql, /function public\.mark_overdue_assignments\(\)/i);
  assert.match(attemptsSql, /cron\.schedule/i);
  assert.match(attemptsSql, /revoke all on function public\.mark_overdue_assignments\(\) from public,anon,authenticated/i);
});
