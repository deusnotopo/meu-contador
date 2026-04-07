import { useCallback, useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { ArrowLeft, Briefcase, User as UserIcon, Sparkles, AlertCircle, Zap, Mic } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { EmotionalCheckIn } from "@/components/emotional/EmotionalCheckIn";
import { HelpButton } from "@/components/ui/HelpButton";

import type { TabType } from "@/types/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { EMOTION_CONFIG, type EmotionType } from "@/types/emotional";


// â”€â”€ Expense categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const EXPENSE_CATS = [
  { id: "Moradia",       ico: "ðŸ ", nm: "Moradia" },
  { id: "Mercado",       ico: "ðŸ›’", nm: "Mercado" },
  { id: "Delivery",      ico: "ðŸ•", nm: "Delivery" },
  { id: "Transporte",    ico: "ðŸš—", nm: "Transp." },
  { id: "SaÃºde",         ico: "ðŸ’Š", nm: "SaÃºde" },
  { id: "Lazer",         ico: "ðŸŽ¬", nm: "Lazer" },
  { id: "Roupas",        ico: "ðŸ‘•", nm: "Roupas" },
  { id: "EducaÃ§Ã£o",      ico: "ðŸ“š", nm: "EducaÃ§Ã£o" },
  { id: "Assinaturas",   ico: "ðŸ“±", nm: "Assina." },
  { id: "Outros",        ico: "ðŸ“¦", nm: "Outros" },
];

// â”€â”€ Income categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const INCOME_CATS = [
  { id: "SalÃ¡rio",       ico: "ðŸ’¼", nm: "SalÃ¡rio" },
  { id: "Freelance",     ico: "ðŸ’»", nm: "Freelance" },
  { id: "Aluguel",       ico: "ðŸ˜ï¸",  nm: "Aluguel" },
  { id: "Investimentos", ico: "ðŸ“ˆ", nm: "Investim." },
  { id: "Dividendos",    ico: "ðŸ’°", nm: "Dividendos" },
  { id: "BÃ´nus",         ico: "ðŸŽ", nm: "BÃ´nus" },
  { id: "Reembolso",     ico: "ðŸ”„", nm: "Reembolso" },
  { id: "Outros",        ico: "âœ¨", nm: "Outros" },
];

interface LaunchScreenProps {
  onBack?: (tab?: TabType) => void;
  onSuccess?: () => void;
}

