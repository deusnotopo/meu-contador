import React, { useState, useEffect, useRef } from "react";
import { ProbabilisticAreaChart } from "@/components/ui/ProbabilisticAreaChart";
import { Slider } from "@/components/ui/slider";
import { Rocket, Timer, Loader2 } from "lucide-react";
import { useInvestments } from "@/hooks/useInvestments";
import { useIntelligence, SimulationResult } from "@/hooks/useIntelligence";
import { logger } from "@/lib/logger";

export const ScenarioSimulator: React.FC = () => {
  const { totals: investTotals } = useInvestments();
  const { simulate } = useIntelligence();
  
  const [deposit, setDeposit] = useState(500);
  const [yieldRate, setYieldRate] = useState(8);
  const [years, setYears] = useState(10);
  
  const [simulationData, setSimulationData] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // API Call with debounce
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await simulate({
          additionalMonthlyDeposit: deposit,
          expectedAnnualYield: yieldRate,
          horizonYears: years
        });
        if (active) {
          setSimulationData(result);
        }
      } catch (err) {
        logger.error('[ScenarioSimulator] Simulation failed', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [deposit, yieldRate, years, simulate]);

  const fmt = (n: number) => "R$\u00a0" + Math.round(n).toLocaleString("pt-BR");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket size={18} className="text-indigo-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white/90">Laboratório de Futuro</h3>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-tighter flex items-center gap-2">
          {isLoading ? (
            <>
              <Loader2 size={10} className="animate-spin" />
              Processando Monte Carlo...
            </>
          ) : (
            "Motor Institucional"
          )}
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
        <div className={`flex flex-col justify-between bg-white/[0.02] border border-white/[0.05] rounded-3xl p-5 relative overflow-hidden transition-opacity duration-300 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
          <div className="relative z-10">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Patrimônio Esperado</div>
            <div className="text-2xl font-black text-white tracking-tight mb-4">
              {simulationData ? fmt(simulationData.finalBalance) : "---"}
            </div>

            <div ref={containerRef} className="w-full h-28 mb-2">
              {simulationData ? (
                <ProbabilisticAreaChart
                  data={simulationData.monteCarlo}
                  w={chartWidth}
                  h={112}
                  color="#4A8BFF"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                   <Loader2 size={24} className="animate-spin text-white/10" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-white/[0.05] relative z-10">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-1.5">
                <Timer size={14} className="text-amber-500/50" />
                <span className="text-[10px] text-white/40 font-medium italic">
                  Base: {fmt(investTotals.currentValue)} investidos
                </span>
              </div>
              {simulationData && (
                <div className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  1.000 iterações Monte Carlo
                </div>
              )}
            </div>
            <div className="text-[9px] text-white/20 mt-1 uppercase tracking-widest leading-relaxed">
              A banda sombreada representa 90% de confiança estatística (p5-p95).
            </div>
          </div>

          <div className="absolute -right-20 -top-20 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
