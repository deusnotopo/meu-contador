import { useTransactions } from "@/hooks/useTransactions";
import { loadBudgets } from "@/lib/storage";
import { useMemo } from "react";

export interface FinancialAlert {
  id: string;
  type: "warning" | "danger" | "info" | "success";
  title: string;
  message: string;
  action?: string;
}

export const useFinancialAlerts = () => {
  const { transactions, totals, categoryData } = useTransactions("personal");
  const budgets = useMemo(() => loadBudgets(), []);

  const alerts = useMemo(() => {
    const list: FinancialAlert[] = [];

    // 1. Budget Alerts
    budgets.forEach(budget => {
      const categoryTotal = categoryData.find(c => c.name === budget.category)?.despesas || 0;
      const usage = (categoryTotal / budget.limit) * 100;

      if (usage >= 100) {
        list.push({
          id: `budget-over-${budget.category}`,
          type: "danger",
          title: "Orçamento Excedido!",
          message: `Você ultrapassou o limite de ${budget.category}. Considere pausar gastos nessa categoria.`,
        });
      } else if (usage >= 80) {
        list.push({
          id: `budget-near-${budget.category}`,
          type: "warning",
          title: "Alerta de Orçamento",
          message: `Você atingiu ${usage.toFixed(0)}% do limite de ${budget.category}.`,
        });
      }
    });

    // 2. Balance / Deficit Alerts
    if (totals.expense > totals.income && totals.income > 0) {
      list.push({
        id: "deficit-alert",
        type: "danger",
        title: "Atenção: Déficit Mensal",
        message: "Seus gastos este mês superaram sua renda. Recomendo auditar seus 'Desejos' imediatamente.",
      });
    }

    // 3. Savings Rate Logic
    const savingsRate = totals.income > 0 ? (totals.balance / totals.income) * 100 : 0;
    if (savingsRate >= 20) {
      list.push({
        id: "savings-star",
        type: "success",
        title: "Desempenho Estelar!",
        message: `Sua taxa de poupança está em ${savingsRate.toFixed(0)}%. Você está no caminho da liberdade financeira.`,
      });
    } else if (savingsRate < 5 && totals.income > 0) {
       list.push({
         id: "savings-low",
         type: "info",
         title: "Dica do Contador",
         message: "Sua taxa de poupança está abaixo de 5%. Tente automatizar um investimento de pelo menos 10% no início do mês.",
       });
    }

    return list;
  }, [transactions, totals, categoryData, budgets]);

  return { alerts };
};
