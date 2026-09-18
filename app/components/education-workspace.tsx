'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Bell, BookOpen, Check, Clock3, GraduationCap, LoaderCircle, Mail, MessageCircle, Send, UserPlus, Users } from 'lucide-react';
import { useAccount } from './account-provider';
import { getCloudClient } from '../lib/cloud-progress';
import { activateAssignmentTracking } from '../lib/assignment-tracking';
import { courseLessons } from '../lessons';
import { vocabularyTopics } from '../vocabulary';
import {
  addAssignmentComment, createAssignment, inviteStudent, loadAssignmentDetail, loadMyRoles,
  loadStudentLearningSummary, loadStudentWorkspace, loadTeacherWorkspace, markNotificationRead, replyToExerciseQuestion, respondInvitation, reviewAssignment, submitAssignment,
  type AppNotification, type Assignment, type AssignmentActivity, type AssignmentComment, type AssignmentProgress, type ExerciseQuestion, type Invitation, type Profile, type Review, type Role,
} from '../lib/education';

type WorkspaceMode = 'teacher' | 'student' | 'teacher-student' | 'teacher-assignment' | 'student-assignment';
type TeacherData = Awaited<ReturnType<typeof loadTeacherWorkspace>>;
type StudentData = Awaited<ReturnType<typeof loadStudentWorkspace>>;
type DetailData = Awaited<ReturnType<typeof loadAssignmentDetail>>;

const dateText = (value: string | null) => value ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : 'Без срока';
const statusLabel: Record<Assignment['status'], string> = {
  draft: 'Черновик', assigned: 'Назначено', submitted: 'На проверке', revision_requested: 'Нужна доработка',
  completed: 'Завершено', overdue: 'Просрочено', cancelled: 'Отменено',
};
const personName = (profile?: Profile) => profile?.display_name || profile?.email || 'Пользователь';

function WorkspaceFrame({ role, children }: { role: 'teacher' | 'student'; children: React.ReactNode }) {
  return <main className="education-shell">
    <header className="education-topbar">
      <a href="/#profile" className="education-brand"><span>R</span><b>Ritmo Español</b></a>
      <nav><a href={role === 'teacher' ? '/teacher' : '/student'}>{role === 'teacher' ? 'Кабинет учителя' : 'Мои задания'}</a><a href="/">Вернуться к обучению</a></nav>
    </header>
    <div className="education-page">{children}</div>
  </main>;
}

function EmptyAuth({ role }: { role: 'teacher' | 'student' }) {
  return <WorkspaceFrame role={role}><section className="education-empty"><GraduationCap /><h1>Войдите в аккаунт</h1><p>Кабинет доступен после входа по почте и паролю.</p><a className="edu-button primary" href="/#profile">Открыть профиль</a></section></WorkspaceFrame>;
}

function AccessDenied() {
  return <WorkspaceFrame role="teacher"><section className="education-empty"><GraduationCap /><h1>Нет доступа</h1><p>Роль учителя назначает администратор сайта.</p><a className="edu-button primary" href="/student">Открыть кабинет ученика</a></section></WorkspaceFrame>;
}

function Busy({ role }: { role: 'teacher' | 'student' }) {
  return <WorkspaceFrame role={role}><section className="education-empty"><LoaderCircle className="spin" /><p>Загружаем кабинет…</p></section></WorkspaceFrame>;
}

function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="education-error" role="alert"><b>Не удалось загрузить данные</b><span>{message}</span>{retry && <button onClick={retry}>Повторить</button>}</div>;
}

function useAutoRefresh(refresh: () => Promise<void>) {
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(timer);
  }, [refresh]);
}

function NotificationFeed({ items, role, refresh }: { items: AppNotification[]; role: 'teacher' | 'student'; refresh: () => Promise<void> }) {
  if (!items.length) return null;
  const client = getCloudClient()!;
  return <details className="notification-feed"><summary><Bell /><b>Уведомления</b><span>{items.filter((item) => !item.read_at).length} новых</span></summary><div>{items.slice(0, 10).map((item) => <article className={item.read_at ? '' : 'unread'} key={item.id}><div><b>{item.title}</b><p>{item.body}</p><small>{dateText(item.created_at)}</small></div>{item.entity_type === 'assignment' && item.entity_id && <a href={`/${role}/assignments/${item.entity_id}`}>Открыть</a>}{!item.read_at && <button aria-label="Отметить прочитанным" onClick={() => void markNotificationRead(client, item.id).then(refresh)}><Check /></button>}</article>)}</div></details>;
}

