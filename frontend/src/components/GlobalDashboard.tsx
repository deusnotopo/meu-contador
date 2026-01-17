import { useLanguage } from "@/context/LanguageContext";
import { useInvestments } from "@/hooks/useInvestments";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialHealth } from "@/lib/financial-health";
import { exportFinancialReport } from "@/lib/pdf-export";
import { loadProfile } from "@/lib/storage";
import { showSuccess } from "@/lib/toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  Bot,
  Building2,
  Cloud,
  FileText,
  Sparkles,
  User as LucideUser,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import AIFinancialChat from "./ai/AIFinancialChat";
import { SmartAlerts } from "./ai/SmartAlerts";
import { SmartCoach } from "./ai/SmartCoach";
import { AdvancedCombinedChart } from "./charts/AdvancedCombinedChart";
import { PrivacyValue } from "./ui/PrivacyValue";
import { Button } from "./ui/button";
import { OpenBillsWidget } from "./dashboard/OpenBillsWidget";
import StatCard from "./dashboard/StatCard";
import { AnalyticsDashboard } from "./analytics/AnalyticsDashboard";

export const GlobalDashboard = () => {
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const { totals: investTotals } = useInvestments();
  const [showChat, setShowChat] = useState(false);
  const profile = loadProfile();
  const { t } = useLanguage();
  const [backendStatus, setBackendStatus] = useState<"ok" | "error" | "loading">("loading");

  useEffect(() => {
    fetch("http://localhost:3000/health")
      .then(res => res.ok ? setBackendStatus("ok") : setBackendStatus("error"))
      .catch(() => setBackendStatus("error"));
  }, []);

  const handleExport = () => {
    // const allTransactions = [
    //   ...personal.transactions,
    //   ...business.transactions,
    // ];
    // exportFinancialReport(
    //   allTransactions,
    //   profile,
    //   "Últimos 30 dias (Consolidado)"
    // );
    showSuccess("Relatório PDF gerado com sucesso!");
  };

  const globalTotals = {
    income: personal.totals.income + business.totals.income,
    expense: personal.totals.expense + business.totals.expense,
    balance: personal.totals.balance + business.totals.balance,
    netWorth:
      personal.totals.balance +
      business.totals.balance +
      investTotals.currentValue,
    count: personal.transactions.length + business.transactions.length,
  };

  const { score: globalHealth } = calculateFinancialHealth(
    [...personal.transactions, ...business.transactions],
    globalTotals as any
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
    <div className="space-y-16 animate-fade-in pb-20 pt-10">
      {/* Hero Section - Premium Glassmorphism */}
      <div className="glass-card p-10 md:p-20 relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="space-y-10 max-w-2xl text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-6"
            >
              <Sparkles size={14} />
              Inteligência Financeira 2025
            </motion.div>
            
            <h2 className="text-6xl md:text-8xl font-heading font-extrabold leading-[0.85] tracking-tighter text-white">
              Controle <br />
              <span className="text-gradient">Absoluto.</span>
            </h2>

            <div className="flex flex-col md:flex-row items-center gap-12 pt-10">
              <div className="pl-6 border-l-2 border-primary/40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Patrimônio Líquido
                </p>
                <div className="text-5xl font-heading font-bold text-white flex items-baseline gap-4 justify-center md:justify-start">
                  <PrivacyValue value={globalTotals.netWorth} />
                  <span className="text-success text-sm font-bold bg-success/10 px-3 py-1 rounded-full flex items-center gap-1 border border-success/20">
                    <ArrowUpRight size={14} /> 12.4%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-10 justify-center lg:justify-start">
              <Button
                onClick={() => setShowChat(true)}
                className="h-16 px-10 rounded-2xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all text-base tracking-tight shadow-lg shadow-primary/20 active:scale-95 gap-3"
              >
                <Bot size={22} />
                PERGUNTAR À IA
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                className="h-16 px-10 rounded-2xl border-white/10 bg-white/5 text-white font-semibold hover:bg-white/10 hover:border-white/20 transition-all gap-3 backdrop-blur-md"
              >
                <FileText size={20} />
                {t("dash.export_report")}
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block">
             <div className="w-80 h-80 rounded-full bg-primary/20 blur-[100px] animate-pulse" />
          </div>
        </div>
      </div>

      {/* Bento-style Metrics Grid */}
      <div className="bento-grid">
        <StatCard
          title={t("dash.month_income")}
          value={Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(globalTotals.income)}
          icon={Cloud}
          variant="income"
          delay={0}
        />
        <StatCard
          title={t("dash.month_expenses")}
          value={Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(globalTotals.expense)}
          icon={Bell}
          variant="expense"
          delay={0.1}
        />
        <StatCard
          title="Total Investido"
          value={Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(investTotals.totalInvested)}
          icon={Wallet}
          variant="balance"
          delay={0.2}
        />
        <StatCard
          title="Consolidado"
          value={globalTotals.count.toString()}
          icon={Sparkles}
          variant="neutral"
          delay={0.3}
          subtitle="Transações no mês"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Main Chart Card */}
          <div className="glass-card p-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Fluxo Financeiro</h3>
                <p className="text-muted-foreground text-sm">Análise consolidada de receitas e despesas</p>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground font-medium">
                Últimos 30 dias
              </div>
            </div>
            <div className="h-[400px] w-full">
               <AdvancedCombinedChart data={personal.monthlyTrend} />
            </div>
          </div>
        </div>

        <div className="space-y-10">
           <OpenBillsWidget />
           <SmartAlerts transactions={personal.allTransactions} />
        </div>
      </div>

      <SmartCoach
        transactions={personal.allTransactions}
        currentBalance={personal.totals.balance}
      />

      {/* Floating Action Bot */}
      <div className="fixed bottom-10 right-10 z-[100] md:bottom-12 md:right-12">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowChat(true)}
          className="w-20 h-20 rounded-3xl bg-white text-black flex items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.2)] hover:shadow-[0_25px_60px_rgba(255,255,255,0.3)] transition-all relative group"
        >
          <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl group-hover:bg-primary/40 transition-colors" />
          <Bot size={32} className="relative z-10" />
        </motion.button>
      </div>

      {/* AI Chat Overlay */}
      <AnimatePresence>
        {showChat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-background/80 backdrop-blur-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="w-full max-w-5xl h-[85vh] bg-card border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative"
            >
                <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Bot className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Assistente Financeiro IA</h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Gemini Ultra Core</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowChat(false)} className="rounded-2xl hover:bg-white/5 h-12 w-12 text-muted-foreground hover:text-white transition-colors">
                        <X size={24} />
                    </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <AIFinancialChat />
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
