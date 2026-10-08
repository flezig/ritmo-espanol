import test from 'node:test';
import assert from 'node:assert/strict';
import {
  grammarExercises,
  grammarModes,
} from '../app/data/grammar-practice.ts';
import {
  grammarTaskFor,
  grammarTaskKind,
  grammarOrderTokens,
} from '../app/lib/grammar-task.ts';
import { analyzeAnswer } from '../app/lib/learning-core.ts';

test('every ten-question grammar round includes four formats with only two choices', () => {
  for (let round = 0; round < 10; round++) {
    const kinds = Array.from({ length: 10 }, (_, index) =>
      grammarTaskKind(index, round),
    );
    assert.equal(kinds.filter((kind) => kind === 'choice').length, 2);
    assert.equal(kinds.filter((kind) => kind === 'type').length, 4);
    assert.equal(kinds.filter((kind) => kind === 'correction').length, 2);
    assert.equal(kinds.filter((kind) => kind === 'order').length, 2);
    assert.ok(
      kinds.every((kind, index) => index === 0 || kind !== kinds[index - 1]),
    );
  }
});

test('every grammar question supports input, correction and ordering without broken answers', () => {
  for (const mode of grammarModes) {
    for (const question of grammarExercises[mode.id]) {
      for (const kind of ['type', 'choice', 'correction', 'order'] as const) {
        const task = grammarTaskFor(question, kind);
        assert.equal(task.kind, kind, question.id);
        assert.ok(task.instruction.includes(question.instruction));
        if (kind === 'order') {
          assert.match(task.prompt, /[А-Яа-яЁё]/);
          assert.doesNotMatch(task.prompt, /[a-zA-Z_]/);
          assert.notEqual(task.prompt, question.prompt);
          assert.equal(
            task.answer,
            question.prompt.replace('___', question.answer),
          );
          const tokens = grammarOrderTokens(task.answer, question.id);
          assert.equal(
            new Set(tokens.map((token) => token.id)).size,
            tokens.length,
          );
          assert.equal(
            tokens
              .toSorted((a, b) => a.id - b.id)
              .map((token) => token.word)
              .join(' '),
            task.answer,
          );
          assert.notEqual(
            tokens.map((token) => token.id).join(','),
            tokens
              .toSorted((a, b) => a.id - b.id)
              .map((token) => token.id)
              .join(','),
          );
        } else {
          assert.equal(task.answer, question.answer);
          if (kind === 'correction') {
            assert.equal(task.prompt.includes('___'), false);
            assert.notEqual(
              task.prompt,
              question.prompt.replace('___', question.answer),
            );
          }
        }
        assert.equal(analyzeAnswer(task.answer, task.answer).correct, true);
      }
    }
  }
});

test('ordering keeps repeated words distinct and is stable when resuming a task', () => {
  const tokens = grammarOrderTokens(
    'Si yo estudio, yo aprendo.',
    'saved-session',
  );
  assert.equal(tokens.filter((token) => token.word === 'yo').length, 2);
  assert.deepEqual(
    tokens,
    grammarOrderTokens('Si yo estudio, yo aprendo.', 'saved-session'),
  );
});
