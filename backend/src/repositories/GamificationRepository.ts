/**
 * GamificationRepository
 * ──────────────────────
 * Persistence layer for user leveling, achievements, and streaks.
 * Hybrid storage: PostgreSQL + Firestore.
 */

import { db } from "../lib/db.js";
import { firebaseAdmin } from "../lib/firebase.js";
import { logger } from "../lib/logger.js";

const getGamificationDoc = (userId: string) => 
  firebaseAdmin.firestore().collection('gamification').doc(userId);

export async function findStateByUserId(userId: string): Promise<Record<string, unknown> | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { gamificationData: true },
  });

  if (!user || !user.gamificationData) return null;

  try {
    return JSON.parse(user.gamificationData);
  } catch {
    return null;
  }
}

export async function saveState(userId: string, state: Record<string, unknown>, tx?: { user: { update: typeof db.user.update } }) {
  const client = tx || db;
  const data = JSON.stringify(state);

  await client.user.update({
    where: { id: userId },
    data: { gamificationData: data },
  });

  // Sync to Cloud
  try {
    const docRef = getGamificationDoc(userId);
    await docRef.set(state);
  } catch (e) {
    logger.error(`[GamificationRepo] Cloud sync failure for ${userId}`, e);
  }
}

export async function fetchFromCloud(userId: string): Promise<Record<string, unknown> | null> {
  try {
    const doc = await getGamificationDoc(userId).get();
    return doc.exists ? (doc.data() as Record<string, unknown>) ?? null : null;
  } catch (e) {
    logger.error(`[GamificationRepo] Cloud fetch failure for ${userId}`, e);
    return null;
  }
}
