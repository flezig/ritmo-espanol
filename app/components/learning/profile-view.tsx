'use client';

import { BACKUP_KEYS, BACKUP_VERSION, isValidBackup, type RitmoBackup } from '../../lib/backup';
import { useEffect, useRef, useState } from 'react';
import { localDateKey } from '../../lib/learning-core';
import {
  Award,
  Bell,
  ChevronRight,
  Download,
  Flame,
  GraduationCap,
  Heart,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAccount } from '../account-provider';
import { courseLessons } from '../../lessons';
import { profileRankForXp } from '../../lib/profile-ranks';
import {
  useExampleReports,
  useLearnedWordsDb,
  useDeviceProfile,
  useCustomWords,
  useSRS,
  useContentFavorites,
  russianDayWord,
  skillLabels,
} from '../../lib/learning-runtime';
import type { ExerciseReport, DeviceProfile, SitePreferences } from '../../types/learning';
import { useSpanishVoices } from './shared';
import { useSitePreferences } from '../../hooks/site-preferences';
import { makeStudyDeck } from '../../lib/study-deck';

const backupStorageKeys = BACKUP_KEYS;

const arrayBackupKeys = new Set<string>([
  'ritmo-content-favorites',
  'ritmo-custom-words',
  'ritmo-example-reports',
  'ritmo-exercise-reports',
  'ritmo-local-analytics',
  'ritmo-lesson-word-db',
  'ritmo-home-favorites',
]);

const backupFallback = (key: string) => key === 'ritmo-data-schema-version' ? 1
  : key === 'ritmo-report-migration' ? 0 : (arrayBackupKeys.has(key) ? [] : {});

