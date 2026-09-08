import assert from 'node:assert/strict';
import test from 'node:test';
import { BACKUP_KEYS, BACKUP_VERSION } from '../app/lib/backup.ts';
import { CLOUD_PROGRESS_KEYS } from '../app/lib/cloud-progress.ts';
import { courseLessons } from '../app/lessons.ts';
import { vocabularyTopics } from '../app/vocabulary.ts';

const requiredProgressKeys = [
  'ritmo-device-profile',
  'ritmo-srs',
  'ritmo-word-progress',
  'ritmo-word-history',
  'ritmo-learn-progress',
  'ritmo-lesson-progress',
  'ritmo-error-profile',
  'ritmo-content-favorites',
  'ritmo-custom-words',
  'ritmo-example-reports',
  'ritmo-exercise-reports',
  'ritmo-lesson-word-db',
  'ritmo-practice-session',
  'ritmo-detective-progress',
  'ritmo-rush-records',
  'ritmo-achievement-stats',
  'ritmo-achievements',
  'ritmo-placement',
  'ritmo-daily-challenges',
  'ritmo-data-schema-version',
] as const;

test('cloud sync includes every durable learning-progress record', () => {
  assert.equal(BACKUP_VERSION, 3);
  assert.equal(new Set(BACKUP_KEYS).size, BACKUP_KEYS.length);
  requiredProgressKeys.forEach((key) =>
    assert.ok(CLOUD_PROGRESS_KEYS.includes(key), `${key} must be cloud-synced`),
  );
  assert.ok(!(CLOUD_PROGRESS_KEYS as readonly string[]).includes('ritmo-local-analytics'));
});

test('lesson and vocabulary identifiers stay unique as content grows', () => {
  assert.equal(new Set(courseLessons.map((lesson) => lesson.id)).size, courseLessons.length);
  assert.equal(new Set(vocabularyTopics.map((topic) => topic.name)).size, vocabularyTopics.length);
  vocabularyTopics.forEach((topic) => {
    const ids = topic.entries.map((entry) => entry.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate vocabulary id in ${topic.name}`);
  });
});
