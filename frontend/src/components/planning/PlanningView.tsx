import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BudgetsSection } from "../personal/BudgetsSection";
import { GoalsSection } from "../personal/GoalsSection";

export const PlanningView = () => {
  const [tab, setTab] = useState<"envelopes" | "metas">("envelopes");

  return (
    <div style={{ padding: "10px 0", animation: "fsu 0.26s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "0 16px" }}>
        <button className="back-btn" onClick={() => window.history.back()}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.5px" }}>
          Financeiro
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Tab nav */}
        <div className="tnav" style={{ marginBottom: 12 }}>
          <button className={`tnav-i ${tab === "envelopes" ? "active" : ""}`} onClick={() => setTab("envelopes")}>
            Envelopes
          </button>
          <button className={`tnav-i ${tab === "metas" ? "active" : ""}`} onClick={() => setTab("metas")}>
            Metas
          </button>
        </div>

        {tab === "envelopes" && <BudgetsSection />}
        {tab === "metas" && (
          <div style={{ marginTop: 20 }}>
            <GoalsSection />
          </div>
        )}
      </div>
    </div>
  );
};