function AssignmentRows({ assignments, profiles, progress, perspective }: { assignments: Assignment[]; profiles?: Map<string, Profile>; progress?: Map<string, AssignmentProgress>; perspective: 'teacher' | 'student' }) {
  const [studentFilter, setStudentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<Assignment['status'] | 'all'>('all');
  const [sortMode, setSortMode] = useState<'priority' | 'status' | 'deadline' | 'newest'>('priority');
  if (!assignments.length) return <div className="education-empty compact"><BookOpen /><p>Заданий пока нет.</p></div>;
  const studentIds = [...new Set(assignments.map((item) => item.student_id))];
  const filtered = assignments.filter((item) => (studentFilter === 'all' || item.student_id === studentFilter) && (statusFilter === 'all' || item.status === statusFilter));
  const ordered = [...filtered].sort((a, b) => {
    if (sortMode === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortMode === 'deadline') return new Date(a.due_at || '2999-01-01').getTime() - new Date(b.due_at || '2999-01-01').getTime();
    if (sortMode === 'status') return statusLabel[a.status].localeCompare(statusLabel[b.status], 'ru');
    const rank = (x: Assignment) => x.status === 'revision_requested' ? 0 : x.status === 'overdue' ? 1 : x.status === 'assigned' ? 2 : x.status === 'submitted' ? 3 : 4;
    return rank(a) - rank(b) || new Date(a.due_at || '2999-01-01').getTime() - new Date(b.due_at || '2999-01-01').getTime();
  });
  const render = (items: Assignment[]) => <div className="assignment-list">{items.map((item) => {
    const overdue = item.due_at && new Date(item.due_at) < new Date() && !['completed', 'submitted'].includes(item.status);
    const measured = progress?.get(item.id);
    const started = !!measured?.completed_count || !!measured?.answer_count;
    return <a key={item.id} className="assignment-row" href={`/${perspective}/assignments/${item.id}`}>
      <div className="assignment-main"><span className={`assignment-status ${overdue ? 'overdue' : item.status}`}>{overdue ? 'Просрочено' : statusLabel[item.status]}</span><h3>{item.title}</h3>
        {perspective === 'teacher' ? <p>{personName(profiles?.get(item.student_id))}</p> : <p>{item.content_title_snapshot || item.description || 'Выполните задание преподавателя'}</p>}
        {item.topic_title_snapshot && <small className="assignment-topic">Тема: {item.topic_title_snapshot}</small>}
        {measured && <div className="assignment-mini-progress"><i><span style={{ width: `${measured.progress_percent}%` }} /></i><b>{measured.completed_count} / {measured.target_count}</b></div>}</div>
      <div className="assignment-meta"><span><Clock3 />{dateText(item.due_at)}</span><strong>{perspective === 'teacher' ? 'Открыть результат' : started ? 'Продолжить' : 'Начать'}</strong></div>
    </a>;
  })}</div>;
  const current = ordered.filter((item) => !['completed','cancelled'].includes(item.status)), completed = ordered.filter((item) => ['completed','cancelled'].includes(item.status));
  return <><div className="assignment-filters">
    {perspective === 'teacher' && studentIds.length > 1 && <label>Ученик<select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)}><option value="all">Все ученики</option>{studentIds.map((id) => <option value={id} key={id}>{personName(profiles?.get(id))}</option>)}</select></label>}
    <label>Статус<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Assignment['status'] | 'all')}><option value="all">Все статусы</option>{Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
    <label>Сортировка<select value={sortMode} onChange={(e) => setSortMode(e.target.value as typeof sortMode)}><option value="priority">По важности</option><option value="status">По статусу</option><option value="deadline">По сроку</option><option value="newest">Сначала новые</option></select></label>
  </div>{!ordered.length ? <p className="assignment-filter-empty">По выбранным фильтрам заданий нет.</p> : <>{render(current)}{!!completed.length && <details className="completed-assignments" open={statusFilter === 'completed' || statusFilter === 'cancelled'}><summary>Завершённые · {completed.length}</summary>{render(completed)}</details>}</>}</>;
}

