import React, { useState, useEffect } from "react";
import { Bell, Smartphone } from "lucide-react";
import { isPushSubscribed, requestPushPermission, subscribeToPush, registerPushWithBackend } from "../../lib/push";

const rowIco = "row-ico bg-[var(--glass2)]";

export const NotificationSettings: React.FC = () => {
  const [notifTransactions, setNotifTransactions] = useState(true);
  const [notifBudgets, setNotifBudgets]           = useState(true);
  const [notifGoals, setNotifGoals]               = useState(true);
  const [notifReminders, setNotifReminders]       = useState(true);
  const [pushEnabled, setPushEnabled]             = useState(false);
  const [loadingPush, setLoadingPush]             = useState(false);

  useEffect(() => { isPushSubscribed().then(setPushEnabled); }, []);

  const handleTogglePush = async () => {
    if (pushEnabled) return;
    setLoadingPush(true);
    try {
      await requestPushPermission();
      const subscription = await subscribeToPush();
      await registerPushWithBackend(subscription);
      setPushEnabled(true);
      alert("Notificações ativadas com sucesso!");
    } catch (error: unknown) {
      alert(`Falha ao ativar notificações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingPush(false);
    }
  };

  return (
    <>
      <div className="sec-hd"><span className="sec-title">Notificações</span></div>
      <div className="card">

        {/* Push */}
        <div
          className={`tog-row cursor-pointer ${loadingPush ? "loading" : ""}`}
          onClick={handleTogglePush}
        >
          <div className="flex items-center gap-3">
            <div
              className={rowIco}
              style={{ color: pushEnabled ? "var(--accent)" : "var(--t2)" }}
            >
              <Smartphone size={18} />
            </div>
            <div className="row-main">
              <div className="row-title">Alertas em Tempo Real</div>
              <div className="row-sub">
                {pushEnabled ? "Ativado neste dispositivo" : "Receba avisos no celular/desktop"}
              </div>
            </div>
          </div>
          <div className={`tog ${pushEnabled ? "on" : ""}`} />
        </div>

        <div className="h-px bg-[var(--border)] mx-4 opacity-30" />

        {/* Transações */}
        <div className="tog-row cursor-pointer" onClick={() => setNotifTransactions(!notifTransactions)}>
          <div className="flex items-center gap-3">
            <div className={`${rowIco} text-[var(--t2)]`}><Bell size={18} /></div>
            <div className="row-main">
              <div className="row-title">Transações</div>
              <div className="row-sub">Alertas de novas transações</div>
            </div>
          </div>
          <div className={`tog ${notifTransactions ? "on" : ""}`} />
        </div>

        {/* Orçamentos */}
        <div className="tog-row cursor-pointer" onClick={() => setNotifBudgets(!notifBudgets)}>
          <div className="flex items-center gap-3">
            <div className={`${rowIco} text-[var(--t2)]`}><Bell size={18} /></div>
            <div className="row-main">
              <div className="row-title">Orçamentos</div>
              <div className="row-sub">Alertas de limite de gastos</div>
            </div>
          </div>
          <div className={`tog ${notifBudgets ? "on" : ""}`} />
        </div>

        {/* Metas */}
        <div className="tog-row cursor-pointer" onClick={() => setNotifGoals(!notifGoals)}>
          <div className="flex items-center gap-3">
            <div className={`${rowIco} text-[var(--t2)]`}><Bell size={18} /></div>
            <div className="row-main">
              <div className="row-title">Metas</div>
              <div className="row-sub">Progresso e conquistas</div>
            </div>
          </div>
          <div className={`tog ${notifGoals ? "on" : ""}`} />
        </div>

        {/* Lembretes */}
        <div className="tog-row cursor-pointer" onClick={() => setNotifReminders(!notifReminders)}>
          <div className="flex items-center gap-3">
            <div className={`${rowIco} text-[var(--t2)]`}><Bell size={18} /></div>
            <div className="row-main">
              <div className="row-title">Lembretes</div>
              <div className="row-sub">Contas a pagar e vencimentos</div>
            </div>
          </div>
          <div className={`tog ${notifReminders ? "on" : ""}`} />
        </div>
      </div>
    </>
  );
};
