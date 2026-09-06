'use client';

import { useState } from 'react';
import { Headphones, RotateCcw, Volume2 } from 'lucide-react';
import { analyzeAnswer, normalizeText } from '../lib/learning-core';

type Skill = 'Грамматика' | 'Чтение' | 'Аудирование' | 'Письмо';
type PlacementQuestion = {
  id: string;
  skill: Skill;
  level: 'A1' | 'A2';
  prompt: string;
  context?: string;
  audio?: string;
  options?: string[];
  answers: string[];
};
type PlacementResult = {
  level: 'A1 — начало' | 'A1 — уверенно' | 'A2 — начало';
  total: number;
  a1: number;
  a2: number;
  skills: Record<Skill, number>;
  completedAt: string;
};

const questions: PlacementQuestion[] = [
  { id: 'g1', skill: 'Грамматика', level: 'A1', prompt: 'Yo ___ estudiante.', options: ['soy', 'eres', 'es'], answers: ['soy'] },
  { id: 'g2', skill: 'Грамматика', level: 'A1', prompt: 'Выберите правильный вариант.', options: ['el problema', 'la problema', 'un problema femenina'], answers: ['el problema'] },
  { id: 'g3', skill: 'Грамматика', level: 'A1', prompt: 'Nosotros ___ español todos los días.', options: ['hablamos', 'hablan', 'hablo'], answers: ['hablamos'] },
  { id: 'g4', skill: 'Грамматика', level: 'A2', prompt: 'Ayer Marta ___ al museo.', options: ['fue', 'va', 'iba mañana'], answers: ['fue'] },
  { id: 'g5', skill: 'Грамматика', level: 'A2', prompt: 'Cuando era niño, siempre ___ con mis primos.', options: ['jugaba', 'jugué una vez', 'jugaré'], answers: ['jugaba'] },
  { id: 'r1', skill: 'Чтение', level: 'A1', context: 'Lucía vive en Valencia. Trabaja por la mañana y estudia inglés por la tarde. Los viernes cena con su hermana.', prompt: 'Когда Лусия изучает английский?', options: ['Утром', 'Днём', 'Только по пятницам'], answers: ['Днём'] },
  { id: 'r2', skill: 'Чтение', level: 'A1', context: '— ¿Tiene una mesa para dos? — Sí, al lado de la ventana.', prompt: 'Где происходит разговор?', options: ['В ресторане', 'В аэропорту', 'В аптеке'], answers: ['В ресторане'] },
  { id: 'r3', skill: 'Чтение', level: 'A2', context: 'El tren salió con retraso, así que Pablo perdió el autobús que iba al pueblo. Decidió llamar a su amiga para que fuera a buscarlo.', prompt: 'Почему Пабло позвонил подруге?', options: ['Он опоздал на автобус', 'Он забыл билет', 'Поезд отменили'], answers: ['Он опоздал на автобус'] },
  { id: 'r4', skill: 'Чтение', level: 'A2', context: 'Aunque estaba cansada, Elena terminó el informe antes de salir de la oficina.', prompt: 'Что верно?', options: ['Елена закончила отчёт', 'Елена оставила отчёт на завтра', 'Елена не была уставшей'], answers: ['Елена закончила отчёт'] },
  { id: 'l1', skill: 'Аудирование', level: 'A1', prompt: 'Прослушайте и напишите время словами по-испански.', audio: 'La clase empieza a las ocho.', answers: ['a las ocho', 'las ocho'] },
  { id: 'l2', skill: 'Аудирование', level: 'A1', prompt: 'Прослушайте и выберите место.', audio: 'Necesito comprar pan y leche.', options: ['supermercado', 'hospital', 'estación'], answers: ['supermercado'] },
  { id: 'l3', skill: 'Аудирование', level: 'A2', prompt: 'Прослушайте и напишите причину опоздания по-испански.', audio: 'Llegué tarde porque perdí el autobús.', answers: ['porque perdí el autobús', 'perdí el autobús'] },
  { id: 'l4', skill: 'Аудирование', level: 'A2', prompt: 'Какое намерение выражено во фразе?', audio: 'Este fin de semana voy a visitar a mis abuelos.', options: ['Посетить бабушку и дедушку', 'Работать дома', 'Купить билет'], answers: ['Посетить бабушку и дедушку'] },
  { id: 'w1', skill: 'Письмо', level: 'A1', prompt: 'Напишите по-испански: «Меня зовут Анна, и я живу в Москве».', answers: ['Me llamo Ana y vivo en Moscú', 'Me llamo Anna y vivo en Moscú'] },
  { id: 'w2', skill: 'Письмо', level: 'A2', prompt: 'Напишите по-испански: «Вчера мы поужинали дома, потому что шёл дождь».', answers: ['Ayer cenamos en casa porque llovía', 'Ayer cenamos en casa porque estaba lloviendo'] },
];

const emptySkills = (): Record<Skill, number> => ({ Грамматика: 0, Чтение: 0, Аудирование: 0, Письмо: 0 });
const answerIsCorrect = (value: string, answers: string[]) =>
  answers.some((answer) => analyzeAnswer(value, answer).correct || normalizeText(value) === normalizeText(answer));

