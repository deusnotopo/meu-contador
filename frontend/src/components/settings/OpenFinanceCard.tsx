import React, { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { PluggyConnect } from "@/components/investments/PluggyConnect";

export const OpenFinanceCard: React.FC = () => {
  const [showPluggy, setShowPluggy] = useState(false);

  return (
    <>
      <div className="sec-hd"><span className="sec-title">Open Finance</span></div>
      <div className="card">
        {!showPluggy ? (
          <div className="row" style={{ cursor: "pointer" }} onClick={() => setShowPluggy(true)}>
            <div className="row-ico" style={{ background: "rgba(0,217,145,0.1)", color: "var(--green)" }}><ShieldCheck size={18} /></div>
            <div className="row-main">
              <div className="row-title">Conectar Contas</div>
              <div className="row-sub">Sincronização automática de dados</div>
            </div>
            <div style={{ fontSize: 10, color: "var(--blue)", fontWeight: 700, textTransform: "uppercase" }}>Gerenciar</div>
          </div>
        ) : (
          <div style={{ padding: 14, background: "var(--glass2)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--t3)" }}>
                Conexão Bancária
              </span>
              <button className="btn-ghost" style={{ padding: 4 }} onClick={() => setShowPluggy(false)}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: 11, color: "var(--t2)", marginBottom: 14, lineHeight: 1.4 }}>
              Seus dados são protegidos por criptografia de ponta a ponta.
            </p>
            <PluggyConnect onSuccess={() => setShowPluggy(false)} />
          </div>
        )}
      </div>
    </>
  );
};
