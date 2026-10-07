'use client';

import { useEffect, useRef, useState } from 'react';
import {
  baseCardKey,
  derivedWordStatus,
  normalizeText,
  type WordStatus,
} from '../../lib/learning-core';
import { vocabularyBrowseTopics, vocabularyTopics, type VocabularyLevel } from '../../vocabulary';
import { Search, Volume2 } from 'lucide-react';
import { deleA2TopicName } from '../../dele-a2-vocabulary';
import {
  useCustomWords,
  useWordProgress,
  useWordHistory,
  useSRS,
  statusLabels,
} from '../../lib/learning-runtime';
import type { CustomWord } from '../../types/learning';
import {
  useSpanishVoices,
  ViewHead,
  voiceDisplayName,
  DeleA2SourceNote,
  ReportExampleButton,
} from './shared';
import { makeStudyDeck } from '../../lib/study-deck';

const topicPlaces: Record<string, number> = {
  Музыка: 10,
  'Знакомство и о себе': 0,
  'Семья и люди': 1,
  'Мой день и рутина': 2,
  'Дом и жильё': 3,
  'Еда и ресторан': 4,
  'Город и транспорт': 5,
  'Покупки и одежда': 6,
  Путешествия: 7,
  'Работа и учёба': 8,
  Здоровье: 9,
  'Досуг и хобби': 10,
  'Погода и природа': 11,
  'Ночная жизнь': 5,
  'Живой сленг': 0,
  'Знакомства и отношения': 1,
  'Переписка и интернет': 8,
};

const a2TopicPlaces: Record<string, number> = {
  'Время, даты и планы': 0,
  'Услуги и документы': 1,
  'Биография и события жизни': 2,
  'Эмоции и мнение': 3,
  'Праздники и встречи': 4,
  'Быт и район': 5,
  'Проблемы и экстренные ситуации': 6,
  'Техника и устройства': 7,
  'Культура и медиа': 8,
  'Связующие слова и полезные конструкции': 9,
};

const emptyCustomWord = {
  es: '',
  ru: '',
  example: '',
  exampleRu: '',
  extraExample: '',
  extraExampleRu: '',
};

