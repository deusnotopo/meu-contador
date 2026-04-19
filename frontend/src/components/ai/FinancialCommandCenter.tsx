/**
 * FinancialCommandCenter.tsx
 * ──────────────────────────
 * Phase 24: AI Financial Chat
 *
 * Combines:
 *   - parseIntent()      → NLP command detection
 *   - executeAction()    → Execute create/update operations
 *   - buildFinancialContext() → Rich financial snapshot as system context
 *   - POST /ai-proxy     → Gemini for open-ended questions
 *
 * UX: Premium dark chat bubble UI with quick prompts, action cards,
 * typing indicator, and full conversation history.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  X,
  Loader2,
  Bot,
  User,
  Zap,
  TrendingUp,
  Target,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { parseIntent } from "@/lib/ai/intent-parser";
import { executeAction } from "@/lib/ai/action-executor";
import { buildFinancialContext } from "@/lib/ai/contextual-insights";
import { api } from "@/lib/api";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { useBudgets } from "@/hooks/useBudgets";
import { useGoals } from "@/hooks/useGoals";
import { formatCurrency } from "@/lib/formatters";

// ── Types ─────────────────────────────────────────────────────────────────────

type MessageRole = "user" | "assistant" | "system";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  actionExecuted?: boolean;
  cost?: string; // e.g. "+R$ 150 — Mercado"
}

// ── Quick prompts ─────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  {
    icon: <TrendingUp size={12} />,
    label: "Status FIRE",
    text: "Estou no caminho certo para a independência financeira?",
  },
  {
    icon: <Target size={12} />,
    label: "Maior gasto",
    text: "Qual foi meu maior gasto este mês?",
  },
  {
    icon: <CreditCard size={12} />,
    label: "Sobrevivência",
    text: "Quantos dias consigo sobreviver só com meus ativos?",
  },
  {
    icon: <Zap size={12} />,
    label: "Dica rápida",
    text: "Me dê uma dica de otimização financeira personalizada.",
  },
];

// ── Typing indicator ──────────────────────────────────────────────────────────

const TypingDots = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        className="w-1.5 h-1.5 rounded-full bg-indigo-400"
      />
    ))}
  </div>
);

// ── Message bubble ────────────────────────────────────────────────────────────

const MessageBubble = ({ msg }: { msg: ChatMessage }) => {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isUser
            ? "bg-indigo-500/20 border border-indigo-500/30"
            : "bg-violet-500/20 border border-violet-500/30"
        }`}
      >
        {isUser ? (
          <User size={13} className="text-indigo-400" />
        ) : (
          <Bot size={13} className="text-violet-400" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
          isUser
            ? "bg-indigo-500/15 border border-indigo-500/20 text-white/90 rounded-tr-sm"
            : "bg-white/[0.04] border border-white/[0.06] text-white/85 rounded-tl-sm"
        }`}
      >
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </p>
        {msg.actionExecuted && (
          <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
            ✓ Ação executada
          </span>
        )}
        <div className="text-[9px] text-white/20 mt-1">
          {msg.timestamp.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

interface FinancialCommandCenterProps {
  onClose?: () => void;
}

export const FinancialCommandCenter = ({
  onClose,
}: FinancialCommandCenterProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        'Olá! Sou seu assistente financeiro. Posso responder perguntas sobre suas finanças, registrar transações por comando de voz natural, ou executar ações como criar lembretes e metas.\n\nExemplo: "Gastei R$ 85 no mercado" ou "Estou no caminho certo para o FIRE?"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load financial data for context
  const { transactions } = useTransactions();
  const { assets } = useInvestments();
  const { debts } = useDebts();
  const { budgets } = useBudgets();
  const { goals } = useGoals();

  // Build conversation history for Gemini (last 8 messages)
  const buildConversation = useCallback(() => {
    return messages
      .filter((m) => m.role !== "system")
      .slice(-8)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const addMessage = (
    role: MessageRole,
    content: string,
    extra?: Partial<ChatMessage>,
  ) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      ...extra,
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const handleSend = useCallback(
    async (text?: string) => {
      const userText = (text ?? input).trim();
      if (!userText || isThinking) return;

      setInput("");
      addMessage("user", userText);
      setIsThinking(true);

      try {
        // ── Step 1: Try local intent parsing (fast, no API call) ──────────────
        const intent = parseIntent(userText);

        if (
          intent.type !== "unknown" &&
          intent.type !== "query" &&
          intent.confidence >= 0.85
        ) {
          // Execute the action (create transaction, reminder, budget, etc.)
          const result = await executeAction(intent);

          addMessage(
            "assistant",
            result.success
              ? `✅ ${result.message}\n\nPosso fazer mais alguma coisa?`
              : `❌ ${result.message}`,
            { actionExecuted: result.success },
          );
          return;
        }

        // ── Step 2: Query intent — answer from financial context ──────────────
        const financialContext = buildFinancialContext(
          transactions,
          assets,
          budgets,
          goals,
          debts,
        );

        // Build a rich financial snapshot for the system prompt
        const snapshot = {
          totalIncome: financialContext.totalIncome,
          totalExpense: financialContext.totalExpense,
          balance: financialContext.balance,
          savingsRate: financialContext.savingsRate,
          portfolioValue: financialContext.portfolioValue,
          totalDebt: financialContext.totalDebt,
          topCategories: financialContext.topCategories,
          goalsProgress: financialContext.goalsProgress,
          averageDailySpend: financialContext.averageDailySpend,
          largestExpense: financialContext.largestExpense,
        };

        // ── Step 3: Gemini for open-ended questions with context ──────────────
        const response = await api.post<{ response: string }>("/ai-proxy", {
          userMessage: userText,
          conversation: buildConversation(),
          financialSnapshot: snapshot,
        });

        addMessage(
          "assistant",
          response.response || "Não consegui gerar uma resposta no momento.",
        );
      } catch (error: unknown) {
        const msg =
          error instanceof Error && error.message?.includes("rate")
            ? "Muitas perguntas em pouco tempo. Aguarde um momento."
            : "Não consegui processar sua mensagem. Tente novamente.";
        addMessage("assistant", msg);
      } finally {
        setIsThinking(false);
      }
    },
    [
      input,
      isThinking,
      transactions,
      assets,
      budgets,
      goals,
      debts,
      buildConversation,
    ],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Financial snapshot stats for the header
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="flex flex-col h-full max-h-[85vh] rounded-2xl overflow-hidden border border-white/[0.06] bg-[#080C16] shadow-2xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05] bg-gradient-to-r from-indigo-500/[0.06] to-violet-500/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles size={15} className="text-indigo-400" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white">
              Assistente Financeiro
            </div>
            <div className="text-[9px] text-white/30 font-medium">
              Powered by Gemini · Contexto financeiro real
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Live balance pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
              Saldo
            </span>
            <span
              className={`text-[11px] font-black ${income - expense >= 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {formatCurrency(income - expense)}
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 text-white/30 hover:text-white transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </AnimatePresence>

        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2.5"
          >
            <div className="w-7 h-7 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <Bot size={13} className="text-violet-400" />
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm">
              <TypingDots />
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* ── Quick prompts ───────────────────────────────────────────────────── */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => handleSend(p.text)}
                disabled={isThinking}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-white/50 hover:text-indigo-400 bg-white/[0.02] hover:bg-indigo-500/8 border border-white/[0.05] hover:border-indigo-500/20 transition-all disabled:opacity-40"
              >
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div className="px-3 pb-3 pt-2 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 bg-white/[0.03] rounded-2xl border border-white/[0.07] px-3.5 py-2.5 focus-within:border-indigo-500/30 transition-all">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Pergunte algo ou registre: "Gastei R$ 50 em farmácia"'
            disabled={isThinking}
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-white placeholder:text-white/25 font-medium disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isThinking ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
        <p className="text-center text-[8px] text-white/15 mt-1.5">
          Respostas são orientativas. Não substituem consultoria profissional.
        </p>
      </div>
    </div>
  );
};

// ── Floating Button Trigger ───────────────────────────────────────────────────
// Renders a floating Sparkles button. When clicked, opens the chat in a
// slide-up panel overlay anchored to the bottom of the screen.

export const CommandCenterTrigger = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-4 z-[80] w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[0_8px_32px_rgba(99,102,241,0.4)] flex items-center justify-center text-white"
        aria-label="Abrir Assistente Financeiro"
        title="Assistente Financeiro IA"
      >
        <Sparkles size={20} />
      </motion.button>

      {/* Slide-up panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[90] mx-auto max-w-lg px-2 pb-4"
            >
              {/* Drag handle */}
              <div className="flex justify-center mb-2">
                <button
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1 text-white/30 hover:text-white/60 text-[10px] font-bold transition-all"
                >
                  <ChevronDown size={14} />
                  Fechar
                </button>
              </div>
              <FinancialCommandCenter onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
