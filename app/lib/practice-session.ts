export type PracticeSnapshot = {
  version: 2 | 3 | 4;
  topic: string;
  session: unknown[];
  index: number;
};

export const parsePracticeSnapshot = (value: string | null): PracticeSnapshot | null => {
  if (!value) return null;
  try {
    const data = JSON.parse(value) as Partial<PracticeSnapshot>;
    if (
      (data.version !== 2 && data.version !== 3 && data.version !== 4) ||
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
