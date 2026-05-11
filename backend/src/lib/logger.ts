/**
 * Logger
 * ──────
 * Structured logger for the backend.
 * Wraps Fastify's built-in pino instance when available,
 * otherwise uses a minimal structured console logger.
 *
 * Usage:
 *   import { logger } from './logger.js';
 *   logger.info('Server started');
 *   logger.error('Something failed', error);
 */

export interface Logger {
  info(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
  debug(msg: string, ...args: unknown[]): void;
}

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const LEVELS: Record<string, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const currentLevel = LEVELS[level] ?? 20;

function timestamp(): string {
  return new Date().toISOString();
}

export const logger: Logger = {
  debug(msg: string, ...args: unknown[]) {
    if (currentLevel <= 10) {
      process.stdout.write(`${timestamp()} DEBUG ${msg}${args.length ? ' ' + JSON.stringify(args) : ''}\n`);
    }
  },
  info(msg: string, ...args: unknown[]) {
    if (currentLevel <= 20) {
      process.stdout.write(`${timestamp()} INFO  ${msg}${args.length ? ' ' + JSON.stringify(args) : ''}\n`);
    }
  },
  warn(msg: string, ...args: unknown[]) {
    if (currentLevel <= 30) {
      process.stderr.write(`${timestamp()} WARN  ${msg}${args.length ? ' ' + JSON.stringify(args) : ''}\n`);
    }
  },
  error(msg: string, ...args: unknown[]) {
    if (currentLevel <= 40) {
      process.stderr.write(`${timestamp()} ERROR ${msg}${args.length ? ' ' + JSON.stringify(args) : ''}\n`);
    }
  },
};

export default logger;
