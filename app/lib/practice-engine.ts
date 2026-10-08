import {
  baseCardKey,
  normalizeText,
  type ReviewGrade,
  type SRSRecord,
  type WordStatus,
} from './learning-core';
import type { WordSessionRecord, WordSessionProgress } from './word-sessions';
import { vocabularyBrowseTopics, vocabularyTopics } from '../vocabulary';
import { courseLessons } from '../lessons';
import { makeSingleWordCorrection } from './practice-content';
import { STANDARD_RECOGNITION_DISTRIBUTION, limitChoiceFormat } from './practice-distribution';
import { inferWordPartOfSpeech } from './word-part-of-speech';
import type { StudyCard, PracticeProgressBaseline, WordHistoryRecord, SessionMode, SkillType, ResponseKind, PracticeLevel, PracticeCollection } from '../types/learning';
import { wordIsLearned } from './study-deck';

export const newPracticeSessionId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const capturePracticeBaseline = (cards: StudyCard[]): PracticeProgressBaseline => {
  const read = <T,>(key: string): Record<string, T> => {
      try {
        return JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        return {};
      }
    },
    records = read<SRSRecord>('ritmo-srs'),
    statuses = read<WordStatus>('ritmo-word-progress'),
    history = read<WordHistoryRecord>('ritmo-word-history'),
    sessions = read<WordSessionRecord>('ritmo-word-sessions'),
    cardKeys = [...new Set(cards.map((card) => card.key))],
    wordKeys = [...new Set(cards.map((card) => baseCardKey(card.key)))];
  return {
    srs: Object.fromEntries(cardKeys.map((key) => [key, records[key] || null])),
    wordProgress: Object.fromEntries(wordKeys.map((key) => [key, statuses[key] || null])),
    wordHistory: Object.fromEntries(wordKeys.map((key) => [key, history[key] || null])),
    wordSessions: Object.fromEntries(wordKeys.map((key) => [key, sessions[key] || null])),
    deviceProfile: localStorage.getItem('ritmo-device-profile'),
    achievementStats: localStorage.getItem('ritmo-achievement-stats'),
    achievementUnlocks: localStorage.getItem('ritmo-achievements'),
    errorProfile: localStorage.getItem('ritmo-error-profile'),
    latestAchievement: localStorage.getItem('ritmo-latest-achievement'),
  };
};

export const restorePracticeBaseline = (baseline: PracticeProgressBaseline) => {
  const restore = (key: string, value: string | null) => {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  },
  restoreEntries = <T,>(key: string, snapshot: Record<string, T | null>) => {
    let current: Record<string, T> = {};
    try {
      current = JSON.parse(localStorage.getItem(key) || '{}');
    } catch {}
    Object.entries(snapshot).forEach(([entryKey, value]) => {
      if (value === null) delete current[entryKey];
      else current[entryKey] = value;
    });
    localStorage.setItem(key, JSON.stringify(current));
  };
  restoreEntries('ritmo-srs', baseline.srs);
  restoreEntries('ritmo-word-progress', baseline.wordProgress);
  restoreEntries('ritmo-word-history', baseline.wordHistory);
  restoreEntries('ritmo-word-sessions', baseline.wordSessions || {});
  restore('ritmo-device-profile', baseline.deviceProfile);
  restore('ritmo-achievement-stats', baseline.achievementStats);
  restore('ritmo-achievements', baseline.achievementUnlocks);
  restore('ritmo-error-profile', baseline.errorProfile);
  restore('ritmo-latest-achievement', baseline.latestAchievement);
  window.dispatchEvent(new Event('ritmo-srs'));
  window.dispatchEvent(new Event('ritmo-word-progress'));
  window.dispatchEvent(new Event('ritmo-word-sessions'));
  window.dispatchEvent(new Event('ritmo-profile'));
  window.dispatchEvent(new Event('ritmo-achievement-stats'));
  window.dispatchEvent(new Event('ritmo-achievements'));
  window.dispatchEvent(new Event('ritmo-errors'));
  window.dispatchEvent(new Event('ritmo-cloud-progress-changed'));
};

