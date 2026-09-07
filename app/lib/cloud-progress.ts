import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { BACKUP_KEYS } from './backup.ts';
import type { ProgressData } from './progress-merge.ts';

export type CloudSyncStatus = 'loading' | 'guest' | 'syncing' | 'synced' | 'offline' | 'unconfigured' | 'error' | 'conflict';
export type CloudProgressRow = { data: ProgressData; updated_at: string; revision: number };
export type ContentReportPayload = {
  reportKey: string;
  kind: 'example' | 'exercise';
  section: string;
  content: Record<string, unknown>;
  active: boolean;
};
export type QueuedReport = ContentReportPayload & { eventId: string; reportedAt: string };

const META_KEY = 'ritmo-cloud-state';
const PENDING_EMAIL_KEY = 'ritmo-cloud-pending-email';
const OUTBOX_KEY = 'ritmo-report-outbox';
export const CLOUD_PROGRESS_KEYS = BACKUP_KEYS.filter((key) => key !== 'ritmo-local-analytics');
export const currentProgressFields = (data: ProgressData): ProgressData =>
  Object.fromEntries(Object.entries(data).filter(([key]) => (CLOUD_PROGRESS_KEYS as readonly string[]).includes(key)));
export const preserveFutureFields = (local: ProgressData, remote: ProgressData): ProgressData => ({
  ...Object.fromEntries(Object.entries(remote).filter(([key]) => !(CLOUD_PROGRESS_KEYS as readonly string[]).includes(key))),
  ...local,
});
let client: SupabaseClient | null | undefined;

export const getCloudClient = () => {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  client = url && key ? createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }) : null;
  return client;
};

export const collectCloudProgress = (): ProgressData => {
  const data: ProgressData = {};
  for (const key of CLOUD_PROGRESS_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return data;
};

// Exact comparison: a short hash collision must never suppress a save.
export const cloudProgressHash = (data = collectCloudProgress()) =>
  JSON.stringify(Object.keys(data).sort().map((key) => [key, data[key]]));

export const restoreCloudProgress = (data: ProgressData) => {
  const previous = collectCloudProgress();
  try {
    for (const key of CLOUD_PROGRESS_KEYS) {
      if (typeof data[key] === 'string') localStorage.setItem(key, data[key]);
      else localStorage.removeItem(key);
    }
  } catch (error) {
    // A full browser storage must not leave a half-restored profile.
    for (const key of CLOUD_PROGRESS_KEYS) localStorage.removeItem(key);
    for (const [key, value] of Object.entries(previous)) localStorage.setItem(key, value);
    throw error;
  }
};

type SyncMeta = { owner: string; baseline: CloudProgressRow };
export type OfflineAccount = { data: ProgressData; baseline: CloudProgressRow };
export const offlineAccount = {
  read(userId: string): OfflineAccount | null {
    try { return JSON.parse(localStorage.getItem('ritmo-offline-account-' + userId) || 'null'); } catch { return null; }
  },
  save: (userId: string, value: OfflineAccount) => localStorage.setItem('ritmo-offline-account-' + userId, JSON.stringify(value)),
  remove: (userId: string) => localStorage.removeItem('ritmo-offline-account-' + userId),
};
export const cloudSyncMeta = {
  read(): SyncMeta | null {
    try { return JSON.parse(localStorage.getItem(META_KEY) || 'null'); } catch { return null; }
  },
  owner: (): string | null => cloudSyncMeta.read()?.owner ?? localStorage.getItem('ritmo-cloud-owner'),
  pendingEmail: () => localStorage.getItem(PENDING_EMAIL_KEY),
  setPendingEmail: (email: string) => localStorage.setItem(PENDING_EMAIL_KEY, email.trim().toLowerCase()),
  clearPendingEmail: () => localStorage.removeItem(PENDING_EMAIL_KEY),
  save: (owner: string, baseline: CloudProgressRow) =>
    localStorage.setItem(META_KEY, JSON.stringify({ owner, baseline })),
};

export const clearCloudProgress = () => {
  for (const key of CLOUD_PROGRESS_KEYS) localStorage.removeItem(key);
  for (const key of [META_KEY, PENDING_EMAIL_KEY, 'ritmo-cloud-owner', 'ritmo-cloud-last-hash', 'ritmo-cloud-updated-at', 'ritmo-latest-achievement'])
    localStorage.removeItem(key);
};

export const fetchCloudProgress = async (supabase: SupabaseClient, userId: string): Promise<CloudProgressRow> => {
  const { data, error } = await supabase.from('user_progress')
    .select('data, updated_at, revision').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return { data: {}, updated_at: '', revision: 0 };
  if (!data.data || typeof data.data !== 'object' || Array.isArray(data.data) ||
      !Object.values(data.data).every((value) => typeof value === 'string'))
    throw new Error('Invalid cloud progress format');
  return { data: data.data as ProgressData, updated_at: data.updated_at, revision: Number(data.revision) };
};

export class ProgressConflict extends Error {
  remote: CloudProgressRow;
  constructor(remote: CloudProgressRow) {
    super('Progress changed on another device');
    this.remote = remote;
  }
}

export const pushCloudProgress = async (supabase: SupabaseClient, data: ProgressData, expectedRevision: number): Promise<CloudProgressRow> => {
  const { data: result, error } = await supabase.rpc('save_my_progress', {
    p_data: data, p_expected_revision: expectedRevision,
  });
  if (error) throw error;
  if (!result?.saved) throw new ProgressConflict(result?.progress);
  return result.progress as CloudProgressRow;
};

const readOutbox = (): Record<string, QueuedReport> => {
  try {
    const value = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
};
export const queueContentReport = (report: ContentReportPayload): QueuedReport => {
  const queued = { ...report, eventId: crypto.randomUUID(), reportedAt: new Date().toISOString() };
  const outbox = readOutbox();
  outbox[report.kind + ':' + report.reportKey] = queued;
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
  return queued;
};
export const pendingContentReports = () => Object.values(readOutbox());
export const acknowledgeContentReport = (report: QueuedReport) => {
  const outbox = readOutbox(), key = report.kind + ':' + report.reportKey;
  // Do not drop a newer toggle that happened while the request was running.
  if (outbox[key]?.eventId === report.eventId) {
    delete outbox[key];
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
  }
};

/** Older installations only stored flags locally. Import them once per profile. */
export const migrateMarkedReports = () => {
  const marker = 'ritmo-report-migration';
  if (localStorage.getItem(marker) === '1') return;
  for (const kind of ['example', 'exercise'] as const) {
    const stored = JSON.parse(localStorage.getItem('ritmo-' + kind + '-reports') || '[]');
    if (!Array.isArray(stored)) continue;
    for (const report of stored) {
      if (!report?.id || readOutbox()[kind + ':' + report.id]) continue;
      queueContentReport({
        reportKey: report.id, kind, section: report.source || report.section || kind,
        content: kind === 'example'
          ? { word: report.word, example: report.example, translation: report.translation }
          : { prompt: report.prompt, answer: report.answer, options: report.options || [] },
        active: true,
      });
    }
  }
  localStorage.setItem(marker, '1');
};

export const submitCloudContentReport = async (supabase: SupabaseClient, report: QueuedReport) => {
  const { error } = await supabase.rpc('report_content', {
    p_report_key: report.reportKey, p_kind: report.kind, p_section: report.section,
    p_content: report.content, p_active: report.active, p_event_id: report.eventId,
    p_reported_at: report.reportedAt,
  });
  if (error) throw error;
};
