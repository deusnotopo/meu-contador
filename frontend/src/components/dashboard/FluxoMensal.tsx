import React from "react";
import { BarChart } from "@/components/ui/Charts";
import { AlertCircle } from "lucide-react";
import type { TabType } from "@/types/navigation";

interface FluxoMensalProps {
  monthName: string;
  income: number;
  expense: number;
  balance: number;
  savingRate: number;
  barData: number[];
  barColors: string[];
  months: string[];
  onNavigate?: (tab: TabType) => void;
  fmt: (n: number) => string;
  error?: boolean | string | null;
}

export const FluxoMensal: React.FC<FluxoMensalProps> = ({
  monthName,
  income,
  expense,
  balance,
  savingRate,
  barData,
  barColors,
  months,
  onNavigate,
  fmt,
  error
}) => {
  if (error) {
    return (
      <>
        <div className="sec-hd">
          <span className="sec-title">Fluxo de {monthName}</span>
        </div>
        <div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--t3)" }}>
          <AlertCircle size={24} style={{ margin: "0 auto 8px auto", color: "var(--amber)" }} />
          <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--t1)", marginBottom: "4px" }}>Sem Conexão</div>
          <div style={{ fontSize: "12px", lineHeight: "1.4" }}>Não foi possível carregar o resumo mensal. Verifique sua conexão com o servidor.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sec-hd">
        <span className="sec-title">Fluxo de {monthName}</span>
        <span className="sec-link" onClick={() => onNavigate?.('personal')}>Detalhes</span>
      </div>
      <div className="metric-grid">
        <div className="metric">
          <div className="m-label">Receitas</div>
          <div className="m-val g">{fmt(income)}</div>
        </div>
        <div className="metric">
          <div className="m-label">Gastos</div>
          <div className="m-val r">{fmt(expense)}</div>
        </div>
      </div>
      <div className="metric-grid">
        <div className="metric">
          <div className="m-label">Poupado</div>
          <div className="m-val b">{fmt(balance)}</div>
          <div className="m-delta" style={{ color: "var(--t3)" }}>este mês</div>
        </div>
        <div className="metric">
          <div className="m-label">Taxa poupança</div>
          <div className="m-val b">{savingRate.toFixed(1).replace('.', ',')}%</div>
        </div>
      </div>

      {barData.length > 0 && (
        <>
          <div className="sec-hd"><span className="sec-title">Últimos {barData.length} meses</span></div>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
              <div style={{ fontSize: "10px", color: "var(--t3)", display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "8px", height: "8px", background: "var(--blue)", borderRadius: "2px", display: "inline-block" }}></span>Gastos</span>
              </div>
            </div>
            <div style={{ height: "52px", width: "100%", overflow: "hidden" }}>
              <BarChart data={barData} colors={barColors} w={318} h={52} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--t3)", fontFamily: "var(--mono)", marginTop: "4px" }}>
              {months.map((m, idx) => <span key={idx} style={{ flex: 1, textAlign: "center" }}>{m}</span>)}
            </div>
          </div>
        </>
      )}
    </>
  );
};
