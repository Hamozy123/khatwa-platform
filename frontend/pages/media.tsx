import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { AppShell } from '../components/AppShell';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { apiFetch, getApiBase, getToken } from '../lib/api';

type MediaItem = {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
  tags: string;
  studentId: number | null;
  createdAt: string;
};

export default function MediaPage() {
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!getToken()) { router.replace('/login'); return; }
    loadMedia();
  }, [router, filterTag]);

  async function loadMedia() {
    try {
      const params = filterTag ? `?tags=${encodeURIComponent(filterTag)}` : '';
      const data = await apiFetch<MediaItem[]>(`/media${params}`);
      setMedia(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر التحميل');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      if (tags) formData.append('tags', tags);

      const res = await fetch(`${getApiBase()}/media/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('فشل الرفع');
      if (fileRef.current) fileRef.current.value = '';
      setTags('');
      await loadMedia();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الرفع');
    } finally {
      setUploading(false);
    }
  }

  async function confirmDelete() {
    if (deleteId === null) return;
    try {
      await apiFetch(`/media/${deleteId}`, { method: 'DELETE' });
      setMedia((prev) => prev.filter((m) => m.id !== deleteId));
      setDeleteId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحذف');
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function fileIcon(mime: string) {
    if (mime.startsWith('image/')) return '🖼';
    if (mime.startsWith('video/')) return '🎬';
    if (mime.includes('pdf')) return '📄';
    return '📁';
  }

  if (!getToken()) return null;

  return (
    <AppShell title="بنك الوسائل التعليمية">
      {error ? <p className="error">{error}</p> : null}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
            <label>اختيار ملف</label>
            <input type="file" ref={fileRef} className="input" required />
          </div>
          <div className="form-group" style={{ margin: 0, minWidth: '140px' }}>
            <label>وسوم</label>
            <input className="input" value={tags} onChange={(ev) => setTags(ev.target.value)} placeholder="وسم،وسم" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? 'جاري الرفع…' : 'رفع'}
          </button>
        </form>
      </div>

      <div className="form-group" style={{ maxWidth: '300px' }}>
        <label>تصفية بالوسم</label>
        <input className="input" value={filterTag} onChange={(ev) => setFilterTag(ev.target.value)} placeholder="وسم للبحث" />
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        {media.length === 0 ? (
          <EmptyState message="لا توجد وسائل مرفوعة بعد." action={{ label: 'رفع ملف', onClick: () => document.querySelector<HTMLInputElement>('input[type=file]')?.focus() }} />
        ) : (
          <table>
            <thead>
              <tr>
                <th></th>
                <th>الاسم</th>
                <th>النوع</th>
                <th>الحجم</th>
                <th>الوسوم</th>
                <th>التاريخ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {media.map((m) => (
                <tr key={m.id}>
                  <td>{fileIcon(m.mimeType)}</td>
                  <td>{m.originalName}</td>
                  <td style={{ fontSize: '0.8rem' }}>{m.mimeType}</td>
                  <td>{formatSize(m.size)}</td>
                  <td>{m.tags || '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(m.createdAt).toLocaleDateString('ar-EG')}</td>
                  <td>
                    <button type="button" className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setDeleteId(m.id)}>
                      حذف
                    </button>
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
        message="حذف هذا الملف؟"
        confirmText="حذف"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        danger
      />
    </AppShell>
  );
}
