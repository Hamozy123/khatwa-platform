import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AppShell } from '../components/AppShell';
import { useToast } from '../components/Toast';
import { apiFetch, getToken, getUser, setUser, setToken, clearToken } from '../lib/api';

type LocationItem = { id: number; type: string; name: string; parentId: number | null };

const ROLE_LABELS: Record<string, string> = {
  admin: 'مسؤول النظام',
  teacher_m: 'معلم',
  teacher_f: 'معلمة',
  school_principal: 'مدير مدرسة',
  admin_manager: 'مدير إدارة',
  deputy_directorate: 'وكيل مديرية',
};

export default function SettingsPage() {
  const router = useRouter();
  const user = getUser();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'teacher_m');
  const [governorate, setGovernorate] = useState(user?.governorate || '');
  const [directorate, setDirectorate] = useState(user?.directorate || '');
  const [administration, setAdministration] = useState(user?.administration || '');
  const [schoolName, setSchoolName] = useState(user?.schoolName || '');
  const [governorates, setGovernorates] = useState<LocationItem[]>([]);
  const [directorates, setDirectorates] = useState<LocationItem[]>([]);
  const [administrations, setAdministrations] = useState<LocationItem[]>([]);
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    apiFetch<LocationItem[]>('/locations?type=governorate').then(setGovernorates).catch(() => {});
  }, [router]);

  useEffect(() => {
    if (governorate) {
      const gov = governorates.find((g) => g.name === governorate);
      if (gov) {
        apiFetch<LocationItem[]>(`/locations?type=directorate&parentId=${gov.id}`)
          .then(setDirectorates).catch(() => {});
      }
    } else { setDirectorates([]); }
  }, [governorate, governorates]);

  useEffect(() => {
    if (directorate) {
      const dir = directorates.find((d) => d.name === directorate);
      if (dir) {
        apiFetch<LocationItem[]>(`/locations?type=administration&parentId=${dir.id}`)
          .then(setAdministrations).catch(() => {});
      }
    } else { setAdministrations([]); }
  }, [directorate, directorates]);

  useEffect(() => {
    setSchoolName('');
  }, [administration]);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      showToast('تم تغيير كلمة المرور بنجاح', 'success');
      setOldPassword('');
      setNewPassword('');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'فشل تغيير كلمة المرور', 'error');
    }
  }

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<{ access_token: string; user: any }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ role, governorate, directorate, administration, schoolName }),
      });
      setToken(res.access_token);
      setUser(res.user);
      showToast('تم تحديث الملف الشخصي بنجاح', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'فشل تحديث الملف', 'error');
    }
    setSaving(false);
  }

  async function handleLogoutAll() {
    try {
      await apiFetch('/auth/logout-all', { method: 'POST' });
      clearToken();
      router.replace('/login');
    } catch (e) {
      showToast('فشل تسجيل الخروج من جميع الأجهزة', 'error');
    }
  }

  if (!getToken()) return null;

  return (
    <AppShell title="الإعدادات">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              الحساب
            </h3>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr><th style={{ textAlign: 'right', padding: '0.4rem 0', width: '120px' }}>اسم المستخدم</th><td style={{ padding: '0.4rem 0' }}>{user?.username || '—'}</td></tr>
                <tr><th style={{ textAlign: 'right', padding: '0.4rem 0' }}>الدور</th><td style={{ padding: '0.4rem 0' }}><span className="pill progress">{ROLE_LABELS[user?.role || ''] || user?.role || '—'}</span></td></tr>
                <tr><th style={{ textAlign: 'right', padding: '0.4rem 0' }}>المحافظة</th><td style={{ padding: '0.4rem 0' }}>{user?.governorate || '—'}</td></tr>
                <tr><th style={{ textAlign: 'right', padding: '0.4rem 0' }}>المديرية</th><td style={{ padding: '0.4rem 0' }}>{user?.directorate || '—'}</td></tr>
                <tr><th style={{ textAlign: 'right', padding: '0.4rem 0' }}>الإدارة</th><td style={{ padding: '0.4rem 0' }}>{user?.administration || '—'}</td></tr>
                <tr><th style={{ textAlign: 'right', padding: '0.4rem 0' }}>المدرسة</th><td style={{ padding: '0.4rem 0' }}>{user?.schoolName || '—'}</td></tr>
              </tbody>
            </table>
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={handleLogoutAll} style={{ color: 'var(--danger)' }}>
                تسجيل الخروج من جميع الأجهزة
              </button>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>تغيير كلمة المرور</h3>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>كلمة المرور القديمة</label>
                <input type="password" className="input" required value={oldPassword} onChange={(ev) => setOldPassword(ev.target.value)} />
              </div>
              <div className="form-group">
                <label>كلمة المرور الجديدة</label>
                <input type="password" className="input" required minLength={6} value={newPassword} onChange={(ev) => setNewPassword(ev.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary">حفظ</button>
            </form>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              تعديل الملف الشخصي
            </h3>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>الدور الوظيفي</label>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label>المحافظة</label>
                <select className="input" value={governorate} onChange={(e) => { setGovernorate(e.target.value); setDirectorate(''); setAdministration(''); setSchoolName(''); }}>
                  <option value="">— اختر —</option>
                  {governorates.map((g) => (<option key={g.id} value={g.name}>{g.name}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label>المديرية</label>
                <select className="input" value={directorate} onChange={(e) => { setDirectorate(e.target.value); setAdministration(''); setSchoolName(''); }} disabled={!governorate}>
                  <option value="">— اختر —</option>
                  {directorates.map((d) => (<option key={d.id} value={d.name}>{d.name}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label>الإدارة</label>
                <select className="input" value={administration} onChange={(e) => { setAdministration(e.target.value); setSchoolName(''); }} disabled={!directorate}>
                  <option value="">— اختر —</option>
                  {administrations.map((a) => (<option key={a.id} value={a.name}>{a.name}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label>المدرسة</label>
                <input className="input" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="اسم المدرسة" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>معلومات النظام</h3>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr><th style={{ textAlign: 'right', padding: '0.4rem 0', width: '140px' }}>الإصدار</th><td style={{ padding: '0.4rem 0' }}>1.0.0</td></tr>
                <tr><th style={{ textAlign: 'right', padding: '0.4rem 0' }}>المنصة</th><td style={{ padding: '0.4rem 0' }}>خطوة — منصة إدارة الدمج التعليمي</td></tr>
                <tr><th style={{ textAlign: 'right', padding: '0.4rem 0' }}>قاعدة البيانات</th><td style={{ padding: '0.4rem 0' }}><span className="pill progress">PostgreSQL</span></td></tr>
                <tr><th style={{ textAlign: 'right', padding: '0.4rem 0' }}>الذكاء الاصطناعي</th><td style={{ padding: '0.4rem 0' }}><span className="pill progress">FastAPI</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
