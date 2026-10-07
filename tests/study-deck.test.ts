import assert from 'node:assert/strict';
import test from 'node:test';
import { vocabularyTopics } from '../app/vocabulary.ts';
import { auditVocabularyPracticeSync, makeStudyDeck } from '../app/lib/study-deck.ts';

test('the extracted study deck preserves every canonical word and its stable card keys', () => {
  const audit = auditVocabularyPracticeSync();
  assert.deepEqual(audit.issues, []);
  const deck = makeStudyDeck();
  const recognitionKeys = new Set(deck.filter((card) => card.skill === 'recognition').map((card) => card.key));
  const words = vocabularyTopics.flatMap((topic) => topic.entries.map((entry) => `${topic.name}-${entry.id}-recognition`));
  assert.equal(audit.vocabularyWords, words.length);
  for (const key of words) assert.ok(recognitionKeys.has(key), key);
  assert.equal(new Set(deck.map((card) => card.key)).size, deck.length);
});

test('custom vocabulary changes do not replace the cached canonical deck', () => {
  const canonical = makeStudyDeck();
  const personal = makeStudyDeck([{
    id: 'module-test-word', es: 'hola', ru: 'привет', example: 'Hola, Ana.',
    exampleRu: 'Привет, Ана.', extraExample: 'Hola, Pablo.', extraExampleRu: 'Привет, Пабло.',
  }]);
  assert.ok(personal.some((card) => card.key.includes('module-test-word')));
  assert.ok(!canonical.some((card) => card.key.includes('module-test-word')));
  assert.equal(makeStudyDeck(), canonical);
});
