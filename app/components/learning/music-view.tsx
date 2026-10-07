'use client';

import { useEffect, useRef, useState } from 'react';
import { hasOnlySpanishMarkDifference, normalizeText } from '../../lib/learning-core';
import {
  beginAssignedSession,
  completeAssignedSession,
  recordAssignedActivity,
} from '../../lib/assignment-tracking';
import { ArrowRight, Play } from 'lucide-react';
import { YouTubeEmbed } from '../youtube-embed';
import { ReportExerciseButton } from '../report-exercise-button';
import {
  useTaskMotion,
  shuffledOptions,
  playFeedbackSound,
  playCelebrationSound,
  CatPeek,
  AccentKeys,
} from './shared';
import { songs } from '../../data/songs';
import {
  recordLearningEvent,
  recordError,
  recordAchievementEvent,
} from '../../lib/learning-runtime';

export function MusicView() {
  const [selected, setSelected] = useState(0),
    [game, setGame] = useState(0),
    [choice, setChoice] = useState(''),
    [score, setScore] = useState(0),
    [typedClip, setTypedClip] = useState(''),
    [clipAttempt, setClipAttempt] = useState(0),
    [hintLevel, setHintLevel] = useState(0);
  const { leaving, move } = useTaskMotion(),
    answerLock = useRef(false);
  const song = songs[selected],
    round = song.games[game],
    displayOptions = shuffledOptions(
      round.options || [],
      `${song.title}-${game}`,
    ),
    totalExercises = songs.reduce((sum, item) => sum + item.games.length, 0),
    isCorrect =
      !!choice && normalizeText(choice) === normalizeText(round.answer);
  useEffect(() => {
    const focusRequestedSong = () => {
      const requestedTitle = sessionStorage.getItem('ritmo-focus-song-title'),
        requestedIndex = songs.findIndex((item) => item.title === requestedTitle);
      if (requestedIndex >= 0) setSelected(requestedIndex);
      sessionStorage.removeItem('ritmo-focus-song-title');
    };
    focusRequestedSong();
    window.addEventListener('ritmo-global-search-focus', focusRequestedSong);
    return () =>
      window.removeEventListener('ritmo-global-search-focus', focusRequestedSong);
  }, []);
  const resetRound = () => {
    answerLock.current = false;
    setChoice('');
    setTypedClip('');
    setClipAttempt(0);
    setHintLevel(0);
  };
  const selectSong = (index: number) => {
    beginAssignedSession('music', normalizeText(songs[index].title).replace(/\s+/g, '-'));
    setSelected(index);
    setGame(0);
    resetRound();
    setScore(0);
  };
  const answer = (option: string) => {
    if (choice || answerLock.current) return;
    answerLock.current = true;
    const correct = normalizeText(option) === normalizeText(round.answer);
    recordAssignedActivity({
      type: 'music', contentId: normalizeText(song.title).replace(/\s+/g, '-'), itemKey: `${normalizeText(song.title)}:${game}`,
      prompt: round.prompt, studentAnswer: option, correctAnswer: round.answer,
      correct, score: correct ? 1 : 0,
    });
    setChoice(option);
    playFeedbackSound(correct);
    recordLearningEvent(correct, correct ? 5 : 2);
    if (!correct) recordError(`Песня: ${song.title}`);
    if (correct) setScore((value) => value + 1);
  };
  const next = () =>
    move(() => {
      const finished = game === song.games.length - 1;
      setGame(finished ? 0 : game + 1);
      resetRound();
      if (finished) {
        completeAssignedSession({ type: 'music', contentId: normalizeText(song.title).replace(/\s+/g, '-'), correct: score, total: song.games.length, score });
        setScore(0);
        playCelebrationSound('finish');
        recordAchievementEvent({
          type: 'song-session',
          songId: normalizeText(song.title).replace(/\s+/g, '-'),
          correct: score,
          total: song.games.length,
        });
      }
    });
  const clipTime = round.clip
    ? `${Math.floor(round.clip.start / 60)}:${String(round.clip.start % 60).padStart(2, '0')}–${Math.floor(round.clip.end / 60)}:${String(round.clip.end % 60).padStart(2, '0')}`
    : '';
  const answerWords = round.answer.split(/\s+/),
    maskedAnswer = answerWords
      .map((word) => `${word[0]}${'_'.repeat(Math.max(1, word.length - 1))}`)
      .join(' '),
    isSentence = answerWords.length > 4;
  return (
    <div className="view-stack">
      <header className="music-head">
        <div>
          <p className="eyebrow">
            МУЗЫКАЛЬНАЯ ПРАКТИКА · {totalExercises} ЗАДАНИЙ
          </p>
          <h1>
            Слушай ритм.
            <br />
            Лови смысл.
          </h1>
        </div>
        <div className="equalizer">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </header>
      <div className="artist-grid song-grid">
        {songs.map((item, index) => (
          <article
            className={`artist-card ${item.tone} ${selected === index ? 'selected' : ''}`}
            key={item.title}
          >
            <div className="artist-number">0{index + 1}</div>
            <div className="artist-wave">RITMO</div>
            <div className="artist-info">
              <span>🎵 {item.level}</span>
              <h3>{item.title}</h3>
              <p>
                {item.artist} · {item.topic}
              </p>
              <button
                onClick={() => selectSong(index)}
                aria-label={`Открыть задания к ${item.title}`}
              >
                <Play fill="currentColor" />
              </button>
            </div>
          </article>
        ))}
      </div>
      {song.videoId && (
        <section className="clip-study">
          <div className="clip-frame">
            <YouTubeEmbed videoId={song.videoId} title={`${song.artist} — ${song.title}, официальный клип`} />
          </div>
          <aside>
            <p className="eyebrow">СМОТРИ · СЛУШАЙ · ОТВЕЧАЙ</p>
            <h2>Тест использует этот клип</h2>
            <p>
              Посмотрите видео целиком или сразу переходите к коротким эпизодам:
              в диктанте нужно самостоятельно написать услышанное.
            </p>
            <div>
              <span>🎧 Повторяйте фрагмент сколько нужно</span>
              <span>⌨️ Пишите без вариантов ответа</span>
              <span>🎬 Сопоставляйте речь и видеоряд</span>
            </div>
            {song.videoUrl && (
              <a href={song.videoUrl} target="_blank" rel="noreferrer">
                Открыть на YouTube <ArrowRight />
              </a>
            )}
          </aside>
        </section>
      )}
      <article className="song-lab">
        <header>
          <div>
            <p className="eyebrow">SONG LAB · {song.artist}</p>
            <h2>
              {song.title}: {song.games.length} разных заданий
            </h2>
          </div>
          <span>
            {game + 1} / {song.games.length} · {score} ✓
          </span>
        </header>
        <div className="quiz-progress">
          <span
            style={{ width: `${((game + 1) / song.games.length) * 100}%` }}
          />
        </div>
        <div className="game-kinds">
          {[...new Set(song.games.map((item) => item.kind))].map((kind) => (
            <span className={round.kind === kind ? 'active' : ''} key={kind}>
              {kind}
            </span>
          ))}
        </div>
        <div
          className={`music-question cat-card task-swap ${leaving ? 'leaving' : ''}`}
          key={`${song.title}-${game}`}
        >
          <CatPeek
            state={choice ? (isCorrect ? 'happy' : 'wrong') : 'thinking'}
          />
          <ReportExerciseButton
            id={`music:${normalizeText(song.title)}:${normalizeText(round.prompt)}:${normalizeText(round.answer)}`}
            section={`Музыка: ${song.artist} — ${song.title}`}
            prompt={round.prompt}
            answer={round.answer}
            options={round.options}
            learningContext={{ type: 'music', contentId: normalizeText(song.title).replace(/\s+/g, '-') }}
          />
          <small>{round.kind.toUpperCase()}</small>
          <h3>{round.prompt}</h3>
          {round.clip && song.videoId ? (
            <div className="clip-dictation">
              <div className="mini-clip" key={`${song.videoId}-${game}-${clipAttempt}`}>
                <YouTubeEmbed compact videoId={song.videoId} start={round.clip.start} end={round.clip.end} title={`Фрагмент ${clipTime} из ${song.title}`} />
              </div>
              <div className="clip-tools">
                <button
                  className="replay-clip"
                  onClick={() => setClipAttempt((value) => value + 1)}
                >
                  ↻ Вернуть к началу фрагмента
                </button>
                <a
                  className="open-clip-youtube"
                  href={`${song.videoUrl}&t=${round.clip.start}s`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Открыть фрагмент на YouTube
                </a>
                <button
                  className="clip-hint-button"
                  onClick={() =>
                    setHintLevel((value) =>
                      Math.min(isSentence ? 3 : 2, value + 1),
                    )
                  }
                  disabled={hintLevel >= (isSentence ? 3 : 2)}
                >
                  💡 {hintLevel ? 'Ещё подсказка' : 'Подсказка'}
                </button>
              </div>
              {hintLevel > 0 && (
                <div className="clip-hint">
                  <b>Подсказка {hintLevel}</b>
                  <span>
                    {hintLevel === 1
                      ? `${answerWords.length} ${answerWords.length === 1 ? 'слово' : 'слова'} · начинается с «${round.answer[0]}»`
                      : hintLevel === 2
                        ? maskedAnswer
                        : round.tip}
                  </span>
                </div>
              )}
              <div className="answer-entry-with-keys">
                <div className="type-answer">
                  <input
                    value={typedClip}
                    onChange={(event) => setTypedClip(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && typedClip.trim())
                        answer(typedClip);
                    }}
                    placeholder="Напишите услышанное по-испански…"
                    disabled={!!choice}
                  />
                  <button
                    onClick={() => answer(typedClip)}
                    disabled={!typedClip.trim() || !!choice}
                  >
                    Проверить
                  </button>
                </div>
                <AccentKeys value={typedClip} onChange={setTypedClip} />
              </div>
              <p>
                Регистр и знаки препинания не учитываются. Испанские ударения
                желательно сохранять.
              </p>
            </div>
          ) : (
            <div className="answers">
              {displayOptions.map((option) => (
                <button
                  className={
                    choice === option
                      ? normalizeText(option) === normalizeText(round.answer)
                        ? 'correct'
                        : 'wrong'
                      : choice &&
                          normalizeText(option) === normalizeText(round.answer)
                        ? 'correct ghost'
                        : ''
                  }
                  onClick={() => answer(option)}
                  disabled={!!choice}
                  key={option}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
          {!choice && (
            <button className="dont-know" onClick={() => answer('__не знаю__')}>
              Не знаю — показать ответ
            </button>
          )}
          {choice && (
            <div className={isCorrect ? 'feedback good' : 'feedback'}>
              {isCorrect
                ? '✓ Отлично. '
                : `Правильный ответ: ${round.answer}. `}
              <span>{round.tip}</span>
              {hasOnlySpanishMarkDifference(choice, round.answer) && (
                <small className="soft-spelling">
                  Засчитано: сравните ударение и ñ с правильным написанием.
                </small>
              )}
              {isCorrect && (
                <strong className="word-assembled">{round.answer}</strong>
              )}
              <button className="next-test" onClick={next}>
                {game === song.games.length - 1
                  ? 'Пройти заново'
                  : 'Следующее задание'}{' '}
                <ArrowRight />
              </button>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
