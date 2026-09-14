export type WordPartOfSpeech =
  | 'verb'
  | 'noun'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'numeral'
  | 'interjection'
  | 'phrase';

const normalize = (value: string) =>
  value
    .normalize('NFC')
    .toLocaleLowerCase('es')
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[¿?¡!.,:;()«»“”"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const firstMeaning = (value: string) => normalize(value.split(/[;/]/)[0]);

const spanishPrepositions = new Set([
  'a', 'ante', 'bajo', 'con', 'contra', 'de', 'desde', 'durante', 'en',
  'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'segun', 'sin',
  'sobre', 'tras', 'al lado de', 'antes de', 'cerca de', 'debajo de',
  'delante de', 'dentro de', 'despues de', 'detras de', 'encima de',
  'fuera de', 'junto a', 'lejos de',
]);
const spanishConjunctions = new Set([
  'aunque', 'como', 'e', 'mientras', 'ni', 'o', 'pero', 'porque', 'que',
  'si', 'sino', 'u', 'y',
]);
const spanishPronouns = new Set([
  'algo', 'alguien', 'cual', 'cuales', 'el', 'ella', 'ellas', 'ellos',
  'esto', 'mi', 'mis', 'nada', 'nadie', 'nosotros', 'nosotras', 'nuestro',
  'nuestra', 'nuestros', 'nuestras', 'quien', 'quienes', 'se', 'su', 'sus',
  'te', 'ti', 'tu', 'tus', 'usted', 'ustedes', 'vosotros', 'vosotras', 'yo',
]);
const spanishInterjections = new Set([
  'adios', 'bienvenido', 'bienvenida', 'gracias', 'hola', 'no', 'perdon',
  'por favor', 'si',
]);
const spanishAdverbs = new Set([
  'ahora', 'aqui', 'alli', 'alla', 'antes', 'ayer', 'bien', 'casi', 'cerca',
  'despacio', 'despues', 'entonces', 'hoy', 'jamas', 'lejos', 'luego', 'mal',
  'manana', 'mas', 'menos', 'mucho', 'muy', 'nunca', 'poco', 'pronto',
  'rapido', 'siempre', 'solo', 'tambien', 'tarde', 'temprano', 'todavia',
  'ya',
]);
const russianAdverbs = new Set([
  'всегда', 'вчера', 'затем', 'здесь', 'иногда', 'никогда', 'обычно',
  'плохо', 'поздно', 'потом', 'рано', 'сегодня', 'сейчас', 'сначала',
  'там', 'тоже', 'хорошо', 'быстро', 'медленно', 'рядом', 'далеко',
]);
const spanishVerbLookalikes = new Set([
  'ayer', 'bar', 'hogar', 'lugar', 'mar', 'mujer', 'taller',
]);
const russianInfinitives = new Set([
  'быть', 'дать', 'есть', 'идти', 'лечь', 'мочь', 'печь', 'пить', 'сесть',
]);

const isVerbPair = (es: string, ru: string) => {
  const spanishFirst = es.split(' ')[0],
    russianFirst = ru.split(' ')[0],
    spanishVerb =
      !spanishVerbLookalikes.has(spanishFirst) &&
      /(?:ar|er|ir|arse|erse|irse)$/.test(spanishFirst),
    russianVerb =
      russianInfinitives.has(russianFirst) ||
      /(?:ть|ться|ти|тись|чь|чься)$/.test(russianFirst);
  return spanishVerb && russianVerb;
};

const knownSpanishAdjectives = new Set([
  'azul', 'feliz', 'facil', 'dificil', 'joven', 'mayor', 'menor', 'mejor',
  'peor', 'util',
]);

const isAdjective = (es: string, ru: string) => {
  const first = ru.split(' ')[0],
    spanishFirst = es.split(' ')[0],
    spanishAdjectiveShape =
      knownSpanishAdjectives.has(spanishFirst) ||
      /(?:o|a|os|as|e|es|al|ales|ble|bles|ente|entes|ante|antes|ico|ica|icos|icas|oso|osa|osos|osas|ivo|iva|ivos|ivas|ario|aria|arios|arias|dor|dora|dores|doras)$/.test(
        spanishFirst,
      );
  return (
    spanishAdjectiveShape &&
    (/(?:ый|ий|ой|ая|яя|ое|ее|ые|ие|ого|его|ому|ему|ым|им|ую|юю|ых|их)$/.test(first) ||
      new Set([
        'бесплатен', 'важен', 'виноват', 'готов', 'женат', 'занят', 'закрыт',
        'известен', 'нужен', 'обязан', 'открыт', 'похож', 'полон', 'прав',
        'свободен', 'согласен', 'холост',
      ]).has(first))
  );
};

const isNounInExample = (es: string, example: string) => {
  if (!example || es.includes(' ')) return false;
  const normalizedExample = ` ${normalize(example)} `,
    escaped = es.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b(?:el|la|los|las|un|una|unos|unas) ${escaped}\\b`).test(
    normalizedExample,
  );
};

/**
 * Classifies a vocabulary pair for plausible multiple-choice distractors.
 * The Russian and Spanish sides are considered together so nouns such as
 * «lugar» and «mujer» are not mistaken for infinitives by their ending.
 */
export const inferWordPartOfSpeech = (
  spanish: string,
  russian: string,
  example = '',
): WordPartOfSpeech => {
  const es = firstMeaning(spanish),
    ru = firstMeaning(russian);
  if (spanishInterjections.has(es)) return 'interjection';
  if (spanishPrepositions.has(es)) return 'preposition';
  if (spanishConjunctions.has(es)) return 'conjunction';
  if (spanishPronouns.has(es)) return 'pronoun';
  if (/^\d/.test(es) || /^\d/.test(ru)) return 'numeral';
  if (isVerbPair(es, ru)) return 'verb';
  if (isNounInExample(es, example)) return 'noun';
  if (isAdjective(es, ru)) return 'adjective';
  if (es.endsWith('mente') || spanishAdverbs.has(es) || russianAdverbs.has(ru))
    return 'adverb';
  if (es.includes(' ') && ru.includes(' ')) return 'phrase';
  return 'noun';
};
