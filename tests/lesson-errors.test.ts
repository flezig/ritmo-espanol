import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendLessonError,
  lessonErrorsForTeacher,
} from '../app/lib/lesson-errors.ts';
import { mergeProgress } from '../app/lib/progress-merge.ts';
import { courseLessons } from '../app/lessons.ts';
const normalize = (value: string) => value.toLowerCase();
const exercise = {
  prompt: 'Voy ___ Madrid.',
  answer: 'a',
  kind: 'Направление',
  explanation: 'Ir a.',
};
const attempt = {
  itemKey: 'voy ___ madrid.::a',
  prompt: exercise.prompt,
  studentAnswer: 'en',
  correctAnswer: 'a',
  rule: exercise.kind,
  explanation: exercise.explanation,
  answeredAt: '2026-10-03T10:00:00Z',
};

test('teacher sees repeated and corrected mistakes without an assignment', () => {
  const first = appendLessonError(undefined, attempt, 'first');
  const history = appendLessonError(
    first,
    { ...attempt, studentAnswer: 'de' },
    'second',
  );
  const shown = lessonErrorsForTeacher(
    { errorHistory: history, errorIds: [] },
    [exercise],
    normalize,
  );
  assert.equal(shown.length, 2);
  assert.deepEqual(
    new Set(shown.map((item) => item.studentAnswer)),
    new Set(['en', 'de']),
  );
  assert.equal(Object.keys(first).length, 1);
});

test('old unresolved errors remain visible without inventing student answers', () => {
  const shown = lessonErrorsForTeacher(
    { errorIds: [attempt.itemKey, 'old prompt::old answer'] },
    [exercise],
    normalize,
  );
  assert.equal(shown.length, 2);
  assert.equal(shown[0].studentAnswer, null);
  assert.equal(
    shown.find((item) => item.itemKey === 'old prompt::old answer')
      ?.correctAnswer,
    'old answer',
  );
  assert.equal(
    lessonErrorsForTeacher({ errors: [0] }, [exercise], normalize).length,
    1,
  );
});

test('independent mistake histories merge across devices without losing attempts', () => {
  const key = 'ritmo-lesson-progress';
  const base = { [key]: JSON.stringify({ home: { errorHistory: {} } }) };
  const local = {
    [key]: JSON.stringify({ home: { errorHistory: { first: attempt } } }),
  };
  const remote = {
    [key]: JSON.stringify({ home: { errorHistory: { second: attempt } } }),
  };
  const merged = mergeProgress(base, local, remote);
  assert.deepEqual(merged.conflicts, []);
  assert.equal(
    Object.keys(JSON.parse(merged.data[key]).home.errorHistory).length,
    2,
  );
});

test('lesson 4 covers prepositions in exactly 50 context-guided exercises', () => {
  const lesson = courseLessons.find((item) => item.number === '04')!;
  assert.equal(lesson.id, 'home');
  assert.equal(lesson.title, 'Предлоги');
  assert.equal(lesson.exercises.length, 50);
  assert.equal(new Set(lesson.exercises.map((item) => item.prompt)).size, 50);
  for (const item of lesson.exercises) {
    assert.ok(item.prompt.includes('('), item.prompt);
    assert.ok(item.explanation.length > 15);
    if (item.options)
      assert.equal(
        item.options.filter((value) => value === item.answer).length,
        1,
      );
  }
  for (const term of ['POR', 'PARA', 'DESDE', 'Местоимения', 'слияния'])
    assert.ok(
      lesson.theory.some((block) => block.title.includes(term)),
      term,
    );
});
