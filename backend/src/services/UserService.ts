/**
 * UserService
 * ───────────
 * All business rules for users live here.
 */

import * as UserRepository from '../repositories/UserRepository.js';
import type { Prisma } from '@prisma/client';

export async function getUserProfile(userId: string) {
  return UserRepository.findById(userId);
}

export interface UserProfileUpdate {
  name?: string;
  monthlyIncome?: number;
  financialGoal?: string;
  riskProfile?: string;
  businessName?: string;
  businessCnpj?: string;
  businessSector?: string;
  employmentType?: string;
  hasEmergencyFund?: boolean;
  hasDebts?: boolean;
  initialBalance?: number;
  age?: number;
  dependents?: number;
  investmentHorizon?: string;
  onboardingCompleted?: boolean;
  fireTargetIncome?: number;
}

export async function updateProfile(userId: string, input: UserProfileUpdate, tx?: Prisma.TransactionClient) {
  // Scaling math (×100)
  const data: Prisma.UserUpdateInput = { ...input };
  if (input.monthlyIncome !== undefined) data.monthlyIncome = Math.round(input.monthlyIncome * 100);
  if (input.initialBalance !== undefined) data.initialBalance = Math.round(input.initialBalance * 100);
  if (input.fireTargetIncome !== undefined) data.fireTargetIncome = Math.round(input.fireTargetIncome * 100);

  return UserRepository.update(userId, data, tx);
}

export async function getGamificationData(userId: string) {
  const user = await UserRepository.findById(userId);
  if (!user || !user.gamificationData) return null;

  try {
    return typeof user.gamificationData === 'string' 
        ? JSON.parse(user.gamificationData) 
        : user.gamificationData;
  } catch (e) {
    return null;
  }
}

export async function updateGamificationData(userId: string, data: Record<string, unknown>, tx?: Prisma.TransactionClient) {
  const dataToStore = typeof data === 'string' ? data : JSON.stringify(data);
  await UserRepository.update(userId, { gamificationData: dataToStore }, tx);
  return data;
}

export async function getEmotionalData(userId: string) {
  const user = await UserRepository.findById(userId);
  if (!user || !user.emotionalData) return null;

  try {
    return typeof user.emotionalData === 'string' 
        ? JSON.parse(user.emotionalData) 
        : user.emotionalData;
  } catch (e) {
    return null;
  }
}

export async function updateEmotionalData(userId: string, data: Record<string, unknown>, tx?: Prisma.TransactionClient) {
  const dataToStore = typeof data === 'string' ? data : JSON.stringify(data);
  await UserRepository.update(userId, { emotionalData: dataToStore }, tx);
  return data;
}

/**
 * Atomic creation of a user and their primary personal workspace.
 */
import { db } from '../lib/db.js';
import { randomUUID } from 'crypto';

export async function deleteAccount(userId: string) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) return false;

    const obfuscationPill = randomUUID();
    
    // Revoke all sessions
    await tx.session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() }
    });

    // Hard Delete physical connections to banking/push for security
    await tx.bankConnection.deleteMany({ where: { userId } });
    await tx.pushSubscription.deleteMany({ where: { userId } });

    // Obfuscate (Soft Delete) core User table to preserve relational metadata
    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${obfuscationPill}@deleted.local`,
        name: '[Conta Excluída]',
        passwordHash: '',
        businessCnpj: null,
        businessName: null,
        monthlyIncome: null,
        initialBalance: 0,
        gamificationData: null,
        emotionalData: null,
        educationData: null,
        insuranceTypes: null,
        investorProfile: null,
        deletedAt: new Date(),
      }
    });

    return true;
  });
}
export async function createWithWorkspace(data: { email: string; name: string; passwordHash?: string }) {
  return db.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash || '',
        name: data.name || data.email.split('@')[0],
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: `${createdUser.name || 'Workspace'} Principal`,
        ownerId: createdUser.id,
        members: { connect: { id: createdUser.id } },
      },
    });

    return tx.user.update({
      where: { id: createdUser.id },
      data: { currentWorkspaceId: workspace.id },
    });
  });
}
