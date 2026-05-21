import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppShell } from '../../../components/AppShell';
import { EmptyState } from '../../../components/EmptyState';
import { apiFetch, downloadBlob, getApiBase, getToken } from '../../../lib/api';

type Bip = {
  replacementBehavior: string;
  interventionStrategies: string[];
  reinforcementPlan: string;
  crisisPlan?: string;
  reviewDate?: string;
};

type FbaRecord = {
  id: number;
  studentId: number;
  antecedents: { description: string; frequency: string; notes?: string }[];
  behaviors: { description: string; duration?: string; intensity?: string }[];
  consequences: { description: string; effectiveness?: string; notes?: string }[];
  hypothesis: string;
  targetBehavior: string;
  bip: Bip;
  date: string;
};

export default function FbaPage() {
  const router = useRouter();
  const { id } = router.query;
  const studentId = Number(id);
  const [records, setRecords] = useState<FbaRecord[]>([]);
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [targetBehavior, setTargetBehavior] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [antecedentDesc, setAntecedentDesc] = useState('');
  const [behaviorDesc, setBehaviorDesc] = useState('');
  const [consequenceDesc, setConsequenceDesc] = useState('');

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    if (!router.isReady || Number.isNaN(studentId)) return;
    apiFetch<{ fullName: string }>(`/students/${studentId}`)
      .then((s) => setStudentName(s.fullName)).catch((e) => console.warn('FBA: failed to load student name', e));
    apiFetch<FbaRecord[]>(`/fba/student/${studentId}`)
      .then(setRecords).catch((e) => setError(e.message));
  }, [router, router.isReady, studentId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/fba', {
        method: 'POST',
        body: JSON.stringify({
          studentId, targetBehavior: targetBehavior.trim(),
          hypothesis: hypothesis.trim() || undefined,
          antecedents: antecedentDesc.trim() ? [{ description: antecedentDesc.trim(), frequency: 'daily' }] : [],
          behaviors: behaviorDesc.trim() ? [{ description: behaviorDesc.trim() }] : [],
          consequences: consequenceDesc.trim() ? [{ description: consequenceDesc.trim() }] : [],
          date: new Date().toLocaleDateString('en-CA'),
        }),
      });
      setTargetBehavior(''); setHypothesis(''); setAntecedentDesc(''); setBehaviorDesc(''); setConsequenceDesc('');
      setShowForm(false);
      const data = await apiFetch<FbaRecord[]>(`/fba/student/${studentId}`);
      setRecords(data);
    } catch (e: any) { setError(e.message); }
  }

  if (!getToken()) return null;
  if (!router.isReady || Number.isNaN(studentId)) {
    return <AppShell title="FBA"><p className="muted">…</p></AppShell>;
  }

  return (
    <AppShell title={`تقييم السلوك الوظيفي (FBA) - ${studentName}`}>
      <p className="muted"><Link href={`/students/${studentId}`}>العودة لملف الطالب</Link></p>
      {error ? <p className="error">{error}</p> : null}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : 'تقييم FBA جديد'}
        </button>
      </div>

      {showForm ? (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>السلوك المستهدف</label>
              <input className="input" value={targetBehavior} onChange={(e) => setTargetBehavior(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>المحفز (Antecedent)</label>
              <textarea className="input" rows={2} value={antecedentDesc} onChange={(e) => setAntecedentDesc(e.target.value)} />
            </div>
            <div className="form-group">
              <label>السلوك (Behavior)</label>
              <textarea className="input" rows={2} value={behaviorDesc} onChange={(e) => setBehaviorDesc(e.target.value)} />
            </div>
            <div className="form-group">
              <label>النتيجة (Consequence)</label>
              <textarea className="input" rows={2} value={consequenceDesc} onChange={(e) => setConsequenceDesc(e.target.value)} />
            </div>
            <div className="form-group">
              <label>الفرضية</label>
              <textarea className="input" rows={2} value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">حفظ التقييم</button>
          </form>
        </div>
      ) : null}

      {records.length === 0 ? (
        <div className="card"><EmptyState message="لا توجد تقييمات FBA." /></div>
      ) : (
        records.map((r) => (
          <div key={r.id} className="card" style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{r.targetBehavior || 'سلوك غير محدد'}</strong>
              <span className="muted">{r.date || '—'}</span>
            </div>
            {r.hypothesis ? <p style={{ marginTop: '0.5rem' }}><strong>الفرضية:</strong> {r.hypothesis}</p> : null}
            {r.antecedents?.length ? <p><strong>A:</strong> {r.antecedents.map((a) => a.description).join(', ')}</p> : null}
            {r.behaviors?.length ? <p><strong>B:</strong> {r.behaviors.map((b) => b.description).join(', ')}</p> : null}
            {r.consequences?.length ? <p><strong>C:</strong> {r.consequences.map((c) => c.description).join(', ')}</p> : null}
            {r.bip ? (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--bg-card)', borderRadius: '6px' }}>
                <strong>BIP</strong>
                <p style={{ margin: '0.25rem 0' }}><strong>السلوك البديل:</strong> {r.bip.replacementBehavior}</p>
                {r.bip.interventionStrategies?.length ? (
                  <p style={{ margin: '0.25rem 0' }}><strong>استراتيجيات التدخل:</strong> {Array.isArray(r.bip.interventionStrategies) ? r.bip.interventionStrategies.join('، ') : r.bip.interventionStrategies}</p>
                ) : null}
                {r.bip.reinforcementPlan ? (
                  <p style={{ margin: '0.25rem 0' }}><strong>خطة التعزيز:</strong> {r.bip.reinforcementPlan}</p>
                ) : null}
                {r.bip.crisisPlan ? (
                  <p style={{ margin: '0.25rem 0' }}><strong>خطة الأزمات:</strong> {r.bip.crisisPlan}</p>
                ) : null}
                {r.bip.reviewDate ? (
                  <p style={{ margin: '0.25rem 0' }}><strong>تاريخ المراجعة:</strong> {r.bip.reviewDate}</p>
                ) : null}
              </div>
            ) : null}
            <div style={{ marginTop: '0.5rem' }}>
              <a href={`${getToken() ? '' : '#'}`}
                onClick={async (e) => {
                  e.preventDefault();
                  const token = getToken();
                  if (!token) return;
                  const res = await fetch(`${getApiBase()}/reports/fba/${r.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
                  if (res.ok) {
                    const blob = await res.blob();
                    downloadBlob(blob, `fba-${r.id}.pdf`);
                  }
                }}
                className="btn btn-ghost btn-sm">PDF</a>
            </div>
          </div>
        ))
      )}
    </AppShell>
  );
}
