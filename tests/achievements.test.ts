import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  applyAchievementEvent,
  defaultAchievementStats,
  type AchievementStats,
} from '../app/lib/achievements.ts';

test('a completed Music practice session increments Ritmo Colombiano', () => {
  const first = applyAchievementEvent(
    defaultAchievementStats,
    { type: 'practice-session', topic: 'Музыка', perfect: false },
    14,
  );
  assert.equal(first.practiceSessions, 1);
  assert.equal(first.topicSessions['Музыка'], 1);
  assert.equal(first.musicPracticeSessions, 1);

  const fifth = Array.from({ length: 4 }).reduce<AchievementStats>(
    (stats) =>
      applyAchievementEvent(
        stats,
        { type: 'practice-session', topic: 'Музыка', perfect: false },
        14,
      ),
    first,
  );
  assert.equal(fifth.musicPracticeSessions, 5);
});

test('practice achievement counters cover perfect, topic and time conditions', () => {
  const night = applyAchievementEvent(
    defaultAchievementStats,
    { type: 'practice-session', topic: 'Еда и ресторан', perfect: true },
    2,
  );
  assert.equal(night.perfectSessions, 1);
  assert.equal(night.nightSessions, 1);
  assert.equal(night.topicSessions['Еда и ресторан'], 1);

  const morning = applyAchievementEvent(
    night,
    { type: 'practice-session', topic: 'Путешествия', perfect: false },
    6,
  );
  assert.equal(morning.morningSessions, 1);
  assert.equal(morning.practiceSessions, 2);
});

test('all explicit achievement events update their persistent counters', () => {
  let stats = applyAchievementEvent(
    defaultAchievementStats,
    { type: 'song-session' },
    12,
  );
  stats = applyAchievementEvent(stats, { type: 'listening-correct' }, 12);
  stats = applyAchievementEvent(stats, { type: 'pronunciation-correct' }, 12);
  stats = applyAchievementEvent(
    stats,
    { type: 'lesson-complete', lessonId: 'intro' },
    12,
  );
  stats = applyAchievementEvent(
    stats,
    { type: 'lesson-complete', lessonId: 'intro' },
    12,
  );
  assert.equal(stats.songSessions, 1);
  assert.equal(stats.listeningCorrect, 1);
  assert.equal(stats.pronunciationCorrect, 1);
  assert.deepEqual(stats.lessonIds, ['intro']);
});

test('every achievement has a unique id, positive target and progress rule', () => {
  const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8'),
    catalog = source.slice(
      source.indexOf('const achievementDefinitions'),
      source.indexOf('const achievementContext'),
    ),
    ids = [...catalog.matchAll(/id: '([^']+)'/g)].map((match) => match[1]),
    targets = [...catalog.matchAll(/target: (\d+)/g)].map((match) =>
      Number(match[1]),
    );
  assert.equal(ids.length, 68);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal((catalog.match(/progress:/g) || []).length, ids.length);
  assert.equal(targets.length, ids.length);
  assert.equal(targets.every((target) => target > 0), true);
  assert.match(
    catalog,
    /id: 'ritmo-colombiano'[\s\S]*?stats\.musicPracticeSessions/,
  );
});
