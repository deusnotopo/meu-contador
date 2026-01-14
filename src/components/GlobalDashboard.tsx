import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialHealth } from "@/lib/financial-health";
import { loadReminders } from "@/lib/storage";
import type { BillReminder } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Bot, Building2, Cloud, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";
import { AIFinancialChat } from "./ai/AIFinancialChat";
import { SmartAlerts } from "./ai/SmartAlerts";
import { FinancialHealthCard } from "./personal/FinancialHealthCard";
import { PredictionsCard } from "./personal/PredictionsCard";
import { Button } from "./ui/button";

export const GlobalDashboard = () => {
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const [nextBills, setNextBills] = useState<BillReminder[]>([]);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const reminders = loadReminders();
    const unpaid = reminders
      .filter((r) => !r.isPaid)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3);
    setNextBills(unpaid);
  }, []);

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

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* AI command Center Hero */}
      <div className="relative overflow-hidden p-10 rounded-[3rem] glass-premium group border border-white/20">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 blur-[120px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full group-hover:scale-125 transition-transform duration-1000" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-2">
              <Sparkles className="text-indigo-400" size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                Sincronização Ativa • 1ms
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tighter">
              Controle{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-glow">
                Absoluto
              </span>
            </h2>
            <p className="text-lg text-slate-400 font-medium max-w-xl">
              Bem-vindo ao seu{" "}
              <span className="text-white">Centro de Comando Financeiro</span>.
              Sua inteligência artificial processou {globalTotals.count} eventos
              hoje.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Button
                onClick={() => setShowChat(true)}
                className="rounded-2xl px-8 py-6 bg-white text-black font-black hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all"
              >
                CONSULTAR IA
              </Button>
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-[#02040a] bg-slate-800 flex items-center justify-center overflow-hidden"
                  >
                    <img
                      src={`https://i.pravatar.cc/100?img=${i + 10}`}
                      alt="avatar"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col items-center justify-center p-8 bg-black/40 rounded-[2.5rem] border border-white/5 ai-pulse-core backdrop-blur-md">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">
                Saúde Consolidada
              </p>
              <div className="text-7xl font-black text-white text-glow mb-2">
                {Math.round(globalHealth)}%
              </div>
              <div className="text-emerald-400 font-black text-xs flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-1">
                  <Sparkles size={12} /> PERFORMANCE PRO
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  DTI (Dívida/Renda): {dti.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Metrics Mesh */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Receita Total",
            value: globalTotals.income,
            color: "text-emerald-400",
            glow: "text-glow-emerald",
          },
          {
            label: "Despesas",
            value: globalTotals.expense,
            color: "text-rose-400",
            glow: "text-glow-rose",
          },
          {
            label: "Balanço",
            value: globalTotals.balance,
            color: "text-indigo-400",
            glow: "text-glow",
          },
          {
            label: "Transações",
            value: globalTotals.count,
            isRaw: true,
            color: "text-amber-400",
            glow: "text-glow-amber",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="glass border-white/5 rounded-[2rem] p-6 hover:-translate-y-2 transition-transform duration-500"
          >
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
              {stat.label}
            </p>
            <div
              className={`text-3xl font-black ${stat.color} ${stat.glow} tracking-tighter`}
            >
              {stat.isRaw
                ? stat.value
                : new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(stat.value)}
            </div>
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full bg-current ${stat.color} w-2/3 opacity-50`}
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Twin Pillars: Personal & Business */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="glass-premium border-none rounded-[2.5rem] overflow-hidden group">
              <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-transparent">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-indigo-500/20 rounded-2xl text-indigo-400">
                    <User size={24} />
                  </div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full">
                    ATIVO
                  </span>
                </div>
                <h4 className="text-2xl font-black text-white mb-1">
                  Vida Pessoal
                </h4>
                <p className="text-slate-500 text-sm mb-6">
                  Controle preciso dos fluxos individuais.
                </p>
                <div className="text-4xl font-black text-white tracking-tighter mb-2">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(personal.totals.balance)}
                </div>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black">
                  <Sparkles size={12} /> +12.5% este mês
                </div>
              </div>
            </Card>

            <Card className="glass-premium border-none rounded-[2.5rem] overflow-hidden group">
              <div className="p-8 bg-gradient-to-br from-amber-500/10 to-transparent">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-amber-500/20 rounded-2xl text-amber-400">
                    <Building2 size={24} />
                  </div>
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full">
                    BUSINESS PRO
                  </span>
                </div>
                <h4 className="text-2xl font-black text-white mb-1">
                  Meu Negócio
                </h4>
                <p className="text-slate-500 text-sm mb-6">
                  Monitoramento de ROI e Fluxo de Caixa.
                </p>
                <div className="text-4xl font-black text-amber-400 tracking-tighter mb-2 text-glow-amber">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(business.totals.balance)}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-black">
                  <Cloud size={12} /> Backup Seguro
                </div>
              </div>
            </Card>
          </div>

          {/* High-Tech Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FinancialHealthCard
              transactions={[
                ...personal.transactions,
                ...business.transactions,
              ]}
              totals={{
                income: globalTotals.income,
                expense: globalTotals.expense,
                balance: globalTotals.balance,
              }}
            />
            <PredictionsCard transactions={personal.transactions} />
          </div>
        </div>

        {/* Sidebar: Smart Intelligence */}
        <div className="space-y-8">
          <SmartAlerts transactions={personal.allTransactions} />

          <Card className="glass border-white/5 rounded-[2.5rem] overflow-hidden beam-border">
            <CardHeader className="bg-white/5">
              <CardTitle className="flex items-center gap-3 text-lg font-black text-white">
                <Bell className="text-indigo-400" size={20} />
                Fila de Processamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {nextBills.length > 0 ? (
                <div className="space-y-4">
                  {nextBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-5 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <p className="font-black text-white">{bill.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          Vence em{" "}
                          {new Date(bill.dueDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-lg font-black text-rose-400 text-glow-rose">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(bill.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Sparkles
                    className="mx-auto text-indigo-400/20 mb-4"
                    size={48}
                  />
                  <p className="text-slate-500 italic text-sm font-medium">
                    Sistema limpo. Sem pendências.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="p-8 glass-premium rounded-[2.5rem] text-center space-y-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
            <div className="p-5 bg-indigo-500/20 rounded-full inline-flex relative z-10">
              <Bot className="text-indigo-400" size={32} />
            </div>
            <div className="relative z-10">
              <h4 className="font-black text-white text-lg">AI Insight</h4>
              <p className="text-sm text-slate-400 mt-2 font-medium italic">
                "Você economizou 15% a mais do que no mês passado. Sua
                eficiência está acima da média da rede PRO."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Floating Chat Toggle */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => setShowChat(true)}
          className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.5)] hover:scale-110 active:scale-95 transition-all group overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <Bot size={36} className="relative z-10" />
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