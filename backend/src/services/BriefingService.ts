/**
 * BriefingService
 * ───────────────
 * Generates AI-powered weekly financial briefings using Gemini.
 * Called by the cron scheduler (Sunday 20:00) or via manual trigger.
 *
 * Architecture:
 *  1. Gather user's week summary from DB
 *  2. Build a structured prompt with financial telemetry
 *  3. Call Gemini with a "Financial Advisor" persona
 *  4. Persist the output as a WEEKLY_BRIEFING notification
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../lib/db.js';

// ── Data gathering ────────────────────────────────────────────────────────────

interface WeeklySnapshot {
  userName: string;
  totalExpenses: number;          // cents
  totalIncome: number;            // cents
  surplus: number;                // cents
  topCategories: { category: string; amount: number }[];
  goalProgress: { name: string; pct: number }[];
  debts: number;                  // total debt in cents
  investments: number;            // total portfolio in cents
  anomaliesThisWeek: number;      // count of spike alerts
}

async function gatherWeeklySnapshot(userId: string): Promise<WeeklySnapshot> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [user, transactions, goals, debts, investments, anomalyAlerts] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true } }),

    db.transaction.findMany({
      where: { userId, deletedAt: null, date: { gte: sevenDaysAgo } },
      select: { type: true, category: true, amount: true },
    }),

    db.savingsGoal.findMany({
      where: { userId, deletedAt: null },
      select: { name: true, targetAmount: true, currentAmount: true },
    }),

    db.debt.findMany({
      where: { userId, deletedAt: null },
      select: { balance: true },
    }),

    db.investment.findMany({
      where: { userId, deletedAt: null },
      select: { amount: true, currentPrice: true },
    }),

    // Count anomaly alerts created in the past 7 days
    db.notification.count({
      where: {
        userId,
        type: 'spending_anomaly',
        createdAt: { gte: sevenDaysAgo },
      },
    }),
  ]);

  const expenses = transactions.filter(t => t.type === 'expense');
  const income   = transactions.filter(t => t.type === 'income');

  const totalExpenses = expenses.reduce((acc, t) => acc + t.amount, 0);
  const totalIncome   = income.reduce((acc, t) => acc + t.amount, 0);

  // Top 3 categories by spend
  const byCat: Record<string, number> = {};
  for (const t of expenses) {
    byCat[t.category] = (byCat[t.category] ?? 0) + t.amount;
  }
  const topCategories = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, amount]) => ({ category, amount }));

  const goalProgress = goals.map(g => ({
    name: g.name,
    pct: g.targetAmount > 0
      ? parseFloat(((g.currentAmount / g.targetAmount) * 100).toFixed(1))
      : 0,
  }));

  const totalDebt = debts.reduce((acc, d) => acc + d.balance, 0);
  const totalPortfolio = investments.reduce((acc, i) => acc + (i.amount * i.currentPrice), 0);

  return {
    userName: user?.name?.split(' ')[0] ?? 'Investidor',
    totalExpenses,
    totalIncome,
    surplus: totalIncome - totalExpenses,
    topCategories,
    goalProgress,
    debts: totalDebt,
    investments: totalPortfolio,
    anomaliesThisWeek: anomalyAlerts,
  };
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildBriefingPrompt(snap: WeeklySnapshot): string {
  const fmt = (c: number) => `R$\u00a0${(c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const topCatsText = snap.topCategories
    .map(c => `  - ${c.category}: ${fmt(c.amount)}`)
    .join('\n') || '  - Sem despesas registradas';

  const goalsText = snap.goalProgress
    .map(g => `  - "${g.name}": ${g.pct}% concluída`)
    .join('\n') || '  - Sem metas ativas';

  return `
Você é um consultor financeiro de alta performance — preciso e empático.
Gere um briefing semanal financeiro personalizado para o usuário "${snap.userName}".

DADOS DA SEMANA:
- Receitas: ${fmt(snap.totalIncome)}
- Despesas: ${fmt(snap.totalExpenses)}
- Saldo: ${fmt(snap.surplus)} (${snap.surplus >= 0 ? 'positivo ✓' : 'NEGATIVO ✗'})
- Top categorias de gasto:
${topCatsText}
- Progresso das metas:
${goalsText}
- Patrimônio investido: ${fmt(snap.investments)}
- Total de dívidas: ${fmt(snap.debts)}
- Alertas de anomalia esta semana: ${snap.anomaliesThisWeek}

INSTRUÇÕES DE FORMATO:
- Máximo 3 parágrafos curtos (150 palavras no total)
- Tom: direto, honesto, encorajador — como um bom amigo que entende de finanças
- Sempre termine com 1 ação concreta para a próxima semana
- Use marcadores de markdown (**, _) para destaque
- NÃO invente dados além dos fornecidos
- Responda em Português-BR
`.trim();
}

// ── Main generator ────────────────────────────────────────────────────────────

export async function generateWeeklyBriefing(userId: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Graceful degradation: generate a deterministic summary without AI
    return generateFallbackBriefing(userId);
  }

  try {
    const snap = await gatherWeeklySnapshot(userId);
    const prompt = buildBriefingPrompt(snap);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-1.5-flash',
      generationConfig: { maxOutputTokens: 512, temperature: 0.75 },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Persist as a WEEKLY_BRIEFING notification
    const { notifyUser } = await import('./NotificationService.js');
    const { NotificationType } = await import('../lib/ws-manager.js');

    await notifyUser(userId, {
      type: NotificationType.WEEKLY_BRIEFING,
      title: `📊 Seu Briefing Semanal — ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}`,
      message: text,
      data: { snapshot: snap },
    });

    return text;
  } catch (err) {
    console.error('[BriefingService] Gemini generation failed:', err);
    return null;
  }
}

// ── Fallback (no API key) ─────────────────────────────────────────────────────

async function generateFallbackBriefing(userId: string): Promise<string | null> {
  try {
    const snap = await gatherWeeklySnapshot(userId);
    const surplus = snap.surplus;
    const fmt = (c: number) => `R$\u00a0${(c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    const summaryLine = surplus >= 0
      ? `Boa semana, ${snap.userName}! Você ficou **no positivo** com ${fmt(surplus)} de saldo.`
      : `Atenção, ${snap.userName}. Esta semana seu saldo ficou **negativo** em ${fmt(Math.abs(surplus))}.`;

    const topCat = snap.topCategories[0];
    const categoryLine = topCat
      ? `Seu maior gasto foi em **${topCat.category}** (${fmt(topCat.amount)}).`
      : `Sem despesas significativas registradas.`;

    const anomalyLine = snap.anomaliesThisWeek > 0
      ? `⚡ ${snap.anomaliesThisWeek} anomalia(s) de gasto detectada(s) essa semana.`
      : `✓ Nenhum pico de gasto anormal detectado.`;

    const text = `${summaryLine} ${categoryLine}\n\n${anomalyLine}\n\n📌 **Dica da semana:** Revise suas metas e ajuste os aportes mensais no Laboratório de Futuro.`;

    const { notifyUser } = await import('./NotificationService.js');
    const { NotificationType } = await import('../lib/ws-manager.js');

    await notifyUser(userId, {
      type: NotificationType.WEEKLY_BRIEFING,
      title: `📊 Resumo Semanal — ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
      message: text,
      data: {},
    });

    return text;
  } catch {
    return null;
  }
}
