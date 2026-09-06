const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const exactTermPattern = (term: string, global = false) =>
  new RegExp(
    `(?<!\\p{L})${escapeRegex(term)}(?!\\p{L})`,
    global ? 'giu' : 'iu',
  );

const commonGenderWords = new Set([
  'colega',
  'guía',
  'joven',
  'modelo',
  'policía',
  'testigo',
]);

export const inferGenderArticle = (es: string, ...examples: string[]) => {
  const term = es.trim().split(/\s+\/\s+/)[0],
    normalized = term.toLocaleLowerCase('es');
  if (
    !term ||
    /\s/.test(term) ||
    /(ista|ante|ente)$/iu.test(normalized) ||
    commonGenderWords.has(normalized)
  )
    return '';

  const articlePattern = new RegExp(
      `(?<!\\p{L})(el|la|los|las|un|una|unos|unas)\\s+${escapeRegex(term)}(?!\\p{L})`,
      'giu',
    ),
    genders = new Set<'el' | 'la'>();
  examples.forEach((example) => {
    for (const match of example.matchAll(articlePattern)) {
      const article = match[1].toLocaleLowerCase('es');
      if (article === 'el' || article === 'un') genders.add('el');
      if (article === 'la' || article === 'una') genders.add('la');
    }
  });
  return genders.size === 1 ? [...genders][0] : '';
};

export const maskExactTerm = (
  text: string,
  term: string,
  replacement = '_____',
) => text.replace(exactTermPattern(term), replacement);

const misspell = (word: string) => {
  if (/[áéíóúü]/iu.test(word))
    return word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/ñ/iu.test(word)) return word.replace(/ñ/iu, (letter) =>
    letter === letter.toUpperCase() ? 'N' : 'n',
  );
  const characters = Array.from(word);
  if (characters.length < 4) return '';
  const removeAt = Math.min(characters.length - 2, Math.max(1, Math.floor(characters.length / 2)));
  return characters.filter((_, index) => index !== removeAt).join('');
};

export type CorrectionTask = { sentence: string; answer: string };

export const makeSingleWordCorrection = (card: {
  es: string;
  example: string;
}): CorrectionTask | null => {
  const term = card.es.trim().split(/\s+\/\s+/)[0];
  if (!term || /\s/.test(term)) return null;
  const match = card.example.match(exactTermPattern(term))?.[0];
  if (!match) return null;
  const mistaken = misspell(match);
  if (!mistaken || mistaken.toLocaleLowerCase('es') === match.toLocaleLowerCase('es'))
    return null;
  return {
    sentence: card.example.replace(exactTermPattern(match), mistaken),
    answer: match,
  };
};
