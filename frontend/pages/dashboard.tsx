import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { apiFetch, getToken, getUser, setUser } from '../lib/api';

type DistItem = { label: string; count: number };
type AttSummary = { present: number; absent: number; late: number; excused: number; total: number };
type AttTrendDay = { date: string; label: string; present: number; absent: number; late: number };
type IepData = { activePlans: number; objectivesCompleted: number; goalsTotal: number; weeklyAchievementPercent: number };

type DashboardData = {
  students: {
    total: number;
    byDisabilityType: DistItem[];
    byStatus: DistItem[];
    byRtiTier: DistItem[];
  };
  attendance: {
    today: AttSummary;
    trend: AttTrendDay[];
  };
  iep: IepData;
  flaggedStudents: number;
};

function DonutChart({ percent, color }: { percent: number; color: string }) {
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="progress-ring">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle className="ring-bg" cx="50" cy="50" r={r} />
        <circle className="ring-fg" cx="50" cy="50" r={r} style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: offset }} />
      </svg>
      <span className="ring-value">{percent}%</span>
    </div>
  );
}

function Skeleton({ width, height }: { width?: string; height?: string }) {
  return <div className="skeleton" style={{ width: width || '100%', height: height || '1rem' }} />;
}

function MiniBar({ items, color }: { items: DistItem[]; color: string }) {
  if (items.length === 0) return <p className="muted">لا توجد بيانات</p>;
  const maxVal = Math.max(1, ...items.map((i) => i.count));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '80px', flexShrink: 0, fontSize: '0.8rem' }}>{item.label}</span>
          <div style={{ flex: 1, height: '20px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(item.count / maxVal) * 100}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.3s' }} />
          </div>
          <span style={{ width: '30px', textAlign: 'end', fontWeight: 600, fontSize: '0.85rem' }}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    Promise.all([
      apiFetch<DashboardData>('/dashboard'),
      apiFetch<any>('/auth/profile').then((u) => { setUser(u); return u; }).catch(() => {}),
    ])
      .then(([d]) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : 'تعذر تحميل البيانات'))
      .finally(() => setLoading(false));
  }, [router]);

  if (!getToken()) return null;

  const currentUser = getUser();

  const ROLE_LABELS: Record<string, string> = {
    admin: 'مسؤول النظام',
    teacher_m: 'معلم',
    teacher_f: 'معلمة',
    school_principal: 'مدير مدرسة',
    admin_manager: 'مدير إدارة',
    deputy_directorate: 'وكيل مديرية',
  };

  const STATUS_COLORS: Record<string, string> = {
    present: 'var(--success)',
    absent: 'var(--danger)',
    late: 'var(--warning)',
    excused: 'var(--muted)',
  };

  const STATUS_LABELS: Record<string, string> = {
    present: 'حاضر',
    absent: 'غائب',
    late: 'متأخر',
    excused: 'معذور',
  };

  return (
    <AppShell title="لوحة التحكم">
      {error ? <p className="error">{error}</p> : null}

      {currentUser ? (
        <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="profile-avatar" style={{ width: 48, height: 48 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={24} height={24}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <strong>{currentUser.username}</strong>
                <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>{ROLE_LABELS[currentUser.role] || currentUser.role}</p>
              </div>
            </div>
            {currentUser.governorate ? (
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                <span><span className="muted">المحافظة:</span> {currentUser.governorate}</span>
                <span><span className="muted">المديرية:</span> {currentUser.directorate || '—'}</span>
                <span><span className="muted">الإدارة:</span> {currentUser.administration || '—'}</span>
                <span><span className="muted">المدرسة:</span> {currentUser.schoolName || '—'}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {loading ? (
        <>
          <div className="card-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card" style={{ padding: '1.5rem' }}>
                <Skeleton height="0.9rem" width="60%" />
                <div style={{ height: '0.75rem' }} />
                <Skeleton height="2rem" width="40%" />
                <div style={{ height: '0.5rem' }} />
                <Skeleton height="0.8rem" width="80%" />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {[1, 2].map((i) => (
              <div key={i} className="card" style={{ padding: '1.5rem' }}>
                <Skeleton height="100px" width="100px" />
              </div>
            ))}
          </div>
        </>
      ) : !data ? (
        <EmptyState message="لا توجد بيانات متاحة" />
      ) : (
        <>
          <div className="card-grid">
            <Link href="/students" className="stat-card blue" style={{ textDecoration: 'none', color: '#fff' }}>
              <h3>سجل الطلاب</h3>
              <div className="stat-value">{data.students.total}</div>
              <div className="stat-sub">إدارة ملفات الطلاب والحالات</div>
            </Link>
            <Link href="/attendance" className="stat-card green" style={{ textDecoration: 'none', color: '#fff' }}>
              <h3>حضور اليوم</h3>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                {data.attendance.today.present}
                <span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.8 }}> / {data.attendance.today.total}</span>
              </div>
              <div className="stat-sub">
                {data.attendance.today.total > 0
                  ? `${Math.round((data.attendance.today.present / data.attendance.today.total) * 100)}% نسبة الحضور`
                  : 'لم يتم تسجيل الحضور بعد'}
              </div>
            </Link>
            <div className="stat-card purple">
              <h3>أهداف مكتملة</h3>
              <div className="stat-value">
                {data.iep.objectivesCompleted}
                <span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.8 }}> / {data.iep.goalsTotal}</span>
              </div>
              <div className="stat-sub">من إجمالي الأهداف في النظام</div>
            </div>
            <div className="stat-card orange">
              <h3>حالات مؤشرة</h3>
              <div className="stat-value">{data.flaggedStudents}</div>
              <div className="stat-sub">طلاب بحاجة إلى تدخل</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <DonutChart percent={data.iep.weeklyAchievementPercent} color="#2F80ED" />
              <div>
                <h3 style={{ margin: 0 }}>نسبة الإنجاز الكلية</h3>
                <p className="muted" style={{ marginTop: '0.25rem' }}>{data.iep.objectivesCompleted} من {data.iep.goalsTotal} أهداف مكتملة</p>
              </div>
            </div>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <DonutChart percent={data.iep.activePlans > 0 ? Math.round((data.iep.objectivesCompleted / data.iep.goalsTotal) * 100) : 0} color="#6FCF97" />
              <div>
                <h3 style={{ margin: 0 }}>تقدم خطط IEP</h3>
                <p className="muted" style={{ marginTop: '0.25rem' }}>{data.iep.activePlans} خطة نشطة</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>توزيع الطلاب حسب الإعاقة</h3>
              <MiniBar items={data.students.byDisabilityType} color="#2F80ED" />
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>توزيع الطلاب حسب مستوى RTI</h3>
              <MiniBar items={data.students.byRtiTier} color="#9B51E0" />
            </div>
          </div>

          {data.attendance.trend.some((d) => d.present > 0 || d.absent > 0 || d.late > 0) ? (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginTop: 0 }}>اتجاهات الحضور (آخر 7 أيام)</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>■ حاضر</span>
                <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>■ غائب</span>
                <span style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>■ متأخر</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'end', height: '120px' }}>
                {data.attendance.trend.map((day) => {
                  const total = day.present + day.absent + day.late || 1;
                  const hPresent = (day.present / total) * 100;
                  const hAbsent = (day.absent / total) * 100;
                  const hLate = (day.late / total) * 100;
                  return (
                    <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <div style={{ width: '100%', height: '100px', display: 'flex', flexDirection: 'column-reverse', gap: '1px' }}>
                        {day.late > 0 && <div style={{ height: `${hLate}%`, background: 'var(--warning)', borderRadius: '2px', minHeight: day.late > 0 ? '4px' : 0 }} />}
                        {day.absent > 0 && <div style={{ height: `${hAbsent}%`, background: 'var(--danger)', borderRadius: '2px', minHeight: day.absent > 0 ? '4px' : 0 }} />}
                        {day.present > 0 && <div style={{ height: `${hPresent}%`, background: 'var(--success)', borderRadius: '2px', minHeight: day.present > 0 ? '4px' : 0 }} />}
                      </div>
                      <span style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{day.label.split('،')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>حالة الحضور اليوم</h3>
            {data.attendance.today.total > 0 ? (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {(['present', 'absent', 'late', 'excused'] as const).map((key) => (
                  <div key={key} className="card" style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: '1rem', borderTop: `3px solid ${STATUS_COLORS[key]}` }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: STATUS_COLORS[key] }}>{data.attendance.today[key]}</div>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>{STATUS_LABELS[key]}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">لم يتم تسجيل حضور اليوم. <Link href="/attendance">تسجيل الحضور</Link></p>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>إجراءات سريعة</h3>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              <Link href="/students/new" className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                إضافة طالب
              </Link>
              <Link href="/attendance" className="btn btn-primary" style={{ background: 'var(--success)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                تسجيل الحضور
              </Link>
              <Link href="/students" className="btn btn-ghost">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                سجل الطلاب
              </Link>
              <Link href="/reports" className="btn btn-ghost">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                طباعة تقرير
              </Link>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
