import { api, clearAuthSession, setCsrfToken, subscribeToAuthSession } from "@/lib/api";
import type { UserProfile, WorkspaceRole } from "@/types";
import { auth, googleProvider } from "@/lib/firebase";
import { trackEvent, analyticsEvents } from "@/lib/analytics";
import { signInWithPopup } from "firebase/auth";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { syncAllData } from "@/lib/storage";
// Extended User type to support both Profile data and Auth IDs
export interface AuthUser extends UserProfile {
  id: string;
  uid: string; // Alias for legacy compatibility
  email: string;
  onboardingCompleted?: boolean; // Persisted after wizard completion
  createdAt?: string;
  // Behavioral profile fields are already in UserProfile (age, dependents, investmentHorizon, employmentType)
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isSyncing: boolean;
  isPro: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  privacyMode: boolean;
  togglePrivacy: () => void;
  setGlobalLoading: (isLoading: boolean) => void;
  language: string;
  setLanguage: (lang: string) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  upgradeToPro: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [language, setLanguageState] = useState('pt');
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const applyTheme = (nextTheme: 'light' | 'dark') => {
    setThemeState(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.classList.toggle('light', nextTheme === 'light');
  };

  const mapBackendUserToAuthUser = (backendUser: any): AuthUser => ({
    ...backendUser,
    id: backendUser.id,
    uid: backendUser.id,
    email: backendUser.email,
    monthlyIncome: backendUser.monthlyIncome || 0,
    financialGoal: backendUser.financialGoal || "save",
    riskProfile: backendUser.riskProfile || "moderate",
    hasEmergencyFund: backendUser.hasEmergencyFund || false,
    hasDebts: backendUser.hasDebts || false,
    initialBalance: backendUser.initialBalance || 0,
    isPro: backendUser.isPro || false,
    age: backendUser.age,
    dependents: backendUser.dependents ?? 0,
    investmentHorizon: backendUser.investmentHorizon,
    employmentType: backendUser.employmentType || 'clt',
    businessName: backendUser.businessName,
    businessCnpj: backendUser.businessCnpj,
    businessSector: backendUser.businessSector,
    onboardingCompleted: backendUser.onboardingCompleted,
  });

  const refreshUser = async () => {
    const backendUser = await api.get<any>("/auth/me");
    const authUser = mapBackendUserToAuthUser(backendUser);
    setUser(authUser);
    setIsPro(!!backendUser.isPro);
  };

  // Helper: promessa com timeout
  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    );
    return Promise.race([promise, timeout]);
  }

  // Helper: promessa com timeout e retry para Cold Starts do Render
  async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        const isNetworkOrTimeout = error.name === 'TimeoutError' || error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('timeout');
        if (i === retries - 1 || !isNetworkOrTimeout) throw error;
        console.warn(`Tentativa ${i + 1} falhou, aguardando backend acordar...`);
        // Espera 3s antes de tentar de novo
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    throw new Error('Unreachable');
  }

  // Initial Auth Check & Preferences Sync
  useEffect(() => {
    return subscribeToAuthSession((snapshot) => {
      if (!snapshot.isAuthenticated && !snapshot.csrfToken) {
        setUser(null);
        setIsPro(false);
      }
    });
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsSyncing(true);
        // O Render pode levar de 30 a 60s para acordar. Usamos 45s + Retries.
        const [userData, preferences] = await Promise.all([
          fetchWithRetry(() => withTimeout(api.get<any>("/auth/me"), 15000), 2),
          fetchWithRetry(() => withTimeout(api.get<any>("/users/preferences"), 15000), 1).catch((e) => {
            console.warn("Preferences timeout/error, using defaults", e);
            return { privacyMode: false, language: 'pt', theme: 'dark' };
          })
        ]);
        console.debug("Fetched preferences from server.");
        
        // Apply preferences to state
        setPrivacyMode(preferences.privacyMode);
        setLanguageState(preferences.language);
        applyTheme((preferences.theme || 'dark') as 'light' | 'dark');

        // Map backend user to AuthUser
        const authUser = mapBackendUserToAuthUser(userData);

        setUser(authUser);
        setIsPro(!!userData.isPro);

        // Trigger background sync to load all financial data without blocking the UI
        syncAllData(authUser.id).catch(err => console.error("Background sync failed:", err));
      } catch (error: any) {
        console.error("Session restoration failed:", error);
        // Só removemos o token se for comprovadamente 401/403 (tratado pelo api.ts agora)
        // Se for erro de rede (Failed to fetch) ou Timeout, mantemos o token para que
        // um simples F5 reconecte o usuário quando o servidor Render acordar.
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    };

    checkAuth();
  }, []);



  const login = async (email: string, password?: string) => {
    if (!password) throw new Error("Senha é obrigatória.");
    
    try {
      setIsSyncing(true);
      const { user: backendUser, csrfToken } = await api.post<{ user: any; csrfToken: string }>("/auth/login", {
        email,
        password,
      });
      setCsrfToken(csrfToken);

      // Remove extra /auth/me call, leverage the backendUser passed from login response
      const preferences = await api.get<any>("/users/preferences").catch((e) => {
         console.warn("Could not fetch prefs", e);
         return { privacyMode: false, language: 'pt', theme: 'dark' };
      });

      // Apply preferences
      setPrivacyMode(preferences.privacyMode);
      setLanguageState(preferences.language);
      applyTheme((preferences.theme || 'dark') as 'light' | 'dark');

       const authUser = mapBackendUserToAuthUser(backendUser);

      setUser(authUser);
      setIsPro(authUser.isPro || false);
      
      // Sync em background — não bloquear a UI no login
      syncAllData(authUser.id).catch(err => console.error("Background sync failed:", err));

      // Track Login Event
      trackEvent(analyticsEvents.LOGIN, { 
        method: "email",
        userId: authUser.id 
      });
    } catch (error) {
       console.error("Login error:", error);
       throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      setIsSyncing(true);
      const { user: backendUser, csrfToken } = await api.post<{ user: any; csrfToken: string }>("/auth/register", {
        email,
        password,
        name
      });
      setCsrfToken(csrfToken);
      
      // Defaults for new user
      setPrivacyMode(false);
      setLanguageState('pt');
      applyTheme('dark');
      
      const authUser = mapBackendUserToAuthUser(backendUser);
        
      setUser(authUser);
      
      // Perform initial sync in the background so it doesn't block the UI
      syncAllData(authUser.id).catch(err => console.error("Initial sync background failure:", err));

      // Track Registration Event
      trackEvent(analyticsEvents.SIGN_UP, { userId: authUser.id });
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsSyncing(true);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const { user: apiUser, csrfToken } = await api.post<{ user: any; csrfToken: string }>("/auth/google", {
        token: idToken
      });
      setCsrfToken(csrfToken);

      // Fetch preferences to ensure state is consistent
      interface UserPreferences {
        privacyMode?: boolean;
        language?: string;
        theme?: "light" | "dark";
      }
      
      let preferences: UserPreferences = {};
      try {
           preferences = await api.get<UserPreferences>("/users/preferences");
      } catch (e) { 
          // If preference fetch fails, we default to safe values
          console.warn("Could not fetch prefs", e); 
      }
      
      // Apply Preferences
      setPrivacyMode(preferences?.privacyMode || false);
      setLanguageState(preferences?.language || 'pt');
      applyTheme((preferences?.theme || 'dark') as 'light' | 'dark');

      const authUser = mapBackendUserToAuthUser(apiUser);
      
      setUser(authUser);
      setIsPro(authUser.isPro || false);
      
      // Sync em background — não bloquear a UI no login Google
      syncAllData(authUser.id).catch(err => console.error("Google sync failed:", err));

      // Track Google Login Event
      trackEvent(analyticsEvents.LOGIN, { 
        method: "google",
        userId: authUser.id 
      });
    } catch (error) {
      console.error("Google Login Failed", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const logout = async () => {
    // Track Logout Event
    trackEvent(analyticsEvents.LOGOUT);
    try {
      await api.post<{ success: boolean }>("/auth/logout", {});
    } catch {
      // noop
    }
    clearAuthSession();
    setCsrfToken(null);
    setUser(null);
    setIsPro(false);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      await api.put('/users/me', data);
      // Update local state with proper type merge
      if (user) {
        setUser({ ...user, ...(data as Partial<AuthUser>) });
        // Track Profile Update
        trackEvent(analyticsEvents.UPDATE_PROFILE);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  };

  const togglePrivacy = async () => {
    const newState = !privacyMode;
    setPrivacyMode(newState);
    try {
      await api.patch("/users/preferences", { privacyMode: newState });
    } catch (error) {
      console.error("Failed to sync privacy mode:", error);
    }
  };

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    try {
      await api.patch("/users/preferences", { language: lang });
    } catch (error) {
      console.error("Failed to sync language:", error);
    }
  };

  const setTheme = async (newTheme: 'light' | 'dark') => {
    applyTheme(newTheme);
    try {
      await api.patch("/users/preferences", { theme: newTheme });
    } catch (error) {
      console.error("Failed to sync theme:", error);
    }
  };

  const upgradeToPro = async () => {
    try {
      setIsSyncing(true);
      const res = await api.post<{ success: boolean; user: any }>("/auth/upgrade", {});
      if (res.success) {
        setIsPro(true);
        if (user) {
          setUser({ ...user, isPro: true });
        }
      }
    } catch (error) {
      console.error("Failed to upgrade:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    isSyncing,
    isPro,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    privacyMode,
    togglePrivacy,
    language,
    setLanguage,
    theme,
    setTheme,
    upgradeToPro,
    refreshUser,
    setGlobalLoading: setIsSyncing,
  }), [user, loading, isSyncing, isPro, privacyMode, language, theme]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useRole = () => {
  const { user } = useAuth();
  
  if (!user) return { role: "owner" as WorkspaceRole, isOwner: true, isEditorAtLeast: true, isViewer: false };
  
  const activeWorkspaceId = user.currentWorkspaceId || user.uid || user.id;
  const role = (user.workspaceRoles?.[activeWorkspaceId] || "owner") as WorkspaceRole;
  
  return {
    role,
    isOwner: role === "owner",
    isEditorAtLeast: role === "owner" || role === "editor",
    isViewer: role === "viewer"
  };
};
