export const BACKUP_VERSION = 2;

export const BACKUP_KEYS = [
  'ritmo-device-profile', 'ritmo-srs', 'ritmo-word-progress', 'ritmo-word-history',
  'ritmo-learn-progress', 'ritmo-lesson-progress', 'ritmo-error-profile',
  'ritmo-content-favorites', 'ritmo-custom-words', 'ritmo-example-reports',
  'ritmo-lesson-word-db', 'ritmo-home-favorites', 'ritmo-practice-session',
  'ritmo-detective-progress', 'ritmo-rush-records', 'ritmo-achievement-stats',
  'ritmo-achievements', 'ritmo-placement', 'ritmo-local-analytics',
] as const;

export type RitmoBackup = {
  app: 'Ritmo Español';
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
};

export const isValidBackup = (value: unknown): value is RitmoBackup => {
  if (!value || typeof value !== 'object') return false;
  const backup = value as Partial<RitmoBackup>;
  if (backup.app !== 'Ritmo Español' || ![1, BACKUP_VERSION].includes(Number(backup.version))) return false;
  if (!backup.data || typeof backup.data !== 'object' || Array.isArray(backup.data)) return false;
  return Object.keys(backup.data).every((key) => (BACKUP_KEYS as readonly string[]).includes(key));
};
