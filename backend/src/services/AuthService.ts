/**
 * AuthService
 * ───────────
 * Handles registration, login, session management and token lifecycles.
 */

import { FastifyInstance } from 'fastify';
import { db } from '../lib/db.js';
import * as UserRepository from '../repositories/UserRepository.js';
import * as WorkspaceRepository from '../repositories/WorkspaceRepository.js';
import { hashPassword, comparePassword, sha256, createOpaqueToken, buildCookie, buildExpiredCookie, extractCookie } from '../lib/auth-utils.js';
import { firebaseAdmin } from '../lib/firebase.js';
import { writeAuditLog } from '../lib/audit.js';

const ACCESS_COOKIE_NAME = 'mc_access_token';
const REFRESH_COOKIE_NAME = 'mc_refresh_token';
const CSRF_COOKIE_NAME = 'mc_csrf_token';
const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
const REFRESH_TOKEN_TTL_DAYS = 7;

export interface AuthSession {
  csrfToken: string;
}

// ── Private Helpers ──────────────────────────────────────────────────────────

async function createSession(userId: string, clientInfo: { ip: string; userAgent?: string }) {
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
      userAgent: clientInfo.userAgent,
      ipAddress: clientInfo.ip,
    },
  });

  return { refreshToken, csrfToken, expiresAt };
}

// issueAuthCookies logic moved to route level for decoupling

// ── Public API ────────────────────────────────────────────────────────────────

export async function register(body: any, clientInfo: { ip: string; userAgent?: string }) {
  const { email, password, name } = body;

  const existingUser = await UserRepository.findByEmail(email);
  if (existingUser) {
    throw new Error('USER_ALREADY_EXISTS');
  }

  const hashedPassword = await hashPassword(password);
  const user = await UserRepository.createWithWorkspace({
    email,
    passwordHash: hashedPassword,
    name: name || email.split('@')[0],
  });

  const { refreshToken, csrfToken } = await createSession(user.id, clientInfo);
  
  await writeAuditLog({
    userId: user.id,
    action: 'user.register',
    resource: 'user',
    resourceId: user.id,
    metadata: { method: 'email' }
  });

  return { 
    user: UserRepository.formatUserProfile(user), 
    refreshToken, 
    csrfToken 
  };
}

export async function login(body: any, clientInfo: { ip: string; userAgent?: string }) {
  const { email, password } = body;

  const user = await UserRepository.findByEmail(email);
  if (!user || user.passwordHash === "") {
    throw new Error('INVALID_CREDENTIALS');
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const { refreshToken, csrfToken } = await createSession(user.id, clientInfo);
  
  await writeAuditLog({
    userId: user.id,
    action: 'user.login',
    resource: 'session',
    metadata: { method: 'email' }
  });

  return { 
    user: UserRepository.formatUserProfile(user), 
    refreshToken, 
    csrfToken 
  };
}

export async function googleAuth(body: any, clientInfo: { ip: string; userAgent?: string }) {
  const { token } = body;

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    const { email, name } = decodedToken;

    if (!email) {
      throw new Error('GOOGLE_AUTH_MISSING_EMAIL');
    }

    let user = await UserRepository.findByEmail(email);

    if (!user) {
      user = await UserRepository.createWithWorkspace({
        email,
        name: name || 'Google User',
        passwordHash: '',
      });
    }

    const { refreshToken, csrfToken } = await createSession(user!.id, clientInfo);
    return { 
      user: UserRepository.formatUserProfile(user), 
      refreshToken, 
      csrfToken 
    };
  } catch (err) {
    console.error('[AuthService] Google auth error:', err);
    throw new Error('INVALID_GOOGLE_TOKEN');
  }
}

export async function refreshToken(oldRefreshToken: string | undefined, oldCsrfToken: string | undefined, clientInfo: { ip: string; userAgent?: string }) {
  if (!oldRefreshToken || !oldCsrfToken) {
    throw new Error('UNAUTHORIZED');
  }

  const session = await db.session.findFirst({
    where: {
      refreshTokenHash: sha256(oldRefreshToken),
      csrfToken: oldCsrfToken,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  }).catch(() => null);

  if (!session) {
    throw new Error('UNAUTHORIZED');
  }

  const updated = await db.session.updateMany({
    where: { id: session.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (updated.count === 0) {
    // Anti-replay: revoke all sessions for this user
    await db.session.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    throw new Error('INVALID_SESSION_REPLAY');
  }

  const { refreshToken, csrfToken } = await createSession(session.user.id, clientInfo);
  
  return { 
    success: true, 
    user: session.user, 
    refreshToken, 
    csrfToken 
  };
}

export async function logout(refreshToken: string | undefined) {
  if (refreshToken) {
    await db.session.updateMany({
      where: { refreshTokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  return { success: true };
}
