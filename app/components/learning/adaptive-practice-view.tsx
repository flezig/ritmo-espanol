'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  analyzeAnswer,
  baseCardKey,
  hasOnlySpanishMarkDifference,
  normalizeText,
  type AnswerAnalysis,
  type ReviewGrade,
} from '../../lib/learning-core';
import {
  parsePracticeSnapshot,
  reconcilePracticeCards,
  shouldAutoResumePractice,
} from '../../lib/practice-session';
import { vocabularyBrowseTopics } from '../../vocabulary';
import { makeSingleWordCorrection } from '../../lib/practice-content';
import {
  beginAssignedSession,
  completeAssignedSession,
  recordAssignedActivity,
} from '../../lib/assignment-tracking';
import { trackLocalEvent } from '../../lib/local-analytics';
import { recordLearningInsight, type LearningSkill } from '../../lib/learning-insights';
import { deleA2TopicName } from '../../dele-a2-vocabulary';
import { ArrowRight, Check, Heart, Settings, Volume2 } from 'lucide-react';
import { ReportExerciseButton } from '../report-exercise-button';
import type { SessionMode, StudyCard, PracticeLevel, PracticeCollection, PracticeProgressBaseline, SavedPracticeSession } from '../../types/learning';
import {
  useCustomWords,
  useSRS,
  useWordSessions,
  recordLearningEvent,
  recordAchievementEvent,
  recordError,
  skillLabels,
} from '../../lib/learning-runtime';
import {
  useSpanishVoices,
  useTaskMotion,
  shuffledOptions,
  playFeedbackSound,
  playCelebrationSound,
  ViewHead,
  DeleA2SourceNote,
  ClockBadge,
  CatMascot,
  CatPeek,
  voiceDisplayName,
  ReportExampleButton,
  AccentKeys,
  SpellingDiff,
} from './shared';
import { useSitePreferences } from '../../hooks/site-preferences';
import {
  newPracticeSessionId,
  buildSession,
  topicDeck,
  capturePracticeBaseline,
  controlledDictationSentence,
  responseKindFor,
  maskedSpanishWord,
  choicesFor,
  restorePracticeBaseline,
  adjustedGradeForEvidence,
  studyExamples,
  practiceTopics,
  readyWordsLabel,
  reviewReason,
  practiceFormatReason,
  dueLabel,
} from '../../lib/practice-engine';
import {
  makeStudyDeck,
  wordWasStudied,
  spanishStudyAnswer,
  definiteArticleFor,
} from '../../lib/study-deck';
import { ReviewCalendar } from './review-calendar';

