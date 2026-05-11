import { VoiceInput } from "@/components/ai/VoiceInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInvestments } from "@/hooks/useInvestments";
import { useTransactions } from "@/hooks/useTransactions";
import { parseVoiceCommand, type ParsedCommand } from "@/lib/ai";
import { showError, showSuccess } from "@/lib/toast";
import { Transaction } from "@/types";
import { useRole } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";

interface VoiceTransactionData {
  type?: Transaction["type"];
  amount?: number | string;
  description?: string;
  category?: string;
  date?: string;
  paymentMethod?: string;
}

interface VoiceInvestmentData {
  ticker?: string;
  type?: string;
  amount?: number | string;
  price?: number | string;
}

interface VoiceCommanderProps {
  onClose?: () => void;
}

export const VoiceCommander = ({ onClose }: VoiceCommanderProps = {}) => {
  const { isViewer } = useRole();
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedCommand | null>(null);

  const handleTranscript = async (text: string) => {
    if (!text) return;
    setIsProcessing(true);
    try {
      const result = await parseVoiceCommand(text);
      setParsedResult(result);
    } catch (_error) {
      showError("Erro ao processar comando de voz.");
    } finally {
      setIsProcessing(false);
    }
  };

  const { addAsset } = useInvestments();
  const { addTransaction } = useTransactions();

  const confirmAction = async () => {
    if (!parsedResult || !parsedResult.data) return;
    if (isViewer) {
      showError("Acesso negado: você é apenas visualizador");
      setParsedResult(null);
      return;
    }

    if (parsedResult.type === "transaction" && parsedResult.data) {
      const t = parsedResult.data as VoiceTransactionData;
      
      const txData = {
        type: t.type || "expense",
        amount: typeof t.amount === "string" ? t.amount : String(t.amount || 0),
        description: t.description || "Comando de voz",
        category: t.category || "Outros",
        date: t.date || (new Date().toISOString().split("T")[0] ?? new Date().toISOString()),
        paymentMethod: t.paymentMethod || "other",
        notes: "Via Comando de Voz",
        scope: "personal" as const,
      };

      try {
        await addTransaction(txData as any);
        showSuccess("Transação enviada para análise!");
      } catch (err) {
        showError("Falha de rede. A transação não pôde ser salva.");
      }
    } else if (parsedResult.type === "investment" && parsedResult.data) {
      const inv = parsedResult.data as VoiceInvestmentData;
      addAsset({
        name: inv.ticker || "Ativo",
        ticker: inv.ticker || "ATIVO",
        type: (inv.type || "stock") as
          | "stock"
          | "fii"
          | "crypto"
          | "fixed_income"
          | "etf",
        amount:
          typeof inv.amount === "string"
            ? parseFloat(inv.amount)
            : inv.amount || 0,
        averagePrice:
          typeof inv.price === "string"
            ? parseFloat(inv.price)
            : inv.price || 0,
        currentPrice:
          typeof inv.price === "string"
            ? parseFloat(inv.price)
            : inv.price || 0,
        sector: "Voz",
        currency: "BRL",
      });
      showSuccess(`Investimento em ${inv.ticker || "Ativo"} registrado!`);
    }

    setParsedResult(null);
    onClose?.();
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
                    const t = parsedResult.data as VoiceTransactionData;
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Descrição:</span>
                          <span className="font-medium text-white">
                            {t.description}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Valor:</span>
                          <span
                            className={`font-bold ${
                              t.type === "income"
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            R${" "}
                            {(typeof t.amount === "number"
                              ? t.amount
                              : parseFloat(String(t.amount || 0))
                            ).toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Categoria:</span>
                          <span className="text-white">{t.category}</span>
                        </div>
                      </div>
                    );
                  })()
                ) : parsedResult.type === "investment" && parsedResult.data ? (
                  (() => {
                    const inv = parsedResult.data as VoiceInvestmentData;
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Ticker:</span>
                          <span className="font-bold text-indigo-400">
                            {inv.ticker}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Quantidade:</span>
                          <span className="text-white">{inv.amount}</span>
                        </div>
                        {inv.price && (
                          <div className="flex justify-between">
                            <span className="text-neutral-500">Preço:</span>
                            <span className="text-emerald-400 font-bold">
                              R${" "}
                              {(typeof inv.price === "number"
                                ? inv.price
                                : parseFloat(String(inv.price || 0))
                              ).toFixed(2) || "0.00"}
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
                    className="flex-1 text-neutral-500"
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
        {onClose && (
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-neutral-900/80 text-neutral-400 flex items-center justify-center backdrop-blur shadow-lg border border-white/10 hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        )}
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
