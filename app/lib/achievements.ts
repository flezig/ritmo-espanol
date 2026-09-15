export type AchievementStats = {
  practiceSessions: number;
  practiceModeSessions: Record<string, number>;
  practiceCorrect: number;
  practiceTotal: number;
  practiceCorrectByMode: Record<string, number>;
  practiceTotalByMode: Record<string, number>;
  musicPracticeSessions: number;
  songSessions: number;
  songSessionsById: Record<string, number>;
  songCorrect: number;
  songTotal: number;
  songCorrectById: Record<string, number>;
  songTotalById: Record<string, number>;
  dictationSessions: number;
  dictationCorrect: number;
  dictationTotal: number;
  detectiveSessions: Record<string, number>;
  detectiveCorrect: number;
  detectiveTotal: number;
  detectiveCorrectByLevel: Record<string, number>;
  detectiveTotalByLevel: Record<string, number>;
  perfectSessions: number;
  listeningCorrect: number;
  pronunciationCorrect: number;
  nightSessions: number;
  morningSessions: number;
  placementTests: number;
  placementLevels: Array<'A1' | 'A2' | 'B1' | 'B2' | 'C1'>;
  rushSessions: number;
  rushSeconds: number;
  rushTotalScore: number;
  rushBestScore: number;
  articleSessions: number;
  articlePerfectSessions: number;
  articleCorrect: number;
  articleTotal: number;
  dailyChallengeDays: string[];
  dailyPlanDays: string[];
  lessonIds: string[];
  topicSessions: Record<string, number>;
};

