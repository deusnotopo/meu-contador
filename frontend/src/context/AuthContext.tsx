import { api } from "@/lib/api";
import type { UserProfile, WorkspaceRole } from "@/types";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";

// Extended User type to support both Profile data and Auth IDs
export interface AuthUser extends UserProfile {
  id: string;
  uid: string; // Alias for legacy compatibility
  email: string;
  businessName?: string;
  businessCnpj?: string;
  businessSector?: string;
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
        const userData = await api.get<any>("/auth/me");
        const preferences = await api.get<any>("/users/preferences");
        console.log("Fetched preferences from server:", preferences);
        
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
            isPro: userData.isPro || false
        };

        setUser(authUser);
        setIsPro(!!userData.isPro);
      } catch (error) {
        console.error("Session restoration failed:", error);
        localStorage.removeItem("authToken");
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

      // We might need to fetch full profile if login response is partial, 
      // but for now let's assume login returns basic info and we fetch /me or use what we have.
      // Ideally calling /me matches the useEffect logic. Let's reuse /me logic or manual mapping.
      // To ensure full profile, let's fetch /me immediately.
      
      const fullUser = await api.get<any>("/auth/me");
      const preferences = await api.get<any>("/users/preferences");

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
            ...fullUser,
            id: fullUser.id,
            uid: fullUser.id,
            email: fullUser.email,
             // Defaults 
            monthlyIncome: fullUser.monthlyIncome || 0,
            financialGoal: fullUser.financialGoal || "save",
            riskProfile: fullUser.riskProfile || "moderate",
            hasEmergencyFund: fullUser.hasEmergencyFund || false,
            hasDebts: fullUser.hasDebts || false,
            initialBalance: fullUser.initialBalance || 0,
             isPro: fullUser.isPro || false
        };

      setUser(authUser);
      setIsPro(authUser.isPro || false);
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
      const { token } = await api.post<{ token: string; user: any }>("/auth/register", {
        email,
        password,
        name
      });
      
      localStorage.setItem("authToken", token);
      
      // Fetch /me to get normalized object
      const fullUser = await api.get<any>("/auth/me");
      const preferences = await api.get<any>("/users/preferences");

      // Apply preferences (will be defaults for new user)
      setPrivacyMode(preferences.privacyMode);
      setLanguageState(preferences.language);
      setThemeState(preferences.theme as any);
      
      const authUser: AuthUser = {
            ...fullUser,
            id: fullUser.id,
            uid: fullUser.id,
             email: fullUser.email,
            monthlyIncome: 0,
            financialGoal: "save",
            riskProfile: "moderate",
            hasEmergencyFund: false,
            hasDebts: false,
            initialBalance: 0,
            isPro: false
        };
        
      setUser(authUser);
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
            // Ensure ID consistency
            id: apiUser.id,
            uid: apiUser.id,
            email: apiUser.email,
            // Defaults or from API
            monthlyIncome: apiUser.monthlyIncome || 0,
            financialGoal: apiUser.financialGoal || "save",
            riskProfile: apiUser.riskProfile || "moderate",
            hasEmergencyFund: apiUser.hasEmergencyFund || false,
            hasDebts: apiUser.hasDebts || false,
            initialBalance: apiUser.initialBalance || 0,
            isPro: apiUser.isPro || false,
             // Business
            businessName: apiUser.businessName,
            businessCnpj: apiUser.businessCnpj,
            businessSector: apiUser.businessSector
      };
      
      setUser(authUser);
      setIsPro(authUser.isPro || false);
    } catch (error) {
      console.error("Google Login Failed", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem("authToken");
    setUser(null);
    setIsPro(false);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      await api.put('/users/me', data);
      
      // Update local state
      if (user) {
          // @ts-ignore
          setUser({ ...user, ...data });
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
    console.log("Setting language to:", lang);
    setLanguageState(lang);
    try {
      await api.patch("/users/preferences", { language: lang });
      console.log("Language synced to server.");
    } catch (error) {
      console.error("Failed to sync language:", error);
    }
  };

  const setTheme = async (newTheme: 'light' | 'dark') => {
    console.log("Setting theme to:", newTheme);
    setThemeState(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      await api.patch("/users/preferences", { theme: newTheme });
      console.log("Theme synced to server.");
    } catch (error) {
      console.error("Failed to sync theme:", error);
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
