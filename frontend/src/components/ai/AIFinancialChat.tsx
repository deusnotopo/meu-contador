import { Button } from "@/components/ui/button";
import { executeAction } from "@/lib/ai/action-executor";
import { parseIntent } from "@/lib/ai/intent-parser";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useEducation } from "@/hooks/useEducation";
import { getTutorContext } from "@/hooks/educationEngine";
import type { EducationState } from "@/hooks/educationEngine";
import { useFinancialContext } from "@/hooks/useFinancialContext";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, Send, User as LucideUser, X, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { VoiceInput } from "./VoiceInput";
import { AIThinkingIndicator } from "./AIThinkingIndicator";



const TUTOR_RESPONSE_RULES = [
  "responder em camadas: básico, prático, avançado quando fizer sentido",
  "usar exemplos brasileiros concretos: Pix, boleto, cartão, DAS, aluguel, cliente atrasado",
  "se houver risco imediato, priorizar caixa, dívida cara, provisões e reserva",
  "terminar com próxima ação clara e revisita futura quando útil",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "insight" | "recommendation" | "alert";
}

interface FinancialSnapshotContext {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

interface FinancialSnapshotInsights {
  score: number;
  alerts: Array<{ message: string }>;
  recommendations: Array<{ title: string }>;
  predictions: Array<{ category: string; trend: string }>;
}

interface FinancialSnapshotMetrics {
  expensesByCategory?: Record<string, number>;
}

function buildFinancialSnapshot(
  context: FinancialSnapshotContext,
  insights: FinancialSnapshotInsights,
  metrics: FinancialSnapshotMetrics,
) {
  const categoryEntries = Object.entries(metrics?.expensesByCategory ?? {}) as Array<[string, number]>;

  return {
    balance: context.balance,
    monthlyIncome: context.monthlyIncome,
    monthlyExpenses: context.monthlyExpenses,
    savingsRate: context.savingsRate,
    score: insights.score,
    topCategories: categoryEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount })),
    alerts: insights.alerts.map((alert) => alert.message),
    recommendations: insights.recommendations.map((item) => item.title),
    predictions: insights.predictions.map((item) => `${item.category}: ${item.trend}`),
  };
}

interface AIFinancialChatProps {
  onClose?: () => void;
}

