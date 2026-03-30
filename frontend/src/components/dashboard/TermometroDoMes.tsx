/**
 * TermometroDomes.tsx — "Termômetro do Mês"
 * Widget proativo que mostra o status financeiro atual do mês em tempo real.
 * Verde = no controle | Amarelo = atenção | Vermelho = ação necessária
 */

import React from "react";
import type { TabType } from "@/types/navigation";

interface TermometroProps {
  income: number;
  expense: number;
  balance: number;
  onNavigate?: (tab: TabType) => void;
}

export const TermometroDoMes: React.FC<TermometroProps> = ({
  income,
  expense,
  balance,
  onNavigate,
}) => {
  const fmt = (n: number) =>
    "R$\u00a0" + Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Calcular status
  // spendRatio unused here — logic uses adjustedRatio for day-adjusted calculation
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const monthProgress = dayOfMonth / daysInMonth;
  const budgetProgress = income > 0 ? expense / income : 0;

  // Se estamos no dia 15 (50% do mês) e já gastamos 70%, estamos no vermelho
  const adjustedRatio = budgetProgress / (monthProgress || 0.01);

  type Status = "verde" | "amarelo" | "vermelho";
  const status: Status =
    adjustedRatio <= 1.05
      ? "verde"
      : adjustedRatio <= 1.3
      ? "amarelo"
      : "vermelho";

  const statusConfig: Record<
    Status,
    { emoji: string; label: string; message: string; color: string; bg: string; border: string; action: string }
  > = {
    verde: {
      emoji: "✅",
      label: "No controle",
      message: `Você gastou ${Math.round(budgetProgress * 100)}% da sua renda em ${Math.round(monthProgress * 100)}% do mês. Ótimo ritmo!`,
      color: "var(--green)",
      bg: "rgba(0,217,145,0.06)",
      border: "rgba(0,217,145,0.2)",
      action: "Ver fluxo",
    },
    amarelo: {
      emoji: "⚠️",
      label: "Atenção",
      message: `Ritmo de gasto ${Math.round(adjustedRatio * 100 - 100)}% acima do esperado. Ainda dá para ajustar.`,
      color: "var(--amber)",
      bg: "rgba(255,173,59,0.06)",
      border: "rgba(255,173,59,0.2)",
      action: "Ver envelopes",
    },
    vermelho: {
      emoji: "🔥",
      label: "Acima do limite",
      message:
        balance < 0
          ? `Saldo negativo de ${fmt(balance)}. Hora de cortar alguns gastos.`
          : `Gastando mais rápido que o esperado. Revise seus envelopes.`,
      color: "var(--red)",
      bg: "rgba(255,79,110,0.06)",
      border: "rgba(255,79,110,0.2)",
      action: "Reorganizar",
    },
  };

  const cfg = statusConfig[status];
  const daysLeft = daysInMonth - dayOfMonth;

  return (
    <div
      onClick={() => onNavigate?.(status === "verde" ? "budget" : "envelopes")}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: "16px",
        padding: "14px 16px",
        marginBottom: "14px",
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Progress bar de fundo */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          width: `${Math.min(100, budgetProgress * 100)}%`,
          background: cfg.color,
          borderRadius: "0 0 0 16px",
          transition: "width 0.8s ease",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Indicator dot */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: `color-mix(in srgb, ${cfg.color} 15%, transparent)`,
            border: `1px solid ${cfg.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}
        >
          {cfg.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: cfg.color,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Termômetro · {cfg.label}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "var(--t3)",
                fontFamily: "var(--mono)",
              }}
            >
              {daysLeft}d restantes
            </div>
          </div>
          <div style={{ fontSize: "12px", color: "var(--t2)", marginTop: "3px", lineHeight: 1.4 }}>
            {cfg.message}
          </div>
        </div>

        <div style={{ color: "var(--t3)", flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>

      {/* Mini stats row */}
      <div
        style={{
          display: "flex",
          gap: "1px",
          marginTop: "10px",
          borderRadius: "8px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.04)",
        }}
      >
        {[
          { label: "Receita", value: fmt(income), color: "var(--green)" },
          { label: "Gasto", value: fmt(expense), color: status === "verde" ? "var(--t2)" : cfg.color },
          { label: "Saldo", value: fmt(balance), color: balance >= 0 ? "var(--green)" : "var(--red)" },
        ].map((item) => (
          <div
            key={item.label}
            style={{ flex: 1, padding: "6px 8px", textAlign: "center" }}
          >
            <div style={{ fontSize: "9px", color: "var(--t3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "2px", fontWeight: 600 }}>
              {item.label}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: item.color, fontFamily: "var(--mono)" }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
