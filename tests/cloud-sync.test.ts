import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  collectCloudProgress, restoreCloudProgress, clearCloudProgress, cloudSyncMeta,
  CLOUD_PROGRESS_KEYS, cloudProgressHash, currentProgressFields, preserveFutureFields,
  queueContentReport, pendingContentReports, acknowledgeContentReport, migrateMarkedReports,
  pushCloudProgress, ProgressConflict, offlineAccount,
} from '../app/lib/cloud-progress.ts';
import { mergeProgress } from '../app/lib/progress-merge.ts';
import { migrateLocalProgress } from '../app/lib/storage-version.ts';
import { reconcilePracticeCards } from '../app/lib/practice-session.ts';
import { vocabularyId } from '../app/lib/vocabulary-identities.ts';

const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, String(value)); },
  removeItem: (key: string) => { values.delete(key); },
} });
const data = (value: unknown) => JSON.stringify(value);

test('every progress field round-trips from one device to another without changing SRS dates', () => {
  values.clear();
  CLOUD_PROGRESS_KEYS.forEach((key) => localStorage.setItem(key, data({ marker: key })));
  localStorage.setItem('ritmo-srs', data({ casa: { nextReview: 1788689400000, lastReview: 1788688800000 } }));
  localStorage.setItem('ritmo-local-analytics', '["private"]');
  const saved = collectCloudProgress();
  values.clear();
  restoreCloudProgress(saved);
  assert.deepEqual(collectCloudProgress(), saved);
  assert.equal(JSON.parse(localStorage.getItem('ritmo-srs')!).casa.nextReview, 1788689400000);
  assert.equal(localStorage.getItem('ritmo-local-analytics'), null);
});

test('restoring another account removes leftover progress but leaves device voice settings', () => {
  values.clear();
  localStorage.setItem('ritmo-achievements', '{"award":true}');
  localStorage.setItem('ritmo-spanish-voice', 'Paulina');
  restoreCloudProgress({ 'ritmo-device-profile': data({ name: 'Другой ученик' }) });
  assert.equal(localStorage.getItem('ritmo-achievements'), null);
  assert.equal(localStorage.getItem('ritmo-spanish-voice'), 'Paulina');
  clearCloudProgress();
  assert.deepEqual(collectCloudProgress(), {});
});

test('unrelated word changes merge, an overlapping answer never silently wins', () => {
  const base = { 'ritmo-srs': data({ casa: { reviews: 2 }, perro: { reviews: 1 } }) };
  const local = { 'ritmo-srs': data({ casa: { reviews: 3 }, perro: { reviews: 1 } }) };
  const remote = { 'ritmo-srs': data({ casa: { reviews: 2 }, perro: { reviews: 2 } }) };
  const merged = mergeProgress(base, local, remote);
  assert.deepEqual(merged.conflicts, []);
  assert.deepEqual(JSON.parse(merged.data['ritmo-srs']), { casa: { reviews: 3 }, perro: { reviews: 2 } });
  assert.ok(mergeProgress(base, local, { 'ritmo-srs': data({ casa: { reviews: 4 }, perro: { reviews: 1 } }) }).conflicts.length);
});

test('a local reset is a real edit and newer-version fields are preserved', () => {
  const base = { 'ritmo-srs': '{"casa":1}', 'ritmo-future-course': '{"lesson":3}' };
  const local = preserveFutureFields({}, base);
  assert.deepEqual(mergeProgress(base, local, base).data, { 'ritmo-future-course': '{"lesson":3}' });
  assert.deepEqual(currentProgressFields(base), { 'ritmo-srs': '{"casa":1}' });
});

test('typing during an upload is rebased rather than discarded', () => {
  const before = { 'ritmo-practice-session': data({ index: 4, typed: 'ca' }), 'ritmo-achievements': '{}' };
  const latest = { ...before, 'ritmo-practice-session': data({ index: 4, typed: 'casa' }) };
  const uploaded = { ...before, 'ritmo-achievements': '{"hola":true}' };
  const result = mergeProgress(before, latest, uploaded);
  assert.deepEqual(result.conflicts, []);
  assert.equal(JSON.parse(result.data['ritmo-practice-session']).typed, 'casa');
  assert.equal(result.data['ritmo-achievements'], '{"hola":true}');
});

