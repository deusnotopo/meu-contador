import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
}

/**
 * 🛡️ AKITA-STYLE RESILIENCE: DashboardErrorBoundary
 * Isolates UI failures at the component level.
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Dashboard Widget Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="bento-card border-red-500/20 bg-red-500/5 p-6 flex flex-col items-center justify-center text-center gap-2">
            <span className="text-2xl">⚠️</span>
            <div className="text-xs font-bold text-red-400 uppercase tracking-widest">
              Erro no Widget
            </div>
            {this.props.title && (
              <div className="text-sm font-medium text-white/60">
                {this.props.title}
              </div>
            )}
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-[10px] text-blue-400 font-bold uppercase hover:underline"
            >
              Tentar Novamente
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
