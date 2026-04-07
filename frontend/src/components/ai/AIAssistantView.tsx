import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEducation } from '@/hooks/useEducation';
import { useTransactions } from '@/hooks/useTransactions';
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

  React.useEffect(() => {
    startTour('ai');
  }, [startTour]);

  const isBusiness = user?.currentWorkspaceId && user.currentWorkspaceId !== 'personal';
  const scope = isBusiness ? 'business' : 'personal';
  const { transactions } = useTransactions(scope);
  const tutorContext = getTutorContext();

  return (
    <div style={{ padding: "10px 0", height: "100%", display: "flex", flexDirection: "column", animation: "fsu 0.26s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        {onBack && (
          <button className="back-btn" onClick={() => onBack()}>
            <ArrowLeft size={16} />
          </button>
        )}
        <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(155,127,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)", flexShrink: 0 }}>
          <Bot size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow" style={{ color: "var(--purple)" }}>Consultor Neural</div>
          <div className="page-title" style={{ margin: 0, fontSize: 20, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Inteligência Artificial</div>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 10, background: "rgba(155,127,255,0.1)", border: "1px solid rgba(155,127,255,0.2)", color: "var(--purple)", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
        >
          <Zap size={12} />
          Tutor
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Collapsible info panel */}
      {expanded && (
        <div style={{ marginBottom: 12, borderRadius: 14, border: "1px solid rgba(155,127,255,0.15)", background: "rgba(155,127,255,0.05)", padding: "12px 14px" }}>
          <div style={{ display: "grid", gap: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "var(--green)", background: "rgba(0,217,145,0.08)", borderRadius: 10, padding: "6px 10px", border: "1px solid rgba(0,217,145,0.15)" }}>
              {tutorContext.currentMoment?.title || 'Analisando sua situação'}
            </div>
            <div style={{ fontSize: 11, color: "var(--t2)", background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "6px 10px", border: "1px solid rgba(255,255,255,0.05)" }}>
              Fase: {tutorContext.journeyStage?.title || 'Fundação'}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {STARTERS.map(s => (
              <div key={s} style={{ fontSize: 10, padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(155,127,255,0.2)", background: "rgba(155,127,255,0.08)", color: "var(--purple)", fontWeight: 700 }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat tabs */}
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
          <div className="card" style={{ position: "absolute", inset: 0, padding: "8px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <AIFinancialChat />
          </div>
        </TabsContent>

        {!isBusiness && (
          <TabsContent value="insights" className="flex-1 overflow-y-auto m-0 pb-5 data-[state=inactive]:hidden">
            <SmartInsights transactions={transactions} goals={[]} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
