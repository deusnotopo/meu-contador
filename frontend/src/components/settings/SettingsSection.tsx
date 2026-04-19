import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { loadProfile } from "@/lib/storage";
import { useWebPush } from "@/hooks/useWebPush";
import { showSuccess, showError } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/ui/HelpButton";
import { LogOut, ArrowLeft, Download, Moon, Sun, ShieldCheck, Globe, HelpCircle, Bell, BellOff, Trash2, Users, History, Edit2 } from "lucide-react";
import { BankConnectionsView } from "@/components/banking/BankConnectionsView";
import { HelpCenter } from "@/components/support/HelpCenter";
import { CollaborationPanel } from "@/components/profile/CollaborationPanel";
import { AuditLogViewer } from "@/components/profile/AuditLogViewer";
import { MFASetup } from "@/components/security/MFASetup";
import { WorkspaceManager } from "@/components/settings/WorkspaceManager";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { useState, useEffect, useCallback } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { TabType } from "@/types/navigation";

interface SettingsToggleRowProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onToggle: () => void;
}

function SettingsToggleRow({ icon, title, subtitle, checked, onToggle }: SettingsToggleRowProps) {
  return (
    <button
      type="button"
      className="flex items-center justify-between py-3 w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
      onClick={onToggle}
      role="switch"
      aria-checked={checked}
      aria-label={`${title}: ${checked ? "ativado" : "desativado"}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">{icon}</div>
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-[var(--t4)]">{subtitle}</div>
        </div>
      </div>
      <div className={`w-10 h-6 rounded-full transition-all relative ${checked ? 'bg-indigo-500' : 'bg-white/10'}`} aria-hidden="true">
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-4.5' : 'left-0.5'}`} />
      </div>
    </button>
  );
}

interface SettingsSectionProps {
  onBack?: (tab: TabType) => void;
}

