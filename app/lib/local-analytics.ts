export type LocalEventName = 'practice_started' | 'practice_finished' | 'exercise_error' | 'example_reported' | 'lesson_opened' | 'lesson_finished';
export type LocalEvent = { name: LocalEventName; at: string; detail?: string };
const KEY = 'ritmo-local-analytics';
const CONSENT_KEY = 'ritmo-analytics-consent';

export const analyticsEnabled = () =>
  typeof localStorage !== 'undefined' && localStorage.getItem(CONSENT_KEY) === 'yes';

export const trackLocalEvent = (name: LocalEventName, detail?: string) => {
  if (!analyticsEnabled()) return;
  try {
    const events = JSON.parse(localStorage.getItem(KEY) || '[]') as LocalEvent[];
    events.push({ name, at: new Date().toISOString(), detail });
    localStorage.setItem(KEY, JSON.stringify(events.slice(-1000)));
    window.dispatchEvent(new Event('ritmo-analytics'));
  } catch {}
};

export const readLocalEvents = (): LocalEvent[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

export const setAnalyticsConsent = (enabled: boolean) => {
  localStorage.setItem(CONSENT_KEY, enabled ? 'yes' : 'no');
  window.dispatchEvent(new Event('ritmo-analytics'));
};

