import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry error tracking
 * 
 * @param dsn - Sentry DSN from project settings
 * @param environment - Current environment (development, staging, production)
 */
export function initSentry(dsn?: string, environment = import.meta.env.MODE) {
  // Only initialize in production or if DSN is explicitly provided
  if (!dsn && environment === 'development') {
    console.log('Sentry: Skipping initialization in development mode');
    return;
  }

  // Use environment variable or provided DSN
  const sentryDsn = dsn || import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    console.warn('Sentry: No DSN provided, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    
    // Performance Monitoring
    integrations: [
      new Sentry.BrowserTracing({
        // Set sampling rate for performance monitoring
        tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
      }),
      new Sentry.Replay({
        // Session Replay for debugging
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring sample rate
    // 1.0 = 100% of transactions, adjust for production
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Session Replay sample rate
    // 0.1 = 10% of sessions will be recorded
    replaysSessionSampleRate: 0.1,
    
    // Replay on error sample rate
    // 100% of sessions with errors will be recorded
    replaysOnErrorSampleRate: 1.0,

    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'unknown',

    // Before send hook - filter sensitive data
    beforeSend(event) {
      // Filter out sensitive information
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      // Don't send events in development unless explicitly enabled
      if (environment === 'development' && !import.meta.env.VITE_SENTRY_DEBUG) {
        return null;
      }

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random plugins/extensions
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Network errors
      'NetworkError',
      'Network request failed',
      // Firebase auth errors (handled by app)
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
    ],
  });

  console.log(`Sentry initialized for ${environment} environment`);
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    data,
    level: 'info',
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

export { Sentry };
