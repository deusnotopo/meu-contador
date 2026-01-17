import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';
import { MonitoringService } from '@/lib/monitoring';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  featureName?: string;
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

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { featureName = 'Unknown Feature' } = this.props;
    
    // Log error details
    logger.error(`Error in ${featureName}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Send to Monitoring (Sentry Mock)
    MonitoringService.captureError(error, {
      feature: featureName,
      componentStack: errorInfo.componentStack,
    });

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, featureName = 'this feature' } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
              Oops! Something went wrong
            </h2>
            
            <p className="text-slate-400 mb-6 text-sm">
              We encountered an error in {featureName}. Don't worry, your data is safe.
            </p>

            {((import.meta as any).env.DEV) && error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-xs text-red-400 hover:text-red-300 mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="text-xs bg-black/30 p-4 rounded-xl overflow-auto max-h-40 text-red-300">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
