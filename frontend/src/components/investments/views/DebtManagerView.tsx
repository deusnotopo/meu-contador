import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDebts } from '@/hooks/useDebts';
import { ShieldAlert, Trash2, Plus, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { showError } from '@/lib/toast';
import { formatCurrency } from '@/lib/formatters';
import { DebtOptimizer } from './DebtOptimizer';

export const DebtManagerView = () => {
   const { debts, totals: debtTotals, deleteDebt, addDebt, isLoading: debtLoading } = useDebts();
   const [showAddDebt, setShowAddDebt] = useState(false);
   const [newDebt, setNewDebt] = useState({ 
     name: "", 
     balance: 0, 
     interestRate: 0, 
     minPayment: 0, 
     category: "credit_card",
     dueDate: undefined as string | undefined
   });

   return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
          <ShieldAlert className="text-rose-400" size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Gestão de Passivos</h3>
          <p className="text-[11px] text-neutral-500">Mapeamento e quitação estratégica das suas dívidas ativas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
            <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest mb-1 mt-0">Total Devendo</p>
            <p className="text-2xl font-mono text-rose-400 font-bold">{formatCurrency(debtTotals.totalBalance)}</p>
         </div>
         <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl flex justify-between items-center">
            <div>
               <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1 mt-0">Contratos</p>
               <p className="text-2xl font-mono text-white font-bold">{debts.length}</p>
            </div>
            <Button variant="ghost" onClick={() => setShowAddDebt(!showAddDebt)} className="text-xs text-rose-400 font-bold bg-rose-500/10 hover:bg-rose-500/20 transition-all rounded-full h-10 px-4">
               <Plus size={16} className="mr-1" /> Nova Dívida
            </Button>
         </div>
      </div>

      {showAddDebt && (
         <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-[#030712] border border-white/10 rounded-3xl space-y-4 shadow-2xl">
              <h4 className="text-xs font-black uppercase tracking-widest mb-4">Adicionar Linha de Crédito</h4>
              <input type="text" placeholder="Nome (ex: Cartão Nubank)" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-rose-500 transition-colors" value={newDebt.name} onChange={e => setNewDebt({ ...newDebt, name: e.target.value })} />
              <div className="flex gap-4">
                <input type="number" placeholder="Saldo (R$) *" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-rose-500 transition-colors" value={newDebt.balance || ""} onChange={e => setNewDebt({ ...newDebt, balance: parseFloat(e.target.value) || 0 })} />
                <input type="number" step="0.1" placeholder="Juros (% a.m.) *" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-rose-500 transition-colors" value={newDebt.interestRate || ""} onChange={e => setNewDebt({ ...newDebt, interestRate: parseFloat(e.target.value) || 0 })} />
              </div>
              <input type="number" placeholder="Pagamento mínimo (R$) *" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-rose-500 transition-colors" value={newDebt.minPayment || ""} onChange={e => setNewDebt({ ...newDebt, minPayment: parseFloat(e.target.value) || 0 })} />
              <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold" onClick={() => { 
                if (newDebt.name && newDebt.balance > 0 && newDebt.minPayment > 0) { 
                  const debtToSubmit = {
                    name: newDebt.name,
                    balance: newDebt.balance,
                    interestRate: newDebt.interestRate || 0,
                    minPayment: newDebt.minPayment,
                    category: newDebt.category as 'credit_card' | 'loan' | 'overdraft' | 'other',
                    dueDate: newDebt.dueDate
                  };
                  addDebt(debtToSubmit); 
                  setShowAddDebt(false); 
                  setNewDebt({ name: "", balance: 0, interestRate: 0, minPayment: 0, category: "credit_card", dueDate: undefined }); 
                } else {
                  showError("Preencha todos os campos obrigatórios com valores válidos.");
                }
              }}>
                Adicionar ao Passivo
              </Button>
         </motion.div>
      )}

      <div className="rounded-3xl border border-white/5 bg-[#030712] overflow-hidden">
            {debtLoading ? (
              <div className="p-8 space-y-4">
                 <div className="h-16 bg-white/5 animate-pulse rounded-2xl"></div>
                 <div className="h-16 bg-white/5 animate-pulse rounded-2xl"></div>
              </div>
            ) : debts.length === 0 ? (
              <div className="p-12">
                 <EmptyState icon={CreditCard} title="Balanço Positivo" description="Parabéns! Você não possui dívidas cadastradas consumindo o seu patrimônio." actionLabel="Adicionar" onAction={() => setShowAddDebt(true)} />
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {debts.map((d, i) => (
                  <div key={d.id || i} className="p-4 flex items-center hover:bg-white/[0.02] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mr-4">
                       💳
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white mb-1">{d.name}</div>
                      <div className="flex gap-2">
                        <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">{d.interestRate}% a.m.</span>
                        <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Ativa</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-rose-300 mb-1">{formatCurrency(d.balance)}</div>
                      <Button variant="ghost" size="icon" onClick={() => deleteDebt(d.id)} className="h-6 w-6 text-neutral-500 hover:text-white mt-1">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
            )}
      </div>

      {/* Phase 29: Debt Optimizer */}
      <DebtOptimizer />

    </div>
   );
};

