/**
 * WorkspaceService
 * ────────────────
 * Application layer for multi-tenant workspace management.
 */

import crypto from 'crypto';
import { db } from "../lib/db.js";
import * as WorkspaceRepository from "../repositories/WorkspaceRepository.js";

export async function listUserWorkspaces(userId: string) {
  return WorkspaceRepository.findManyByMember(userId);
}

export async function getWorkspace(workspaceId: string, userId?: string) {
  const workspace = await WorkspaceRepository.findOne(workspaceId);
  if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');
  
  if (userId) {
    const isMember = workspace.members.some((m: any) => m.id === userId);
    if (workspace.ownerId !== userId && !isMember) {
      throw new Error('FORBIDDEN');
    }
  }

  return workspace;
}

export async function createWorkspace(userId: string, name: string) {
  const data: WorkspaceRepository.WorkspaceCreateData = {
    name,
    ownerId: userId,
  };
  
  // We don't have a direct repository method for the initial member connect yet
  // but we can use the db object or extend repo.
  const workspace = await db.workspace.create({
    data: {
      ...data,
      members: { connect: { id: userId } }
    },
    include: { members: { select: { id: true, name: true, email: true } } }
  });

  return workspace;
}

export async function sendInvite(ownerId: string, workspaceId: string, email: string, role: string) {
  const workspace = await WorkspaceRepository.findOne(workspaceId);
  
  if (!workspace) throw new Error('WORKSPACE_NOT_FOUND');
  if (workspace.ownerId !== ownerId) throw new Error('FORBIDDEN');
  
  const isMember = workspace.members.some((m: any) => m.email === email);
  if (isMember) throw new Error('ALREADY_MEMBER');

  const existingInvite = await db.workspaceInvite.findFirst({
    where: { email, workspaceId, expiresAt: { gt: new Date() } }
  });
  if (existingInvite) throw new Error('INVITE_PENDING');

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return db.workspaceInvite.create({
    data: { email, role: role as any, token, workspaceId, expiresAt }
  });
}

export async function listInvites(ownerId: string, workspaceId: string) {
  const workspace = await WorkspaceRepository.findOne(workspaceId);
  if (!workspace || workspace.ownerId !== ownerId) throw new Error('FORBIDDEN');

  return db.workspaceInvite.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function revokeInvite(ownerId: string, workspaceId: string, inviteId: string) {
  const workspace = await WorkspaceRepository.findOne(workspaceId);
  if (!workspace || workspace.ownerId !== ownerId) throw new Error('FORBIDDEN');

  await db.workspaceInvite.delete({ where: { id: inviteId } });
  return true;
}

export async function removeMember(ownerId: string, workspaceId: string, memberId: string) {
  const workspace = await WorkspaceRepository.findOne(workspaceId);
  if (!workspace || workspace.ownerId !== ownerId) throw new Error('FORBIDDEN');
  if (memberId === workspace.ownerId) throw new Error('CANNOT_REMOVE_OWNER');

  await db.user.update({
    where: { id: memberId },
    data: { workspaces: { disconnect: { id: workspaceId } } }
  });
  
  return true;
}

export async function updateMemberRole(ownerId: string, workspaceId: string, memberId: string, role: string) {
  const workspace = await WorkspaceRepository.findOne(workspaceId);
  if (!workspace || workspace.ownerId !== ownerId) throw new Error('FORBIDDEN');
  if (memberId === workspace.ownerId) throw new Error('CANNOT_CHANGE_OWNER_ROLE');

  // Logic: disconnect and reconnect (standard Prisma way if not using a pivot join table with meta)
  await db.user.update({
    where: { id: memberId },
    data: {
      workspaces: {
        disconnect: { id: workspaceId },
        connect: { id: workspaceId }
      }
    }
  });

  return true;
}
