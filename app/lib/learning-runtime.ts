'use client';

import {
  baseCardKey,
  blankSRS,
  derivedWordStatus,
  localDateKey,
  nextStreak,
  normalizeText,
  scheduleReview,
  type ReviewGrade,
  type SRSRecord,
  type WordStatus,
} from './learning-core';
import { useEffect, useState } from 'react';
import {
  applyAchievementEvent,
  defaultAchievementStats,
  type AchievementEvent,
  type AchievementStats,
} from './achievements';
import type { ProfileGender } from './profile-ranks';
import { trackLocalEvent } from './local-analytics';
import { useAccount } from '../components/account-provider';
import { recordWordSession, type WordSessionProgress } from './word-sessions';
import { courseLessons } from '../lessons';
import { LEGACY_HOME_EXERCISE_KEYS } from './lesson-errors';
import type { SkillType, DeviceProfile, AchievementUnlock, AchievementDefinition, AchievementContext, CustomWord, ExampleReport, LearnedWordRecord, StudyCard, WordHistoryRecord, ContentFavorite, LessonProgress, LessonState } from '../types/learning';
import { makeStudyDeck, wordIsLearned } from './study-deck';
import { achievementDefinitions } from '../data/achievement-definitions';
import { lessonCoreVocabulary } from '../data/lesson-vocabulary';

export const statusLabels: Record<WordStatus, string> = {
  new: 'Новое',
  learning: 'Учу',
  learned: 'Выучено',
  difficult: 'Сложное',
};

export const skillLabels: Record<SkillType, string> = {
  recognition: 'Узнавание',
  production: 'Активный словарь',
  article: 'Артикли и род',
  context: 'Контекст / мини-диалог',
  listening: 'Аудирование',
  dictation: 'Диктант',
};

const defaultProfile: DeviceProfile = {
  name: '',
  gender: 'H',
  level: 'A1',
  dailyGoal: 15,
  streak: 0,
  longestStreak: 0,
  lastVisit: '',
  activeDays: [],
  totalReviews: 0,
  totalCorrect: 0,
  xp: 0,
  dailyReviews: {},
};

export const DAILY_PLAN_TARGET = 16;

export const russianDayWord = (count: number) => {
  const mod100 = count % 100,
    mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'дней';
  if (mod10 === 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
};

const loadProfile = (): DeviceProfile => {
  try {
    const stored = JSON.parse(
      localStorage.getItem('ritmo-device-profile') || '{}',
    );
    return {
      ...defaultProfile,
      ...stored,
      gender: stored.gender === 'M' ? 'M' : 'H',
    };
  } catch {
    return defaultProfile;
  }
};

const saveProfile = (profile: DeviceProfile) => {
  localStorage.setItem('ritmo-device-profile', JSON.stringify(profile));
  window.dispatchEvent(new Event('ritmo-profile'));
};

export function useDeviceProfile(trackVisit = false) {
  const [profile, setProfile] = useState<DeviceProfile>(defaultProfile);
  useEffect(() => {
    const read = () => setProfile(loadProfile());
    const visit = () => {
      const current = loadProfile(),
        today = localDateKey();
      if (current.lastVisit === today) return;
      const streak = nextStreak(current.lastVisit, current.streak, current.activeDays);
      saveProfile({
        ...current,
        lastVisit: today,
        streak,
        longestStreak: Math.max(current.longestStreak, streak),
        activeDays: [...new Set([...current.activeDays, today])].slice(-365),
      });
    };
    if (trackVisit) visit();
    read();
    window.addEventListener('ritmo-profile', read);
    return () => window.removeEventListener('ritmo-profile', read);
  }, [trackVisit]);
  const update = (patch: Partial<DeviceProfile>) =>
    saveProfile({ ...loadProfile(), ...patch });
  return { profile, update };
}

export const recordLearningEvent = (correct: boolean, xp = 5) => {
  const current = loadProfile(),
    today = localDateKey(),
    dailyTotal = (current.dailyReviews[today] || 0) + 1;
  const isNewActiveDay = !current.activeDays.includes(today),
    streak = isNewActiveDay
      ? nextStreak(current.lastVisit, current.streak, current.activeDays)
      : current.streak;
  saveProfile({
    ...current,
    lastVisit: today,
    streak,
    longestStreak: Math.max(current.longestStreak, streak),
    activeDays: [...new Set([...current.activeDays, today])].slice(-365),
    totalReviews: current.totalReviews + 1,
    totalCorrect: current.totalCorrect + (correct ? 1 : 0),
    xp: current.xp + xp,
    dailyReviews: {
      ...current.dailyReviews,
      [today]: dailyTotal,
    },
  });
  if (dailyTotal >= DAILY_PLAN_TARGET)
    recordAchievementEvent({ type: 'daily-plan-complete', day: today });
  else window.setTimeout(() => evaluateAchievements(true), 0);
};

const achievementStorage = {
  stats: 'ritmo-achievement-stats',
  unlocks: 'ritmo-achievements',
};

const savedPlacementCount = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('ritmo-placement') || 'null');
    if (Array.isArray(stored?.history)) return stored.history.length;
    return stored?.skills ? 1 : 0;
  } catch {
    return 0;
  }
};

