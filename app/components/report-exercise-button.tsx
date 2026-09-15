'use client';

import { useEffect, useState } from 'react';
import { useAccount } from './account-provider';
import { getCloudClient } from '../lib/cloud-progress';

export function ReportExerciseButton({
  id,
  section,
  prompt,
  answer,
  options,
  learningContext,
}: {
  id: string;
  section: string;
  prompt: string;
  answer: string;
  options?: string[];
  learningContext?: { type: 'lesson' | 'practice' | 'dictation' | 'music'; contentId: string; topicId?: string };
}) {
  const account = useAccount(),
    [reported, setReported] = useState(false),
    [note, setNote] = useState(''), [assignmentId, setAssignmentId] = useState(''), [questionOpen, setQuestionOpen] = useState(false), [question, setQuestion] = useState(''), [questionBusy, setQuestionBusy] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ritmo-exercise-reports') || '[]');
      setReported(Array.isArray(stored) && stored.some((item) => item?.id === id));
    } catch {
      setReported(false);
    }
  }, [id]);
  useEffect(() => {
    const client = getCloudClient();
    if (!client || !account.user || !learningContext) { setAssignmentId(''); return; }
    let active = true;
    void client.rpc('find_my_active_assignment', { p_type: learningContext.type, p_content_id: learningContext.contentId, p_topic_id: learningContext.topicId || null })
      .then(({ data, error }) => { if (active) setAssignmentId(!error && typeof data === 'string' ? data : ''); });
    return () => { active = false; };
  }, [account.user, learningContext?.type, learningContext?.contentId, learningContext?.topicId]);
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
  const askTeacher = async () => {
    const client = getCloudClient();
    if (!client || !account.user || !learningContext || !assignmentId || !question.trim()) return;
    setQuestionBusy(true);
    {
      const sent = await client.rpc('ask_teacher_question', { p_assignment: assignmentId, p_context_type: learningContext.type, p_content_id: learningContext.contentId, p_topic_id: learningContext.topicId || null, p_item_key: id, p_prompt: prompt, p_body: question.trim() });
      if (sent.error) setNote(sent.error.message); else { setNote('Вопрос отправлен преподавателю'); setQuestion(''); setQuestionOpen(false); window.setTimeout(() => (document.querySelector('.lesson-exercise input, .srs-card input, .dictation-card input') as HTMLElement | null)?.focus(), 0); }
    }
    setQuestionBusy(false); window.setTimeout(() => setNote(''), 3500);
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
      {assignmentId && <span className="assignment-context-chip" title="Это входит в задание преподавателя" aria-label="Это входит в задание преподавателя">🎓</span>}
      {assignmentId && <button type="button" className="ask-teacher-toggle" aria-label="Задать вопрос преподавателю" title="Задать вопрос преподавателю" onClick={() => setQuestionOpen((value) => !value)}>?</button>}
      {questionOpen && <span className="exercise-question-popover"><b>Вопрос по этому упражнению</b><textarea autoFocus rows={3} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Что осталось непонятно?" /><span><button type="button" onClick={() => setQuestionOpen(false)}>Закрыть</button><button type="button" disabled={questionBusy || !question.trim()} onClick={() => void askTeacher()}>{questionBusy ? 'Отправляем…' : 'Спросить'}</button></span></span>}
      {note && <small role="status">{note}</small>}
    </span>
  );
}
