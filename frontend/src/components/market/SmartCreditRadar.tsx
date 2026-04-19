import React, { useState } from 'react';
import { useInterestRates, CreditModality } from '@/hooks/useInterestRates';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ShieldAlert, BadgePercent, Loader2, Info } from 'lucide-react';
import { HelpButton } from '../ui/HelpButton';

// Utility to get nice names and icons for modalities
function getModalityInfo(m: string) {
  if (m.includes('PESSOAL NAO CONSIGNADO')) return { name: 'Empréstimo Pessoal', icon: '👤' };
  if (m.includes('VEICULOS')) return { name: 'Financiamento Veículos', icon: '🚙' };
  if (m.includes('CHEQUE ESPECIAL')) return { name: 'Cheque Especial', icon: '🚨' };
  if (m.includes('ROTATIVO TOTAL')) return { name: 'Cartão de Crédito', icon: '💳' };
  if (m.includes('PARCELADO')) return { name: 'Cartão Parcelado', icon: '🛍️' };
  if (m.includes('CONSIGNADO INSS')) return { name: 'Consignado INSS', icon: '👴' };
  return { name: m, icon: '🏦' };
}

export const SmartCreditRadar = () => {
  const { rates, modalities, loading, error, fetchRates } = useInterestRates("CREDITO PESSOAL NAO CONSIGNADO");
  const [selectedModality, setSelectedModality] = useState<CreditModality>("CREDITO PESSOAL NAO CONSIGNADO");

  const handleModalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as CreditModality;
    setSelectedModality(val);
    fetchRates(val);
  };

  const currentInfo = getModalityInfo(selectedModality);

    const topRates = [...rates].sort((a, b) => a.TaxaJurosAoMes - b.TaxaJurosAoMes).slice(0, 5);

  return (
    <div className="card" style={{ 
      background: 'linear-gradient(145deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 100%)',
      border: '1px solid rgba(139,92,246,0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--purple)" }}>Inteligência de Mercado</span>
             <HelpButton tooltipText="Dados oficiais extraídos do Banco Central do Brasil (SGS/Olinda). Atualizado diariamente." />
          </div>
          <div className="text-[16px] font-bold text-white flex items-center gap-2">
            <BadgePercent size={18} className="text-purple-400" />
            Radar de Crédito
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 max-w-[250px]">
            As melhores taxas de juros do país antes de você se endividar.
          </div>
        </div>
      </div>

      {/* Select Box */}
      <div className="relative mb-5">
        <select 
          className="w-full bg-white/[0.04] border border-white/[0.1] text-white text-[13px] font-medium rounded-xl py-2.5 px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          value={selectedModality}
          onChange={handleModalityChange}
        >
          {modalities.map(m => (
            <option key={m} value={m} style={{ background: '#0B1120' }}>
              {getModalityInfo(m).icon} {getModalityInfo(m).name}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
          ▼
        </div>
      </div>

      {/* Results Box */}
      <div className="rounded-2xl bg-[#030712]/50 border border-white/[0.05] p-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-purple-400/70">
            <Loader2 className="animate-spin mb-2" size={24} />
            <span className="text-[11px] font-mono tracking-widest uppercase">Analisando Mercado...</span>
          </div>
        ) : error ? (
           <div className="py-6 px-4 text-center">
             <ShieldAlert size={28} className="text-red-400 mx-auto mb-2 opacity-80" />
             <div className="text-[12px] text-red-200/80 font-medium">{error}</div>
             <button onClick={() => fetchRates(selectedModality)} className="mt-3 text-[10px] uppercase font-bold text-red-400 hover:text-red-300 tracking-wider">Tentar Novamente</button>
           </div>
        ) : topRates.length === 0 ? (
           <div className="py-6 px-4 text-center">
             <Info size={28} className="text-neutral-500 mx-auto mb-2 opacity-60" />
             <div className="text-[12px] text-neutral-500">Nenhum dado encontrado para o período.</div>
           </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {topRates.map((r, i) => (
                <motion.div 
                  key={r.cnpj8 + i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/[0.03] ${i === 0 ? 'bg-purple-500/10 border border-purple-500/20' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i === 0 ? 'bg-amber-400 text-amber-900 shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 
                      i === 1 ? 'bg-neutral-400 text-neutral-900' :
                      i === 2 ? 'bg-amber-700/80 text-amber-100' :
                      'bg-white/5 text-white/50'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-white truncate" title={r?.InstituicaoFinanceira}>
                        {r?.InstituicaoFinanceira?.split('-')[0]?.trim() || 'Desconhecida'}
                      </div>
                      <div className="text-[10px] text-white/40 font-mono mt-0.5">Ano: {(r.TaxaJurosAoAno).toFixed(1)}% a.a</div>
                    </div>
                  </div>
                  
                  <div className="text-right pl-2 shrink-0">
                    <div className={`text-[14px] font-black tracking-tight font-mono ${i === 0 ? 'text-purple-400' : 'text-neutral-300'}`}>
                      {r.TaxaJurosAoMes.toFixed(2)}%
                    </div>
                    <div className="text-[9px] text-white/30 uppercase mt-0.5">Ao Mês</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {topRates.length > 0 && (
         <div className="mt-4 flex items-start gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
           <Trophy size={14} className="text-blue-400 mt-0.5 shrink-0" />
           <div className="text-[11px] text-blue-200 leading-relaxed">
             Para <strong>{currentInfo.name}</strong>, a instituição <strong>{topRates[0]?.InstituicaoFinanceira?.split('-')[0]?.trim() || 'Desconhecida'}</strong> oferece a melhor taxa do mercado atual. Use isso como moeda de troca ao negociar no seu banco!
           </div>
         </div>
      )}
    </div>
  );
}

