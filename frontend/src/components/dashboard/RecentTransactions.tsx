import React from "react";
import { Plus, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TabType } from "@/types/navigation";

interface RecentTransactionsProps {
  transactions: {
    id: string;
    ico: string;
    ti: string;
    cat: string;
    am: number;
  }[];
  onNavigate?: (tab: TabType) => void;
  fmt: (n: number) => string;
  error?: boolean | string | null;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions, onNavigate, fmt, error }) => {
  if (!error && transactions.length === 0) return null;

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Últimas transações</div>
        <button
          className="text-[11px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
          onClick={() => onNavigate?.('personal')}
        >
          Ver Todas
        </button>
      </div>
      <div className="-mx-2">
        {error ? (
          <EmptyState 
            icon={AlertCircle}
            title="Conexão Falhou"
            description="Não foi possível carregar as transações no momento devido a uma falha de servidor."
          />
        ) : transactions.length > 0 ? (
          transactions.map(tx => {
            const isPlus = tx.am > 0;
            return (
              <div key={tx.id} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] px-2 rounded-xl transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[18px] border border-white/[0.05]" style={{ background: isPlus ? 'var(--green-d)' : 'var(--glass2)' }}>
                  {tx.ico}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-gray-100 truncate">{tx.ti}</div>
                  <div className="text-[11.5px] text-gray-500 truncate mt-0.5">{tx.cat}</div>
                </div>
                <div className={`text-[13.5px] font-semibold tabular-nums ${isPlus ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontFamily: 'var(--mono)' }}>
                  {isPlus ? '+' : '−'}&nbsp;{fmt(Math.abs(tx.am)).replace('R$\xa0', 'R$\xa0')}
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState 
            icon={Plus}
            title="Sem transações"
            description="Você ainda não lançou nenhuma movimentação este mês."
            actionLabel="Lançar agora"
            onAction={() => onNavigate?.('launch')}
          />
        )}
      </div>
    </>
  );
};
