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
  return {
    correct: false,
    kind: 'wrong',
    message: 'Ответ отличается по смыслу или форме. Сравните его с образцом.',
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

export const scheduleReview = (
  current: SRSRecord | undefined,
  grade: ReviewGrade,
  now = Date.now(),
): SRSRecord => {
  const old = current || blankSRS();
  const elapsed = old.lastReview ? Math.max(0.01, (now - old.lastReview) / DAY_MS) : 0;
  const retrievability = old.stability ? Math.exp(-elapsed / old.stability) : 0;
  const success = grade !== 'again';
  const difficulty = Math.max(
    1,
    Math.min(
      10,
      old.difficulty +
        (grade === 'again' ? 1.1 : grade === 'hard' ? 0.35 : grade === 'easy' ? -0.55 : -0.18),
    ),
  );
  let stability = old.stability;
  if (grade === 'again') stability = Math.max(0.08, stability * 0.42);
  else if (!stability) stability = grade === 'easy' ? 3 : grade === 'hard' ? 0.5 : 1;
  else
    stability = Math.max(
      0.5,
      stability *
        (grade === 'hard'
          ? 1.25
          : grade === 'good'
            ? 1.75 + 0.35 * (1 - retrievability)
            : 2.65 + 0.5 * (1 - retrievability)) *
        (1 + (6 - difficulty) * 0.035),
    );
  const interval = grade === 'again' ? 10 / 1440 : grade === 'hard' ? Math.max(0.5, stability * 0.7) : stability;
  return {
    ...old,
    difficulty,
    stability,
    lastReview: now,
    nextReview: now + interval * DAY_MS,
    lapses: old.lapses + (success ? 0 : 1),
    correctStreak: success ? old.correctStreak + 1 : 0,
    reviews: old.reviews + 1,
    successes: old.successes + (success ? 1 : 0),
    lastGrade: grade,
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
