'use client';

import { useAccount } from '../account-provider';
import { useEffect, useRef, useState } from 'react';
import { trackLocalEvent } from '../../lib/local-analytics';
import { recordClientError } from '../../lib/error-journal';
import { ArrowRight, Keyboard, Play } from 'lucide-react';
import { deleA2Sources } from '../../dele-a2-vocabulary';
import type { ExampleReport, CatState, Section } from '../../types/learning';
import { readSitePreferences } from '../../hooks/site-preferences';

export function ReportExampleButton({
  id,
  word,
  example,
  translation,
  source,
}: Omit<ExampleReport, 'createdAt'>) {
  const account = useAccount();
  const [reported, setReported] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem('ritmo-example-reports') || '[]',
      );
      setReported(
        Array.isArray(stored) && stored.some((item) => item?.id === id),
      );
    } catch {
      setReported(false);
    }
  }, [id]);
  const toggle = () => {
    try {
      const stored = JSON.parse(
          localStorage.getItem('ritmo-example-reports') || '[]',
        ),
        reports: ExampleReport[] = Array.isArray(stored) ? stored : [],
        wasReported = reports.some((item) => item.id === id),
        next = wasReported
          ? reports.filter((item) => item.id !== id)
          : [
              ...reports,
              {
                id,
                word,
                example,
                translation,
                source,
                createdAt: new Date().toISOString(),
              },
            ];
      localStorage.setItem('ritmo-example-reports', JSON.stringify(next));
      setReported(next.some((item) => item.id === id));
      window.dispatchEvent(new Event('ritmo-example-reports'));
      void account.reportContent({
        reportKey: id,
        kind: 'example',
        section: source,
        content: { word, example, translation },
        active: !wasReported,
      });
      if (!wasReported)
        trackLocalEvent('example_reported', source);
    } catch {}
  };
  return (
    <button
      className={`report-example ${reported ? 'reported' : ''}`}
      onClick={toggle}
      title="Сохранить пример в списке для проверки"
      aria-pressed={reported}
    >
      {reported ? '✓ Отмечено для проверки' : '⚑ Странный пример'}
    </button>
  );
}

export function SpellingDiff({ value, answer }: { value: string; answer: string }) {
  return (
    <div
      className="spelling-diff"
      aria-label={`Ваш ответ: ${value}; правильный ответ: ${answer}`}
    >
      <small>Сравните ответы</small>
      <div className="spelling-answer-row user-answer">
        <span>Вы написали</span>
        <b>{value || '—'}</b>
      </div>
      <div className="spelling-answer-row expected-answer">
        <span>Правильный вариант</span>
        <b>{answer}</b>
      </div>
    </div>
  );
}

