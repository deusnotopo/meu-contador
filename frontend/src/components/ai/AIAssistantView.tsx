import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { Bot, Sparkles, ArrowLeft } from 'lucide-react';
import { AIFinancialChat } from './AIFinancialChat';
import { SmartInsights } from '../personal/SmartInsights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { UpgradeModal } from '../ui/UpgradeModal';
import { Zap, Lock } from 'lucide-react';
import type { TabType } from '@/types/navigation';

interface AIAssistantViewProps {
  onBack?: (tab?: TabType) => void;
}

export const AIAssistantView = ({ onBack }: AIAssistantViewProps) => {
  const { user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  const isAiEnabled = isEnabled('ai_advisor');
  
  const isBusiness = user?.currentWorkspaceId && user.currentWorkspaceId !== 'personal';
  const scope = isBusiness ? 'business' : 'personal';
  
  const { transactions } = useTransactions(scope);

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

      <Tabs defaultValue="chat" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <TabsList className="tnav" style={{ marginBottom: 16 }}>
          <TabsTrigger value="chat" className="tnav-i" style={{ flex: 1, display: "flex", gap: 6, alignItems: "center" }}>
            <Bot size={14} /> Consultor
          </TabsTrigger>
          {!isBusiness && (
            <TabsTrigger value="insights" className="tnav-i" style={{ flex: 1, display: "flex", gap: 6, alignItems: "center" }}>
              <Sparkles size={14} /> Insights
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="chat" style={{ flex: 1, position: "relative", marginTop: 0 }}>
          <div className="card" style={{ position: "absolute", inset: 0, padding: 8, display: "flex", flexDirection: "column", overflow: "hidden" }}>
             {!isAiEnabled && (
               <div className="glass-panel" style={{ 
                 position: "absolute", 
                 inset: 0, 
                 zIndex: 50, 
                 display: "flex", 
                 flexDirection: "column", 
                 alignItems: "center", 
                 justifyContent: "center", 
                 textAlign: "center",
                 padding: "40px",
                 background: "rgba(2, 4, 10, 0.7)",
                 backdropFilter: "blur(8px)"
               }}>
                 <div style={{ width: 64, height: 64, borderRadius: "20px", background: "rgba(255,191,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--amber)", marginBottom: "20px" }}>
                   <Lock size={32} />
                 </div>
                 <h3 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "12px", color: "white" }}>Acesso Restrito</h3>
                 <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "32px", lineHeight: 1.6 }}>
                   O Consultor Neural exige o licenciamento **PRO**. Desbloqueie auditorias em tempo real e projeções preditivas.
                 </p>
                 <button 
                   className="btn-p" 
                   onClick={() => setShowUpgrade(true)}
                   style={{ width: "100%", maxWidth: "240px", height: "52px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                 >
                   <Zap size={18} fill="currentColor" />
                   Fazer Upgrade
                 </button>
               </div>
             )}
             <AIFinancialChat transactions={transactions} />
          </div>
        </TabsContent>
        
        {!isBusiness && (
          <TabsContent value="insights" style={{ flex: 1, overflowY: "auto", marginTop: 0, paddingBottom: 20 }}>
            <SmartInsights transactions={transactions} goals={[]} />
          </TabsContent>
        )}
      </Tabs>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};
