import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AppShell } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { apiFetch, getToken, getUser } from '../lib/api';

type User = {
  id: number;
  username: string;
  role: string;
  governorate?: string;
  directorate?: string;
  administration?: string;
  schoolName?: string;
};

type LocationItem = { id: number; type: string; name: string; parentId: number | null };

const ROLE_LABELS: Record<string, string> = {
  admin: 'مسؤول النظام',
  teacher_m: 'معلم',
  teacher_f: 'معلمة',
  school_principal: 'مدير مدرسة',
  admin_manager: 'مدير إدارة',
  deputy_directorate: 'وكيل مديرية',
};

const ALL_ROLES = Object.keys(ROLE_LABELS);

const emptyForm = { username: '', password: '', role: 'teacher_m', governorate: '', directorate: '', administration: '', schoolName: '' };

export default function UsersPage() {
  const router = useRouter();
  const currentUser = getUser();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetId, setResetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [governorates, setGovernorates] = useState<LocationItem[]>([]);
  const [directorates, setDirectorates] = useState<LocationItem[]>([]);
  const [administrations, setAdministrations] = useState<LocationItem[]>([]);

  function load() {
    apiFetch<User[]>('/auth/users').then(setUsers).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'admin_manager') {
      router.replace('/dashboard'); return;
    }
    load();
    apiFetch<LocationItem[]>('/locations?type=governorate').then(setGovernorates).catch(() => {});
  }, [router]);

  useEffect(() => {
    if (form.governorate) {
      const gov = governorates.find((g) => g.name === form.governorate);
      if (gov) {
        apiFetch<LocationItem[]>(`/locations?type=directorate&parentId=${gov.id}`)
          .then(setDirectorates).catch(() => {});
      }
    } else { setDirectorates([]); }
  }, [form.governorate, governorates]);

  useEffect(() => {
    if (form.directorate) {
      const dir = directorates.find((d) => d.name === form.directorate);
      if (dir) {
        apiFetch<LocationItem[]>(`/locations?type=administration&parentId=${dir.id}`)
          .then(setAdministrations).catch(() => {});
      }
    } else { setAdministrations([]); }
  }, [form.directorate, directorates]);

  function resetForm() { setForm(emptyForm); setEditId(null); setShowForm(false); setError(''); }

  function openEdit(u: User) {
    setForm({ username: u.username, password: '', role: u.role, governorate: u.governorate || '', directorate: u.directorate || '', administration: u.administration || '', schoolName: u.schoolName || '' });
    setEditId(u.id);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        const body: any = { username: form.username, role: form.role, governorate: form.governorate, directorate: form.directorate, administration: form.administration, schoolName: form.schoolName };
        if (form.password) body.password = form.password;
        await apiFetch(`/auth/users/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
        showToast('تم تحديث المستخدم بنجاح', 'success');
      } else {
        await apiFetch('/auth/users', { method: 'POST', body: JSON.stringify(form) });
        showToast('تم إنشاء المستخدم بنجاح', 'success');
      }
      resetForm();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل العملية');
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiFetch(`/auth/users/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      showToast('تم حذف المستخدم بنجاح', 'success');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحذف');
    }
    setDeleting(false);
  }

  async function handleResetPassword() {
    if (!resetId || !resetPassword) return;
    setResetting(true);
    try {
      await apiFetch(`/auth/users/${resetId}/reset-password`, { method: 'POST', body: JSON.stringify({ password: resetPassword }) });
      setResetId(null);
      setResetPassword('');
      showToast('تم إعادة تعيين كلمة المرور بنجاح', 'success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل إعادة التعيين');
    }
    setResetting(false);
  }

  if (!getToken()) return null;
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'admin_manager') {
    return <AppShell title="إدارة المستخدمين"><p className="error">ليس لديك صلاحية الوصول لهذه الصفحة.</p></AppShell>;
  }

  return (
    <AppShell title="إدارة المستخدمين">
      {error ? <p className="error">{error}</p> : null}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'إلغاء' : 'إضافة مستخدم'}
        </button>
      </div>

      {showForm ? (
        <div className="card" style={{ maxWidth: '560px', marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>{editId ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>اسم المستخدم</label>
              <input className="input" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label>كلمة المرور {editId ? '(اتركه فارغًا إذا لم ترد التغيير)' : ''}</label>
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editId ? 'اترك فارغًا' : 'khatwa123'} />
            </div>
            <div className="form-group">
              <label>الدور الوظيفي</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ALL_ROLES.map((k) => (<option key={k} value={k}>{ROLE_LABELS[k]}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label>المحافظة</label>
              <select className="input" value={form.governorate} onChange={(e) => { setForm({ ...form, governorate: e.target.value, directorate: '', administration: '', schoolName: '' }); }}>
                <option value="">— اختر —</option>
                {governorates.map((g) => (<option key={g.id} value={g.name}>{g.name}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label>المديرية</label>
              <select className="input" value={form.directorate} onChange={(e) => { setForm({ ...form, directorate: e.target.value, administration: '', schoolName: '' }); }} disabled={!form.governorate}>
                <option value="">— اختر —</option>
                {directorates.map((d) => (<option key={d.id} value={d.name}>{d.name}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label>الإدارة</label>
              <select className="input" value={form.administration} onChange={(e) => { setForm({ ...form, administration: e.target.value, schoolName: '' }); }} disabled={!form.directorate}>
                <option value="">— اختر —</option>
                {administrations.map((a) => (<option key={a.id} value={a.name}>{a.name}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label>المدرسة</label>
              <input className="input" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} placeholder="اسم المدرسة" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">{editId ? 'حفظ' : 'إضافة'}</button>
              <button type="button" className="btn" onClick={resetForm}>إلغاء</button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم المستخدم</th>
              <th>الدور</th>
              <th>المحافظة</th>
              <th>المديرية</th>
              <th>الإدارة</th>
              <th>المدرسة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td><span className="pill pending">{ROLE_LABELS[u.role] || u.role}</span></td>
                <td>{u.governorate || '—'}</td>
                <td>{u.directorate || '—'}</td>
                <td>{u.administration || '—'}</td>
                <td>{u.schoolName || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => openEdit(u)}>تعديل</button>
                    <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => { setResetId(u.id); setResetPassword(''); }}>كلمة المرور</button>
                    <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#e74c3c' }} onClick={() => setDeleteId(u.id)}>حذف</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا المستخدم؟"
        confirmText="تأكيد"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
        danger
      />

      {resetId ? (
        <div className="modal-overlay" onClick={() => setResetId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>إعادة تعيين كلمة المرور</h3>
            <p>أدخل كلمة المرور الجديدة للمستخدم <strong>{users.find((u) => u.id === resetId)?.username}</strong></p>
            <input className="input" type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="كلمة المرور الجديدة" />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" disabled={resetting || !resetPassword} onClick={handleResetPassword}>{resetting ? 'جاري...' : 'حفظ'}</button>
              <button className="btn" onClick={() => setResetId(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
