import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-chess-darker via-chess-dark to-purple-900/20 flex items-center justify-center p-6">
          <div className="glass-card p-12 max-w-2xl text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-16 h-16 text-red-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Something went wrong</h1>
            <p className="text-white/60 mb-8">
              We encountered an unexpected error. Please try reloading the page.
            </p>
            {this.state.error && (
              <div className="mb-8 p-4 bg-white/5 rounded-lg text-left">
                <p className="text-sm font-mono text-red-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-chess-darker font-semibold rounded-lg hover:from-gold-400 hover:to-gold-500 transition-all duration-300 transform hover:scale-105"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
