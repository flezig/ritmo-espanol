'use client';

import { useEffect, useMemo, useState } from 'react';
import { Headphones, RotateCcw, Volume2 } from 'lucide-react';
import { ReportExerciseButton } from './report-exercise-button';
import { recordClientError } from '../lib/error-journal';
import {
  placementQuestionSets,
  arrangedPlacementOptions,
  scorePlacement,
  type PlacementLevel,
  type PlacementResult,
} from '../lib/placement-test';

type PlacementStorage = {
  latest: PlacementResult | null;
  history: PlacementResult[];
};

const placementStorageKey = 'ritmo-placement';
const normalizeStoredResult = (
  value: Record<string, unknown>,
  attempt: number,
): PlacementResult => {
  const level = String(value.level || 'A1').slice(0, 2) as PlacementLevel;
  return {
    ...(value as unknown as PlacementResult),
    level: ['A1', 'A2', 'B1', 'B2', 'C1'].includes(level) ? level : 'A1',
    levels:
      value.levels && typeof value.levels === 'object'
        ? (value.levels as PlacementResult['levels'])
        : {
            A1: Number(value.a1) || 0,
            A2: Number(value.a2) || 0,
            B1: 0,
            B2: 0,
            C1: 0,
          },
    attempt: Number(value.attempt) || attempt,
    questionSetId: String(value.questionSetId || 'legacy'),
    questionIds: Array.isArray(value.questionIds)
      ? (value.questionIds as string[])
      : [],
  };
};
const loadPlacementStorage = (): PlacementStorage => {
  if (typeof window === 'undefined') return { latest: null, history: [] };
  try {
    const stored = JSON.parse(localStorage.getItem(placementStorageKey) || 'null');
    if (Array.isArray(stored?.history)) {
      const history = stored.history.map(
        (result: Record<string, unknown>, index: number) =>
          normalizeStoredResult(result, index + 1),
      );
      return {
        latest: stored.latest
          ? normalizeStoredResult(stored.latest, history.length || 1)
          : history.at(-1) || null,
        history,
      };
    }
    if (stored?.skills) {
      const legacy = normalizeStoredResult(stored, 1);
      return { latest: legacy, history: [legacy] };
    }
  } catch {}
  return { latest: null, history: [] };
};

