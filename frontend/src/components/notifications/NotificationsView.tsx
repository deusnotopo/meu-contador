import { Bell, CheckCheck, Webhook } from "lucide-react";
import type { TabType } from "@/types/navigation";
import { useFinancialAlerts } from "@/hooks/useFinancialAlerts";
import { useWebPush } from "@/hooks/useWebPush";
import { useState } from "react";

interface NotificationsViewProps {
  onBack?: (tab?: TabType) => void;
}

export const NotificationsView = ({ onBack }: NotificationsViewProps) => {
  const { alerts } = useFinancialAlerts();
  const { isSupported, isSubscribed, loading, subscribe } = useWebPush();
  const [clearedAlerts, setClearedAlerts] = useState<Set<string>>(new Set());

  // Filter out cleared alerts
  const activeAlerts = alerts.filter(a => !clearedAlerts.has(a.id));

  const handleClearAll = () => {
    const newCleared = new Set(clearedAlerts);
    activeAlerts.forEach(a => newCleared.add(a.id));
    setClearedAlerts(newCleared);
  };

  const getAlertIcon = (type: string) => {
    switch(type) {
      case "danger": return "🚨";
      case "warning": return "⚠️";
      case "success": return "⭐";
      case "info": return "💡";
      default: return "🔔";
    }
  };

  const getAlertClass = (type: string) => {
    switch(type) {
      case "danger": return "unread-red";
      case "warning": return "unread-amber";
      case "success": return "unread-green";
      case "info": return "unread-blue";
      default: return "unread";
    }
  };

  const getAlertTab = (id: string, type: string): TabType | undefined => {
    if (id.includes("budget") || type === "danger") return "planning";
    if (id.includes("savings")) return "investments";
    return undefined;
  };

  return (
    <div style={{ padding: "10px 0", animation: "fsu 0.26s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="back-btn" onClick={() => onBack?.()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.5px" }}>
            Notificações
          </div>
        </div>
        {activeAlerts.length > 0 && (
          <button
            className="btn-ghost"
            style={{ padding: "6px 12px", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
            onClick={handleClearAll}
          >
            <CheckCheck size={12} /> Marcar lidas
          </button>
        )}
      </div>

      {/* Opt-In WebPush Banner */}
      {isSupported && !isSubscribed && (
        <div style={{ background: "var(--blue-dim)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: 15, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ background: "rgba(74, 139, 255, 0.2)", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)", flexShrink: 0 }}>
              <Webhook size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>Ativar Alertas Inteligentes</div>
              <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 2, marginBottom: 10, lineHeight: 1.4 }}>
                Receba notificações importantes mesmo com o app fechado sobre orçamentos e vencimentos.
              </div>
              <button 
                onClick={subscribe}
                disabled={loading}
                className="btn-primary" 
                style={{ fontSize: 12, padding: "8px 16px", borderRadius: 20, width: "auto" }}
              >
                {loading ? "Ativando..." : "Habilitar Agora"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeAlerts.length > 0 ? (
        <>
          <div style={{ fontSize: 10, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, fontWeight: 600 }}>
            Hoje · {activeAlerts.length} novos alertas
          </div>
          {activeAlerts.map((n) => {
            const targetTab = getAlertTab(n.id, n.type);
            return (
              <div
                key={n.id}
                className={`notif-item ${getAlertClass(n.type)}`}
                onClick={() => targetTab && onBack?.(targetTab)}
                style={{ cursor: targetTab ? "pointer" : "default" }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 20, flexShrink: 0 }}>{getAlertIcon(n.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>{n.title}</div>
                      <div style={{ fontSize: 10, color: "var(--t3)" }}>Agora</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 3, lineHeight: 1.4 }}>{n.message}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 40, marginTop: 40 }}>
          <Bell size={40} style={{ color: "var(--t4)", margin: "0 auto 12px" }} />
          <div style={{ color: "var(--t3)", fontSize: 14, fontWeight: 500 }}>Tudo tranquilo por aqui</div>
          <div style={{ color: "var(--t4)", fontSize: 12, marginTop: 6 }}>Você não tem alertas pendentes.</div>
        </div>
      )}
    </div>
  );
};
