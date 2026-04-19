/**
 * GamificationRepository
 * ──────────────────────
 * Persistence layer for user leveling, achievements, and streaks.
 * Hybrid storage: PostgreSQL + Firestore.
 */

import { db } from "../lib/db.js";
import { firebaseAdmin } from "../lib/firebase.js";

const getGamificationDoc = (userId: string) => 
  firebaseAdmin.firestore().collection('gamification').doc(userId);

export async function findStateByUserId(userId: string): Promise<any | null> {
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

export async function saveState(userId: string, state: any, tx?: any) {
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
    console.error(`[GamificationRepo] Cloud sync failure for ${userId}:`, e);
  }
}

export async function fetchFromCloud(userId: string): Promise<any | null> {
  try {
    const doc = await getGamificationDoc(userId).get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.error(`[GamificationRepo] Cloud fetch failure for ${userId}:`, e);
    return null;
  }
}
