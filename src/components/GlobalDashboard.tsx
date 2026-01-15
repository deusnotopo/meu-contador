import { useLanguage } from "@/context/LanguageContext";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialHealth } from "@/lib/financial-health";
import { exportFinancialReport } from "@/lib/pdf-export";
import { loadProfile, loadReminders } from "@/lib/storage";
import { showSuccess } from "@/lib/toast";
import type { BillReminder } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Bot,
  Building2,
  Cloud,
  FileText,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AIFinancialChat } from "./ai/AIFinancialChat";
import { SmartAlerts } from "./ai/SmartAlerts";
import { AdvancedCombinedChart } from "./charts/AdvancedCombinedChart";
import { PrivacyValue } from "./ui/PrivacyValue";
import { Button } from "./ui/button";

export const GlobalDashboard = () => {
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const [nextBills, setNextBills] = useState<BillReminder[]>([]);
  const [showChat, setShowChat] = useState(false);
  const profile = loadProfile();
  const { t } = useLanguage();

  useEffect(() => {
    const reminders = loadReminders();
    const unpaid = reminders
      .filter((r) => !r.isPaid)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3);
    setNextBills(unpaid);
  }, []);

  const handleExport = () => {
    const allTransactions = [
      ...personal.transactions,
      ...business.transactions,
    ];
    exportFinancialReport(
      allTransactions,
      profile,
      "Últimos 30 dias (Consolidado)"
    );
    showSuccess("Relatório PDF gerado com sucesso!");
  };

  const globalTotals = {
    income: personal.totals.income + business.totals.income,
    expense: personal.totals.expense + business.totals.expense,
    balance: personal.totals.balance + business.totals.balance,
    count: personal.transactions.length + business.transactions.length,
  };

  const { score: globalHealth, dti } = calculateFinancialHealth(
    [...personal.transactions, ...business.transactions],
    globalTotals
  );

  const getHealthStatus = (s: number) => {
    if (s >= 80)
      return {
        label: "Excelente",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
      };
    if (s >= 60)
      return { label: "Bom", color: "text-indigo-400", bg: "bg-indigo-500/10" };
    if (s >= 40)
      return {
        label: "Regular",
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
      };
    if (s >= 20)
      return {
        label: "Alerta",
        color: "text-orange-400",
        bg: "bg-orange-500/10",
      };
    return { label: "Crítico", color: "text-rose-400", bg: "bg-rose-500/10" };
  };

  const status = getHealthStatus(globalHealth);

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* AI command Center Hero */}
      <div className="premium-card p-6 md:p-12">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/5 blur-[120px] rounded-full" />

        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                Data Intelligence • Real-time
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter">
              Controle <br />
              <span className="premium-gradient-text">Absoluto</span>
            </h2>
            <p className="text-base text-slate-400 font-medium max-w-lg leading-relaxed">
              Bem-vindo ao seu{" "}
              <span className="text-white">Ecossistema Financeiro</span>.
              {globalTotals.count > 0
                ? ` Sua inteligência artificial processou ${globalTotals.count} eventos nesta sessão.`
                : " Pronto para transformar seus dados em patrimônio."}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Button
                onClick={() => setShowChat(true)}
                className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-white text-black font-black hover:bg-white/90 shadow-xl shadow-white/5 transition-all text-sm tracking-tight"
              >
                <Bot className="mr-2" size={20} />
                PERGUNTAR À IA
              </Button>
              <Button
                onClick={handleExport}
                variant="ghost"
                className="w-full sm:w-auto h-14 px-8 rounded-2xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-all gap-2"
              >
                <FileText size={18} />
                {t("dash.export_report")}
              </Button>
            </div>
          </div>

          <div className="w-full lg:w-auto p-1 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-[2.5rem]">
            <div className="flex flex-col items-center justify-center p-10 bg-black rounded-[2.4rem] border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">
                Score Global
              </p>
              <div className="text-8xl font-black premium-gradient-text mb-2 tracking-tighter">
                {Math.round(globalHealth)}%
              </div>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex items-center gap-2 ${status.color} font-black text-xs uppercase tracking-widest ${status.bg} px-3 py-1 rounded-full`}
                >
                  <Sparkles size={12} /> {status.label}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Metrics Mesh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: t("dash.month_income"),
            value: globalTotals.income,
            color: "text-emerald-400",
            icon: Cloud,
          },
          {
            label: t("dash.month_expenses"),
            value: globalTotals.expense,
            color: "text-rose-400",
            icon: Bell,
          },
          {
            label: t("dash.balance"),
            value: globalTotals.balance,
            color: "text-white",
            icon: Sparkles,
          },
          {
            label: "Fluxo",
            value: globalTotals.count,
            isRaw: true,
            color: "text-indigo-400",
            icon: Bot,
          },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-6 group">
            <div className="flex items-start justify-between mb-4">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                {stat.label}
              </p>
              <stat.icon
                size={14}
                className="text-white/20 group-hover:text-white/40 transition-colors"
              />
            </div>
            <div className={`text-2xl font-black ${stat.color} tracking-tight`}>
              <PrivacyValue value={stat.value} isRaw={stat.isRaw} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          {/* Advanced Insights Chart */}
          <div className="premium-card p-8 group">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-white">Fluxo Mensal</h3>
                <p className="text-slate-500 text-sm font-medium">
                  Histórico consolidado
                </p>
              </div>
              <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                <FileText size={18} className="text-slate-400" />
              </div>
            </div>
            <div className="h-[300px] w-full">
              <AdvancedCombinedChart data={personal.monthlyTrend} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="premium-card p-8 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-white/5">
                <User size={24} />
              </div>
              <h4 className="text-lg font-black text-white mb-2">
                Vida Pessoal
              </h4>
              <div className="text-3xl font-black text-white tracking-tighter mb-4">
                <PrivacyValue value={personal.totals.balance} />
              </div>
              <Button
                variant="ghost"
                className="w-full justify-between bg-white/5 hover:bg-white/10 rounded-xl h-12 px-6 group/btn"
              >
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover/btn:text-white transition-colors">
                  Detalhes
                </span>
                <span className="text-indigo-400 group-hover/btn:translate-x-1 transition-transform">
                  →
                </span>
              </Button>
            </div>

            <div className="premium-card p-8 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6 border border-white/5">
                <Building2 size={24} />
              </div>
              <h4 className="text-lg font-black text-white mb-2">
                Empresarial
              </h4>
              <div className="text-3xl font-black text-amber-400 tracking-tighter mb-4">
                <PrivacyValue value={business.totals.balance} />
              </div>
              <Button
                variant="ghost"
                className="w-full justify-between bg-white/5 hover:bg-white/10 rounded-xl h-12 px-6 group/btn"
              >
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover/btn:text-white transition-colors">
                  Relatórios
                </span>
                <span className="text-amber-400 group-hover/btn:translate-x-1 transition-transform">
                  →
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <SmartAlerts transactions={personal.allTransactions} />

          <div className="premium-card flex flex-col h-full">
            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
              <h4 className="flex items-center gap-3 text-sm font-black text-white uppercase tracking-widest">
                <Bell className="text-indigo-400" size={16} />
                Alertas Próximos
              </h4>
            </div>
            <div className="p-6 space-y-4">
              {nextBills.length > 0 ? (
                nextBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-white/10 group"
                  >
                    <p className="font-bold text-white text-sm mb-1">
                      {bill.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        Vence em{" "}
                        {new Date(bill.dueDate).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm font-black text-rose-400">
                        <PrivacyValue value={bill.amount} />
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <Sparkles
                    className="mx-auto text-indigo-500/10 mb-2"
                    size={32}
                  />
                  <p className="text-slate-500 text-xs font-medium">
                    Agenda limpa
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action */}
      <div className="fixed bottom-8 right-8 z-[100]">
        <button
          onClick={() => setShowChat(true)}
          className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group"
        >
          <Bot size={28} />
        </button>
      </div>

      {/* AI Chat Modal Overlay - Refined Overlay */}
      <AnimatePresence>
        {showChat && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#02040a]/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-4xl h-[85vh] overflow-hidden rounded-[3rem] border border-white/10 shadow-2xl"
            >
              <AIFinancialChat
                transactions={personal.allTransactions}
                onClose={() => setShowChat(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
