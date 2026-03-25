import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { Bot, Sparkles } from 'lucide-react';
import { AIFinancialChat } from './AIFinancialChat';
import { SmartInsights } from '../personal/SmartInsights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import type { TabType } from '@/types/navigation';

interface AIAssistantViewProps {
  onBack?: (tab: TabType) => void;
}

export const AIAssistantView = (_props: AIAssistantViewProps) => {
  const { user } = useAuth();
  
  const isBusiness = user?.currentWorkspaceId && user.currentWorkspaceId !== 'personal';
  const scope = isBusiness ? 'business' : 'personal';
  
  const { transactions } = useTransactions(scope);

  return (
    <div style={{ padding: "10px 0", height: "100%", display: "flex", flexDirection: "column", animation: "fsu 0.26s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
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
          <div className="card" style={{ position: "absolute", inset: 0, padding: 8, display: "flex", flexDirection: "column" }}>
             <AIFinancialChat transactions={transactions} />
          </div>
        </TabsContent>
        
        {!isBusiness && (
          <TabsContent value="insights" style={{ flex: 1, overflowY: "auto", marginTop: 0, paddingBottom: 20 }}>
            <SmartInsights transactions={transactions} goals={[]} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