function scorePlacement(responses: Record<string, string>): PlacementResult {
  const skillCorrect = emptySkills(), skillTotal = emptySkills();
  let correct = 0, a1Correct = 0, a1Total = 0, a2Correct = 0, a2Total = 0;
  questions.forEach((question) => {
    const right = answerIsCorrect(responses[question.id] || '', question.answers);
    skillTotal[question.skill] += 1;
    if (right) { correct += 1; skillCorrect[question.skill] += 1; }
    if (question.level === 'A1') { a1Total += 1; if (right) a1Correct += 1; }
    else { a2Total += 1; if (right) a2Correct += 1; }
  });
  const a1 = Math.round(a1Correct / a1Total * 100), a2 = Math.round(a2Correct / a2Total * 100);
  const total = Math.round(correct / questions.length * 100);
  const weakestSkill = Math.min(...Object.values(skillCorrect));
  const level: PlacementResult['level'] = a1 >= 75 && a2 >= 60 && weakestSkill > 0 ? 'A2 — начало' : a1 >= 60 ? 'A1 — уверенно' : 'A1 — начало';
  return {
    level, total, a1, a2,
    skills: Object.fromEntries((Object.keys(skillTotal) as Skill[]).map((skill) => [skill, Math.round(skillCorrect[skill] / skillTotal[skill] * 100)])) as Record<Skill, number>,
    completedAt: new Date().toISOString(),
  };
}

export default function TodayPanel({ due, weakTopic, go }: { due: number; weakTopic: string; go: (section: 'Practice' | 'Lessons' | 'Grammar') => void }) {
  const [placementOpen, setPlacementOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PlacementResult | null>(() => {
    try { const saved = JSON.parse(localStorage.getItem('ritmo-placement') || 'null'); return saved?.skills ? saved : null; } catch { return null; }
  });
  const question = questions[index];
  const answer = responses[question?.id] || '';
  const speak = (rate: number) => {
    if (!question.audio || typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.audio);
    utterance.lang = 'es-ES';
    utterance.rate = rate;
    const voice = speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith('es'));
    if (voice) utterance.voice = voice;
    speechSynthesis.speak(utterance);
  };
  const finish = () => {
    const next = scorePlacement(responses);
    localStorage.setItem('ritmo-placement', JSON.stringify(next));
    setResult(next); setPlacementOpen(false); setIndex(0);
  };
  const reset = () => {
    setResult(null); setResponses({}); setIndex(0); setPlacementOpen(true);
    localStorage.removeItem('ritmo-placement');
  };
  const route = result?.level.startsWith('A2') ? 'Маршрут A2: дом → еда → реальные диалоги' : result?.level.includes('уверенно') ? 'Маршрут A1+: мой день → дом → еда' : 'Маршрут A1: знакомство → семья → мой день';
  return (
    <section className="today-panel">
      <header>
        <div><small>ПЛАН НА СЕГОДНЯ</small><h2>Три понятных шага</h2></div>
        <button onClick={() => setPlacementOpen((value) => !value)}>Входной тест (по желанию)</button>
      </header>
      <div className="today-actions">
        <button onClick={() => go('Practice')}><b>1 · Повторить</b><span>{due ? `${due} карточек уже пора повторить` : '4 новых слова и смешанная тренировка'}</span></button>
        <button onClick={() => go('Lessons')}><b>2 · Один урок</b><span>{route}</span></button>
        <button onClick={() => go('Grammar')}><b>3 · Слабая тема</b><span>{weakTopic || 'Артикли и род'}</span></button>
      </div>
      {result && (
        <div className="placement-result-card">
          <div><small>РЕКОМЕНДОВАННЫЙ УРОВЕНЬ</small><h3>{result.level}</h3><p>Общий результат {result.total}% · A1 {result.a1}% · A2 {result.a2}%</p></div>
          <div className="placement-skills">{Object.entries(result.skills).map(([skill, value]) => <span key={skill}><b>{skill}</b><i><em style={{ width: `${value}%` }} /></i><strong>{value}%</strong></span>)}</div>
          <button onClick={reset}><RotateCcw /> Пройти заново</button>
        </div>
      )}
      {placementOpen && question && (
        <div className="placement-test">
          <header><span>{question.skill} · {question.level}</span><b>{index + 1} / {questions.length}</b></header>
          <div className="placement-progress"><i style={{ width: `${(index + 1) / questions.length * 100}%` }} /></div>
          {question.context && <blockquote lang="es">{question.context}</blockquote>}
          {question.audio && <div className="placement-audio"><Headphones /><span>Текст скрыт: отвечайте только на слух</span><button onClick={() => speak(1)}><Volume2 /> Обычная</button><button onClick={() => speak(.5)}><Volume2 /> 0.5×</button></div>}
          <h3>{question.prompt}</h3>
          {question.options ? <div className="placement-options">{question.options.map((option) => <button className={answer === option ? 'selected' : ''} onClick={() => setResponses((items) => ({ ...items, [question.id]: option }))} key={option}>{option}</button>)}</div> : <input autoFocus value={answer} onChange={(event) => setResponses((items) => ({ ...items, [question.id]: event.target.value }))} placeholder="Введите ответ самостоятельно…" />}
          <footer><button disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>Назад</button>{index === questions.length - 1 ? <button disabled={!answer.trim()} onClick={finish}>Рассчитать уровень</button> : <button disabled={!answer.trim()} onClick={() => setIndex((value) => value + 1)}>Следующий вопрос</button>}</footer>
          <small>Тест не меняет учебную статистику. Уровень определяется отдельно по A1, A2 и четырём навыкам.</small>
        </div>
      )}
    </section>
  );
}
