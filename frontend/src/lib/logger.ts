/**
 * Professional logging utility with environment-aware behavior
 * Replaces console.log statements throughout the application
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry = this.formatMessage(level, message, data);

    // In production, only log errors and warnings
    if (!this.isDevelopment && (level === 'info' || level === 'debug')) {
      return;
    }

    const prefix = `[${level.toUpperCase()}]`;
    const timestamp = new Date().toLocaleTimeString();

    switch (level) {
      case 'error':
        console.error(`${prefix} ${timestamp} ${message}`, data || '');
        // TODO: Send to error monitoring service (Sentry, etc.)
        break;
      case 'warn':
        console.warn(`${prefix} ${timestamp} ${message}`, data || '');
        break;
      case 'info':
        console.log(`${prefix} ${timestamp} ${message}`, data || '');
        break;
      case 'debug':
        console.debug(`${prefix} ${timestamp} ${message}`, data || '');
        break;
    }
  }

  /**
   * Log informational messages (development only)
   */
  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  /**
   * Log warnings (all environments)
   */
  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  /**
   * Log errors (all environments, sent to monitoring)
   */
  error(message: string, error?: unknown): void {
    this.log('error', message, error);
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  /**
   * Log sync operations (development only)
   */
  sync(message: string, data?: unknown): void {
    this.log('debug', `[Sync] ${message}`, data);
  }

  /**
   * Log toast notifications (development only)
   */
  toast(type: 'success' | 'error' | 'loading' | 'promise', message: string): void {
    const emoji = {
      success: '✅',
      error: '❌',
      loading: '⏳',
      promise: '🤞',
    };
    this.log('debug', `${emoji[type]} [Toast ${type}]: ${message}`);
  }
}

export const logger = new Logger();
