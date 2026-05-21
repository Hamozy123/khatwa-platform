import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppShell } from '../../components/AppShell';
import { apiFetch, getToken } from '../../lib/api';

export default function NewStudentPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [disabilityType, setDisabilityType] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const s = await apiFetch<{ id: number }>('/students', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          birthDate: birthDate || undefined,
          gender: gender || undefined,
          disabilityType: disabilityType || undefined,
          diagnosis: diagnosis || undefined,
          status: status || undefined,
        }),
      });
      await router.replace(`/students/${s.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحفظ');
    }
  }

  if (!ready) {
    return (
      <AppShell title="إضافة طالب">
        <p className="muted">…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="إضافة طالب">
      <p className="muted">
        <Link href="/students">العودة لسجل الطلاب</Link>
      </p>
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
        <button type="submit" className="btn btn-primary">
          حفظ
        </button>
      </form>
    </AppShell>
  );
}
