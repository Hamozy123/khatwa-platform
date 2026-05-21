import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppShell } from '../../components/AppShell';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { apiFetch, getToken } from '../../lib/api';

type Student = {
  id: number;
  fullName: string;
  birthDate?: string;
  gender?: string;
  disabilityType?: string;
  diagnosis?: string;
  status?: string;
};

type PaginatedResult = { data: Student[]; total: number; skip: number; take: number };

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [take] = useState(20);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ skip: String(skip), take: String(take) });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      const res = await apiFetch<PaginatedResult>(`/students?${params}`);
      setStudents(res.data);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message);
    }
  }, [skip, take, debouncedSearch]);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    load();
  }, [load, router]);

  useEffect(() => {
    setSkip(0);
  }, [search]);

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  }

  const sorted = [...students].sort((a, b) => {
    const av = (a[sortBy as keyof Student] ?? '') as string;
    const bv = (b[sortBy as keyof Student] ?? '') as string;
    const cmp = typeof av === 'number' ? av - Number(bv) : av.localeCompare(bv, 'ar');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ field }: { field: string }) {
    if (sortBy !== field) return <span style={{ opacity: 0.2, marginRight: 3 }}>↕</span>;
    return <span style={{ marginRight: 3 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>;
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiFetch(`/students/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
    setDeleting(false);
  }

  if (!getToken()) return null;

  const totalPages = Math.ceil(total / take);
  const currentPage = Math.floor(skip / take) + 1;

  return (
    <AppShell title="سجل الطلاب">
      {error ? <p className="error">{error}</p> : null}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <Link href="/students/new" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          إضافة طالب
        </Link>
        <input
          className="input"
          placeholder="بحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: '200px', flex: 1 }}
        />
      </div>

      <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
        <table>
          <thead>
            <tr>
              {['id', 'fullName', 'disabilityType', 'diagnosis', 'status'].map((f) => (
                <th key={f} onClick={() => toggleSort(f)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <SortIcon field={f} />
                  {f === 'id' ? '#' : f === 'fullName' ? 'الاسم' : f === 'disabilityType' ? 'نوع الإعاقة' : f === 'diagnosis' ? 'التشخيص' : 'الحالة'}
                </th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>
                  <Link href={`/students/${s.id}`} style={{ fontWeight: 600 }}>
                    {s.fullName}
                  </Link>
                </td>
                <td>{s.disabilityType || '—'}</td>
                <td>{s.diagnosis || '—'}</td>
                <td>{s.status ? <span className={`pill ${s.status === 'active' ? 'progress' : 'pending'}`}>{s.status}</span> : '—'}</td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  <Link href={`/students/${s.id}`} className="btn btn-ghost btn-sm">
                    الملف
                  </Link>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteId(s.id)}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && !search ? <div className="card" style={{ border: 'none' }}><EmptyState message="لا يوجد طلاب بعد. أضف طالبًا جديدًا." action={{ label: 'إضافة طالب', href: '/students/new' }} /></div> : null}
        {students.length === 0 && search ? <div className="card" style={{ border: 'none' }}><EmptyState message="لا توجد نتائج للبحث." /></div> : null}
      </div>

      {totalPages > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" disabled={currentPage <= 1} onClick={() => setSkip(skip - take)}>السابق</button>
          <span className="muted">صفحة {currentPage} من {totalPages} ({total} طالب)</span>
          <button className="btn btn-ghost btn-sm" disabled={currentPage >= totalPages} onClick={() => setSkip(skip + take)}>التالي</button>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف جميع خطط IEP والأهداف المرتبطة به."
        confirmText="تأكيد الحذف"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
        danger
      />
    </AppShell>
  );
}
