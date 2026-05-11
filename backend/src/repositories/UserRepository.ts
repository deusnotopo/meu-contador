/**
 * UserRepository
 * ──────────────
 * Single place for all Prisma queries on the User model.
 */

import { db } from '../lib/db.js';
import type { Prisma, User } from '@prisma/client';

// ── Mapping Helper ────────────────────────────────────────────────────────────

export function formatUserProfile(user: User | null) {
  if (!user) return user;
  const { passwordHash, ...profile } = user;
  
  // Base-100 descaling
  if (profile.monthlyIncome != null) profile.monthlyIncome = profile.monthlyIncome / 100;
  if (profile.initialBalance != null) profile.initialBalance = profile.initialBalance / 100;
  if (profile.fireTargetIncome != null) profile.fireTargetIncome = profile.fireTargetIncome / 100;
  
  return profile;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function findById(id: string) {
  const user = await db.user.findUnique({
    where: { id },
  });
  return formatUserProfile(user);
}

export async function findByEmail(email: string) {
  const user = await db.user.findUnique({
    where: { email },
  });
  // We don't descale here because we often need the passwordHash for login
  return user;
}

export async function create(data: Prisma.UserCreateInput, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  const user = await client.user.create({ data });
  return formatUserProfile(user);
}

/**
 * Creates a User AND a default personal Workspace in a single atomic transaction.
 * Called during registration and Google Auth to ensure users always have a workspace.
 */
export async function createWithWorkspace(data: {
  email: string;
  name: string;
  passwordHash: string;
}) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: `Workspace de ${data.name || data.email.split('@')[0]}`,
        ownerId: user.id,
        members: { connect: { id: user.id } },
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { currentWorkspaceId: workspace.id },
    });

    return user;
  });
}

export async function update(id: string, data: Prisma.UserUpdateInput, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  const user = await client.user.update({
    where: { id },
    data,
  });
  return formatUserProfile(user);
}

export async function findWithWorkspaces(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    include: { workspaces: true }
  });
  return formatUserProfile(user);
}
