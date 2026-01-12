import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ListChecks,
  Wallet,
} from "lucide-react";

interface Props {
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
  isGlobal?: boolean;
}

export const SummaryCards = ({
  income,
  expense,
  balance,
  transactionCount,
  isGlobal = false,
}: Props) => {
  const cards = [
    {
      title: isGlobal ? "Total em Caixa" : "Saldo Atual",
      subtitle: "Dinheiro disponível",
      value: balance,
      icon: Wallet,
      gradient: "gradient-primary",
      textColor: "text-white",
    },
    {
      title: "Entradas",
      subtitle: "Dinheiro que entrou",
      value: income,
      icon: ArrowUpCircle,
      gradient: "bg-success/10",
      textColor: "text-success",
    },
    {
      title: "Saídas",
      subtitle: "Dinheiro que saiu",
      value: expense,
      icon: ArrowDownCircle,
      gradient: "bg-danger/10",
      textColor: "text-danger",
    },
    {
      title: "Movimentações",
      subtitle: "Total de registros",
      value: transactionCount,
      icon: ListChecks,
      gradient: "bg-info/10",
      textColor: "text-info",
      isCount: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <Card
          key={i}
          className={`shadow-card border-0 overflow-hidden relative group transition-transform hover:scale-[1.02] ${
            card.gradient.includes("gradient") ? card.gradient : "bg-card"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-2xl ${
                  card.gradient.includes("gradient")
                    ? "bg-white/20"
                    : card.gradient
                }`}
              >
                <card.icon
                  size={28}
                  className={
                    card.gradient.includes("gradient")
                      ? "text-white"
                      : card.textColor
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <p
                className={`text-sm font-bold uppercase tracking-widest ${
                  card.gradient.includes("gradient")
                    ? "text-white/80"
                    : "text-muted-foreground"
                }`}
              >
                {card.title}
              </p>
              <h3
                className={`text-3xl font-black ${
                  card.gradient.includes("gradient")
                    ? "text-white"
                    : card.textColor
                }`}
              >
                {card.isCount ? card.value : formatCurrency(card.value)}
              </h3>
              <p
                className={`text-xs font-medium ${
                  card.gradient.includes("gradient")
                    ? "text-white/60"
                    : "text-muted-foreground/70"
                }`}
              >
                {card.subtitle}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