export const buildSession = (
  deck: StudyCard[],
  records: Record<string, SRSRecord>,
  mode: SessionMode,
) => {
  const now = Date.now(),
    count = mode === 'five' ? 16 : 30;
  let pool: StudyCard[] = [];
  if (mode === 'favorites')
    pool = deck.filter((card) => records[card.key]?.favorite);
  else if (mode === 'errors')
    pool = deck
      .filter(
        (card) =>
          records[card.key]?.reviews &&
          records[card.key].nextReview <= now &&
          (records[card.key].lapses > 0 ||
            records[card.key].lastGrade === 'again'),
      )
      .sort(
        (a, b) =>
          records[b.key].lapses - records[a.key].lapses ||
          records[b.key].difficulty - records[a.key].difficulty,
      );
  else {
    const due = deck
      .filter(
        (card) =>
          records[card.key]?.nextReview <= now && records[card.key]?.reviews,
      )
      .sort((a, b) => records[a.key].nextReview - records[b.key].nextReview);
    const weak = deck
      .filter(
        (card) =>
          records[card.key]?.difficulty >= 6.2 &&
          records[card.key].nextReview <= now,
      )
      .sort((a, b) => records[b.key].difficulty - records[a.key].difficulty);
    const readyReviewKeys = new Set<string>(),
      readyReviews = [...due, ...weak].filter((card) => {
        if (readyReviewKeys.has(card.key)) return false;
        readyReviewKeys.add(card.key);
        return true;
      }),
      cardsByBase = new Map<string, StudyCard[]>(),
      wordBases: string[] = [],
      wordBaseSet = new Set<string>();
    deck.forEach((card) => {
      const base = baseCardKey(card.key),
        group = cardsByBase.get(base);
      if (group) group.push(card);
      else cardsByBase.set(base, [card]);
      if (card.skill === 'recognition' && !wordBaseSet.has(base)) {
        wordBaseSet.add(base);
        wordBases.push(base);
      }
    });
    const
      unfinishedBases = wordBases.filter((base) => {
        const group = cardsByBase.get(base) || [],
          reviewed = group.filter((card) => records[card.key]?.reviews).length,
          unreviewed = group.length - reviewed;
        return reviewed > 0 && unreviewed > 0;
      }),
      freshBases = wordBases
        .filter((base) =>
          (cardsByBase.get(base) || []).every(
            (card) => !records[card.key]?.reviews,
          ),
        )
        .sort(
          (first, second) =>
            Number(
              (cardsByBase.get(second) || []).some((card) => card.core),
            ) -
            Number(
              (cardsByBase.get(first) || []).some((card) => card.core),
            ),
        ),
      skillOrder: SkillType[] = [
        'recognition',
        'production',
        'context',
        'listening',
        'dictation',
        'article',
      ],
      orderedUnreviewed = (base: string) =>
        (cardsByBase.get(base) || [])
          .filter((card) => !records[card.key]?.reviews)
          .sort(
            (a, b) =>
              skillOrder.indexOf(a.skill) - skillOrder.indexOf(b.skill),
          ),
      selectedReviews = readyReviews.slice(0, count),
      openAfterReviews = Math.max(0, count - selectedReviews.length),
      unfinishedGroups = unfinishedBases
        .map(orderedUnreviewed)
        .filter((group) => group.length),
      unfinishedCandidates = Array.from({ length: 3 }, (_, offset) =>
        unfinishedGroups.map((group) => group[offset]).filter(Boolean),
      ).flat() as StudyCard[],
      unfinishedCards = unfinishedCandidates.slice(0, openAfterReviews),
      openForFresh = Math.max(
        0,
        openAfterReviews - unfinishedCards.length,
      ),
      newBaseLimit = Math.min(4, Math.floor(openForFresh / 3)),
      freshGroups = freshBases.slice(0, newBaseLimit).map(orderedUnreviewed),
      minimumNew = freshGroups.flatMap((group) => group.slice(0, 3)),
      extraSlots = Math.max(
        0,
        count -
          selectedReviews.length -
          unfinishedCards.length -
          minimumNew.length,
      ),
      extraNew = Array.from({ length: 3 }, (_, offset) =>
        freshGroups.map((group) => group[3 + offset]).filter(Boolean),
      )
        .flat()
        .slice(0, extraSlots) as StudyCard[],
      selected = [
        ...selectedReviews,
        ...unfinishedCards,
        ...minimumNew,
        ...extraNew,
      ],
      selectedKeys = new Set(selected.map((card) => card.key)),
      standaloneFresh = deck.filter(
        (card) =>
          !records[card.key]?.reviews &&
          !wordBaseSet.has(baseCardKey(card.key)) &&
          !selectedKeys.has(card.key),
      ).sort((first, second) => Number(second.core) - Number(first.core));
    pool = [
      ...selected,
      ...standaloneFresh.slice(0, Math.max(0, count - selected.length)),
    ];
  }
  const unique = pool.slice(),
    mixed: StudyCard[] = [];
  const distinctWords = new Set(unique.map((card) => baseCardKey(card.key))).size,
    spacingWindow = Math.min(3, Math.max(0, distinctWords - 1));
  while (unique.length && mixed.length < count) {
    const recentWords = new Set(
      mixed.slice(-spacingWindow).map((card) => baseCardKey(card.key)),
    );
    let pick = unique.findIndex(
      (card) => !recentWords.has(baseCardKey(card.key)),
    );
    if (pick < 0) pick = 0;
    mixed.push(unique.splice(pick, 1)[0]);
  }
  return mixed;
};

