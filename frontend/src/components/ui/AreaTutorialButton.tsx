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
    title: "Academia Financeira",
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
  if (!tutorial) return null;

  const tip = tutorial.tips[step]!;
  const total = tutorial.tips.length;

  // Close when clicking outside
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

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex", ...style }}>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(o => !o); setStep(0); }}
        aria-label={`Tutorial: ${tutorial.title}`}
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "var(--glass2)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
          color: "var(--t3)",
          fontFamily: "var(--font)",
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      >
        ?
      </button>

      {/* Tooltip card */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            right: 0,
            width: 280,
            background: "rgba(10,16,30,0.98)",
            border: "1px solid rgba(74,139,255,0.2)",
            borderRadius: 20,
            boxShadow: "0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            zIndex: 200,
            animation: "fsu 0.2s cubic-bezier(0.34,1.1,0.64,1)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "14px 16px 10px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>{tutorial.emoji}</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>{tutorial.title}</div>
            </div>
            <button
              onClick={() => { setOpen(false); setStep(0); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", padding: 2 }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Tip content */}
          <div style={{ padding: "14px 16px" }}>
            <div style={{
              display: "flex",
              gap: 10,
              marginBottom: 14,
              animation: "fsu 0.18s ease",
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(74,139,255,0.1)",
                border: "1px solid rgba(74,139,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}>
                {tip.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>{tip.title}</div>
                <div style={{ fontSize: 12, color: "var(--t3)", lineHeight: 1.55 }}>{tip.body}</div>
              </div>
            </div>

            {/* Pagination dots + nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {tutorial.tips.map((_, i) => (
                  <div
                    key={i}
                    onClick={() => setStep(i)}
                    style={{
                      width: i === step ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === step ? "var(--blue)" : "var(--glass2)",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.34,1.4,0.64,1)",
                    }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {step > 0 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    style={{
                      background: "var(--glass2)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: "5px 10px",
                      fontSize: 11,
                      color: "var(--t2)",
                      cursor: "pointer",
                      fontFamily: "var(--font)",
                    }}
                  >
                    ← Anterior
                  </button>
                )}
                {step < total - 1 ? (
                  <button
                    onClick={() => setStep(s => s + 1)}
                    style={{
                      background: "linear-gradient(135deg, #2F62D9, #5048E8)",
                      border: "none",
                      borderRadius: 8,
                      padding: "5px 10px",
                      fontSize: 11,
                      color: "#fff",
                      cursor: "pointer",
                      fontFamily: "var(--font)",
                      fontWeight: 600,
                    }}
                  >
                    Próximo →
                  </button>
                ) : tutorial.action ? (
                  <button
                    onClick={() => { onNavigate?.(tutorial.action!.tab); setOpen(false); }}
                    style={{
                      background: "linear-gradient(135deg, #00b377, #00D991)",
                      border: "none",
                      borderRadius: 8,
                      padding: "5px 10px",
                      fontSize: 11,
                      color: "#000",
                      cursor: "pointer",
                      fontFamily: "var(--font)",
                      fontWeight: 700,
                    }}
                  >
                    {tutorial.action.label} →
                  </button>
                ) : (
                  <button
                    onClick={() => { setOpen(false); setStep(0); }}
                    style={{
                      background: "linear-gradient(135deg, #2F62D9, #5048E8)",
                      border: "none",
                      borderRadius: 8,
                      padding: "5px 10px",
                      fontSize: 11,
                      color: "#fff",
                      cursor: "pointer",
                      fontFamily: "var(--font)",
                      fontWeight: 600,
                    }}
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
