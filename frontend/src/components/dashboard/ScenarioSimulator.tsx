import React, { useState, useEffect, useRef, useMemo } from "react";
import { AreaChart } from "@/components/ui/Charts";
import { Slider } from "@/components/ui/slider";
import { Rocket, Timer } from "lucide-react";
import { useInvestments } from "@/hooks/useInvestments";

interface TimelinePoint {
  month: number;
  balance: number;
}

// Pure local compound interest simulation — no API, no CSRF
function simulateLocally(
  initialBalance: number,
  monthlyDeposit: number,
  annualYield: number,
  horizonYears: number
): { timeline: TimelinePoint[]; finalBalance: number } {
  const monthlyRate = Math.pow(1 + annualYield / 100, 1 / 12) - 1;
  const totalMonths = horizonYears * 12;
  const timeline: TimelinePoint[] = [];
  let balance = initialBalance;

  for (let m = 1; m <= totalMonths; m++) {
    balance = balance * (1 + monthlyRate) + monthlyDeposit;
    if (m % 6 === 0 || m === totalMonths) {
      timeline.push({ month: m, balance: Math.round(balance) });
    }
  }

  return { timeline, finalBalance: balance };
}

export const ScenarioSimulator: React.FC = () => {
  const { totals: investTotals } = useInvestments();
  const [deposit, setDeposit] = useState(500);
  const [yieldRate, setYieldRate] = useState(8);
  const [years, setYears] = useState(10);

  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(300);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) setChartWidth(Math.floor(width));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Pure local calculation — instant, no network
  const { timeline, finalBalance } = useMemo(() => {
    return simulateLocally(
      investTotals.currentValue,
      deposit,
      yieldRate,
      years
    );
  }, [investTotals.currentValue, deposit, yieldRate, years]);

  const fmt = (n: number) => "R$\u00a0" + Math.round(n).toLocaleString("pt-BR");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket size={18} className="text-indigo-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Laboratório de Futuro</h3>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-tighter">
          Simulação Local
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Aporte Extra Mensal</label>
              <span className="text-xs font-mono font-bold text-indigo-400">{fmt(deposit)}</span>
            </div>
            <Slider
              value={[deposit]}
              onValueChange={(v) => setDeposit(v[0] || 0)}
              max={10000}
              step={100}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Rentabilidade a.a.</label>
              <span className="text-xs font-mono font-bold text-emerald-400">{yieldRate}%</span>
            </div>
            <Slider
              value={[yieldRate]}
              onValueChange={(v) => setYieldRate(v[0] || 0)}
              max={25}
              step={0.5}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Horizonte (Anos)</label>
              <span className="text-xs font-mono font-bold text-amber-500">{years} Anos</span>
            </div>
            <Slider
              value={[years]}
              onValueChange={(v) => setYears(v[0] || 0)}
              min={1}
              max={40}
              step={1}
            />
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-between bg-white/[0.02] border border-white/[0.05] rounded-3xl p-5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Patrimônio Estimado</div>
            <div className="text-2xl font-black text-white tracking-tight mb-4">
              {fmt(finalBalance)}
            </div>

            <div ref={containerRef} className="w-full h-24 mb-2">
              <AreaChart
                data={timeline.map(d => d.balance)}
                w={chartWidth}
                h={96}
                color="#4A8BFF"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/[0.05] relative z-10">
            <div className="flex items-center gap-1.5">
              <Timer size={14} className="text-amber-500/50" />
              <span className="text-[10px] text-white/40 font-medium italic">
                Juros compostos · patrimônio atual: {fmt(investTotals.currentValue)}
              </span>
            </div>
          </div>

          <div className="absolute -right-20 -top-20 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
