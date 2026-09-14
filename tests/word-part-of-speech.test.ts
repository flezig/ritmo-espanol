import test from 'node:test';
import assert from 'node:assert/strict';
import { inferWordPartOfSpeech } from '../app/lib/word-part-of-speech.ts';

test('infers verbs from the Spanish and Russian infinitives together', () => {
  for (const [es, ru] of [
    ['hablar', 'говорить'],
    ['levantarse', 'вставать'],
    ['ir', 'идти'],
    ['beber', 'пить'],
  ]) assert.equal(inferWordPartOfSpeech(es, ru), 'verb', `${es} — ${ru}`);
});

test('does not mistake Spanish noun endings for verbs', () => {
  for (const [es, ru] of [
    ['mujer', 'женщина'],
    ['lugar', 'место'],
    ['hogar', 'дом'],
    ['taller', 'мастерская'],
  ]) assert.equal(inferWordPartOfSpeech(es, ru), 'noun', `${es} — ${ru}`);
});

test('keeps other common parts of speech separate', () => {
  assert.equal(inferWordPartOfSpeech('simpático', 'приятный'), 'adjective');
  assert.equal(inferWordPartOfSpeech('siempre', 'всегда'), 'adverb');
  assert.equal(inferWordPartOfSpeech('nosotros', 'мы'), 'pronoun');
  assert.equal(inferWordPartOfSpeech('con', 'с'), 'preposition');
  assert.equal(inferWordPartOfSpeech('pero', 'но'), 'conjunction');
  assert.equal(inferWordPartOfSpeech('hola', 'привет'), 'interjection');
});
