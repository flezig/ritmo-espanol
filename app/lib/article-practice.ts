export type SpanishArticle = 'el' | 'la';

export type ArticlePracticeQuestion = {
  id: string;
  kind: 'article' | 'meaning-article' | 'article-meaning';
  prompt: string;
  answer: string;
  options: string[];
  explanation: string;
};

type ArticleNoun = {
  word: string;
  translation: string;
  article: SpanishArticle;
  rule: string;
};

const stressedARule =
  'Существительное женского рода, но в единственном числе перед ударным a- или ha- используется el. Во множественном числе снова будет las.';

export const articleNouns: ArticleNoun[] = [
  ...[
    ['agua', 'вода'], ['águila', 'орёл'], ['ala', 'крыло'], ['alma', 'душа'],
    ['alga', 'водоросль'], ['ama', 'хозяйка'], ['ancla', 'якорь'], ['ánfora', 'амфора'],
    ['ansia', 'сильное желание'], ['arca', 'сундук'], ['área', 'область'], ['arma', 'оружие'],
    ['arpa', 'арфа'], ['asta', 'древко'], ['aula', 'аудитория'], ['ave', 'птица'],
    ['acta', 'протокол'], ['hacha', 'топор'], ['hada', 'фея'], ['hambre', 'голод'],
    ['habla', 'речь'], ['haya', 'бук'],
  ].map(([word, translation]) => ({ word, translation, article: 'el' as const, rule: stressedARule })),
  { word: 'a', translation: 'буква a', article: 'la', rule: 'Названия букв — женского рода: la a. Правило об ударном a- здесь не применяется.' },
  { word: 'hache', translation: 'буква h', article: 'la', rule: 'Названия букв — женского рода: la hache.' },
  ...[
    ['problema', 'проблема'], ['tema', 'тема'], ['sistema', 'система'], ['programa', 'программа'],
    ['idioma', 'язык'], ['clima', 'климат'], ['poema', 'стихотворение'], ['drama', 'драма'],
    ['esquema', 'схема'], ['diploma', 'диплом'], ['panorama', 'панорама'], ['teorema', 'теорема'],
    ['dilema', 'дилемма'], ['emblema', 'эмблема'], ['enigma', 'загадка'], ['fantasma', 'призрак'],
    ['lema', 'девиз'], ['síntoma', 'симптом'], ['trauma', 'травма'], ['dogma', 'догма'],
    ['magma', 'магма'], ['plasma', 'плазма'], ['prisma', 'призма'], ['axioma', 'аксиома'],
    ['aroma', 'аромат'], ['edema', 'отёк'], ['fonema', 'фонема'], ['morfema', 'морфема'],
    ['lexema', 'лексема'], ['telegrama', 'телеграмма'], ['diagrama', 'диаграмма'],
    ['pentagrama', 'нотный стан'], ['cromosoma', 'хромосома'],
  ].map(([word, translation]) => ({
    word,
    translation,
    article: 'el' as const,
    rule: 'Многие слова греческого происхождения на -ma имеют мужской род и употребляются с el.',
  })),
  ...[
    ['cama', 'кровать'], ['crema', 'крем'], ['forma', 'форма'], ['firma', 'подпись'],
    ['goma', 'ластик'], ['norma', 'норма'], ['palma', 'ладонь'], ['pluma', 'ручка'],
    ['trama', 'сюжет'], ['alarma', 'тревога'], ['lágrima', 'слеза'], ['víctima', 'жертва'],
    ['cima', 'вершина'],
  ].map(([word, translation]) => ({
    word,
    translation,
    article: 'la' as const,
    rule: 'Окончание -ma само по себе не определяет род: это женское существительное и требует la.',
  })),
  ...[
    ['mano', 'рука'], ['foto', 'фотография'], ['moto', 'мотоцикл'], ['radio', 'радио'],
    ['libido', 'либидо'],
  ].map(([word, translation]) => ({
    word,
    translation,
    article: 'la' as const,
    rule: word === 'foto' || word === 'moto'
      ? 'Это сокращение женского слова, поэтому сохраняется la: fotografía → foto, motocicleta → moto.'
      : 'Это женское исключение среди существительных, оканчивающихся на -o.',
  })),
  ...[
    ['flor', 'цветок'], ['labor', 'труд'], ['coliflor', 'цветная капуста'],
  ].map(([word, translation]) => ({
    word,
    translation,
    article: 'la' as const,
    rule: 'Существительные на -or часто мужского рода, но это слово — женское исключение.',
  })),
  ...[
    ['costumbre', 'привычка'], ['cumbre', 'вершина'], ['incertidumbre', 'неопределённость'],
    ['muchedumbre', 'толпа'],
  ].map(([word, translation]) => ({
    word,
    translation,
    article: 'la' as const,
    rule: 'Существительные на -umbre обычно женского рода и употребляются с la.',
  })),
  ...[
    ['manzano', 'яблоня', 'el'], ['manzana', 'яблоко', 'la'],
    ['naranjo', 'апельсиновое дерево', 'el'], ['naranja', 'апельсин', 'la'],
    ['cerezo', 'вишнёвое дерево', 'el'], ['cereza', 'вишня', 'la'],
    ['ciruelo', 'сливовое дерево', 'el'], ['ciruela', 'слива', 'la'],
  ].map(([word, translation, article]) => ({
    word,
    translation,
    article: article as SpanishArticle,
    rule: 'Полезная модель: название дерева часто мужского рода, а название его плода — женского. Это не абсолютное правило.',
  })),
];

