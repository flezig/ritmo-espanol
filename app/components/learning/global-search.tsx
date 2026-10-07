'use client';

import { normalizeText } from '../../lib/learning-core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { vocabularyTopics } from '../../vocabulary';
import { courseLessons } from '../../lessons';
import { ArrowRight, Search } from 'lucide-react';
import type { GlobalSearchItem, Section } from '../../types/learning';
import { lessonCoreVocabulary } from '../../data/lesson-vocabulary';
import { grammarTopics } from '../../data/grammar';
import { songs } from '../../data/songs';

const globalSearchKinds: Array<{
  kind: GlobalSearchItem['kind'];
  label: string;
}> = [
  { kind: 'Слово', label: 'Слова' },
  { kind: 'Урок', label: 'Уроки' },
  { kind: 'Правило', label: 'Правила' },
  { kind: 'Песня', label: 'Песни' },
];

const normalizeSearchText = (value: string) =>
  normalizeText(value.replace(/[ñÑ]/g, 'n'));

export function GlobalSearch({ go }: { go: (section: Section) => void }) {
  const [query, setQuery] = useState(''),
    [open, setOpen] = useState(false),
    [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({}),
    inputRef = useRef<HTMLInputElement>(null),
    items = useMemo<GlobalSearchItem[]>(
      () => [
        ...vocabularyTopics.flatMap((topic) =>
          topic.entries.map((entry) => ({
            id: `word-${topic.name}-${entry.id}`,
            kind: 'Слово' as const,
            title: entry.es,
            description: `${entry.ru} · ${topic.level} · ${topic.name}`,
            search: `${entry.es} ${entry.ru} ${entry.example} ${entry.exampleRu || ''} ${topic.level} ${topic.name}`,
            section: 'Vocabulary' as const,
            focus: entry.es,
          })),
        ),
        ...courseLessons.map((lesson) => ({
          id: `lesson-${lesson.id}`,
          kind: 'Урок' as const,
          title: `Урок ${lesson.number}: ${lesson.title}`,
          description: lesson.subtitle,
          search: `${lesson.title} ${lesson.subtitle} ${(lessonCoreVocabulary[lesson.id] || []).map((word) => `${word.es} ${word.ru}`).join(' ')}`,
          section: 'Lessons' as const,
          focus: lesson.id,
        })),
        ...courseLessons.flatMap((lesson) =>
          lesson.theory.map((rule, index) => ({
            id: `lesson-rule-${lesson.id}-${index}`,
            kind: 'Правило' as const,
            title: rule.title,
            description: `Урок ${lesson.number} · ${rule.paragraphs[0]}`,
            search: `${rule.title} ${rule.paragraphs.join(' ')} ${rule.examples.flat().join(' ')}`,
            section: 'Lessons' as const,
            focus: `${lesson.id}:${index}`,
          })),
        ),
        ...grammarTopics.flatMap((topic, topicIndex) =>
          topic.rules.map((rule, ruleIndex) => ({
            id: `grammar-${topicIndex}-${ruleIndex}`,
            kind: 'Правило' as const,
            title: topic.name,
            description: rule,
            search: `${topic.name} ${topic.use} ${topic.formula} ${rule}`,
            section: 'Grammar' as const,
            focus: String(topicIndex),
          })),
        ),
        ...songs.map((song) => ({
          id: `song-${song.title}`,
          kind: 'Песня' as const,
          title: song.title,
          description: `${song.artist} · ${song.level}`,
          search: `${song.title} ${song.artist} ${song.level} ${song.games.map((round) => `${round.prompt} ${round.answer}`).join(' ')}`,
          section: 'Music' as const,
          focus: song.title,
        })),
      ],
      [],
    ),
    normalizedQuery = normalizeSearchText(query),
    matchingResults = normalizedQuery
      ? items
          .filter((item) =>
            normalizeSearchText(item.search).includes(normalizedQuery),
          )
          .sort((first, second) => {
            const firstStarts = normalizeSearchText(first.title).startsWith(normalizedQuery),
              secondStarts = normalizeSearchText(second.title).startsWith(normalizedQuery);
            return Number(secondStarts) - Number(firstStarts);
          })
      : [],
    groupedResults = globalSearchKinds
      .map((group) => ({
        ...group,
        total: matchingResults.filter((item) => item.kind === group.kind).length,
        items: matchingResults
          .filter((item) => item.kind === group.kind)
          .slice(0, expandedGroups[group.kind] ? undefined : 4),
      }))
      .filter((group) => group.items.length > 0);
  useEffect(() => {
    const openFromKeyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
        window.requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', openFromKeyboard);
    return () => window.removeEventListener('keydown', openFromKeyboard);
  }, []);
  const openItem = (item: GlobalSearchItem) => {
    if (item.section === 'Vocabulary' && item.focus)
      sessionStorage.setItem('ritmo-global-vocabulary-query', item.focus);
    if (item.section === 'Lessons' && item.focus) {
      const [lessonId, theoryIndex] = item.focus.split(':');
      sessionStorage.setItem('ritmo-focus-lesson-id', lessonId);
      if (theoryIndex)
        sessionStorage.setItem('ritmo-focus-theory-index', theoryIndex);
    }
    if (item.section === 'Grammar' && item.focus)
      sessionStorage.setItem('ritmo-focus-grammar-index', item.focus);
    if (item.section === 'Music' && item.focus)
      sessionStorage.setItem('ritmo-focus-song-title', item.focus);
    setOpen(false);
    setQuery('');
    go(item.section);
    window.setTimeout(
      () => window.dispatchEvent(new Event('ritmo-global-search-focus')),
      0,
    );
  };
  return (
    <div className={open ? 'global-search open' : 'global-search'}>
      <button
        type="button"
        className="global-search-trigger"
        onClick={() => {
          setOpen(true);
          window.requestAnimationFrame(() => inputRef.current?.focus());
        }}
        aria-label="Поиск по сайту"
      >
        <Search />
        <span>Поиск</span>
        <kbd>⌘ K</kbd>
      </button>
      {open && (
        <div className="global-search-panel" role="dialog" aria-label="Поиск по сайту">
          <label>
            <Search />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setExpandedGroups({});
              }}
              aria-label="Поисковый запрос"
              placeholder="Слово, перевод, правило, урок или песня…"
            />
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть поиск">×</button>
          </label>
          <div className="global-search-results">
            {!normalizedQuery ? (
              <p>
                Например: «артикли», «аэропорт» или «Maluma». Ударения и ñ
                можно не вводить.
              </p>
            ) : groupedResults.length ? (
              groupedResults.map((group) => (
                <section className="global-search-group" key={group.kind}>
                  <header>
                    <b>{group.label}</b>
                    <span>{group.total}</span>
                  </header>
                  <div>
                    {group.items.map((item) => (
                      <button type="button" onClick={() => openItem(item)} key={item.id}>
                        <b>{item.title}</b>
                        <small>{item.description}</small>
                        <ArrowRight />
                      </button>
                    ))}
                    {group.items.length < group.total && (
                      <button
                        type="button"
                        className="global-search-show-all"
                        onClick={() => setExpandedGroups((current) => ({ ...current, [group.kind]: true }))}
                      >
                        Показать все: {group.label.toLocaleLowerCase('ru-RU')} ({group.total})
                      </button>
                    )}
                  </div>
                </section>
              ))
            ) : (
              <p>Ничего не найдено. Попробуйте другое слово.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
