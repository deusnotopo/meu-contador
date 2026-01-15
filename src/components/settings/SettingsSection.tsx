import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/context/ThemeContext";
import { resetOnboarding } from "@/lib/onboarding";
import {
    exportFullBackup,
    importFullBackup,
    loadProfile,
    saveProfile,
} from "@/lib/storage";
import { showError, showSuccess } from "@/lib/toast";
import {
    Bell,
    Building2,
    Database,
    Download,
    LogOut,
    Moon,
    Palette,
    Shield,
    Smartphone,
    Sun,
    Upload,
    User,
} from "lucide-react";
import { useState } from "react";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage("pt-BR")}
        className={`text-xs ${
          language === "pt-BR"
            ? "bg-white/10 text-white font-bold"
            : "text-slate-400"
        }`}
      >
        🇧🇷 PT
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage("en-US")}
        className={`text-xs ${
          language === "en-US"
            ? "bg-white/10 text-white font-bold"
            : "text-slate-400"
        }`}
      >
        🇺🇸 EN
      </Button>
    </div>
  );
const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
      {[
        { id: "midnight", label: "Midnight", icon: Moon, color: "text-indigo-400" },
        { id: "emerald", label: "Emerald", icon: Palette, color: "text-emerald-400" },
        { id: "aura", label: "Aura", icon: Sun, color: "text-amber-400" },
      ].map((t) => (
        <Button
          key={t.id}
          variant="ghost"
          size="sm"
          onClick={() => setTheme(t.id as any)}
          className={`text-[9px] uppercase font-black px-3 ${
            theme === t.id
              ? "bg-white/10 text-white"
              : "text-slate-500 hover:text-white"
          }`}
        >
          <t.icon size={12} className={`mr-1.5 ${t.color}`} />
          {t.label}
        </Button>
      ))}
    </div>
  );
};

