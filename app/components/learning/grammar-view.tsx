'use client';

import { useEffect, useRef, useState } from 'react';
import { consumeStoredIndex } from '../../lib/search-navigation';
import { ArrowRight, BookOpen } from 'lucide-react';
import { ReportExerciseButton } from '../report-exercise-button';
import { normalizeText } from '../../lib/learning-core';
import { grammarTopics, grammarQuestionBanks } from '../../data/grammar';
import { shuffledOptions, useTaskMotion, playFeedbackSound, ViewHead, CatPeek } from './shared';
import { recordLearningEvent, recordError } from '../../lib/learning-runtime';

export function GrammarView() {
  const [active, setActive] = useState(0),
    [question, setQuestion] = useState(0),
    [choice, setChoice] = useState(''),
    [score, setScore] = useState(0),
    answerLock = useRef(false);
  const topic = grammarTopics[active],
    questions = grammarQuestionBanks[active],
    test = questions[question],
    displayedGrammarOptions = shuffledOptions(
      test.options,
      `grammar-${active}-${question}`,
    );
  const { leaving, move } = useTaskMotion();
  useEffect(() => {
    const focusRequestedRule = () => {
      const requestedIndex = consumeStoredIndex(
        sessionStorage, 'ritmo-focus-grammar-index', grammarTopics.length,
      );
      if (requestedIndex === null) return;
      setActive(requestedIndex);
      setQuestion(0);
      setChoice('');
      setScore(0);
      answerLock.current = false;
    };
    focusRequestedRule();
    window.addEventListener('ritmo-global-search-focus', focusRequestedRule);
    return () =>
      window.removeEventListener('ritmo-global-search-focus', focusRequestedRule);
  }, []);
  const choose = (option: string) => {
    if (choice || answerLock.current) return;
    answerLock.current = true;
    const correct = option === test.answer;
    setChoice(option);
    playFeedbackSound(correct);
    recordLearningEvent(correct, correct ? 5 : 2);
    if (correct) setScore((value) => value + 1);
    if (!correct) recordError(topic.name);
  };
  const next = () =>
    move(() => {
      answerLock.current = false;
      const finished = question === questions.length - 1;
      setChoice('');
      setQuestion(finished ? 0 : question + 1);
      if (finished) setScore(0);
    });
  return (
    <div className="view-stack">
      <ViewHead
        over={`ГРАММАТИКА · ${grammarQuestionBanks.reduce((sum, bank) => sum + bank.length, 0)} ЗАДАНИЙ`}
        title="Понять правило. Сразу применить."
        copy="Разделы идут по хронологии учебника И. А. Дышлевой: от Unidad 1 и чтения к следующим грамматическим темам. После теории — проверочные задания."
      />
      <div className="grammar-grid">
        <aside>
          {grammarTopics.map((item, index) => (
            <button
              className={active === index ? 'active' : ''}
              onClick={() => {
                answerLock.current = false;
                setActive(index);
                setChoice('');
                setQuestion(0);
                setScore(0);
              }}
              key={item.name}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item.name}
              <small>{grammarQuestionBanks[index].length} тестов</small>
            </button>
          ))}
        </aside>
        <article className="grammar-card">
          <p className="eyebrow">УРОК {active + 1} · ОСНОВА</p>
          <h2>{topic.name}</h2>
          <div className="grammar-source">
            <BookOpen />
            <span>
              <b>Источник теории</b>
              {topic.source}
            </span>
          </div>
          <section className="grammar-explain">
            <div>
              <small>КОГДА ИСПОЛЬЗОВАТЬ</small>
              <p>{topic.use}</p>
            </div>
            <div>
              <small>СТРУКТУРА</small>
              <code>{topic.formula}</code>
            </div>
            <div>
              <small>КАК ВЫБРАТЬ</small>
              <p>{topic.signals}</p>
            </div>
          </section>
          <div className="rule-detail">
            <b>Разбор по шагам</b>
            <p>{topic.details}</p>
          </div>
          <section className="grammar-rules">
            <h3>Ключевые правила и исключения</h3>
            {topic.rules.map((rule, index) => (
              <div key={rule}>
                <span>{index + 1}</span>
                <p>{rule}</p>
              </div>
            ))}
          </section>
          <section className="example-list">
            <h3>Примеры из живой речи</h3>
            {topic.examples.map((example) => (
              <div key={example[0]}>
                <b>{example[0]}</b>
                <span>{example[1]}</span>
              </div>
            ))}
          </section>
          <div className="mistake-box">
            <span>!</span>
            <div>
              <b>Частая ошибка</b>
              <p>{topic.mistake}</p>
            </div>
          </div>
          <div
            className={`quiz cat-card task-swap ${leaving ? 'leaving' : ''}`}
            key={`${active}-${question}`}
          >
            <CatPeek
              state={
                choice
                  ? choice === test.answer
                    ? 'happy'
                    : 'wrong'
                  : 'thinking'
              }
            />
            <ReportExerciseButton
              id={`grammar:${normalizeText(topic.name)}:${normalizeText(test.prompt)}:${normalizeText(test.answer)}`}
              section={`Грамматика: ${topic.name}`}
              prompt={test.prompt}
              answer={test.answer}
              options={test.options}
            />
            <div className="quiz-progress">
              <span
                style={{
                  width: `${((question + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
            <small>
              {test.kind.toUpperCase()} · {question + 1} ИЗ {questions.length} ·
              СЧЁТ {score}
            </small>
            <p>{test.prompt}</p>
            <div>
              {displayedGrammarOptions.map((option) => (
                <button
                  className={
                    choice === option
                      ? option === test.answer
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
            {choice && (
              <div
                className={
                  choice === test.answer ? 'feedback good' : 'feedback'
                }
              >
                {choice === test.answer
                  ? '✓ Верно. '
                  : `Правильный ответ: ${test.answer}. `}
                <span>{test.tip}</span>
                <button className="next-test" onClick={next}>
                  {question === questions.length - 1
                    ? 'Пройти заново'
                    : 'Следующий вопрос'}{' '}
                  <ArrowRight />
                </button>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
