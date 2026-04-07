import React, { useState, useEffect } from "react";
import { Bell, Smartphone } from "lucide-react";
import { isPushSubscribed, requestPushPermission, subscribeToPush, registerPushWithBackend } from "../../lib/push";

export const NotificationSettings: React.FC = () => {
  const [notifTransactions, setNotifTransactions] = useState(true);
  const [notifBudgets, setNotifBudgets] = useState(true);
  const [notifGoals, setNotifGoals] = useState(true);
  const [notifReminders, setNotifReminders] = useState(true);
  
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);

  useEffect(() => {
    isPushSubscribed().then(setPushEnabled);
  }, []);

  const handleTogglePush = async () => {
    if (pushEnabled) return; // Por enquanto não implementamos desativar aqui (precisaria de rota de unsubscribe)
    
    setLoadingPush(true);
    try {
      await requestPushPermission();
      const subscription = await subscribeToPush();
      await registerPushWithBackend(subscription);
      setPushEnabled(true);
      alert('Notificações ativadas com sucesso!');
    } catch (error: any) {
      alert(`Falha ao ativar notificações: ${error.message}`);
    } finally {
      setLoadingPush(false);
    }
  };

  return (
    <>
      <div className="sec-hd"><span className="sec-title">Notificações</span></div>
      <div className="card">
        {/* Push Notification Toggle (Novo) */}
        <div className={`tog-row ${loadingPush ? 'loading' : ''}`} style={{ cursor: "pointer" }} onClick={handleTogglePush}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: pushEnabled ? "var(--accent)" : "var(--t2)" }}>
              <Smartphone size={18} />
            </div>
            <div className="row-main">
              <div className="row-title">Alertas em Tempo Real</div>
              <div className="row-sub">{pushEnabled ? "Ativado neste dispositivo" : "Receba avisos no celular/desktop"}</div>
            </div>
          </div>
          <div className={`tog ${pushEnabled ? "on" : ""}`}></div>
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "0 16px", opacity: 0.3 }}></div>

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
