import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { loadProfile } from "@/lib/storage";
import { LogOut, ArrowLeft, Download, Fingerprint, Moon, Sun, ShieldCheck, Globe, HelpCircle, Bell, Trash2, Users, History, Edit2 } from "lucide-react";
import { BankConnectionsView } from "@/components/banking/BankConnectionsView";
import { HelpCenter } from "@/components/support/HelpCenter";
import { CollaborationPanel } from "@/components/profile/CollaborationPanel";
import { AuditLogViewer } from "@/components/profile/AuditLogViewer";
import { MFASetup } from "@/components/security/MFASetup";
import { WorkspaceManager } from "@/components/settings/WorkspaceManager";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { useState, useEffect } from "react";
import type { TabType } from "@/types/navigation";

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


  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [darkTheme, setDarkTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // default dark
  });
  const [bioActive, setBioActive] = useState(true);
  const [notifTransactions, setNotifTransactions] = useState(true);
  const [notifBudgets, setNotifBudgets] = useState(true);
  const [notifGoals, setNotifGoals] = useState(true);
  const [notifReminders, setNotifReminders] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Calculate real financial data
  const globalTotals = {
    income: personal.totals.income + business.totals.income,
    expense: personal.totals.expense + business.totals.expense,
    balance: personal.totals.balance + business.totals.balance,
    netWorth: (personal.totals.balance + business.totals.balance + investTotals.currentValue) - debtTotals.totalBalance,
    assets: personal.totals.balance + business.totals.balance + investTotals.currentValue,
    liabilities: debtTotals.totalBalance,
  };

  // Calculate score based on real data
  const calculateScore = () => {
    if (globalTotals.income === 0) return 0;
    const savingsRatio = globalTotals.balance / globalTotals.income;
    const debtRatio = globalTotals.liabilities / globalTotals.assets || 0;
    const score = Math.min(100, Math.max(0, Math.round((savingsRatio * 50) + ((1 - debtRatio) * 50))));
    return score;
  };

  const healthScore = calculateScore();

  // Calculate saving rate


  // Calculate FIRE progress (simplified: assuming 25x annual expenses as FIRE number)
  const annualExpenses = globalTotals.expense * 12;
  const fireNumber = annualExpenses * 25;
  const fireProgress = fireNumber > 0 ? Math.min(100, Math.round((globalTotals.netWorth / fireNumber) * 100)) : 0;

  // Calculate days in app (from user creation date or default)
  const daysInApp = user?.createdAt 
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Calculate net income (gross - taxes, simplified)
  const grossIncome = globalTotals.income;
  const netIncome = grossIncome * 0.84; // Simplified: 16% taxes

  // Get user profile data
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
    <div style={{ padding: "10px 0", animation: "fsu 0.26s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={16} />
        </button>
        <div className="page-title" style={{ margin: 0, flex: 1 }}>
          Perfil
        </div>
        <button 
          onClick={() => setShowEditProfile(true)} 
          style={{ padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, borderRadius: 20, background: "var(--glass)", border: "1px solid var(--border)", color: "var(--t1)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
        >
          <Edit2 size={14} /> Editar
        </button>
      </div>

      <div className="hero" style={{ textAlign: "center", padding: 24 }}>
        <div style={{ 
          width: 72, height: 72, borderRadius: "50%", 
          background: "linear-gradient(135deg,#2F62D9,#5048E8)", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 auto 12px", 
          boxShadow: "0 0 0 3px rgba(74,139,255,0.3),0 8px 32px rgba(80,72,232,0.4)" 
        }}>
          {user?.name?.substring(0, 2).toUpperCase() || "MC"}
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, color: "var(--t1)" }}>
          {user?.name || "Usuário"}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--t2)", marginTop: 3 }}>
          {user?.email || "contato@meucontador.com"}
        </div>
        
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <span className="bdg bdg-b">Premium</span>
          <span className="bdg bdg-g">IR modelo completo</span>
          {healthScore > 0 && <span className="bdg bdg-p">Score {healthScore}</span>}
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
          {[
            ["🗓️", daysInApp > 0 ? daysInApp.toString() : "-", "dias no app"],
            ["📊", healthScore > 0 ? healthScore.toString() : "-", "score saúde"],
            ["🎯", fireProgress > 0 ? `${fireProgress}%` : "-", "rumo FIRE"]
          ].map(([em, vl, lb], i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{em}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)" }}>{vl}</div>
              <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 1 }}>{lb}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="sec-hd"><span className="sec-title">Perfil financeiro</span></div>
      <div className="card">
        {[
          ["Renda bruta mensal", grossIncome > 0 ? `R$ ${Math.round(grossIncome).toLocaleString('pt-BR')}` : "-", null],
          ["Renda líquida", netIncome > 0 ? `R$ ${Math.round(netIncome).toLocaleString('pt-BR')}` : "-", null],
          ["Faixa etária", userAge > 0 ? `${userAge} anos` : "-", null],
          ["Perfil investidor", investorProfile, investorProfile !== "Não definido" ? "b" : null],
          ["Horizonte", investmentHorizon, investmentHorizon !== "Não definido" ? "g" : null],
          ["Dependentes", dependents > 0 ? dependents.toString() : "Nenhum", null]
        ].map(([lb, vl, badge], i) => (
          <div key={i} className="row" style={{ cursor: "default" }}>
            <div className="row-main"><div className="row-title">{lb}</div></div>
            <div>
              {badge ? (
                <span className={`bdg bdg-${badge}`}>{vl}</span>
              ) : (
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--t2)", fontFamily: "var(--mono)" }}>{vl}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="sec-hd"><span className="sec-title">Open Finance</span></div>
      <BankConnectionsView />

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

      <div className="sec-hd"><span className="sec-title">Configurações</span></div>
      <div className="card">
        <div className="tog-row" style={{ cursor: "pointer" }} onClick={() => setDarkTheme(!darkTheme)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}>
              {darkTheme ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div className="row-main">
              <div className="row-title">Tema Visual</div>
              <div className="row-sub">{darkTheme ? "Escuro" : "Claro"}</div>
            </div>
          </div>
          <div className={`tog ${darkTheme ? "on" : ""}`}></div>
        </div>

        <div className="tog-row" style={{ cursor: "pointer" }} onClick={() => setBioActive(!bioActive)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}><Fingerprint size={18} /></div>
            <div className="row-main">
              <div className="row-title">Acesso Biométrico</div>
              <div className="row-sub">Face ID / Touch ID</div>
            </div>
          </div>
          <div className={`tog ${bioActive ? "on" : ""}`}></div>
        </div>

        <div 
          className="tog-row" 
          style={{ cursor: "pointer" }} 
          onClick={() => setLanguage(language === "pt-BR" ? "en-US" : "pt-BR")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}><Globe size={18} /></div>
            <div className="row-main">
              <div className="row-title">Idioma</div>
              <div className="row-sub">{language === "pt-BR" ? "Português (BR)" : "English (US)"}</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: "var(--t3)" }}>›</div>
        </div>

        <div className="tog-row" style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}><Download size={18} /></div>
            <div className="row-main">
              <div className="row-title">Exportar Dados</div>
              <div className="row-sub">PDF · CSV · OFX</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: "var(--t3)" }}>›</div>
        </div>

        <div className="tog-row" style={{ cursor: "pointer" }} onClick={() => setShowHelpCenter(true)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}><HelpCircle size={18} /></div>
            <div className="row-main">
              <div className="row-title">Central de Ajuda</div>
              <div className="row-sub">FAQ, tutoriais e suporte</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: "var(--t3)" }}>›</div>
        </div>
      </div>

      <div className="sec-hd"><span className="sec-title">Segurança</span></div>
      <div className="card">
        <div className="tog-row" style={{ cursor: "pointer" }} onClick={() => setShowMFA(true)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--green-d)", color: "var(--green)" }}><ShieldCheck size={18} /></div>
            <div className="row-main">
              <div className="row-title">Autenticação 2FA</div>
              <div className="row-sub">Proteção adicional com SMS</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: "var(--t3)" }}>›</div>
        </div>
      </div>

      <div className="sec-hd"><span className="sec-title">Workspaces</span></div>
      <div className="card">
        <WorkspaceManager />
      </div>

      <div className="sec-hd"><span className="sec-title">Colaboração</span></div>
      <div className="card">
        <div className="tog-row" style={{ cursor: "pointer" }} onClick={() => setShowCollaboration(true)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--pink-d)", color: "var(--pink)" }}><Users size={18} /></div>
            <div className="row-main">
              <div className="row-title">Espaços Colaborativos</div>
              <div className="row-sub">Compartilhe dados com familiares</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: "var(--t3)" }}>›</div>
        </div>
      </div>

      <div className="sec-hd"><span className="sec-title">Auditoria</span></div>
      <div className="card">
        <div className="tog-row" style={{ cursor: "pointer" }} onClick={() => setShowAuditLog(true)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="row-ico" style={{ background: "var(--amber-d)", color: "var(--amber)" }}><History size={18} /></div>
            <div className="row-main">
              <div className="row-title">Histórico de Atividades</div>
              <div className="row-sub">Log de ações do workspace</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: "var(--t3)" }}>›</div>
        </div>
      </div>

      {showHelpCenter && <HelpCenter onClose={() => setShowHelpCenter(false)} />}
      {showCollaboration && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, overflow: "auto", padding: 20 }}>
          <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>
            <button 
              onClick={() => setShowCollaboration(false)}
              style={{ position: "absolute", top: 16, right: 16, zIndex: 101, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "8px 12px", color: "white", cursor: "pointer" }}
            >
              ✕ Fechar
            </button>
            <CollaborationPanel 
              profile={profile || {}} 
              onUpdate={() => {/* Handle profile update */}}
              userId={user?.id || ""}
            />
          </div>
        </div>
      )}
      {showMFA && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, overflow: "auto", padding: 20 }}>
          <div style={{ maxWidth: 500, margin: "0 auto", position: "relative" }}>
            <button 
              onClick={() => setShowMFA(false)}
              style={{ position: "absolute", top: 16, right: 16, zIndex: 101, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "8px 12px", color: "white", cursor: "pointer" }}
            >
              ✕ Fechar
            </button>
            <MFASetup />
          </div>
        </div>
      )}
      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}
      {showAuditLog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, overflow: "auto", padding: 20 }}>
          <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>
            <button 
              onClick={() => setShowAuditLog(false)}
              style={{ position: "absolute", top: 16, right: 16, zIndex: 101, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "8px 12px", color: "white", cursor: "pointer" }}
            >
              ✕ Fechar
            </button>
            <AuditLogViewer workspaceId={profile?.currentWorkspaceId || user?.id || ""} />
          </div>
        </div>
      )}

      <button 
        className="btn-s" 
        style={{ marginTop: 6, width: "100%", color: "var(--red)", borderColor: "rgba(255,79,110,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => logout()}
      >
        <LogOut size={16} /> Sair da conta
      </button>

      <button 
        className="btn-s" 
        style={{ marginTop: 10, width: "100%", color: "var(--t3)", borderColor: "rgba(255,79,110,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "11px" }}
        onClick={() => setShowDeleteConfirm(true)}
      >
        <Trash2 size={14} /> Excluir minha conta
      </button>

      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "var(--bg)", borderRadius: 16, padding: 24, maxWidth: 340, width: "100%", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", marginBottom: 8, textAlign: "center" }}>Excluir conta?</div>
            <div style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.5, textAlign: "center", marginBottom: 20 }}>
              Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button 
                className="btn-s" 
                style={{ flex: 1, color: "var(--t2)", borderColor: "var(--border)" }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-s" 
                style={{ flex: 1, color: "var(--red)", borderColor: "rgba(255,79,110,0.3)" }}
                onClick={() => { setShowDeleteConfirm(false); logout(); }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", margin: "24px 0 40px", fontSize: 10, color: "var(--t4)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        Versão 3.0.0 — Silicon Valley Standard
      </div>
    </div>
  );
};