export const dueLabel = (record?: SRSRecord) => {
  if (!record?.reviews) return 'новая';
  const delta = record.nextReview - Date.now();
  if (delta <= 0) return 'сейчас';
  if (delta < 3600000)
    return `через ${Math.max(1, Math.round(delta / 60000))} мин`;
  if (delta < 86400000)
    return `через ${Math.max(1, Math.round(delta / 3600000))} ч`;
  return `через ${Math.max(1, Math.round(delta / 86400000))} дн`;
};

export const readyWordsLabel = (count: number) => {
  const lastTwo = count % 100,
    last = count % 10;
  if (last === 1 && lastTwo !== 11) return `${count} слово готово сейчас`;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14))
    return `${count} слова готовы сейчас`;
  return `${count} слов готовы сейчас`;
};

export const adjustedGradeForEvidence = (
  grade: ReviewGrade,
  kind: ResponseKind,
  correct: boolean,
  answerMs: number,
  edits: number,
): ReviewGrade => {
  if (!correct || grade === 'again') return 'again';
  const grades: ReviewGrade[] = ['hard', 'good', 'easy'];
  let index = grades.indexOf(grade);
  if (index < 0) index = 0;
  if (kind === 'choice' || kind === 'self') index -= 1;
  if (answerMs > 45_000 || edits > 4) index -= 1;
  if (kind === 'audioSentence' && answerMs <= 30_000 && edits <= 2)
    index += 1;
  return grades[Math.max(0, Math.min(grades.length - 1, index))];
};

const unitNames = [
  ...new Set(
    vocabularyTopics.flatMap((topic) =>
      topic.entries.flatMap((entry) => entry.units || []),
    ),
  ),
];

export const practiceTopics = (level: PracticeLevel, collection: PracticeCollection) =>
  collection === 'units'
    ? ['Все unidades', ...unitNames]
    : collection === 'lessons'
      ? ['Все уроки', ...courseLessons.map((lesson) => lesson.title)]
    : [
        'Все темы',
        ...vocabularyBrowseTopics
          .filter((topic) => !/^Unidad\s/iu.test(topic.name))
          .filter((topic) => level === 'Все уровни' || topic.level === level)
          .map((topic) => topic.name),
        'Мои слова',
      ];

export const topicDeck = (
  deck: StudyCard[],
  level: PracticeLevel,
  topic: string,
  collection: PracticeCollection = 'topics',
) =>
  collection === 'lessons'
    ? topic === 'Все уроки'
      ? deck.filter((card) => card.lessonIds?.length)
      : deck.filter((card) => {
          const lessonId = courseLessons.find((lesson) => lesson.title === topic)?.id;
          return !!lessonId && card.lessonIds?.includes(lessonId);
        })
    : topic === 'Мои слова'
    ? deck.filter((card) => card.topic === 'Мои слова')
    : topic === 'Все unidades'
      ? deck.filter(
          (card) =>
            card.units?.length &&
            (level === 'Все уровни' || card.level === level),
        )
      : topic === 'Все темы'
        ? level === 'Все уровни'
          ? deck
          : deck.filter((card) => card.level === level)
        : deck.filter(
              (card) => card.topic === topic || card.units?.includes(topic),
            );

