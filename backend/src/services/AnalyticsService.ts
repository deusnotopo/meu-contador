/**
 * AnalyticsService
 * ────────────────
 * All reporting and metrics logic live here.
 */

import * as AnalyticsRepository from '../repositories/AnalyticsRepository.js';
import * as UserService from './UserService.js';

export async function getHealthScoreHistory(userId: string) {
  const data = await UserService.getGamificationData(userId);
  return data?.healthScoreHistory ?? [];
}

export async function saveHealthScore(userId: string, score: number, date?: string) {
  const entryDate = date ?? new Date().toISOString().slice(0, 10);
  const blob = await UserService.getGamificationData(userId) ?? {};
  interface HealthScoreEntry { date: string; score: number }
  const history: HealthScoreEntry[] = (blob.healthScoreHistory as HealthScoreEntry[] | undefined) ?? [];

  // Upsert entry for the day
  const idx = history.findIndex(h => h.date === entryDate);
  if (idx >= 0) {
    history[idx].score = score;
  } else {
    history.push({ date: entryDate, score });
  }

  // Keep last 90 days, sorted by date
  const trimmed = history
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-90);

  await UserService.updateGamificationData(userId, { ...blob, healthScoreHistory: trimmed });
  return trimmed;
}

export async function getSummary(userId: string, months: number, scope: string) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const [monthly, byCategory, totals] = await Promise.all([
    AnalyticsRepository.getMonthlySummary(userId, since, scope),
    AnalyticsRepository.getCategoryBreakdown(userId, since, scope),
    AnalyticsRepository.getGlobalTotals(userId, since, scope),
  ]);

  return { monthly, byCategory, totals };
}
