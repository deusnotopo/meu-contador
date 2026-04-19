import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { FinancialFormatter } from "@/services/FinancialFormatter";

interface BudgetBalanceMetricsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export const BudgetBalanceMetrics = ({ totalIncome, totalExpense, balance }: BudgetBalanceMetricsProps) => {
  return (
    <>
      <div className="card-obsidian p-6 border-white/5 bg-gradient-to-t from-[#0B0F19] to-[#0A0D16] relative overflow-hidden flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div>
          <div className="text-[10px] text-emerald-400 uppercase tracking-[0.15em] font-black mb-1">Ganhos Mensais</div>
          <div className="text-2xl font-black text-emerald-50 font-mono tracking-tighter">{FinancialFormatter.formatCurrency(totalIncome)}</div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
          <ArrowUpRight size={24} />
        </div>
      </div>

      <div className="card-obsidian p-6 border-white/5 bg-gradient-to-t from-[#0B0F19] to-[#0A0D16] relative overflow-hidden flex items-center justify-between group">
         <div>
           <div className="text-[10px] text-rose-400 uppercase tracking-[0.15em] font-black mb-1">Gastos Mensais</div>
           <div className="text-2xl font-black text-rose-50 font-mono tracking-tighter">{FinancialFormatter.formatCurrency(totalExpense)}</div>
         </div>
         <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
           <ArrowDownRight size={24} />
         </div>
      </div>

      <div className={`card-obsidian p-6 border-white/5 relative overflow-hidden group ${balance >= 0 ? "bg-blue-500/5 border-blue-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
         <div className="relative z-10 flex items-center justify-between">
           <div>
             <div className={`text-[10px] uppercase tracking-[0.15em] font-black mb-1 ${balance >= 0 ? "text-blue-400" : "text-amber-400"}`}>{balance >= 0 ? "Saldo Livre" : "Déficit Mensal"}</div>
             <div className={`text-2xl font-black text-white font-mono tracking-tight`}>{FinancialFormatter.formatCurrency(Math.abs(balance))}</div>
           </div>
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${balance >= 0 ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>
             <Activity size={24} />
           </div>
         </div>
      </div>
    </>
  );
};
