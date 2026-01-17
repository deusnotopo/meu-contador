import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MockBankProvider } from "@/lib/open-finance";
import { showSuccess, showError } from "@/lib/toast";
import { Building2, ShieldCheck, Loader2, Link2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BankConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactions: any[]) => void;
}

export const BankConnectionModal = ({ isOpen, onClose, onSuccess }: BankConnectionModalProps) => {
  const [step, setStep] = useState<"select" | "auth" | "sync">("select");
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const institutions = MockBankProvider.getInstitutions();

  const handleBankSelect = (bank: any) => {
    setSelectedBank(bank);
    setStep("auth");
  };

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      // Simulate auth process
      await new Promise(r => setTimeout(r, 1500));
      setStep("sync");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const accounts = await MockBankProvider.getAccounts(selectedBank.id);
      if (accounts.length > 0) {
        const transactions = await MockBankProvider.syncTransactions(accounts[0].id);
        onSuccess(transactions);
        showSuccess(`Conectado ao ${selectedBank.name} com sucesso!`);
        onClose();
      }
    } catch (error) {
      showError("Erro ao sincronizar dados bancários.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#020617] border-white/5 rounded-[2.5rem] p-0 overflow-hidden">
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <DialogHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <Link2 size={24} />
                     </div>
                     <DialogTitle className="text-2xl font-black text-white uppercase tracking-tighter">
                       Conectar <span className="text-indigo-400">Banco</span>
                     </DialogTitle>
                  </div>
                  <p className="text-sm text-slate-400 font-medium">
                    Selecione sua instituição para importar transações automaticamente via Open Finance.
                  </p>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4">
                  {institutions.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => handleBankSelect(bank)}
                      className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all flex flex-col items-center gap-4 group"
                    >
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: bank.color }}
                      >
                        <Building2 size={24} />
                      </div>
                      <span className="text-xs font-black text-white uppercase tracking-widest">
                        {bank.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === "auth" && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-8 py-4 text-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <div 
                    className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-2xl"
                    style={{ backgroundColor: selectedBank.color }}
                  >
                    <Building2 size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                      Autenticação Segura
                    </h3>
                    <p className="text-sm text-slate-400 mt-2">
                      Você será redirecionado para o ambiente seguro do **{selectedBank.name}**.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3 text-left">
                  <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-[10px] text-emerald-100/70 leading-relaxed font-bold uppercase tracking-wider">
                    Conexão criptografada de ponta a ponta. Seus dados de acesso nunca são armazenados por nós.
                  </p>
                </div>

                <Button
                  onClick={handleAuth}
                  disabled={isLoading}
                  className="w-full h-14 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-white/90 shadow-xl"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : "Continuar para o Banco"}
                  {!isLoading && <ArrowRight size={18} className="ml-2" />}
                </Button>
              </motion.div>
            )}

            {step === "sync" && (
              <motion.div
                key="sync"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 py-10 text-center"
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="text-indigo-400" size={32} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    Sincronizando Dados
                  </h3>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest animate-pulse">
                    Importando transações recentes...
                  </p>
                </div>

                <Button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="w-full h-14 bg-indigo-500 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 shadow-xl shadow-indigo-500/20"
                >
                  {isLoading ? "Processando..." : "Confirmar Importação"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
