'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  acknowledgeContentReport, clearCloudProgress, cloudProgressHash, cloudSyncMeta,
  collectCloudProgress, fetchCloudProgress, getCloudClient, migrateMarkedReports,
  currentProgressFields, preserveFutureFields, offlineAccount,
  pendingContentReports, ProgressConflict, pushCloudProgress, queueContentReport,
  restoreCloudProgress, submitCloudContentReport,
  type ContentReportPayload, type CloudProgressRow, type CloudSyncStatus,
} from '../lib/cloud-progress';
import { mergeProgress, type ProgressData } from '../lib/progress-merge';
import { migrateLocalProgress } from '../lib/storage-version';
import { BACKUP_VERSION } from '../lib/backup';

type AuthResult = { ok: true; confirmationRequired?: boolean } | { ok: false; message: string };
type AccountContextValue = {
  user: User | null; configured: boolean; status: CloudSyncStatus; message: string;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;
  reportContent: (report: ContentReportPayload) => Promise<AuthResult>;
};
const AccountContext = createContext<AccountContextValue | null>(null);
const authMessage = (error: { message?: string } | unknown) => {
  const value = String((error as { message?: string })?.message || '').toLowerCase();
  if (value.includes('invalid login credentials')) return 'Неверная почта или пароль.';
  if (value.includes('email not confirmed')) return 'Подтвердите почту по ссылке из письма.';
  if (value.includes('already registered')) return 'Аккаунт с такой почтой уже существует.';
  if (value.includes('password')) return 'Используйте пароль не короче 8 символов.';
  if (value.includes('rate limit')) return 'Слишком много попыток. Подождите и повторите.';
  return 'Не удалось соединиться. Проверьте интернет и повторите.';
};
function downloadSnapshot(data: ProgressData, label: string) {
  const parsed = Object.fromEntries(Object.entries(data).map(([key, value]) => {
    try { return [key, JSON.parse(value)]; } catch { return [key, value]; }
  }));
  const url = URL.createObjectURL(new Blob([JSON.stringify({
    app: 'Ritmo Español', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data: parsed,
  }, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'ritmo-' + label + '-' + Date.now() + '.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
type Conflict = { local: ProgressData; remote: CloudProgressRow };

export function AccountProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getCloudClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<CloudSyncStatus>(supabase ? 'loading' : 'unconfigured');
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(!supabase);
  const [epoch, setEpoch] = useState(0);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [lockEmail, setLockEmail] = useState('');
  const [lockPassword, setLockPassword] = useState('');
  const userRef = useRef<User | null>(null);
  const inflight = useRef<Promise<boolean> | null>(null);
  const conflictRef = useRef<Conflict | null>(null);
  const signingOut = useRef(false);
  const readyRef = useRef(!supabase);

  const showReady = useCallback(() => { readyRef.current = true; setReady(true); }, []);
  const showConflict = useCallback((value: Conflict) => {
    conflictRef.current = value; setConflict(value); setStatus('conflict');
    setMessage('Прогресс изменён на двух устройствах. Выберите копию для продолжения.');
  }, []);
  const applyIncoming = useCallback((next: ProgressData) => {
    if (cloudProgressHash(currentProgressFields(next)) !== cloudProgressHash()) {
      restoreCloudProgress(next);
      setEpoch((value) => value + 1);
    }
  }, []);

  const syncUser = useCallback((activeUser: User): Promise<boolean> => {
    if (!supabase || conflictRef.current) return Promise.resolve(false);
    if (inflight.current) return inflight.current;
    const run = async () => {
      setStatus('syncing');
      let localForConflict: ProgressData = {};
      try {
        const remote = await fetchCloudProgress(supabase, activeUser.id);
        if (userRef.current?.id !== activeUser.id) return false;
        const meta = cloudSyncMeta.read(), owner = cloudSyncMeta.owner();
        const local = collectCloudProgress();
        let candidate: ProgressData;
        const firstAccount = owner !== activeUser.id;
        if (firstAccount) {
          if (owner && meta) offlineAccount.save(owner, { data: local, baseline: meta.baseline });
          const cached = offlineAccount.read(activeUser.id);
          // Guest import only into an empty new account, never over an existing profile.
          if (cached) {
            const merged = mergeProgress(cached.baseline.data, preserveFutureFields(cached.data, cached.baseline.data), remote.data);
            if (merged.conflicts.length) { showConflict({ local: cached.data, remote }); return false; }
            candidate = merged.data;
          } else if (!owner && Object.keys(remote.data).length === 0) {
            candidate = local;
          } else {
            if (!owner && Object.keys(local).length > 1) {
              // Preserve guest work so the user can recover it from Profile if needed.
              localStorage.setItem('ritmo-guest-before-login', JSON.stringify(local));
            }
            candidate = remote.data;
          }
        } else {
          const baseline = meta?.baseline.data ?? remote.data;
          const localWithFutureKeys = preserveFutureFields(local, baseline);
          const merged = mergeProgress(baseline, localWithFutureKeys, remote.data);
          if (merged.conflicts.length) {
            showConflict({ local, remote });
            return false;
          }
          candidate = merged.data;
        }
        localForConflict = candidate;
        let saved = remote;
        if (cloudProgressHash(candidate) !== cloudProgressHash(remote.data)) {
          saved = await pushCloudProgress(supabase, candidate, remote.revision);
        }
        if (userRef.current?.id !== activeUser.id) return false;
        // Edits made while a network request was running remain pending for the next save.
        const latest = collectCloudProgress();
        const rebased = mergeProgress(local, latest, currentProgressFields(candidate));
        if (rebased.conflicts.length) {
          showConflict({ local: latest, remote: saved });
          return false;
        }
        applyIncoming(rebased.data);
        cloudSyncMeta.save(activeUser.id, saved);
        offlineAccount.remove(activeUser.id);
        cloudSyncMeta.clearPendingEmail();
        migrateLocalProgress();
        migrateMarkedReports();
        showReady();
        // A durable outbox also retries withdrawals and never reopens resolved reports.
        for (const report of pendingContentReports()) {
          if (userRef.current?.id !== activeUser.id) return false;
          await submitCloudContentReport(supabase, report);
          acknowledgeContentReport(report);
        }
        const clean = cloudProgressHash() === cloudProgressHash(currentProgressFields(saved.data));
        setStatus(clean ? 'synced' : 'syncing');
        setMessage(clean ? 'Прогресс сохранён в аккаунте.' : 'Отправляем последние изменения…');
        return true;
      } catch (error) {
        if (error instanceof ProgressConflict) {
          showConflict({ local: localForConflict, remote: error.remote });
        } else {
          console.error('Progress sync failed', error);
          setStatus(navigator.onLine ? 'error' : 'offline');
          setMessage(navigator.onLine
            ? 'Не удалось сохранить в облаке. Изменения остаются здесь; повторим отправку.'
            : 'Нет сети. Прогресс сохранён здесь и отправится после подключения.');
          // Offline work is safe only if this device already belongs to this account.
          if (cloudSyncMeta.owner() === activeUser.id) showReady();
        }
        return false;
      }
    };
    const work = (async () => typeof navigator.locks?.request === 'function'
      ? await navigator.locks.request('ritmo-account-sync', run) : await run())();
    const pending = work.finally(() => { inflight.current = null; });
    inflight.current = pending;
    return pending;
  }, [supabase, applyIncoming, showConflict, showReady]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, message: 'Вход ещё не настроен.' };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      return error ? { ok: false, message: authMessage(error) } : { ok: true };
    } catch (error) { return { ok: false, message: authMessage(error) }; }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) { migrateLocalProgress(); return; }
    let alive = true;
    const acceptUser = (nextUser: User | null) => {
      if (!alive || signingOut.current) return;
      const changed = userRef.current?.id !== nextUser?.id;
      userRef.current = nextUser; setUser(nextUser);
      if (changed) { readyRef.current = false; setReady(false); setEpoch((value) => value + 1); }
      if (nextUser) void syncUser(nextUser);
      else if (cloudSyncMeta.owner()) {
        // An expired/revoked session must not turn account data into guest data.
        setStatus('guest'); setMessage('Войдите снова, чтобы открыть свой прогресс.');
        readyRef.current = false; setReady(false);
      } else {
        migrateLocalProgress(); showReady(); setStatus('guest');
        setMessage('Войдите для сохранения прогресса между устройствами.');
      }
    };
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => acceptUser(session?.user ?? null), 0);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) { setStatus('error'); setMessage(authMessage(error)); }
      else acceptUser(data.session?.user ?? null);
    }).catch((error) => { if (alive) { setStatus('error'); setMessage(authMessage(error)); } });
    let ticks = 0;
    const check = () => {
      const current = userRef.current;
      if (!current || signingOut.current) return;
      const meta = cloudSyncMeta.read();
      if (++ticks % 15 === 0 ||
          cloudProgressHash() !== cloudProgressHash(currentProgressFields(meta?.baseline.data || {})) ||
          pendingContentReports().length) void syncUser(current);
    };
    const timer = window.setInterval(check, 2000);
    const refresh = () => { if (userRef.current && !signingOut.current) void syncUser(userRef.current); };
    const visibility = () => { if (document.visibilityState === 'hidden' || document.visibilityState === 'visible') refresh(); };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (userRef.current && cloudProgressHash() !== cloudProgressHash(currentProgressFields(cloudSyncMeta.read()?.baseline.data || {}))) {
        refresh(); event.preventDefault(); event.returnValue = '';
      }
    };
    window.addEventListener('online', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      alive = false; subscription.subscription.unsubscribe(); window.clearInterval(timer);
      window.removeEventListener('online', refresh); window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [supabase, syncUser, showReady]);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { ok: false, message: 'Вход ещё не настроен.' };
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return { ok: false, message: 'Введите корректную почту.' };
    if (password.length < 8) return { ok: false, message: 'Используйте пароль не короче 8 символов.' };
    try {
      cloudSyncMeta.setPendingEmail(normalizedEmail);
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail, password,
        options: { data: { name: name.trim() || 'Maya' }, emailRedirectTo: window.location.origin },
      });
      if (error) { cloudSyncMeta.clearPendingEmail(); return { ok: false, message: authMessage(error) }; }
      return { ok: true, confirmationRequired: !data.session };
    } catch (error) { return { ok: false, message: authMessage(error) }; }
  }, [supabase]);

  const syncNow = useCallback(async () => { if (userRef.current) await syncUser(userRef.current); }, [syncUser]);
  const logout = useCallback(async () => {
    if (!supabase || !userRef.current || signingOut.current) return;
    signingOut.current = true;
    try {
      // Stop interaction, wait for an in-flight save, then flush its remaining edits.
      setReady(false); readyRef.current = false;
      if (inflight.current) await inflight.current;
      if (!await syncUser(userRef.current)) return;
      if (!await syncUser(userRef.current)) return;
      const meta = cloudSyncMeta.read();
      if (cloudProgressHash() !== cloudProgressHash(currentProgressFields(meta?.baseline.data || {})) || pendingContentReports().length) {
        setStatus('error'); setMessage('Последние изменения ещё не отправлены. Повторите выход после сохранения.'); return;
      }
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      offlineAccount.remove(userRef.current.id);
      localStorage.removeItem('ritmo-sync-recovery-' + userRef.current.id);
      clearCloudProgress();
      userRef.current = null; setUser(null); setEpoch((value) => value + 1);
      setStatus('guest'); setMessage('Вы вышли из аккаунта.');
    } catch (error) {
      setStatus('error'); setMessage(authMessage(error));
    } finally {
      signingOut.current = false; showReady();
    }
  }, [supabase, syncUser, showReady]);

  const reportContent = useCallback(async (report: ContentReportPayload): Promise<AuthResult> => {
    try {
      const queued = queueContentReport(report);
      if (!supabase || !userRef.current || cloudSyncMeta.owner() !== userRef.current.id)
        return { ok: false, message: 'Отметка сохранена здесь. После входа отправится автору.' };
      await submitCloudContentReport(supabase, queued);
      acknowledgeContentReport(queued);
      return { ok: true };
    } catch {
      return { ok: false, message: 'Отметка сохранена; отправим автоматически после восстановления связи.' };
    }
  }, [supabase]);

  const resolveConflict = async (choice: 'local' | 'remote') => {
    const value = conflictRef.current, activeUser = userRef.current;
    if (!supabase || !value || !activeUser) return;
    try {
      // Save both versions for recovery before the user explicitly chooses one.
      localStorage.setItem('ritmo-sync-recovery-' + activeUser.id, JSON.stringify(value));
      const data = choice === 'local' ? preserveFutureFields(value.local, value.remote.data) : value.remote.data;
      const saved = choice === 'local'
        ? await pushCloudProgress(supabase, data, value.remote.revision) : value.remote;
      applyIncoming(saved.data); cloudSyncMeta.save(activeUser.id, saved);
      conflictRef.current = null; setConflict(null); showReady();
      await syncUser(activeUser);
    } catch (error) {
      if (error instanceof ProgressConflict) showConflict({ local: value.local, remote: error.remote });
      else setMessage('Не удалось применить копию. Обе версии сохранены; повторите.');
    }
  };

  return (
    <AccountContext.Provider value={{ user, configured: Boolean(supabase), status, message, register, login, logout, syncNow, reportContent }}>
      {conflict ? (
        <main className="account-gate">
          <h1>Сохраним обе версии прогресса</h1>
          <p>На двух устройствах одновременно изменились одни и те же данные. Автоматическое сохранение приостановлено. Выберите, с какой копией продолжить; вторую можно скачать.</p>
          <p role="status">{message}</p>
          <div className="account-actions">
            <button onClick={() => downloadSnapshot(conflict.local, 'this-device')}>Скачать копию этого устройства</button>
            <button onClick={() => downloadSnapshot(conflict.remote.data, 'cloud')}>Скачать облачную копию</button>
            <button onClick={() => void resolveConflict('local')}>Продолжить с этой копией</button>
            <button onClick={() => void resolveConflict('remote')}>Продолжить с облачной копией</button>
          </div>
        </main>
      ) : ready ? <div key={epoch} className="account-app">{children}</div> : (
        <main className="account-gate">
          <h1>{user ? 'Открываем ваш прогресс…' : 'Ваш аккаунт'}</h1>
          <p role="status">{message || 'Проверяем вход…'}</p>
          {!user && status !== 'loading' && (
            <form onSubmit={(event) => {
              event.preventDefault();
              void login(lockEmail, lockPassword).then((result) => { if (!result.ok) setMessage(result.message); });
            }}>
              <label>Почта<input type="email" autoComplete="email" required value={lockEmail} onChange={(event) => setLockEmail(event.target.value)} /></label>
              <label>Пароль<input type="password" autoComplete="current-password" required value={lockPassword} onChange={(event) => setLockPassword(event.target.value)} /></label>
              <button type="submit">Войти</button>
            </form>
          )}
          {user && <button onClick={() => void syncNow()}>Повторить подключение</button>}
        </main>
      )}
    </AccountContext.Provider>
  );
}

export const useAccount = () => {
  const value = useContext(AccountContext);
  if (!value) throw new Error('useAccount must be used inside AccountProvider');
  return value;
};
