'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowRight, Check, Flame, Library, Music2, Play, Sparkles, Zap } from 'lucide-react';
import { vocabularyTopics } from '../../vocabulary';
import {
  baseCardKey,
  derivedWordStatus,
  localDateKey,
  normalizeText,
} from '../../lib/learning-core';
import { courseLessons } from '../../lessons';
import { ReportExerciseButton } from '../report-exercise-button';
import type { Section, DailyChallengeCompletion, DailyChallenge, DeviceProfile } from '../../types/learning';
import {
  useAchievements,
  useSRS,
  useAchievementStats,
  useWordProgress,
  useLessonProgress,
  useErrorProfile,
  DAILY_PLAN_TARGET,
  recordAchievementEvent,
  recordLearningEvent,
  russianDayWord,
} from '../../lib/learning-runtime';
import { makeStudyDeck } from '../../lib/study-deck';
import { playFeedbackSound, Hero } from './shared';

const TodayPanel = lazy(() => import('../today-panel'));

const cityStops = [
  {
    name: 'Madrid',
    need: 0,
    pos: 'madrid',
    icon: '🏛️',
    copy: '— ¿Dónde está la Plaza Mayor? — Está en el centro.',
    detail: 'В Мадриде потренируем вопрос о месте и направление.',
  },
  {
    name: 'Valencia',
    need: 15,
    pos: 'valencia',
    icon: '🍊',
    copy: 'La paella nació en Valencia.',
    detail: 'Культурный факт: родиной паэльи считается Валенсия.',
  },
  {
    name: 'Sevilla',
    need: 40,
    pos: 'sevilla',
    icon: '💃',
    copy: '— ¿Hace calor? — Sí, hace mucho calor.',
    detail: 'В Севилье повторим погоду и живой короткий ответ.',
  },
  {
    name: 'Barcelona',
    need: 75,
    pos: 'barcelona',
    icon: '🎨',
    copy: 'En Barcelona se hablan español y catalán.',
    detail: 'В Барселоне широко используются испанский и каталанский.',
  },
];

function SpainMap({ learnedWords }: { learnedWords: number }) {
  const available = cityStops.filter((city) => learnedWords >= city.need),
    [active, setActive] = useState(available.at(-1)?.name || 'Madrid');
  const current =
    cityStops.find((city) => city.name === active) || cityStops[0];
  return (
    <section className="spain-map-section">
      <header>
        <div>
          <p className="eyebrow">МАРШРУТ ПО ИСПАНИИ</p>
          <h2>Учите слова — открывайте города</h2>
        </div>
        <span>
          <b>{available.length}</b> / {cityStops.length} открыто
        </span>
      </header>
      <div className="spain-map-layout">
        <fieldset
          className="spain-map-board"
          aria-label="Интерактивная карта Испании"
        >
          {cityStops.map((city) => {
            const unlocked = learnedWords >= city.need;
            return (
              <button
                key={city.name}
                className={`city-stop ${city.pos} ${unlocked ? 'unlocked' : 'locked'} ${active === city.name ? 'active' : ''}`}
                onClick={() => unlocked && setActive(city.name)}
                disabled={!unlocked}
                aria-label={
                  unlocked
                    ? `Открыть ${city.name}`
                    : `${city.name}: нужно выучить ${city.need} слов`
                }
              >
                <i>{unlocked ? city.icon : '🔒'}</i>
                <b>{city.name}</b>
                {!unlocked && <small>{city.need} слов</small>}
              </button>
            );
          })}
        </fieldset>
        <article className="city-dialogue">
          <span>{current.icon}</span>
          <p className="eyebrow">ГОРОД ОТКРЫТ</p>
          <h3>{current.name}</h3>
          <blockquote>{current.copy}</blockquote>
          <p>{current.detail}</p>
          {available.length < cityStops.length && (
            <small>
              Следующий город откроется после {cityStops[available.length].need}{' '}
              выученных слов · сейчас {learnedWords}
            </small>
          )}
        </article>
      </div>
    </section>
  );
}

