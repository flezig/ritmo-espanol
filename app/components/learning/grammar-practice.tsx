'use client';

import { useEffect, useRef, useState } from 'react';
import {
  grammarModes,
  grammarExercises,
  createGrammarRound,
  type GrammarMode,
  type GrammarExercise,
} from '../../data/grammar-practice';
import {
  recordAchievementEvent,
  recordLearningEvent,
} from '../../lib/learning-runtime';
import { recordLearningInsight } from '../../lib/learning-insights';
import {
  beginAssignedSession,
  completeAssignedSession,
  recordAssignedActivity,
} from '../../lib/assignment-tracking';
import { ReportExerciseButton } from '../report-exercise-button';
import { playFeedbackSound } from './shared';

const storageKey = 'ritmo-grammar-practice';
type Session = {
  ids: string[];
  options: string[][];
  index: number;
  choice: string;
  score: number;
  finished: boolean;
  sessionId: string;
};
type ModeProgress = {
  seen: string[];
  correctIds: string[];
  answers: number;
  correct: number;
  sessions: number;
  session?: Session;
};
type GrammarProgress = Partial<Record<GrammarMode, ModeProgress>>;
const empty = (): ModeProgress => ({
  seen: [],
  correctIds: [],
  answers: 0,
  correct: 0,
  sessions: 0,
});
const read = (): GrammarProgress => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {
    return {};
  }
};
const save = (mode: GrammarMode, value: ModeProgress) => {
  localStorage.setItem(
    storageKey,
    JSON.stringify({ ...read(), [mode]: value }),
  );
  window.dispatchEvent(new Event('ritmo-cloud-progress-changed'));
};

