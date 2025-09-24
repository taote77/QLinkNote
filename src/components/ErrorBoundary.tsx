import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2>应用遇到了错误</h2>
          <p>请刷新页面重试</p>
          {this.state.error && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>错误详情</summary>
              <pre style={{ 
                backgroundColor: 'var(--bg-secondary)', 
                padding: '10px', 
                borderRadius: '4px',
                marginTop: '10px',
                fontSize: '12px'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: 'var(--text-accent)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;