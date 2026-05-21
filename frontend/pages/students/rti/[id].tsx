import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppShell } from '../../../components/AppShell';
import { EmptyState } from '../../../components/EmptyState';
import { apiFetch, getToken } from '../../../lib/api';

type RtiAssessment = {
  id: number;
  studentId: number;
  previousTier: number;
  newTier: number;
  reason: string;
  assessedBy: number;
  createdAt: string;
};

const TIER_LABELS = ['', 'تدخل وقائي', 'تدخل موجّه', 'تدخل مكثف'];

export default function RtiPage() {
  const router = useRouter();
  const { id } = router.query;
  const studentId = Number(id);
  const [assessments, setAssessments] = useState<RtiAssessment[]>([]);
  const [studentName, setStudentName] = useState('');
  const [currentTier, setCurrentTier] = useState<number>(1);
  const [suggestedTier, setSuggestedTier] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTier, setNewTier] = useState(1);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    if (!getToken()) { router.replace('/login'); return; }
    if (!router.isReady || Number.isNaN(studentId)) return;
    Promise.all([
      apiFetch<{ fullName: string; rtiTier: number }>(`/students/${studentId}`),
      apiFetch<RtiAssessment[]>(`/rti/student/${studentId}`),
      apiFetch<{ tier: number | null }>(`/rti/suggest/${studentId}`),
    ])
      .then(([student, rtiData, suggest]) => {
        setStudentName(student.fullName);
        setCurrentTier(student.rtiTier);
        setAssessments(rtiData);
        setSuggestedTier(suggest.tier);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'خطأ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [router, router.isReady, studentId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (newTier < 1 || newTier > 3) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch('/rti', {
        method: 'POST',
        body: JSON.stringify({ studentId, previousTier: currentTier, newTier, reason: reason.trim() || undefined }),
      });
      setReason('');
      setShowForm(false);
      setCurrentTier(newTier);
      const [rtiData, suggest] = await Promise.all([
        apiFetch<RtiAssessment[]>(`/rti/student/${studentId}`),
        apiFetch<{ tier: number | null }>(`/rti/suggest/${studentId}`),
      ]);
      setAssessments(rtiData);
      setSuggestedTier(suggest.tier);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!getToken()) return null;
  if (!router.isReady || Number.isNaN(studentId)) {
    return <AppShell title="RTI"><p className="muted">…</p></AppShell>;
  }

  return (
    <AppShell title={`الاستجابة للتدخل (RTI) - ${studentName}`}>
      <p className="muted"><Link href={`/students/${studentId}`}>العودة لملف الطالب</Link></p>
      {error ? <p className="error">{error}</p> : null}

      <div className="card-grid" style={{ marginBottom: '1rem' }}>
        <div className="card">
          <h3>المستوى الحالي</h3>
          <div className="stat-value">{currentTier}</div>
          <span className="muted">{TIER_LABELS[currentTier]}</span>
        </div>
        {suggestedTier !== null ? (
          <div className="card">
            <h3>المستوى المقترح</h3>
            <div className="stat-value" style={{ color: suggestedTier > currentTier ? '#c0392b' : suggestedTier < currentTier ? '#27ae60' : '#6FCF97' }}>
              {suggestedTier}
            </div>
            <span className="muted">{TIER_LABELS[suggestedTier]}</span>
            {suggestedTier !== currentTier ? (
              <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => { setNewTier(suggestedTier); setShowForm(true); }}>
                تطبيق المستوى {suggestedTier}
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="card">
          <h3>إجمالي التقييمات</h3>
          <div className="stat-value">{assessments.length}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : 'تقييم RTI جديد'}
        </button>
      </div>

      {showForm ? (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>المستوى الحالي</label>
              <p className="muted" style={{ margin: '0.25rem 0' }}>المستوى {currentTier} — {TIER_LABELS[currentTier]}</p>
            </div>
            <div className="form-group">
              <label>المستوى الجديد</label>
              <select className="input" value={newTier} onChange={(e) => setNewTier(Number(e.target.value))} required>
                <option value={1}>المستوى 1 — تدخل وقائي</option>
                <option value={2}>المستوى 2 — تدخل موجّه</option>
                <option value={3}>المستوى 3 — تدخل مكثف</option>
              </select>
            </div>
            <div className="form-group">
              <label>سبب التغيير</label>
              <textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="اذكر سبب تغيير مستوى التدخل..." />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'جاري الحفظ…' : 'حفظ التقييم'}
            </button>
          </form>
        </div>
      ) : null}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>تاريخ تغييرات RTI</h3>
        {loading ? (
          <p className="muted">جاري التحميل…</p>
        ) : assessments.length === 0 ? (
          <EmptyState message="لا توجد تقييمات RTI مسجلة." />
        ) : (
          <table>
            <thead>
              <tr><th>التاريخ</th><th>من</th><th>إلى</th><th>السبب</th></tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.createdAt).toLocaleDateString('ar-EG')}</td>
                  <td>المستوى {a.previousTier}</td>
                  <td>المستوى {a.newTier}</td>
                  <td>{a.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
