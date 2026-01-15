import { Button } from "@/components/ui/button";
import { executeAction } from "@/lib/ai/action-executor";
import { parseIntent } from "@/lib/ai/intent-parser";
import type { Transaction } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, Send, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VoiceInput } from "./VoiceInput";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIFinancialChatProps {
  transactions: Transaction[];
  onClose?: () => void;
}

export const AIFinancialChat = ({
  transactions,
  onClose,
}: AIFinancialChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Olá! Sou seu Processador de Inteligência Financeira. Meus algoritmos estão prontos para analisar seus fluxos e otimizar seu capital. O que deseja auditar hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // STEP 1: Check for actionable intent
      const intent = parseIntent(input);

      if (
        intent.type !== "unknown" &&
        intent.type !== "query" &&
        intent.confidence > 0.7
      ) {
        // Execute action directly
        const result = await executeAction(intent);

        const actionMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.success
            ? `✅ **AÇÃO EXECUTADA**\n\n${result.message}`
            : `❌ **ERRO**\n\n${result.message}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, actionMessage]);
        setIsLoading(false);
        return;
      }

      // STEP 2: Fall back to AI Q&A
      const recentTransactions = transactions.slice(-20);
      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const response = await fetch("/api/ai-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Você é um Processador Financeiro de Alta Performance. Suas respostas devem ser precisas, profissionais e inspirar autoridade tecnológica. Use termos como 'Auditoria', 'Fluxo de Capital', 'Otimização' e 'Indicadores'. Formate números em negrito.",
            },
            {
              role: "user",
              content: `MÉTRICAS ATUAIS:
- RECEITA: R$ ${totalIncome.toFixed(2)}
- DESPESA: R$ ${totalExpense.toFixed(2)}
- SALDO: R$ ${(totalIncome - totalExpense).toFixed(2)}

ÚLTIMOS INPUTS:
${recentTransactions
  .map(
    (t) =>
      `- ${t.type.toUpperCase()}: ${t.description} | R$ ${
        t.amount
      } (${t.category.toUpperCase()})`
  )
  .join("\n")}

AUDITORIA SOLICITADA: ${input}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Falha na Rede Neural");
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro no chat:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "CRITICAL ERROR [0x42]: Falha na comunicação com o núcleo da IA. Tente reiniciar o processo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "Auditoria: Gastos Mensais",
    "Previsão: ROI Próximo Mês",
    "Estratégia: Economizar R$ 5k",
    "Status: Saúde Financeira",
  ];

  return (
    <div className="flex flex-col h-full bg-[#02040a] text-white">
      {/* High-Tech Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 via-transparent to-purple-500/10">
        <div className="flex items-center gap-4">
          <div className="relative p-3 bg-indigo-500/20 rounded-2xl ai-pulse-core">
            <Bot className="text-indigo-400" size={28} />
          </div>
          <div>
            <h3 className="font-black text-xl tracking-tighter text-glow">
              CENTRO DE INTELIGÊNCIA
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                SISTEMA OPERACIONAL ATIVO
              </p>
            </div>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-xl hover:bg-white/5 text-slate-400"
          >
            <X size={20} />
          </Button>
        )}
      </div>

      {/* Messages - Immersive Layout */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, x: message.role === "user" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-4 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`mt-1 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border ${
                  message.role === "user"
                    ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400"
                    : "bg-white/5 border-white/10 text-slate-400"
                }`}
              >
                {message.role === "user" ? (
                  <User size={20} />
                ) : (
                  <Bot size={20} />
                )}
              </div>

              <div
                className={`flex flex-col max-w-[85%] ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`p-5 rounded-3xl ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white font-medium shadow-[0_0_30px_rgba(79,70,229,0.2)]"
                      : "bg-white/5 border border-white/10 text-slate-300 font-sans"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {message.content}
                  </p>
                </div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2 px-1">
                  {message.timestamp.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Loader2 size={20} className="text-indigo-400 animate-spin" />
            </div>
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested & Input */}
      <div className="p-6 border-t border-white/10 bg-white/[0.02]">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <VoiceInput
            onTranscript={(text) => setInput(text)}
            isProcessing={isLoading}
          />
          <div className="relative group flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Comando de Auditoria..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 bottom-2 px-5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 transition-all"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
        <p className="text-center text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mt-4">
          MNT-OS v2.5 • ENCRYPTED PAYLOAD
        </p>
      </div>
    </div>
  );
};