const seededNumber = (seed: string) =>
  Array.from(seed).reduce(
    (sum, character) => (sum * 33 + character.charCodeAt(0)) >>> 0,
    5381,
  );

const wordReviewRounds = (card: StudyCard, records: Record<string, SRSRecord>) => {
  const base = baseCardKey(card.key);
  return Math.max(
    0,
    ...Object.entries(records)
      .filter(([key]) => baseCardKey(key) === base)
      .map(([, record]) => record.reviews),
  );
};

const sentenceFunctionWords = new Set(
  'a al de del el la los las un una unos unas y e o u pero que en con sin por para desde hasta sobre entre mi mis tu tus su sus nuestro nuestra nuestros nuestras este esta estos estas ese esa esos esas yo tú él ella usted nosotros nosotras vosotros vosotras ustedes ellos ellas me te se nos os lo le les no sí muy más menos ya hoy ayer mañana aquí allí hay es está son están soy eres somos sois ser estar tiene tienen tengo tienes tenemos quiero quiere queremos puedo puede podemos va voy vamos van como cómo cuando cuándo donde dónde porque qué quien quién cual cuál'.split(' '),
);

export const controlledDictationSentence = (
  card: StudyCard,
  deck: StudyCard[],
  records: Record<string, SRSRecord>,
  wordSessions: WordSessionProgress,
) => {
  const successfulSessionCount = (item: StudyCard) =>
    wordSessions[baseCardKey(item.key)]?.successfulSessions ??
    (wordReviewRounds(item, records) > 0 ? 1 : 0);
  if (successfulSessionCount(card) < 2) return '';
  const familiar = new Set<string>(),
    familiarStems = new Set<string>();
  deck.forEach((item) => {
    if (successfulSessionCount(item) < 2 && !wordIsLearned(item, records)) return;
    item.es
      .split(' / ')
      .flatMap((variant) => normalizeText(variant).split(' '))
      .forEach((token) => {
        familiar.add(token);
        if (/\p{L}{3,}(?:ar|er|ir)$/u.test(token)) familiarStems.add(token.slice(0, -2));
        else if (/\p{L}{4,}s$/u.test(token)) familiarStems.add(token.slice(0, -1));
      });
  });
  const isFamiliar = (token: string) =>
    familiar.has(token) ||
    [...familiarStems].some((stem) => stem.length >= 3 && token.startsWith(stem));
  const candidates = [card.example, card.extraExample || ''].filter(Boolean);
  return (
    candidates
      .map((sentence) => {
        const content = normalizeText(sentence)
          .split(' ')
          .filter((token) => token.length > 1 && !sentenceFunctionWords.has(token));
        const unknown = [...new Set(content.filter((token) => !isFamiliar(token)))];
        const known = [...new Set(content.filter(isFamiliar))];
        return { sentence, unknown: unknown.length, known: known.length };
      })
      .filter((item) => item.unknown >= 1 && item.unknown <= 2 && item.known >= 2)
      .sort((a, b) => b.known - a.known || a.unknown - b.unknown)[0]?.sentence || ''
  );
};

