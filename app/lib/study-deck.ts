import { inferGenderArticle, maskExactTerm } from './practice-content.ts';
import { inferWordPartOfSpeech } from './word-part-of-speech.ts';
import { baseCardKey, masteredRecord, normalizeText, type SRSRecord } from './learning-core.ts';
import { vocabularyTopics } from '../vocabulary.ts';
import type { StudyCard, CustomWord, LearnedWordRecord } from '../types/learning';
import { lessonCoreVocabulary, grammarReviewCards } from '../data/lesson-vocabulary.ts';

export const definiteArticleFor = (es: string, example: string, extraExample = '') => {
  const headword = es.split(' / ')[0].trim();
  if (/^(?:el|la|los|las)\s+/iu.test(headword)) return '';
  const singular = inferGenderArticle(headword, example, extraExample);
  if (singular) return singular;
  const escaped = headword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = `${example} ${extraExample}`.match(
    new RegExp(`\\b(el|la|los|las|un|una|unos|unas)\\s+${escaped}(?=\\b|[.,;:!?])`, 'iu'),
  );
  const found = match?.[1]?.toLocaleLowerCase('es') || '';
  return ({ un: 'el', una: 'la', unos: 'los', unas: 'las' } as Record<string, string>)[found] || found;
};

export const spanishStudyAnswer = (es: string, ru: string, example: string, extraExample = '') => {
  const article = definiteArticleFor(es, example, extraExample);
  const noun = inferWordPartOfSpeech(es, ru, example) === 'noun';
  return es
    .split(' / ')
    .map((variant) => {
      const word = variant.trim();
      return noun && article && !/^(?:el|la|los|las)\s+/iu.test(word)
        ? `${article} ${word}`
        : word;
    })
    .join(' / ');
};

export const wordWasStudied = (card: StudyCard, records: Record<string, SRSRecord>) =>
  Object.entries(records).some(
    ([key, record]) =>
      baseCardKey(key) === baseCardKey(card.key) && record.reviews > 0,
  );

export const wordIsLearned = (card: StudyCard, records: Record<string, SRSRecord>) => {
  const base = baseCardKey(card.key);
  return (
    masteredRecord(records[`${base}-recognition`]) &&
    masteredRecord(records[`${base}-production`])
  );
};

const lessonIdsForWord = (word: string) => {
  const normalized = normalizeText(word.split(' / ')[0]);
  return Object.entries(lessonCoreVocabulary)
    .filter(([, words]) =>
      words.some((item) => normalizeText(item.es.split(' / ')[0]) === normalized),
    )
    .map(([lessonId]) => lessonId);
};

