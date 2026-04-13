import React, { useState, useEffect } from "react";
import { Moon, Sun, Fingerprint, Globe, Download, HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { HelpCenter } from "@/components/support/HelpCenter";

const rowIco = "row-ico bg-[var(--glass2)] text-[var(--t2)]";
const chevron = "text-[14px] text-[var(--t3)]";

export const SystemSettings: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [bioActive, setBioActive] = useState(true);
  const [darkTheme, setDarkTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
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

        {/* Tema */}
        <div className="tog-row cursor-pointer" onClick={() => setDarkTheme(!darkTheme)}>
          <div className="flex items-center gap-3">
            <div className={rowIco}>
              {darkTheme ? <Moon size={18} /> : <Sun size={18} />}
            </div>
            <div className="row-main">
              <div className="row-title">Tema Visual</div>
              <div className="row-sub">{darkTheme ? "Escuro" : "Claro"}</div>
            </div>
          </div>
          <div className={`tog ${darkTheme ? "on" : ""}`} />
        </div>

        {/* Biometria */}
        <div className="tog-row cursor-pointer" onClick={() => setBioActive(!bioActive)}>
          <div className="flex items-center gap-3">
            <div className={rowIco}><Fingerprint size={18} /></div>
            <div className="row-main">
              <div className="row-title">Acesso Biométrico</div>
              <div className="row-sub">Face ID / Touch ID</div>
            </div>
          </div>
          <div className={`tog ${bioActive ? "on" : ""}`} />
        </div>

        {/* Idioma */}
        <div
          className="tog-row cursor-pointer"
          onClick={() => setLanguage(language === "pt-BR" ? "en-US" : "pt-BR")}
        >
          <div className="flex items-center gap-3">
            <div className={rowIco}><Globe size={18} /></div>
            <div className="row-main">
              <div className="row-title">Idioma</div>
              <div className="row-sub">{language === "pt-BR" ? "Português (BR)" : "English (US)"}</div>
            </div>
          </div>
          <div className={chevron}>›</div>
        </div>

        {/* Exportar */}
        <div className="tog-row cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={rowIco}><Download size={18} /></div>
            <div className="row-main">
              <div className="row-title">Exportar Dados</div>
              <div className="row-sub">PDF · CSV · OFX</div>
            </div>
          </div>
          <div className={chevron}>›</div>
        </div>

        {/* Ajuda */}
        <div className="tog-row cursor-pointer" onClick={() => setShowHelpCenter(true)}>
          <div className="flex items-center gap-3">
            <div className={rowIco}><HelpCircle size={18} /></div>
            <div className="row-main">
              <div className="row-title">Central de Ajuda</div>
              <div className="row-sub">FAQ, tutoriais e suporte</div>
            </div>
          </div>
          <div className={chevron}>›</div>
        </div>
      </div>

      {showHelpCenter && <HelpCenter onClose={() => setShowHelpCenter(false)} />}
    </>
  );
};
