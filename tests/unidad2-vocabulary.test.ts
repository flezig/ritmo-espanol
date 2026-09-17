import test from 'node:test';
import assert from 'node:assert/strict';
import { unidad2Vocabulary } from '../app/unidad2-vocabulary.ts';
import { vocabularyBrowseTopics, vocabularyTopics } from '../app/vocabulary.ts';

const unidad = vocabularyBrowseTopics.find((topic) => topic.name === 'Unidad 2');

test('Unidad 2 exposes the complete curated vocabulary without duplicate lexemes', () => {
  assert.ok(unidad);
  assert.equal(unidad2Vocabulary.length, 133);
  assert.equal(unidad.entries.length, unidad2Vocabulary.length);
  assert.equal(new Set(unidad.entries.map((entry) => entry.lexemeId)).size, unidad.entries.length);
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
  for (const entry of unidad?.entries || []) {
    assert.ok(entry.units?.includes('Unidad 2'), `${entry.es}: missing unit membership`);
    assert.ok(entry.lexemeId && canonicalIds.has(entry.lexemeId), `${entry.es}: non-canonical lexeme`);
  }
});