const savedPlacementLevel = (): '' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' => {
  try {
    const stored = JSON.parse(localStorage.getItem('ritmo-placement') || 'null'),
      result = stored?.latest || stored,
      level = String(result?.level || '').slice(0, 2);
    return ['A1', 'A2', 'B1', 'B2', 'C1'].includes(level)
      ? (level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1')
      : '';
  } catch {
    return '';
  }
};

const loadAchievementStats = (): AchievementStats => {
  try {
    const stored = JSON.parse(
      localStorage.getItem(achievementStorage.stats) || '{}',
    ),
      topicSessions =
        stored.topicSessions && typeof stored.topicSessions === 'object'
          ? stored.topicSessions
          : {};
    return {
      ...defaultAchievementStats,
      ...stored,
      lessonIds: Array.isArray(stored.lessonIds) ? stored.lessonIds : [],
      dailyChallengeDays: Array.isArray(stored.dailyChallengeDays)
        ? stored.dailyChallengeDays
        : [],
      dailyPlanDays: Array.isArray(stored.dailyPlanDays)
        ? stored.dailyPlanDays
        : [],
      placementTests: Math.max(
        Number(stored.placementTests) || 0,
        savedPlacementCount(),
      ),
      placementLevels: Array.isArray(stored.placementLevels)
        ? stored.placementLevels
        : savedPlacementLevel()
          ? [savedPlacementLevel()]
          : [],
      rushSessions: Math.max(0, Number(stored.rushSessions) || 0),
      rushSeconds: Math.max(0, Number(stored.rushSeconds) || 0),
      rushTotalScore: Math.max(0, Number(stored.rushTotalScore) || 0),
      rushBestScore: Math.max(0, Number(stored.rushBestScore) || 0),
      articleSessions: Math.max(0, Number(stored.articleSessions) || 0),
      articlePerfectSessions: Math.max(
        0,
        Number(stored.articlePerfectSessions) || 0,
      ),
      topicSessions,
      musicPracticeSessions: Math.max(
        Number(stored.musicPracticeSessions) || 0,
        Number(topicSessions['Музыка']) || 0,
      ),
    };
  } catch {
    return defaultAchievementStats;
  }
};

const loadAchievementUnlocks = (): Record<string, AchievementUnlock> => {
  try {
    const stored = JSON.parse(
      localStorage.getItem(achievementStorage.unlocks) || '{}',
    );
    return stored && typeof stored === 'object' ? stored : {};
  } catch {
    return {};
  }
};

const achievementForGender = (
  achievement: AchievementDefinition,
  gender: ProfileGender,
): AchievementDefinition => {
  if (gender !== 'M') return achievement;
  const femaleNames: Record<string, string> = {
    'palabras-50': 'Romántica',
    madrugador: 'Madrugadora',
    'articles-20': 'Maestra de Artículos',
    'rank-viajero': 'Viajera',
    'rank-senor': 'Señora',
    'rank-maestro': 'Maestra',
    'rank-ritmo': 'Maestra del Ritmo',
  };
  return femaleNames[achievement.id]
    ? { ...achievement, name: femaleNames[achievement.id] }
    : achievement;
};