function TeacherDashboard() {
  const client = getCloudClient()!;
  const [data, setData] = useState<TeacherData | null>(null), [error, setError] = useState(''), [email, setEmail] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => { setError(''); try { setData(await loadTeacherWorkspace(client)); } catch (e) { setError((e as Error).message); } }, [client]);
  useAutoRefresh(refresh);
  const sendInvite = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setMessage(''); try { await inviteStudent(client, email); setEmail(''); setMessage('Приглашение отправлено.'); await refresh(); } catch (e) { setMessage((e as Error).message.includes('not found') ? 'Пользователь с такой почтой ещё не зарегистрирован.' : (e as Error).message); } finally { setBusy(false); } };
  if (!data && !error) return <Busy role="teacher" />;
  return <WorkspaceFrame role="teacher">
    <div className="education-heading"><div><span className="eyebrow">TEACHER SPACE</span><h1>Кабинет учителя</h1><p>Ученики, задания и работы на проверке.</p></div><div className="education-notice"><Bell /><b>{data?.notifications.filter((n) => !n.read_at).length || 0}</b><span>новых событий</span></div></div>
    {error && <ErrorBox message={error} retry={() => void refresh()} />}
    <section className="education-grid stats-grid"><article><Users /><b>{data?.relationships.length || 0}</b><span>учеников</span></article><article><BookOpen /><b>{data?.assignments.filter((a) => a.status === 'assigned').length || 0}</b><span>активных заданий</span></article><article><Check /><b>{data?.assignments.filter((a) => a.status === 'submitted').length || 0}</b><span>ждут проверки</span></article></section>
    <div className="education-columns">
      <section className="education-card"><div className="card-title"><div><h2>Ученики</h2><p>Пригласите зарегистрированного пользователя.</p></div><UserPlus /></div>
        <form className="invite-form" onSubmit={sendInvite}><label>Почта ученика<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@example.com" /></label><button className="edu-button primary" disabled={busy}>{busy ? 'Отправляем…' : 'Пригласить'}</button></form>{message && <p className="form-message" role="status">{message}</p>}
        <div className="student-list">{data?.relationships.map((r) => <a key={r.student_id} href={`/teacher/students/${r.student_id}`}><span>{personName(data.profiles.get(r.student_id)).slice(0, 1).toUpperCase()}</span><div><b>{personName(data.profiles.get(r.student_id))}</b><small>{data.profiles.get(r.student_id)?.email}</small></div></a>)}{!data?.relationships.length && <p className="muted">Принятых учеников пока нет.</p>}</div>
        {!!data?.invitations.filter((i) => i.status === 'pending').length && <div className="pending-list"><h3>Ожидают ответа</h3>{data.invitations.filter((i) => i.status === 'pending').map((i) => <p key={i.id}><Mail />{personName(data.profiles.get(i.student_id))}<span>Отправлено {dateText(i.created_at)}</span></p>)}</div>}
      </section>
      <section className="education-card"><div className="card-title"><div><h2>Последние задания</h2><p>Сначала показаны работы, ожидающие проверки.</p></div><BookOpen /></div><AssignmentRows assignments={[...(data?.assignments || [])].sort((a, b) => Number(b.status === 'submitted') - Number(a.status === 'submitted'))} profiles={data?.profiles} progress={data?.progress} perspective="teacher" /></section>
    </div><NotificationFeed items={data?.notifications || []} role="teacher" refresh={refresh} />
  </WorkspaceFrame>;
}

