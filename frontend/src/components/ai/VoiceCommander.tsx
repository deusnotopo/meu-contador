import { VoiceInput } from "@/components/ai/VoiceInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInvestments } from "@/hooks/useInvestments";
import { parseVoiceCommand, type ParsedCommand } from "@/lib/ai";
import { loadTransactions, saveTransactions } from "@/lib/storage";
import { showError, showSuccess } from "@/lib/toast";
import { Transaction } from "@/types";
import { useRole } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";

export const VoiceCommander = () => {
  const { isViewer } = useRole();
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedCommand | null>(null);

  const handleTranscript = async (text: string) => {
    if (!text) return;
    setIsProcessing(true);
    try {
      const result = await parseVoiceCommand(text);
      setParsedResult(result);
    } catch (error) {
      showError("Erro ao processar comando de voz.");
    } finally {
      setIsProcessing(false);
    }
  };

  const { addAsset } = useInvestments();

  const confirmAction = () => {
    if (!parsedResult || !parsedResult.data) return;
    if (isViewer) {
      showError("Acesso negado: você é apenas visualizador");
      setParsedResult(null);
      return;
    }

    if (parsedResult.type === "transaction" && parsedResult.data) {
      const t = parsedResult.data as any;
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: t.type || 'expense',
        amount: typeof t.amount === 'string' ? parseFloat(t.amount) : (t.amount || 0),
        description: t.description || 'Comando de voz',
        category: t.category || 'Outros',
        date: t.date || new Date().toISOString().split("T")[0],
        paymentMethod: t.paymentMethod || 'other',
        notes: "Via Comando de Voz",
        recurring: false,
        scope: "personal",
      };

      const current = loadTransactions();
      saveTransactions([...current, newTransaction]);
      showSuccess("Transação registrada!");
      window.dispatchEvent(new Event("storage-local"));
    } else if (parsedResult.type === "investment" && parsedResult.data) {
      const inv = parsedResult.data as any;
      addAsset({
        name: inv.ticker || "Ativo",
        ticker: inv.ticker || "ATIVO",
        type: inv.type || "stock",
        amount: typeof inv.amount === 'string' ? parseFloat(inv.amount) : (inv.amount || 0),
        averagePrice: typeof inv.price === 'string' ? parseFloat(inv.price) : (inv.price || 0),
        currentPrice: typeof inv.price === 'string' ? parseFloat(inv.price) : (inv.price || 0),
        sector: "Voz",
      });
      showSuccess(`Investimento em ${inv.ticker || "Ativo"} registrado!`);
    }

    setParsedResult(null);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-black/80 text-white px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md border border-white/10"
          >
            <Loader2 className="animate-spin text-indigo-400" size={16} />
            <span className="text-sm font-medium">A IA está pensando...</span>
          </motion.div>
        )}

        {parsedResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80"
          >
            <Card className="glass-premium border-indigo-500/50 shadow-2xl shadow-indigo-500/20">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <Sparkles size={18} />
                    {parsedResult.type === "transaction"
                      ? "Nova Transação"
                      : "Resultado"}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setParsedResult(null)}
                  >
                    <X size={14} />
                  </Button>
                </div>

                {parsedResult.type === "transaction" && parsedResult.data ? (
                  (() => {
                    const t = parsedResult.data as any;
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Descrição:</span>
                          <span className="font-medium text-white">
                            {t.description}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Valor:</span>
                          <span
                            className={`font-bold ${
                              t.type === "income"
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            R$ {t.amount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Categoria:</span>
                          <span className="text-white">
                            {t.category}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : parsedResult.type === "investment" && parsedResult.data ? (
                  (() => {
                    const inv = parsedResult.data as any;
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Ticker:</span>
                          <span className="font-bold text-indigo-400">
                            {inv.ticker}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Quantidade:</span>
                          <span className="text-white">
                            {inv.amount}
                          </span>
                        </div>
                        {inv.price && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Preço:</span>
                            <span className="text-emerald-400 font-bold">
                              R$ {inv.price?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-white text-sm">
                    {parsedResult.message || "Comando não compreendido."}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-slate-400"
                    onClick={() => setParsedResult(null)}
                  >
                    Cancelar
                  </Button>
                  {parsedResult.type !== "unknown" && (
                    <Button
                      size="sm"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                      onClick={confirmAction}
                    >
                      <Check size={16} className="mr-1" /> Confirmar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative group">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full group-hover:bg-indigo-500/40 transition-all duration-500" />
        <div className="relative bg-black/90 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-xl">
          <VoiceInput
            onTranscript={handleTranscript}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};
