import React, { useRef, useEffect, useState } from "react";
import { BarChart } from "@/components/ui/Charts";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import type { TabType } from "@/types/navigation";

interface FluxoMensalProps {
  monthName: string;
  income: number;
  expense: number;
  balance: number;
  savingRate: number;
  barData: number[];
  barColors: string[];
  months: string[];
  onNavigate?: (tab: TabType) => void;
  fmt: (n: number) => string;
  error?: boolean | string | null;
}

export const FluxoMensal: React.FC<FluxoMensalProps> = ({
  monthName,
  income,
  expense,
  balance,
  savingRate,
  barData,
  barColors,
  months,
  onNavigate,
  fmt,
  error,
}) => {
  // Responsive BarChart width
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(280);

  useEffect(() => {
    if (!containerRef.current) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setChartWidth(Math.floor(width));
        }, 150);
      }
    });
    observer.observe(containerRef.current);
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2">
        <AlertCircle size={22} className="text-amber-400 opacity-70" />
        <div className="text-[13px] font-semibold text-white/70">Sem Conexão</div>
        <div className="text-[11px] text-white/30 text-center">
          Não foi possível carregar o resumo mensal.
        </div>
      </div>
    );
  }

  const isPositive = balance >= 0;
  const savingColor =
    savingRate >= 20 ? "text-emerald-400" : savingRate >= 5 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--t3)" }}>
          Fluxo de <span className="capitalize text-white/60">{monthName}</span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.("personal")}
          className="text-[11px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
        >
          Detalhes
        </button>
      </div>

      {/* Income / Expense cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl p-3.5 bg-emerald-500/[0.06] border border-emerald-500/[0.14]"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp size={11} className="text-emerald-400" aria-hidden />
            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Receitas</span>
          </div>
          <div className="text-[18px] font-black tabular-nums text-emerald-400 leading-none font-mono tracking-[-0.5px]">
            {fmt(income)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="rounded-2xl p-3.5 bg-rose-500/[0.06] border border-rose-500/[0.14]"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingDown size={11} className="text-red-400" aria-hidden />
            <span className="text-[9px] font-bold uppercase tracking-widest text-red-500">Gastos</span>
          </div>
          <div className="text-[18px] font-black tabular-nums text-red-400 leading-none font-mono tracking-[-0.5px]">
            {fmt(expense)}
          </div>
        </motion.div>
      </div>

      {/* Balance + Taxa row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl px-4 py-3 flex items-center justify-between bg-white/[0.03] border border-white/[0.06]"
      >
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Poupado</div>
          <div className={`text-[16px] font-black tabular-nums leading-none font-mono ${isPositive ? "text-blue-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{fmt(balance)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Taxa</div>
          <div className={`text-[16px] font-black tabular-nums leading-none font-mono ${savingColor}`}>
            {savingRate.toFixed(1).replace(".", ",")}%
          </div>
        </div>
      </motion.div>

      {/* Responsive Bar Chart */}
      {barData.length > 0 && (
        <div className="pt-3 border-t border-white/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">
              Últimos {barData.length} meses
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm inline-block bg-[var(--blue)]" />
              <span className="text-[9px] text-white/20 font-bold">Gastos</span>
            </div>
          </div>
          {/* Measure container — BarChart receives real width */}
          <div ref={containerRef} className="w-full h-12 overflow-hidden">
            <BarChart data={barData} colors={barColors} w={chartWidth} h={48} />
          </div>
          <div className="flex mt-1.5 font-mono">
            {months.map((m, idx) => (
              <span key={idx} className="flex-1 text-center text-[8px] text-white/20 font-bold">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
