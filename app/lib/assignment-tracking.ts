import { getCloudClient } from './cloud-progress';

type ActivityType = 'lesson' | 'practice' | 'dictation' | 'music';
type ActiveAssignment = { id: string; userId: string; type: ActivityType; contentId: string; topicId?: string; sessionId: string };
type QueuedActivity = { eventId: string; userId: string; sessionId: string; eventKind: 'answer' | 'session_complete'; activityType: ActivityType; contentId: string; topicId: string; itemKey: string; prompt: string; studentAnswer: string; correctAnswer: string; correct: boolean; score: number; metadata: Record<string, number> };
const ACTIVE_KEY = 'ritmo-active-assignment';
const outboxKey = (userId: string) => `ritmo-assignment-activity-outbox:${userId}`;
const uuid = () => crypto.randomUUID();
let flushPromise: Promise<void> | null = null;
let flushRequested = false;
let signedInUserId: string | null = null;
const sessions = new Map<string, string>();

export function activateAssignmentTracking(value: Omit<ActiveAssignment, 'sessionId'>) { localStorage.setItem(ACTIVE_KEY, JSON.stringify({ ...value, sessionId: uuid() })); }
export function prepareAssignmentTracking(userId: string | null) {
  signedInUserId = userId;
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
const sessionKey = (type: ActivityType, contentId: string, topicId = '') => `${type}:${contentId}:${topicId}`;
const getSession = (type: ActivityType, contentId: string, topicId = '') => {
  const key = sessionKey(type, contentId, topicId);
  if (!sessions.has(key)) sessions.set(key, uuid());
  return sessions.get(key)!;
};

async function runFlush() {
  const client = getCloudClient(); if (!client) return;
  const { data: { user } } = await client.auth.getUser(); if (!user) return;
  for (const item of readOutbox(user.id)) {
    const { error } = await client.rpc('record_learning_activity', {
      p_event_id: item.eventId, p_activity_type: item.activityType,
      p_content_id: item.contentId, p_topic_id: item.topicId || null, p_prompt: item.prompt, p_student_answer: item.studentAnswer,
      p_correct_answer: item.correctAnswer, p_is_correct: item.correct, p_score_delta: item.score, p_metadata: item.metadata,
      p_session_id: item.sessionId, p_event_kind: item.eventKind,
      p_item_key: item.itemKey,
    });
    if (!error) saveOutbox(user.id, readOutbox(user.id).filter((queued) => queued.eventId !== item.eventId));
    else if (/fetch|network|timeout/i.test(error.message || '')) break;
    else {
      saveOutbox(user.id, readOutbox(user.id).filter((queued) => queued.eventId !== item.eventId));
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

function queueActivity(input: { type: ActivityType; contentId: string; topicId?: string; itemKey?: string; prompt: string; studentAnswer: string; correctAnswer: string; correct: boolean; score?: number; eventKind: 'answer' | 'session_complete'; metadata?: Record<string, number> }) {
  if (!signedInUserId) return;
  const item: QueuedActivity = { eventId: uuid(), userId: signedInUserId, sessionId: getSession(input.type, input.contentId, input.topicId), eventKind: input.eventKind, activityType: input.type,
    topicId: input.topicId || '',
    contentId: input.contentId, itemKey: input.itemKey || '', prompt: input.prompt, studentAnswer: input.studentAnswer,
    correctAnswer: input.correctAnswer, correct: input.correct, score: input.score || 0, metadata: input.metadata || {} };
  saveOutbox(signedInUserId, [...readOutbox(signedInUserId), item]); void flushAssignmentActivity();
}

export function recordAssignedActivity(input: { type: ActivityType; contentId: string; topicId?: string; itemKey?: string; prompt: string; studentAnswer: string; correctAnswer: string; correct: boolean; score?: number }) {
  queueActivity({ ...input, eventKind: 'answer' });
}

export function beginAssignedSession(type: ActivityType, contentId: string, topicId = '') {
  sessions.set(sessionKey(type, contentId, topicId), uuid());
  const active = activeAssignment();
  if (active?.type === type && (active.contentId === 'all' || active.contentId === contentId)) localStorage.setItem(ACTIVE_KEY, JSON.stringify({ ...active, sessionId: getSession(type, contentId, topicId) }));
}

export function completeAssignedSession(input: { type: ActivityType; contentId: string; topicId?: string; correct: number; total: number; score?: number }) {
  queueActivity({ type: input.type, contentId: input.contentId, topicId: input.topicId, prompt: 'Сессия завершена', studentAnswer: `${input.correct} из ${input.total}`,
    correctAnswer: `${input.total} заданий`, correct: input.correct === input.total, score: input.score || input.correct,
    eventKind: 'session_complete', metadata: { correct: input.correct, total: input.total } });
  sessions.set(sessionKey(input.type, input.contentId, input.topicId), uuid());
}
