import { createEmptyCard, fsrs, Rating, State, type CardInput } from 'ts-fsrs';

export type WordStatus = 'new' | 'learning' | 'learned' | 'difficult';
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

export type SRSRecord = {
  difficulty: number;
  stability: number;
  lastReview: number;
  nextReview: number;
  lapses: number;
  correctStreak: number;
  reviews: number;
  successes: number;
  favorite: boolean;
  lastGrade: ReviewGrade;
  /** Present only after this card has naturally moved to FSRS. */
  scheduler?: 'fsrs-6';
  fsrsState?: number;
  scheduledDays?: number;
  learningSteps?: number;
};

export type AnswerAnalysis = {
  correct: boolean;
  kind: 'exact' | 'accent' | 'article' | 'ending' | 'order' | 'typo' | 'wrong';
  message: string;
};

export const DAY_MS = 86_400_000;

export const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const previousLocalDateKey = (now = new Date()) => {
  const date = new Date(now);
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
};

export const nextStreak = (
  lastVisit: string,
  currentStreak: number,
  activeDays: string[],
  now = new Date(),
) => {
  const today = localDateKey(now);
  if (activeDays.includes(today)) return Math.max(1, currentStreak);
  return lastVisit === previousLocalDateKey(now) ? currentStreak + 1 : 1;
};

export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const hasOnlySpanishMarkDifference = (value: string, answer: string) =>
  normalizeText(value) === normalizeText(answer) && comparisonText(value) !== comparisonText(answer);

