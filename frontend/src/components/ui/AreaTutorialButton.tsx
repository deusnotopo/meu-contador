import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { TabType } from "@/types/navigation";

// ── Tutorial content database, one entry per area ─────────────────────────
const TUTORIALS: Record<string, {
  title: string;
  emoji: string;
  tips: { icon: string; title: string; body: string }[];
  action?: { label: string; tab: TabType };
}> = {
  inicio: {
    title: "Início — Seu Painel",
    emoji: "🏠",
    tips: [
      { icon: "💰", title: "Patrimônio líquido", body: "A diferença entre seus ativos (o que você tem) e passivos (o que deve). Objetivo: crescer esse número todo mês." },
      { icon: "📊", title: "Score de saúde", body: "Uma nota de 0–100 que reflete sua situação financeira. É calculado com base em reserva de emergência, dívidas e hábitos de gasto." },
      { icon: "🚀", title: "Ações rápidas", body: "Use os 4 botões abaixo do hero para navegar rápido: Lançar, Extrato, Investir e Metas." },
    ],
  },
  budget: {
    title: "Budget — Controle",
    emoji: "📊",
    tips: [
      { icon: "🗂️", title: "Método das categorias", body: "Organize seus gastos por categoria (Moradia, Alimentação, etc.) para visualizar onde seu dinheiro está indo." },
      { icon: "🎯", title: "Meta por categoria", body: "Defina um teto de gasto mensal para cada categoria. O app avisa quando você estiver próximo do limite." },
      { icon: "📈", title: "Análise de tendências", body: "Compare mês a mês automaticamente. Veja quais categorias estão crescendo ou diminuindo." },
    ],
    action: { label: "Lançar transação", tab: "launch" },
  },
  caixa: {
    title: "Extrato — Caixa",
    emoji: "📋",
    tips: [
      { icon: "🔍", title: "Filtros inteligentes", body: "Filtre por período, categoria ou tipo (receita/gasto) para encontrar qualquer lançamento rapidamente." },
      { icon: "✏️", title: "Editar lançamentos", body: "Toque em qualquer transação para editar descrição, categoria ou valor. Mantenha seus dados sempre corretos." },
      { icon: "🔄", title: "Transações recorrentes", body: "Marque contas fixas como recorrentes e o app lança automaticamente todo mês." },
    ],
  },
  investir: {
    title: "Investimentos",
    emoji: "📈",
    tips: [
      { icon: "🌍", title: "Diversificação", body: "Distribua seu dinheiro entre diferentes classes de ativos (renda fixa, variável, internacional) para reduzir riscos." },
      { icon: "💎", title: "Juros compostos", body: "Pequenos aportes consistentes valem mais do que grandes aportes esporádicos. O tempo é seu maior aliado." },
      { icon: "📊", title: "Rentabilidade real", body: "O app desconta a inflação para mostrar o quanto você realmente ganhou. CDI nominal ≠ ganho real." },
    ],
    action: { label: "Ver carteira", tab: "investments" },
  },
  futuro: {
    title: "Futuro & Aposentadoria",
    emoji: "🎯",
    tips: [
      { icon: "🔥", title: "Método FIRE", body: "Financial Independence, Retire Early. Objetivo: acumular 25× seus gastos anuais para viver de renda." },
      { icon: "📅", title: "Projeção de aposentadoria", body: "Simule quanto você precisa poupar por mês para se aposentar na data desejada com a renda que quer." },
      { icon: "🎯", title: "Metas financeiras", body: "Defina metas concretas (comprar casa, viagem, faculdade dos filhos) com data e valor. O app acompanha o progresso." },
    ],
    action: { label: "Simular aposentadoria", tab: "retire_proj" },
  },
  academia: {
    title: "Aprender Finanças",
    emoji: "🎓",
    tips: [
      { icon: "📚", title: "Trilha de aprendizado", body: "Conteúdo organizado do básico ao avançado. Do controle de gastos a investimentos em ações internacionais." },
      { icon: "🤖", title: "IA Consultora", body: "Faça qualquer pergunta financeira para sua IA pessoal. Ela conhece seus dados e dá respostas personalizadas." },
      { icon: "⚡", title: "Aprenda fazendo", body: "Cada lição tem exercícios práticos que você aplica direto no app. Teoria + prática juntos." },
    ],
    action: { label: "Falar com IA", tab: "ai" },
  },
  envelopes: {
    title: "Método dos Envelopes",
    emoji: "✉️",
    tips: [
      { icon: "✉️", title: "Como funciona", body: "Separe seu dinheiro em envelopes virtuais por categoria no início do mês. Quando o envelope esvazia, parou." },
      { icon: "🎯", title: "Disciplina automática", body: "O método força você a planejar antes de gastar, não depois. É mais eficaz que monitorar gastos passados." },
      { icon: "🔄", title: "Restos do mês", body: "Sobrou dinheiro em algum envelope? Transfira para a reserva de emergência ou para investimentos." },
    ],
  },
  planning: {
    title: "Planejamento Financeiro",
    emoji: "🗺️",
    tips: [
      { icon: "📅", title: "Plano anual", body: "Projeção dos próximos 12 meses com base nos seus gastos atuais e metas definidas." },
      { icon: "⚠️", title: "Alertas preditivos", body: "O app identifica meses onde você pode ficar no vermelho antes de acontecer e sugere ajustes." },
      { icon: "🎉", title: "Gastos sazonais", body: "IPVA, IPTU, férias, Natal — o app já considera esses gastos no planejamento anual." },
    ],
  },
};

