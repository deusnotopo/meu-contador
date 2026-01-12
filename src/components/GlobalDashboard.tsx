import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { loadReminders } from "@/lib/storage";
import type { BillReminder } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Bot, Building2, Calendar, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";
import { AIFinancialChat } from "./ai/AIFinancialChat";
import { SmartAlerts } from "./ai/SmartAlerts";
import { SummaryCards } from "./contador/SummaryCards";
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Message for Seniors */}
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-6 rounded-3xl border border-primary/20">
        <h2 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
          Olá! Bom te ver por aqui. <Sparkles className="text-primary" />
        </h2>
        <p className="text-lg text-muted-foreground">
          Hoje é dia{" "}
          {new Date().toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
          })}
          . Aqui está um resumo de tudo o que está acontecendo nas suas
          finanças.
        </p>
      </div>

      {/* Symbiosis: Combined Totals */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 px-1">
          <Sparkles className="text-primary" size={20} />
          Minha Saúde Financeira Global
        </h3>
        <SummaryCards
          income={globalTotals.income}
          expense={globalTotals.expense}
          balance={globalTotals.balance}
          transactionCount={globalTotals.count}
          isGlobal={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Split View: Personal vs Business */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-card border-0 hover:shadow-elevated transition-shadow rounded-3xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="text-primary" size={20} />
                  Vida Pessoal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      Saldo Disponível
                    </p>
                    <p className="text-2xl font-black text-success">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(personal.totals.balance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      Gastos do Mês
                    </p>
                    <p className="text-lg font-bold text-danger">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(personal.totals.expense)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0 hover:shadow-elevated transition-shadow rounded-3xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="text-primary" size={20} />
                  Meu Negócio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      Lucro Acumulado
                    </p>
                    <p className="text-2xl font-black text-primary">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(business.totals.balance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-muted-foreground uppercase">
                      Impairment/Gastos
                    </p>
                    <p className="text-lg font-bold text-danger">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(business.totals.expense)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Combined AI Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FinancialHealthCard
              transactions={[
                ...personal.transactions,
                ...business.transactions,
              ]}
              totals={globalTotals as any}
            />
            <PredictionsCard transactions={personal.transactions} />
          </div>
        </div>

        {/* Action Center for Seniors */}
        <div className="space-y-6">
          <SmartAlerts transactions={personal.allTransactions} />

          <Card className="shadow-card border-0 bg-primary/5 rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="text-primary" size={20} />
                Lembretes Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextBills.length > 0 ? (
                <div className="space-y-4">
                  {nextBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-base">{bill.name}</span>
                        <span className="text-danger font-black text-base">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(bill.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={14} />
                        Vence em:{" "}
                        {new Date(bill.dueDate).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm italic">
                    Tudo em dia por aqui! ✨
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="p-6 bg-muted/50 rounded-3xl border border-dashed border-border flex flex-col items-center text-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Sparkles className="text-primary" size={32} />
            </div>
            <div>
              <h4 className="font-bold text-lg">Dica do seu Contador</h4>
              <p className="text-sm text-muted-foreground mt-1 px-4">
                "Tente separar pelo menos 10% do que entra para uma reserva de
                emergência. Seu futuro agradece!"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Chat Button */}
      <div className="fixed bottom-24 right-6 z-50 md:bottom-8">
        <Button
          onClick={() => setShowChat(true)}
          size="lg"
          className="rounded-full w-16 h-16 shadow-elevated gradient-primary border-0 p-0"
        >
          <Bot size={32} />
        </Button>
      </div>

      {/* AI Chat Modal Overlay */}
      <AnimatePresence>
        {showChat && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl"
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