export const SettingsSection = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(loadProfile() || {});
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("personal");

  const handleSave = () => {
    try {
      saveProfile(profile);
      showSuccess("Configurações salvas com sucesso!");
    } catch (e) {
      showError("Erro ao salvar configurações.");
    }
  };

  const handleReset = () => {
    if (
      confirm(
        "Isso apagará todos os seus dados e voltará para o Onboarding. Tem certeza?"
      )
    ) {
      resetOnboarding();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-white/5 pb-10">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            {t("settings.title").split(" ")[0]}{" "}
            <span className="premium-gradient-text">
              {t("settings.title").split(" ").slice(1).join(" ")}
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">
            {t("settings.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <Button
            variant="ghost"
            onClick={logout}
            className="h-12 px-6 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 border border-rose-500/10 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <LogOut size={16} className="mr-2" />
            {t("settings.logout")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Navigation / Profile Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="premium-card relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700"></div>
            <div className="p-8 text-center space-y-6 relative z-10">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                {profile.name?.charAt(0) || user?.email?.charAt(0)}
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-2xl text-white tracking-tight">
                  {profile.name || "Seu Nome"}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-2 bg-white/5 rounded-3xl border border-white/5 space-y-1">
            {[
              {
                id: "personal",
                label: "Perfil Pessoal",
                icon: User,
              },
              { id: "business", label: "Dados da Empresa", icon: Building2 },
              { id: "visual", label: "Aparência & Temas", icon: Palette },
              { id: "mobile", label: "Mobile & PWA", icon: Smartphone },
              { id: "data", label: "Dados & Backup", icon: Database },
              { id: "security", label: "Privacidade", icon: Shield },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-6 h-14 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === item.id
                    ? "bg-white text-black shadow-xl"
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Personal Section */}
          {activeTab === "personal" && (
            <div className="premium-card">
              <div className="p-6 md:p-8 flex items-center gap-4 border-b border-white/5 mb-8">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <User size={20} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-white">
                  Perfil <span className="text-indigo-400">Pessoal</span>
                </h3>
              </div>
              <div className="p-6 md:p-8 pt-0 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      Nome Completo
                    </Label>
                    <Input
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500/30 text-white font-medium px-6"
                      placeholder="Como devemos te chamar?"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      Renda Mensal (Base)
                    </Label>
                    <Input
                      type="number"
                      value={profile.monthlyIncome}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          monthlyIncome: Number(e.target.value),
                        })
                      }
                      className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500/30 text-white font-medium px-6"
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Business Section */}
          {activeTab === "business" && (
            <div className="premium-card">
              <div className="p-6 md:p-8 flex items-center gap-4 border-b border-white/5 mb-8">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                  <Building2 size={20} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-white">
                  Dados da <span className="text-amber-500">Empresa</span>
                </h3>
              </div>
              <div className="p-6 md:p-8 pt-0 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                    Razão Social / Nome Fantasia
                  </Label>
                  <Input
                    value={profile.businessProfile?.name || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        businessProfile: {
                          ...(profile.businessProfile || {}),
                          name: e.target.value,
                        },
                      })
                    }
                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-amber-500/20 focus:border-amber-500/30 text-white font-medium px-6"
                    placeholder="Nome Fantasia da Empresa"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      Setor de Atuação
                    </Label>
                    <Input
                      value={profile.businessProfile?.sector || ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          businessProfile: {
                            ...(profile.businessProfile || {}),
                            sector: e.target.value,
                          },
                        })
                      }
                      className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-amber-500/20 focus:border-amber-500/30 text-white font-medium px-6"
                      placeholder="Ex: Consultoria, Varejo..."
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      CNPJ
                    </Label>
                    <Input
                      value={profile.businessProfile?.cnpj || ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          businessProfile: {
                            ...(profile.businessProfile || {}),
                            cnpj: e.target.value,
                          },
                        })
                      }
                      className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-amber-500/20 focus:border-amber-500/30 text-white font-medium px-6"
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visual Section */}
          {activeTab === "visual" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="premium-card">
                <div className="p-6 md:p-8 flex items-center gap-4 border-b border-white/5 mb-8">
                  <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                    <Palette size={20} />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-white">
                    Temas & <span className="text-purple-400">Visual</span>
                  </h3>
                </div>
                <div className="p-6 md:p-8 pt-0 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button 
                      onClick={() => setTheme('midnight')}
                      className={`group p-6 rounded-[2.5rem] border transition-all text-left space-y-4 ${theme === 'midnight' ? 'bg-indigo-500/10 border-indigo-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-xl">
                        <Moon size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-lg">Midnight</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Padrão Premium Dark</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setTheme('emerald')}
                      className={`group p-6 rounded-[2.5rem] border transition-all text-left space-y-4 ${theme === 'emerald' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-xl">
                        <Palette size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-lg">Emerald</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prosperidade & Natureza</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setTheme('aura')}
                      className={`group p-6 rounded-[2.5rem] border transition-all text-left space-y-4 ${theme === 'aura' ? 'bg-amber-500/10 border-amber-500' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 shadow-xl">
                        <Sun size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg">Aura Light</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Clean & Minimalista</p>
                      </div>
                    </button>
                  </div>

                  <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Animações Fluídas</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Habilita transições suaves e micro-interações</p>
                    </div>
                    <div className="h-6 w-12 rounded-full bg-emerald-500 flex items-center justify-end px-1 cursor-pointer">
                       <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PWA & Notifications Grid */}
          {activeTab === "mobile" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="premium-card bg-emerald-500/[0.02] border-emerald-500/10">
                <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                      <Smartphone size={24} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">
                      App Mobile
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Instale o Meu Contador na tela de início para acesso
                    instantâneo e offline.
                  </p>
                  <Button
                    onClick={() => alert("Menu -> Adicionar à Tela de Início")}
                    className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest transition-all text-[10px]"
                  >
                    Instalar App
                  </Button>
                </div>
              </div>

              <div className="premium-card bg-amber-500/[0.02] border-amber-500/10">
                <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                      <Bell size={24} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">
                      Alertas PRO
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Receba avisos de vencimentos e insights de IA direto no seu
                    navegador.
                  </p>
                  <Button
                    onClick={async () => {
                      if ("Notification" in window) {
                        const permission = await Notification.requestPermission();
                        if (permission === "granted")
                          showSuccess("Notificações ON!");
                      }
                    }}
                    className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest transition-all text-[10px]"
                  >
                    Ativar Alertas
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Backup & DANGER */}
          {activeTab === "data" && (
            <div className="premium-card animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-6 md:p-8 flex items-center gap-4 border-b border-white/5 mb-8">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                  <Database size={20} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-white">
                  Centro de <span className="text-blue-400">Dados</span>
                </h3>
              </div>
              <div className="p-6 md:p-8 pt-0 space-y-8">
                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                  <p className="text-xs text-blue-200/60 font-medium">
                    Backup de segurança em arquivo JSON. Seus dados são
                    criptografados localmente.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={exportFullBackup}
                      className="flex-1 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Download size={14} className="mr-2" /> Exportar Tudo
                    </Button>
                    <div className="flex-1 relative">
                      <Button className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-400 text-black text-[10px] font-black uppercase tracking-widest transition-all">
                        <Upload size={14} className="mr-2" /> Restaurar Backup
                      </Button>
                      <input
                        type="file"
                        accept=".json"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              await importFullBackup(file);
                              showSuccess("Restauração Concluída!");
                              window.location.reload();
                            } catch (err) {
                              showError("Erro no arquivo de backup.");
                            }
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between gap-6">
                  <div>
                    <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-1">
                      Limpeza Completa
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Apaga permanentemente todos os registros locais.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleReset}
                    className="h-10 px-4 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Resetar App
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="premium-card animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-6 md:p-8 flex items-center gap-4 border-b border-white/5 mb-8">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Shield size={20} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest text-white">
                  Centro de <span className="text-indigo-400">Privacidade</span>
                </h3>
              </div>
              <div className="p-6 md:p-8 pt-0 space-y-6 px-10">
                <p className="text-sm text-slate-400 leading-relaxed font-medium">Seus dados financeiros permanecem sob seu controle. A sincronização em nuvem é opcional e utiliza criptografia de ponta a ponta.</p>
                <div className="py-4 border-y border-white/5">
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-white">Mascarar Valores Automático</span>
                      <div className="h-6 w-12 rounded-full bg-slate-800 flex items-center px-1 opacity-50 cursor-not-available">
                         <div className="w-4 h-4 bg-white/20 rounded-full" />
                      </div>
                   </div>
                </div>
                 <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all">
                  Auditar Histórico de Acesso
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end sticky bottom-8 pt-4">
            <Button
              onClick={handleSave}
              className="h-16 px-16 rounded-[24px] bg-white text-black hover:bg-white/90 font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-white/10 transition-all hover:scale-105 active:scale-95"
            >
              {t("settings.save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
