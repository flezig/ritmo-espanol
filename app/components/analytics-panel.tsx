'use client';

import { useEffect, useState } from 'react';
import { analyticsEnabled, readLocalEvents, setAnalyticsConsent, type LocalEvent } from '../lib/local-analytics';

export default function AnalyticsPanel() {
  const [enabled, setEnabled] = useState(false);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  useEffect(() => {
    const read = () => { setEnabled(analyticsEnabled()); setEvents(readLocalEvents()); };
    queueMicrotask(read);
    window.addEventListener('ritmo-analytics', read);
    return () => window.removeEventListener('ritmo-analytics', read);
  }, []);
  const counts = events.reduce<Record<string, number>>((result, event) => ({ ...result, [event.name]: (result[event.name] || 0) + 1 }), {});
  return (
    <section className="analytics-panel">
      <header><div><p className="eyebrow">ДОБРОВОЛЬНАЯ АНАЛИТИКА</p><h2>Помогает увидеть, что мешает учиться</h2></div><label><input type="checkbox" checked={enabled} onChange={(event) => { setAnalyticsConsent(event.target.checked); setEnabled(event.target.checked); }} /> Включить</label></header>
      <p>Хранится только в этом браузере и никуда не отправляется. Тексты ответов, имя и почта не записываются.</p>
      {enabled && <div className="analytics-stats"><span>Начато практик: <b>{counts.practice_started || 0}</b></span><span>Завершено: <b>{counts.practice_finished || 0}</b></span><span>Ошибок по типам: <b>{counts.exercise_error || 0}</b></span><span>Примеров отмечено: <b>{counts.example_reported || 0}</b></span><button onClick={() => { localStorage.removeItem('ritmo-local-analytics'); window.dispatchEvent(new Event('ritmo-analytics')); }}>Очистить локальную аналитику</button></div>}
    </section>
  );
}

