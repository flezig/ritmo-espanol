import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { vocabularyTopics } from '../app/vocabulary.ts';

const entries = vocabularyTopics.flatMap((topic) => topic.entries.map((entry) => ({ ...entry, topic: topic.name })));

test('vocabulary has unique single headwords', () => {
  const words = entries.map((entry) => entry.es.trim().toLocaleLowerCase('es'));
  assert.equal(words.some((word) => /\s\/\s/.test(word)), false);
  assert.equal(new Set(words).size, words.length);
});

test('every card has one primary Russian translation', () => {
  for (const entry of entries)
    assert.equal(/\s\/\s/.test(entry.ru), false, `${entry.es}: ${entry.ru}`);
  assert.equal(entries.find((entry) => entry.es === 'cantante')?.ru, 'певец');
});

test('every vocabulary card has a translated, word-specific example', () => {
  for (const entry of entries) {
    assert.ok(entry.example.trim(), `${entry.topic}: ${entry.es} has no example`);
    assert.ok(entry.exampleRu?.trim(), `${entry.topic}: ${entry.es} has no translation`);
  }
});

test('A2 topics stay complete and follow the learning route', () => {
  const names = vocabularyTopics.map((topic) => topic.name);
  const required = [
    'Время, даты и планы',
    'Биография и события жизни',
    'Быт и район',
    'Услуги и документы',
    'Проблемы и экстренные ситуации',
    'Эмоции и мнение',
    'Праздники и встречи',
    'Культура и медиа',
    'Техника и устройства',
    'Связующие слова и полезные конструкции',
  ];
  for (const name of required) {
    const topic = vocabularyTopics.find((item) => item.name === name);
    assert.ok(topic, `${name} is missing`);
    assert.ok(topic.entries.length >= 20, `${name} is too small`);
  }
  assert.ok(
    vocabularyTopics.find((topic) => topic.name === 'Эмоции и мнение')!
      .entries.length >= 35,
    'emotions need a wider active vocabulary',
  );
  assert.deepEqual(
    names.filter((name) => required.includes(name)),
    required,
  );
});

test('known editorial defects never reach the learner', () => {
  const rendered = JSON.stringify(entries);
  assert.equal(rendered.includes('El no está aquí ahora'), false);
  assert.equal(rendered.includes('На той улице очень шумно'), false);
  assert.equal(rendered.includes('No puedes ser una mujer'), false);
});

test('music clips have valid short timestamps', () => {
  const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  const clips = [...source.matchAll(/clip:\s*\{\s*start:\s*(\d+),\s*end:\s*(\d+)\s*\}/g)];
  assert.ok(clips.length >= 20, 'expected a useful set of music clips');
  for (const [, startValue, endValue] of clips) {
    const start = Number(startValue), end = Number(endValue);
    assert.ok(start >= 0 && end > start, `invalid clip ${start}-${end}`);
    assert.ok(end - start <= 20, `clip ${start}-${end} is too long for focused dictation`);
  }
});

test('practice uses unambiguous article and correction tasks', () => {
  const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /if \(card\.skill === 'article'\) return \['el', 'la'\]/);
  assert.match(source, /напишите только исправленное слово/i);
  assert.match(source, /correctionTask\?\.answer/);
});

test('translation choices are built as four-option questions', () => {
  const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /alternatives\.slice\(0, 3\)/);
  assert.match(source, /\['recognition', 'listening'\]\.includes\(card\.skill\)/);
  assert.match(
    source,
    /normalizeText\(entry\.ru\) !== normalizeText\(card\.ru\)/,
  );
});
