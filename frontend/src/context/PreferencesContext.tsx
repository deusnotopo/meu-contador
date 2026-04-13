import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { logger } from '@/lib/logger';
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
  showScore: boolean;
  setShowScore: (value: boolean) => void;
  showPredictions: boolean;
  setShowPredictions: (value: boolean) => void;
  weeklyReport: boolean;
  setWeeklyReport: (value: boolean) => void;
  alerts: boolean;
  setAlerts: (value: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [privacyMode, setPrivacyMode] = useState(false);
  const [language, setLanguageState] = useState('pt');
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const [fireConfig, setFireConfig] = useState<FireConfig>({});
  const [showScore, setShowScore] = useState(true);
  const [showPredictions, setShowPredictions] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const fireDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyTheme = useCallback((nextTheme: 'light' | 'dark') => {
    setThemeState(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.classList.toggle('light', nextTheme === 'light');
  }, []);

  // Load preferences from localStorage immediately (no 401 on cold load)
  useEffect(() => {
    const cached = localStorage.getItem('meu_contador:prefs');
    if (cached) {
      try {
        const prefs = JSON.parse(cached) as {
          privacyMode?: boolean;
          language?: string;
          theme?: 'light' | 'dark';
          fireConfig?: FireConfig;
          showScore?: boolean;
          showPredictions?: boolean;
          weeklyReport?: boolean;
          alerts?: boolean;
        };
        if (prefs.privacyMode !== undefined) setPrivacyMode(prefs.privacyMode);
        if (prefs.language) setLanguageState(prefs.language);
        applyTheme((prefs.theme || 'dark') as 'light' | 'dark');
        if (prefs.fireConfig) setFireConfig(prefs.fireConfig);
        if (prefs.showScore !== undefined) setShowScore(prefs.showScore);
        if (prefs.showPredictions !== undefined) setShowPredictions(prefs.showPredictions);
        if (prefs.weeklyReport !== undefined) setWeeklyReport(prefs.weeklyReport);
        if (prefs.alerts !== undefined) setAlerts(prefs.alerts);
      } catch { /* ignore corrupt cache */ }
    } else {
      applyTheme('dark');
    }
  }, [applyTheme]);

  // Sync from server only AFTER auth is ready — avoids spurious 401 on page load
  useEffect(() => {
    const syncFromServer = () => {
      api.get<{
        privacyMode: boolean;
        language: string;
        theme: 'light' | 'dark';
        fireConfig?: FireConfig;
        showScore?: boolean;
        showPredictions?: boolean;
        weeklyReport?: boolean;
        alerts?: boolean;
      }>("/users/preferences")
        .then((prefs) => {
          setPrivacyMode(prefs.privacyMode || false);
          setLanguageState(prefs.language || 'pt');
          applyTheme((prefs.theme || 'dark') as 'light' | 'dark');
          if (prefs.fireConfig) setFireConfig(prefs.fireConfig);
          setShowScore(prefs.showScore ?? true);
          setShowPredictions(prefs.showPredictions ?? true);
          setWeeklyReport(prefs.weeklyReport ?? true);
          setAlerts(prefs.alerts ?? true);
          // Cache locally for instant next load
          localStorage.setItem('meu_contador:prefs', JSON.stringify(prefs));
        })
        .catch(() => { /* server sync failed — keep local defaults */ });
    };

    window.addEventListener('auth:session-ready', syncFromServer);
    return () => window.removeEventListener('auth:session-ready', syncFromServer);
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
        logger.warn("Failed to sync FIRE config:", e);
      }
    }, 1500);
  }, [fireConfig]);

  const setShowScorePersist = useCallback(async (value: boolean) => {
    setShowScore(value);
    try {
      await api.patch("/users/preferences", { showScore: value });
    } catch (error) {
      console.error("Failed to sync showScore:", error);
    }
  }, []);

  const setShowPredictionsPersist = useCallback(async (value: boolean) => {
    setShowPredictions(value);
    try {
      await api.patch("/users/preferences", { showPredictions: value });
    } catch (error) {
      console.error("Failed to sync showPredictions:", error);
    }
  }, []);

  const setWeeklyReportPersist = useCallback(async (value: boolean) => {
    setWeeklyReport(value);
    try {
      await api.patch("/users/preferences", { weeklyReport: value });
    } catch (error) {
      console.error("Failed to sync weeklyReport:", error);
    }
  }, []);

  const setAlertsPersist = useCallback(async (value: boolean) => {
    setAlerts(value);
    try {
      await api.patch("/users/preferences", { alerts: value });
    } catch (error) {
      console.error("Failed to sync alerts:", error);
    }
  }, []);

  const value = useMemo(() => ({
    privacyMode,
    togglePrivacy,
    language,
    setLanguage,
    theme,
    setTheme,
    fireConfig,
    updateFireConfig,
    showScore,
    setShowScore: setShowScorePersist,
    showPredictions,
    setShowPredictions: setShowPredictionsPersist,
    weeklyReport,
    setWeeklyReport: setWeeklyReportPersist,
    alerts,
    setAlerts: setAlertsPersist,
  }), [
    privacyMode, togglePrivacy, language, setLanguage, theme, setTheme, fireConfig, updateFireConfig,
    showScore, setShowScorePersist, showPredictions, setShowPredictionsPersist, weeklyReport, setWeeklyReportPersist, alerts, setAlertsPersist
  ]);

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