const buildStudyDeck = (customWords: CustomWord[] = []): StudyCard[] => [
  ...vocabularyTopics.flatMap((topic) =>
    topic.entries.flatMap((entry) => {
      const base = entry.lexemeId || `${topic.name}-${entry.id}`,
        article = inferGenderArticle(
          entry.es,
          entry.example,
          entry.extraExample || '',
        ),
        contextWord = entry.es.split(' / ')[0],
        spanishAnswer = spanishStudyAnswer(
          entry.es,
          entry.ru,
          entry.example,
          entry.extraExample || '',
        ),
        contextPrompt = maskExactTerm(entry.example, contextWord),
        hasClearBlank = contextPrompt !== entry.example,
        examples = {
          level: topic.level,
          core: !!entry.core,
          exampleRu: entry.exampleRu,
          extraExample: entry.extraExample,
          extraExampleRu: entry.extraExampleRu,
          units: entry.units,
          lessonIds: lessonIdsForWord(entry.es),
        };
      const cards: StudyCard[] = [
        {
          key: `${base}-recognition`,
          topic: topic.name,
          es: entry.es,
          ru: entry.ru,
          example: entry.example,
          ...examples,
          skill: 'recognition',
          answer: entry.ru,
          prompt: `Напишите основной перевод из карточки: «${entry.es}»`,
        },
        {
          key: `${base}-production`,
          topic: topic.name,
          es: entry.es,
          ru: entry.ru,
          example: entry.example,
          ...examples,
          skill: 'production',
          answer: spanishAnswer,
          prompt: `Напишите изучаемое слово по-испански: «${entry.ru}». Существительное пишите с артиклем. Контекст: ${entry.exampleRu}`,
        },
        {
          key: `${base}-listening`,
          topic: topic.name,
          es: entry.es,
          ru: entry.ru,
          example: entry.example,
          ...examples,
          skill: 'listening',
          answer: entry.ru,
          prompt: 'Прослушайте слово и напишите основной перевод из карточки',
        },
        {
          key: `${base}-dictation`,
          topic: topic.name,
          es: entry.es,
          ru: entry.ru,
          example: entry.example,
          ...examples,
          skill: 'dictation',
          answer: spanishAnswer,
          prompt: 'Прослушайте слово и напишите услышанное по-испански. Существительное пишите с артиклем',
        },
      ];
      if (hasClearBlank)
        cards.push({
          key: `${base}-context`,
          topic: topic.name,
          es: entry.es,
          ru: entry.ru,
          example: entry.example,
          ...examples,
          skill: 'context',
          answer: contextWord,
          prompt: `Вставьте слово со значением «${entry.ru}»: ${contextPrompt}`,
        });
      if (article)
        cards.push({
          key: `${base}-article`,
          topic: topic.name,
          es: entry.es,
          ru: entry.ru,
          example: entry.example,
          ...examples,
          skill: 'article',
          answer: article,
          prompt: `Какой определённый артикль показывает род слова «${entry.es.split(/[ /]/)[0]}»?`,
        });
      return cards;
    }),
  ),
  ...customWords.flatMap((entry) => {
    const base = `Мои слова-${entry.id}`,
      spanishAnswer = spanishStudyAnswer(entry.es, entry.ru, entry.example, entry.extraExample),
      common = {
        topic: 'Мои слова',
        level: 'Личное' as const,
        core: false,
        es: entry.es,
        ru: entry.ru,
        example: entry.example,
        exampleRu: entry.exampleRu,
        extraExample: entry.extraExample,
        extraExampleRu: entry.extraExampleRu,
      };
    return [
      {
        ...common,
        key: `${base}-recognition`,
        skill: 'recognition' as const,
        answer: entry.ru,
        prompt: `Напишите основной перевод из карточки: «${entry.es}»`,
      },
      {
        ...common,
        key: `${base}-production`,
        skill: 'production' as const,
        answer: spanishAnswer,
        prompt: `Напишите изучаемое слово по-испански: «${entry.ru}». Существительное пишите с артиклем. Контекст: ${entry.exampleRu}`,
      },
      {
        ...common,
        key: `${base}-listening`,
        skill: 'listening' as const,
        answer: entry.ru,
        prompt: 'Прослушайте слово и напишите основной перевод из карточки',
      },
      {
        ...common,
        key: `${base}-dictation`,
        skill: 'dictation' as const,
        answer: spanishAnswer,
        prompt: 'Прослушайте слово и напишите услышанное по-испански. Существительное пишите с артиклем',
      },
    ];
  }),
  ...grammarReviewCards,
];

const studyDeckCache = new Map<string, StudyCard[]>();

export const makeStudyDeck = (customWords: CustomWord[] = []): StudyCard[] => {
  const signature = JSON.stringify(
    customWords.map((word) => [
      word.id,
      word.es,
      word.ru,
      word.example,
      word.exampleRu,
      word.extraExample,
      word.extraExampleRu,
    ]),
  );
  const cached = studyDeckCache.get(signature);
  if (cached) return cached;
  const deck = buildStudyDeck(customWords);
  studyDeckCache.set(signature, deck);
  return deck;
};

export const auditVocabularyPracticeSync = () => {
  const deck = makeStudyDeck(),
    byKey = new Map(deck.map((card) => [card.key, card])),
    issues: string[] = [];
  vocabularyTopics.forEach((topic) =>
    topic.entries.forEach((entry) => {
      const base = `${topic.name}-${entry.id}`,
        expected = [
          ['recognition', entry.ru],
          ['production', spanishStudyAnswer(entry.es, entry.ru, entry.example, entry.extraExample || '')],
          ['listening', entry.ru],
          ['dictation', spanishStudyAnswer(entry.es, entry.ru, entry.example, entry.extraExample || '')],
        ] as const;
      expected.forEach(([skill, answer]) => {
        const card = byKey.get(`${base}-${skill}`);
        if (!card) issues.push(`${base}: отсутствует ${skill}`);
        else if (
          card.es !== entry.es ||
          card.ru !== entry.ru ||
          card.answer !== answer
        )
          issues.push(
            `${base}-${skill}: Vocabulary «${entry.es} — ${entry.ru}», Practice «${card.es} — ${card.ru}», ответ «${card.answer}»`,
          );
      });
    }),
  );
  return {
    vocabularyWords: vocabularyTopics.reduce(
      (sum, topic) => sum + topic.entries.length,
      0,
    ),
    practiceVocabularyCards: deck.filter((card) =>
      vocabularyTopics.some((topic) => topic.name === card.topic),
    ).length,
    issues,
  };
};

export const learnedWordDictationCards = (words: LearnedWordRecord[]): StudyCard[] =>
  words.map((word) => ({
    key: `lesson-db-${word.id}-dictation`,
    topic: word.lessonTitle,
    level: 'Урок',
    es: word.es,
    ru: word.ru,
    example: word.example,
    exampleRu: word.exampleRu,
    extraExample: word.example,
    extraExampleRu: word.exampleRu,
    skill: 'dictation',
    answer: word.es,
    prompt: 'Прослушайте слово или предложение и запишите услышанное',
  }));
