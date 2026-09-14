'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Bell, BookOpen, Check, Clock3, GraduationCap, LoaderCircle, Mail, MessageCircle, Send, UserPlus, Users } from 'lucide-react';
import { useAccount } from './account-provider';
import { getCloudClient } from '../lib/cloud-progress';
import { courseLessons } from '../lessons';
import {
  addAssignmentComment, createAssignment, ensureRole, inviteStudent, loadAssignmentDetail,
  loadStudentLearningSummary, loadStudentWorkspace, loadTeacherWorkspace, markNotificationRead, respondInvitation, reviewAssignment, submitAssignment,
  type AppNotification, type Assignment, type AssignmentComment, type Invitation, type Profile, type Review,
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

function Busy({ role }: { role: 'teacher' | 'student' }) {
  return <WorkspaceFrame role={role}><section className="education-empty"><LoaderCircle className="spin" /><p>Загружаем кабинет…</p></section></WorkspaceFrame>;
}

function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="education-error" role="alert"><b>Не удалось загрузить данные</b><span>{message}</span>{retry && <button onClick={retry}>Повторить</button>}</div>;
}

function NotificationFeed({ items, role, refresh }: { items: AppNotification[]; role: 'teacher' | 'student'; refresh: () => Promise<void> }) {
  if (!items.length) return null;
  const client = getCloudClient()!;
  return <details className="notification-feed"><summary><Bell /><b>Уведомления</b><span>{items.filter((item) => !item.read_at).length} новых</span></summary><div>{items.slice(0, 10).map((item) => <article className={item.read_at ? '' : 'unread'} key={item.id}><div><b>{item.title}</b><p>{item.body}</p><small>{dateText(item.created_at)}</small></div>{item.entity_type === 'assignment' && item.entity_id && <a href={`/${role}/assignments/${item.entity_id}`}>Открыть</a>}{!item.read_at && <button aria-label="Отметить прочитанным" onClick={() => void markNotificationRead(client, item.id).then(refresh)}><Check /></button>}</article>)}</div></details>;
}

function AssignmentRows({ assignments, profiles, perspective }: { assignments: Assignment[]; profiles?: Map<string, Profile>; perspective: 'teacher' | 'student' }) {
  if (!assignments.length) return <div className="education-empty compact"><BookOpen /><p>Заданий пока нет.</p></div>;
  return <div className="assignment-list">{assignments.map((item) => {
    const overdue = item.due_at && new Date(item.due_at) < new Date() && !['completed', 'submitted'].includes(item.status);
    return <a key={item.id} className="assignment-row" href={`/${perspective}/assignments/${item.id}`}>
      <div><span className={`assignment-status ${overdue ? 'overdue' : item.status}`}>{overdue ? 'Просрочено' : statusLabel[item.status]}</span><h3>{item.title}</h3>
        {perspective === 'teacher' && <p>{personName(profiles?.get(item.student_id))}</p>}</div>
      <div className="assignment-meta"><span><Clock3 />{dateText(item.due_at)}</span>{item.content_title_snapshot && <span><BookOpen />{item.content_title_snapshot}</span>}</div>
    </a>;
  })}</div>;
}

function TeacherDashboard() {
  const client = getCloudClient()!;
  const [data, setData] = useState<TeacherData | null>(null), [error, setError] = useState(''), [email, setEmail] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => { setError(''); try { await ensureRole(client, 'teacher'); setData(await loadTeacherWorkspace(client)); } catch (e) { setError((e as Error).message); } }, [client]);
  useEffect(() => { void refresh(); }, [refresh]);
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
      <section className="education-card"><div className="card-title"><div><h2>Последние задания</h2><p>Сначала показаны работы, ожидающие проверки.</p></div><BookOpen /></div><AssignmentRows assignments={[...(data?.assignments || [])].sort((a, b) => Number(b.status === 'submitted') - Number(a.status === 'submitted'))} profiles={data?.profiles} perspective="teacher" /></section>
    </div><NotificationFeed items={data?.notifications || []} role="teacher" refresh={refresh} />
  </WorkspaceFrame>;
}