function CustomWordsPanel() {
  const { words, add, remove } = useCustomWords(),
    [open, setOpen] = useState(false),
    [draft, setDraft] = useState(emptyCustomWord),
    [message, setMessage] = useState('');
  const change = (key: keyof typeof emptyCustomWord, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const submit = () => {
    if (Object.values(draft).some((value) => !value.trim())) {
      setMessage('Заполните слово, перевод и оба примера с переводами.');
      return;
    }
    if (
      words.some((word) => normalizeText(word.es) === normalizeText(draft.es))
    ) {
      setMessage('Такое слово уже есть в вашем словаре.');
      return;
    }
    add(
      Object.fromEntries(
        Object.entries(draft).map(([key, value]) => [key, value.trim()]),
      ) as Omit<CustomWord, 'id'>,
    );
    setDraft(emptyCustomWord);
    setMessage('Слово добавлено и уже доступно в теме «Мои слова» в Practice.');
  };
  return (
    <section className={`custom-words-panel ${open ? 'open' : ''}`}>
      <header>
        <div>
          <p className="eyebrow">МОЙ СЛОВАРЬ · {words.length} СЛОВ</p>
          <h2>Добавьте собственные слова и примеры</h2>
          <p>
            Они сохраняются в вашем профиле, входят в резервную копию и
            появляются отдельной темой в Practice.
          </p>
        </div>
        <button onClick={() => setOpen((value) => !value)}>
          {open ? 'Закрыть' : '+ Добавить слово'}
        </button>
      </header>
      {open && (
        <div className="custom-word-form">
          <label>
            <span>Испанское слово или выражение</span>
            <input
              value={draft.es}
              onChange={(event) => change('es', event.target.value)}
              placeholder="la terraza"
            />
          </label>
          <label>
            <span>Точный перевод</span>
            <input
              value={draft.ru}
              onChange={(event) => change('ru', event.target.value)}
              placeholder="терраса"
            />
          </label>
          <label>
            <span>Пример 1 на испанском</span>
            <input
              value={draft.example}
              onChange={(event) => change('example', event.target.value)}
              placeholder="Desayunamos en la terraza."
            />
          </label>
          <label>
            <span>Полный перевод примера 1</span>
            <input
              value={draft.exampleRu}
              onChange={(event) => change('exampleRu', event.target.value)}
              placeholder="Мы завтракаем на террасе."
            />
          </label>
          <label>
            <span>Пример 2 на испанском</span>
            <input
              value={draft.extraExample}
              onChange={(event) => change('extraExample', event.target.value)}
              placeholder="La terraza da al jardín."
            />
          </label>
          <label>
            <span>Полный перевод примера 2</span>
            <input
              value={draft.extraExampleRu}
              onChange={(event) => change('extraExampleRu', event.target.value)}
              placeholder="Терраса выходит в сад."
            />
          </label>
          <div className="custom-word-submit">
            <button onClick={submit}>Сохранить слово</button>
            {message && <output>{message}</output>}
          </div>
        </div>
      )}
      {!!words.length && (
        <div className="custom-word-list">
          {words.map((word) => (
            <article key={word.id}>
              <div>
                <b>{word.es}</b>
                <span>{word.ru}</span>
              </div>
              <p>
                {word.example} <small>{word.exampleRu}</small>
              </p>
              <button
                onClick={() => {
                  if (window.confirm(`Удалить «${word.es}» из моего словаря?`))
                    remove(word.id);
                }}
                aria-label={`Удалить ${word.es}`}
              >
                Удалить
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function VocabularyView() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<VocabularyLevel>('A1–A2');
  const [vocabularyCollection, setVocabularyCollection] = useState<'topics' | 'units'>('topics');
  const [selected, setSelected] = useState(vocabularyBrowseTopics[0].name);
  const [filter, setFilter] = useState<'all' | 'core' | WordStatus>('all');
  const vocabularyLibraryRef = useRef<HTMLElement>(null);
  const { progress, update } = useWordProgress();
  const history = useWordHistory();
  const { records, markNew } = useSRS();
  const { voices, voiceIndex, setVoiceIndex, speakText, voiceError } = useSpanishVoices();
  useEffect(() => {
    const focusRequestedWord = () => {
      const requestedQuery = sessionStorage.getItem('ritmo-global-vocabulary-query');
      if (!requestedQuery) return;
      setQuery(requestedQuery);
      setFilter('all');
      const requestedTopic = vocabularyTopics.find((item) =>
        item.entries.some(
          (entry) =>
            normalizeText(entry.es).includes(normalizeText(requestedQuery)) ||
            normalizeText(entry.ru).includes(normalizeText(requestedQuery)),
        ),
      );
      if (requestedTopic) {
        setLevel(requestedTopic.level);
        setVocabularyCollection(/^Unidad\s/u.test(requestedTopic.name) ? 'units' : 'topics');
        setSelected(requestedTopic.name);
      }
      sessionStorage.removeItem('ritmo-global-vocabulary-query');
      window.requestAnimationFrame(() =>
        vocabularyLibraryRef.current?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
          block: 'start',
        }),
      );
    };
    focusRequestedWord();
    window.addEventListener('ritmo-global-search-focus', focusRequestedWord);
    return () =>
      window.removeEventListener('ritmo-global-search-focus', focusRequestedWord);
  }, []);
  const studyDeck = makeStudyDeck();
  const levelTopics = vocabularyBrowseTopics
      .filter((item) => item.level === level)
      .filter((item) =>
        vocabularyCollection === 'units'
          ? /^Unidad\s/u.test(item.name)
          : !/^Unidad\s/u.test(item.name),
      ),
    topic =
      levelTopics.find((item) => item.name === selected) ??
      levelTopics[0] ??
      vocabularyBrowseTopics[0];
  const normalized = query.trim().toLowerCase();
  const results = vocabularyTopics
    .flatMap((item) =>
      item.entries.map((entry) => ({
        ...entry,
        topic: item.name,
        icon: item.icon,
        level: item.level,
      })),
    )
    .filter(
      (entry) =>
        !normalized ||
        entry.es.toLowerCase().includes(normalized) ||
        entry.ru.toLowerCase().includes(normalized) ||
        entry.example.toLowerCase().includes(normalized) ||
        entry.extraExample?.toLowerCase().includes(normalized) ||
        entry.extraExampleRu?.toLowerCase().includes(normalized),
    );
  const base = normalized
    ? results
    : topic.entries.map((entry) => ({
        ...entry,
        topic: topic.name,
        icon: topic.icon,
        level: topic.level,
      }));
  const visible = base.filter((entry) => {
    const key = `${entry.ownerTopic || entry.topic}-${entry.id}`;
    if (filter === 'all') return true;
    if (filter === 'core') return !!entry.core;
    return derivedWordStatus(key, records, progress[key] || 'new') === filter;
  });
  const vocabularyCount = vocabularyTopics.reduce(
    (sum, item) => sum + item.entries.length,
    0,
  ),
    coreCount = vocabularyTopics.reduce(
      (sum, item) => sum + item.entries.filter((entry) => entry.core).length,
      0,
    );
  return (
    <div className="view-stack vocabulary-view">
      <ViewHead
        over={`${vocabularyCount.toLocaleString('ru-RU')} слов · A1–B2`}
        title="Слова, которые пригодятся."
        copy="Прогресс синхронизируется с тренировками."
      />
      <CustomWordsPanel />
      <details className="vocabulary-status-guide">
        <summary>
          <span>
            <b>Статусы слов</b>
            <small>
              Новое <i aria-hidden="true">→</i> Учу <i aria-hidden="true">→</i>{' '}
              Выучено <em>+ Сложное</em>
            </small>
          </span>
          <strong>Как это работает?</strong>
        </summary>
        <div className="vocabulary-status-details">
          <span className="core-guide">
            <i>Ядро A1–A2</i> — {coreCount} наиболее нужных слов и выражений для
            повседневного общения. Начинайте с них.
          </span>
          <span>
            <i>Новое</i> — ещё не было ответов.
          </span>
          <span>
            <i>Учу</i> — началась хотя бы одна активная проверка.
          </span>
          <span>
            <i>Выучено</i> — узнавание и перевод без вариантов проверены минимум
            по 3 раза, серия верных ответов 2+, точность 75%+.
          </span>
          <span>
            <i>Сложное</i> — дополнительная отметка: накопились минимум две
            ошибки или вы отметили слово сами.
          </span>
        </div>
      </details>
      <details className="vocabulary-voice-picker">
        <summary>
          <Volume2 />
          <span>
            <b>
              Голос: {voices[voiceIndex]?.name || 'системный'}
              {voices[voiceIndex]?.lang ? ` (${voices[voiceIndex].lang})` : ''}
            </b>
            <small>Изменить</small>
          </span>
        </summary>
        <div className="vocabulary-voice-settings">
          {voices.length ? (
            <select
              value={voiceIndex}
              onChange={(event) => setVoiceIndex(Number(event.target.value))}
              aria-label="Выбрать испанский голос словаря"
            >
              {voices.map((voice, index) => (
                <option value={index} key={`${voice.name}-${index}`}>
                  {voiceDisplayName(voice)}
                </option>
              ))}
            </select>
          ) : (
            <small>Системный голос es-ES · браузер не показывает список голосов</small>
          )}
          <button onClick={() => speakText('Hola, ¿cómo estás?', 1)}>
            <Volume2 /> Прослушать
          </button>
          <small>Выбор действует также в Practice и диктанте.</small>
          {voiceError && <output className="voice-error">⚠ {voiceError}</output>}
        </div>
      </details>
      <label className="search-box">
        <Search />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Например: аэропорт, квартира, погода…"
        />
        <span>{visible.length} слов</span>
      </label>
      <div className="vocabulary-level-tabs" aria-label="Уровень словаря">
        {(['A1–A2', 'B1–B2'] as VocabularyLevel[]).map((item) => {
          const count = vocabularyTopics
            .filter((topicItem) => topicItem.level === item)
            .reduce((sum, topicItem) => sum + topicItem.entries.length, 0);
          return (
            <button
              className={level === item && !normalized ? 'active' : ''}
              key={item}
              onClick={() => {
                const first = vocabularyBrowseTopics.find(
                  (topicItem) => topicItem.level === item,
                );
                setLevel(item);
                setVocabularyCollection('topics');
                const firstRegular = vocabularyBrowseTopics.find(
                  (topicItem) =>
                    topicItem.level === item && !/^Unidad\s/u.test(topicItem.name),
                );
                if (firstRegular || first) setSelected((firstRegular || first)!.name);
                setQuery('');
              }}
            >
              <b>{item}</b>
              <span>{count} слов</span>
            </button>
          );
        })}
      </div>
      {level === 'A1–A2' && !normalized && (
        <div className="vocabulary-collection-tabs" aria-label="Раздел словаря A1–A2">
          <button
            type="button"
            className={vocabularyCollection === 'topics' ? 'active' : ''}
            onClick={() => {
              const first = vocabularyBrowseTopics.find(
                (item) => item.level === 'A1–A2' && !/^Unidad\s/u.test(item.name),
              );
              setVocabularyCollection('topics');
              if (first) setSelected(first.name);
            }}
          >
            <b>Темы</b>
            <span>Повседневная лексика по ситуациям</span>
          </button>
          <button
            type="button"
            className={vocabularyCollection === 'units' ? 'active' : ''}
            onClick={() => {
              const first = vocabularyBrowseTopics.find((item) => /^Unidad\s/u.test(item.name));
              setVocabularyCollection('units');
              if (first) setSelected(first.name);
            }}
          >
            <b>Unidades</b>
            <span>Лексика по порядку учебника</span>
          </button>
        </div>
      )}
      <div className="vocab-topic-tabs">
        {levelTopics.map((item, index) => {
          const scene = topicPlaces[item.name] ?? index % 12,
            a2Scene = a2TopicPlaces[item.name],
            isUnit = /^Unidad\s/u.test(item.name);
          return (
            <button
              className={`${selected === item.name && !normalized ? 'active' : ''} ${isUnit ? 'unit-topic' : 'place-topic'}`}
              onClick={() => {
                setSelected(item.name);
                setQuery('');
                window.requestAnimationFrame(() =>
                  vocabularyLibraryRef.current?.scrollIntoView({
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                      ? 'auto'
                      : 'smooth',
                    block: 'start',
                  }),
                );
              }}
              key={item.name}
            >
              {!isUnit && (
                <span
                  className={
                    a2Scene === undefined
                      ? `topic-scene scene-${scene}`
                      : `topic-scene a2-topic-scene a2-scene-${a2Scene}`
                  }
                />
              )}
              <span>{item.icon}</span>
              <b>{item.name}</b>
              <small>
                {item.entries.length} слов · {item.level}
              </small>
              <i
                className={
                  ['sunset', 'purple', 'cyan', 'pink', 'orange', 'blue'][
                    index % 6
                  ]
                }
              />
            </button>
          );
        })}
      </div>
      <div className="status-filters">
        {(['all', 'core', 'new', 'learning', 'learned', 'difficult'] as const).map(
          (value) => (
            <button
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
              key={value}
            >
              {value === 'all'
                ? 'Все'
                : value === 'core'
                  ? '⭐ Ядро A1–A2'
                  : statusLabels[value]}
            </button>
          ),
        )}
      </div>
      <section className="vocab-library" ref={vocabularyLibraryRef}>
        <header>
          <div>
            <p className="eyebrow">
              {normalized
                ? 'РЕЗУЛЬТАТЫ ПОИСКА'
                : `${topic.icon} ${topic.name.toUpperCase()} · ${topic.level}`}
            </p>
            <h2>{visible.length} слов</h2>
          </div>
          <span>
            Español → перевод → пример → статус · примеры: ручная редактура и{' '}
            <a href="https://tatoeba.org" target="_blank" rel="noreferrer">
              Tatoeba, CC BY 2.0
            </a>
          </span>
        </header>
        {!normalized && topic.name === deleA2TopicName && <DeleA2SourceNote />}
        <div className="vocab-table">
          {visible.map((entry, entryIndex) => {
            const key = `${entry.ownerTopic || entry.topic}-${entry.id}`,
              status = derivedWordStatus(key, records, progress[key] || 'new'),
              statusDate =
                status === 'learned'
                  ? history[key]?.learnedAt
                  : history[key]?.firstStudiedAt;
            return (
              <article key={key}>
                <span className="word-index">
                  {String(entryIndex + 1).padStart(2, '0')}
                </span>
                <div className="word-main">
                  <b>{entry.es}</b>
                  <span>{entry.ru}</span>
                  <small className="level-word-badge">{entry.level}</small>
                  {entry.core && (
                    <small className="core-word-badge">⭐ Ядро A1–A2</small>
                  )}
                  {['gato', 'cafe'].includes(normalizeText(entry.es)) && (
                    <i
                      className={`living-word ${normalizeText(entry.es)}`}
                      aria-hidden="true"
                    >
                      {normalizeText(entry.es) === 'gato' ? '🐈' : '☕'}
                    </i>
                  )}
                </div>
                <div className="vocab-example-wrap">
                  <p className="vocab-example">
                    <b>{entry.example}</b>
                    {entry.exampleRu && <span>{entry.exampleRu}</span>}
                  </p>
                  <button
                    className="example-audio"
                    onClick={() => speakText(entry.example, 1)}
                    aria-label={`Прослушать пример: ${entry.example}`}
                  >
                    <Volume2 /> Прослушать
                  </button>
                  <ReportExampleButton
                    id={`vocabulary-${key}`}
                    word={entry.es}
                    example={entry.example}
                    translation={entry.exampleRu || ''}
                    source={entry.topic}
                  />
                  {entry.extraExample && entry.extraExampleRu && (
                    <details className="vocab-example-secondary">
                      <summary>Ещё один пример</summary>
                      <div>
                        <p className="vocab-example">
                          <b>{entry.extraExample}</b>
                          <span>{entry.extraExampleRu}</span>
                        </p>
                        <button
                          className="example-audio"
                          onClick={() => speakText(entry.extraExample || '', 1)}
                          aria-label={`Прослушать второй пример: ${entry.extraExample}`}
                        >
                          <Volume2 /> Прослушать
                        </button>
                        <ReportExampleButton
                          id={`vocabulary-${key}-extra`}
                          word={entry.es}
                          example={entry.extraExample}
                          translation={entry.extraExampleRu}
                          source={entry.topic}
                        />
                      </div>
                    </details>
                  )}
                </div>
                <div className="word-status-control">
                  <select
                    className={`word-status ${status}`}
                    value={status}
                    onChange={(event) => {
                      const next = event.target.value as WordStatus;
                      if (next === 'new') {
                        const card = studyDeck.find(
                          (item) =>
                            baseCardKey(item.key) === key &&
                            item.skill === 'recognition',
                        );
                        if (card) markNew(card);
                        else update(key, 'new');
                      } else if (next !== 'learned') update(key, next);
                    }}
                    aria-label={`Статус слова ${entry.es}`}
                  >
                    {(Object.keys(statusLabels) as WordStatus[]).map(
                      (value) => (
                        <option
                          value={value}
                          disabled={value === 'learned' && status !== 'learned'}
                          key={value}
                        >
                          {statusLabels[value]}
                        </option>
                      ),
                    )}
                  </select>
                  {statusDate && (
                    <small className="word-status-date">
                      {status === 'learned' ? 'Выучено' : 'Начато'}{' '}
                      {new Date(statusDate).toLocaleDateString('ru-RU')}
                    </small>
                  )}
                </div>
                <button
                  aria-label={`Прослушать ${entry.es}`}
                  onClick={() => speakText(entry.es.split(' / ')[0], 1)}
                >
                  <Volume2 />
                </button>
              </article>
            );
          })}
        </div>
      </section>
      <section className="similar-words-guide">
        <p className="eyebrow">ПОХОЖИЙ ПЕРЕВОД — РАЗНЫЙ СМЫСЛ</p>
        <h2>Не учите синонимы как одно слово</h2>
        <div>
          <article>
            <b>piso / apartamento</b>
            <p>
              <strong>piso</strong> чаще звучит в Испании;{' '}
              <strong>apartamento</strong> — нейтральнее и часто означает
              отдельную небольшую квартиру.
            </p>
          </article>
          <article>
            <b>nevera / frigorífico</b>
            <p>
              Оба — «холодильник»: <strong>nevera</strong> обычно разговорнее,{' '}
              <strong>frigorífico</strong> распространено в Испании.
            </p>
          </article>
          <article>
            <b>menú / carta</b>
            <p>
              <strong>menú</strong> может быть готовым комплексом блюд, а{' '}
              <strong>carta</strong> — полный список позиций ресторана.
            </p>
          </article>
          <article>
            <b>billete / entrada</b>
            <p>
              <strong>billete</strong> — билет на транспорт;{' '}
              <strong>entrada</strong> — входной билет в музей, кино или на
              концерт.
            </p>
          </article>
          <article>
            <b>ser / estar</b>
            <p>
              <strong>ser</strong> описывает сущность и идентификацию,{' '}
              <strong>estar</strong> — состояние и местоположение.
            </p>
          </article>
          <article>
            <b>saber / conocer</b>
            <p>
              <strong>saber</strong> — знать факт или уметь;{' '}
              <strong>conocer</strong> — быть знакомым с человеком, местом или
              произведением.
            </p>
          </article>
          <article>
            <b>tú / tu</b>
            <p>
              <strong>tú</strong> с ударением — «ты»; <strong>tu</strong> без
              ударения — «твой»: Tú buscas tu teléfono.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
