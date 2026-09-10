import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasUsableMaskedContext,
  inferGenderArticle,
  makeSingleWordCorrection,
  maskExactTerm,
} from '../app/lib/practice-content.ts';
import { vocabularyTopics } from '../app/vocabulary.ts';

test('article tasks exclude common-gender and ambiguous nouns', () => {
  assert.equal(
    inferGenderArticle('cantante', 'Maluma es un cantante colombiano.'),
    '',
  );
  assert.equal(
    inferGenderArticle(
      'joven',
      'El joven vive aquí.',
      'La joven estudia medicina.',
    ),
    '',
  );
  assert.equal(inferGenderArticle('casa', 'Vivo en una casa grande.'), 'la');
  assert.equal(inferGenderArticle('problema', 'El problema es difícil.'), 'el');
  assert.equal(inferGenderArticle('casas', 'Las casas son nuevas.'), '');
});

test('context masking replaces only the complete studied term', () => {
  assert.equal(maskExactTerm('Vamos a casa.', 'a'), 'Vamos _____ casa.');
  assert.equal(maskExactTerm('La cama está aquí.', 'ama'), 'La cama está aquí.');
  assert.equal(hasUsableMaskedContext('Hace frío.', '_____.'), false);
  assert.equal(
    hasUsableMaskedContext(
      '¿Dónde recojo el equipaje?',
      '_____',
    ),
    false,
  );
  assert.equal(
    hasUsableMaskedContext('Hoy hace frío.', 'Hoy _____.'),
    true,
  );
});

test('correction tasks always target the studied single word', () => {
  const regular = makeSingleWordCorrection({
    es: 'casa',
    example: 'La casa está cerca.',
  });
  assert.equal(regular?.answer, 'casa');
  assert.notEqual(regular?.sentence, 'La casa está cerca.');
  assert.equal(
    makeSingleWordCorrection({ es: 'hablar', example: 'Hablo español.' }),
    null,
  );
  assert.equal(
    makeSingleWordCorrection({
      es: 'buenos días',
      example: 'Buenos días, Ana.',
    }),
    null,
  );
  assert.deepEqual(
    makeSingleWordCorrection({
      es: 'canción',
      example: 'Esta canción es bonita.',
    }),
    { sentence: 'Esta cancion es bonita.', answer: 'canción' },
  );
});

test('the full vocabulary produces only unambiguous article cards', () => {
  const articleCards = vocabularyTopics.flatMap((topic) =>
    topic.entries.flatMap((entry) => {
      const article = inferGenderArticle(
        entry.es,
        entry.example,
        entry.extraExample || '',
      );
      return article ? [{ word: entry.es, article }] : [];
    }),
  );
  assert.ok(articleCards.length > 150);
  assert.equal(
    articleCards.every((card) => card.article === 'el' || card.article === 'la'),
    true,
  );
  assert.equal(
    articleCards.some((card) => /(ista|ante|ente)$/iu.test(card.word)),
    false,
  );
});

test('all generated correction tasks alter only a present headword', () => {
  for (const topic of vocabularyTopics) {
    for (const entry of topic.entries) {
      const task = makeSingleWordCorrection(entry);
      if (!task) continue;
      assert.notEqual(task.sentence, entry.example, entry.es);
      assert.equal(
        task.answer.toLocaleLowerCase('es'),
        entry.es.toLocaleLowerCase('es'),
        entry.es,
      );
      assert.equal(entry.example.includes(task.answer), true, entry.es);
    }
  }
});