export type AchievementEvent =
  | { type: 'practice-session'; topic: string; perfect: boolean; mode?: string; correct?: number; total?: number }
  | { type: 'song-session'; songId?: string; correct?: number; total?: number }
  | { type: 'dictation-session'; correct: number; total: number }
  | { type: 'detective-session'; level: string; correct: number; total: number }
  | { type: 'lesson-complete'; lessonId: string }
  | { type: 'listening-correct' }
  | { type: 'pronunciation-correct' }
  | { type: 'rush-session'; score: number; seconds: number }
  | { type: 'article-session'; score: number; total: number }
  | { type: 'placement-test-complete'; level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' }
  | { type: 'daily-challenge-complete'; day: string }
  | { type: 'daily-plan-complete'; day: string };

export const defaultAchievementStats: AchievementStats = {
  practiceSessions: 0,
  practiceModeSessions: {},
  practiceCorrect: 0,
  practiceTotal: 0,
  practiceCorrectByMode: {},
  practiceTotalByMode: {},
  musicPracticeSessions: 0,
  songSessions: 0,
  songSessionsById: {},
  songCorrect: 0,
  songTotal: 0,
  songCorrectById: {},
  songTotalById: {},
  dictationSessions: 0,
  dictationCorrect: 0,
  dictationTotal: 0,
  detectiveSessions: {},
  detectiveCorrect: 0,
  detectiveTotal: 0,
  detectiveCorrectByLevel: {},
  detectiveTotalByLevel: {},
  perfectSessions: 0,
  listeningCorrect: 0,
  pronunciationCorrect: 0,
  nightSessions: 0,
  morningSessions: 0,
  placementTests: 0,
  placementLevels: [],
  rushSessions: 0,
  rushSeconds: 0,
  rushTotalScore: 0,
  rushBestScore: 0,
  articleSessions: 0,
  articlePerfectSessions: 0,
  articleCorrect: 0,
  articleTotal: 0,
  dailyChallengeDays: [],
  dailyPlanDays: [],
  lessonIds: [],
  topicSessions: {},
};

export const applyAchievementEvent = (
  current: AchievementStats,
  event: AchievementEvent,
  hour: number,
): AchievementStats => {
  const next: AchievementStats = {
    ...defaultAchievementStats,
    ...current,
    lessonIds: [...(current.lessonIds || [])],
    dailyChallengeDays: [...(current.dailyChallengeDays || [])],
    dailyPlanDays: [...(current.dailyPlanDays || [])],
    placementLevels: [...(current.placementLevels || [])],
    topicSessions: { ...current.topicSessions },
    practiceModeSessions: { ...current.practiceModeSessions },
    practiceCorrectByMode: { ...current.practiceCorrectByMode },
    practiceTotalByMode: { ...current.practiceTotalByMode },
    songSessionsById: { ...current.songSessionsById },
    songCorrectById: { ...current.songCorrectById },
    songTotalById: { ...current.songTotalById },
    detectiveSessions: { ...current.detectiveSessions },
    detectiveCorrectByLevel: { ...current.detectiveCorrectByLevel },
    detectiveTotalByLevel: { ...current.detectiveTotalByLevel },
  };
  if (event.type === 'practice-session') {
    next.practiceSessions += 1;
    next.topicSessions[event.topic] =
      (next.topicSessions[event.topic] || 0) + 1;
    next.musicPracticeSessions = next.topicSessions['Музыка'] || 0;
    if (event.mode) {
      next.practiceModeSessions[event.mode] = (next.practiceModeSessions[event.mode] || 0) + 1;
      next.practiceCorrectByMode[event.mode] = (next.practiceCorrectByMode[event.mode] || 0) + Math.max(0, Number(event.correct) || 0);
      next.practiceTotalByMode[event.mode] = (next.practiceTotalByMode[event.mode] || 0) + Math.max(0, Number(event.total) || 0);
    }
    next.practiceCorrect += Math.max(0, Number(event.correct) || 0);
    next.practiceTotal += Math.max(0, Number(event.total) || 0);
    if (event.perfect) next.perfectSessions += 1;
    if (hour < 5) next.nightSessions += 1;
    else if (hour < 7) next.morningSessions += 1;
  } else if (event.type === 'song-session') {
    next.songSessions += 1;
    if (event.songId) next.songSessionsById[event.songId] = (next.songSessionsById[event.songId] || 0) + 1;
    next.songCorrect += Math.max(0, Number(event.correct) || 0);
    next.songTotal += Math.max(0, Number(event.total) || 0);
    if (event.songId) {
      next.songCorrectById[event.songId] = (next.songCorrectById[event.songId] || 0) + Math.max(0, Number(event.correct) || 0);
      next.songTotalById[event.songId] = (next.songTotalById[event.songId] || 0) + Math.max(0, Number(event.total) || 0);
    }
  } else if (event.type === 'dictation-session') {
    next.dictationSessions += 1;
    next.dictationCorrect += Math.max(0, event.correct);
    next.dictationTotal += Math.max(0, event.total);
  } else if (event.type === 'detective-session') {
    next.detectiveSessions[event.level] = (next.detectiveSessions[event.level] || 0) + 1;
    next.detectiveCorrect += Math.max(0, event.correct);
    next.detectiveTotal += Math.max(0, event.total);
    next.detectiveCorrectByLevel[event.level] = (next.detectiveCorrectByLevel[event.level] || 0) + Math.max(0, event.correct);
    next.detectiveTotalByLevel[event.level] = (next.detectiveTotalByLevel[event.level] || 0) + Math.max(0, event.total);
  }
  else if (event.type === 'lesson-complete')
    next.lessonIds = [...new Set([...next.lessonIds, event.lessonId])];
  else if (event.type === 'listening-correct') next.listeningCorrect += 1;
  else if (event.type === 'pronunciation-correct')
    next.pronunciationCorrect += 1;
  else if (event.type === 'rush-session') {
    const score = Number.isFinite(event.score)
        ? Math.max(0, Math.floor(event.score))
        : 0,
      seconds = Number.isFinite(event.seconds)
        ? Math.max(0, Math.floor(event.seconds))
        : 0;
    next.rushSessions += 1;
    next.rushSeconds += seconds;
    next.rushTotalScore += score;
    next.rushBestScore = Math.max(next.rushBestScore, score);
  }
  else if (event.type === 'article-session') {
    next.articleSessions += 1;
    next.articleCorrect += Math.max(0, event.score);
    next.articleTotal += Math.max(0, event.total);
    if (event.total > 0 && event.score === event.total)
      next.articlePerfectSessions += 1;
  }
  else if (event.type === 'placement-test-complete') {
    next.placementTests += 1;
    next.placementLevels = [...new Set([...next.placementLevels, event.level])];
  }
  else if (event.type === 'daily-challenge-complete')
    next.dailyChallengeDays = [
      ...new Set([...next.dailyChallengeDays, event.day]),
    ].slice(-1500);
  else if (event.type === 'daily-plan-complete')
    next.dailyPlanDays = [
      ...new Set([...next.dailyPlanDays, event.day]),
    ].slice(-1500);
  return next;
};
