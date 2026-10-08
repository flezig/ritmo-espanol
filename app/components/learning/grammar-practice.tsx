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
import { analyzeAnswer } from '../../lib/learning-core';
import {
  grammarTaskFor,
  grammarTaskKind,
  grammarOrderTokens,
  type GrammarTaskKind,
} from '../../lib/grammar-task';

const storageKey = 'ritmo-grammar-practice';
type Session = {
  ids: string[];
  options: string[][];
  formats?: GrammarTaskKind[];
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
  const [draft, setDraft] = useState('');
  const [ordered, setOrdered] = useState<number[]>([]);
  const lock = useRef(false),
    advanceLock = useRef(false),
    startedAt = useRef(Date.now()),
    hints = useRef(0);
  useEffect(() => {
    const stored = read()[mode] || empty();
    const valid = stored.session?.ids.every((id) =>
      grammarExercises[mode].some((q) => q.id === id),
    );
    const value =
      valid && stored.session
        ? {
            ...stored,
            session: {
              ...stored.session,
              formats:
                stored.session.formats ||
                stored.session.ids.map((_, index) =>
                  index === stored.session!.index && stored.session!.choice
                    ? ('choice' as const)
                    : grammarTaskKind(index),
                ),
            },
          }
        : { ...stored, session: undefined };
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
  const task =
    question && session
      ? grammarTaskFor(
          question,
          session.formats?.[session.index] || grammarTaskKind(session.index),
        )
      : undefined;
  const tokens =
    task?.kind === 'order' && session && question
      ? grammarOrderTokens(task.answer, `${session.sessionId}:${question.id}`)
      : [];
  const submittedCorrect =
    !!session?.choice &&
    !!task &&
    analyzeAnswer(session.choice, task.answer).correct;
  useEffect(() => {
    setDraft('');
    setOrdered([]);
    lock.current = false;
    advanceLock.current = false;
    startedAt.current = Date.now();
    hints.current = 0;
  }, [mode, session?.sessionId, session?.index]);
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
        formats: round.map((_, index) =>
          grammarTaskKind(index, progress.sessions),
        ),
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
      !task ||
      !value.trim() ||
      session.choice ||
      session.finished ||
      lock.current
    )
      return;
    lock.current = true;
    advanceLock.current = false;
    const correct = analyzeAnswer(value, task.answer).correct;
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
      prompt: `${task.instruction} ${task.prompt}`,
      studentAnswer: value,
      correctAnswer: task.answer,
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
            10 заданий за сессию: ввод без вариантов, исправление ошибок, сборка
            предложений и выбор ответа. За верный ответ — 5 XP, за попытку — 1
            XP. Можно выйти и продолжить с этого места.
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
        question &&
        task && (
          <article className="article-question">
            <header className="article-practice-head">
              <b>
                {session.index + 1} / {session.ids.length}
              </b>
              <small>
                {question.rule} · {task.label}
              </small>
            </header>
            <ReportExerciseButton
              id={question.id}
              section={`Грамматика: ${info.title}`}
              prompt={`${task.instruction} ${task.prompt}`}
              answer={task.answer}
              options={
                task.kind === 'choice'
                  ? session.options[session.index]
                  : undefined
              }
              learningContext={{
                type: 'practice',
                contentId: `grammar:${mode}`,
              }}
            />
            <p>{task.instruction}</p>
            <h2 lang="es">{task.prompt}</h2>
            {task.kind === 'choice' ? (
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
            ) : task.kind === 'order' ? (
              <div>
                <p lang="es" aria-live="polite">
                  {ordered.length
                    ? ordered
                        .map(
                          (id) => tokens.find((token) => token.id === id)!.word,
                        )
                        .join(' ')
                    : 'Нажимайте на слова в нужном порядке.'}
                </p>
                <div className="article-options">
                  {tokens.map((token) => (
                    <button
                      key={token.id}
                      lang="es"
                      disabled={!!session.choice || ordered.includes(token.id)}
                      onClick={() =>
                        setOrdered((value) => [...value, token.id])
                      }
                    >
                      {token.word}
                    </button>
                  ))}
                </div>
                <button
                  className="secondary-btn"
                  disabled={!!session.choice || !ordered.length}
                  onClick={() => setOrdered((value) => value.slice(0, -1))}
                >
                  Убрать последнее слово
                </button>
                <button
                  className="primary-btn"
                  disabled={
                    !!session.choice || ordered.length !== tokens.length
                  }
                  onClick={() =>
                    choose(
                      ordered
                        .map(
                          (id) => tokens.find((token) => token.id === id)!.word,
                        )
                        .join(' '),
                    )
                  }
                >
                  Проверить
                </button>
              </div>
            ) : (
              <form
                className="grammar-answer-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  choose(draft.trim());
                }}
              >
                <label htmlFor="grammar-answer">
                  {task.kind === 'correction'
                    ? 'Исправленная форма глагола'
                    : 'Пропущенная форма глагола'}
                </label>
                <input
                  id="grammar-answer"
                  lang="es"
                  value={draft}
                  disabled={!!session.choice}
                  onChange={(event) => setDraft(event.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Напишите по-испански"
                />
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={!!session.choice || !draft.trim()}
                >
                  Проверить
                </button>
              </form>
            )}
            {session.choice && (
              <footer className={submittedCorrect ? 'correct' : 'wrong'}>
                <b>
                  {submittedCorrect
                    ? 'Верно! +5 XP'
                    : `Правильный ответ: ${task.answer} · +1 XP`}
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
