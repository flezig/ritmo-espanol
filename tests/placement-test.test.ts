import assert from 'node:assert/strict';
import test from 'node:test';
import {
  placementAnswerIsCorrect,
  placementQuestionSets,
  placementSkills,
  scorePlacement,
  type PlacementLevel,
} from '../app/lib/placement-test.ts';

const levels: PlacementLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

test('every placement attempt has 40 balanced questions from A1 through C1', () => {
  assert.equal(placementQuestionSets.length >= 2, true);
  placementQuestionSets.forEach((questions) => {
    assert.equal(questions.length, 40);
    assert.equal(new Set(questions.map((question) => question.id)).size, 40);
    placementSkills.forEach((skill) => {
      const section = questions.filter((question) => question.skill === skill);
      assert.equal(section.length, 10);
      levels.forEach((level) =>
        assert.equal(section.filter((question) => question.level === level).length, 2),
      );
    });
  });
  assert.notDeepEqual(
    placementQuestionSets[0].map((question) => question.prompt),
    placementQuestionSets[1].map((question) => question.prompt),
  );
});

test('placement answers ignore punctuation and capitalization', () => {
  assert.equal(placementAnswerIsCorrect('¡¡ME LLAMO ANA, Y VIVO EN MOSCÚ!!', ['Me llamo Ana y vivo en Moscú']), true);
  assert.equal(placementAnswerIsCorrect('No es que no esté de acuerdo; sino que necesito pruebas.', ['No es que no esté de acuerdo sino que necesito pruebas']), true);
});

test('writing accepts listed natural alternatives and rejects another meaning', () => {
  const writing = placementQuestionSets[0].find((question) => question.id === 's1-w-5');
  assert.ok(writing);
  assert.equal(placementAnswerIsCorrect('OJALÁ TODO TE SALGA BIEN!!!', writing.answers), true);
  assert.equal(placementAnswerIsCorrect('No quiero hacerlo', writing.answers), false);
});

test('perfect diagnostic reaches C1 and empty diagnostic stays at A1', () => {
  const questions = placementQuestionSets[0],
    perfect = Object.fromEntries(questions.map((question) => [question.id, question.answers[0]]));
  assert.equal(scorePlacement(perfect, questions, 1).level, 'C1');
  assert.equal(scorePlacement({}, questions, 1).level, 'A1');
});
