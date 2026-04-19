import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/lib/logger";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Akita Mode Resiliency: WidgetErrorBoundary
 * Impedem que uma falha em um widget secundário mate o shell do aplicativo inteiro.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(`Widget Failure [${this.props.name || "Unknown"}]:`, {
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[120px] w-full flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center shadow-lg backdrop-blur-sm">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-red-200">
            Falha no Componente {this.props.name && `(${this.props.name})`}
          </h3>
          <p className="mb-4 text-xs text-red-400/80 max-w-[280px]">
            Ocorreu um erro ao carregar esta seção. Tentamos isolar o problema para que você continue usando o resto do app.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={this.handleReset}
            className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Tentar Novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
