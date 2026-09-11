import type { SupabaseClient } from '@supabase/supabase-js';
import { getCloudClient } from './cloud-progress';

export type ClientErrorKind =
  | 'javascript'
  | 'promise'
  | 'sync'
  | 'audio';

type ClientErrorRecord = {
  eventId: string;
  kind: ClientErrorKind;
  message: string;
  stack: string;
  page: string;
  userAgent: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
};

const queueKey = 'ritmo-client-error-outbox';

const readQueue = (): ClientErrorRecord[] => {
  try {
    const stored = JSON.parse(localStorage.getItem(queueKey) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const writeQueue = (records: ClientErrorRecord[]) =>
  localStorage.setItem(queueKey, JSON.stringify(records.slice(-50)));

const describeError = (error: unknown) => {
  if (error instanceof Error)
    return {
      message: error.message.slice(0, 1200),
      stack: (error.stack || '').slice(0, 6000),
    };
  if (typeof error === 'string') return { message: error.slice(0, 1200), stack: '' };
  try {
    return { message: JSON.stringify(error).slice(0, 1200), stack: '' };
  } catch {
    return { message: 'Неизвестная ошибка клиента', stack: '' };
  }
};

const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export async function flushClientErrors(
  supabase: SupabaseClient,
  userId: string,
) {
  const queued = readQueue();
  if (!queued.length) return;
  const { error } = await supabase.from('client_errors').upsert(
    queued.map((record) => ({
      event_id: record.eventId,
      user_id: userId,
      kind: record.kind,
      message: record.message,
      stack: record.stack || null,
      page: record.page,
      user_agent: record.userAgent,
      metadata: record.metadata,
      occurred_at: record.occurredAt,
    })),
    { onConflict: 'event_id' },
  );
  if (error) throw error;
  const sent = new Set(queued.map((record) => record.eventId));
  writeQueue(readQueue().filter((record) => !sent.has(record.eventId)));
}

export function recordClientError(
  kind: ClientErrorKind,
  error: unknown,
  metadata: Record<string, unknown> = {},
) {
  if (typeof window === 'undefined') return;
  const details = describeError(error),
    record: ClientErrorRecord = {
      eventId: createId(),
      kind,
      message: details.message,
      stack: details.stack,
      page: `${window.location.pathname}${window.location.hash}`.slice(0, 500),
      userAgent: navigator.userAgent.slice(0, 500),
      metadata,
      occurredAt: new Date().toISOString(),
    };
  writeQueue([...readQueue(), record]);
  const supabase = getCloudClient();
  if (!supabase) return;
  void supabase.auth.getUser().then(({ data }) => {
    if (data.user) return flushClientErrors(supabase, data.user.id);
  }).catch(() => undefined);
}

export const clientErrorQueueKey = queueKey;