test('server revision conflict leaves the acknowledged baseline untouched', async () => {
  values.clear();
  const baseline = { data: { 'ritmo-srs': '{}' }, updated_at: 'server-time', revision: 4 };
  cloudSyncMeta.save('alice', baseline);
  let request: unknown;
  const fake = { rpc: async (name: string, params: unknown) => {
    request = { name, params };
    return { data: { saved: false, progress: { ...baseline, revision: 5 } }, error: null };
  } } as unknown as SupabaseClient;
  await assert.rejects(pushCloudProgress(fake, { 'ritmo-srs': '{"new":1}' }, 4), ProgressConflict);
  assert.equal(cloudSyncMeta.read()?.baseline.revision, 4);
  assert.deepEqual(request, { name: 'save_my_progress', params: { p_data: { 'ritmo-srs': '{"new":1}' }, p_expected_revision: 4 } });
});

test('lost response is safe to retry: baseline changes only after acknowledgement', async () => {
  values.clear();
  const baseline = { data: {}, updated_at: '', revision: 0 };
  cloudSyncMeta.save('alice', baseline);
  const fake = { rpc: async () => ({ data: null, error: new Error('offline') }) } as unknown as SupabaseClient;
  await assert.rejects(pushCloudProgress(fake, { 'ritmo-srs': '{"new":1}' }, 0));
  assert.deepEqual(cloudSyncMeta.read()?.baseline, baseline);
});

test('report retry keeps exact exercise and withdrawal; late ACK cannot erase a newer flag', () => {
  values.clear();
  const report = { reportKey: 'practice:1', kind: 'exercise' as const, section: 'Практика', content: { prompt: 'Вставьте артикль', answer: 'el', options: ['el', 'la'] }, active: true };
  const first = queueContentReport(report);
  const withdrawal = queueContentReport({ ...report, active: false });
  acknowledgeContentReport(first);
  assert.equal(pendingContentReports()[0].active, false);
  assert.deepEqual(pendingContentReports()[0].content, report.content);
  acknowledgeContentReport(withdrawal);
  assert.deepEqual(pendingContentReports(), []);
});

test('old example flags are queued once, not re-sent on every progress save', () => {
  values.clear();
  localStorage.setItem('ritmo-example-reports', data([{ id: 'example1', example: 'Vivo aquí.', translation: 'Я живу здесь.', word: 'vivir', source: 'Словарь' }]));
  migrateMarkedReports();
  assert.equal(pendingContentReports().length, 1);
  assert.equal(pendingContentReports()[0].content.translation, 'Я живу здесь.');
  acknowledgeContentReport(pendingContentReports()[0]);
  migrateMarkedReports();
  assert.equal(pendingContentReports().length, 0);
});

test('offline account copies are isolated by user identity', () => {
  values.clear();
  offlineAccount.save('alice', { data: { 'ritmo-srs': '{"casa":1}' }, baseline: { data: {}, updated_at: '', revision: 0 } });
  assert.equal(offlineAccount.read('bob'), null);
  assert.equal(offlineAccount.read('alice')?.data['ritmo-srs'], '{"casa":1}');
  offlineAccount.remove('alice');
  assert.equal(offlineAccount.read('alice'), null);
});

test('content additions/reordering do not renumber existing vocabulary IDs', () => {
  const old = vocabularyId('Музыка', 'cantante');
  const added = vocabularyId('Музыка', 'nuevo término de prueba');
  assert.equal(vocabularyId('Музыка', 'cantante'), old);
  assert.equal(old, 1);
  assert.notEqual(added, old);
  assert.equal(vocabularyId('Музыка', 'nuevo término de prueba'), added);
});

test('removing an earlier practice card keeps the current card and its checked state', () => {
  const card = (key: string) => ({ key, es: key, answer: key, ru: 'перевод' });
  const saved = [card('a'), card('b'), card('c')];
  const result = reconcilePracticeCards(saved, 1, [card('b'), card('c'), card('new')]);
  assert.equal(result.index, 0);
  assert.equal(result.session[result.index].key, 'b');
  assert.equal(result.contentChanged, false);
  assert.equal(reconcilePracticeCards(saved, 1, [{ ...card('b'), answer: 'fixed' }]).contentChanged, true);
});

test('an older release cannot downgrade a newer storage schema', () => {
  values.clear();
  localStorage.setItem('ritmo-data-schema-version', '4');
  migrateLocalProgress();
  assert.equal(localStorage.getItem('ritmo-data-schema-version'), '4');
  assert.equal(cloudProgressHash({ b: '2', a: '1' }), cloudProgressHash({ a: '1', b: '2' }));
});