export function useSpanishVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]),
    [voiceIndex, setVoiceIndex] = useState(0),
    [voiceError, setVoiceError] = useState(''),
    utteranceRef = useRef<SpeechSynthesisUtterance | null>(null),
    watchdogRef = useRef<number | null>(null);
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') {
      queueMicrotask(() => setVoiceError('Этот браузер не поддерживает озвучивание. Можно продолжить без аудио.'));
      return;
    }
    const load = () => {
      const spanish = speechSynthesis
          .getVoices()
          .filter((voice) =>
            voice.lang.toLowerCase().startsWith('es') ||
            /espa(?:ñ|n)ol|spanish|castilian/i.test(voice.name),
          ),
        femaleNames =
          /m[oó]nica|paulina|marisol|helena|luciana|soledad|conchita|alba|dalia|lola|paloma|elvira/i,
        maleNames =
          /jorge|diego|juan|carlos|pablo|enrique|miguel|[aá]lvaro|dario|arnau|nicol[aá]s|santiago|arturo|sergio|sa[uú]l|andr[eé]s|mateo|ra[uú]l/i,
        qualityScore = (voice: SpeechSynthesisVoice) =>
          /premium|enhanced|natural|neural|google|microsoft/i.test(voice.name)
            ? -2
            : voice.localService
              ? -1
              : 0,
        female = spanish
          .filter((voice) => femaleNames.test(voice.name))
          .sort((a, b) => qualityScore(a) - qualityScore(b)),
        male = spanish
          .filter((voice) => maleNames.test(voice.name))
          .sort((a, b) => qualityScore(a) - qualityScore(b)),
        other = spanish.filter(
          (voice) => !female.includes(voice) && !male.includes(voice),
        ),
        findNamed = (pattern: RegExp) =>
          spanish.find((voice) => pattern.test(voice.name)),
        preferred = [
          findNamed(/paulina/i),
          findNamed(/m[oó]nica/i),
          findNamed(/jorge/i),
          findNamed(/diego/i),
          findNamed(/[aá]lvaro|dario|arnau|nicol[aá]s|santiago/i),
          findNamed(/pablo|enrique|miguel|arturo|sergio|sa[uú]l|andr[eé]s|mateo|ra[uú]l/i),
        ].filter(Boolean) as SpeechSynthesisVoice[],
        ordered = [...new Set([...preferred, ...female, ...male, ...other])];
      setVoices(ordered);
      // Chromium-based browsers (including Yandex Browser) may synthesize the
      // requested language even when they do not expose that voice in
      // getVoices(). In that case we intentionally leave utterance.voice unset.
      setVoiceError('');
      const saved = localStorage.getItem('ritmo-spanish-voice');
      if (saved) {
        const savedIndex = ordered.findIndex((voice) => voice.name === saved);
        if (savedIndex >= 0) setVoiceIndex(savedIndex);
      }
    };
    queueMicrotask(load);
    const retries = [100, 500, 1500, 3000].map((delay) =>
      window.setTimeout(load, delay),
    );
    speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      retries.forEach((timer) => window.clearTimeout(timer));
      if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current);
      speechSynthesis.removeEventListener('voiceschanged', load);
    };
  }, []);
  const chooseVoice = (index: number) => {
    setVoiceIndex(index);
    const voice = voices[index];
    if (voice) localStorage.setItem('ritmo-spanish-voice', voice.name);
  };
  const speakText = (text: string, speed = 1) => {
    if (typeof speechSynthesis === 'undefined') {
      setVoiceError('Озвучивание недоступно в этом браузере.');
      return false;
    }
    if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current);
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    utterance.lang = 'es-ES';
    utterance.rate = speed;
    utterance.pitch = 1;
    utterance.volume = 1;
    const allAvailable = speechSynthesis.getVoices(),
      currentlyAvailable = allAvailable.filter((voice) =>
        voice.lang.toLowerCase().startsWith('es') ||
        /espa(?:ñ|n)ol|spanish|castilian/i.test(voice.name),
      ),
      selectedVoice = voices[voiceIndex % Math.max(voices.length, 1)] ||
        currentlyAvailable[0] || allAvailable.find((voice) => voice.default) ||
        allAvailable.find((voice) => voice.localService) || allAvailable[0];
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onerror = (event) => {
      if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current);
      utteranceRef.current = null;
      setVoiceError(selectedVoice
        ? 'Не удалось включить выбранный голос. Попробуйте другой.'
        : 'Яндекс.Браузер не смог запустить системную озвучку. Разрешите звук для сайта и попробуйте ещё раз.');
      if (event.error !== 'canceled' && event.error !== 'interrupted')
        recordClientError('audio', event.error || 'speech-synthesis-error', {
          voice: utterance.voice?.name || '',
          language: utterance.lang,
          speed,
        });
    };
    utterance.onstart = () => {
      if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current);
      setVoiceError('');
    };
    utterance.onend = () => {
      if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current);
      utteranceRef.current = null;
    };
    setVoiceError('');
    speechSynthesis.resume();
    speechSynthesis.speak(utterance);
    watchdogRef.current = window.setTimeout(() => {
      if (!speechSynthesis.speaking) {
        setVoiceError('Озвучка не запустилась. Разрешите звук для сайта и установите голос Español в настройках системы.');
        recordClientError('audio', 'speech-synthesis-silent-timeout', {
          browser: navigator.userAgent,
          availableVoices: allAvailable.length,
          spanishVoices: currentlyAvailable.length,
        });
      }
    }, 1800);
    return true;
  };
  return { voices, voiceIndex, setVoiceIndex: chooseVoice, speakText, voiceError };
}

