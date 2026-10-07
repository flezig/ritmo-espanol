'use client';

import { useState } from 'react';
import { profileRankForXp } from '../../lib/profile-ranks';
import { ArrowRight, Award, ShieldCheck, Sparkles } from 'lucide-react';
import type { Section, AchievementCategory } from '../../types/learning';
import { useDeviceProfile, useAchievements } from '../../lib/learning-runtime';

export function AchievementsView({ go }: { go: (section: Section) => void }) {
  const [showAllAchievements, setShowAllAchievements] = useState(false),
    { profile } = useDeviceProfile(),
    rank = profileRankForXp(profile.xp, profile.gender),
    achievements = useAchievements(),
    unlocked = achievements.filter((item) => item.unlocked),
    categories: AchievementCategory[] = [
      'Старт',
      'Регулярность',
      'Прогресс',
      'Мастерство',
      'Культура',
      'Секретные',
    ],
    nearest = achievements
      .filter((item) => !item.unlocked && !item.secret)
      .sort(
        (a, b) =>
          b.current / b.target - a.current / a.target ||
          a.target - a.current - (b.target - b.current),
      )
      .slice(0, 3),
    recent = [...unlocked]
      .sort(
        (a, b) =>
          new Date(b.unlockedAt || 0).getTime() -
          new Date(a.unlockedAt || 0).getTime(),
      )
      .slice(0, 3);
  const renderAchievementCard = (
    item: (typeof achievements)[number],
    compact = false,
  ) => {
    const hidden = item.secret && !item.unlocked;
    return (
      <article
        className={`${item.unlocked ? 'unlocked' : 'locked'} ${compact ? 'compact' : ''}`}
        key={item.id}
      >
        <span className="achievement-icon">{hidden ? '❔' : item.icon}</span>
        <div>
          <small>
            {item.unlocked ? 'ОТКРЫТО' : hidden ? 'СЕКРЕТ' : 'ЕЩЁ ЗАКРЫТО'}
          </small>
          <h3>{hidden ? '???' : item.name}</h3>
          <em>{item.unlocked ? item.unlockedMotto : item.lockedMotto}</em>
          <p>
            {hidden ? 'Условие откроется вместе с наградой.' : item.description}
          </p>
          {!hidden && (
            <>
              <div className="achievement-track">
                <i
                  style={{
                    width: `${Math.min(100, (item.current / item.target) * 100)}%`,
                  }}
                />
              </div>
              <b>
                {item.current} / {item.target}
              </b>
            </>
          )}
          {item.unlockedAt && (
            <time dateTime={item.unlockedAt}>
              Получено {new Date(item.unlockedAt).toLocaleDateString('ru-RU')}
            </time>
          )}
        </div>
      </article>
    );
  };
  return (
    <div className="view-stack achievements-view">
      <header className="achievements-hero">
        <div>
          <p className="eyebrow">НАГРАДЫ · СОХРАНЯЮТСЯ В ПРОФИЛЕ</p>
          <h1>Tu colección de historias</h1>
          <p>
            Здесь отмечаются реальные учебные события: завершённые сессии,
            выученные слова, аудирование и регулярность.
          </p>
        </div>
        <div className="achievement-hero-summary">
          <div className={`achievement-rank gender-${profile.gender.toLowerCase()}`}>
            <Sparkles />
            <span>УРОВЕНЬ {rank.level}</span>
            <b>{rank.title}</b>
            <small>{profile.xp.toLocaleString('ru-RU')} XP</small>
          </div>
          <div className="achievement-total">
            <Award />
            <b>{unlocked.length}</b>
            <span>из {achievements.length} открыто</span>
          </div>
        </div>
      </header>
      <div className="achievement-overview">
        <section className="achievement-overview-section">
          <header>
            <div>
              <span>СЛЕДУЮЩИЙ ШАГ</span>
              <h2>Три ближайшие награды</h2>
            </div>
            <button onClick={() => go('Practice')}>
              Продолжить <ArrowRight />
            </button>
          </header>
          <div className="achievement-grid achievement-nearest-grid">
            {nearest.map((item) => renderAchievementCard(item, true))}
          </div>
        </section>
        <section className="achievement-overview-section">
          <header>
            <div>
              <span>КОЛЛЕКЦИЯ</span>
              <h2>Недавно полученные</h2>
            </div>
          </header>
          {recent.length ? (
            <div className="achievement-grid achievement-recent-grid">
              {recent.map((item) => renderAchievementCard(item, true))}
            </div>
          ) : (
            <div className="achievement-empty">
              Первая награда появится после завершённого учебного действия.
            </div>
          )}
        </section>
      </div>
      <section className="achievement-category-overview">
        <header>
          <div>
            <span>КАТЕГОРИИ</span>
            <h2>Прогресс коллекции</h2>
          </div>
        </header>
        <div className="achievement-category-summary">
          {categories.map((category) => {
            const items = achievements.filter((item) => item.category === category),
              categoryUnlocked = items.filter((item) => item.unlocked).length;
            return (
              <article key={category}>
                <div>
                  <b>{category}</b>
                  <span>{categoryUnlocked} / {items.length}</span>
                </div>
                <div className="achievement-track">
                  <i style={{ width: `${items.length ? (categoryUnlocked / items.length) * 100 : 0}%` }} />
                </div>
              </article>
            );
          })}
        </div>
        <button
          type="button"
          className="achievement-catalog-toggle"
          onClick={() => setShowAllAchievements((value) => !value)}
          aria-expanded={showAllAchievements}
        >
          {showAllAchievements ? 'Скрыть полный каталог' : 'Показать все достижения'}
          <ArrowRight />
        </button>
      </section>
      {showAllAchievements && <div className="achievement-categories">
        {categories.map((category) => {
          const items = achievements.filter((item) => item.category === category);
          return (
            <section key={category}>
              <header>
                <h2>{category}</h2>
                <span>{items.filter((item) => item.unlocked).length} / {items.length}</span>
              </header>
              <div className="achievement-grid">
                {items.map((item) => renderAchievementCard(item))}
              </div>
            </section>
          );
        })}
      </div>}
      <aside className="achievement-rules">
        <ShieldCheck />
        <div>
          <b>Награды нельзя получить простым просмотром экрана</b>
          <p>
            Сессия засчитывается только после последнего задания. Spanish Rush
            не меняет степень изученности слов; он влияет лишь на собственный
            рекорд и отдельную секретную награду.
          </p>
        </div>
      </aside>
    </div>
  );
}
