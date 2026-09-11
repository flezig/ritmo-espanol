import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { vocabularyTopics } from '../app/vocabulary.ts';
import { courseLessons, type LessonExercise } from '../app/lessons.ts';

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
    if (entry.extraExample?.trim())
      assert.ok(
        entry.extraExampleRu?.trim(),
        `${entry.topic}: ${entry.es} has an untranslated second example`,
      );
  }
});

test('A1-A2 core is explicit, substantial and smaller than the full dictionary', () => {
  const core = entries.filter((entry) => entry.core);
  assert.ok(core.length >= 750, `core is too small: ${core.length}`);
  assert.ok(core.length <= 850, `core is no longer focused: ${core.length}`);
  assert.ok(core.length < entries.length);
  for (const topic of vocabularyTopics.slice(0, 16))
    assert.ok(
      topic.entries.some((entry) => entry.core),
      `${topic.name} has no core vocabulary`,
    );
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
  for (const name of [
    'Время, даты и планы',
    'Услуги и документы',
    'Проблемы и экстренные ситуации',
  ])
    assert.ok(
      vocabularyTopics.find((topic) => topic.name === name)!.entries.length >=
        40,
      `${name} needs at least 40 useful items`,
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
  assert.equal(rendered.includes('No queríamos empezar sin vos'), false);
  assert.equal(rendered.includes('¿Podés hablar'), false);
  assert.equal(rendered.includes('Esto monumento'), false);
  assert.equal(rendered.includes('Tu novio te está engañando'), false);
  assert.equal(rendered.includes('Murió ayer por la noche'), false);
  for (const artificial of [
    'Necesito información sobre ',
    'Hoy hablamos de ',
    'Necesito tiempo para ',
    'Mi nuevo compañero es ',
    'Aquí hay un hobby',
  ])
    assert.equal(rendered.includes(artificial), false, artificial);
  assert.equal(
    entries.find((entry) => entry.es === 'carta')?.example,
    '¿Nos trae la carta, por favor?',
  );
  assert.equal(
    entries.find((entry) => entry.es === 'dependiente')?.exampleRu,
    'Продавец помог мне найти мой размер.',
  );
  assert.equal(
    entries.find((entry) => entry.es === 'chupito')?.exampleRu,
    'После ужина они заказали по шоту.',
  );
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

test('lesson 1 keeps ambiguous agreement prompts as guided choices', () => {
  const lesson = courseLessons.find((item) => item.id === 'intro');
  assert.ok(lesson);
  assert.equal(lesson.exercises.length, 50);
  for (const prompt of [
    'La doctora es ___.',
    'Los amigos son ___.',
    'Выберите правильную пару страна → национальность.',
  ]) {
    const exercise: LessonExercise | undefined = lesson.exercises.find(
      (item) => item.prompt === prompt,
    );
    assert.ok(exercise, `missing exercise: ${prompt}`);
    assert.equal(exercise.mode, 'choice', `${prompt} must provide choices`);
    assert.ok((exercise.options?.length || 0) >= 2);
  }
  assert.equal(
    lesson.exercises.some((item) =>
      item.prompt.startsWith('Впишите правильный ответ без вариантов:'),
    ),
    false,
  );
});

test('lesson free input is used only when the prompt identifies the answer', () => {
  for (const lesson of courseLessons) {
    for (const exercise of lesson.exercises) {
      if (
        exercise.mode !== 'type' ||
        !exercise.prompt.startsWith('Впишите правильный ответ без вариантов:')
      )
        continue;
      assert.match(
        exercise.prompt,
        /→|\([^)]{2,}\)/,
        `${lesson.id}: ${exercise.prompt}`,
      );
    }
  }
});

test('lesson and grammar choices use displayed shuffled options', () => {
  const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /displayedOptions = shuffledOptions/);
  assert.match(source, /displayedOptions\.map\(\(option, index\)/);
  assert.match(source, /displayedGrammarOptions = shuffledOptions/);
  assert.match(source, /displayedGrammarOptions\.map/);
});

test('quick start uses meaningful checks and allows retry after an error', () => {
  const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  const quickStart = source.slice(
    source.indexOf('const starterLessons'),
    source.indexOf('function shuffledOptions'),
  );
  assert.equal(quickStart.includes("prompt: 'Tú ___ café.'"), false);
  assert.match(quickStart, /prompt: 'Tú ___ pan\.'/);
  assert.match(quickStart, /choice === check\.answer \|\| answerLock\.current/);
  assert.match(quickStart, /else answerLock\.current = false/);
  assert.match(quickStart, /ritmo-focus-lesson-id/);
  assert.match(quickStart, /displayedStarterOptions\.map/);
  assert.match(quickStart, /title: '04 · Знакомство'/);
  assert.match(quickStart, /title: '05 · В кафе'/);
  assert.match(quickStart, /title: '06 · В городе'/);
  assert.match(quickStart, /Perdone, ¿dónde está el metro\?/);
});
