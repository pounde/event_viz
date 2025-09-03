import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-container" style={styles.container}>
          <div style={styles.content}>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>{this.state.error?.message || 'An unexpected error occurred'}</p>
            
            {process.env.NODE_ENV === 'development' && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details</summary>
                <pre style={styles.stackTrace}>
                  <strong>Stack Trace:</strong>
                  {'\n'}
                  {this.state.error?.stack}
                  {'\n\n'}
                  <strong>Component Stack:</strong>
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <button onClick={this.handleReset} style={styles.button}>
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  title: {
    color: '#e53e3e',
    marginBottom: '16px',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  message: {
    color: '#4a5568',
    marginBottom: '24px',
    fontSize: '16px',
  },
  details: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#f7fafc',
    borderRadius: '4px',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: '8px',
  },
  stackTrace: {
    fontSize: '12px',
    overflow: 'auto',
    color: '#718096',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#4299e1',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default ErrorBoundary;