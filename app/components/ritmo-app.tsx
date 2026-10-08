'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '../hooks/use-theme';
import { profileRankForXp } from '../lib/profile-ranks';
import { KespaView } from './kespa-view';
import {
  ChevronRight,
  Menu,
  Moon,
  Sparkles,
  Sun,
  UserRound,
} from 'lucide-react';
import type { Section } from '../types/learning';
import {
  useDeviceProfile,
  evaluateAchievements,
} from '../lib/learning-runtime';
import { useSitePreferences } from '../hooks/site-preferences';
import { nav } from '../data/navigation';
import { auditVocabularyPracticeSync } from '../lib/study-deck';
import { HomeView } from './learning/home-view';
import { LearnView } from './learning/quick-start-view';
import { LessonsView } from './learning/lessons-view';
import { VocabularyView } from './learning/vocabulary-view';
import { DeleB2View } from './learning/dele-b2-view';
import { GrammarView } from './learning/grammar-view';
import { MusicView } from './learning/music-view';
import { PracticeHub } from './learning/practice-hub';
import { DictationView } from './learning/dictation-view';
import { ProgressView } from './learning/progress-view';
import { AchievementsView } from './learning/achievements-view';
import { ProfileView } from './learning/profile-view';
import { LoadingScreen } from './learning/loading-screen';
import {
  ClientErrorJournal,
  ReviewReminderWatcher,
} from './learning/app-watchers';
import {
  LearnedAchievementToast,
  AchievementUnlockToast,
} from './learning/achievement-toasts';
import { CatMascot } from './learning/shared';
import { GlobalSearch } from './learning/global-search';

