import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AppShell } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { apiFetch, getToken } from '../lib/api';

type DailyPlanItem = {
  id: number;
  studentId: number;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: string;
  priority: string;
  type: string;
  notes?: string;
};

const TYPE_LABELS: Record<string, string> = {
  assessment: 'تقييم',
  therapy: 'علاج',
  academic: 'أكاديمي',
  social: 'اجتماعي',
  other: 'أخرى',
};

type Student = {
  id: number;
  fullName: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'معلق',
  in_progress: 'قيد التنفيذ',
  done: 'تم',
  cancelled: 'ملغي',
};

function todayStr() {
  return new Date().toLocaleDateString('en-CA');
}

export default function DailyPlanPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<DailyPlanItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState('academic');
  const [priority, setPriority] = useState('medium');
  const [studentId, setStudentId] = useState('1');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  function load() {
    if (!getToken()) { router.replace('/login'); return; }
    apiFetch<DailyPlanItem[]>(`/daily-plan?date=${selectedDate}`)
      .then(setPlans)
      .catch((e) => setError(e instanceof Error ? e.message : 'خطأ'));
  }

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    apiFetch<{ data: Student[] }>('/students').then((res) => setStudents(res.data)).catch(() => {});
    load();
  }, [router, selectedDate]);

  async function createPlan(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/daily-plan', {
        method: 'POST',
        body: JSON.stringify({
          studentId: Number(studentId),
          title,
          description: description || undefined,
          date: selectedDate,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          type,
          priority,
        }),
      });
      setTitle(''); setDescription(''); setStartTime(''); setEndTime('');
      setShowForm(false);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'فشل الإضافة'); }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await apiFetch(`/daily-plan/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'فشل التحديث'); }
  }

  async function confirmDelete() {
    if (deleteId === null) return;
    try {
      await apiFetch(`/daily-plan/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      load();
    } catch (err) { setError(err instanceof Error ? err.message : 'فشل الحذف'); }
  }

  if (!getToken()) return null;

  const filtered = plans;
  const pendingCount = filtered.filter((p) => p.status === 'pending' || p.status === 'in_progress').length;
  const doneCount = filtered.filter((p) => p.status === 'done').length;

  return (
    <AppShell title="خطة اليوم">
      {error ? <p className="error">{error}</p> : null}

      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div className="stat-card blue" style={{ flex: 1, minWidth: 140 }}>
          <h3>تاريخ اليوم</h3>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <div className="stat-card orange" style={{ flex: 1, minWidth: 120 }}>
          <h3>قيد التنفيذ</h3>
          <div className="stat-value">{pendingCount}</div>
        </div>
        <div className="stat-card green" style={{ flex: 1, minWidth: 120 }}>
          <h3>منجز</h3>
          <div className="stat-value">{doneCount}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 500 }}>التاريخ:</label>
        <input type="date" className="input" style={{ maxWidth: 180 }} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : 'إضافة نشاط'}
        </button>
      </div>

      {showForm ? (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ marginTop: 0 }}>نشاط جديد</h3>
          <form onSubmit={createPlan} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>العنوان</label>
              <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>الطالب</label>
              <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                {students.map((s) => (<option key={s.id} value={s.id}>{s.fullName}</option>))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>البداية</label>
              <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>النهاية</label>
              <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>النوع</label>
              <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>الأولوية</label>
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
              <label>الوصف</label>
              <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>حفظ النشاط</button>
          </form>
        </div>
      ) : null}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState message="لا توجد أنشطة لهذا اليوم." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>الوقت</th>
                <th>النشاط</th>
                <th>الطالب</th>
                <th>النوع</th>
                <th>الأولوية</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {p.startTime || '—'} {p.endTime ? `- ${p.endTime}` : ''}
                  </td>
                  <td>
                    <strong>{p.title}</strong>
                    {p.description ? <p className="muted" style={{ margin: '0.15rem 0 0', fontSize: '0.8rem' }}>{p.description}</p> : null}
                  </td>
                  <td>{students.find((s) => s.id === p.studentId)?.fullName || <span className="muted">#{p.studentId}</span>}</td>
                  <td><span className="pill pending">{TYPE_LABELS[p.type] || p.type}</span></td>
                  <td>
                    <span className={`pill ${p.priority === 'high' ? 'review' : p.priority === 'medium' ? 'progress' : 'pending'}`}>
                      {p.priority === 'high' ? 'عالية' : p.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </span>
                  </td>
                  <td>
                    <select className="input" style={{ maxWidth: 130, padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                      value={p.status} onChange={(e) => updateStatus(p.id, e.target.value)}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                    </select>
                  </td>
                  <td>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDeleteId(p.id)}
                      style={{ color: 'var(--danger)' }}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <ConfirmDialog
        isOpen={deleteId !== null}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا النشاط؟"
        confirmText="حذف"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </AppShell>
  );
}