function BackupPanel() {
  const inputRef = useRef<HTMLInputElement>(null),
    [status, setStatus] = useState<{
      kind: 'success' | 'error' | 'idle';
      text: string;
    }>({ kind: 'idle', text: '' });
  const createBackup = () => {
    try {
      const data = Object.fromEntries(
          backupStorageKeys.map((key) => {
            const fallback = backupFallback(key);
            try {
              return [key, JSON.parse(localStorage.getItem(key) || '')];
            } catch {
              return [key, fallback];
            }
          }),
        ) as RitmoBackup['data'],
        backup: RitmoBackup = {
          app: 'Ritmo Español',
          version: BACKUP_VERSION,
          exportedAt: new Date().toISOString(),
          data,
        },
        blob = new Blob([JSON.stringify(backup, null, 2)], {
          type: 'application/json',
        }),
        url = URL.createObjectURL(blob),
        link = document.createElement('a');
      link.href = url;
      link.download = `ritmo-espanol-backup-${localDateKey()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus({
        kind: 'success',
        text: 'Резервная копия создана. Сохраните JSON-файл в надёжном месте.',
      });
    } catch {
      setStatus({
        kind: 'error',
        text: 'Не удалось создать файл. Проверьте настройки загрузок браузера.',
      });
    }
  };
  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isValidBackup(parsed)) throw new Error('unsupported backup format');
      const date = new Date(parsed.exportedAt);
      if (
        !window.confirm(
          `Заменить текущий локальный прогресс данными из копии от ${date.toLocaleString('ru-RU')}?`,
        )
      ) {
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
      backupStorageKeys.forEach((key) => {
        const restored = parsed.data[key] ?? backupFallback(key);
        localStorage.setItem(key, JSON.stringify(restored));
      });
      setStatus({
        kind: 'success',
        text: 'Копия восстановлена. Обновляем профиль и прогресс…',
      });
      window.setTimeout(() => window.location.reload(), 650);
    } catch {
      setStatus({
        kind: 'error',
        text: 'Этот файл не является резервной копией Ritmo Español или повреждён.',
      });
      if (inputRef.current) inputRef.current.value = '';
    }
  };
  return (
    <section className="backup-panel">
      <div className="backup-copy">
        <span className="backup-icon">
          <ShieldCheck />
        </span>
        <div>
          <p className="eyebrow">РЕЗЕРВНАЯ КОПИЯ · БЕЗ РЕГИСТРАЦИИ</p>
          <h2>Перенесите обучение на другой компьютер</h2>
          <p>
            В JSON попадут профиль, уроки, словарь, интервальные повторения,
            ошибки и избранное. Паролей и данных аккаунта в файле нет.
          </p>
        </div>
      </div>
      <div className="backup-actions">
        <button className="backup-download" onClick={createBackup}>
          <Download />
          <span>
            <b>Создать резервную копию</b>
            <small>скачать JSON-файл</small>
          </span>
        </button>
        <button
          className="backup-upload"
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          <span>
            <b>Импортировать из файла</b>
            <small>заменить данные после подтверждения</small>
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          onChange={(event) => importBackup(event.target.files?.[0])}
          hidden
        />
      </div>
      <ol className="backup-steps">
        <li>
          <b>1</b> Создайте копию на старом устройстве
        </li>
        <li>
          <b>2</b> Передайте JSON-файл на новый компьютер
        </li>
        <li>
          <b>3</b> Откройте профиль и импортируйте файл
        </li>
      </ol>
      {status.kind !== 'idle' && (
        <output className={`backup-status ${status.kind}`}>
          {status.kind === 'success' ? '✓' : '!'} {status.text}
        </output>
      )}
    </section>
  );
}

function ReportedExamplesPanel() {
  const { reports, toggle } = useExampleReports();
  if (!reports.length) return null;
  return (
    <section className="reported-examples-panel">
      <header>
        <div>
          <p className="eyebrow">ПРИМЕРЫ ДЛЯ ПРОВЕРКИ</p>
          <h2>Вы отметили {reports.length}</h2>
        </div>
        <small>после входа отправляются автору сайта</small>
      </header>
      <div>
        {reports.map((report) => (
          <article key={report.id}>
            <span>{report.source}</span>
            <b>{report.word}</b>
            <p>{report.example}</p>
            <small>{report.translation}</small>
            <button onClick={() => toggle(report)}>Снять отметку</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReportedExercisesPanel() {
  const account = useAccount(),
    [reports, setReports] = useState<ExerciseReport[]>([]);
  useEffect(() => {
    const read = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('ritmo-exercise-reports') || '[]');
        setReports(Array.isArray(stored) ? stored : []);
      } catch {
        setReports([]);
      }
    };
    read();
    window.addEventListener('ritmo-exercise-reports', read);
    return () => window.removeEventListener('ritmo-exercise-reports', read);
  }, []);
  if (!reports.length) return null;
  const remove = (report: ExerciseReport) => {
    const next = reports.filter((item) => item.id !== report.id);
    localStorage.setItem('ritmo-exercise-reports', JSON.stringify(next));
    window.dispatchEvent(new Event('ritmo-exercise-reports'));
    setReports(next);
    void account.reportContent({
      reportKey: report.id,
      kind: 'exercise',
      section: report.section,
      content: { prompt: report.prompt, answer: report.answer, options: report.options || [] },
      active: false,
    });
  };
  return (
    <section className="reported-examples-panel reported-exercises-panel">
      <header>
        <div>
          <p className="eyebrow">ЗАДАНИЯ ДЛЯ ПРОВЕРКИ</p>
          <h2>Вы отметили {reports.length}</h2>
        </div>
        <small>в аккаунте отправляются автору сайта</small>
      </header>
      <div>
        {reports.slice(0, 12).map((report) => (
          <article key={report.id}>
            <span>{report.section}</span>
            <b>{report.prompt}</b>
            <small>Ожидаемый ответ: {report.answer}</small>
            <button onClick={() => remove(report)}>Снять отметку</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function LearnedWordsPanel() {
  const { words } = useLearnedWordsDb(),
    { speakText } = useSpanishVoices(),
    groups = courseLessons
      .map((lesson) => ({
        lesson,
        words: words.filter((word) => word.lessonId === lesson.id),
      }))
      .filter((group) => group.words.length);
  return (
    <section className="learned-db-panel">
      <header>
        <div>
          <p className="eyebrow">ЛИЧНАЯ БАЗА СЛОВ</p>
          <h2>{words.length} основных слов из уроков</h2>
        </div>
        <small>используются для персонального диктанта</small>
      </header>
      {groups.length ? (
        <div>
          {groups.map(({ lesson, words: lessonWords }) => (
            <article key={lesson.id}>
              <span>
                {lesson.icon} Урок {lesson.number}
              </span>
              <h3>{lesson.title}</h3>
              <div>
                {lessonWords.map((word) => (
                  <button
                    key={word.id}
                    onClick={() => speakText(word.es, 1)}
                    title={`${word.example} — ${word.exampleRu}`}
                  >
                    <b>{word.es}</b>
                    <small>{word.ru}</small>
                    <Volume2 />
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="learned-db-empty">
          Откройте любой урок и начните практику — его основные слова появятся
          здесь автоматически.
        </p>
      )}
    </section>
  );
}

function AccountPanel({
  profileName,
  updateProfile,
}: {
  profileName: string;
  updateProfile: (patch: Partial<DeviceProfile>) => void;
}) {
  const account = useAccount(),
    [mode, setMode] = useState<'login' | 'register'>('register'),
    [name, setName] = useState(profileName),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(''),
    [securityEmail, setSecurityEmail] = useState(account.user?.email || ''),
    [newPassword, setNewPassword] = useState(''),
    [securityBusy, setSecurityBusy] = useState(false),
    [securityNotice, setSecurityNotice] = useState('');

  useEffect(() => setSecurityEmail(account.user?.email || ''), [account.user?.email]);

  if (!account.configured)
    return (
      <section className="account-panel account-unconfigured">
        <div>
          <p className="eyebrow">ОБЛАЧНЫЙ АККАУНТ</p>
          <h2>Регистрация подготовлена</h2>
          <p>
            Добавьте публичные параметры Supabase в Cloudflare — после этого
            здесь автоматически появится форма входа.
          </p>
        </div>
        <ShieldCheck />
      </section>
    );

  if (account.user)
    return (
      <section className="account-panel account-connected">
        <div className="account-cloud-mark"><ShieldCheck /></div>
        <div>
          <p className="eyebrow">АККАУНТ · ОБЛАЧНОЕ СОХРАНЕНИЕ</p>
          <h2>{account.user.email}</h2>
          <p>{account.message}</p>
          <small>
            Уроки, словарь, SRS, достижения и незавершённая практика доступны
            после входа на другом устройстве.
          </small>
        </div>
        <div className="account-actions">
          <button disabled={account.status === 'syncing'} onClick={() => void account.syncNow()}>
            {account.status === 'syncing' ? 'Сохраняем…' : 'Сохранить сейчас'}
          </button>
          <button className="account-logout" onClick={() => void account.logout()}>
            Выйти
          </button>
        </div>
        <div className="account-workspaces">
          <a href="/student"><GraduationCap /> Мои задания</a>
          <a href="/teacher"><UserRound /> Кабинет учителя</a>
        </div>
        <details className="account-security" open={account.recoveryMode || undefined}>
          <summary>{account.recoveryMode ? 'Создайте новый пароль' : 'Почта и пароль'}</summary>
          {account.recoveryMode && <p>Ссылка подтверждена. Введите новый пароль ниже, чтобы завершить восстановление.</p>}
          <div>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setSecurityBusy(true);
                const result = await account.updateEmail(securityEmail);
                setSecurityBusy(false);
                setSecurityNotice(result.ok
                  ? 'Письма подтверждения отправлены. Адрес изменится после подтверждения по ссылке.'
                  : result.message);
              }}
            >
              <label>
                <span>Новая почта</span>
                <input type="email" autoComplete="email" required value={securityEmail} onChange={(event) => setSecurityEmail(event.target.value)} />
              </label>
              <button disabled={securityBusy || securityEmail.trim().toLowerCase() === account.user.email?.toLowerCase()} type="submit">Изменить почту</button>
            </form>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setSecurityBusy(true);
                const result = await account.updatePassword(newPassword);
                setSecurityBusy(false);
                setSecurityNotice(result.ok ? 'Пароль изменён.' : result.message);
                if (result.ok) setNewPassword('');
              }}
            >
              <label>
                <span>Новый пароль</span>
                <input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </label>
              <button disabled={securityBusy || newPassword.length < 8} type="submit">Изменить пароль</button>
            </form>
          </div>
          {securityNotice && <p role="status">{securityNotice}</p>}
        </details>
      </section>
    );

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    if (mode === 'register') updateProfile({ name: name.trim() });
    const result = mode === 'register'
      ? await account.register(name.trim(), email, password)
      : await account.login(email, password);
    setBusy(false);
    if (!result.ok) setNotice(result.message);
    else if (result.confirmationRequired) {
      setNotice('Проверьте почту и подтвердите регистрацию. Затем вернитесь и войдите.');
      setMode('login');
      setPassword('');
    } else setNotice('Готово. Загружаем ваш прогресс…');
  };

  return (
    <section className="account-panel account-auth">
      <header>
        <div>
          <p className="eyebrow">АККАУНТ RITMO</p>
          <h2>{mode === 'register' ? 'Сохраните прогресс в облаке' : 'С возвращением'}</h2>
          <p>
            {mode === 'register'
              ? 'Текущий прогресс с этого устройства будет перенесён в новый аккаунт.'
              : 'После входа сайт загрузит ваш прогресс и продолжит синхронизацию.'}
          </p>
        </div>
        <div className="account-mode">
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            Регистрация
          </button>
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Вход
          </button>
        </div>
      </header>
      <form onSubmit={submit}>
        {mode === 'register' && (
          <label>
            <span>Имя</span>
            <input autoComplete="name" maxLength={50} value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        )}
        <label>
          <span>Электронная почта</span>
          <input autoComplete="email" inputMode="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span>Пароль</span>
          <input autoComplete={mode === 'register' ? 'new-password' : 'current-password'} maxLength={128} minLength={8} required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {mode === 'register' && <small>Минимум 8 символов.</small>}
        </label>
        <button className="primary-btn" disabled={busy} type="submit">
          {busy ? 'Подождите…' : mode === 'register' ? 'Создать аккаунт' : 'Войти'}
        </button>
        {mode === 'login' && (
          <button
            className="password-reset-link"
            disabled={busy || !email.trim()}
            type="button"
            onClick={async () => {
              setBusy(true);
              const result = await account.requestPasswordReset(email);
              setBusy(false);
              setNotice(result.ok
                ? 'Ссылка для восстановления отправлена. Откройте письмо на этом устройстве.'
                : result.message);
            }}
          >
            Забыли пароль?
          </button>
        )}
      </form>
      {notice && <p className="account-notice" role="status">{notice}</p>}
      <small className="account-privacy">
        Пароль обрабатывает Supabase Auth; Ritmo Español его не сохраняет и не видит.
      </small>
    </section>
  );
}

function AccessibilitySettings() {
  const { preferences, updatePreferences } = useSitePreferences(),
    [notice, setNotice] = useState('');
  const toggleReviewNotifications = async () => {
    if (preferences.reviewNotifications) {
      updatePreferences({ reviewNotifications: false });
      setNotice('Уведомления о повторениях выключены.');
      return;
    }
    if (!('Notification' in window)) {
      setNotice('Этот браузер не поддерживает уведомления.');
      return;
    }
    const permission =
      Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
    if (permission !== 'granted') {
      setNotice('Браузер не разрешил уведомления. Разрешение можно изменить в настройках сайта.');
      return;
    }
    updatePreferences({ reviewNotifications: true });
    setNotice('Сообщим только тогда, когда действительно наступит срок повторения.');
  };
  const rows: Array<{
    key: keyof Pick<SitePreferences, 'animations' | 'sounds' | 'autoSpeak'>;
    icon: React.ReactNode;
    title: string;
    copy: string;
  }> = [
    {
      key: 'animations',
      icon: <Sparkles />,
      title: 'Анимации',
      copy: 'Плавные переходы, движения котиков и декоративные эффекты.',
    },
    {
      key: 'sounds',
      icon: preferences.sounds ? <Volume2 /> : <VolumeX />,
      title: 'Звуки ответов',
      copy: 'Сигналы правильного ответа, ошибки и получения достижения.',
    },
    {
      key: 'autoSpeak',
      icon: <Volume2 />,
      title: 'Автоматическая озвучка',
      copy: 'Автоматически произносить слова и предложения в практике и уроках.',
    },
  ];
  return (
    <section className="accessibility-settings">
      <header>
        <div>
          <p className="eyebrow">ДОСТУПНОСТЬ И УВЕДОМЛЕНИЯ</p>
          <h2>Настройте сайт под себя</h2>
        </div>
        <Settings />
      </header>
      <div className="preference-list">
        {rows.map((row) => (
          <article key={row.key}>
            <span>{row.icon}</span>
            <div>
              <b>{row.title}</b>
              <p>{row.copy}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences[row.key]}
              className={preferences[row.key] ? 'preference-switch active' : 'preference-switch'}
              onClick={() => updatePreferences({ [row.key]: !preferences[row.key] })}
            >
              <i />
              <span>{preferences[row.key] ? 'Вкл.' : 'Выкл.'}</span>
            </button>
          </article>
        ))}
        <article>
          <span><Bell /></span>
          <div>
            <b>Напоминания о повторениях</b>
            <p>
              Только когда карточки уже готовы к повторению. Работает, пока сайт открыт в браузере.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={preferences.reviewNotifications}
            className={preferences.reviewNotifications ? 'preference-switch active' : 'preference-switch'}
            onClick={() => void toggleReviewNotifications()}
          >
            <i />
            <span>{preferences.reviewNotifications ? 'Вкл.' : 'Выкл.'}</span>
          </button>
        </article>
      </div>
      {notice && <p className="preference-notice" role="status">{notice}</p>}
    </section>
  );
}

export function ProfileView() {
  const { profile, update } = useDeviceProfile(),
    account = useAccount(),
    { words: customWords } = useCustomWords(),
    { records } = useSRS(),
    { items: contentFavorites } = useContentFavorites(),
    [editing, setEditing] = useState(false),
    [draftName, setDraftName] = useState(profile.name);
  useEffect(() => setDraftName(profile.name), [profile.name]);
  const favoriteRecords = Object.entries(records).filter(
      ([, record]) => record.favorite,
    ),
    days = Array.from({ length: 28 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (27 - index));
      return localDateKey(date);
    }),
    accuracy = profile.totalReviews
      ? Math.round((profile.totalCorrect / profile.totalReviews) * 100)
      : 0,
    rank = profileRankForXp(profile.xp, profile.gender);
  return (
    <div className="view-stack profile-view">
      <header className="profile-hero">
        <div className="profile-avatar">
          {profile.name ? profile.name.slice(0, 1).toUpperCase() : <UserRound />}
        </div>
        <div className="profile-identity">
          <p className="eyebrow">
            {account.user ? 'ОБЛАЧНЫЙ ПРОФИЛЬ' : 'ПРОФИЛЬ НА УСТРОЙСТВЕ'} · {profile.level}
          </p>
          <div className="profile-name-row">
            {editing ? (
              <input
                className="profile-name-input"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
              />
            ) : (
              <h1>{profile.name || 'Без имени'}</h1>
            )}
            <div className="gender-choice" role="radiogroup" aria-label="Пол профиля">
              <button
                type="button"
                role="radio"
                aria-checked={profile.gender === 'H'}
                className={profile.gender === 'H' ? 'male active' : 'male'}
                onClick={() => update({ gender: 'H' })}
                title="Hombre — мужчина"
              >
                H <small>Hombre</small>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={profile.gender === 'M'}
                className={profile.gender === 'M' ? 'female active' : 'female'}
                onClick={() => update({ gender: 'M' })}
                title="Mujer — женщина"
              >
                M <small>Mujer</small>
              </button>
            </div>
          </div>
          <div className={`profile-rank gender-${profile.gender.toLowerCase()}`}>
            <b>Уровень {rank.level} · {rank.title}</b>
            <span>{profile.xp.toLocaleString('ru-RU')} XP</span>
            <i><span style={{ width: `${rank.progress}%` }} /></i>
            <small>
              {rank.next
                ? `Ещё ${rank.remaining.toLocaleString('ru-RU')} XP до звания ${rank.nextTitle}`
                : 'Получено высшее звание'}
            </small>
          </div>
          <p>
            {account.user
              ? `Прогресс привязан к ${account.user.email} и синхронизируется между устройствами.`
              : 'Без входа данные остаются только в этом браузере.'}
          </p>
        </div>
        <button
          className="profile-edit-button"
          onClick={() => {
            if (editing) update({ name: draftName.trim() });
            setEditing(!editing);
          }}
        >
          {editing ? 'Сохранить' : 'Изменить профиль'}
        </button>
      </header>
      <AccountPanel profileName={profile.name} updateProfile={update} />
      <div className="profile-stats">
        <article>
          <Flame />
          <div>
            <b>{profile.streak}</b>
            <span>{russianDayWord(profile.streak)} подряд</span>
          </div>
          <small>рекорд {profile.longestStreak}</small>
        </article>
        <article>
          <Sparkles />
          <div>
            <b>{profile.xp}</b>
            <span>XP · {rank.title}</span>
          </div>
          <small>
            {rank.next
              ? `${rank.remaining} до уровня ${rank.level + 1}`
              : 'максимальный уровень'}
          </small>
        </article>
        <article>
          <Award />
          <div>
            <b>{accuracy}%</b>
            <span>точность</span>
          </div>
          <small>{profile.totalCorrect} верных</small>
        </article>
        <article>
          <Heart />
          <div>
            <b>{favoriteRecords.length + contentFavorites.length}</b>
            <span>в избранном</span>
          </div>
          <small>слова и примеры</small>
        </article>
      </div>
      <section className="daily-system">
        <header>
          <div>
            <p className="eyebrow">ЕЖЕДНЕВНЫЕ ЗАХОДЫ</p>
            <h2>
              {profile.streak
                ? `${profile.streak} ${russianDayWord(profile.streak)} в ритме`
                : 'Первый день начинается сейчас'}
            </h2>
          </div>
          <div className="goal-choice daily-answer-goal">
            <span>Цель на день</span>
            <b>16 реальных ответов</b>
          </div>
        </header>
        <div className="activity-calendar">
          {days.map((day) => {
            const date = new Date(`${day}T12:00:00`),
              weekday = date
                .toLocaleDateString('ru-RU', { weekday: 'short' })
                .replace('.', ''),
              calendarDate = date
                .toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                })
                .replace('.', '');
            return (
              <span
                className={profile.activeDays.includes(day) ? 'active' : ''}
                title={date.toLocaleDateString('ru-RU', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
                key={day}
              >
                <i />
                <b>{weekday}</b>
                <small>{calendarDate}</small>
              </span>
            );
          })}
        </div>
        <p>
          Заход засчитывается один раз в календарный день. Если вернуться завтра
          — серия продолжится; после пропущенного дня начнётся новая.
        </p>
      </section>
      <AccessibilitySettings />
      <details className="profile-disclosure">
        <summary>
          <span className="profile-disclosure-icon"><ShieldCheck /></span>
          <span>
            <b>Данные</b>
            <small>Резервная копия и перенос прогресса</small>
          </span>
          <ChevronRight />
        </summary>
        <div className="profile-disclosure-content">
          <BackupPanel />
        </div>
      </details>
      <details className="profile-disclosure">
        <summary>
          <span className="profile-disclosure-icon">⚑</span>
          <span>
            <b>Обратная связь</b>
            <small>Отмеченные примеры и упражнения</small>
          </span>
          <ChevronRight />
        </summary>
        <div className="profile-disclosure-content">
          <p className="profile-disclosure-help">
            Здесь можно проверить отправленные отметки или снять их после исправления материала.
          </p>
          <ReportedExamplesPanel />
          <ReportedExercisesPanel />
        </div>
      </details>
      <details className="profile-disclosure">
        <summary>
          <span className="profile-disclosure-icon"><Heart /></span>
          <span>
            <b>Сохранённое</b>
            <small>{favoriteRecords.length + contentFavorites.length} в избранном · личная база слов</small>
          </span>
          <ChevronRight />
        </summary>
        <div className="profile-disclosure-content">
          <LearnedWordsPanel />
          <section className="favorites-panel">
        <header>
          <div>
            <p className="eyebrow">ИЗБРАННОЕ</p>
            <h2>Сложные слова и примеры</h2>
          </div>
          <small>
            {favoriteRecords.length + contentFavorites.length} сохранено
          </small>
        </header>
        {favoriteRecords.length || contentFavorites.length ? (
          <div>
            {contentFavorites.slice(0, 4).map((item) => (
              <article key={item.id}>
                <span>{item.type}</span>
                <b>{item.title}</b>
                <p>{item.body}</p>
                <small>из урока</small>
              </article>
            ))}
            {favoriteRecords.slice(0, 8).map(([key, record]) => {
              const card = makeStudyDeck(customWords).find(
                (item) => item.key === key,
              );
              return card ? (
                <article key={key}>
                  <span>{skillLabels[card.skill]}</span>
                  <b>{card.es}</b>
                  <p>
                    {card.ru} · {card.example}
                  </p>
                  <small>сложность {record.difficulty.toFixed(1)}</small>
                </article>
              ) : null;
            })}
          </div>
        ) : (
          <div className="favorites-empty">
            <Heart />
            <p>
              Нажимайте сердечко в повторении — сложные слова и примеры появятся
              здесь.
            </p>
          </div>
        )}
          </section>
        </div>
      </details>
    </div>
  );
}
