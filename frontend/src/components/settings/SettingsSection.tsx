import { useAuth } from "@/context/AuthContext";
import { LogOut, ArrowLeft, Download, Fingerprint, Moon, Sun, Smartphone, ShieldCheck, CreditCard } from "lucide-react";

export const SettingsSection = () => {
  const { user, logout } = useAuth();
  
  return (
    <div style={{ padding: "10px 0", animation: "fsu 0.26s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "0 16px" }}>
        <button className="back-btn" onClick={() => window.history.back()}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.5px" }}>
          Perfil
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Profile Card */}
        <div className="card" style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24, padding: 20 }}>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
            {user?.name?.substring(0, 2).toUpperCase() || "MC"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.5px" }}>
              {user?.name || "Usuário"}
            </div>
            <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 2 }}>
              {user?.email}
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--purple-d)", color: "var(--purple)", padding: "4px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 8 }}>
              ★ Assinante Premium
            </div>
          </div>
        </div>

        {/* Quick Configs */}
        <div className="sec-hd"><span className="sec-title">Integrações</span></div>
        <div className="card space-y-2 mb-6">
          <div className="row" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
            <div className="row-ico" style={{ background: "rgba(0,217,145,0.1)", color: "var(--green)" }}><ShieldCheck size={18} /></div>
            <div className="row-main">
              <div className="row-title">Open Finance</div>
              <div className="row-sub">Banco Itaú, Nubank conectados</div>
            </div>
            <div style={{ fontSize: 10, color: "var(--blue)", fontWeight: 700, textTransform: "uppercase" }}>Gerenciar</div>
          </div>
          <div className="row" style={{ padding: "12px 0", cursor: "pointer" }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}><CreditCard size={18} /></div>
            <div className="row-main">
              <div className="row-title">Cartões e Contas</div>
              <div className="row-sub">3 ativos</div>
            </div>
          </div>
        </div>

        <div className="sec-hd"><span className="sec-title">Preferências</span></div>
        <div className="card space-y-2 mb-6">
          <div className="row" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}><Moon size={18} /></div>
            <div className="row-main">
              <div className="row-title">Tema Visual</div>
              <div className="row-sub">Escuro (Padrão)</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ width: 28, height: 28, borderRadius: 8, background: "var(--glass3)", border: "1px solid var(--border)", color: "var(--t1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Moon size={12} /></button>
              <button style={{ width: 28, height: 28, borderRadius: 8, background: "var(--glass)", border: "1px solid var(--border)", color: "var(--t3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Sun size={12} /></button>
              <button style={{ width: 28, height: 28, borderRadius: 8, background: "var(--glass)", border: "1px solid var(--border)", color: "var(--t3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Smartphone size={12} /></button>
            </div>
          </div>
          <div className="row" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}><Fingerprint size={18} /></div>
            <div className="row-main">
              <div className="row-title">Acesso Biométrico</div>
              <div className="row-sub">Face ID / Touch ID</div>
            </div>
            <div>
              {/* Toggle switch mock */}
              <div style={{ width: 44, height: 24, borderRadius: 12, background: "var(--blue)", position: "relative", cursor: "pointer" }}>
                <div style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
          </div>
          <div className="row" style={{ padding: "12px 0", cursor: "pointer" }}>
            <div className="row-ico" style={{ background: "var(--glass2)", color: "var(--t2)" }}><Download size={18} /></div>
            <div className="row-main">
              <div className="row-title">Exportar Dados</div>
              <div className="row-sub">Relatório CSV ou PDF (IRPF)</div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => logout()}
          className="btn-ghost" 
          style={{ width: "100%", padding: 16, color: "var(--red)", borderColor: "rgba(255,79,110,0.2)", display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}
        >
          <LogOut size={16} /> Encerrar Sessão
        </button>
        
        <div style={{ textAlign: "center", margin: "24px 0 40px", fontSize: 10, color: "var(--t4)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Versão 3.0.0 — Silicon Valley Standard
        </div>
      </div>
    </div>
  );
};
