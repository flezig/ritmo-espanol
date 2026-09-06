'use client';

import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Download,
  Flame,
  GraduationCap,
  Headphones,
  Heart,
  Home,
  Languages,
  Library,
  Lightbulb,
  Menu,
  Moon,
  Music2,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  UserRound,
  Volume2,
  Zap,
} from 'lucide-react';
import { vocabularyTopics } from './vocabulary';
import { courseLessons } from './lessons';
import { YouTubeEmbed } from './components/youtube-embed';
import { AccountProvider, useAccount } from './components/account-provider';
import { ReportExerciseButton } from './components/report-exercise-button';
import { trackLocalEvent } from './lib/local-analytics';
import { parsePracticeSnapshot, reconcilePracticeCards } from './lib/practice-session';
import { BACKUP_KEYS, BACKUP_VERSION, isValidBackup, type RitmoBackup } from './lib/backup';
import {
  applyAchievementEvent,
  defaultAchievementStats,
  type AchievementEvent,
  type AchievementStats,
} from './lib/achievements';
import { STANDARD_RECOGNITION_DISTRIBUTION } from './lib/practice-distribution';
import {
  inferGenderArticle,
  maskExactTerm,
  makeSingleWordCorrection,
} from './lib/practice-content';
import {
  analyzeAnswer,
  baseCardKey,
  blankSRS,
  derivedWordStatus,
  hasOnlySpanishMarkDifference,
  localDateKey,
  masteredRecord,
  nextStreak,
  normalizeText,
  scheduleReview,
  type AnswerAnalysis,
  type ReviewGrade,
  type SRSRecord,
  type WordStatus,
} from './lib/learning-core';

type Section =
  | 'Home'
  | 'Learn'
  | 'Lessons'
  | 'Vocabulary'
  | 'Grammar'
  | 'Music'
  | 'Practice'
  | 'Dictation'
  | 'Progress'
  | 'Achievements'
  | 'Profile';

const TodayPanel = lazy(() => import('./components/today-panel'));
const AnalyticsPanel = lazy(() => import('./components/analytics-panel'));

const nav: { name: Section; label: string; icon: typeof Home }[] = [
  { name: 'Home', label: 'Главная', icon: Home },
  { name: 'Learn', label: 'Быстрый старт', icon: BookOpen },
  { name: 'Lessons', label: 'Уроки', icon: GraduationCap },
  { name: 'Vocabulary', label: 'Словарь', icon: Library },
  { name: 'Grammar', label: 'Грамматика', icon: Languages },
  { name: 'Music', label: 'Музыка', icon: Music2 },
  { name: 'Practice', label: 'Практика', icon: Zap },
  { name: 'Dictation', label: 'Диктант', icon: Headphones },
  { name: 'Progress', label: 'Прогресс', icon: BarChart3 },
  { name: 'Achievements', label: 'Достижения', icon: Award },
  { name: 'Profile', label: 'Профиль', icon: UserRound },
];

const motivation = [
  'Cada paso cuenta — каждый шаг считается.',
  'Hoy una palabra, mañana una conversación.',
  'Los errores también enseñan — ошибки тоже учат.',
  'Tu ritmo es suficiente. Sigue adelante.',
  'Poco a poco se llega lejos — маленькими шагами можно дойти далеко.',
  'La constancia vale más que la perfección.',
];

const statusLabels: Record<WordStatus, string> = {
  new: 'Новое',
  learning: 'Учу',
  learned: 'Выучено',
  difficult: 'Сложное',
};
type SkillType =
  | 'recognition'
  | 'production'
  | 'article'
  | 'context'
  | 'listening'
  | 'dictation';
type StudyCard = {
  key: string;
  topic: string;
  es: string;
  ru: string;
  example: string;
  exampleRu?: string;
  extraExample?: string;
  extraExampleRu?: string;
  skill: SkillType;
  answer: string;
  prompt: string;
};
type CustomWord = {
  id: string;
  es: string;
  ru: string;
  example: string;
  exampleRu: string;
  extraExample: string;
  extraExampleRu: string;
};
type ExampleReport = {
  id: string;
  word: string;
  example: string;
  translation: string;
  source: string;
  createdAt: string;
};
type LessonWord = {
  es: string;
  ru: string;
  example: string;
  exampleRu: string;
};
type LearnedWordRecord = LessonWord & {
  id: string;
  lessonId: string;
  lessonTitle: string;
  firstStudiedAt: string;
  lastStudiedAt: string;
};
type WordHistoryRecord = {
  firstStudiedAt?: string;
  learnedAt?: string;
  lastChangedAt: string;
};
type DeviceProfile = {
  name: string;
  level: string;
  dailyGoal: 5 | 15;
  streak: number;
  longestStreak: number;
  lastVisit: string;
  activeDays: string[];
  totalReviews: number;
  totalCorrect: number;
  xp: number;
  dailyReviews: Record<string, number>;
};
const skillLabels: Record<SkillType, string> = {
  recognition: 'Узнавание',
  production: 'Активный словарь',
  article: 'Артикли и род',
  context: 'Контекст / мини-диалог',
  listening: 'Аудирование',
  dictation: 'Диктант',
};
const defaultProfile: DeviceProfile = {
  name: 'Maya',
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
const russianDayWord = (count: number) => {
  const mod100 = count % 100,
    mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'дней';
  if (mod10 === 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
};
const loadProfile = (): DeviceProfile => {
  try {
    return {
      ...defaultProfile,
      ...JSON.parse(localStorage.getItem('ritmo-device-profile') || '{}'),
    };
  } catch {
    return defaultProfile;
  }
};
const saveProfile = (profile: DeviceProfile) => {
  localStorage.setItem('ritmo-device-profile', JSON.stringify(profile));
  window.dispatchEvent(new Event('ritmo-profile'));
};
function useDeviceProfile(trackVisit = false) {
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
const recordLearningEvent = (correct: boolean, xp = 5) => {
  const current = loadProfile(),
    today = localDateKey();
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
      [today]: (current.dailyReviews[today] || 0) + 1,
    },
  });
  window.setTimeout(() => evaluateAchievements(true), 0);
};

type AchievementCategory =
  | 'Старт'
  | 'Регулярность'
  | 'Прогресс'
  | 'Мастерство'
  | 'Культура'
  | 'Секретные';
type AchievementDefinition = {
  id: string;
  category: AchievementCategory;
  icon: string;
  name: string;
  secret?: boolean;
  lockedMotto: string;
  unlockedMotto: string;
  description: string;
  target: number;
  progress: (context: AchievementContext) => number;
};
type AchievementContext = {
  stats: AchievementStats;
  profile: DeviceProfile;
  learnedWords: number;
  rushBest: number;
};
type AchievementUnlock = { unlockedAt: string };
const achievementStorage = {
  stats: 'ritmo-achievement-stats',
  unlocks: 'ritmo-achievements',
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
const achievementDefinitions: AchievementDefinition[] = [
  { id: 'hola', category: 'Старт', icon: '👋', name: '¡Hola!', lockedMotto: '«Todo empieza con una palabra.»', unlockedMotto: '«Ya has dado el primer paso.»', description: 'Завершить первый урок.', target: 1, progress: ({ stats }) => Number(stats.lessonIds.includes('intro')) },
  { id: 'primer-ritmo', category: 'Старт', icon: '🐾', name: 'Primer Ritmo', lockedMotto: '«Encuentra tu ritmo.»', unlockedMotto: '«Tu ritmo ya ha comenzado.»', description: 'Завершить первую сессию Practice.', target: 1, progress: ({ stats }) => stats.practiceSessions },
  { id: 'primera-cancion', category: 'Старт', icon: '🎧', name: 'Primera Canción', lockedMotto: '«Escucha con atención.»', unlockedMotto: '«La primera canción ya es tuya.»', description: 'Завершить один полный тест по песне.', target: 1, progress: ({ stats }) => stats.songSessions },
  { id: 'racha-3', category: 'Регулярность', icon: '🔥', name: 'Tres Días', lockedMotto: '«La constancia empieza aquí.»', unlockedMotto: '«Tres días, un solo ritmo.»', description: 'Заниматься 3 дня подряд.', target: 3, progress: ({ profile }) => profile.streak },
  { id: 'racha-7', category: 'Регулярность', icon: '🌶️', name: 'Semana Picante', lockedMotto: '«Una semana puede cambiar mucho.»', unlockedMotto: '«Siete días sin perder el sabor.»', description: 'Заниматься 7 дней подряд.', target: 7, progress: ({ profile }) => profile.streak },
  { id: 'racha-14', category: 'Регулярность', icon: '🌉', name: 'Dos Semanas', lockedMotto: '«Un puente se construye paso a paso.»', unlockedMotto: '«Catorce días ya forman un camino.»', description: 'Заниматься 14 дней подряд.', target: 14, progress: ({ profile }) => profile.streak },
  { id: 'racha-30', category: 'Регулярность', icon: '🌞', name: 'Mes de Sol', lockedMotto: '«Vuelve mañana.»', unlockedMotto: '«Treinta amaneceres en español.»', description: 'Заниматься 30 дней подряд.', target: 30, progress: ({ profile }) => profile.streak },
  { id: 'racha-60', category: 'Регулярность', icon: '🧭', name: 'Camino Largo', lockedMotto: '«Sigue la brújula un día más.»', unlockedMotto: '«Sesenta días sin perder el norte.»', description: 'Заниматься 60 дней подряд.', target: 60, progress: ({ profile }) => profile.streak },
  { id: 'racha-100', category: 'Регулярность', icon: '💯', name: 'Cien Días', lockedMotto: '«La paciencia también habla español.»', unlockedMotto: '«Cien días. Esto ya es parte de ti.»', description: 'Заниматься 100 дней подряд.', target: 100, progress: ({ profile }) => profile.streak },
  { id: 'active-10', category: 'Регулярность', icon: '📅', name: 'Diez Encuentros', lockedMotto: '«Cada regreso cuenta.»', unlockedMotto: '«Has vuelto diez veces al español.»', description: 'Заниматься в 10 разных календарных дней.', target: 10, progress: ({ profile }) => profile.activeDays.length },
  { id: 'active-30', category: 'Регулярность', icon: '🗓️', name: 'Treinta Encuentros', lockedMotto: '«No hace falta correr para avanzar.»', unlockedMotto: '«Treinta días activos quedaron en tu historia.»', description: 'Заниматься в 30 разных календарных дней.', target: 30, progress: ({ profile }) => profile.activeDays.length },
  { id: 'active-100', category: 'Регулярность', icon: '🏮', name: 'Siempre Vuelves', lockedMotto: '«La puerta seguirá abierta.»', unlockedMotto: '«Has regresado cien días distintos.»', description: 'Заниматься в 100 разных календарных дней.', target: 100, progress: ({ profile }) => profile.activeDays.length },
  { id: 'palabras-10', category: 'Прогресс', icon: '🌱', name: 'Primer Brote', lockedMotto: '«Todo jardín empieza pequeño.»', unlockedMotto: '«Tus primeras diez palabras ya crecen.»', description: 'Надёжно выучить 10 слов.', target: 10, progress: ({ learnedWords }) => learnedWords },
  { id: 'palabras-25', category: 'Прогресс', icon: '🪴', name: 'Jardín de Palabras', lockedMotto: '«Cuida cada palabra.»', unlockedMotto: '«Veinticinco palabras echaron raíces.»', description: 'Надёжно выучить 25 слов.', target: 25, progress: ({ learnedWords }) => learnedWords },
  { id: 'palabras-50', category: 'Прогресс', icon: '🌹', name: 'Romántico', lockedMotto: '«Las palabras acercan.»', unlockedMotto: '«Cincuenta palabras ya florecen.»', description: 'Надёжно выучить 50 слов.', target: 50, progress: ({ learnedWords }) => learnedWords },
  { id: 'palabras-100', category: 'Прогресс', icon: '📖', name: 'Cien Historias', lockedMotto: '«Cada palabra abre una página.»', unlockedMotto: '«Cien palabras, cien pequeñas historias.»', description: 'Надёжно выучить 100 слов.', target: 100, progress: ({ learnedWords }) => learnedWords },
  { id: 'palabras-250', category: 'Прогресс', icon: '📚', name: 'Calles de Palabras', lockedMotto: '«Cada calle tiene una historia.»', unlockedMotto: '«Ya conoces doscientas cincuenta.»', description: 'Надёжно выучить 250 слов.', target: 250, progress: ({ learnedWords }) => learnedWords },
  { id: 'palabras-500', category: 'Прогресс', icon: '🗺️', name: 'Medio Mundo', lockedMotto: '«El mapa todavía guarda secretos.»', unlockedMotto: '«Quinientas palabras ampliaron tu mundo.»', description: 'Надёжно выучить 500 слов.', target: 500, progress: ({ learnedWords }) => learnedWords },
  { id: 'palabras-1000', category: 'Прогресс', icon: '🏛️', name: 'Mil Voces', lockedMotto: '«Una ciudad entera te espera.»', unlockedMotto: '«Mil palabras hablan contigo.»', description: 'Надёжно выучить 1000 слов.', target: 1000, progress: ({ learnedWords }) => learnedWords },
  { id: 'lessons-3', category: 'Прогресс', icon: '🛋️', name: 'Casa con Vida', lockedMotto: '«La casa todavía espera.»', unlockedMotto: '«Tres lecciones llenaron la casa de vida.»', description: 'Полностью завершить 3 урока по 50 заданий.', target: 3, progress: ({ stats }) => stats.lessonIds.length },
  { id: 'lessons-5', category: 'Прогресс', icon: '🏡', name: 'Hogar Completo', lockedMotto: '«Falta un último rincón.»', unlockedMotto: '«El hogar de los gatos está completo.»', description: 'Полностью завершить все 5 стартовых уроков.', target: 5, progress: ({ stats }) => stats.lessonIds.length },
  { id: 'lessons-10', category: 'Прогресс', icon: '🌳', name: 'El Patio', lockedMotto: '«Fuera de casa empieza otro mundo.»', unlockedMotto: '«Diez lecciones abrieron el patio.»', description: 'Полностью завершить 10 уроков.', target: 10, progress: ({ stats }) => stats.lessonIds.length },
  { id: 'lessons-15', category: 'Прогресс', icon: '🚲', name: 'Nuestra Calle', lockedMotto: '«Una puerta lleva a una calle.»', unlockedMotto: '«Quince lecciones construyeron nuestra calle.»', description: 'Полностью завершить 15 уроков.', target: 15, progress: ({ stats }) => stats.lessonIds.length },
  { id: 'lessons-25', category: 'Прогресс', icon: '🏘️', name: 'El Barrio', lockedMotto: '«Las casas necesitan vecinos.»', unlockedMotto: '«Veinticinco lecciones llenaron el barrio.»', description: 'Полностью завершить 25 уроков.', target: 25, progress: ({ stats }) => stats.lessonIds.length },
  { id: 'lessons-40', category: 'Прогресс', icon: '🏫', name: 'Plaza Mayor', lockedMotto: '«Todos los caminos buscan una plaza.»', unlockedMotto: '«Cuarenta lecciones abrieron la plaza.»', description: 'Полностью завершить 40 уроков.', target: 40, progress: ({ stats }) => stats.lessonIds.length },
  { id: 'lessons-60', category: 'Прогресс', icon: '🏙️', name: 'Ciudad de los Gatos', lockedMotto: '«Una ciudad se levanta poco a poco.»', unlockedMotto: '«Sesenta lecciones encendieron toda la ciudad.»', description: 'Полностью завершить 60 уроков.', target: 60, progress: ({ stats }) => stats.lessonIds.length },
  { id: 'lessons-80', category: 'Прогресс', icon: '🌆', name: 'La Gran Capital', lockedMotto: '«Las luces se ven desde muy lejos.»', unlockedMotto: '«Ochenta lecciones hicieron crecer la capital.»', description: 'Полностью завершить 80 уроков.', target: 80, progress: ({ stats }) => stats.lessonIds.length },
  { id: 'lessons-final', category: 'Прогресс', icon: '🌌', name: 'Mundo de Ritmo', secret: true, lockedMotto: '???', unlockedMotto: '«Has construido un mundo entero.»', description: 'Полностью завершить 100 уроков.', target: 100, progress: ({ stats }) => stats.lessonIds.length },
  { id: 'xp-100', category: 'Прогресс', icon: '⚡', name: 'Primera Energía', lockedMotto: '«Una chispa busca compañía.»', unlockedMotto: '«Cien puntos pusieron todo en movimiento.»', description: 'Заработать 100 XP в упражнениях.', target: 100, progress: ({ profile }) => profile.xp },
  { id: 'xp-500', category: 'Прогресс', icon: '🔋', name: 'Energía Completa', lockedMotto: '«Sigue cargando tu español.»', unlockedMotto: '«Quinientos puntos llenaron la batería.»', description: 'Заработать 500 XP в упражнениях.', target: 500, progress: ({ profile }) => profile.xp },
  { id: 'xp-1000', category: 'Прогресс', icon: '✨', name: 'Mil Chispas', lockedMotto: '«Cada respuesta deja una chispa.»', unlockedMotto: '«Mil puntos iluminan tu camino.»', description: 'Заработать 1000 XP в упражнениях.', target: 1000, progress: ({ profile }) => profile.xp },
  { id: 'xp-2500', category: 'Прогресс', icon: '🚀', name: 'Despegue', lockedMotto: '«La pista todavía no termina.»', unlockedMotto: '«Dos mil quinientos puntos: ya estás volando.»', description: 'Заработать 2500 XP в упражнениях.', target: 2500, progress: ({ profile }) => profile.xp },
  { id: 'xp-5000', category: 'Прогресс', icon: '🌠', name: 'Órbita Española', lockedMotto: '«El cielo queda un poco más arriba.»', unlockedMotto: '«Cinco mil puntos te pusieron en órbita.»', description: 'Заработать 5000 XP в упражнениях.', target: 5000, progress: ({ profile }) => profile.xp },
  { id: 'xp-10000', category: 'Прогресс', icon: '🌟', name: 'Diez Mil Estrellas', lockedMotto: '«Todavía queda cielo por descubrir.»', unlockedMotto: '«Diez mil puntos brillan en tu perfil.»', description: 'Заработать 10 000 XP в упражнениях.', target: 10000, progress: ({ profile }) => profile.xp },
  { id: 'xp-25000', category: 'Прогресс', icon: '☄️', name: 'Cometa', lockedMotto: '«Deja una estela más larga.»', unlockedMotto: '«Veinticinco mil puntos cruzaron el cielo.»', description: 'Заработать 25 000 XP в упражнениях.', target: 25000, progress: ({ profile }) => profile.xp },
  { id: 'xp-50000', category: 'Прогресс', icon: '🌌', name: 'Galaxia', lockedMotto: '«Cada respuesta enciende una estrella.»', unlockedMotto: '«Cincuenta mil puntos forman tu galaxia.»', description: 'Заработать 50 000 XP в упражнениях.', target: 50000, progress: ({ profile }) => profile.xp },
  { id: 'answers-25', category: 'Мастерство', icon: '🎯', name: 'Buen Comienzo', lockedMotto: '«Apunta con calma.»', unlockedMotto: '«Veinticinco respuestas dieron en el blanco.»', description: 'Дать 25 правильных ответов на сайте.', target: 25, progress: ({ profile }) => profile.totalCorrect },
  { id: 'perfecto', category: 'Мастерство', icon: '💯', name: 'Perfecto', secret: true, lockedMotto: '???', unlockedMotto: '«Ni un solo error.»', description: 'Завершить сессию Practice без ошибок.', target: 1, progress: ({ stats }) => stats.perfectSessions },
  { id: 'perfect-5', category: 'Мастерство', icon: '💎', name: 'Cinco Diamantes', lockedMotto: '«La precisión deja huellas.»', unlockedMotto: '«Cinco sesiones brillaron sin errores.»', description: 'Завершить 5 сессий Practice без ошибок.', target: 5, progress: ({ stats }) => stats.perfectSessions },
  { id: 'perfect-10', category: 'Мастерство', icon: '👑', name: 'Corona Perfecta', lockedMotto: '«Una corona se gana respuesta a respuesta.»', unlockedMotto: '«Diez sesiones perfectas. La corona es tuya.»', description: 'Завершить 10 сессий Practice без ошибок.', target: 10, progress: ({ stats }) => stats.perfectSessions },
  { id: 'oido-10', category: 'Мастерство', icon: '👂', name: 'Oído Despierto', lockedMotto: '«Escucha un poco más cerca.»', unlockedMotto: '«Ya reconoces el pulso del idioma.»', description: 'Правильно выполнить 10 аудиозаданий.', target: 10, progress: ({ stats }) => stats.listeningCorrect },
  { id: 'buen-oido', category: 'Мастерство', icon: '🎧', name: 'Buen oído', lockedMotto: '«Escucha lo que otros no oyen.»', unlockedMotto: '«Tu oído ya sigue el ritmo.»', description: 'Правильно выполнить 50 аудиозаданий.', target: 50, progress: ({ stats }) => stats.listeningCorrect },
  { id: 'oido-100', category: 'Мастерство', icon: '🎼', name: 'Oído Fino', lockedMotto: '«Entre sonidos hay detalles.»', unlockedMotto: '«Cien respuestas afinadas al oído.»', description: 'Правильно выполнить 100 аудиозаданий.', target: 100, progress: ({ stats }) => stats.listeningCorrect },
  { id: 'voz-10', category: 'Мастерство', icon: '🎙️', name: 'Primera Voz', lockedMotto: '«Tu voz también aprende.»', unlockedMotto: '«Diez respuestas ya suenan con confianza.»', description: 'Уверенно оценить 10 устных ответов.', target: 10, progress: ({ stats }) => stats.pronunciationCorrect },
  { id: 'sin-miedo', category: 'Мастерство', icon: '🗣️', name: 'Sin miedo', lockedMotto: '«Habla aunque no sea perfecto.»', unlockedMotto: '«Tu voz ya no se esconde.»', description: 'Уверенно оценить 50 устных ответов.', target: 50, progress: ({ stats }) => stats.pronunciationCorrect },
  { id: 'voz-100', category: 'Мастерство', icon: '📣', name: 'Voz Segura', lockedMotto: '«Haz que cada palabra se escuche.»', unlockedMotto: '«Cien respuestas salieron sin miedo.»', description: 'Уверенно оценить 100 устных ответов.', target: 100, progress: ({ stats }) => stats.pronunciationCorrect },
  { id: 'maestro-100', category: 'Мастерство', icon: '🎯', name: 'Cien Aciertos', lockedMotto: '«La precisión se entrena.»', unlockedMotto: '«Cien respuestas encontraron su lugar.»', description: 'Дать 100 правильных ответов на сайте.', target: 100, progress: ({ profile }) => profile.totalCorrect },
  { id: 'maestro-250', category: 'Мастерство', icon: '🏹', name: 'Pulso Firme', lockedMotto: '«Mantén firme el pulso.»', unlockedMotto: '«Doscientos cincuenta aciertos sin soltar el ritmo.»', description: 'Дать 250 правильных ответов на сайте.', target: 250, progress: ({ profile }) => profile.totalCorrect },
  { id: 'maestro-500', category: 'Мастерство', icon: '🏆', name: 'Maestro del Ritmo', lockedMotto: '«La práctica todavía tiene música.»', unlockedMotto: '«Quinientos aciertos ya marcan tu ritmo.»', description: 'Дать 500 правильных ответов на сайте.', target: 500, progress: ({ profile }) => profile.totalCorrect },
  { id: 'maestro-1000', category: 'Мастерство', icon: '🌟', name: 'Leyenda', lockedMotto: '«Las leyendas también practican.»', unlockedMotto: '«Mil respuestas correctas. Ya eres parte de la historia.»', description: 'Дать 1000 правильных ответов на сайте.', target: 1000, progress: ({ profile }) => profile.totalCorrect },
  { id: 'ritmo-colombiano', category: 'Культура', icon: '🎵', name: 'Ritmo Colombiano', lockedMotto: '«La música ya está dentro de ti.»', unlockedMotto: '«Has encontrado el ritmo.»', description: 'Завершить 5 сессий Practice по теме «Музыка».', target: 5, progress: ({ stats }) => stats.musicPracticeSessions },
  { id: 'bogota', category: 'Культура', icon: '🇨🇴', name: 'Un Día en Bogotá', lockedMotto: '«Cuatro rutas llevan a la capital.»', unlockedMotto: '«Bogotá ya habla contigo.»', description: 'Завершить практику по темам: еда, музыка, город и путешествия.', target: 4, progress: ({ stats }) => ['Еда и ресторан', 'Музыка', 'Город и транспорт', 'Путешествия'].filter((topic) => (stats.topicSessions[topic] || 0) > 0).length },
  { id: 'madrid', category: 'Культура', icon: '🇪🇸', name: 'Fin de Semana en Madrid', lockedMotto: '«La ciudad nunca termina.»', unlockedMotto: '«Madrid ya conoce tus pasos.»', description: 'Завершить практику по городу, еде, досугу и путешествиям.', target: 4, progress: ({ stats }) => ['Город и транспорт', 'Еда и ресторан', 'Досуг и хобби', 'Путешествия'].filter((topic) => (stats.topicSessions[topic] || 0) > 0).length },
  { id: 'mexico', category: 'Культура', icon: '🇲🇽', name: 'Una Noche en México', lockedMotto: '«La noche empieza con tres temas.»', unlockedMotto: '«México encendió sus luces.»', description: 'Завершить практику по еде, музыке и знакомству.', target: 3, progress: ({ stats }) => ['Еда и ресторан', 'Музыка', 'Знакомство и о себе'].filter((topic) => (stats.topicSessions[topic] || 0) > 0).length },
  { id: 'caribe', category: 'Культура', icon: '🏝️', name: 'Vacaciones en el Caribe', lockedMotto: '«El mar guarda cuatro secretos.»', unlockedMotto: '«Ya sientes la brisa del Caribe.»', description: 'Завершить практику по погоде, путешествиям, еде и музыке.', target: 4, progress: ({ stats }) => ['Погода и природа', 'Путешествия', 'Еда и ресторан', 'Музыка'].filter((topic) => (stats.topicSessions[topic] || 0) > 0).length },
  { id: 'sabor-mexico', category: 'Культура', icon: '🌮', name: 'Sabor de México', lockedMotto: '«El sabor también se aprende.»', unlockedMotto: '«Ya sabes pedir con sabor.»', description: 'Завершить 5 сессий по теме еды.', target: 5, progress: ({ stats }) => stats.topicSessions['Еда и ресторан'] || 0 },
  { id: 'sol-andalucia', category: 'Культура', icon: '☀️', name: 'Sol de Andalucía', lockedMotto: '«Sigue el sol hacia el sur.»', unlockedMotto: '«El sur ya brilla en tus palabras.»', description: 'Завершить 5 сессий по погоде и путешествиям.', target: 5, progress: ({ stats }) => (stats.topicSessions['Погода и природа'] || 0) + (stats.topicSessions['Путешествия'] || 0) },
  { id: 'cafe-colombia', category: 'Культура', icon: '☕', name: 'Café de Colombia', lockedMotto: '«Una pausa tiene su propio aroma.»', unlockedMotto: '«El café ya tiene palabras.»', description: 'Завершить 3 сессии по еде и одну по музыке.', target: 4, progress: ({ stats }) => Math.min(3, stats.topicSessions['Еда и ресторан'] || 0) + Math.min(1, stats.topicSessions['Музыка'] || 0) },
  { id: 'calles-madrid', category: 'Культура', icon: '🏙️', name: 'Calles de Madrid', lockedMotto: '«No todas las calles están en el mapa.»', unlockedMotto: '«Ya no te pierdes entre palabras.»', description: 'Завершить 5 сессий по городу и транспорту.', target: 5, progress: ({ stats }) => stats.topicSessions['Город и транспорт'] || 0 },
  { id: 'noche-portena', category: 'Культура', icon: '🌃', name: 'Noche Porteña', lockedMotto: '«La ciudad despierta al anochecer.»', unlockedMotto: '«La noche porteña ya tiene voz.»', description: 'Завершить 5 сессий по теме ночной жизни.', target: 5, progress: ({ stats }) => stats.topicSessions['Ночная жизнь'] || 0 },
  { id: 'buenos-aires-noche', category: 'Культура', icon: '🌙', name: 'Buenos Aires de Noche', lockedMotto: '«Todavía quedan luces encendidas.»', unlockedMotto: '«Diez noches, diez historias.»', description: 'Завершить 10 сессий по теме ночной жизни.', target: 10, progress: ({ stats }) => stats.topicSessions['Ночная жизнь'] || 0 },
  { id: 'mi-amor', category: 'Культура', icon: '❤️', name: 'Mi Amor', lockedMotto: '«Hay palabras que laten.»', unlockedMotto: '«El corazón ya habla español.»', description: 'Завершить 5 сессий по теме отношений.', target: 5, progress: ({ stats }) => stats.topicSessions['Знакомства и отношения'] || 0 },
  { id: 'corazon-roto', category: 'Культура', icon: '💔', name: 'Corazón Roto', lockedMotto: '«Algunas palabras duelen.»', unlockedMotto: '«También aprendiste a dejar ir.»', description: 'Завершить 3 сессии по отношениям и один тест по песне.', target: 4, progress: ({ stats }) => Math.min(3, stats.topicSessions['Знакомства и отношения'] || 0) + Math.min(1, stats.songSessions) },
  { id: 'vienes-aqui', category: 'Культура', icon: '😏', name: '¿Vienes aquí mucho?', lockedMotto: '«La primera frase es la más difícil.»', unlockedMotto: '«Ya sabes romper el hielo.»', description: 'Завершить 3 сессии по теме отношений.', target: 3, progress: ({ stats }) => stats.topicSessions['Знакомства и отношения'] || 0 },
  { id: 'te-quiero', category: 'Культура', icon: '💌', name: 'Te Quiero', lockedMotto: '«Todavía falta una frase.»', unlockedMotto: '«Ya sabes decir lo importante.»', description: 'Завершить 10 сессий по теме отношений.', target: 10, progress: ({ stats }) => stats.topicSessions['Знакомства и отношения'] || 0 },
  { id: 'buho', category: 'Секретные', icon: '🌙', name: 'Búho nocturno', secret: true, lockedMotto: '???', unlockedMotto: '«La noche también enseña.»', description: 'Завершить сессию после полуночи и до 05:00.', target: 1, progress: ({ stats }) => stats.nightSessions },
  { id: 'madrugador', category: 'Секретные', icon: '☀️', name: 'Madrugador', secret: true, lockedMotto: '???', unlockedMotto: '«El español llegó antes del desayuno.»', description: 'Завершить сессию с 05:00 до 07:00.', target: 1, progress: ({ stats }) => stats.morningSessions },
  { id: 'rush-30', category: 'Секретные', icon: '⚡', name: 'Rayo', secret: true, lockedMotto: '???', unlockedMotto: '«Nadie alcanza tu velocidad.»', description: 'Набрать 30 очков в Spanish Rush.', target: 30, progress: ({ rushBest }) => rushBest },
];
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
    rushBest = Number(JSON.parse(localStorage.getItem('ritmo-rush-records') || '{}').best) || 0;
  } catch {}
  return { stats, profile: loadProfile(), learnedWords, rushBest };
};
const evaluateAchievements = (notify = true) => {
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
              detail: achievement,
            }),
          ),
        index * 5200,
      ),
    );
};
const recordAchievementEvent = (event: AchievementEvent) => {
  const stats = applyAchievementEvent(
    loadAchievementStats(),
    event,
    new Date().getHours(),
  );
  localStorage.setItem(achievementStorage.stats, JSON.stringify(stats));
  window.dispatchEvent(new Event('ritmo-achievement-stats'));
  evaluateAchievements(true);
};
const recordError = (category: string) => {
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
function useCustomWords() {
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
function useExampleReports() {
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
function useLearnedWordsDb() {
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
function ReportExampleButton({
  id,
  word,
  example,
  translation,
  source,
}: Omit<ExampleReport, 'createdAt'>) {
  const account = useAccount();
  const [reported, setReported] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem('ritmo-example-reports') || '[]',
      );
      setReported(
        Array.isArray(stored) && stored.some((item) => item?.id === id),
      );
    } catch {
      setReported(false);
    }
  }, [id]);
  const toggle = () => {
    try {
      const stored = JSON.parse(
          localStorage.getItem('ritmo-example-reports') || '[]',
        ),
        reports: ExampleReport[] = Array.isArray(stored) ? stored : [],
        wasReported = reports.some((item) => item.id === id),
        next = wasReported
          ? reports.filter((item) => item.id !== id)
          : [
              ...reports,
              {
                id,
                word,
                example,
                translation,
                source,
                createdAt: new Date().toISOString(),
              },
            ];
      localStorage.setItem('ritmo-example-reports', JSON.stringify(next));
      setReported(next.some((item) => item.id === id));
      window.dispatchEvent(new Event('ritmo-example-reports'));
      void account.reportContent({
        reportKey: id,
        kind: 'example',
        section: source,
        content: { word, example, translation },
        active: !wasReported,
      });
      if (!wasReported)
        trackLocalEvent('example_reported', source);
    } catch {}
  };
  return (
    <button
      className={`report-example ${reported ? 'reported' : ''}`}
      onClick={toggle}
      title="Сохранить пример в списке для проверки"
      aria-pressed={reported}
    >
      {reported ? '✓ Отмечено для проверки' : '⚑ Странный пример'}
    </button>
  );
}

