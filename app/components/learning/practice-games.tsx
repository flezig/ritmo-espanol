'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  beginAssignedSession,
  completeAssignedSession,
  recordAssignedActivity,
} from '../../lib/assignment-tracking';
import { ArrowRight, Zap } from 'lucide-react';
import { ReportExerciseButton } from '../report-exercise-button';
import {
  baseCardKey,
  derivedWordStatus,
  localDateKey,
  normalizeText,
} from '../../lib/learning-core';
import { inferWordPartOfSpeech } from '../../lib/word-part-of-speech';
import { hasUsableMaskedContext, maskExactTerm } from '../../lib/practice-content';
import {
  createArticlePracticeSession,
  type ArticlePracticeQuestion,
} from '../../lib/article-practice';
import type { DetectiveLevel, StudyCard } from '../../types/learning';
import { detectiveCases, rushGrammar } from '../../data/practice-games';
import { shuffledOptions, playFeedbackSound, playCelebrationSound, ClockBadge } from './shared';
import {
  recordLearningEvent,
  recordAchievementEvent,
  useCustomWords,
  useSRS,
  useWordProgress,
  statusLabels,
} from '../../lib/learning-runtime';
import { makeStudyDeck } from '../../lib/study-deck';
import { randomOrder } from '../../lib/practice-engine';