function TeacherStudent({ studentId }: { studentId: string }) {
  const client = getCloudClient()!, [data, setData] = useState<TeacherData | null>(null), [summary, setSummary] = useState<Awaited<ReturnType<typeof loadStudentLearningSummary>> | null>(null), [error, setError] = useState(''), [saving, setSaving] = useState(false), [notice, setNotice] = useState('');
  const [form, setForm] = useState({ title: '', description: '', type: 'manual' as Assignment['assignment_type'], dueAt: '', maxScore: '10', materialUrl: '', contentId: '' });
  const refresh = useCallback(async () => { try { await ensureRole(client, 'teacher'); const workspace = await loadTeacherWorkspace(client); setData(workspace); if (workspace.relationships.some((r) => r.student_id === studentId)) setSummary(await loadStudentLearningSummary(client, studentId)); } catch (e) { setError((e as Error).message); } }, [client, studentId]);
  useEffect(() => { void refresh(); }, [refresh]);
  const linked = data?.relationships.some((r) => r.student_id === studentId);
  const contentOptions = useMemo(() => [
    ...courseLessons.map((lesson) => ({ id: lesson.id, type: 'lesson' as const, title: `Урок: ${lesson.title}` })),
    { id: 'adaptive-words', type: 'practice' as const, title: 'Practice: учить слова' },
    { id: 'learned-words', type: 'dictation' as const, title: 'Диктант по изученным словам' },
    { id: 'azul', type: 'music' as const, title: 'Музыка: Azul' },
    { id: 'veneno', type: 'music' as const, title: 'Музыка: Veneno' },
    { id: 'mayores', type: 'music' as const, title: 'Музыка: Mayores' },
    { id: 'entre-nosotros', type: 'music' as const, title: 'Музыка: Entre Nosotros' },
  ], []);
  const save = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setNotice(''); try {
    const selected = contentOptions.find((o) => o.id === form.contentId);
    await createAssignment(client, { studentId, title: form.title, description: form.description, type: selected?.type || form.type, dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined, maxScore: Number(form.maxScore) || undefined, materialUrl: form.materialUrl, contentType: selected?.type, contentId: selected?.id, contentTitle: selected?.title });
    setForm({ title: '', description: '', type: 'manual', dueAt: '', maxScore: '10', materialUrl: '', contentId: '' }); setNotice('Задание назначено.'); await refresh();
  } catch (e) { setNotice((e as Error).message); } finally { setSaving(false); } };
  if (!data && !error) return <Busy role="teacher" />;
  if (!linked) return <WorkspaceFrame role="teacher"><a className="back-link" href="/teacher"><ArrowLeft />К ученикам</a><ErrorBox message={error || 'Этот ученик не связан с вашим аккаунтом.'} /></WorkspaceFrame>;
  const profile = data?.profiles.get(studentId);
  return <WorkspaceFrame role="teacher"><a className="back-link" href="/teacher"><ArrowLeft />К ученикам</a><div className="education-heading"><div><span className="eyebrow">УЧЕНИК</span><h1>{personName(profile)}</h1><p>{profile?.email}</p></div></div>
    {summary && <section className="education-grid stats-grid student-learning-stats"><article><GraduationCap /><b>{summary.level}</b><span>уровень · {summary.xp} XP</span></article><article><BookOpen /><b>{summary.completedLessons}</b><span>уроков завершено</span></article><article><Check /><b>{summary.totalReviews ? Math.round(summary.totalCorrect / summary.totalReviews * 100) : 0}%</b><span>{summary.totalReviews} ответов · серия {summary.streak}</span></article></section>}
    <div className="education-columns"><section className="education-card"><h2>Новое задание</h2><form className="assignment-form" onSubmit={save}>
      <label>Название<input required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label>Описание<textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <label>Материал курса<select value={form.contentId} onChange={(e) => setForm({ ...form, contentId: e.target.value })}><option value="">Без привязки</option>{contentOptions.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</select></label>
      <div className="form-row"><label>Срок<input type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></label><label>Максимальный балл<input type="number" min="1" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} /></label></div>
      <label>Дополнительная ссылка<input type="url" value={form.materialUrl} onChange={(e) => setForm({ ...form, materialUrl: e.target.value })} /></label><button className="edu-button primary" disabled={saving}>{saving ? 'Назначаем…' : 'Назначить ученику'}</button>{notice && <p className="form-message">{notice}</p>}
    </form></section><section className="education-card"><h2>Задания ученика</h2><AssignmentRows assignments={(data?.assignments || []).filter((a) => a.student_id === studentId)} profiles={data?.profiles} perspective="teacher" /></section></div>
  </WorkspaceFrame>;
}

