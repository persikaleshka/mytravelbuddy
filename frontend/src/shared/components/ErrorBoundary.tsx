import { Component, type ReactNode } from 'react';
import i18n from '@/shared/i18n';

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
          <h1>{i18n.t('errorBoundary.title')}</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.assign('/')}>
            {i18n.t('errorBoundary.goHome')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
