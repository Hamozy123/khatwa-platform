import Link from 'next/link';

export default function Custom500() {
  return (
    <div className="content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '1rem' }}>
      <div style={{ fontSize: '5rem', fontWeight: 700, color: 'var(--danger)' }}>500</div>
      <h2>خطأ في الخادم</h2>
      <p className="muted">عذراً، حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً</p>
      <Link href="/" className="btn btn-primary">العودة للرئيسية</Link>
    </div>
  );
}
