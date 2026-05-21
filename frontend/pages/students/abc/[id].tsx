import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppShell } from '../../../components/AppShell';
import { EmptyState } from '../../../components/EmptyState';
import { apiFetch, getToken } from '../../../lib/api';

type AbcRecord = {
  id: number;
  studentId: number;
  antecedent: string;
  behavior: string;
  consequence: string;
  date: string;
  time: string;
  location: string;
  notes: string;
};

type TrendData = {
  totalRecords: number;
  behaviorFrequency: Record<string, number>;
  locationFrequency: Record<string, number>;
  antecedentFrequency: Record<string, number>;
};

export default function AbcPage() {
  const router = useRouter();
  const { id } = router.query;
  const studentId = Number(id);
  const [records, setRecords] = useState<AbcRecord[]>([]);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [antecedent, setAntecedent] = useState('');
  const [behavior, setBehavior] = useState('');
  const [consequence, setConsequence] = useState('');
  const [location, setLocation] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    if (!router.isReady || Number.isNaN(studentId)) return;
    apiFetch<{ fullName: string }>(`/students/${studentId}`)
      .then((s) => setStudentName(s.fullName)).catch((e) => console.warn('ABC: failed to load student name', e));
    apiFetch<AbcRecord[]>(`/abc/student/${studentId}`)
      .then(setRecords).catch((e) => setError(e.message));
    apiFetch<TrendData>(`/abc/trend/${studentId}`)
      .then(setTrend).catch(() => {});
  }, [router, router.isReady, studentId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!antecedent.trim() || !behavior.trim() || !consequence.trim()) return;
    setError('');
    try {
      await apiFetch('/abc', {
        method: 'POST',
        body: JSON.stringify({
          studentId, antecedent: antecedent.trim(), behavior: behavior.trim(),
          consequence: consequence.trim(), location: location.trim() || undefined,
          date: new Date().toLocaleDateString('en-CA'), time: new Date().toLocaleTimeString('en-GB'),
        }),
      });
      setAntecedent(''); setBehavior(''); setConsequence(''); setLocation('');
      const [r, t] = await Promise.all([
        apiFetch<AbcRecord[]>(`/abc/student/${studentId}`),
        apiFetch<TrendData>(`/abc/trend/${studentId}`),
      ]);
      setRecords(r); setTrend(t);
    } catch (e: any) { setError(e.message); }
  }

  if (!getToken()) return null;
  if (!router.isReady || Number.isNaN(studentId)) {
    return <AppShell title="ABC"><p className="muted">…</p></AppShell>;
  }

  return (
    <AppShell title={`سجل ABC - ${studentName}`}>
      <p className="muted"><Link href={`/students/${studentId}`}>العودة لملف الطالب</Link></p>
      {error ? <p className="error">{error}</p> : null}

      <div className="tabs">
        <button type="button" className={tab === 0 ? 'active' : ''} onClick={() => setTab(0)}>تسجيل جديد</button>
        <button type="button" className={tab === 1 ? 'active' : ''} onClick={() => setTab(1)}>السجل ({records.length})</button>
        <button type="button" className={tab === 2 ? 'active' : ''} onClick={() => setTab(2)}>التحليلات</button>
      </div>

      {tab === 0 ? (
        <div className="card">
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>المحفز (Antecedent)</label>
              <textarea className="input" rows={2} value={antecedent} onChange={(e) => setAntecedent(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>السلوك (Behavior)</label>
              <textarea className="input" rows={2} value={behavior} onChange={(e) => setBehavior(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>النتيجة (Consequence)</label>
              <textarea className="input" rows={2} value={consequence} onChange={(e) => setConsequence(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>الموقع</label>
              <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="مثال: فصل، ملعب..." />
            </div>
            <button type="submit" className="btn btn-primary">تسجيل</button>
          </form>
        </div>
      ) : null}

      {tab === 1 ? (
        <div className="card" style={{ overflowX: 'auto' }}>
          {records.length === 0 ? <EmptyState message="لا توجد سجلات." /> : (
            <table>
              <thead><tr><th>التاريخ</th><th>A</th><th>B</th><th>C</th><th>الموقع</th></tr></thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.date || '—'}</td>
                    <td>{r.antecedent}</td>
                    <td>{r.behavior}</td>
                    <td>{r.consequence}</td>
                    <td>{r.location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {tab === 2 ? (
        !trend || Object.keys(trend.behaviorFrequency).length === 0 ? (
          <div className="card"><EmptyState title="لا توجد بيانات كافية" message="سجل ملاحظات ABC لبدء التحليلات." /></div>
        ) : (
          <div className="card-grid">
            <div className="card">
              <h3>السلوكيات الأكثر تكراراً</h3>
              {Object.entries(trend.behaviorFrequency)
                .sort((a, b) => b[1] - a[1]).slice(0, 5)
                .map(([beh, count]) => (
                  <div key={beh} className="bar-row">
                    <span>{beh}</span>
                    <div className="bar"><span style={{ width: `${(count / Math.max(1, ...Object.values(trend.behaviorFrequency))) * 100}%` }} /></div>
                    <span>{count}</span>
                  </div>
                ))}
            </div>
            <div className="card">
              <h3>المحفزات الأكثر تكراراً</h3>
              {Object.entries(trend.antecedentFrequency)
                .sort((a, b) => b[1] - a[1]).slice(0, 5)
                .map(([ant, count]) => (
                  <div key={ant} className="bar-row">
                    <span>{ant}</span>
                    <div className="bar"><span style={{ width: `${(count / Math.max(1, ...Object.values(trend.antecedentFrequency))) * 100}%` }} /></div>
                    <span>{count}</span>
                  </div>
                ))}
            </div>
            <div className="card">
              <h3>المواقع الأكثر تكراراً</h3>
              {Object.entries(trend.locationFrequency)
                .sort((a, b) => b[1] - a[1])
                .map(([loc, count]) => (
                  <div key={loc}><strong>{loc}:</strong> {count}</div>
                ))}
            </div>
          </div>
        )
      ) : null}
    </AppShell>
  );
}