function ColombianWeek({ go }: { go: (section: Section) => void }) {
  const achievement = useAchievements().find(
      (item) => item.id === 'ritmo-colombiano',
    ),
    progress = achievement?.current || 0;
  return (
    <section className="colombian-week">
      <header>
        <div>
          <p className="eyebrow">🇨🇴 КУЛЬТУРНЫЙ СПЕЦПРОЕКТ</p>
          <h2>Колумбийская неделя</h2>
          <p>
            Медельин, городской ритм J Balvin и Maluma и выражения, которые
            помогают услышать живой колумбийский испанский.
          </p>
        </div>
        <button onClick={() => go('Music')}>
          <Music2 /> Открыть песни
        </button>
      </header>
      <div className="colombia-grid">
        <article className="colombia-artists">
          <span>MEDELLÍN · CIUDAD DE LA ETERNA PRIMAVERA</span>
          <div>
            <b>J BALVIN</b>
            <small>ритм · произношение · городской испанский</small>
          </div>
          <div>
            <b>MALUMA</b>
            <small>поп · разговорные фразы · интонация</small>
          </div>
        </article>
        <article className="colombia-speech">
          <span>ТРИ ФРАЗЫ НЕДЕЛИ</span>
          <dl>
            <div><dt>¿Qué más?</dt><dd>Как дела? / Что нового?</dd></div>
            <div><dt>parce</dt><dd>приятель, дружеское обращение</dd></div>
            <div><dt>¡Qué bacano!</dt><dd>Как здорово! / Класс!</dd></div>
          </dl>
          <small>Употребление зависит от региона и ситуации.</small>
        </article>
        <article className="colombia-achievement">
          <span>{achievement?.unlocked ? '🎵' : '🔒'}</span>
          <div>
            <small>ДОСТИЖЕНИЕ НЕДЕЛИ</small>
            <h3>Ritmo Colombiano</h3>
            <p>
              {achievement?.unlocked
                ? 'Has encontrado el ritmo.'
                : 'La música ya está dentro de ti.'}
            </p>
            <div className="achievement-mini-track">
              <i style={{ width: `${(progress / 5) * 100}%` }} />
            </div>
            <b>{progress} / 5 сессий по теме «Музыка»</b>
          </div>
          <button onClick={() => go('Practice')}>Практиковаться <ArrowRight /></button>
        </article>
      </div>
    </section>
  );
}

const dailyChallengeStorage = 'ritmo-daily-challenges';

const loadDailyChallengeCompletions = (): Record<
  string,
  DailyChallengeCompletion
> => {
  try {
    const stored = JSON.parse(localStorage.getItem(dailyChallengeStorage) || '{}');
    return stored && typeof stored === 'object' ? stored : {};
  } catch {
    return {};
  }
};

const dailyChallengeWords = vocabularyTopics.filter((topic) => topic.level === 'A1–A2').flatMap((topic) =>
  topic.entries.map((entry) => ({ ...entry, topic: topic.name })),
);

const dailyOptionSet = (
  targetIndex: number,
  value: (entry: (typeof dailyChallengeWords)[number]) => string,
) => {
  const targetEntry = dailyChallengeWords[targetIndex],
    target = value(targetEntry),
    options = [target],
    wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length,
    targetLength = wordCount(target),
    targetIsSentence = targetLength > 4 || /[.!?¿¡]/.test(target),
    hasMatchingShape = (candidate: string) => {
      const candidateLength = wordCount(candidate),
        candidateIsSentence = candidateLength > 4 || /[.!?¿¡]/.test(candidate);
      if (targetIsSentence !== candidateIsSentence) return false;
      if (targetLength === 1) return candidateLength === 1;
      if (targetLength <= 3) return candidateLength <= 3;
      return Math.abs(candidateLength - targetLength) <= 3;
    },
    addCandidates = (matchShape: boolean, matchTopic: boolean) => {
      for (
        let step = 1;
        options.length < 4 && step < dailyChallengeWords.length;
        step += 1
      ) {
        const candidateEntry =
            dailyChallengeWords[
              (targetIndex + step * 37) % dailyChallengeWords.length
            ],
          candidate = value(candidateEntry);
        if (
          candidate &&
          (!matchShape || hasMatchingShape(candidate)) &&
          (!matchTopic || candidateEntry.topic === targetEntry.topic) &&
          !options.some(
            (item) => normalizeText(item) === normalizeText(candidate),
          )
        )
          options.push(candidate);
      }
    };
  addCandidates(true, true);
  addCandidates(true, false);
  addCandidates(false, false);
  const offset = targetIndex % options.length;
  return options.map((_, index) => options[(index + offset) % options.length]);
};

