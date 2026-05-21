import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppShell } from '../../components/AppShell';
import { apiFetch, downloadBlob, getApiBase, getToken } from '../../lib/api';

type Student = {
  id: number;
  fullName: string;
  birthDate?: string;
  gender?: string;
  disabilityType?: string;
  diagnosis?: string;
  status?: string;
  schoolId?: number;
  parentId?: number;
  rtiTier?: number;
  riskScore?: number;
};

type IepGoal = {
  id: number;
  planId: number;
  title: string;
  description?: string;
  targetPercentage: number;
  currentPercentage: number;
  status: string;
  teacherNotes?: string;
};

type IepPlan = {
  id: number;
  studentId: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  goals: IepGoal[];
};

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === 'done' || s === 'completed' || s === 'منجز') { return 'done'; }
  if (s === 'needs_review' || s === 'review') { return 'review'; }
  if (s === 'in_progress' || s === 'progress') { return 'progress'; }
  return 'pending';
}

function computeAge(birthDate?: string): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} سنة`;
}

function performanceLabel(percent: number): { label: string; color: string } {
  if (percent >= 90) return { label: 'ممتاز', color: '#6FCF97' };
  if (percent >= 75) return { label: 'جيد جداً', color: '#2F80ED' };
  if (percent >= 50) return { label: 'جيد', color: '#F2994A' };
  if (percent >= 25) return { label: 'مقبول', color: '#9B8AFB' };
  return { label: 'ضعيف', color: '#c0392b' };
}

function ProgressRing({ percent, size = 80, strokeWidth = 6, color = '#2F80ED' }: { percent: number; size?: number; strokeWidth?: number; color?: string }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={strokeWidth} />
        <circle className="ring-fg" cx={size / 2} cy={size / 2} r={r} style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: offset }} strokeWidth={strokeWidth} />
      </svg>
      <span className="ring-value" style={{ fontSize: '0.85rem' }}>{percent}%</span>
    </div>
  );
}

export default function StudentProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const studentId = Number(id);

  const [tab, setTab] = useState(0);
  const [student, setStudent] = useState<Student | null>(null);
  const [plans, setPlans] = useState<IepPlan[]>([]);
  const [error, setError] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [newPlanStart, setNewPlanStart] = useState('');
  const [newPlanEnd, setNewPlanEnd] = useState('');

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    if (!router.isReady || Number.isNaN(studentId)) { return; }
    Promise.all([
      apiFetch<Student>(`/students/${studentId}`),
      apiFetch<IepPlan[]>(`/iep/plans/student/${studentId}`),
    ])
      .then(([st, pl]) => {
        setStudent(st);
        setPlans(pl);
        setSelectedPlanId((prev) => {
          if (prev != null && pl.some((p) => p.id === prev)) { return prev; }
          return pl[0]?.id ?? null;
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'خطأ'));
  }, [router, router.isReady, studentId]);

  async function createPlan(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const plan = await apiFetch<IepPlan>('/iep/plans', {
        method: 'POST',
        body: JSON.stringify({ studentId, status: 'active', startDate: newPlanStart || undefined, endDate: newPlanEnd || undefined }),
      });
      setNewPlanStart(''); setNewPlanEnd('');
      const pl = await apiFetch<IepPlan[]>(`/iep/plans/student/${studentId}`);
      setPlans(pl);
      setSelectedPlanId(plan.id);
    } catch (err) { setError(err instanceof Error ? err.message : 'فشل إنشاء الخطة'); }
  }

  async function addGoal(e: FormEvent) {
    e.preventDefault();
    if (!goalTitle.trim() || !selectedPlanId) { return; }
    setError('');
    try {
      await apiFetch<IepGoal>('/iep/goals', {
        method: 'POST',
        body: JSON.stringify({ planId: selectedPlanId, title: goalTitle.trim(), status: 'in_progress', currentPercentage: 0, targetPercentage: 100 }),
      });
      setGoalTitle('');
      const pl = await apiFetch<IepPlan[]>(`/iep/plans/student/${studentId}`);
      setPlans(pl);
    } catch (err) { setError(err instanceof Error ? err.message : 'فشل الإضافة'); }
  }

  async function patchGoal(goal: IepGoal, patch: Partial<IepGoal>) {
    setError('');
    try {
      await apiFetch(`/iep/goals/${goal.id}`, { method: 'PUT', body: JSON.stringify({ ...patch, planId: goal.planId }) });
      const pl = await apiFetch<IepPlan[]>(`/iep/plans/student/${studentId}`);
      setPlans(pl);
    } catch (err) { setError(err instanceof Error ? err.message : 'فشل الحفظ'); }
  }

  if (!getToken()) { return null; }
  if (!router.isReady || Number.isNaN(studentId)) {
    return (<AppShell title="ملف الطالب"><p className="muted">…</p></AppShell>);
  }

  const goals = plans.flatMap((p) => p.goals || []);
  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((a, g) => a + (g.currentPercentage || 0), 0) / goals.length) : 0;

  return (
    <AppShell title={student ? student.fullName : 'ملف الطالب'}>
      {error ? <p className="error">{error}</p> : null}
      {!student ? (
        <p className="muted">جاري التحميل…</p>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="profile-header">
              <div className="profile-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="profile-info">
                <h2>{student.fullName}</h2>
                <p>
                  {[student.disabilityType ? `نوع الإعاقة: ${student.disabilityType}` : '', student.diagnosis ? `تشخيص: ${student.diagnosis}` : '', student.status || ''].filter(Boolean).join(' — ')}
                </p>
                <p className="profile-age">{computeAge(student.birthDate)}</p>
              </div>
            </div>
          </div>

          <div className="tabs">
            <button type="button" className={tab === 0 ? 'active' : ''} onClick={() => setTab(0)}>المعلومات العامة</button>
            <button type="button" className={tab === 1 ? 'active' : ''} onClick={() => setTab(1)}>خطة IEP</button>
            <button type="button" className={tab === 2 ? 'active' : ''} onClick={() => setTab(2)}>مؤشر التطور</button>
            <Link href={`/students/behavior/${studentId}`} className="btn btn-ghost btn-sm">سلوكي</Link>
            <Link href={`/students/rti/${studentId}`} className="btn btn-ghost btn-sm">RTI</Link>
            <Link href={`/students/fba/${studentId}`} className="btn btn-ghost btn-sm">FBA</Link>
            <Link href={`/students/abc/${studentId}`} className="btn btn-ghost btn-sm">ABC</Link>
            <Link href={`/students/early-warning/${studentId}`} className="btn btn-ghost btn-sm">إنذار مبكر</Link>
            <Link href={`/students/${studentId}/edit`} className="btn btn-ghost btn-sm">تعديل</Link>
            <Link href={`/students/${studentId}/export`} className="btn btn-ghost btn-sm" onClick={(e) => {
              e.preventDefault();
              const token = getToken();
              if (!token) return;
              fetch(`${getApiBase()}/students/${studentId}/export`, { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => r.blob()).then((blob) => downloadBlob(blob, `student-${studentId}-export.json`));
            }}>تصدير</Link>
          </div>

          {tab === 0 ? (
            <div className="card">
              <table>
                <tbody>
                  <tr><th>تاريخ الميلاد</th><td>{student.birthDate || '—'}</td></tr>
                  <tr><th>العمر</th><td>{computeAge(student.birthDate)}</td></tr>
                  <tr><th>الجنس</th><td>{student.gender || '—'}</td></tr>
                  <tr><th>الحالة</th><td>{student.status || '—'}</td></tr>
                  <tr><th>معرّف المدرسة</th><td>{student.schoolId ?? '—'}</td></tr>
                  <tr><th>ولي الأمر (معرّف)</th><td>{student.parentId ?? '—'}</td></tr>
                  <tr><th>مستوى RTI</th><td>{student.rtiTier ?? '—'}</td></tr>
                  <tr><th>درجة المخاطر</th><td>{student.riskScore ?? 0}</td></tr>
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 1 ? (
            <div className="card">
              {plans.length === 0 ? (
                <div>
                  <p className="muted">لا توجد خطة IEP لهذا الطالب. يمكنك إنشاء خطة من هنا:</p>
                  <form onSubmit={createPlan} style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0, minWidth: '140px' }}>
                      <label>بداية</label>
                      <input type="date" className="input" value={newPlanStart} onChange={(ev) => setNewPlanStart(ev.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0, minWidth: '140px' }}>
                      <label>نهاية</label>
                      <input type="date" className="input" value={newPlanEnd} onChange={(ev) => setNewPlanEnd(ev.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary">إنشاء خطة</button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>الخطة المستهدفة لإضافة هدف</label>
                    <select className="input" value={selectedPlanId ?? ''} onChange={(ev) => setSelectedPlanId(Number(ev.target.value))}>
                      {plans.map((p) => (<option key={p.id} value={p.id}>خطة #{p.id} {p.status ? `(${p.status})` : ''}</option>))}
                    </select>
                  </div>
                  <form onSubmit={addGoal} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    <input className="input" style={{ flex: 1, minWidth: '200px' }} placeholder="عنوان الهدف الجديد" value={goalTitle} onChange={(ev) => setGoalTitle(ev.target.value)} />
                    <button type="submit" className="btn btn-primary">إضافة هدف</button>
                  </form>
                  <table>
                    <thead>
                      <tr><th>الهدف</th><th>التقدم</th><th>الحالة</th><th>إجراءات</th></tr>
                    </thead>
                    <tbody>
                      {goals.map((g) => (
                        <tr key={g.id}>
                          <td>{g.title}</td>
                          <td>
                            <input type="number" min={0} max={100} className="input" style={{ maxWidth: '80px', display: 'inline' }}
                              key={`${g.id}-${g.currentPercentage}`} defaultValue={g.currentPercentage}
                              onBlur={(ev) => { const v = Number(ev.target.value); if (!Number.isNaN(v) && v !== g.currentPercentage) { patchGoal(g, { currentPercentage: v }); } }} />
                            %
                          </td>
                          <td><span className={`pill ${statusClass(g.status)}`}>{g.status}</span></td>
                          <td className="flex-row">
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => patchGoal(g, { status: 'done' })}>تم</button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => patchGoal(g, { status: 'needs_review' })}>مراجعة</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          ) : null}

          {tab === 2 ? (
            <div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.25rem' }}>
                <ProgressRing percent={avgProgress} color="#2F80ED" size={120} strokeWidth={8} />
                <div>
                  <h3 style={{ margin: 0 }}>متوسط تقدم الأهداف</h3>
                  <p className="muted" style={{ marginTop: '0.5rem' }}>
                    يُحسب كمتوسط قيمة «التقدم الحالي» لجميع أهداف IEP المرتبطة بالطالب.
                  </p>
                  <div style={{ marginTop: '0.75rem' }}>
                    <span className="pill" style={{
                      background: `${performanceLabel(avgProgress).color}22`,
                      color: performanceLabel(avgProgress).color,
                      fontSize: '0.9rem', padding: '0.3rem 0.9rem'
                    }}>
                      مستوى الأداء: {performanceLabel(avgProgress).label}
                    </span>
                  </div>
                </div>
              </div>

              {goals.length > 0 ? (
                <div className="card">
                  <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>خط التطور</h3>
                  <div className="dev-timeline">
                    {goals.map((g, i) => {
                      const perf = performanceLabel(g.currentPercentage || 0);
                      return (
                        <div key={g.id} className="dev-milestone">
                          <div className="dev-line" />
                          <div className="dev-node" style={{ background: perf.color }} />
                          <div className="dev-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong>{g.title}</strong>
                              <span className="pill" style={{
                                background: `${perf.color}18`,
                                color: perf.color,
                                fontSize: '0.75rem'
                              }}>{perf.label}</span>
                            </div>
                            <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.85rem' }}>
                              {g.currentPercentage}% / {g.targetPercentage}% — {g.status}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="card">
                  <p className="muted">لا توجد أهداف بعد. أضف أهدافاً من تبويب خطة IEP.</p>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </AppShell>
  );
}