export function AdaptivePracticeView({ showModes, assignedMode, assignedTopic }: { showModes: () => void; assignedMode: SessionMode | null; assignedTopic: string | null }) {
  const { words: customWords, hydrated: customHydrated } = useCustomWords(),
    { records, rate, toggleFavorite, markNew, markLearned, hydrated: srsHydrated } = useSRS();
  const { voices, voiceIndex, setVoiceIndex, speakText, voiceError } = useSpanishVoices();
  const { sessions: wordSessions, record: recordWordSessionProgress } = useWordSessions();
  const { leaving, move } = useTaskMotion(),
    { preferences } = useSitePreferences();
  const [deck, setDeck] = useState<StudyCard[]>([]),
    [mode, setMode] = useState<SessionMode>('five'),
    [level, setLevel] = useState<PracticeLevel>('A1–A2'),
    [collection, setCollection] = useState<PracticeCollection>('topics'),
    [topic, setTopic] = useState('Все темы'),
    [scopeSelection, setScopeSelection] = useState<{
      level: PracticeLevel;
      collection: PracticeCollection;
      topic: string;
    }>({ level: 'A1–A2', collection: 'topics', topic: 'Все темы' }),
    [session, setSession] = useState<StudyCard[]>([]),
    [index, setIndex] = useState(0),
    [typed, setTyped] = useState(''),
    [revealed, setRevealed] = useState(false),
    [correct, setCorrect] = useState(false),
    [analysis, setAnalysis] = useState<AnswerAnalysis | null>(null),
    [audioTarget, setAudioTarget] = useState<'word' | 'sentence'>('word'),
    [orderedWords, setOrderedWords] = useState<string[]>([]),
    [finished, setFinished] = useState(false),
    [introduced, setIntroduced] = useState<Record<string, boolean>>({}),
    [sessionErrors, setSessionErrors] = useState(0),
    [now, setNow] = useState(() => Date.now()),
    [sessionHydrated, setSessionHydrated] = useState(false),
    [scopeOpen, setScopeOpen] = useState(false),
    [awaitingStart, setAwaitingStart] = useState(true),
    [sessionBaseline, setSessionBaseline] = useState<PracticeProgressBaseline | null>(null);
  const [sessionId, setSessionId] = useState(newPracticeSessionId);
  const assignedStarted = useRef(false);
  const answerLock = useRef(false),
    gradeLock = useRef(false),
    cardShownAt = useRef(Date.now()),
    answerDuration = useRef(0),
    inputEdits = useRef(0),
    reasonHelpRef = useRef<HTMLDetailsElement>(null),
    moreActionsRef = useRef<HTMLDetailsElement>(null);
  const deckReady = customHydrated && deck.length > 0;
  useEffect(() => {
    if (!customHydrated) return;
    setDeck([]);
    const timer = window.setTimeout(() => setDeck(makeStudyDeck(customWords)), 0);
    return () => window.clearTimeout(timer);
  }, [customHydrated, customWords]);
  useEffect(() => {
    if (!deckReady || sessionHydrated) return;
    try {
      const saved = parsePracticeSnapshot(localStorage.getItem('ritmo-practice-session')) as SavedPracticeSession | null;
      if (
        (saved?.version === 2 || saved?.version === 3 || saved?.version === 4 || saved?.version === 5) &&
        Array.isArray(saved.session) &&
        typeof saved.index === 'number'
      ) {
        const savedMode =
          saved.mode === 'fifteen' || saved.mode === 'weak'
            ? 'five'
            : saved.mode;
        setMode(savedMode);
        setLevel(saved.level || (vocabularyBrowseTopics.find((item) => item.name === saved.topic)?.level ?? 'A1–A2'));
        const legacyLessonCollection = saved.topic === 'Уроки A1';
        const savedCollection = legacyLessonCollection
          ? 'lessons'
          : saved.collection ||
            (/^Unidad\s/iu.test(saved.topic) || saved.topic === 'Все unidades'
              ? 'units'
              : 'topics');
        const savedTopic = legacyLessonCollection ? 'Все уроки' : saved.topic;
        setCollection(savedCollection);
        setTopic(savedTopic);
        setScopeSelection({
          level: saved.level || (vocabularyBrowseTopics.find((item) => item.name === saved.topic)?.level ?? 'A1–A2'),
          collection: savedCollection,
          topic: savedTopic,
        });
        if (shouldAutoResumePractice(saved)) {
          const {
            session: synchronizedSession,
            index: safeIndex,
            contentChanged,
          } = reconcilePracticeCards(saved.session, saved.index, deck);
          setSession(synchronizedSession);
          setIndex(safeIndex);
          setTyped(contentChanged ? '' : saved.typed || '');
          setRevealed(contentChanged ? false : !!saved.revealed);
          setCorrect(contentChanged ? false : !!saved.correct);
          setAnalysis(contentChanged ? null : saved.analysis || null);
          setAudioTarget(saved.audioTarget || 'word');
          setOrderedWords(
            Array.isArray(saved.orderedWords) ? saved.orderedWords : [],
          );
          setFinished(!!saved.finished);
          setIntroduced(saved.introduced || {});
          setSessionErrors(Number(saved.sessionErrors) || 0);
          setAwaitingStart(false);
          setSessionBaseline(saved.baseline || null);
          setSessionId(saved.sessionId || newPracticeSessionId());
        } else {
          setSession([]);
          setIndex(0);
          setTyped('');
          setRevealed(false);
          setCorrect(false);
          setAnalysis(null);
          setOrderedWords([]);
          setFinished(false);
          setIntroduced({});
          setSessionErrors(0);
          setAwaitingStart(true);
          setSessionBaseline(null);
        }
      }
    } catch {}
    setSessionHydrated(true);
  }, [deck, deckReady, sessionHydrated]);
  useEffect(() => {
    if (!sessionHydrated) return;
    const saved: SavedPracticeSession = {
      version: 5,
      mode,
      level,
      collection,
      topic,
      session,
      index,
      typed,
      revealed,
      correct,
      analysis,
      audioTarget,
      orderedWords,
      finished,
      introduced,
      sessionErrors,
      awaitingStart,
      baseline: sessionBaseline,
      sessionId,
    };
    localStorage.setItem('ritmo-practice-session', JSON.stringify(saved));
    window.dispatchEvent(new Event('ritmo-cloud-progress-changed'));
  }, [
    sessionHydrated,
    mode,
    level,
    collection,
    topic,
    session,
    index,
    typed,
    revealed,
    correct,
    analysis,
    audioTarget,
    orderedWords,
    finished,
    introduced,
    sessionErrors,
    awaitingStart,
    sessionBaseline,
    sessionId,
  ]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!sessionHydrated || !srsHydrated || session.length || finished || awaitingStart) return;
    const ready = buildSession(
      topicDeck(makeStudyDeck(customWords), level, topic, collection),
      records,
      mode,
    );
    if (ready.length) {
      setSessionBaseline(capturePracticeBaseline(ready));
      setSession(ready);
    }
  }, [
    now,
    mode,
    level,
    collection,
    topic,
    records,
    session.length,
    finished,
    customWords,
    sessionHydrated,
    srsHydrated,
    awaitingStart,
  ]);
  const scopedDeck = useMemo(
      () => topicDeck(deck, level, topic, collection),
      [deck, level, topic, collection],
    ),
    selectedScopedDeck = useMemo(
      () => topicDeck(deck, scopeSelection.level, scopeSelection.topic, scopeSelection.collection),
      [deck, scopeSelection.level, scopeSelection.topic, scopeSelection.collection],
    ),
    card = session[index],
    cardBase = card ? baseCardKey(card.key) : '',
    isIntroduction =
      !!card && !wordWasStudied(card, records) && !introduced[cardBase],
    dictationSentence = card
      ? controlledDictationSentence(card, scopedDeck, records, wordSessions)
      : '',
    displayedHeadword = card
      ? spanishStudyAnswer(card.es, card.ru, card.example, card.extraExample || '')
      : '',
    requiresArticle = !!card && displayedHeadword !== card.es,
    responseKind = card
      ? responseKindFor(card, index, records[card.key], !!dictationSentence)
      : 'type',
    correctionTask =
      card && responseKind === 'correction'
        ? makeSingleWordCorrection(card)
        : null,
    expectedAnswer =
      !card
        ? ''
        : responseKind === 'letters'
          ? displayedHeadword.split(' / ')[0]
          : responseKind === 'phrase'
            ? card.answer
            : responseKind === 'correction'
              ? correctionTask?.answer || card.answer
              : responseKind === 'audioWord'
                ? card.answer
              : responseKind === 'audioSentence'
                ? dictationSentence
              : card.answer,
    taskPrompt =
      !card
        ? ''
        : responseKind === 'letters'
          ? `Восстановите слово целиком вместе с артиклем: ${maskedSpanishWord(displayedHeadword, `${card.key}-${index}`)}`
          : responseKind === 'phrase'
            ? card.skill === 'recognition'
              ? `Как переводится «${card.es}» в этом предложении: ${card.example}`
              : card.skill === 'production'
                ? `Напишите по-испански «${card.ru}» для контекста: ${card.exampleRu || card.ru}`
                : card.prompt
              : responseKind === 'correction'
              ? `Найдите ошибку и напишите только исправленное слово: ${correctionTask?.sentence || card.example}`
              : responseKind === 'audioWord'
                ? 'Прослушайте слово и напишите его перевод'
              : responseKind === 'audioSentence'
                ? 'Прослушайте предложение и напишите его полностью. Все существительные пишите с артиклем'
                : card.prompt,
    orderTokens =
      card && responseKind === 'order'
        ? shuffledOptions(
            card.answer
              .trim()
              .split(/\s+/)
              .map((word, wordIndex) => `${wordIndex}::${word}`),
            `${card.key}-${index}-order`,
          )
        : [],
    options = useMemo(
      () =>
        card
          ? shuffledOptions(choicesFor(card, scopedDeck), `${card.key}-${index}`)
          : [],
      [card, scopedDeck, index],
    );
  useEffect(() => {
    cardShownAt.current = Date.now();
    answerDuration.current = 0;
    inputEdits.current = 0;
  }, [card?.key, isIntroduction]);
  const { due, errorCount, waitingErrors, favorites } = useMemo(() => {
    const allErrors = selectedScopedDeck.filter(
      (item) =>
        records[item.key]?.reviews &&
        (records[item.key].lapses > 0 ||
          records[item.key].lastGrade === 'again'),
    );
    const readyErrors = allErrors.filter(
      (item) => records[item.key].nextReview <= now,
    ).length;
    return {
      due: selectedScopedDeck.filter(
        (item) =>
          records[item.key]?.reviews && records[item.key].nextReview <= now,
      ).length,
      errorCount: readyErrors,
      waitingErrors: allErrors.length - readyErrors,
      favorites: selectedScopedDeck.filter((item) => records[item.key]?.favorite)
        .length,
    };
  }, [selectedScopedDeck, records, now]);
  const start = (
    nextMode: SessionMode,
    nextTopic = scopeSelection.topic,
    nextLevel = scopeSelection.level,
    requestedCollection = scopeSelection.collection,
  ) => {
    beginAssignedSession('practice', `words:${nextMode}`, nextTopic);
    if (!deckReady) return;
    answerLock.current = false;
    gradeLock.current = false;
    const nextDeck = topicDeck(deck, nextLevel, nextTopic, requestedCollection),
      nextSession = buildSession(nextDeck, records, nextMode);
    setMode(nextMode);
    setLevel(nextLevel);
    const nextCollection: PracticeCollection = requestedCollection;
    setCollection(nextCollection);
    setTopic(nextTopic);
    setScopeSelection({ level: nextLevel, collection: nextCollection, topic: nextTopic });
    setSession(nextSession);
    setIndex(0);
    setTyped('');
    setRevealed(false);
    setCorrect(false);
    setAnalysis(null);
    setOrderedWords([]);
    setFinished(false);
    setIntroduced({});
    setSessionErrors(0);
    setNow(Date.now());
    setScopeOpen(false);
    setAwaitingStart(false);
    setSessionBaseline(capturePracticeBaseline(nextSession));
    setSessionId(newPracticeSessionId());
    trackLocalEvent('practice_started', nextTopic);
  };
  const applyScopeSelection = (next: {
    level: PracticeLevel;
    collection: PracticeCollection;
    topic: string;
  }) => {
    setScopeSelection(next);
    if (!awaitingStart) start(mode, next.topic, next.level, next.collection);
  };
  useEffect(() => {
    if (!assignedMode || !deckReady || !sessionHydrated || assignedStarted.current) return;
    assignedStarted.current = true;
    start(assignedMode, assignedTopic || topic);
  }, [assignedMode, assignedTopic, deckReady, sessionHydrated]);
  const leaveSessionWithoutSaving = () => {
    if (
      sessionBaseline &&
      !window.confirm(
        'Выйти к выбору сессии? Результаты этой незавершённой сессии не сохранятся.',
      )
    ) return;
    if (sessionBaseline) restorePracticeBaseline(sessionBaseline);
    const selectionState: SavedPracticeSession = {
      version: 5,
      mode,
      level,
      topic,
      session: [],
      index: 0,
      typed: '',
      revealed: false,
      correct: false,
      analysis: null,
      audioTarget: 'word',
      orderedWords: [],
      finished: false,
      introduced: {},
      sessionErrors: 0,
      awaitingStart: true,
      baseline: null,
      sessionId: newPracticeSessionId(),
    };
    localStorage.setItem(
      'ritmo-practice-session',
      JSON.stringify(selectionState),
    );
    window.dispatchEvent(new Event('ritmo-cloud-progress-changed'));
    answerLock.current = false;
    gradeLock.current = false;
    setSession([]);
    setIndex(0);
    setTyped('');
    setRevealed(false);
    setCorrect(false);
    setAnalysis(null);
    setOrderedWords([]);
    setFinished(false);
    setIntroduced({});
    setSessionErrors(0);
    setSessionBaseline(null);
    setSessionId(newPracticeSessionId());
    setAwaitingStart(true);
    setScopeOpen(false);
  };
  const speak = (
    speed = 1,
    target = responseKind === 'audioSentence'
      ? 'sentence'
      : 'word',
  ) => {
    if (card)
      speakText(
        target === 'word'
          ? card.skill === 'dictation'
            ? card.answer.split(' / ')[0]
            : displayedHeadword.split(' / ')[0]
          : dictationSentence,
        speed,
      );
  };
  useEffect(() => {
    if (card && isIntroduction && preferences.autoSpeak)
      speakText(card.es.split(' / ')[0], 1);
  }, [cardBase, isIntroduction, voiceIndex, voices.length, preferences.autoSpeak]);
  const check = (value: string) => {
    if (!value.trim() || !card || revealed || answerLock.current) return;
    answerLock.current = true;
    answerDuration.current = Date.now() - cardShownAt.current;
    const result = analyzeAnswer(value, expectedAnswer),
      isCorrect = result.correct;
    recordAssignedActivity({
      type: 'practice', contentId: `words:${mode}`, topicId: topic, itemKey: cardBase, prompt: taskPrompt,
      studentAnswer: value, correctAnswer: expectedAnswer,
      correct: isCorrect, score: isCorrect ? 1 : 0,
    });
    setTyped(value);
    setCorrect(isCorrect);
    setAnalysis(result);
    setRevealed(true);
    playFeedbackSound(isCorrect);
    recordLearningEvent(isCorrect, isCorrect ? 6 : 2);
    if (
      isCorrect &&
      (card.skill === 'listening' ||
        card.skill === 'dictation' ||
        responseKind === 'audioWord' ||
        responseKind === 'audioSentence')
    )
      recordAchievementEvent({ type: 'listening-correct' });
    if (!isCorrect) {
      setSessionErrors((value) => value + 1);
      recordError(skillLabels[card.skill]);
    }
  };
  const revealSelf = () => {
    if (revealed || answerLock.current) return;
    answerLock.current = true;
    answerDuration.current = Date.now() - cardShownAt.current;
    setCorrect(true);
    setRevealed(true);
  };
  const dontKnow = () => {
    if (!card || revealed || answerLock.current) return;
    answerLock.current = true;
    answerDuration.current = Date.now() - cardShownAt.current;
    recordAssignedActivity({
      type: 'practice', contentId: `words:${mode}`, topicId: topic, itemKey: cardBase, prompt: taskPrompt,
      studentAnswer: 'Не знаю', correctAnswer: expectedAnswer, correct: false,
    });
    setTyped('');
    setCorrect(false);
    setAnalysis({
      correct: false,
      kind: 'wrong',
      message: 'Вы выбрали «Не знаю». Карточка вернётся раньше для повторения.',
    });
    setRevealed(true);
    playFeedbackSound(false);
    setSessionErrors((value) => value + 1);
    recordLearningEvent(false, 1);
    recordError(skillLabels[card.skill]);
  };
  const grade = (value: ReviewGrade) => {
    if (!card || leaving || finished || gradeLock.current) return;
    gradeLock.current = true;
    if (responseKind === 'self') {
      const remembered = value === 'good' || value === 'easy';
      recordAssignedActivity({
        type: 'practice', contentId: `words:${mode}`, topicId: topic, itemKey: cardBase, prompt: taskPrompt,
        studentAnswer: value === 'again' ? 'Не помню' : value === 'hard' ? 'Трудно' : value === 'good' ? 'Хорошо' : 'Легко',
        correctAnswer: expectedAnswer, correct: remembered, score: remembered ? 1 : 0,
      });
    }
    move(() => {
      const answerWasCorrect = responseKind === 'self'
        ? value === 'good' || value === 'easy'
        : correct;
      const insightSkill: LearningSkill =
        responseKind === 'audioSentence' || card.skill === 'dictation'
          ? 'dictation'
          : responseKind === 'audioWord' || card.skill === 'listening'
            ? 'listening'
            : card.skill === 'recognition'
              ? 'translation'
              : 'production';
      recordLearningInsight({
        correct: answerWasCorrect,
        responseMs: answerDuration.current || Date.now() - cardShownAt.current,
        skill: insightSkill,
        topic: card.topic,
      });
      const applied = adjustedGradeForEvidence(
        responseKind !== 'self' && !correct ? 'again' : value,
        responseKind,
        answerWasCorrect,
        answerDuration.current || Date.now() - cardShownAt.current,
        inputEdits.current,
      );
      rate(card, applied, { format: responseKind, correct: answerWasCorrect });
      recordWordSessionProgress(
        cardBase,
        sessionId,
        answerWasCorrect,
        answerWasCorrect && responseKind === 'audioSentence',
      );
      if (
        responseKind === 'self' &&
        (value === 'good' || value === 'easy')
      )
        recordAchievementEvent({ type: 'pronunciation-correct' });
      if (index >= session.length - 1) {
        setFinished(true);
        completeAssignedSession({ type: 'practice', contentId: `words:${mode}`, topicId: topic, correct: Math.max(0, session.length - sessionErrors), total: session.length });
        setSessionBaseline(null);
        playCelebrationSound('finish');
        recordAchievementEvent({
          type: 'practice-session',
          topic,
          perfect: sessionErrors === 0,
          mode,
          correct: Math.max(0, session.length - sessionErrors),
          total: session.length,
        });
        trackLocalEvent('practice_finished', topic);
      }
      else {
        answerLock.current = false;
        gradeLock.current = false;
        setIndex((value) => value + 1);
        setTyped('');
        setRevealed(false);
        setCorrect(false);
        setAnalysis(null);
        setOrderedWords([]);
      }
      setNow(Date.now());
    });
  };
  const resetAsNew = () => {
    if (!card) return;
    answerLock.current = false;
    gradeLock.current = false;
    markNew(card);
    setIntroduced((current) => {
      const next = { ...current };
      delete next[cardBase];
      return next;
    });
    setTyped('');
    setRevealed(false);
    setCorrect(false);
    setAnalysis(null);
    setOrderedWords([]);
  };
  const markCurrentLearned = () => {
    if (!card) return;
    markLearned(card);
    setSessionBaseline((baseline) => {
      if (!baseline) return baseline;
      try {
        const currentRecords = JSON.parse(localStorage.getItem('ritmo-srs') || '{}'),
          currentProgress = JSON.parse(localStorage.getItem('ritmo-word-progress') || '{}'),
          currentHistory = JSON.parse(localStorage.getItem('ritmo-word-history') || '{}'),
          learnedKeys = Object.keys(currentRecords).filter(
            (key) => baseCardKey(key) === cardBase,
          );
        return {
          ...baseline,
          srs: {
            ...baseline.srs,
            ...Object.fromEntries(learnedKeys.map((key) => [key, currentRecords[key]])),
          },
          wordProgress: { ...baseline.wordProgress, [cardBase]: currentProgress[cardBase] },
          wordHistory: { ...baseline.wordHistory, [cardBase]: currentHistory[cardBase] },
          achievementStats: localStorage.getItem('ritmo-achievement-stats'),
          achievementUnlocks: localStorage.getItem('ritmo-achievements'),
          latestAchievement: localStorage.getItem('ritmo-latest-achievement'),
        };
      } catch {
        return baseline;
      }
    });
    const nextIndex = session
      .slice(0, index)
      .filter((item) => baseCardKey(item.key) !== cardBase).length;
    const remaining = session.filter(
      (item) => baseCardKey(item.key) !== cardBase,
    );
    answerLock.current = false;
    gradeLock.current = false;
    setSession(remaining);
    setTyped('');
    setRevealed(false);
    setCorrect(false);
    setAnalysis(null);
    setOrderedWords([]);
    setIndex(nextIndex);
    if (!remaining.length || nextIndex >= remaining.length) {
      setIndex(Math.max(0, remaining.length - 1));
      setFinished(true);
      setSessionBaseline(null);
    }
  };
  const audio =
      card &&
      (card.skill === 'listening' ||
        card.skill === 'dictation' ||
        responseKind === 'audioWord' ||
        responseKind === 'audioSentence'),
    examples = card ? studyExamples(card) : [];
  const needsSpanishKeys = /[a-záéíóúüñ¿¡]/i.test(expectedAnswer);
  const closePracticePopovers = () => {
    if (reasonHelpRef.current) reasonHelpRef.current.open = false;
    if (moreActionsRef.current) moreActionsRef.current.open = false;
  };
  return (
    <div
      className={`view-stack srs-view ${card && !finished ? 'active-exercise' : ''}`}
    >
      <ViewHead
        over="АДАПТИВНОЕ ПОВТОРЕНИЕ · СНАЧАЛА ЗНАКОМСТВО"
        title="Слово сначала понятно — потом проверяется."
        copy="Короткая адаптивная тренировка смешивает повторения, ошибки и новый материал."
      />
      {scopeSelection.topic === deleA2TopicName && <DeleA2SourceNote />}
      <section className={`practice-topic-bar ${scopeOpen ? 'open' : ''}`}>
        <button
          className="practice-scope-toggle"
          type="button"
          aria-expanded={scopeOpen}
          onClick={() => setScopeOpen((value) => !value)}
        >
          {scopeSelection.collection === 'units'
            ? 'Unidades'
            : scopeSelection.collection === 'lessons'
              ? 'Уроки'
              : scopeSelection.level} ·{' '}
          {scopeSelection.topic}{' '}
          <span>{scopeOpen ? 'Закрыть' : 'Сменить'}</span>
        </button>
        <div className="practice-collection-tabs" aria-label="Способ выбора слов">
          <span>КОЛЛЕКЦИЯ</span>
          <div>
            <button
              type="button"
              className={scopeSelection.collection === 'topics' ? 'active' : ''}
              onClick={() => {
                applyScopeSelection({
                  level: scopeSelection.level,
                  collection: 'topics',
                  topic: 'Все темы',
                });
              }}
            >
              Темы
            </button>
            <button
              type="button"
              className={scopeSelection.collection === 'units' ? 'active' : ''}
              onClick={() => {
                applyScopeSelection({
                  collection: 'units',
                  level: 'A1–A2',
                  topic: 'Все unidades',
                });
              }}
            >
              Unidades
            </button>
            <button
              type="button"
              className={scopeSelection.collection === 'lessons' ? 'active' : ''}
              onClick={() => {
                applyScopeSelection({
                  collection: 'lessons',
                  level: 'A1–A2',
                  topic: 'Все уроки',
                });
              }}
            >
              Уроки
            </button>
          </div>
        </div>
        {scopeSelection.collection === 'topics' && <div>
          <span>УРОВЕНЬ</span>
          <select
            value={scopeSelection.level}
            disabled={!deckReady}
            onChange={(event) =>
              applyScopeSelection({
                collection: 'topics',
                level: event.target.value as PracticeLevel,
                topic: 'Все темы',
              })
            }
          >
            <option>A1–A2</option>
            <option>B1–B2</option>
            <option>Все уровни</option>
          </select>
        </div>}
        <div>
          <span>
            {scopeSelection.collection === 'units'
              ? 'UNIDAD'
              : scopeSelection.collection === 'lessons'
                ? 'УРОК'
                : 'ТЕМА СЛОВ'}
          </span>
          <select
            value={scopeSelection.topic}
            disabled={!deckReady}
            onChange={(event) =>
              applyScopeSelection({
                ...scopeSelection,
                topic: event.target.value,
              })
            }
          >
            {practiceTopics(scopeSelection.level, scopeSelection.collection).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </section>
      <div className="srs-summary">
        <button
          className={!awaitingStart && mode === 'five' ? 'active' : ''}
          disabled={!deckReady}
          onClick={() => start('five')}
        >
          <ClockBadge minutes={5} />
          <span>
            <b>5 минут</b>
            <small>16 разных заданий</small>
          </span>
        </button>
        <button
          className={!awaitingStart && mode === 'errors' ? 'active' : ''}
          disabled={!deckReady}
          onClick={() => start('errors')}
        >
          <span className="session-icon">↻</span>
          <span>
            <b>Отработка ошибок</b>
            <small>
              {errorCount} готовы · {waitingErrors} ждут срока
            </small>
          </span>
        </button>
        <button
          className={!awaitingStart && mode === 'favorites' ? 'active' : ''}
          disabled={!deckReady}
          onClick={() => start('favorites')}
        >
          <span className="session-icon">♥</span>
          <span>
            <b>Избранное</b>
            <small>{favorites} в этой теме</small>
          </span>
        </button>
      </div>
      <section className="practice-session-overview">
        <strong>{readyWordsLabel(due)}</strong>
        <small>{scopeSelection.topic}</small>
        <details className="practice-session-how">
          <summary>
            Как формируется сессия <ArrowRight />
          </summary>
          <div>
            <span>Не больше четырёх новых слов за сессию.</span>
            <span>Новое слово проверяется минимум тремя способами.</span>
            <span>Одинаковые слова не показываются подряд.</span>
            <span>
              Узнавание: ручной ввод 35% · четыре варианта 30% · контекст 20%
              · аудио 15%.
            </span>
          </div>
        </details>
      </section>
      <details className="srs-timing-note">
        <summary>Почему слова появляются именно сейчас</summary>
        <p>
          «Не помню» ставит точное время через 10 минут, «Трудно» — минимум
          через 12 часов, первый ответ «Хорошо» — через 1 день, «Легко» — через
          3 дня. Затем срок растёт по истории слова. До наступления сохранённого
          времени карточка не попадёт ни в обычную сессию, ни в отработку
          ошибок. Если повторять пока нечего, сессия берёт максимум четыре новых
          слова и чередует по ним узнавание, обратный перевод, контекст,
          восстановление букв и аудирование. Каждый навык получает собственный
          срок по вашему ответу. Точная дата следующего показа указана внизу
          карточки.
        </p>
      </details>
      <ReviewCalendar records={records} />
      {finished ? (
        <article className="session-finish">
          <CatMascot state="love" />
          <div>
            <p className="eyebrow">СЕССИЯ ЗАВЕРШЕНА · {topic}</p>
            <h2>Карточки разнесены по своим срокам</h2>
            <p>
              Ошибки сохранены для отдельной тренировки. «Не помню» вернётся
              после истечения десяти минут, а не через несколько следующих
              вопросов.
            </p>
            <button className="primary-btn" onClick={() => start(mode)}>
              Ещё одна сессия <ArrowRight />
            </button>
          </div>
        </article>
      ) : !card ? (
        <article className="srs-empty">
          <CatMascot state="sleeping" />
          <h2>
            {awaitingStart
              ? 'Выберите новую сессию'
              : mode === 'favorites'
              ? 'В этой теме пока нет избранного'
              : mode === 'errors'
                ? waitingErrors
                  ? 'Ошибки ещё ждут своего срока'
                  : 'Ошибок для отработки пока нет'
                : 'Для этого режима пока нет карточек'}
          </h2>
          <p>
            {awaitingStart
              ? 'Выберите уровень, тему и формат выше. Автопродолжение включается после двух выполненных заданий.'
              : mode === 'errors'
              ? waitingErrors
                ? `Ближайшая карточка откроется по таймеру. После «Не помню» — ровно через 10 минут.`
                : 'Ошибочные ответы будут автоматически собираться здесь.'
              : 'Выберите другую тему или начните обычную сессию.'}
          </p>
          {!awaitingStart && (
            <button className="primary-btn" onClick={() => start('five')}>
              Начать 5 минут
            </button>
          )}
          <button className="secondary-btn" onClick={showModes}>Все игры</button>
        </article>
      ) : isIntroduction ? (
        <article className="word-introduction task-swap">
          <CatPeek state="happy" />
          <header>
            <div>
              <span className="new-word-badge">НОВОЕ СЛОВО</span>
              <small>{card.level && `${card.level} · `}{card.topic}</small>
            </div>
            <b>
              {index + 1} / {session.length}
            </b>
            <button className="practice-exit" onClick={leaveSessionWithoutSaving}>Сменить сессию</button>
          </header>
          <section>
            {voices.length > 1 && (
              <details className="intro-voice-setting">
                <summary>
                  <Settings />
                  Голос · {voices[voiceIndex]?.name || 'системный'}
                </summary>
                <div>
                  <select
                    value={voiceIndex}
                    onChange={(event) =>
                      setVoiceIndex(Number(event.target.value))
                    }
                    aria-label="Голос озвучивания"
                  >
                    {voices.map((voice, index) => (
                      <option value={index} key={`${voice.name}-${index}`}>
                        {voiceDisplayName(voice)}
                      </option>
                    ))}
                  </select>
                  <small>
                    Доступные голоса зависят от браузера и установленных голосов устройства.
                  </small>
                </div>
              </details>
            )}
            <div className="intro-audio-speeds">
              <button className="intro-listen" onClick={() => speak(1, 'word')}>
                <Volume2 /> Обычная скорость
              </button>
              <button className="intro-listen slow" onClick={() => speak(0.5, 'word')}>
                <Volume2 /> Медленно · 0.5×
              </button>
            </div>
            <h2>{displayedHeadword}</h2>
            <h3>{card.ru}</h3>
            {definiteArticleFor(card.es, card.example, card.extraExample || '') && (
              <small className="intro-article-note">
                Существительные учим и пишем вместе с артиклем.
              </small>
            )}
            <div className="intro-examples">
              {examples.map((example, exampleIndex) => (
                <article key={exampleIndex}>
                  <small>ПРИМЕР {exampleIndex + 1}</small>
                  <b>{example.es}</b>
                  <p>{example.ru}</p>
                  <button
                    className="example-audio"
                    onClick={() => speakText(example.es, 1)}
                    aria-label={`Прослушать пример: ${example.es}`}
                  >
                    <Volume2 /> Прослушать пример
                  </button>
                  <ReportExampleButton
                    id={`practice-${card.key}-${exampleIndex}`}
                    word={card.es}
                    example={example.es}
                    translation={example.ru}
                    source={card.topic}
                  />
                </article>
              ))}
            </div>
            <div className="intro-knowledge-choice">
              <button
                className="secondary-btn"
                onClick={() =>
                  setIntroduced((current) => ({ ...current, [cardBase]: true }))
                }
              >
                Не знаю — учить
              </button>
              <button className="primary-btn" onClick={markCurrentLearned}>
                Знаю — отметить выученным <Check />
              </button>
            </div>
          </section>
        </article>
      ) : (
        <article
          className={`srs-card diverse-card task-swap ${leaving ? 'leaving' : ''}`}
          key={card.key}
        >
          <CatPeek
            state={revealed ? (correct ? 'happy' : 'wrong') : 'thinking'}
          />
          <header>
            <div className="practice-card-heading">
              <span>{skillLabels[card.skill]}</span>
              <details
                className="practice-reason-help"
                ref={reasonHelpRef}
                onToggle={(event) => {
                  if (event.currentTarget.open && moreActionsRef.current)
                    moreActionsRef.current.open = false;
                }}
              >
                <summary
                  aria-label="Почему показано это задание"
                  title="Почему показано это задание"
                >
                  ?
                </summary>
                <div>
                  <em className="review-reason">
                    <b>Почему сейчас</b>
                    {reviewReason(records[card.key])}
                  </em>
                  <em className="format-reason">
                    <b>Почему такой формат</b>
                    {practiceFormatReason(
                      card,
                      records[card.key],
                      responseKind,
                    )}
                  </em>
                </div>
              </details>
              <small>
                {card.core ? '⭐ Ядро A1–A2 · ' : card.level ? `${card.level} · ` : ''}{card.topic} ·{' '}
                {responseKind === 'choice'
                  ? 'выбор ответа'
                  : responseKind === 'order'
                    ? 'соберите предложение'
                    : responseKind === 'letters'
                      ? 'восстановите буквы'
                      : responseKind === 'phrase'
                        ? 'слово в контексте'
                        : responseKind === 'correction'
                          ? 'исправьте ошибку'
                          : responseKind === 'audioWord'
                            ? 'слово на слух'
                            : responseKind === 'audioSentence'
                              ? 'диктант по предложению'
                      : responseKind === 'self'
                        ? 'самопроверка'
                        : 'самостоятельный ввод'}
              </small>
            </div>
            <div className="practice-card-controls">
              <b className="practice-card-progress">
                {index + 1} / {session.length}
              </b>
              <button
                className="practice-exit"
                aria-label="Сменить сессию"
                onClick={leaveSessionWithoutSaving}
              >
                <span className="practice-exit-full">Сменить сессию</span>
                <span className="practice-exit-short" aria-hidden="true">Сменить</span>
              </button>
              <details
                className="practice-more-actions"
                ref={moreActionsRef}
                onToggle={(event) => {
                  if (event.currentTarget.open && reasonHelpRef.current)
                    reasonHelpRef.current.open = false;
                }}
              >
                <summary aria-label="Другие действия" title="Другие действия">
                  •••
                </summary>
                <div>
                  <button type="button" onClick={resetAsNew}>
                    <span>↺</span>
                    <b>Отметить новым</b>
                  </button>
                  <button type="button" onClick={markCurrentLearned}>
                    <Check />
                    <b>Отметить слово выученным</b>
                  </button>
                  <button
                    type="button"
                    className={records[card.key]?.favorite ? 'active' : ''}
                    onClick={() => toggleFavorite(card)}
                  >
                    <Heart fill="currentColor" />
                    <b>
                      {records[card.key]?.favorite
                        ? 'Убрать из избранного'
                        : 'Добавить в избранное'}
                    </b>
                  </button>
                  <div className="practice-report-action">
                    <b>Сообщить о задании</b>
                    <ReportExerciseButton
                      id={`practice:${card.key}:${responseKind}:${normalizeText(taskPrompt)}`}
                      section={`Practice: ${card.topic}`}
                      prompt={taskPrompt}
                      answer={expectedAnswer}
                      options={responseKind === 'choice' ? options : undefined}
                      learningContext={{ type: 'practice', contentId: `words:${mode}`, topicId: topic }}
                    />
                  </div>
                </div>
              </details>
            </div>
          </header>
          <div className="srs-track">
            <span style={{ width: `${(index / session.length) * 100}%` }} />
          </div>
          <section className={`${revealed ? 'answered' : ''}${audio ? ' audio-task' : ''}`}>
            <small>
              {audio
                ? 'АУДИО БЕЗ ТЕКСТА'
                : responseKind === 'choice'
                ? 'ВЫБЕРИТЕ ПРАВИЛЬНЫЙ ОТВЕТ'
                : responseKind === 'order'
                  ? 'СОБЕРИТЕ ПРЕДЛОЖЕНИЕ ИЗ СЛОВ'
                  : responseKind === 'letters'
                    ? 'ВСТАВЬТЕ ПРОПУЩЕННЫЕ БУКВЫ'
                    : responseKind === 'phrase'
                      ? 'ОПРЕДЕЛИТЕ СЛОВО ПО КОНТЕКСТУ'
                      : responseKind === 'correction'
                        ? 'НАПИШИТЕ ТОЛЬКО ИСПРАВЛЕННОЕ СЛОВО'
                        : responseKind === 'self'
                          ? 'ОТВЕТЬТЕ ВСЛУХ И ПРОВЕРЬТЕ СЕБЯ'
                          : 'НАПИШИТЕ ОТВЕТ БЕЗ ВАРИАНТОВ'}
            </small>
            <h2>{taskPrompt}</h2>
            {requiresArticle && !audio && (
              <small className="practice-article-reminder">
                СУЩЕСТВИТЕЛЬНОЕ ПИШИТЕ С АРТИКЛЕМ
              </small>
            )}
            {audio && (
              <div className="practice-audio-block">
                <details className="practice-voice-setting">
                  <summary>
                    <Volume2 />
                    <span>
                      Голос: {voices[voiceIndex]?.name || 'системный'}
                    </span>
                    <b>Изменить</b>
                  </summary>
                  <div>
                    {voices.length > 1 ? (
                      <select
                        value={voiceIndex}
                        onChange={(event) =>
                          setVoiceIndex(Number(event.target.value))
                        }
                        aria-label="Голос озвучивания"
                      >
                        {voices.map((voice, index) => (
                          <option value={index} key={`${voice.name}-${index}`}>
                            {voiceDisplayName(voice)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <small>Используется доступный системный голос</small>
                    )}
                    {voiceError && (
                      <output className="voice-error">⚠ {voiceError}</output>
                    )}
                  </div>
                </details>
                <div className="audio-speed-controls">
                  <button className="practice-audio-play" onClick={() => speak(1)}>
                    <span aria-hidden="true">▶</span>
                    <b>Обычная скорость</b>
                  </button>
                  <button className="practice-audio-play slow" onClick={() => speak(0.5)}>
                    <span aria-hidden="true">▶</span>
                    <b>Медленно · 0.5×</b>
                  </button>
                </div>
              </div>
            )}
            {responseKind === 'choice' ? (
              <div className="srs-choice-grid">
                {options.map((option) => (
                  <button
                    disabled={revealed}
                    className={
                      revealed
                        ? normalizeText(option) === normalizeText(card.answer)
                          ? 'correct'
                          : typed === option
                            ? 'wrong'
                            : ''
                        : ''
                    }
                    onClick={() => check(option)}
                    key={option}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : responseKind === 'order' ? (
              <div className="practice-order-builder">
                <div className="practice-order-answer">
                  {orderedWords.length ? (
                    orderedWords.map((token) => (
                      <button
                        key={token}
                        disabled={revealed}
                        onClick={() =>
                          setOrderedWords((current) =>
                            current.filter((item) => item !== token),
                          )
                        }
                      >
                        {token.split('::').slice(1).join('::')}
                      </button>
                    ))
                  ) : (
                    <span>Нажимайте на слова в нужном порядке</span>
                  )}
                </div>
                <div className="practice-word-bank">
                  {orderTokens.map((token) => (
                    <button
                      key={token}
                      disabled={revealed || orderedWords.includes(token)}
                      onClick={() =>
                        setOrderedWords((current) => [...current, token])
                      }
                    >
                      {token.split('::').slice(1).join('::')}
                    </button>
                  ))}
                </div>
                <button
                  className="primary-btn order-check"
                  disabled={
                    revealed || orderedWords.length !== orderTokens.length
                  }
                  onClick={() =>
                    check(
                      orderedWords
                        .map((token) => token.split('::').slice(1).join('::'))
                        .join(' '),
                    )
                  }
                >
                  Проверить порядок
                </button>
              </div>
            ) : responseKind === 'self' ? (
              <button
                className="reveal-answer"
                onClick={revealSelf}
                disabled={revealed}
              >
                {revealed ? 'Ответ открыт' : 'Показать ответ'}
              </button>
            ) : (
              <div className="answer-entry-with-keys">
                <div className="recall-input">
                  <input
                    value={typed}
                    onFocus={closePracticePopovers}
                    onChange={(event) => {
                      closePracticePopovers();
                      inputEdits.current += 1;
                      setTyped(event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !revealed) check(typed);
                    }}
                    disabled={revealed}
                    placeholder={
                      responseKind === 'phrase'
                        ? 'Введите изучаемое слово…'
                        : responseKind === 'correction'
                          ? 'Введите одно исправленное слово…'
                          : responseKind === 'audioWord'
                            ? 'Введите перевод…'
                            : responseKind === 'audioSentence'
                              ? 'Введите услышанное…'
                      : card.skill === 'article'
                        ? 'Введите артикль…'
                        : 'Введите точный ответ…'
                    }
                  />
                  <button
                    onClick={() => check(typed)}
                    disabled={!typed.trim() || revealed}
                  >
                    Проверить
                  </button>
                </div>
                {needsSpanishKeys && (
                  <AccentKeys value={typed} onChange={setTyped} />
                )}
              </div>
            )}
            <button
              className="dont-know"
              onClick={dontKnow}
              disabled={revealed}
            >
              Не знаю — показать ответ
            </button>
            {revealed && (
              <div
                className={
                  `${
                    (responseKind === 'self' && !analysis) || correct
                      ? 'recall-result good'
                      : 'recall-result bad'
                  }${correct && analysis ? ' confirmed-answer' : ''}`
                }
              >
                <b>
                  {responseKind === 'self' && !analysis
                    ? 'Сравните со своим ответом'
                    : correct
                      ? '✓ Верно'
                      : 'Эта ошибка сохранена для отработки'}
                </b>
                <p>
                  {!correct && responseKind !== 'self' && (
                    <small>Правильный ответ: </small>
                  )}
                  <strong
                    className={`answer-focus${correct ? ' word-assembled' : ''}`}
                  >
                    {expectedAnswer}
                  </strong>
                </p>
                {hasOnlySpanishMarkDifference(typed, expectedAnswer) && (
                  <small className="soft-spelling">
                    Ответ засчитан, но сравните ударение или букву ñ с образцом.
                  </small>
                )}
                {analysis && (
                  <div
                    className={`answer-analysis ${analysis.kind}${
                      analysis.correct && analysis.kind === 'exact'
                        ? ' is-correct'
                        : analysis.correct
                          ? ' is-nuance'
                          : ''
                    }`}
                  >
                    <b>
                      {analysis.kind === 'article'
                        ? 'Артикль'
                        : analysis.kind === 'ending'
                          ? 'Окончание'
                          : analysis.kind === 'order'
                            ? 'Порядок слов'
                            : analysis.kind === 'typo'
                              ? 'Опечатка'
                              : analysis.kind === 'accent'
                                ? 'Диакритика'
                                : correct
                                  ? 'Разбор ответа'
                                  : 'Почему не засчитано'}
                    </b>
                    <span>{analysis.message}</span>
                  </div>
                )}
                {!correct && typed && (
                  <SpellingDiff value={typed} answer={expectedAnswer} />
                )}
                <small className="adaptive-grade-note">
                  Интервал автоматически учитывает формат задания, время ответа и количество исправлений.
                </small>
                <div className="grade-grid">
                  <button onClick={() => grade('again')}>
                    <b>Не помню</b>
                    <span>реально через 10 минут</span>
                  </button>
                  <button onClick={() => grade('hard')}>
                    <b>Трудно</b>
                    <span>примерно через 12 часов</span>
                  </button>
                  <button onClick={() => grade('good')}>
                    <b>Хорошо</b>
                    <span>интервал растёт</span>
                  </button>
                  <button onClick={() => grade('easy')}>
                    <b>Легко</b>
                    <span>намного позже</span>
                  </button>
                </div>
                <div className="answer-examples">
                  {examples.map((example, exampleIndex) => (
                    <div key={exampleIndex}>
                      <b>{example.es}</b>
                      <small>{example.ru}</small>
                      <button
                        className="example-audio"
                        onClick={() => speakText(example.es, 1)}
                        aria-label={`Прослушать пример: ${example.es}`}
                      >
                        <Volume2 /> Прослушать
                      </button>
                      <ReportExampleButton
                        id={`practice-${card.key}-${exampleIndex}`}
                        word={card.es}
                        example={example.es}
                        translation={example.ru}
                        source={card.topic}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
          <footer>
            <span>
              Статус: {records[card.key]?.reviews ? 'изучается' : 'новое'}
            </span>
            <span>
              Стабильность: {(records[card.key]?.stability || 0).toFixed(1)} дн.
            </span>
            <span>Следующее: {dueLabel(records[card.key])}</span>
            {!!records[card.key]?.reviews && (
              <span>
                {new Date(records[card.key].nextReview).toLocaleString(
                  'ru-RU',
                  {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )}
              </span>
            )}
          </footer>
        </article>
      )}
    </div>
  );
}
