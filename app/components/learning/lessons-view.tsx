'use client';

import { useEffect, useRef, useState } from 'react';
import { courseLessons } from '../../lessons';
import {
  hasOnlySpanishMarkDifference,
  matchesAnswerVariant,
  normalizeText,
} from '../../lib/learning-core';
import { appendLessonError, lessonErrorsForTeacher } from '../../lib/lesson-errors';
import { recordLearningInsight } from '../../lib/learning-insights';
import { completeAssignedSession, recordAssignedActivity } from '../../lib/assignment-tracking';
import { ArrowLeft, ArrowRight, Heart, Lightbulb } from 'lucide-react';
import { ReportExerciseButton } from '../report-exercise-button';
import {
  useSpanishVoices,
  useTaskMotion,
  shuffledOptions,
  playFeedbackSound,
  playCelebrationSound,
  ViewHead,
  CatHouse,
  CatPeek,
  CatMascot,
  PawProgress,
  AccentKeys,
} from './shared';
import { useSitePreferences } from '../../hooks/site-preferences';
import type { CatState, LessonState } from '../../types/learning';
import {
  useLessonProgress,
  useLearnedWordsDb,
  useContentFavorites,
  recordLearningEvent,
  recordAchievementEvent,
  recordError,
} from '../../lib/learning-runtime';
import { lessonCoreVocabulary } from '../../data/lesson-vocabulary';

