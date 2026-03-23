import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTransactions } from '@/hooks/useTransactions';
import { Card } from '../ui/card';
import { Bot, Sparkles } from 'lucide-react';
import { AIFinancialChat } from './AIFinancialChat';
import { SmartInsights } from '../personal/SmartInsights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

export const AIAssistantView = () => {
  const { user } = useAuth();
  
  const isBusiness = user?.currentWorkspaceId && user.currentWorkspaceId !== 'personal';
  const scope = isBusiness ? 'business' : 'personal';
  
  const { transactions } = useTransactions(scope);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pt-6 h-[85vh] flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400">
          <Bot size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Inteligência Artificial</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Seu conselheiro financeiro neural 24/7
          </p>
        </div>
      </div>

      <Tabs defaultValue="chat" className="w-full h-full flex flex-col">
        <TabsList className="bg-slate-900/50 p-1 rounded-2xl border border-white/5 mb-6 shrink-0 inline-flex self-start">
          <TabsTrigger value="chat" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all">
            <Bot size={16} className="mr-2" /> Consultor Neural
          </TabsTrigger>
          {!isBusiness && (
            <TabsTrigger value="insights" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all">
              <Sparkles size={16} className="mr-2" /> Análise Comportamental
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="chat" className="mt-0 flex-1 overflow-hidden relative">
          <Card className="glass-card border-none bg-slate-900/50 p-2 sm:p-6 rounded-[2rem] w-full h-full flex flex-col absolute inset-0">
            <div className="flex-1 overflow-hidden">
               <AIFinancialChat transactions={transactions} />
            </div>
          </Card>
        </TabsContent>
        
        {!isBusiness && (
          <TabsContent value="insights" className="mt-0 flex-1 overflow-y-auto pb-20 scrollbar-hide">
            <SmartInsights transactions={transactions} goals={[]} />
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
};
