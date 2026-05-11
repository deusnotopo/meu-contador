import { useCallback, useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  User as UserIcon,
  Sparkles,
  AlertCircle,
  Zap,
  Mic,
  WifiOff,
  Globe,
} from "lucide-react";
import { logger } from "@/lib/logger";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { fetchMarketData } from "@/lib/market-data";
import { EmotionalCheckIn } from "@/components/emotional/EmotionalCheckIn";
import { HelpButton } from "@/components/ui/HelpButton";
import type { TabType } from "@/types/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { EMOTION_CONFIG, type EmotionType } from "@/types/emotional";
import { TransactionSchema } from "@/lib/schemas";

// ── Categories ──────────────────────────
const EXPENSE_CATS = [
  { id: "Moradia", ico: "🏠", nm: "Moradia" },
  { id: "Mercado", ico: "🛒", nm: "Mercado" },
  { id: "Delivery", ico: "🍕", nm: "Delivery" },
  { id: "Transporte", ico: "🚗", nm: "Transp." },
  { id: "Saúde", ico: "💊", nm: "Saúde" },
  { id: "Lazer", ico: "🎬", nm: "Lazer" },
  { id: "Roupas", ico: "👕", nm: "Roupas" },
  { id: "Educação", ico: "📚", nm: "Educação" },
  { id: "Assinaturas", ico: "📱", nm: "Assina." },
  { id: "Outros", ico: "📦", nm: "Outros" },
];

const INCOME_CATS = [
  { id: "Salário", ico: "💼", nm: "Salário" },
  { id: "Freelance", ico: "💻", nm: "Freelance" },
  { id: "Aluguel", ico: "🏘️", nm: "Aluguel" },
  { id: "Investimentos", ico: "📈", nm: "Investim." },
  { id: "Dividendos", ico: "💰", nm: "Dividendos" },
  { id: "Bônus", ico: "🎁", nm: "Bônus" },
  { id: "Reembolso", ico: "🔄", nm: "Reembolso" },
  { id: "Outros", ico: "✨", nm: "Outros" },
];

interface LaunchScreenProps {
  onBack?: (tab?: TabType) => void;
  onSuccess?: () => void;
}

