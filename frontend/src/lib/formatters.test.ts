import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from './formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format numbers as currency', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1');
      expect(result).toContain('234');
      expect(result).toContain('56');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });
  });

  describe('formatDate', () => {
    it('should format dates', () => {
      const result = formatDate('2024-03-15');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
