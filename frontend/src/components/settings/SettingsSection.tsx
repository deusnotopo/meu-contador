import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { BusinessSettings } from "@/features/settings/components/BusinessSettings";
import { DataSettings } from "@/features/settings/components/DataSettings";
import { MobileSettings } from "@/features/settings/components/MobileSettings";
import { ProfileSettings } from "@/features/settings/components/ProfileSettings";
import { SecuritySettings } from "@/features/settings/components/SecuritySettings";
import { VisualSettings } from "@/features/settings/components/VisualSettings";
import { showError, showSuccess } from "@/lib/toast";
import { UserProfile } from "@/types";
import {
  Building2,
  Database,
  LogOut,
  Moon,
  Palette,
  Shield,
  Smartphone,
  Sun,
  User as LucideUser,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CollaborationPanel } from "../profile/CollaborationPanel";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useAuth();
  return (
    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage("pt")}
        className={`text-xs ${
          language === "pt"
            ? "bg-white/10 text-white font-bold"
            : "text-slate-400"
        }`}
      >
        🇧🇷 PT
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLanguage("en")}
        className={`text-xs ${
          language === "en"
            ? "bg-white/10 text-white font-bold"
            : "text-slate-400"
        }`}
      >
        🇺🇸 EN
      </Button>
    </div>
  );
};

const ThemeSwitcher = () => {
  const { theme, setTheme } = useAuth();
  return (
    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
      {[
        {
          id: "dark",
          label: "Dark",
          icon: Moon,
          color: "text-indigo-400",
        },
        {
          id: "light",
          label: "Light",
          icon: Sun,
          color: "text-amber-400",
        },
      ].map((t) => (
        <Button
          key={t.id}
          variant="ghost"
          size="sm"
          onClick={() => setTheme(t.id as "light" | "dark")}
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
  const {
    user,
    logout,
    theme,
    setTheme,
    privacyMode,
    togglePrivacy,
    updateProfile,
  } = useAuth();
  // Initialize from user but allow local edits before save
  const [profile, setProfile] = useState<
    Partial<UserProfile> & { uid?: string }
  >(user || {});

  // Sync profile when user loads
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({ ...prev, ...user }));
    }
  }, [user]);

  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("personal");

  const handleSave = async () => {
    try {
      await updateProfile(profile);
      showSuccess("Configurações salvas com sucesso!");
    } catch {
      showError("Erro ao salvar configurações.");
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
                icon: LucideUser,
              },
              { id: "business", label: "Dados da Empresa", icon: Building2 },
              { id: "collab", label: "Espaços (Novo)", icon: Users },
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
                <item.icon
                  size={18}
                  strokeWidth={activeTab === item.id ? 2.5 : 2}
                />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-8 space-y-8">
          {activeTab === "personal" && (
            <ProfileSettings profile={profile} onChange={setProfile} />
          )}

          {activeTab === "business" && (
            <BusinessSettings profile={profile} onChange={setProfile} />
          )}

          {activeTab === "collab" && (
            <CollaborationPanel
              profile={profile}
              onUpdate={(updated) => {
                setProfile(updated);
                updateProfile(updated);
              }}
              userId={user?.uid || ""}
            />
          )}

          {activeTab === "visual" && (
            <VisualSettings
              theme={theme}
              setTheme={setTheme}
              privacyMode={privacyMode}
              togglePrivacy={togglePrivacy}
            />
          )}

          {activeTab === "mobile" && <MobileSettings />}

          {activeTab === "data" && <DataSettings />}

          {activeTab === "security" && <SecuritySettings />}

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
