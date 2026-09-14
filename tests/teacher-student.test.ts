import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const migrationPath = new URL('../supabase/migrations/0004_teacher_student.sql', import.meta.url);
const sql = readFileSync(migrationPath, 'utf8');

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