function TeacherStudent({ studentId }: { studentId: string }) {
  const client = getCloudClient()!, [data, setData] = useState<TeacherData | null>(null), [summary, setSummary] = useState<Awaited<ReturnType<typeof loadStudentLearningSummary>> | null>(null), [error, setError] = useState(''), [saving, setSaving] = useState(false), [notice, setNotice] = useState('');
  const [form, setForm] = useState({ title: '', description: '', type: 'manual' as Assignment['assignment_type'], dueAt: '', maxScore: '10', materialUrl: '', contentId: '', topicId: 'all', targetCount: '1' });
  const refresh = useCallback(async () => { try { const workspace = await loadTeacherWorkspace(client); setData(workspace); if (workspace.relationships.some((r) => r.student_id === studentId)) setSummary(await loadStudentLearningSummary(client, studentId)); } catch (e) { setError((e as Error).message); } }, [client, studentId]);
  useAutoRefresh(refresh);
  const linked = data?.relationships.some((r) => r.student_id === studentId);
  const contentOptions = useMemo(() => [
    ...courseLessons.map((lesson) => ({ id: lesson.id, type: 'lesson' as const, title: `Урок: ${lesson.title}` })),
    { id: 'all', type: 'practice' as const, title: 'Practice: любой режим' },
    { id: 'words:five', type: 'practice' as const, title: 'Practice: учить слова · 5 минут' },
    { id: 'words:errors', type: 'practice' as const, title: 'Practice: работа над ошибками' },
    { id: 'words:favorites', type: 'practice' as const, title: 'Practice: избранные слова' },
    { id: 'articles', type: 'practice' as const, title: 'Practice: артикли' },
    { id: 'rush', type: 'practice' as const, title: 'Practice: Spanish Rush' },
    { id: 'detective:a1', type: 'practice' as const, title: 'Practice: детектив A1' },
    { id: 'detective:a2', type: 'practice' as const, title: 'Practice: детектив A2' },
    { id: 'learned-words', type: 'dictation' as const, title: 'Диктант по изученным словам' },
    { id: 'azul', type: 'music' as const, title: 'Музыка: Azul' },
    { id: 'veneno', type: 'music' as const, title: 'Музыка: Veneno' },
    { id: 'mayores', type: 'music' as const, title: 'Музыка: Mayores' },
    { id: 'entre-nosotros', type: 'music' as const, title: 'Музыка: Entre Nosotros' },
  ], []);
  const save = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setNotice(''); try {
    const selected = contentOptions.find((o) => o.id === form.contentId);
    const chosenTopic = vocabularyTopics.find((item) => item.name === form.topicId);
    await createAssignment(client, { studentId, title: form.title, description: form.description, type: selected?.type || form.type, dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined, maxScore: Number(form.maxScore) || undefined, materialUrl: form.materialUrl, contentType: selected?.type, contentId: selected?.id, contentTitle: selected?.title, targetCount: selected?.type === 'lesson' ? 1 : Number(form.targetCount) || 1, topicId: selected?.type === 'practice' && selected.id.startsWith('words:') ? form.topicId : undefined, topicTitle: chosenTopic?.name || (form.topicId === 'all' ? 'Все темы' : undefined) });
    setForm({ title: '', description: '', type: 'manual', dueAt: '', maxScore: '10', materialUrl: '', contentId: '', topicId: 'all', targetCount: '1' }); setNotice('Задание назначено.'); await refresh();
  } catch (e) { setNotice((e as Error).message); } finally { setSaving(false); } };
  if (!data && !error) return <Busy role="teacher" />;
  if (!linked) return <WorkspaceFrame role="teacher"><a className="back-link" href="/teacher"><ArrowLeft />К ученикам</a><ErrorBox message={error || 'Этот ученик не связан с вашим аккаунтом.'} /></WorkspaceFrame>;
  const profile = data?.profiles.get(studentId);
  const learningWords = summary?.learningWords.map((key) => vocabularyTopics.flatMap((topic) => topic.entries).find((entry) => entry.lexemeId === key)?.es).filter((word): word is string => !!word).slice(0, 12) || [];
  return <WorkspaceFrame role="teacher"><a className="back-link" href="/teacher"><ArrowLeft />К ученикам</a><div className="education-heading"><div><span className="eyebrow">УЧЕНИК</span><h1>{personName(profile)}</h1><p>{profile?.email}</p></div></div>
    {summary && <><section className="education-grid stats-grid student-learning-stats"><article><GraduationCap /><b>{summary.level}</b><span>уровень · {summary.xp} XP</span></article><article><BookOpen /><b>{summary.completedLessons}</b><span>уроков завершено</span></article><article><Check /><b>{summary.totalReviews ? Math.round(summary.totalCorrect / summary.totalReviews * 100) : 0}%</b><span>{summary.totalReviews} ответов · серия {summary.streak}</span></article><article className={summary.activeToday ? 'student-online' : ''}><Clock3 /><b>{summary.activeToday ? 'Сегодня' : 'Не сегодня'}</b><span>{summary.lastSeenAt ? `последняя синхронизация ${dateText(summary.lastSeenAt)}` : 'активности ещё нет'}</span></article></section><section className="learning-words"><div><b>Сейчас учит</b><span>Обновляется после облачной синхронизации</span></div>{learningWords.length ? <ul>{learningWords.map((word) => <li key={word}>{word}</li>)}</ul> : <p>Нет слов со статусом «Учу» или «Сложное».</p>}</section></>}
    <div className="education-columns"><section className="education-card"><h2>Новое задание</h2><form className="assignment-form" onSubmit={save}>
      <label>Название<input required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label>Описание<textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <label>Материал курса<select value={form.contentId} onChange={(e) => setForm({ ...form, contentId: e.target.value })}><option value="">Без привязки</option>{contentOptions.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select></label>
      {contentOptions.find((item) => item.id === form.contentId)?.type === 'practice' && form.contentId.startsWith('words:') && <label>Тема Practice<select value={form.topicId} onChange={(e) => setForm({ ...form, topicId: e.target.value })}><option value="all">Все темы</option>{vocabularyTopics.map((item) => <option key={`${item.level}-${item.name}`} value={item.name}>{item.level} · {item.name}</option>)}</select></label>}
      {contentOptions.find((item) => item.id === form.contentId)?.type !== 'lesson' && form.contentId && <label>Сколько сессий пройти<input type="number" min="1" max="100" value={form.targetCount} onChange={(e) => setForm({ ...form, targetCount: e.target.value })} /></label>}
      <div className="form-row"><label>Срок<input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></label><label>Максимальный балл<input type="number" min="1" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} /></label></div>
      <label>Дополнительная ссылка<input type="url" value={form.materialUrl} onChange={(e) => setForm({ ...form, materialUrl: e.target.value })} /></label><button className="edu-button primary" disabled={saving}>{saving ? 'Назначаем…' : 'Назначить ученику'}</button>{notice && <p className="form-message">{notice}</p>}
    </form></section><section className="education-card"><h2>Задания ученика</h2><AssignmentRows assignments={(data?.assignments || []).filter((a) => a.student_id === studentId)} profiles={data?.profiles} progress={data?.progress} perspective="teacher" /></section></div>
  </WorkspaceFrame>;
}

