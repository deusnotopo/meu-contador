export interface WorkspaceCreateData {
  name: string;
  ownerId: string;
}

/**
 * WorkspaceRepository
 * ───────────────────
 * Single place for all Prisma queries on the Workspace model.
 */

import { db } from '../lib/db.js';
import type { Prisma } from '@prisma/client';

export async function findOne(id: string) {
  return db.workspace.findUnique({
    where: { id },
    include: { members: true },
  });
}

export async function findManyByMember(userId: string) {
  return db.workspace.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { id: userId } } },
      ],
    },
    include: {
      members: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function create(data: { name: string; ownerId: string }, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  return client.workspace.create({
    data: {
      name: data.name,
      ownerId: data.ownerId,
      members: { connect: { id: data.ownerId } },
    },
  });
}

export async function updateCurrentWorkspace(userId: string, workspaceId: string, tx?: Prisma.TransactionClient) {
  const client = tx || db;
  return client.user.update({
    where: { id: userId },
    data: { currentWorkspaceId: workspaceId },
  });
}