const achievementContext = (stats = loadAchievementStats()): AchievementContext => {
  let learnedWords = 0,
    rushBest = 0;
  try {
    const records = JSON.parse(localStorage.getItem('ritmo-srs') || '{}') as Record<string, SRSRecord>,
      wordProgress = JSON.parse(localStorage.getItem('ritmo-word-progress') || '{}') as Record<string, WordStatus>;
    const lessonProgress = JSON.parse(
      localStorage.getItem('ritmo-lesson-progress') || '{}',
    ) as Record<string, { completed?: boolean }>;
    stats.lessonIds = [
      ...new Set([
        ...stats.lessonIds,
        ...Object.entries(lessonProgress)
          .filter(([, value]) => value?.completed)
          .map(([id]) => id),
      ]),
    ];
    learnedWords = makeStudyDeck()
      .filter((card) => card.skill === 'recognition')
      .filter((card) => derivedWordStatus(baseCardKey(card.key), records, wordProgress[baseCardKey(card.key)] || 'new') === 'learned').length;
    rushBest = Math.max(
      stats.rushBestScore,
      Number(JSON.parse(localStorage.getItem('ritmo-rush-records') || '{}').best) || 0,
    );
  } catch {}
  return { stats, profile: loadProfile(), learnedWords, rushBest };
};

export const evaluateAchievements = (notify = true) => {
  const context = achievementContext(),
    unlocks = loadAchievementUnlocks(),
    newlyUnlocked = achievementDefinitions.filter(
      (achievement) =>
        !unlocks[achievement.id] &&
        achievement.progress(context) >= achievement.target,
    );
  if (!newlyUnlocked.length) return;
  const unlockedAt = new Date().toISOString();
  newlyUnlocked.forEach((achievement) => {
    unlocks[achievement.id] = { unlockedAt };
  });
  localStorage.setItem(achievementStorage.unlocks, JSON.stringify(unlocks));
  window.dispatchEvent(new Event('ritmo-achievements'));
  if (notify)
    newlyUnlocked.forEach((achievement, index) =>
      window.setTimeout(
        () =>
          window.dispatchEvent(
            new CustomEvent('ritmo-achievement-unlocked', {
              detail: achievementForGender(achievement, context.profile.gender),
            }),
          ),
        index * 5200,
      ),
    );
};

export const recordAchievementEvent = (event: AchievementEvent) => {
  const stats = applyAchievementEvent(
    loadAchievementStats(),
    event,
    new Date().getHours(),
  );
  localStorage.setItem(achievementStorage.stats, JSON.stringify(stats));
  window.dispatchEvent(new Event('ritmo-achievement-stats'));
  evaluateAchievements(true);
};

export const recordError = (category: string) => {
  try {
    const errors = JSON.parse(
      localStorage.getItem('ritmo-error-profile') || '{}',
    );
    errors[category] = (errors[category] || 0) + 1;
    localStorage.setItem('ritmo-error-profile', JSON.stringify(errors));
    window.dispatchEvent(new Event('ritmo-errors'));
    trackLocalEvent('exercise_error', category);
  } catch {}
};

export function useCustomWords() {
  const [words, setWords] = useState<CustomWord[]>([]), [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        const stored = JSON.parse(
          localStorage.getItem('ritmo-custom-words') || '[]',
        );
        setWords(Array.isArray(stored) ? stored : []);
      } catch {
        setWords([]);
      }
    };
    read();
    setHydrated(true);
    window.addEventListener('ritmo-custom-words', read);
    return () => window.removeEventListener('ritmo-custom-words', read);
  }, []);
  const commit = (next: CustomWord[]) => {
    localStorage.setItem('ritmo-custom-words', JSON.stringify(next));
    setWords(next);
    window.dispatchEvent(new Event('ritmo-custom-words'));
  };
  const add = (word: Omit<CustomWord, 'id'>) =>
    commit([
      ...words,
      {
        ...word,
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `custom-${Date.now()}`,
      },
    ]);
  const remove = (id: string) => commit(words.filter((word) => word.id !== id));
  return { words, add, remove, hydrated };
}

