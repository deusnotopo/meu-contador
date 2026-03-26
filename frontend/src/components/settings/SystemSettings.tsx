import React, { useState, useEffect } from "react";
import { Moon, Sun, Fingerprint, Globe, Download, HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { HelpCenter } from "@/components/support/HelpCenter";

export const SystemSettings: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [bioActive, setBioActive] = useState(true);
  const [darkTheme, setDarkTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // default dark
  });

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

  return (
    <>
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
    </>
  );
};
