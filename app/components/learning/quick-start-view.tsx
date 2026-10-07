'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Volume2 } from 'lucide-react';
import { ReportExerciseButton } from '../report-exercise-button';
import { normalizeText } from '../../lib/learning-core';
import type { Section } from '../../types/learning';
import { useSpanishVoices, shuffledOptions, playFeedbackSound, ViewHead } from './shared';
import { starterLessons, starterChecks } from '../../data/starter-lessons';
import { recordLearningEvent } from '../../lib/learning-runtime';

export function LearnView({ go }: { go: (section: Section) => void }) {
  const [lesson, setLesson] = useState(0),
    [step, setStep] = useState(1),
    [choice, setChoice] = useState(''),
    [completed, setCompleted] = useState<Record<string, number>>({}),
    answerLock = useRef(false);
  const { speakText } = useSpanishVoices(),
    current = starterLessons[lesson],
    check = starterChecks[lesson][step - 1],
    displayedStarterOptions = shuffledOptions(
      [...check.options],
      `quick-start-${lesson}-${step}`,
    );
  useEffect(() => {
    try {
      setCompleted(
        JSON.parse(localStorage.getItem('ritmo-learn-progress') || '{}'),
      );
    } catch {}
  }, []);
  const choose = (option: string) => {
    if (choice === check.answer || answerLock.current) return;
    answerLock.current = true;
    const correct = option === check.answer;
    setChoice(option);
    playFeedbackSound(correct);
    recordLearningEvent(correct, correct ? 4 : 1);
    if (correct) {
      const key = String(lesson),
        next = { ...completed, [key]: Math.max(completed[key] || 0, step) };
      setCompleted(next);
      localStorage.setItem('ritmo-learn-progress', JSON.stringify(next));
      window.dispatchEvent(new Event('ritmo-learn-progress'));
    } else answerLock.current = false;
  };
  const advance = () => {
    if (step === 5) {
      sessionStorage.setItem('ritmo-focus-lesson-id', current.lessonId);
      go('Lessons');
    }
    else {
      answerLock.current = false;
      setStep((value) => value + 1);
      setChoice('');
    }
  };
  return (
    <div className="view-stack">
      <ViewHead
        over="СТАРТ С НУЛЯ · 3 ОСНОВЫ · 3 СЦЕНАРИЯ"
        title="Сначала — то, без чего не заговорить."
        copy="Сначала разберите presente, артикли и предлоги, затем примените их в знакомстве, кафе и городе."
      />
      <div className="starter-grid">
        {starterLessons.map((item, index) => (
          <button
            className={lesson === index ? 'active' : ''}
            onClick={() => {
              answerLock.current = false;
              setLesson(index);
              setStep(Math.min(5, (completed[String(index)] || 0) + 1));
              setChoice('');
            }}
            key={item.title}
          >
            <span>{index === 0 ? '▶' : '0' + (index + 1)}</span>
            <b>{item.title}</b>
            <small>{item.subtitle}</small>
          </button>
        ))}
      </div>
      <div className="lesson-progress">
        <span style={{ width: `${step * 20}%` }} />
      </div>
      <div className="lesson-stage">
        <div className="lesson-scene">
          <span>0{lesson + 1}</span>
          <p>{lesson < 3 ? 'УРОК ДЛЯ НАЧАЛА' : 'ПРАКТИЧЕСКИЙ СЦЕНАРИЙ'}</p>
          <h2>{current.title.split(' · ')[1]}</h2>
          <div>♪ ♫ ♪</div>
        </div>
        <div className="lesson-panel">
          <span>ШАГ {step} ИЗ 5</span>
          <h3>{current.steps[step - 1][0]}</h3>
          <p>{current.subtitle}</p>
          <div className="phrase-box">
            <b>{current.steps[step - 1][1]}</b>
            <button onClick={() => speakText(check.answer, 1)}>
              <Volume2 /> Прослушать испанский пример
            </button>
          </div>
          <div className="learn-check">
            <ReportExerciseButton
              id={`quick-start:${lesson}:${normalizeText(check.prompt)}:${normalizeText(check.answer)}`}
              section={`Быстрый старт: ${current.title}`}
              prompt={check.prompt}
              answer={check.answer}
              options={displayedStarterOptions}
            />
            <small>БЫСТРАЯ ПРОВЕРКА</small>
            <h4>{check.prompt}</h4>
            <div>
              {displayedStarterOptions.map((option) => (
                <button
                  className={
                    choice === option
                      ? option === check.answer
                        ? 'correct'
                        : 'wrong'
                      : ''
                  }
                  onClick={() => choose(option)}
                  key={option}
                >
                  {option}
                </button>
              ))}
            </div>
            {choice && choice !== check.answer && (
              <p>Попробуйте ещё раз: правило находится прямо над вопросом.</p>
            )}
          </div>
          <button
            className="primary-btn dark-btn"
            onClick={advance}
            disabled={choice !== check.answer}
          >
            {step === 5 ? 'Перейти к полному уроку' : 'Следующий шаг'}
            <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}
