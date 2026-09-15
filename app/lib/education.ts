import type { SupabaseClient } from '@supabase/supabase-js';

export type Role = 'student' | 'teacher';
export type AssignmentStatus = 'draft' | 'assigned' | 'submitted' | 'revision_requested' | 'completed' | 'overdue' | 'cancelled';
export type Profile = { user_id: string; email: string; display_name: string; preferred_role: Role };
export type Invitation = { id: string; teacher_id: string; student_id: string; status: 'pending' | 'accepted' | 'declined' | 'cancelled'; created_at: string; responded_at: string | null };
export type Assignment = {
  id: string; teacher_id: string; student_id: string; title: string; description: string;
  assignment_type: 'manual' | 'lesson' | 'practice' | 'dictation' | 'music' | 'mixed';
  status: AssignmentStatus; due_at: string | null; max_score: number | null; material_url: string | null;
  content_type: string | null; content_id: string | null; content_title_snapshot: string | null;
  topic_id: string | null; topic_title_snapshot: string | null;
  target_count: number; metric_key: string;
  current_attempt: number; tracking_version: number;
  assigned_at: string | null; completed_at: string | null; created_at: string; updated_at: string;
};
export type Submission = { id: string; assignment_id: string; student_id: string; attempt: number; text_answer: string; answers: unknown; link_url: string | null; submitted_at: string };
export type Review = { id: string; assignment_id: string; submission_id: string; teacher_id: string; decision: 'completed' | 'revision_requested'; score: number | null; comment: string; created_at: string };
export type AssignmentComment = { id: string; assignment_id: string; author_id: string; body: string; created_at: string };
export type ExerciseQuestion = { id: string; assignment_id: string; teacher_id: string; student_id: string; context_type: string; content_id: string; topic_id: string | null; item_key: string; prompt: string; status: 'open' | 'answered' | 'closed'; created_at: string };
export type ExerciseQuestionMessage = { id: number; question_id: string; author_id: string; body: string; created_at: string };
export type AppNotification = { id: string; kind: string; title: string; body: string; entity_type: string | null; entity_id: string | null; read_at: string | null; created_at: string };
export type AssignmentProgress = { assignment_id: string; completed_count: number; target_count: number; correct_count: number; answer_count: number; earned_score: number; progress_percent: number };
export type AssignmentActivity = {
  id: number; event_id: string; assignment_id: string; student_id: string;
  activity_type: 'lesson' | 'practice' | 'dictation' | 'music'; content_id: string;
  prompt: string; student_answer: string; correct_answer: string; is_correct: boolean;
  score_delta: number; occurred_at: string;
  session_id: string | null; attempt_no: number; event_kind: 'answer' | 'session_complete';
  item_key: string;
};
export type StudentLearningSummary = { level: string; xp: number; streak: number; activeDays: number; totalReviews: number; totalCorrect: number; completedLessons: number };

const unwrap = <T>(data: T | null, error: { message: string } | null): T => {
  if (error) throw new Error(error.message);
  return data as T;
};

export async function loadMyRoles(client: SupabaseClient) {
  const { data, error } = await client.from('user_roles').select('role');
  return unwrap<Array<{ role: Role }>>(data, error).map((item) => item.role);
}

export async function loadProfiles(client: SupabaseClient, ids: string[]) {
  if (!ids.length) return new Map<string, Profile>();
  const { data, error } = await client.from('user_profiles').select('user_id,email,display_name,preferred_role').in('user_id', [...new Set(ids)]);
  return new Map(unwrap<Profile[]>(data, error).map((profile) => [profile.user_id, profile]));
}

export async function loadTeacherWorkspace(client: SupabaseClient) {
  await client.rpc('refresh_my_assignment_deadlines');
  await client.rpc('refresh_my_assignment_progress');
  const [relationships, invitations, assignments, notifications, progress] = await Promise.all([
    client.from('teacher_student_relationships').select('*').order('created_at', { ascending: false }),
    client.from('teacher_student_invitations').select('*').order('created_at', { ascending: false }),
    client.from('assignments').select('*').order('created_at', { ascending: false }),
    client.from('notifications').select('*').order('created_at', { ascending: false }).limit(30),
    client.rpc('get_visible_assignment_progress'),
  ]);
  const relationRows = unwrap<{ teacher_id: string; student_id: string; created_at: string }[]>(relationships.data, relationships.error);
  const inviteRows = unwrap<Invitation[]>(invitations.data, invitations.error);
  const profiles = await loadProfiles(client, [...relationRows.map((r) => r.student_id), ...inviteRows.map((r) => r.student_id)]);
  return {
    relationships: relationRows,
    invitations: inviteRows,
    assignments: unwrap<Assignment[]>(assignments.data, assignments.error),
    notifications: unwrap<AppNotification[]>(notifications.data, notifications.error),
    progress: new Map(unwrap<AssignmentProgress[]>(progress.data, progress.error).map((item) => [item.assignment_id, item])),
    profiles,
  };
}

export async function loadStudentWorkspace(client: SupabaseClient) {
  await client.rpc('refresh_my_assignment_deadlines');
  await client.rpc('refresh_my_assignment_progress');
  const [invitations, relationships, assignments, notifications, progress] = await Promise.all([
    client.from('teacher_student_invitations').select('*').order('created_at', { ascending: false }),
    client.from('teacher_student_relationships').select('*').order('created_at', { ascending: false }),
    client.rpc('get_my_student_assignments'),
    client.from('notifications').select('*').order('created_at', { ascending: false }).limit(30),
    client.rpc('get_visible_assignment_progress'),
  ]);
  const inviteRows = unwrap<Invitation[]>(invitations.data, invitations.error);
  const relationRows = unwrap<{ teacher_id: string; student_id: string; created_at: string }[]>(relationships.data, relationships.error);
  const profiles = await loadProfiles(client, [...inviteRows.map((r) => r.teacher_id), ...relationRows.map((r) => r.teacher_id)]);
  return {
    invitations: inviteRows, relationships: relationRows,
    assignments: unwrap<Assignment[]>(assignments.data, assignments.error),
    notifications: unwrap<AppNotification[]>(notifications.data, notifications.error), profiles,
    progress: new Map(unwrap<AssignmentProgress[]>(progress.data, progress.error).map((item) => [item.assignment_id, item])),
  };
}

