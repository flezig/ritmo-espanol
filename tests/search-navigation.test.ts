import assert from 'node:assert/strict';
import test from 'node:test';
import { consumeStoredIndex } from '../app/lib/search-navigation.ts';

function request(value: string | null) {
  const items = new Map<string, string>();
  if (value !== null) items.set('focus', value);
  return {
    getItem: (key: string) => items.get(key) ?? null,
    removeItem: (key: string) => { items.delete(key); },
  };
}

test('mount and follow-up event consume a search destination only once', () => {
  const storage = request('3');
  assert.equal(consumeStoredIndex(storage, 'focus', 6), 3);
  assert.equal(consumeStoredIndex(storage, 'focus', 6), null);
  assert.equal(consumeStoredIndex(request('0'), 'focus', 6), 0);
});

test('missing, malformed and out-of-range destinations never open the first topic', () => {
  for (const value of [null, '', ' ', '-1', '1.5', 'NaN', '6', '9007199254740992']) {
    assert.equal(consumeStoredIndex(request(value), 'focus', 6), null, String(value));
  }
});
