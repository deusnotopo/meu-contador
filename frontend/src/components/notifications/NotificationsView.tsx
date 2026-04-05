import { Bell, CheckCheck, Webhook, AlertTriangle, Info, Star, Zap, ArrowLeft, TrendingUp } from "lucide-react";
import type { TabType } from "@/types/navigation";
import { useFinancialAlerts } from "@/hooks/useFinancialAlerts";
import { useWebPush } from "@/hooks/useWebPush";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationsViewProps {
  onBack?: (tab?: TabType) => void;
}

const TYPE_CONFIG = {
  danger:  { icon: AlertTriangle, color: "var(--red)",   bg: "rgba(255,79,110,0.08)",   border: "rgba(255,79,110,0.18)",  label: "Alerta Crítico" },
  warning: { icon: Zap,           color: "var(--amber)", bg: "rgba(255,173,59,0.08)",   border: "rgba(255,173,59,0.18)", label: "Atenção" },
  success: { icon: Star,          color: "var(--green)", bg: "rgba(0,217,145,0.08)",    border: "rgba(0,217,145,0.18)",  label: "Meta atingida" },
  info:    { icon: Info,          color: "var(--blue)",  bg: "rgba(74,139,255,0.08)",   border: "rgba(74,139,255,0.18)", label: "Informação" },
};

const getAlertTab = (id: string, type: string): TabType | undefined => {
  if (id.includes("budget") || type === "danger") return "planning";
  if (id.includes("savings")) return "investments";
  return undefined;
};