function StudentDashboard() {
  const client = getCloudClient()!, [data, setData] = useState<StudentData | null>(null), [error, setError] = useState(''), [busyId, setBusyId] = useState('');
  const refresh = useCallback(async () => { setError(''); try { setData(await loadStudentWorkspace(client)); } catch (e) { setError((e as Error).message); } }, [client]);
  useAutoRefresh(refresh);
  const respond = async (invite: Invitation, accept: boolean) => { setBusyId(invite.id); try { await respondInvitation(client, invite.id, accept); await refresh(); } catch (e) { setError((e as Error).message); } finally { setBusyId(''); } };
  if (!data && !error) return <Busy role="student" />;
  const pending = data?.invitations.filter((i) => i.status === 'pending') || [];
  return <WorkspaceFrame role="student"><div className="education-heading"><div><span className="eyebrow">STUDENT SPACE</span><h1>Мои задания</h1><p>Сроки, ответы и комментарии учителя.</p></div><div className="education-notice"><Bell /><b>{data?.notifications.filter((n) => !n.read_at).length || 0}</b><span>новых событий</span></div></div>
    {error && <ErrorBox message={error} retry={() => void refresh()} />}
    {!!pending.length && <section className="education-card invitations"><h2>Приглашения</h2>{pending.map((invite) => <article key={invite.id}><div><b>{personName(data?.profiles.get(invite.teacher_id))}</b><p>Приглашает вас заниматься вместе.</p></div><div><button disabled={busyId === invite.id} onClick={() => void respond(invite, false)}>Отклонить</button><button className="edu-button primary" disabled={busyId === invite.id} onClick={() => void respond(invite, true)}>Принять</button></div></article>)}</section>}
    <section className="education-card"><div className="card-title"><div><h2>Назначенные задания</h2><p>Откройте карточку, чтобы увидеть цель и отправить ответ.</p></div><BookOpen /></div><AssignmentRows assignments={data?.assignments || []} progress={data?.progress} perspective="student" /></section><NotificationFeed items={data?.notifications || []} role="student" refresh={refresh} />
  </WorkspaceFrame>;
}