export function useExampleReports() {
  const account = useAccount();
  const [reports, setReports] = useState<ExampleReport[]>([]);
  useEffect(() => {
    const read = () => {
      try {
        const stored = JSON.parse(
          localStorage.getItem('ritmo-example-reports') || '[]',
        );
        setReports(Array.isArray(stored) ? stored : []);
      } catch {
        setReports([]);
      }
    };
    read();
    window.addEventListener('ritmo-example-reports', read);
    return () => window.removeEventListener('ritmo-example-reports', read);
  }, []);
  const toggle = (report: Omit<ExampleReport, 'createdAt'>) => {
    const wasReported = reports.some((item) => item.id === report.id),
      next = wasReported
      ? reports.filter((item) => item.id !== report.id)
      : [...reports, { ...report, createdAt: new Date().toISOString() }];
    localStorage.setItem('ritmo-example-reports', JSON.stringify(next));
    setReports(next);
    window.dispatchEvent(new Event('ritmo-example-reports'));
    void account.reportContent({
      reportKey: report.id,
      kind: 'example',
      section: report.source,
      content: {
        word: report.word,
        example: report.example,
        translation: report.translation,
      },
      active: !wasReported,
    });
  };
  return { reports, toggle };
}

export function useLearnedWordsDb() {
  const [words, setWords] = useState<LearnedWordRecord[]>([]);
  useEffect(() => {
    const read = () => {
      try {
        const stored = JSON.parse(
          localStorage.getItem('ritmo-lesson-word-db') || '[]',
        );
        setWords(Array.isArray(stored) ? stored : []);
      } catch {
        setWords([]);
      }
    };
    read();
    window.addEventListener('ritmo-lesson-word-db', read);
    return () => window.removeEventListener('ritmo-lesson-word-db', read);
  }, []);
  const studyLessons = (
    lessons: Array<{ lessonId: string; lessonTitle: string }>,
  ) => {
    const now = new Date().toISOString(),
      additions = lessons.flatMap(({ lessonId, lessonTitle }) =>
        (lessonCoreVocabulary[lessonId] || []).map((word) => ({
          ...word,
          id: `${lessonId}-${normalizeText(word.es).replace(/\s+/g, '-')}`,
          lessonId,
          lessonTitle,
          firstStudiedAt: now,
          lastStudiedAt: now,
        })),
      ),
      byId = new Map(words.map((word) => [word.id, word]));
    additions.forEach((word) => {
      const old = byId.get(word.id);
      byId.set(word.id, {
        ...word,
        firstStudiedAt: old?.firstStudiedAt || word.firstStudiedAt,
      });
    });
    const next = [...byId.values()];
    localStorage.setItem('ritmo-lesson-word-db', JSON.stringify(next));
    setWords(next);
    window.dispatchEvent(new Event('ritmo-lesson-word-db'));
  };
  const studyLesson = (lessonId: string, lessonTitle: string) =>
    studyLessons([{ lessonId, lessonTitle }]);
  return { words, studyLesson, studyLessons };
}

