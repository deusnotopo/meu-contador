/**
 * DashboardErrorBoundary.tsx
 * ──────────────────────────
 * Class-based Error Boundary for dashboard widgets.
 * Catches runtime errors in any child component and renders a
 * graceful fallback instead of crashing the whole page.
 *
 * Akita principle: "Cada widget deve ser um processo isolado.
 * Se um processo morre, os outros continuam."
 */

import React from "react";
import { motion, type Variants } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  children: React.ReactNode;
  componentName?: string;
  /** If true, renders a minimal inline error (for small cards) */
  compact?: boolean;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class DashboardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error(
      `[DashboardErrorBoundary] ${this.props.componentName ?? "Widget"} crashed`,
      { message: error.message, componentStack: info.componentStack?.slice(0, 300) }
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.compact) {
      return (
        <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4 flex items-center gap-3">
          <AlertTriangle size={14} className="text-amber-400/50 flex-shrink-0" />
          <span className="text-[10px] text-white/20">
            {this.props.componentName ?? "Widget"} indisponível
          </span>
          <button
            onClick={this.handleRetry}
            className="ml-auto text-[9px] text-white/20 hover:text-white/40 flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={9} /> Retry
          </button>
        </div>
      );
    }

    return (
      <div className="rounded-[var(--r5)] border border-amber-500/10 bg-amber-500/[0.02] p-5 flex flex-col items-center justify-center gap-3 min-h-[120px]">
        <AlertTriangle size={18} className="text-amber-400/50" />
        <div className="text-center">
          <div className="text-[11px] font-bold text-amber-400/60 mb-1">
            {this.props.componentName ?? "Componente"} temporariamente indisponível
          </div>
          <div className="text-[9px] text-white/20 font-mono max-w-[280px] truncate">
            {this.state.errorMessage}
          </div>
        </div>
        <button
          onClick={this.handleRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-amber-400/50 border border-amber-400/10 hover:border-amber-400/20 hover:text-amber-400/80 transition-all"
        >
          <RefreshCw size={9} /> Tentar Novamente
        </button>
      </div>
    );
  }
}

/**
 * WidgetWrapper — Convenience wrapper that combines motion + ErrorBoundary.
 * Use this for every intelligence widget in GlobalDashboard.
 */


interface WidgetWrapperProps {
  children: React.ReactNode;
  name: string;
  variants?: Variants;
  compact?: boolean;
  className?: string;
}

export const WidgetWrapper = ({
  children,
  name,
  variants,
  compact = false,
  className,
}: WidgetWrapperProps) => (
  <motion.div variants={variants} className={className}>
    <DashboardErrorBoundary componentName={name} compact={compact}>
      {children}
    </DashboardErrorBoundary>
  </motion.div>
);
