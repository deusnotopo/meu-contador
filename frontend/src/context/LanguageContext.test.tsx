import { describe, it, expect } from 'vitest';
import { LanguageProvider, useLanguage } from './LanguageContext';

describe('useLanguage', () => {
  it('should export hook', () => {
    expect(typeof useLanguage).toBe('function');
  });

  it('should export provider', () => {
    expect(typeof LanguageProvider).toBe('function');
  });
});
