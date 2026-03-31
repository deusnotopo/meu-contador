import { api } from "@/lib/api";
import type { UserProfile, WorkspaceRole } from "@/types";
import { auth, googleProvider } from "@/lib/firebase";
import { trackEvent, analyticsEvents } from "@/lib/analytics";
import { signInWithPopup } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setIsSyncing(true);
        // O Render pode levar de 30 a 60s para acordar. Usamos 45s + Retries.
        const [userData, preferences] = await Promise.all([
          fetchWithRetry(() => withTimeout(api.get<any>("/auth/me"), 45000), 3),
          fetchWithRetry(() => withTimeout(api.get<any>("/users/preferences"), 45000), 2).catch((e) => {
            console.warn("Preferences timeout/error, using defaults", e);
            return { privacyMode: false, language: 'pt', theme: 'dark' };
          })
        ]);
        console.debug("Fetched preferences from server.");
        
        // Apply preferences to state
        setPrivacyMode(preferences.privacyMode);
        setLanguageState(preferences.language);
        setThemeState(preferences.theme as any);

        // Apply theme to document
        if (preferences.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        // Map backend user to AuthUser
        const authUser: AuthUser = {
            ...userData,
            id: userData.id,
            uid: userData.id,
            email: userData.email,
            // Defaults for profile if missing in DB
            monthlyIncome: userData.monthlyIncome || 0,
            financialGoal: userData.financialGoal || "save",
            riskProfile: userData.riskProfile || "moderate",
            hasEmergencyFund: userData.hasEmergencyFund || false,
            hasDebts: userData.hasDebts || false,
            initialBalance: userData.initialBalance || 0,
            isPro: userData.isPro || false,
            // Behavioral fields
            age: userData.age,
            dependents: userData.dependents ?? 0,
            investmentHorizon: userData.investmentHorizon,
            employmentType: userData.employmentType || 'clt',
            businessName: userData.businessName,
            businessCnpj: userData.businessCnpj,
            businessSector: userData.businessSector,
        };

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
      const { token, user: backendUser } = await api.post<{ token: string; user: any }>("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("authToken", token);

      // Remove extra /auth/me call, leverage the backendUser passed from login response
      const preferences = await api.get<any>("/users/preferences").catch((e) => {
         console.warn("Could not fetch prefs", e);
         return { privacyMode: false, language: 'pt', theme: 'dark' };
      });

      // Apply preferences
      setPrivacyMode(preferences.privacyMode);
      setLanguageState(preferences.language);
      setThemeState(preferences.theme as any);
      if (preferences.theme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }

       const authUser: AuthUser = {
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
            // Behavioral fields
            age: backendUser.age,
            dependents: backendUser.dependents ?? 0,
            investmentHorizon: backendUser.investmentHorizon,
            employmentType: backendUser.employmentType || 'clt',
            businessName: backendUser.businessName,
            businessCnpj: backendUser.businessCnpj,
            businessSector: backendUser.businessSector,
        };

      setUser(authUser);
      setIsPro(authUser.isPro || false);
      
      // Perform initial full-sync blocking login to guarantee data readiness
      await syncAllData(authUser.id);

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
      const { token, user: backendUser } = await api.post<{ token: string; user: any }>("/auth/register", {
        email,
        password,
        name
      });
      
      localStorage.setItem("authToken", token);
      
      // Defaults for new user
      setPrivacyMode(false);
      setLanguageState('pt');
      setThemeState('dark');
      
      const authUser: AuthUser = {
            ...backendUser,
            id: backendUser.id,
            uid: backendUser.id,
            email: backendUser.email,
            monthlyIncome: 0,
            financialGoal: "save",
            riskProfile: "moderate",
            hasEmergencyFund: false,
            hasDebts: false,
            initialBalance: 0,
            isPro: false
        };
        
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
      
      const { token, user: apiUser } = await api.post<{ token: string; user: any }>("/auth/google", {
        token: idToken
      });

      localStorage.setItem("authToken", token);

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
      setThemeState((preferences?.theme || 'dark') as any);
      
      // Update DOM for theme
      if (preferences?.theme === 'light') {
         document.documentElement.classList.remove('dark');
      } else {
         document.documentElement.classList.add('dark');
      }

      const authUser: AuthUser = {
            ...apiUser,
            id: apiUser.id,
            uid: apiUser.id,
            email: apiUser.email,
            monthlyIncome: apiUser.monthlyIncome || 0,
            financialGoal: apiUser.financialGoal || "save",
            riskProfile: apiUser.riskProfile || "moderate",
            hasEmergencyFund: apiUser.hasEmergencyFund || false,
            hasDebts: apiUser.hasDebts || false,
            initialBalance: apiUser.initialBalance || 0,
            isPro: apiUser.isPro || false,
            businessName: apiUser.businessName,
            businessCnpj: apiUser.businessCnpj,
            businessSector: apiUser.businessSector,
            // Behavioral fields
            age: apiUser.age,
            dependents: apiUser.dependents ?? 0,
            investmentHorizon: apiUser.investmentHorizon,
            employmentType: apiUser.employmentType || 'clt',
      };
      
      setUser(authUser);
      setIsPro(authUser.isPro || false);
      
      await syncAllData(authUser.id);

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

    localStorage.removeItem("authToken");
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
    setThemeState(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  return (
    <AuthContext.Provider
      value={{
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
        setGlobalLoading: setIsSyncing,
      }}
    >
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
