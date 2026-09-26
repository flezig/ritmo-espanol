import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { vocabularyTopics } from '../app/vocabulary.ts';
import { b1b2VocabularyTopics } from '../app/b1b2-vocabulary.ts';
import { courseLessons, type LessonExercise } from '../app/lessons.ts';
import { matchesAnswerVariant } from '../app/lib/learning-core.ts';

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
  for (const topic of vocabularyTopics.filter((topic) => !/^Unidad\s/u.test(topic.name)).slice(0, 16))
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

test('B1-B2 is a separate complete corpus with no A1-A2 overlap', () => {
  const beginnerWords = new Set(
    vocabularyTopics
      .filter((topic) => topic.level === 'A1–A2')
      .flatMap((topic) => topic.entries.map((entry) => entry.es.toLocaleLowerCase('es'))),
  );
  const advancedWords = b1b2VocabularyTopics.flatMap((topic) => topic.entries);
  assert.equal(advancedWords.length, 200);
  assert.equal(b1b2VocabularyTopics.length, 10);
  for (const entry of advancedWords) {
    assert.equal(beginnerWords.has(entry.es.toLocaleLowerCase('es')), false, `${entry.es} overlaps A1–A2`);
    assert.equal(/\s\/\s/.test(entry.ru), false, `${entry.es} has an ambiguous translation`);
    assert.match(entry.example, /[.!?]$/u, `${entry.es} needs a complete Spanish sentence`);
    assert.match(entry.exampleRu, /[.!?]$/u, `${entry.es} needs a complete Russian translation`);
  }
  for (const topic of b1b2VocabularyTopics) {
    assert.equal(topic.entries.length, 20, `${topic.name} needs 20 entries`);
    for (const entry of topic.entries.slice(10)) {
      assert.match(entry.extraExample || '', /[.!?]$/u, `${entry.es} needs a second Spanish example`);
      assert.match(entry.extraExampleRu || '', /[.!?]$/u, `${entry.es} needs a second Russian translation`);
    }
  }
  const releasedAdvanced = vocabularyTopics.filter((topic) => topic.level === 'B1–B2');
  assert.equal(releasedAdvanced.length, 10);
  assert.equal(
    releasedAdvanced.reduce((sum, topic) => sum + topic.entries.length, 0),
    advancedWords.length,
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
  assert.ok(lesson.exercises.length <= 80);
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

test('lesson 1 replaces repeated drills with coverage of its essential theory', () => {
  const lesson = courseLessons.find((item) => item.id === 'intro');
  assert.ok(lesson);
  assert.equal(lesson.exercises.length, 71);
  assert.ok(lesson.exercises.filter((item) => item.kind === 'Ser').length < 10);
  assert.ok(lesson.exercises.filter((item) => item.kind === 'Согласование').length < 10);
  for (const [kind, minimum] of [
    ['Ser, estar или hay', 8],
    ['Нулевой артикль', 5],
    ['Определённый и неопределённый артикль', 6],
    ['Al и del', 4],
    ['Вопросы и отрицание', 5],
    ['Позиция прилагательного', 3],
    ['Артикль и определители', 3],
  ] as const) {
    assert.ok(
      lesson.exercises.filter((item) => item.kind === kind).length >= minimum,
      `missing lesson 1 coverage: ${kind}`,
    );
  }
  for (const exercise of lesson.exercises) {
    assert.ok(exercise.prompt.trim(), 'lesson 1 exercise has an empty prompt');
    assert.ok(exercise.answer.trim(), `lesson 1 exercise has no answer: ${exercise.prompt}`);
    if (exercise.mode === 'choice') {
      assert.ok((exercise.options?.length || 0) >= 3, `not enough choices: ${exercise.prompt}`);
      assert.ok(exercise.options?.includes(exercise.answer), `answer is not displayed: ${exercise.prompt}`);
      assert.equal(new Set(exercise.options).size, exercise.options.length, `duplicate choices: ${exercise.prompt}`);
    }
  }
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

test('lesson 3 covers only its three presente rules with varied stable practice', () => {
  const lesson = courseLessons.find((item) => item.id === 'day');
  assert.ok(lesson);
  assert.equal(lesson.title, 'Presente: глаголы в действии');
  assert.deepEqual(
    lesson.theory.map((block) => block.title),
    [
      'Presente de Indicativo правильных глаголов',
      'Чередование гласных в корне',
      'Особые формы yo',
    ],
  );
  assert.equal(lesson.exercises.length, 50, 'the stable lesson length protects saved completion');
  assert.equal(
    /возвратн|вопросительн/iu.test(JSON.stringify(lesson)),
    false,
  );
  for (const kind of [
    'Правильные глаголы',
    'Чередование в корне',
    'Особая форма yo',
  ])
    assert.ok(
      lesson.exercises.filter((exercise) => exercise.kind === kind).length >= 11,
      `not enough coverage for ${kind}`,
    );
  const modes = new Set(lesson.exercises.map((exercise) => exercise.mode));
  assert.deepEqual(modes, new Set(['choice', 'type', 'order', 'truefalse']));
  assert.ok(
    lesson.exercises.filter((exercise) => exercise.mode === 'choice').length <
      lesson.exercises.length / 2,
  );
  for (const exercise of lesson.exercises) {
    assert.ok(exercise.prompt.trim(), 'lesson 3 exercise has an empty prompt');
    assert.ok(exercise.answer.trim(), `lesson 3 exercise has no answer: ${exercise.prompt}`);
    if (exercise.mode === 'choice') {
      assert.ok(exercise.options?.includes(exercise.answer), `answer is not displayed: ${exercise.prompt}`);
      assert.equal(new Set(exercise.options).size, exercise.options.length, `duplicate choices: ${exercise.prompt}`);
    }
    if (exercise.mode === 'order')
      assert.equal(exercise.options?.join(' '), exercise.answer, `broken word bank: ${exercise.prompt}`);
    for (const variant of exercise.acceptedAnswers || [])
      {
        assert.notEqual(variant, exercise.answer, `duplicate accepted answer: ${exercise.prompt}`);
        assert.equal(
          matchesAnswerVariant(variant, exercise.answer, exercise.acceptedAnswers),
          true,
          `accepted answer is rejected: ${variant}`,
        );
      }
    assert.equal(
      matchesAnswerVariant(exercise.answer, exercise.answer, exercise.acceptedAnswers),
      true,
      `canonical answer is rejected: ${exercise.prompt}`,
    );
  }
  assert.equal(
    lesson.exercises.some((exercise) => /vuelvo volver/iu.test(`${exercise.prompt} ${exercise.answer}`)),
    false,
  );
});

test('every core word from lesson 3 exists in the canonical dictionary', () => {
  const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  const dayBlock = source.match(/\n  day: \[([\s\S]*?)\n  \],\n  home:/u)?.[1] || '';
  const lessonWords = [...dayBlock.matchAll(/es: '([^']+)'/gu)].map((match) => match[1]);
  const dictionaryWords = new Set(entries.map((entry) => entry.es));
  assert.equal(lessonWords.length, 30);
  for (const word of lessonWords)
    assert.ok(dictionaryWords.has(word), `lesson word is missing from dictionary: ${word}`);
  assert.match(source, /type PracticeCollection = 'topics' \| 'units' \| 'lessons'/);
  assert.match(source, /lessonIds: lessonIdsForWord\(entry\.es\)/);
});

test('lesson 2 covers every expanded rule in exactly 60 clear tasks', () => {
  const lesson = courseLessons.find((item) => item.id === 'family');
  assert.ok(lesson);
  assert.equal(lesson.exercises.length, 60);

  const theory = JSON.stringify(lesson.theory);
  const exercises = JSON.stringify(lesson.exercises);
  for (const expression of [
    'hambre', 'sed', 'sueño', 'frío', 'calor', 'miedo', 'prisa', 'razón', 'suerte',
  ]) {
    assert.match(theory, new RegExp(expression), `missing tener ${expression} in theory`);
    assert.match(exercises, new RegExp(expression), `missing tener ${expression} exercise`);
  }
  for (const kind of [
    'Tener', 'Притяжательные', 'Согласование', 'Множественное число', 'Семья',
    'Выражения с tener', 'Tener que', 'Указательные', 'Базовые предлоги',
    'Ser или estar', 'Особое множественное число', 'Muy и mucho',
    'Presente · глаголы на -ar',
  ]) {
    assert.ok(
      lesson.exercises.some((exercise) => exercise.kind.startsWith(kind)),
      `missing lesson 2 exercise group: ${kind}`,
    );
  }
  assert.equal(theory.toLowerCase().includes('hay que'), false);
  assert.ok(lesson.exercises.filter((exercise) => exercise.kind === 'Tener que').length >= 4);
  assert.ok(lesson.exercises.filter((exercise) => exercise.kind === 'Указательные').length >= 8);
  assert.ok(lesson.exercises.filter((exercise) => exercise.kind === 'Базовые предлоги').length >= 6);
  assert.equal(lesson.exercises.filter((exercise) => exercise.kind.startsWith('Presente · глаголы на -ar')).length, 10);
  assert.ok(
    lesson.exercises.slice(50).every((exercise) => exercise.kind === 'Presente · глаголы на -ar'),
    'the ten exercises added after the original 50 must stay at positions 51–60',
  );
  for (const verb of ['hablar', 'trabajar', 'estudiar', 'escuchar', 'viajar', 'comprar', 'necesitar', 'cocinar', 'bailar']) {
    assert.match(theory, new RegExp(verb), `missing -ar verb in theory: ${verb}`);
    assert.match(exercises, new RegExp(verb), `missing -ar verb exercise: ${verb}`);
  }

  for (const [source, answer] of [
    ['la hija pequeña', 'las hijas pequeñas'],
    ['su hermana', 'sus hermanas'],
  ]) {
    const exercise = lesson.exercises.find((item) => item.prompt.includes(source));
    assert.ok(exercise, `missing clarified plural task: ${source}`);
    assert.equal(exercise.mode, 'type');
    assert.match(exercise.prompt, /Преобразуйте всё словосочетание/);
    assert.equal(exercise.answer, answer);
  }
});

test('a lesson completed on an older shorter version reopens at the new tasks', () => {
  const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /state\.done < lesson\.exercises\.length/);
  assert.match(source, /current\[lesson\.id\] = \{ \.\.\.state, completed: false \}/);
  assert.match(source, /state\?\.lastExerciseId/);
});

test('lesson 2 theory keeps related rules together and explains su/sus by possessed number', () => {
  const lesson = courseLessons.find((item) => item.id === 'family');
  assert.ok(lesson);
  const titles = lesson.theory.map((block) => block.title);
  assert.equal(titles.indexOf('Tener: все частые выражения'), titles.indexOf('Tener: иметь и описывать') + 1);
  assert.equal(titles.indexOf('Tener que + инфинитив'), titles.indexOf('Tener: все частые выражения') + 1);
  assert.equal(titles.indexOf('Чьи вещи: su и уточнение владельца'), titles.indexOf('Mi, tu, su') + 1);
  assert.equal(titles.indexOf('Множественное число: особые случаи'), titles.indexOf('Множественное число') + 1);
  const possessives = lesson.theory.find((block) => block.title === 'Чьи вещи: su и уточнение владельца');
  assert.ok(possessives);
  const text = JSON.stringify(possessives);
  assert.match(text, /Su используется с одним предметом/);
  assert.match(text, /Sus используется с несколькими предметами/);
  assert.match(text, /их кот \/ коты/);
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