export const articleMeaningPairs = [
  { word: 'capital', masculine: 'капитал', feminine: 'столица' },
  { word: 'cometa', masculine: 'комета', feminine: 'воздушный змей' },
  { word: 'cura', masculine: 'священник', feminine: 'лечение' },
  { word: 'frente', masculine: 'фронт', feminine: 'лоб' },
  { word: 'orden', masculine: 'порядок', feminine: 'приказ' },
  { word: 'pendiente', masculine: 'серьга', feminine: 'склон' },
  { word: 'radio', masculine: 'радиус', feminine: 'радио' },
  { word: 'coma', masculine: 'кома', feminine: 'запятая' },
] as const;

const shuffled = <T,>(items: T[], random: () => number) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
};

const articleQuestions = (): ArticlePracticeQuestion[] =>
  articleNouns.map((item) => ({
    id: `article-${item.article}-${item.word}`,
    kind: 'article',
    prompt: `Выберите артикль: ___ ${item.word} — «${item.translation}».`,
    answer: item.article,
    options: ['el', 'la'],
    explanation: `${item.article} ${item.word} — «${item.translation}». ${item.rule}`,
  }));

const meaningArticleQuestions = (): ArticlePracticeQuestion[] =>
  articleMeaningPairs.flatMap((item) => [
    {
      id: `meaning-article-el-${item.word}`,
      kind: 'meaning-article' as const,
      prompt: `Нужно передать значение «${item.masculine}». Выберите правильное сочетание.`,
      answer: `el ${item.word}`,
      options: [`el ${item.word}`, `la ${item.word}`],
      explanation: `el ${item.word} — «${item.masculine}», а la ${item.word} — «${item.feminine}». Артикль меняет значение слова.`,
    },
    {
      id: `meaning-article-la-${item.word}`,
      kind: 'meaning-article' as const,
      prompt: `Нужно передать значение «${item.feminine}». Выберите правильное сочетание.`,
      answer: `la ${item.word}`,
      options: [`el ${item.word}`, `la ${item.word}`],
      explanation: `la ${item.word} — «${item.feminine}», а el ${item.word} — «${item.masculine}». Артикль меняет значение слова.`,
    },
  ]);

const articleMeaningQuestions = (): ArticlePracticeQuestion[] => {
  const translations = articleMeaningPairs.flatMap((item) => [item.masculine, item.feminine]);
  return articleMeaningPairs.flatMap((item) => [
    { article: 'el', answer: item.masculine },
    { article: 'la', answer: item.feminine },
  ].map(({ article, answer }) => ({
    id: `article-meaning-${article}-${item.word}`,
    kind: 'article-meaning' as const,
    prompt: `Что означает «${article} ${item.word}»?`,
    answer,
    options: [answer, ...translations.filter((value) => value !== answer).slice(0, 3)],
    explanation: `${article} ${item.word} — «${answer}». С другим артиклем значение этого слова меняется.`,
  })));
};

export const createArticlePracticeSession = (
  random: () => number = Math.random,
  count = 10,
) => {
  const ordinary = shuffled(articleQuestions(), random).slice(0, 6),
    byMeaning = shuffled(meaningArticleQuestions(), random).slice(0, 2),
    translations = shuffled(articleMeaningQuestions(), random).slice(0, 2),
    selected = shuffled([...ordinary, ...byMeaning, ...translations], random).slice(0, count);
  return selected.map((question) => ({
    ...question,
    options: shuffled(question.options, random),
  }));
};