function AssignmentDetail({ id, role }: { id: string; role: 'teacher' | 'student' }) {
  const client = getCloudClient()!, { user } = useAccount(), [data, setData] = useState<DetailData | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [text, setText] = useState(''), [link, setLink] = useState(''), [reviewComment, setReviewComment] = useState(''), [chatComment, setChatComment] = useState(''), [score, setScore] = useState('');
  const refresh = useCallback(async () => { setError(''); try { const detail = await loadAssignmentDetail(client, id); if (role === 'student' && detail.assignment.student_id !== user?.id) throw new Error('Это задание не назначено вашему аккаунту.'); setData(detail); } catch (e) { setData(null); setError((e as Error).message); } }, [client, id, role, user?.id]);
  useAutoRefresh(refresh);
  const send = async (event: FormEvent) => { event.preventDefault(); setBusy(true); try { await submitAssignment(client, id, text, link); setText(''); setLink(''); await refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  const review = async (decision: Review['decision']) => { setBusy(true); try { await reviewAssignment(client, id, decision, score ? Number(score) : null, reviewComment); setReviewComment(''); await refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  const postComment = async (event: FormEvent) => { event.preventDefault(); if (!chatComment.trim()) return; setBusy(true); try { await addAssignmentComment(client, id, chatComment); setChatComment(''); await refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  if (!data && !error) return <Busy role={role} />;
  const assignment = data?.assignment;
  if (!assignment) return <WorkspaceFrame role={role}><ErrorBox message={error || 'Задание не найдено или недоступно.'} /></WorkspaceFrame>;
  const latest = data.submissions[0], latestReview = data.reviews[0];
  const focusContent = () => {
    if (role === 'student' && ['lesson', 'practice', 'dictation', 'music'].includes(assignment.content_type || ''))
      activateAssignmentTracking({ id: assignment.id, userId: assignment.student_id, type: assignment.content_type as 'lesson' | 'practice' | 'dictation' | 'music', contentId: assignment.content_id || 'all' });
    if (assignment.content_type === 'lesson' && assignment.content_id)
      { sessionStorage.setItem('ritmo-focus-lesson-id', assignment.content_id); sessionStorage.setItem('ritmo-assignment-fresh-lesson-id', assignment.content_id); }
    if (assignment.content_type === 'practice' && assignment.content_id)
      sessionStorage.setItem('ritmo-focus-practice-mode', assignment.content_id);
    if (assignment.content_type === 'practice' && assignment.topic_id)
      sessionStorage.setItem('ritmo-focus-practice-topic', assignment.topic_id);
    if (assignment.content_type === 'music' && assignment.content_title_snapshot)
      sessionStorage.setItem('ritmo-focus-song-title', assignment.content_title_snapshot.replace(/^Музыка:\s*/, ''));
  };
  return <WorkspaceFrame role={role}><a className="back-link" href={role === 'teacher' ? `/teacher/students/${assignment.student_id}` : '/student'}><ArrowLeft />Назад</a>
    <div className="education-heading assignment-heading"><div><span className={`assignment-status ${assignment.status}`}>{statusLabel[assignment.status]}</span><h1>{assignment.title}</h1><p>{assignment.description || 'Без дополнительного описания.'}</p></div><div className="education-notice"><Clock3 /><b>{dateText(assignment.due_at)}</b><span>срок выполнения</span></div></div>
    {error && <ErrorBox message={error} />}{data.progress && <section className="assignment-live-progress"><div><span>Выполнение</span><b>{data.progress.completed_count} из {data.progress.target_count}</b></div><i><span style={{ width: `${data.progress.progress_percent}%` }} /></i><div className="progress-facts"><span>{data.progress.progress_percent}% цели</span>{data.progress.answer_count > 0 && <span>{data.progress.correct_count} из {data.progress.answer_count} ответов верно</span>}{data.progress.earned_score > 0 && <span>{data.progress.earned_score} очков</span>}</div></section>}
    {role === 'student' && assignment.status === 'revision_requested' && latestReview && <aside className="revision-callout"><MessageCircle /><div><b>Преподаватель:</b><p>{latestReview.comment || 'Откройте работу и исправьте отмеченные ошибки.'}</p></div></aside>}
    {assignment.content_title_snapshot && <a className="content-reference" onClick={focusContent} href={`/#${assignment.content_type === 'lesson' ? 'lessons' : assignment.content_type}`}><BookOpen /><div><b>{assignment.content_title_snapshot}</b>{assignment.topic_title_snapshot && <small>Тема: {assignment.topic_title_snapshot}</small>}<span>{data.progress?.completed_count ? 'Продолжить с места остановки' : 'Начать выполнение'}</span></div></a>}{assignment.material_url && <a className="external-material" href={assignment.material_url} target="_blank" rel="noreferrer">Открыть дополнительный материал</a>}
    {!!data.questions.length && <QuestionThreads questions={data.questions} messages={data.questionMessages} userId={user?.id || ''} refresh={refresh} />}
    {role === 'teacher' && <AssignmentActivityPanel items={data.activity} />}
    <div className="education-columns"><section className="education-card"><h2>{role === 'student' ? 'Ваш ответ' : 'Последняя работа'}</h2>
      {latest && <article className="submission-box"><span>Попытка {latest.attempt} · {dateText(latest.submitted_at)}</span><p>{latest.text_answer || 'Текстовый ответ не добавлен.'}</p>{latest.link_url && <a href={latest.link_url} target="_blank" rel="noreferrer">Ссылка ученика</a>}</article>}
      {role === 'student' && assignment.metric_key !== 'manual' && ['assigned', 'revision_requested', 'overdue'].includes(assignment.status) && <p className="measured-assignment-note">Выполните назначенное количество сессий в учебном разделе. После этого работа отправится учителю автоматически.</p>}
      {role === 'student' && assignment.metric_key === 'manual' && ['assigned', 'revision_requested', 'overdue'].includes(assignment.status) && <form className="assignment-form" onSubmit={send}><label>Ответ<textarea required rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="Напишите выполненное задание…" /></label><label>Ссылка (необязательно)<input type="url" value={link} onChange={(e) => setLink(e.target.value)} /></label><button className="edu-button primary" disabled={busy}><Send />Отправить учителю</button></form>}
      {role === 'teacher' && assignment.status === 'submitted' && latest && <div className="review-form"><label>Оценка{assignment.max_score && <small> из {assignment.max_score}</small>}<input type="number" min="0" max={assignment.max_score || undefined} value={score} onChange={(e) => setScore(e.target.value)} /></label><label>Комментарий<textarea rows={4} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} /></label><div><button disabled={busy} onClick={() => void review('revision_requested')}>Вернуть на доработку</button><button className="edu-button primary" disabled={busy} onClick={() => void review('completed')}><Check />Завершить проверку</button></div></div>}
      {latestReview && <article className="review-box"><b>{latestReview.decision === 'completed' ? 'Работа принята' : 'Учитель просит доработать'}</b>{latestReview.score !== null && <strong>{latestReview.score}{assignment.max_score ? ` / ${assignment.max_score}` : ''}</strong>}<p>{latestReview.comment || 'Без комментария.'}</p></article>}
    </section><section className="education-card"><div className="card-title"><div><h2>Обсуждение</h2><p>Сообщения видны только вам и второй стороне.</p></div><MessageCircle /></div><div className="comment-list">{data.comments.map((item: AssignmentComment) => <article key={item.id} className={item.author_id === assignment.teacher_id ? 'teacher-comment' : ''}><p>{item.body}</p><span>{item.author_id === assignment.teacher_id ? 'Учитель' : 'Ученик'} · {dateText(item.created_at)}</span></article>)}{!data.comments.length && <p className="muted">Комментариев пока нет.</p>}</div><form className="comment-form" onSubmit={postComment}><textarea aria-label="Комментарий" rows={3} value={chatComment} onChange={(e) => setChatComment(e.target.value)} placeholder="Написать сообщение…" /><button className="edu-button" disabled={busy}>Отправить</button></form></section></div>
  </WorkspaceFrame>;
}

function QuestionThreads({ questions, messages, userId, refresh }: { questions: ExerciseQuestion[]; messages: DetailData['questionMessages']; userId: string; refresh: () => Promise<void> }) {
  const client = getCloudClient()!, [drafts, setDrafts] = useState<Record<string,string>>({}), [busy, setBusy] = useState('');
  const send = async (id: string) => { const body = drafts[id]?.trim(); if (!body || busy) return; setBusy(id); try { await replyToExerciseQuestion(client,id,body); setDrafts((value) => ({...value,[id]:''})); await refresh(); } finally { setBusy(''); } };
  return <section className="education-card question-threads"><div className="card-title"><div><h2>Вопросы по упражнениям</h2><p>Короткое обсуждение остаётся привязано к конкретному заданию.</p></div><MessageCircle /></div>{questions.map((question) => <details key={question.id} open={question.status === 'open'}><summary><span className={`question-state ${question.status}`}>{question.status === 'answered' ? 'Отвечено' : 'Ждёт ответа'}</span><b>{question.prompt}</b></summary><div className="question-messages">{messages.filter((item) => item.question_id === question.id).map((item) => <p className={item.author_id === userId ? 'mine' : ''} key={item.id}><span>{item.body}</span><small>{dateText(item.created_at)}</small></p>)}</div><div className="question-reply"><input value={drafts[question.id] || ''} onChange={(event) => setDrafts((value) => ({...value,[question.id]:event.target.value}))} placeholder="Ответить по этому упражнению" /><button disabled={busy === question.id || !drafts[question.id]?.trim()} onClick={() => void send(question.id)}>Отправить</button></div></details>)}</section>;
}

function AssignmentActivityPanel({ items }: { items: AssignmentActivity[] }) {
  const answers = items.filter((item) => item.event_kind === 'answer'), sessions = items.filter((item) => item.event_kind === 'session_complete'),
    errors = answers.filter((item) => !item.is_correct), correct = answers.length - errors.length;
  const sessionNumbers = new Map<string, number>(), attemptCounts = new Map<number, number>();
  [...answers].reverse().forEach((item) => {
    if (!item.session_id || sessionNumbers.has(item.session_id)) return;
    const next = (attemptCounts.get(item.attempt_no) || 0) + 1;
    attemptCounts.set(item.attempt_no, next); sessionNumbers.set(item.session_id, next);
  });
  const resolved = (error: AssignmentActivity) => answers.some((item) => item.is_correct && (error.item_key ? item.item_key === error.item_key : item.prompt === error.prompt) && item.occurred_at > error.occurred_at);
  const unresolvedCount = errors.filter((item) => !resolved(item)).length;
  return <section className="education-card assignment-activity-card">
    <div className="card-title"><div><h2>Конкретные ошибки ученика</h2><p>Здесь видны формулировка, введённый ответ и правильный вариант.</p></div><span className="activity-error-count">{unresolvedCount} требуют повторения</span></div>
    <div className="assignment-activity-summary"><span><b>{answers.length}</b> ответов</span><span><b>{sessions.length}</b> сессий</span><span><b>{correct}</b> верных</span><span><b>{answers.length ? Math.round(correct / answers.length * 100) : 0}%</b> точность</span></div>
    {!answers.length && <p className="muted">Ученик ещё не отвечал на задания в этой назначенной работе.</p>}
    {!!answers.length && !errors.length && <p className="activity-all-correct">✓ Ошибок пока нет — все записанные ответы верные.</p>}
    {!!errors.length && <div className="assignment-error-list">{errors.map((item) => <article key={item.event_id}>
      <header><span>{item.activity_type === 'lesson' ? 'Урок' : item.activity_type === 'practice' ? 'Практика' : item.activity_type === 'dictation' ? 'Диктант' : 'Музыка'} · попытка {item.attempt_no}{item.session_id ? ` · сессия ${sessionNumbers.get(item.session_id) || 1}` : ''}</span><time>{dateText(item.occurred_at)}</time></header>
      <h3>{item.prompt}</h3>
      <div><p><small>Ответ ученика</small><strong>{item.student_answer || 'Не знаю / пустой ответ'}</strong></p><p><small>Правильный ответ</small><strong>{item.correct_answer || 'Не указан'}</strong></p></div>
      <footer className={resolved(item) ? 'resolved' : 'pending'}>{resolved(item) ? '✓ Исправлено позже' : 'Нужно повторить'}</footer>
    </article>)}</div>}
  </section>;
}

export default function EducationWorkspace({ mode, id }: { mode: WorkspaceMode; id?: string }) {
  const { user, configured } = useAccount();
  const role = mode.startsWith('teacher') ? 'teacher' : 'student';
  const [roles, setRoles] = useState<Role[] | null>(null);
  useEffect(() => {
    const client = getCloudClient();
    if (!client || !user) { setRoles(null); return; }
    void loadMyRoles(client).then(setRoles).catch(() => setRoles([]));
  }, [user]);
  if (!configured || !user) return <EmptyAuth role={role} />;
  if (roles === null) return <Busy role={role} />;
  if (!roles.includes(role)) return role === 'teacher' ? <AccessDenied /> : <EmptyAuth role="student" />;
  if (mode === 'teacher') return <TeacherDashboard />;
  if (mode === 'student') return <StudentDashboard />;
  if (mode === 'teacher-student' && id) return <TeacherStudent studentId={id} />;
  if ((mode === 'teacher-assignment' || mode === 'student-assignment') && id) return <AssignmentDetail id={id} role={role} />;
  return <WorkspaceFrame role={role}><ErrorBox message="Страница не найдена." /></WorkspaceFrame>;
}