export const NotificationsView = ({ onBack }: NotificationsViewProps) => {
  const { alerts } = useFinancialAlerts();
  const { isSupported, isSubscribed, loading, subscribe } = useWebPush();
  const [clearedAlerts, setClearedAlerts] = useState<Set<string>>(new Set());
  const [recurringAlerts, setRecurringAlerts] = useState<string[]>([]);

  useEffect(() => {
    const handleRecur = (e: any) => setRecurringAlerts(e.detail);
    window.addEventListener("recurring-detected", handleRecur);
    return () => window.removeEventListener("recurring-detected", handleRecur);
  }, []);

  const activeAlerts = alerts.filter(a => !clearedAlerts.has(a.id));

  const handleClear = (id: string) => {
    setClearedAlerts(prev => new Set([...prev, id]));
  };

  const handleClearAll = () => {
    const newSet = new Set(clearedAlerts);
    activeAlerts.forEach(a => newSet.add(a.id));
    setClearedAlerts(newSet);
  };

  return (
    <div style={{ paddingTop: 10, paddingBottom: 100, animation: "fsu 0.26s ease" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="back-btn" onClick={() => onBack?.()}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="eyebrow" style={{ color: "var(--purple)" }}>Central de Alertas</div>
            <div className="page-title" style={{ margin: 0, fontSize: 22 }}>Notificações</div>
          </div>
        </div>
        {activeAlerts.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: "6px 12px", color: "var(--t2)",
              fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em"
            }}
          >
            <CheckCheck size={12} /> Limpar tudo
          </button>
        )}
      </div>

      {/* ── Summary Strip (if has alerts) ── */}
      {activeAlerts.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginBottom: 20
        }}>
          {(["danger", "warning", "success"] as const).map(type => {
            const count = activeAlerts.filter(a => a.type === type).length;
            if (count === 0) return null;
            const cfg = TYPE_CONFIG[type];
            return (
              <div key={type} style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: 14,
                padding: "10px 12px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: cfg.color, fontFamily: "var(--mono)" }}>{count}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>{cfg.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── WebPush opt-in ── */}
      {isSupported && !isSubscribed && (
        <div style={{
          background: "linear-gradient(135deg, rgba(155,127,255,0.06), rgba(74,139,255,0.04))",
          border: "1px solid rgba(155,127,255,0.15)",
          borderRadius: 20, padding: 16, marginBottom: 20
        }}>
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%", background: "rgba(155,127,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)", flexShrink: 0
            }}>
              <Webhook size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>Ativar Alertas em Tempo Real</div>
              <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.4, marginBottom: 12 }}>
                Receba avisos instantâneos de limites excedidos e insights da inteligência diretamente no seu celular.
              </div>
              <button
                onClick={subscribe}
                disabled={loading}
                style={{
                  background: "var(--t1)", color: "var(--bg)", border: "none",
                  padding: "8px 16px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", transition: "opacity 0.2s",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Ativando..." : "Habilitar WebPush"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recurring Synthetic Alerts ── */}
      {recurringAlerts.map(name => (
        <motion.div
           key={`re-${name}`}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           style={{
             background: 'linear-gradient(135deg, rgba(80,72,232,0.1), rgba(155,127,255,0.02))',
             border: '1px solid rgba(155,127,255,0.3)',
             borderRadius: '20px',
             padding: '16px',
             marginBottom: '16px',
             cursor: 'pointer'
           }}
           onClick={() => setRecurringAlerts(prev => prev.filter(r => r !== name))}
        >
          <div className="flex gap-4 items-start">
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px", background: "rgba(155,127,255,0.15)", border: "1px solid rgba(155,127,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "var(--purple)", flexShrink: 0
            }}>
              <TrendingUp size={20} />
            </div>
            <div>
               <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--purple)", marginBottom: "4px" }}>
                 Assinatura Oculta Detectada
               </div>
               <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--t1)", marginBottom: "4px", lineHeight: 1.3 }}>
                 Você está pagando "{name}" frequentemente.
               </div>
               <div style={{ fontSize: "12px", color: "var(--t3)", lineHeight: 1.5 }}>
                 Nosso detector percebeu múltiplos gastos idênticos. Deseja registrar isso como um gasto recorrente no seu fluxo de caixa mensal?
               </div>
            </div>
          </div>
        </motion.div>
      ))}


      {/* ── Alert List ── */}
      {activeAlerts.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{
            fontSize: 10, color: "var(--t3)", textTransform: "uppercase",
            letterSpacing: "0.12em", fontWeight: 700, marginBottom: 4
          }}>
            {activeAlerts.length} {activeAlerts.length === 1 ? "alerta ativo" : "alertas ativos"}
          </div>
          <AnimatePresence>
            {activeAlerts.map((n, idx) => {
              const type = (n.type in TYPE_CONFIG ? n.type : "info") as keyof typeof TYPE_CONFIG;
              const cfg = TYPE_CONFIG[type];
              const IconCmp = cfg.icon;
              const targetTab = getAlertTab(n.id, n.type);

              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.22, delay: idx * 0.04 }}
                  style={{
                    background: cfg.bg,
                    border: `1px solid ${cfg.border}`,
                    borderRadius: 18,
                    padding: "14px 16px",
                    cursor: targetTab ? "pointer" : "default",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                  onClick={() => targetTab && onBack?.(targetTab)}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: `${cfg.color}18`,
                    border: `1px solid ${cfg.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: cfg.color, flexShrink: 0
                  }}>
                    <IconCmp size={17} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>{n.title}</div>
                      <button
                        onClick={e => { e.stopPropagation(); handleClear(n.id); }}
                        style={{
                          background: "transparent", border: "none",
                          color: "var(--t4)", fontSize: 16, cursor: "pointer",
                          flexShrink: 0, lineHeight: 1, padding: "0 2px"
                        }}
                      >×</button>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 4, lineHeight: 1.5 }}>{n.message}</div>
                    {targetTab && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 10, color: cfg.color, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 8
                      }}>
                        <TrendingUp size={10} /> Ver detalhes
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: "center",
            padding: "60px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: 24,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bell size={30} style={{ color: "var(--t4)" }} />
          </div>
          <div style={{ color: "var(--t2)", fontSize: 16, fontWeight: 700 }}>Tudo tranquilo</div>
          <div style={{ color: "var(--t3)", fontSize: 13, lineHeight: 1.5, maxWidth: 240 }}>
            Sem alertas pendentes. Você está no controle das suas finanças.
          </div>
        </motion.div>
      )}
    </div>
  );
};
