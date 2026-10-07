'use client';

import { useEffect, useState } from 'react';
import type { AchievementDefinition } from '../../types/learning';
import { playCelebrationSound } from './shared';

export function LearnedAchievementToast() {
  const [word, setWord] = useState('');
  useEffect(() => {
    let timer = 0;
    const show = (event: Event) => {
      const learnedWord =
        (event as CustomEvent<{ word?: string }>).detail?.word || 'Новое слово';
      setWord(learnedWord);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setWord(''), 4500);
      localStorage.removeItem('ritmo-latest-achievement');
    };
    window.addEventListener('ritmo-word-learned', show);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('ritmo-word-learned', show);
    };
  }, []);
  if (!word) return null;
  return (
    <output className="word-achievement">
      <span>🏆</span>
      <div>
        <b>Слово действительно выучено!</b>
        <p>{word} закреплено в узнавании и активном переводе.</p>
      </div>
    </output>
  );
}

export function AchievementUnlockToast({
  openAchievements,
}: {
  openAchievements: () => void;
}) {
  const [achievement, setAchievement] =
      useState<AchievementDefinition | null>(null),
    [flying, setFlying] = useState(false);
  useEffect(() => {
    let flyTimer = 0,
      closeTimer = 0;
    const show = (event: Event) => {
      const next = (event as CustomEvent<AchievementDefinition>).detail;
      if (!next) return;
      window.clearTimeout(flyTimer);
      window.clearTimeout(closeTimer);
      setAchievement(next);
      setFlying(false);
      playCelebrationSound('achievement');
      flyTimer = window.setTimeout(() => setFlying(true), 3400);
      closeTimer = window.setTimeout(() => {
        setAchievement(null);
        setFlying(false);
      }, 4850);
    };
    window.addEventListener('ritmo-achievement-unlocked', show);
    return () => {
      window.clearTimeout(flyTimer);
      window.clearTimeout(closeTimer);
      window.removeEventListener('ritmo-achievement-unlocked', show);
    };
  }, []);
  if (!achievement) return null;
  return (
    <button
      className={`achievement-unlock-toast ${flying ? 'flying' : ''}`}
      onClick={openAchievements}
      aria-label={`Открыть достижение ${achievement.name}`}
    >
      <span className="achievement-toast-cat" aria-hidden="true">
        <i>🐱</i><em>🐾</em>
      </span>
      <article>
        <small>НОВОЕ ДОСТИЖЕНИЕ</small>
        <b>{achievement.icon} {achievement.name}</b>
        <p>{achievement.unlockedMotto}</p>
      </article>
    </button>
  );
}