interface AreaTutorialButtonProps {
  area: keyof typeof TUTORIALS;
  onNavigate?: (tab: TabType) => void;
  style?: React.CSSProperties;
}

export const AreaTutorialButton = ({ area, onNavigate, style }: AreaTutorialButtonProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const tutorial = TUTORIALS[area];
  const total = tutorial?.tips.length ?? 0;
  const tip = tutorial?.tips[step];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setStep(0);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!tutorial || !tip) return null;

  // Shared button class strings
  const navBtnBase = "rounded-lg px-2.5 py-[5px] text-[11px] cursor-pointer border-none font-[var(--font)] font-semibold";

  return (
    <div ref={ref} className="relative inline-flex" style={style}>
      {/* Trigger */}
      <button
        onClick={() => { setOpen(o => !o); setStep(0); }}
        aria-label={`Tutorial: ${tutorial.title}`}
        className="w-[26px] h-[26px] rounded-full bg-[var(--glass2)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[12px] font-bold text-[var(--t3)] shrink-0 transition-all duration-200 hover:border-blue-400/40 hover:text-white"
      >
        ?
      </button>

      {/* Tooltip card */}
      {open && (
        <div
          className="absolute bottom-[calc(100%+10px)] right-0 w-[280px] rounded-[20px] overflow-hidden z-[200] animate-[fsu_0.2s_cubic-bezier(0.34,1.1,0.64,1)]"
          style={{
            background: "rgba(10,16,30,0.98)",
            border: "1px solid rgba(74,139,255,0.2)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div className="px-4 pt-3.5 pb-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">{tutorial.emoji}</span>
              <div className="text-[13px] font-bold text-[var(--t1)]">{tutorial.title}</div>
            </div>
            <button
              onClick={() => { setOpen(false); setStep(0); }}
              className="bg-transparent border-none cursor-pointer text-[var(--t3)] p-0.5 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Tip content */}
          <div className="p-4">
            <div className="flex gap-2.5 mb-3.5 animate-[fsu_0.18s_ease]">
              <div className="w-9 h-9 rounded-[10px] bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-[18px] shrink-0">
                {tip.icon}
              </div>
              <div>
                <div className="text-[13px] font-bold text-[var(--t1)] mb-1">{tip.title}</div>
                <div className="text-[12px] text-[var(--t3)] leading-[1.55]">{tip.body}</div>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="flex gap-[5px]">
                {tutorial.tips.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setStep(i)}
                    className="h-[6px] rounded-[3px] cursor-pointer transition-all duration-300"
                    style={{
                      width: i === step ? 16 : 6,
                      background: i === step ? "var(--blue)" : "var(--glass2)",
                    }}
                  />
                ))}
              </div>

              <div className="flex gap-1.5 items-center">
                {step > 0 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className={`${navBtnBase} bg-[var(--glass2)] border border-[var(--border)] text-[var(--t2)]`}
                  >
                    ← Anterior
                  </button>
                )}
                {step < total - 1 ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    className={`${navBtnBase} bg-gradient-to-br from-[#2F62D9] to-[#5048E8] text-white`}
                  >
                    Próximo →
                  </button>
                ) : tutorial.action ? (
                  <button
                    onClick={() => { onNavigate?.(tutorial.action!.tab); setOpen(false); }}
                    className={`${navBtnBase} bg-gradient-to-br from-[#00b377] to-[#00D991] text-black font-bold`}
                  >
                    {tutorial.action.label} →
                  </button>
                ) : (
                  <button
                    onClick={() => { setOpen(false); setStep(0); }}
                    className={`${navBtnBase} bg-gradient-to-br from-[#2F62D9] to-[#5048E8] text-white`}
                  >
                    Entendido ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