export async function loadAssignmentDetail(client: SupabaseClient, id: string) {
  await client.rpc('refresh_my_assignment_progress');
  const [assignment, submissions, reviews, comments, progress, activity] = await Promise.all([
    client.from('assignments').select('*').eq('id', id).single(),
    client.from('assignment_submissions').select('*').eq('assignment_id', id).order('attempt', { ascending: false }),
    client.from('assignment_reviews').select('*').eq('assignment_id', id).order('created_at', { ascending: false }),
    client.from('assignment_comments').select('*').eq('assignment_id', id).order('created_at'),
    client.rpc('get_visible_assignment_progress'),
    loadAllAssignmentActivity(client, id),
  ]);
  const questionResult = await client.from('exercise_questions').select('*').eq('assignment_id', id).order('created_at', { ascending: false });
  const questions = unwrap<ExerciseQuestion[]>(questionResult.data, questionResult.error);
  const messageResult = questions.length ? await client.from('exercise_question_messages').select('*').in('question_id', questions.map((item) => item.id)).order('created_at') : { data: [], error: null };
  return {
    assignment: unwrap<Assignment>(assignment.data, assignment.error),
    submissions: unwrap<Submission[]>(submissions.data, submissions.error),
    reviews: unwrap<Review[]>(reviews.data, reviews.error),
    comments: unwrap<AssignmentComment[]>(comments.data, comments.error),
    progress: unwrap<AssignmentProgress[]>(progress.data, progress.error).find((item) => item.assignment_id === id) || null,
    activity,
    questions,
    questionMessages: unwrap<ExerciseQuestionMessage[]>(messageResult.data as ExerciseQuestionMessage[], messageResult.error),
  };
}
export async function replyToExerciseQuestion(client: SupabaseClient, questionId: string, body: string) {
  const { error } = await client.rpc('reply_to_exercise_question', { p_question: questionId, p_body: body });
  if (error) throw new Error(error.message);
}

async function loadAllAssignmentActivity(client: SupabaseClient, id: string) {
  const rows: AssignmentActivity[] = [];
  for (let from = 0; ; from += 500) {
    const result = await client.from('assignment_activity_events')
      .select('id,event_id,assignment_id,student_id,activity_type,content_id,prompt,student_answer,correct_answer,is_correct,score_delta,occurred_at,session_id,attempt_no,event_kind,item_key')
      .eq('assignment_id', id).order('occurred_at', { ascending: false }).range(from, from + 499);
    const page = unwrap<AssignmentActivity[]>(result.data, result.error);
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}

export async function inviteStudent(client: SupabaseClient, email: string) {
  const { data, error } = await client.rpc('invite_student_by_email', { p_email: email });
  return unwrap<string>(data, error);
}
export async function respondInvitation(client: SupabaseClient, id: string, accept: boolean) {
  const { error } = await client.rpc('respond_to_teacher_invitation', { p_invitation: id, p_accept: accept });
  if (error) throw new Error(error.message);
}
export async function createAssignment(client: SupabaseClient, input: {
  studentId: string; title: string; description: string; type: Assignment['assignment_type']; dueAt?: string;
  maxScore?: number; materialUrl?: string; contentType?: string; contentId?: string; contentTitle?: string;
  targetCount?: number; topicId?: string; topicTitle?: string;
}) {
  const { data, error } = await client.rpc('create_assignment', {
    p_student: input.studentId, p_title: input.title, p_description: input.description, p_type: input.type,
    p_due_at: input.dueAt || null, p_max_score: input.maxScore || null, p_material_url: input.materialUrl || null,
    p_content_type: input.contentType || null, p_content_id: input.contentId || null,
    p_content_title_snapshot: input.contentTitle || null, p_status: 'assigned',
    p_target_count: input.targetCount || 1,
    p_topic_id: input.topicId || null, p_topic_title_snapshot: input.topicTitle || null,
  });
  return unwrap<string>(data, error);
}
export async function submitAssignment(client: SupabaseClient, assignmentId: string, text: string, link?: string) {
  const { data, error } = await client.rpc('submit_assignment', { p_assignment: assignmentId, p_text: text, p_answers: [], p_link: link || null });
  return unwrap<string>(data, error);
}
export async function reviewAssignment(client: SupabaseClient, assignmentId: string, decision: Review['decision'], score: number | null, comment: string) {
  const { data, error } = await client.rpc('review_assignment', { p_assignment: assignmentId, p_decision: decision, p_score: score, p_comment: comment });
  return unwrap<string>(data, error);
}
export async function addAssignmentComment(client: SupabaseClient, assignmentId: string, body: string) {
  const { data, error } = await client.rpc('add_assignment_comment', { p_assignment: assignmentId, p_body: body });
  return unwrap<string>(data, error);
}
export async function markNotificationRead(client: SupabaseClient, id: string) {
  const { error } = await client.rpc('mark_notification_read', { p_notification: id });
  if (error) throw new Error(error.message);
}
export async function loadStudentLearningSummary(client: SupabaseClient, studentId: string) {
  const { data, error } = await client.rpc('get_student_learning_summary', { p_student: studentId });
  return unwrap<StudentLearningSummary>(data, error);
}