export function DetectiveGame({ initialLevel = 'A1' }: { initialLevel?: DetectiveLevel }) {
  const [level, setLevel] = useState<DetectiveLevel>(initialLevel),
    [caseIndex, setCaseIndex] = useState(0),
    [questionIndex, setQuestionIndex] = useState(0),
    [lives, setLives] = useState(3),
    [stars, setStars] = useState(0),
    [choice, setChoice] = useState(''),
    [showTranslation, setShowTranslation] = useState(false),
    [caseSolved, setCaseSolved] = useState(false),
    [finished, setFinished] = useState(false),
    answerLock = useRef(false);
  const currentCase = detectiveCases[level][caseIndex],
    question = currentCase.questions[questionIndex],
    correct = choice === question.answer,
    taskNumber = caseIndex * 5 + questionIndex + 1,
    options = shuffledOptions(
      question.options,
      `${level}-${caseIndex}-${questionIndex}`,
    );
  const restart = (nextLevel = level) => {
    beginAssignedSession('practice', `detective:${nextLevel.toLowerCase()}`);
    answerLock.current = false;
    setLevel(nextLevel);
    setCaseIndex(0);
    setQuestionIndex(0);
    setLives(3);
    setStars(0);
    setChoice('');
    setShowTranslation(false);
    setCaseSolved(false);
    setFinished(false);
  };
  const answer = (value: string) => {
    if (choice || answerLock.current) return;
    answerLock.current = true;
    const isCorrect = value === question.answer;
    recordAssignedActivity({
      type: 'practice', contentId: `detective:${level.toLowerCase()}`, itemKey: `${level}:${caseIndex}:${questionIndex}`,
      prompt: question.prompt, studentAnswer: value,
      correctAnswer: question.answer, correct: isCorrect, score: isCorrect ? 1 : 0,
    });
    setChoice(value);
    playFeedbackSound(isCorrect);
    recordLearningEvent(isCorrect, isCorrect ? 5 : 1);
    if (isCorrect) setStars((current) => current + 1);
    else setLives((current) => Math.max(0, current - 1));
  };
  const next = () => {
    answerLock.current = false;
    if (questionIndex < currentCase.questions.length - 1) {
      setQuestionIndex((current) => current + 1);
      setChoice('');
      return;
    }
    setCaseSolved(true);
  };
  const nextCase = () => {
    answerLock.current = false;
    if (caseIndex === detectiveCases[level].length - 1) {
      setFinished(true);
      completeAssignedSession({ type: 'practice', contentId: `detective:${level.toLowerCase()}`, correct: stars, total: detectiveCases[level].length * 5, score: stars });
      const saved = JSON.parse(
        localStorage.getItem('ritmo-detective-progress') || '{}',
      );
      localStorage.setItem(
        'ritmo-detective-progress',
        JSON.stringify({ ...saved, [level]: Math.max(saved[level] || 0, stars) }),
      );
      window.dispatchEvent(new Event('ritmo-detective-progress'));
      recordAchievementEvent({
        type: 'detective-session',
        level,
        correct: stars,
        total: detectiveCases[level].length * 5,
      });
      return;
    }
    setCaseIndex((current) => current + 1);
    setQuestionIndex(0);
    setLives(3);
    setChoice('');
    setShowTranslation(false);
    setCaseSolved(false);
  };
  if (finished)
    return (
      <section className="detective-finish game-panel">
        <span>🔓</span>
        <p className="eyebrow">ДЕЛО ЗАКРЫТО · {level}</p>
        <h2>{stars} из 20 улик найдены</h2>
        <p>Вы прочитали четыре текста целиком и открыли все финалы уровня.</p>
        <button className="primary-btn" onClick={() => restart(level)}>
          Пройти уровень ещё раз
        </button>
      </section>
    );
  if (!lives)
    return (
      <section className="detective-finish game-panel">
        <span>🕵️</span>
        <p className="eyebrow">УЛИКИ ЗАКОНЧИЛИСЬ</p>
        <h2>Вернитесь к началу этого текста</h2>
        <p>Историю можно перечитать; заработанные звёзды сохранятся в этой игре.</p>
        <button
          className="primary-btn"
          onClick={() => {
            answerLock.current = false;
            setQuestionIndex(0);
            setLives(3);
            setChoice('');
          }}
        >
          Повторить дело
        </button>
      </section>
    );
  return (
    <section className="detective-game game-panel">
      <header className="game-status-row">
        <div className="level-switch">
          {(['A1', 'A2'] as DetectiveLevel[]).map((item) => (
            <button className={level === item ? 'active' : ''} onClick={() => restart(item)} key={item}>
              {item} · 20 заданий
            </button>
          ))}
        </div>
        <span>❤️ {lives} · ⭐ {stars} · улика {taskNumber}/20</span>
      </header>
      {caseSolved ? (
        <article className="story-ending">
          <span>🔓 Финал открыт</span>
          <h2>{currentCase.title}</h2>
          <p>{currentCase.ending}</p>
          <button className="primary-btn" onClick={nextCase}>
            {caseIndex === 3 ? 'Завершить уровень' : 'Следующее дело'} <ArrowRight />
          </button>
        </article>
      ) : (
        <>
          <article className="detective-story">
            <span>ДЕЛО {caseIndex + 1}</span>
            <h2>{currentCase.title}</h2>
            <p lang="es">{currentCase.text}</p>
            <button
              className="detective-translation-toggle"
              onClick={() => setShowTranslation((current) => !current)}
              aria-expanded={showTranslation}
            >
              {showTranslation ? 'Скрыть перевод' : 'Показать перевод на русский'}
            </button>
            {showTranslation && (
              <div className="detective-translation">
                <small>ТОЧНЫЙ ПЕРЕВОД</small>
                <p>{currentCase.translation}</p>
              </div>
            )}
          </article>
          <article className="detective-question">
            <ReportExerciseButton
              id={`detective:${level}:${normalizeText(currentCase.title)}:${normalizeText(question.prompt)}`}
              section={`Детектив ${level}: ${currentCase.title}`}
              prompt={question.prompt}
              answer={question.answer}
              options={question.options}
              learningContext={{ type: 'practice', contentId: `detective:${level.toLowerCase()}` }}
            />
            <small>{question.kind}</small>
            <h3>{question.prompt}</h3>
            <div>
              {options.map((option) => (
                <button
                  className={choice ? (option === question.answer ? 'correct' : option === choice ? 'wrong' : '') : ''}
                  disabled={!!choice}
                  onClick={() => answer(option)}
                  key={option}
                >
                  {option}
                </button>
              ))}
            </div>
            {choice && (
              <footer className={correct ? 'correct' : 'wrong'}>
                <b>{correct ? 'Улика найдена!' : `Верный ответ: ${question.answer}`}</b>
                <span>{question.explanation}</span>
                <button onClick={next}>Дальше <ArrowRight /></button>
              </footer>
            )}
          </article>
        </>
      )}
    </section>
  );
}

