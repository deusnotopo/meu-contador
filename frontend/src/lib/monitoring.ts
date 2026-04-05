import { captureException as sentryCaptureException } from './sentry';
import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';

/**
 * Operational Excellence Monitoring Service.
 * Connects to Sentry for error tracking and Web Vitals for performance.
 */

export const MonitoringService = {
  /**
   * Initializes monitoring systems.
   */
  init: () => {
    if (import.meta.env.DEV) {
      console.log('[Monitoring] Dev mode — monitoramento ativo mas sem envio ao Sentry.');
    }
    MonitoringService.setupWebVitals();
  },

  /**
   * Captures errors and sends to Sentry.
   */
  captureError: (error: Error, context?: Record<string, unknown>) => {
    sentryCaptureException(error, context);
    if (import.meta.env.DEV) {
      console.group(`[Monitoring] Erro capturado: ${error.message}`);
      console.error(error);
      if (context) console.log('Context:', context);
      console.groupEnd();
    }
  },

  /**
   * Logs performance metrics (Web Vitals) and sends to analytics.
   */
  logMetric: (metric: { name: string; value: number; id: string }) => {
    if (import.meta.env.DEV) {
      console.log(`[Web Vital] ${metric.name}:`, Math.round(metric.value * 100) / 100);
    }
  },

  /**
   * Sets up automated Web Vitals tracking using the web-vitals library.
   */
  setupWebVitals: () => {
    if (typeof window === 'undefined') return;
    try {
      onCLS(MonitoringService.logMetric);
      onFCP(MonitoringService.logMetric);
      onLCP(MonitoringService.logMetric);
      onTTFB(MonitoringService.logMetric);
    } catch {
      // web-vitals não disponível — ignorar silenciosamente
    }
  },
};

