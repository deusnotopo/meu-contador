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
          className={`glass-card border-none group transition-all duration-500 hover:-translate-y-2 rounded-[2rem] overflow-hidden ${
            card.gradient.includes("gradient") ? "bg-gradient-to-br from-indigo-600/20 to-purple-600/20" : ""
          }`}
        >
          {card.gradient.includes("gradient") && (
            <div className="absolute -inset-4 bg-indigo-500/10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
          )}
          <CardContent className="p-7 relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div
                className={`p-4 rounded-2xl ${
                  card.gradient.includes("gradient")
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
                    : "bg-white/5"
                }`}
              >
                <card.icon
                  size={24}
                  className={
                    card.gradient.includes("gradient")
                      ? "text-white"
                      : card.textColor
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <p
                className={`text-xs font-black uppercase tracking-[0.15em] ${
                  card.gradient.includes("gradient")
                    ? "text-indigo-200"
                    : "text-slate-500"
                }`}
              >
                {card.title}
              </p>
              <h3
                className={`text-2xl md:text-3xl font-black tracking-tighter ${
                  card.gradient.includes("gradient")
                    ? "text-white glow-text"
                    : card.textColor
                }`}
              >
                {card.isCount ? card.value : formatCurrency(card.value)}
              </h3>
              <p
                className={`text-xs font-bold ${
                  card.gradient.includes("gradient")
                    ? "text-indigo-200/60"
                    : "text-slate-500/70"
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
