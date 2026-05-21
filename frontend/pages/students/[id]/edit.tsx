import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppShell } from '../../../components/AppShell';
import { apiFetch, getToken } from '../../../lib/api';

export default function EditStudentPage() {
  const router = useRouter();
  const { id } = router.query;
  const studentId = Number(id);
  const [ready, setReady] = useState(false);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [disabilityType, setDisabilityType] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    if (!router.isReady || Number.isNaN(studentId)) return;
    apiFetch<any>(`/students/${studentId}`)
      .then((s) => {
        setFullName(s.fullName || '');
        setBirthDate(s.birthDate || '');
        setGender(s.gender || '');
        setDisabilityType(s.disabilityType || '');
        setDiagnosis(s.diagnosis || '');
        setStatus(s.status || 'active');
        setReady(true);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'فشل تحميل البيانات'));
  }, [router, router.isReady, studentId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName,
          birthDate: birthDate || undefined,
          gender: gender || undefined,
          disabilityType: disabilityType || undefined,
          diagnosis: diagnosis || undefined,
          status: status || undefined,
        }),
      });
      await router.replace(`/students/${studentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحفظ');
    }
    setSaving(false);
  }

  return (
    <AppShell title="تعديل بيانات الطالب">
      <p className="muted">
        <Link href={`/students/${studentId}`}>العودة لملف الطالب</Link>
      </p>
      {!ready ? (
        <p className="muted">جاري التحميل…</p>
      ) : (
        <form className="card" style={{ maxWidth: '480px' }} onSubmit={onSubmit}>
          <div className="form-group">
            <label>الاسم الكامل</label>
            <input className="input" required value={fullName} onChange={(ev) => setFullName(ev.target.value)} />
          </div>
          <div className="form-group">
            <label>تاريخ الميلاد</label>
            <input type="date" className="input" value={birthDate} onChange={(ev) => setBirthDate(ev.target.value)} />
          </div>
          <div className="form-group">
            <label>الجنس</label>
            <select className="input" value={gender} onChange={(ev) => setGender(ev.target.value)}>
              <option value="">— اختر —</option>
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </select>
          </div>
          <div className="form-group">
            <label>نوع الإعاقة</label>
            <select className="input" value={disabilityType} onChange={(ev) => setDisabilityType(ev.target.value)}>
              <option value="">— اختر —</option>
              <option value="صعوبات تعلم">صعوبات تعلم</option>
              <option value="اضطراب طيف التوحد">اضطراب طيف التوحد</option>
              <option value="إعاقة حركية">إعاقة حركية</option>
              <option value="إعاقة بصرية">إعاقة بصرية</option>
              <option value="إعاقة سمعية">إعاقة سمعية</option>
              <option value="صعوبات نطق وتخاطب">صعوبات نطق وتخاطب</option>
              <option value="فرط حركة وتشتت انتباه">فرط حركة وتشتت انتباه</option>
              <option value="إعاقة عقلية">إعاقة عقلية</option>
              <option value="متلازمة داون">متلازمة داون</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
          <div className="form-group">
            <label>التشخيص</label>
            <input className="input" value={diagnosis} onChange={(ev) => setDiagnosis(ev.target.value)} />
          </div>
          <div className="form-group">
            <label>الحالة</label>
            <input className="input" value={status} onChange={(ev) => setStatus(ev.target.value)} />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'جاري الحفظ…' : 'حفظ التغييرات'}
            </button>
            <Link href={`/students/${studentId}`} className="btn">إلغاء</Link>
          </div>
        </form>
      )}
    </AppShell>
  );
}
