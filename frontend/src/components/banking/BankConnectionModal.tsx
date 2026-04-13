import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Transaction } from "@/types";
import { api } from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";
import { Link2, FileUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OFXImportModal } from "./OFXImportModal";
import { PluggyConnect } from "react-pluggy-connect";

interface OpenFinanceTokenResponse {
  accessToken: string;
}

interface PluggyItemSuccess {
  item: {
    id: string;
  };
}

interface PluggyErrorLike {
  message?: string;
}

interface BankConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactions: Transaction[]) => void;
}

export const BankConnectionModal = ({ isOpen, onClose, onSuccess }: BankConnectionModalProps) => {
  const [mode, setMode] = useState<"select" | "pluggy" | "ofx">("select");
  const [connectToken, setConnectToken] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode("select");
      // Solicita o Token oficial da Pluggy logo no início para aquecimento
      api.get<OpenFinanceTokenResponse>("/open-finance/token")
        .then((res) => setConnectToken(res.accessToken))
        .catch((err) => {
          console.error("Open Finance Token Error:", err);
          showError("Falhas na malha bancária segura. Tente mais tarde.");
        });
    } else {
      setConnectToken(null);
    }
  }, [isOpen]);

  const handlePluggySuccess = async (itemData: PluggyItemSuccess) => {
    showSuccess("Banco Conectado! Baixando seu histórico...");
    try {
      await api.post(`/open-finance/sync/${itemData.item.id}`, {});
      showSuccess("Sincronização concluída com sucesso!");
      onSuccess([]); // Força reload de transactions na tela principal
      onClose();
    } catch (_err) {
      showError("Sem transações recentes ou erro ao sincronizar.");
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen && mode === "select"} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-[#020617] border-white/5 rounded-[2.5rem] p-0 overflow-hidden">
          <div className="p-8">
            <AnimatePresence mode="wait">
              {mode === "select" && (
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
                         Sincronizar <span className="text-indigo-400">Dados</span>
                       </DialogTitle>
                    </div>
                    <p className="text-sm text-neutral-500 font-medium leading-relaxed">
                      Sincronize com máxima segurança. Suas credenciais bancárias são encriptadas (TLS 256) e nunca armazenadas.
                    </p>
                  </DialogHeader>

                  <div className="flex flex-col gap-3">
                     <button 
                        onClick={() => {
                          if (!connectToken) {
                            showError("Gerando Token SEED 256-bit, aguarde 2 segundos...");
                            return;
                          }
                          setMode("pluggy");
                        }} 
                        className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/30 transition-all flex flex-col items-center gap-3 group"
                     >
                        <span className="text-[15px] font-black text-white uppercase tracking-widest text-center leading-tight">
                           Conexão Automática
                           <br />(Open Finance)
                        </span>
                        <span className="text-xs text-indigo-300/80 font-medium text-center">Integração oficial Pluggy (Nubank, Itaú, BB).</span>
                     </button>

                     <button 
                        onClick={() => setMode("ofx")} 
                        className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 shadow-lg transition-all flex flex-col items-center gap-2 mt-2 group"
                     >
                        <span className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 group-hover:text-indigo-200 transition-colors">
                           <FileUp size={16} className="text-indigo-400" />
                           Arquivo Manual (.OFX)
                        </span>
                     </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Widget Externo da API do Open Finance */}
      {mode === "pluggy" && connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          onSuccess={handlePluggySuccess}
          onError={(error: PluggyErrorLike) => {
             console.error("Pluggy Connect Error:", error);
             showError("Autorização bancária cancelada ou negada.");
             setMode("select");
          }}
        />
      )}

      {/* Rota Manual Segura de OFX via Web */}
      <OFXImportModal
        isOpen={mode === "ofx"}
        onClose={() => setMode("select")}
        onSuccess={() => {
          setMode("select");
          onSuccess([]);
          onClose(); // Auto-fecha a UI
        }}
      />
    </>
  );
};