function StudentDashboard() {
  const client = getCloudClient()!, [data, setData] = useState<StudentData | null>(null), [error, setError] = useState(''), [busyId, setBusyId] = useState('');
  const refresh = useCallback(async () => { setError(''); try { await ensureRole(client, 'student'); setData(await loadStudentWorkspace(client)); } catch (e) { setError((e as Error).message); } }, [client]);
  useEffect(() => { void refresh(); }, [refresh]);
  const respond = async (invite: Invitation, accept: boolean) => { setBusyId(invite.id); try { await respondInvitation(client, invite.id, accept); await refresh(); } catch (e) { setError((e as Error).message); } finally { setBusyId(''); } };
  if (!data && !error) return <Busy role="student" />;
  const pending = data?.invitations.filter((i) => i.status === 'pending') || [];
  return <WorkspaceFrame role="student"><div className="education-heading"><div><span className="eyebrow">STUDENT SPACE</span><h1>Мои задания</h1><p>Сроки, ответы и комментарии учителя.</p></div><div className="education-notice"><Bell /><b>{data?.notifications.filter((n) => !n.read_at).length || 0}</b><span>новых событий</span></div></div>
    {error && <ErrorBox message={error} retry={() => void refresh()} />}
    {!!pending.length && <section className="education-card invitations"><h2>Приглашения</h2>{pending.map((invite) => <article key={invite.id}><div><b>{personName(data?.profiles.get(invite.teacher_id))}</b><p>Приглашает вас заниматься вместе.</p></div><div><button disabled={busyId === invite.id} onClick={() => void respond(invite, false)}>Отклонить</button><button className="edu-button primary" disabled={busyId === invite.id} onClick={() => void respond(invite, true)}>Принять</button></div></article>)}</section>}
    <section className="education-card"><div className="card-title"><div><h2>Назначенные задания</h2><p>Откройте карточку, чтобы отправить ответ.</p></div><BookOpen /></div><AssignmentRows assignments={data?.assignments || []} perspective="student" /></section><NotificationFeed items={data?.notifications || []} role="student" refresh={refresh} />
  </WorkspaceFrame>;
}