export const voiceDisplayName = (voice: SpeechSynthesisVoice) => {
  const male =
      /jorge|diego|juan|carlos|pablo|enrique|miguel|[aá]lvaro|dario|arnau|nicol[aá]s|santiago|arturo|sergio|sa[uú]l|andr[eé]s|mateo|ra[uú]l/i.test(
        voice.name,
      ),
    female =
      /m[oó]nica|paulina|marisol|helena|luciana|soledad|conchita|alba|dalia|lola|paloma|elvira/i.test(
        voice.name,
      ),
    quality = /premium|enhanced|natural|neural|google|microsoft/i.test(
      voice.name,
    )
      ? ' · улучшенный'
      : '';
  return `${male ? 'Мужской' : female ? 'Женский' : 'Испанский голос'} · ${voice.name} (${voice.lang})${quality}`;
};

export const playFeedbackSound = (success: boolean) => {
  if (typeof window === 'undefined' || !readSitePreferences().sounds) return;
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass(),
    start = context.currentTime,
    notes = success ? [523.25, 659.25] : [220, 164.81];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator(),
      gain = context.createGain(),
      noteStart = start + index * 0.11;
    oscillator.type = success ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(
      success ? 0.12 : 0.08,
      noteStart + 0.015,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.17);
  });
  window.setTimeout(() => void context.close(), 500);
};

export const playCelebrationSound = (kind: 'achievement' | 'finish' = 'finish') => {
  if (typeof window === 'undefined' || !readSitePreferences().sounds) return;
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass(),
    start = context.currentTime,
    notes =
      kind === 'achievement'
        ? [392, 523.25, 659.25, 783.99, 1046.5]
        : [440, 554.37, 659.25];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator(),
      gain = context.createGain(),
      noteStart = start + index * (kind === 'achievement' ? 0.1 : 0.12);
    oscillator.type = index % 2 ? 'sine' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(
      kind === 'achievement' ? 0.13 : 0.09,
      noteStart + 0.02,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.26);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.27);
  });
  window.setTimeout(() => void context.close(), 1000);
};

const spanishInputKeys = ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'];

const spanishLetterReplacements: Record<string, string[]> = {
  a: ['á'],
  e: ['é'],
  i: ['í'],
  o: ['ó'],
  u: ['ú', 'ü'],
  n: ['ñ'],
};