export const AIFinancialChat = ({
  onClose,
}: AIFinancialChatProps) => {
  const { user } = useAuth();
  const { context, insights, aiContextString } = useFinancialContext();
  const edu = useEducation();
  const eduState: EducationState = {
    completedModules: edu.state.completedModules,
    xp: edu.state.xp,
    streak: edu.state.streak,
    lastActiveDate: edu.state.lastActiveDate,
    lessonReviewDueAt: {},
  };
  const tutorContext = getTutorContext(eduState, {
    hasDebts: user?.hasDebts,
    hasEmergencyFund: user?.hasEmergencyFund,
    financialGoal: user?.financialGoal,
    employmentType: user?.employmentType,
    currentWorkspaceId: user?.currentWorkspaceId,
    hasInvestments: false,
    riskProfile: user?.riskProfile,
  });
  const pedagogicalContext = `Você é um tutor financeiro brasileiro, pragmático e didático. Ensine sem economês desnecessário, priorize clareza, exemplo brasileiro, contabilidade aplicada e sempre termine com próxima ação prática quando fizer sentido. Se houver risco financeiro imediato, priorize proteção de caixa, dívida cara e reserva antes de investimento sofisticado. Regras de resposta: ${TUTOR_RESPONSE_RULES.join('; ')}.

CONTEXTO PEDAGÓGICO DA ACADEMIA:
- momento atual: ${tutorContext.currentMoment?.title || 'analisando'}
- estágio da jornada: ${tutorContext.journeyStage.title}
- descrição da jornada: ${tutorContext.journeyStage.description}
- aula recomendada: ${tutorContext.learningFocus?.title || 'nenhuma'}
- objetivo comportamental: ${tutorContext.learningFocus?.behaviorGoal || 'reforçar consistência financeira'}
- feature conectada: ${tutorContext.learningFocus?.feature || 'dashboard'}
- sinal contextual: ${tutorContext.contextSignal.signal?.title || 'sem sinal crítico no momento'}

Ao responder, você pode usar explicitamente os modos: explicar, exemplificar, comparar, mandar agir e revisar depois.`;
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Olá! Sou seu tutor financeiro inteligente. Analisei seus dados e posso ver que:

📊 **Score de Saúde Financeira:** ${insights.score}/100
💰 **Saldo Atual:** R$ ${context.balance.toLocaleString('pt-BR')}
📈 **Taxa de Poupança:** ${context.savingsRate.toFixed(1)}%

🎯 **Seu momento em Aprender:** ${tutorContext.currentMoment?.title || 'analisando'}
🧭 **Estágio atual:** ${tutorContext.journeyStage.title}

${insights.summary}

${insights.alerts.length > 0 ? `\n**Alertas:**\n${insights.alerts.map(a => a.message).join('\n')}` : ''}

${tutorContext.learningFocus ? `\n**Próximo foco pedagógico:**\n${tutorContext.learningFocus.title} → ${tutorContext.learningFocus.behaviorGoal}` : ''}

Posso te ajudar em 5 modos: **explicar**, **simplificar**, **comparar**, **mandar agir** e **revisar depois**.

Como posso ajudar você a melhorar suas finanças hoje?`,
      timestamp: new Date(),
      type: "insight",
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

  const handleClearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: "assistant",
      content: "Memória volatizada. Sistema reiniciado. Como posso auditar seus fluxos agora?",
      timestamp: new Date(),
    }]);
  };

  const handleExportChat = () => {
    const chatText = messages.map(m => 
      `[${m.timestamp.toLocaleString('pt-BR')}] ${m.role === 'user' ? 'VOCÊ' : 'AI'}: ${m.content}`
    ).join('\n\n---\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meu-contador-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    console.log("[AI ENGINE] v2.1 Activated - Security: Centralized CSRF");

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
        const tempId = Date.now().toString() + "_temp";
        const tempMessage: Message = {
          id: tempId,
          role: "assistant",
          content: "Gravando o lançamento de dados...",
          timestamp: new Date(),
          type: "insight",
        };
        setMessages((prev) => [...prev, tempMessage]);

        const result = await executeAction(intent);

        const actionMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.success
            ? `✅ **AÇÃO EXECUTADA**\n\n${result.message}`
            : `❌ **ERRO**\n\n${result.message}`,
          timestamp: new Date(),
          type: result.success ? "insight" : "alert",
        };

        setMessages((prev) => [...prev.filter(m => m.id !== tempId), actionMessage]);
        setIsLoading(false);
        // Force overall dashboard refresh
        window.dispatchEvent(new Event("transaction-updated"));
        return;
      }

      // STEP 2: AI Q&A with full financial context
      const requestBody = {
        conversation: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        systemContext: `${aiContextString}\n\n${pedagogicalContext}`,
        userMessage: input,
        financialSnapshot: buildFinancialSnapshot({
          balance: context.balance,
          monthlyIncome: context.totalIncome,
          monthlyExpenses: context.totalExpense,
          savingsRate: context.savingsRate,
        }, {
          score: insights.score,
          alerts: insights.alerts,
          recommendations: insights.recommendations,
          predictions: insights.predictions.goalCompletionDates.map(g => ({
            category: g.goal,
            trend: g.estimatedDate,
          })),
        }, { expensesByCategory: Object.fromEntries(context.topCategories.map(c => [c.category, c.amount])) }),
      };

      let data: { response?: string };
      try {
        data = await api.post<{ response: string }>('/ai-proxy', requestBody);
      } catch {
        data = { response: "Processando com análise local. Aguarde enquanto reconecto com o núcleo de IA." };
      }
      const aiResponse = data.response ?? "Não foi possível obter resposta da IA";

      let messageType: Message["type"] = "text";
      if (aiResponse.includes("recomendo") || aiResponse.includes("sugiro")) {
        messageType = "recommendation";
      } else if (aiResponse.includes("⚠") || aiResponse.includes("atenção")) {
        messageType = "alert";
      } else if (aiResponse.includes("📊") || aiResponse.includes("análise") || aiResponse.includes("Processando")) {
        messageType = "insight";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
        type: messageType,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro no chat:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Erro ao processar. Suas finanças estão seguras, tente novamente.",
        timestamp: new Date(),
        type: "alert",
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
    "Como está minha saúde financeira?",
    "Explique sem economês onde estou errando",
    "Qual é meu próximo melhor passo financeiro?",
    "Explique como contador: meu dinheiro está saudável?",
    "Mostre em básico, prático e avançado",
    "Me explique com base na minha fase em Aprender",
    "Onde posso economizar mais?",
    "Minha carteira está diversificada?",
    "Previsão do meu saldo no fim do mês",
  ];

  return (
    <div id="ai-chat-container" className="flex flex-col h-full bg-[#02040a] text-white">
      {/* High-Tech Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 via-transparent to-purple-500/10">
        <div className="flex items-center gap-4">
          <div id="ai-context-indicator" className="relative p-3 bg-indigo-500/20 rounded-2xl ai-pulse-core">
            <Bot className="text-indigo-400" size={28} />
          </div>
          <div>
            <h3 className="font-black text-xl tracking-tighter text-glow">
              CENTRO DE INTELIGÊNCIA
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                SISTEMA OPERACIONAL ATIVO
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportChat}
            className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white"
          >
            Exportar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white"
          >
            Limpar
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-xl hover:bg-white/5 text-neutral-500"
            >
              <X size={20} />
            </Button>
          )}
        </div>
      </div>

      {/* Messages - Immersive Layout */}
      <div
        className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar"
        id="ai-chat-window"
      >
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
                    : "bg-white/5 border-white/10 text-neutral-500"
                }`}
              >
                {message.role === "user" ? (
                  <LucideUser size={20} />
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
                      : message.type === "insight"
                      ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-100"
                      : message.type === "recommendation"
                      ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-100"
                      : message.type === "alert"
                      ? "bg-gradient-to-br from-rose-500/10 to-red-500/10 border border-rose-500/20 text-rose-100"
                      : "bg-white/5 border border-white/10 text-neutral-400 font-sans"
                  }`}
                >
                  {message.type && message.type !== "text" && message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-3 opacity-70">
                      {message.type === "insight" && <TrendingUp size={14} />}
                      {message.type === "recommendation" && <Sparkles size={14} />}
                      {message.type === "alert" && <AlertTriangle size={14} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {message.type === "insight" && "Análise"}
                        {message.type === "recommendation" && "Recomendação"}
                        {message.type === "alert" && "Alerta"}
                      </span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium" dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(
                      message.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>'),
                      { ALLOWED_TAGS: ['strong', 'em', 'br', 'ul', 'ol', 'li', 'p'], ALLOWED_ATTR: [] }
                    )
                  }} />
                </div>
                <p className="text-[10px] font-black text-neutral-700 uppercase tracking-widest mt-2 px-1">
                  {message.timestamp.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isLoading && <AIThinkingIndicator />}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-white/10 bg-white/[0.02]" id="ai-input-area">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {suggestedQuestions.slice(0, 3).map((q) => (
              <button key={q} onClick={() => setInput(q)}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-neutral-500 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap">
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-center">
          <VoiceInput onTranscript={(text) => setInput(text)} isProcessing={isLoading} />
          <div className="relative group flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Pergunte algo..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium text-sm"
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-500 disabled:opacity-50 disabled:bg-neutral-900 transition-all">
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFinancialChat;

