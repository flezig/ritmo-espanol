/** Consume a navigation request once, including when mount and event overlap. */
export function consumeStoredIndex(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  key: string,
  count: number,
): number | null {
  const stored = storage.getItem(key);
  if (stored === null) return null;
  storage.removeItem(key);
  if (!/^\d+$/.test(stored)) return null;
  const index = Number(stored);
  return Number.isSafeInteger(index) && index < count ? index : null;
}
