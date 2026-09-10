import test from 'node:test';
import assert from 'node:assert/strict';
import {
  articleMeaningPairs,
  articleNouns,
  createArticlePracticeSession,
} from '../app/lib/article-practice.ts';

const seededRandom = (seed = 17) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

test('article practice creates ten varied questions with shuffled answers', () => {
  const session = createArticlePracticeSession(seededRandom(), 10);
  assert.equal(session.length, 10);
  assert.equal(new Set(session.map((question) => question.id)).size, 10);
  assert.equal(session.filter((question) => question.kind === 'article').length, 6);
  assert.equal(session.filter((question) => question.kind === 'meaning-article').length, 2);
  assert.equal(session.filter((question) => question.kind === 'article-meaning').length, 2);
  assert.equal(session.some((question) => question.options[0] === question.answer), true);
  assert.equal(session.some((question) => question.options[0] !== question.answer), true);
});

test('article corpus keeps one exact translation and explains ambiguous meanings', () => {
  assert.equal(articleNouns.length >= 80, true);
  assert.equal(articleNouns.every((item) => !item.translation.includes(' / ')), true);
  assert.equal(articleMeaningPairs.length, 8);
  for (const pair of articleMeaningPairs) {
    assert.notEqual(pair.masculine, pair.feminine);
    assert.equal(pair.masculine.includes(' / '), false);
    assert.equal(pair.feminine.includes(' / '), false);
  }
});

test('a new article session changes the selected questions', () => {
  const first = createArticlePracticeSession(seededRandom(3), 10).map((item) => item.id);
  const second = createArticlePracticeSession(seededRandom(91), 10).map((item) => item.id);
  assert.notDeepEqual(first, second);
});
