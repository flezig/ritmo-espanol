export type PracticeSnapshot = {
  version: 2 | 3 | 4 | 5;
  topic: string;
  session: unknown[];
  index: number;
  finished?: boolean;
  awaitingStart?: boolean;
};

/** Resume only after the learner has completed at least two graded cards. */
export const shouldAutoResumePractice = (snapshot: PracticeSnapshot | null) =>
  !!snapshot &&
  !snapshot.awaitingStart &&
  snapshot.session.length > 0 &&
  (snapshot.finished === true || snapshot.index >= 2);

/** Keep the current card by identity when earlier cards disappear. */
export function reconcilePracticeCards<T extends { key: string; answer: string; es: string; ru: string }>(
  saved: T[], index: number, current: T[],
) {
  const byKey = new Map(current.map((card) => [card.key, card]));
  const session = saved.flatMap((card) => byKey.has(card.key) ? [byKey.get(card.key)!] : []);
  const match = session.findIndex((card) => card.key === saved[index]?.key);
  const nextIndex = match >= 0 ? match : Math.min(
    saved.slice(0, index).filter((card) => byKey.has(card.key)).length,
    Math.max(0, session.length - 1),
  );
  const before = saved[index], after = session[nextIndex];
  const changed = !before || !after || before.key !== after.key ||
    before.answer !== after.answer || before.es !== after.es || before.ru !== after.ru;
  return { session, index: nextIndex, contentChanged: changed };
}

export const parsePracticeSnapshot = (value: string | null): PracticeSnapshot | null => {
  if (!value) return null;
  try {
    const data = JSON.parse(value) as Partial<PracticeSnapshot>;
    if (
      (data.version !== 2 && data.version !== 3 && data.version !== 4 && data.version !== 5) ||
      typeof data.topic !== 'string' ||
      !Array.isArray(data.session) ||
      !Number.isInteger(data.index) ||
      (data.index as number) < 0
    ) return null;
    return data as PracticeSnapshot;
  } catch {
    return null;
  }
};
