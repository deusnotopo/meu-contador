import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as AuthService from '../services/AuthService.js';
import * as UserRepository from '../repositories/UserRepository.js';
import { buildCookie, buildExpiredCookie, extractCookie } from '../lib/auth-utils.js';

const ACCESS_COOKIE_NAME = 'mc_access_token';
const REFRESH_COOKIE_NAME = 'mc_refresh_token';
const CSRF_COOKIE_NAME = 'mc_csrf_token';
const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
const REFRESH_TOKEN_TTL_DAYS = 7;

const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  isPro: z.boolean().optional(),
  monthlyIncome: z.number().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
}).passthrough();

const authSuccessResponseSchema = z.object({
  user: authUserSchema,
  csrfToken: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  const isTestRuntime = process.env.NODE_ENV === 'test' || !!process.env.VITEST || !!process.env.VITEST_WORKER_ID;
  const authRateLimit = isTestRuntime
    ? { max: 1000, timeWindow: '1 minute' as const }
    : { max: 5, timeWindow: '1 minute' as const };

  // Register
  app.post('/auth/register', {
    config: { rateLimit: authRateLimit },
    schema: {
      tags: ['Auth'],
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
      }),
      response: {
        200: authSuccessResponseSchema,
        409: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    try {
      const clientInfo = { ip: request.ip, userAgent: request.headers['user-agent'] };
      const result = await AuthService.register(request.body, clientInfo);
      
      const accessToken = app.signAccessToken({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        isPro: result.user.isPro,
      });

      reply.header('Set-Cookie', [
        buildCookie(ACCESS_COOKIE_NAME, accessToken, { maxAge: ACCESS_TOKEN_TTL_SECONDS }),
        buildCookie(REFRESH_COOKIE_NAME, result.refreshToken, { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 }),
        buildCookie(CSRF_COOKIE_NAME, result.csrfToken, { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 }),
      ]);

      return { user: result.user, csrfToken: result.csrfToken };
    } catch (err: any) {
      if (err.message === 'USER_ALREADY_EXISTS') {
        return reply.status(409).send({ message: 'Usuário já existe' });
      }
      throw err;
    }
  });

  // Google Login
  app.post('/auth/google', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: {
      tags: ['Auth'],
      body: z.object({ token: z.string() }),
      response: {
        200: authSuccessResponseSchema,
      }
    }
  }, async (request, reply) => {
    try {
      const clientInfo = { ip: request.ip, userAgent: request.headers['user-agent'] };
      const result = await AuthService.googleAuth(request.body, clientInfo);

      const accessToken = app.signAccessToken({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        isPro: result.user.isPro,
      });

      reply.header('Set-Cookie', [
        buildCookie(ACCESS_COOKIE_NAME, accessToken, { maxAge: ACCESS_TOKEN_TTL_SECONDS }),
        buildCookie(REFRESH_COOKIE_NAME, result.refreshToken, { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 }),
        buildCookie(CSRF_COOKIE_NAME, result.csrfToken, { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 }),
      ]);

      return { user: result.user, csrfToken: result.csrfToken };
    } catch (err: any) {
      if (err.message === 'INVALID_GOOGLE_TOKEN') {
        const error = new Error('Token do Google inválido');
        (error as any).statusCode = 401;
        throw error;
      }
      throw err;
    }
  });

  // Login
  app.post('/auth/login', {
    config: { rateLimit: authRateLimit },
    schema: {
      tags: ['Auth'],
      body: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      response: {
        200: authSuccessResponseSchema,
        401: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    try {
      const clientInfo = { ip: request.ip, userAgent: request.headers['user-agent'] };
      const result = await AuthService.login(request.body, clientInfo);

      const accessToken = app.signAccessToken({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        isPro: result.user.isPro,
      });

      reply.header('Set-Cookie', [
        buildCookie(ACCESS_COOKIE_NAME, accessToken, { maxAge: ACCESS_TOKEN_TTL_SECONDS }),
        buildCookie(REFRESH_COOKIE_NAME, result.refreshToken, { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 }),
        buildCookie(CSRF_COOKIE_NAME, result.csrfToken, { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 }),
      ]);

      return { user: result.user, csrfToken: result.csrfToken };
    } catch (err: any) {
      if (err.message === 'INVALID_CREDENTIALS') {
        return reply.status(401).send({ message: 'Credenciais inválidas' });
      }
      throw err;
    }
  });

  // Token Refresh
  app.post('/auth/refresh', {
    schema: {
      tags: ['Auth'],
      response: {
        200: z.object({ success: z.boolean(), csrfToken: z.string() }),
        401: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    try {
      const oldRefreshToken = extractCookie(request.headers.cookie, REFRESH_COOKIE_NAME);
      const oldCsrfToken = extractCookie(request.headers.cookie, CSRF_COOKIE_NAME);
      const clientInfo = { ip: request.ip, userAgent: request.headers['user-agent'] };

      const result = await AuthService.refreshToken(oldRefreshToken, oldCsrfToken, clientInfo);

      const accessToken = app.signAccessToken({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        isPro: result.user.isPro,
      });

      reply.header('Set-Cookie', [
        buildCookie(ACCESS_COOKIE_NAME, accessToken, { maxAge: ACCESS_TOKEN_TTL_SECONDS }),
        buildCookie(REFRESH_COOKIE_NAME, result.refreshToken, { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 }),
        buildCookie(CSRF_COOKIE_NAME, result.csrfToken, { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 }),
      ]);

      return { success: true, csrfToken: result.csrfToken };
    } catch (err: any) {
      return reply.status(401).send({ message: 'Sessão inválida' });
    }
  });

  // Logout
  app.post('/auth/logout', {
    schema: {
      tags: ['Auth'],
      response: {
        200: z.object({ success: z.boolean() }),
      },
    },
  }, async (request, reply) => {
    const refreshToken = extractCookie(request.headers.cookie, REFRESH_COOKIE_NAME);
    await AuthService.logout(refreshToken);

    reply.header('Set-Cookie', [
      buildExpiredCookie(ACCESS_COOKIE_NAME),
      buildExpiredCookie(REFRESH_COOKIE_NAME),
      buildExpiredCookie(CSRF_COOKIE_NAME),
    ]);

    return { success: true };
  });

  // Me
  app.get('/auth/me', {
    schema: {
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: authUserSchema,
        404: z.object({ message: z.string() }),
      },
    },
    preHandler: [app.authenticate]
  }, async (request, reply) => {
    const user = await UserRepository.findWithWorkspaces(request.user.id);
    if (!user) return reply.status(404).send({ message: 'User not found' });
    return user;
  });

  // Upgrade to PRO
  app.post('/auth/upgrade', {
    schema: {
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ success: z.boolean(), user: authUserSchema }),
        403: z.object({ success: z.boolean(), message: z.string() })
      }
    },
    preHandler: [app.authenticate]
  }, async (_request, reply) => {
    return reply.status(403).send({
      success: false,
      message: 'Upgrade manual desabilitado. Integre verificação de pagamento antes de reativar este endpoint.'
    });
  });
}