const syncWordStatusFromSrs = (
  card: StudyCard,
  records: Record<string, SRSRecord>,
) => {
  const base = baseCardKey(card.key),
    related = Object.entries(records).filter(
      ([key, record]) => baseCardKey(key) === base && record.reviews > 0,
    ),
    failures = related.reduce((sum, [, record]) => sum + record.lapses, 0),
    status: WordStatus = wordIsLearned(card, records)
      ? 'learned'
      : failures >= 2
        ? 'difficult'
        : 'learning';
  try {
    const progress = JSON.parse(
        localStorage.getItem('ritmo-word-progress') || '{}',
      ),
      previous = progress[base] as WordStatus | undefined,
      history = JSON.parse(localStorage.getItem('ritmo-word-history') || '{}'),
      timestamp = new Date().toISOString();
    progress[base] = status;
    history[base] = {
      ...history[base],
      firstStudiedAt: history[base]?.firstStudiedAt || timestamp,
      learnedAt:
        status === 'learned'
          ? history[base]?.learnedAt || timestamp
          : history[base]?.learnedAt,
      lastChangedAt: timestamp,
    } satisfies WordHistoryRecord;
    localStorage.setItem('ritmo-word-progress', JSON.stringify(progress));
    localStorage.setItem('ritmo-word-history', JSON.stringify(history));
    window.dispatchEvent(new Event('ritmo-word-progress'));
    if (status === 'learned' && previous !== 'learned')
      localStorage.setItem(
        'ritmo-latest-achievement',
        JSON.stringify({ word: card.es, createdAt: timestamp }),
      );
    if (status === 'learned' && previous !== 'learned')
      window.dispatchEvent(
        new CustomEvent('ritmo-word-learned', {
          detail: { word: card.es, base },
        }),
      );
  } catch {}
};

export function useSRS() {
  const [records, setRecords] = useState<Record<string, SRSRecord>>({}),
    [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        setRecords(JSON.parse(localStorage.getItem('ritmo-srs') || '{}'));
      } catch {}
      setHydrated(true);
    };
    read();
    window.addEventListener('ritmo-srs', read);
    return () => window.removeEventListener('ritmo-srs', read);
  }, []);
  const commit = (next: Record<string, SRSRecord>) => {
    localStorage.setItem('ritmo-srs', JSON.stringify(next));
    setRecords(next);
    window.dispatchEvent(new Event('ritmo-srs'));
  };
  const rate = (
    card: StudyCard,
    grade: ReviewGrade,
    evidence?: { format: string; correct: boolean },
  ) => {
    const updated = scheduleReview(records[card.key], grade);
    const nextRecords = { ...records, [card.key]: updated };
    if (
      evidence?.correct &&
      grade !== 'again' &&
      !['choice', 'self'].includes(evidence.format)
    ) {
      const base = baseCardKey(card.key),
        siblingSkills: SkillType[] =
          card.skill === 'dictation' || evidence.format === 'audioSentence'
            ? ['production', 'listening']
            : card.skill === 'production'
              ? ['recognition']
              : [];
      siblingSkills.forEach((skill) => {
        const key = `${base}-${skill}`,
          sibling = nextRecords[key];
        if (!sibling?.reviews || key === card.key) return;
        const remaining = Math.max(0, sibling.nextReview - Date.now());
        nextRecords[key] = {
          ...sibling,
          stability: sibling.stability * 1.08,
          difficulty: Math.max(1, sibling.difficulty - 0.1),
          nextReview: sibling.nextReview + remaining * 0.05,
        };
      });
    }
    commit(nextRecords);
    syncWordStatusFromSrs(card, nextRecords);
    window.setTimeout(() => evaluateAchievements(true), 0);
  };
  const toggleFavorite = (card: StudyCard) => {
    const old = records[card.key] || blankSRS();
    commit({ ...records, [card.key]: { ...old, favorite: !old.favorite } });
  };
  const markNew = (card: StudyCard) => {
    const base = baseCardKey(card.key),
      next = Object.fromEntries(
        Object.entries(records).filter(([key]) => baseCardKey(key) !== base),
      );
    commit(next);
    try {
      const statuses = JSON.parse(
        localStorage.getItem('ritmo-word-progress') || '{}',
      );
      statuses[base] = 'new';
      localStorage.setItem('ritmo-word-progress', JSON.stringify(statuses));
      window.dispatchEvent(new Event('ritmo-word-progress'));
    } catch {}
  };
  const markLearned = (card: StudyCard) => {
    const base = baseCardKey(card.key),
      now = Date.now(),
      nextReview = now + 365 * 86_400_000,
      skills: SkillType[] = ['recognition', 'production', 'context', 'listening', 'dictation', 'article'],
      next = { ...records };
    skills.forEach((skill) => {
      const key = `${base}-${skill}`,
        old = records[key] || blankSRS();
      next[key] = {
        ...old,
        difficulty: Math.min(old.difficulty, 2),
        stability: Math.max(old.stability, 365),
        lastReview: now,
        nextReview,
        correctStreak: Math.max(old.correctStreak, 3),
        reviews: Math.max(old.reviews, 4),
        successes: Math.max(old.successes, 4),
        lastGrade: 'easy',
      };
    });
    commit(next);
    syncWordStatusFromSrs(card, next);
    window.setTimeout(() => evaluateAchievements(true), 0);
  };
  return { records, rate, toggleFavorite, markNew, markLearned, hydrated };
}

