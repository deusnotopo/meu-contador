import React, { useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useEducation } from '@/hooks/useEducation';
import { useTransactions } from '@/hooks/useTransactions';
import { Bot, Sparkles, ArrowLeft } from 'lucide-react';
import { AIFinancialChat } from './AIFinancialChat';
import { SmartInsights } from '../personal/SmartInsights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { UpgradeModal } from '../ui/UpgradeModal';
import { Zap, Lock } from 'lucide-react';
import { useTour } from '@/hooks/useTour';
import type { TabType } from '@/types/navigation';

const TUTOR_CAPABILITIES = [
  'Explica sem economês e com exemplos brasileiros',
  'Traduz finanças e contabilidade em próxima ação prática',
  'Prioriza caixa, dívida cara e reserva antes de sofisticação',
];

const TUTOR_STARTERS = [
  'Explique sem economês onde estou errando',
  'Explique como contador a minha situação',
  'Qual é meu próximo melhor passo financeiro?',
];

const TUTOR_DEPTHS = ['Básico', 'Prático', 'Avançado', 'Explique como contador'];

interface AIAssistantViewProps {
  onBack?: (tab?: TabType) => void;
}

export const AIAssistantView = ({ onBack }: AIAssistantViewProps) => {
  const { user } = useAuth();
  const { getTutorContext } = useEducation(user || undefined);
  const { isEnabled } = useFeatureFlags();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { startTour } = useTour();
  
  React.useEffect(() => {
    startTour('ai');
  }, [startTour]);
  
  const isAiEnabled = isEnabled('ai_advisor');
  
  const isBusiness = user?.currentWorkspaceId && user.currentWorkspaceId !== 'personal';
  const scope = isBusiness ? 'business' : 'personal';
  
  const { transactions } = useTransactions(scope);
  const tutorContext = getTutorContext();

  return (
    <div style={{ padding: "10px 0", height: "100%", display: "flex", flexDirection: "column", animation: "fsu 0.26s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        {onBack && (
          <button className="back-btn" onClick={() => onBack()}>
            <ArrowLeft size={16} />
          </button>
        )}
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(155,127,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)" }}>
          <Bot size={22} />
        </div>
        <div>
          <div className="eyebrow" style={{ color: "var(--purple)" }}>Consultor Neural</div>
          <div className="page-title" style={{ margin: 0, fontSize: 22 }}>Inteligência Artificial</div>
        </div>
      </div>

      <Tabs defaultValue="chat" className="flex flex-col flex-1 min-h-0">
        <TabsList className="tnav mb-4">
          <TabsTrigger value="chat" className="tnav-i flex-1 flex gap-2 items-center">
            <Bot size={14} /> Consultor
          </TabsTrigger>
          {!isBusiness && (
            <TabsTrigger value="insights" className="tnav-i flex-1 flex gap-2 items-center">
              <Sparkles size={14} /> Insights
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 relative m-0 flex flex-col data-[state=inactive]:hidden">
          <div className="card absolute inset-0 p-2 flex flex-col overflow-hidden">
             {!isAiEnabled ? (
               <div className="glass-panel absolute inset-0 z-50 flex flex-col items-center justify-center text-center p-10 bg-[#02040ae6] backdrop-blur-md">
                 <div className="w-16 h-16 rounded-[20px] bg-amber-500/10 flex items-center justify-center text-amber-500 mb-5">
                   <Lock size={32} />
                 </div>
                 <h3 className="text-[20px] font-black mb-3 text-white">Acesso Restrito</h3>
                 <p className="text-[13px] text-white/60 mb-8 leading-[1.6]">
                   O Consultor Neural exige o licenciamento **PRO**. Desbloqueie auditorias em tempo real e projeções preditivas para o seu Patrimônio.
                 </p>
                 <button 
                   className="btn-p w-full max-w-[240px] h-[52px] rounded-2xl flex items-center justify-center gap-2"
                   onClick={() => setShowUpgrade(true)}
                 >
                   <Zap size={18} fill="currentColor" />
                   Fazer Upgrade
                 </button>
               </div>
             ) : (
               <>
                 <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                   <div className="flex items-center justify-between gap-3 mb-3">
                     <div>
                       <div className="text-[10px] uppercase tracking-[0.18em] text-purple-300 font-black mb-1">Modo tutor ativo</div>
                       <div className="text-sm font-bold text-white">IA para aprender, decidir e agir</div>
                     </div>
                     <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-300">
                       <Sparkles size={18} />
                     </div>
                   </div>
                    <div className="grid gap-2 mb-3">
                     <div className="text-[11px] text-emerald-200 bg-emerald-500/10 rounded-xl px-3 py-2 border border-emerald-500/20">
                       Momento atual: {tutorContext.currentMoment?.title || 'Analisando'}
                     </div>
                     <div className="text-[11px] text-slate-300 bg-black/20 rounded-xl px-3 py-2 border border-white/5">
                       Fase da jornada: {tutorContext.journeyStage?.title || 'Fundação'}
                     </div>
                     {tutorContext.learningFocus && (
                      <div className="text-[11px] text-amber-100 bg-amber-500/10 rounded-xl px-3 py-2 border border-amber-500/20">
                        Foco tutor: {tutorContext.learningFocus.title}
                      </div>
                    )}
                     {TUTOR_CAPABILITIES.map((item) => (
                       <div key={item} className="text-[11px] text-slate-300 bg-black/20 rounded-xl px-3 py-2 border border-white/5">
                         {item}
                       </div>
                     ))}
                   </div>
                  <div className="mb-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-purple-300 font-black mb-2">Profundidade de resposta</div>
                    <div className="flex flex-wrap gap-2">
                      {TUTOR_DEPTHS.map((item) => (
                        <div key={item} className="text-[10px] px-3 py-2 rounded-full border border-white/10 bg-black/20 text-slate-300 font-bold">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                   <div className="flex flex-wrap gap-2">
                     {TUTOR_STARTERS.map((item) => (
                       <div key={item} className="text-[10px] px-3 py-2 rounded-full border border-purple-400/20 bg-purple-500/10 text-purple-200 font-bold">
                         {item}
                       </div>
                     ))}
                   </div>
                 </div>
                 <AIFinancialChat />
               </>
             )}
          </div>
        </TabsContent>
        
        {!isBusiness && (
          <TabsContent value="insights" className="flex-1 overflow-y-auto m-0 pb-5 data-[state=inactive]:hidden">
            <SmartInsights transactions={transactions} goals={[]} />
          </TabsContent>
        )}
      </Tabs>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};
