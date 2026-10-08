'use client';

import { useState } from 'react';
import { countDeleWords } from '../../data/dele-b2';
import {
  deleFullExamples,
  deleOnlineExamples,
  deleTopics,
} from '../../data/dele-b2-library';

export function DeleTaskExamples({ task }: { task: string }) {
  const examples = deleFullExamples.filter((example) => example.task === task);
  const online = deleOnlineExamples.filter((example) => example.task === task);
  return (
    <section className="dele-examples" aria-label="Полные примеры ответов">
      <h3>Полные примеры ответов</h3>
      <p>
        Встроенные тексты — авторские учебные образцы без официальной оценки.
        Примеры из интернета открываются целиком на сайтах авторов.
      </p>
      {examples.map((example) => (
        <details key={example.id}>
          <summary>
            {example.title}
            {task.startsWith('written')
              ? ` · ${countDeleWords(example.text)} слов`
              : task === 'oral-3'
                ? ' · диалог'
                : ' · монолог и беседа'}
          </summary>
          <p className="dele-note">{example.prompt}</p>
          <div className="dele-full-text" lang="es">
            {example.text.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <h4>Разбор ответа</h4>
          <ul>
            {example.analysis.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="dele-note">
            Тема:{' '}
            {deleTopics.find((topic) => topic.id === example.topic)?.title}.
            Лексику и конструкции найдёте во вкладке «Темы и лексика».
          </p>
        </details>
      ))}
      <h3>Полные примеры из интернета</h3>
      <div className="dele-online-list">
        {online.map((example) => (
          <article key={example.id}>
            <span className="dele-note">{example.kind}</span>
            <h4>
              <a href={example.url} target="_blank" rel="noreferrer">
                {example.title} ↗
              </a>
            </h4>
            <p>{example.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function DeleTopicsView() {
  const [query, setQuery] = useState('');
  const visible = deleTopics.filter((topic) =>
    `${topic.title} ${topic.angle} ${topic.words.flat().join(' ')}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <section aria-label="Темы и лексика DELE B2">
      <article className="dele-card">
        <h2>Возможные темы · слова и конструкции</h2>
        <p>
          Банк для подготовки, а не прогноз конкретного экзамена. В каждой теме
          — условие письма, идеи для трёх устных задач, словарь с переводом и
          конструкции с примерами. Темы собраны по учебным материалам; вопросы и
          языковые подборки ниже составлены для тренировки.
        </p>
        <p>
          Сначала выберите позицию и два аргумента. Затем используйте 4–6 слов
          по теме и 2–3 подходящие конструкции. Не добавляйте сложную форму,
          если она не помогает выразить мысль.
        </p>
        <label className="dele-topic-search">
          Найти тему или слово
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Например: работа, reciclar, la beca"
          />
        </label>
        <p aria-live="polite">
          Найдено тем: {visible.length} из {deleTopics.length}
        </p>
      </article>
      {!visible.length && (
        <p className="dele-note">
          Совпадений нет. Попробуйте название темы или испанское слово.
        </p>
      )}
      {visible.map((topic) => (
        <article className="dele-card" key={topic.id}>
          <h2>{topic.title}</h2>
          <p>{topic.angle}</p>
          <details>
            <summary>Возможные задания: письмо и устная часть</summary>
            <h3>Письмо · учебное условие</h3>
            <p lang="es">{topic.written}</p>
            <h3>Устная часть · учебные ситуации</h3>
            <ol lang="es">
              {topic.oral.map((prompt, index) => (
                <li key={prompt}>
                  <b>Tarea {index + 1}: </b>
                  {prompt}
                </li>
              ))}
            </ol>
            <p className="dele-note">
              Для Tarea 2 нужна фотография с подходящими деталями; здесь описана
              идея ситуации. Для Tarea 3 используйте данные из учебного образца
              или составьте отдельную таблицу.
            </p>
          </details>
          <h3>Слова и сочетания</h3>
          <dl className="dele-topic-words">
            {topic.words.map(([es, ru]) => (
              <div key={es}>
                <dt lang="es">{es}</dt>
                <dd>{ru}</dd>
              </div>
            ))}
          </dl>
          <h3>Полезные конструкции</h3>
          <div className="dele-constructions">
            {topic.constructions.map(([form, meaning, example]) => (
              <article key={form}>
                <b lang="es">{form}</b>
                <p>{meaning}</p>
                <p lang="es">{example}</p>
              </article>
            ))}
          </div>
        </article>
      ))}
      <article className="dele-card">
        <h2>Как работать с интернет-примерами</h2>
        <ol>
          <li>Прочитайте условие и составьте свой план до чтения образца.</li>
          <li>
            В готовом ответе найдите позицию, аргументы, контраргумент и вывод.
          </li>
          <li>
            Перепишите план под другую тему. Сохраните логические связи,
            замените содержание.
          </li>
          <li>
            Устный ответ запишите и проверьте по времени; попросите партнёра
            возразить или задать уточнение.
          </li>
        </ol>
        <p>
          Подборки тем и примеров:{' '}
          <a
            href="https://deleahora.com/blog/expresion-escrita/dele-b2-tarea-2-expresion-e-interaccion-escritas"
            target="_blank"
            rel="noreferrer"
          >
            DELE Ahora
          </a>
          ,{' '}
          <a
            href="https://www.languagenext.com/blog/dele-b2-speaking-sample-papers/"
            target="_blank"
            rel="noreferrer"
          >
            LanguageNext
          </a>
          . Формат и критерии сверяйте с Cervantes.
        </p>
      </article>
    </section>
  );
}