export const LaunchScreen = ({ onBack, onSuccess }: LaunchScreenProps) => {
  const { addTransaction } = useTransactions();
  const { budgets } = useBudgets();
  const { isOffline, offlineFetch } = useOfflineSync();
  const location = useLocation();
  const initialType =
    new URLSearchParams(location.search).get("type") === "income"
      ? "income"
      : "expense";

  const [tipo, setTipo] = useState<"expense" | "income">(initialType);
  const [amtStr, setAmtStr] = useState("0");
  const [catId, setCatId] = useState("Mercado");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmotional, setShowEmotional] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [savedTransaction, setSavedTransaction] = useState<{
    amount: number;
    category: string;
  } | null>(null);
  const [scope, setScope] = useState<"personal" | "business">("personal");
  const [selectedMood, setSelectedMood] = useState<EmotionType | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [currency, setCurrency] = useState<"BRL" | "USD" | "EUR" | "GBP">(
    "BRL",
  );
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  // Fetch exchange rates when currency changes
  useEffect(() => {
    if (currency === "BRL") {
      setExchangeRate(null);
      return;
    }
    fetchMarketData()
      .then((m) => {
        const rates: Record<string, number> = {
          USD: m.usd,
          EUR: m.eur,
          GBP: m.gbp,
        };
        setExchangeRate(rates[currency] ?? null);
      })
      .catch(() => {});
  }, [currency]);

  const categories = tipo === "expense" ? EXPENSE_CATS : INCOME_CATS;
  const isExpense = tipo === "expense";

  const resetFields = useCallback(() => {
    setAmtStr("0");
    setDescription("");
    setSelectedMood(null);
  }, []);

  const budgetImpact = useMemo(() => {
    if (!isExpense) return { status: "safe", message: "" };
    const amountVal = parseInt(amtStr, 10) / 100;
    if (amountVal === 0) return { status: "neutral", message: "" };
    const budget = budgets.find((b) =>
      b.category.toLowerCase().includes(catId.toLowerCase()),
    );
    if (!budget)
      return {
        status: "unknown",
        message: "💸 Categoria sem orçamento definido",
      };
    const remaining = budget.limit - budget.spent;
    if (amountVal > remaining)
      return {
        status: "critical",
        message: "⚠️ Ultrapassa o orçamento restante!",
      };
    if (amountVal / remaining > 0.7)
      return { status: "warning", message: "Próximo ao limite do orçamento" };
    return { status: "safe", message: "Dentro das metas estabelecidas" };
  }, [amtStr, catId, budgets, isExpense]);

  const accentColor = useMemo(() => {
    if (!isExpense) return "#00D991";
    if (budgetImpact.status === "critical") return "#ef4444";
    if (budgetImpact.status === "warning") return "#f59e0b";
    return "#F05A7E";
  }, [isExpense, budgetImpact.status]);

  const handleTipoChange = (t: "expense" | "income") => {
    setTipo(t);
    setCatId(t === "expense" ? "Mercado" : "Salário");
    setSelectedMood(null);
  };

  const fmtAmt = (v: string) => {
    const num = parseInt(v.replace(/\D/g, ""), 10) || 0;
    return `R$ ${(num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  };

  const amountRaw = (parseInt(amtStr.replace(/\D/g, ""), 10) || 0) / 100;
  const isZero = amountRaw === 0;

  const handleKey = (k: string) => {
    if (k === ",") return;
    if (k === "⌫") {
      setAmtStr((p) => (p.length <= 1 ? "0" : p.slice(0, -1)));
    } else {
      setAmtStr((p) => (p === "0" ? k : p + k));
    }
  };

  const handleConfirm = useCallback(async () => {
    if (isZero || loading) return;
    setLoading(true);
    try {
      const cat = categories.find((c) => c.id === catId);
      const payload = {
        amount: amountRaw.toString(),
        description: description || (cat?.nm ?? catId),
        category: catId,
        type: tipo,
        date: new Date().toISOString().split("T")[0] as string,
        paymentMethod: "pix",
        notes: "",
        recurring: false,
        scope,
        mood: selectedMood || undefined,
        // Multi-moeda
        ...(currency !== "BRL" && exchangeRate
          ? {
              currency,
              originalAmount: amountRaw.toString(),
              exchangeRate: exchangeRate.toString(),
            }
          : {}),
        // _token é removido pelo SW antes de enviar — usado apenas para auth offline
      }; // AKITA MODE: Validação rigorosa na borda (Pre-submit)

      const validationPayload = {
        ...payload,
        amount: amountRaw, // Number para validação
      };

      const validationResult = TransactionSchema.omit({
        id: true,
        userId: true,
      }).safeParse(validationPayload);

      if (!validationResult.success) {
        logger.warn('[LaunchScreen] Zod contract violation', { errors: validationResult.error.format() });
        const firstError =
          validationResult.error.errors[0]?.message || "Dados inválidos";
        throw new Error(`Erro de contrato: ${firstError}`);
      }

      if (isOffline) {
        // Modo offline: salva na fila IndexedDB
        const apiBase = import.meta.env.VITE_API_URL || "/api";
        await offlineFetch(`${apiBase}/transactions`, payload, "create");
        if (onSuccess) onSuccess();
        resetFields();
        onBack?.("inicio");
        return;
      }

      await addTransaction(payload);
      if (onSuccess) onSuccess();
      if (tipo === "expense") {
        setSavedTransaction({ amount: amountRaw, category: catId });
        setShowEmotional(true);
      } else {
        resetFields();
        onBack?.("inicio");
      }
    } finally {
      setLoading(false);
    }
  }, [
    addTransaction,
    amountRaw,
    catId,
    categories,
    currency,
    description,
    exchangeRate,
    isOffline,
    isZero,
    loading,
    offlineFetch,
    onBack,
    onSuccess,
    resetFields,
    scope,
    tipo,
    selectedMood,
  ]);

  const startListening = useCallback(() => {
    const win = window as unknown as Record<string, unknown>;
    const SpeechRecognition =
      (win.SpeechRecognition || win.webkitSpeechRecognition) as
        | { new(): { lang: string; continuous: boolean; interimResults: boolean; onstart: (() => void) | null; onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void } }
        | undefined;
    if (!SpeechRecognition) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
      const transcript = (event.results[0]?.[0]?.transcript ?? '').toLowerCase();
      const numMatches = transcript.match(/\d+(?:[.,]\d+)?/g);
      if (numMatches?.length) {
        const valStr = numMatches[0].replace(",", ".");
        setAmtStr(Math.round(parseFloat(valStr) * 100).toString());
      }
      const foundCat = categories.find((c) =>
        transcript.includes(c.nm.toLowerCase()),
      );
      if (foundCat) setCatId(foundCat.id);
      setDescription(transcript.charAt(0).toUpperCase() + transcript.slice(1));
      setShowDetails(true);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [categories]);

  const handleEmotionalComplete = () => {
    setShowEmotional(false);
    setSavedTransaction(null);
    resetFields();
    onBack?.("inicio");
  };

  useEffect(() => {
    const handleKeyboardInput = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        handleKey(event.key);
      } else if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        handleKey("⌫");
      } else if (event.key === "Enter") {
        event.preventDefault();
        void handleConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyboardInput);
    return () => window.removeEventListener("keydown", handleKeyboardInput);
  }, [handleConfirm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      className="spatial-card flex flex-col h-full p-5 relative overflow-hidden"
    >
      {/* Aurora glow tinted by accent */}
      <div
        className="aurora-bg"
        style={{ "--glow-color": `${accentColor}22` } as React.CSSProperties}
      />

      <div className="flex-1 flex flex-col relative z-10">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => onBack?.()}
            className="back-btn"
            aria-label="Voltar"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 text-lg font-black text-white tracking-tight">
            Novo lançamento
            <HelpButton tooltipText="Registre receitas e gastos com inteligência emocional." />
          </div>
          {isOffline && (
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <WifiOff size={11} className="text-amber-400" />
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                Offline
              </span>
            </div>
          )}
        </div>

        {/* ── Scope Toggle ── */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setScope("personal")}
            className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
              scope === "personal"
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-white/5 text-neutral-500"
            }`}
          >
            <UserIcon size={13} className="mr-2 inline" /> Pessoal
          </button>
          <button
            onClick={() => setScope("business")}
            className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
              scope === "business"
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                : "bg-transparent border-white/5 text-neutral-500"
            }`}
          >
            <Briefcase size={13} className="mr-2 inline" /> Empresarial
          </button>
        </div>

        {/* ── Type Selector ── */}
        <div className="seg-ctrl mb-4 bg-black/20">
          {(["expense", "income"] as const).map((t) => (
            <motion.button
              key={t}
              className={`seg-opt${tipo === t ? " active" : ""}`}
              onClick={() => handleTipoChange(t)}
              style={
                tipo === t
                  ? {
                      color: t === "expense" ? "#F05A7E" : "#00D991",
                      borderBottom: `2px solid ${t === "expense" ? "#F05A7E" : "#00D991"}`,
                    }
                  : {}
              }
            >
              {t === "expense" ? "💸 Gasto" : "💰 Receita"}
            </motion.button>
          ))}
        </div>

        {/* ── Amount Display ── */}
        <div
          className="launch-amount flex-1 flex flex-col justify-center pl-3 relative"
          style={{ borderLeft: `3px solid ${accentColor}` }}
        >
          <div className="text-[11px] text-white/40 uppercase font-black tracking-widest mb-2">
            {isExpense ? "Valor do gasto" : "Valor recebido"}
          </div>

          <motion.div
            key={amtStr}
            initial={{ scale: 0.92, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-black tracking-tighter leading-none"
            style={{
              fontSize: "clamp(44px, 10vw, 62px)",
              color: isZero ? "rgba(255,255,255,0.25)" : "white",
            }}
          >
            {fmtAmt(amtStr)}
          </motion.div>

          {/* Voice button */}
          <button
            onClick={startListening}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all cursor-pointer ${
              isListening
                ? "bg-rose-500/20 text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse"
                : "bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-white"
            }`}
            title="Lançar por voz"
          >
            <Mic size={22} />
          </button>

          {/* Budget impact pill */}
          <AnimatePresence>
            {budgetImpact.message && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 mt-2 text-xs font-black"
                style={{ color: accentColor }}
              >
                {budgetImpact.status === "critical" ? (
                  <AlertCircle size={13} />
                ) : (
                  <Zap size={13} />
                )}
                {budgetImpact.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Category / Details ── */}
        <div className="mt-4">
          {!showDetails ? (
            <button
              onClick={() => setShowDetails(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {categories.find((c) => c.id === catId)?.ico}
                </span>
                <span className="text-sm font-semibold text-white/70">
                  Categoria: {categories.find((c) => c.id === catId)?.nm}
                </span>
              </div>
              <span
                className="text-xs font-black"
                style={{ color: accentColor }}
              >
                + Detalhes
              </span>
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="launch-cats">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`lcat${catId === c.id ? " active" : ""}`}
                    onClick={() => setCatId(c.id)}
                    style={
                      catId === c.id
                        ? { borderColor: accentColor, color: accentColor }
                        : {}
                    }
                  >
                    <span className="lcat-ico">{c.ico}</span>
                    <span className="lcat-nm">{c.nm}</span>
                  </button>
                ))}
              </div>
              <input
                className="input-field"
                placeholder="Descrição opcional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {/* Currency selector */}
              <div className="flex items-center gap-2">
                <Globe size={13} className="text-white/30" />
                <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">
                  Moeda
                </span>
                <div className="flex gap-1.5 ml-auto">
                  {(["BRL", "USD", "EUR", "GBP"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        currency === c
                          ? "bg-indigo-500/30 border border-indigo-500/50 text-indigo-300"
                          : "bg-white/5 border border-white/5 text-white/30 hover:text-white/60"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {currency !== "BRL" && (
                <div className="text-[10px] text-white/30 text-right">
                  {exchangeRate
                    ? `1 ${currency} ≈ R$ ${exchangeRate.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : "Carregando cotação..."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Money Mood ── */}
        {isExpense && (
          <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-black mb-3">
              <Sparkles size={11} className="text-indigo-400" />
              Money Mood: Como se sente com este gasto?
            </div>
            <div className="flex justify-between gap-1 overflow-x-auto pb-1">
              {(
                Object.entries(EMOTION_CONFIG) as [
                  EmotionType,
                  (typeof EMOTION_CONFIG)[EmotionType],
                ][]
              )
                .slice(0, 6)
                .map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() =>
                      setSelectedMood(selectedMood === key ? null : key)
                    }
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[52px] cursor-pointer ${
                      selectedMood === key
                        ? "bg-indigo-500/20 border border-indigo-500/40"
                        : "border border-transparent hover:bg-white/5"
                    }`}
                  >
                    <span className="text-xl mb-1">{config.emoji}</span>
                    <span className="text-[9px] font-bold text-white/40">
                      {config.label}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Keypad ── */}
      <div className="shrink-0 mt-4 relative z-10">
        <div className="keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫"].map(
            (k) => (
              <motion.button
                whileTap={{ scale: 0.88, opacity: 0.85 }}
                key={k}
                className={`key${k === "⌫" ? " del" : ""}`}
                onClick={() => handleKey(k)}
                aria-label={k === "⌫" ? "Apagar" : k}
              >
                {k}
              </motion.button>
            ),
          )}
        </div>

        {/* ── Confirm Button ── */}
        <motion.button
          onClick={handleConfirm}
          disabled={isZero || loading}
          className="launch-confirm-btn"
          style={{
            background: isZero
              ? "rgba(255,255,255,0.04)"
              : isExpense
                ? "linear-gradient(135deg, #F05A7E, #e0385e)"
                : "linear-gradient(135deg, #00D991, #00b07a)",
            boxShadow: isZero ? "none" : `0 8px 30px ${accentColor}44`,
            border: isZero ? "1px solid rgba(255,255,255,0.06)" : "none",
            color: isZero ? "rgba(255,255,255,0.25)" : "white",
          }}
          whileTap={!isZero ? { scale: 0.97 } : {}}
          whileHover={!isZero ? { scale: 1.01 } : {}}
          transition={{ duration: 0.15 }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
              {isOffline ? "Salvando offline..." : "Processando..."}
            </span>
          ) : isOffline ? (
            isExpense ? (
              "✓  Salvar Gasto (offline)"
            ) : (
              "✓  Salvar Receita (offline)"
            )
          ) : isExpense ? (
            "✓  Confirmar Gasto"
          ) : (
            "✓  Confirmar Receita"
          )}
        </motion.button>
      </div>

      <EmotionalCheckIn
        isOpen={showEmotional}
        onClose={() => setShowEmotional(false)}
        transactionAmount={savedTransaction?.amount}
        transactionCategory={savedTransaction?.category}
        onComplete={handleEmotionalComplete}
        initialEmotion={selectedMood}
      />
    </motion.div>
  );
};
