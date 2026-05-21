import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppShell } from '../../../components/AppShell';
import { EmptyState } from '../../../components/EmptyState';
import { apiFetch, getToken } from '../../../lib/api';

type Assessment = {
  id: number;
  date: string;
  indicators: Record<string, number>;
  notes: string | null;
  createdAt: string;
};

const INDICATORS = [
  { key: 'attention', label: 'الانتباه والتركيز' },
  { key: 'response', label: 'الاستجابة للتعليمات' },
  { key: 'interaction', label: 'التفاعل مع الزملاء' },
  { key: 'agitation', label: 'نوبات الغضب أو الانسحاب' },
  { key: 'eye_contact', label: 'التواصل البصري' },
];

export default function BehaviorPage() {
  const router = useRouter();
  const { id } = router.query;
  const studentId = Number(id);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    if (!router.isReady || Number.isNaN(studentId)) return;
    apiFetch<{ fullName: string }>(`/students/${studentId}`)
      .then((s) => setStudentName(s.fullName))
      .catch(() => {});
    apiFetch<Assessment[]>(`/behavior/assessments/student/${studentId}`)
      .then(setAssessments)
      .catch((e) => setError(e instanceof Error ? e.message : 'خطأ'));
  }, [router, router.isReady, studentId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiFetch('/behavior/assessments', {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          date: new Date().toLocaleDateString('en-CA'),
          indicators: scores,
          notes: notes || undefined,
        }),
      });
      setNotes('');
      setScores({});
      const data = await apiFetch<Assessment[]>(`/behavior/assessments/student/${studentId}`);
      setAssessments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  }

  if (!getToken()) return null;
  if (!router.isReady || Number.isNaN(studentId)) {
    return <AppShell title="التقييم السلوكي"><p className="muted">…</p></AppShell>;
  }

  return (
    <AppShell title={`التقييم السلوكي - ${studentName}`}>
      <p className="muted"><Link href={`/students/${studentId}`}>العودة لملف الطالب</Link></p>
      {error ? <p className="error">{error}</p> : null}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>تقييم سلوكي جديد</h3>
        <form onSubmit={onSubmit}>
          {INDICATORS.map((ind) => (
            <div key={ind.key} className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ minWidth: '160px', margin: 0 }}>{ind.label}</label>
              <input
                type="range"
                min={0}
                max={10}
                value={scores[ind.key] ?? 5}
                onChange={(ev) => setScores((prev) => ({ ...prev, [ind.key]: Number(ev.target.value) }))}
                style={{ flex: 1 }}
              />
              <span style={{ width: '24px', textAlign: 'center' }}>{scores[ind.key] ?? 5}</span>
            </div>
          ))}
          <div className="form-group">
            <label>ملاحظات</label>
            <textarea className="input" rows={3} value={notes} onChange={(ev) => setNotes(ev.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'جاري الحفظ…' : 'حفظ التقييم'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>التقييمات السابقة</h3>
        {assessments.length === 0 ? (
          <EmptyState message="لا توجد تقييمات سلوكية بعد." />
        ) : (
          assessments.map((a) => (
            <div key={a.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <p style={{ margin: 0 }}><strong>{new Date(a.date).toLocaleDateString('ar-EG')}</strong></p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
                {Object.entries(a.indicators).map(([k, v]) => {
                  const label = INDICATORS.find((i) => i.key === k)?.label || k;
                  return <span key={k} className="pill progress">{label}: {v}/10</span>;
                })}
              </div>
              {a.notes ? <p className="muted" style={{ margin: '0.35rem 0 0' }}>{a.notes}</p> : null}
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
