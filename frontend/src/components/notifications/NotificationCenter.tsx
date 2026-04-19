import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  BellOff,
  AlertTriangle,
  X,
  Check,
  Clock,
  Zap,
  Info,
  AlertCircle,
  TrendingUp,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useState } from "react";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { api } from "@/lib/api";

// ── Notification type → visual mapping ───────────────────────────────────────
function getTypeConfig(type: string): {
  icon: React.ReactNode;
  border: string;
  bg: string;
  badge: string;
} {
  switch (type) {
    case "spending_anomaly":
      return {
        icon: <TrendingUp className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />,
        border: "border-amber-500/30",
        bg: "bg-amber-500/5",
        badge: "bg-amber-500/20 text-amber-400",
      };
    case "budget_exceeded":
      return {
        icon: <AlertTriangle className="text-orange-400 flex-shrink-0 mt-0.5" size={18} />,
        border: "border-orange-500/30",
        bg: "bg-orange-500/5",
        badge: "bg-orange-500/20 text-orange-400",
      };
    case "goal_reached":
      return {
        icon: <Check className="text-emerald-400 flex-shrink-0 mt-0.5" size={18} />,
        border: "border-emerald-500/30",
        bg: "bg-emerald-500/5",
        badge: "bg-emerald-500/20 text-emerald-400",
      };
    case "invoice_due":
    case "reminder_due":
      return {
        icon: <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />,
        border: "border-red-500/30",
        bg: "bg-red-500/5",
        badge: "bg-red-500/20 text-red-400",
      };
    case "weekly_briefing":
    case "system_alert":
      return {
        icon: <Zap className="text-indigo-400 flex-shrink-0 mt-0.5" size={18} />,
        border: "border-indigo-500/30",
        bg: "bg-indigo-500/5",
        badge: "bg-indigo-500/20 text-indigo-400",
      };
    default:
      return {
        icon: <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />,
        border: "border-blue-500/30",
        bg: "bg-blue-500/5",
        badge: "bg-blue-500/20 text-blue-400",
      };
  }
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = Math.floor((now - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

// ── Notification card ─────────────────────────────────────────────────────────
function NotificationCard({ n, onRead, onDelete }: {
  n: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const config = getTypeConfig(n.type);
  const isUnread = !n.readAt;

  return (
    <div
      className={`
        flex items-start gap-4 p-4 rounded-2xl border transition-all
        ${config.border} ${config.bg}
        ${isUnread ? "ring-1 ring-indigo-500/40" : "opacity-70"}
      `}
    >
      {config.icon}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[var(--t1)] text-sm leading-snug mb-0.5">{n.title}</h4>
            <p className="text-[var(--t2)] text-xs leading-relaxed">{n.body}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-[10px] text-[var(--t4)]">
                <Clock size={11} />
                {formatTimeAgo(n.createdAt)}
              </span>
              {isUnread && (
                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${config.badge}`}>
                  Novo
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isUnread && (
              <button
                onClick={() => onRead(n.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--t3)] hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
                aria-label="Marcar como lida"
              >
                <Check size={14} />
              </button>
            )}
            <button
              onClick={() => onDelete(n.id)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--t4)] hover:text-red-400 hover:bg-red-400/10 transition-all"
              aria-label="Remover notificação"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    remove,
    clearRead,
    refresh,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<"notifications" | "settings">("notifications");
  const [analyzing, setAnalyzing] = useState(false);
  const [briefing, setBriefing] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    budgetAlerts: true,
    spendingAlerts: true,
    goalReminders: true,
    weeklyReports: true,
    pushNotifications: false,
  });

  const handleTriggerAnalysis = async () => {
    try {
      setAnalyzing(true);
      await api.post("/intelligence/analyze", {});
      setTimeout(() => { refresh(); setAnalyzing(false); }, 1500);
    } catch {
      setAnalyzing(false);
    }
  };

  const handleGenerateBriefing = async () => {
    try {
      setBriefing(true);
      await api.post("/intelligence/briefing", {});
      // Gemini takes 2-5s; wait 3s then refresh
      setTimeout(() => { refresh(); setBriefing(false); }, 3000);
    } catch {
      setBriefing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Bell className="text-indigo-400" size={26} />
            Centro de Alertas
          </h2>
          <p className="text-[var(--t3)] mt-1 text-sm">Alertas inteligentes e histórico persistente</p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/20 text-xs font-bold">
              {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
            </Badge>
          )}
          <button
            onClick={handleTriggerAnalysis}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all disabled:opacity-50"
            title="Executar análise de anomalias agora"
          >
            {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            Analisar
          </button>
          <button
            onClick={handleGenerateBriefing}
            disabled={briefing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-all disabled:opacity-50"
            title="Gerar briefing semanal com IA agora"
          >
            {briefing ? <Loader2 size={13} className="animate-spin" /> : <TrendingUp size={13} />}
            Briefing IA
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "notifications"
              ? "bg-white/[0.08] text-white"
              : "text-[var(--t3)] hover:text-white"
          }`}
        >
          <Bell size={14} />
          Notificações {unreadCount > 0 && `(${unreadCount})`}
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "settings"
              ? "bg-white/[0.08] text-white"
              : "text-[var(--t3)] hover:text-white"
          }`}
        >
          <Zap size={14} />
          Configurações
        </button>
      </div>

      {/* Notifications tab */}
      {activeTab === "notifications" && (
        <div className="space-y-3">
          {/* Toolbar */}
          {(notifications.length > 0) && (
            <div className="flex items-center justify-between">
              <button
                onClick={refresh}
                className="flex items-center gap-1.5 text-[10px] text-[var(--t4)] hover:text-white transition-all"
              >
                <RefreshCw size={11} />
                Atualizar
              </button>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-all"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                {notifications.some(n => !!n.readAt) && (
                  <button
                    onClick={clearRead}
                    className="text-[10px] font-bold text-[var(--t4)] hover:text-red-400 transition-all"
                  >
                    Limpar lidas
                  </button>
                )}
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--t4)]">
              <Loader2 size={28} className="animate-spin" />
              <span className="text-xs">Carregando alertas...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <BellOff size={36} className="text-[var(--t4)]" />
              <h3 className="font-bold text-[var(--t2)]">Tudo em ordem!</h3>
              <p className="text-xs text-[var(--t4)] text-center max-w-xs">
                Nenhum alerta pendente. Use o botão <strong>Analisar</strong> para verificar anomalias agora.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <NotificationCard
                  key={n.id}
                  n={n}
                  onRead={markRead}
                  onDelete={remove}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 space-y-5">
            <h3 className="text-sm font-bold text-[var(--t1)]">Preferências de Alerta</h3>

            {[
              { key: "budgetAlerts", label: "Alertas de Orçamento", desc: "Quando você ultrapassa um limite de categoria" },
              { key: "spendingAlerts", label: "Anomalias de Gasto", desc: "Picos de 50%+ acima da sua média histórica" },
              { key: "goalReminders", label: "Metas & Conquistas", desc: "Progresso e celebrações de objetivos" },
              { key: "weeklyReports", label: "Briefing Semanal IA", desc: "Resumo automatizado toda segunda-feira" },
              { key: "pushNotifications", label: "Push Notifications", desc: "Alertas no dispositivo móvel" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--t1)]">{label}</div>
                  <div className="text-[11px] text-[var(--t3)] mt-0.5">{desc}</div>
                </div>
                <Switch
                  checked={notifPrefs[key as keyof typeof notifPrefs]}
                  onCheckedChange={(checked) =>
                    setNotifPrefs(prev => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
          </div>

          {/* Anomaly Engine Info */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-amber-400" />
              <span className="text-sm font-bold text-amber-400">Motor de Anomalias Ativo</span>
            </div>
            <p className="text-xs text-[var(--t2)] leading-relaxed">
              O sistema analisa automaticamente seus gastos após cada sincronização bancária. 
              Um pico de <strong>50% acima da sua média histórica</strong> por categoria 
              gera um alerta persistente — salvo no histórico mesmo que você não esteja online.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};