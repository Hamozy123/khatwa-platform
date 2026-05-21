import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { apiFetch, getToken } from '../lib/api';

type NotificationItem = {
  id: number;
  title: string;
  body: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    load();
  }, [router]);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<NotificationItem[]>('/notifications');
      setNotifs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ');
    }
    setLoading(false);
  }

  async function markRead(id: number) {
    await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  async function markAllRead() {
    await apiFetch('/notifications/read-all', { method: 'PUT' });
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  if (!getToken()) return null;

  return (
    <AppShell title="الإشعارات">
      {error ? <p className="error">{error}</p> : null}
      <div style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn btn-ghost" onClick={markAllRead}>تحديد الكل كمقروء</button>
      </div>
      <div className="card">
        {loading ? (
          <p className="muted">جاري التحميل…</p>
        ) : notifs.length === 0 ? (
          <EmptyState message="لا توجد إشعارات." />
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              style={{
                padding: '0.75rem 0',
                borderBottom: '1px solid var(--border)',
                cursor: n.isRead ? 'default' : 'pointer',
                opacity: n.isRead ? 0.6 : 1,
              }}
            >
              <strong>{n.title}</strong>
              {n.body ? <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{n.body}</p> : null}
              <p className="muted" style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                {new Date(n.createdAt).toLocaleString('ar-EG')}
              </p>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
