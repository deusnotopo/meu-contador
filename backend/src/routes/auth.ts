import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { hashPassword, comparePassword } from '../lib/auth-utils';
import firebaseAdmin from 'firebase-admin';
import crypto from 'crypto';

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

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function createOpaqueToken() {
  return crypto.randomBytes(48).toString('hex');
}

function buildCookie(name: string, value: string, options: {
  maxAge?: number;
  httpOnly?: boolean;
}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'SameSite=Lax',
    ...(options.maxAge ? [`Max-Age=${options.maxAge}`] : []),
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
    ...(options.httpOnly === false ? [] : ['HttpOnly']),
  ];
  return parts.join('; ');
}

function buildExpiredCookie(name: string) {
  return `${name}=; Path=/; Max-Age=0; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}; HttpOnly`;
}

async function createSession(userId: string, request: any) {
  const refreshToken = createOpaqueToken();
  const csrfToken = createOpaqueToken();
  const refreshTokenHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      userId,
      refreshTokenHash,
      csrfToken,
      expiresAt,
      userAgent: request.headers['user-agent'] as string | undefined,
      ipAddress: request.ip,
    },
  });

  return { refreshToken, csrfToken, expiresAt };
}

async function revokeSession(refreshToken: string | undefined) {
  if (!refreshToken) return;
  await db.session.updateMany({
    where: {
      refreshTokenHash: sha256(refreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

function extractCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

async function issueAuthCookies(app: FastifyInstance, reply: any, user: any, request: any) {
  const accessToken = app.signAccessToken({
    id: user.id,
    email: user.email,
    name: user.name,
    isPro: user.isPro,
  });
  const { refreshToken, csrfToken } = await createSession(user.id, request);

  reply.header('Set-Cookie', [
    buildCookie(ACCESS_COOKIE_NAME, accessToken, { maxAge: ACCESS_TOKEN_TTL_SECONDS }),
    buildCookie(REFRESH_COOKIE_NAME, refreshToken, { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 }),
    buildCookie(CSRF_COOKIE_NAME, csrfToken, { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60, httpOnly: false }),
  ]);

  return { csrfToken };
}

function isDevtoolsAuthorized(headers: Record<string, unknown>) {
  const configuredSecret = process.env.AUTH_DEVTOOLS_SECRET?.trim();
  if (!configuredSecret) return false;

  const providedSecret = headers['x-devtools-secret'];
  return typeof providedSecret === 'string' && providedSecret === configuredSecret;
}

// Initialize Firebase Admin with service account credentials from env vars.
// Download the JSON from: Firebase Console → Project Settings → Service Accounts
// → Generate new private key. Then set the env vars below.
try {
  if (!firebaseAdmin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID || 'meucontador-367cf';

    if (privateKey && clientEmail && !privateKey.includes('dummy')) {
      // Full service account — verifyIdToken works properly (no external HTTP call)
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`,
      });
      console.log('[Firebase Admin] Initialized with service account credentials ✅');
    } else {
      // Fallback: only projectId — verifyIdToken will fail, uses tokeninfo fallback
      firebaseAdmin.initializeApp({ projectId });
      console.warn(
        '[Firebase Admin] ⚠️  Running without service account. ' +
        'Set FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL in .env for production.'
      );
    }
  }
} catch (e) {
  console.warn('[Firebase Admin] Init error:', e);
}


export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post('/auth/register', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
    schema: {
      tags: ['Auth'],
      body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      }),
      response: {
        200: authSuccessResponseSchema,
        409: z.object({
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const { email, password, name } = request.body as { email: string; password: string; name?: string };

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return reply.status(409).send({ message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await db.user.create({
      data: {
        email,
        passwordHash: hashedPassword, // Using the new field
        name: name || email.split('@')[0],
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    const { csrfToken } = await issueAuthCookies(app, reply, user, request);
    return { user: userWithoutPassword, csrfToken };
  });

  // POST /auth/google
  app.post('/auth/google', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    schema: {
      tags: ['Auth'],
      body: z.object({
        token: z.string()
      }),
      response: {
        200: authSuccessResponseSchema,
      }
    }
  }, async (request, reply) => {
    const { token } = request.body as { token: string };

    try {
      let email: string | undefined;
      let name: string | undefined;

      // Try Firebase Admin first (works if real service account is configured)
      try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        email = decodedToken.email;
        name = decodedToken.name;
      } catch (_adminErr) {
        // Fallback: verify token via Google's tokeninfo endpoint (no private key needed)
        try {
          const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
          if (!res.ok) {
            return (reply as any).status(401).send({ message: 'Invalid Google token' });
          }
          const info = await res.json() as { email?: string; name?: string; aud?: string | string[]; exp?: string };

          // Validate audience matches our Firebase project (exact match, not substring)
          const expectedAud = process.env.FIREBASE_PROJECT_ID || 'meucontador-367cf';
          const audMatches = Array.isArray(info.aud)
            ? info.aud.includes(expectedAud)
            : info.aud === expectedAud;
          if (!audMatches) {
            return (reply as any).status(401).send({ message: 'Token audience mismatch' });
          }

          // Check expiry
          if (info.exp && parseInt(info.exp) * 1000 < Date.now()) {
            return (reply as any).status(401).send({ message: 'Token expired' });
          }

          email = info.email;
          name = info.name;
        } catch (googleErr) {
          console.error('Google token verification failed');
          return (reply as any).status(401).send({ message: 'Unable to verify token' });
        }
      }

      if (!email) {
        return (reply as any).status(400).send({ message: 'Google account must have email' });
      }

      // Upsert User
      let user = await db.user.findUnique({ where: { email } });

      if (!user) {
        user = await db.user.create({
          data: {
            email,
            name: name || 'Google User',
            monthlyIncome: 0,
            passwordHash: '', // No password for Google users
          }
        });
      }

      const { passwordHash, ...rest } = user;
      const { csrfToken } = await issueAuthCookies(app, reply, user, request);
      return { user: rest, csrfToken };

    } catch (err) {
      console.error('Google auth route error');
      return (reply as any).status(500).send({ message: 'Internal Server Error' });
    }
  });

  // Login
  app.post('/auth/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
    schema: {
      tags: ['Auth'],
      body: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      response: {
        200: authSuccessResponseSchema,
        401: z.object({
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.warn('[Auth] Login failed: user not found');
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    if (user.passwordHash === "") {
      console.warn('[Auth] Login failed: password unavailable');
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      console.warn('[Auth] Login failed: password mismatch');
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const { passwordHash, ...userProfile } = user;
    console.info('[Auth] Login success');
    const { csrfToken } = await issueAuthCookies(app, reply, user, request);
    return { user: userProfile, csrfToken };
  });

  app.post('/auth/refresh', {
    schema: {
      tags: ['Auth'],
      response: {
        200: z.object({ success: z.boolean(), csrfToken: z.string() }),
        401: z.object({ message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const refreshToken = extractCookie(request.headers.cookie, REFRESH_COOKIE_NAME);
    const csrfToken = extractCookie(request.headers.cookie, CSRF_COOKIE_NAME);

    if (!refreshToken || !csrfToken) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    const session = await db.session.findFirst({
      where: {
        refreshTokenHash: sha256(refreshToken),
        csrfToken,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    await db.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const next = await createSession(session.user.id, request);
    const accessToken = app.signAccessToken({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      isPro: session.user.isPro,
    });

    reply.header('Set-Cookie', [
      buildCookie(ACCESS_COOKIE_NAME, accessToken, { maxAge: ACCESS_TOKEN_TTL_SECONDS }),
      buildCookie(REFRESH_COOKIE_NAME, next.refreshToken, { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 }),
      buildCookie(CSRF_COOKIE_NAME, next.csrfToken, { maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60, httpOnly: false }),
    ]);

    return { success: true, csrfToken: next.csrfToken };
  });

  app.post('/auth/logout', {
    schema: {
      tags: ['Auth'],
      response: {
        200: z.object({ success: z.boolean() }),
      },
    },
  }, async (request, reply) => {
    const refreshToken = extractCookie(request.headers.cookie, REFRESH_COOKIE_NAME);
    await revokeSession(refreshToken);

    reply.header('Set-Cookie', [
      buildExpiredCookie(ACCESS_COOKIE_NAME),
      buildExpiredCookie(REFRESH_COOKIE_NAME),
      `${CSRF_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
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
    preHandler: [(app as any).authenticate]
  }, async (request, reply) => {
    const jwtUser = request.user as { id: string };
    const user = await db.user.findUnique({
      where: { id: jwtUser.id },
      include: { workspaces: true }
    });

    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }
    
    // Remove passwordHash from response
    const { passwordHash, ...userProfile } = user;
    return userProfile;
  });

  // POST /auth/upgrade - Simulate Payment / Upgrade to PRO
  app.post('/auth/upgrade', {
    schema: {
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          success: z.boolean(),
          user: authUserSchema
        }),
        403: z.object({
          success: z.boolean(),
          message: z.string()
        })
      }
    },
    preHandler: [(app as any).authenticate]
  }, async (_request, reply) => {
    return reply.status(403).send({
      success: false,
      message: 'Upgrade manual desabilitado. Integre verificação de pagamento/entitlement antes de reativar este endpoint.'
    });
  });
  // DEV ONLY — reset/set password for any user (removes Google-only restriction)
  if (process.env.NODE_ENV === 'development') {
    app.post('/auth/dev/reset-password', async (request, reply) => {
      if (!isDevtoolsAuthorized(request.headers as Record<string, unknown>)) {
        return reply.status(403).send({ message: 'Devtools não autorizado' });
      }

      const { email, newPassword } = request.body as { email: string; newPassword: string };
      if (!email || !newPassword || newPassword.length < 6) {
        return reply.status(400).send({ message: 'Bad request: email and newPassword (min 6 chars) required' });
      }
      const user = await db.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(404).send({ message: 'User not found' });
      }
      const hashedPassword = await hashPassword(newPassword);
      await db.user.update({ where: { email }, data: { passwordHash: hashedPassword } });
      return { success: true, message: `Password reset for ${email}` };
    });

    app.get('/auth/dev/users', async (request, reply) => {
      if (!isDevtoolsAuthorized(request.headers as Record<string, unknown>)) {
        return reply.status(403).send({ message: 'Devtools não autorizado' });
      }

      const users = await db.user.findMany({ select: { id: true, email: true, name: true, passwordHash: true, createdAt: true } });
      return users.map(u => ({ ...u, hasPassword: u.passwordHash !== '' }));
    });
  }
}
