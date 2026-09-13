import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeAnswer, blankSRS, derivedWordStatus, localDateKey, masteredRecord,
  nextStreak, scheduleReview,
} from '../app/lib/learning-core.ts';
import { isValidBackup } from '../app/lib/backup.ts';
import {
  parsePracticeSnapshot,
  shouldAutoResumePractice,
} from '../app/lib/practice-session.ts';

test('punctuation is ignored but word order is not', () => {
  assert.equal(analyzeAnswer('¿Hola, señor!', 'Hola señor').correct, true);
  assert.equal(analyzeAnswer('casa mi', 'mi casa').kind, 'order');
});

test('accent and ñ differences are accepted with a specific warning', () => {
  assert.equal(analyzeAnswer('espanol', 'español').kind, 'accent');
  assert.equal(analyzeAnswer('el arbol', 'el árbol').kind, 'accent');
});

test('article errors are identified separately', () => {
  const result = analyzeAnswer('la problema', 'el problema');
  assert.equal(result.correct, false);
  assert.equal(result.kind, 'article');
});

test('again really schedules a card ten minutes later', () => {
  const now = Date.UTC(2026, 8, 6, 10);
  assert.equal(scheduleReview(undefined, 'again', now).nextReview, now + 10 * 60_000);
});

test('successful intervals grow and hard remains shorter than good', () => {
  const now = Date.UTC(2026, 8, 6, 10);
  const old = { ...blankSRS(), stability: 3, lastReview: now - 86_400_000, reviews: 3, successes: 3 };
  assert.ok(scheduleReview(old, 'hard', now).nextReview < scheduleReview(old, 'good', now).nextReview);
  assert.ok(scheduleReview(old, 'easy', now).nextReview > scheduleReview(old, 'good', now).nextReview);
});

test('a word is learned only in recognition and production', () => {
  const mastered = { ...blankSRS(), reviews: 4, successes: 4, correctStreak: 3, stability: 4 };
  assert.equal(masteredRecord(mastered), true);
  assert.equal(derivedWordStatus('casa', { 'casa-recognition': mastered }), 'learning');
  assert.equal(derivedWordStatus('casa', { 'casa-recognition': mastered, 'casa-production': mastered }), 'learned');
});

test('daily streak handles same day, next day, and a gap', () => {
  const now = new Date(2026, 8, 6, 9);
  assert.equal(nextStreak(localDateKey(now), 5, [localDateKey(now)], now), 5);
  assert.equal(nextStreak('2026-09-05', 5, [], now), 6);
  assert.equal(nextStreak('2026-09-03', 5, [], now), 1);
});

test('practice session parser rejects incomplete state', () => {
  assert.equal(parsePracticeSnapshot('{"version":3}'), null);
  assert.equal(parsePracticeSnapshot('{bad'), null);
  assert.equal(parsePracticeSnapshot(JSON.stringify({ version: 3, topic: 'Дом', session: [{ key: 'casa' }], index: 0 }))?.topic, 'Дом');
  assert.equal(parsePracticeSnapshot(JSON.stringify({ version: 4, topic: 'Дом', session: [{ key: 'casa' }], index: 0 }))?.topic, 'Дом');
  assert.equal(parsePracticeSnapshot(JSON.stringify({ version: 5, topic: 'Все темы', level: 'B1–B2', session: [{ key: 'tesis' }], index: 0 }))?.topic, 'Все темы');
});

test('practice resumes automatically only after two completed cards', () => {
  const snapshot = (index: number, awaitingStart = false) => ({
    version: 5 as const,
    topic: 'Все темы',
    session: [{ key: 'hola' }],
    index,
    awaitingStart,
  });
  assert.equal(shouldAutoResumePractice(snapshot(0)), false);
  assert.equal(shouldAutoResumePractice(snapshot(1)), false);
  assert.equal(shouldAutoResumePractice(snapshot(2)), true);
  assert.equal(shouldAutoResumePractice(snapshot(5, true)), false);
});

test('backup validation accepts only the current schema and known keys', () => {
  assert.equal(isValidBackup({ app: 'Ritmo Español', version: 2, exportedAt: new Date().toISOString(), data: { 'ritmo-srs': {} } }), true);
  assert.equal(isValidBackup({ app: 'Ritmo Español', version: 2, exportedAt: '', data: { surprise: true } }), false);
});
