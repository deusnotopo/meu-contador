import React, { useMemo } from 'react';
import { useInvestments } from '@/hooks/useInvestments';
import { useCurrency } from '@/context/CurrencyContext';
import { PrivacyValue } from '@/components/ui/PrivacyValue';
import { motion } from 'framer-motion';
import { SmartCreditRadar } from '@/components/market/SmartCreditRadar';
import { FipeVehicleManager } from '@/components/market/FipeVehicleManager';
import { MarketDataWidget } from '../MarketDataWidget';
import { CDIBenchmark } from '../CDIBenchmark';
import { AssetAllocationChart } from '../AssetAllocationChart';
import { RealTimeQuotes } from '../RealTimeQuotes';
import { TesouroDiretoRates } from '../TesouroDiretoRates';
import { Zap, Activity, TrendingUp, TrendingDown, Compass, Cpu, ChevronRight } from 'lucide-react';
import type { Currency } from '@/types';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  totalValue: number;
  totalInvested: number;
  profitPercentage: number;
  onNavigateToLedger?: () => void;
}

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

export const BentoCockpit: React.FC<Props> = ({ totalValue, totalInvested, profitPercentage, onNavigateToLedger }) => {
  const { assets, loading } = useInvestments();
  const currencyCtx = useCurrency();
  const convert = currencyCtx?.convert || ((v: number) => v);

  const profit = totalValue - totalInvested;
  const isPositive = profitPercentage >= 0;

  // Top 3 assets by current value
  const topAssets = useMemo(() => {
    return [...assets]
      .sort((a, b) => {
        const va = convert(a.amount * a.currentPrice, (a.currency || 'BRL') as Currency, 'BRL');
        const vb = convert(b.amount * b.currentPrice, (b.currency || 'BRL') as Currency, 'BRL');
        return vb - va;
      })
      .slice(0, 3);
  }, [assets, convert]);

  // Vehicle assets from FIPE
  const vehicleAssets = useMemo(() => assets.filter(a => a.type === ('vehicle' as any)), [assets]);

  return (
    <motion.div
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-5 w-full"
    >
      {/* ── ROW 1: Net Worth Principal + Macro Stack ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

        {/* BIG CARD: Net Worth */}
        <motion.div variants={cardVariant} className="md:col-span-8 flex flex-col justify-between p-8 rounded-3xl relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(8,14,31,1) 0%, rgba(3,7,18,1) 100%)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{
            background: isPositive ? 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)'
          }} />

          <div className="relative z-10 flex flex-col h-full gap-6">
            {/* Label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Activity size={13} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-400">Patrimônio Consolidado</span>
              </div>
              <div className={`text-[11px] font-bold px-3 py-1 rounded-full border ${isPositive ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 'text-rose-400 border-rose-500/20 bg-rose-500/10'}`}>
                {isPositive ? '+' : ''}{profitPercentage.toFixed(2)}%
              </div>
            </div>

            {/* Big number */}
            <div>
              <div className="text-[52px] md:text-[68px] font-black text-white font-mono tracking-tighter leading-none">
                <PrivacyValue value={totalValue} />
              </div>
              <div className={`flex items-center gap-2 mt-2 text-sm font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <PrivacyValue value={Math.abs(profit)} />
                <span className="text-white/30 text-xs">vs custo</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 border-t border-white/5 pt-4 mt-auto">
              <div>
                <div className="text-[9px] uppercase text-white/30 tracking-widest font-bold mb-0.5">Custo Total</div>
                <div className="text-[16px] text-white font-mono font-bold"><PrivacyValue value={totalInvested} /></div>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div>
                <div className="text-[9px] uppercase text-white/30 tracking-widest font-bold mb-0.5">Ativos</div>
                <div className="text-[16px] text-white font-mono font-bold">{assets.length}</div>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div>
                <div className="text-[9px] uppercase text-white/30 tracking-widest font-bold mb-0.5">Bens Físicos</div>
                <div className="text-[16px] text-white font-mono font-bold">{vehicleAssets.length}</div>
              </div>
            </div>

            {/* Top 3 mini positions */}
            {topAssets.length > 0 && (
              <div className="border-t border-white/5 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] uppercase text-white/30 tracking-widest font-bold">Maiores Posições</span>
                  {onNavigateToLedger && (
                    <button onClick={onNavigateToLedger} className="flex items-center gap-1 text-[9px] text-blue-400 hover:text-blue-300 transition-colors font-bold">
                      Ver todos <ChevronRight size={10} />
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  {topAssets.map(asset => {
                    const val = convert(asset.amount * asset.currentPrice, (asset.currency || 'BRL') as Currency, 'BRL');
                    const cost = convert(asset.amount * asset.averagePrice, (asset.currency || 'BRL') as Currency, 'BRL');
                    const pnl = cost > 0 ? ((val - cost) / cost) * 100 : 0;
                    return (
                      <div key={asset.id} className="flex-1 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="text-[11px] font-black text-white truncate">{asset.ticker || asset.name}</div>
                        <div className="text-[10px] font-mono text-white/60 mt-0.5">{formatCurrency(val)}</div>
                        <div className={`text-[9px] font-bold mt-1 ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* SIDE STACK: Macro + Tickers */}
        <div className="md:col-span-4 flex flex-col gap-5">
          <motion.div variants={cardVariant}>
            <MarketDataWidget />
          </motion.div>
          <motion.div variants={cardVariant}>
            <RealTimeQuotes />
          </motion.div>
        </div>
      </div>

      {/* ── ROW 2: Intelligence Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Credit Radar */}
        <motion.div variants={cardVariant} className="md:col-span-4 rounded-3xl overflow-hidden border border-white/5 bg-[#030712] relative">
          <div className="absolute top-4 right-4 z-10"><Cpu size={12} className="text-purple-400/40" /></div>
          <SmartCreditRadar />
        </motion.div>

        {/* CDI Benchmark */}
        <motion.div variants={cardVariant} className="md:col-span-4 rounded-3xl overflow-hidden p-5 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <Compass size={12} className="text-emerald-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">Benchmark Real</span>
          </div>
          <CDIBenchmark rentabilidade={profitPercentage} valorInvestido={totalInvested} valorAtual={totalValue} />
        </motion.div>

        {/* Asset Allocation */}
        <motion.div variants={cardVariant} className="md:col-span-4 rounded-3xl overflow-hidden border border-white/5 bg-[#030712]">
          <div className="p-4 flex items-center gap-2 border-b border-white/5">
            <Zap size={12} className="text-amber-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">Exposição</span>
          </div>
          <div className="p-2">
            <AssetAllocationChart assets={assets} loading={loading} convert={convert} />
          </div>
        </motion.div>
      </div>

      {/* ── ROW 3: Tesouro Direto ── */}
      <motion.div variants={cardVariant} className="w-full rounded-3xl overflow-hidden border border-white/5 bg-[#030712]">
        <div className="p-4 border-b border-white/5">
          <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">🏦 Tesouro Direto</span>
        </div>
        <div className="p-4">
          <TesouroDiretoRates />
        </div>
      </motion.div>

      {/* ── ROW 4: FIPE Garagem ── */}
      <motion.div variants={cardVariant} className="w-full">
        <FipeVehicleManager />
      </motion.div>

    </motion.div>
  );
};