export function useWordProgress() {
  const [progress, setProgress] = useState<Record<string, WordStatus>>({});
  useEffect(() => {
    const read = () => {
      try {
        setProgress(
          JSON.parse(localStorage.getItem('ritmo-word-progress') || '{}'),
        );
      } catch {}
    };
    read();
    window.addEventListener('ritmo-word-progress', read);
    return () => window.removeEventListener('ritmo-word-progress', read);
  }, []);
  const update = (key: string, status: WordStatus) =>
    setProgress((current) => {
      const next = { ...current, [key]: status };
      localStorage.setItem('ritmo-word-progress', JSON.stringify(next));
      try {
        const history = JSON.parse(
            localStorage.getItem('ritmo-word-history') || '{}',
          ),
          timestamp = new Date().toISOString();
        history[key] = {
          ...history[key],
          firstStudiedAt:
            status === 'new'
              ? history[key]?.firstStudiedAt
              : history[key]?.firstStudiedAt || timestamp,
          lastChangedAt: timestamp,
        } satisfies WordHistoryRecord;
        localStorage.setItem('ritmo-word-history', JSON.stringify(history));
      } catch {}
      window.dispatchEvent(new Event('ritmo-word-progress'));
      return next;
    });
  return { progress, update };
}

export function useWordHistory() {
  const [history, setHistory] = useState<Record<string, WordHistoryRecord>>({});
  useEffect(() => {
    const read = () => {
      try {
        setHistory(
          JSON.parse(localStorage.getItem('ritmo-word-history') || '{}'),
        );
      } catch {}
    };
    read();
    window.addEventListener('ritmo-word-progress', read);
    return () => window.removeEventListener('ritmo-word-progress', read);
  }, []);
  return history;
}

export function useWordSessions() {
  const [sessions, setSessions] = useState<WordSessionProgress>({});
  useEffect(() => {
    const read = () => {
      try {
        setSessions(JSON.parse(localStorage.getItem('ritmo-word-sessions') || '{}'));
      } catch {}
    };
    read();
    window.addEventListener('ritmo-word-sessions', read);
    return () => window.removeEventListener('ritmo-word-sessions', read);
  }, []);
  const record = (
    base: string,
    sessionId: string,
    successful: boolean,
    sentenceDictation: boolean,
  ) =>
    setSessions((current) => {
      const next = recordWordSession(
        current,
        base,
        sessionId,
        successful,
        sentenceDictation,
      );
      localStorage.setItem('ritmo-word-sessions', JSON.stringify(next));
      window.dispatchEvent(new Event('ritmo-word-sessions'));
      window.dispatchEvent(new Event('ritmo-cloud-progress-changed'));
      return next;
    });
  return { sessions, record };
}

export function useContentFavorites() {
  const [items, setItems] = useState<ContentFavorite[]>([]);
  useEffect(() => {
    const read = () => {
      try {
        setItems(
          JSON.parse(localStorage.getItem('ritmo-content-favorites') || '[]'),
        );
      } catch {}
    };
    read();
    window.addEventListener('ritmo-favorites', read);
    return () => window.removeEventListener('ritmo-favorites', read);
  }, []);
  const toggle = (item: ContentFavorite) => {
    const next = items.some((saved) => saved.id === item.id)
      ? items.filter((saved) => saved.id !== item.id)
      : [...items, item];
    localStorage.setItem('ritmo-content-favorites', JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new Event('ritmo-favorites'));
  };
  return { items, toggle };
}

