import { useAuth } from "@/context/AuthContext";
import { LogOut, ArrowLeft, Download, Fingerprint, Moon, Sun, Smartphone, ShieldCheck, CreditCard, X } from "lucide-react";
import { PluggyConnect } from "@/components/investments/PluggyConnect";
import { useState, useEffect } from "react";
import type { TabType } from "@/types/navigation";

interface SettingsSectionProps {
  onBack?: (tab: TabType) => void;
}

export const SettingsSection = ({ onBack }: SettingsSectionProps = {}) => {
  const { user, logout } = useAuth();
  const [showPluggy, setShowPluggy] = useState(false);
  const [darkTheme, setDarkTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // default dark
  });
  const [bioActive, setBioActive] = useState(true);

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
    if (onBack) onBack("overview");
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
          <span className="bdg bdg-p">Score 74</span>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
          {[
            ["🗓️", "247", "dias no app"],
            ["📊", "74", "score saúde"],
            ["🎯", "28%", "rumo FIRE"]
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
          ["Renda bruta mensal", "R$ 10.000", null],
          ["Renda líquida", "R$ 8.400", null],
          ["Faixa etária", "32 anos", null],
          ["Perfil investidor", "Moderado", "b"],
          ["Horizonte", "Longo prazo (20+ anos)", "g"],
          ["Dependentes", "Nenhum", null]
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
      </div>

      <button 
        className="btn-s" 
        style={{ marginTop: 6, width: "100%", color: "var(--red)", borderColor: "rgba(255,79,110,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => logout()}
      >
        <LogOut size={16} /> Sair da conta
      </button>

      <div style={{ textAlign: "center", margin: "24px 0 40px", fontSize: 10, color: "var(--t4)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        Versão 3.0.0 — Silicon Valley Standard
      </div>
    </div>
  );
};

