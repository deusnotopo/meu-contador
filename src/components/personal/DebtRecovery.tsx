import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/formatters";
import { pushToCloud } from "@/lib/storage";
import { showSuccess } from "@/lib/toast";
import { Debt } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowRight,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PrivacyValue } from "../ui/PrivacyValue";

export const DebtRecovery = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [strategy, setStrategy] = useState<"snowball" | "avalanche">(
    "avalanche"
  );
  const [extraPayment, setExtraPayment] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [newDebt, setNewDebt] = useState<Omit<Debt, "id">>({
    name: "",
    balance: 0,
    interestRate: 0,
    minPayment: 0,
    category: "credit_card",
  });

  useEffect(() => {
    const loaded = localStorage.getItem("meu_contador_debts");
    if (loaded) setDebts(JSON.parse(loaded));
  }, []);

  const save = (updated: Debt[]) => {
    setDebts(updated);
    localStorage.setItem("meu_contador_debts", JSON.stringify(updated));
    pushToCloud("meu_contador_debts", updated);
  };

  const handleAdd = () => {
    const debt: Debt = { ...newDebt, id: Date.now().toString() };
    const updated = [...debts, debt];
    save(updated);
    setShowAdd(false);
    showSuccess("Dívida registrada.");
  };

  const handleDelete = (id: string) => {
    const updated = debts.filter((d) => d.id !== id);
    save(updated);
  };

  const sortedDebts = [...debts].sort((a, b) =>
    strategy === "avalanche"
      ? b.interestRate - a.interestRate
      : a.balance - b.balance
  );

  const totalBalance = debts.reduce((acc, d) => acc + d.balance, 0);
  const totalMinPayment = debts.reduce((acc, d) => acc + d.minPayment, 0);

  return (
    <div className="space-y-8 pb-10">
      <div className="premium-card p-8 bg-rose-500/5 border-rose-500/20">
        <div className="flex flex-col md:flex-row justify-between gap-8 items-start">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest text-rose-400">
              <AlertCircle size={12} />
              Modo de Sobrevivência
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">
              Recuperação de <span className="text-rose-400">Dívidas</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-sm font-medium">
              Priorize o pagamento das suas dívidas para economizar milhares de
              reais em juros bancários.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
            <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Total Devido
              </p>
              <p className="text-2xl font-black text-rose-400">
                <PrivacyValue value={totalBalance} />
              </p>
            </div>
            <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Pagamento Mínimo
              </p>
              <p className="text-2xl font-black text-white">
                <PrivacyValue value={totalMinPayment} />
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">
              Suas Pendências
            </h3>
            <Button
              onClick={() => setShowAdd(true)}
              className="bg-white text-black font-black rounded-xl h-10 px-4 text-[10px] uppercase"
            >
              <Plus size={14} className="mr-2" /> Adicionar Dívida
            </Button>
          </div>

          <AnimatePresence>
            {showAdd && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 rounded-3xl bg-white/[0.05] border border-white/10 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase">
                      Nome / Credor
                    </Label>
                    <Input
                      value={newDebt.name}
                      onChange={(e) =>
                        setNewDebt({ ...newDebt, name: e.target.value })
                      }
                      className="bg-white/5 h-12"
                      placeholder="Ex: Cartão Nubank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase">
                      Saldo Devedor
                    </Label>
                    <Input
                      type="number"
                      value={newDebt.balance}
                      onChange={(e) =>
                        setNewDebt({
                          ...newDebt,
                          balance: parseFloat(e.target.value),
                        })
                      }
                      className="bg-white/5 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase">
                      Juros Mensal (%)
                    </Label>
                    <Input
                      type="number"
                      value={newDebt.interestRate}
                      onChange={(e) =>
                        setNewDebt({
                          ...newDebt,
                          interestRate: parseFloat(e.target.value),
                        })
                      }
                      className="bg-white/5 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-500 uppercase">
                      Pagamento Mínimo
                    </Label>
                    <Input
                      type="number"
                      value={newDebt.minPayment}
                      onChange={(e) =>
                        setNewDebt({
                          ...newDebt,
                          minPayment: parseFloat(e.target.value),
                        })
                      }
                      className="bg-white/5 h-12"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setShowAdd(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAdd}
                    className="bg-indigo-600 hover:bg-indigo-500 font-bold"
                  >
                    Salvar Dívida
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {sortedDebts.map((debt, idx) => (
              <div
                key={debt.id}
                className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:bg-white/[0.06] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-rose-500 font-black text-sm border border-white/10">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{debt.name}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {debt.interestRate}% juros/mês • Min:{" "}
                      {formatCurrency(debt.minPayment)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-black text-white">
                      <PrivacyValue value={debt.balance} />
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                      Saldo Atual
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(debt.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-500"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="premium-card p-6 bg-indigo-500/5 border-indigo-500/20 space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-amber-400" /> Estratégia de
              Pagamento
            </h3>

            <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setStrategy("avalanche")}
                className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  strategy === "avalanche"
                    ? "bg-white text-black"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                Avalanche
              </button>
              <button
                onClick={() => setStrategy("snowball")}
                className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  strategy === "snowball"
                    ? "bg-white text-black"
                    : "text-slate-500 hover:text-white"
                }`}
              >
                Bola de Neve
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/20 text-[10px] font-medium text-slate-400 leading-relaxed border border-white/5">
                {strategy === "avalanche"
                  ? "Matematicamente superior: prioriza dívidas com maior taxa de juros para reduzir o custo total."
                  : "Psicologicamente superior: prioriza dívidas menores para dar sensação de progresso rápido."}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase">
                  Pagamento Extra (Bônus)
                </Label>
                <div className="relative">
                  <ArrowDownCircle
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400"
                    size={16}
                  />
                  <Input
                    type="number"
                    value={extraPayment}
                    onChange={(e) =>
                      setExtraPayment(parseFloat(e.target.value))
                    }
                    className="bg-white/5 h-12 pl-10"
                    placeholder="Ex: R$ 500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">
                  <span>Próxima Prioridade</span>
                </div>
                {sortedDebts.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                    <span className="font-black text-white">
                      {sortedDebts[0].name}
                    </span>
                    <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                      <span className="bg-emerald-500/20 px-2 py-0.5 rounded-lg">
                        + {formatCurrency(extraPayment)}
                      </span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500 text-xs italic">
                    Sem dívidas registradas
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="premium-card p-6 bg-amber-500/5 border-amber-500/20">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">
              Dica de Sobrevivência
            </h3>
            <p className="text-[10px] text-amber-200/60 leading-relaxed italic">
              No Brasil, os juros do rotativo do cartão podem chegar a 400% ao
              ano. Se a sua taxa mensal for maior que 8%, procure consolidar a
              dívida com um empréstimo pessoal (taxas menores).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