export function AccentKeys({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const rootRef = useRef<HTMLElement>(null),
    caretRef = useRef(value.length),
    [caret, setCaret] = useState(value.length),
    [showKeyboard, setShowKeyboard] = useState(false);
  const input = () =>
    rootRef.current
      ?.closest('.answer-entry-with-keys')
      ?.querySelector<HTMLInputElement>('input');
  useEffect(() => {
    const field = input();
    if (!field) return;
    const syncCaret = () => {
      const position = field.selectionStart ?? field.value.length;
      caretRef.current = position;
      setCaret(position);
    };
    syncCaret();
    field.addEventListener('input', syncCaret);
    field.addEventListener('keyup', syncCaret);
    field.addEventListener('click', syncCaret);
    field.addEventListener('select', syncCaret);
    return () => {
      field.removeEventListener('input', syncCaret);
      field.removeEventListener('keyup', syncCaret);
      field.removeEventListener('click', syncCaret);
      field.removeEventListener('select', syncCaret);
    };
  }, []);
  const lastCharacter = caret > 0 ? value.slice(caret - 1, caret) : '';
  const replacements =
    spanishLetterReplacements[lastCharacter.toLocaleLowerCase('es')] || [];
  const preserveCase = (character: string) =>
    lastCharacter &&
    lastCharacter === lastCharacter.toLocaleUpperCase('es') &&
    lastCharacter !== lastCharacter.toLocaleLowerCase('es')
      ? character.toLocaleUpperCase('es')
      : character;

  const applyAtCaret = (character: string, replacePrevious = false) => {
    const position = caretRef.current,
      from = replacePrevious ? Math.max(0, position - 1) : position,
      next = value.slice(0, from) + character + value.slice(position),
      nextCaret = from + character.length;
    onChange(next);
    caretRef.current = nextCaret;
    setCaret(nextCaret);
    window.requestAnimationFrame(() => {
      const field = input();
      field?.focus();
      field?.setSelectionRange(nextCaret, nextCaret);
    });
  };
  const keepInputFocused = (event: { preventDefault: () => void }) =>
    event.preventDefault();

  return (
    <aside className="accent-keys" ref={rootRef}>
      {replacements.length > 0 && (
        <div className="smart-accent-suggestion" aria-live="polite">
          <span>Заменить «{lastCharacter}»:</span>
          {replacements.map((character) => {
            const replacement = preserveCase(character);
            return (
              <button
                type="button"
                className="smart-accent-button"
                onMouseDown={keepInputFocused}
                onClick={() => applyAtCaret(replacement, true)}
                aria-label={`Заменить ${lastCharacter} на ${replacement}`}
                key={character}
              >
                {replacement}
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        className="accent-keyboard-toggle"
        onMouseDown={keepInputFocused}
        onClick={() => setShowKeyboard((value) => !value)}
        aria-expanded={showKeyboard}
      >
        <Keyboard />
        {showKeyboard ? 'Скрыть символы' : 'Испанские символы'}
      </button>
      {showKeyboard && (
        <div className="accent-key-grid">
          {spanishInputKeys.map((character) => (
            <button
              type="button"
              onMouseDown={keepInputFocused}
              onClick={() => applyAtCaret(character)}
              key={character}
            >
              {character}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

export function DeleA2SourceNote() {
  return (
    <p className="muted">
      Лексика для подготовки к DELE A2: жильё, покупки, поездки, работа и услуги. Ориентиры —{' '}
      <a href={deleA2Sources.curriculum} target="_blank" rel="noreferrer">программа Instituto Cervantes</a>{' '}
      и <a href={deleA2Sources.model} target="_blank" rel="noreferrer">образец экзамена DELE A2</a>.
      {' '}Примеры и упражнения авторские, не официальные задания экзамена.
    </p>
  );
}

export function CatMascot({
  state = 'neutral',
  small = false,
  interactive = true,
}: {
  state?: CatState;
  small?: boolean;
  interactive?: boolean;
}) {
  const [petted, setPetted] = useState(false),
    [message, setMessage] = useState('');
  const pet = () => {
    if (!interactive) return;
    setPetted(false);
    window.requestAnimationFrame(() => setPetted(true));
    setMessage(
      ['Мр-р-р!', '¡Miau! ♥', 'Ещё раз!', 'Ты молодец!'][
        Math.floor(Math.random() * 4)
      ],
    );
    window.setTimeout(() => {
      setPetted(false);
      setMessage('');
    }, 1100);
  };
  const className = `cat-mascot ${state} ${small ? 'small' : ''} ${interactive ? 'interactive' : ''} ${petted ? 'petted' : ''}`;
  if (!interactive)
    return <span className={className} aria-label={`Кот-помощник: ${state}`} />;
  return (
    <button
      type="button"
      className={className}
      aria-label={`Погладить котика, состояние: ${state}`}
      title="Нажми и погладь котика"
      onClick={pet}
    >
      {message && <i className="cat-bubble">{message}</i>}
    </button>
  );
}

export function CatPeek({ state = 'neutral' }: { state?: CatState }) {
  return (
    <span className="cat-peek">
      <CatMascot state={state} interactive={false} />
    </span>
  );
}

export function PawProgress({ done, total = 50 }: { done: number; total?: number }) {
  const paws = 10,
    filled = Math.ceil((done / total) * paws);
  return (
    <div className="paw-progress" aria-label={`Выполнено ${done} из ${total}`}>
      {Array.from({ length: paws }).map((_, index) => (
        <span className={index < filled ? 'filled' : ''} key={index}>
          🐾
        </span>
      ))}
    </div>
  );
}

export function CatHouse({ level }: { level: number }) {
  return (
    <figure
      className={`cat-house level-${Math.min(3, level)}`}
      aria-label={`Кошачий дом, этап ${Math.min(5, level)} из 5`}
    >
      {/* oxlint-disable-next-line next/no-img-element -- local decorative sprite */}
      <img src="/mascots/cat-house-progress.jpg" alt="" />
      <span>
        {level === 0
          ? 'Домик пока пуст'
          : level === 1
            ? 'Открыты лежанка и миска'
            : level === 2
              ? 'Добавлены игрушки и когтеточка'
              : level === 3
                ? 'Появились огоньки и второй котик'
                : level === 4
                  ? 'Открыты окно и мягкий плед'
                  : 'Дом готов — добавлена кошачья кухня!'}
      </span>
    </figure>
  );
}

export function Hero({
  go,
  period,
}: {
  go: (s: Section) => void;
  period: 'morning' | 'day' | 'night';
}) {
  return (
    <section className={`hero-card spain-hero hero-${period}`}>
      <div className="spain-hero-image" aria-hidden="true" />
      <div className="spain-hero-shade" aria-hidden="true" />
      <div className="azulejo-drift" aria-hidden="true" />
      <div className="hero-copy">
        <div className="lesson-label">
          <span>RITMO ESPAÑOL</span>
          <span>УЧИМСЯ В СВОЁМ РИТМЕ</span>
        </div>
        <h2>
          ¡Hola! ¿Listo para
          <br />
          aprender español?
        </h2>
        <p>
          Начните с короткого урока, повторите слова или включите любимую песню.
        </p>
        <div className="hero-actions">
          <button
            className="primary-btn"
            onClick={() => {
              sessionStorage.setItem('ritmo-focus-first-lesson', 'true');
              go('Lessons');
            }}
          >
            <Play fill="currentColor" />
            Начать урок
            <ArrowRight />
          </button>
          <button className="hero-secondary" onClick={() => go('Practice')}>
            Повторить слова
          </button>
        </div>
      </div>
      <div className="hero-place">
        <span>
          {period === 'night' ? '☾' : period === 'morning' ? '◒' : '☀'}
        </span>
        <b>España</b>
        <small>sol · calle · mar · azulejos</small>
      </div>
    </section>
  );
}

export function shuffledOptions(items: string[], seed: string) {
  const result = [...new Set(items)];
  let value = Array.from(seed).reduce(
    (sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0,
    2166136261,
  );
  for (let index = result.length - 1; index > 0; index--) {
    value = (value * 1664525 + 1013904223) >>> 0;
    const target = value % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function useTaskMotion() {
  const [leaving, setLeaving] = useState(false);
  const move = (change: () => void) => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      change();
      window.requestAnimationFrame(() => setLeaving(false));
    }, 180);
  };
  return { leaving, move };
}

export function ClockBadge({ minutes }: { minutes: number }) {
  return (
    <span className="clock-badge">
      <b>{minutes}</b>
      <small>МИН</small>
    </span>
  );
}

export function ViewHead({
  over,
  title,
  copy,
}: {
  over: string;
  title: string;
  copy?: string;
}) {
  return (
    <header className="view-header">
      <p className="eyebrow">{over}</p>
      <h1>{title}</h1>
      {copy && <p>{copy}</p>}
    </header>
  );
}
