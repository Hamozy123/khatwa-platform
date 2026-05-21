export function Spinner({ size }: { size?: 'sm' | 'lg' }) {
  return <div className={`spinner${size === 'lg' ? ' spinner-lg' : ''}`} />;
}
