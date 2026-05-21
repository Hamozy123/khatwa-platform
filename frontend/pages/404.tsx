import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '6rem', fontWeight: 800, color: '#2F80ED', margin: 0, lineHeight: 1 }}>404</h1>
      <h2 style={{ fontSize: '1.25rem', color: '#2D3436', margin: '1rem 0 0.5rem' }}>الصفحة غير موجودة</h2>
      <p style={{ color: '#7F8C8D', marginBottom: '2rem' }}>عذراً، الصفحة التي تبحث عنها غير متوفرة.</p>
      <Link href="/dashboard" style={{ padding: '0.75rem 2rem', backgroundColor: '#2F80ED', color: 'white', textDecoration: 'none', borderRadius: '12px' }}>
        العودة إلى لوحة التحكم
      </Link>
    </div>
  );
}
