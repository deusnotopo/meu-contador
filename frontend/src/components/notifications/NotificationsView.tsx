import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Webhook, AlertTriangle, Info, Star, Zap,
  ArrowLeft, TrendingUp, ChevronRight, X, Plus, Calendar,
  DollarSign, Trash2, Check, BellDot,
} from "lucide-react";
import type { TabType } from "@/types/navigation";
import { useFinancialAlerts } from "@/hooks/useFinancialAlerts";
import { useWebPush } from "@/hooks/useWebPush";
import { useReminders } from "@/hooks/useReminders";
import { useNotifications } from "@/hooks/useNotifications";
import type { BillReminder } from "@/types";
import { showSuccess, showError } from "@/lib/toast";

interface NotificationsViewProps {
  onBack?: (tab?: TabType) => void;
}

const TYPE_CONFIG = {
  danger:  { icon: AlertTriangle, text: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/10", shadowType: 'rose', label: "Alerta Crítico" },
  warning: { icon: Zap,           text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/10", shadowType: 'amber', label: "Atenção" },
  success: { icon: Star,          text: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10", shadowType: 'emerald', label: "Meta Atingida" },
  info:    { icon: Info,          text: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10", shadowType: 'blue', label: "Informação" },
};

const getAlertTab = (id: string, type: string): TabType | undefined => {
  if (id.includes("budget") || type === "danger") return "planning";
  if (id.includes("savings")) return "investments";
  return undefined;
};

const RECURRING_OPTIONS = ["once", "weekly", "monthly", "yearly"] as const;
const RECURRING_LABELS: Record<string, string> = {
  once: "Uma vez", weekly: "Semanal", monthly: "Mensal", yearly: "Anual",
};

type ReminderForm = {
  name: string; amount: string; dueDate: string; category: string; recurring: string;
};
const emptyForm: ReminderForm = { name: "", amount: "", dueDate: "", category: "Moradia", recurring: "monthly" };

const CATEGORIES = ["Moradia", "Alimentação", "Transporte", "Saúde", "Educação", "Lazer", "Assinaturas", "Outros"];

// ── Reminder Row ─────────────────────────────────────────────────────────────
const ReminderRow = ({
  r,
  onRemove,
}: {
  r: BillReminder;
  onRemove: (id: string) => void;
}) => {
  const isOverdue = !r.isPaid && new Date(r.dueDate) < new Date();
  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        r.isPaid
          ? "border-white/5 bg-white/[0.02] opacity-50"
          : isOverdue
          ? "border-rose-500/20 bg-rose-500/5"
          : "border-white/[0.06] bg-white/[0.025]"
      }`}
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${r.isPaid ? "bg-emerald-400" : isOverdue ? "bg-rose-400 animate-pulse" : "bg-amber-400"}`} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-white truncate">{r.name}</div>
        <div className="text-[10px] text-neutral-500 font-mono">
          {new Date(r.dueDate + "T12:00:00").toLocaleDateString("pt-BR")} · {RECURRING_LABELS[r.recurring] || r.recurring}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[12px] font-black font-mono ${r.isPaid ? "text-emerald-400" : isOverdue ? "text-rose-400" : "text-white"}`}>
          {fmt(r.amount)}
        </span>
        {r.isPaid && <Check size={12} className="text-emerald-400" />}
        <button
          onClick={() => onRemove(r.id)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          aria-label="Excluir lembrete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
};

export const NotificationsView = ({ onBack }: NotificationsViewProps) => {
  const { alerts } = useFinancialAlerts();
  const { isSupported, isSubscribed, loading, subscribe } = useWebPush();
  const { reminders, isLoading: remLoading, addReminder, removeReminder } = useReminders();
  const {
    notifications: backendNotifs,
    unreadCount,
    markRead,
    markAllRead,
    remove: removeNotif,
  } = useNotifications();
  const [clearedAlerts, setClearedAlerts] = useState<Set<string>>(new Set());
  const [recurringAlerts, setRecurringAlerts] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<ReminderForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleRecur = (e: any) => setRecurringAlerts(e.detail);
    window.addEventListener("recurring-detected", handleRecur);
    return () => window.removeEventListener("recurring-detected", handleRecur);
  }, []);

  const activeAlerts = alerts.filter(a => !clearedAlerts.has(a.id));
  const handleClear = (id: string) => setClearedAlerts(prev => new Set([...prev, id]));
  const handleClearAll = () => {
    const newSet = new Set(clearedAlerts);
    activeAlerts.forEach(a => newSet.add(a.id));
    setClearedAlerts(newSet);
  };

  const handleSaveReminder = async () => {
    if (!form.name || !form.amount || !form.dueDate) {
      showError("Preencha nome, valor e data de vencimento.");
      return;
    }
    setSaving(true);
    try {
      await addReminder({
        name: form.name,
        amount: parseFloat(form.amount),
        dueDate: new Date(form.dueDate + "T12:00:00").toISOString(),
        category: form.category,
        isPaid: false,
        recurring: form.recurring as BillReminder["recurring"],
      });
      showSuccess(`Lembrete "${form.name}" criado!`);
      setForm(emptyForm);
      setShowAddForm(false);
    } catch {
      showError("Não foi possível criar o lembrete.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    try { await removeReminder(id); }
    catch { showError("Não foi possível excluir."); }
  };

  const containerVariants = { show: { transition: { staggerChildren: 0.08 } } };
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  return (
    <div className="pt-2 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onBack?.()}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-all pointer-events-auto cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="text-[10px] uppercase font-black tracking-[0.2em] text-blue-400/80 mb-1">Central de Inteligência</div>
            <h1 className="text-2xl font-black text-white tracking-tight">Notificações</h1>
          </div>
        </div>
        {activeAlerts.length > 0 && (
          <button
            onClick={async () => { handleClearAll(); await markAllRead(); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.08] hover:text-white transition-all pointer-events-auto cursor-pointer"
          >
            <CheckCheck size={14} /> <span>Limpar</span>
          </button>
        )}
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all cursor-pointer"
          >
            <BellDot size={14} /> <span>{unreadCount}</span>
          </button>
        )}
      </div>

      {/* ── SUMMARY STRIP ── */}
      {activeAlerts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {(["danger", "warning", "success"] as const).map(type => {
            const count = activeAlerts.filter(a => a.type === type).length;
            if (count === 0) return null;
            const cfg = TYPE_CONFIG[type];
            return (
              <div key={type} className={`card-obsidian px-4 py-3 rounded-2xl flex flex-col items-center justify-center border-white/5 ${cfg.bg}`}>
                <div className={`text-2xl font-black font-mono tracking-tighter ${cfg.text}`}>{count}</div>
                <div className={`text-[8px] font-black uppercase tracking-widest opacity-80 mt-1 text-center ${cfg.text}`}>{cfg.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── WEBPUSH CTA ── */}
      {isSupported && !isSubscribed && (
        <div className="card-obsidian p-5 rounded-3xl border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-purple-500/5 mb-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700" />
          <div className="relative z-10 flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <Webhook size={22} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-black text-white mb-1">Alertas em Tempo Real</div>
              <p className="text-xs text-white/50 leading-relaxed mb-4 max-w-sm">
                Receba insights e alertas de limite diretamente na tela bloqueada do seu celular.
              </p>
              <button
                onClick={subscribe}
                disabled={loading}
                className="pointer-events-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-50 hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] cursor-pointer"
              >
                {loading ? "Ativando..." : "Habilitar WebPush"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICAÇÕES DO SISTEMA (Real-time) ── */}
      {backendNotifs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BellDot size={14} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Histórico de Notificações</span>
              {unreadCount > 0 && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {unreadCount} novas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-blue-400/70 hover:text-blue-400 font-black uppercase tracking-widest cursor-pointer">
                Marcar todas
              </button>
            )}
          </div>
          <AnimatePresence>
            {backendNotifs.slice(0, 8).map(n => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => !n.readAt && markRead(n.id)}
                className={`flex items-start gap-3 p-3 rounded-xl mb-2 border transition-all cursor-pointer ${
                  n.readAt
                    ? 'border-white/5 bg-white/[0.02] opacity-60'
                    : 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.readAt ? 'bg-white/20' : 'bg-blue-400 animate-pulse'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-white truncate">{n.title}</div>
                  <div className="text-[11px] text-neutral-500 leading-relaxed">{n.body}</div>
                  <div className="text-[9px] text-neutral-600 mt-1">
                    {new Date(n.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); removeNotif(n.id); }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <X size={11} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── LEMBRETES DE CONTAS ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-amber-400" aria-hidden />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Lembretes de Contas</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {reminders.filter(r => !r.isPaid).length} pendentes
            </span>
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-blue-300 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all"
          >
            <Plus size={13} /> Novo
          </button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="card-obsidian rounded-2xl p-4 border border-blue-500/15 bg-gradient-to-br from-blue-500/5 to-transparent space-y-3">
                <div className="text-[11px] font-black uppercase tracking-widest text-blue-400 mb-1 flex items-center gap-2">
                  <Calendar size={12} /> Novo Lembrete
                </div>

                <input
                  type="text"
                  placeholder="Nome (ex: Netflix, Aluguel)"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-neutral-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all"
                />

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="number"
                      placeholder="Valor"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-[13px] text-white placeholder-neutral-600 outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                  <div className="relative flex-1">
                    <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-[13px] text-white outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-blue-500/50 transition-all"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    value={form.recurring}
                    onChange={e => setForm(f => ({ ...f, recurring: e.target.value }))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:border-blue-500/50 transition-all"
                  >
                    {RECURRING_OPTIONS.map(o => <option key={o} value={o}>{RECURRING_LABELS[o]}</option>)}
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setShowAddForm(false); setForm(emptyForm); }}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-neutral-400 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveReminder}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reminders list */}
        {remLoading ? (
          <div className="flex items-center gap-2 py-3 text-neutral-500 text-xs">
            <div className="w-4 h-4 rounded-full border border-white/10 border-t-amber-400 animate-spin" />
            Carregando lembretes...
          </div>
        ) : reminders.length === 0 ? (
          <p className="text-[12px] text-neutral-600 py-3">Nenhum lembrete cadastrado.</p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {reminders
                .slice()
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .map(r => (
                  <ReminderRow key={r.id} r={r} onRemove={handleRemove} />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── RECURRING SYNTHETIC ALERTS ── */}
      {recurringAlerts.map(name => (
        <motion.div
          key={`re-${name}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setRecurringAlerts(prev => prev.filter(r => r !== name))}
          className="card-obsidian pointer-events-auto cursor-pointer p-5 rounded-2xl border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent mb-4 relative overflow-hidden group"
        >
          <div className="absolute top-1/2 right-10 w-20 h-20 -translate-y-1/2 bg-purple-500/20 blur-[30px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative z-10 flex gap-4 items-start">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.15em] text-purple-400 mb-1">Assinatura Oculta Detectada</div>
              <div className="text-sm font-bold text-white mb-2 leading-tight">
                Você está pagando <span className="text-purple-300">"{name}"</span> frequentemente.
              </div>
              <p className="text-xs text-white/50 leading-relaxed font-medium">
                Nosso detector percebeu múltiplos gastos idênticos. Deseja registrar como gasto recorrente?
              </p>
            </div>
          </div>
        </motion.div>
      ))}

      {/* ── ALERT LIST (BENTO GRID) ── */}
      {activeAlerts.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-6 gap-4"
        >
          <div className="col-span-full flex items-center justify-between mt-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
              {activeAlerts.length} {activeAlerts.length === 1 ? "alerta ativo" : "alertas ativos"}
            </span>
            <span className="text-[9px] font-bold text-white/20">Modo Bento</span>
          </div>

          <AnimatePresence>
            {activeAlerts.map(n => {
              const type = (n.type in TYPE_CONFIG ? n.type : "info") as keyof typeof TYPE_CONFIG;
              const cfg = TYPE_CONFIG[type];
              const IconCmp = cfg.icon;
              const targetTab = getAlertTab(n.id, n.type);
              const isDanger = type === "danger";
              const dangerCount = activeAlerts.filter(a => a.type === "danger").length;
              const gridSpan = isDanger
                ? "md:col-span-6"
                : type === "warning" && dangerCount < 2
                ? "md:col-span-3"
                : "md:col-span-2";

              return (
                <motion.div
                  key={n.id}
                  variants={itemVariants}
                  layout
                  onClick={() => targetTab && onBack?.(targetTab)}
                  className={`
                    card-obsidian relative overflow-hidden pointer-events-auto
                    ${gridSpan}
                    ${targetTab ? "cursor-pointer group hover:-translate-y-1" : "cursor-default"}
                    border-white/5 bg-gradient-to-br from-[#0B0F19] to-[#0A0D14]
                    transition-all duration-300
                  `}
                  style={{ padding: isDanger ? '24px' : '20px' }}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-10 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none rounded-full ${cfg.bg}`} />

                  <div className={`relative z-10 flex h-full ${isDanger ? 'flex-col md:flex-row gap-6 items-start md:items-center' : 'flex-col gap-4'}`}>
                    <div className="flex items-start justify-between w-full">
                      <div className={`flex items-center justify-center shrink-0 border shadow-inner ${isDanger ? 'w-14 h-14 rounded-2xl' : 'w-10 h-10 rounded-xl'} ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                        <IconCmp size={isDanger ? 26 : 18} />
                      </div>
                      {!isDanger && (
                        <button
                          onClick={e => { e.stopPropagation(); handleClear(n.id); }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between h-full w-full">
                      <div className="mb-2">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className={`${isDanger ? 'text-lg md:text-xl' : 'text-sm'} font-black text-white leading-tight`}>
                            {n.title}
                          </h3>
                          {isDanger && (
                            <button
                              onClick={e => { e.stopPropagation(); handleClear(n.id); }}
                              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer"
                            >
                              <X size={18} />
                            </button>
                          )}
                        </div>
                        <p className={`text-xs text-white/50 leading-relaxed font-medium mt-1.5 ${isDanger ? 'max-w-xl' : ''}`}>
                          {n.message}
                        </p>
                      </div>

                      {targetTab && (
                        <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.1em] mt-auto pt-4 ${cfg.text}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${cfg.bg} ring-1 ring-[currentcolor]`} />
                          <span className="group-hover:translate-x-1 transition-transform">Agir Agora</span>
                          <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center py-16 px-6"
        >
          <div className="w-20 h-20 rounded-3xl card-obsidian border-white/5 bg-gradient-to-br from-[#0B0F19] to-transparent flex items-center justify-center shadow-inner relative mb-6">
            <div className="absolute inset-0 bg-white/5 rounded-3xl blur-[20px]" />
            <Bell size={28} className="text-white/20 relative z-10" />
          </div>
          <h2 className="text-lg font-black text-white mb-2">Monitoramento Ativo. Zero Alertas.</h2>
          <p className="text-sm font-medium text-white/40 max-w-[260px] leading-relaxed">
            Seus limites estão em ordem. Continue executando seu planejamento.
          </p>
        </motion.div>
      )}
    </div>
  );
};