export default function TodayPanel({
  due,
  newWords,
  weakTopic,
  weakTopicErrors,
  lessonId,
  lessonTitle,
  lessonDone,
  todayDone,
  dailyTarget,
  go,
  onPlacementComplete,
}: {
  due: number;
  newWords: number;
  weakTopic: string;
  weakTopicErrors: number;
  lessonId: string;
  lessonTitle: string;
  lessonDone: number;
  todayDone: number;
  dailyTarget: number;
  go: (section: 'Practice' | 'Lessons' | 'Grammar') => void;
  onPlacementComplete: (level: PlacementLevel) => void;
}) {
  const [placementOpen, setPlacementOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [placementHistory, setPlacementHistory] = useState<PlacementResult[]>([]);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [attemptIndex, setAttemptIndex] = useState(0);
  useEffect(() => {
    const stored = loadPlacementStorage();
    setPlacementHistory(stored.history);
    setResult(stored.latest);
    setAttemptIndex(stored.history.length);
  }, []);
  const activeQuestions =
    placementQuestionSets[attemptIndex % placementQuestionSets.length];
  const question = activeQuestions[index];
  const answer = responses[question?.id] || '',
    displayedOptions = useMemo(
      () => arrangedPlacementOptions(question, attemptIndex + 1),
      [question, attemptIndex],
    );
  const speak = (rate: number) => {
    if (!question.audio || typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.audio);
    utterance.lang = 'es-ES';
    utterance.rate = rate;
    const voice = speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith('es'));
    if (voice) utterance.voice = voice;
    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted')
        recordClientError('audio', event.error || 'speech-synthesis-error', {
          source: 'placement-test',
          language: utterance.lang,
        });
    };
    speechSynthesis.speak(utterance);
  };
  const finish = () => {
    const next = scorePlacement(responses, activeQuestions, placementHistory.length + 1),
      history = [...placementHistory, next].slice(-20),
      stored: PlacementStorage = { latest: next, history };
    localStorage.setItem(placementStorageKey, JSON.stringify(stored));
    window.dispatchEvent(new Event('ritmo-placement'));
    setPlacementHistory(history);
    setResult(next); setPlacementOpen(false); setIndex(0);
    onPlacementComplete(next.level);
  };
  const reset = () => {
    setResult(null); setResponses({}); setIndex(0);
    setAttemptIndex(placementHistory.length);
    setPlacementOpen(true);
  };
  const practiceRecommendation = due
    ? `${due} карточек уже пора повторить`
    : newWords
      ? `Новых слов в сессии: ${Math.min(4, newWords)} · доступно ${newWords}`
      : 'Закрепить изученные слова без добавления новых';
  const lessonRecommendation = lessonTitle
    ? lessonDone
      ? `Продолжить «${lessonTitle}» · ${lessonDone}/50`
      : `Начать «${lessonTitle}»`
    : 'Все доступные уроки завершены';
  const grammarRecommendation = weakTopic
    ? `${weakTopic} · ${weakTopicErrors} ${weakTopicErrors === 1 ? 'ошибка' : weakTopicErrors < 5 ? 'ошибки' : 'ошибок'}`
    : 'Ошибок пока нет — повторить базовые правила';
  const steps = [
    {
      number: 1,
      title: 'Практика',
      description: practiceRecommendation,
      action: due ? 'Повторить' : 'Начать',
      status: todayDone >= dailyTarget ? 'done' : 'active',
      statusLabel: todayDone >= dailyTarget ? 'Выполнено' : 'Сейчас',
      open: () => go('Practice'),
    },
    {
      number: 2,
      title: 'Следующий урок',
      description: lessonRecommendation,
      action: lessonDone ? 'Продолжить' : 'Начать урок',
      status: lessonDone ? 'active' : 'upcoming',
      statusLabel: lessonDone ? 'Продолжить' : 'Впереди',
      open: () => {
        if (lessonId) sessionStorage.setItem('ritmo-focus-lesson-id', lessonId);
        go('Lessons');
      },
    },
    {
      number: 3,
      title: 'Грамматика',
      description: grammarRecommendation,
      action: weakTopic ? 'Разобрать ошибки' : 'Повторить правила',
      status: weakTopic ? 'active' : 'upcoming',
      statusLabel: weakTopic ? 'Нужно внимание' : 'Впереди',
      open: () => go('Grammar'),
    },
  ] as const;
  return (
    <section className="today-panel">
      <header>
        <div><small>ПЛАН НА СЕГОДНЯ</small><h2>Три понятных шага</h2></div>
        <button onClick={() => {
          if (!placementOpen && placementHistory.length) {
            setResult(null);
            setResponses({});
            setIndex(0);
            setAttemptIndex(placementHistory.length);
          }
          setPlacementOpen((value) => !value);
        }}>Пройти входной тест</button>
      </header>
      <div className="today-actions">
        {steps.map((step) => (
          <article className={`today-step ${step.status}`} key={step.number}>
            <header>
              <span className="today-step-number">
                {step.status === 'done' ? '✓' : step.status === 'active' ? '→' : step.number}
              </span>
              <small>{step.statusLabel}</small>
            </header>
            <b>{step.number} · {step.title}</b>
            <p>{step.description}</p>
            <button onClick={step.open}>{step.action}</button>
          </article>
        ))}
      </div>
      {result && (
        <div className="placement-result-card">
          <div><small>РЕКОМЕНДОВАННЫЙ УРОВЕНЬ · ПОПЫТКА {result.attempt}</small><h3>{result.level}</h3><p>Общий результат {result.total}% · A1 {result.levels.A1}% · A2 {result.levels.A2}% · B1 {result.levels.B1}% · B2 {result.levels.B2}% · C1 {result.levels.C1}% · всего прохождений: {placementHistory.length}</p></div>
          <div className="placement-skills">{Object.entries(result.skills).map(([skill, value]) => <span key={skill}><b>{skill}</b><i><em style={{ width: `${value}%` }} /></i><strong>{value}%</strong></span>)}</div>
          <button onClick={reset}><RotateCcw /> Пройти с новыми вопросами</button>
        </div>
      )}
      {placementOpen && question && (
        <div className="placement-test">
          <ReportExerciseButton
            id={`placement:${question.id}`}
            section={`Входной тест: ${question.skill}`}
            prompt={question.prompt}
            answer={question.answers[0]}
            options={question.options}
          />
          <header><span>{question.skill} · {question.level} · попытка {placementHistory.length + 1}</span><b>{index + 1} / {activeQuestions.length}</b></header>
          <div className="placement-progress"><i style={{ width: `${(index + 1) / activeQuestions.length * 100}%` }} /></div>
          {question.context && <blockquote lang="es">{question.context}</blockquote>}
          {question.audio && <div className="placement-audio"><Headphones /><span>Текст скрыт: отвечайте только на слух</span><button onClick={() => speak(1)}><Volume2 /> Обычная</button><button onClick={() => speak(.5)}><Volume2 /> 0.5×</button></div>}
          <h3>{question.prompt}</h3>
          {question.options ? <div className="placement-options">{displayedOptions.map((option) => <button className={answer === option ? 'selected' : ''} onClick={() => setResponses((items) => ({ ...items, [question.id]: option }))} key={option}>{option}</button>)}</div> : <input autoFocus value={answer} onChange={(event) => setResponses((items) => ({ ...items, [question.id]: event.target.value }))} placeholder="Введите ответ самостоятельно…" />}
          <footer><button disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>Назад</button>{index === activeQuestions.length - 1 ? <button disabled={!answer.trim()} onClick={finish}>Рассчитать уровень</button> : <button disabled={!answer.trim()} onClick={() => setIndex((value) => value + 1)}>Следующий вопрос</button>}</footer>
          <small>40 вопросов: по 10 на грамматику, чтение, аудирование и письмо. Регистр и знаки препинания не учитываются. Повторный тест использует другой набор той же структуры.</small>
        </div>
      )}
    </section>
  );
}
