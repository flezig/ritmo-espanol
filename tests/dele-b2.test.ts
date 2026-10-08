import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deleB2Tasks,
  deleB2Sources,
  countDeleWords,
} from '../app/data/dele-b2.ts';
import { grammarQuestionBanks } from '../app/data/grammar.ts';

test('B2 covers both written options and all three oral tasks with original practice and official sources', () => {
  assert.deepEqual(
    deleB2Tasks.map((task) => task.id),
    ['written-1', 'written-2a', 'written-2b', 'oral-1', 'oral-2', 'oral-3'],
  );
  for (const task of deleB2Tasks) {
    assert.ok(
      new URL(deleB2Sources[task.source].url).hostname.endsWith('cervantes.es'),
    );
    assert.ok(task.practice && task.template && task.example);
    assert.ok(task.steps.length >= 3 && task.checklist.length >= 5);
  }
});
test('draft word counter handles empty input, newlines and repeated whitespace', () => {
  assert.equal(countDeleWords(' \n '), 0);
  assert.equal(countDeleWords('Hola,  Ana.\n¿Qué tal?'), 4);
  assert.equal(countDeleWords(Array(150).fill('palabra').join(' ')), 150);
});
test('grammar avoids classifying a legitimate past-tense reading as an error', () => {
  const questions = grammarQuestionBanks.flat();
  assert.equal(
    questions.some(
      (q) => q.answer === 'Cuando era niño, fui al colegio cada día.',
    ),
    false,
  );
  assert.ok(
    questions.some(
      (q) =>
        q.answer === 'Ayer yo fuí al colegio.' &&
        q.tip.includes('без знака ударения'),
    ),
  );
  assert.ok(
    questions
      .find((q) => q.options.includes('a el'))
      ?.prompt.includes('Направление'),
  );
  for (const q of questions) {
    assert.equal(
      q.options.filter((option) => option === q.answer).length,
      1,
      q.prompt,
    );
  }
});

test('full written models fit the exam length and every task has a complete example and external reference', async () => {
  const { deleFullExamples, deleOnlineExamples, deleTopics } =
    await import('../app/data/dele-b2-library.ts');
  for (const task of deleB2Tasks) {
    const models = deleFullExamples.filter(
      (example) => example.task === task.id,
    );
    assert.ok(models.length, task.id);
    assert.ok(
      deleOnlineExamples.some((example) => example.task === task.id),
      task.id,
    );
    for (const model of models) {
      assert.ok(
        deleTopics.some((topic) => topic.id === model.topic),
        model.id,
      );
      if (task.part === 'written') {
        const count = countDeleWords(model.text);
        assert.ok(count >= 150 && count <= 180, `${model.id}: ${count}`);
        assert.ok(model.text.split('\n').filter(Boolean).length >= 4);
      } else {
        assert.ok(
          model.text.includes('ENTREVISTADOR:') &&
            model.text.includes('CANDIDATO:'),
        );
        assert.ok(countDeleWords(model.text) >= 300);
      }
    }
  }
});

test('each topic supplies writing, all three oral tasks, translated vocabulary and grammar examples', async () => {
  const { deleTopics } = await import('../app/data/dele-b2-library.ts');
  assert.ok(deleTopics.length >= 10);
  assert.equal(
    new Set(deleTopics.map((topic) => topic.id)).size,
    deleTopics.length,
  );
  for (const topic of deleTopics) {
    assert.ok(topic.written && topic.angle);
    assert.equal(topic.oral.length, 3);
    assert.ok(topic.words.length >= 8);
    assert.ok(topic.words.every(([es, ru]) => es && ru));
    assert.ok(topic.constructions.length >= 3);
    assert.ok(
      topic.constructions.every(
        ([form, meaning, example]) => form && meaning && example,
      ),
    );
  }
});
