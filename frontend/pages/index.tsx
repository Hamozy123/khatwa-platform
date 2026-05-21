import { useEffect, useState } from 'react';
import { getToken } from '../lib/api';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const target = getToken() ? '/dashboard' : '/login';
    window.location.replace(target);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F7FA' }}>
      <p style={{ color: '#7F8C8D' }}>جاري التحميل…</p>
    </div>
  );
}
