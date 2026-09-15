import { getCloudClient } from './cloud-progress';

type ActivityType = 'lesson' | 'practice' | 'dictation' | 'music';
type ActiveAssignment = { id: string; userId: string; type: ActivityType; contentId: string; sessionId: string };
type QueuedActivity = { eventId: string; assignmentId: string; userId: string; sessionId: string; eventKind: 'answer' | 'session_complete'; activityType: ActivityType; contentId: string; itemKey: string; prompt: string; studentAnswer: string; correctAnswer: string; correct: boolean; score: number; metadata: Record<string, number> };
const ACTIVE_KEY = 'ritmo-active-assignment';
const outboxKey = (userId: string) => `ritmo-assignment-activity-outbox:${userId}`;
const uuid = () => crypto.randomUUID();
let flushPromise: Promise<void> | null = null;
let flushRequested = false;

export function activateAssignmentTracking(value: Omit<ActiveAssignment, 'sessionId'>) { localStorage.setItem(ACTIVE_KEY, JSON.stringify({ ...value, sessionId: uuid() })); }
export function prepareAssignmentTracking(userId: string | null) {
  localStorage.removeItem('ritmo-assignment-activity-outbox');
  const active = activeAssignment();
  if (userId && active && active.userId !== userId) localStorage.removeItem(ACTIVE_KEY);
}
export const hasPendingAssignmentActivity = (userId: string) => readOutbox(userId).length > 0;
export function clearAssignmentTracking(userId: string) {
  localStorage.removeItem(ACTIVE_KEY);
  localStorage.removeItem(outboxKey(userId));
}
const activeAssignment = (): ActiveAssignment | null => { try { return JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null'); } catch { return null; } };
const readOutbox = (userId: string): QueuedActivity[] => { try { const value = JSON.parse(localStorage.getItem(outboxKey(userId)) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
const saveOutbox = (userId: string, items: QueuedActivity[]) => localStorage.setItem(outboxKey(userId), JSON.stringify(items.slice(-1000)));
const matches = (active: ActiveAssignment | null, type: ActivityType, contentId: string) => !!active && active.type === type && (active.contentId === 'all' || active.contentId === contentId);

async function runFlush() {
  const client = getCloudClient(); if (!client) return;
  const { data: { user } } = await client.auth.getUser(); if (!user) return;
  for (const item of readOutbox(user.id)) {
    const { error } = await client.rpc('record_assignment_activity', {
      p_event_id: item.eventId, p_assignment: item.assignmentId, p_activity_type: item.activityType,
      p_content_id: item.contentId, p_prompt: item.prompt, p_student_answer: item.studentAnswer,
      p_correct_answer: item.correctAnswer, p_is_correct: item.correct, p_score_delta: item.score, p_metadata: item.metadata,
      p_session_id: item.sessionId, p_event_kind: item.eventKind,
      p_item_key: item.itemKey,
    });
    if (!error) saveOutbox(user.id, readOutbox(user.id).filter((queued) => queued.eventId !== item.eventId));
    else if (/fetch|network|timeout/i.test(error.message || '')) break;
    else {
      saveOutbox(user.id, readOutbox(user.id).filter((queued) => queued.eventId !== item.eventId));
      if (activeAssignment()?.id === item.assignmentId) localStorage.removeItem(ACTIVE_KEY);
    }
  }
}

export function flushAssignmentActivity() {
  if (flushPromise) { flushRequested = true; return flushPromise; }
  flushPromise = runFlush().finally(() => {
    flushPromise = null;
    if (flushRequested) { flushRequested = false; void flushAssignmentActivity(); }
  });
  return flushPromise;
}

function queueActivity(input: { type: ActivityType; contentId: string; itemKey?: string; prompt: string; studentAnswer: string; correctAnswer: string; correct: boolean; score?: number; eventKind: 'answer' | 'session_complete'; metadata?: Record<string, number> }) {
  const active = activeAssignment();
  if (!matches(active, input.type, input.contentId) || !active) return;
  const item: QueuedActivity = { eventId: uuid(), assignmentId: active.id, userId: active.userId, sessionId: active.sessionId, eventKind: input.eventKind, activityType: input.type,
    contentId: input.contentId, itemKey: input.itemKey || '', prompt: input.prompt, studentAnswer: input.studentAnswer,
    correctAnswer: input.correctAnswer, correct: input.correct, score: input.score || 0, metadata: input.metadata || {} };
  saveOutbox(active.userId, [...readOutbox(active.userId), item]); void flushAssignmentActivity();
}

export function recordAssignedActivity(input: { type: ActivityType; contentId: string; itemKey?: string; prompt: string; studentAnswer: string; correctAnswer: string; correct: boolean; score?: number }) {
  queueActivity({ ...input, eventKind: 'answer' });
}

export function beginAssignedSession(type: ActivityType, contentId: string) {
  const active = activeAssignment();
  if (matches(active, type, contentId) && active) localStorage.setItem(ACTIVE_KEY, JSON.stringify({ ...active, sessionId: uuid() }));
}

export function completeAssignedSession(input: { type: ActivityType; contentId: string; correct: number; total: number; score?: number }) {
  const active = activeAssignment();
  if (!matches(active, input.type, input.contentId) || !active) return;
  queueActivity({ type: input.type, contentId: input.contentId, prompt: 'Сессия завершена', studentAnswer: `${input.correct} из ${input.total}`,
    correctAnswer: `${input.total} заданий`, correct: input.correct === input.total, score: input.score || input.correct,
    eventKind: 'session_complete', metadata: { correct: input.correct, total: input.total } });
  localStorage.setItem(ACTIVE_KEY, JSON.stringify({ ...active, sessionId: uuid() }));
}
