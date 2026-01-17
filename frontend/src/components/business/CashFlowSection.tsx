import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { exportTransactionsPDF } from "@/lib/pdf-export";
import { STORAGE_EVENT, STORAGE_KEYS } from "@/lib/storage";
import type { Transaction } from "@/types";
import { Download, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  transactions: Transaction[];
}

export const CashFlowSection = ({ transactions }: Props) => {
  const [privacyMode, setPrivacyMode] = useState(
    localStorage.getItem(STORAGE_KEYS.PRIVACY_MODE) === "true"
  );

  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key === STORAGE_KEYS.PRIVACY_MODE) {
        setPrivacyMode(detail.data === "true" || detail.data === true);
      }
    };
    window.addEventListener(STORAGE_EVENT, handleStorageChange);
    return () =>
      window.removeEventListener(STORAGE_EVENT, handleStorageChange);
  }, []);
  const monthlyData: Record<
    string,
    { month: string; entrada: number; saida: number }
  > = {};

  transactions.forEach((t) => {
    const month = t.date.slice(0, 7);
    if (!monthlyData[month])
      monthlyData[month] = { month, entrada: 0, saida: 0 };
    if (t.type === "income") monthlyData[month].entrada += t.amount;
    else monthlyData[month].saida += t.amount;
  });

  const data = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  return (
    <div className="premium-card">
      <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={18} />
            <h3 className="text-lg font-black uppercase tracking-widest text-white">
              Fluxo de <span className="text-emerald-400">Caixa</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Histórico de entradas e saídas (6 meses)
          </p>
        </div>

        <Button
          className="h-10 px-6 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
          onClick={() => exportTransactionsPDF("Fluxo de Caixa", transactions)}
        >
          <Download size={14} className="mr-2" />
          Exportar Transações
        </Button>
      </div>

      <div className="p-6 md:p-8">
        {data.length > 0 ? (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff05"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(v) =>
                    privacyMode ? "***" : `R$${v / 1000}k`
                  }
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    backgroundColor: "#0a0a0b",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  }}
                  itemStyle={{
                    fontSize: "12px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                  }}
                  formatter={(v: number) => {
                    if (privacyMode) return "****";
                    return formatCurrency(v);
                  }}
                />
                <Bar
                  dataKey="entrada"
                  fill="url(#colorEntrada)"
                  radius={[6, 6, 0, 0]}
                  name="Entradas"
                  barSize={32}
                />
                <Bar
                  dataKey="saida"
                  fill="url(#colorSaida)"
                  radius={[6, 6, 0, 0]}
                  name="Saídas"
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <TrendingUp size={32} className="text-slate-700 mb-4" />
            <p className="text-slate-500 font-bold text-sm">
              Nenhum dado financeiro capturado
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
