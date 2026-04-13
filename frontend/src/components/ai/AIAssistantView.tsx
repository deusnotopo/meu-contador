import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEducation } from '@/hooks/useEducation';
import { useTransactions } from '@/hooks/useTransactions';
import { useReminders } from '@/hooks/useReminders';
import { Bot, Sparkles, ArrowLeft, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { AIFinancialChat } from './AIFinancialChat';
import { SmartInsights } from '../personal/SmartInsights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTour } from '@/hooks/useTour';
import type { TabType } from '@/types/navigation';

const STARTERS = [
  'Onde estou errando?',
  'Meu próximo passo?',
  'Analise meu caixa',
];

interface AIAssistantViewProps {
  onBack?: (tab?: TabType) => void;
}

export const AIAssistantView = ({ onBack }: AIAssistantViewProps) => {
  const { user } = useAuth();
  const { getTutorContext } = useEducation(user || undefined);
  const { startTour } = useTour();
  const [expanded, setExpanded] = useState(false);
  const remindersCtx = useReminders();

  React.useEffect(() => { startTour('ai'); }, [startTour]);

  const isBusiness = user?.currentWorkspaceId && user.currentWorkspaceId !== 'personal';
  const scope = isBusiness ? 'business' : 'personal';
  const { transactions } = useTransactions(scope);
  const tutorContext = getTutorContext();

  return (
    <div className="py-2.5 h-full flex flex-col animate-[fsu_0.26s_ease]">

      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {onBack && (
          <button className="back-btn" onClick={() => onBack()}>
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="w-[38px] h-[38px] rounded-xl bg-[rgba(155,127,255,0.15)] flex items-center justify-center text-[var(--purple)] shrink-0">
          <Bot size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="eyebrow text-[var(--purple)]">Consultor Neural</div>
          <div className="page-title m-0 text-[20px] whitespace-nowrap overflow-hidden text-ellipsis">Inteligência Artificial</div>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="shrink-0 px-2.5 py-1.5 rounded-[10px] bg-[rgba(155,127,255,0.1)] border border-[rgba(155,127,255,0.2)] text-[var(--purple)] flex items-center gap-1 text-[11px] font-bold cursor-pointer hover:bg-[rgba(155,127,255,0.18)] transition-colors"
        >
          <Zap size={12} />
          Tutor
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Collapsible panel */}
      {expanded && (
        <div className="mb-3 rounded-[14px] border border-[rgba(155,127,255,0.15)] bg-[rgba(155,127,255,0.05)] px-3.5 py-3">
          <div className="grid gap-1.5 mb-2">
            <div className="text-[11px] text-[var(--green)] bg-[rgba(0,217,145,0.08)] rounded-[10px] px-2.5 py-1.5 border border-[rgba(0,217,145,0.15)]">
              {tutorContext.currentMoment?.title || 'Analisando sua situação'}
            </div>
            <div className="text-[11px] text-[var(--t2)] bg-black/20 rounded-[10px] px-2.5 py-1.5 border border-white/5">
              Fase: {tutorContext.journeyStage?.title || 'Fundação'}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STARTERS.map(s => (
              <div key={s} className="text-[10px] px-2.5 py-[5px] rounded-[20px] border border-[rgba(155,127,255,0.2)] bg-[rgba(155,127,255,0.08)] text-[var(--purple)] font-bold">
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="chat" className="flex flex-col flex-1 min-h-0">
        <TabsList className="tnav mb-3">
          <TabsTrigger value="chat" className="tnav-i flex-1 flex gap-2 items-center justify-center">
            <Bot size={14} /> Consultor
          </TabsTrigger>
          {!isBusiness && (
            <TabsTrigger value="insights" className="tnav-i flex-1 flex gap-2 items-center justify-center">
              <Sparkles size={14} /> Insights
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="chat" className="flex-1 relative m-0 data-[state=inactive]:hidden" style={{ minHeight: 0 }}>
          <div className="card absolute inset-0 p-2 flex flex-col overflow-hidden">
            <AIFinancialChat />
          </div>
        </TabsContent>

        {!isBusiness && (
          <TabsContent value="insights" className="flex-1 overflow-y-auto m-0 pb-5 data-[state=inactive]:hidden">
            <SmartInsights transactions={transactions} goals={[]} remindersCtx={remindersCtx} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