export function RitmoApp() {
  const [section, setSection] = useState<Section>('Home'),
    [open, setOpen] = useState(false),
    [loading, setLoading] = useState(true);
  const [dark, setDark] = useTheme();
  const { profile } = useDeviceProfile(true);
  const rank = profileRankForXp(profile.xp, profile.gender),
    { preferences } = useSitePreferences();
  const navigate = (next: Section, replace = false) => {
    const hash = `#${next.toLowerCase()}`;
    if (window.location.hash !== hash)
      window.history[replace ? 'replaceState' : 'pushState'](null, '', hash);
    setSection(next);
    setOpen(false);
  };
  useEffect(() => {
    const syncFromAddress = () => {
      const requested = window.location.hash.slice(1).toLowerCase();
      const target = nav.find(
        (item) => item.name.toLowerCase() === requested,
      )?.name;
      navigate(target || 'Home', !target);
    };
    syncFromAddress();
    window.addEventListener('popstate', syncFromAddress);
    window.addEventListener('hashchange', syncFromAddress);
    return () => {
      window.removeEventListener('popstate', syncFromAddress);
      window.removeEventListener('hashchange', syncFromAddress);
    };
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1450);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    evaluateAchievements(false);
  }, []);
  useEffect(() => {
    const audit = auditVocabularyPracticeSync();
    document.documentElement.dataset.vocabularyPracticeSync = audit.issues
      .length
      ? `errors:${audit.issues.length}`
      : `ok:${audit.vocabularyWords}:${audit.practiceVocabularyCards}`;
    if (audit.issues.length)
      console.error('Vocabulary ↔ Practice sync errors', audit.issues);
  }, []);
  useEffect(() => {
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const sections = nav.map((n) => n.name);
    void Promise.resolve(
      context.registerTool(
        {
          name: 'open_learning_section',
          title: 'Open learning section',
          description:
            'Navigate the visible Ritmo Español app to a specific learning section.',
          inputSchema: {
            type: 'object',
            properties: { section: { type: 'string', enum: sections } },
            required: ['section'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input: unknown) {
            const value = (input as { section?: unknown })?.section;
            if (
              typeof value !== 'string' ||
              !sections.includes(value as Section)
            )
              throw new Error('Unknown learning section');
            navigate(value as Section);
            return { section: value, status: 'opened' };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  const views: { [K in Section]: React.ReactNode } = {
    Home: <HomeView go={navigate} profile={profile} />,
    Learn: <LearnView go={navigate} />,
    Lessons: <LessonsView />,
    Kespa: <KespaView />,
    Vocabulary: <VocabularyView />,
    Grammar: <GrammarView />,
    DeleB2: <DeleB2View />,
    Music: <MusicView />,
    Practice: <PracticeHub />,
    Dictation: <DictationView />,
    Progress: <ProgressView go={navigate} />,
    Achievements: <AchievementsView go={navigate} />,
    Profile: <ProfileView />,
  };
  const mobile = nav.filter((n) =>
    ['Home', 'Lessons', 'Kespa', 'Practice', 'Profile'].includes(n.name),
  );
  return (
    <>
      {loading && <LoadingScreen />}
      <ClientErrorJournal />
      <ReviewReminderWatcher />
      <LearnedAchievementToast />
      <AchievementUnlockToast
        openAchievements={() => navigate('Achievements')}
      />
      <div
        className={`${dark ? 'app dark' : 'app'} ${preferences.animations ? '' : 'motion-off'}`}
      >
        <aside className={open ? 'sidebar open' : 'sidebar'}>
          <button
            className="brand"
            aria-label="На главную"
            onClick={() => navigate('Home')}
          >
            <span>R</span>
            <b>
              Ritmo<em>Español</em>
            </b>
          </button>
          <nav>
            {nav.map((n) => {
              const Icon = n.icon;
              return (
                <button
                  key={n.name}
                  className={section === n.name ? 'active' : ''}
                  onClick={() => {
                    navigate(n.name);
                  }}
                >
                  <Icon />
                  <span>{n.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="sidebar-card cat-sidebar">
            <CatMascot state="neutral" small />
            <b>Котик ждёт урок</b>
            <p>Откройте «Уроки» и обустройте его дом.</p>
          </div>
          <button className="profile-mini" onClick={() => navigate('Profile')}>
            <span>
              {profile.name ? (
                profile.name.slice(0, 1).toUpperCase()
              ) : (
                <UserRound />
              )}
            </span>
            <div>
              <b>{profile.name || 'Без имени'}</b>
              <small>
                {profile.level} · {rank.title}
              </small>
            </div>
            <ChevronRight />
          </button>
        </aside>
        <main className="main">
          <header className="topbar">
            <button
              className="menu-btn"
              aria-label="Открыть меню"
              onClick={() => setOpen(!open)}
            >
              <Menu />
            </button>
            <div className="breadcrumbs">
              <span>Ritmo Español</span>
              <ChevronRight />
              <b>{nav.find((item) => item.name === section)?.label}</b>
            </div>
            <GlobalSearch go={navigate} />
            <div className="top-actions">
              <button
                className="xp-pill"
                aria-label="Открыть прогресс"
                onClick={() => navigate('Progress')}
              >
                <Sparkles />
                <span>{profile.xp} XP</span>
                <strong>{rank.title}</strong>
              </button>
              <button
                className="icon-btn"
                aria-label={
                  dark ? 'Включить светлую тему' : 'Включить тёмную тему'
                }
                onClick={() => setDark(!dark)}
              >
                {dark ? <Sun /> : <Moon />}
              </button>
              <button
                className="avatar-btn"
                aria-label="Открыть профиль"
                onClick={() => navigate('Profile')}
              >
                {profile.name ? (
                  profile.name.slice(0, 1).toUpperCase()
                ) : (
                  <UserRound />
                )}
                <span />
              </button>
            </div>
          </header>
          <div className="content">{views[section]}</div>
        </main>
        <nav className="mobile-nav">
          {mobile.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.name}
                className={section === n.name ? 'active' : ''}
                onClick={() => navigate(n.name)}
              >
                <Icon />
                <span>
                  {n.name === 'Home'
                    ? 'Главная'
                    : n.name === 'Learn'
                      ? 'Старт'
                      : n.name === 'Lessons'
                        ? 'Уроки'
                        : n.name === 'Kespa'
                          ? 'kespa'
                          : n.name === 'Music'
                            ? 'Музыка'
                            : n.name === 'Practice'
                              ? 'Практика'
                              : 'Профиль'}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
