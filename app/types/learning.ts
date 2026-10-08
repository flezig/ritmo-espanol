import type { VocabularyLevel } from '../vocabulary';
import type { ProfileGender } from '../lib/profile-ranks';
import type { AchievementStats } from '../lib/achievements';
import type { LessonErrorAttempt } from '../lib/lesson-errors';
import type {
  AnswerAnalysis,
  SRSRecord,
  WordStatus,
} from '../lib/learning-core';
import type { WordSessionRecord } from '../lib/word-sessions';

export type Section =
  | 'Home'
  | 'Learn'
  | 'Lessons'
  | 'Kespa'
  | 'Vocabulary'
  | 'Grammar'
  | 'DeleB2'
  | 'Music'
  | 'Practice'
  | 'Dictation'
  | 'Progress'
  | 'Achievements'
  | 'Profile';

export type SitePreferences = {
  animations: boolean;
  sounds: boolean;
  autoSpeak: boolean;
  reviewNotifications: boolean;
};

export type SkillType =
  | 'recognition'
  | 'production'
  | 'article'
  | 'context'
  | 'listening'
  | 'dictation';

export type StudyCard = {
  key: string;
  topic: string;
  level?: VocabularyLevel | 'Личное' | 'Урок';
  core?: boolean;
  es: string;
  ru: string;
  example: string;
  exampleRu?: string;
  extraExample?: string;
  extraExampleRu?: string;
  units?: string[];
  lessonIds?: string[];
  skill: SkillType;
  answer: string;
  prompt: string;
};

export type CustomWord = {
  id: string;
  es: string;
  ru: string;
  example: string;
  exampleRu: string;
  extraExample: string;
  extraExampleRu: string;
};

export type ExampleReport = {
  id: string;
  word: string;
  example: string;
  translation: string;
  source: string;
  createdAt: string;
};

export type LessonWord = {
  es: string;
  ru: string;
  example: string;
  exampleRu: string;
};

export type LearnedWordRecord = LessonWord & {
  id: string;
  lessonId: string;
  lessonTitle: string;
  firstStudiedAt: string;
  lastStudiedAt: string;
};

export type WordHistoryRecord = {
  firstStudiedAt?: string;
  learnedAt?: string;
  lastChangedAt: string;
};

export type DeviceProfile = {
  name: string;
  gender: ProfileGender;
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

export type AchievementCategory =
  | 'Старт'
  | 'Регулярность'
  | 'Прогресс'
  | 'Мастерство'
  | 'Культура'
  | 'Секретные';

export type AchievementDefinition = {
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

export type AchievementContext = {
  stats: AchievementStats;
  profile: DeviceProfile;
  learnedWords: number;
  rushBest: number;
};

export type AchievementUnlock = { unlockedAt: string };

export type ContentFavorite = {
  id: string;
  type: 'правило' | 'пример';
  title: string;
  body: string;
};

export type CatState =
  | 'neutral'
  | 'thinking'
  | 'happy'
  | 'wrong'
  | 'sleeping'
  | 'love';

export type LessonState = {
  errorHistory?: Record<string, LessonErrorAttempt>;
  contentVersion?: string;
  done: number;
  completed: boolean;
  correct: number;
  errors?: number[];
  errorIds?: string[];
  lastExerciseId?: string;
};

export type LessonProgress = Record<string, LessonState>;

export type DailyChallenge = {
  id: string;
  instruction: string;
  prompt: string;
  answer: string;
  options: string[];
  explanation: string;
};

export type DailyChallengeCompletion = {
  challenge: DailyChallenge;
  answer: string;
  correct: boolean;
  completedAt: string;
};

export type QuizQuestion = {
  kind: string;
  prompt: string;
  options: string[];
  answer: string;
  tip: string;
};

export type SongRound = {
  kind: string;
  prompt: string;
  options?: string[];
  answer: string;
  tip: string;
  clip?: { start: number; end: number };
};

export type SessionMode = 'five' | 'errors' | 'favorites';

type SavedSessionMode = SessionMode | 'fifteen' | 'weak';

export type PracticeLevel = VocabularyLevel | 'Все уровни';

export type PracticeCollection = 'topics' | 'units' | 'lessons';

export type PracticeProgressBaseline = {
  srs: Record<string, SRSRecord | null>;
  wordProgress: Record<string, WordStatus | null>;
  wordHistory: Record<string, WordHistoryRecord | null>;
  wordSessions: Record<string, WordSessionRecord | null>;
  deviceProfile: string | null;
  achievementStats: string | null;
  achievementUnlocks: string | null;
  errorProfile: string | null;
  latestAchievement: string | null;
};

export type SavedPracticeSession = {
  version: 2 | 3 | 4 | 5;
  mode: SavedSessionMode;
  level?: PracticeLevel;
  collection?: PracticeCollection;
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
  awaitingStart?: boolean;
  baseline?: PracticeProgressBaseline | null;
  sessionId?: string;
};

export type ResponseKind =
  | 'choice'
  | 'type'
  | 'self'
  | 'order'
  | 'letters'
  | 'phrase'
  | 'correction'
  | 'audioWord'
  | 'audioSentence';

export type DetectiveLevel = 'A1' | 'A2';

type DetectiveQuestion = {
  kind: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type DetectiveCase = {
  title: string;
  text: string;
  translation: string;
  ending: string;
  questions: DetectiveQuestion[];
};

export type ExerciseReport = {
  id: string;
  section: string;
  prompt: string;
  answer: string;
  options?: string[];
  createdAt: string;
};

export type GlobalSearchItem = {
  id: string;
  kind: 'Слово' | 'Урок' | 'Правило' | 'Песня';
  title: string;
  description: string;
  search: string;
  section: Section;
  focus?: string;
};
