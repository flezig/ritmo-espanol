import test from 'node:test';
import assert from 'node:assert/strict';
import { b2AdditionalVocabulary } from '../app/b2-additional-vocabulary.ts';
import { b1b2VocabularyTopics } from '../app/b1b2-vocabulary.ts';
import { vocabularyTopics, vocabularyBrowseTopics } from '../app/vocabulary.ts';
import { maskExactTerm } from '../app/lib/practice-content.ts';

const rows = Object.values(b2AdditionalVocabulary).flat();

test('100 distinct additional B2 headwords survive canonical dictionary ownership', () => {
  assert.equal(rows.length, 100);
  assert.equal(new Set(rows.map(([es]) => es.toLocaleLowerCase('es'))).size, 100);
  assert.equal(Object.keys(b2AdditionalVocabulary).length, 10);
  const dictionary = vocabularyTopics.flatMap((topic) =>
    topic.entries.map((entry) => ({ ...entry, topic: topic.name, level: topic.level })),
  );
  for (const [name, additions] of Object.entries(b2AdditionalVocabulary)) {
    assert.equal(additions.length, 10);
    const source = b1b2VocabularyTopics.find((topic) => topic.name === name);
    const browse = vocabularyBrowseTopics.find((topic) => topic.name === name);
    assert.ok(source);
    assert.ok(browse);
    assert.equal(source.entries.length, 30);
    assert.deepEqual(source.entries.slice(20).map((entry) => entry.es), additions.map(([es]) => es));
    for (const [es] of additions) {
      const matches = dictionary.filter((entry) => entry.es === es);
      assert.equal(matches.length, 1, `${es} should appear once`);
      assert.equal(matches[0].topic, name);
      assert.equal(matches[0].level, 'B1–B2');
      assert.ok(matches[0].lexemeId);
      assert.ok(browse.entries.some((entry) => entry.lexemeId === matches[0].lexemeId));
    }
  }
});

test('both examples for every new B2 word are translated and usable for context practice', () => {
  for (const [es, ru, example, exampleRu, extraExample, extraExampleRu] of rows) {
    assert.equal(/\s/u.test(es), false, `${es} should be a single headword`);
    assert.ok(ru.trim());
    assert.ok(extraExample);
    assert.ok(extraExampleRu);
    assert.notEqual(example, extraExample);
    for (const sentence of [example, exampleRu, extraExample, extraExampleRu])
      assert.match(sentence, /[.!?]$/u, `${es} has an incomplete example`);
    assert.notEqual(maskExactTerm(example, es), example, `${es} has no context exercise`);
    assert.notEqual(maskExactTerm(extraExample, es), extraExample, `${es} is absent from its second example`);
  }
});
