import Link from 'next/link';
import { ReactNode } from 'react';

type Props = {
  icon?: ReactNode;
  title?: string;
  message: string;
  action?: { label: string; onClick?: () => void; href?: string };
};

const defaultIcon = (
  <svg width="64" height="64" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.3 }}>
    <rect x="8" y="12" width="64" height="56" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
    <line x1="24" y1="28" x2="56" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="24" y1="36" x2="48" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="24" y1="44" x2="52" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="56" cy="52" r="12" stroke="currentColor" strokeWidth="2" fill="none" />
    <line x1="56" y1="48" x2="56" y2="56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="52" y1="52" x2="60" y2="52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export function EmptyState({ icon, title, message, action }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem 1rem' }}>
      {icon || defaultIcon}
      {title ? <h3 style={{ margin: 0 }}>{title}</h3> : null}
      <p className="muted" style={{ margin: 0, textAlign: 'center' }}>{message}</p>
      {action ? (
        action.href ? (
          <Link href={action.href} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            {action.label}
          </Link>
        ) : (
          <button className="btn btn-primary" onClick={action.onClick} style={{ marginTop: '0.5rem' }}>
            {action.label}
          </button>
        )
      ) : null}
    </div>
  );
}