const comparisonText = (value: string) =>
  value
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const editDistance = (a: string, b: string) => {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let previous = rows[0];
    rows[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const saved = rows[i];
      rows[i] = Math.min(
        rows[i] + 1,
        rows[i - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = saved;
    }
  }
  return rows[a.length];
};

export const analyzeAnswer = (value: string, answer: string): AnswerAnalysis => {
  const variants = answer
    .split(/\s*(?:;|\|)\s*|\s+\/\s+/u)
    .map((item) => item.trim())
    .filter(Boolean);
  if (variants.length > 1) {
    const results = variants.map((variant) => analyzeAnswer(value, variant));
    const accepted = results.find((result) => result.correct);
    if (accepted) return accepted;
    const mostHelpful = results.find((result) => result.kind !== 'wrong');
    if (mostHelpful) return mostHelpful;
  }
  const raw = comparisonText(value);
  const target = comparisonText(answer);
  const plain = normalizeText(value);
  const expected = normalizeText(answer);
  if (raw === target)
    return { correct: true, kind: 'exact', message: 'Точное написание.' };
  if (plain === expected)
    return {
      correct: true,
      kind: 'accent',
      message: 'Ответ засчитан. Проверьте ударение или ñ; пунктуация не учитывается.',
    };
  const articles = /^(el|la|los|las|un|una|unos|unas)\s+/;
  if (plain.replace(articles, '') === expected.replace(articles, ''))
    return {
      correct: false,
      kind: 'article',
      message: `Слово верное, но нужен правильный артикль: «${answer}».`,
    };
  const words = plain.split(/\s+/);
  const expectedWords = expected.split(/\s+/);
  if (
    words.length > 1 &&
    words.length === expectedWords.length &&
    words.toSorted().join(' ') === expectedWords.toSorted().join(' ')
  )
    return {
      correct: false,
      kind: 'order',
      message: 'Все слова найдены, но их нужно поставить в другом порядке.',
    };
  const distance = editDistance(plain, expected);
  if (distance <= 2)
    return {
      correct: false,
      kind: /(o|a|os|as|e|es)$/.test(expected) ? 'ending' : 'typo',
      message:
        distance === 1
          ? 'Почти верно: одна буква отличается.'
          : 'Похоже на опечатку: отличаются две буквы.',
    };
  if (plain.length <= 2 && expected.length >= 5)
    return {
      correct: false,
      kind: 'wrong',
      message: `Ответ слишком короткий. Ожидается «${answer}».`,
    };
  return {
    correct: false,
    kind: 'wrong',
    message: `Введённый ответ не соответствует «${answer}».`,
  };
};

export const blankSRS = (): SRSRecord => ({
  difficulty: 5,
  stability: 0,
  nextReview: 0,
  lastReview: 0,
  lapses: 0,
  correctStreak: 0,
  reviews: 0,
  successes: 0,
  favorite: false,
  lastGrade: 'again',
});

const fsrsScheduler = fsrs({
  request_retention: 0.9,
  maximum_interval: 36_500,
  enable_fuzz: false,
  enable_short_term: true,
  learning_steps: ['10m'],
  relearning_steps: ['10m'],
});
const fsrsRating = (grade: ReviewGrade) =>
  grade === 'again'
    ? Rating.Again
    : grade === 'hard'
      ? Rating.Hard
      : grade === 'easy'
        ? Rating.Easy
        : Rating.Good;

const fsrsCardFromRecord = (record: SRSRecord | undefined, now: number): CardInput => {
  if (!record) return createEmptyCard(new Date(now));
  const legacyScheduledDays = Math.max(
    0.1,
    (record.nextReview - record.lastReview) / DAY_MS,
  );
  return {
    due: new Date(record.nextReview || now),
    stability: Math.max(0.1, record.stability || legacyScheduledDays),
    difficulty: Math.max(1, record.difficulty || 5),
    elapsed_days: record.lastReview
      ? Math.max(0, Math.round((now - record.lastReview) / DAY_MS))
      : 0,
    scheduled_days: record.scheduledDays || Math.max(0, Math.round(legacyScheduledDays)),
    learning_steps: record.learningSteps || 0,
    reps: record.reviews,
    lapses: record.lapses,
    state: record.fsrsState ?? (record.reviews ? State.Review : State.New),
    last_review: record.lastReview ? new Date(record.lastReview) : undefined,
  };
};

export const scheduleReview = (
  current: SRSRecord | undefined,
  grade: ReviewGrade,
  now = Date.now(),
): SRSRecord => {
  const old = current || blankSRS();
  const success = grade !== 'again';
  const result = fsrsScheduler.next(
    fsrsCardFromRecord(current, now),
    new Date(now),
    fsrsRating(grade),
  ).card;
  return {
    ...old,
    difficulty: result.difficulty,
    stability: result.stability,
    lastReview: now,
    nextReview: result.due.getTime(),
    lapses: old.lapses + (success ? 0 : 1),
    correctStreak: success ? old.correctStreak + 1 : 0,
    reviews: old.reviews + 1,
    successes: old.successes + (success ? 1 : 0),
    lastGrade: grade,
    scheduler: 'fsrs-6',
    fsrsState: result.state,
    scheduledDays: result.scheduled_days,
    learningSteps: result.learning_steps,
  };
};

export const baseCardKey = (key: string) =>
  key.replace(/-(recognition|production|context|listening|dictation|article)$/, '');

export const masteredRecord = (record?: SRSRecord) =>
  !!record &&
  record.reviews >= 3 &&
  record.correctStreak >= 2 &&
  record.stability >= 3 &&
  record.successes / record.reviews >= 0.75;

export const derivedWordStatus = (
  base: string,
  records: Record<string, SRSRecord>,
  saved: WordStatus = 'new',
): WordStatus => {
  const related = Object.entries(records).filter(
    ([key, record]) => baseCardKey(key) === base && record.reviews > 0,
  );
  const failures = related.reduce((sum, [, record]) => sum + record.lapses, 0);
  if (masteredRecord(records[`${base}-recognition`]) && masteredRecord(records[`${base}-production`]))
    return 'learned';
  if (failures >= 2 || saved === 'difficult') return 'difficult';
  if (related.length || saved === 'learning') return 'learning';
  return 'new';
};