const dailyChallenges: DailyChallenge[] = dailyChallengeWords.map(
  (entry, index) => {
    const mode = index % 4,
      exampleRu = entry.exampleRu || `Пример со словом «${entry.ru}».`,
      spanishOptions = dailyOptionSet(index, (item) => item.es),
      russianOptions = dailyOptionSet(index, (item) => item.ru),
      explanation = `${entry.example} — ${exampleRu}`;
    if (mode === 0)
      return {
        id: `${entry.topic}-${entry.id}-es-ru`,
        instruction: 'Выберите точный перевод',
        prompt: `Что означает «${entry.es}»?`,
        answer: entry.ru,
        options: russianOptions,
        explanation,
      };
    if (mode === 1)
      return {
        id: `${entry.topic}-${entry.id}-ru-es`,
        instruction: 'Вспомните слово по-испански',
        prompt: `Как сказать «${entry.ru}»?`,
        answer: entry.es,
        options: spanishOptions,
        explanation,
      };
    if (mode === 2)
      return {
        id: `${entry.topic}-${entry.id}-context-ru`,
        instruction: 'Поймите ситуацию по полному переводу',
        prompt: `${exampleRu} Какое ключевое слово использовано?`,
        answer: entry.es,
        options: spanishOptions,
        explanation,
      };
    return {
      id: `${entry.topic}-${entry.id}-context-es`,
      instruction: 'Поймите испанскую фразу в контексте',
      prompt: `${entry.example} Какое значение здесь подходит?`,
      answer: entry.ru,
      options: russianOptions,
      explanation,
    };
  },
);

const dailyChallengeFor = (day: string) => {
  const [year, month, date] = day.split('-').map(Number),
    dayNumber = Number.isFinite(year + month + date)
      ? Math.floor(Date.UTC(year, month - 1, date) / 86400000)
      : 0;
  return dailyChallenges[
    ((dayNumber % dailyChallenges.length) + dailyChallenges.length) %
      dailyChallenges.length
  ];
};