export function GrammarPractice({ mode }: { mode: GrammarMode }) {
  const info = grammarModes.find((m) => m.id === mode)!;
  const [progress, setProgress] = useState<ModeProgress>(empty);
  const [ready, setReady] = useState(false);
  const [theory, setTheory] = useState(true);
  const lock = useRef(false),
    advanceLock = useRef(false),
    startedAt = useRef(Date.now()),
    hints = useRef(0);
  useEffect(() => {
    const stored = read()[mode] || empty();
    const valid = stored.session?.ids.every((id) =>
      grammarExercises[mode].some((q) => q.id === id),
    );
    const value = valid ? stored : { ...stored, session: undefined };
    setProgress(value);
    setReady(true);
    if (value.session && !value.session.finished)
      beginAssignedSession(
        'practice',
        `grammar:${mode}`,
        '',
        value.session.sessionId,
      );
  }, [mode]);
  const session = progress.session;
  const question: GrammarExercise | undefined =
    session &&
    grammarExercises[mode].find((q) => q.id === session.ids[session.index]);
  const update = (value: ModeProgress) => {
    save(mode, value);
    setProgress(value);
  };
  const start = () => {
    const round = createGrammarRound(mode, progress.seen);
    const sessionId = crypto.randomUUID();
    beginAssignedSession('practice', `grammar:${mode}`, '', sessionId);
    lock.current = false;
    startedAt.current = Date.now();
    hints.current = 0;
    update({
      ...progress,
      session: {
        ids: round.map((q) => q.id),
        options: round.map((q) => q.options),
        index: 0,
        choice: '',
        score: 0,
        finished: false,
        sessionId,
      },
    });
    setTheory(false);
  };
  const choose = (value: string) => {
    if (
      !session ||
      !question ||
      session.choice ||
      session.finished ||
      lock.current
    )
      return;
    lock.current = true;
    advanceLock.current = false;
    const correct = value === question.answer;
    update({
      ...progress,
      seen: [...new Set([...progress.seen, question.id])],
      correctIds: correct
        ? [...new Set([...progress.correctIds, question.id])]
        : progress.correctIds,
      answers: progress.answers + 1,
      correct: progress.correct + Number(correct),
      session: {
        ...session,
        choice: value,
        score: session.score + Number(correct),
      },
    });
    recordAssignedActivity({
      type: 'practice',
      contentId: `grammar:${mode}`,
      itemKey: question.id,
      prompt: `${question.instruction} ${question.prompt}`,
      studentAnswer: value,
      correctAnswer: question.answer,
      correct,
      score: correct ? 5 : 1,
    });
    recordLearningEvent(correct, correct ? 5 : 1);
    recordLearningInsight({
      correct,
      responseMs: Date.now() - startedAt.current,
      hints: hints.current,
      topic: `Грамматика: ${info.title}`,
    });
    recordAchievementEvent({
      type: 'grammar-answer',
      mode: `grammar:${mode}`,
      correct,
    });
    playFeedbackSound(correct);
  };
  const next = () => {
    if (!session?.choice || session.finished || advanceLock.current) return;
    advanceLock.current = true;
    if (session.index === session.ids.length - 1) {
      update({
        ...progress,
        sessions: progress.sessions + 1,
        session: { ...session, finished: true },
      });
      completeAssignedSession({
        type: 'practice',
        contentId: `grammar:${mode}`,
        correct: session.score,
        total: session.ids.length,
        score: session.score * 5 + session.ids.length - session.score,
      });
      recordAchievementEvent({
        type: 'practice-session',
        mode: `grammar:${mode}`,
        topic: info.title,
        perfect: session.score === session.ids.length,
      });
    } else {
      update({
        ...progress,
        session: { ...session, index: session.index + 1, choice: '' },
      });
      lock.current = false;
      startedAt.current = Date.now();
      hints.current = 0;
    }
  };
  if (!ready) return <p>Загружаем тренировку…</p>;
  return (
    <section className="article-practice grammar-practice game-panel">
      <header className="grammar-practice-header">
        <div>
          <span>
            {info.icon} {info.level} · ПОДГОТОВКА К DELE
          </span>
          <h2>{info.title}</h2>
        </div>
        <button
          className="secondary-btn"
          aria-expanded={theory}
          onClick={() => {
            setTheory(!theory);
            if (!theory && session && !session.choice) hints.current++;
          }}
        >
          {theory ? 'Скрыть справку' : 'Теория и источники'}
        </button>
      </header>
      <p className="grammar-progress-facts">
        Банк: {grammarExercises[mode].length} заданий · встречено{' '}
        {progress.seen.length} · решено верно {progress.correctIds.length} ·
        точность{' '}
        {progress.answers
          ? Math.round((progress.correct / progress.answers) * 100)
          : 0}
        % · сессий {progress.sessions}
      </p>
      {theory && (
        <aside className="grammar-theory">
          <h3>Справка по теории</h3>
          {info.theory.map((text) => (
            <p key={text}>{text}</p>
          ))}
          <p className="muted">
            Авторская краткая справка для подготовки по темам PCIC. Упражнения
            созданы для Ritmo Español и не являются официальными заданиями
            экзамена DELE.
          </p>
          <h4>Официальные источники</h4>
          <ul>
            {info.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.title} ↗
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
      {!session ? (
        <div className="grammar-start">
          <p>
            10 заданий вперемешку за сессию. За верный ответ — 5 XP, за попытку
            — 1 XP. Можно выйти и продолжить с этого места.
          </p>
          <button className="primary-btn" onClick={start}>
            Начать тренировку
          </button>
        </div>
      ) : session.finished ? (
        <div className="grammar-start">
          <h3>
            {session.score} из {session.ids.length} верно
          </h3>
          <p>
            Заработано {session.score * 5 + session.ids.length - session.score}{' '}
            XP. Результат сохранён.
          </p>
          <button className="primary-btn" onClick={start}>
            Следующие 10 заданий
          </button>
        </div>
      ) : (
        question && (
          <article className="article-question">
            <header className="article-practice-head">
              <b>
                {session.index + 1} / {session.ids.length}
              </b>
              <small>{question.rule}</small>
            </header>
            <ReportExerciseButton
              id={question.id}
              section={`Грамматика: ${info.title}`}
              prompt={question.prompt}
              answer={question.answer}
              options={session.options[session.index]}
              learningContext={{
                type: 'practice',
                contentId: `grammar:${mode}`,
              }}
            />
            <p>{question.instruction}</p>
            <h2 lang="es">{question.prompt}</h2>
            <div className="article-options">
              {session.options[session.index].map((option) => (
                <button
                  key={option}
                  disabled={!!session.choice}
                  className={
                    session.choice
                      ? option === question.answer
                        ? 'correct'
                        : option === session.choice
                          ? 'wrong'
                          : ''
                      : ''
                  }
                  onClick={() => choose(option)}
                  lang="es"
                >
                  {option}
                </button>
              ))}
            </div>
            {session.choice && (
              <footer
                className={
                  session.choice === question.answer ? 'correct' : 'wrong'
                }
              >
                <b>
                  {session.choice === question.answer
                    ? 'Верно! +5 XP'
                    : `Правильный ответ: ${question.answer} · +1 XP`}
                </b>
                <p>{question.explanation}</p>
                <button onClick={next}>
                  {session.index === session.ids.length - 1
                    ? 'Завершить сессию'
                    : 'Следующее задание'}
                </button>
              </footer>
            )}
          </article>
        )
      )}
    </section>
  );
}
