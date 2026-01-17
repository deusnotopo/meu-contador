import { describe, it, expect } from 'vitest';
import { currencyService, SUPPORTED_CURRENCIES } from './currency';

describe('currency utilities', () => {
  describe('SUPPORTED_CURRENCIES', () => {
    it('should have currencies defined', () => {
      expect(SUPPORTED_CURRENCIES).toBeDefined();
      expect(SUPPORTED_CURRENCIES.length).toBeGreaterThan(0);
    });
  });

  describe('currencyService.getRate', () => {
    it('should return 1 for BRL', () => {
      expect(currencyService.getRate('BRL')).toBe(1);
    });

    it('should return a number for USD', () => {
      const rate = currencyService.getRate('USD');
      expect(typeof rate).toBe('number');
      expect(rate).toBeGreaterThan(0);
    });
  });

  describe('currencyService.convertToBRL', () => {
    it('should return same value for BRL', () => {
      expect(currencyService.convertToBRL(100, 'BRL')).toBe(100);
    });

    it('should convert USD to BRL', () => {
      const result = currencyService.convertToBRL(100, 'USD');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('currencyService.format', () => {
    it('should format currency', () => {
      const result = currencyService.format(1234.56, 'BRL');
      expect(typeof result).toBe('string');
      expect(result).toContain('1');
      expect(result).toContain('234');
    });
  });
});
