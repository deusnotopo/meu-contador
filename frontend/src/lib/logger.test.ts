import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { logger } from './logger';
import type { MockInstance } from 'vitest';

describe('logger', () => {
  let consoleLogSpy: MockInstance;
  let consoleErrorSpy: MockInstance;
  let consoleWarnSpy: MockInstance;
  let consoleDebugSpy: MockInstance;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log errors', () => {
      logger.error('Error occurred');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warnings', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('sync', () => {
    it('should log sync operations', () => {
      logger.sync('Syncing data');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });

  describe('toast', () => {
    it('should log toast notifications', () => {
      logger.toast('success', 'Operation successful');
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });
});
