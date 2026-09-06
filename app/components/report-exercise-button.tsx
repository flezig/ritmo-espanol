'use client';

import { useEffect, useState } from 'react';
import { useAccount } from './account-provider';

export function ReportExerciseButton({
  id,
  section,
  prompt,
  answer,
  options,
}: {
  id: string;
  section: string;
  prompt: string;
  answer: string;
  options?: string[];
}) {
  const account = useAccount(),
    [reported, setReported] = useState(false),
    [note, setNote] = useState('');
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ritmo-exercise-reports') || '[]');
      setReported(Array.isArray(stored) && stored.some((item) => item?.id === id));
    } catch {
      setReported(false);
    }
  }, [id]);
  const toggle = async () => {
    let nextReported = !reported;
    try {
      const stored = JSON.parse(localStorage.getItem('ritmo-exercise-reports') || '[]'),
        reports = Array.isArray(stored) ? stored : [],
        exists = reports.some((item) => item?.id === id),
        next = exists
          ? reports.filter((item) => item?.id !== id)
          : [...reports, { id, section, prompt, answer, options, createdAt: new Date().toISOString() }];
      nextReported = !exists;
      localStorage.setItem('ritmo-exercise-reports', JSON.stringify(next));
      setReported(nextReported);
      window.dispatchEvent(new Event('ritmo-exercise-reports'));
    } catch {}
    const result = await account.reportContent({
      reportKey: id,
      kind: 'exercise',
      section,
      content: { prompt, answer, options: options || [] },
      active: nextReported,
    });
    setNote(result.ok ? (nextReported ? 'Отправлено автору' : 'Отметка снята') : result.message);
    window.setTimeout(() => setNote(''), 3500);
  };
  return (
    <span className="exercise-report-wrap">
      <button
        type="button"
        className={`report-exercise ${reported ? 'reported' : ''}`}
        onClick={() => void toggle()}
        title={reported ? 'Снять отметку' : 'Сообщить о странном или неверном задании'}
        aria-label={reported ? 'Снять жалобу на задание' : 'Пожаловаться на задание'}
        aria-pressed={reported}
      >
        {reported ? '✓' : '⚑'}
      </button>
      {note && <small role="status">{note}</small>}
    </span>
  );
}

