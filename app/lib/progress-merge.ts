export type ProgressData = Record<string, string>;

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

/** Merge unrelated edits; never silently discard overlapping changes. */
export function mergeProgress(base: ProgressData, local: ProgressData, remote: ProgressData) {
  const conflicts: string[] = [];
  function merge(before: unknown, here: unknown, there: unknown, path: string): unknown {
    if (same(here, there) || same(there, before)) return here;
    if (same(here, before)) return there;
    if (object(here) && object(there) && (object(before) || before === undefined)) {
      const old = object(before) ? before : {};
      return Object.fromEntries([...new Set([...Object.keys(old), ...Object.keys(here), ...Object.keys(there)])]
        .map((key) => [key, merge(old[key], here[key], there[key], `${path}.${key}`)])
        .filter(([, value]) => value !== undefined));
    }
    conflicts.push(path);
    return here;
  }
  const decode = (value: string | undefined) => {
    if (value === undefined) return undefined;
    try { return JSON.parse(value); } catch { return value; }
  };
  const data: ProgressData = {};
  for (const key of new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)])) {
    if (local[key] === remote[key] || remote[key] === base[key]) {
      if (local[key] !== undefined) data[key] = local[key];
    } else if (local[key] === base[key]) {
      if (remote[key] !== undefined) data[key] = remote[key];
    } else {
      const value = merge(decode(base[key]), decode(local[key]), decode(remote[key]), key);
      if (value !== undefined) data[key] = JSON.stringify(value);
    }
  }
  return { data, conflicts };
}
