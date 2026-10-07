'use client';

import { useEffect, useState } from 'react';
import { vocabularyBrowseTopics } from '../../vocabulary';
import {
  analyzeAnswer,
  baseCardKey,
  hasOnlySpanishMarkDifference,
  normalizeText,
} from '../../lib/learning-core';
import {
  beginAssignedSession,
  completeAssignedSession,
  recordAssignedActivity,
} from '../../lib/assignment-tracking';
import { ReportExerciseButton } from '../report-exercise-button';
import { ArrowRight, Volume2 } from 'lucide-react';
import {
  useCustomWords,
  useLearnedWordsDb,
  useSRS,
  useWordProgress,
  recordLearningEvent,
  recordError,
  recordAchievementEvent,
} from '../../lib/learning-runtime';
import { makeStudyDeck, learnedWordDictationCards, wordWasStudied } from '../../lib/study-deck';
import {
  useSpanishVoices,
  useTaskMotion,
  playFeedbackSound,
  ViewHead,
  CatMascot,
  CatPeek,
  voiceDisplayName,
  AccentKeys,
  SpellingDiff,
  ReportExampleButton,
} from './shared';
import type { PracticeLevel, StudyCard } from '../../types/learning';
import { studyExamples } from '../../lib/practice-engine';

export function DictationView() {
  const { words: customWords } = useCustomWords(),
    { words: learnedWordDb } = useLearnedWordsDb(),
    deck = makeStudyDeck(customWords),
    { records, rate } = useSRS(),
    { progress: wordProgress } = useWordProgress(),
    { voices, voiceIndex, setVoiceIndex, speakText, voiceError } = useSpanishVoices(),
    [level, setLevel] = useState<PracticeLevel>('A1–A2'),
    [topic, setTopic] = useState('Все темы'),
    [cards, setCards] = useState<StudyCard[]>([]),
    [index, setIndex] = useState(0),
    [typed, setTyped] = useState(''),
    [checked, setChecked] = useState(false),
    [sessionCorrect, setSessionCorrect] = useState(0),
    [audioTarget, setAudioTarget] = useState<'word' | 'sentence'>('word');
  const { leaving, move } = useTaskMotion();
  const topics = [...new Set([
      'Все темы',
      ...vocabularyBrowseTopics
        .filter((item) => level === 'Все уровни' || item.level === level)
        .map((item) => item.name),
      ...(customWords.length ? ['Мои слова'] : []),
      ...(level === 'Все уровни' || level === 'A1–A2'
        ? learnedWordDb.map((word) => word.lessonTitle)
        : []),
    ])],
    lessonCards = learnedWordDictationCards(learnedWordDb),
    practiceCards = deck.filter(
      (card) =>
        card.skill === 'dictation' &&
        (card.topic === 'Мои слова' ||
          wordWasStudied(card, records) ||
          ['learning', 'difficult', 'learned'].includes(
            wordProgress[baseCardKey(card.key)] || 'new',
          )),
    ),
    learned = [...lessonCards, ...practiceCards]
      .filter(
        (card, cardIndex, list) =>
          list.findIndex(
            (item) => normalizeText(item.es) === normalizeText(card.es),
          ) === cardIndex,
      )
      .filter((card) =>
        card.topic === 'Мои слова' || level === 'Все уровни' || card.level === level,
      )
      .filter((card) => topic === 'Все темы' || card.topic === topic || card.units?.includes(topic)),
    card = cards[index],
    expected = card
      ? audioTarget === 'word'
        ? card.answer
        : card.example
      : '',
    answerAnalysis = card ? analyzeAnswer(typed, expected) : null,
    correct = !!card && !!answerAnalysis?.correct;
  const begin = (nextTopic = topic, nextLevel = level) => {
    beginAssignedSession('dictation', 'learned-words');
    const available = [...lessonCards, ...practiceCards]
      .filter(
        (card, cardIndex, list) =>
          list.findIndex(
            (item) => normalizeText(item.es) === normalizeText(card.es),
          ) === cardIndex,
      )
      .filter((item) =>
        item.topic === 'Мои слова' || nextLevel === 'Все уровни' || item.level === nextLevel,
      )
      .filter((item) => nextTopic === 'Все темы' || item.topic === nextTopic);
    setLevel(nextLevel);
    setTopic(nextTopic);
    setCards([...available].sort(() => Math.random() - 0.5).slice(0, 20));
    setIndex(0);
    setTyped('');
    setChecked(false);
    setSessionCorrect(0);
  };
  const speak = (speed = 1) => {
    if (card)
      speakText(
        audioTarget === 'word' ? card.es.split(' / ')[0] : card.example,
        speed,
      );
  };
  const submit = () => {
    if (!card || !typed.trim() || checked) return;
    const correctAnswer = analyzeAnswer(typed, expected).correct;
    recordAssignedActivity({
      type: 'dictation', contentId: 'learned-words', itemKey: baseCardKey(card.key),
      prompt: audioTarget === 'word' ? 'Прослушайте слово и напишите его перевод' : 'Прослушайте предложение и напишите его полностью',
      studentAnswer: typed, correctAnswer: expected, correct: correctAnswer,
      score: correctAnswer ? 1 : 0,
    });
    setChecked(true);
    playFeedbackSound(correctAnswer);
    recordLearningEvent(correctAnswer, correctAnswer ? 6 : 2);
    if (!correctAnswer) recordError('Диктант');
    else setSessionCorrect((value) => value + 1);
    rate(card, correctAnswer ? 'good' : 'again');
  };
  const dontKnow = () => {
    if (!card || checked) return;
    recordAssignedActivity({
      type: 'dictation', contentId: 'learned-words', itemKey: baseCardKey(card.key),
      prompt: audioTarget === 'word' ? 'Прослушайте слово и напишите его перевод' : 'Прослушайте предложение и напишите его полностью',
      studentAnswer: 'Не знаю', correctAnswer: expected, correct: false,
    });
    setTyped('');
    setChecked(true);
    playFeedbackSound(false);
    recordLearningEvent(false, 1);
    recordError('Диктант');
    rate(card, 'again');
  };
  const next = () =>
    move(() => {
      if (index >= cards.length - 1) {
        completeAssignedSession({ type: 'dictation', contentId: 'learned-words', correct: sessionCorrect, total: cards.length });
        recordAchievementEvent({
          type: 'dictation-session',
          correct: sessionCorrect,
          total: cards.length,
        });
        setCards([]);
        setIndex(0);
        setTyped('');
        setChecked(false);
        setSessionCorrect(0);
      }
      else {
        setIndex((value) => value + 1);
        setTyped('');
        setChecked(false);
      }
    });
  useEffect(() => {
    if (card && !checked) speak(1);
  }, [index, cards, audioTarget, voiceIndex, voices.length]);
  return (
    <div className="view-stack dictation-view">
      <ViewHead
        over={`ДИКТАНТ · ${level} · БАЗА ИЗУЧЕННЫХ СЛОВ`}
        title="Слушайте и пишите без подсказки."
        copy="Диктант использует основные слова начатых уроков и слова, закреплённые в Practice. Случайные слова из теоретических примеров в базу не попадают."
      />
      <section className="dictation-toolbar">
        <label>
          <span>Уровень</span>
          <select
            value={level}
            onChange={(event) => {
              setLevel(event.target.value as PracticeLevel);
              setTopic('Все темы');
              setCards([]);
              setIndex(0);
              setTyped('');
              setChecked(false);
            }}
          >
            <option>A1–A2</option>
            <option>B1–B2</option>
            <option>Все уровни</option>
          </select>
        </label>
        <label>
          <span>Тема</span>
          <select
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              setCards([]);
              setIndex(0);
              setTyped('');
              setChecked(false);
            }}
          >
            {topics.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div>
          <b>{learned.length}</b>
          <span>слов из базы доступно</span>
        </div>
        <button onClick={() => begin(topic, level)} disabled={!learned.length}>
          Начать диктант
        </button>
      </section>
      {!cards.length ? (
        <article className="srs-empty">
          <CatMascot state={learned.length ? 'happy' : 'sleeping'} />
          <h2>
            {learned.length
              ? 'Диктант готов'
              : 'Сначала начните практику урока'}
          </h2>
          <p>
            {learned.length
              ? 'Нажмите «Начать диктант»: в сессию попадёт до 20 разных слов.'
              : 'Основные слова урока сохранятся в личную базу при переходе от теории к заданиям.'}
          </p>
        </article>
      ) : (
        <article
          className={`dictation-card task-swap ${leaving ? 'leaving' : ''}`}
          key={card.key}
        >
          <CatPeek
            state={checked ? (correct ? 'happy' : 'wrong') : 'thinking'}
          />
          <ReportExerciseButton
            id={`dictation:${card.key}:${audioTarget}`}
            section={`Диктант: ${card.topic}`}
            prompt={audioTarget === 'word' ? 'Запишите услышанное слово' : 'Запишите услышанное предложение'}
            answer={expected}
            learningContext={{ type: 'dictation', contentId: 'learned-words', topicId: topic }}
          />
          <header>
            <span>{card.level && `${card.level} · `}{card.topic}</span>
            <b>
              {index + 1} / {cards.length}
            </b>
          </header>
          <div className="speech-settings">
            <div>
              <button
                className={audioTarget === 'word' ? 'active' : ''}
                onClick={() => {
                  setAudioTarget('word');
                  setTyped('');
                  setChecked(false);
                }}
              >
                Слово
              </button>
              <button
                className={audioTarget === 'sentence' ? 'active' : ''}
                onClick={() => {
                  setAudioTarget('sentence');
                  setTyped('');
                  setChecked(false);
                }}
              >
                Предложение
              </button>
            </div>
            {voices.length > 1 && (
              <select
                value={voiceIndex}
                onChange={(event) => setVoiceIndex(Number(event.target.value))}
                aria-label="Голос диктанта"
              >
                {voices.map((voice, index) => (
                  <option value={index} key={`${voice.name}-${index}`}>
                    {voiceDisplayName(voice)}
                  </option>
                ))}
              </select>
            )}
            {voiceError && <output className="voice-error">⚠ {voiceError}</output>}
          </div>
          <div className="dictation-speed">
            <button className="dictation-speaker" onClick={() => speak(1)}>
              <Volume2 />
              <span>Обычная скорость</span>
            </button>
            <button className="slow-listen" onClick={() => speak(0.5)}>
              <Volume2 />
              <span>Медленно · 0.5×</span>
            </button>
          </div>
          <p>
            {audioTarget === 'word'
              ? 'Напишите услышанное слово по-испански'
              : 'Запишите услышанное предложение целиком'}
          </p>
          <div className="answer-entry-with-keys">
            <div className="recall-input">
              <input
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submit();
                }}
                disabled={checked}
                placeholder="Введите слово или выражение…"
              />
              <button onClick={submit} disabled={!typed.trim() || checked}>
                Проверить
              </button>
            </div>
            <AccentKeys value={typed} onChange={setTyped} />
          </div>
          <button className="dont-know" onClick={dontKnow} disabled={checked}>
            Не знаю — показать ответ
          </button>
          {checked && (
            <div
              className={
                correct ? 'dictation-result correct' : 'dictation-result wrong'
              }
            >
              <h3>{correct ? 'Верно!' : 'Правильный ответ'}</h3>
              <b className={correct ? 'word-assembled' : ''}>{expected}</b>
              {hasOnlySpanishMarkDifference(typed, card.answer) && (
                <small className="soft-spelling">
                  Засчитано: проверьте ударение или букву ñ.
                </small>
              )}
              {answerAnalysis && (
                <div className={`answer-analysis ${answerAnalysis.kind}`}>
                  <b>
                    {answerAnalysis.kind === 'article'
                      ? 'Ошибка в артикле'
                      : answerAnalysis.kind === 'ending'
                        ? 'Ошибка в окончании'
                        : answerAnalysis.kind === 'order'
                          ? 'Переставлены слова'
                          : answerAnalysis.kind === 'typo'
                            ? 'Опечатка'
                            : answerAnalysis.kind === 'accent'
                              ? 'Диакритика'
                              : 'Разбор ответа'}
                  </b>
                  <span>{answerAnalysis.message}</span>
                </div>
              )}
              {!correct && typed && (
                <SpellingDiff value={typed} answer={expected} />
              )}
              {!correct && audioTarget === 'sentence' && (
                <button className="replay-problem" onClick={() => speak(0.65)}>
                  <Volume2 /> Повторить проблемный фрагмент медленно
                </button>
              )}
              <div className="answer-examples">
                {studyExamples(card).map((example, exampleIndex) => (
                  <div key={exampleIndex}>
                    <b>{example.es}</b>
                    <small>{example.ru}</small>
                    <ReportExampleButton
                      id={`dictation-${card.key}-${exampleIndex}`}
                      word={card.es}
                      example={example.es}
                      translation={example.ru}
                      source={card.topic}
                    />
                  </div>
                ))}
              </div>
              <button onClick={next}>
                {index === cards.length - 1
                  ? 'Новый диктант'
                  : 'Следующее слово'}{' '}
                <ArrowRight />
              </button>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