export const LaunchScreen = ({ onBack, onSuccess }: LaunchScreenProps) => {
  const { addTransaction } = useTransactions();
  const { budgets } = useBudgets();
  const location = useLocation();
  const initialType = new URLSearchParams(location.search).get("type") === "income" ? "income" : "expense";
  const [tipo, setTipo] = useState<"expense" | "income">(initialType);
  const [amtStr, setAmtStr] = useState("0");
  const [catId, setCatId] = useState("Mercado");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmotional, setShowEmotional] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [savedTransaction, setSavedTransaction] = useState<{ amount: number; category: string } | null>(null);
  const [scope, setScope] = useState<"personal" | "business">("personal");
  const [selectedMood, setSelectedMood] = useState<EmotionType | null>(null);
  const [isListening, setIsListening] = useState(false);

  const categories = tipo === "expense" ? EXPENSE_CATS : INCOME_CATS;
  const isExpense = tipo === "expense";


  const resetFields = useCallback(() => {
    setAmtStr("0");
    setDescription("");
    setSelectedMood(null);
  }, []);

  // Budget Pulse Logic
  const budgetImpact = useMemo(() => {
    if (!isExpense) return { status: 'safe', message: '' };
    const amountVal = parseInt(amtStr, 10) / 100;
    if (amountVal === 0) return { status: 'neutral', message: '' };
    
    const budget = budgets.find(b => b.category.toLowerCase().includes(catId.toLowerCase()));
    if (!budget) return { status: 'unknown', message: 'ðŸ’¸ Categoria sem orÃ§amento definido' };
    
    const remaining = budget.limit - budget.spent;
    if (amountVal > remaining) return { status: 'critical', message: 'âš ï¸ Ultrapassa o orÃ§amento restante!' };
    if (amountVal / remaining > 0.7) return { status: 'warning', message: 'PrÃ³ximo ao limite do orÃ§amento' };
    return { status: 'safe', message: 'Dentro das metas estabelecidas' };
  }, [amtStr, catId, budgets, isExpense]);

  const accentColor = useMemo(() => {
    if (!isExpense) return "#00D991";
    if (budgetImpact.status === 'critical') return "#ef4444";
    if (budgetImpact.status === 'warning') return "#f59e0b";
    return "#F05A7E";
  }, [isExpense, budgetImpact.status]);

  // Reset category when type changes
  const handleTipoChange = (t: "expense" | "income") => {
    setTipo(t);
    setCatId(t === "expense" ? "Mercado" : "SalÃ¡rio");
    setSelectedMood(null);
  };

  const fmtAmt = (v: string) => {
    const num = parseInt(v.replace(/\D/g, ""), 10) || 0;
    return `R$ ${(num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  };

  const amountRaw = parseInt(amtStr, 10) / 100;
  const isZero = amountRaw === 0;

  const handleKey = (k: string) => {
    if (k === "âŒ«") {
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
      await addTransaction({
        amount: amountRaw.toString(),
        description: description || (cat?.nm ?? catId),
        category: catId,
        type: tipo,
        date: new Date().toISOString().split("T")[0] as string,
        paymentMethod: "pix",
        notes: "",
        recurring: false,
        scope: scope,
        mood: selectedMood || undefined
      });

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
  }, [addTransaction, amountRaw, catId, categories, description, isZero, loading, onBack, onSuccess, resetFields, scope, tipo, selectedMood]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Reconhecimento de voz nÃ£o suportado neste navegador.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      
      const numMatches = transcript.match(/\d+(?:[.,]\d+)?/g);
      if (numMatches && numMatches.length > 0) {
        const valStr = numMatches[0].replace(',', '.');
        const centsVal = Math.round(parseFloat(valStr) * 100).toString();
        setAmtStr(centsVal);
      }

      // Simple heuristic for category matching
      const foundCat = categories.find(c => transcript.includes(c.nm.toLowerCase()));
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
        handleKey("âŒ«");
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
      className="spatial-card"
      style={{ display: "flex", flexDirection: "column", height: "100%", padding: "20px", position: "relative", overflow: "hidden" }}
    >
      <div className="aurora-bg" style={{ '--glow-color': `${accentColor}22` } as any} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => onBack?.()}
            className="back-btn"
            aria-label="Voltar"
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 }}>
            Novo lanÃ§amento
            <HelpButton tooltipText="Registre receitas e gastos com inteligÃªncia emocional." />
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={() => setScope("personal")} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${scope === 'personal' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-500'}`}>
            <UserIcon size={14} className="mr-2 inline" /> Pessoal
          </button>
          <button onClick={() => setScope("business")} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${scope === 'business' ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-transparent border-white/5 text-slate-500'}`}>
            <Briefcase size={14} className="mr-2 inline" /> Empresarial
          </button>
        </div>

        <div className="seg-ctrl" style={{ marginBottom: 16, background: "rgba(0,0,0,0.2)" }}>
          {(["expense", "income"] as const).map((t) => (
            <motion.button
              key={t}
              className={`seg-opt${tipo === t ? " active" : ""}`}
              onClick={() => handleTipoChange(t)}
              style={tipo === t ? { color: t === "expense" ? "#F05A7E" : "#00D991", borderBottom: `2px solid ${t === "expense" ? "#F05A7E" : "#00D991"}` } : {}}
            >
              {t === "expense" ? "ðŸ’¸ Gasto" : "ðŸ’° Receita"}
            </motion.button>
          ))}
        </div>

        <div className="launch-amount" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", borderLeft: `3px solid ${accentColor}`, paddingLeft: 12, position: "relative" }}>
          <div style={{ fontSize: 13, color: "var(--t3)", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
            {isExpense ? "Valor do gasto" : "Valor recebido"}
          </div>
          <motion.div
            key={amtStr}
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ fontSize: "clamp(48px, 10vw, 64px)", fontWeight: 800, color: isZero ? "rgba(255,255,255,0.3)" : "white", letterSpacing: "-2.5px" }}
          >
            {fmtAmt(amtStr)}
          </motion.div>
          
          <button 
            onClick={startListening}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
            title="LanÃ§ar por voz"
          >
            <Mic size={24} />
          </button>
          
          <AnimatePresence>
            {budgetImpact.message && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 mt-2 text-xs font-semibold" style={{ color: accentColor }}>
                {budgetImpact.status === 'critical' ? <AlertCircle size={14} /> : <Zap size={14} />}
                {budgetImpact.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4">
          {!showDetails ? (
            <button onClick={() => setShowDetails(true)} className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-white/10 hover:bg-white/5">
              <div className="flex items-center gap-2">
                <span className="text-[18px]">{categories.find(c => c.id === catId)?.ico}</span>
                <span className="text-sm font-medium text-gray-300">Categoria: {categories.find(c => c.id === catId)?.nm}</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: accentColor }}>+ Detalhes</span>
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="launch-cats">
                {categories.map((c) => (
                  <button key={c.id} className={`lcat${catId === c.id ? " active" : ""}`} onClick={() => setCatId(c.id)} style={catId === c.id ? { borderColor: accentColor, color: accentColor } : {}}>
                    <span className="lcat-ico">{c.ico}</span>
                    <span className="lcat-nm">{c.nm}</span>
                  </button>
                ))}
              </div>
              <input className="input-field" placeholder="DescriÃ§Ã£o opcional" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          )}
        </div>

        {isExpense && (
          <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest mb-3">
              <Sparkles size={12} className="text-indigo-400" /> Money Mood: Como se sente com este gasto?
            </div>
            <div className="flex justify-between gap-1 overflow-x-auto pb-1">
              {(Object.entries(EMOTION_CONFIG) as [EmotionType, typeof EMOTION_CONFIG[EmotionType]][]).slice(0, 6).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedMood(selectedMood === key ? null : key)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all min-w-[55px] ${selectedMood === key ? 'bg-indigo-500/20 border border-indigo-500/40' : 'border border-transparent hover:bg-white/5'}`}
                >
                  <span className="text-xl mb-1">{config.emoji}</span>
                  <span className="text-[9px] font-medium text-slate-400">{config.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, marginTop: 16 }}>
        <div className="keypad">
          {["1","2","3","4","5","6","7","8","9",",","0","âŒ«"].map((k) => (
            <motion.button
              whileTap={{ scale: 0.88, opacity: 0.85 }}
              key={k}
              className={`key${k === "âŒ«" ? " del" : ""}`}
              onClick={() => handleKey(k)}
              aria-label={k === "âŒ«" ? "Apagar" : k}
            >
              {k}
            </motion.button>
          ))}
        </div>

        <motion.button
          onClick={handleConfirm}
          disabled={isZero || loading}
          className="launch-confirm-btn"
          style={{
            background: isZero
              ? "rgba(255,255,255,0.04)"
              : isExpense
              ? `linear-gradient(135deg, #F05A7E, #e0385e)`
              : `linear-gradient(135deg, #00D991, #00b07a)`,
            boxShadow: isZero ? "none" : `0 8px 30px ${accentColor}44`,
            border: isZero ? "1px solid rgba(255,255,255,0.06)" : "none",
            color: isZero ? "rgba(255,255,255,0.25)" : "white",
          }}
          whileTap={!isZero ? { scale: 0.97 } : {}}
          whileHover={!isZero ? { scale: 1.01 } : {}}
          transition={{ duration: 0.15 }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
              Processando...
            </span>
          ) : (
            isExpense ? "âœ“  Confirmar Gasto" : "âœ“  Confirmar Receita"
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

