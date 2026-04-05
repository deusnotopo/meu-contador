import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, clearAuthSession, setCsrfToken } from './api';

describe('api client', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    clearAuthSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('should send csrf header for mutating requests', async () => {
    setCsrfToken('csrf-token');
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await api.post('/test', { hello: 'world' });

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = requestInit.headers as Headers;
    expect(headers.get('X-CSRF-Token')).toBe('csrf-token');
  });

  it('should retry after refresh on 401', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, csrfToken: 'next-csrf' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const response = await api.get<{ ok: boolean }>('/secured');
    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});