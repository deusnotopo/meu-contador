import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../lib/db';
import { hashPassword, comparePassword } from '../lib/auth-utils';
import firebaseAdmin from 'firebase-admin';

// Initialize Firebase Admin (mock or real)
// In a real scenario, you'd use a service account key
try {
  if (!firebaseAdmin.apps.length) {
    firebaseAdmin.initializeApp({
        // Must match the frontend token issuer
        projectId: process.env.FIREBASE_PROJECT_ID || 'meucontador-367cf'
    });
  }
} catch (e) {
  console.log('Firebase Admin init warning:', e);
}

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post('/auth/register', {
    schema: {
      tags: ['Auth'],
      body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      }),
      response: {
        200: z.object({
          token: z.string(),
          user: z.object({
            id: z.string(),
            email: z.string(),
            name: z.string().nullable(),
            isPro: z.boolean(),
          }),
        }),
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

    const token = app.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      isPro: user.isPro
    });

    return { token, user: userWithoutPassword };
  });

  // POST /auth/google
  app.post('/auth/google', {
    schema: {
      tags: ['Auth'],
      body: z.object({
        token: z.string()
      }),
      response: {
        200: z.object({
          token: z.string(),
          user: z.any()
        })
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
          const info = await res.json() as { email?: string; name?: string; aud?: string; exp?: string };

          // Validate audience matches our Firebase project
          const expectedAud = process.env.FIREBASE_PROJECT_ID || 'meucontador-367cf';
          if (!info.aud?.includes(expectedAud)) {
            return (reply as any).status(401).send({ message: 'Token audience mismatch' });
          }

          // Check expiry
          if (info.exp && parseInt(info.exp) * 1000 < Date.now()) {
            return (reply as any).status(401).send({ message: 'Token expired' });
          }

          email = info.email;
          name = info.name;
        } catch (googleErr) {
          console.error('Google tokeninfo error:', googleErr);
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

      const appToken = app.jwt.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        isPro: user.isPro
      });

      const { passwordHash, ...rest } = user;
      return { token: appToken, user: rest };

    } catch (err) {
      console.error(err);
      return (reply as any).status(500).send({ message: 'Internal Server Error' });
    }
  });

  // Login
  app.post('/auth/login', {
    schema: {
      tags: ['Auth'],
      body: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      response: {
        200: z.object({
          token: z.string(),
          user: z.object({
            id: z.string(),
            email: z.string(),
            name: z.string().nullable(),
            isPro: z.boolean(),
          }),
        }),
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
      console.log(`[Auth] Login failed: User not found (${email})`);
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    if (user.passwordHash === "") {
      console.log(`[Auth] Login failed: User has no password (Google user?) (${email})`);
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      console.log(`[Auth] Login failed: Password mismatch (${email})`);
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    console.log(`[Auth] Login success: ${email}`);
    const token = app.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      isPro: user.isPro
    });

    const { passwordHash, ...userProfile } = user;
    return { token, user: userProfile };
  });

  // Me
  app.get('/auth/me', {
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
          user: z.any()
        })
      }
    },
    preHandler: [(app as any).authenticate]
  }, async (request) => {
    const userId = (request.user as any).id;
    
    const user = await db.user.update({
      where: { id: userId },
      data: { isPro: true }
    });
    
    const { passwordHash, ...userProfile } = user;
    
    // We don't necessarily need to sign a new JWT here if the client
    // just needs the updated user object or will re-verify via auth/me.
    return { success: true, user: userProfile };
  });
  // DEV ONLY — reset/set password for any user (removes Google-only restriction)
  if (process.env.NODE_ENV === 'development') {
    app.post('/auth/dev/reset-password', async (request, reply) => {
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

    app.get('/auth/dev/users', async (_request, reply) => {
      const users = await db.user.findMany({ select: { id: true, email: true, name: true, passwordHash: true, createdAt: true } });
      return users.map(u => ({ ...u, hasPassword: u.passwordHash !== '' }));
    });
  }
}
