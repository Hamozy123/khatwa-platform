import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { apiFetch, downloadBlob, getApiBase, getToken } from '../lib/api';

type Summary = {
  students: number;
  activeIepPlans: number;
  objectivesCompleted: number;
  goalsTotal: number;
  weeklyAchievementPercent: number;
  weeklyProgress: { day: string; label: string; updates: number }[];
};

type AttReport = {
  summary: { present: number; absent: number; late: number; excused: number; total: number };
  daily: { date: string; present: number; absent: number; late: number; total: number }[];
  studentDetails: { studentId: number; studentName: string; present: number; absent: number; late: number; excused: number }[];
};

type StudentStats = {
  byDisabilityType: { label: string; count: number }[];
  byStatus: { label: string; count: number }[];
  byRtiTier: { label: string; count: number }[];
};

type Student = { id: number; fullName: string };

function formDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function downloadWithAuth(url: string, filename: string) {
  const token = getToken();
  if (!token) return;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('فشل التحميل');
  const blob = await res.blob();
  downloadBlob(blob, filename);
}

function MiniBar({ items, color }: { items: { label: string; count: number }[]; color: string }) {
  if (items.length === 0) return <p className="muted">لا توجد بيانات</p>;
  const maxVal = Math.max(1, ...items.map((i) => i.count));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '100px', flexShrink: 0, fontSize: '0.8rem' }}>{item.label}</span>
          <div style={{ flex: 1, height: '18px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(item.count / maxVal) * 100}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.3s' }} />
          </div>
          <span style={{ width: '30px', textAlign: 'end', fontWeight: 600, fontSize: '0.85rem' }}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const [tab, setTab] = useState<'overview' | 'attendance' | 'students'>('overview');

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const [attFrom, setAttFrom] = useState(formDate(weekAgo));
  const [attTo, setAttTo] = useState(formDate(today));
  const [attReport, setAttReport] = useState<AttReport | null>(null);
  const [attLoading, setAttLoading] = useState(false);

  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    apiFetch<Summary>('/reports/summary').then(setSummary).catch((e) => setError(e.message));
    apiFetch<{ data: Student[] }>('/students').then((res) => setStudents(res.data)).catch(() => {});
  }, [router]);

  function loadAttendanceReport() {
    setAttLoading(true);
    apiFetch<AttReport>(`/reports/attendance-report?from=${attFrom}&to=${attTo}`)
      .then(setAttReport)
      .catch((e) => setError(e.message))
      .finally(() => setAttLoading(false));
  }

  function loadStudentStats() {
    apiFetch<StudentStats>('/reports/student-stats')
      .then(setStudentStats)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (tab === 'attendance') loadAttendanceReport();
    if (tab === 'students') loadStudentStats();
  }, [tab]);

  async function downloadPdf() {
    if (!selectedStudentId) return;
    setDownloading(true);
    try {
      await downloadWithAuth(
        `${getApiBase()}/reports/iep/${selectedStudentId}/pdf`,
        `iep-report-${selectedStudentId}.pdf`,
      );
    } catch (e: any) { setError(e.message); }
    setDownloading(false);
  }

  async function downloadCsvExport() {
    setDownloading(true);
    try {
      await downloadWithAuth(
        `${getApiBase()}/reports/attendance/export?from=${attFrom}&to=${attTo}`,
        `attendance-${attFrom}-${attTo}.csv`,
      );
    } catch (e: any) { setError(e.message); }
    setDownloading(false);
  }

  if (!getToken()) return null;

  const data = [
    { label: 'إجمالي الطلاب', value: summary?.students ?? '—' },
    { label: 'خطط IEP النشطة', value: summary?.activeIepPlans ?? '—' },
    { label: 'الأهداف المنجزة', value: `${summary?.objectivesCompleted ?? 0} / ${summary?.goalsTotal ?? 0}` },
    { label: 'نسبة الإنجاز الأسبوعي', value: `${summary?.weeklyAchievementPercent ?? 0}%` },
  ];

  const STATUS_LABELS: Record<string, string> = { present: 'حاضر', absent: 'غائب', late: 'متأخر', excused: 'معذور' };
  const STATUS_COLORS: Record<string, string> = { present: 'var(--success)', absent: 'var(--danger)', late: 'var(--warning)', excused: 'var(--muted)' };

  const maxUpdates = summary ? Math.max(1, ...summary.weeklyProgress.map((w) => w.updates)) : 1;

  return (
    <AppShell title="التقارير">
      {error ? <p className="error">{error}</p> : null}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid var(--border)' }}>
        {([
          { key: 'overview', label: 'نظرة عامة' },
          { key: 'attendance', label: 'تقارير الحضور' },
          { key: 'students', label: 'إحصائيات الطلاب' },
        ] as const).map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setTab(t.key)}
            style={{ borderBottom: tab === t.key ? '2px solid var(--primary)' : undefined, marginBottom: '-2px', borderRadius: 0 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <>
          <div className="card-grid" style={{ marginBottom: '1.5rem' }}>
            {data.map((d) => (
              <div key={d.label} className="card">
                <h3>{d.label}</h3>
                <div className="stat">{d.value}</div>
              </div>
            ))}
          </div>

          {summary ? (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginTop: 0 }}>نشاط تحديث الأهداف (آخر 7 أيام)</h3>
              {summary.weeklyProgress.map((row) => (
                <div key={row.day} className="bar-row">
                  <span style={{ width: '110px', flexShrink: 0 }}>{row.label}</span>
                  <div className="bar">
                    <span style={{ width: `${(row.updates / maxUpdates) * 100}%` }} />
                  </div>
                  <span style={{ width: '28px', textAlign: 'end' }}>{row.updates}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="card">
            <h3 style={{ marginTop: 0 }}>تصدير التقارير</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0, minWidth: '250px', flex: 1 }}>
                <label>اختيار طالب</label>
                <select className="input" value={selectedStudentId} onChange={(ev) => setSelectedStudentId(ev.target.value)}>
                  <option value="">-- اختر طالبًا --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
              </div>
              <button type="button" className="btn btn-primary" disabled={!selectedStudentId || downloading} onClick={downloadPdf}>
                {downloading ? 'جاري التحميل...' : 'PDF تقرير IEP'}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {tab === 'attendance' ? (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>من تاريخ</label>
                <input className="input" type="date" value={attFrom} onChange={(e) => setAttFrom(e.target.value)} style={{ minWidth: '160px' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>إلى تاريخ</label>
                <input className="input" type="date" value={attTo} onChange={(e) => setAttTo(e.target.value)} style={{ minWidth: '160px' }} />
              </div>
              <button className="btn btn-primary" onClick={loadAttendanceReport}>{attLoading ? 'جاري...' : 'عرض التقرير'}</button>
              <button className="btn btn-ghost" disabled={!attReport || downloading} onClick={downloadCsvExport}>
                {downloading ? 'جاري...' : 'CSV تصدير'}
              </button>
            </div>
          </div>

          {attLoading ? (
            <div className="card"><p className="muted">جاري تحميل البيانات...</p></div>
          ) : attReport ? (
            <>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {(['present', 'absent', 'late', 'excused'] as const).map((key) => (
                  <div key={key} className="card" style={{ flex: 1, minWidth: '100px', textAlign: 'center', padding: '1rem', borderTop: `3px solid ${STATUS_COLORS[key]}` }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: STATUS_COLORS[key] }}>{attReport.summary[key]}</div>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>{STATUS_LABELS[key]}</div>
                  </div>
                ))}
                <div className="card" style={{ flex: 1, minWidth: '100px', textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{attReport.summary.total}</div>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>الإجمالي</div>
                </div>
              </div>

              {attReport.daily.length > 0 ? (
                <div className="card" style={{ overflowX: 'auto', padding: 0, marginBottom: '1rem' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th style={{ color: 'var(--success)' }}>حاضر</th>
                        <th style={{ color: 'var(--danger)' }}>غائب</th>
                        <th style={{ color: 'var(--warning)' }}>متأخر</th>
                        <th>الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attReport.daily.map((d) => (
                        <tr key={d.date}>
                          <td>{d.date}</td>
                          <td>{d.present}</td>
                          <td>{d.absent}</td>
                          <td>{d.late}</td>
                          <td>{d.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState message="لا توجد سجلات حضور في هذا النطاق." />}

              {attReport.studentDetails.length > 0 ? (
                <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>الطالب</th>
                        <th style={{ color: 'var(--success)' }}>حاضر</th>
                        <th style={{ color: 'var(--danger)' }}>غائب</th>
                        <th style={{ color: 'var(--warning)' }}>متأخر</th>
                        <th>معذور</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attReport.studentDetails.map((s) => (
                        <tr key={s.studentId}>
                          <td style={{ fontWeight: 600 }}>{s.studentName}</td>
                          <td>{s.present}</td>
                          <td>{s.absent}</td>
                          <td>{s.late}</td>
                          <td>{s.excused}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          ) : (
            <div className="card"><p className="muted">اختر نطاق تاريخ واضغط "عرض التقرير"</p></div>
          )}
        </>
      ) : null}

      {tab === 'students' ? (
        studentStats ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>توزيع الطلاب حسب الإعاقة</h3>
              <MiniBar items={studentStats.byDisabilityType} color="#2F80ED" />
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>توزيع الطلاب حسب الحالة</h3>
              <MiniBar items={studentStats.byStatus} color="#27AE60" />
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>توزيع الطلاب حسب مستوى RTI</h3>
              <MiniBar items={studentStats.byRtiTier} color="#9B51E0" />
            </div>
          </div>
        ) : <div className="card"><p className="muted">جاري تحميل الإحصائيات...</p></div>
      ) : null}
    </AppShell>
  );
}
