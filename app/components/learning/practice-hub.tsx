'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AdaptivePracticeView } from './adaptive-practice-view';
import type { SessionMode } from '../../types/learning';
import {
  DetectiveGame,
  ArticlePracticeGame,
  SpanishRushGame,
} from './practice-games';

import {
  grammarModes,
  grammarExercises,
  type GrammarMode,
} from '../../data/grammar-practice';
import { GrammarPractice } from './grammar-practice';

export function PracticeHub() {
  const [game, setGame] = useState<
      'menu' | 'study' | 'detective' | 'rush' | 'articles' | GrammarMode
    >('menu'),
    [assignedMode, setAssignedMode] = useState(''),
    [assignedTopic, setAssignedTopic] = useState('');
  useEffect(() => {
    const requested = sessionStorage.getItem('ritmo-focus-practice-mode') || '';
    const requestedTopic =
      sessionStorage.getItem('ritmo-focus-practice-topic') || '';
    sessionStorage.removeItem('ritmo-focus-practice-mode');
    sessionStorage.removeItem('ritmo-focus-practice-topic');
    setAssignedMode(requested);
    setAssignedTopic(requestedTopic);
    if (requested.startsWith('words:')) setGame('study');
    else if (requested.startsWith('detective:')) setGame('detective');
    else if (requested === 'rush') setGame('rush');
    else if (requested === 'articles') setGame('articles');
    else if (grammarModes.some((m) => requested === `grammar:${m.id}`))
      setGame(requested.slice(8) as GrammarMode);
  }, []);
  const selectGame = (next: typeof game) => {
    if (next !== game) setGame(next);
  };
  return (
    <div className="view-stack practice-hub">
      {game === 'menu' && (
        <section className="practice-mode-picker">
          {grammarModes.map((mode) => (
            <button key={mode.id} onClick={() => selectGame(mode.id)}>
              <span>{mode.icon}</span>
              <b>{mode.title}</b>
              <small>
                {mode.level} · {grammarExercises[mode.id].length} заданий ·
                теория
              </small>
            </button>
          ))}
          <button onClick={() => selectGame('study')}>
            <span>🧠</span>
            <b>Учить слова</b>
            <small>Прежняя адаптивная практика</small>
          </button>
          <button onClick={() => selectGame('detective')}>
            <span>📖</span>
            <b>Детектив по тексту</b>
            <small>A1 и A2 · по 20 заданий</small>
          </button>
          <button onClick={() => selectGame('rush')}>
            <span>⏱️</span>
            <b>Spanish Rush</b>
            <small>60 секунд · combo и бонусы</small>
          </button>
          <button onClick={() => selectGame('articles')}>
            <span>📚</span>
            <b>Артикли: el или la</b>
            <small>10 случайных заданий · исключения и значения</small>
          </button>
        </section>
      )}
      {game !== 'menu' && (
        <button
          className="practice-games-back"
          onClick={() => selectGame('menu')}
        >
          <ArrowLeft /> Все режимы
        </button>
      )}
      {game === 'menu' ? (
        <section className="practice-mode-welcome game-panel">
          <span>🐾</span>
          <h2>Выберите тренировку</h2>
          <p>
            Тренируйте грамматику с теорией для DELE, учите слова, читайте
            истории или устройте минутный спринт.
          </p>
        </section>
      ) : grammarModes.some((m) => m.id === game) ? (
        <GrammarPractice key={game} mode={game as GrammarMode} />
      ) : game === 'study' ? (
        <AdaptivePracticeView
          assignedMode={
            assignedMode.startsWith('words:')
              ? (assignedMode.slice(6) as SessionMode)
              : null
          }
          assignedTopic={assignedTopic || null}
          showModes={() => selectGame('menu')}
        />
      ) : game === 'detective' ? (
        <DetectiveGame
          initialLevel={assignedMode === 'detective:a2' ? 'A2' : 'A1'}
        />
      ) : game === 'articles' ? (
        <ArticlePracticeGame />
      ) : (
        <SpanishRushGame />
      )}
    </div>
  );
}
