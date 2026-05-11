import { useMemo, useState, useEffect } from "react";
import { useTransactions } from "./useTransactions";
import { useBudgets } from "./useBudgets";
import { useGoals } from "./useGoals";
import { useProvisions } from "./useProvisions";
import { useReminders } from "./useReminders";
import { api } from "@/lib/api";
import { logger } from "@/lib/logger";
import {
  CashFlowItemSchema,
  CashFlowSummarySchema,
  RecurringItemSchema,
  CashFlowProjectionSchema,
} from "@/lib/schemas";
import { z } from "zod";

export type CashFlowDay = z.infer<typeof CashFlowItemSchema>;
export type CashFlowSummary = z.infer<typeof CashFlowSummarySchema>;
export type RecurringItem = z.infer<typeof RecurringItemSchema>;

export interface UpcomingCommitment {
  id: string;
  title: string;
  amount: number;
  date: string;
  source: "reminder" | "provisao" | "recurring" | "goal";
  category: string;
}

export function useCashFlow() {
  const personal = useTransactions("personal");
  const { budgets } = useBudgets();
  const { goals } = useGoals();
  const { reminders } = useReminders();
  const { provisions } = useProvisions();

  // ── Server-side projection (overrides local when available) ──────────────
  const [serverProjection, setServerProjection] = useState<{
    projection: CashFlowDay[];
    summary: CashFlowSummary;
    recurring: RecurringItem[];
  } | null>(null);
  const [isServerLoading, setIsServerLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<z.infer<typeof CashFlowProjectionSchema>>(
        "/cashflow/projection?days=30&scope=personal",
        { schema: CashFlowProjectionSchema },
      )
      .then((data) => {
        if (cancelled) return;

        // AKITA MODE: Normalização de campos vindo do backend
        const mapped: CashFlowSummary = {
          currentBalance: data.summary.currentBalance,
          projectedBalance30Days:
            data.summary.projectedBalance30Days ??
            data.summary.projectedBalanceEnd ??
            0,
          totalInflows30Days:
            data.summary.totalInflows30Days ?? data.summary.totalInflows ?? 0,
          totalOutflows30Days:
            data.summary.totalOutflows30Days ?? data.summary.totalOutflows ?? 0,
          criticalDays: data.summary.criticalDays,
          averageDailyFlow: data.summary.averageDailyFlow,
          safeToSpend: data.summary.safeToSpend,
          committedNext7Days: data.summary.committedNext7Days,
          burnRate: data.summary.burnRate ?? Infinity,
          positiveDays:
            data.summary.positiveDays ??
            data.projection.filter((d) => d.netFlow > 0).length,
          negativeDays:
            data.summary.negativeDays ??
            data.projection.filter((d) => d.netFlow < 0).length,
          nextIncomeDate:
            data.summary.nextIncomeDate ??
            data.projection.find((d) => d.inflows.length > 0)?.date ??
            null,
        };
        setServerProjection({
          projection: data.projection,
          summary: mapped,
          recurring: data.recurring,
        });
      })
      .catch((err) => {
        if (err instanceof z.ZodError) {
          logger.error('[useCashFlow] Zod Validation Error', err.errors);
        } else {
          logger.warn(
            '[useCashFlow] Server projection failed, using client-side fallback',
            err,
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsServerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [personal.allTransactions]); // Refetch quando qualquer transação mudar (referência)

  const provisoes = useMemo(() => {
    if (!provisions) return [];
    return provisions.map((p) => ({
      id: p.id,
      nome: p.name,
      mes: p.month,
      valorAnual: p.yearlyAmount,
      acumulado: p.accumulated,
    }));
  }, [provisions]);

  // Detect recurring transactions
  const recurringItems = useMemo((): RecurringItem[] => {
    const items: RecurringItem[] = [];
    const descriptionMap: Record<
      string,
      {
        amounts: number[];
        type: "income" | "expense";
        category: string;
        dates: number[];
      }
    > = {};

    personal.allTransactions.forEach((tx) => {
      const key = tx.description.toLowerCase().trim();
      if (!descriptionMap[key]) {
        descriptionMap[key] = {
          amounts: [],
          type: tx.type,
          category: tx.category,
          dates: [],
        };
      }
      descriptionMap[key]!.amounts.push(tx.amount);
      const day = new Date(tx.date).getDate();
      descriptionMap[key]!.dates.push(day);
    });

    Object.entries(descriptionMap).forEach(([desc, data]) => {
      if (data.amounts.length >= 2) {
        const avgAmount =
          data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;
        const mostCommonDay = Math.round(
          data.dates.reduce((a, b) => a + b, 0) / data.dates.length,
        );

        items.push({
          description: desc.charAt(0).toUpperCase() + desc.slice(1),
          amount: avgAmount,
          type: data.type,
          category: data.category,
          dueDay: mostCommonDay,
          frequency: "monthly",
        });
      }
    });

    return items.sort((a, b) => a.dueDay - b.dueDay);
  }, [personal.allTransactions]);

  // Generate 30-day cash flow projection
  const cashFlowDays = useMemo((): CashFlowDay[] => {
    const days: CashFlowDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let runningBalance = personal.totals.balance;

    const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "S\u00e1b"];
    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const dayOfMonth = date.getDate();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isToday = i === 0;

      const inflows: CashFlowDay["inflows"] = [];
      const outflows: CashFlowDay["outflows"] = [];

      // Add recurring items
      recurringItems.forEach((item) => {
        if (item.dueDay === dayOfMonth) {
          if (item.type === "income") {
            inflows.push({
              description: item.description,
              amount: item.amount,
              category: item.category,
            });
          } else {
            outflows.push({
              description: item.description,
              amount: item.amount,
              category: item.category,
            });
          }
        }
      });

      // Add budget items (estimated spending)
      if (!isWeekend) {
        budgets.forEach((budget) => {
          if (budget.spent < budget.limit) {
            const remaining = budget.limit - budget.spent;
            const daysInMonth = 30;
            const dailyBudget = remaining / daysInMonth;
            if (dailyBudget > 0) {
              outflows.push({
                description: `Or\u00e7amento ${budget.category}`,
                amount: dailyBudget,
                category: budget.category,
              });
            }
          }
        });
      }

      // Add goal contributions
      goals.forEach((goal) => {
        if (goal.currentAmount < goal.targetAmount && dayOfMonth === 1) {
          const monthlyContribution = goal.targetAmount - goal.currentAmount;
          outflows.push({
            description: `Meta: ${goal.name}`,
            amount: monthlyContribution,
            category: "Metas",
          });
        }
      });

      const totalInflow = inflows.reduce((sum, i) => sum + i.amount, 0);
      const totalOutflow = outflows.reduce((sum, o) => sum + o.amount, 0);
      const netFlow = totalInflow - totalOutflow;

      runningBalance += netFlow;

      const isCritical =
        runningBalance < 0 || runningBalance < personal.totals.expense * 0.1;

      days.push({
        date: date.toISOString().split("T")[0]!,
        dateFormatted: `${dayOfMonth} ${monthNames[date.getMonth()]}`,
        weekday: weekdayNames[date.getDay()]!,
        inflows,
        outflows,
        netFlow,
        projectedBalance: runningBalance,
        isCritical,
        isToday,
        isWeekend,
      });
    }

    return days;
  }, [
    budgets,
    goals,
    personal.totals.balance,
    personal.totals.expense,
    recurringItems,
  ]);

  // Calculate summary
  const summary = useMemo((): CashFlowSummary => {
    const currentBalance = personal.totals.balance;
    const lastDay = cashFlowDays[cashFlowDays.length - 1];
    const projectedBalance30Days = lastDay?.projectedBalance ?? currentBalance;

    const totalInflows30Days = cashFlowDays.reduce(
      (sum, day) => sum + day.inflows.reduce((s, i) => s + i.amount, 0),
      0,
    );

    const totalOutflows30Days = cashFlowDays.reduce(
      (sum, day) => sum + day.outflows.reduce((s, o) => s + o.amount, 0),
      0,
    );

    const criticalDays = cashFlowDays.filter((d) => d.isCritical).length;
    const positiveDays = cashFlowDays.filter((d) => d.netFlow > 0).length;
    const negativeDays = cashFlowDays.filter((d) => d.netFlow < 0).length;

    const averageDailyFlow = (totalInflows30Days - totalOutflows30Days) / 30;

    const nextIncomeDay = cashFlowDays.find((day) => day.inflows.length > 0);
    const nextIncomeDate = nextIncomeDay?.date ?? null;

    const committedNext7Days = cashFlowDays
      .slice(0, 7)
      .reduce(
        (sum, day) => sum + day.outflows.reduce((s, o) => s + o.amount, 0),
        0,
      );

    const safeToSpend = Math.max(0, currentBalance - committedNext7Days);

    // Calculate burn rate (days until balance reaches zero)
    let burnRate = Infinity;
    if (averageDailyFlow < 0) {
      burnRate = Math.floor(currentBalance / Math.abs(averageDailyFlow));
    }

    return {
      currentBalance,
      projectedBalance30Days,
      totalInflows30Days,
      totalOutflows30Days,
      safeToSpend,
      committedNext7Days,
      nextIncomeDate,
      criticalDays,
      positiveDays,
      negativeDays,
      averageDailyFlow,
      burnRate,
    };
  }, [cashFlowDays, personal.totals.balance]);

  const upcomingCommitments = useMemo((): UpcomingCommitment[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next30 = new Date(today);
    next30.setDate(next30.getDate() + 30);

    const reminderCommitments: UpcomingCommitment[] = reminders
      .filter((r) => !r.isPaid)
      .map((r) => ({
        id: `reminder-${r.id}`,
        title: r.name,
        amount: r.amount,
        date: r.dueDate,
        source: "reminder" as const,
        category: r.category,
      }))
      .filter((item) => {
        const d = new Date(item.date);
        return d >= today && d <= next30;
      });

    const provisaoCommitments: UpcomingCommitment[] = provisoes
      .map((p, index: number) => {
        const currentYear = today.getFullYear();
        let dueDate = new Date(currentYear, Number(p.mes || 1) - 1, 1);
        if (dueDate < today)
          dueDate = new Date(currentYear + 1, Number(p.mes || 1) - 1, 1);
        const missing = Math.max(
          0,
          Number(p.valorAnual || 0) - Number(p.acumulado || 0),
        );
        const y = dueDate.getFullYear();
        const m = String(dueDate.getMonth() + 1).padStart(2, "0");
        const d = String(dueDate.getDate()).padStart(2, "0");
        return {
          id: `provisao-${p.id || index}`,
          title: p.nome || "Provis\u00e3o",
          amount: missing,
          date: `${y}-${m}-${d}`,
          source: "provisao" as const,
          category: "Provis\u00f5es",
        };
      })
      .filter((item) => item.amount > 0)
      .filter((item) => {
        const d = new Date(item.date);
        return d >= today && d <= next30;
      });

    const goalCommitments: UpcomingCommitment[] = goals
      .filter((goal) => goal.currentAmount < goal.targetAmount)
      .map((goal) => {
        const y = today.getFullYear();
        const nextM = today.getMonth() + 2;
        const realM = nextM > 12 ? 1 : nextM;
        const realY = nextM > 12 ? y + 1 : y;
        return {
          id: `goal-${goal.id}`,
          title: `Meta: ${goal.name}`,
          amount: goal.targetAmount - goal.currentAmount,
          date: `${realY}-${String(realM).padStart(2, "0")}-01`,
          source: "goal" as const,
          category: "Metas",
        };
      });

    return [...reminderCommitments, ...provisaoCommitments, ...goalCommitments]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [goals, provisoes, reminders]);

  // Get upcoming bills (next 7 days)
  const upcomingBills = useMemo(() => {
    return cashFlowDays
      .slice(0, 7)
      .filter((day) => day.outflows.length > 0)
      .flatMap((day) =>
        day.outflows.map((o) => ({
          ...o,
          date: day.dateFormatted,
          weekday: day.weekday,
          isToday: day.isToday,
        })),
      )
      .sort((a, b) => (a.isToday ? -1 : b.isToday ? 1 : 0));
  }, [cashFlowDays]);

  // Get insights
  const insights = useMemo(() => {
    const result: string[] = [];

    if (summary.criticalDays > 0) {
      result.push(
        `\u26a0\ufe0f Voc\u00ea tem ${summary.criticalDays} dias cr\u00edticos nos pr\u00f3ximos 30 dias. Planeje-se!`,
      );
    }

    if (summary.safeToSpend < summary.currentBalance * 0.35) {
      result.push(
        `\ud83d\udee1\ufe0f Seu saldo realmente seguro para gastar hoje \u00e9 ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(summary.safeToSpend)}.`,
      );
    }

    if ((summary.burnRate ?? 0) < 90 && (summary.burnRate ?? 0) !== Infinity) {
      result.push(
        `\ud83d\udd25 Com o ritmo atual, seu saldo dura apenas ${summary.burnRate} dias.`,
      );
    }

    if (summary.averageDailyFlow < 0) {
      result.push(
        `\ud83d\udcc9 Seu fluxo di\u00e1rio m\u00e9dio \u00e9 negativo: R$ ${Math.abs(summary.averageDailyFlow).toFixed(2)}/dia.`,
      );
    }

    if ((summary.positiveDays ?? 0) > (summary.negativeDays ?? 0)) {
      result.push(
        `\u2705 ${summary.positiveDays} dias positivos vs ${summary.negativeDays} negativos. Continue assim!`,
      );
    }

    const hasSalary = recurringItems.some(
      (i) =>
        i.description.toLowerCase().includes("sal\u00e1rio") ||
        i.description.toLowerCase().includes("salario"),
    );

    if (!hasSalary) {
      result.push(
        `\ud83d\udca1 N\u00e3o detectamos sal\u00e1rio recorrente. Registre sua renda fixa para melhor proje\u00e7\u00e3o.`,
      );
    }

    return result;
  }, [recurringItems, summary]);

  return {
    // Prefer server data; fall back to client-side computation
    cashFlowDays: serverProjection?.projection ?? cashFlowDays,
    summary: serverProjection?.summary ?? summary,
    recurringItems: serverProjection?.recurring ?? recurringItems,
    upcomingBills,
    upcomingCommitments,
    insights,
    isServerLoading,
  };
}
