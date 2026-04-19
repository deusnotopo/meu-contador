/**
 * EmotionalService
 * ────────────────
 * Application layer for managing psychological relationship with money.
 */

import * as EmotionalRepository from "../repositories/EmotionalRepository.js";
import { toCents } from '../../../shared/currency.js';
import type { EmotionalEntry } from "../repositories/EmotionalRepository.js";

export interface EmotionalFilters {
  startDate?: string;
  endDate?: string;
  emotion?: string;
  limit?: number;
}

export async function listEntries(userId: string, filters: EmotionalFilters) {
  let entries = await EmotionalRepository.findEntriesByUserId(userId);

  // If local is empty, try cloud recovery
  if (entries.length === 0) {
    entries = await EmotionalRepository.fetchEntriesFromCloud(userId, filters.limit || 50);
    if (entries.length > 0) {
      await EmotionalRepository.saveEntries(userId, entries);
    }
  }

  // Filter & Sort
  const { startDate, endDate, emotion, limit } = filters;
  let filtered = entries;

  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    filtered = filtered.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });
  }

  if (emotion) {
    filtered = filtered.filter(e => e.emotion === emotion);
  }

  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (limit) filtered = filtered.slice(0, limit);

  return { entries: filtered, total: entries.length };
}

export async function addEntry(userId: string, data: Omit<EmotionalEntry, 'id' | 'date'>) {
  const entries = await EmotionalRepository.findEntriesByUserId(userId);
  
  const newEntry: EmotionalEntry = {
    ...data,
    amount: data.amount !== undefined ? toCents(data.amount) : undefined,
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    date: new Date().toISOString()
  };

  entries.unshift(newEntry);
  await EmotionalRepository.saveEntries(userId, entries);
  
  // Async Sync to Cloud
  EmotionalRepository.syncEntryToCloud(userId, newEntry).catch(() => {});

  return newEntry;
}

export async function updateEntry(userId: string, entryId: string, updates: Partial<Omit<EmotionalEntry, 'id' | 'date'>>) {
  const entries = await EmotionalRepository.findEntriesByUserId(userId);
  const index = entries.findIndex(e => e.id === entryId);
  
  if (index === -1) return null;

  const updatedEntry: EmotionalEntry = { 
    ...entries[index], 
    ...updates,
    amount: updates.amount !== undefined ? toCents(updates.amount) : entries[index].amount 
  };
  entries[index] = updatedEntry;

  await EmotionalRepository.saveEntries(userId, entries);
  EmotionalRepository.syncEntryToCloud(userId, updatedEntry).catch(() => {});

  return updatedEntry;
}

export async function deleteEntry(userId: string, entryId: string) {
  const entries = await EmotionalRepository.findEntriesByUserId(userId);
  const index = entries.findIndex(e => e.id === entryId);
  
  if (index === -1) return false;

  entries.splice(index, 1);
  await EmotionalRepository.saveEntries(userId, entries);
  EmotionalRepository.deleteEntryFromCloud(userId, entryId).catch(() => {});

  return true;
}

/**
 * Analytical Engine
 */

export async function getPatternsAndInsights(userId: string) {
  const entries = await EmotionalRepository.findEntriesByUserId(userId);
  
  const patterns = calculatePatterns(entries);
  const insights = generateInsights(entries, patterns);
  const stats = calculateStats(entries, patterns);

  return { patterns, insights, stats };
}

function calculatePatterns(entries: EmotionalEntry[]) {
  const patternMap: Record<string, any> = {};

  entries.forEach((entry) => {
    const key = entry.emotion;
    if (!patternMap[key]) {
      patternMap[key] = { count: 0, totalSpend: 0, categories: {}, triggers: {}, regretCount: 0 };
    }

    const p = patternMap[key];
    p.count++;
    p.totalSpend += entry.amount || 0;

    if (entry.category) {
      p.categories[entry.category] = (p.categories[entry.category] || 0) + 1;
    }

    entry.triggers?.forEach((t: string) => {
      p.triggers[t] = (p.triggers[t] || 0) + 1;
    });

    if (entry.regretLevel && entry.regretLevel >= 4) {
      p.regretCount++;
    }
  });

  return Object.entries(patternMap).map(([emotion, data]) => ({
    emotion,
    frequency: data.count,
    averageSpend: data.count > 0 ? data.totalSpend / data.count : 0,
    topCategories: Object.entries(data.categories).sort(([, a]: any, [, b]: any) => b - a).slice(0, 3).map(([c]) => c),
    topTriggers: Object.entries(data.triggers).sort(([, a]: any, [, b]: any) => b - a).slice(0, 3).map(([t]) => t),
    regretRate: data.count > 0 ? (data.regretCount / data.count) * 100 : 0,
  }));
}

function generateInsights(entries: EmotionalEntry[], patterns: any[]) {
  const insights = [];
  if (entries.length < 3) {
    insights.push({ type: 'tip', title: 'Diário Emocional', description: 'Registre 3+ compras para ver padrões.' });
    return insights;
  }

  const regretted = entries.filter(e => (e.regretLevel || 0) >= 4);
  if (regretted.length >= 3) {
    insights.push({ 
      type: 'warning', 
      title: 'Alerta de Arrependimento', 
      description: `Você se arrependeu de ${regretted.length} compras.`,
      recommendation: 'Use a regra das 24h para compras não planejadas.'
    });
  }

  return insights;
}

function calculateStats(entries: EmotionalEntry[], patterns: any[]) {
  const dominant = patterns.length > 0 ? patterns.reduce((a, b) => a.frequency > b.frequency ? a : b) : null;
  return {
    totalEntries: entries.length,
    dominantEmotion: dominant?.emotion || 'neutral',
    regretRate: entries.length > 0 ? (entries.filter(e => (e.regretLevel || 0) >= 4).length / entries.length) * 100 : 0
  };
}
