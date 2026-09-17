import test from 'node:test';
import assert from 'node:assert/strict';
import { unidad2Vocabulary } from '../app/unidad2-vocabulary.ts';
import { unidad3Vocabulary } from '../app/unidad3-vocabulary.ts';
import { vocabularyBrowseTopics, vocabularyTopics } from '../app/vocabulary.ts';

const unidad = vocabularyBrowseTopics.find((topic) => topic.name === 'Unidad 2');
const unidad3 = vocabularyBrowseTopics.find((topic) => topic.name === 'Unidad 3');

test('Unidad 2 exposes the complete curated vocabulary without duplicate lexemes', () => {
  assert.ok(unidad);
  assert.equal(unidad2Vocabulary.length, 134);
  assert.equal(unidad.entries.length, unidad2Vocabulary.length);
  assert.equal(new Set(unidad.entries.map((entry) => entry.lexemeId)).size, unidad.entries.length);
});

test('Unidad 3 includes theory, exercise vocabulary and nationalities', () => {
  assert.ok(unidad3);
  assert.equal(unidad3Vocabulary.length, 189);
  assert.equal(unidad3.entries.length, unidad3Vocabulary.length);
  for (const required of ['adjetivo', 'dormilón', 'Alemania', 'alemán', 'reloj', 'tulipán'])
    assert.ok(unidad3.entries.some((entry) => entry.es === required), `${required} is missing`);
});

test('every word or phrase in every Unidad has exactly two translated examples', () => {
  for (const topic of vocabularyBrowseTopics.filter((item) => /^Unidad\s/u.test(item.name))) {
    for (const entry of topic.entries) {
      assert.ok(entry.example.trim(), `${topic.name}: ${entry.es} has no first example`);
      assert.ok(entry.exampleRu?.trim(), `${topic.name}: ${entry.es} has no first translation`);
      assert.ok(entry.extraExample?.trim(), `${topic.name}: ${entry.es} has no second example`);
      assert.ok(entry.extraExampleRu?.trim(), `${topic.name}: ${entry.es} has no second translation`);
    }
  }
});

test('every Unidad 2 word has exactly two translated natural examples', () => {
  for (const entry of unidad?.entries || []) {
    assert.ok(entry.example.trim(), `${entry.es}: missing first example`);
    assert.ok(entry.exampleRu?.trim(), `${entry.es}: missing first translation`);
    assert.ok(entry.extraExample?.trim(), `${entry.es}: missing second example`);
    assert.ok(entry.extraExampleRu?.trim(), `${entry.es}: missing second translation`);
    assert.equal(/\s\/\s/u.test(entry.ru), false, `${entry.es}: ambiguous translation`);
  }
});

test('Unidad membership reuses the canonical lexeme and never creates SRS copies', () => {
  const canonical = vocabularyTopics.flatMap((topic) => topic.entries);
  const canonicalIds = new Set(canonical.map((entry) => entry.lexemeId));
  assert.equal(canonicalIds.size, canonical.length);
  for (const topic of [unidad, unidad3]) {
    for (const entry of topic?.entries || []) {
      assert.ok(entry.units?.includes(topic!.name), `${entry.es}: missing unit membership`);
      assert.ok(entry.lexemeId && canonicalIds.has(entry.lexemeId), `${entry.es}: non-canonical lexeme`);
    }
  }
});
