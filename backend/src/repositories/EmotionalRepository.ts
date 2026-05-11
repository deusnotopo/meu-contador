/**
 * EmotionalRepository
 * ───────────────────
 * Persistence layer for emotional journal entries.
 * Hybrid storage: PostgreSQL + Firestore.
 */

import { db } from "../lib/db.js";
import { firebaseAdmin } from "../lib/firebase.js";
import { logger } from "../lib/logger.js";

export interface EmotionalEntry {
  id: string;
  date: string;
  emotion: string;
  amount?: number;
  category?: string;
  motivation?: string;
  triggers?: string[];
  regretLevel?: number;
  satisfactionLevel?: number;
  notes?: string;
}

const getEntriesCollection = (userId: string) => 
  firebaseAdmin.firestore().collection('emotional').doc(userId).collection('entries');

export async function findEntriesByUserId(userId: string): Promise<EmotionalEntry[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { emotionalData: true },
  });

  if (!user || !user.emotionalData) return [];

  try {
    return JSON.parse(user.emotionalData);
  } catch {
    return [];
  }
}

export async function saveEntries(userId: string, entries: EmotionalEntry[], tx?: { user: { update: typeof db.user.update } }) {
  const client = tx || db;
  return client.user.update({
    where: { id: userId },
    data: { emotionalData: JSON.stringify(entries) },
  });
}

/**
 * Cloud Sync Methods
 */

export async function syncEntryToCloud(userId: string, entry: EmotionalEntry) {
  try {
    await getEntriesCollection(userId).doc(entry.id).set(entry);
  } catch (e) {
    logger.error(`[EmotionalRepo] Cloud sync failure for ${userId}`, e);
  }
}

export async function deleteEntryFromCloud(userId: string, entryId: string) {
  try {
    await getEntriesCollection(userId).doc(entryId).delete();
  } catch (e) {
    logger.error(`[EmotionalRepo] Cloud delete failure for ${userId}`, e);
  }
}

export async function fetchEntriesFromCloud(userId: string, limit: number = 50): Promise<EmotionalEntry[]> {
  try {
    const snapshot = await getEntriesCollection(userId)
      .orderBy('date', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmotionalEntry));
  } catch (e) {
    logger.error(`[EmotionalRepo] Cloud fetch failure for ${userId}`, e);
    return [];
  }
}
