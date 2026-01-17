import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { Transaction } from "@/types";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";

interface Alert {
  id: string;
  type: "warning" | "info" | "success" | "danger";
  title: string;
  message: string;
  icon: React.ReactNode;
  educationalTip?: string;
}

interface SmartAlertsProps {
  transactions: Transaction[];
}

export const SmartAlerts = ({ transactions }: SmartAlertsProps) => {
  const alerts = useMemo((): Alert[] => {
    const detectedAlerts: Alert[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get current month transactions
    const currentMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    // Get previous month transactions
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const previousMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === previousMonth && date.getFullYear() === previousYear
      );
    });

    // Calculate totals
    const currentExpenses = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const previousExpenses = previousMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentIncome = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    // Alert 1: Spending increase
    if (previousExpenses > 0) {
      const increasePercent =
        ((currentExpenses - previousExpenses) / previousExpenses) * 100;
      if (increasePercent > 20) {
        detectedAlerts.push({
          id: "spending-increase",
          type: "warning",
          title: "Gastos Aumentaram",
          message: `Seus gastos aumentaram ${increasePercent.toFixed(
            0
          )}% em relação ao mês passado (${formatCurrency(
            currentExpenses - previousExpenses
          )} a mais).`,
          icon: <TrendingUp className="text-warning" size={20} />,
          educationalTip:
            "Tente identificar compras impulsivas. A regra dos 30 dias pode ajudar: espere 30 dias antes de comprar itens não essenciais.",
        });
      } else if (increasePercent < -15) {
        detectedAlerts.push({
          id: "spending-decrease",
          type: "success",
          title: "Parabéns! Economia Detectada",
          message: `Você economizou ${Math.abs(increasePercent).toFixed(
            0
          )}% este mês! Continue assim! (${formatCurrency(
            Math.abs(currentExpenses - previousExpenses)
          )} economizados)`,
          icon: <TrendingDown className="text-success" size={20} />,
          educationalTip:
            "Que tal investir essa economia? O poder dos juros compostos pode transformar esse valor em uma fortuna no longo prazo.",
        });
      }
    }

    // Alert 2: Negative balance
    const balance = currentIncome - currentExpenses;
    if (balance < 0) {
      detectedAlerts.push({
        id: "negative-balance",
        type: "danger",
        title: "Atenção: Saldo Negativo",
        message: `Suas despesas (${formatCurrency(
          currentExpenses
        )}) superaram suas receitas (${formatCurrency(
          currentIncome
        )}) este mês. Déficit de ${formatCurrency(Math.abs(balance))}.`,
        icon: <AlertTriangle className="text-danger" size={20} />,
        educationalTip:
          "Priorize pagar dívidas com juros altos primeiro. Considere criar um orçamento base zero para o próximo mês.",
      });
    }

    // Alert 3: Category spending spike
    const categoryTotals: Record<string, number> = {};
    currentMonthTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryTotals[t.category] =
          (categoryTotals[t.category] || 0) + t.amount;
      });

    const topCategory = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (topCategory && topCategory[1] > currentExpenses * 0.4) {
      detectedAlerts.push({
        id: "category-spike",
        type: "info",
        title: "Categoria em Destaque",
        message: `"${topCategory[0]}" representa ${(
          (topCategory[1] / currentExpenses) *
          100
        ).toFixed(0)}% dos seus gastos (${formatCurrency(
          topCategory[1]
        )}). Considere revisar.`,
        icon: <AlertCircle className="text-info" size={20} />,
        educationalTip: `Reduzir gastos em grandes categorias tem mais impacto do que cortar pequenos prazeres. Veja se consegue renegociar contratos em ${topCategory[0]}.`,
      });
    }

    // Alert 4: Savings opportunity
    if (balance > 0 && balance > currentIncome * 0.2) {
      detectedAlerts.push({
        id: "savings-opportunity",
        type: "success",
        title: "Oportunidade de Poupança",
        message: `Você tem ${formatCurrency(
          balance
        )} disponível este mês. Que tal investir ou guardar para emergências?`,
        icon: <Sparkles className="text-success" size={20} />,
      });
    }

    // Alert 5: Low transaction activity
    if (currentMonthTransactions.length < 5 && now.getDate() > 10) {
      detectedAlerts.push({
        id: "low-activity",
        type: "info",
        title: "Poucas Transações Registradas",
        message: `Você registrou apenas ${currentMonthTransactions.length} transações este mês. Lembre-se de manter seus registros atualizados!`,
        icon: <AlertCircle className="text-info" size={20} />,
      });
    }

    return detectedAlerts;
  }, [transactions]);

  if (alerts.length === 0) {
    return (
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="text-primary" size={20} />
            Alertas Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles
              className="mx-auto text-muted-foreground mb-3"
              size={48}
            />
            <p className="text-muted-foreground">
              Tudo tranquilo por aqui! Nenhum alerta no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const typeColors = {
    warning: "bg-warning/10 border-warning/30",
    info: "bg-info/10 border-info/30",
    success: "bg-success/10 border-success/30",
    danger: "bg-danger/10 border-danger/30",
  };

  const typeBadges = {
    warning: "Atenção",
    info: "Info",
    success: "Boa Notícia",
    danger: "Urgente",
  };

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="text-primary" size={20} />
          Alertas Inteligentes
          <Badge variant="secondary" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border ${typeColors[alert.type]}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{alert.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-sm">{alert.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {typeBadges[alert.type]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {alert.message}
                </p>
                {alert.educationalTip && (
                  <div className="bg-black/20 p-3 rounded-lg border border-black/5 mt-2">
                    <p className="text-xs font-medium opacity-90 flex gap-2">
                      <span>💡</span>
                      {alert.educationalTip}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};
