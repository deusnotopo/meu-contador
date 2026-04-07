import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";

interface FireConfig {
  expense?: number;
  contribution?: number;
  rate?: number;
}

interface PreferencesContextType {
  privacyMode: boolean;
  togglePrivacy: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  fireConfig: FireConfig;
  updateFireConfig: (config: FireConfig) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [privacyMode, setPrivacyMode] = useState(false);
  const [language, setLanguageState] = useState('pt');
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const [fireConfig, setFireConfig] = useState<FireConfig>({});
  const fireDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyTheme = useCallback((nextTheme: 'light' | 'dark') => {
    setThemeState(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.classList.toggle('light', nextTheme === 'light');
  }, []);

  useEffect(() => {
    // Initial fetch of preferences (optional: wait for auth, or fire globally)
    api.get<{ privacyMode: boolean; language: string; theme: 'light' | 'dark'; fireConfig?: FireConfig }>("/users/preferences")
      .then((prefs) => {
        setPrivacyMode(prefs.privacyMode || false);
        setLanguageState(prefs.language || 'pt');
        applyTheme((prefs.theme || 'dark') as 'light' | 'dark');
        if (prefs.fireConfig) setFireConfig(prefs.fireConfig);
      })
      .catch((e) => {
         console.warn("Preferences timeout/error, using defaults", e);
         applyTheme('dark');
      });
  }, [applyTheme]);

  const togglePrivacy = useCallback(async () => {
    const newState = !privacyMode;
    setPrivacyMode(newState);
    try {
      await api.patch("/users/preferences", { privacyMode: newState });
    } catch (error) {
      console.error("Failed to sync privacy mode:", error);
    }
  }, [privacyMode]);

  const setLanguage = useCallback(async (lang: string) => {
    setLanguageState(lang);
    try {
      await api.patch("/users/preferences", { language: lang });
    } catch (error) {
      console.error("Failed to sync language:", error);
    }
  }, []);

  const setTheme = useCallback(async (newTheme: 'light' | 'dark') => {
    applyTheme(newTheme);
    try {
      await api.patch("/users/preferences", { theme: newTheme });
    } catch (error) {
      console.error("Failed to sync theme:", error);
    }
  }, [applyTheme]);

  // Debounced FIRE config — saves 1.5s after last change, silently in background
  const updateFireConfig = useCallback((config: FireConfig) => {
    const merged = { ...fireConfig, ...config };
    setFireConfig(merged);
    if (fireDebounceRef.current) clearTimeout(fireDebounceRef.current);
    fireDebounceRef.current = setTimeout(async () => {
      try {
        await api.patch("/users/preferences", { fireConfig: merged });
      } catch (e) {
        console.warn("Failed to sync FIRE config:", e);
      }
    }, 1500);
  }, [fireConfig]);

  const value = useMemo(() => ({
    privacyMode,
    togglePrivacy,
    language,
    setLanguage,
    theme,
    setTheme,
    fireConfig,
    updateFireConfig,
  }), [privacyMode, togglePrivacy, language, setLanguage, theme, setTheme, fireConfig, updateFireConfig]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};
