import { describe, expect, it, vi } from 'vitest';
import { AuthContext, useAuth } from './AuthContext';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(async (url: string) => {
      if (url === '/auth/me') {
        return { id: '1', email: 'user@example.com', name: 'User', isPro: false };
      }
      return { privacyMode: false, language: 'pt', theme: 'dark' };
    }),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
  clearAuthSession: vi.fn(),
  setCsrfToken: vi.fn(),
  subscribeToAuthSession: vi.fn((listener: (snapshot: { csrfToken: string | null; isAuthenticated: boolean }) => void) => {
    listener({ csrfToken: null, isAuthenticated: true });
    return () => undefined;
  }),
}));

vi.mock('@/lib/storage', () => ({
  syncAllData: vi.fn(async () => undefined),
}));

describe('useAuth', () => {
  it('should export hook and context', () => {
    expect(typeof useAuth).toBe('function');
    expect(AuthContext).toBeDefined();
  });
});
