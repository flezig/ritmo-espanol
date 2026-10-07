import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  grammarExercises,
  grammarModes,
  createGrammarRound,
} from '../app/data/grammar-practice.ts';
import {
  applyAchievementEvent,
  defaultAchievementStats,
} from '../app/lib/achievements.ts';
import { BACKUP_KEYS } from '../app/lib/backup.ts';

test('each grammar bank has at least 200 unique, answerable exercises and official theory sources', () => {
  for (const mode of grammarModes) {
    const bank = grammarExercises[mode.id];
    assert.ok(bank.length >= 200, mode.id);
    assert.equal(new Set(bank.map((q) => q.id)).size, bank.length);
    assert.equal(
      new Set(bank.map((q) => q.prompt + q.instruction)).size,
      bank.length,
    );
    for (const q of bank) {
      assert.equal(q.options.filter((o) => o === q.answer).length, 1, q.id);
      assert.equal(new Set(q.options).size, q.options.length);
      assert.ok(q.options.length >= 3, q.id);
      assert.ok(q.prompt.includes('___') && q.explanation && q.instruction);
    }
    assert.ok(mode.theory.length >= 5);
    assert.ok(
      mode.sources.some((s) =>
        new URL(s.url).hostname.endsWith('cervantes.es'),
      ),
    );
    assert.ok(
      mode.sources.some((s) => new URL(s.url).hostname.endsWith('rae.es')),
    );
  }
});

test('rounds mix rules, shuffle choices, and visit unseen questions first', () => {
  for (const mode of grammarModes) {
    const first = createGrammarRound(mode.id);
    assert.equal(first.length, 10);
    assert.equal(new Set(first.map((q) => q.id)).size, 10);
    assert.ok(new Set(first.map((q) => q.rule)).size >= 3);
    const seen = first.map((q) => q.id);
    assert.ok(
      createGrammarRound(mode.id, seen).every((q) => !seen.includes(q.id)),
    );
    const allButLast = grammarExercises[mode.id].slice(0, -1).map((q) => q.id);
    const lastRound = createGrammarRound(mode.id, allButLast);
    assert.ok(
      lastRound.some((q) => q.id === grammarExercises[mode.id].at(-1)!.id),
    );
    assert.equal(new Set(lastRound.map((q) => q.id)).size, 10);
  }
});

test('conjugation covers accents, irregular stems and compound auxiliaries', () => {
  const answer = (
    mode: keyof typeof grammarExercises,
    rule: string,
    verb: string,
    person: number,
  ) =>
    grammarExercises[mode].find(
      (q) => q.id === `${mode}:${rule}:${verb}:${person}`,
    )?.answer;
  assert.equal(
    answer('subjuntivo', 'imperfecto de subjuntivo (-ra)', 'hablar', 3),
    'habláramos',
  );
  assert.equal(
    answer('subjuntivo', 'imperfecto de subjuntivo (-ra)', 'comer', 3),
    'comiéramos',
  );
  assert.equal(
    answer('subjuntivo', 'imperfecto de subjuntivo (-ra)', 'vivir', 3),
    'viviéramos',
  );
  assert.equal(answer('past', 'indefinido', 'hacer', 2), 'hizo');
  assert.equal(answer('future', 'futuro simple', 'tener', 1), 'tendrás');
  assert.equal(
    answer('past', 'perfecto compuesto', 'escribir', 4),
    'habéis escrito',
  );
  assert.equal(
    answer('conditionals', 'Тип 3 · условие', 'hacer', 3),
    'hubiéramos hecho',
  );
  assert.equal(answer('conditionals', 'Тип 3', 'hacer', 3), 'habríamos hecho');
});

test('answers persist immediately, sessions do not double-count and modes remain independent', () => {
  let stats = applyAchievementEvent(
    defaultAchievementStats,
    { type: 'grammar-answer', mode: 'grammar:past', correct: true },
    12,
  );
  stats = applyAchievementEvent(
    stats,
    { type: 'grammar-answer', mode: 'grammar:past', correct: false },
    12,
  );
  stats = applyAchievementEvent(
    stats,
    {
      type: 'practice-session',
      mode: 'grammar:past',
      topic: 'Прошедшие времена',
      perfect: false,
    },
    12,
  );
  assert.equal(stats.practiceTotal, 2);
  assert.equal(stats.practiceCorrect, 1);
  assert.equal(stats.practiceTotalByMode['grammar:past'], 2);
  assert.equal(stats.practiceModeSessions['grammar:past'], 1);
  assert.equal(stats.practiceTotalByMode['grammar:future'], undefined);
  assert.ok(BACKUP_KEYS.includes('ritmo-grammar-practice'));
});

test('teacher assignments and teacher summary expose all grammar modes through existing tracking', () => {
  const workspace = readFileSync(
    new URL('../app/components/education-workspace.tsx', import.meta.url),
    'utf8',
  );
  assert.match(workspace, /grammarModes\.map/);
  assert.match(workspace, /summary\.weakTopics\[`Грамматика:/);
  const sql = readFileSync(
    new URL(
      '../supabase/migrations/0015_teacher_learning_insights.sql',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(sql, /'weakTopics', coalesce\(insight_data->'topics'/);
  const tracking = readFileSync(
    new URL(
      '../supabase/migrations/0010_assignment_context.sql',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(tracking, /event_kind='session_complete'/);
});
