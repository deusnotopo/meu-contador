/**
 * Scheduler
 * ─────────
 * Cron-based task runner for automated financial intelligence.
 *
 * Jobs:
 *   - Weekly Briefing:  Every Sunday at 20:00 (BRT = UTC-3, so 23:00 UTC)
 *   - Reminder Alerts:  Every day at 08:00
 *
 * Uses node-cron v4 (already installed).
 */

import cron from 'node-cron';
import { db } from './db.js';
import { generateWeeklyBriefing } from '../services/BriefingService.js';
import { logger } from './logger.js';

// ── Weekly Briefing — Sunday 20:00 BRT (23:00 UTC) ───────────────────────────
export function startWeeklyBriefingJob() {
  cron.schedule('0 23 * * 0', async () => {
    logger.info(`[Scheduler] Weekly Briefing job started at ${new Date().toISOString()}`);

    try {
      // Get all active users (logged in within last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const activeUsers = await db.user.findMany({
        where: {
          onboardingCompleted: true,
          deletedAt: null,
          sessions: {
            some: { createdAt: { gte: thirtyDaysAgo } }
          }
        },
        select: { id: true, name: true },
      });

      logger.info(`[Scheduler] Generating briefings for ${activeUsers.length} active users...`);

      // Generate briefings with controlled concurrency (max 5 in parallel)
      const chunkSize = 5;
      for (let i = 0; i < activeUsers.length; i += chunkSize) {
        const chunk = activeUsers.slice(i, i + chunkSize);
        await Promise.allSettled(
          chunk.map(user =>
            generateWeeklyBriefing(user.id)
              .then(() => logger.debug(`[Scheduler] Briefing for user ${user.id} done`))
              .catch(err => logger.error(`[Scheduler] Failed for user ${user.id}`, err))
          )
        );
      }

      logger.info('[Scheduler] Weekly Briefing job completed.');
    } catch (err) {
      logger.error('[Scheduler] Weekly Briefing job failed', err);
    }
  }, {
    timezone: 'America/Sao_Paulo',
  });

  logger.info('[Scheduler] Weekly Briefing job registered (Sunday 20:00 BRT)');
}

// ── Due Reminder Alerts — Daily 08:00 BRT ────────────────────────────────────
export function startReminderAlertsJob() {
  cron.schedule('0 8 * * *', async () => {
    logger.info(`[Scheduler] Reminder Alerts job started at ${new Date().toISOString()}`);

    try {
      const { notifyUser } = await import('../services/NotificationService.js');
      const { NotificationType } = await import('./ws-manager.js');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find reminders due today or tomorrow (not yet paid)
      const dueReminders = await db.billReminder.findMany({
        where: {
          isPaid: false,
          deletedAt: null,
          dueDate: { gte: today, lte: tomorrow },
        },
        select: { userId: true, name: true, amount: true, dueDate: true },
      });

      const userMap: Record<string, typeof dueReminders> = {};
      for (const r of dueReminders) {
        if (!userMap[r.userId]) userMap[r.userId] = [];
        userMap[r.userId].push(r);
      }

      for (const [userId, reminders] of Object.entries(userMap)) {
        for (const r of reminders) {
          const isToday = r.dueDate <= tomorrow && r.dueDate >= today;
          await notifyUser(userId, {
            type: NotificationType.REMINDER_DUE,
            title: isToday ? `📅 Vence Hoje: ${r.name}` : `⏰ Vence Amanhã: ${r.name}`,
            message: `Valor: R$\u00a0${(r.amount / 100).toFixed(2)}. Não esqueça de marcar como pago.`,
            data: { name: r.name, amount: r.amount },
          });
        }
      }

      logger.info(`[Scheduler] Sent ${dueReminders.length} reminder alerts.`);
    } catch (err) {
      logger.error('[Scheduler] Reminder Alerts job failed', err);
    }
  }, {
    timezone: 'America/Sao_Paulo',
  });

  logger.info('[Scheduler] Reminder Alerts job registered (Daily 08:00 BRT)');
}

// ── Bootstrap all jobs ────────────────────────────────────────────────────────
export function startAllScheduledJobs() {
  startWeeklyBriefingJob();
  startReminderAlertsJob();
  logger.info('[Scheduler] All scheduled jobs active.');
}
