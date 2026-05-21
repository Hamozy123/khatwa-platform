import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';
import { apiFetch, clearToken, getUser } from '../lib/api';

type NavItem = { href: string; label: string; icon: ReactNode; adminOnly?: boolean };

const DashboardIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const StudentsIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
  </svg>
);

const AttendanceIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const MediaIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const ReportsIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const NotifIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

type NavGroup = { section?: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    section: 'الرئيسية',
    items: [{ href: '/dashboard', label: 'لوحة التحكم', icon: <DashboardIcon /> }],
  },
  {
    section: 'الإدارة',
    items: [
      { href: '/students', label: 'سجل الطلاب', icon: <StudentsIcon /> },
      { href: '/daily-plan', label: 'خطة اليوم', icon: <CalendarIcon /> },
      { href: '/attendance', label: 'الحضور والغياب', icon: <AttendanceIcon /> },
      { href: '/notifications', label: 'الإشعارات', icon: <NotifIcon /> },
    ],
  },
  {
    section: 'المحتوى',
    items: [
      { href: '/media', label: 'بنك الوسائل', icon: <MediaIcon /> },
      { href: '/reports', label: 'التقارير', icon: <ReportsIcon /> },
    ],
  },
  {
    section: 'النظام',
    items: [
      { href: '/settings', label: 'الإعدادات', icon: <SettingsIcon /> },
      { href: '/users', label: 'إدارة المستخدمين', icon: <UsersIcon />, adminOnly: true } as NavItem,
    ],
  },
];

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const user = getUser();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const ac = new AbortController();
    apiFetch<{ count: number }>('/notifications/unread-count', { signal: ac.signal })
      .then((d) => setUnread(d.count))
      .catch((e) => { if (e.name !== 'AbortError') console.warn('AppShell: unread count fetch failed', e); });
    const interval = setInterval(() => {
      apiFetch<{ count: number }>('/notifications/unread-count', { signal: ac.signal })
        .then((d) => setUnread(d.count))
        .catch((e) => { if (e.name !== 'AbortError') console.warn('AppShell: unread count poll failed', e); });
    }, 30000);
    return () => { clearInterval(interval); ac.abort(); };
  }, []);

  function logout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <div className="layout">
      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
          </svg>
          <span>خطوة</span>
        </div>
        <nav>
          {navGroups.map((group) => {
            const visible = group.items.filter((item) => !item.adminOnly || user?.role === 'admin' || user?.role === 'admin_manager');
            if (visible.length === 0) return null;
            return (
              <div key={group.section || '__spacer'}>
                {group.section ? <div className="nav-section">{group.section}</div> : null}
                {visible.map((item) => (
                  <Link key={item.href} href={item.href} className={router.pathname === item.href ? 'active' : ''} onClick={() => setSidebarOpen(false)}>
                    {item.icon}
                    <span>{item.label}</span>
                    {item.href === '/notifications' && unread > 0 ? (
                      <span className="badge">{unread}</span>
                    ) : null}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>
            <LogoutIcon />
            <span>خروج</span>
          </a>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="فتح القائمة">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>{title}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button onClick={() => setDarkMode(!darkMode)} className="sidebar-toggle" style={{ display: 'flex' }} aria-label={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {darkMode ? <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></> : <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>}
              </svg>
            </button>
            {unread > 0 ? <span className="badge-sm">{unread} إشعار</span> : null}
            {user ? <><span className="muted" style={{ fontSize: '0.85rem' }}>{user.username}</span><span className="pill pending" style={{ fontSize: '0.7rem' }}>{({ admin: 'مسؤول', teacher_m: 'معلم', teacher_f: 'معلمة', school_principal: 'مدير مدرسة', admin_manager: 'مدير إدارة', deputy_directorate: 'وكيل مديرية' } as Record<string, string>)[user.role] || user.role}</span></> : null}
          </div>
        </header>
        <div className="content page-enter">{children}</div>
      </div>
    </div>
  );
}