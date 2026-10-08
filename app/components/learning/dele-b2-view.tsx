'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { DeleTaskExamples, DeleTopicsView } from './dele-b2-library';
import {
  deleB2Tasks,
  deleB2Sources,
  deleB2Criteria,
  deleB2Tips,
  countDeleWords,
} from '../../data/dele-b2';

export function DeleB2View() {
  const [tab, setTab] = useState<
    'written' | 'oral' | 'criteria' | 'tips' | 'topics'
  >('written');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  return (
    <section className="dele-b2">
      <header className="view-header">
        <span className="eyebrow">EXAMEN · B2 GENERAL</span>
        <h1>DELE B2</h1>
        <p>
          Письмо и устная речь: официальные образцы, разбор формата и практика.
        </p>
      </header>
      <div className="dele-summary">
        <article>
          <strong>80 минут</strong>
          <span>Письменная часть · 2 текста по 150–180 слов</span>
        </article>
        <article>
          <strong>20 + 20 минут</strong>
          <span>Подготовка + устный экзамен · 3 задачи</span>
        </article>
        <article>
          <strong>30 из 50 в каждой группе</strong>
          <span>
            Чтение + письмо; аудирование + устная речь. Баллы между группами не
            компенсируются.
          </span>
        </article>
      </div>
      <p className="dele-note">
        Раздел посвящён общему DELE B2. Формат B2/C1 para escolares отличается.
        Источники проверены 8 октября 2026 года.{' '}
        <a href={deleB2Sources.scoring.url} target="_blank" rel="noreferrer">
          Правила оценки Cervantes ↗
        </a>
      </p>
      <nav className="dele-tabs" aria-label="Материалы DELE B2">
        {(
          [
            ['written', 'Письмо'],
            ['oral', 'Устная часть'],
            ['topics', 'Темы и лексика'],
            ['criteria', 'Критерии'],
            ['tips', 'Советы и шаблоны'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {(tab === 'written' || tab === 'oral') && (
        <>
          <p className="dele-note">
            {tab === 'written'
              ? 'Выполните Tarea 1 и один вариант Tarea 2. На карточках — краткий пересказ формата; полный образец открывается по ссылке.'
              : 'Время каждой задачи включает беседу. На подготовке можно делать заметки к задачам 1 и 2; задача 3 выполняется без подготовки.'}{' '}
            Шаблоны, тренировочные условия и фрагменты ответов ниже — авторские
            учебные материалы, не ответы Cervantes.
          </p>
          {deleB2Tasks
            .filter((task) => task.part === tab)
            .map((task) => {
              const source = deleB2Sources[task.source];
              const draft = drafts[task.id] || '';
              const words = countDeleWords(draft);
              return (
                <article className="dele-card" key={task.id}>
                  <h2>{task.title}</h2>
                  <p className="dele-format">{task.format}</p>
                  <div className="dele-official">
                    <h3>Пример из официальных материалов</h3>
                    <p>{task.officialExample}</p>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title} <ExternalLink size={14} />
                    </a>
                    {task.part === 'oral' && (
                      <p>
                        <a
                          href={deleB2Sources.oral.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Официальные инструкции устных задач ↗
                        </a>
                      </p>
                    )}
                  </div>
                  <h3>Попробуйте сами</h3>
                  <p>{task.practice}</p>
                  <h3>Как построить ответ</h3>
                  <ol>
                    {task.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <details>
                    <summary>Шаблон на испанском</summary>
                    <pre lang="es">{task.template}</pre>
                  </details>
                  <details>
                    <summary>
                      Пример фрагмента ответа · не полный экзаменационный ответ
                    </summary>
                    <p lang="es">{task.example}</p>
                  </details>
                  <DeleTaskExamples task={task.id} />
                  {task.part === 'written' && (
                    <div className="dele-draft">
                      <label htmlFor={`draft-${task.id}`}>Ваш черновик</label>
                      <textarea
                        id={`draft-${task.id}`}
                        lang="es"
                        value={draft}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [task.id]: event.target.value,
                          }))
                        }
                        placeholder="Escriba su respuesta aquí…"
                      />
                      <p aria-live="polite">
                        {words} слов ·{' '}
                        {words < 150
                          ? `до 150 ещё ${150 - words}`
                          : words > 180
                            ? `сократите на ${words - 180}`
                            : 'в диапазоне 150–180'}
                        . Подсчёт ориентировочный. Черновик хранится только пока
                        раздел открыт.
                      </p>
                    </div>
                  )}
                  <h3>Чек-лист самопроверки</h3>
                  <div className="dele-checklist">
                    {task.checklist.map((item, index) => {
                      const key = `${task.id}-${index}`;
                      return (
                        <label key={key}>
                          <input
                            type="checkbox"
                            checked={checked[key] || false}
                            onChange={(event) =>
                              setChecked((current) => ({
                                ...current,
                                [key]: event.target.checked,
                              }))
                            }
                          />
                          {item}
                        </label>
                      );
                    })}
                  </div>
                </article>
              );
            })}
        </>
      )}
      {tab === 'topics' && <DeleTopicsView />}
      {tab === 'criteria' && (
        <article className="dele-card">
          <h2>За что оценивают ответ</h2>
          {deleB2Criteria.map((item) => (
            <div key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
          <p>
            Официальные шкалы: стр. 14–18 и 28–32 руководства; письменные работы
            с комментариями: стр. 19–26; разбор устных выступлений: стр. 33–40.
            Номера указаны по печатной нумерации страниц.
          </p>
          <a href={deleB2Sources.guide.url} target="_blank" rel="noreferrer">
            Открыть шкалы и примеры с оценками Cervantes ↗
          </a>
        </article>
      )}
      {tab === 'tips' && (
        <article className="dele-card">
          <h2>Практические приёмы</h2>
          <p>
            Учебные рекомендации на основе формата экзамена. Они помогают
            организовать ответ и не гарантируют оценку.
          </p>
          {deleB2Tips.map(([title, text]) => (
            <div key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </article>
      )}
      <footer className="dele-card">
        <h2>Источники и полные образцы</h2>
        <p>
          Официальные материалы Instituto Cervantes. Сверяйте конкретное условие
          перед выполнением. Фотографии, аудио и полные задания открываются у
          правообладателя.
        </p>
        <ul>
          {Object.entries(deleB2Sources).map(([key, source]) => (
            <li key={key}>
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title} ↗
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </section>
  );
}
