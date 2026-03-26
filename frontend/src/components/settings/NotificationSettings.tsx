import React, { useState } from "react";
import { Bell } from "lucide-react";

export const NotificationSettings: React.FC = () => {
  const [notifTransactions, setNotifTransactions] = useState(true);
  const [notifBudgets, setNotifBudgets] = useState(true);
  const [notifGoals, setNotifGoals] = useState(true);
  const [notifReminders, setNotifReminders] = useState(true);

  return (
    <>
      <div className="sec-hd"><span className="sec-title">Notificações</span></div>
      <div className="card">
        <div className="tog-row" style={{ cursor: "pointer" }} onClick={() => setNotifTransactions(!notifTransactions)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}><Bell size={18} /></div>
            <div className="row-main">
              <div className="row-title">Transações</div>
              <div className="row-sub">Alertas de novas transações</div>
            </div>
          </div>
          <div className={`tog ${notifTransactions ? "on" : ""}`}></div>
        </div>

        <div className="tog-row" style={{ cursor: "pointer" }} onClick={() => setNotifBudgets(!notifBudgets)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}><Bell size={18} /></div>
            <div className="row-main">
              <div className="row-title">Orçamentos</div>
              <div className="row-sub">Alertas de limite de gastos</div>
            </div>
          </div>
          <div className={`tog ${notifBudgets ? "on" : ""}`}></div>
        </div>

        <div className="tog-row" style={{ cursor: "pointer" }} onClick={() => setNotifGoals(!notifGoals)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}><Bell size={18} /></div>
            <div className="row-main">
              <div className="row-title">Metas</div>
              <div className="row-sub">Progresso e conquistas</div>
            </div>
          </div>
          <div className={`tog ${notifGoals ? "on" : ""}`}></div>
        </div>

        <div className="tog-row" style={{ cursor: "pointer" }} onClick={() => setNotifReminders(!notifReminders)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}><Bell size={18} /></div>
            <div className="row-main">
              <div className="row-title">Lembretes</div>
              <div className="row-sub">Contas a pagar e vencimentos</div>
            </div>
          </div>
          <div className={`tog ${notifReminders ? "on" : ""}`}></div>
        </div>
      </div>
    </>
  );
};
