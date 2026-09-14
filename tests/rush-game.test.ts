import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
const rushSource = source.slice(
  source.indexOf('const rushGrammar'),
  source.indexOf('function PracticeHub'),
);

test('Spanish Rush has a substantial grammar bank and randomizes every launch', () => {
  const grammarBlock = rushSource.slice(0, rushSource.indexOf('const randomOrder'));
  assert.equal((grammarBlock.match(/prompt:/g) || []).length >= 30, true);
  assert.match(rushSource, /setWordOrder\(randomOrder\(deck\.length\)\)/);
  assert.match(rushSource, /setGrammarOrder\(randomOrder\(rushGrammar\.length\)\)/);
  assert.match(rushSource, /crypto\.randomUUID/);
});

test('Rush translation distractors use the same part of speech', () => {
  assert.match(rushSource, /targetPartOfSpeech = inferWordPartOfSpeech/);
  assert.match(
    rushSource,
    /inferWordPartOfSpeech\(item\.es, item\.ru, item\.example\) !==\s*targetPartOfSpeech/,
  );
});

test('Rush context always asks a question and word history stays hidden until answer', () => {
  assert.match(rushSource, /Какое слово пропущено\?/);
  assert.match(rushSource, /Как по-испански/);
  assert.match(rushSource, /!isGrammar && choice &&/);
});

test('current Rush record is visible on the start and result screen', () => {
  assert.match(rushSource, /Текущий рекорд: \{best\}/);
});

test('only a completed Rush run records achievement score and real elapsed time', () => {
  assert.match(rushSource, /type: 'rush-session'/);
  assert.match(rushSource, /Date\.now\(\) - startedAt\.current/);
});
