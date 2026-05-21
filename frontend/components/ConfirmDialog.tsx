import { ReactNode, useEffect } from 'react';

type Props = {
  isOpen: boolean;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
};

export function ConfirmDialog({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel, loading, danger }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => !loading && onCancel()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {typeof message === 'string' ? <p>{message}</p> : message}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>{cancelText || 'إلغاء'}</button>
          <button
            className="btn btn-primary"
            style={danger ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : undefined}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'جاري…' : (confirmText || 'تأكيد')}
          </button>
        </div>
      </div>
    </div>
  );
}