export function SpanishRushGame() {
  const { words: customWords } = useCustomWords(),
    deck = useMemo(
      () => makeStudyDeck(customWords).filter((card) =>
        card.skill === 'recognition' &&
        (card.level === 'A1–A2' || card.topic === 'Мои слова'),
      ),
      [customWords],
    ),
    { records } = useSRS(),
    { progress } = useWordProgress(),
    [running, setRunning] = useState(false),
    [timeLeft, setTimeLeft] = useState(60),
    [score, setScore] = useState(0),
    [sessionCorrect, setSessionCorrect] = useState(0),
    [sessionAnswers, setSessionAnswers] = useState(0),
    [combo, setCombo] = useState(0),
    [round, setRound] = useState(0),
    [choice, setChoice] = useState(''),
    [doubleLeft, setDoubleLeft] = useState(0),
    [bonus, setBonus] = useState(''),
    [praise, setPraise] = useState(''),
    [best, setBest] = useState(0),
    [sessionKey, setSessionKey] = useState('initial'),
    [wordOrder, setWordOrder] = useState<number[]>([]),
    [grammarOrder, setGrammarOrder] = useState<number[]>([]),
    answerLock = useRef(false),
    startedAt = useRef(0),
    transitionTimer = useRef<number | null>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ritmo-rush-records') || '{}');
      setBest(Number(saved.best) || 0);
    } catch {}
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setTimeLeft((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(
    () => () => {
      if (transitionTimer.current !== null)
        window.clearTimeout(transitionTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (running && timeLeft === 0) {
      setRunning(false);
      completeAssignedSession({ type: 'practice', contentId: 'rush', correct: sessionCorrect, total: sessionAnswers, score });
      const today = localDateKey(),
        saved = JSON.parse(localStorage.getItem('ritmo-rush-records') || '{}'),
        nextBest = Math.max(Number(saved.best) || 0, score),
        daily = { ...saved.daily, [today]: Math.max(saved.daily?.[today] || 0, score) };
      localStorage.setItem('ritmo-rush-records', JSON.stringify({ best: nextBest, daily }));
      window.dispatchEvent(new Event('ritmo-rush-records'));
      setBest(nextBest);
      playCelebrationSound('finish');
      recordAchievementEvent({
        type: 'rush-session',
        score,
        seconds: Math.max(
          1,
          Math.round((Date.now() - startedAt.current) / 1000),
        ),
      });
    }
  }, [running, timeLeft, score, sessionCorrect, sessionAnswers]);
  const wordIndex = wordOrder[round % Math.max(1, wordOrder.length)] ?? 0,
    wordCard = deck[wordIndex] || deck[0],
    grammarRound = Math.floor(round / 3),
    grammarIndex =
      grammarOrder[grammarRound % Math.max(1, grammarOrder.length)] ?? 0,
    grammarTask = rushGrammar[grammarIndex],
    isGrammar = round % 3 === 2,
    targetPartOfSpeech = inferWordPartOfSpeech(
      wordCard.es,
      wordCard.ru,
      wordCard.example,
    ),
    seenRushOptions = new Set([
      normalizeText(round % 3 === 0 ? wordCard.ru : wordCard.es),
    ]),
    distractors = wordOrder
      .map((itemIndex) => deck[itemIndex])
      .filter(
        (item): item is StudyCard => {
          if (
            !item ||
            item.key === wordCard.key ||
            inferWordPartOfSpeech(item.es, item.ru, item.example) !==
              targetPartOfSpeech
          )
            return false;
          const displayed = normalizeText(
            round % 3 === 0 ? item.ru : item.es,
          );
          if (seenRushOptions.has(displayed)) return false;
          seenRushOptions.add(displayed);
          return true;
        },
      )
      .slice(0, 3),
    maskedExample = maskExactTerm(wordCard.example, wordCard.es),
    wantsContext = round % 3 === 1,
    hasRealBlank =
      wantsContext &&
      hasUsableMaskedContext(wordCard.example, maskedExample),
    prompt = isGrammar
      ? grammarTask.prompt
      : round % 3 === 0
        ? `Как переводится «${wordCard.es}»?`
        : hasRealBlank
          ? `Какое слово пропущено? ${maskedExample}`
          : `Как по-испански «${wordCard.ru}»?`,
    answer = isGrammar
      ? grammarTask.answer
      : round % 3 === 0
        ? wordCard.ru
        : wordCard.es,
    options = isGrammar
      ? shuffledOptions(grammarTask.options, `${sessionKey}-rush-g-${round}`)
      : shuffledOptions(
          [answer, ...distractors.map((item) => (round % 3 === 0 ? item.ru : item.es))].slice(0, 4),
          `${sessionKey}-rush-v-${round}`,
        ),
    base = baseCardKey(wordCard.key),
    status = derivedWordStatus(base, records, progress[base] || 'new'),
    related = Object.entries(records).filter(([key, record]) => baseCardKey(key) === base && record.reviews),
    attempts = related.reduce((sum, [, record]) => sum + record.reviews, 0),
    successes = related.reduce((sum, [, record]) => sum + record.successes, 0),
    pointsWord =
      score % 100 >= 11 && score % 100 <= 14
        ? 'очков'
        : score % 10 === 1
          ? 'очко'
          : score % 10 >= 2 && score % 10 <= 4
            ? 'очка'
            : 'очков';
  const start = () => {
    beginAssignedSession('practice', 'rush');
    answerLock.current = false;
    startedAt.current = Date.now();
    if (transitionTimer.current !== null)
      window.clearTimeout(transitionTimer.current);
    setSessionKey(
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    );
    setWordOrder(randomOrder(deck.length));
    setGrammarOrder(randomOrder(rushGrammar.length));
    setRunning(true);
    setTimeLeft(60);
    setScore(0);
    setSessionCorrect(0);
    setSessionAnswers(0);
    setCombo(0);
    setRound(0);
    setChoice('');
    setDoubleLeft(0);
    setBonus('');
    setPraise('');
  };
  const choose = (value: string) => {
    if (!running || choice || answerLock.current) return;
    answerLock.current = true;
    const correct = value === answer,
      nextCombo = correct ? combo + 1 : 0,
      multiplier = doubleLeft > 0 ? 2 : 1,
      gained = correct ? Math.max(1, Math.min(4, nextCombo)) * multiplier : 0;
    recordAssignedActivity({
      type: 'practice', contentId: 'rush', itemKey: isGrammar ? `grammar:${grammarIndex}` : wordCard.key, prompt,
      studentAnswer: value, correctAnswer: answer, correct, score: gained,
    });
    setChoice(value);
    playFeedbackSound(correct);
    recordLearningEvent(correct, correct ? gained + 2 : 1);
    setSessionAnswers((current) => current + 1);
    if (correct) {
      setSessionCorrect((current) => current + 1);
      const praises = ['¡Increíble!', '¡Genial!', '¡Brutal!', '¡Excelente!', '¡Eso es!', '¡Muy bien!'];
      setPraise(praises[round % praises.length]);
      setScore((current) => current + gained);
      setCombo(nextCombo);
      if (doubleLeft > 0) setDoubleLeft((current) => current - 1);
      if (nextCombo && nextCombo % 6 === 0) {
        setTimeLeft((current) => Math.min(90, current + 5));
        setBonus('⚡ +5 секунд');
        playCelebrationSound('finish');
      } else if (nextCombo && nextCombo % 4 === 0) {
        setDoubleLeft(3);
        setBonus('💎 x2 на три задания');
      } else setBonus(`🔥 Combo x${Math.min(4, nextCombo)}`);
    } else {
      setPraise('');
      setCombo(0);
      setTimeLeft((current) => Math.max(0, current - 3));
      setBonus('−3 секунды');
    }
    transitionTimer.current = window.setTimeout(() => {
      setRound((current) => current + 1);
      setChoice('');
      setBonus('');
      setPraise('');
      answerLock.current = false;
      transitionTimer.current = null;
    }, 650);
  };
  return (
    <section className="rush-game game-panel">
      <header className="rush-scoreboard">
        <span><ClockBadge minutes={Math.ceil(timeLeft / 60)} /><b>{timeLeft}</b> сек.</span>
        <span>⭐ <b>{score}</b> {pointsWord}</span>
        <span>🔥 combo <b>x{Math.max(1, Math.min(4, combo))}</b></span>
        <span>🏆 рекорд <b>{best}</b></span>
      </header>
      {!running ? (
        <article className="rush-start">
          <span>⏱️</span>
          <p className="eyebrow">ЕЖЕДНЕВНЫЙ CHALLENGE</p>
          <h2>{timeLeft === 0 ? `Время вышло: ${score} ${pointsWord}` : '60 секунд испанского драйва'}</h2>
          <p>Короткие задания, реальные слова словаря, combo, бонусы времени и личный рекорд.</p>
          <strong className="rush-current-record">🏆 Текущий рекорд: {best} {best === 1 ? 'очко' : best >= 2 && best <= 4 ? 'очка' : 'очков'}</strong>
          <button className="primary-btn" onClick={start}>{timeLeft === 0 ? 'Ещё раз' : 'Начать игру'} <Zap /></button>
        </article>
      ) : (
        <article className="rush-task task-swap" key={round}>
          <ReportExerciseButton
            id={`rush:${isGrammar ? 'grammar' : normalizeText(wordCard.es)}:${normalizeText(prompt)}:${normalizeText(answer)}`}
            section="Spanish Rush"
            prompt={prompt}
            answer={answer}
            options={options}
            learningContext={{ type: 'practice', contentId: 'rush' }}
          />
          <header>
            <span>{isGrammar ? 'ГРАММАТИКА' : `${statusLabels[status]} · ${wordCard.topic}`}</span>
            {bonus && <b>{bonus}</b>}
          </header>
          {praise && <strong className="rush-praise">{praise}</strong>}
          <h2>{prompt}</h2>
          <div>
            {options.map((option) => (
              <button
                className={choice ? (option === answer ? 'correct' : option === choice ? 'wrong' : '') : ''}
                disabled={!!choice}
                onClick={() => choose(option)}
                key={option}
              >
                {option}
              </button>
            ))}
          </div>
          {!isGrammar && choice && (
            <footer>
              <span>
                {attempts
                  ? `Вы встречали «${wordCard.es}» ${attempts} раз; верных ответов — ${successes}.`
                  : `«${wordCard.es}» встретилось вам впервые.`}
              </span>
            </footer>
          )}
        </article>
      )}
    </section>
  );
}

export function ArticlePracticeGame() {
  const [session, setSession] = useState<ArticlePracticeQuestion[]>(() =>
      createArticlePracticeSession(),
    ),
    [index, setIndex] = useState(0),
    [choice, setChoice] = useState(''),
    [score, setScore] = useState(0),
    [finished, setFinished] = useState(false),
    answerLock = useRef(false);
  const question = session[index],
    correct = choice === question?.answer;
  const restart = () => {
    beginAssignedSession('practice', 'articles');
    answerLock.current = false;
    setSession(createArticlePracticeSession());
    setIndex(0);
    setChoice('');
    setScore(0);
    setFinished(false);
  };
  const choose = (value: string) => {
    if (choice || answerLock.current || !question) return;
    answerLock.current = true;
    const isCorrect = value === question.answer;
    recordAssignedActivity({
      type: 'practice', contentId: 'articles', itemKey: `${question.kind}:${normalizeText(question.prompt)}`, prompt: question.prompt,
      studentAnswer: value, correctAnswer: question.answer,
      correct: isCorrect, score: isCorrect ? 1 : 0,
    });
    setChoice(value);
    window.requestAnimationFrame(() =>
      document.querySelector('.article-question > footer')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
    );
    playFeedbackSound(isCorrect);
    recordLearningEvent(isCorrect, isCorrect ? 4 : 1);
    if (isCorrect) setScore((current) => current + 1);
  };
  const next = () => {
    answerLock.current = false;
    if (index === session.length - 1) {
      setFinished(true);
      completeAssignedSession({ type: 'practice', contentId: 'articles', correct: score, total: session.length, score });
      playCelebrationSound('finish');
      recordAchievementEvent({
        type: 'article-session',
        score,
        total: session.length,
      });
      return;
    }
    setIndex((current) => current + 1);
    setChoice('');
  };
  if (finished)
    return (
      <section className="article-practice article-finish game-panel">
        <span>📚</span>
        <p className="eyebrow">СЕССИЯ ЗАВЕРШЕНА</p>
        <h2>{score} из {session.length} правильных ответов</h2>
        <p>Новая сессия соберёт другой набор исключений и снова перемешает варианты.</p>
        <div>
          <button className="primary-btn" onClick={restart}>Ещё 10 заданий</button>
        </div>
      </section>
    );
  return (
    <section className="article-practice game-panel">
      <header className="article-practice-head">
        <div>
          <span>АРТИКЛИ · EL ИЛИ LA</span>
          <b>{index + 1} / {session.length}</b>
        </div>
      </header>
      <div className="article-practice-track">
        <i style={{ width: `${((index + 1) / session.length) * 100}%` }} />
      </div>
      <article className="article-question task-swap" key={question.id}>
        <ReportExerciseButton
          id={`article-practice:${question.id}`}
          section="Practice: артикли"
          prompt={question.prompt}
          answer={question.answer}
          options={question.options}
          learningContext={{ type: 'practice', contentId: 'articles' }}
        />
        <small>
          {question.kind === 'article'
            ? 'ВЫБЕРИТЕ EL ИЛИ LA'
            : question.kind === 'meaning-article'
              ? 'ЗНАЧЕНИЕ ПОДСКАЗАНО'
              : 'АРТИКЛЬ МЕНЯЕТ ЗНАЧЕНИЕ'}
        </small>
        <h2>{question.prompt}</h2>
        <div className="article-options">
          {question.options.map((option) => (
            <button
              className={
                choice
                  ? option === question.answer
                    ? 'correct'
                    : option === choice
                      ? 'wrong'
                      : ''
                  : ''
              }
              disabled={!!choice}
              onClick={() => choose(option)}
              key={option}
            >
              {option}
            </button>
          ))}
        </div>
        {choice && (
          <footer className={correct ? 'correct' : 'wrong'}>
            <b>{correct ? 'Верно!' : `Правильный ответ: ${question.answer}`}</b>
            <p>{question.explanation}</p>
            <button onClick={next}>
              {index === session.length - 1 ? 'Завершить' : 'Следующее задание'}
              <ArrowRight />
            </button>
          </footer>
        )}
      </article>
    </section>
  );
}