const preferredResponseKindFor = (
  card: StudyCard,
  index: number,
  record?: SRSRecord,
  sentenceReady = false,
): ResponseKind => {
  const reviews = record?.reviews || 0,
    headword = card.es.split(' / ')[0].trim(),
    letterCount = Array.from(headword).filter((character) =>
      /\p{L}/u.test(character),
    ).length,
    canRestoreLetters =
      !/\s/.test(headword) &&
      letterCount >= 9,
    shortWord = letterCount <= 4,
    weak =
      !!record &&
      (record.lastGrade === 'again' ||
        record.lapses >= 2 ||
        record.difficulty >= 6.2),
    strong =
      !!record &&
      record.reviews >= 4 &&
      record.correctStreak >= 3 &&
      record.stability >= 5,
    correctionAvailable = !!makeSingleWordCorrection(card),
    pick = (kinds: readonly ResponseKind[]) => {
      const available = kinds.filter(
        (kind) => kind !== 'correction' || correctionAvailable,
      );
      return available[
        seededNumber(`${card.key}-${index}-${reviews}-${record?.lapses || 0}`) %
          available.length
      ];
    };

  if (card.skill === 'recognition') {
    if (canRestoreLetters && (weak || !reviews))
      return pick(['letters', 'type', 'letters', 'type', 'choice', 'phrase']);
    if (shortWord)
      return pick(
        strong
          ? ['type', 'phrase', 'type', 'choice', 'correction']
          : weak
            ? ['type', 'type', 'phrase', 'choice', 'type']
            : STANDARD_RECOGNITION_DISTRIBUTION,
      );
    return pick(
      strong
        ? ['type', 'type', 'phrase', 'choice', 'correction']
        : weak
          ? ['type', 'type', 'choice', 'phrase', 'type']
          : STANDARD_RECOGNITION_DISTRIBUTION,
    );
  }
  if (card.skill === 'production') {
    if (card.answer.trim().split(/\s+/).length >= 3)
      return pick(
        strong
          ? ['order', 'type', 'self', 'order']
          : weak
            ? ['order', 'type', 'order', 'type']
            : ['order', 'type', 'self', 'type'],
      );
    if (canRestoreLetters && weak)
      return pick(['letters', 'type', 'type', 'letters', 'choice', 'phrase']);
    return pick(
      strong
        ? ['type', 'phrase', 'correction', 'choice', 'type', 'self']
        : weak
          ? ['type', 'type', 'choice', 'phrase', 'correction']
          : ['type', 'type', 'choice', 'self', 'phrase'],
    );
  }
  if (card.skill === 'listening')
    return pick(
      strong
        ? sentenceReady ? ['audioSentence', 'type', 'audioSentence'] : ['audioWord', 'type']
        : weak
          ? sentenceReady ? ['type', 'audioSentence', 'type', 'choice'] : ['type', 'audioWord', 'choice']
          : sentenceReady ? ['type', 'type', 'audioSentence', 'choice'] : ['type', 'audioWord', 'choice'],
    );
  if (card.skill === 'dictation')
    return pick(
      canRestoreLetters && weak
        ? sentenceReady ? ['letters', 'type', 'audioSentence', 'type'] : ['letters', 'type']
        : strong
          ? sentenceReady ? ['audioSentence', 'type', 'audioSentence', 'type'] : ['type', 'audioWord']
          : sentenceReady ? ['type', 'audioSentence', 'type', 'audioSentence'] : ['type', 'audioWord'],
    );
  if (card.skill === 'context')
    return pick(
      strong
        ? ['correction', 'type', 'choice', 'correction', 'type', 'type']
        : weak
          ? ['type', 'correction', 'type', 'choice', 'type']
          : ['choice', 'type', 'type', 'correction', 'type'],
    );
  if (card.skill === 'article')
    return 'choice';
  return pick(['type', 'phrase', 'correction', 'self']);
};

export const responseKindFor = (
  card: StudyCard,
  index: number,
  record?: SRSRecord,
  sentenceReady = false,
): ResponseKind => limitChoiceFormat(
  preferredResponseKindFor(card, index, record, sentenceReady), index, card.skill,
);

export const practiceFormatReason = (
  card: StudyCard,
  record: SRSRecord | undefined,
  kind: ResponseKind,
) => {
  const length = Array.from(card.es.split(' / ')[0]).filter((character) =>
      /\p{L}/u.test(character),
    ).length,
    weak =
      !!record &&
      (record.lastGrade === 'again' ||
        record.lapses >= 2 ||
        record.difficulty >= 6.2),
    strong =
      !!record &&
      record.reviews >= 4 &&
      record.correctStreak >= 3 &&
      record.stability >= 5;
  if (kind === 'letters' && length >= 9)
    return 'длинное слово — тренируем точное написание';
  if (kind === 'audioWord')
    return 'слушаем слово без текста и вспоминаем его значение';
  if (kind === 'correction')
    return 'слово уже встречалось — замечаем точную ошибку в написании';
  if (!record?.reviews) return 'новый навык — начинаем с опоры и контекста';
  if (weak) return 'были ошибки — чаще активное вспоминание';
  if (strong) return 'слово знакомо — усложняем контекст';
  if (length <= 4) return 'короткое слово — проверяем внутри фразы';
  return 'формат чередуется по истории этого навыка';
};

