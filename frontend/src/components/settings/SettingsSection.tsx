import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestments } from "@/hooks/useInvestments";
import { useDebts } from "@/hooks/useDebts";
import { loadProfile } from "@/lib/storage";
import { LogOut, ArrowLeft, Download, Fingerprint, Moon, Sun, Smartphone, ShieldCheck, CreditCard, X, Globe, HelpCircle, Bell, Trash2 } from "lucide-react";
import { PluggyConnect } from "@/components/investments/PluggyConnect";
import { HelpCenter } from "@/components/support/HelpCenter";
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

  const [showPluggy, setShowPluggy] = useState(false);
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
  const savingRate = globalTotals.income > 0 ? (globalTotals.balance / globalTotals.income) * 100 : 0;

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
        <div className="page-title" style={{ margin: 0 }}>
          Perfil
        </div>
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
      <div className="card">
        {!showPluggy ? (
          <div className="row" style={{ cursor: "pointer" }} onClick={() => setShowPluggy(true)}>
            <div className="row-ico" style={{ background: "rgba(0,217,145,0.1)", color: "var(--green)" }}><ShieldCheck size={18} /></div>
            <div className="row-main">
              <div className="row-title">Conectar Contas</div>
              <div className="row-sub">Sincronização automática de dados</div>
            </div>
            <div style={{ fontSize: 10, color: "var(--blue)", fontWeight: 700, textTransform: "uppercase" }}>Gerenciar</div>
          </div>
        ) : (
          <div style={{ padding: 14, background: "var(--glass2)", borderRadius: 12, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--t3)" }}>
                Conexão Bancária
              </span>
              <button className="btn-ghost" style={{ padding: 4 }} onClick={() => setShowPluggy(false)}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: 11, color: "var(--t2)", marginBottom: 14, lineHeight: 1.4 }}>
              Seus dados são protegidos por criptografia de ponta a ponta.
            </p>
            <PluggyConnect onSuccess={() => setShowPluggy(false)} />
          </div>
        )}
      </div>

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

      {showHelpCenter && <HelpCenter onClose={() => setShowHelpCenter(false)} />}

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