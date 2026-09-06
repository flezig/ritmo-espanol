import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STANDARD_RECOGNITION_DISTRIBUTION,
  standardRecognitionPercentages,
} from '../app/lib/practice-distribution.ts';

test('ordinary recognition uses the documented 35/30/20/15 distribution', () => {
  const total = STANDARD_RECOGNITION_DISTRIBUTION.length,
    percent = (kind: string) =>
      (STANDARD_RECOGNITION_DISTRIBUTION.filter((item) => item === kind).length /
        total) *
      100;
  assert.equal(percent('type'), standardRecognitionPercentages.type);
  assert.equal(percent('choice'), standardRecognitionPercentages.choice);
  assert.equal(percent('phrase'), standardRecognitionPercentages.phrase);
  assert.equal(
    percent('audioWord'),
    standardRecognitionPercentages.audioWord,
  );
});
