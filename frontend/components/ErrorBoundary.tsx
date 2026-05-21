import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', color: '#E74C3C', marginBottom: '1rem' }}>حدث خطأ غير متوقع</h1>
          <p style={{ color: '#7F8C8D', marginBottom: '2rem' }}>حدث خطأ أثناء تحميل الصفحة. يرجى تحديث الصفحة والمحاولة مرة أخرى.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.75rem 2rem', backgroundColor: '#2F80ED', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
            تحديث الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
