export type LearningSkill = 'translation' | 'production' | 'listening' | 'dictation';

export type LearningInsightBucket = {
  answers: number;
  correct: number;
  errors: number;
  totalResponseMs: number;
  hints: number;
  lastAnsweredAt: string;
};

export type LearningInsights = {
  version: 1;
  overall: LearningInsightBucket;
  skills: Partial<Record<LearningSkill, LearningInsightBucket>>;
  topics: Record<string, LearningInsightBucket>;
  lessonRules: Record<string, Record<string, LearningInsightBucket>>;
};

export type LearningInsightAnswer = {
  correct: boolean;
  responseMs: number;
  hints?: number;
  skill?: LearningSkill;
  topic?: string;
  lessonId?: string;
  rule?: string;
};

export const LEARNING_INSIGHTS_KEY = 'ritmo-learning-insights';

const emptyBucket = (): LearningInsightBucket => ({
  answers: 0,
  correct: 0,
  errors: 0,
  totalResponseMs: 0,
  hints: 0,
  lastAnsweredAt: '',
});

const emptyInsights = (): LearningInsights => ({
  version: 1,
  overall: emptyBucket(),
  skills: {},
  topics: {},
  lessonRules: {},
});

const safeBucket = (value?: Partial<LearningInsightBucket>): LearningInsightBucket => ({
  answers: Math.max(0, Number(value?.answers) || 0),
  correct: Math.max(0, Number(value?.correct) || 0),
  errors: Math.max(0, Number(value?.errors) || 0),
  totalResponseMs: Math.max(0, Number(value?.totalResponseMs) || 0),
  hints: Math.max(0, Number(value?.hints) || 0),
  lastAnsweredAt: typeof value?.lastAnsweredAt === 'string' ? value.lastAnsweredAt : '',
});

const updateBucket = (bucket: LearningInsightBucket | undefined, answer: LearningInsightAnswer) => {
  const current = safeBucket(bucket);
  return {
    answers: current.answers + 1,
    correct: current.correct + Number(answer.correct),
    errors: current.errors + Number(!answer.correct),
    totalResponseMs: current.totalResponseMs + Math.min(Math.max(0, Math.round(answer.responseMs)), 30 * 60_000),
    hints: current.hints + Math.max(0, Math.round(answer.hints || 0)),
    lastAnsweredAt: new Date().toISOString(),
  };
};

export const readLearningInsights = (): LearningInsights => {
  if (typeof localStorage === 'undefined') return emptyInsights();
  try {
    const value = JSON.parse(localStorage.getItem(LEARNING_INSIGHTS_KEY) || 'null') as Partial<LearningInsights> | null;
    if (!value || value.version !== 1) return emptyInsights();
    return {
      version: 1,
      overall: safeBucket(value.overall),
      skills: value.skills || {},
      topics: value.topics || {},
      lessonRules: value.lessonRules || {},
    };
  } catch {
    return emptyInsights();
  }
};

export const recordLearningInsight = (answer: LearningInsightAnswer) => {
  if (typeof localStorage === 'undefined') return;
  const current = readLearningInsights();
  const next: LearningInsights = {
    ...current,
    overall: updateBucket(current.overall, answer),
    skills: { ...current.skills },
    topics: { ...current.topics },
    lessonRules: { ...current.lessonRules },
  };
  if (answer.skill) next.skills[answer.skill] = updateBucket(current.skills[answer.skill], answer);
  if (answer.topic) next.topics[answer.topic] = updateBucket(current.topics[answer.topic], answer);
  if (answer.lessonId && answer.rule) {
    const rules = { ...current.lessonRules[answer.lessonId] };
    rules[answer.rule] = updateBucket(rules[answer.rule], answer);
    next.lessonRules[answer.lessonId] = rules;
  }
  localStorage.setItem(LEARNING_INSIGHTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('ritmo-cloud-progress-changed'));
};