export function LessonsView() {
  const { speakText } = useSpanishVoices(),
    { preferences } = useSitePreferences();
  const [lessonIndex, setLessonIndex] = useState(0),
    [mode, setMode] = useState<'theory' | 'practice'>('theory'),
    [theoryBlockIndex, setTheoryBlockIndex] = useState(0),
    [theoryTocOpen, setTheoryTocOpen] = useState(false),
    [question, setQuestion] = useState(0),
    [answer, setAnswer] = useState(''),
    [typedAnswer, setTypedAnswer] = useState(''),
    [selectedWords, setSelectedWords] = useState<number[]>([]),
    [catState, setCatState] = useState<CatState>('neutral'),
    [lessonHintVisible, setLessonHintVisible] = useState(false),
    [mistakeMode, setMistakeMode] = useState(false),
    [mistakeQueue, setMistakeQueue] = useState<number[]>([]);
  const { leaving, move } = useTaskMotion(),
    answerLock = useRef(false),
    lessonShownAt = useRef(Date.now()),
    lessonHintUsed = useRef(false),
    lessonWorkspaceRef = useRef<HTMLDivElement>(null);
  const { progress, save } = useLessonProgress(),
    { words: learnedWordDb, studyLesson, studyLessons } = useLearnedWordsDb(),
    { items: contentFavorites, toggle: toggleContentFavorite } =
      useContentFavorites();
  const lesson = courseLessons[lessonIndex],
    lessonState = progress[lesson.id] || {
      done: 0,
      completed: false,
      correct: 0,
      errors: [],
    },
    exerciseIndex = mistakeMode ? (mistakeQueue[question] ?? 0) : question,
    exercise = lesson.exercises[exerciseIndex],
    lessonAnswerIsCorrect = (value: string) =>
      matchesAnswerVariant(value, exercise.answer, exercise.acceptedAnswers),
    submittedAnswerCorrect = !!answer && lessonAnswerIsCorrect(answer),
    exerciseId = `${normalizeText(exercise?.prompt || '')}::${normalizeText(exercise?.answer || '')}`,
    completedCount = courseLessons.filter(
      (item) => progress[item.id]?.completed,
    ).length,
    displayedOptions = shuffledOptions(
      exercise.options || [],
      `${lesson.id}-${exerciseIndex}`,
    ),
    orderedAnswer = selectedWords
      .map((index) => displayedOptions[index])
      .join(' '),
    exerciseTotal = mistakeMode ? mistakeQueue.length : lesson.exercises.length,
    savedErrorIndexes = [
      ...(lessonState.errorIds || [])
        .map((id) =>
          lesson.exercises.findIndex(
            (item) => `${normalizeText(item.prompt)}::${normalizeText(item.answer)}` === id,
          ),
        )
        .filter((index) => index >= 0),
      ...(lessonState.errorIds?.length ? [] : lessonState.errors || []),
    ].filter((index, position, list) => list.indexOf(index) === position),
    lessonWordCount = learnedWordDb.filter(
      (word) => word.lessonId === lesson.id,
    ).length;
  useEffect(() => {
    const focusRequestedLesson = () => {
      const requestedLessonId = sessionStorage.getItem('ritmo-focus-lesson-id'),
        requestedTheoryIndex = Number(
          sessionStorage.getItem('ritmo-focus-theory-index'),
        ),
        requestedIndex = requestedLessonId
          ? courseLessons.findIndex((item) => item.id === requestedLessonId)
          : -1,
        shouldFocusFirst =
          sessionStorage.getItem('ritmo-focus-first-lesson') === 'true';
      if (requestedIndex < 0 && !shouldFocusFirst) return;
      if (requestedIndex >= 0) setLessonIndex(requestedIndex);
      if (requestedLessonId && sessionStorage.getItem('ritmo-assignment-fresh-lesson-id') === requestedLessonId) setQuestion(0);
      if (
        requestedIndex >= 0 &&
        Number.isInteger(requestedTheoryIndex) &&
        requestedTheoryIndex >= 0 &&
        requestedTheoryIndex < courseLessons[requestedIndex].theory.length
      )
        setTheoryBlockIndex(requestedTheoryIndex);
      sessionStorage.removeItem('ritmo-focus-lesson-id');
      sessionStorage.removeItem('ritmo-focus-theory-index');
      sessionStorage.removeItem('ritmo-focus-first-lesson');
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() =>
          lessonWorkspaceRef.current?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'auto'
              : 'smooth',
            block: 'start',
          }),
        ),
      );
    };
    focusRequestedLesson();
    window.addEventListener('ritmo-global-search-focus', focusRequestedLesson);
    return () =>
      window.removeEventListener('ritmo-global-search-focus', focusRequestedLesson);
  }, []);
  const resumeIndex = (targetLesson: (typeof courseLessons)[number], state?: LessonState) => {
    if (state?.completed) return 0;
    const stableIndex = state?.lastExerciseId
      ? targetLesson.exercises.findIndex(
          (item) =>
            `${normalizeText(item.prompt)}::${normalizeText(item.answer)}` ===
            state.lastExerciseId,
        )
      : -1;
    return Math.min(
      stableIndex >= 0 ? stableIndex + 1 : state?.done || 0,
      targetLesson.exercises.length - 1,
    );
  };
  useEffect(() => {
    const started = courseLessons
      .filter((item) => (progress[item.id]?.done || 0) > 0)
      .filter(
        (item) =>
          learnedWordDb.filter((word) => word.lessonId === item.id).length <
          (lessonCoreVocabulary[item.id]?.length || 0),
      )
      .map((item) => ({ lessonId: item.id, lessonTitle: item.title }));
    if (started.length) studyLessons(started);
  }, [progress, learnedWordDb]);
  useEffect(() => {
    if (mode !== 'practice' || answer) return;
    setCatState('thinking');
    const timer = window.setTimeout(() => setCatState('sleeping'), 18000);
    return () => window.clearTimeout(timer);
  }, [mode, question, lessonIndex, answer]);
  useEffect(() => {
    lessonShownAt.current = Date.now();
    lessonHintUsed.current = false;
    setLessonHintVisible(false);
  }, [exerciseId, mode]);
  const record = (value: string) => {
    if (answer || answerLock.current) return;
    answerLock.current = true;
    const correct = lessonAnswerIsCorrect(value),
      storedErrors = lessonState.errors || [],
      storedErrorIds = lessonState.errorIds || [],
      nextErrors = correct
        ? storedErrors.filter((index) => index !== exerciseIndex)
        : [...new Set([...storedErrors, exerciseIndex])],
      nextErrorIds = correct
        ? storedErrorIds.filter((id) => id !== exerciseId)
        : [...new Set([...storedErrorIds, exerciseId])];
    const previousErrorHistory = Object.fromEntries(
      lessonErrorsForTeacher(lessonState, lesson.exercises, normalizeText)
        .map(({ id, ...attempt }) => [id, attempt]),
    );
    setAnswer(value);
    recordLearningInsight({
      correct,
      responseMs: Date.now() - lessonShownAt.current,
      hints: lessonHintUsed.current ? 1 : 0,
      topic: lesson.title,
      lessonId: lesson.id,
      rule: exercise.kind,
    });
    recordAssignedActivity({
      type: 'lesson', contentId: lesson.id, itemKey: exerciseId, prompt: exercise.prompt,
      studentAnswer: value, correctAnswer: exercise.answer, correct,
      score: correct ? 1 : 0,
    });
    playFeedbackSound(correct);
    if (
      preferences.autoSpeak &&
      !/^(?:верно|неверно)$/iu.test(exercise.answer.trim())
    )
      window.setTimeout(() => speakText(exercise.answer, 0.92), 180);
    setCatState(
      question === exerciseTotal - 1 ? 'love' : correct ? 'happy' : 'wrong',
    );
    save(lesson.id, {
      ...lessonState,
      contentVersion: lesson.id === 'home' ? 'prepositions-v1' : lessonState.contentVersion,
      done: mistakeMode
        ? lessonState.done
        : Math.max(lessonState.done, question + 1),
      completed:
        lessonState.completed ||
        (!mistakeMode && question === lesson.exercises.length - 1),
      correct: mistakeMode
        ? lessonState.correct
        : lessonState.correct + (correct ? 1 : 0),
      errors: nextErrors,
      errorIds: nextErrorIds,
      errorHistory: correct ? previousErrorHistory : appendLessonError(previousErrorHistory, {
        itemKey: exerciseId, prompt: exercise.prompt, studentAnswer: value,
        correctAnswer: exercise.answer, explanation: exercise.explanation,
        rule: exercise.kind, answeredAt: new Date().toISOString(),
      }, crypto.randomUUID()),
      lastExerciseId: mistakeMode ? lessonState.lastExerciseId : exerciseId,
    });
    recordLearningEvent(correct, correct ? 6 : 2);
    if (
      !mistakeMode &&
      question === lesson.exercises.length - 1
    ) {
      completeAssignedSession({ type: 'lesson', contentId: lesson.id, correct: lessonState.correct + (correct ? 1 : 0), total: lesson.exercises.length });
    }
    if (!mistakeMode && question === lesson.exercises.length - 1 && !lessonState.completed) {
      playCelebrationSound('finish');
      recordAchievementEvent({ type: 'lesson-complete', lessonId: lesson.id });
    }
    if (!correct)
      recordError(
        lessonIndex === 0
          ? 'ser · артикли · род'
          : lessonIndex === 1
            ? 'tener · согласование'
            : 'presente · окончания · предлоги',
      );
  };
  const startLesson = (index: number) => {
    answerLock.current = false;
    const stored = progress[courseLessons[index].id];
    setLessonIndex(index);
    setTheoryBlockIndex(0);
    setQuestion(resumeIndex(courseLessons[index], stored));
    setMode('theory');
    setMistakeMode(false);
    setMistakeQueue([]);
    setAnswer('');
    setTypedAnswer('');
    setSelectedWords([]);
    setCatState('neutral');
    window.requestAnimationFrame(() =>
      lessonWorkspaceRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      }),
    );
  };
  const startPractice = () => {
    answerLock.current = false;
    studyLesson(lesson.id, lesson.title);
    setMode('practice');
    setMistakeMode(false);
    setMistakeQueue([]);
    const assignedFresh = sessionStorage.getItem('ritmo-assignment-fresh-lesson-id') === lesson.id;
    setQuestion(assignedFresh ? 0 : resumeIndex(lesson, lessonState));
    if (assignedFresh) sessionStorage.removeItem('ritmo-assignment-fresh-lesson-id');
    setAnswer('');
    setTypedAnswer('');
    setSelectedWords([]);
    setCatState('thinking');
    window.requestAnimationFrame(() =>
      lessonWorkspaceRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      }),
    );
  };
  const startMistakes = () => {
    const queue = savedErrorIndexes;
    if (!queue.length) return;
    answerLock.current = false;
    setMode('practice');
    setMistakeMode(true);
    setMistakeQueue(queue);
    setQuestion(0);
    setAnswer('');
    setTypedAnswer('');
    setSelectedWords([]);
    setCatState('thinking');
  };
  const next = () =>
    move(() => {
      answerLock.current = false;
      if (question === exerciseTotal - 1) {
        setMode('theory');
        setQuestion(0);
        setMistakeMode(false);
        setMistakeQueue([]);
        setCatState('love');
      } else {
        setQuestion((value) => value + 1);
        setAnswer('');
        setTypedAnswer('');
        setSelectedWords([]);
        setCatState('thinking');
      }
    });
  const helperText =
    catState === 'happy'
      ? 'Мяу! Верно — лапка в копилку.'
      : catState === 'wrong'
        ? `Почти! ${exercise?.hint || 'Посмотри на правило ещё раз.'}`
        : catState === 'sleeping'
          ? 'Я немного задремал. Нажми на ответ — и продолжим!'
          : catState === 'love'
            ? 'Урок завершён! Оба котика уже ждут новую вещь для дома.'
            : exercise?.hint || 'Я рядом и помогу, если понадобится.';
  return (
    <div className="view-stack lessons-view">
      <div className="lessons-top">
        <ViewHead
          over={`КУРС С НУЛЯ · ${courseLessons.length} УРОКОВ · ${courseLessons.reduce((sum, item) => sum + item.exercises.length, 0)} ЗАДАНИЙ`}
          title="Испанский вместе с котиками"
          copy="После теории — смешанные задания: свободный ввод, сборка фраз, верно/неверно и варианты в случайном порядке."
        />
        <CatHouse level={completedCount} />
      </div>
      <div className="course-cards">
        {courseLessons.map((item, index) => {
          const state = progress[item.id] || {
            done: 0,
            completed: false,
            correct: 0,
          };
          return (
            <button
              className={lessonIndex === index ? 'active' : ''}
              onClick={() => startLesson(index)}
              key={item.id}
            >
              <CatPeek
                state={
                  state.completed ? 'love' : state.done ? 'happy' : 'neutral'
                }
              />
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
              <div
                className="course-card-progress"
                role="progressbar"
                aria-label={`Выполнено ${state.done} из ${item.exercises.length}`}
                aria-valuemin={0}
                aria-valuemax={item.exercises.length}
                aria-valuenow={Math.min(state.done, item.exercises.length)}
              >
                <i>
                  <span style={{ width: `${Math.min(100, (state.done / item.exercises.length) * 100)}%` }} />
                </i>
              </div>
              <footer>
                <span>
                  {state.completed
                    ? 'Урок пройден'
                    : `${state.done} / ${item.exercises.length} заданий`}
                </span>
                <b>{item.reward}</b>
              </footer>
            </button>
          );
        })}
      </div>
      <div className="lesson-workspace" ref={lessonWorkspaceRef}>
        <header>
          <div>
            <span className="eyebrow">УРОК {lesson.number}</span>
            <h2>{lesson.title}</h2>
            <p>{lesson.subtitle}</p>
          </div>
          <div className="lesson-mode">
            <button
              className={mode === 'theory' ? 'active' : ''}
              onClick={() => {
                setMode('theory');
                setCatState('neutral');
              }}
            >
              Теория
            </button>
            <button
              className={`lesson-practice-tab ${mode === 'practice' && !mistakeMode ? 'active' : ''}`}
              onClick={startPractice}
            >
              {mode === 'theory'
                ? `Перейти к заданиям · ${lesson.exercises.length}`
                : `${lesson.exercises.length} заданий`}
            </button>
            <button
              className={mistakeMode ? 'active mistake-tab' : 'mistake-tab'}
              onClick={startMistakes}
              disabled={!savedErrorIndexes.length}
            >
              Ошибки · {savedErrorIndexes.length}
            </button>
          </div>
        </header>
        {mode === 'theory' ? (
          <div className="theory-study">
            <nav className="theory-toc" aria-label="Содержание урока">
              <header className="theory-current-rule">
                <div>
                  <span>УРОК {lesson.number} · ПРАВИЛО {theoryBlockIndex + 1} ИЗ {lesson.theory.length}</span>
                  <b>{String(theoryBlockIndex + 1).padStart(2, '0')} / {lesson.theory.length} · {lesson.theory[theoryBlockIndex]?.title}</b>
                  <i aria-hidden="true"><span style={{ width: `${((theoryBlockIndex + 1) / lesson.theory.length) * 100}%` }} /></i>
                </div>
                <button type="button" className="theory-toc-toggle" aria-expanded={theoryTocOpen} onClick={() => setTheoryTocOpen((open) => !open)}>
                  {theoryTocOpen ? 'Скрыть содержание' : `Все ${lesson.theory.length} правил`}
                </button>
              </header>
              {theoryTocOpen && <div className="theory-toc-list">
                {lesson.theory.map((block, index) => (
                  <button
                    type="button"
                    className={theoryBlockIndex === index ? 'active' : ''}
                    onClick={() => {
                      setTheoryBlockIndex(index);
                      setTheoryTocOpen(false);
                    }}
                    aria-current={theoryBlockIndex === index ? 'step' : undefined}
                    key={block.title}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <b>{block.title}</b>
                  </button>
                ))}
              </div>}
            </nav>
            <div className="theory-layout">
              <main>
                {(() => {
                  const block = lesson.theory[theoryBlockIndex] || lesson.theory[0],
                    favoriteId = `${lesson.id}-rule-${theoryBlockIndex}`;
                  return (
                    <article className="theory-block focused-theory-block" key={`${lesson.id}-${theoryBlockIndex}`}>
                      <button
                        className={
                          contentFavorites.some((item) => item.id === favoriteId)
                            ? 'save-rule active'
                            : 'save-rule'
                        }
                        onClick={() =>
                          toggleContentFavorite({
                            id: favoriteId,
                            type: 'правило',
                            title: block.title,
                            body: `${block.paragraphs[0]} · ${block.examples[0]?.[0] || ''} ${block.examples[0]?.[1] || ''}`,
                          })
                        }
                        aria-label="Сохранить правило и пример"
                      >
                        <Heart fill="currentColor" />
                      </button>
                      <span className="theory-rule-label">ПРАВИЛО {String(theoryBlockIndex + 1).padStart(2, '0')} / {lesson.theory.length}</span>
                      <h3>{block.title}</h3>
                      {block.paragraphs.map((text) => (
                        <p key={text}>{text}</p>
                      ))}
                      {block.highlight && <div className="theory-grammar-highlight">{block.highlight}</div>}
                      <div className="theory-examples">
                        {block.examples.map((example) => (
                          <div key={example[0]}>
                            <b>{example[0]}</b>
                            <small>{example[1]}</small>
                          </div>
                        ))}
                      </div>
                      {block.note && (
                        <div className="theory-note">
                          <Lightbulb />
                          <p>{block.note}</p>
                        </div>
                      )}
                    </article>
                  );
                })()}
                <div className="theory-step-navigation">
                  <button
                    type="button"
                    onClick={() => setTheoryBlockIndex((value) => Math.max(0, value - 1))}
                    disabled={theoryBlockIndex === 0}
                  >
                    <ArrowLeft /> Предыдущее
                  </button>
                  {theoryBlockIndex < lesson.theory.length - 1 ? (
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() =>
                        setTheoryBlockIndex((value) =>
                          Math.min(lesson.theory.length - 1, value + 1),
                        )
                      }
                    >
                      <span>Следующее: {lesson.theory[theoryBlockIndex + 1]?.title}</span> <ArrowRight />
                    </button>
                  ) : (
                    <button type="button" className="primary-btn" onClick={startPractice}>
                      Перейти к заданиям <ArrowRight />
                    </button>
                  )}
                </div>
              </main>
            <aside>
              <CatMascot state="neutral" />
              <h3>Совет помощника</h3>
              <p>
                Не пытайтесь запомнить всё за один раз. Прочитайте примеры
                вслух, затем сразу переходите к практике.
              </p>
              <div className="lesson-core-words">
                <span>
                  ОСНОВНЫЕ СЛОВА · {lessonWordCount}/
                  {lessonCoreVocabulary[lesson.id]?.length || 0} В БАЗЕ
                </span>
                <div>
                  {(lessonCoreVocabulary[lesson.id] || []).map((word) => (
                    <b key={word.es} title={word.ru}>
                      {word.es}
                    </b>
                  ))}
                </div>
                <small>
                  При начале практики сохраняются именно эти слова, а не все
                  слова из примеров.
                </small>
              </div>
              <button className="primary-btn lesson-practice-cta" onClick={startPractice}>
                Перейти к {lesson.exercises.length} заданиям <ArrowRight />
              </button>
            </aside>
            </div>
          </div>
        ) : (
          <div className="exercise-layout">
            <main
              className={`lesson-exercise task-swap ${leaving ? 'leaving' : ''}`}
              key={`${lesson.id}-${exerciseIndex}`}
            >
              <ReportExerciseButton
                id={`lesson:${lesson.id}:${normalizeText(exercise.prompt)}:${normalizeText(exercise.answer)}`}
                section={`Урок ${lesson.number}: ${lesson.title}`}
                prompt={exercise.prompt}
                answer={exercise.answer}
                options={exercise.options}
                learningContext={{ type: 'lesson', contentId: lesson.id }}
              />
              <header>
                <button
                  onClick={() => {
                    setMode('theory');
                    setMistakeMode(false);
                    setCatState('neutral');
                  }}
                >
                  <ArrowLeft /> К теории
                </button>
                <span>
                  {mistakeMode ? 'Работа над ошибкой' : exercise.kind}
                </span>
                <b>
                  {question + 1} / {exerciseTotal}
                </b>
              </header>
              <PawProgress done={question + 1} total={exerciseTotal} />
              <div className="exercise-prompt">
                <small>
                  {exercise.mode === 'type'
                    ? 'НАПИШИТЕ ОТВЕТ'
                    : exercise.mode === 'order'
                      ? 'СОБЕРИТЕ ФРАЗУ'
                      : exercise.mode === 'truefalse'
                        ? 'ПРОВЕРЬТЕ УТВЕРЖДЕНИЕ'
                        : 'ВЫБЕРИТЕ ОТВЕТ'}
                </small>
                <h3>{exercise.prompt}</h3>
                {exercise.mode === 'type' ? (
                  <div className="answer-entry-with-keys">
                    <div className="type-answer">
                      <input
                        value={typedAnswer}
                        onChange={(event) => {
                          setTypedAnswer(event.target.value);
                          if (!answer) setCatState('thinking');
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && typedAnswer)
                            record(typedAnswer);
                        }}
                        placeholder="Введите ответ без вариантов…"
                        disabled={!!answer}
                      />
                      <button
                        onClick={() => record(typedAnswer)}
                        disabled={!typedAnswer.trim() || !!answer}
                      >
                        Проверить
                      </button>
                    </div>
                    <AccentKeys value={typedAnswer} onChange={setTypedAnswer} />
                  </div>
                ) : exercise.mode === 'order' ? (
                  <div className="order-builder">
                    <div className="assembled-phrase">
                      {selectedWords.length ? (
                        selectedWords.map((index) => (
                          <button
                            onClick={() =>
                              !answer &&
                              setSelectedWords((words) =>
                                words.filter((item) => item !== index),
                              )
                            }
                            disabled={!!answer}
                            key={index}
                          >
                            {displayedOptions[index]}
                          </button>
                        ))
                      ) : (
                        <span>Фраза появится здесь…</span>
                      )}
                    </div>
                    <div className="word-bank">
                      {displayedOptions.map((option, index) => (
                        <button
                          onClick={() =>
                            setSelectedWords((words) => [...words, index])
                          }
                          disabled={!!answer || selectedWords.includes(index)}
                          key={`${option}-${index}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <button
                      className="check-order"
                      onClick={() => record(orderedAnswer)}
                      disabled={
                        selectedWords.length !== displayedOptions.length ||
                        !!answer
                      }
                    >
                      Проверить фразу
                    </button>
                  </div>
                ) : (
                  <div className="lesson-options">
                    {displayedOptions.map((option, index) => (
                      <button
                        className={
                          answer === option
                            ? normalizeText(option) ===
                              normalizeText(exercise.answer)
                              ? 'correct'
                              : 'wrong'
                            : answer &&
                                normalizeText(option) ===
                                  normalizeText(exercise.answer)
                              ? 'correct ghost'
                              : ''
                        }
                        onClick={() => record(option)}
                        disabled={!!answer}
                        key={`${option}-${index}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                {!answer && (
                  <button
                    className="dont-know"
                    onClick={() => record('__не знаю__')}
                  >
                    Не знаю — показать ответ
                  </button>
                )}
                {answer && (
                  <div
                    className={
                      submittedAnswerCorrect
                        ? 'lesson-result correct'
                        : 'lesson-result wrong'
                    }
                  >
                    <b>
                      {submittedAnswerCorrect
                        ? 'Верно!'
                        : 'Нужно исправить'}
                    </b>
                    <p>{exercise.explanation}</p>
                    {submittedAnswerCorrect && (
                      <strong className="word-assembled">
                        {exercise.answer}
                      </strong>
                    )}
                    {hasOnlySpanishMarkDifference(answer, exercise.answer) && (
                      <small className="soft-spelling">
                        Ответ засчитан. Проверьте ударение или букву ñ в
                        образце.
                      </small>
                    )}
                    {!submittedAnswerCorrect && (
                      <code>{exercise.answer}</code>
                    )}
                    <button onClick={next}>
                      {question === exerciseTotal - 1
                        ? mistakeMode
                          ? 'Завершить работу над ошибками'
                          : 'Завершить урок'
                        : 'Следующее задание'}{' '}
                      <ArrowRight />
                    </button>
                  </div>
                )}
              </div>
            </main>
            <aside className="cat-helper">
              <CatMascot state={catState} />
              <div>
                <span>КОТ-ПОМОЩНИК</span>
                <p>{helperText}</p>
                {!answer && (
                  <small className="lesson-hint-control">
                    <button type="button" onClick={() => {
                      lessonHintUsed.current = true;
                      setLessonHintVisible((value) => !value);
                    }} aria-expanded={lessonHintVisible}>
                      <Lightbulb /> {lessonHintVisible ? 'Скрыть подсказку' : 'Показать подсказку'}
                    </button>
                    {lessonHintVisible && <span>{exercise.hint}</span>}
                  </small>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
