export type AchievementStats = {
  practiceSessions: number;
  musicPracticeSessions: number;
  songSessions: number;
  perfectSessions: number;
  listeningCorrect: number;
  pronunciationCorrect: number;
  nightSessions: number;
  morningSessions: number;
  placementTests: number;
  placementLevels: Array<'A1' | 'A2' | 'B1' | 'B2' | 'C1'>;
  dailyChallengeDays: string[];
  dailyPlanDays: string[];
  lessonIds: string[];
  topicSessions: Record<string, number>;
};

export type AchievementEvent =
  | { type: 'practice-session'; topic: string; perfect: boolean }
  | { type: 'song-session' }
  | { type: 'lesson-complete'; lessonId: string }
  | { type: 'listening-correct' }
  | { type: 'pronunciation-correct' }
  | { type: 'placement-test-complete'; level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' }
  | { type: 'daily-challenge-complete'; day: string }
  | { type: 'daily-plan-complete'; day: string };

export const defaultAchievementStats: AchievementStats = {
  practiceSessions: 0,
  musicPracticeSessions: 0,
  songSessions: 0,
  perfectSessions: 0,
  listeningCorrect: 0,
  pronunciationCorrect: 0,
  nightSessions: 0,
  morningSessions: 0,
  placementTests: 0,
  placementLevels: [],
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
  };
  if (event.type === 'practice-session') {
    next.practiceSessions += 1;
    next.topicSessions[event.topic] =
      (next.topicSessions[event.topic] || 0) + 1;
    next.musicPracticeSessions = next.topicSessions['Музыка'] || 0;
    if (event.perfect) next.perfectSessions += 1;
    if (hour < 5) next.nightSessions += 1;
    else if (hour < 7) next.morningSessions += 1;
  } else if (event.type === 'song-session') next.songSessions += 1;
  else if (event.type === 'lesson-complete')
    next.lessonIds = [...new Set([...next.lessonIds, event.lessonId])];
  else if (event.type === 'listening-correct') next.listeningCorrect += 1;
  else if (event.type === 'pronunciation-correct')
    next.pronunciationCorrect += 1;
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
