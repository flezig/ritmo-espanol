import test from 'node:test';
import assert from 'node:assert/strict';
import { deleA2TopicName, deleA2VocabularyTopic } from '../app/dele-a2-vocabulary.ts';
import { vocabularyTopics, vocabularyBrowseTopics } from '../app/vocabulary.ts';
import { maskExactTerm } from '../app/lib/practice-content.ts';

// Check the released data rather than only the input: global deduplication and
// canonical ownership must not silently remove any of this new learning set.
test('all 80 DELE A2 entries reach the dictionary and the shared practice vocabulary', () => {
  const canonical = vocabularyTopics.find((topic) => topic.name === deleA2TopicName);
  const browse = vocabularyBrowseTopics.find((topic) => topic.name === deleA2TopicName);
  assert.ok(canonical);
  assert.ok(browse);
  assert.equal(canonical.level, 'A1–A2');
  assert.equal(canonical.entries.length, 80);
  assert.deepEqual(canonical.entries.map((entry) => entry.es), deleA2VocabularyTopic.entries.map((entry) => entry.es));
  assert.deepEqual(browse.entries, canonical.entries);
  for (const entry of canonical.entries) {
    assert.ok(entry.lexemeId);
    assert.equal(vocabularyTopics.flatMap((topic) => topic.entries).filter((item) => item.lexemeId === entry.lexemeId).length, 1);
  }
});

test('every DELE A2 example is translated and produces an actual context exercise', () => {
  for (const entry of deleA2VocabularyTopic.entries) {
    assert.ok(entry.ru.trim());
    assert.match(entry.example, /[.!?]$/u);
    assert.match(entry.exampleRu, /[.!?]$/u);
    assert.notEqual(maskExactTerm(entry.example, entry.es), entry.example, `${entry.es} cannot be practiced in context`);
  }
});
