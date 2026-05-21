import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AppShell } from '../../components/AppShell';
import { apiFetch, getToken } from '../../lib/api';

type Student = { id: number; fullName: string };
type AttendanceRecord = { id: number; studentId: number; date: string; status: string; checkIn?: string; notes?: string };
type AttendanceSummary = { present: number; absent: number; late: number; excused: number; total: number };
type StatusOption = { value: string; label: string; color: string };

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'present', label: 'حاضر', color: 'var(--success)' },
  { value: 'absent', label: 'غائب', color: 'var(--danger)' },
  { value: 'late', label: 'متأخر', color: 'var(--warning)' },
  { value: 'excused', label: 'معذور', color: 'var(--muted)' },
];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  return formatDate(new Date());
}

export default function AttendancePage() {
  const router = useRouter();
  const [date, setDate] = useState(todayStr());
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Map<number, AttendanceRecord>>(new Map());
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadStudents() {
    try {
      const res = await apiFetch<{ data: Student[] }>('/students?take=200');
      setStudents(res.data);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function loadAttendance() {
    try {
      const [recordsData, summaryData] = await Promise.all([
        apiFetch<AttendanceRecord[]>(`/attendance?date=${date}`),
        apiFetch<AttendanceSummary>(`/attendance/summary?date=${date}`),
      ]);
      const map = new Map<number, AttendanceRecord>();
      for (const r of recordsData) {
        map.set(r.studentId, r);
      }
      setRecords(map);
      setSummary(summaryData);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    loadStudents();
  }, [router]);

  useEffect(() => {
    if (!getToken()) return;
    loadAttendance();
  }, [date]);

  function getStatus(studentId: number): string {
    return records.get(studentId)?.status || '';
  }

  function setStatus(studentId: number, status: string) {
    const existing = records.get(studentId);
    const now = todayStr();
    const checkIn = status === 'present' || status === 'late'
      ? (existing?.checkIn || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }))
      : undefined;
    setRecords(new Map(records.set(studentId, {
      id: existing?.id || 0,
      studentId,
      date: now,
      status,
      checkIn,
      notes: existing?.notes || '',
    })));
  }

  async function saveAll() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        date,
        records: Array.from(records.entries())
          .filter(([_, r]) => r.status)
          .map(([studentId, r]) => ({
            studentId,
            date,
            status: r.status,
            checkIn: r.checkIn || undefined,
            notes: r.notes || undefined,
          })),
      };
      await apiFetch('/attendance/bulk', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await loadAttendance();
      setSuccess('تم حفظ الحضور بنجاح');
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  }

  if (!getToken()) return null;

  const markedCount = Array.from(records.values()).filter((r) => r.status).length;

  return (
    <AppShell title="الحضور والغياب">
      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontWeight: 600 }}>التاريخ:</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ minWidth: '180px' }}
        />
        <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
          {saving ? 'جاري الحفظ...' : `حفظ الحضور (${markedCount})`}
        </button>
      </div>

      {summary && markedCount > 0 ? (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>حاضر: {summary.present}</span>
          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>غائب: {summary.absent}</span>
          <span style={{ color: 'var(--warning)', fontWeight: 600 }}>متأخر: {summary.late}</span>
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}>معذور: {summary.excused}</span>
          <span className="muted">الإجمالي: {summary.total}</span>
        </div>
      ) : null}

      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الطالب</th>
              {STATUS_OPTIONS.map((opt) => (
                <th key={opt.value} style={{ textAlign: 'center', color: opt.color }}>{opt.label}</th>
              ))}
              <th>تسجيل الدخول</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => {
              const currentStatus = getStatus(s.id);
              return (
                <tr key={s.id}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{s.fullName}</td>
                  {STATUS_OPTIONS.map((opt) => (
                    <td key={opt.value} style={{ textAlign: 'center' }}>
                      <input
                        type="radio"
                        name={`status-${s.id}`}
                        value={opt.value}
                        checked={currentStatus === opt.value}
                        onChange={() => setStatus(s.id, opt.value)}
                        style={{ accentColor: opt.color, cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                    </td>
                  ))}
                  <td style={{ textAlign: 'center' }}>
                    {currentStatus === 'present' || currentStatus === 'late'
                      ? (records.get(s.id)?.checkIn || '—')
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {students.length === 0 ? (
          <div className="card" style={{ border: 'none', textAlign: 'center', padding: '2rem' }}>
            <p className="muted">لا يوجد طلاب. أضف طالبًا أولاً.</p>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