export function useLessonProgress() {
  const [progress, setProgress] = useState<LessonProgress>({});
  useEffect(() => {
    const read = () => {
      try {
        const stored = JSON.parse(
          localStorage.getItem('ritmo-lesson-progress') || '{}',
        ) as LessonProgress;
        let changed = false;
        const current = { ...stored };
        for (const lesson of courseLessons) {
          const state = current[lesson.id];
          if (lesson.id === 'home' && state && state.contentVersion !== 'prepositions-v1') {
            const oldKeys = state.errorIds?.length ? state.errorIds : (state.errors || []).map((index) => LEGACY_HOME_EXERCISE_KEYS[index]).filter(Boolean);
            const oldErrors = oldKeys.map((key) => {
              const split = key.lastIndexOf('::');
              return [key, { itemKey: key, prompt: key.slice(0, split), correctAnswer: key.slice(split + 2), studentAnswer: null, answeredAt: null, explanation: '', rule: 'Предыдущая версия урока 4' }] as const;
            });
            current[lesson.id] = { done: 0, completed: false, correct: 0, contentVersion: 'prepositions-v1', errorHistory: { ...Object.fromEntries(oldErrors), ...state.errorHistory } };
            changed = true;
            continue;
          }
          if (state?.completed && state.done < lesson.exercises.length) {
            current[lesson.id] = { ...state, completed: false };
            changed = true;
          }
        }
        if (changed)
          localStorage.setItem('ritmo-lesson-progress', JSON.stringify(current));
        setProgress(current);
      } catch {}
    };
    read();
    window.addEventListener('ritmo-progress', read);
    return () => window.removeEventListener('ritmo-progress', read);
  }, []);
  const save = (id: string, value: LessonState) =>
    setProgress((current) => {
      const next = { ...current, [id]: value };
      localStorage.setItem('ritmo-lesson-progress', JSON.stringify(next));
      window.dispatchEvent(new Event('ritmo-progress'));
      return next;
    });
  return { progress, save };
}

export function useAchievements() {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('ritmo-achievements', refresh);
    window.addEventListener('ritmo-achievement-stats', refresh);
    window.addEventListener('ritmo-profile', refresh);
    window.addEventListener('ritmo-word-progress', refresh);
    return () => {
      window.removeEventListener('ritmo-achievements', refresh);
      window.removeEventListener('ritmo-achievement-stats', refresh);
      window.removeEventListener('ritmo-profile', refresh);
      window.removeEventListener('ritmo-word-progress', refresh);
    };
  }, []);
  if (typeof window === 'undefined')
    return achievementDefinitions.map((achievement) => ({
      ...achievement,
      current: 0,
      unlocked: false,
      unlockedAt: '',
    }));
  void revision;
  const context = achievementContext(),
    unlocks = loadAchievementUnlocks();
  return achievementDefinitions.map((achievement) => ({
    ...achievementForGender(achievement, context.profile.gender),
    current: Math.min(
      achievement.target,
      Math.max(0, achievement.progress(context)),
    ),
    unlocked: !!unlocks[achievement.id],
    unlockedAt: unlocks[achievement.id]?.unlockedAt || '',
  }));
}

export function useAchievementStats() {
  const [stats, setStats] = useState<AchievementStats>(defaultAchievementStats);
  useEffect(() => {
    const refresh = () => setStats(loadAchievementStats());
    refresh();
    window.addEventListener('ritmo-achievement-stats', refresh);
    return () => window.removeEventListener('ritmo-achievement-stats', refresh);
  }, []);
  return stats;
}

export function useErrorProfile() {
  const [errors, setErrors] = useState<Record<string, number>>({});
  useEffect(() => {
    const read = () => {
      try {
        setErrors(
          JSON.parse(localStorage.getItem('ritmo-error-profile') || '{}'),
        );
      } catch {}
    };
    read();
    window.addEventListener('ritmo-errors', read);
    return () => window.removeEventListener('ritmo-errors', read);
  }, []);
  return errors;
}
