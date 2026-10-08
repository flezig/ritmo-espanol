'use client';

import { useState } from 'react';
import {
  baseCardKey,
  derivedWordStatus,
  localDateKey,
  masteredRecord,
} from '../../lib/learning-core';
import { courseLessons } from '../../lessons';
import { ArrowRight, ChevronDown } from 'lucide-react';
import type { SkillType, Section } from '../../types/learning';
import {
  useAchievementStats,
  useCustomWords,
  useLearnedWordsDb,
  useSRS,
  useWordProgress,
  useDeviceProfile,
  useErrorProfile,
  useLessonProgress,
  skillLabels,
  russianDayWord,
} from '../../lib/learning-runtime';
import { makeStudyDeck, learnedWordDictationCards } from '../../lib/study-deck';
import { CatMascot, ViewHead, CatHouse, PawProgress } from './shared';

import { grammarModes } from '../../data/grammar-practice';

function MemoryDashboard() {
  const stats = useAchievementStats();
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [now] = useState(() => Date.now());
  const { words: customWords } = useCustomWords(),
    { words: learnedWordDb } = useLearnedWordsDb(),
    { records } = useSRS(),
    { progress: wordProgress } = useWordProgress(),
    { profile } = useDeviceProfile(),
    errors = useErrorProfile(),
    { progress } = useLessonProgress(),
    deck = [
      ...makeStudyDeck(customWords),
      ...learnedWordDictationCards(learnedWordDb),
    ],
    recognition = deck.filter((card) => card.skill === 'recognition'),
    wordsByBase = new Map(
      recognition.map((card) => [baseCardKey(card.key), card]),
    ),
    wordBases = [...wordsByBase.keys()],
    learnedWords = [...wordsByBase.entries()]
      .filter(
        ([base]) =>
          derivedWordStatus(base, records, wordProgress[base] || 'new') ===
          'learned',
      )
      .map(([, card]) => card)
      .sort((a, b) => a.es.localeCompare(b.es, 'es')),
    known = learnedWords.length,
    stable = wordBases.filter((base) =>
      [records[`${base}-recognition`], records[`${base}-production`]].every(
        (record) => masteredRecord(record) && record!.stability >= 21,
      ),
    ).length,
    due = new Set(
      deck
        .filter(
          (card) =>
            records[card.key]?.reviews && records[card.key].nextReview <= now,
        )
        .map((card) => baseCardKey(card.key)),
    ).size,
    newWords = wordBases.filter(
      (base) =>
        derivedWordStatus(base, records, wordProgress[base] || 'new') === 'new',
    ).length,
    active = wordBases.filter(
      (base) =>
        derivedWordStatus(base, records, wordProgress[base] || 'new') ===
          'learned' && (records[`${base}-production`]?.stability || 0) >= 7,
    ).length;
  const skillScores = (Object.keys(skillLabels) as SkillType[]).map((skill) => {
      const cards = deck.filter(
          (card) => card.skill === skill && records[card.key]?.reviews,
        ),
        reviews = cards.reduce(
          (sum, card) => sum + records[card.key].reviews,
          0,
        ),
        accuracy = cards.length
          ? Math.round(
              (cards.reduce(
                (sum, card) =>
                  sum + records[card.key].successes / records[card.key].reviews,
                0,
              ) /
                cards.length) *
                100,
            )
          : 0,
        memory = cards.length
          ? Math.round(
              (cards.reduce(
                (sum, card) =>
                  sum + Math.min(1, records[card.key].stability / 30),
                0,
              ) /
                cards.length) *
                100,
            )
          : 0,
        readiness = cards.length
          ? cards.reduce(
              (sum, card) => sum + Math.min(1, records[card.key].reviews / 3),
              0,
            ) / cards.length
          : 0,
        score = Math.round((accuracy * 0.6 + memory * 0.4) * readiness);
      const confident = cards.filter((card) =>
          masteredRecord(records[card.key]),
        ).length,
        needsReview = cards.filter(
          (card) =>
            records[card.key]?.reviews && records[card.key].nextReview <= now,
        ).length,
        total = deck.filter((card) => card.skill === skill).length,
        newCount = Math.max(0, total - cards.length);
      return {
        skill,
        score,
        accuracy,
        memory,
        reviews,
        confident,
        needsReview,
        newCount,
        total,
      };
    }),
    topErrors = Object.entries(errors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  const activityFor = (length: number) =>
    Array.from({ length }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index);
      return profile.dailyReviews[localDateKey(date)] || 0;
    }).reduce((sum, value) => sum + value, 0);
  return (
    <div className="memory-dashboard">
      <section className="progress-history grammar-progress">
        <header>
          <h3>Практика грамматики</h3>
        </header>
        <div>
          {grammarModes.map((mode) => {
            const total = stats.practiceTotalByMode[`grammar:${mode.id}`] || 0,
              correct = stats.practiceCorrectByMode[`grammar:${mode.id}`] || 0;
            return (
              <article key={mode.id}>
                <b>
                  {mode.icon} {mode.title}
                </b>
                <span>
                  {total} ответов · {correct} верно ·{' '}
                  {total ? Math.round((correct / total) * 100) : 0}%
                </span>
                <small>
                  {stats.practiceModeSessions[`grammar:${mode.id}`] || 0}{' '}
                  завершённых сессий
                </small>
              </article>
            );
          })}
        </div>
      </section>
      <section className="memory-numbers">
        <article>
          <span>🧠</span>
          <b>{known}</b>
          <p>слов действительно выучено</p>
        </article>
        <article>
          <span>💬</span>
          <b>{active}</b>
          <p>активно закреплено</p>
        </article>
        <article>
          <span>🛡️</span>
          <b>{stable}</b>
          <p>устойчиво в памяти</p>
        </article>
        <article>
          <span>⏰</span>
          <b>{due}</b>
          <p>требуют повторения</p>
        </article>
        <article>
          <span>🌱</span>
          <b>{newWords}</b>
          <p>ещё новые</p>
        </article>
      </section>
      <details className="learned-words-disclosure">
        <summary>
          <span>
            Выученные слова <small>{known}</small>
          </span>
          <span className="learned-words-toggle">
            <span className="learned-words-show">Раскрыть список</span>
            <span className="learned-words-hide">Свернуть список</span>
            <ChevronDown size={18} aria-hidden="true" />
          </span>
        </summary>
        {learnedWords.length ? (
          <ul className="learned-words-list">
            {learnedWords.map((card) => (
              <li key={baseCardKey(card.key)}>
                <b lang="es">{card.es}</b>
                <span>{card.ru}</span>
                <small>
                  {card.topic} · {card.level}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="learned-words-empty">
            Пока нет выученных слов. Практикуйте узнавание и самостоятельный
            перевод — закреплённые слова появятся здесь.
          </p>
        )}
      </details>
      <section className="memory-rules">
        <div>
          <b>🧠 Выучено</b>
          <span>
            Узнавание и самостоятельный перевод: по 3+ проверки, серия 2+,
            точность 75%+.
          </span>
        </div>
        <div>
          <b>💬 Активно закреплено</b>
          <span>
            Слово уже выучено, а устойчивость самостоятельного перевода достигла
            7 дней.
          </span>
        </div>
        <div>
          <b>🛡️ Устойчиво в памяти</b>
          <span>
            Оба основных навыка выучены и получили интервал не меньше 21 дня.
          </span>
        </div>
        <small>
          Все числа рассчитываются из тех же записей профиля, что и статусы во
          Vocabulary. Ручная отметка не может сделать слово «выученным».
        </small>
      </section>
      <section className="progress-history">
        <header>
          <div>
            <p className="eyebrow">ИСТОРИЯ АКТИВНОСТИ</p>
            <h3>Практика за 7 и 30 дней</h3>
          </div>
          <small>учитываются реальные ответы в этом профиле</small>
        </header>
        <div>
          <article>
            <b>{activityFor(7)}</b>
            <span>ответов за 7 дней</span>
          </article>
          <article>
            <b>{activityFor(30)}</b>
            <span>ответов за 30 дней</span>
          </article>
          <article>
            <b>
              {
                profile.activeDays.filter((day) => {
                  const date = new Date(`${day}T00:00:00`);
                  return now - date.getTime() < 30 * 86400000;
                }).length
              }
            </b>
            <span>дней с заходом за 30 дней</span>
          </article>
          <article>
            <b>{profile.streak}</b>
            <span>{russianDayWord(profile.streak)} подряд</span>
          </article>
        </div>
      </section>
      <div className="insight-grid">
        <section className="skill-panel">
          <header>
            <div>
              <p className="eyebrow">ПОЛОСА НАВЫКОВ</p>
              <h3>Что уже закрепилось</h3>
            </div>
            <small>данные текущего профиля</small>
          </header>
          <div className="skill-formula">
            <b>Как считается процент</b>
            <code>Итог = точность × 60% + устойчивость памяти × 40%</code>
            <p>
              Итог начинает расти после практики и полностью учитывается только
              после трёх проверок. Слово считается выученным, когда и узнавание,
              и самостоятельный перевод прошли минимум 3 проверки, имеют серию
              2+ и точность не ниже 75%.
            </p>
          </div>
          <div>
            {skillScores.map((item) => (
              <button
                type="button"
                className="clickable-skill"
                key={item.skill}
                onClick={() =>
                  setSelectedSkill(
                    selectedSkill === item.skill ? null : item.skill,
                  )
                }
                aria-expanded={selectedSkill === item.skill}
              >
                <span>
                  <b>{skillLabels[item.skill]}</b>
                  <em>{item.score}%</em>
                </span>
                <i>
                  <b style={{ width: `${item.score}%` }} />
                </i>
                <small>
                  Точность {item.accuracy}% · память {item.memory}% ·{' '}
                  {item.reviews} проверок
                </small>
                {selectedSkill === item.skill && (
                  <div className="skill-breakdown">
                    <b>
                      {skillLabels[item.skill]} — {item.score}%
                    </b>
                    <span>{item.total} навыков всего</span>
                    <span>{item.confident} уверенно закреплены</span>
                    <span>{item.needsReview} требуют повторения</span>
                    <span>{item.newCount} ещё новые</span>
                    <p>
                      Процент учитывает точность (60%), устойчивость памяти
                      (40%) и становится полным только после трёх активных
                      проверок.
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
        <section className="error-panel">
          <p className="eyebrow">УМНЫЙ ПРОФИЛЬ ОШИБОК</p>
          <h3>Мои слабые места</h3>
          {topErrors.length ? (
            <div>
              {topErrors.map(([name, count], index) => (
                <article key={name}>
                  <span>{index + 1}</span>
                  <div>
                    <b>{name}</b>
                    <small>
                      {count} {count === 1 ? 'ошибка' : 'ошибок'}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="clean-errors">
              <CatMascot state="happy" small />
              <p>
                Ошибок пока нет. После практики здесь появится персональная
                картина.
              </p>
            </div>
          )}
        </section>
      </div>
      <section className="knowledge-map">
        <header>
          <div>
            <p className="eyebrow">КАРТА ЗНАНИЙ · A1</p>
            <h3>От темы к навыку</h3>
          </div>
          <small>✓ освоено · ◐ в процессе · ○ впереди</small>
        </header>
        <div className="knowledge-path">
          <span className="mastered">A1</span>
          {courseLessons.map((lesson, index) => {
            const state = progress[lesson.id];
            return (
              <div key={lesson.id}>
                <i>→</i>
                <span
                  className={
                    state?.completed ? 'mastered' : state?.done ? 'current' : ''
                  }
                >
                  {state?.completed ? '✓' : state?.done ? '◐' : '○'}{' '}
                  {lesson.title}
                </span>
                <i>→</i>
                <span
                  className={
                    state?.completed ? 'mastered' : state?.done ? 'current' : ''
                  }
                >
                  {index === 0
                    ? 'ser · профессии · артикли'
                    : index === 1
                      ? 'tener · семья · согласование'
                      : index === 2
                        ? 'presente · время · вопросы'
                        : index === 3
                          ? 'hay · estar · предлоги места'
                          : 'gustar · заказ · количество'}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function ProgressView({ go }: { go: (s: Section) => void }) {
  const { progress } = useLessonProgress(),
    { profile } = useDeviceProfile(),
    completed = courseLessons.filter(
      (item) => progress[item.id]?.completed,
    ).length,
    totalDone = courseLessons.reduce(
      (sum, item) =>
        sum + Math.min(item.exercises.length, progress[item.id]?.done || 0),
      0,
    ),
    totalCorrect = courseLessons.reduce(
      (sum, item) =>
        sum +
        Math.min(progress[item.id]?.done || 0, progress[item.id]?.correct || 0),
      0,
    ),
    lessonAccuracy = totalDone
      ? Math.round((totalCorrect / totalDone) * 100)
      : 0,
    allAccuracy = profile.totalReviews
      ? Math.round((profile.totalCorrect / profile.totalReviews) * 100)
      : 0,
    nextLesson = courseLessons.find((item) => !progress[item.id]?.completed),
    lessonTotal = courseLessons.length,
    totalTasks = courseLessons.reduce(
      (sum, item) => sum + item.exercises.length,
      0,
    );
  return (
    <div className="view-stack progress-view">
      <ViewHead
        over="МОЙ КОШАЧИЙ ДОМ · ДАННЫЕ ПРОФИЛЯ"
        title="Прогресс, который хочется продолжать."
        copy="Уроки, память, ошибки и кошачий дом сохраняются в профиле, а после входа доступны на других устройствах."
      />
      <div className="progress-metrics">
        <article>
          <span>🐾</span>
          <b>
            {totalDone}
            <small>/{totalTasks}</small>
          </b>
          <p>заданий в уроках</p>
        </article>
        <article>
          <span>🏠</span>
          <b>
            {completed}
            <small>/{lessonTotal}</small>
          </b>
          <p>уроков завершено</p>
        </article>
        <article>
          <span>✨</span>
          <b>
            {lessonAccuracy}
            <small>%</small>
          </b>
          <p>точность в уроках</p>
        </article>
        <article>
          <span>🎯</span>
          <b>{profile.totalReviews}</b>
          <p>всего реальных ответов</p>
        </article>
        <article>
          <span>✅</span>
          <b>
            {allAccuracy}
            <small>%</small>
          </b>
          <p>точность по всему сайту</p>
        </article>
      </div>
      <div className="house-progress-page">
        <CatHouse level={completed} />
        <section className="house-status">
          <p className="eyebrow">
            ОБУСТРОЙСТВО · {completed} ИЗ {lessonTotal}
          </p>
          <h2>
            {completed === 0
              ? 'Начните первый урок'
              : completed === lessonTotal
                ? 'Дом полностью готов!'
                : 'Следующая вещь уже близко'}
          </h2>
          <p className="progress-copy">
            {completed === lessonTotal
              ? `Вы прошли всю стартовую дорожку из ${lessonTotal} уроков. Можно повторять задания и улучшать точность.`
              : nextLesson
                ? `Следующая награда — «${nextLesson.reward}». До неё осталось ${Math.max(0, nextLesson.exercises.length - (progress[nextLesson.id]?.done || 0))} заданий.`
                : ''}
          </p>
          <PawProgress done={totalDone} total={totalTasks} />
          <div className="house-rewards">
            {courseLessons.map((item) => {
              const itemProgress = progress[item.id] || {
                done: 0,
                completed: false,
                correct: 0,
              };
              return (
                <article
                  className={
                    itemProgress.completed
                      ? 'unlocked'
                      : itemProgress.done
                        ? 'in-progress'
                        : ''
                  }
                  key={item.id}
                >
                  <span>
                    {itemProgress.completed
                      ? '✓'
                      : itemProgress.done
                        ? '🐾'
                        : '🔒'}
                  </span>
                  <div>
                    <b>{item.reward}</b>
                    <small>{item.title}</small>
                    <div className="reward-track">
                      <i
                        style={{
                          width: `${Math.min(100, (itemProgress.done / item.exercises.length) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <strong>
                    {Math.min(item.exercises.length, itemProgress.done)}/
                    {item.exercises.length}
                  </strong>
                </article>
              );
            })}
          </div>
          <button
            className="primary-btn progress-action"
            onClick={() => go('Lessons')}
          >
            {completed === lessonTotal ? 'Повторить уроки' : 'Продолжить урок'}{' '}
            <ArrowRight />
          </button>
          {completed === lessonTotal && (
            <div className="cats-together">
              <CatMascot state="love" />
              <p>Все уроки завершены — оба котика сидят рядом в новом доме.</p>
            </div>
          )}
        </section>
      </div>
      <MemoryDashboard />
    </div>
  );
}
