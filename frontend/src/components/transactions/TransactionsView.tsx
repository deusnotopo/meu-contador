import { motion } from 'framer-motion';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/context/AuthContext';
import { TransactionList } from '../contador/TransactionList';
import { Card } from '../ui/card';
import { ListOrdered } from 'lucide-react';

export const TransactionsView = () => {
  const { user } = useAuth();
  
  // Use the active scope (business if workspaceId exists and is not personal, otherwise personal)
  const isBusiness = user?.currentWorkspaceId && user.currentWorkspaceId !== 'personal';
  const scope = isBusiness ? 'business' : 'personal';
  
  const { transactions, isLoading, deleteTransaction } = useTransactions(scope);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6 pt-6"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
          <ListOrdered size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Extrato Consolidado</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Visualizando transações {isBusiness ? 'da Empresa' : 'Pessoais'}
          </p>
        </div>
      </div>

      <Card className="glass-card border-none bg-slate-900/50 p-6 rounded-[2rem]">
        <TransactionList 
           transactions={transactions} 
           onDelete={deleteTransaction}
           onEdit={() => {}} 
        />
      </Card>
    </motion.div>
  );
};