export const maskedSpanishWord = (value: string, seed: string) => {
  const characters = Array.from(value.split(' / ')[0]),
    candidates = characters
      .map((character, index) => (/\p{L}/u.test(character) ? index : -1))
      .filter((index) => index >= 0),
    offset = seededNumber(seed) % Math.max(1, candidates.length),
    missingCount = Math.min(5, Math.max(3, Math.ceil(candidates.length * 0.4))),
    missing = new Set(
      Array.from(
        { length: missingCount },
        (_, index) =>
          candidates[(offset + index * 3 + Math.floor(index / 2)) % candidates.length],
      ),
    );
  return characters
    .map((character, index) => (missing.has(index) ? '＿' : character))
    .join('');
};

export const choicesFor = (card: StudyCard, deck: StudyCard[]) => {
  if (card.skill === 'article') return ['el', 'la'];
  const targetPartOfSpeech = inferWordPartOfSpeech(card.es, card.ru, card.example),
    topicAlternatives = deck
    .filter(
      (item) =>
        item.skill === card.skill &&
        item.topic === card.topic &&
        item.key !== card.key &&
        normalizeText(item.ru) !== normalizeText(card.ru) &&
        inferWordPartOfSpeech(item.es, item.ru, item.example) ===
          targetPartOfSpeech,
    )
    .map((item) => ({ answer: item.answer, es: item.es, ru: item.ru })),
    spanishAnswer = !['recognition', 'listening'].includes(card.skill),
    vocabularyAlternatives = vocabularyTopics.flatMap((topic) =>
      topic.entries
        .filter(
          (entry) =>
            normalizeText(entry.ru) !== normalizeText(card.ru) &&
            inferWordPartOfSpeech(entry.es, entry.ru, entry.example) ===
              targetPartOfSpeech,
        )
        .map((entry) => ({
          answer: spanishAnswer ? entry.es : entry.ru,
          es: entry.es,
          ru: entry.ru,
        })),
    ),
    answerLength = Array.from(card.answer).length,
    answerWordCount = card.answer.trim().split(/\s+/).length,
    alternatives = [...topicAlternatives, ...vocabularyAlternatives]
      .filter(
        (candidate, index, array) =>
          normalizeText(candidate.answer) !== normalizeText(card.answer) &&
          array.findIndex(
            (item) =>
              normalizeText(item.answer) === normalizeText(candidate.answer),
          ) === index,
      )
      .sort((first, second) => {
        const score = (candidate: { answer: string }) =>
          Math.abs(Array.from(candidate.answer).length - answerLength) +
          Math.abs(candidate.answer.trim().split(/\s+/).length - answerWordCount) *
            12;
        return (
          score(first) - score(second) ||
          seededNumber(`${card.key}-${first.answer}`) -
            seededNumber(`${card.key}-${second.answer}`)
        );
      })
      .map((candidate) => candidate.answer);
  return [
    card.answer,
    ...alternatives.slice(0, 3),
  ];
};

export const studyExamples = (card: StudyCard) =>
  [
    { es: card.example, ru: card.exampleRu || card.ru },
    {
      es: card.extraExample || card.example,
      ru: card.extraExampleRu || card.exampleRu || card.ru,
    },
  ].filter(
    (example, index, list) =>
      list.findIndex(
        (item) => normalizeText(item.es) === normalizeText(example.es),
      ) === index,
  );

export const reviewReason = (record?: SRSRecord) =>
  !record?.reviews
    ? 'Новое слово'
    : record.lastGrade === 'again'
      ? 'Ошибка на прошлой попытке'
      : record.difficulty >= 6.2
        ? 'Слабый навык'
        : record.nextReview <= Date.now()
          ? 'Пора повторить'
          : 'Дополнительное закрепление';

export const randomOrder = (length: number) => {
  const values = Array.from({ length }, (_, index) => index);
  for (let index = values.length - 1; index > 0; index -= 1) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const swapWith = random[0] % (index + 1);
    [values[index], values[swapWith]] = [values[swapWith], values[index]];
  }
  return values;
};
