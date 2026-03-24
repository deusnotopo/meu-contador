import { Bell, CheckCheck } from "lucide-react";
import type { TabType } from "@/types/navigation";

interface NotificationsViewProps {
  onBack: (tab: TabType) => void;
}

type NotifType = "" | "unread" | "unread-green" | "unread-red" | "unread-amber";

interface Notif {
  ico: string;
  title: string;
  body: string;
  time: string;
  type: NotifType;
  tab?: TabType;
}

const TODAY_NOTIFS: Notif[] = [
  {
    ico: "🚨",
    title: "Entrou no vermelho",
    body: "Envelope Delivery: R$ 12 acima do limite. Toque para realocar.",
    time: "Agora",
    type: "unread-red",
    tab: "planning",
  },
  {
    ico: "🔥",
    title: "Nudge FIRE",
    body: "Você está próximo de +R$ 200/mês = 14 meses a menos para liberdade financeira.",
    time: "2h",
    type: "unread",
    tab: "investments",
  },
  {
    ico: "💡",
    title: "Oportunidade",
    body: "CDB Santander 115% CDI disponível com seu perfil de investidor.",
    time: "4h",
    type: "unread-green",
  },
];

const WEEK_NOTIFS: Notif[] = [
  {
    ico: "🎯",
    title: "Aporte automático",
    body: "R$ 1.200 transferido para Investimentos com sucesso.",
    time: "Seg",
    type: "unread-green",
  },
  {
    ico: "📊",
    title: "Relatório mensal",
    body: "Resumo de fevereiro disponível. Taxa de poupança: 30,7%.",
    time: "Seg",
    type: "",
  },
  {
    ico: "🔔",
    title: "Parcela do carro",
    body: "R$ 680 · vence amanhã. Certifique-se de ter saldo.",
    time: "Dom",
    type: "unread-amber",
  },
  {
    ico: "✅",
    title: "Check-in registrado",
    body: "Estresse financeiro: Médio. Score: 74. Continue assim!",
    time: "Sáb",
    type: "",
  },
];

export const NotificationsView = ({ onBack }: NotificationsViewProps) => {
  return (
    <div style={{ padding: "10px 0", animation: "fsu 0.26s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="back-btn" onClick={() => onBack("overview")}>←</button>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.5px" }}>
            Notificações
          </div>
        </div>
        <button
          className="btn-ghost"
          style={{ padding: "6px 12px", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
          onClick={() => {}}
        >
          <CheckCheck size={12} /> Marcar lidas
        </button>
      </div>

      {/* Today */}
      <div style={{ fontSize: 10, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontWeight: 600 }}>
        Hoje · {TODAY_NOTIFS.length} novas
      </div>
      {TODAY_NOTIFS.map((n, i) => (
        <div
          key={i}
          className={`notif-item${n.type ? ` ${n.type}` : ""}`}
          onClick={() => n.tab && onBack(n.tab)}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>{n.ico}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>{n.title}</div>
                <div style={{ fontSize: 10, color: "var(--t3)" }}>{n.time}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 3, lineHeight: 1.4 }}>{n.body}</div>
            </div>
          </div>
        </div>
      ))}

      {/* This week */}
      <div style={{ fontSize: 10, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "16px 0 10px", fontWeight: 600 }}>
        Esta semana
      </div>
      {WEEK_NOTIFS.map((n, i) => (
        <div
          key={i}
          className={`notif-item${n.type ? ` ${n.type}` : ""}`}
          onClick={() => n.tab && onBack(n.tab)}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ fontSize: 18, flexShrink: 0 }}>{n.ico}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{n.title}</div>
                <div style={{ fontSize: 10, color: "var(--t3)" }}>{n.time}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 3, lineHeight: 1.4 }}>{n.body}</div>
            </div>
          </div>
        </div>
      ))}

      {/* Empty if nothing */}
      {TODAY_NOTIFS.length === 0 && WEEK_NOTIFS.length === 0 && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Bell size={40} style={{ color: "var(--t4)", margin: "0 auto 12px" }} />
          <div style={{ color: "var(--t3)", fontSize: 13 }}>Sem notificações</div>
        </div>
      )}
    </div>
  );
};
