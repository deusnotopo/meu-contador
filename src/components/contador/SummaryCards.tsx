import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CurrencyCode,
  SUPPORTED_CURRENCIES,
  currencyService,
} from "@/lib/currency";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ListChecks,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { PrivacyValue } from "../ui/PrivacyValue";

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
  const [currency, setCurrency] = useState<CurrencyCode>("BRL");

  const convert = (val: number) =>
    currencyService.convertFromBRL(val, currency);

  const format = (val: number) => currencyService.format(val, currency);

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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select
          value={currency}
          onValueChange={(v: CurrencyCode) => setCurrency(v)}
        >
          <SelectTrigger className="w-[140px] h-8 bg-white/5 border-white/10 text-xs font-bold uppercase tracking-widest text-slate-400">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card, i) => (
          <Card
            key={i}
            className={`glass-card border-none group transition-all duration-500 hover:-translate-y-2 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden ${
              card.gradient.includes("gradient")
                ? "bg-gradient-to-br from-indigo-600/20 to-purple-600/20"
                : ""
            }`}
          >
            {card.gradient.includes("gradient") && (
              <div className="absolute -inset-4 bg-indigo-500/10 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            )}
            <CardContent className="p-5 md:p-7 relative z-10">
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div
                  className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${
                    card.gradient.includes("gradient")
                      ? "bg-indigo-500 shadow-lg shadow-indigo-500/30"
                      : "bg-white/5"
                  }`}
                >
                  <card.icon
                    size={
                      typeof window !== "undefined" && window.innerWidth < 768
                        ? 18
                        : 24
                    }
                    className={
                      card.gradient.includes("gradient")
                        ? "text-white"
                        : card.textColor
                    }
                  />
                </div>
              </div>
              <div className="space-y-1 md:space-y-2">
                <p
                  className={`text-[8px] md:text-xs font-black uppercase tracking-[0.15em] ${
                    card.gradient.includes("gradient")
                      ? "text-indigo-200"
                      : "text-slate-500"
                  }`}
                >
                  {card.title}
                </p>
                <h3
                  className={`text-xl md:text-3xl font-black tracking-tighter ${
                    card.gradient.includes("gradient")
                      ? "text-white glow-text"
                      : card.textColor
                  }`}
                >
                  {card.isCount ? (
                    card.value
                  ) : (
                    <PrivacyValue
                      value={card.value}
                      displayValue={format(convert(card.value))}
                    />
                  )}
                </h3>
                <p
                  className={`text-[8px] md:text-xs font-bold ${
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
    </div>
  );
};
