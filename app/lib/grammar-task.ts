import { grammarTranslation } from './grammar-translation.ts';
import type { GrammarExercise } from '../data/grammar-practice.ts';

export type GrammarTaskKind = 'type' | 'correction' | 'order' | 'choice';
const roundFormats: GrammarTaskKind[] = [
  'type',
  'correction',
  'order',
  'type',
  'choice',
  'type',
  'order',
  'correction',
  'type',
  'choice',
];

export const grammarTaskKind = (index: number, round = 0): GrammarTaskKind =>
  roundFormats[(index + (round % 5) * 2) % roundFormats.length];

export const grammarTaskFor = (
  question: GrammarExercise,
  kind: GrammarTaskKind,
) => {
  const sentence = question.prompt.replace('___', question.answer);
  if (kind === 'correction') {
    const wrong = question.options.find((option) => option !== question.answer);
    if (wrong)
      return {
        kind,
        label: 'Исправление ошибки',
        instruction: `${question.instruction} Замените форму глагола на требуемую в инструкции. Другая форма может быть допустима в ином контексте. Напишите только замену.`,
        prompt: question.prompt.replace('___', wrong),
        answer: question.answer,
      };
  }
  if (kind === 'order')
    return {
      kind,
      label: 'Перевод из слов',
      instruction: `${question.instruction} Переведите с русского на испанский, используя все слова.`,
      prompt: grammarTranslation(question.id),
      answer: sentence,
    };
  return {
    kind: kind === 'choice' ? ('choice' as const) : ('type' as const),
    label: kind === 'choice' ? 'Выбор ответа' : 'Ввод без вариантов',
    instruction: `${question.instruction}${kind === 'choice' ? '' : ' Напишите только пропущенную форму глагола.'}`,
    prompt: question.prompt,
    answer: question.answer,
  };
};

/** IDs preserve repeated words as separate selectable tokens. */
export const grammarOrderTokens = (sentence: string, seed: string) => {
  const tokens = sentence
    .split(/\s+/)
    .map((word, index) => ({ id: index, word }));
  let state = Array.from(seed).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    1,
  );
  for (let i = tokens.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
  }
  if (tokens.length > 1 && tokens.every((token, index) => token.id === index))
    [tokens[0], tokens[1]] = [tokens[1], tokens[0]];
  return tokens;
};
