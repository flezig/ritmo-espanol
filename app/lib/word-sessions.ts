export type WordSessionRecord = {
  sessionsSeen: number;
  lastSessionId: string;
  firstSeenAt: string;
  successfulSessions: number;
  sentenceDictationSessions: number;
  lastSuccessfulSessionId?: string;
  lastSentenceDictationSessionId?: string;
};

export type WordSessionProgress = Record<string, WordSessionRecord>;

export const recordWordSession = (
  progress: WordSessionProgress,
  base: string,
  sessionId: string,
  successful: boolean,
  sentenceDictation: boolean,
  timestamp = new Date().toISOString(),
): WordSessionProgress => {
  const old = progress[base],
    firstInSession = old?.lastSessionId !== sessionId,
    firstSuccessInSession = successful && old?.lastSuccessfulSessionId !== sessionId,
    firstSentenceInSession =
      sentenceDictation && old?.lastSentenceDictationSessionId !== sessionId;
  return {
    ...progress,
    [base]: {
      sessionsSeen: (old?.sessionsSeen || 0) + (firstInSession ? 1 : 0),
      lastSessionId: sessionId,
      firstSeenAt: old?.firstSeenAt || timestamp,
      successfulSessions:
        (old?.successfulSessions || 0) + (firstSuccessInSession ? 1 : 0),
      sentenceDictationSessions:
        (old?.sentenceDictationSessions || 0) + (firstSentenceInSession ? 1 : 0),
      lastSuccessfulSessionId: firstSuccessInSession
        ? sessionId
        : old?.lastSuccessfulSessionId,
      lastSentenceDictationSessionId: firstSentenceInSession
        ? sessionId
        : old?.lastSentenceDictationSessionId,
    },
  };
};

