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
      <div className="sec-hd">
        <span className="sec-title">Últimas transações</span>
        <span className="sec-link" onClick={() => onNavigate?.('personal')}>Ver todas</span>
      </div>
      <div className="card">
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
              <div key={tx.id} className="row">
                <div className="row-ico" style={{ background: isPlus ? 'var(--green-d)' : 'var(--glass2)' }}>
                  {tx.ico}
                </div>
                <div className="row-main">
                  <div className="row-title">{tx.ti}</div>
                  <div className="row-sub">{tx.cat}</div>
                </div>
                <div className={`row-amt ${isPlus ? 'amt-plus' : 'amt-minus'}`}>
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
