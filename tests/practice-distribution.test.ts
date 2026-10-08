import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STANDARD_RECOGNITION_DISTRIBUTION,
  standardRecognitionPercentages,
  limitChoiceFormat,
} from '../app/lib/practice-distribution.ts';

test('ordinary recognition uses the documented 40/20/25/15 distribution', () => {
  const total = STANDARD_RECOGNITION_DISTRIBUTION.length,
    percent = (kind: string) =>
      (STANDARD_RECOGNITION_DISTRIBUTION.filter((item) => item === kind)
        .length /
        total) *
      100;
  assert.equal(percent('type'), standardRecognitionPercentages.type);
  assert.equal(percent('choice'), standardRecognitionPercentages.choice);
  assert.equal(percent('phrase'), standardRecognitionPercentages.phrase);
  assert.equal(percent('audioWord'), standardRecognitionPercentages.audioWord);
});

test('four-option exercises cannot fill a round even when every preferred format is choice', () => {
  const round = Array.from({ length: 16 }, (_, index) =>
    limitChoiceFormat('choice', index, 'recognition'),
  );
  assert.equal(round.filter((kind) => kind === 'choice').length, 3);
  for (let index = 1; index < round.length; index++)
    assert.ok(round[index] !== 'choice' || round[index - 1] !== 'choice');
  assert.equal(limitChoiceFormat('choice', 0, 'article'), 'choice');
  for (const kind of [
    'type',
    'phrase',
    'order',
    'correction',
    'audioWord',
    'audioSentence',
    'letters',
  ])
    assert.equal(limitChoiceFormat(kind, 0, 'production'), kind);
});