function AssignmentDetail({ id, role }: { id: string; role: 'teacher' | 'student' }) {
  const client = getCloudClient()!, [data, setData] = useState<DetailData | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [text, setText] = useState(''), [link, setLink] = useState(''), [reviewComment, setReviewComment] = useState(''), [chatComment, setChatComment] = useState(''), [score, setScore] = useState('');
  const refresh = useCallback(async () => { setError(''); try { await ensureRole(client, role); setData(await loadAssignmentDetail(client, id)); } catch (e) { setError((e as Error).message); } }, [client, id, role]);
  useEffect(() => { void refresh(); }, [refresh]);
  const send = async (event: FormEvent) => { event.preventDefault(); setBusy(true); try { await submitAssignment(client, id, text, link); setText(''); setLink(''); await refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  const review = async (decision: Review['decision']) => { setBusy(true); try { await reviewAssignment(client, id, decision, score ? Number(score) : null, reviewComment); setReviewComment(''); await refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  const postComment = async (event: FormEvent) => { event.preventDefault(); if (!chatComment.trim()) return; setBusy(true); try { await addAssignmentComment(client, id, chatComment); setChatComment(''); await refresh(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  if (!data && !error) return <Busy role={role} />;
  const assignment = data?.assignment;
  if (!assignment) return <WorkspaceFrame role={role}><ErrorBox message={error || 'Задание не найдено или недоступно.'} /></WorkspaceFrame>;
  const latest = data.submissions[0], latestReview = data.reviews[0];
  return <WorkspaceFrame role={role}><a className="back-link" href={role === 'teacher' ? `/teacher/students/${assignment.student_id}` : '/student'}><ArrowLeft />Назад</a>
    <div className="education-heading assignment-heading"><div><span className={`assignment-status ${assignment.status}`}>{statusLabel[assignment.status]}</span><h1>{assignment.title}</h1><p>{assignment.description || 'Без дополнительного описания.'}</p></div><div className="education-notice"><Clock3 /><b>{dateText(assignment.due_at)}</b><span>срок выполнения</span></div></div>
    {error && <ErrorBox message={error} />}{assignment.content_title_snapshot && <a className="content-reference" href={`/#${assignment.content_type === 'lesson' ? 'lessons' : assignment.content_type}`}><BookOpen /><div><b>{assignment.content_title_snapshot}</b><span>Открыть материал курса</span></div></a>}{assignment.material_url && <a className="external-material" href={assignment.material_url} target="_blank" rel="noreferrer">Открыть дополнительный материал</a>}
    <div className="education-columns"><section className="education-card"><h2>{role === 'student' ? 'Ваш ответ' : 'Последняя работа'}</h2>
      {latest && <article className="submission-box"><span>Попытка {latest.attempt} · {dateText(latest.submitted_at)}</span><p>{latest.text_answer || 'Текстовый ответ не добавлен.'}</p>{latest.link_url && <a href={latest.link_url} target="_blank" rel="noreferrer">Ссылка ученика</a>}</article>}
      {role === 'student' && ['assigned', 'revision_requested', 'overdue'].includes(assignment.status) && <form className="assignment-form" onSubmit={send}><label>Ответ<textarea required rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="Напишите выполненное задание…" /></label><label>Ссылка (необязательно)<input type="url" value={link} onChange={(e) => setLink(e.target.value)} /></label><button className="edu-button primary" disabled={busy}><Send />Отправить учителю</button></form>}
      {role === 'teacher' && assignment.status === 'submitted' && latest && <div className="review-form"><label>Оценка{assignment.max_score && <small> из {assignment.max_score}</small>}<input type="number" min="0" max={assignment.max_score || undefined} value={score} onChange={(e) => setScore(e.target.value)} /></label><label>Комментарий<textarea rows={4} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} /></label><div><button disabled={busy} onClick={() => void review('revision_requested')}>Вернуть на доработку</button><button className="edu-button primary" disabled={busy} onClick={() => void review('completed')}><Check />Завершить проверку</button></div></div>}
      {latestReview && <article className="review-box"><b>{latestReview.decision === 'completed' ? 'Работа принята' : 'Учитель просит доработать'}</b>{latestReview.score !== null && <strong>{latestReview.score}{assignment.max_score ? ` / ${assignment.max_score}` : ''}</strong>}<p>{latestReview.comment || 'Без комментария.'}</p></article>}
    </section><section className="education-card"><div className="card-title"><div><h2>Обсуждение</h2><p>Сообщения видны только вам и второй стороне.</p></div><MessageCircle /></div><div className="comment-list">{data.comments.map((item: AssignmentComment) => <article key={item.id} className={item.author_id === assignment.teacher_id ? 'teacher-comment' : ''}><p>{item.body}</p><span>{item.author_id === assignment.teacher_id ? 'Учитель' : 'Ученик'} · {dateText(item.created_at)}</span></article>)}{!data.comments.length && <p className="muted">Комментариев пока нет.</p>}</div><form className="comment-form" onSubmit={postComment}><textarea aria-label="Комментарий" rows={3} value={chatComment} onChange={(e) => setChatComment(e.target.value)} placeholder="Написать сообщение…" /><button className="edu-button" disabled={busy}>Отправить</button></form></section></div>
  </WorkspaceFrame>;
}

export default function EducationWorkspace({ mode, id }: { mode: WorkspaceMode; id?: string }) {
  const { user, configured } = useAccount();
  const role = mode.startsWith('teacher') ? 'teacher' : 'student';
  if (!configured || !user) return <EmptyAuth role={role} />;
  if (mode === 'teacher') return <TeacherDashboard />;
  if (mode === 'student') return <StudentDashboard />;
  if (mode === 'teacher-student' && id) return <TeacherStudent studentId={id} />;
  if ((mode === 'teacher-assignment' || mode === 'student-assignment') && id) return <AssignmentDetail id={id} role={role} />;
  return <WorkspaceFrame role={role}><ErrorBox message="Страница не найдена." /></WorkspaceFrame>;
}
