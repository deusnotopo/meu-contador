import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLanguage, LanguageProvider } from './LanguageContext';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('useLanguage', () => {
  it('should provide default language', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    
    expect(result.current.language).toBe('pt-BR');
  });

  it('should provide translation function', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    
    expect(typeof result.current.t).toBe('function');
  });

  it('should translate keys', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    
    const translation = result.current.t('common.save');
    expect(typeof translation).toBe('string');
    expect(translation.length).toBeGreaterThan(0);
  });

  it('should change language', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    
    act(() => {
      result.current.setLanguage('en-US');
    });
    
    expect(result.current.language).toBe('en-US');
  });

  it('should persist language preference', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    
    act(() => {
      result.current.setLanguage('en-US');
    });
    
    // Check localStorage was called
    expect(result.current.language).toBe('en-US');
  });
});