export function HomeView({
  go,
  profile,
}: {
  go: (s: Section) => void;
  profile: DeviceProfile;
}) {
  const [answer, setAnswer] = useState(''),
    [dailyCompletion, setDailyCompletion] =
      useState<DailyChallengeCompletion | null>(null),
    [hour, setHour] = useState(12),
    [currentTime, setCurrentTime] = useState(0),
    [dailyDay, setDailyDay] = useState('2000-01-01');
  const { records } = useSRS(),
    achievementStats = useAchievementStats(),
    { progress: wordProgress } = useWordProgress(),
    { progress: lessonProgress } = useLessonProgress(),
    errors = useErrorProfile(),
    todayDone = profile.dailyReviews?.[localDateKey()] || 0,
    dailyTarget = DAILY_PLAN_TARGET,
    studyDeck = makeStudyDeck(),
    recognitionDeck = studyDeck.filter(
      (card) => card.skill === 'recognition',
    ),
    due = Object.values(records).filter(
      (item) => item.reviews && item.nextReview <= currentTime,
    ).length,
    learnedWords = recognitionDeck.filter(
        (card) =>
          derivedWordStatus(
            baseCardKey(card.key),
            records,
            wordProgress[baseCardKey(card.key)] || 'new',
          ) === 'learned',
      ).length,
    newWords = recognitionDeck.filter(
      (card) =>
        derivedWordStatus(
          baseCardKey(card.key),
          records,
          wordProgress[baseCardKey(card.key)] || 'new',
        ) === 'new',
    ).length,
    weakTopicEntry = Object.entries(errors)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])[0],
    weakTopic = weakTopicEntry?.[0] || '',
    weakTopicErrors = weakTopicEntry?.[1] || 0,
    nextLesson =
      courseLessons.find((item) => !lessonProgress[item.id]?.completed) || null,
    nextLessonDone = nextLesson ? lessonProgress[nextLesson.id]?.done || 0 : 0,
    weeklyAnswers = currentTime
      ? Object.entries(profile.dailyReviews || {}).reduce(
          (sum, [day, count]) =>
            new Date(`${day}T12:00:00`).getTime() >= currentTime - 6 * 86400000
              ? sum + count
              : sum,
          0,
        )
      : 0;
  useEffect(() => {
    const update = () => {
      const date = new Date();
      setHour(date.getHours());
      setCurrentTime(date.getTime());
      setDailyDay(localDateKey(date));
    };
    queueMicrotask(update);
    const timer = window.setInterval(update, 60000);
    let midnightTimer = 0;
    const scheduleMidnight = () => {
      const now = new Date(),
        next = new Date(now);
      next.setHours(24, 0, 0, 50);
      midnightTimer = window.setTimeout(() => {
        update();
        scheduleMidnight();
      }, next.getTime() - now.getTime());
    };
    scheduleMidnight();
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') update();
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(midnightTimer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);
  const generatedDailyChallenge = dailyChallengeFor(dailyDay),
    dailyChallenge = dailyCompletion?.challenge || generatedDailyChallenge,
    dailyCorrect = answer === dailyChallenge.answer;
  useEffect(() => {
    const saved = loadDailyChallengeCompletions()[dailyDay];
    if (saved?.challenge?.id && typeof saved.answer === 'string') {
      setDailyCompletion(saved);
      setAnswer(saved.answer);
    } else {
      setDailyCompletion(null);
      setAnswer('');
    }
  }, [dailyDay, generatedDailyChallenge.id]);
  useEffect(() => {
    if (dailyDay !== '2000-01-01' && todayDone >= DAILY_PLAN_TARGET)
      recordAchievementEvent({ type: 'daily-plan-complete', day: dailyDay });
  }, [dailyDay, todayDone]);
  const completeDailyChallenge = (option: string) => {
    if (answer) return;
    const correct = option === generatedDailyChallenge.answer,
      completion: DailyChallengeCompletion = {
        challenge: generatedDailyChallenge,
        answer: option,
        correct,
        completedAt: new Date().toISOString(),
      },
      updated = {
        ...loadDailyChallengeCompletions(),
        [dailyDay]: completion,
      },
      trimmed = Object.fromEntries(
        Object.entries(updated)
          .sort(([first], [second]) => first.localeCompare(second))
          .slice(-400),
      );
    localStorage.setItem(dailyChallengeStorage, JSON.stringify(trimmed));
    window.dispatchEvent(new Event('ritmo-daily-challenges'));
    setDailyCompletion(completion);
    setAnswer(option);
    playFeedbackSound(correct);
    recordLearningEvent(correct, correct ? 5 : 2);
    recordAchievementEvent({ type: 'daily-challenge-complete', day: dailyDay });
  };
  const period =
      hour >= 5 && hour < 12
        ? 'morning'
        : hour >= 12 && hour < 19
          ? 'day'
          : 'night',
    greeting =
      period === 'morning'
        ? 'Buenos días'
        : period === 'day'
          ? 'Buenas tardes'
          : 'Buenas noches',
    greetingIcon =
      period === 'morning' ? '☀️' : period === 'day' ? '🌤️' : '🌙';
  return (
    <>
      <section className={`welcome-row time-${period}`}>
        <div>
          <p className="eyebrow">СЕГОДНЯ · УРОВЕНЬ {profile.level}</p>
          <h1>
            ¡{greeting}{profile.name ? `, ${profile.name}` : ''}! {greetingIcon}
          </h1>
          <p>
            Un poco cada día. Сегодняшний ритм уже сохранён в вашем профиле.
          </p>
        </div>
        <div className="streak-pill">
          <Flame fill="currentColor" />
          <b>{profile.streak}</b>
          <span>{russianDayWord(profile.streak)} подряд</span>
        </div>
      </section>
      <Suspense fallback={<section className="today-panel loading">Готовим персональный план…</section>}>
        <TodayPanel
          due={due}
          newWords={newWords}
          weakTopic={weakTopic}
          weakTopicErrors={weakTopicErrors}
          lessonId={nextLesson?.id || ''}
          lessonTitle={nextLesson?.title || ''}
          lessonDone={nextLessonDone}
          lessonTotal={nextLesson?.exercises.length || 0}
          todayDone={todayDone}
          dailyTarget={dailyTarget}
          go={go}
          onPlacementComplete={(level) =>
            recordAchievementEvent({ type: 'placement-test-complete', level })
          }
        />
      </Suspense>
      <section className="stats-row">
        <article>
          <div className="ring">
            <div>
              <b>{Math.min(todayDone, dailyTarget)}</b>
              <small>/ {dailyTarget}</small>
            </div>
          </div>
          <div>
            <span className="mini-label">ЦЕЛЬ НА СЕГОДНЯ</span>
            <b>
              {todayDone >= dailyTarget ? 'Цель выполнена' : 'Продолжайте ритм'}
            </b>
            <p>
              {todayDone >= dailyTarget
                ? `${todayDone} реальных ответов сегодня`
                : `Осталось ${dailyTarget - todayDone} заданий`}
            </p>
          </div>
        </article>
        <article>
          <span className="xp-icon">
            <Sparkles />
          </span>
          <div>
            <span className="mini-label">МОЙ ПРОГРЕСС</span>
            <b>{weeklyAnswers} ответов за 7 дней</b>
            <p>Уровень {profile.level} · {due} карточек пора повторить</p>
          </div>
          <div className="mini-bars">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </article>
      </section>
      <Hero go={go} period={period} />
      <SpainMap learnedWords={learnedWords} />
      <ColombianWeek go={go} />
      <section className="dashboard-grid">
        <article className="song-card">
          <div className="album">
            <div>
              <Music2 />
            </div>
            <span>AZUL</span>
          </div>
          <div className="song-copy">
            <p className="eyebrow">ПЕСНЯ ДНЯ</p>
            <h3>Azul</h3>
            <p>J Balvin · 🇨🇴 Colombia</p>
            <div className="tags">
              <span>A2—B1</span>
              <span>22 задания</span>
              <span>Летняя лексика</span>
            </div>
            <button onClick={() => go('Music')}>
              <Play fill="currentColor" />
              Учиться с песней
            </button>
          </div>
        </article>
        <article className={`challenge ${answer ? 'completed' : ''}`}>
          <ReportExerciseButton
            id={`home:daily:${dailyChallenge.id}`}
            section="Главная: задание дня"
            prompt={dailyChallenge.prompt}
            answer={dailyChallenge.answer}
            options={dailyChallenge.options}
          />
          <div className="challenge-top">
            <span>
              <Zap fill="currentColor" />
              ЗАДАНИЕ ДНЯ
            </span>
            <small>{answer ? '✓ ВЫПОЛНЕНО' : '1 МИН'}</small>
          </div>
          <p>{dailyChallenge.instruction}</p>
          <h3>{dailyChallenge.prompt}</h3>
          <div className="answers">
            {dailyChallenge.options.map((option) => (
              <button
                key={option}
                className={
                  answer
                    ? option === dailyChallenge.answer
                      ? 'correct'
                      : answer === option
                        ? 'wrong'
                        : ''
                    : ''
                }
                disabled={!!answer}
                onClick={() => completeDailyChallenge(option)}
              >
                {answer === option && option === dailyChallenge.answer ? (
                  <Check />
                ) : null}
                {option}
              </button>
            ))}
          </div>
          {answer && (
            <div className={dailyCorrect ? 'feedback good' : 'feedback'}>
              <b>
                {dailyCorrect
                  ? '¡Muy bien!'
                  : `Правильный ответ: ${dailyChallenge.answer}.`}
              </b>{' '}
              {dailyChallenge.explanation}
            </div>
          )}
          <small className="daily-challenge-count">
            Выполнено заданий дня: {achievementStats.dailyChallengeDays.length}
          </small>
          {answer && (
            <small className="challenge-complete-note">
              Результат сохранён. Новое задание появится завтра в 00:00.
            </small>
          )}
        </article>
      </section>
      <section className="review-banner">
        <div className="review-icon">
          <Library />
        </div>
        <div>
          <span className="mini-label">УМНОЕ ПОВТОРЕНИЕ</span>
          <h3>
            {due
              ? `${due} навыков пора повторить`
              : 'Можно начать с новых слов'}
          </h3>
          <p>Система смешает сроки, слабые места и новый материал.</p>
        </div>
        <div className="review-avatars">
          <span>🐾</span>
          <span>🇪🇸</span>
          <span>+{due}</span>
        </div>
        <button onClick={() => go('Practice')}>
          Начать <ArrowRight />
        </button>
      </section>
    </>
  );
}