function SpellingDiff({ value, answer }: { value: string; answer: string }) {
  return (
    <div
      className="spelling-diff"
      aria-label={`Ваш ответ: ${value}; правильный ответ: ${answer}`}
    >
      <small>Сравните ответы</small>
      <div className="spelling-answer-row user-answer">
        <span>Вы написали</span>
        <b>{value || '—'}</b>
      </div>
      <div className="spelling-answer-row expected-answer">
        <span>Правильный вариант</span>
        <b>{answer}</b>
      </div>
    </div>
  );
}
function useSpanishVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]),
    [voiceIndex, setVoiceIndex] = useState(0),
    [voiceError, setVoiceError] = useState('');
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') {
      queueMicrotask(() => setVoiceError('Этот браузер не поддерживает озвучивание. Можно продолжить без аудио.'));
      return;
    }
    const load = () => {
      const spanish = speechSynthesis
          .getVoices()
          .filter((voice) => voice.lang.toLowerCase().startsWith('es')),
        femaleNames =
          /m[oó]nica|paulina|marisol|helena|luciana|soledad|conchita|alba|dalia|lola|paloma|elvira/i,
        maleNames =
          /jorge|diego|juan|carlos|pablo|enrique|miguel|[aá]lvaro|andr[eé]s|mateo|ra[uú]l/i,
        qualityScore = (voice: SpeechSynthesisVoice) =>
          /premium|enhanced|natural|neural|google|microsoft/i.test(voice.name)
            ? -2
            : voice.localService
              ? -1
              : 0,
        female = spanish
          .filter((voice) => femaleNames.test(voice.name))
          .sort((a, b) => qualityScore(a) - qualityScore(b)),
        male = spanish
          .filter((voice) => maleNames.test(voice.name))
          .sort((a, b) => qualityScore(a) - qualityScore(b)),
        other = spanish.filter(
          (voice) => !female.includes(voice) && !male.includes(voice),
        ),
        findNamed = (pattern: RegExp) =>
          spanish.find((voice) => pattern.test(voice.name)),
        preferred = [
          findNamed(/paulina/i),
          findNamed(/m[oó]nica/i),
          findNamed(/jorge/i),
          findNamed(/diego|juan|carlos|pablo|enrique|miguel|[aá]lvaro|andr[eé]s|mateo|ra[uú]l/i),
        ].filter(Boolean) as SpeechSynthesisVoice[],
        ordered = [...new Set([...preferred, ...female, ...male, ...other])];
      setVoices(ordered);
      setVoiceError(
        ordered.length ? '' : 'Испанский голос не установлен. Добавьте голос Español в настройках системы или продолжите без аудио.',
      );
      const saved = localStorage.getItem('ritmo-spanish-voice');
      if (saved) {
        const savedIndex = ordered.findIndex((voice) => voice.name === saved);
        if (savedIndex >= 0) setVoiceIndex(savedIndex);
      }
    };
    queueMicrotask(load);
    speechSynthesis.addEventListener('voiceschanged', load);
    return () => speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);
  const chooseVoice = (index: number) => {
    setVoiceIndex(index);
    const voice = voices[index];
    if (voice) localStorage.setItem('ritmo-spanish-voice', voice.name);
  };
  const speakText = (text: string, speed = 1) => {
    if (typeof speechSynthesis === 'undefined') {
      setVoiceError('Озвучивание недоступно в этом браузере.');
      return false;
    }
    if (!voices.length) {
      setVoiceError('Испанский голос не найден. Установите системный голос Español или продолжите без аудио.');
      return false;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = speed;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (voices.length) utterance.voice = voices[voiceIndex % voices.length];
    utterance.onerror = () => setVoiceError('Не удалось включить выбранный голос. Выберите другой голос или продолжите без аудио.');
    utterance.onstart = () => setVoiceError('');
    speechSynthesis.speak(utterance);
    return true;
  };
  return { voices, voiceIndex, setVoiceIndex: chooseVoice, speakText, voiceError };
}
const voiceDisplayName = (voice: SpeechSynthesisVoice) => {
  const male =
      /jorge|diego|juan|carlos|pablo|enrique|miguel|[aá]lvaro|andr[eé]s|mateo|ra[uú]l/i.test(
        voice.name,
      ),
    female =
      /m[oó]nica|paulina|marisol|helena|luciana|soledad|conchita|alba|dalia|lola|paloma|elvira/i.test(
        voice.name,
      ),
    quality = /premium|enhanced|natural|neural|google|microsoft/i.test(
      voice.name,
    )
      ? ' · улучшенный'
      : '';
  return `${male ? 'Мужской' : female ? 'Женский' : 'Испанский голос'} · ${voice.name} (${voice.lang})${quality}`;
};
const playFeedbackSound = (success: boolean) => {
  if (typeof window === 'undefined') return;
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass(),
    start = context.currentTime,
    notes = success ? [523.25, 659.25] : [220, 164.81];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator(),
      gain = context.createGain(),
      noteStart = start + index * 0.11;
    oscillator.type = success ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(
      success ? 0.12 : 0.08,
      noteStart + 0.015,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.17);
  });
  window.setTimeout(() => void context.close(), 500);
};
const playCelebrationSound = (kind: 'achievement' | 'finish' = 'finish') => {
  if (typeof window === 'undefined') return;
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass(),
    start = context.currentTime,
    notes =
      kind === 'achievement'
        ? [392, 523.25, 659.25, 783.99, 1046.5]
        : [440, 554.37, 659.25];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator(),
      gain = context.createGain(),
      noteStart = start + index * (kind === 'achievement' ? 0.1 : 0.12);
    oscillator.type = index % 2 ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(
      kind === 'achievement' ? 0.13 : 0.09,
      noteStart + 0.02,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.26);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.27);
  });
  window.setTimeout(() => void context.close(), 1000);
};
const spanishInputKeys = ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'];
const spanishLetterReplacements: Record<string, string[]> = {
  a: ['á'],
  e: ['é'],
  i: ['í'],
  o: ['ó'],
  u: ['ú', 'ü'],
  n: ['ñ'],
};
function AccentKeys({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const rootRef = useRef<HTMLElement>(null),
    caretRef = useRef(value.length),
    [caret, setCaret] = useState(value.length);
  const input = () =>
    rootRef.current
      ?.closest('.answer-entry-with-keys')
      ?.querySelector<HTMLInputElement>('input');
  useEffect(() => {
    const field = input();
    if (!field) return;
    const syncCaret = () => {
      const position = field.selectionStart ?? value.length;
      caretRef.current = position;
      setCaret(position);
    };
    syncCaret();
    field.addEventListener('input', syncCaret);
    field.addEventListener('keyup', syncCaret);
    field.addEventListener('click', syncCaret);
    field.addEventListener('select', syncCaret);
    return () => {
      field.removeEventListener('input', syncCaret);
      field.removeEventListener('keyup', syncCaret);
      field.removeEventListener('click', syncCaret);
      field.removeEventListener('select', syncCaret);
    };
  }, [value]);
  const lastCharacter = caret > 0 ? value.slice(caret - 1, caret) : '';
  const replacements =
    spanishLetterReplacements[lastCharacter.toLocaleLowerCase('es')] || [];
  const preserveCase = (character: string) =>
    lastCharacter &&
    lastCharacter === lastCharacter.toLocaleUpperCase('es') &&
    lastCharacter !== lastCharacter.toLocaleLowerCase('es')
      ? character.toLocaleUpperCase('es')
      : character;

  const applyAtCaret = (character: string, replacePrevious = false) => {
    const position = caretRef.current,
      from = replacePrevious ? Math.max(0, position - 1) : position,
      next = value.slice(0, from) + character + value.slice(position),
      nextCaret = from + character.length;
    onChange(next);
    caretRef.current = nextCaret;
    setCaret(nextCaret);
    window.requestAnimationFrame(() => {
      const field = input();
      field?.focus();
      field?.setSelectionRange(nextCaret, nextCaret);
    });
  };
  const keepInputFocused = (event: { preventDefault: () => void }) =>
    event.preventDefault();

  return (
    <aside className="accent-keys" ref={rootRef}>
      {replacements.length > 0 && (
        <div className="smart-accent-suggestion" aria-live="polite">
          <span>Заменить «{lastCharacter}»:</span>
          {replacements.map((character) => {
            const replacement = preserveCase(character);
            return (
              <button
                type="button"
                className="smart-accent-button"
                onMouseDown={keepInputFocused}
                onClick={() => applyAtCaret(replacement, true)}
                aria-label={`Заменить ${lastCharacter} на ${replacement}`}
                key={character}
              >
                {replacement}
              </button>
            );
          })}
        </div>
      )}
      <span>Испанские символы</span>
      <div className="accent-key-grid">
        {spanishInputKeys.map((character) => (
          <button
            type="button"
            onMouseDown={keepInputFocused}
            onClick={() => applyAtCaret(character)}
            key={character}
          >
            {character}
          </button>
        ))}
      </div>
      <small>
        Подсказка заменяет букву перед курсором, клавиатура вставляет в курсор
      </small>
    </aside>
  );
}
const wordWasStudied = (card: StudyCard, records: Record<string, SRSRecord>) =>
  Object.entries(records).some(
    ([key, record]) =>
      baseCardKey(key) === baseCardKey(card.key) && record.reviews > 0,
  );
const wordIsLearned = (card: StudyCard, records: Record<string, SRSRecord>) => {
  const base = baseCardKey(card.key);
  return (
    masteredRecord(records[`${base}-recognition`]) &&
    masteredRecord(records[`${base}-production`])
  );
};
const grammarReviewCards: StudyCard[] = [
  {
    key: 'lesson1-ser-eres',
    topic: 'Знакомство',
    es: 'eres',
    ru: 'ты являешься',
    example: '— ¿De dónde eres? — Soy de Rusia.',
    exampleRu: '— Откуда ты? — Я из России.',
    extraExample: 'Eres nuevo en esta clase, ¿verdad?',
    extraExampleRu: 'Ты новенький в этом классе, правда?',
    skill: 'context',
    answer: 'eres',
    prompt: '— ¿De dónde ___? — Soy de Rusia.',
  },
  {
    key: 'lesson1-profesor',
    topic: 'Знакомство',
    es: 'Soy profesor',
    ru: 'Я преподаватель',
    example: 'Soy profesor de español.',
    exampleRu: 'Я преподаватель испанского языка.',
    extraExample: 'Soy profesor y trabajo en una escuela.',
    extraExampleRu: 'Я преподаватель и работаю в школе.',
    skill: 'production',
    answer: 'Soy profesor',
    prompt: 'Я преподаватель.',
  },
  {
    key: 'lesson1-problema',
    topic: 'Артикли',
    es: 'el problema',
    ru: 'проблема',
    example: 'El problema es importante.',
    exampleRu: 'Эта проблема важна.',
    extraExample: 'Tenemos un problema con la reserva.',
    extraExampleRu: 'У нас проблема с бронированием.',
    skill: 'article',
    answer: 'el',
    prompt: '___ problema',
  },
  {
    key: 'lesson1-espanol',
    topic: 'Род',
    es: 'español',
    ru: 'испанец / испанский',
    example: 'Ella es española; él es español.',
    exampleRu: 'Она испанка, а он испанец.',
    extraExample: 'Estudio español todos los días.',
    extraExampleRu: 'Я учу испанский каждый день.',
    skill: 'production',
    answer: 'español',
    prompt: 'Какой мужской вариант у española?',
  },
  {
    key: 'lesson3-hablo',
    topic: 'Мой день',
    es: 'hablo',
    ru: 'я говорю',
    example: 'Yo hablo español cada día.',
    exampleRu: 'Я говорю по-испански каждый день.',
    extraExample: 'Hablo con mi familia por la noche.',
    extraExampleRu: 'Я разговариваю со своей семьёй вечером.',
    skill: 'context',
    answer: 'hablo',
    prompt: 'Yo ___ español cada día. (hablar)',
  },
  {
    key: 'lesson3-en',
    topic: 'Предлоги',
    es: 'en Madrid',
    ru: 'в Мадриде',
    example: 'Vivo en Madrid.',
    exampleRu: 'Я живу в Мадриде.',
    extraExample: 'Trabajo en Madrid, cerca del centro.',
    extraExampleRu: 'Я работаю в Мадриде, недалеко от центра.',
    skill: 'context',
    answer: 'en',
    prompt: 'Vivo ___ Madrid.',
  },
  {
    key: 'lesson2-hermana',
    topic: 'Семья',
    es: 'Mi hermana vive en Madrid',
    ru: 'Моя сестра живёт в Мадриде',
    example: 'Mi hermana vive en Madrid y trabaja allí.',
    exampleRu: 'Моя сестра живёт в Мадриде и работает там.',
    extraExample: 'Mi hermana vive cerca de nuestra abuela.',
    extraExampleRu: 'Моя сестра живёт рядом с нашей бабушкой.',
    skill: 'production',
    answer: 'Mi hermana vive en Madrid',
    prompt: 'Моя сестра живёт в Мадриде.',
  },
  {
    key: 'lesson2-ciudades',
    topic: 'Число',
    es: 'las ciudades',
    ru: 'города',
    example: 'Las ciudades son grandes.',
    exampleRu: 'Эти города большие.',
    extraExample: 'Las ciudades del sur son muy bonitas.',
    extraExampleRu: 'Города на юге очень красивые.',
    skill: 'article',
    answer: 'las ciudades',
    prompt: 'Поставьте la ciudad во множественное число.',
  },
  {
    key: 'lesson2-tengo',
    topic: 'Семья',
    es: 'tengo',
    ru: 'у меня есть',
    example: 'Tengo una familia grande.',
    exampleRu: 'У меня большая семья.',
    extraExample: 'Tengo dos hermanos y una hermana.',
    extraExampleRu: 'У меня два брата и одна сестра.',
    skill: 'context',
    answer: 'tengo',
    prompt: 'Yo ___ una familia grande. (tener)',
  },
  {
    key: 'lesson4-hay-salon',
    topic: 'Дом и квартира',
    es: 'Hay un sofá en el salón',
    ru: 'В гостиной есть диван',
    example: 'Hay un sofá cómodo en el salón.',
    exampleRu: 'В гостиной есть удобный диван.',
    extraExample: 'En mi salón hay un sofá junto a la ventana.',
    extraExampleRu: 'В моей гостиной есть диван рядом с окном.',
    skill: 'production',
    answer: 'Hay un sofá en el salón',
    prompt: 'В гостиной есть диван.',
  },
  {
    key: 'lesson4-estar-mesa',
    topic: 'Дом и квартира',
    es: 'está encima de',
    ru: 'находится на',
    example: 'El libro está encima de la mesa.',
    exampleRu: 'Книга находится на столе.',
    extraExample: 'La lámpara está encima de la mesita de noche.',
    extraExampleRu: 'Лампа стоит на прикроватной тумбочке.',
    skill: 'context',
    answer: 'está encima de',
    prompt: 'El libro ___ la mesa. (находится на)',
  },
  {
    key: 'lesson4-demonstrative',
    topic: 'Дом и квартира',
    es: 'esta habitación',
    ru: 'эта комната',
    example: 'Esta habitación tiene mucha luz.',
    exampleRu: 'В этой комнате много света.',
    extraExample: 'Esta habitación está al lado de la cocina.',
    extraExampleRu: 'Эта комната находится рядом с кухней.',
    skill: 'article',
    answer: 'esta habitación',
    prompt: 'Поставьте «este» в правильную форму: ___ habitación.',
  },
  {
    key: 'lesson5-gustan',
    topic: 'Еда и напитки',
    es: 'Me gustan las verduras',
    ru: 'Мне нравятся овощи',
    example: 'Me gustan las verduras frescas.',
    exampleRu: 'Мне нравятся свежие овощи.',
    extraExample: 'A mi hermana también le gustan las verduras.',
    extraExampleRu: 'Моей сестре тоже нравятся овощи.',
    skill: 'production',
    answer: 'Me gustan las verduras',
    prompt: 'Мне нравятся овощи.',
  },
  {
    key: 'lesson5-order',
    topic: 'Еда и напитки',
    es: 'Quisiera un café, por favor',
    ru: 'Я бы хотел кофе, пожалуйста',
    example: 'Quisiera un café con leche, por favor.',
    exampleRu: 'Я бы хотел кофе с молоком, пожалуйста.',
    extraExample: 'Quisiera la cuenta, por favor.',
    extraExampleRu: 'Я бы хотел счёт, пожалуйста.',
    skill: 'production',
    answer: 'Quisiera un café por favor',
    prompt: 'Я бы хотел кофе, пожалуйста.',
  },
  {
    key: 'lesson5-bastante',
    topic: 'Еда и напитки',
    es: 'bastante agua',
    ru: 'достаточно воды',
    example: 'Bebo bastante agua durante el día.',
    exampleRu: 'Я пью достаточно воды в течение дня.',
    extraExample: 'Hay bastante agua para todos.',
    extraExampleRu: 'Воды достаточно для всех.',
    skill: 'context',
    answer: 'bastante',
    prompt: 'Bebo ___ agua durante el día. (достаточно)',
  },
];
const lessonCoreVocabulary: Record<string, LessonWord[]> = {
  intro: [
    {
      es: 'ser',
      ru: 'быть',
      example: 'Soy estudiante.',
      exampleRu: 'Я студент.',
    },
    {
      es: 'llamarse',
      ru: 'называться; зваться',
      example: 'Me llamo Lucía.',
      exampleRu: 'Меня зовут Лусия.',
    },
    {
      es: 'vivir',
      ru: 'жить',
      example: 'Vivo en Madrid.',
      exampleRu: 'Я живу в Мадриде.',
    },
    {
      es: 'trabajar',
      ru: 'работать',
      example: 'Trabajo en una escuela.',
      exampleRu: 'Я работаю в школе.',
    },
    {
      es: 'estudiar',
      ru: 'учиться; изучать',
      example: 'Estudio español cada día.',
      exampleRu: 'Я изучаю испанский каждый день.',
    },
    {
      es: 'país',
      ru: 'страна',
      example: 'España es un país europeo.',
      exampleRu: 'Испания — европейская страна.',
    },
    {
      es: 'profesión',
      ru: 'профессия',
      example: '¿Cuál es tu profesión?',
      exampleRu: 'Какая у тебя профессия?',
    },
    {
      es: 'idioma',
      ru: 'язык',
      example: 'El español es un idioma internacional.',
      exampleRu: 'Испанский — международный язык.',
    },
  ],
  family: [
    {
      es: 'tener',
      ru: 'иметь',
      example: 'Tengo una familia grande.',
      exampleRu: 'У меня большая семья.',
    },
    {
      es: 'familia',
      ru: 'семья',
      example: 'Mi familia vive cerca.',
      exampleRu: 'Моя семья живёт рядом.',
    },
    {
      es: 'padre',
      ru: 'отец',
      example: 'Mi padre es médico.',
      exampleRu: 'Мой отец — врач.',
    },
    {
      es: 'madre',
      ru: 'мать',
      example: 'Mi madre trabaja en casa.',
      exampleRu: 'Моя мама работает дома.',
    },
    {
      es: 'hermano',
      ru: 'брат',
      example: 'Mi hermano tiene veinte años.',
      exampleRu: 'Моему брату двадцать лет.',
    },
    {
      es: 'hermana',
      ru: 'сестра',
      example: 'Mi hermana estudia español.',
      exampleRu: 'Моя сестра изучает испанский.',
    },
    {
      es: 'amable',
      ru: 'добрый; любезный',
      example: 'Nuestra vecina es muy amable.',
      exampleRu: 'Наша соседка очень любезная.',
    },
    {
      es: 'simpático',
      ru: 'приятный; дружелюбный',
      example: 'Tu amigo es muy simpático.',
      exampleRu: 'Твой друг очень приятный.',
    },
  ],
  day: [
    {
      es: 'levantarse',
      ru: 'вставать',
      example: 'Me levanto a las siete.',
      exampleRu: 'Я встаю в семь часов.',
    },
    {
      es: 'desayunar',
      ru: 'завтракать',
      example: 'Desayuno antes de trabajar.',
      exampleRu: 'Я завтракаю перед работой.',
    },
    {
      es: 'empezar',
      ru: 'начинать',
      example: 'La clase empieza a las nueve.',
      exampleRu: 'Занятие начинается в девять.',
    },
    {
      es: 'terminar',
      ru: 'заканчивать',
      example: 'Termino de trabajar a las seis.',
      exampleRu: 'Я заканчиваю работать в шесть.',
    },
    {
      es: 'volver',
      ru: 'возвращаться',
      example: 'Vuelvo a casa por la tarde.',
      exampleRu: 'Я возвращаюсь домой вечером.',
    },
    {
      es: 'dormir',
      ru: 'спать',
      example: 'Duermo ocho horas.',
      exampleRu: 'Я сплю восемь часов.',
    },
    {
      es: 'mañana',
      ru: 'утро; завтра',
      example: 'Trabajo por la mañana.',
      exampleRu: 'Я работаю утром.',
    },
    {
      es: 'noche',
      ru: 'ночь; вечер',
      example: 'Leo un libro por la noche.',
      exampleRu: 'Вечером я читаю книгу.',
    },
  ],
  home: [
    {
      es: 'hay',
      ru: 'есть; имеется',
      example: 'Hay dos habitaciones en el piso.',
      exampleRu: 'В квартире есть две комнаты.',
    },
    {
      es: 'estar',
      ru: 'находиться',
      example: 'La cocina está al lado del salón.',
      exampleRu: 'Кухня находится рядом с гостиной.',
    },
    {
      es: 'casa',
      ru: 'дом',
      example: 'Nuestra casa tiene un jardín.',
      exampleRu: 'У нашего дома есть сад.',
    },
    {
      es: 'piso',
      ru: 'квартира',
      example: 'Mi piso está en el centro.',
      exampleRu: 'Моя квартира находится в центре.',
    },
    {
      es: 'habitación',
      ru: 'комната',
      example: 'Esta habitación tiene mucha luz.',
      exampleRu: 'В этой комнате много света.',
    },
    {
      es: 'cocina',
      ru: 'кухня',
      example: 'La mesa está en la cocina.',
      exampleRu: 'Стол находится на кухне.',
    },
    {
      es: 'salón',
      ru: 'гостиная',
      example: 'Vemos la televisión en el salón.',
      exampleRu: 'Мы смотрим телевизор в гостиной.',
    },
    {
      es: 'baño',
      ru: 'ванная комната',
      example: 'El baño está detrás del dormitorio.',
      exampleRu: 'Ванная находится за спальней.',
    },
  ],
  food: [
    {
      es: 'gustar',
      ru: 'нравиться',
      example: 'Me gusta el café con leche.',
      exampleRu: 'Мне нравится кофе с молоком.',
    },
    {
      es: 'querer',
      ru: 'хотеть',
      example: 'Quiero una ensalada, por favor.',
      exampleRu: 'Я хочу салат, пожалуйста.',
    },
    {
      es: 'preferir',
      ru: 'предпочитать',
      example: 'Prefiero el té sin azúcar.',
      exampleRu: 'Я предпочитаю чай без сахара.',
    },
    {
      es: 'comer',
      ru: 'есть',
      example: 'Comemos fruta cada mañana.',
      exampleRu: 'Мы едим фрукты каждое утро.',
    },
    {
      es: 'beber',
      ru: 'пить',
      example: 'Bebo bastante agua.',
      exampleRu: 'Я пью достаточно воды.',
    },
    {
      es: 'comida',
      ru: 'еда; обед',
      example: 'La comida está muy rica.',
      exampleRu: 'Еда очень вкусная.',
    },
    {
      es: 'pan',
      ru: 'хлеб',
      example: 'No queda pan en la mesa.',
      exampleRu: 'На столе не осталось хлеба.',
    },
    {
      es: 'cuenta',
      ru: 'счёт',
      example: 'La cuenta, por favor.',
      exampleRu: 'Счёт, пожалуйста.',
    },
  ],
};
const makeStudyDeck = (customWords: CustomWord[] = []): StudyCard[] => [
  ...vocabularyTopics.flatMap((topic) =>
    topic.entries.flatMap((entry) => {
      const base = `${topic.name}-${entry.id}`,
        article = inferGenderArticle(
          entry.es,
          entry.example,
          entry.extraExample || '',
        ),
        contextWord = entry.es.split(' / ')[0],
        contextPrompt = maskExactTerm(entry.example, contextWord),
        hasClearBlank = contextPrompt !== entry.example,
        examples = {
          exampleRu: entry.exampleRu,
          extraExample: entry.extraExample,
          extraExampleRu: entry.extraExampleRu,
        };
      const cards: StudyCard[] = [
        {
          key: `${base}-recognition`,
          topic: topic.name,
          es: entry.es,
          ru: entry.ru,
          example: entry.example,
          ...examples,
          skill: 'recognition',
          answer: entry.ru,
          prompt: `Что означает «${entry.es}»?`,
        },
        {
          key: `${base}-production`,
          topic: topic.name,
          es: entry.es,
          ru: entry.ru,
          example: entry.example,
          ...examples,
          skill: 'production',
          answer: entry.es.split(' / ')[0],
          prompt: `Напишите по-испански: «${entry.ru}»`,
        },
        {
          key: `${base}-listening`,
          topic: topic.name,
          es: entry.es,
          ru: entry.ru,
          example: entry.example,
          ...examples,
          skill: 'listening',
          answer: entry.ru,
          prompt: 'Прослушайте слово и напишите его значение по-русски',
        },
        {
          key: `${base}-dictation`,
          topic: topic.name,
          es: entry.es,
          ru: entry.ru,
          example: entry.example,
          ...examples,
          skill: 'dictation',
          answer: entry.es.split(' / ')[0],
          prompt: 'Прослушайте слово и напишите услышанное по-испански',
        },
      ];
      if (hasClearBlank)
        cards.push({
          key: `${base}-context`,
          topic: topic.name,
          es: entry.es,
          ru: entry.ru,
          example: entry.example,
          ...examples,
          skill: 'context',
          answer: contextWord,
          prompt: `Вставьте слово со значением «${entry.ru}»: ${contextPrompt}`,
        });
      if (article)
        cards.push({
          key: `${base}-article`,
          topic: topic.name,
          es: entry.es,
          ru: entry.ru,
          example: entry.example,
          ...examples,
          skill: 'article',
          answer: article,
          prompt: `Какой определённый артикль показывает род слова «${entry.es.split(/[ /]/)[0]}»?`,
        });
      return cards;
    }),
  ),
  ...customWords.flatMap((entry) => {
    const base = `Мои слова-${entry.id}`,
      common = {
        topic: 'Мои слова',
        es: entry.es,
        ru: entry.ru,
        example: entry.example,
        exampleRu: entry.exampleRu,
        extraExample: entry.extraExample,
        extraExampleRu: entry.extraExampleRu,
      };
    return [
      {
        ...common,
        key: `${base}-recognition`,
        skill: 'recognition' as const,
        answer: entry.ru,
        prompt: `Что означает «${entry.es}»?`,
      },
      {
        ...common,
        key: `${base}-production`,
        skill: 'production' as const,
        answer: entry.es,
        prompt: `Напишите по-испански: «${entry.ru}»`,
      },
      {
        ...common,
        key: `${base}-listening`,
        skill: 'listening' as const,
        answer: entry.ru,
        prompt: 'Прослушайте слово и напишите его значение по-русски',
      },
      {
        ...common,
        key: `${base}-dictation`,
        skill: 'dictation' as const,
        answer: entry.es,
        prompt: 'Прослушайте слово и напишите услышанное по-испански',
      },
    ];
  }),
  ...grammarReviewCards,
];
const auditVocabularyPracticeSync = () => {
  const deck = makeStudyDeck(),
    byKey = new Map(deck.map((card) => [card.key, card])),
    issues: string[] = [];
  vocabularyTopics.forEach((topic) =>
    topic.entries.forEach((entry) => {
      const base = `${topic.name}-${entry.id}`,
        expected = [
          ['recognition', entry.ru],
          ['production', entry.es],
          ['listening', entry.ru],
          ['dictation', entry.es],
        ] as const;
      expected.forEach(([skill, answer]) => {
        const card = byKey.get(`${base}-${skill}`);
        if (!card) issues.push(`${base}: отсутствует ${skill}`);
        else if (
          card.es !== entry.es ||
          card.ru !== entry.ru ||
          card.answer !== answer
        )
          issues.push(
            `${base}-${skill}: Vocabulary «${entry.es} — ${entry.ru}», Practice «${card.es} — ${card.ru}», ответ «${card.answer}»`,
          );
      });
    }),
  );
  return {
    vocabularyWords: vocabularyTopics.reduce(
      (sum, topic) => sum + topic.entries.length,
      0,
    ),
    practiceVocabularyCards: deck.filter((card) =>
      vocabularyTopics.some((topic) => topic.name === card.topic),
    ).length,
    issues,
  };
};
const learnedWordDictationCards = (words: LearnedWordRecord[]): StudyCard[] =>
  words.map((word) => ({
    key: `lesson-db-${word.id}-dictation`,
    topic: word.lessonTitle,
    es: word.es,
    ru: word.ru,
    example: word.example,
    exampleRu: word.exampleRu,
    extraExample: word.example,
    extraExampleRu: word.exampleRu,
    skill: 'dictation',
    answer: word.es,
    prompt: 'Прослушайте слово или предложение и запишите услышанное',
  }));
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
function useSRS() {
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
  const rate = (card: StudyCard, grade: ReviewGrade) => {
    const updated = scheduleReview(records[card.key], grade);
    const nextRecords = { ...records, [card.key]: updated };
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
  return { records, rate, toggleFavorite, markNew, hydrated };
}
function useWordProgress() {
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
function useWordHistory() {
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
type ContentFavorite = {
  id: string;
  type: 'правило' | 'пример';
  title: string;
  body: string;
};
function useContentFavorites() {
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

type CatState =
  | 'neutral'
  | 'thinking'
  | 'happy'
  | 'wrong'
  | 'sleeping'
  | 'love';
type LessonState = {
  done: number;
  completed: boolean;
  correct: number;
  errors?: number[];
  errorIds?: string[];
  lastExerciseId?: string;
};
type LessonProgress = Record<string, LessonState>;
function useLessonProgress() {
  const [progress, setProgress] = useState<LessonProgress>({});
  useEffect(() => {
    const read = () => {
      try {
        setProgress(
          JSON.parse(localStorage.getItem('ritmo-lesson-progress') || '{}'),
        );
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
function CatMascot({
  state = 'neutral',
  small = false,
  interactive = true,
}: {
  state?: CatState;
  small?: boolean;
  interactive?: boolean;
}) {
  const [petted, setPetted] = useState(false),
    [message, setMessage] = useState('');
  const pet = () => {
    if (!interactive) return;
    setPetted(false);
    window.requestAnimationFrame(() => setPetted(true));
    setMessage(
      ['Мр-р-р!', '¡Miau! ♥', 'Ещё раз!', 'Ты молодец!'][
        Math.floor(Math.random() * 4)
      ],
    );
    window.setTimeout(() => {
      setPetted(false);
      setMessage('');
    }, 1100);
  };
  const className = `cat-mascot ${state} ${small ? 'small' : ''} ${interactive ? 'interactive' : ''} ${petted ? 'petted' : ''}`;
  if (!interactive)
    return <span className={className} aria-label={`Кот-помощник: ${state}`} />;
  return (
    <button
      type="button"
      className={className}
      aria-label={`Погладить котика, состояние: ${state}`}
      title="Нажми и погладь котика"
      onClick={pet}
    >
      {message && <i className="cat-bubble">{message}</i>}
    </button>
  );
}
function CatPeek({ state = 'neutral' }: { state?: CatState }) {
  return (
    <span className="cat-peek">
      <CatMascot state={state} interactive={false} />
    </span>
  );
}
function PawProgress({ done, total = 50 }: { done: number; total?: number }) {
  const paws = 10,
    filled = Math.ceil((done / total) * paws);
  return (
    <div className="paw-progress" aria-label={`Выполнено ${done} из ${total}`}>
      {Array.from({ length: paws }).map((_, index) => (
        <span className={index < filled ? 'filled' : ''} key={index}>
          🐾
        </span>
      ))}
    </div>
  );
}
function CatHouse({ level }: { level: number }) {
  return (
    <figure
      className={`cat-house level-${Math.min(3, level)}`}
      aria-label={`Кошачий дом, этап ${Math.min(5, level)} из 5`}
    >
      {/* oxlint-disable-next-line next/no-img-element -- local decorative sprite */}
      <img src="/mascots/cat-house-progress.jpg" alt="" />
      <span>
        {level === 0
          ? 'Домик пока пуст'
          : level === 1
            ? 'Открыты лежанка и миска'
            : level === 2
              ? 'Добавлены игрушки и когтеточка'
              : level === 3
                ? 'Появились огоньки и второй котик'
                : level === 4
                  ? 'Открыты окно и мягкий плед'
                  : 'Дом готов — добавлена кошачья кухня!'}
      </span>
    </figure>
  );
}
function MotivationCard() {
  const [index, setIndex] = useState(0),
    [burst, setBurst] = useState(false);
  const next = () => {
    setIndex((value) => (value + 1) % motivation.length);
    setBurst(false);
    window.requestAnimationFrame(() => setBurst(true));
    window.setTimeout(() => setBurst(false), 650);
  };
  return (
    <button
      className={`motivation-card ${burst ? 'burst' : ''}`}
      onClick={next}
    >
      <CatMascot
        state={index % 3 === 2 ? 'love' : 'happy'}
        small
        interactive={false}
      />
      <span>
        <small>ФРАЗА ДЛЯ РИТМА</small>
        <b>{motivation[index]}</b>
        <em>Нажми, чтобы получить новую</em>
      </span>
      <Sparkles />
    </button>
  );
}

function Hero({
  go,
  period,
}: {
  go: (s: Section) => void;
  period: 'morning' | 'day' | 'night';
}) {
  return (
    <section className={`hero-card spain-hero hero-${period}`}>
      <div className="spain-hero-image" aria-hidden="true" />
      <div className="spain-hero-shade" aria-hidden="true" />
      <div className="azulejo-drift" aria-hidden="true" />
      <div className="hero-copy">
        <div className="lesson-label">
          <span>RITMO ESPAÑOL</span>
          <span>УЧИМСЯ В СВОЁМ РИТМЕ</span>
        </div>
        <h2>
          ¡Hola! ¿Listo para
          <br />
          aprender español?
        </h2>
        <p>
          Начните с короткого урока, повторите слова или включите любимую песню.
        </p>
        <div className="hero-actions">
          <button className="primary-btn" onClick={() => go('Lessons')}>
            <Play fill="currentColor" />
            Начать урок
            <ArrowRight />
          </button>
          <button className="hero-secondary" onClick={() => go('Practice')}>
            Повторить слова
          </button>
        </div>
      </div>
      <div className="hero-place">
        <span>
          {period === 'night' ? '☾' : period === 'morning' ? '◒' : '☀'}
        </span>
        <b>España</b>
        <small>sol · calle · mar · azulejos</small>
      </div>
    </section>
  );
}

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

function useAchievements() {
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
    ...achievement,
    current: Math.min(
      achievement.target,
      Math.max(0, achievement.progress(context)),
    ),
    unlocked: !!unlocks[achievement.id],
    unlockedAt: unlocks[achievement.id]?.unlockedAt || '',
  }));
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

function HomeView({
  go,
  profile,
}: {
  go: (s: Section) => void;
  profile: DeviceProfile;
}) {
  const [answer, setAnswer] = useState(''),
    [hour, setHour] = useState(12),
    [currentTime, setCurrentTime] = useState(0);
  const { records } = useSRS(),
    { progress: wordProgress } = useWordProgress(),
    errors = useErrorProfile(),
    todayDone = profile.dailyReviews?.[localDateKey()] || 0,
    dailyTarget = 16,
    due = Object.values(records).filter(
      (item) => item.reviews && item.nextReview <= currentTime,
    ).length,
    learnedWords = makeStudyDeck()
      .filter((card) => card.skill === 'recognition')
      .filter(
        (card) =>
          derivedWordStatus(
            baseCardKey(card.key),
            records,
            wordProgress[baseCardKey(card.key)] || 'new',
          ) === 'learned',
      ).length,
    weakTopic = Object.entries(errors).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Артикли и род';
  useEffect(() => {
    const update = () => {
      const date = new Date();
      setHour(date.getHours());
      setCurrentTime(date.getTime());
    };
    queueMicrotask(update);
    const timer = window.setInterval(update, 60000);
    return () => window.clearInterval(timer);
  }, []);
  const period =
      hour >= 5 && hour < 12
        ? 'morning'
        : hour >= 12 && hour < 19
          ? 'day'
          : 'night',
    greeting =
      period === 'morning'
        ? 'Buenos días ☀️'
        : period === 'day'
          ? 'Buenas tardes 🌤️'
          : 'Buenas noches 🌙';
  return (
    <>
      <section className={`welcome-row time-${period}`}>
        <div>
          <p className="eyebrow">СЕГОДНЯ · УРОВЕНЬ {profile.level}</p>
          <h1>
            {greeting}, {profile.name || 'Maya'}
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
      <Hero go={go} period={period} />
      <MotivationCard />
      <Suspense fallback={<section className="today-panel loading">Готовим персональный план…</section>}>
        <TodayPanel due={due} weakTopic={weakTopic} go={go} />
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
              {todayDone >= dailyTarget ? 'Выполнено!' : 'Продолжайте ритм'}
            </b>
            <p>
              {todayDone >= dailyTarget
                ? 'Котик гордится вами'
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
            <b>{profile.xp} XP</b>
            <p>{due} карточек пора повторить</p>
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
        <article className="challenge">
          <ReportExerciseButton
            id="home:daily:ir-de-rumba"
            section="Главная: задание дня"
            prompt="Esta noche vamos ___ rumba."
            answer="de"
            options={['a', 'de', 'por']}
          />
          <div className="challenge-top">
            <span>
              <Zap fill="currentColor" />
              ЗАДАНИЕ ДНЯ
            </span>
            <small>1 МИН</small>
          </div>
          <p>Дополните фразу</p>
          <h3>“Esta noche vamos ___ rumba.”</h3>
          <div className="answers">
            {['a', 'de', 'por'].map((a) => (
              <button
                key={a}
                className={
                  answer === a ? (a === 'de' ? 'correct' : 'wrong') : ''
                }
                onClick={() => {
                  setAnswer(a);
                  playFeedbackSound(a === 'de');
                  if (!answer)
                    recordLearningEvent(a === 'de', a === 'de' ? 5 : 2);
                }}
              >
                {answer === a && a === 'de' ? <Check /> : null}
                {a}
              </button>
            ))}
          </div>
          {answer && (
            <div className={answer === 'de' ? 'feedback good' : 'feedback'}>
              {answer === 'de'
                ? '¡Perfecto! «Ir de rumba» — устойчивое выражение.'
                : 'Почти! Здесь используется выражение «ir de rumba».'}
            </div>
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

const starterLessons = [
  {
    title: '01 · Presente simple',
    subtitle: 'Говорим о себе и ежедневных действиях',
    steps: [
      ['Основа', 'Уберите -ar/-er/-ir: hablar → habl-, comer → com-.'],
      ['Окончания -AR', '-o, -as, -a, -amos, -áis, -an'],
      ['Окончания -ER', '-o, -es, -e, -emos, -éis, -en'],
      ['Окончания -IR', '-o, -es, -e, -imos, -ís, -en'],
      ['В речи', 'Trabajo, estudio y vivo en Madrid.'],
    ],
  },
  {
    title: '02 · Артикли',
    subtitle: 'El, la, los, las и когда нужен un/una',
    steps: [
      ['Род', 'el — мужской род, la — женский: el viaje, la mesa.'],
      ['Множественное число', 'los viajes, las mesas.'],
      ['Неопределённый', 'un/una — один или впервые упомянутый предмет.'],
      ['Определённый', 'el/la — предмет уже известен собеседнику.'],
      ['В речи', 'Busco un hotel. El hotel está cerca.'],
    ],
  },
  {
    title: '03 · Предлоги',
    subtitle: 'A, de, en, con, por и para без путаницы',
    steps: [
      ['a', 'направление и адресат: Voy a Madrid.'],
      ['de', 'происхождение и принадлежность: Soy de Perú.'],
      ['en / con', 'место или транспорт / совместность: en casa, con Ana.'],
      ['por / para', 'причина или путь / цель или получатель.'],
      ['В речи', 'Este regalo es para ti. Gracias por venir.'],
    ],
  },
];
const starterChecks = [
  [
    {
      prompt: 'Выберите форму: Yo ___ español.',
      options: ['hablo', 'hablas', 'habla'],
      answer: 'hablo',
    },
    {
      prompt: 'Nosotros ___ cada día.',
      options: ['trabajan', 'trabajamos', 'trabajo'],
      answer: 'trabajamos',
    },
    {
      prompt: 'Tú ___ café.',
      options: ['comes', 'como', 'comen'],
      answer: 'comes',
    },
    {
      prompt: 'Ellos ___ en Madrid.',
      options: ['vive', 'vivimos', 'viven'],
      answer: 'viven',
    },
    {
      prompt: 'Какая фраза естественна?',
      options: [
        'Estudio español.',
        'Yo estudiar español.',
        'Estudio el español yo.',
      ],
      answer: 'Estudio español.',
    },
  ],
  [
    {
      prompt: 'Выберите правильный артикль: ___ problema.',
      options: ['el', 'la', 'una'],
      answer: 'el',
    },
    {
      prompt: 'Множественное число: la mesa →',
      options: ['los mesas', 'las mesas', 'las mesa'],
      answer: 'las mesas',
    },
    {
      prompt: 'Впервые упоминаем гостиницу:',
      options: ['Busco un hotel.', 'Busco el hotel.', 'Busco una hotel.'],
      answer: 'Busco un hotel.',
    },
    {
      prompt: 'Гостиница уже известна:',
      options: [
        'El hotel está cerca.',
        'Un hotel está cerca.',
        'La hotel está cerca.',
      ],
      answer: 'El hotel está cerca.',
    },
    {
      prompt: 'Выберите правильную пару:',
      options: ['la viaje', 'el viaje', 'una viaje'],
      answer: 'el viaje',
    },
  ],
  [
    {
      prompt: 'Направление: Voy ___ Madrid.',
      options: ['a', 'de', 'con'],
      answer: 'a',
    },
    {
      prompt: 'Происхождение: Soy ___ Perú.',
      options: ['por', 'de', 'para'],
      answer: 'de',
    },
    {
      prompt: 'Место: Estoy ___ casa.',
      options: ['en', 'a', 'por'],
      answer: 'en',
    },
    {
      prompt: 'Получатель: Este regalo es ___ ti.',
      options: ['por', 'para', 'de'],
      answer: 'para',
    },
    {
      prompt: 'Причина благодарности: Gracias ___ venir.',
      options: ['por', 'para', 'a'],
      answer: 'por',
    },
  ],
] as const;
function LearnView({ go }: { go: (section: Section) => void }) {
  const [lesson, setLesson] = useState(0),
    [step, setStep] = useState(1),
    [choice, setChoice] = useState(''),
    [completed, setCompleted] = useState<Record<string, number>>({}),
    answerLock = useRef(false);
  const { speakText } = useSpanishVoices(),
    current = starterLessons[lesson],
    check = starterChecks[lesson][step - 1];
  useEffect(() => {
    try {
      setCompleted(
        JSON.parse(localStorage.getItem('ritmo-learn-progress') || '{}'),
      );
    } catch {}
  }, []);
  const choose = (option: string) => {
    if (choice || answerLock.current) return;
    answerLock.current = true;
    const correct = option === check.answer;
    setChoice(option);
    playFeedbackSound(correct);
    recordLearningEvent(correct, correct ? 4 : 1);
    if (correct) {
      const key = String(lesson),
        next = { ...completed, [key]: Math.max(completed[key] || 0, step) };
      setCompleted(next);
      localStorage.setItem('ritmo-learn-progress', JSON.stringify(next));
    }
  };
  const advance = () => {
    if (step === 5) go('Lessons');
    else {
      answerLock.current = false;
      setStep((value) => value + 1);
      setChoice('');
    }
  };
  return (
    <div className="view-stack">
      <ViewHead
        over="СТАРТ С НУЛЯ · 3 ОСНОВЫ"
        title="Сначала — то, без чего не заговорить."
        copy="Короткие уроки идут в правильном порядке: presente, артикли, затем предлоги."
      />
      <div className="starter-grid">
        {starterLessons.map((item, index) => (
          <button
            className={lesson === index ? 'active' : ''}
            onClick={() => {
              setLesson(index);
              setStep(Math.min(5, (completed[String(index)] || 0) + 1));
              setChoice('');
            }}
            key={item.title}
          >
            <span>{index === 0 ? '▶' : '0' + (index + 1)}</span>
            <b>{item.title}</b>
            <small>{item.subtitle}</small>
          </button>
        ))}
      </div>
      <div className="lesson-progress">
        <span style={{ width: `${step * 20}%` }} />
      </div>
      <div className="lesson-stage">
        <div className="lesson-scene">
          <span>0{lesson + 1}</span>
          <p>УРОК ДЛЯ НАЧАЛА</p>
          <h2>{current.title.split(' · ')[1]}</h2>
          <div>♪ ♫ ♪</div>
        </div>
        <div className="lesson-panel">
          <span>ШАГ {step} ИЗ 5</span>
          <h3>{current.steps[step - 1][0]}</h3>
          <p>{current.subtitle}</p>
          <div className="phrase-box">
            <b>{current.steps[step - 1][1]}</b>
            <button onClick={() => speakText(check.answer, 1)}>
              <Volume2 /> Прослушать испанский пример
            </button>
          </div>
          <div className="learn-check">
            <ReportExerciseButton
              id={`quick-start:${lesson}:${normalizeText(check.prompt)}:${normalizeText(check.answer)}`}
              section={`Быстрый старт: ${current.title}`}
              prompt={check.prompt}
              answer={check.answer}
              options={[...check.options]}
            />
            <small>БЫСТРАЯ ПРОВЕРКА</small>
            <h4>{check.prompt}</h4>
            <div>
              {check.options.map((option) => (
                <button
                  className={
                    choice === option
                      ? option === check.answer
                        ? 'correct'
                        : 'wrong'
                      : ''
                  }
                  onClick={() => choose(option)}
                  key={option}
                >
                  {option}
                </button>
              ))}
            </div>
            {choice && choice !== check.answer && (
              <p>Попробуйте ещё раз: правило находится прямо над вопросом.</p>
            )}
          </div>
          <button
            className="primary-btn dark-btn"
            onClick={advance}
            disabled={choice !== check.answer}
          >
            {step === 5 ? 'Перейти к полному уроку' : 'Следующий шаг'}
            <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

function shuffledOptions(items: string[], seed: string) {
  const result = [...new Set(items)];
  let value = Array.from(seed).reduce(
    (sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0,
    2166136261,
  );
  for (let index = result.length - 1; index > 0; index--) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const target = value % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function useTaskMotion() {
  const [leaving, setLeaving] = useState(false);
  const move = (change: () => void) => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      change();
      window.requestAnimationFrame(() => setLeaving(false));
    }, 180);
  };
  return { leaving, move };
}

function LessonsView() {
  const [lessonIndex, setLessonIndex] = useState(0),
    [mode, setMode] = useState<'theory' | 'practice'>('theory'),
    [question, setQuestion] = useState(0),
    [answer, setAnswer] = useState(''),
    [typedAnswer, setTypedAnswer] = useState(''),
    [selectedWords, setSelectedWords] = useState<number[]>([]),
    [catState, setCatState] = useState<CatState>('neutral'),
    [mistakeMode, setMistakeMode] = useState(false),
    [mistakeQueue, setMistakeQueue] = useState<number[]>([]);
  const { leaving, move } = useTaskMotion(),
    answerLock = useRef(false);
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
  const record = (value: string) => {
    if (answer || answerLock.current) return;
    answerLock.current = true;
    const correct = normalizeText(value) === normalizeText(exercise.answer),
      storedErrors = lessonState.errors || [],
      storedErrorIds = lessonState.errorIds || [],
      nextErrors = correct
        ? storedErrors.filter((index) => index !== exerciseIndex)
        : [...new Set([...storedErrors, exerciseIndex])],
      nextErrorIds = correct
        ? storedErrorIds.filter((id) => id !== exerciseId)
        : [...new Set([...storedErrorIds, exerciseId])];
    setAnswer(value);
    playFeedbackSound(correct);
    setCatState(
      question === exerciseTotal - 1 ? 'love' : correct ? 'happy' : 'wrong',
    );
    save(lesson.id, {
      ...lessonState,
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
      lastExerciseId: mistakeMode ? lessonState.lastExerciseId : exerciseId,
    });
    recordLearningEvent(correct, correct ? 6 : 2);
    if (
      !mistakeMode &&
      question === lesson.exercises.length - 1 &&
      !lessonState.completed
    ) {
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
    setQuestion(resumeIndex(courseLessons[index], stored));
    setMode('theory');
    setMistakeMode(false);
    setMistakeQueue([]);
    setAnswer('');
    setTypedAnswer('');
    setSelectedWords([]);
    setCatState('neutral');
  };
  const startPractice = () => {
    answerLock.current = false;
    studyLesson(lesson.id, lesson.title);
    setMode('practice');
    setMistakeMode(false);
    setMistakeQueue([]);
    setQuestion(resumeIndex(lesson, lessonState));
    setAnswer('');
    setTypedAnswer('');
    setSelectedWords([]);
    setCatState('thinking');
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
          copy="После теории — 50 смешанных заданий: свободный ввод, сборка фраз, верно/неверно и варианты в случайном порядке."
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
              <span className="course-number">{item.number}</span>
              <em>{item.icon}</em>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
              <PawProgress done={state.done} total={item.exercises.length} />
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
      <div className="lesson-workspace">
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
              className={mode === 'practice' && !mistakeMode ? 'active' : ''}
              onClick={startPractice}
            >
              {lesson.exercises.length} заданий
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
          <div className="theory-layout">
            <main>
              {lesson.theory.map((block, index) => {
                const favoriteId = `${lesson.id}-rule-${index}`;
                return (
                  <article className="theory-block" key={block.title}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
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
                    <h3>{block.title}</h3>
                    {block.paragraphs.map((text) => (
                      <p key={text}>{text}</p>
                    ))}
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
              })}
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
              <button className="primary-btn" onClick={startPractice}>
                Начать 50 заданий <ArrowRight />
              </button>
            </aside>
          </div>
        ) : (
          <div className="exercise-layout">
            <main
              className={`lesson-exercise task-swap ${leaving ? 'leaving' : ''}`}
              key={`${lesson.id}-${exerciseIndex}`}
            >
              <CatPeek state={catState} />
              <ReportExerciseButton
                id={`lesson:${lesson.id}:${normalizeText(exercise.prompt)}:${normalizeText(exercise.answer)}`}
                section={`Урок ${lesson.number}: ${lesson.title}`}
                prompt={exercise.prompt}
                answer={exercise.answer}
                options={exercise.options}
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
                      normalizeText(answer) === normalizeText(exercise.answer)
                        ? 'lesson-result correct'
                        : 'lesson-result wrong'
                    }
                  >
                    <b>
                      {normalizeText(answer) === normalizeText(exercise.answer)
                        ? 'Верно!'
                        : 'Нужно исправить'}
                    </b>
                    <p>{exercise.explanation}</p>
                    {normalizeText(answer) ===
                      normalizeText(exercise.answer) && (
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
                    {normalizeText(answer) !==
                      normalizeText(exercise.answer) && (
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
                  <small>
                    <Lightbulb /> Подсказка: {exercise.hint}
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

const topicPlaces: Record<string, number> = {
  Музыка: 10,
  'Знакомство и о себе': 0,
  'Семья и люди': 1,
  'Мой день и рутина': 2,
  'Дом и жильё': 3,
  'Еда и ресторан': 4,
  'Город и транспорт': 5,
  'Покупки и одежда': 6,
  Путешествия: 7,
  'Работа и учёба': 8,
  Здоровье: 9,
  'Досуг и хобби': 10,
  'Погода и природа': 11,
  'Ночная жизнь': 5,
  'Живой сленг': 0,
  'Знакомства и отношения': 1,
  'Переписка и интернет': 8,
};
const emptyCustomWord = {
  es: '',
  ru: '',
  example: '',
  exampleRu: '',
  extraExample: '',
  extraExampleRu: '',
};
function CustomWordsPanel() {
  const { words, add, remove } = useCustomWords(),
    [open, setOpen] = useState(false),
    [draft, setDraft] = useState(emptyCustomWord),
    [message, setMessage] = useState('');
  const change = (key: keyof typeof emptyCustomWord, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const submit = () => {
    if (Object.values(draft).some((value) => !value.trim())) {
      setMessage('Заполните слово, перевод и оба примера с переводами.');
      return;
    }
    if (
      words.some((word) => normalizeText(word.es) === normalizeText(draft.es))
    ) {
      setMessage('Такое слово уже есть в вашем словаре.');
      return;
    }
    add(
      Object.fromEntries(
        Object.entries(draft).map(([key, value]) => [key, value.trim()]),
      ) as Omit<CustomWord, 'id'>,
    );
    setDraft(emptyCustomWord);
    setMessage('Слово добавлено и уже доступно в теме «Мои слова» в Practice.');
  };
  return (
    <section className={`custom-words-panel ${open ? 'open' : ''}`}>
      <header>
        <div>
          <p className="eyebrow">МОЙ СЛОВАРЬ · {words.length} СЛОВ</p>
          <h2>Добавьте собственные слова и примеры</h2>
          <p>
            Они сохраняются в вашем профиле, входят в резервную копию и
            появляются отдельной темой в Practice.
          </p>
        </div>
        <button onClick={() => setOpen((value) => !value)}>
          {open ? 'Закрыть' : '+ Добавить слово'}
        </button>
      </header>
      {open && (
        <div className="custom-word-form">
          <label>
            <span>Испанское слово или выражение</span>
            <input
              value={draft.es}
              onChange={(event) => change('es', event.target.value)}
              placeholder="la terraza"
            />
          </label>
          <label>
            <span>Точный перевод</span>
            <input
              value={draft.ru}
              onChange={(event) => change('ru', event.target.value)}
              placeholder="терраса"
            />
          </label>
          <label>
            <span>Пример 1 на испанском</span>
            <input
              value={draft.example}
              onChange={(event) => change('example', event.target.value)}
              placeholder="Desayunamos en la terraza."
            />
          </label>
          <label>
            <span>Полный перевод примера 1</span>
            <input
              value={draft.exampleRu}
              onChange={(event) => change('exampleRu', event.target.value)}
              placeholder="Мы завтракаем на террасе."
            />
          </label>
          <label>
            <span>Пример 2 на испанском</span>
            <input
              value={draft.extraExample}
              onChange={(event) => change('extraExample', event.target.value)}
              placeholder="La terraza da al jardín."
            />
          </label>
          <label>
            <span>Полный перевод примера 2</span>
            <input
              value={draft.extraExampleRu}
              onChange={(event) => change('extraExampleRu', event.target.value)}
              placeholder="Терраса выходит в сад."
            />
          </label>
          <div className="custom-word-submit">
            <button onClick={submit}>Сохранить слово</button>
            {message && <output>{message}</output>}
          </div>
        </div>
      )}
      {!!words.length && (
        <div className="custom-word-list">
          {words.map((word) => (
            <article key={word.id}>
              <div>
                <b>{word.es}</b>
                <span>{word.ru}</span>
              </div>
              <p>
                {word.example} <small>{word.exampleRu}</small>
              </p>
              <button
                onClick={() => {
                  if (window.confirm(`Удалить «${word.es}» из моего словаря?`))
                    remove(word.id);
                }}
                aria-label={`Удалить ${word.es}`}
              >
                Удалить
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
function VocabularyView() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(vocabularyTopics[0].name);
  const [filter, setFilter] = useState<'all' | WordStatus>('all');
  const { progress, update } = useWordProgress();
  const history = useWordHistory();
  const { records, markNew } = useSRS();
  const { voices, voiceIndex, setVoiceIndex, speakText, voiceError } = useSpanishVoices();
  const studyDeck = makeStudyDeck();
  const topic =
    vocabularyTopics.find((item) => item.name === selected) ??
    vocabularyTopics[0];
  const normalized = query.trim().toLowerCase();
  const results = vocabularyTopics
    .flatMap((item) =>
      item.entries.map((entry) => ({
        ...entry,
        topic: item.name,
        icon: item.icon,
      })),
    )
    .filter(
      (entry) =>
        !normalized ||
        entry.es.toLowerCase().includes(normalized) ||
        entry.ru.toLowerCase().includes(normalized) ||
        entry.example.toLowerCase().includes(normalized),
    );
  const base = normalized
    ? results
    : topic.entries.map((entry) => ({
        ...entry,
        topic: topic.name,
        icon: topic.icon,
      }));
  const visible = base.filter((entry) => {
    const key = `${entry.topic}-${entry.id}`;
    return (
      filter === 'all' ||
      derivedWordStatus(key, records, progress[key] || 'new') === filter
    );
  });
  const vocabularyCount = vocabularyTopics.reduce(
    (sum, item) => sum + item.entries.length,
    0,
  );
  return (
    <div className="view-stack vocabulary-view">
      <ViewHead
        over={`${vocabularyCount} СЛОВ · ${vocabularyTopics.length} ЖИВЫХ ТЕМ`}
        title="Слова, которые пригодятся."
        copy="Статусы связаны с Practice и считаются одинаково во Vocabulary и Progress. После входа они синхронизируются с аккаунтом."
      />
      <section className="vocabulary-status-guide">
        <b>Как меняется статус</b>
        <span>
          <i>Новое</i> — ещё не было ответов.
        </span>
        <span>
          <i>Учу</i> — началась хотя бы одна активная проверка.
        </span>
        <span>
          <i>Сложное</i> — накопились минимум две ошибки или вы отметили слово
          сами.
        </span>
        <span>
          <i>Выучено</i> — узнавание и перевод без вариантов проверены минимум
          по 3 раза, серия верных ответов 2+, точность 75%+.
        </span>
      </section>
      <section className="vocabulary-voice-picker">
        <div>
          <Volume2 />
          <span>
            <b>Голос словаря</b>
            <small>Выбор действует также в Practice и диктанте</small>
          </span>
        </div>
        {voices.length ? (
          <select
            value={voiceIndex}
            onChange={(event) => setVoiceIndex(Number(event.target.value))}
            aria-label="Выбрать испанский голос словаря"
          >
            {voices.map((voice, index) => (
              <option value={index} key={`${voice.name}-${index}`}>
                {voiceDisplayName(voice)}
              </option>
            ))}
          </select>
        ) : (
          <small>Испанские системные голоса не найдены</small>
        )}
        <button onClick={() => speakText('Hola, ¿cómo estás?', 1)}>
          Прослушать голос
        </button>
        <p>
          Сначала показываются Paulina и Mónica, затем два мужских голоса — если
          они установлены в системе. Остальные доступные голоса остаются в списке.
        </p>
        {voiceError && <output className="voice-error">⚠ {voiceError}</output>}
      </section>
      <CustomWordsPanel />
      <label className="search-box">
        <Search />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Например: аэропорт, квартира, погода…"
        />
        <span>{visible.length} слов</span>
      </label>
      <div className="vocab-topic-tabs">
        {vocabularyTopics.map((item, index) => {
          const scene = topicPlaces[item.name] ?? index % 12;
          return (
            <button
              className={`${selected === item.name && !normalized ? 'active' : ''} place-topic`}
              onClick={() => {
                setSelected(item.name);
                setQuery('');
              }}
              key={item.name}
            >
              <span className={`topic-scene scene-${scene}`} />
              <span>{item.icon}</span>
              <b>{item.name}</b>
              <small>{item.entries.length} слов</small>
              <i
                className={
                  ['sunset', 'purple', 'cyan', 'pink', 'orange', 'blue'][
                    index % 6
                  ]
                }
              />
            </button>
          );
        })}
      </div>
      <div className="status-filters">
        {(['all', 'new', 'learning', 'learned', 'difficult'] as const).map(
          (value) => (
            <button
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
              key={value}
            >
              {value === 'all' ? 'Все' : statusLabels[value]}
            </button>
          ),
        )}
      </div>
      <section className="vocab-library">
        <header>
          <div>
            <p className="eyebrow">
              {normalized
                ? 'РЕЗУЛЬТАТЫ ПОИСКА'
                : `${topic.icon} ${topic.name.toUpperCase()}`}
            </p>
            <h2>{visible.length} слов</h2>
          </div>
          <span>
            Español → перевод → пример → статус · примеры: ручная редактура и{' '}
            <a href="https://tatoeba.org" target="_blank" rel="noreferrer">
              Tatoeba, CC BY 2.0
            </a>
          </span>
        </header>
        <div className="vocab-table">
          {visible.map((entry) => {
            const key = `${entry.topic}-${entry.id}`,
              status = derivedWordStatus(key, records, progress[key] || 'new'),
              statusDate =
                status === 'learned'
                  ? history[key]?.learnedAt
                  : history[key]?.firstStudiedAt;
            return (
              <article key={key}>
                <span className="word-index">
                  {String(entry.id).padStart(2, '0')}
                </span>
                <div className="word-main">
                  <b>{entry.es}</b>
                  <span>{entry.ru}</span>
                  {['gato', 'cafe'].includes(normalizeText(entry.es)) && (
                    <i
                      className={`living-word ${normalizeText(entry.es)}`}
                      aria-hidden="true"
                    >
                      {normalizeText(entry.es) === 'gato' ? '🐈' : '☕'}
                    </i>
                  )}
                </div>
                <div className="vocab-example-wrap">
                  <p className="vocab-example">
                    <b>{entry.example}</b>
                    {entry.exampleRu && <span>{entry.exampleRu}</span>}
                  </p>
                  <button
                    className="example-audio"
                    onClick={() => speakText(entry.example, 1)}
                    aria-label={`Прослушать пример: ${entry.example}`}
                  >
                    <Volume2 /> Озвучить пример
                  </button>
                  <ReportExampleButton
                    id={`vocabulary-${key}`}
                    word={entry.es}
                    example={entry.example}
                    translation={entry.exampleRu || ''}
                    source={entry.topic}
                  />
                </div>
                <div className="word-status-control">
                  <select
                    className={`word-status ${status}`}
                    value={status}
                    onChange={(event) => {
                      const next = event.target.value as WordStatus;
                      if (next === 'new') {
                        const card = studyDeck.find(
                          (item) =>
                            baseCardKey(item.key) === key &&
                            item.skill === 'recognition',
                        );
                        if (card) markNew(card);
                        else update(key, 'new');
                      } else if (next !== 'learned') update(key, next);
                    }}
                    aria-label={`Статус слова ${entry.es}`}
                  >
                    {(Object.keys(statusLabels) as WordStatus[]).map(
                      (value) => (
                        <option
                          value={value}
                          disabled={value === 'learned' && status !== 'learned'}
                          key={value}
                        >
                          {statusLabels[value]}
                        </option>
                      ),
                    )}
                  </select>
                  {statusDate && (
                    <small className="word-status-date">
                      {status === 'learned' ? 'Выучено' : 'Начато'}{' '}
                      {new Date(statusDate).toLocaleDateString('ru-RU')}
                    </small>
                  )}
                </div>
                <button
                  aria-label={`Прослушать ${entry.es}`}
                  onClick={() => speakText(entry.es.split(' / ')[0], 1)}
                >
                  <Volume2 />
                </button>
              </article>
            );
          })}
        </div>
      </section>
      <section className="similar-words-guide">
        <p className="eyebrow">ПОХОЖИЙ ПЕРЕВОД — РАЗНЫЙ СМЫСЛ</p>
        <h2>Не учите синонимы как одно слово</h2>
        <div>
          <article>
            <b>piso / apartamento</b>
            <p>
              <strong>piso</strong> чаще звучит в Испании;{' '}
              <strong>apartamento</strong> — нейтральнее и часто означает
              отдельную небольшую квартиру.
            </p>
          </article>
          <article>
            <b>nevera / frigorífico</b>
            <p>
              Оба — «холодильник»: <strong>nevera</strong> обычно разговорнее,{' '}
              <strong>frigorífico</strong> распространено в Испании.
            </p>
          </article>
          <article>
            <b>menú / carta</b>
            <p>
              <strong>menú</strong> может быть готовым комплексом блюд, а{' '}
              <strong>carta</strong> — полный список позиций ресторана.
            </p>
          </article>
          <article>
            <b>billete / entrada</b>
            <p>
              <strong>billete</strong> — билет на транспорт;{' '}
              <strong>entrada</strong> — входной билет в музей, кино или на
              концерт.
            </p>
          </article>
          <article>
            <b>ser / estar</b>
            <p>
              <strong>ser</strong> описывает сущность и идентификацию,{' '}
              <strong>estar</strong> — состояние и местоположение.
            </p>
          </article>
          <article>
            <b>saber / conocer</b>
            <p>
              <strong>saber</strong> — знать факт или уметь;{' '}
              <strong>conocer</strong> — быть знакомым с человеком, местом или
              произведением.
            </p>
          </article>
          <article>
            <b>tú / tu</b>
            <p>
              <strong>tú</strong> с ударением — «ты»; <strong>tu</strong> без
              ударения — «твой»: Tú buscas tu teléfono.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

const grammarTopicsBase = [
  {
    name: 'Unidad 5. Presente de indicativo',
    source: 'Дышлевая И. А. — Unidad 5, 12–13, стр. 28–29, 70–75',
    use: 'Настоящее время описывает регулярные действия, привычки, общеизвестные факты, расписание и то, что происходит в актуальный период. В испанской фразе личное местоимение часто опускается: окончание глагола уже показывает лицо.',
    formula:
      '-AR: -o, -as, -a, -amos, -áis, -an · -ER: -o, -es, -e, -emos, -éis, -en · -IR: -o, -es, -e, -imos, -ís, -en',
    signals: 'siempre · normalmente · a menudo · cada día · los lunes · nunca',
    details:
      'У правильного глагола отделите -ar, -er или -ir и присоедините окончание: hablar → habl- → hablo; comer → com- → comemos; vivir → viv- → viven. Спряжения -er и -ir совпадают во многих лицах, но различаются в nosotros и vosotros.',
    rules: [
      'В форме tú у правильных глаголов настоящее время оканчивается на -s: hablas, comes, vives.',
      'Форма ellos/ellas/ustedes получается из формы él/ella/usted с добавлением -n: habla → hablan, come → comen.',
      'Наречия частоты можно поставить перед фразой или после глагола: Normalmente trabajo… / Trabajo normalmente…',
      'Перед глаголом достаточно одного отрицательного слова: Nunca estudio por la noche. Сочетание no…nunca возможно, если nunca стоит после глагола.',
      'Частые неправильные формы нужно учить как отдельные модели: digo, oigo, vengo, hago, pongo, traigo, caigo, salgo, quepo, veo, vuelvo, doy.',
      'Некоторые глаголы меняют основу, но сохраняют личные окончания: volver → vuelvo; decir → digo.',
    ],
    examples: [
      ['Trabajo desde casa todos los días.', 'Я каждый день работаю из дома.'],
      [
        '¿Vives aquí o vienes de visita?',
        'Ты живёшь здесь или приехал в гости?',
      ],
      [
        'Nunca salgo tarde los lunes.',
        'По понедельникам я никогда не выхожу поздно.',
      ],
    ],
    mistake:
      'Не ставьте инфинитив вместо личной формы: Yo trabajo, а не Yo trabajar. Подлежащее и окончание должны обозначать одно и то же лицо.',
    questions: [],
  },
  {
    name: 'Unidad 2. Род, число и артикли',
    source: 'Дышлевая И. А. — Unidad 2 и 62, стр. 9–13, 437–443',
    use: 'Артикль показывает род и число существительного, а также помогает понять, говорим ли мы о конкретном/известном предмете или вводим его впервые. Род слова лучше запоминать сразу вместе с артиклем.',
    formula:
      'el / la / los / las · un / una / unos / unas · a + el = al · de + el = del',
    signals:
      'первое упоминание → un/una · повторное/конкретное → el/la · класс целиком → определённый артикль',
    details:
      'Часто -o указывает на мужской род, а -a — на женский, но это не универсальное правило. Обычно мужские: слова на -or, -aje, -ma греческого происхождения; женские: на -ción, -sión, -dad, -tad, -tud, -umbre. Проверяйте исключения: el problema, el día, el mapa, la mano, la foto, la moto.',
    rules: [
      'Множественное число: после гласной добавьте -s; после согласной — -es; у слова на -z замените z на c: luz → luces.',
      'Определённый артикль нужен при повторном упоминании, с уникальными и конкретными объектами и при обобщении: Los gatos son curiosos.',
      'Неопределённый артикль вводит один предмет или представителя класса: Busco un hotel; Es una solución posible.',
      'После ser перед профессией без уточнения артикль обычно не ставится: Soy profesora. Если есть характеристика, возможен артикль: Es una profesora excelente.',
      'Артикль часто опускается с неисчисляемым значением в общем смысле и после no hay: Bebo café; No hay pan.',
      'Перед женским существительным с начальным ударным a-/ha- в единственном числе употребляются el/un: el agua fría, un águila blanca. Само слово остаётся женского рода; во множественном числе: las aguas.',
      'Слияния al и del обязательны только с мужским артиклем el: Voy al centro; Vengo del hotel. С именами собственными El Salvador слияние зависит от самого названия.',
      'Прилагательное согласуется с существительным по роду и числу, даже если форма артикля необычна: el agua fría.',
    ],
    examples: [
      ['Busco un hotel. El hotel está cerca.', 'Ищу отель. Этот отель рядом.'],
      [
        'Soy médica, pero Ana es una médica excelente.',
        'Я врач, а Ана — превосходный врач.',
      ],
      [
        'El agua está fría; las aguas del norte son frías.',
        'Вода холодная; северные воды холодные.',
      ],
    ],
    mistake:
      'Нельзя надёжно определять род только по последней букве. Учите el problema и la mano как цельные единицы.',
    questions: [],
  },
  {
    name: 'Unidad 61. Предлоги: a, de, en, por и para',
    source: 'Дышлевая И. А. — Unidad 61, стр. 431–436; базовые модели курса',
    use: 'Предлоги связывают действие с направлением, местом, происхождением, причиной, целью, сроком или получателем. Особенно важно различать por — мотив, путь или обстоятельство — и para — цель или ориентир.',
    formula:
      'ir a · venir de · estar en · pasar por · gracias por · para + цель/получатель · al / del',
    signals:
      'куда? → a · откуда/чей? → de · где? → en · почему/через что? → por · зачем/для кого/к какому сроку? → para',
    details:
      'A обозначает направление и адресата; de — происхождение, материал и принадлежность; en — нахождение и транспорт; por объясняет причину, маршрут, средство, обмен или длительность; para задаёт цель, назначение, получателя, направление или крайний срок.',
    rules: [
      'A + el превращается в al, de + el — в del: al museo, del trabajo. С la, los, las слияния нет.',
      'Por отвечает на вопрос «почему?» и выражает причину: Lo hice por ti. Para отвечает «зачем?» и вводит цель: Estudio para trabajar.',
      'Por обозначает путь или движение внутри пространства: Paseamos por el parque. Para — направление к месту: Salimos para Madrid.',
      'Por может обозначать продолжительность, примерное время и частоту; para — срок выполнения: por dos horas; para el lunes.',
      'Por употребляется при обмене, цене, средстве связи и деятеле в пассиве: diez euros por libro; por teléfono; escrito por Ana.',
      'Para вводит получателя, назначение и точку зрения: Este regalo es para ti; una taza para café; para mí.',
      'С en говорят о месте и способе передвижения: en casa, en tren. Но пешком — a pie.',
    ],
    examples: [
      ['Voy al aeropuerto en metro.', 'Я еду в аэропорт на метро.'],
      [
        'Gracias por venir; esto es para ti.',
        'Спасибо, что пришёл; это для тебя.',
      ],
      [
        'Trabajo para una empresa y viajo por España.',
        'Я работаю на компанию и путешествую по Испании.',
      ],
    ],
    mistake:
      'Не переводите русское «для» автоматически как para: причина «ради тебя» может быть por ti, а адресат подарка — para ti.',
    questions: [],
  },
  {
    name: 'Unidad 30. Pretérito perfecto',
    source: 'Дышлевая И. А. — Unidad 30, стр. 174–180',
    use: 'Pretérito perfecto связывает завершённое действие с настоящим: важен нынешний результат, период ещё продолжается, событие произошло недавно или точное прошлое время не названо.',
    formula: 'he · has · ha · hemos · habéis · han + participio (-ado / -ido)',
    signals:
      'hoy · esta semana · este año · ya · todavía no · alguna vez · nunca',
    details:
      'Составная форма образуется настоящим временем haber и причастием. Эти части не разделяются. Безударные местоимения ставятся перед haber: Lo he visto; Me he levantado. Причастие после haber не согласуется с подлежащим.',
    rules: [
      'Правильное причастие: hablar → hablado; comer → comido; vivir → vivido.',
      'Haber и причастие образуют единое сказуемое: нельзя вставлять между ними наречие или дополнение.',
      'Частые неправильные причастия: hecho, dicho, visto, escrito, puesto, abierto, roto, vuelto, muerto.',
      'С закончившимся прошлым периодом обычно выбирают indefinido: Ayer fui. С незавершённым периодом: Hoy he ido.',
      'Perfecto подходит для жизненного опыта без точной даты: ¿Has estado alguna vez en Perú?',
      'Текущий результат важнее самого момента действия: He perdido las llaves — сейчас у меня нет ключей.',
    ],
    examples: [
      ['Hoy he hablado con Ana.', 'Сегодня я поговорил с Аной.'],
      ['Todavía no lo he visto.', 'Я этого ещё не видел.'],
      [
        'Esta semana hemos hecho tres ejercicios.',
        'На этой неделе мы сделали три упражнения.',
      ],
    ],
    mistake:
      'После haber причастие неизменно: Ella ha llegado и Ellos han llegado, не han llegados.',
    questions: [],
  },
  {
    name: 'Unidad 31–34. Indefinido и imperfecto',
    source: 'Дышлевая И. А. — Unidad 31–32 и 34, стр. 181–207',
    use: 'Indefinido продвигает рассказ завершёнными событиями. Imperfecto создаёт фон: описывает состояние, обстановку, длительный процесс или повторяющееся действие без акцента на границах.',
    formula: 'hablé / comí / viví ↔ hablaba / comía / vivía',
    signals:
      'ayer, anoche, en 2024, de repente → indefinido · antes, mientras, de niño, normalmente → imperfecto',
    details:
      'Смотрите не только на маркер, но и на роль действия в рассказе. Imperfecto отвечает «что происходило/как было?», indefinido — «что произошло?». Вместе они дают типичную конструкцию: Llovía cuando llegó Ana.',
    rules: [
      'Indefinido правильных -ar: -é, -aste, -ó, -amos, -asteis, -aron; -er/-ir: -í, -iste, -ió, -imos, -isteis, -ieron.',
      'Imperfecto -ar: -aba, -abas, -aba, -ábamos, -abais, -aban; -er/-ir: -ía, -ías, -ía, -íamos, -íais, -ían.',
      'У imperfecto только три частые неправильные модели: ser → era, ir → iba, ver → veía.',
      'Ser и ir в indefinido имеют одинаковые формы: fui, fuiste, fue, fuimos, fuisteis, fueron; значение определяет контекст.',
      'Indefinido используется для последовательности законченных событий и действия с обозначенными границами.',
      'Imperfecto нужен для возраста, времени, погоды, описаний и привычек в прошлом: Eran las ocho; hacía frío; tenía diez años.',
      'Длительный фон в imperfecto может быть прерван событием в indefinido: Dormía cuando sonó el teléfono.',
      'Imperfecto также встречается в косвенной речи, вежливых просьбах и планах, которые затем изменились.',
    ],
    examples: [
      ['Llovía cuando llegó Ana.', 'Шёл дождь, когда пришла Ана.'],
      [
        'De niño iba al mar cada verano.',
        'В детстве я каждое лето ездил к морю.',
      ],
      [
        'Entró, dejó la mochila y llamó a Marta.',
        'Он вошёл, оставил рюкзак и позвонил Марте.',
      ],
    ],
    mistake:
      'Сигнальное слово — лишь подсказка. Выбор времени определяется тем, показываете ли вы завершённое событие или фон/процесс.',
    questions: [],
  },
];

type QuizQuestion = {
  kind: string;
  prompt: string;
  options: string[];
  answer: string;
  tip: string;
};
const grammarQuestionBanksBase: QuizQuestion[][] = [
  [
    {
      kind: 'Форма глагола',
      prompt: 'Yo ___ español todos los días.',
      options: ['estudio', 'estudias', 'estudia'],
      answer: 'estudio',
      tip: 'Для yo у правильных глаголов окончание -o.',
    },
    {
      kind: 'Согласование',
      prompt: 'Nosotros ___ en Valencia.',
      options: ['vivimos', 'viven', 'vivís'],
      answer: 'vivimos',
      tip: 'Для nosotros у глаголов на -ir используется -imos.',
    },
    {
      kind: 'Вопрос',
      prompt: '¿Tú ___ café por la mañana?',
      options: ['tomas', 'toma', 'tomo'],
      answer: 'tomas',
      tip: 'Для tú у глаголов на -ar окончание -as.',
    },
    {
      kind: 'Отрицание',
      prompt: 'Выберите правильное: «Я не работаю по воскресеньям».',
      options: [
        'No trabajo los domingos.',
        'Trabajo no los domingos.',
        'No trabajar los domingos.',
      ],
      answer: 'No trabajo los domingos.',
      tip: 'No ставится прямо перед спрягаемым глаголом.',
    },
    {
      kind: 'Неправильный глагол',
      prompt: 'Ella ___ dos hermanos.',
      options: ['tiene', 'tene', 'tienes'],
      answer: 'tiene',
      tip: 'tener меняет основу: tiene.',
    },
    {
      kind: 'Ser или estar',
      prompt: 'Madrid ___ la capital de España.',
      options: ['es', 'está', 'soy'],
      answer: 'es',
      tip: 'Для постоянной характеристики используем ser.',
    },
    {
      kind: 'Ser или estar',
      prompt: 'Ahora Ana ___ en casa.',
      options: ['está', 'es', 'son'],
      answer: 'está',
      tip: 'Местонахождение выражается через estar.',
    },
    {
      kind: 'Найди ошибку',
      prompt: 'Какое предложение построено неверно?',
      options: [
        'Yo trabajar en casa.',
        'Trabajo en casa.',
        'Ella trabaja mucho.',
      ],
      answer: 'Yo trabajar en casa.',
      tip: 'После подлежащего нужен спрягаемый глагол, не инфинитив.',
    },
    {
      kind: 'Перевод',
      prompt: 'Как сказать «Мы всегда ужинаем поздно»?',
      options: [
        'Siempre cenamos tarde.',
        'Siempre cenan tarde.',
        'Cenamos ayer tarde.',
      ],
      answer: 'Siempre cenamos tarde.',
      tip: 'cenar → nosotros cenamos.',
    },
    {
      kind: 'Маркер времени',
      prompt: 'Какой маркер чаще всего указывает на привычку?',
      options: ['cada día', 'ayer', 'la semana pasada'],
      answer: 'cada día',
      tip: 'Cada día — повторяющееся действие в настоящем.',
    },
    {
      kind: 'Ir — особая форма',
      prompt: 'Los viernes mis amigos ___ al cine.',
      options: ['van', 'vais', 'vamos'],
      answer: 'van',
      tip: 'ir: voy, vas, va, vamos, vais, van.',
    },
    {
      kind: 'Мини-диалог',
      prompt: '— ¿Dónde trabajas? — ___ en un hotel.',
      options: ['Trabajo', 'Trabaja', 'Trabajas'],
      answer: 'Trabajo',
      tip: 'Отвечающий говорит о себе: форма yo.',
    },
  ],
  [
    {
      kind: 'Первое упоминание',
      prompt: 'Necesito ___ billete para Sevilla.',
      options: ['un', 'el', 'las'],
      answer: 'un',
      tip: 'Предмет упоминается впервые: un billete.',
    },
    {
      kind: 'Род слова',
      prompt: '___ mesa está reservada.',
      options: ['La', 'El', 'Los'],
      answer: 'La',
      tip: 'mesa — существительное женского рода.',
    },
    {
      kind: 'Множественное число',
      prompt: 'Me gustan ___ playas de Cádiz.',
      options: ['las', 'la', 'el'],
      answer: 'las',
      tip: 'playas — женский род, множественное число.',
    },
    {
      kind: 'Исключение',
      prompt: 'Выберите правильный вариант.',
      options: ['el problema', 'la problema', 'una problema'],
      answer: 'el problema',
      tip: 'Несмотря на -a, problema — мужского рода.',
    },
    {
      kind: 'Ударное A',
      prompt: '___ agua está fría.',
      options: ['El', 'La', 'Unos'],
      answer: 'El',
      tip: 'Перед ударным a- употребляется el, хотя слово остаётся женского рода.',
    },
    {
      kind: 'Контекст',
      prompt: 'Veo un café. ___ café está abierto.',
      options: ['El', 'Un', 'La'],
      answer: 'El',
      tip: 'При повторном упоминании используем определённый артикль.',
    },
    {
      kind: 'Обобщение',
      prompt: '___ música me ayuda a estudiar.',
      options: ['La', 'Una', 'Un'],
      answer: 'La',
      tip: 'При разговоре о явлении в целом в испанском обычно нужен артикль.',
    },
    {
      kind: 'Найди ошибку',
      prompt: 'Какое сочетание неверно?',
      options: ['la mano', 'el día', 'la viaje'],
      answer: 'la viaje',
      tip: 'Правильно: el viaje.',
    },
    {
      kind: 'Множественное число',
      prompt: 'В комнате есть несколько окон.',
      options: ['Hay unas ventanas.', 'Hay un ventanas.', 'Hay la ventanas.'],
      answer: 'Hay unas ventanas.',
      tip: 'Несколько неопределённых предметов: unas ventanas.',
    },
    {
      kind: 'Перевод',
      prompt: 'Как сказать «Дети играют в парке»?',
      options: [
        'Los niños juegan en el parque.',
        'Un niños juega en parque.',
        'La niños juegan al parque.',
      ],
      answer: 'Los niños juegan en el parque.',
      tip: 'Определённая группа во множественном числе: los niños.',
    },
    {
      kind: 'Род слова',
      prompt: 'Выберите правильную пару.',
      options: ['la ciudad', 'el ciudad', 'un ciudad'],
      answer: 'la ciudad',
      tip: 'ciudad — женского рода.',
    },
    {
      kind: 'Мини-диалог',
      prompt: '— ¿Dónde está el hotel? — ___ hotel está junto al banco.',
      options: ['El', 'Un', 'Una'],
      answer: 'El',
      tip: 'Собеседникам уже понятно, о каком отеле речь.',
    },
  ],
  [
    {
      kind: 'Направление',
      prompt: 'Mañana voy ___ Barcelona.',
      options: ['a', 'de', 'por'],
      answer: 'a',
      tip: 'Движение к месту: ir a.',
    },
    {
      kind: 'Причина',
      prompt: 'Gracias ___ venir.',
      options: ['por', 'para', 'en'],
      answer: 'por',
      tip: 'Причина благодарности выражается через por.',
    },
    {
      kind: 'Местонахождение',
      prompt: 'Trabajo ___ casa los viernes.',
      options: ['en', 'a', 'de'],
      answer: 'en',
      tip: 'Где? — en casa.',
    },
    {
      kind: 'Получатель',
      prompt: 'Este regalo es ___ ti.',
      options: ['para', 'por', 'con'],
      answer: 'para',
      tip: 'Получатель — para.',
    },
    {
      kind: 'Происхождение',
      prompt: 'Somos ___ Argentina.',
      options: ['de', 'en', 'a'],
      answer: 'de',
      tip: 'Происхождение: ser de.',
    },
    {
      kind: 'Совместность',
      prompt: 'Voy al concierto ___ Marta.',
      options: ['con', 'por', 'para'],
      answer: 'con',
      tip: 'Вместе с кем-то — con.',
    },
    {
      kind: 'Слияние',
      prompt: 'Caminamos ___ centro.',
      options: ['al', 'a el', 'del'],
      answer: 'al',
      tip: 'a + el = al.',
    },
    {
      kind: 'Слияние',
      prompt: 'Salimos ___ hotel a las ocho.',
      options: ['del', 'de el', 'al'],
      answer: 'del',
      tip: 'de + el = del.',
    },
    {
      kind: 'Por или para',
      prompt: 'Estudio español ___ trabajar en México.',
      options: ['para', 'por', 'de'],
      answer: 'para',
      tip: 'Цель действия — para + infinitivo.',
    },
    {
      kind: 'Por или para',
      prompt: 'Paseamos ___ el centro histórico.',
      options: ['por', 'para', 'a'],
      answer: 'por',
      tip: 'Маршрут или движение по месту — por.',
    },
    {
      kind: 'Транспорт',
      prompt: 'Viajo ___ tren.',
      options: ['en', 'a', 'con'],
      answer: 'en',
      tip: 'Большинство видов транспорта: en tren, en coche.',
    },
    {
      kind: 'Найди ошибку',
      prompt: 'Какое предложение неверно?',
      options: ['Voy a el museo.', 'Vengo de Madrid.', 'Hablo con Ana.'],
      answer: 'Voy a el museo.',
      tip: 'Нужно слияние: Voy al museo.',
    },
  ],
  [
    {
      kind: 'Спряжение haber',
      prompt: 'Esta semana yo ___ trabajado mucho.',
      options: ['he', 'ha', 'has'],
      answer: 'he',
      tip: 'Для yo используется he.',
    },
    {
      kind: 'Спряжение haber',
      prompt: '¿Tú ___ visto esta película?',
      options: ['has', 'he', 'han'],
      answer: 'has',
      tip: 'Для tú используется has.',
    },
    {
      kind: 'Причастие -AR',
      prompt: 'hablar → …',
      options: ['hablado', 'hablido', 'hablando'],
      answer: 'hablado',
      tip: '-ar меняется на -ado.',
    },
    {
      kind: 'Причастие -ER',
      prompt: 'comer → …',
      options: ['comido', 'comado', 'comiendo'],
      answer: 'comido',
      tip: '-er меняется на -ido.',
    },
    {
      kind: 'Исключение',
      prompt: 'hacer → …',
      options: ['hecho', 'hacido', 'haciendo'],
      answer: 'hecho',
      tip: 'Неправильное причастие hacer — hecho.',
    },
    {
      kind: 'Исключение',
      prompt: 'ver → …',
      options: ['visto', 'vido', 'viendo'],
      answer: 'visto',
      tip: 'Неправильное причастие ver — visto.',
    },
    {
      kind: 'Маркер',
      prompt: 'Какой маркер лучше подходит к perfecto?',
      options: ['hoy', 'ayer', 'en 1999'],
      answer: 'hoy',
      tip: 'Сегодняшний период ещё не закончился.',
    },
    {
      kind: 'Отрицание',
      prompt: 'Todavía no ___ comido.',
      options: ['he', 'soy', 'estoy'],
      answer: 'he',
      tip: 'Perfecto строится с haber.',
    },
    {
      kind: 'Согласование',
      prompt: 'Ellas han ___.',
      options: ['llegado', 'llegadas', 'llegando'],
      answer: 'llegado',
      tip: 'Причастие после haber не согласуется.',
    },
    {
      kind: 'Перевод',
      prompt: '«Мы уже закончили».',
      options: [
        'Ya hemos terminado.',
        'Ya terminamos mañana.',
        'Ya estamos terminar.',
      ],
      answer: 'Ya hemos terminado.',
      tip: 'ya + haber + participio.',
    },
    {
      kind: 'Мини-диалог',
      prompt: '— ¿Has estado en Chile? — No, nunca ___.',
      options: ['he estado', 'estuve ayer', 'estaba'],
      answer: 'he estado',
      tip: 'Опыт без законченного момента — perfecto.',
    },
    {
      kind: 'Найди ошибку',
      prompt: 'Какое предложение неверно?',
      options: ['Ella ha llegada.', 'Hemos comido.', 'Han escrito.'],
      answer: 'Ella ha llegada.',
      tip: 'Правильно: Ella ha llegado.',
    },
  ],
  [
    {
      kind: 'Событие',
      prompt: 'Anoche Marta ___ tarde.',
      options: ['llegó', 'llegaba', 'ha llegado'],
      answer: 'llegó',
      tip: 'Завершённое событие anoche — indefinido.',
    },
    {
      kind: 'Привычка в прошлом',
      prompt: 'De niño yo ___ al mar cada verano.',
      options: ['iba', 'fui', 'he ido'],
      answer: 'iba',
      tip: 'Повторяющаяся привычка — imperfecto.',
    },
    {
      kind: 'Фон + событие',
      prompt: 'Yo cocinaba cuando él ___.',
      options: ['llamó', 'llamaba', 'ha llamado'],
      answer: 'llamó',
      tip: 'Длительный фон прерывает короткое событие.',
    },
    {
      kind: 'Описание',
      prompt: 'La casa ___ grande y luminosa.',
      options: ['era', 'fue', 'ha sido'],
      answer: 'era',
      tip: 'Описание обстановки — imperfecto.',
    },
    {
      kind: 'Последовательность',
      prompt: 'Ayer me levanté, desayuné y ___ de casa.',
      options: ['salí', 'salía', 'he salido'],
      answer: 'salí',
      tip: 'Цепочка завершённых событий — indefinido.',
    },
    {
      kind: 'Возраст',
      prompt: 'Cuando ___ diez años, vivía en Lima.',
      options: ['tenía', 'tuve', 'he tenido'],
      answer: 'tenía',
      tip: 'Возраст в прошлом обычно описывается imperfecto.',
    },
    {
      kind: 'Время',
      prompt: '___ las ocho cuando empezó la película.',
      options: ['Eran', 'Fueron', 'Han sido'],
      answer: 'Eran',
      tip: 'Время на фоне прошлого — imperfecto.',
    },
    {
      kind: 'Однократное действие',
      prompt: 'El sábado pasado ___ a Lucía.',
      options: ['conocí', 'conocía', 'he conocido'],
      answer: 'conocí',
      tip: 'Конкретное завершённое событие — indefinido.',
    },
    {
      kind: 'Mientras',
      prompt: 'Mientras Ana leía, Pedro ___.',
      options: ['dormía', 'durmió de repente', 'ha dormido'],
      answer: 'dormía',
      tip: 'Два параллельных фоновых действия — imperfecto.',
    },
    {
      kind: 'Контраст',
      prompt: 'Llovía, pero nosotros ___ salir.',
      options: ['decidimos', 'decidíamos siempre', 'hemos decidido hoy'],
      answer: 'decidimos',
      tip: 'Решение — точечное событие на фоне.',
    },
    {
      kind: 'Перевод',
      prompt: '«Раньше мы жили здесь».',
      options: [
        'Antes vivíamos aquí.',
        'Ayer vivimos aquí.',
        'Hemos vivido mañana.',
      ],
      answer: 'Antes vivíamos aquí.',
      tip: 'Antes и состояние в прошлом — imperfecto.',
    },
    {
      kind: 'Найди ошибку',
      prompt: 'Какой вариант нарушает логику времён?',
      options: [
        'Cuando era niño, fui al colegio cada día.',
        'Ayer fui al colegio.',
        'Mientras estudiaba, sonó el teléfono.',
      ],
      answer: 'Cuando era niño, fui al colegio cada día.',
      tip: 'Для регулярного действия лучше: iba al colegio cada día.',
    },
  ],
];

const unidadOneTopic = {
  name: 'Unidad 1. Алфавит, чтение и произношение',
  source: 'Дышлевая И. А. — Unidad 1, стр. 3–8',
  use: 'Первый раздел учебника последовательно знакомит с алфавитом, устойчивым произношением пяти гласных, позиционным чтением согласных, дифтонгами, ударением и чтением слов. Это база для диктанта и правильного распознавания речи.',
  formula:
    'алфавит → гласные → согласные → дифтонги → ударение → чтение вслух',
  signals:
    'c + e/i · g + e/i · qu + e/i · r/rr · немая h · ñ · ll/y · gui/gue/güi/güe',
  details:
    'Учите не русскую транскрипцию, а связь написания с положением буквы. Сначала уверенно называйте буквы, затем читайте слоги и только потом слова. В современном алфавите 27 букв; ch и ll важны как буквосочетания, но больше не считаются отдельными буквами.',
  rules: [
    'Пять гласных a, e, i, o, u произносятся чётко и почти не редуцируются даже без ударения. Не превращайте безударные e и o в русские «и» и «а».',
    'k, m, n, p и t читаются предсказуемо; q употребляется главным образом в que/qui, где u не звучит: queso, quince.',
    'b и v в большинстве вариантов испанского звучат одинаково: более смычно после паузы и m/n, мягче между гласными.',
    'c перед e/i произносится как [θ] в большей части Испании и как [s] в Латинской Америке; перед a/o/u — [k]. z соответствует [θ] или [s] по тому же региональному принципу.',
    'g перед a/o/u звучит как [g]; перед e/i — как сильный гортанный звук, близкий j. Для [g] перед e/i пишут gue/gui; u обычно не читается, но в güe/güi знак ¨ заставляет её звучать.',
    'h не произносится: hola, ahora. j всегда обозначает сильный гортанный звук: jamón, mujer.',
    'ñ — отдельная буква и отдельный звук: año и ano — разные слова. ll во многих регионах совпадает с y, хотя произношение зависит от страны.',
    'Одиночная r между гласными даёт один удар языка; rr — сильную вибрацию. В начале слова и после n/l одна r тоже звучит сильно: rosa, alrededor, Enrique.',
    'x обычно читается [ks], особенно между гласными; в отдельных именах и региональных словах возможно историческое произношение, например México.',
    'Дифтонг образует один слог, когда слабая i/u соединяется с другой гласной без собственного ударения: aire, causa, bien. Ударение на i/u часто разрушает дифтонг: país, río.',
    'Если слово оканчивается на гласную, n или s, без графического знака ударение обычно падает на предпоследний слог. При другом согласном — на последний.',
    'Знак ударения ставится, когда слово нарушает обычную модель, а также различает некоторые формы: sí/si, té/te. Он всегда показывает ударную гласную.',
  ],
  examples: [
    ['Quiero queso y agua.', 'Я хочу сыр и воду.'],
    ['Mi guitarra está aquí.', 'Моя гитара здесь.'],
    ['El pingüino nada muy bien.', 'Пингвин очень хорошо плавает.'],
    ['Mañana viajamos a México.', 'Завтра мы едем в Мексику.'],
  ],
  mistake:
    'Не читайте испанское слово по правилам английского или русского. Особое внимание: немая h, разные значения c/g, нечитаемая u в que/qui и обязательный знак ударения.',
  questions: [],
};

const unidadOneQuestions: QuizQuestion[] = [
  {
    kind: 'Алфавит',
    prompt: 'Как называется буква ñ?',
    options: ['eñe', 'ene', 'elle'],
    answer: 'eñe',
    tip: 'Ñ — отдельная буква испанского алфавита: eñe.',
  },
  {
    kind: 'Гласные',
    prompt: 'Как произносятся безударные гласные в испанском?',
    options: ['Чётко, без сильной редукции', 'Всегда исчезают', 'Как в английском'],
    answer: 'Чётко, без сильной редукции',
    tip: 'a, e, i, o, u сохраняют качество и в безударном слоге.',
  },
  {
    kind: 'Чтение c',
    prompt: 'В каком слове c читается не как [k]?',
    options: ['cine', 'casa', 'cosa'],
    answer: 'cine',
    tip: 'Перед e/i буква c даёт [θ] в Испании или [s] в Латинской Америке.',
  },
  {
    kind: 'Чтение g',
    prompt: 'Где g произносится как гортанный звук, близкий j?',
    options: ['gente', 'gato', 'gota'],
    answer: 'gente',
    tip: 'g + e/i читается как j.',
  },
  {
    kind: 'Немая буква',
    prompt: 'Какая буква не произносится в слове hola?',
    options: ['h', 'o', 'l'],
    answer: 'h',
    tip: 'Испанская h немая.',
  },
  {
    kind: 'U в сочетаниях',
    prompt: 'В каком слове буква u обязательно произносится?',
    options: ['pingüino', 'guitarra', 'queso'],
    answer: 'pingüino',
    tip: 'Диерезис ü показывает, что u в güe/güi нужно произнести.',
  },
  {
    kind: 'R и rr',
    prompt: 'Где r должна звучать сильно?',
    options: ['perro', 'pero', 'cara'],
    answer: 'perro',
    tip: 'rr между гласными обозначает сильную вибрацию.',
  },
  {
    kind: 'Дифтонг',
    prompt: 'В каком слове сочетание гласных образует один слог?',
    options: ['bien', 'país', 'río'],
    answer: 'bien',
    tip: 'В país и río ударная слабая гласная разрушает дифтонг.',
  },
  {
    kind: 'Ударение',
    prompt: 'Куда без знака ударения падает ударение в слове hablan?',
    options: ['На предпоследний слог', 'На последний слог', 'На первый слог всегда'],
    answer: 'На предпоследний слог',
    tip: 'Окончание на n подчиняется модели предпоследнего слога.',
  },
  {
    kind: 'Ударение',
    prompt: 'Почему в слове canción нужен знак ударения?',
    options: ['Ударение на последнем слоге при окончании -n', 'Так отмечают женский род', 'Знак делает c мягкой'],
    answer: 'Ударение на последнем слоге при окончании -n',
    tip: 'Без знака слово на -n имело бы ударение на предпоследнем слоге.',
  },
  {
    kind: 'Смыслоразличение',
    prompt: 'Какой вариант означает «да»?',
    options: ['sí', 'si', 'se'],
    answer: 'sí',
    tip: 'sí — да; si без знака — если.',
  },
  {
    kind: 'Региональная норма',
    prompt: 'Как корректно описать чтение z в слове zapato?',
    options: ['[θ] в большей части Испании, [s] в Латинской Америке', 'Всегда [z]', 'Буква не читается'],
    answer: '[θ] в большей части Испании, [s] в Латинской Америке',
    tip: 'Обе нормы естественны и зависят от региона.',
  },
];

const grammarTopics = [
  unidadOneTopic,
  grammarTopicsBase[1],
  grammarTopicsBase[0],
  grammarTopicsBase[3],
  grammarTopicsBase[4],
  grammarTopicsBase[2],
];
const grammarQuestionBanks: QuizQuestion[][] = [
  unidadOneQuestions,
  grammarQuestionBanksBase[1],
  grammarQuestionBanksBase[0],
  grammarQuestionBanksBase[3],
  grammarQuestionBanksBase[4],
  grammarQuestionBanksBase[2],
];

function GrammarView() {
  const [active, setActive] = useState(0),
    [question, setQuestion] = useState(0),
    [choice, setChoice] = useState(''),
    [score, setScore] = useState(0),
    answerLock = useRef(false);
  const topic = grammarTopics[active],
    questions = grammarQuestionBanks[active],
    test = questions[question];
  const { leaving, move } = useTaskMotion();
  const choose = (option: string) => {
    if (choice || answerLock.current) return;
    answerLock.current = true;
    const correct = option === test.answer;
    setChoice(option);
    playFeedbackSound(correct);
    recordLearningEvent(correct, correct ? 5 : 2);
    if (correct) setScore((value) => value + 1);
    if (!correct) recordError(topic.name);
  };
  const next = () =>
    move(() => {
      answerLock.current = false;
      const finished = question === questions.length - 1;
      setChoice('');
      setQuestion(finished ? 0 : question + 1);
      if (finished) setScore(0);
    });
  return (
    <div className="view-stack">
      <ViewHead
        over={`ГРАММАТИКА · ${grammarQuestionBanks.reduce((sum, bank) => sum + bank.length, 0)} ЗАДАНИЙ`}
        title="Понять правило. Сразу применить."
        copy="Разделы идут по хронологии учебника И. А. Дышлевой: от Unidad 1 и чтения к следующим грамматическим темам. После теории — проверочные задания."
      />
      <div className="grammar-grid">
        <aside>
          {grammarTopics.map((item, index) => (
            <button
              className={active === index ? 'active' : ''}
              onClick={() => {
                answerLock.current = false;
                setActive(index);
                setChoice('');
                setQuestion(0);
                setScore(0);
              }}
              key={item.name}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item.name}
              <small>{grammarQuestionBanks[index].length} тестов</small>
            </button>
          ))}
        </aside>
        <article className="grammar-card">
          <p className="eyebrow">УРОК {active + 1} · ОСНОВА</p>
          <h2>{topic.name}</h2>
          <div className="grammar-source">
            <BookOpen />
            <span>
              <b>Источник теории</b>
              {topic.source}
            </span>
          </div>
          <section className="grammar-explain">
            <div>
              <small>КОГДА ИСПОЛЬЗОВАТЬ</small>
              <p>{topic.use}</p>
            </div>
            <div>
              <small>СТРУКТУРА</small>
              <code>{topic.formula}</code>
            </div>
            <div>
              <small>КАК ВЫБРАТЬ</small>
              <p>{topic.signals}</p>
            </div>
          </section>
          <div className="rule-detail">
            <b>Разбор по шагам</b>
            <p>{topic.details}</p>
          </div>
          <section className="grammar-rules">
            <h3>Ключевые правила и исключения</h3>
            {topic.rules.map((rule, index) => (
              <div key={rule}>
                <span>{index + 1}</span>
                <p>{rule}</p>
              </div>
            ))}
          </section>
          <section className="example-list">
            <h3>Примеры из живой речи</h3>
            {topic.examples.map((example) => (
              <div key={example[0]}>
                <b>{example[0]}</b>
                <span>{example[1]}</span>
              </div>
            ))}
          </section>
          <div className="mistake-box">
            <span>!</span>
            <div>
              <b>Частая ошибка</b>
              <p>{topic.mistake}</p>
            </div>
          </div>
          <div
            className={`quiz cat-card task-swap ${leaving ? 'leaving' : ''}`}
            key={`${active}-${question}`}
          >
            <CatPeek
              state={
                choice
                  ? choice === test.answer
                    ? 'happy'
                    : 'wrong'
                  : 'thinking'
              }
            />
            <ReportExerciseButton
              id={`grammar:${normalizeText(topic.name)}:${normalizeText(test.prompt)}:${normalizeText(test.answer)}`}
              section={`Грамматика: ${topic.name}`}
              prompt={test.prompt}
              answer={test.answer}
              options={test.options}
            />
            <div className="quiz-progress">
              <span
                style={{
                  width: `${((question + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
            <small>
              {test.kind.toUpperCase()} · {question + 1} ИЗ {questions.length} ·
              СЧЁТ {score}
            </small>
            <p>{test.prompt}</p>
            <div>
              {test.options.map((option) => (
                <button
                  className={
                    choice === option
                      ? option === test.answer
                        ? 'correct'
                        : 'wrong'
                      : ''
                  }
                  onClick={() => choose(option)}
                  key={option}
                >
                  {option}
                </button>
              ))}
            </div>
            {choice && (
              <div
                className={
                  choice === test.answer ? 'feedback good' : 'feedback'
                }
              >
                {choice === test.answer
                  ? '✓ Верно. '
                  : `Правильный ответ: ${test.answer}. `}
                <span>{test.tip}</span>
                <button className="next-test" onClick={next}>
                  {question === questions.length - 1
                    ? 'Пройти заново'
                    : 'Следующий вопрос'}{' '}
                  <ArrowRight />
                </button>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

type SongRound = {
  kind: string;
  prompt: string;
  options?: string[];
  answer: string;
  tip: string;
  clip?: { start: number; end: number };
};
const songs: {
  title: string;
  artist: string;
  level: string;
  topic: string;
  tone: string;
  videoId?: string;
  videoUrl?: string;
  games: SongRound[];
}[] = [
  {
    title: 'Azul',
    artist: 'J Balvin',
    level: 'A2—B1',
    topic: 'Nightlife · Summer',
    tone: 'one',
    videoId: 'bcaLBKH-Yfc',
    videoUrl: 'https://www.youtube.com/watch?v=bcaLBKH-Yfc',
    games: [
      {
        kind: 'Слово на слух',
        prompt: 'Запишите короткое словосочетание из фрагмента.',
        answer: 'salir y amanecer',
        tip: 'salir — выходить; amanecer — встретить рассвет.',
        clip: { start: 8, end: 12 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Какие два действия вы слышите?',
        answer: 'beber y enloquecerse',
        tip: 'beber — пить; enloquecerse — терять голову.',
        clip: { start: 13, end: 17 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите предмет и его положение.',
        answer: 'un trago en mano',
        tip: 'trago — напиток; en mano — в руке.',
        clip: { start: 20, end: 24 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите окончание фразы.',
        answer: 'la vuelvo a ver',
        tip: 'volver a + infinitivo — сделать что-то снова.',
        clip: { start: 29, end: 33 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Какое изменение внешности названо?',
        answer: 'se puso morena',
        tip: 'ponerse + прилагательное — стать каким-то.',
        clip: { start: 39, end: 43 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите фразу о погоде.',
        answer: 'hace calor',
        tip: 'hacer calor — быть жарко.',
        clip: { start: 48, end: 52 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Где происходит действие? Запишите словосочетание.',
        answer: 'sobre la arena',
        tip: 'sobre — на, над; arena — песок.',
        clip: { start: 54, end: 58 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите уменьшительное слово.',
        answer: 'ese cuerpito',
        tip: '-ito добавляет уменьшительный или ласковый оттенок.',
        clip: { start: 68, end: 72 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите два коротких слова.',
        answer: 'todos saben',
        tip: 'saben — форма saber для ellos/ustedes.',
        clip: { start: 86, end: 90 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Какие противоположные действия звучат?',
        answer: 'subir y bajar',
        tip: 'subir — подниматься; bajar — опускаться.',
        clip: { start: 104, end: 108 },
      },
      {
        kind: 'Пропуск',
        prompt: 'Le gusta salir y ___.',
        options: ['amanecer', 'dormir', 'trabajar'],
        answer: 'amanecer',
        tip: 'amanecer — встретить рассвет.',
      },
      {
        kind: 'Значение',
        prompt: 'Что значит «un trago en mano»?',
        options: ['напиток в руке', 'билет в руке', 'телефон в руке'],
        answer: 'напиток в руке',
        tip: 'trago — порция алкогольного напитка.',
      },
      {
        kind: 'Грамматика',
        prompt: 'В сочетании «le gusta salir» слово salir — это…',
        options: ['инфинитив', 'артикль', 'прилагательное'],
        answer: 'инфинитив',
        tip: 'После gustar действие называется инфинитивом.',
      },
      {
        kind: 'Лексика',
        prompt: 'Как перевести «arena» в контексте пляжа?',
        options: ['песок', 'сцена', 'воздух'],
        answer: 'песок',
        tip: 'la arena — песок.',
      },
      {
        kind: 'Пропуск',
        prompt: 'No sé si la vuelvo a ___.',
        options: ['ver', 'ir', 'ser'],
        answer: 'ver',
        tip: 'volver a + infinitivo — сделать снова.',
      },
      {
        kind: 'Конструкция',
        prompt: '«Se puso morena» означает…',
        options: ['Она загорела', 'Она рассердилась', 'Она уснула'],
        answer: 'Она загорела',
        tip: 'ponerse + прилагательное — стать каким-то.',
      },
      {
        kind: 'Синоним',
        prompt: 'Какое слово ближе всего к «cuerpito»?',
        options: ['cuerpo', 'tiempo', 'cuento'],
        answer: 'cuerpo',
        tip: 'Суффикс -ito добавляет уменьшительный оттенок.',
      },
      {
        kind: 'Грамматика',
        prompt: 'В «todos saben» форма saben относится к…',
        options: ['ellos/ustedes', 'nosotros', 'yo'],
        answer: 'ellos/ustedes',
        tip: 'saber → saben для 3-го лица множественного числа.',
      },
      {
        kind: 'Разговорная речь',
        prompt: '«Mami» в песне — это обычно…',
        options: [
          'неформальное обращение',
          'название места',
          'прошедшее время',
        ],
        answer: 'неформальное обращение',
        tip: 'В песнях это ласковое разговорное обращение.',
      },
      {
        kind: 'Противоположность',
        prompt: 'Антоним слова «subir» — …',
        options: ['bajar', 'salir', 'seguir'],
        answer: 'bajar',
        tip: 'subir — подниматься, bajar — опускаться.',
      },
      {
        kind: 'Порядок слов',
        prompt: 'Выберите естественную фразу.',
        options: ['Hace mucho calor.', 'Mucho hace calor.', 'Calor hace un.'],
        answer: 'Hace mucho calor.',
        tip: 'Погоду часто описывают конструкцией hace + существительное.',
      },
      {
        kind: 'Смысл',
        prompt: 'Какую ситуацию описывает песня в целом?',
        options: ['летняя вечеринка', 'деловая встреча', 'поездка на работу'],
        answer: 'летняя вечеринка',
        tip: 'Ключи: calor, arena, trago, salir.',
      },
    ],
  },
  {
    title: 'Veneno',
    artist: 'Anitta',
    level: 'B1',
    topic: 'Dating · Confidence',
    tone: 'three',
    videoId: 'LoYYtYjB3h4',
    videoUrl: 'https://www.youtube.com/watch?v=LoYYtYjB3h4',
    games: [
      {
        kind: 'Слово на слух',
        prompt: 'Запишите короткое предупреждение.',
        answer: 'ten cuidado',
        tip: 'tener cuidado — быть осторожным.',
        clip: { start: 17, end: 21 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'С чем сравнивается опасная игра?',
        answer: 'jugando con fuego',
        tip: 'jugar con fuego — играть с огнём.',
        clip: { start: 31, end: 35 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите ключевое словосочетание припева.',
        answer: 'tu veneno',
        tip: 'el veneno — яд.',
        clip: { start: 46, end: 49 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите короткую конструкцию с quedar.',
        answer: 'que quede claro',
        tip: 'quedar claro — быть ясным.',
        clip: { start: 55, end: 59 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Какая форма с gerundio звучит?',
        answer: 'te estás metiendo',
        tip: 'meterse — ввязываться.',
        clip: { start: 25, end: 29 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите словосочетание с «территорией».',
        answer: 'mi terreno',
        tip: 'terreno — земля или территория.',
        clip: { start: 72, end: 76 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите конструкцию ближайшего будущего.',
        answer: 'voy a dar',
        tip: 'ir a + infinitivo — план или ближайшее будущее.',
        clip: { start: 84, end: 88 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите словосочетание со значением «то, что я хочу».',
        answer: 'lo que quiero',
        tip: 'lo que — то, что.',
        clip: { start: 96, end: 100 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите выражение со значением «без страха».',
        answer: 'sin miedo',
        tip: 'sin — без; miedo — страх.',
        clip: { start: 111, end: 115 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Какое главное слово снова звучит?',
        answer: 'veneno',
        tip: 'Повторите слово вслух: ve-ne-no.',
        clip: { start: 126, end: 130 },
      },
      {
        kind: 'Диктант по клипу',
        prompt:
          'Прослушайте короткий фрагмент и напишите услышанную фразу по-испански.',
        answer: 'Porque yo soy tu veneno',
        tip: 'Слышно porque («потому что»), затем soy — форма ser для yo.',
        clip: { start: 43, end: 49 },
      },
      {
        kind: 'Диктант по клипу',
        prompt:
          'Что говорит певица в этом коротком эпизоде? Введите фразу целиком.',
        answer: 'No sabes en lo que te estás metiendo',
        tip: 'Обратите внимание на связку te estás + gerundio.',
        clip: { start: 24, end: 31 },
      },
      {
        kind: 'Пропуск',
        prompt: 'Porque yo soy tu ___.',
        options: ['veneno', 'verano', 'vuelo'],
        answer: 'veneno',
        tip: 'veneno — яд.',
      },
      {
        kind: 'Значение',
        prompt: 'Что значит «Ten cuidado»?',
        options: ['Будь осторожен', 'Иди быстрее', 'Не волнуйся'],
        answer: 'Будь осторожен',
        tip: 'tener cuidado — быть осторожным.',
      },
      {
        kind: 'Грамматика',
        prompt: '«Estás jugando» — это конструкция…',
        options: ['estar + gerundio', 'haber + participio', 'ir + infinitivo'],
        answer: 'estar + gerundio',
        tip: 'Так описывается действие в процессе.',
      },
      {
        kind: 'Пропуск',
        prompt: 'No sabes en lo que te estás ___.',
        options: ['metiendo', 'mirando', 'durmiendo'],
        answer: 'metiendo',
        tip: 'meterse en algo — ввязываться во что-то.',
      },
      {
        kind: 'Лексика',
        prompt: 'Как перевести «fuego»?',
        options: ['огонь', 'игра', 'земля'],
        answer: 'огонь',
        tip: 'jugar con fuego — играть с огнём.',
      },
      {
        kind: 'Императив',
        prompt: 'Форма «Cuida» — это…',
        options: ['утвердительная команда tú', 'прошедшее время', 'инфинитив'],
        answer: 'утвердительная команда tú',
        tip: 'Для -ar глаголов команда tú часто совпадает с él/ella в presente.',
      },
      {
        kind: 'Значение',
        prompt: '«Que quede claro» ближе всего к…',
        options: ['Пусть будет ясно', 'Останься дома', 'Говори тише'],
        answer: 'Пусть будет ясно',
        tip: 'quedar claro — быть ясным.',
      },
      {
        kind: 'Местоимение',
        prompt: 'В «te lo voy a dar» слово lo заменяет…',
        options: ['предмет или идею', 'подлежащее yo', 'предлог'],
        answer: 'предмет или идею',
        tip: 'lo — прямое дополнение мужского рода или нейтральная идея.',
      },
      {
        kind: 'Конструкция',
        prompt: '«Voy a dar» выражает…',
        options: ['ближайшее будущее', 'далёкое прошлое', 'сомнение'],
        answer: 'ближайшее будущее',
        tip: 'ir a + infinitivo — план или ближайшее будущее.',
      },
      {
        kind: 'Синоним',
        prompt: 'Какое слово ближе к «terreno»?',
        options: ['земля/территория', 'скорость', 'одежда'],
        answer: 'земля/территория',
        tip: 'el terreno — участок, территория, почва.',
      },
      {
        kind: 'Порядок слов',
        prompt: 'Выберите правильный вариант.',
        options: [
          'Tú me das lo que quiero.',
          'Tú das me que quiero.',
          'Me tú lo quiero das.',
        ],
        answer: 'Tú me das lo que quiero.',
        tip: 'Безударное me ставится перед спрягаемым глаголом.',
      },
      {
        kind: 'Смысл',
        prompt: 'Какой характер у героини песни?',
        options: [
          'уверенный и контролирующий',
          'робкий и нерешительный',
          'официальный и деловой',
        ],
        answer: 'уверенный и контролирующий',
        tip: 'На это указывают слова controla, quiero и предупреждения.',
      },
      {
        kind: 'Клип · наблюдение',
        prompt: 'Какой образ постоянно связывает название песни с видеорядом?',
        options: ['змеи', 'розы', 'городские автомобили'],
        answer: 'змеи',
        tip: 'Змеи делают идею яда видимой без дополнительных объяснений.',
      },
      {
        kind: 'Клип · метафора',
        prompt: 'Что змеи прежде всего символизируют в контексте песни?',
        options: [
          'опасное притяжение',
          'спокойную семейную жизнь',
          'путешествие в другую страну',
        ],
        answer: 'опасное притяжение',
        tip: 'Образ одновременно передаёт соблазн, контроль и риск.',
      },
      {
        kind: 'Клип · настроение',
        prompt: 'Как лучше описать визуальное настроение клипа?',
        options: [
          'напряжённое и соблазнительное',
          'детское и беззаботное',
          'деловое и документальное',
        ],
        answer: 'напряжённое и соблазнительное',
        tip: 'Пластика, крупные планы и змеи создают ощущение близости и опасности.',
      },
      {
        kind: 'Клип · героиня',
        prompt: 'Как героиня ведёт себя рядом со змеями?',
        options: [
          'уверенно и спокойно',
          'паникует и убегает',
          'не замечает их',
        ],
        answer: 'уверенно и спокойно',
        tip: 'Так видеоряд поддерживает образ контроля, заявленный в песне.',
      },
      {
        kind: 'Клип · связь',
        prompt: 'Как видеоряд усиливает значение слова «veneno»?',
        options: [
          'превращает абстрактную угрозу в видимый образ',
          'показывает приготовление еды',
          'объясняет географический маршрут',
        ],
        answer: 'превращает абстрактную угрозу в видимый образ',
        tip: 'Зритель видит физическую опасность, пока слышит метафору отношений.',
      },
      {
        kind: 'Язык клипа',
        prompt: 'На каком языке исполняется песня в этом клипе?',
        options: ['на испанском', 'на португальском', 'на английском'],
        answer: 'на испанском',
        tip: 'Anitta — бразильская артистка, но эта композиция записана на испанском.',
      },
      {
        kind: 'Артикль',
        prompt: 'Как правильно сказать «яд» с определённым артиклем?',
        options: ['el veneno', 'la veneno', 'los veneno'],
        answer: 'el veneno',
        tip: 'Veneno — существительное мужского рода: el veneno.',
      },
      {
        kind: 'Итог по клипу',
        prompt: 'Какая формулировка точнее всего объединяет песню и видеоряд?',
        options: [
          'притяжение может быть сильным и одновременно опасным',
          'героиня рассказывает о рабочем распорядке',
          'это история спокойного отдыха на природе',
        ],
        answer: 'притяжение может быть сильным и одновременно опасным',
        tip: 'Название, уверенная героиня и змеи работают как одна метафора.',
      },
    ],
  },
  {
    title: 'Mayores',
    artist: 'Becky G & Bad Bunny',
    level: 'B1',
    topic: 'Preferences · Relationships',
    tone: 'four',
    videoId: 'GMFewiplIbw',
    videoUrl: 'https://www.youtube.com/watch?v=GMFewiplIbw',
    games: [
      {
        kind: 'Слово на слух',
        prompt: 'Запишите сравнение из первой строки.',
        answer: 'como dama',
        tip: 'como — как; dama — дама.',
        clip: { start: 20, end: 24 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Куда говорят стихи? Запишите выражение.',
        answer: 'al oído',
        tip: 'al = a + el; oído — ухо, слух.',
        clip: { start: 29, end: 33 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Какого человека упоминает певица?',
        answer: 'un caballero',
        tip: 'caballero — джентльмен.',
        clip: { start: 37, end: 41 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите качество партнёра.',
        answer: 'buen amante',
        tip: 'Перед существительным bueno сокращается до buen.',
        clip: { start: 44, end: 48 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите главное слово припева.',
        answer: 'mayores',
        tip: 'mayores — старше, более взрослые.',
        clip: { start: 54, end: 58 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Что они открывают? Запишите сочетание.',
        answer: 'abren la puerta',
        tip: 'abrir la puerta — открыть дверь.',
        clip: { start: 60, end: 64 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Какой знак внимания упоминается?',
        answer: 'mandan flores',
        tip: 'mandar flores — посылать цветы.',
        clip: { start: 65, end: 69 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите сравнительное описание.',
        answer: 'más grandes',
        tip: 'más + прилагательное — более…',
        clip: { start: 72, end: 76 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите возраст героя словами.',
        answer: 'veintiuno',
        tip: 'veintiuno — двадцать один.',
        clip: { start: 103, end: 107 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите выражение круглосуточной активности.',
        answer: 'veinticuatro siete',
        tip: '24/7 значит «круглосуточно».',
        clip: { start: 126, end: 130 },
      },
      {
        kind: 'Диктант по клипу',
        prompt:
          'Прослушайте эпизод и напишите первую фразу, которую поёт Becky G.',
        answer: 'A mí me gusta que me traten como dama',
        tip: 'После gusta que употребляется форма subjuntivo: traten.',
        clip: { start: 17, end: 24 },
      },
      {
        kind: 'Диктант по клипу',
        prompt: 'Запишите короткую фразу припева на слух.',
        answer: 'A mí me gustan mayores',
        tip: 'Здесь gustan согласуется с множественным числом mayores.',
        clip: { start: 52, end: 58 },
      },
      {
        kind: 'Диктант по клипу',
        prompt: 'Прослушайте начало куплета Bad Bunny и напишите услышанное.',
        answer: 'Yo no soy viejo pero tengo la cuenta como uno',
        tip: 'Сначала противопоставляются no soy и tengo.',
        clip: { start: 96, end: 104 },
      },
      {
        kind: 'Значение',
        prompt: 'Что означает «tratar a alguien como dama»?',
        options: [
          'обращаться с кем-то как с дамой',
          'пригласить кого-то танцевать',
          'попросить кого-то подождать',
        ],
        answer: 'обращаться с кем-то как с дамой',
        tip: 'tratar a alguien como… — обращаться с кем-либо как…',
      },
      {
        kind: 'Лексика',
        prompt: 'Как перевести «al oído»?',
        options: ['на ухо', 'вслух', 'по телефону'],
        answer: 'на ухо',
        tip: 'el oído — слух или ухо как орган восприятия звука.',
      },
      {
        kind: 'Значение',
        prompt: 'Кто такой «un caballero»?',
        options: ['джентльмен', 'сосед', 'подросток'],
        answer: 'джентльмен',
        tip: 'В этом контексте caballero — воспитанный мужчина, джентльмен.',
      },
      {
        kind: 'Грамматика',
        prompt:
          'Почему в «Me gusta un caballero que sea interesante» стоит sea?',
        options: [
          'описывается желаемый, не конкретный человек',
          'это форма прошедшего времени',
          'после caballero всегда нужен subjuntivo',
        ],
        answer: 'описывается желаемый, не конкретный человек',
        tip: 'После поиска или описания неопределённого желаемого объекта часто используется subjuntivo.',
      },
      {
        kind: 'Форма глагола',
        prompt:
          'Выберите правильную форму: A mí me ___ los caballeros atentos.',
        options: ['gustan', 'gusta', 'gusto'],
        answer: 'gustan',
        tip: 'Подлежащее — los caballeros, поэтому нужен глагол во множественном числе.',
      },
      {
        kind: 'Лексика',
        prompt: 'Что означает «mayores» в припеве?',
        options: ['старше по возрасту', 'выше ростом', 'более известные'],
        answer: 'старше по возрасту',
        tip: 'mayor может означать старший или более взрослый.',
      },
      {
        kind: 'Выражение',
        prompt: '«Te abren la puerta» означает…',
        options: [
          'тебе открывают дверь',
          'тебя ждут у двери',
          'тебе закрывают дверь',
        ],
        answer: 'тебе открывают дверь',
        tip: 'te — косвенное дополнение, abren — «они открывают».',
      },
      {
        kind: 'Выражение',
        prompt: '«Te mandan flores» означает…',
        options: [
          'тебе посылают цветы',
          'ты покупаешь цветы',
          'они рисуют цветы',
        ],
        answer: 'тебе посылают цветы',
        tip: 'mandar algo a alguien — отправить что-то кому-то.',
      },
      {
        kind: 'Местоимение',
        prompt: 'В выражении «que me vuelva loca» слово me указывает на…',
        options: ['говорящую', 'мужчину', 'цветы'],
        answer: 'говорящую',
        tip: 'me — безударное местоимение первого лица единственного числа.',
      },
      {
        kind: 'Грамматика',
        prompt: 'Почему используется vuelva, а не vuelve?',
        options: [
          'это желаемый результат после que',
          'это повелительное наклонение vosotros',
          'это инфинитив',
        ],
        answer: 'это желаемый результат после que',
        tip: 'В конструкции желания/результата que me vuelva loca употребляется presente de subjuntivo.',
      },
      {
        kind: 'Смысл',
        prompt: 'Что подчёркивает выражение «24/7»?',
        options: ['постоянную готовность', 'возраст героя', 'номер комнаты'],
        answer: 'постоянную готовность',
        tip: '24/7 — круглосуточно, всё время.',
      },
      {
        kind: 'Отрицание',
        prompt: 'Как понять «no hacen falta»?',
        options: ['не нужны', 'не работают', 'не приходят'],
        answer: 'не нужны',
        tip: 'hacer falta — быть необходимым; no hacer falta — не быть нужным.',
      },
      {
        kind: 'Императив',
        prompt: 'Форма «vete» означает…',
        options: ['уходи', 'приходи', 'останься'],
        answer: 'уходи',
        tip: 'vete — утвердительная команда tú от возвратного глагола irse.',
      },
      {
        kind: 'Порядок слов',
        prompt: 'Выберите естественный вариант.',
        options: [
          'A mí me gustan mayores.',
          'Me mayores gustan a mí.',
          'Mayores mí gustan me.',
        ],
        answer: 'A mí me gustan mayores.',
        tip: 'A mí усиливает или уточняет дополнение me.',
      },
      {
        kind: 'Перевод',
        prompt: 'Как точнее перевести «Yo prefiero un tipo»?',
        options: [
          'Я предпочитаю мужчину',
          'Я знаю этого человека',
          'Мне нужен совет',
        ],
        answer: 'Я предпочитаю мужчину',
        tip: 'preferir — предпочитать; tipo здесь разговорно означает «мужчина, парень».',
      },
      {
        kind: 'Клип · детали',
        prompt:
          'Что в клипе визуально поддерживает образ внимания и ухаживания?',
        options: [
          'цветы и подчёркнуто вежливые жесты',
          'школьная доска и учебники',
          'поезд и дорожные знаки',
        ],
        answer: 'цветы и подчёркнуто вежливые жесты',
        tip: 'Видеоряд обыгрывает перечисленные в припеве знаки внимания.',
      },
      {
        kind: 'Смысл',
        prompt: 'Какая главная языковая тема песни?',
        options: [
          'предпочтения и качества партнёра',
          'распорядок рабочего дня',
          'путешествие по городу',
        ],
        answer: 'предпочтения и качества партнёра',
        tip: 'Повторяются gustar, preferir и описания желаемых качеств.',
      },
    ],
  },
  {
    title: 'Entre Nosotros',
    artist: 'Tiago PZK, LIT killah, María Becerra & Nicki Nicole',
    level: 'B1—B2',
    topic: 'Feelings · Breakup',
    tone: 'two',
    videoId: 'sidPTvbTv9o',
    videoUrl: 'https://www.youtube.com/watch?v=sidPTvbTv9o',
    games: [
      {
        kind: 'Слово на слух',
        prompt: 'Какое место упоминается в начале?',
        answer: 'nuestra casa',
        tip: 'nuestra — наша; casa — дом.',
        clip: { start: 8, end: 12 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Как выглядит дом? Запишите сочетание.',
        answer: 'más vacía',
        tip: 'vacía — пустая.',
        clip: { start: 13, end: 17 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите сравнительное описание дома.',
        answer: 'más fría',
        tip: 'fría — холодная.',
        clip: { start: 20, end: 23 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Что изматывает героя? Запишите словосочетание.',
        answer: 'pensarte tanto desgasta',
        tip: 'desgastar — изматывать.',
        clip: { start: 25, end: 29 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Что возвращается? Запишите фрагмент.',
        answer: 'tu nombre vuelve',
        tip: 'volver — возвращаться.',
        clip: { start: 33, end: 36 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите выражение о продолжающейся боли.',
        answer: 'deja de doler',
        tip: 'dejar de + infinitivo — перестать что-то делать.',
        clip: { start: 47, end: 50 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите выражение «снова появляется».',
        answer: 'vuelve a aparecer',
        tip: 'volver a + infinitivo — снова сделать.',
        clip: { start: 49, end: 52 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Какой вопрос звучит в припеве?',
        answer: 'qué fue qué pasó',
        tip: '¿Qué pasó? — Что произошло?',
        clip: { start: 73, end: 77 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Запишите название песни из припева.',
        answer: 'entre nosotros dos',
        tip: 'entre — между; nosotros dos — нами двумя.',
        clip: { start: 77, end: 80 },
      },
      {
        kind: 'Слово на слух',
        prompt: 'Что произошло между героями?',
        answer: 'algo se rompió',
        tip: 'romperse — сломаться, разрушиться.',
        clip: { start: 79, end: 82 },
      },
      {
        kind: 'Значение',
        prompt: 'Что означает «nuestra casa»?',
        options: ['наш дом', 'ваша улица', 'моя комната'],
        answer: 'наш дом',
        tip: 'nuestra согласуется с casa в женском роде.',
      },
      {
        kind: 'Грамматика',
        prompt: 'Какая конструкция означает «снова появляется»?',
        options: ['vuelve a aparecer', 'deja de aparecer', 'acaba de aparecer'],
        answer: 'vuelve a aparecer',
        tip: 'volver a + infinitivo обозначает повтор действия.',
      },
      {
        kind: 'Лексика',
        prompt: 'Как перевести «el recuerdo del ayer»?',
        options: [
          'воспоминание о вчерашнем',
          'надежда на завтра',
          'сегодняшний разговор',
        ],
        answer: 'воспоминание о вчерашнем',
        tip: 'recuerdo — воспоминание; ayer — вчера.',
      },
      {
        kind: 'Смысл',
        prompt: 'Какая эмоция находится в центре песни?',
        options: [
          'переживание расставания',
          'радость путешествия',
          'интерес к новой работе',
        ],
        answer: 'переживание расставания',
        tip: 'Дом пустеет, воспоминания возвращаются, а отношения описываются как разрушенные.',
      },
      {
        kind: 'Местоимение',
        prompt: 'В «pensarte» окончание -te означает…',
        options: ['тебя', 'меня', 'нас'],
        answer: 'тебя',
        tip: 'pensar en ti в песенной речи передано как pensarte.',
      },
      {
        kind: 'Перевод',
        prompt: 'Как перевести «algo se rompió»?',
        options: [
          'что-то разрушилось',
          'всё только началось',
          'кто-то вернулся',
        ],
        answer: 'что-то разрушилось',
        tip: 'se rompió — возвратная форма в прошедшем времени.',
      },
    ],
  },
];
function MusicView() {
  const [selected, setSelected] = useState(0),
    [game, setGame] = useState(0),
    [choice, setChoice] = useState(''),
    [score, setScore] = useState(0),
    [typedClip, setTypedClip] = useState(''),
    [clipAttempt, setClipAttempt] = useState(0),
    [hintLevel, setHintLevel] = useState(0);
  const { leaving, move } = useTaskMotion(),
    answerLock = useRef(false);
  const song = songs[selected],
    round = song.games[game],
    displayOptions = shuffledOptions(
      round.options || [],
      `${song.title}-${game}`,
    ),
    totalExercises = songs.reduce((sum, item) => sum + item.games.length, 0),
    isCorrect =
      !!choice && normalizeText(choice) === normalizeText(round.answer);
  const resetRound = () => {
    answerLock.current = false;
    setChoice('');
    setTypedClip('');
    setClipAttempt(0);
    setHintLevel(0);
  };
  const selectSong = (index: number) => {
    setSelected(index);
    setGame(0);
    resetRound();
    setScore(0);
  };
  const answer = (option: string) => {
    if (choice || answerLock.current) return;
    answerLock.current = true;
    const correct = normalizeText(option) === normalizeText(round.answer);
    setChoice(option);
    playFeedbackSound(correct);
    recordLearningEvent(correct, correct ? 5 : 2);
    if (!correct) recordError(`Песня: ${song.title}`);
    if (correct) setScore((value) => value + 1);
  };
  const next = () =>
    move(() => {
      const finished = game === song.games.length - 1;
      setGame(finished ? 0 : game + 1);
      resetRound();
      if (finished) {
        setScore(0);
        playCelebrationSound('finish');
        recordAchievementEvent({ type: 'song-session' });
      }
    });
  const clipTime = round.clip
    ? `${Math.floor(round.clip.start / 60)}:${String(round.clip.start % 60).padStart(2, '0')}–${Math.floor(round.clip.end / 60)}:${String(round.clip.end % 60).padStart(2, '0')}`
    : '';
  const answerWords = round.answer.split(/\s+/),
    maskedAnswer = answerWords
      .map((word) => `${word[0]}${'_'.repeat(Math.max(1, word.length - 1))}`)
      .join(' '),
    isSentence = answerWords.length > 4;
  return (
    <div className="view-stack">
      <header className="music-head">
        <div>
          <p className="eyebrow">
            МУЗЫКАЛЬНАЯ ПРАКТИКА · {totalExercises} ЗАДАНИЙ
          </p>
          <h1>
            Слушай ритм.
            <br />
            Лови смысл.
          </h1>
        </div>
        <div className="equalizer">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </header>
      <div className="artist-grid song-grid">
        {songs.map((item, index) => (
          <article
            className={`artist-card ${item.tone} ${selected === index ? 'selected' : ''}`}
            key={item.title}
          >
            <div className="artist-number">0{index + 1}</div>
            <div className="artist-wave">RITMO</div>
            <div className="artist-info">
              <span>🎵 {item.level}</span>
              <h3>{item.title}</h3>
              <p>
                {item.artist} · {item.topic}
              </p>
              <button
                onClick={() => selectSong(index)}
                aria-label={`Открыть задания к ${item.title}`}
              >
                <Play fill="currentColor" />
              </button>
            </div>
          </article>
        ))}
      </div>
      {song.videoId && (
        <section className="clip-study">
          <div className="clip-frame">
            <YouTubeEmbed videoId={song.videoId} title={`${song.artist} — ${song.title}, официальный клип`} />
          </div>
          <aside>
            <p className="eyebrow">СМОТРИ · СЛУШАЙ · ОТВЕЧАЙ</p>
            <h2>Тест использует этот клип</h2>
            <p>
              Посмотрите видео целиком или сразу переходите к коротким эпизодам:
              в диктанте нужно самостоятельно написать услышанное.
            </p>
            <div>
              <span>🎧 Повторяйте фрагмент сколько нужно</span>
              <span>⌨️ Пишите без вариантов ответа</span>
              <span>🎬 Сопоставляйте речь и видеоряд</span>
            </div>
            {song.videoUrl && (
              <a href={song.videoUrl} target="_blank" rel="noreferrer">
                Открыть на YouTube <ArrowRight />
              </a>
            )}
          </aside>
        </section>
      )}
      <article className="song-lab">
        <header>
          <div>
            <p className="eyebrow">SONG LAB · {song.artist}</p>
            <h2>
              {song.title}: {song.games.length} разных заданий
            </h2>
          </div>
          <span>
            {game + 1} / {song.games.length} · {score} ✓
          </span>
        </header>
        <div className="quiz-progress">
          <span
            style={{ width: `${((game + 1) / song.games.length) * 100}%` }}
          />
        </div>
        <div className="game-kinds">
          {[...new Set(song.games.map((item) => item.kind))].map((kind) => (
            <span className={round.kind === kind ? 'active' : ''} key={kind}>
              {kind}
            </span>
          ))}
        </div>
        <div
          className={`music-question cat-card task-swap ${leaving ? 'leaving' : ''}`}
          key={`${song.title}-${game}`}
        >
          <CatPeek
            state={choice ? (isCorrect ? 'happy' : 'wrong') : 'thinking'}
          />
          <ReportExerciseButton
            id={`music:${normalizeText(song.title)}:${normalizeText(round.prompt)}:${normalizeText(round.answer)}`}
            section={`Музыка: ${song.artist} — ${song.title}`}
            prompt={round.prompt}
            answer={round.answer}
            options={round.options}
          />
          <small>{round.kind.toUpperCase()}</small>
          <h3>{round.prompt}</h3>
          {round.clip && song.videoId ? (
            <div className="clip-dictation">
              <div className="mini-clip" key={`${song.videoId}-${game}-${clipAttempt}`}>
                <YouTubeEmbed compact videoId={song.videoId} start={round.clip.start} end={round.clip.end} title={`Фрагмент ${clipTime} из ${song.title}`} />
              </div>
              <div className="clip-tools">
                <button
                  className="replay-clip"
                  onClick={() => setClipAttempt((value) => value + 1)}
                >
                  ↻ Вернуть к началу фрагмента
                </button>
                <a
                  className="open-clip-youtube"
                  href={`${song.videoUrl}&t=${round.clip.start}s`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Открыть фрагмент на YouTube
                </a>
                <button
                  className="clip-hint-button"
                  onClick={() =>
                    setHintLevel((value) =>
                      Math.min(isSentence ? 3 : 2, value + 1),
                    )
                  }
                  disabled={hintLevel >= (isSentence ? 3 : 2)}
                >
                  💡 {hintLevel ? 'Ещё подсказка' : 'Подсказка'}
                </button>
              </div>
              {hintLevel > 0 && (
                <div className="clip-hint">
                  <b>Подсказка {hintLevel}</b>
                  <span>
                    {hintLevel === 1
                      ? `${answerWords.length} ${answerWords.length === 1 ? 'слово' : 'слова'} · начинается с «${round.answer[0]}»`
                      : hintLevel === 2
                        ? maskedAnswer
                        : round.tip}
                  </span>
                </div>
              )}
              <div className="answer-entry-with-keys">
                <div className="type-answer">
                  <input
                    value={typedClip}
                    onChange={(event) => setTypedClip(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && typedClip.trim())
                        answer(typedClip);
                    }}
                    placeholder="Напишите услышанное по-испански…"
                    disabled={!!choice}
                  />
                  <button
                    onClick={() => answer(typedClip)}
                    disabled={!typedClip.trim() || !!choice}
                  >
                    Проверить
                  </button>
                </div>
                <AccentKeys value={typedClip} onChange={setTypedClip} />
              </div>
              <p>
                Регистр и знаки препинания не учитываются. Испанские ударения
                желательно сохранять.
              </p>
            </div>
          ) : (
            <div className="answers">
              {displayOptions.map((option) => (
                <button
                  className={
                    choice === option
                      ? normalizeText(option) === normalizeText(round.answer)
                        ? 'correct'
                        : 'wrong'
                      : choice &&
                          normalizeText(option) === normalizeText(round.answer)
                        ? 'correct ghost'
                        : ''
                  }
                  onClick={() => answer(option)}
                  disabled={!!choice}
                  key={option}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
          {!choice && (
            <button className="dont-know" onClick={() => answer('__не знаю__')}>
              Не знаю — показать ответ
            </button>
          )}
          {choice && (
            <div className={isCorrect ? 'feedback good' : 'feedback'}>
              {isCorrect
                ? '✓ Отлично. '
                : `Правильный ответ: ${round.answer}. `}
              <span>{round.tip}</span>
              {hasOnlySpanishMarkDifference(choice, round.answer) && (
                <small className="soft-spelling">
                  Засчитано: сравните ударение и ñ с правильным написанием.
                </small>
              )}
              {isCorrect && (
                <strong className="word-assembled">{round.answer}</strong>
              )}
              <button className="next-test" onClick={next}>
                {game === song.games.length - 1
                  ? 'Пройти заново'
                  : 'Следующее задание'}{' '}
                <ArrowRight />
              </button>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

type SessionMode = 'five' | 'fifteen' | 'weak' | 'errors' | 'favorites';
type SavedPracticeSession = {
  version: 2 | 3 | 4;
  mode: SessionMode;
  topic: string;
  session: StudyCard[];
  index: number;
  typed: string;
  revealed: boolean;
  correct: boolean;
  analysis: AnswerAnalysis | null;
  audioTarget: 'word' | 'sentence';
  orderedWords: string[];
  finished: boolean;
  introduced: Record<string, boolean>;
  sessionErrors?: number;
};
const buildSession = (
  deck: StudyCard[],
  records: Record<string, SRSRecord>,
  mode: SessionMode,
) => {
  const now = Date.now(),
    count = mode === 'five' ? 16 : mode === 'fifteen' ? 20 : 30;
  let pool: StudyCard[] = [];
  if (mode === 'favorites')
    pool = deck.filter((card) => records[card.key]?.favorite);
  else if (mode === 'errors')
    pool = deck
      .filter(
        (card) =>
          records[card.key]?.reviews &&
          records[card.key].nextReview <= now &&
          (records[card.key].lapses > 0 ||
            records[card.key].lastGrade === 'again'),
      )
      .sort(
        (a, b) =>
          records[b.key].lapses - records[a.key].lapses ||
          records[b.key].difficulty - records[a.key].difficulty,
      );
  else if (mode === 'weak')
    pool = deck
      .filter((card) => records[card.key]?.reviews)
      .sort(
        (a, b) =>
          records[b.key].difficulty +
          records[b.key].lapses * 1.5 -
          (records[a.key].difficulty + records[a.key].lapses * 1.5),
      );
  else {
    const due = deck
      .filter(
        (card) =>
          records[card.key]?.nextReview <= now && records[card.key]?.reviews,
      )
      .sort((a, b) => records[a.key].nextReview - records[b.key].nextReview);
    const weak = deck
      .filter(
        (card) =>
          records[card.key]?.difficulty >= 6.2 &&
          records[card.key].nextReview <= now,
      )
      .sort((a, b) => records[b.key].difficulty - records[a.key].difficulty);
    const readyReviews = [...due, ...weak].filter(
        (card, index, list) =>
          list.findIndex((item) => item.key === card.key) === index,
      ),
      wordBases = deck
        .filter((card) => card.skill === 'recognition')
        .map((card) => baseCardKey(card.key))
        .filter((base, index, list) => list.indexOf(base) === index),
      unfinishedBases = wordBases.filter((base) => {
        const group = deck.filter((card) => baseCardKey(card.key) === base),
          reviewed = group.filter((card) => records[card.key]?.reviews).length,
          unreviewed = group.filter((card) => !records[card.key]?.reviews).length;
        return reviewed > 0 && unreviewed > 0;
      }),
      freshBases = wordBases.filter((base) =>
        deck
          .filter((card) => baseCardKey(card.key) === base)
          .every((card) => !records[card.key]?.reviews),
      ),
      skillOrder: SkillType[] = [
        'recognition',
        'production',
        'context',
        'listening',
        'dictation',
        'article',
      ],
      orderedUnreviewed = (base: string) =>
        deck
          .filter(
            (card) =>
              baseCardKey(card.key) === base && !records[card.key]?.reviews,
          )
          .sort(
            (a, b) =>
              skillOrder.indexOf(a.skill) - skillOrder.indexOf(b.skill),
          ),
      selectedReviews = readyReviews.slice(0, count),
      openAfterReviews = Math.max(0, count - selectedReviews.length),
      unfinishedGroups = unfinishedBases
        .map(orderedUnreviewed)
        .filter((group) => group.length),
      unfinishedCandidates = Array.from({ length: 3 }, (_, offset) =>
        unfinishedGroups.map((group) => group[offset]).filter(Boolean),
      ).flat() as StudyCard[],
      unfinishedCards = unfinishedCandidates.slice(0, openAfterReviews),
      openForFresh = Math.max(
        0,
        openAfterReviews - unfinishedCards.length,
      ),
      newBaseLimit = Math.min(4, Math.floor(openForFresh / 3)),
      freshGroups = freshBases.slice(0, newBaseLimit).map(orderedUnreviewed),
      minimumNew = freshGroups.flatMap((group) => group.slice(0, 3)),
      extraSlots = Math.max(
        0,
        count -
          selectedReviews.length -
          unfinishedCards.length -
          minimumNew.length,
      ),
      extraNew = Array.from({ length: 3 }, (_, offset) =>
        freshGroups.map((group) => group[3 + offset]).filter(Boolean),
      )
        .flat()
        .slice(0, extraSlots) as StudyCard[],
      selected = [
        ...selectedReviews,
        ...unfinishedCards,
        ...minimumNew,
        ...extraNew,
      ],
      standaloneFresh = deck.filter(
        (card) =>
          !records[card.key]?.reviews &&
          !wordBases.includes(baseCardKey(card.key)) &&
          !selected.some((item) => item.key === card.key),
      );
    pool = [
      ...selected,
      ...standaloneFresh.slice(0, Math.max(0, count - selected.length)),
    ];
  }
  const unique = pool.filter(
      (card, index) =>
        pool.findIndex((item) => item.key === card.key) === index,
    ),
    mixed: StudyCard[] = [];
  const distinctWords = new Set(unique.map((card) => baseCardKey(card.key))).size,
    spacingWindow = Math.min(3, Math.max(0, distinctWords - 1));
  while (unique.length && mixed.length < count) {
    const recentWords = new Set(
      mixed.slice(-spacingWindow).map((card) => baseCardKey(card.key)),
    );
    let pick = unique.findIndex(
      (card) => !recentWords.has(baseCardKey(card.key)),
    );
    if (pick < 0) pick = 0;
    mixed.push(unique.splice(pick, 1)[0]);
  }
  return mixed;
};
const dueLabel = (record?: SRSRecord) => {
  if (!record?.reviews) return 'новая';
  const delta = record.nextReview - Date.now();
  if (delta <= 0) return 'сейчас';
  if (delta < 3600000)
    return `через ${Math.max(1, Math.round(delta / 60000))} мин`;
  if (delta < 86400000)
    return `через ${Math.max(1, Math.round(delta / 3600000))} ч`;
  return `через ${Math.max(1, Math.round(delta / 86400000))} дн`;
};
function _PracticeView() {
  const deck = makeStudyDeck(),
    { records, rate, toggleFavorite } = useSRS(),
    [mode, setMode] = useState<SessionMode>('five'),
    [session, setSession] = useState<StudyCard[]>(() =>
      buildSession(makeStudyDeck(), {}, 'five'),
    ),
    [index, setIndex] = useState(0),
    [typed, setTyped] = useState(''),
    [revealed, setRevealed] = useState(false),
    [correct, setCorrect] = useState(false),
    [finished, setFinished] = useState(false);
  const card = session[index],
    now = Date.now(),
    due = deck.filter(
      (item) =>
        records[item.key]?.reviews && records[item.key].nextReview <= now,
    ).length,
    weak = deck.filter((item) => records[item.key]?.difficulty >= 6.2).length,
    favorites = deck.filter((item) => records[item.key]?.favorite).length;
  const start = (nextMode: SessionMode) => {
    setMode(nextMode);
    setSession(buildSession(deck, records, nextMode));
    setIndex(0);
    setTyped('');
    setRevealed(false);
    setFinished(false);
  };
  const speak = () => {
    if (!card || typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(card.es.split(' / ')[0]);
    utterance.lang = 'es-ES';
    utterance.rate = 0.82;
    speechSynthesis.speak(utterance);
  };
  const submit = () => {
    if (!typed.trim() || !card) return;
    const accepted = card.answer.split(/[,;/]/).map(normalizeText),
      isCorrect = accepted.some(
        (item) =>
          normalizeText(typed) === item ||
          (normalizeText(typed).includes(item) && item.length > 3),
      );
    setCorrect(isCorrect);
    setRevealed(true);
    playFeedbackSound(isCorrect);
  };
  const grade = (value: ReviewGrade) => {
    if (!card) return;
    const applied =
      !correct && (value === 'good' || value === 'easy') ? 'hard' : value;
    rate(card, applied);
    if (applied === 'again') {
      setSession((current) => {
        const next = [...current];
        next.splice(Math.min(index + 4, next.length), 0, card);
        return next;
      });
    }
    if (index >= session.length - 1) {
      setFinished(true);
    } else {
      setIndex((value) => value + 1);
      setTyped('');
      setRevealed(false);
      setCorrect(false);
    }
  };
  const audio =
    card && (card.skill === 'listening' || card.skill === 'dictation');
  return (
    <div className="view-stack srs-view">
      <ViewHead
        over="АДАПТИВНОЕ ПОВТОРЕНИЕ · ACTIVE RECALL"
        title="Сегодня повторяем то, что почти забывается."
        copy="Каждый навык хранится отдельно в профиле. Ошибка сокращает интервал, уверенный ответ увеличивает его."
      />
      <div className="srs-summary">
        <button
          className={mode === 'five' ? 'active' : ''}
          onClick={() => start('five')}
        >
          <ClockBadge minutes={5} />
          <span>
            <b>5 минут</b>
            <small>8 быстрых заданий</small>
          </span>
        </button>
        <button
          className={mode === 'fifteen' ? 'active' : ''}
          onClick={() => start('fifteen')}
        >
          <ClockBadge minutes={15} />
          <span>
            <b>15 минут</b>
            <small>20 смешанных заданий</small>
          </span>
        </button>
        <button
          className={mode === 'weak' ? 'active' : ''}
          onClick={() => start('weak')}
        >
          <span className="session-icon">🎯</span>
          <span>
            <b>Слабые места</b>
            <small>{weak} проблемных навыков</small>
          </span>
        </button>
        <button
          className={mode === 'favorites' ? 'active' : ''}
          onClick={() => start('favorites')}
        >
          <span className="session-icon">♥</span>
          <span>
            <b>Избранное</b>
            <small>{favorites} сохранено</small>
          </span>
        </button>
      </div>
      <div className="daily-mix">
        <span>
          <b>{due}</b> пора повторить
        </span>
        <span>60% по сроку</span>
        <span>20% слабые</span>
        <span>10% новые</span>
        <span>10% старые</span>
      </div>
      {finished ? (
        <article className="session-finish">
          <CatMascot state="love" />
          <div>
            <p className="eyebrow">СЕССИЯ ЗАВЕРШЕНА</p>
            <h2>Лапки на сегодня собраны!</h2>
            <p>
              Интервалы пересчитаны отдельно для каждого слова и навыка. Ошибки
              вернутся раньше.
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
            {mode === 'favorites'
              ? 'В избранном пока пусто'
              : 'Пока нет данных для этого режима'}
          </h2>
          <p>
            Добавляйте сердечком слова и примеры или начните ежедневную сессию.
          </p>
          <button className="primary-btn" onClick={() => start('five')}>
            Начать 5 минут
          </button>
        </article>
      ) : (
        <article className="srs-card">
          <CatPeek
            state={revealed ? (correct ? 'happy' : 'wrong') : 'thinking'}
          />
          <header>
            <div>
              <span>{skillLabels[card.skill]}</span>
              <small>{card.topic}</small>
            </div>
            <b>
              {index + 1} / {session.length}
            </b>
            <button
              className={
                records[card.key]?.favorite ? 'favorite active' : 'favorite'
              }
              onClick={() => toggleFavorite(card)}
              aria-label="Добавить в избранное"
            >
              <Heart fill="currentColor" />
            </button>
          </header>
          <div className="srs-track">
            <span style={{ width: `${(index / session.length) * 100}%` }} />
          </div>
          <section className={revealed ? 'answered' : ''}>
            {audio ? (
              <>
                <p className="audio-label">АУДИО БЕЗ ТЕКСТА</p>
                <button className="listen-orb" onClick={speak}>
                  <Volume2 />
                  <span>Слушать</span>
                </button>
                <h2>{card.prompt}</h2>
              </>
            ) : (
              <>
                <small>НАПИШИТЕ ОТВЕТ БЕЗ ВАРИАНТОВ</small>
                <h2>{card.prompt}</h2>
              </>
            )}
            <div className="recall-input">
              <input
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !revealed) submit();
                }}
                disabled={revealed}
                placeholder={
                  card.skill === 'article'
                    ? 'Введите артикль…'
                    : 'Введите ответ…'
                }
              />
              <button onClick={submit} disabled={!typed.trim() || revealed}>
                Проверить
              </button>
            </div>
            {revealed && (
              <div
                className={correct ? 'recall-result good' : 'recall-result bad'}
              >
                <b>{correct ? 'Верно!' : 'Разберём и повторим снова'}</b>
                <p>
                  <strong>{card.answer}</strong> · {card.example}
                </p>
                {normalizeText(typed) === normalizeText(card.answer) &&
                  typed.trim().toLowerCase() !== card.answer.toLowerCase() && (
                    <small>
                      Ответ засчитан: ударение можно доработать отдельно.
                    </small>
                  )}
                <div className="grade-grid">
                  <button onClick={() => grade('again')}>
                    <b>Не помню</b>
                    <span>через 10 минут</span>
                  </button>
                  <button onClick={() => grade('hard')}>
                    <b>Трудно</b>
                    <span>
                      {dueLabel({
                        ...blankSRS(),
                        reviews: 1,
                        nextReview: Date.now() + 43200000,
                      })}
                    </span>
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
              </div>
            )}
          </section>
          <footer>
            <span>
              Сложность: {(records[card.key]?.difficulty || 5).toFixed(1)} / 10
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
type ResponseKind =
  | 'choice'
  | 'type'
  | 'self'
  | 'order'
  | 'letters'
  | 'phrase'
  | 'correction'
  | 'audioWord'
  | 'audioSentence';
const practiceTopics = [
  'Все темы',
  ...vocabularyTopics.map((topic) => topic.name),
  'Мои слова',
  'Уроки A1',
];
const topicDeck = (deck: StudyCard[], topic: string) =>
  topic === 'Все темы'
    ? deck
    : topic === 'Уроки A1'
      ? deck.filter(
          (card) =>
            card.topic !== 'Мои слова' &&
            !vocabularyTopics.some((item) => item.name === card.topic),
        )
      : deck.filter((card) => card.topic === topic);
const seededNumber = (seed: string) =>
  Array.from(seed).reduce(
    (sum, character) => (sum * 33 + character.charCodeAt(0)) >>> 0,
    5381,
  );
const responseKindFor = (
  card: StudyCard,
  index: number,
  record?: SRSRecord,
): ResponseKind => {
  const reviews = record?.reviews || 0,
    headword = card.es.split(' / ')[0].trim(),
    letterCount = Array.from(headword).filter((character) =>
      /\p{L}/u.test(character),
    ).length,
    canRestoreLetters =
      !/\s/.test(headword) &&
      letterCount >= 9,
    shortWord = letterCount <= 4,
    weak =
      !!record &&
      (record.lastGrade === 'again' ||
        record.lapses >= 2 ||
        record.difficulty >= 6.2),
    strong =
      !!record &&
      record.reviews >= 4 &&
      record.correctStreak >= 3 &&
      record.stability >= 5,
    correctionAvailable = !!makeSingleWordCorrection(card),
    pick = (kinds: readonly ResponseKind[]) => {
      const available = kinds.filter(
        (kind) => kind !== 'correction' || correctionAvailable,
      );
      return available[
        seededNumber(`${card.key}-${index}-${reviews}-${record?.lapses || 0}`) %
          available.length
      ];
    };

  if (card.skill === 'recognition') {
    if (canRestoreLetters && (weak || !reviews))
      return pick(['letters', 'type', 'letters', 'type', 'choice', 'phrase']);
    if (shortWord)
      return pick(
        strong
          ? ['type', 'phrase', 'type', 'choice', 'correction']
          : weak
            ? ['type', 'type', 'phrase', 'choice', 'type']
            : STANDARD_RECOGNITION_DISTRIBUTION,
      );
    return pick(
      strong
        ? ['type', 'type', 'phrase', 'choice', 'correction']
        : weak
          ? ['type', 'type', 'choice', 'phrase', 'type']
          : STANDARD_RECOGNITION_DISTRIBUTION,
    );
  }
  if (card.skill === 'production') {
    if (card.answer.trim().split(/\s+/).length >= 3)
      return pick(
        strong
          ? ['order', 'type', 'self', 'order']
          : weak
            ? ['order', 'type', 'order', 'type']
            : ['order', 'type', 'self', 'type'],
      );
    if (canRestoreLetters && weak)
      return pick(['letters', 'type', 'type', 'letters', 'choice', 'phrase']);
    return pick(
      strong
        ? ['type', 'phrase', 'correction', 'choice', 'type', 'self']
        : weak
          ? ['type', 'type', 'choice', 'phrase', 'correction']
          : ['type', 'type', 'choice', 'self', 'phrase'],
    );
  }
  if (card.skill === 'listening')
    return pick(
      strong
        ? ['audioSentence', 'type', 'audioSentence']
        : weak
          ? ['type', 'audioSentence', 'type', 'choice', 'audioSentence']
          : ['type', 'type', 'audioSentence', 'choice', 'audioSentence'],
    );
  if (card.skill === 'dictation')
    return pick(
      canRestoreLetters && weak
        ? ['letters', 'type', 'audioSentence', 'type']
        : strong
          ? ['audioSentence', 'type', 'audioSentence', 'type']
          : ['type', 'audioSentence', 'type', 'audioSentence'],
    );
  if (card.skill === 'context')
    return pick(
      strong
        ? ['correction', 'type', 'choice', 'correction', 'type', 'type']
        : weak
          ? ['type', 'correction', 'type', 'choice', 'type']
          : ['choice', 'type', 'type', 'correction', 'type'],
    );
  if (card.skill === 'article')
    return 'choice';
  return pick(['type', 'phrase', 'correction', 'self']);
};
const practiceFormatReason = (
  card: StudyCard,
  record: SRSRecord | undefined,
  kind: ResponseKind,
) => {
  const length = Array.from(card.es.split(' / ')[0]).filter((character) =>
      /\p{L}/u.test(character),
    ).length,
    weak =
      !!record &&
      (record.lastGrade === 'again' ||
        record.lapses >= 2 ||
        record.difficulty >= 6.2),
    strong =
      !!record &&
      record.reviews >= 4 &&
      record.correctStreak >= 3 &&
      record.stability >= 5;
  if (kind === 'letters' && length >= 9)
    return 'длинное слово — тренируем точное написание';
  if (kind === 'audioWord')
    return 'слушаем слово без текста и вспоминаем его значение';
  if (kind === 'correction')
    return 'слово уже встречалось — замечаем точную ошибку в написании';
  if (!record?.reviews) return 'новый навык — начинаем с опоры и контекста';
  if (weak) return 'были ошибки — чаще активное вспоминание';
  if (strong) return 'слово знакомо — усложняем контекст';
  if (length <= 4) return 'короткое слово — проверяем внутри фразы';
  return 'формат чередуется по истории этого навыка';
};
const maskedSpanishWord = (value: string, seed: string) => {
  const characters = Array.from(value.split(' / ')[0]),
    candidates = characters
      .map((character, index) => (/\p{L}/u.test(character) ? index : -1))
      .filter((index) => index >= 0),
    offset = seededNumber(seed) % Math.max(1, candidates.length),
    missingCount = Math.min(5, Math.max(3, Math.ceil(candidates.length * 0.4))),
    missing = new Set(
      Array.from(
        { length: missingCount },
        (_, index) =>
          candidates[(offset + index * 3 + Math.floor(index / 2)) % candidates.length],
      ),
    );
  return characters
    .map((character, index) => (missing.has(index) ? '＿' : character))
    .join('');
};
const choicesFor = (card: StudyCard, deck: StudyCard[]) => {
  if (card.skill === 'article') return ['el', 'la'];
  const topicAlternatives = deck
    .filter(
      (item) =>
        item.skill === card.skill &&
        item.topic === card.topic &&
        item.key !== card.key &&
        normalizeText(item.ru) !== normalizeText(card.ru),
    )
    .map((item) => ({ answer: item.answer, ru: item.ru })),
    spanishAnswer = !['recognition', 'listening'].includes(card.skill),
    vocabularyAlternatives = vocabularyTopics.flatMap((topic) =>
      topic.entries
        .filter((entry) => normalizeText(entry.ru) !== normalizeText(card.ru))
        .map((entry) => ({
          answer: spanishAnswer ? entry.es : entry.ru,
          ru: entry.ru,
        })),
    ),
    answerLength = Array.from(card.answer).length,
    answerWordCount = card.answer.trim().split(/\s+/).length,
    alternatives = [...topicAlternatives, ...vocabularyAlternatives]
      .filter(
        (candidate, index, array) =>
          normalizeText(candidate.answer) !== normalizeText(card.answer) &&
          array.findIndex(
            (item) =>
              normalizeText(item.answer) === normalizeText(candidate.answer),
          ) === index,
      )
      .sort((first, second) => {
        const score = (candidate: { answer: string }) =>
          Math.abs(Array.from(candidate.answer).length - answerLength) +
          Math.abs(candidate.answer.trim().split(/\s+/).length - answerWordCount) *
            12;
        return (
          score(first) - score(second) ||
          seededNumber(`${card.key}-${first.answer}`) -
            seededNumber(`${card.key}-${second.answer}`)
        );
      })
      .map((candidate) => candidate.answer);
  return [
    card.answer,
    ...alternatives.slice(0, 3),
  ];
};
const studyExamples = (card: StudyCard) =>
  [
    { es: card.example, ru: card.exampleRu || card.ru },
    {
      es: card.extraExample || card.example,
      ru: card.extraExampleRu || card.exampleRu || card.ru,
    },
  ].filter(
    (example, index, list) =>
      list.findIndex(
        (item) => normalizeText(item.es) === normalizeText(example.es),
      ) === index,
  );
const reviewReason = (record?: SRSRecord) =>
  !record?.reviews
    ? 'Новое слово'
    : record.lastGrade === 'again'
      ? 'Ошибка на прошлой попытке'
      : record.difficulty >= 6.2
        ? 'Слабый навык'
        : record.nextReview <= Date.now()
          ? 'Пора повторить'
          : 'Дополнительное закрепление';
function ReviewCalendar({ records }: { records: Record<string, SRSRecord> }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    const end = date.getTime() + 86400000,
      count = Object.values(records).filter(
        (record) =>
          record.reviews &&
          record.nextReview >= date.getTime() &&
          record.nextReview < end,
      ).length;
    return {
      label:
        index === 0
          ? 'Сегодня'
          : date.toLocaleDateString('ru-RU', {
              weekday: 'short',
              day: 'numeric',
            }),
      count,
    };
  });
  return (
    <section className="review-calendar">
      <header>
        <div>
          <p className="eyebrow">КАЛЕНДАРЬ ПОВТОРЕНИЙ</p>
          <h3>Ближайшие 7 дней</h3>
        </div>
        <small>каждый навык планируется отдельно</small>
      </header>
      <div>
        {days.map((day) => (
          <article className={day.count ? 'has-reviews' : ''} key={day.label}>
            <span>{day.label}</span>
            <b>{day.count}</b>
            <small>{day.count ? 'карточек' : 'свободно'}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

type DetectiveLevel = 'A1' | 'A2';
type DetectiveQuestion = {
  kind: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};
type DetectiveCase = {
  title: string;
  text: string;
  translation: string;
  ending: string;
  questions: DetectiveQuestion[];
};
const detectiveCases: Record<DetectiveLevel, DetectiveCase[]> = {
  A1: [
    {
      title: 'Дело о забытом рюкзаке',
      text: 'Lucía sale de casa a las ocho. En la parada abre su bolso y no encuentra el móvil. Vuelve a casa, pero el móvil tampoco está allí. Entonces oye música dentro de su mochila azul.',
      translation: 'Лусия выходит из дома в восемь. На остановке она открывает сумку и не находит телефон. Она возвращается домой, но телефона там тоже нет. Затем она слышит музыку внутри своего синего рюкзака.',
      ending: 'Тайна раскрыта: телефон всё время лежал в синем рюкзаке.',
      questions: [
        { kind: 'Смысл', prompt: '¿A qué hora sale Lucía?', options: ['A las ocho', 'A las nueve', 'A las siete'], answer: 'A las ocho', explanation: 'В первой фразе сказано: sale de casa a las ocho.' },
        { kind: 'Деталь', prompt: '¿Qué busca Lucía?', options: ['El móvil', 'Las llaves', 'Un libro'], answer: 'El móvil', explanation: 'Она открывает сумку и не находит телефон.' },
        { kind: 'Перевод', prompt: 'Что значит «Vuelve a casa»?', options: ['Она возвращается домой', 'Она выходит из дома', 'Она звонит домой'], answer: 'Она возвращается домой', explanation: 'volver a casa — возвращаться домой.' },
        { kind: 'Порядок событий', prompt: 'Выберите правильный порядок трёх событий.', options: ['Sale de casa → vuelve → oye música', 'Oye música → sale de casa → vuelve', 'Vuelve → oye música → sale de casa'], answer: 'Sale de casa → vuelve → oye música', explanation: 'Сначала Лусия выходит, затем возвращается и только потом слышит музыку.' },
        { kind: 'Продолжение', prompt: 'Где, вероятнее всего, находится телефон?', options: ['En la mochila azul', 'En la oficina', 'En el autobús'], answer: 'En la mochila azul', explanation: 'Музыка слышна из синего рюкзака.' },
      ],
    },
    {
      title: 'Заказ в маленьком кафе',
      text: '—Buenos días. Quiero un café con leche y una tostada, por favor. —¿Con tomate o con mantequilla? —Con tomate. ¿Cuánto es? —Son cuatro euros.',
      translation: '— Доброе утро. Я хочу кофе с молоком и тост, пожалуйста. — С помидором или с маслом? — С помидором. Сколько с меня? — Четыре евро.',
      ending: 'Заказ готов: кофе с молоком и тост с помидором стоят четыре евро.',
      questions: [
        { kind: 'Кто говорит', prompt: 'Кто спрашивает «¿Con tomate o con mantequilla?»', options: ['Официант', 'Клиент', 'Водитель'], answer: 'Официант', explanation: 'Это уточнение к заказу клиента.' },
        { kind: 'Пропуск', prompt: 'Quiero un café ___ leche.', options: ['con', 'sin', 'de'], answer: 'con', explanation: 'café con leche — кофе с молоком.' },
        { kind: 'Смысл', prompt: 'Какой тост выбрал клиент?', options: ['С помидором', 'С маслом', 'Без добавок'], answer: 'С помидором', explanation: 'Клиент отвечает: Con tomate.' },
        { kind: 'Перевод', prompt: 'Что означает «¿Cuánto es?»', options: ['Сколько с меня?', 'Что это?', 'Во сколько открывается?'], answer: 'Сколько с меня?', explanation: 'Так естественно спрашивают итоговую цену.' },
        { kind: 'Деталь', prompt: 'Сколько стоит заказ?', options: ['Cuatro euros', 'Dos euros', 'Cinco euros'], answer: 'Cuatro euros', explanation: 'Официант отвечает: Son cuatro euros.' },
      ],
    },
    {
      title: 'Не тот поезд',
      text: 'Pablo quiere ir a Valencia. En la estación ve dos trenes. Pregunta a una empleada: «¿Este tren va a Valencia?». Ella responde: «No, este va a Madrid. El tren a Valencia sale del andén seis».',
      translation: 'Пабло хочет поехать в Валенсию. На вокзале он видит два поезда. Он спрашивает сотрудницу: «Этот поезд идёт в Валенсию?». Она отвечает: «Нет, этот идёт в Мадрид. Поезд в Валенсию отправляется с шестой платформы».',
      ending: 'Пабло находит шестую платформу и успевает на поезд в Валенсию.',
      questions: [
        { kind: 'Цель', prompt: '¿Adónde quiere ir Pablo?', options: ['A Valencia', 'A Madrid', 'A Sevilla'], answer: 'A Valencia', explanation: 'Первая фраза прямо называет Valencia.' },
        { kind: 'Смысл', prompt: 'Куда идёт первый поезд?', options: ['A Madrid', 'A Valencia', 'A Barcelona'], answer: 'A Madrid', explanation: 'Сотрудница говорит: este va a Madrid.' },
        { kind: 'Пропуск', prompt: 'El tren ___ Valencia sale del andén seis.', options: ['a', 'de', 'en'], answer: 'a', explanation: 'Поезд «в Валенсию»: el tren a Valencia.' },
        { kind: 'Перевод', prompt: 'Что такое «andén»?', options: ['Платформа', 'Билет', 'Чемодан'], answer: 'Платформа', explanation: 'andén — железнодорожная платформа.' },
        { kind: 'Продолжение', prompt: 'Что нужно сделать Пабло?', options: ['Ir al andén seis', 'Subir al tren a Madrid', 'Salir de la estación'], answer: 'Ir al andén seis', explanation: 'Нужный поезд отправляется с шестой платформы.' },
      ],
    },
    {
      title: 'Сюрприз для бабушки',
      text: 'Hoy es el cumpleaños de la abuela Rosa. Su nieta Ana compra flores y su nieto Luis prepara una tarta. Rosa piensa que la familia está ocupada, pero a las siete todos llaman a su puerta.',
      translation: 'Сегодня день рождения бабушки Росы. Её внучка Ана покупает цветы, а внук Луис готовит торт. Роса думает, что семья занята, но в семь часов все звонят в её дверь.',
      ending: 'Роса открывает дверь, видит всю семью и понимает, что о её дне рождения никто не забыл.',
      questions: [
        { kind: 'Смысл', prompt: '¿Quién cumple años?', options: ['La abuela Rosa', 'Ana', 'Luis'], answer: 'La abuela Rosa', explanation: 'Hoy es el cumpleaños de la abuela Rosa.' },
        { kind: 'Деталь', prompt: 'Что покупает Ана?', options: ['Цветы', 'Торт', 'Книгу'], answer: 'Цветы', explanation: 'Ana compra flores.' },
        { kind: 'Деталь', prompt: 'Что готовит Луис?', options: ['Una tarta', 'Una cena', 'Un café'], answer: 'Una tarta', explanation: 'Luis prepara una tarta.' },
        { kind: 'Порядок событий', prompt: 'Какое событие происходит последним?', options: ['Todos llaman a la puerta', 'Ana compra flores', 'Luis prepara una tarta'], answer: 'Todos llaman a la puerta', explanation: 'Семья приходит к двери в семь.' },
        { kind: 'Продолжение', prompt: 'Почему семья пришла?', options: ['Para celebrar el cumpleaños', 'Para trabajar', 'Para pedir comida'], answer: 'Para celebrar el cumpleaños', explanation: 'Цветы и торт указывают на праздник.' },
      ],
    },
  ],
  A2: [
    {
      title: 'Ключ под дождём',
      text: 'Cuando Elena llegó a su edificio, empezó a llover. Buscó las llaves durante diez minutos y llamó a su compañero de piso. Mientras hablaban, el portero salió y señaló un sobre: Elena había dejado allí las llaves por la mañana.',
      translation: 'Когда Елена подошла к своему дому, начался дождь. Она десять минут искала ключи и позвонила соседу по квартире. Пока они разговаривали, вышел портье и указал на конверт: утром Елена оставила ключи там.',
      ending: 'Ключи нашлись в конверте у портье — Елена сама оставила их утром.',
      questions: [
        { kind: 'Пропуск', prompt: 'Cuando Elena ___, empezó a llover.', options: ['llegó', 'llegaba', 'llegará'], answer: 'llegó', explanation: 'Завершённое событие в рассказе — llegó.' },
        { kind: 'Смысл', prompt: 'Кому позвонила Елена?', options: ['Соседу по квартире', 'Начальнику', 'Водителю'], answer: 'Соседу по квартире', explanation: 'llamó a su compañero de piso.' },
        { kind: 'Порядок событий', prompt: 'Выберите правильный порядок четырёх событий.', options: ['Llegó → llovió → buscó → llamó', 'Llamó → llegó → buscó → llovió', 'Buscó → llamó → llegó → llovió'], answer: 'Llegó → llovió → buscó → llamó', explanation: 'Она пришла, начался дождь, затем она искала ключи и позвонила соседу.' },
        { kind: 'Кто говорит', prompt: 'Кто указал на конверт?', options: ['El portero', 'El compañero de piso', 'Elena'], answer: 'El portero', explanation: 'el portero salió y señaló un sobre.' },
        { kind: 'Вывод', prompt: 'Почему ключи были у портье?', options: ['Elena las había dejado allí', 'Кто-то их украл', 'Сосед их потерял'], answer: 'Elena las había dejado allí', explanation: 'Текст объясняет это в последней части.' },
      ],
    },
    {
      title: 'Сообщение без подписи',
      text: 'En la oficina apareció una nota: «La reunión cambia a las cuatro. Lleva los informes». Carlos pensó que era de Marta, pero Marta estaba de vacaciones. Al final reconoció la letra de Julia, la nueva directora.',
      translation: 'В офисе появилась записка: «Встречу переносят на четыре. Принеси отчёты». Карлос подумал, что записка от Марты, но Марта была в отпуске. В конце концов он узнал почерк Хулии, новой руководительницы.',
      ending: 'Автор записки — новая директор Хулия; встреча действительно перенесена на четыре.',
      questions: [
        { kind: 'Смысл', prompt: 'Что изменилось?', options: ['Время встречи', 'Место отпуска', 'Автор отчёта'], answer: 'Время встречи', explanation: 'La reunión cambia a las cuatro.' },
        { kind: 'Перевод', prompt: 'Что означает «Lleva los informes»?', options: ['Принеси отчёты', 'Прочитай отчёты', 'Исправь отчёты'], answer: 'Принеси отчёты', explanation: 'llevar здесь — взять/принести с собой.' },
        { kind: 'Деталь', prompt: 'Почему записка не могла быть от Марты?', options: ['Она была в отпуске', 'Она не знала Карлоса', 'Она опоздала'], answer: 'Она была в отпуске', explanation: 'Marta estaba de vacaciones.' },
        { kind: 'Кто говорит', prompt: 'Кто написал записку?', options: ['Julia', 'Marta', 'Carlos'], answer: 'Julia', explanation: 'Карлос узнал почерк новой директрисы.' },
        { kind: 'Продолжение', prompt: 'Что логично сделает Карлос?', options: ['Возьмёт отчёты на встречу', 'Уедет в отпуск', 'Отменит встречу'], answer: 'Возьмёт отчёты на встречу', explanation: 'Это прямое указание из записки.' },
      ],
    },
    {
      title: 'Опоздавшая посылка',
      text: 'Nora esperaba un regalo para su hermano. La tienda prometió entregarlo el martes, pero el jueves aún no había llegado. Revisó el correo y descubrió que había escrito mal el número de su casa.',
      translation: 'Нора ждала подарок для брата. Магазин обещал доставить его во вторник, но в четверг он всё ещё не пришёл. Она проверила электронную почту и обнаружила, что неправильно написала номер своего дома.',
      ending: 'После исправления адреса курьер доставил подарок на следующее утро.',
      questions: [
        { kind: 'Смысл', prompt: 'Для кого был подарок?', options: ['Для брата Норы', 'Для курьера', 'Для продавца'], answer: 'Для брата Норы', explanation: 'un regalo para su hermano.' },
        { kind: 'Деталь', prompt: 'Когда магазин обещал доставку?', options: ['El martes', 'El jueves', 'El viernes'], answer: 'El martes', explanation: 'prometió entregarlo el martes.' },
        { kind: 'Пропуск', prompt: 'El jueves todavía no ___ llegado.', options: ['había', 'ha', 'hubo'], answer: 'había', explanation: 'Действие не произошло до другого момента в прошлом.' },
        { kind: 'Причина', prompt: 'Почему посылка опоздала?', options: ['Адрес был указан неверно', 'Магазин был закрыт', 'Подарок потеряли'], answer: 'Адрес был указан неверно', explanation: 'Нора неправильно написала номер дома.' },
        { kind: 'Порядок событий', prompt: 'Что Нора сделала перед тем, как поняла причину?', options: ['Revisó el correo', 'Compró otro regalo', 'Llamó a su hermano'], answer: 'Revisó el correo', explanation: 'Она проверила письмо и обнаружила ошибку.' },
      ],
    },
    {
      title: 'Последний столик',
      text: 'Sergio reservó una mesa para celebrar su aniversario. Al llegar, el camarero no encontraba la reserva. Sergio mostró el mensaje de confirmación: había reservado para el día siguiente. Por suerte, una pareja acababa de cancelar.',
      translation: 'Серхио забронировал столик, чтобы отметить годовщину. Когда он пришёл, официант не смог найти бронь. Серхио показал подтверждение: оказалось, он забронировал столик на следующий день. К счастью, одна пара только что отменила свою бронь.',
      ending: 'Освободившийся столик спас вечер, хотя бронь была сделана на другой день.',
      questions: [
        { kind: 'Цель', prompt: 'Почему Серхио хотел столик?', options: ['Чтобы отметить годовщину', 'Чтобы провести встречу', 'Чтобы поработать'], answer: 'Чтобы отметить годовщину', explanation: 'para celebrar su aniversario.' },
        { kind: 'Смысл', prompt: 'В чём была ошибка бронирования?', options: ['Бронь была на следующий день', 'Было указано другое имя', 'Ресторан был другой'], answer: 'Бронь была на следующий день', explanation: 'había reservado para el día siguiente.' },
        { kind: 'Кто говорит', prompt: 'Кто не мог найти бронь?', options: ['El camarero', 'Sergio', 'La pareja'], answer: 'El camarero', explanation: 'El camarero no encontraba la reserva.' },
        { kind: 'Порядок событий', prompt: 'Что произошло непосредственно перед решением проблемы?', options: ['Una pareja canceló', 'Sergio reservó', 'El camarero cerró'], answer: 'Una pareja canceló', explanation: 'Освободился столик другой пары.' },
        { kind: 'Вывод', prompt: 'Смог ли Серхио остаться в ресторане?', options: ['Да, освободился столик', 'Нет, ресторан закрылся', 'Текст этого не сообщает'], answer: 'Да, освободился столик', explanation: 'Фраза Por suerte указывает на удачное решение.' },
      ],
    },
  ],
};

function DetectiveGame() {
  const [level, setLevel] = useState<DetectiveLevel>('A1'),
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
      const saved = JSON.parse(
        localStorage.getItem('ritmo-detective-progress') || '{}',
      );
      localStorage.setItem(
        'ritmo-detective-progress',
        JSON.stringify({ ...saved, [level]: Math.max(saved[level] || 0, stars) }),
      );
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

const rushGrammar = [
  { prompt: 'Yo ___ español.', options: ['hablo', 'habla', 'hablas'], answer: 'hablo' },
  { prompt: 'Nosotros ___ a casa.', options: ['vamos', 'voy', 'van'], answer: 'vamos' },
  { prompt: 'La mesa ___ en la cocina.', options: ['está', 'es', 'hay'], answer: 'está' },
  { prompt: 'A Ana ___ gusta el café.', options: ['le', 'la', 'se'], answer: 'le' },
  { prompt: 'Ellos ___ en Madrid.', options: ['viven', 'vive', 'vivimos'], answer: 'viven' },
  { prompt: '___ problema es difícil.', options: ['El', 'La', 'Una'], answer: 'El' },
  { prompt: 'No ___ pan en casa.', options: ['hay', 'está', 'son'], answer: 'hay' },
  { prompt: '¿___ cuesta?', options: ['Cuánto', 'Quién', 'Dónde'], answer: 'Cuánto' },
];

function SpanishRushGame() {
  const deck = makeStudyDeck().filter((card) => card.skill === 'recognition'),
    { records } = useSRS(),
    { progress } = useWordProgress(),
    [running, setRunning] = useState(false),
    [timeLeft, setTimeLeft] = useState(60),
    [score, setScore] = useState(0),
    [combo, setCombo] = useState(0),
    [round, setRound] = useState(0),
    [choice, setChoice] = useState(''),
    [doubleLeft, setDoubleLeft] = useState(0),
    [bonus, setBonus] = useState(''),
    [praise, setPraise] = useState(''),
    [best, setBest] = useState(0),
    answerLock = useRef(false),
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
      const today = localDateKey(),
        saved = JSON.parse(localStorage.getItem('ritmo-rush-records') || '{}'),
        nextBest = Math.max(Number(saved.best) || 0, score),
        daily = { ...saved.daily, [today]: Math.max(saved.daily?.[today] || 0, score) };
      localStorage.setItem('ritmo-rush-records', JSON.stringify({ best: nextBest, daily }));
      setBest(nextBest);
      playCelebrationSound('finish');
      evaluateAchievements(true);
    }
  }, [running, timeLeft, score]);
  const wordCard = deck[(round * 37 + 11) % deck.length],
    grammarTask = rushGrammar[round % rushGrammar.length],
    isGrammar = round % 3 === 2,
    distractors = deck
      .filter((item) => item.key !== wordCard.key)
      .slice((round * 13) % Math.max(1, deck.length - 4), (round * 13) % Math.max(1, deck.length - 4) + 3),
    prompt = isGrammar ? grammarTask.prompt : round % 3 === 0 ? wordCard.es : wordCard.example.replace(new RegExp(wordCard.es.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '___'),
    answer = isGrammar ? grammarTask.answer : round % 3 === 0 ? wordCard.ru : wordCard.es,
    options = isGrammar
      ? shuffledOptions(grammarTask.options, `rush-g-${round}`)
      : shuffledOptions(
          [answer, ...distractors.map((item) => (round % 3 === 0 ? item.ru : item.es))].slice(0, 4),
          `rush-v-${round}`,
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
    answerLock.current = false;
    if (transitionTimer.current !== null)
      window.clearTimeout(transitionTimer.current);
    setRunning(true);
    setTimeLeft(60);
    setScore(0);
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
    setChoice(value);
    playFeedbackSound(correct);
    recordLearningEvent(correct, correct ? gained + 2 : 1);
    if (correct) {
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
          {!isGrammar && (
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

function PracticeHub() {
  const [game, setGame] = useState<'menu' | 'study' | 'detective' | 'rush'>('menu');
  return (
    <div className="view-stack practice-hub">
      <section className="practice-mode-picker">
        <button className={game === 'study' ? 'active' : ''} onClick={() => setGame('study')}>
          <span>🧠</span><b>Учить слова</b><small>Прежняя адаптивная практика</small>
        </button>
        <button className={game === 'detective' ? 'active' : ''} onClick={() => setGame('detective')}>
          <span>📖</span><b>Детектив по тексту</b><small>A1 и A2 · по 20 заданий</small>
        </button>
        <button className={game === 'rush' ? 'active' : ''} onClick={() => setGame('rush')}>
          <span>⏱️</span><b>Spanish Rush</b><small>60 секунд · combo и бонусы</small>
        </button>
      </section>
      {game === 'menu' ? (
        <section className="practice-mode-welcome game-panel">
          <span>🐾</span>
          <h2>Выберите тренировку</h2>
          <p>Учите слова без спешки, читайте истории или устройте минутный спринт.</p>
        </section>
      ) : game === 'study' ? (
        <AdaptivePracticeView showModes={() => setGame('menu')} />
      ) : game === 'detective' ? (
        <DetectiveGame />
      ) : (
        <SpanishRushGame />
      )}
    </div>
  );
}

function AdaptivePracticeView({ showModes }: { showModes: () => void }) {
  const { words: customWords, hydrated: customHydrated } = useCustomWords(),
    deck = makeStudyDeck(customWords),
    { records, rate, toggleFavorite, markNew, hydrated: srsHydrated } = useSRS();
  const { voices, voiceIndex, setVoiceIndex, speakText, voiceError } = useSpanishVoices();
  const { leaving, move } = useTaskMotion();
  const [mode, setMode] = useState<SessionMode>('five'),
    [topic, setTopic] = useState('Все темы'),
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
    [sessionHydrated, setSessionHydrated] = useState(false);
  const answerLock = useRef(false),
    gradeLock = useRef(false);
  useEffect(() => {
    if (!customHydrated || sessionHydrated) return;
    try {
      const saved = parsePracticeSnapshot(localStorage.getItem('ritmo-practice-session')) as SavedPracticeSession | null;
      if (
        (saved?.version === 2 || saved?.version === 3 || saved?.version === 4) &&
        Array.isArray(saved.session) &&
        saved.session.length &&
        typeof saved.index === 'number'
      ) {
        const { session: synchronizedSession, index: safeIndex, contentChanged } =
          reconcilePracticeCards(saved.session, saved.index, deck);
        setMode(saved.mode);
        setTopic(saved.topic);
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
      }
    } catch {}
    setSessionHydrated(true);
  }, [customHydrated, sessionHydrated]);
  useEffect(() => {
    if (!sessionHydrated) return;
    const saved: SavedPracticeSession = {
      version: 4,
      mode,
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
    };
    localStorage.setItem('ritmo-practice-session', JSON.stringify(saved));
  }, [
    sessionHydrated,
    mode,
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
  ]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!sessionHydrated || !srsHydrated || session.length || finished) return;
    const ready = buildSession(
      topicDeck(makeStudyDeck(customWords), topic),
      records,
      mode,
    );
    if (ready.length) setSession(ready);
  }, [
    now,
    mode,
    topic,
    records,
    session.length,
    finished,
    customWords,
    sessionHydrated,
    srsHydrated,
  ]);
  const scopedDeck = topicDeck(deck, topic),
    card = session[index],
    cardBase = card ? baseCardKey(card.key) : '',
    isIntroduction =
      !!card && !wordWasStudied(card, records) && !introduced[cardBase],
    responseKind = card
      ? responseKindFor(card, index, records[card.key])
      : 'type',
    correctionTask =
      card && responseKind === 'correction'
        ? makeSingleWordCorrection(card)
        : null,
    expectedAnswer =
      !card
        ? ''
        : responseKind === 'letters'
          ? card.es.split(' / ')[0]
          : responseKind === 'phrase'
            ? card.answer
            : responseKind === 'correction'
              ? correctionTask?.answer || card.answer
              : responseKind === 'audioWord'
                ? card.answer
              : responseKind === 'audioSentence'
                ? card.example
              : card.answer,
    taskPrompt =
      !card
        ? ''
        : responseKind === 'letters'
          ? `Восстановите слово целиком: ${maskedSpanishWord(card.es, `${card.key}-${index}`)}`
          : responseKind === 'phrase'
            ? card.skill === 'recognition'
              ? `Как переводится «${card.es}» в этом предложении: ${card.example}`
              : card.skill === 'production'
                ? `Напишите по-испански «${card.ru}» для контекста: ${card.exampleRu || card.ru}`
                : card.prompt
            : responseKind === 'correction'
              ? `Найдите ошибку и напишите только исправленное слово: ${correctionTask?.sentence || card.example}`
              : responseKind === 'audioWord'
                ? 'Прослушайте слово и напишите его перевод по-русски'
              : responseKind === 'audioSentence'
                ? 'Прослушайте предложение и напишите его полностью'
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
    options = card
      ? shuffledOptions(choicesFor(card, scopedDeck), `${card.key}-${index}`)
      : [],
    due = scopedDeck.filter(
      (item) =>
        records[item.key]?.reviews && records[item.key].nextReview <= now,
    ).length,
    weak = scopedDeck.filter(
      (item) =>
        records[item.key]?.reviews && records[item.key].difficulty >= 6.2,
    ).length,
    allErrors = scopedDeck.filter(
      (item) =>
        records[item.key]?.reviews &&
        (records[item.key].lapses > 0 ||
          records[item.key].lastGrade === 'again'),
    ),
    errorCount = allErrors.filter(
      (item) => records[item.key].nextReview <= now,
    ).length,
    waitingErrors = allErrors.length - errorCount,
    favorites = scopedDeck.filter((item) => records[item.key]?.favorite).length;
  const start = (nextMode: SessionMode, nextTopic = topic) => {
    answerLock.current = false;
    gradeLock.current = false;
    const nextDeck = topicDeck(deck, nextTopic);
    setMode(nextMode);
    setTopic(nextTopic);
    setSession(buildSession(nextDeck, records, nextMode));
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
    trackLocalEvent('practice_started', nextTopic);
  };
  const speak = (
    speed = 1,
    target = responseKind === 'audioSentence'
      ? 'sentence'
      : responseKind === 'audioWord'
        ? 'word'
        : audioTarget,
  ) => {
    if (card)
      speakText(
        target === 'word' ? card.es.split(' / ')[0] : card.example,
        speed,
      );
  };
  useEffect(() => {
    if (card && isIntroduction && voices.length)
      speakText(card.es.split(' / ')[0], 1);
  }, [cardBase, isIntroduction, voiceIndex, voices.length]);
  const check = (value: string) => {
    if (!value.trim() || !card || revealed || answerLock.current) return;
    answerLock.current = true;
    const result = analyzeAnswer(value, expectedAnswer),
      isCorrect = result.correct;
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
    setCorrect(true);
    setRevealed(true);
  };
  const dontKnow = () => {
    if (!card || revealed || answerLock.current) return;
    answerLock.current = true;
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
    move(() => {
      const applied = responseKind !== 'self' && !correct ? 'again' : value;
      rate(card, applied);
      if (
        responseKind === 'self' &&
        (value === 'good' || value === 'easy')
      )
        recordAchievementEvent({ type: 'pronunciation-correct' });
      if (index >= session.length - 1) {
        setFinished(true);
        playCelebrationSound('finish');
        recordAchievementEvent({
          type: 'practice-session',
          topic,
          perfect: sessionErrors === 0,
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
  const audio =
      card &&
      (card.skill === 'listening' ||
        card.skill === 'dictation' ||
        responseKind === 'audioWord' ||
        responseKind === 'audioSentence'),
    examples = card ? studyExamples(card) : [];
  const needsSpanishKeys = /[a-záéíóúüñ¿¡]/i.test(expectedAnswer);
  return (
    <div
      className={`view-stack srs-view ${card && !finished ? 'active-exercise' : ''}`}
    >
      <ViewHead
        over="АДАПТИВНОЕ ПОВТОРЕНИЕ · СНАЧАЛА ЗНАКОМСТВО"
        title="Слово сначала понятно — потом проверяется."
        copy="За одну сессию появляется не больше четырёх новых слов. Каждое проверяется минимум тремя разными способами, а одинаковые слова чередуются между собой."
      />
      <section className="practice-topic-bar">
        <div>
          <span>ТЕМА СЛОВ</span>
          <select
            value={topic}
            onChange={(event) => start(mode, event.target.value)}
          >
            {practiceTopics.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="exercise-kind-legend">
          <span>👋 Новое слово</span>
          <span>⌨ Ввод</span>
          <span>🔊 Аудио</span>
          <span>✍️ Целые фразы</span>
          <span>🛠 Исправление</span>
        </div>
      </section>
      <div className="srs-summary">
        <button
          className={mode === 'five' ? 'active' : ''}
          onClick={() => start('five')}
        >
          <ClockBadge minutes={5} />
          <span>
            <b>5 минут</b>
            <small>16 разных заданий</small>
          </span>
        </button>
        <button
          className={mode === 'fifteen' ? 'active' : ''}
          onClick={() => start('fifteen')}
        >
          <ClockBadge minutes={15} />
          <span>
            <b>15 минут</b>
            <small>20 смешанных заданий</small>
          </span>
        </button>
        <button
          className={mode === 'weak' ? 'active' : ''}
          onClick={() => start('weak')}
        >
          <span className="session-icon">🎯</span>
          <span>
            <b>Слабые места</b>
            <small>{weak} трудных навыков</small>
          </span>
        </button>
        <button
          className={mode === 'errors' ? 'active' : ''}
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
          className={mode === 'favorites' ? 'active' : ''}
          onClick={() => start('favorites')}
        >
          <span className="session-icon">♥</span>
          <span>
            <b>Избранное</b>
            <small>{favorites} в этой теме</small>
          </span>
        </button>
      </div>
      <div className="daily-mix">
        <span>
          <b>{due}</b> действительно готовы сейчас · {topic}
        </span>
        <span>не больше 4 новых слов за сессию</span>
        <span>минимум 3 разных задания на новое слово</span>
        <span>повтор через 10 минут не появляется раньше</span>
        <span>обычное узнавание: ввод 35% · 4 варианта 30% · контекст 20% · аудио 15%</span>
      </div>
      <details className="srs-timing-note">
        <summary>Как реально работают сроки повторения</summary>
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
            {mode === 'favorites'
              ? 'В этой теме пока нет избранного'
              : mode === 'errors'
                ? waitingErrors
                  ? 'Ошибки ещё ждут своего срока'
                  : 'Ошибок для отработки пока нет'
                : 'Для этого режима пока нет карточек'}
          </h2>
          <p>
            {mode === 'errors'
              ? waitingErrors
                ? `Ближайшая карточка откроется по таймеру. После «Не помню» — ровно через 10 минут.`
                : 'Ошибочные ответы будут автоматически собираться здесь.'
              : 'Выберите другую тему или начните обычную сессию.'}
          </p>
          <button className="primary-btn" onClick={() => start('five')}>
            Начать 5 минут
          </button>
        </article>
      ) : isIntroduction ? (
        <article className="word-introduction task-swap">
          <CatPeek state="happy" />
          <header>
            <div>
              <span className="new-word-badge">НОВОЕ СЛОВО</span>
              <small>{card.topic}</small>
            </div>
            <b>
              {index + 1} / {session.length}
            </b>
            <button className="practice-exit" onClick={showModes}>Все режимы</button>
          </header>
          <section>
            <div className="speech-settings">
              <div>
                <button
                  className={audioTarget === 'word' ? 'active' : ''}
                  onClick={() => setAudioTarget('word')}
                >
                  Слово
                </button>
                <button
                  className={audioTarget === 'sentence' ? 'active' : ''}
                  onClick={() => setAudioTarget('sentence')}
                >
                  Предложение
                </button>
              </div>
              {voices.length > 1 && (
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
              )}
            </div>
            <div className="intro-audio-speeds">
              <button className="intro-listen" onClick={() => speak(1)}>
                <Volume2 /> Обычная скорость
              </button>
              <button className="intro-listen slow" onClick={() => speak(0.5)}>
                <Volume2 /> Медленно · 0.5×
              </button>
            </div>
            <h2>{card.es}</h2>
            <h3>{card.ru}</h3>
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
            <button
              className="primary-btn"
              onClick={() =>
                setIntroduced((current) => ({ ...current, [cardBase]: true }))
              }
            >
              Запомнил — перейти к заданию <ArrowRight />
            </button>
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
          <ReportExerciseButton
            id={`practice:${card.key}:${responseKind}:${normalizeText(taskPrompt)}`}
            section={`Practice: ${card.topic}`}
            prompt={taskPrompt}
            answer={expectedAnswer}
            options={responseKind === 'choice' ? options : undefined}
          />
          <header>
            <div>
              <span>{skillLabels[card.skill]}</span>
              <small>
                {card.topic} ·{' '}
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
              <em className="review-reason">
                Почему сейчас: {reviewReason(records[card.key])}
              </em>
              <em className="format-reason">
                Почему такой формат:{' '}
                {practiceFormatReason(card, records[card.key], responseKind)}
              </em>
            </div>
            <b>
              {index + 1} / {session.length}
            </b>
            <button className="practice-exit" onClick={showModes}>Все режимы</button>
            <button className="mark-new" onClick={resetAsNew}>
              Отметить новым
            </button>
            <button
              className={
                records[card.key]?.favorite ? 'favorite active' : 'favorite'
              }
              onClick={() => toggleFavorite(card)}
              aria-label="Добавить в избранное"
            >
              <Heart fill="currentColor" />
            </button>
          </header>
          <div className="srs-track">
            <span style={{ width: `${(index / session.length) * 100}%` }} />
          </div>
          <section className={revealed ? 'answered' : ''}>
            {audio && (
              <>
                <p className="audio-label">АУДИО БЕЗ ТЕКСТА</p>
                <div className="speech-settings">
                  {responseKind === 'audioSentence' ? (
                    <div className="sentence-audio-mode">
                      <span>🎧 Предложение целиком</span>
                    </div>
                  ) : responseKind === 'audioWord' ? (
                    <div className="sentence-audio-mode">
                      <span>🎧 Слово без текста</span>
                    </div>
                  ) : (
                    <div>
                      <button
                        className={audioTarget === 'word' ? 'active' : ''}
                        onClick={() => setAudioTarget('word')}
                      >
                        Слово
                      </button>
                      <button
                        className={audioTarget === 'sentence' ? 'active' : ''}
                        onClick={() => setAudioTarget('sentence')}
                      >
                        Предложение
                      </button>
                    </div>
                  )}
                  {voices.length > 1 && (
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
                  )}
                  {voiceError && <output className="voice-error">⚠ {voiceError}</output>}
                </div>
                <div className="audio-speed-controls">
                  <button className="listen-orb" onClick={() => speak(1)}>
                    <Volume2 />
                    <span>Обычная</span>
                  </button>
                  <button className="slow-listen" onClick={() => speak(0.5)}>
                    <Volume2 />
                    <span>Медленно · 0.5×</span>
                  </button>
                </div>
              </>
            )}
            <small>
              {responseKind === 'choice'
                ? 'ВЫБЕРИТЕ ПРАВИЛЬНЫЙ ОТВЕТ'
                : responseKind === 'order'
                  ? 'СОБЕРИТЕ ПРЕДЛОЖЕНИЕ ИЗ СЛОВ'
                  : responseKind === 'letters'
                    ? 'ВСТАВЬТЕ ПРОПУЩЕННЫЕ БУКВЫ'
                    : responseKind === 'phrase'
                      ? 'ОПРЕДЕЛИТЕ СЛОВО ПО КОНТЕКСТУ'
                      : responseKind === 'correction'
                        ? 'НАПИШИТЕ ТОЛЬКО ИСПРАВЛЕННОЕ СЛОВО'
                        : responseKind === 'audioWord'
                          ? 'ПРОСЛУШАЙТЕ СЛОВО И НАПИШИТЕ ПЕРЕВОД'
                          : responseKind === 'audioSentence'
                            ? 'ДИКТАНТ ПО ЦЕЛОМУ ПРЕДЛОЖЕНИЮ'
                    : responseKind === 'self'
                      ? 'ОТВЕТЬТЕ ВСЛУХ И ПРОВЕРЬТЕ СЕБЯ'
                      : 'НАПИШИТЕ ОТВЕТ БЕЗ ВАРИАНТОВ'}
            </small>
            <h2>{taskPrompt}</h2>
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
                    onChange={(event) => setTyped(event.target.value)}
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
                            ? 'Введите перевод услышанного слова…'
                            : responseKind === 'audioSentence'
                              ? 'Запишите всё услышанное…'
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
                  (responseKind === 'self' && !analysis) || correct
                    ? 'recall-result good'
                    : 'recall-result bad'
                }
              >
                <b>
                  {responseKind === 'self' && !analysis
                    ? 'Сравните со своим ответом'
                    : correct
                      ? 'Верно!'
                      : 'Эта ошибка сохранена для отработки'}
                </b>
                <p>
                  {!correct && responseKind !== 'self' && (
                    <small>Правильный ответ: </small>
                  )}
                  <strong className={correct ? 'word-assembled' : ''}>
                    {expectedAnswer}
                  </strong>
                </p>
                {hasOnlySpanishMarkDifference(typed, expectedAnswer) && (
                  <small className="soft-spelling">
                    Ответ засчитан, но сравните ударение или букву ñ с образцом.
                  </small>
                )}
                {analysis && (
                  <div className={`answer-analysis ${analysis.kind}`}>
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
                        <Volume2 /> Озвучить
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

function DictationView() {
  const { words: customWords } = useCustomWords(),
    { words: learnedWordDb } = useLearnedWordsDb(),
    deck = makeStudyDeck(customWords),
    { records, rate } = useSRS(),
    { progress: wordProgress } = useWordProgress(),
    { voices, voiceIndex, setVoiceIndex, speakText, voiceError } = useSpanishVoices(),
    topics = [
      ...new Set([
        'Все темы',
        ...learnedWordDb.map((word) => word.lessonTitle),
        ...vocabularyTopics.map((item) => item.name),
        ...(customWords.length ? ['Мои слова'] : []),
      ]),
    ],
    [topic, setTopic] = useState('Все темы'),
    [cards, setCards] = useState<StudyCard[]>([]),
    [index, setIndex] = useState(0),
    [typed, setTyped] = useState(''),
    [checked, setChecked] = useState(false),
    [audioTarget, setAudioTarget] = useState<'word' | 'sentence'>('word');
  const { leaving, move } = useTaskMotion();
  const lessonCards = learnedWordDictationCards(learnedWordDb),
    practiceCards = deck.filter(
      (card) =>
        card.skill === 'dictation' &&
        (wordWasStudied(card, records) ||
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
      .filter((card) => topic === 'Все темы' || card.topic === topic),
    card = cards[index],
    expected = card
      ? audioTarget === 'word'
        ? card.answer
        : card.example
      : '',
    answerAnalysis = card ? analyzeAnswer(typed, expected) : null,
    correct = !!card && !!answerAnalysis?.correct;
  const begin = (nextTopic = topic) => {
    const available = [...lessonCards, ...practiceCards]
      .filter(
        (card, cardIndex, list) =>
          list.findIndex(
            (item) => normalizeText(item.es) === normalizeText(card.es),
          ) === cardIndex,
      )
      .filter((item) => nextTopic === 'Все темы' || item.topic === nextTopic);
    setTopic(nextTopic);
    setCards([...available].sort(() => Math.random() - 0.5).slice(0, 20));
    setIndex(0);
    setTyped('');
    setChecked(false);
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
    setChecked(true);
    playFeedbackSound(correctAnswer);
    recordLearningEvent(correctAnswer, correctAnswer ? 6 : 2);
    if (!correctAnswer) recordError('Диктант');
    rate(card, correctAnswer ? 'good' : 'again');
  };
  const dontKnow = () => {
    if (!card || checked) return;
    setTyped('');
    setChecked(true);
    playFeedbackSound(false);
    recordLearningEvent(false, 1);
    recordError('Диктант');
    rate(card, 'again');
  };
  const next = () =>
    move(() => {
      if (index >= cards.length - 1) begin(topic);
      else {
        setIndex((value) => value + 1);
        setTyped('');
        setChecked(false);
      }
    });
  useEffect(() => {
    if (card && !checked && voices.length) speak(1);
  }, [index, cards, audioTarget, voiceIndex, voices.length]);
  return (
    <div className="view-stack dictation-view">
      <ViewHead
        over="ДИКТАНТ · БАЗА ИЗУЧЕННЫХ СЛОВ"
        title="Слушайте и пишите без подсказки."
        copy="Диктант использует основные слова начатых уроков и слова, закреплённые в Practice. Случайные слова из теоретических примеров в базу не попадают."
      />
      <section className="dictation-toolbar">
        <label>
          <span>Тема</span>
          <select value={topic} onChange={(event) => begin(event.target.value)}>
            {topics.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <div>
          <b>{learned.length}</b>
          <span>слов из базы доступно</span>
        </div>
        <button onClick={() => begin(topic)} disabled={!learned.length}>
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
          />
          <header>
            <span>{card.topic}</span>
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

function ClockBadge({ minutes }: { minutes: number }) {
  return (
    <span className="clock-badge">
      <b>{minutes}</b>
      <small>МИН</small>
    </span>
  );
}

function useErrorProfile() {
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
function MemoryDashboard() {
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [now] = useState(() => Date.now());
  const { words: customWords } = useCustomWords(),
    { words: learnedWordDb } = useLearnedWordsDb(),
    { records } = useSRS(),
    { progress: wordProgress } = useWordProgress(),
    { profile } = useDeviceProfile(),
    errors = useErrorProfile(),
    { progress } = useLessonProgress(),
    deck = [
      ...makeStudyDeck(customWords),
      ...learnedWordDictationCards(learnedWordDb),
    ],
    recognition = deck.filter((card) => card.skill === 'recognition'),
    wordBases = [...new Set(recognition.map((card) => baseCardKey(card.key)))],
    known = wordBases.filter(
      (base) =>
        derivedWordStatus(base, records, wordProgress[base] || 'new') ===
        'learned',
    ).length,
    stable = wordBases.filter((base) =>
      [records[`${base}-recognition`], records[`${base}-production`]].every(
        (record) => masteredRecord(record) && record!.stability >= 21,
      ),
    ).length,
    due = new Set(
      deck
        .filter(
          (card) =>
            records[card.key]?.reviews && records[card.key].nextReview <= now,
        )
        .map((card) => baseCardKey(card.key)),
    ).size,
    newWords = wordBases.filter(
      (base) =>
        derivedWordStatus(base, records, wordProgress[base] || 'new') === 'new',
    ).length,
    active = wordBases.filter(
      (base) =>
        derivedWordStatus(base, records, wordProgress[base] || 'new') ===
          'learned' && (records[`${base}-production`]?.stability || 0) >= 7,
    ).length;
  const skillScores = (Object.keys(skillLabels) as SkillType[]).map((skill) => {
      const cards = deck.filter(
          (card) => card.skill === skill && records[card.key]?.reviews,
        ),
        reviews = cards.reduce(
          (sum, card) => sum + records[card.key].reviews,
          0,
        ),
        accuracy = cards.length
          ? Math.round(
              (cards.reduce(
                (sum, card) =>
                  sum + records[card.key].successes / records[card.key].reviews,
                0,
              ) /
                cards.length) *
                100,
            )
          : 0,
        memory = cards.length
          ? Math.round(
              (cards.reduce(
                (sum, card) =>
                  sum + Math.min(1, records[card.key].stability / 30),
                0,
              ) /
                cards.length) *
                100,
            )
          : 0,
        readiness = cards.length
          ? cards.reduce(
              (sum, card) => sum + Math.min(1, records[card.key].reviews / 3),
              0,
            ) / cards.length
          : 0,
        score = Math.round((accuracy * 0.6 + memory * 0.4) * readiness);
      const confident = cards.filter((card) =>
          masteredRecord(records[card.key]),
        ).length,
        needsReview = cards.filter(
          (card) =>
            records[card.key]?.reviews && records[card.key].nextReview <= now,
        ).length,
        total = deck.filter((card) => card.skill === skill).length,
        newCount = Math.max(0, total - cards.length);
      return {
        skill,
        score,
        accuracy,
        memory,
        reviews,
        confident,
        needsReview,
        newCount,
        total,
      };
    }),
    topErrors = Object.entries(errors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  const activityFor = (length: number) =>
    Array.from({ length }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index);
      return profile.dailyReviews[localDateKey(date)] || 0;
    }).reduce((sum, value) => sum + value, 0);
  return (
    <div className="memory-dashboard">
      <section className="memory-numbers">
        <article>
          <span>🧠</span>
          <b>{known}</b>
          <p>слов действительно выучено</p>
        </article>
        <article>
          <span>💬</span>
          <b>{active}</b>
          <p>активно закреплено</p>
        </article>
        <article>
          <span>🛡️</span>
          <b>{stable}</b>
          <p>устойчиво в памяти</p>
        </article>
        <article>
          <span>⏰</span>
          <b>{due}</b>
          <p>требуют повторения</p>
        </article>
        <article>
          <span>🌱</span>
          <b>{newWords}</b>
          <p>ещё новые</p>
        </article>
      </section>
      <section className="memory-rules">
        <div>
          <b>🧠 Выучено</b>
          <span>
            Узнавание и самостоятельный перевод: по 3+ проверки, серия 2+,
            точность 75%+.
          </span>
        </div>
        <div>
          <b>💬 Активно закреплено</b>
          <span>
            Слово уже выучено, а устойчивость самостоятельного перевода достигла
            7 дней.
          </span>
        </div>
        <div>
          <b>🛡️ Устойчиво в памяти</b>
          <span>
            Оба основных навыка выучены и получили интервал не меньше 21 дня.
          </span>
        </div>
        <small>
          Все числа рассчитываются из тех же записей профиля, что и статусы во
          Vocabulary. Ручная отметка не может сделать слово «выученным».
        </small>
      </section>
      <section className="progress-history">
        <header>
          <div>
            <p className="eyebrow">ИСТОРИЯ АКТИВНОСТИ</p>
            <h3>Практика за 7 и 30 дней</h3>
          </div>
          <small>учитываются реальные ответы в этом профиле</small>
        </header>
        <div>
          <article>
            <b>{activityFor(7)}</b>
            <span>ответов за 7 дней</span>
          </article>
          <article>
            <b>{activityFor(30)}</b>
            <span>ответов за 30 дней</span>
          </article>
          <article>
            <b>
              {
                profile.activeDays.filter((day) => {
                  const date = new Date(`${day}T00:00:00`);
                  return now - date.getTime() < 30 * 86400000;
                }).length
              }
            </b>
            <span>дней с заходом за 30 дней</span>
          </article>
          <article>
            <b>{profile.streak}</b>
            <span>{russianDayWord(profile.streak)} подряд</span>
          </article>
        </div>
      </section>
      <div className="insight-grid">
        <section className="skill-panel">
          <header>
            <div>
              <p className="eyebrow">ПОЛОСА НАВЫКОВ</p>
              <h3>Что уже закрепилось</h3>
            </div>
            <small>данные текущего профиля</small>
          </header>
          <div className="skill-formula">
            <b>Как считается процент</b>
            <code>Итог = точность × 60% + устойчивость памяти × 40%</code>
            <p>
              Итог начинает расти после практики и полностью учитывается только
              после трёх проверок. Слово считается выученным, когда и узнавание,
              и самостоятельный перевод прошли минимум 3 проверки, имеют серию
              2+ и точность не ниже 75%.
            </p>
          </div>
          <div>
            {skillScores.map((item) => (
              <button
                type="button"
                className="clickable-skill"
                key={item.skill}
                onClick={() =>
                  setSelectedSkill(
                    selectedSkill === item.skill ? null : item.skill,
                  )
                }
                aria-expanded={selectedSkill === item.skill}
              >
                <span>
                  <b>{skillLabels[item.skill]}</b>
                  <em>{item.score}%</em>
                </span>
                <i>
                  <b style={{ width: `${item.score}%` }} />
                </i>
                <small>
                  Точность {item.accuracy}% · память {item.memory}% ·{' '}
                  {item.reviews} проверок
                </small>
                {selectedSkill === item.skill && (
                  <div className="skill-breakdown">
                    <b>
                      {skillLabels[item.skill]} — {item.score}%
                    </b>
                    <span>{item.total} навыков всего</span>
                    <span>{item.confident} уверенно закреплены</span>
                    <span>{item.needsReview} требуют повторения</span>
                    <span>{item.newCount} ещё новые</span>
                    <p>
                      Процент учитывает точность (60%), устойчивость памяти
                      (40%) и становится полным только после трёх активных
                      проверок.
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
        <section className="error-panel">
          <p className="eyebrow">УМНЫЙ ПРОФИЛЬ ОШИБОК</p>
          <h3>Мои слабые места</h3>
          {topErrors.length ? (
            <div>
              {topErrors.map(([name, count], index) => (
                <article key={name}>
                  <span>{index + 1}</span>
                  <div>
                    <b>{name}</b>
                    <small>
                      {count} {count === 1 ? 'ошибка' : 'ошибок'}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="clean-errors">
              <CatMascot state="happy" small />
              <p>
                Ошибок пока нет. После практики здесь появится персональная
                картина.
              </p>
            </div>
          )}
        </section>
      </div>
      <section className="knowledge-map">
        <header>
          <div>
            <p className="eyebrow">КАРТА ЗНАНИЙ · A1</p>
            <h3>От темы к навыку</h3>
          </div>
          <small>✓ освоено · ◐ в процессе · ○ впереди</small>
        </header>
        <div className="knowledge-path">
          <span className="mastered">A1</span>
          {courseLessons.map((lesson, index) => {
            const state = progress[lesson.id];
            return (
              <div key={lesson.id}>
                <i>→</i>
                <span
                  className={
                    state?.completed ? 'mastered' : state?.done ? 'current' : ''
                  }
                >
                  {state?.completed ? '✓' : state?.done ? '◐' : '○'}{' '}
                  {lesson.title}
                </span>
                <i>→</i>
                <span
                  className={
                    state?.completed ? 'mastered' : state?.done ? 'current' : ''
                  }
                >
                  {index === 0
                    ? 'ser · профессии · артикли'
                    : index === 1
                      ? 'tener · семья · согласование'
                      : index === 2
                        ? 'presente · время · вопросы'
                        : index === 3
                          ? 'hay · estar · предлоги места'
                          : 'gustar · заказ · количество'}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ProgressView({ go }: { go: (s: Section) => void }) {
  const { progress } = useLessonProgress(),
    { profile } = useDeviceProfile(),
    completed = courseLessons.filter(
      (item) => progress[item.id]?.completed,
    ).length,
    totalDone = courseLessons.reduce(
      (sum, item) =>
        sum + Math.min(item.exercises.length, progress[item.id]?.done || 0),
      0,
    ),
    totalCorrect = courseLessons.reduce(
      (sum, item) =>
        sum +
        Math.min(progress[item.id]?.done || 0, progress[item.id]?.correct || 0),
      0,
    ),
    lessonAccuracy = totalDone
      ? Math.round((totalCorrect / totalDone) * 100)
      : 0,
    allAccuracy = profile.totalReviews
      ? Math.round((profile.totalCorrect / profile.totalReviews) * 100)
      : 0,
    nextLesson = courseLessons.find((item) => !progress[item.id]?.completed),
    lessonTotal = courseLessons.length,
    totalTasks = courseLessons.reduce(
      (sum, item) => sum + item.exercises.length,
      0,
    );
  return (
    <div className="view-stack progress-view">
      <ViewHead
        over="МОЙ КОШАЧИЙ ДОМ · ДАННЫЕ ПРОФИЛЯ"
        title="Прогресс, который хочется продолжать."
        copy="Уроки, память, ошибки и кошачий дом сохраняются в профиле, а после входа доступны на других устройствах."
      />
      <div className="progress-metrics">
        <article>
          <span>🐾</span>
          <b>
            {totalDone}
            <small>/{totalTasks}</small>
          </b>
          <p>заданий в уроках</p>
        </article>
        <article>
          <span>🏠</span>
          <b>
            {completed}
            <small>/{lessonTotal}</small>
          </b>
          <p>уроков завершено</p>
        </article>
        <article>
          <span>✨</span>
          <b>
            {lessonAccuracy}
            <small>%</small>
          </b>
          <p>точность в уроках</p>
        </article>
        <article>
          <span>🎯</span>
          <b>{profile.totalReviews}</b>
          <p>всего реальных ответов</p>
        </article>
        <article>
          <span>✅</span>
          <b>
            {allAccuracy}
            <small>%</small>
          </b>
          <p>точность по всему сайту</p>
        </article>
      </div>
      <MotivationCard />
      <div className="house-progress-page">
        <CatHouse level={completed} />
        <section className="house-status">
          <p className="eyebrow">
            ОБУСТРОЙСТВО · {completed} ИЗ {lessonTotal}
          </p>
          <h2>
            {completed === 0
              ? 'Начните первый урок'
              : completed === lessonTotal
                ? 'Дом полностью готов!'
                : 'Следующая вещь уже близко'}
          </h2>
          <p className="progress-copy">
            {completed === lessonTotal
              ? `Вы прошли всю стартовую дорожку из ${lessonTotal} уроков. Можно повторять задания и улучшать точность.`
              : nextLesson
                ? `Следующая награда — «${nextLesson.reward}». До неё осталось ${Math.max(0, nextLesson.exercises.length - (progress[nextLesson.id]?.done || 0))} заданий.`
                : ''}
          </p>
          <PawProgress done={totalDone} total={totalTasks} />
          <div className="house-rewards">
            {courseLessons.map((item) => {
              const itemProgress = progress[item.id] || {
                done: 0,
                completed: false,
                correct: 0,
              };
              return (
                <article
                  className={
                    itemProgress.completed
                      ? 'unlocked'
                      : itemProgress.done
                        ? 'in-progress'
                        : ''
                  }
                  key={item.id}
                >
                  <span>
                    {itemProgress.completed
                      ? '✓'
                      : itemProgress.done
                        ? '🐾'
                        : '🔒'}
                  </span>
                  <div>
                    <b>{item.reward}</b>
                    <small>{item.title}</small>
                    <div className="reward-track">
                      <i
                        style={{
                          width: `${Math.min(100, (itemProgress.done / item.exercises.length) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <strong>
                    {Math.min(item.exercises.length, itemProgress.done)}/
                    {item.exercises.length}
                  </strong>
                </article>
              );
            })}
          </div>
          <button
            className="primary-btn progress-action"
            onClick={() => go('Lessons')}
          >
            {completed === lessonTotal ? 'Повторить уроки' : 'Продолжить урок'}{' '}
            <ArrowRight />
          </button>
          {completed === lessonTotal && (
            <div className="cats-together">
              <CatMascot state="love" />
              <p>
                Все уроки завершены — оба котика сидят рядом в новом доме.
              </p>
            </div>
          )}
        </section>
      </div>
      <MemoryDashboard />
    </div>
  );
}

function AchievementsView({ go }: { go: (section: Section) => void }) {
  const achievements = useAchievements(),
    unlocked = achievements.filter((item) => item.unlocked),
    categories: AchievementCategory[] = [
      'Старт',
      'Регулярность',
      'Прогресс',
      'Мастерство',
      'Культура',
      'Секретные',
    ],
    next = achievements
      .filter((item) => !item.unlocked && !item.secret && item.current > 0)
      .sort((a, b) => b.current / b.target - a.current / a.target)[0];
  return (
    <div className="view-stack achievements-view">
      <header className="achievements-hero">
        <div>
          <p className="eyebrow">НАГРАДЫ · СОХРАНЯЮТСЯ В ПРОФИЛЕ</p>
          <h1>Tu colección de historias</h1>
          <p>
            Здесь отмечаются реальные учебные события: завершённые сессии,
            выученные слова, аудирование и регулярность.
          </p>
        </div>
        <div className="achievement-total">
          <Award />
          <b>{unlocked.length}</b>
          <span>из {achievements.length} открыто</span>
        </div>
      </header>
      {next && (
        <section className="next-achievement">
          <span>{next.icon}</span>
          <div>
            <small>БЛИЖАЙШАЯ НАГРАДА</small>
            <h2>{next.name}</h2>
            <p>{next.lockedMotto}</p>
            <div className="achievement-track">
              <i style={{ width: `${(next.current / next.target) * 100}%` }} />
            </div>
            <b>{next.current} / {next.target} · {next.description}</b>
          </div>
          <button onClick={() => go('Practice')}>Продолжить <ArrowRight /></button>
        </section>
      )}
      <div className="achievement-categories">
        {categories.map((category) => {
          const items = achievements.filter((item) => item.category === category);
          return (
            <section key={category}>
              <header>
                <h2>{category}</h2>
                <span>{items.filter((item) => item.unlocked).length} / {items.length}</span>
              </header>
              <div className="achievement-grid">
                {items.map((item) => {
                  const hidden = item.secret && !item.unlocked;
                  return (
                    <article className={item.unlocked ? 'unlocked' : 'locked'} key={item.id}>
                      <span className="achievement-icon">{hidden ? '❔' : item.icon}</span>
                      <div>
                        <small>{item.unlocked ? 'ОТКРЫТО' : hidden ? 'СЕКРЕТ' : 'ЕЩЁ ЗАКРЫТО'}</small>
                        <h3>{hidden ? '???' : item.name}</h3>
                        <em>{item.unlocked ? item.unlockedMotto : item.lockedMotto}</em>
                        <p>{hidden ? 'Условие откроется вместе с наградой.' : item.description}</p>
                        {!hidden && (
                          <>
                            <div className="achievement-track">
                              <i style={{ width: `${(item.current / item.target) * 100}%` }} />
                            </div>
                            <b>{item.current} / {item.target}</b>
                          </>
                        )}
                        {item.unlockedAt && (
                          <time dateTime={item.unlockedAt}>
                            Получено {new Date(item.unlockedAt).toLocaleDateString('ru-RU')}
                          </time>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <aside className="achievement-rules">
        <ShieldCheck />
        <div>
          <b>Награды нельзя получить простым просмотром экрана</b>
          <p>
            Сессия засчитывается только после последнего задания. Spanish Rush
            не меняет степень изученности слов; он влияет лишь на собственный
            рекорд и отдельную секретную награду.
          </p>
        </div>
      </aside>
    </div>
  );
}

const backupStorageKeys = BACKUP_KEYS;
const arrayBackupKeys = new Set<string>([
  'ritmo-content-favorites',
  'ritmo-custom-words',
  'ritmo-example-reports',
  'ritmo-exercise-reports',
  'ritmo-local-analytics',
  'ritmo-lesson-word-db',
  'ritmo-home-favorites',
]);
const backupFallback = (key: string) => key === 'ritmo-data-schema-version' ? 1
  : key === 'ritmo-report-migration' ? 0 : (arrayBackupKeys.has(key) ? [] : {});
function BackupPanel() {
  const inputRef = useRef<HTMLInputElement>(null),
    [status, setStatus] = useState<{
      kind: 'success' | 'error' | 'idle';
      text: string;
    }>({ kind: 'idle', text: '' });
  const createBackup = () => {
    try {
      const data = Object.fromEntries(
          backupStorageKeys.map((key) => {
            const fallback = backupFallback(key);
            try {
              return [key, JSON.parse(localStorage.getItem(key) || '')];
            } catch {
              return [key, fallback];
            }
          }),
        ) as RitmoBackup['data'],
        backup: RitmoBackup = {
          app: 'Ritmo Español',
          version: BACKUP_VERSION,
          exportedAt: new Date().toISOString(),
          data,
        },
        blob = new Blob([JSON.stringify(backup, null, 2)], {
          type: 'application/json',
        }),
        url = URL.createObjectURL(blob),
        link = document.createElement('a');
      link.href = url;
      link.download = `ritmo-espanol-backup-${localDateKey()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus({
        kind: 'success',
        text: 'Резервная копия создана. Сохраните JSON-файл в надёжном месте.',
      });
    } catch {
      setStatus({
        kind: 'error',
        text: 'Не удалось создать файл. Проверьте настройки загрузок браузера.',
      });
    }
  };
  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isValidBackup(parsed)) throw new Error('unsupported backup format');
      const date = new Date(parsed.exportedAt);
      if (
        !window.confirm(
          `Заменить текущий локальный прогресс данными из копии от ${date.toLocaleString('ru-RU')}?`,
        )
      ) {
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
      backupStorageKeys.forEach((key) => {
        const restored = parsed.data[key] ?? backupFallback(key);
        localStorage.setItem(key, JSON.stringify(restored));
      });
      setStatus({
        kind: 'success',
        text: 'Копия восстановлена. Обновляем профиль и прогресс…',
      });
      window.setTimeout(() => window.location.reload(), 650);
    } catch {
      setStatus({
        kind: 'error',
        text: 'Этот файл не является резервной копией Ritmo Español или повреждён.',
      });
      if (inputRef.current) inputRef.current.value = '';
    }
  };
  return (
    <section className="backup-panel">
      <div className="backup-copy">
        <span className="backup-icon">
          <ShieldCheck />
        </span>
        <div>
          <p className="eyebrow">РЕЗЕРВНАЯ КОПИЯ · БЕЗ РЕГИСТРАЦИИ</p>
          <h2>Перенесите обучение на другой компьютер</h2>
          <p>
            В JSON попадут профиль, уроки, словарь, интервальные повторения,
            ошибки и избранное. Паролей и данных аккаунта в файле нет.
          </p>
        </div>
      </div>
      <div className="backup-actions">
        <button className="backup-download" onClick={createBackup}>
          <Download />
          <span>
            <b>Создать резервную копию</b>
            <small>скачать JSON-файл</small>
          </span>
        </button>
        <button
          className="backup-upload"
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          <span>
            <b>Импортировать из файла</b>
            <small>заменить данные после подтверждения</small>
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={(event) => importBackup(event.target.files?.[0])}
          hidden
        />
      </div>
      <ol className="backup-steps">
        <li>
          <b>1</b> Создайте копию на старом устройстве
        </li>
        <li>
          <b>2</b> Передайте JSON-файл на новый компьютер
        </li>
        <li>
          <b>3</b> Откройте профиль и импортируйте файл
        </li>
      </ol>
      {status.kind !== 'idle' && (
        <output className={`backup-status ${status.kind}`}>
          {status.kind === 'success' ? '✓' : '!'} {status.text}
        </output>
      )}
    </section>
  );
}

function ReportedExamplesPanel() {
  const { reports, toggle } = useExampleReports();
  if (!reports.length) return null;
  return (
    <section className="reported-examples-panel">
      <header>
        <div>
          <p className="eyebrow">ПРИМЕРЫ ДЛЯ ПРОВЕРКИ</p>
          <h2>Вы отметили {reports.length}</h2>
        </div>
        <small>после входа отправляются автору сайта</small>
      </header>
      <div>
        {reports.map((report) => (
          <article key={report.id}>
            <span>{report.source}</span>
            <b>{report.word}</b>
            <p>{report.example}</p>
            <small>{report.translation}</small>
            <button onClick={() => toggle(report)}>Снять отметку</button>
          </article>
        ))}
      </div>
    </section>
  );
}

type ExerciseReport = {
  id: string;
  section: string;
  prompt: string;
  answer: string;
  options?: string[];
  createdAt: string;
};

function ReportedExercisesPanel() {
  const account = useAccount(),
    [reports, setReports] = useState<ExerciseReport[]>([]);
  useEffect(() => {
    const read = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('ritmo-exercise-reports') || '[]');
        setReports(Array.isArray(stored) ? stored : []);
      } catch {
        setReports([]);
      }
    };
    read();
    window.addEventListener('ritmo-exercise-reports', read);
    return () => window.removeEventListener('ritmo-exercise-reports', read);
  }, []);
  if (!reports.length) return null;
  const remove = (report: ExerciseReport) => {
    const next = reports.filter((item) => item.id !== report.id);
    localStorage.setItem('ritmo-exercise-reports', JSON.stringify(next));
    setReports(next);
    void account.reportContent({
      reportKey: report.id,
      kind: 'exercise',
      section: report.section,
      content: { prompt: report.prompt, answer: report.answer, options: report.options || [] },
      active: false,
    });
  };
  return (
    <section className="reported-examples-panel reported-exercises-panel">
      <header>
        <div>
          <p className="eyebrow">ЗАДАНИЯ ДЛЯ ПРОВЕРКИ</p>
          <h2>Вы отметили {reports.length}</h2>
        </div>
        <small>в аккаунте отправляются автору сайта</small>
      </header>
      <div>
        {reports.slice(0, 12).map((report) => (
          <article key={report.id}>
            <span>{report.section}</span>
            <b>{report.prompt}</b>
            <small>Ожидаемый ответ: {report.answer}</small>
            <button onClick={() => remove(report)}>Снять отметку</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function LearnedWordsPanel() {
  const { words } = useLearnedWordsDb(),
    { speakText } = useSpanishVoices(),
    groups = courseLessons
      .map((lesson) => ({
        lesson,
        words: words.filter((word) => word.lessonId === lesson.id),
      }))
      .filter((group) => group.words.length);
  return (
    <section className="learned-db-panel">
      <header>
        <div>
          <p className="eyebrow">ЛИЧНАЯ БАЗА СЛОВ</p>
          <h2>{words.length} основных слов из уроков</h2>
        </div>
        <small>используются для персонального диктанта</small>
      </header>
      {groups.length ? (
        <div>
          {groups.map(({ lesson, words: lessonWords }) => (
            <article key={lesson.id}>
              <span>
                {lesson.icon} Урок {lesson.number}
              </span>
              <h3>{lesson.title}</h3>
              <div>
                {lessonWords.map((word) => (
                  <button
                    key={word.id}
                    onClick={() => speakText(word.es, 1)}
                    title={`${word.example} — ${word.exampleRu}`}
                  >
                    <b>{word.es}</b>
                    <small>{word.ru}</small>
                    <Volume2 />
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="learned-db-empty">
          Откройте любой урок и начните практику — его основные слова появятся
          здесь автоматически.
        </p>
      )}
    </section>
  );
}

function AccountPanel({
  profileName,
  updateProfile,
}: {
  profileName: string;
  updateProfile: (patch: Partial<DeviceProfile>) => void;
}) {
  const account = useAccount(),
    [mode, setMode] = useState<'login' | 'register'>('register'),
    [name, setName] = useState(profileName),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');

  if (!account.configured)
    return (
      <section className="account-panel account-unconfigured">
        <div>
          <p className="eyebrow">ОБЛАЧНЫЙ АККАУНТ</p>
          <h2>Регистрация подготовлена</h2>
          <p>
            Добавьте публичные параметры Supabase в Cloudflare — после этого
            здесь автоматически появится форма входа.
          </p>
        </div>
        <ShieldCheck />
      </section>
    );

  if (account.user)
    return (
      <section className="account-panel account-connected">
        <div className="account-cloud-mark"><ShieldCheck /></div>
        <div>
          <p className="eyebrow">АККАУНТ · ОБЛАЧНОЕ СОХРАНЕНИЕ</p>
          <h2>{account.user.email}</h2>
          <p>{account.message}</p>
          <small>
            Уроки, словарь, SRS, достижения и незавершённая практика доступны
            после входа на другом устройстве.
          </small>
        </div>
        <div className="account-actions">
          <button disabled={account.status === 'syncing'} onClick={() => void account.syncNow()}>
            {account.status === 'syncing' ? 'Сохраняем…' : 'Сохранить сейчас'}
          </button>
          <button className="account-logout" onClick={() => void account.logout()}>
            Выйти
          </button>
        </div>
      </section>
    );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    if (mode === 'register') updateProfile({ name: name.trim() || 'Maya' });
    const result = mode === 'register'
      ? await account.register(name.trim() || 'Maya', email, password)
      : await account.login(email, password);
    setBusy(false);
    if (!result.ok) setNotice(result.message);
    else if (result.confirmationRequired) {
      setNotice('Проверьте почту и подтвердите регистрацию. Затем вернитесь и войдите.');
      setMode('login');
      setPassword('');
    } else setNotice('Готово. Загружаем ваш прогресс…');
  };

  return (
    <section className="account-panel account-auth">
      <header>
        <div>
          <p className="eyebrow">АККАУНТ RITMO</p>
          <h2>{mode === 'register' ? 'Сохраните прогресс в облаке' : 'С возвращением'}</h2>
          <p>
            {mode === 'register'
              ? 'Текущий прогресс с этого устройства будет перенесён в новый аккаунт.'
              : 'После входа сайт загрузит ваш прогресс и продолжит синхронизацию.'}
          </p>
        </div>
        <div className="account-mode">
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Регистрация
          </button>
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Вход
          </button>
        </div>
      </header>
      <form onSubmit={submit}>
        {mode === 'register' && (
          <label>
            <span>Имя</span>
            <input autoComplete="name" maxLength={50} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        )}
        <label>
          <span>Электронная почта</span>
          <input autoComplete="email" inputMode="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span>Пароль</span>
          <input autoComplete={mode === 'register' ? 'new-password' : 'current-password'} maxLength={128} minLength={8} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {mode === 'register' && <small>Минимум 8 символов.</small>}
        </label>
        <button className="primary-btn" disabled={busy} type="submit">
          {busy ? 'Подождите…' : mode === 'register' ? 'Создать аккаунт' : 'Войти'}
        </button>
      </form>
      {notice && <p className="account-notice" role="status">{notice}</p>}
      <small className="account-privacy">
        Пароль обрабатывает Supabase Auth; Ritmo Español его не сохраняет и не видит.
      </small>
    </section>
  );
}

function ProfileView() {
  const { profile, update } = useDeviceProfile(),
    account = useAccount(),
    { words: customWords } = useCustomWords(),
    { records } = useSRS(),
    { items: contentFavorites } = useContentFavorites(),
    [editing, setEditing] = useState(false),
    [draftName, setDraftName] = useState(profile.name);
  useEffect(() => setDraftName(profile.name), [profile.name]);
  const favoriteRecords = Object.entries(records).filter(
      ([, record]) => record.favorite,
    ),
    days = Array.from({ length: 28 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (27 - index));
      return localDateKey(date);
    }),
    accuracy = profile.totalReviews
      ? Math.round((profile.totalCorrect / profile.totalReviews) * 100)
      : 0;
  return (
    <div className="view-stack profile-view">
      <header className="profile-hero">
        <div className="profile-avatar">
          {(profile.name || 'M').slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p className="eyebrow">
            {account.user ? 'ОБЛАЧНЫЙ ПРОФИЛЬ' : 'ПРОФИЛЬ НА УСТРОЙСТВЕ'} · {profile.level}
          </p>
          {editing ? (
            <input
              className="profile-name-input"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
            />
          ) : (
            <h1>{profile.name || 'Maya'}</h1>
          )}
          <p>
            {account.user
              ? `Прогресс привязан к ${account.user.email} и синхронизируется между устройствами.`
              : 'Без входа данные остаются только в этом браузере.'}
          </p>
        </div>
        <button
          onClick={() => {
            if (editing) update({ name: draftName.trim() || 'Maya' });
            setEditing(!editing);
          }}
        >
          {editing ? 'Сохранить' : 'Изменить профиль'}
        </button>
      </header>
      <AccountPanel profileName={profile.name} updateProfile={update} />
      <div className="profile-stats">
        <article>
          <Flame />
          <div>
            <b>{profile.streak}</b>
            <span>{russianDayWord(profile.streak)} подряд</span>
          </div>
          <small>рекорд {profile.longestStreak}</small>
        </article>
        <article>
          <Sparkles />
          <div>
            <b>{profile.xp}</b>
            <span>XP</span>
          </div>
          <small>{profile.totalReviews} ответов</small>
        </article>
        <article>
          <Award />
          <div>
            <b>{accuracy}%</b>
            <span>точность</span>
          </div>
          <small>{profile.totalCorrect} верных</small>
        </article>
        <article>
          <Heart />
          <div>
            <b>{favoriteRecords.length + contentFavorites.length}</b>
            <span>в избранном</span>
          </div>
          <small>слова и примеры</small>
        </article>
      </div>
      <section className="daily-system">
        <header>
          <div>
            <p className="eyebrow">ЕЖЕДНЕВНЫЕ ЗАХОДЫ</p>
            <h2>
              {profile.streak
                ? `${profile.streak} ${russianDayWord(profile.streak)} в ритме`
                : 'Первый день начинается сейчас'}
            </h2>
          </div>
          <div className="goal-choice daily-answer-goal">
            <span>Цель на день</span>
            <b>16 реальных ответов</b>
          </div>
        </header>
        <div className="activity-calendar">
          {days.map((day) => (
            <span
              className={profile.activeDays.includes(day) ? 'active' : ''}
              title={day}
              key={day}
            >
              <i />
              {new Date(`${day}T12:00:00`)
                .toLocaleDateString('ru-RU', { weekday: 'short' })
                .slice(0, 1)}
            </span>
          ))}
        </div>
        <p>
          Заход засчитывается один раз в календарный день. Если вернуться завтра
          — серия продолжится; после пропущенного дня начнётся новая.
        </p>
      </section>
      <LearnedWordsPanel />
      <BackupPanel />
      <ReportedExamplesPanel />
      <ReportedExercisesPanel />
      <Suspense fallback={<section className="analytics-panel">Загружаем локальную аналитику…</section>}>
        <AnalyticsPanel />
      </Suspense>
      <section className="favorites-panel">
        <header>
          <div>
            <p className="eyebrow">ИЗБРАННОЕ</p>
            <h2>Сложные слова и примеры</h2>
          </div>
          <small>
            {favoriteRecords.length + contentFavorites.length} сохранено
          </small>
        </header>
        {favoriteRecords.length || contentFavorites.length ? (
          <div>
            {contentFavorites.slice(0, 4).map((item) => (
              <article key={item.id}>
                <span>{item.type}</span>
                <b>{item.title}</b>
                <p>{item.body}</p>
                <small>из урока</small>
              </article>
            ))}
            {favoriteRecords.slice(0, 8).map(([key, record]) => {
              const card = makeStudyDeck(customWords).find(
                (item) => item.key === key,
              );
              return card ? (
                <article key={key}>
                  <span>{skillLabels[card.skill]}</span>
                  <b>{card.es}</b>
                  <p>
                    {card.ru} · {card.example}
                  </p>
                  <small>сложность {record.difficulty.toFixed(1)}</small>
                </article>
              ) : null;
            })}
          </div>
        ) : (
          <div className="favorites-empty">
            <Heart />
            <p>
              Нажимайте сердечко в повторении — сложные слова и примеры появятся
              здесь.
            </p>
          </div>
        )}
      </section>
      <MemoryDashboard />
    </div>
  );
}

function ViewHead({
  over,
  title,
  copy,
}: {
  over: string;
  title: string;
  copy?: string;
}) {
  return (
    <header className="view-header">
      <p className="eyebrow">{over}</p>
      <h1>{title}</h1>
      {copy && <p>{copy}</p>}
    </header>
  );
}

function LearnedAchievementToast() {
  const [word, setWord] = useState('');
  useEffect(() => {
    let timer = 0;
    const show = (event: Event) => {
      const learnedWord =
        (event as CustomEvent<{ word?: string }>).detail?.word || 'Новое слово';
      setWord(learnedWord);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setWord(''), 4500);
      localStorage.removeItem('ritmo-latest-achievement');
    };
    window.addEventListener('ritmo-word-learned', show);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('ritmo-word-learned', show);
    };
  }, []);
  if (!word) return null;
  return (
    <output className="word-achievement">
      <span>🏆</span>
      <div>
        <b>Слово действительно выучено!</b>
        <p>{word} закреплено в узнавании и активном переводе.</p>
      </div>
    </output>
  );
}

function AchievementUnlockToast({
  openAchievements,
}: {
  openAchievements: () => void;
}) {
  const [achievement, setAchievement] =
      useState<AchievementDefinition | null>(null),
    [flying, setFlying] = useState(false);
  useEffect(() => {
    let flyTimer = 0,
      closeTimer = 0;
    const show = (event: Event) => {
      const next = (event as CustomEvent<AchievementDefinition>).detail;
      if (!next) return;
      window.clearTimeout(flyTimer);
      window.clearTimeout(closeTimer);
      setAchievement(next);
      setFlying(false);
      playCelebrationSound('achievement');
      flyTimer = window.setTimeout(() => setFlying(true), 3400);
      closeTimer = window.setTimeout(() => {
        setAchievement(null);
        setFlying(false);
      }, 4850);
    };
    window.addEventListener('ritmo-achievement-unlocked', show);
    return () => {
      window.clearTimeout(flyTimer);
      window.clearTimeout(closeTimer);
      window.removeEventListener('ritmo-achievement-unlocked', show);
    };
  }, []);
  if (!achievement) return null;
  return (
    <button
      className={`achievement-unlock-toast ${flying ? 'flying' : ''}`}
      onClick={openAchievements}
      aria-label={`Открыть достижение ${achievement.name}`}
    >
      <span className="achievement-toast-cat" aria-hidden="true">
        <i>🐱</i><em>🐾</em>
      </span>
      <article>
        <small>НОВОЕ ДОСТИЖЕНИЕ</small>
        <b>{achievement.icon} {achievement.name}</b>
        <p>{achievement.unlockedMotto}</p>
      </article>
    </button>
  );
}

function LoadingScreen() {
  return (
    <output
      className="loading-screen"
      aria-label="Ritmo Español загружается"
    >
      <div className="loading-sun" />
      <div className="loading-logo">
        <span>R</span>
        <h1>
          Ritmo <em>Español</em>
        </h1>
        <p>Preparando tu aventura…</p>
        <div>
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="loading-wave" />
    </output>
  );
}

function RitmoApp() {
  const [section, setSection] = useState<Section>('Home'),
    [dark, setDark] = useState(true),
    [open, setOpen] = useState(false),
    [loading, setLoading] = useState(true);
  const { profile } = useDeviceProfile(true);
  const account = useAccount();
  const navigate = (next: Section, replace = false) => {
    const hash = `#${next.toLowerCase()}`;
    if (window.location.hash !== hash)
      window.history[replace ? 'replaceState' : 'pushState'](null, '', hash);
    setSection(next);
    setOpen(false);
  };
  useEffect(() => {
    const syncFromAddress = () => {
      const requested = window.location.hash.slice(1).toLowerCase();
      const target = nav.find(
        (item) => item.name.toLowerCase() === requested,
      )?.name;
      navigate(target || 'Home', !target);
    };
    syncFromAddress();
    window.addEventListener('popstate', syncFromAddress);
    window.addEventListener('hashchange', syncFromAddress);
    return () => {
      window.removeEventListener('popstate', syncFromAddress);
      window.removeEventListener('hashchange', syncFromAddress);
    };
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1450);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    evaluateAchievements(false);
  }, []);
  useEffect(() => {
    const audit = auditVocabularyPracticeSync();
    document.documentElement.dataset.vocabularyPracticeSync = audit.issues.length
      ? `errors:${audit.issues.length}`
      : `ok:${audit.vocabularyWords}:${audit.practiceVocabularyCards}`;
    if (audit.issues.length)
      console.error('Vocabulary ↔ Practice sync errors', audit.issues);
  }, []);
  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const sections = nav.map((n) => n.name);
    void Promise.resolve(
      context.registerTool(
        {
          name: 'open_learning_section',
          title: 'Open learning section',
          description:
            'Navigate the visible Ritmo Español app to a specific learning section.',
          inputSchema: {
            type: 'object',
            properties: { section: { type: 'string', enum: sections } },
            required: ['section'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input: unknown) {
            const value = (input as { section?: unknown })?.section;
            if (
              typeof value !== 'string' ||
              !sections.includes(value as Section)
            )
              throw new Error('Unknown learning section');
            navigate(value as Section);
            return { section: value, status: 'opened' };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  const views: { [K in Section]: React.ReactNode } = {
    Home: <HomeView go={navigate} profile={profile} />,
    Learn: <LearnView go={navigate} />,
    Lessons: <LessonsView />,
    Vocabulary: <VocabularyView />,
    Grammar: <GrammarView />,
    Music: <MusicView />,
    Practice: <PracticeHub />,
    Dictation: <DictationView />,
    Progress: <ProgressView go={navigate} />,
    Achievements: <AchievementsView go={navigate} />,
    Profile: <ProfileView />,
  };
  const mobile = nav.filter((n) =>
    ['Home', 'Lessons', 'Learn', 'Music', 'Practice', 'Profile'].includes(
      n.name,
    ),
  );
  return (
    <>
      {loading && <LoadingScreen />}
      <LearnedAchievementToast />
      <AchievementUnlockToast
        openAchievements={() => navigate('Achievements')}
      />
      <div className={dark ? 'app dark' : 'app'}>
        <aside className={open ? 'sidebar open' : 'sidebar'}>
          <button className="brand" aria-label="На главную" onClick={() => navigate('Home')}>
            <span>R</span>
            <b>
              Ritmo<em>Español</em>
            </b>
          </button>
          <nav>
            {nav.map((n) => {
              const Icon = n.icon;
              return (
                <button
                  key={n.name}
                  className={section === n.name ? 'active' : ''}
                  onClick={() => {
                    navigate(n.name);
                  }}
                >
                  <Icon />
                  <span>{n.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="sidebar-card cat-sidebar">
            <CatMascot state="neutral" small />
            <b>Котик ждёт урок</b>
            <p>Откройте «Уроки» и обустройте его дом.</p>
          </div>
          <button
            className="profile-mini"
            onClick={() => navigate('Profile')}
          >
            <span>{(profile.name || 'M').slice(0, 1).toUpperCase()}</span>
            <div>
              <b>{profile.name || 'Maya'}</b>
              <small>{profile.level} · {account.user ? 'в облаке' : 'локально'}</small>
            </div>
            <ChevronRight />
          </button>
        </aside>
        <main className="main">
          <header className="topbar">
            <button className="menu-btn" aria-label="Открыть меню" onClick={() => setOpen(!open)}>
              <Menu />
            </button>
            <div className="breadcrumbs">
              <span>Ritmo Español</span>
              <ChevronRight />
              <b>{nav.find((item) => item.name === section)?.label}</b>
            </div>
            <div className="top-actions">
              <button className="xp-pill" aria-label="Открыть прогресс" onClick={() => navigate('Progress')}>
                <Sparkles />
                {profile.xp} XP
              </button>
              <button className="icon-btn" aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'} onClick={() => setDark(!dark)}>
                {dark ? <Sun /> : <Moon />}
              </button>
              <button
                className="avatar-btn"
                aria-label="Открыть профиль"
                onClick={() => navigate('Profile')}
              >
                {(profile.name || 'M').slice(0, 1).toUpperCase()}
                <span />
              </button>
            </div>
          </header>
          <div className="content">{views[section]}</div>
        </main>
        <nav className="mobile-nav">
          {mobile.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.name}
                className={section === n.name ? 'active' : ''}
                onClick={() => navigate(n.name)}
              >
                <Icon />
                <span>
                  {n.name === 'Home'
                    ? 'Главная'
                    : n.name === 'Learn'
                      ? 'Старт'
                      : n.name === 'Lessons'
                        ? 'Уроки'
                        : n.name === 'Music'
                          ? 'Музыка'
                          : n.name === 'Practice'
                            ? 'Практика'
                            : 'Профиль'}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <AccountProvider>
      <RitmoApp />
    </AccountProvider>
  );
}
