import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <h1>Что-то пошло не так</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.assign('/')}>На главную</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