export const SettingsSection = ({ onBack }: SettingsSectionProps = {}) => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const personal = useTransactions("personal");
  const business = useTransactions("business");
  const { totals: investTotals } = useInvestments();
  const { totals: debtTotals } = useDebts();
  const profile = loadProfile();
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, loading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = useWebPush();

  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [darkTheme, setDarkTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  // bioActive removido — era feature decorativa sem persistência
  // Notif toggles — persistidos no localStorage
  const [notifTransactions, setNotifTransactions] = useState(() => localStorage.getItem('notif_transactions') !== 'false');
  const [notifBudgets, setNotifBudgets] = useState(() => localStorage.getItem('notif_budgets') !== 'false');
  const [notifGoals, setNotifGoals] = useState(() => localStorage.getItem('notif_goals') !== 'false');
  const [notifReminders, setNotifReminders] = useState(() => localStorage.getItem('notif_reminders') !== 'false');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Persistir toggles no localStorage quando mudarem
  useEffect(() => { localStorage.setItem('notif_transactions', String(notifTransactions)); }, [notifTransactions]);
  useEffect(() => { localStorage.setItem('notif_budgets', String(notifBudgets)); }, [notifBudgets]);
  useEffect(() => { localStorage.setItem('notif_goals', String(notifGoals)); }, [notifGoals]);
  useEffect(() => { localStorage.setItem('notif_reminders', String(notifReminders)); }, [notifReminders]);

  // Toggle push notifications master switch
  const handlePushToggle = useCallback(async () => {
    if (!pushSupported) { showError('Push notifications não suportadas neste dispositivo.'); return; }
    if (pushSubscribed) {
      await pushUnsubscribe?.();
      showSuccess('Notificações push desativadas.');
    } else {
      await pushSubscribe();
      showSuccess('NotificaÃ§Ãµes push ativadas! ðŸ””');
    }
  }, [pushSupported, pushSubscribed, pushSubscribe, pushUnsubscribe]);

  const globalTotals = {
    income: personal.totals.income + business.totals.income,
    expense: personal.totals.expense + business.totals.expense,
    balance: personal.totals.balance + business.totals.balance,
    netWorth: (personal.totals.balance + business.totals.balance + investTotals.currentValue) - debtTotals.totalBalance,
    assets: personal.totals.balance + business.totals.balance + investTotals.currentValue,
    liabilities: debtTotals.totalBalance,
  };

  const calculateScore = () => {
    if (globalTotals.income === 0) return 0;
    const savingsRatio = globalTotals.balance / globalTotals.income;
    const debtRatio = globalTotals.liabilities / globalTotals.assets || 0;
    const score = Math.min(100, Math.max(0, Math.round((savingsRatio * 50) + ((1 - debtRatio) * 50))));
    return score;
  };

  const healthScore = calculateScore();
  const annualExpenses = globalTotals.expense * 12;
  const fireNumber = annualExpenses * 25;
  const fireProgress = fireNumber > 0 ? Math.min(100, Math.round((globalTotals.netWorth / fireNumber) * 100)) : 0;
  const daysInApp = user?.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const grossIncome = globalTotals.income;
  const netIncome = grossIncome * 0.84;
  const userAge = profile?.age || 0;
  const investorProfile = profile?.investorProfile || "Não definido";
  const investmentHorizon = profile?.investmentHorizon || "Não definido";
  const dependents = profile?.dependents || 0;

  useEffect(() => {
    const root = document.documentElement;
    if (darkTheme) {
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [darkTheme]);

  const handleBack = () => {
    if (onBack) onBack("inicio");
    else window.history.back();
  };

  return (
    <div className="p-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-xl hover:bg-white/5">
          <ArrowLeft size={16} />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">Perfil</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowEditProfile(true)} className="rounded-xl gap-1">
          <Edit2 size={14} /> Editar
        </Button>
        <HelpButton tooltipText="Gerencie sua conta, preferências e segurança" />
      </div>

      {/* Profile Hero */}
      <div className="text-center p-6 bg-white/[0.02] rounded-2xl border border-white/5 mb-5">
        <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/20">
          {user?.name?.substring(0, 2).toUpperCase() || "MC"}
        </div>
        <div className="text-lg font-bold">{user?.name || "Usuário"}</div>
        <div className="text-sm text-[var(--t3)] mt-1">{user?.email || "contato@meucontador.com"}</div>

        <div className="flex justify-center gap-2 mt-3 flex-wrap">
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold flex items-center gap-1">
            ✨ Ativo
          </span>
          {healthScore > 0 && <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">Score {healthScore}</span>}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            ["📅", daysInApp > 0 ? daysInApp.toString() : "-", "dias no app"],
            ["📊", healthScore > 0 ? healthScore.toString() : "-", "score saúde"],
            ["🎯", fireProgress > 0 ? `${fireProgress}%` : "-", "rumo FIRE"]
          ].map(([em, vl, lb], i) => (
            <div key={i} className="text-center">
              <div className="text-xl mb-1">{em}</div>
              <div className="text-lg font-bold font-mono">{vl}</div>
              <div className="text-[10px] text-[var(--t4)] mt-0.5">{lb}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Perfil Financeiro */}
      <h3 className="text-sm font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Perfil financeiro</h3>
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 mb-5 space-y-3">
        {([
          ["Renda bruta mensal", grossIncome > 0 ? `R$ ${Math.round(grossIncome).toLocaleString('pt-BR')}` : "-", null],
          ["Renda líquida", netIncome > 0 ? `R$ ${Math.round(netIncome).toLocaleString('pt-BR')}` : "-", null],
          ["Faixa etária", userAge > 0 ? `${userAge} anos` : "-", null],
          ["Perfil investidor", investorProfile, investorProfile !== "Não definido" ? "b" : null],
          ["Horizonte", investmentHorizon, investmentHorizon !== "Não definido" ? "g" : null],
          ["Dependentes", dependents > 0 ? dependents.toString() : "Nenhum", null]
        ] as [string, string, string | null][]).map(([lb, vl, badge], i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <span className="text-sm text-[var(--t2)]">{lb}</span>
            {badge ? (
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${badge === 'b' ? 'bg-blue-500/20 text-blue-400' : badge === 'g' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'}`}>{vl}</span>
            ) : (
              <span className="text-sm font-semibold text-[var(--t3)] font-mono">{vl}</span>
            )}
          </div>
        ))}
      </div>

      {/* Open Finance */}
      <h3 className="text-sm font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Open Finance</h3>
      <div className="mb-5"><BankConnectionsView /></div>

      {/* Notificações */}
      <h3 className="text-sm font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Notificações</h3>
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 mb-5 space-y-1">
        {/* Toggle master de push notifications */}
        {pushSupported && (
          <SettingsToggleRow
            icon={pushSubscribed
              ? <Bell size={16} className="text-indigo-400" />
              : <BellOff size={16} className="text-[var(--t4)]" />}
            title="Notificações Push"
            subtitle={pushSubscribed ? 'Alertas ativos no dispositivo' : 'Toque para ativar alertas'}
            checked={pushSubscribed}
            onToggle={handlePushToggle}
          />
        )}
        {(
          [
            ["Transações", "Alertas de novas transações", notifTransactions, setNotifTransactions],
            ["Orçamentos", "Alertas de limite de gastos", notifBudgets, setNotifBudgets],
            ["Metas", "Progresso e conquistas", notifGoals, setNotifGoals],
            ["Lembretes", "Contas a pagar e vencimentos", notifReminders, setNotifReminders],
          ] as [string, string, boolean, Dispatch<SetStateAction<boolean>>][]
        ).map(([title, sub, val, setVal], i) => (
          <SettingsToggleRow
            key={i}
            icon={<Bell size={16} className="text-[var(--t3)]" />}
            title={title}
            subtitle={sub}
            checked={val}
            onToggle={() => setVal(!val)}
          />
        ))}
        {pushLoading && <p className="text-[10px] text-[var(--t4)] text-center py-1">Configurando notificações...</p>}
      </div>

      {/* Configurações */}
      <h3 className="text-sm font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Configurações</h3>
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 mb-5 space-y-1">
        <SettingsToggleRow
          icon={darkTheme ? <Moon size={16} className="text-[var(--t3)]" /> : <Sun size={16} className="text-[var(--t3)]" />}
          title="Tema Visual"
          subtitle={darkTheme ? "Escuro" : "Claro"}
          checked={darkTheme}
          onToggle={() => setDarkTheme(!darkTheme)}
        />



        <button type="button" className="flex items-center justify-between py-3 w-full text-left rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70" onClick={() => setLanguage(language === "pt-BR" ? "en-US" : "pt-BR")}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"><Globe size={16} className="text-[var(--t3)]" /></div>
            <div><div className="text-sm font-medium">Idioma</div><div className="text-xs text-[var(--t4)]">{language === "pt-BR" ? "Português (BR)" : "English (US)"}</div></div>
          </div>
          <span className="text-[var(--t4)] text-sm">›</span>
        </button>

        <button type="button" className="flex items-center justify-between py-3 w-full text-left rounded-xl cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"><Download size={16} className="text-[var(--t3)]" /></div>
            <div>
              <div className="text-sm font-medium">Exportar Dados</div>
              <div className="text-xs text-[var(--t4)]">PDF · CSV · OFX</div>
            </div>
          </div>
          <span className="text-[var(--t4)] text-sm">›</span>
        </button>

        <button type="button" className="flex items-center justify-between py-3 w-full text-left rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70" onClick={() => setShowHelpCenter(true)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"><HelpCircle size={16} className="text-[var(--t3)]" /></div>
            <div><div className="text-sm font-medium">Central de Ajuda</div><div className="text-xs text-[var(--t4)]">FAQ, tutoriais e suporte</div></div>
          </div>
          <span className="text-[var(--t4)] text-sm">›</span>
        </button>
      </div>

      {/* Segurança */}
      <h3 className="text-sm font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Segurança</h3>
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 mb-5 space-y-1">
        <button type="button" className="flex items-center justify-between py-3 w-full text-left rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70" onClick={() => setShowMFA(true)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center"><ShieldCheck size={16} className="text-emerald-400" /></div>
            <div><div className="text-sm font-medium">Autenticação 2FA</div><div className="text-xs text-[var(--t4)]">Proteção adicional com SMS</div></div>
          </div>
          <span className="text-[var(--t4)] text-sm">›</span>
        </button>
      </div>

      {/* Workspaces */}
      <h3 className="text-sm font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Workspaces</h3>
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 mb-5">
        <WorkspaceManager />
      </div>

      {/* Colaboração */}
      <h3 className="text-sm font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Colaboração</h3>
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 mb-5 space-y-1">
        <button type="button" className="flex items-center justify-between py-3 w-full text-left rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70" onClick={() => setShowCollaboration(true)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center"><Users size={16} className="text-pink-400" /></div>
            <div><div className="text-sm font-medium">Espaços Colaborativos</div><div className="text-xs text-[var(--t4)]">Compartilhe dados com familiares</div></div>
          </div>
          <span className="text-[var(--t4)] text-sm">›</span>
        </button>
      </div>

      {/* Auditoria */}
      <h3 className="text-sm font-bold text-[var(--t3)] uppercase tracking-wider mb-3">Auditoria</h3>
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 mb-5 space-y-1">
        <button type="button" className="flex items-center justify-between py-3 w-full text-left rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70" onClick={() => setShowAuditLog(true)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center"><History size={16} className="text-amber-400" /></div>
            <div><div className="text-sm font-medium">Histórico de Atividades</div><div className="text-xs text-[var(--t4)]">Log de ações do workspace</div></div>
          </div>
          <span className="text-[var(--t4)] text-sm">›</span>
        </button>
      </div>

      {/* Modals */}
      {showHelpCenter && <HelpCenter onClose={() => setShowHelpCenter(false)} />}
      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
      {showCollaboration && (
        <div className="fixed inset-0 bg-black/80 z-[100] overflow-auto p-5">
          <div className="max-w-2xl mx-auto relative">
            <Button variant="ghost" size="sm" className="absolute top-3 right-3 z-[101] rounded-xl" onClick={() => setShowCollaboration(false)}>✖ Fechar</Button>
            <CollaborationPanel profile={profile || {}} onUpdate={() => {}} userId={user?.id || ""} />
          </div>
        </div>
      )}
      {showMFA && (
        <div className="fixed inset-0 bg-black/80 z-[100] overflow-auto p-5">
          <div className="max-w-lg mx-auto relative">
            <Button variant="ghost" size="sm" className="absolute top-3 right-3 z-[101] rounded-xl" onClick={() => setShowMFA(false)}>✖ Fechar</Button>
            <MFASetup />
          </div>
        </div>
      )}
      {showAuditLog && (
        <div className="fixed inset-0 bg-black/80 z-[100] overflow-auto p-5">
          <div className="max-w-2xl mx-auto relative">
            <Button variant="ghost" size="sm" className="absolute top-3 right-3 z-[101] rounded-xl" onClick={() => setShowAuditLog(false)}>✖ Fechar</Button>
            <AuditLogViewer workspaceId={profile?.currentWorkspaceId || user?.id || ""} />
          </div>
        </div>
      )}

      {/* Logout & Delete */}
      <Button variant="outline" className="w-full mb-3 text-rose-400 border-rose-500/30 hover:bg-rose-500/10" onClick={() => logout()}>
        <LogOut size={16} /> Sair da conta
      </Button>

      <Button variant="ghost" className="w-full text-[var(--t4)] hover:text-rose-400 text-xs" onClick={() => setShowDeleteConfirm(true)}>
        <Trash2 size={14} /> Excluir minha conta
      </Button>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-5">
          <div className="bg-[var(--card-obsidian)] rounded-2xl p-6 max-w-sm w-full border border-white/10">
            <div className="text-lg font-bold text-center mb-2">Excluir conta?</div>
            <div className="text-sm text-[var(--t3)] text-center mb-5">Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.</div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1" onClick={() => { setShowDeleteConfirm(false); logout(); }}>Excluir</Button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-[10px] text-[var(--t4)] mt-6 mb-10 uppercase tracking-wider">
        Versão 3.0.0 — Silicon Valley Standard
      </div>
    </div>
  );
};
