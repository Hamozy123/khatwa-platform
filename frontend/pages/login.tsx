import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch, setToken, setUser } from '../lib/api';
import { Spinner } from '../components/Spinner';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<{ access_token: string; user: { id: number; username: string; role: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setToken(data.access_token);
      setUser(data.user);
      await router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
          </svg>
        </div>
        <h1>خطوة</h1>
        <p className="muted">منصة إدارة غرف المصادر والدمج</p>
        <form onSubmit={onSubmit} style={{ marginTop: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="user">اسم المستخدم</label>
            <input
              id="user"
              className="input"
              value={username}
              onChange={(ev) => setUsername(ev.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="pass">كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                id="pass"
                type={showPassword ? 'text' : 'password'}
                className="input"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                autoComplete="current-password"
                style={{ paddingInlineEnd: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', insetInlineEnd: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--muted)',
                  display: 'flex', alignItems: 'center',
                }}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
          {error ? (
            <div className="form-error" style={{ fontSize: '0.85rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          ) : null}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem', gap: '0.5rem' }} disabled={loading}>
            {loading ? <Spinner /> : null}
            {loading ? 'جاري الدخول…' : 'تسجيل الدخول'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: '1.25rem', fontSize: '0.8rem' }}>
          أول تشغيل: يُنشأ مستخدم admin تلقائيًا بكلمة المرور password عندما تكون جدول المستخدمين فارغًا.
        </p>
      </div>
    </div>
  );
}
