import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Card } from '../ui/card';
import { Target, BarChart3, TrendingUp } from 'lucide-react';
import { GoalsSection } from '../personal/GoalsSection';
import { BudgetsSection } from '../personal/BudgetsSection';
import { InvestmentsDashboard } from '../investments/InvestmentsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useTransactions } from '@/hooks/useTransactions';

export const PlanningView = () => {
  const { user } = useAuth();
  const isBusiness = user?.currentWorkspaceId && user.currentWorkspaceId !== 'personal';
  const scope = isBusiness ? 'business' : 'personal';
  const { transactions } = useTransactions(scope);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pt-6"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
          <Target size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Planejamento Estratégico</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Metas, Orçamentos e Construção de Patrimônio ({isBusiness ? 'Empresa' : 'Pessoal'})
          </p>
        </div>
      </div>

      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="bg-slate-900/50 p-1 rounded-2xl border border-white/5 mb-8">
          <TabsTrigger value="goals" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
            <Target size={16} className="mr-2" /> Metas
          </TabsTrigger>
          <TabsTrigger value="budgets" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
            <BarChart3 size={16} className="mr-2" /> Orçamentos
          </TabsTrigger>
          {!isBusiness && (
            <TabsTrigger value="investments" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
              <TrendingUp size={16} className="mr-2" /> Investimentos
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="goals" className="mt-0">
          <GoalsSection />
        </TabsContent>
        
        <TabsContent value="budgets" className="mt-0">
          <BudgetsSection />
        </TabsContent>
        
        {!isBusiness && (
          <TabsContent value="investments" className="mt-0">
            <InvestmentsDashboard />
          </TabsContent>
        )}
      </Tabs>
      
    </motion.div>
  );
};
