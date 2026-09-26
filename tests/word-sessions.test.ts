import test from 'node:test';
import assert from 'node:assert/strict';
import { recordWordSession } from '../app/lib/word-sessions.ts';

test('word exposure is counted once per real practice session', () => {
  const first = recordWordSession({}, 'casa', 'session-a', true, false, '2026-09-26T10:00:00.000Z');
  const repeated = recordWordSession(first, 'casa', 'session-a', true, true);
  const second = recordWordSession(repeated, 'casa', 'session-b', false, false);

  assert.equal(second.casa.sessionsSeen, 2);
  assert.equal(second.casa.successfulSessions, 1);
  assert.equal(second.casa.sentenceDictationSessions, 1);
  assert.equal(second.casa.firstSeenAt, '2026-09-26T10:00:00.000Z');
});

test('success and sentence dictation are counted once within one session', () => {
  const first = recordWordSession({}, 'casa', 'session-a', true, true);
  const repeated = recordWordSession(first, 'casa', 'session-a', true, true);
  assert.equal(repeated.casa.successfulSessions, 1);
  assert.equal(repeated.casa.sentenceDictationSessions, 1);
});

