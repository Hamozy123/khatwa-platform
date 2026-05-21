import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppShell } from '../../../components/AppShell';
import { EmptyState } from '../../../components/EmptyState';
import { apiFetch, getToken } from '../../../lib/api';

type RiskEvent = {
  id: number;
  studentId: number;
  indicator: string;
  value: number;
  weightedScore: number;
  flagged: boolean;
  notes: string;
  createdAt: string;
};

const INDICATOR_LABELS: Record<string, string> = {
  absenteeism: 'الغياب',
  behavior_incidents: 'حوادث سلوكية',
  academic_score: 'انخفاض درجات',
  iep_goal_stagnation: 'ركود تقدم IEP',
  suspension_days: 'أيام الإيقاف',
  referrals: 'إحالات الدعم',
};

type StudentInfo = { fullName: string; riskScore?: number };

export default function EarlyWarningPage() {
  const router = useRouter();
  const { id } = router.query;
  const studentId = Number(id);
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [studentName, setStudentName] = useState('');
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [error, setError] = useState('');
  const [indicator, setIndicator] = useState('absenteeism');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    if (!router.isReady || Number.isNaN(studentId)) return;
    Promise.all([
      apiFetch(`/students/${studentId}`),
      apiFetch<RiskEvent[]>(`/early-warning/events/student/${studentId}`),
    ])
      .then(([s, ev]) => { setStudent(s as StudentInfo); setStudentName((s as StudentInfo).fullName); setEvents(ev); })
      .catch((e) => setError(e.message));
  }, [router, router.isReady, studentId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value) return;
    setError('');
    try {
      await apiFetch('/early-warning/events', {
        method: 'POST',
        body: JSON.stringify({ studentId, indicator, value: Number(value), notes: notes || undefined }),
      });
      setValue(''); setNotes('');
      const data = await apiFetch<RiskEvent[]>(`/early-warning/events/student/${studentId}`);
      setEvents(data);
    } catch (e: any) { setError(e.message); }
  }

  if (!getToken()) return null;
  if (!router.isReady || Number.isNaN(studentId)) {
    return <AppShell title="الإنذار المبكر"><p className="muted">…</p></AppShell>;
  }

  const flaggedCount = events.filter((e) => e.flagged).length;

  return (
    <AppShell title={`نظام الإنذار المبكر - ${studentName}`}>
      <p className="muted"><Link href={`/students/${studentId}`}>العودة لملف الطالب</Link></p>
      {error ? <p className="error">{error}</p> : null}

      {student ? (
        <div className="card-grid" style={{ marginBottom: '1rem' }}>
          <div className="card">
            <h3>درجة المخاطر</h3>
            <div className="stat-value" style={{ color: student.riskScore && student.riskScore > 50 ? '#c0392b' : student.riskScore && student.riskScore > 20 ? '#F2994A' : '#6FCF97' }}>
              {student.riskScore ?? 0}
            </div>
          </div>
          <div className="card">
            <h3>مؤشرات مقلقة</h3>
            <div className="stat-value" style={{ color: '#c0392b' }}>{flaggedCount}</div>
          </div>
          <div className="card">
            <h3>إجمالي الأحداث</h3>
            <div className="stat-value">{events.length}</div>
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>تسجيل مؤشر خطر</h3>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, minWidth: '160px' }}>
            <label>المؤشر</label>
            <select className="input" value={indicator} onChange={(e) => setIndicator(e.target.value)}>
              {Object.entries(INDICATOR_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: '100px' }}>
            <label>القيمة</label>
            <input type="number" className="input" value={value} onChange={(e) => setValue(e.target.value)} required />
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: '160px', flex: 1 }}>
            <label>ملاحظات</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary">تسجيل</button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>سجل المؤشرات</h3>
        {events.length === 0 ? (
          <EmptyState message="لا توجد أحداث مسجلة." />
        ) : (
          <table>
            <thead><tr><th>التاريخ</th><th>المؤشر</th><th>القيمة</th><th>الوزن</th><th>الحالة</th><th>ملاحظات</th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} style={e.flagged ? { background: 'rgba(192,57,43,0.05)' } : {}}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(e.createdAt).toLocaleDateString('ar-EG')}</td>
                  <td>{INDICATOR_LABELS[e.indicator] || e.indicator}</td>
                  <td>{e.value}</td>
                  <td>{e.weightedScore}</td>
                  <td>{e.flagged ? <span className="pill" style={{ background: '#c0392b22', color: '#c0392b' }}>مقلق</span> : <span className="pill" style={{ background: '#6FCF9722', color: '#27ae60' }}>طبيعي</span>}</td>
                  <td>{e.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
