'use client';

import { useEffect } from 'react';
import { recordClientError } from '../../lib/error-journal';
import { useSitePreferences } from '../../hooks/site-preferences';
import { useSRS } from '../../lib/learning-runtime';

export function ClientErrorJournal() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) =>
      recordClientError('javascript', event.error || event.message, {
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    const handleRejection = (event: PromiseRejectionEvent) =>
      recordClientError('promise', event.reason, {
        source: 'unhandledrejection',
      });
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);
  return null;
}

export function ReviewReminderWatcher() {
  const { preferences } = useSitePreferences(),
    { records } = useSRS();
  useEffect(() => {
    if (!preferences.reviewNotifications || !('Notification' in window)) return;
    const check = () => {
      if (
        Notification.permission !== 'granted' ||
        document.visibilityState === 'visible'
      )
        return;
      const due = Object.values(records).filter(
        (record) => record.reviews > 0 && record.nextReview <= Date.now(),
      ).length;
      if (!due) return;
      const lastNotice = Number(
        localStorage.getItem('ritmo-last-review-notification') || 0,
      );
      if (Date.now() - lastNotice < 6 * 60 * 60 * 1000) return;
      const notification = new Notification('Пора повторить испанский 🐾', {
        body: `${due} ${due === 1 ? 'карточка готова' : 'карточек готовы'} к повторению.`,
        tag: 'ritmo-review-due',
      });
      notification.onclick = () => {
        window.focus();
        window.location.hash = '#practice';
        notification.close();
      };
      localStorage.setItem(
        'ritmo-last-review-notification',
        String(Date.now()),
      );
    };
    const timer = window.setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [preferences.reviewNotifications, records]);
  return null;
}
