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
        projectId: process.env.FIREBASE_PROJECT_ID || 'meu-contador-project'
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
    const { email, password, name } = request.body;

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
      // Verify ID Token
      // NOTE: For full security, we need the Service Account.
      // If setup fails (no creds), we might fallback or error.
      // For this dev environment without keys, we might need a workaround or assume the token is valid if we can't verify signature.
      // But let's try standard verification.

      let decodedToken;
      try {
           decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      } catch (verifyErr) {
           console.error("Firebase Verify Error:", verifyErr);
           // Fallback for dev/demo if we don't have service account keys set up correctly
           // DO NOT DO THIS IN PRODUCTION
           if (process.env.NODE_ENV === 'development') {
               console.warn("Dev mode: bypassing strict token check because Service Account might be missing.");
               const parts = token.split('.');
               if (parts.length === 3) {
                   const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                   decodedToken = payload;
               }
           }
           if (!decodedToken) return reply.status(401).send({ message: 'Invalid token' });
      }

      const { email, name, uid } = decodedToken;

      if (!email) {
        return reply.status(400).send({ message: 'Google account must have email' });
      }

      // Upsert User
      let user = await db.user.findUnique({ where: { email } });

      if (!user) {
        user = await db.user.create({
          data: {
            email,
            name: name || 'Google User',
            monthlyIncome: 0, // Assuming a default value for new users
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
      return reply.status(500).send({ message: 'Internal Server Error' });
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
    const { email, password } = request.body;

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || user.passwordHash === "") {
      // If user has no password (e.g. Firebase user), they must reset or use social login (if implemented)
      // For now, fail safe.
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const token = app.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      isPro: user.isPro
    });

    return { token, user: { id: user.id, email: user.email, name: user.name, isPro: user.isPro } };
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
}
