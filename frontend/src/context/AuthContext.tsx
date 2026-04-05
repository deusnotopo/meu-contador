import { api, clearAuthSession, setCsrfToken, subscribeToAuthSession } from "@/lib/api";
import type { UserProfile, WorkspaceRole } from "@/types";
import { auth, googleProvider } from "@/lib/firebase";
import { trackEvent, analyticsEvents } from "@/lib/analytics";
import { signInWithPopup } from "firebase/auth";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { syncAllData, clearAllStorage, hydrateCacheFromLocalStorage } from "@/lib/storage";

interface BackendUser extends Partial<AuthUser> {
  id: string;
  email: string;
  isPro?: boolean;
}

interface LoginResponse {
  user: BackendUser;
  csrfToken: string;
}
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
  setGlobalLoading: (isLoading: boolean) => void;
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


  const mapBackendUserToAuthUser = (backendUser: BackendUser): AuthUser => ({
    ...backendUser,
    name: backendUser.name ?? "Sua Conta",
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

  const refreshUser = useCallback(async () => {
    const backendUser = await api.get<BackendUser>("/auth/me");
    const authUser = mapBackendUserToAuthUser(backendUser);
    setUser(authUser);
    setIsPro(!!backendUser.isPro);
  }, []);

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
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message.toLowerCase() : '';
        const errorName = error instanceof Error ? error.name : '';
        const isNetworkOrTimeout = errorName === 'TimeoutError' || message.includes('fetch') || message.includes('timeout');
        if (i === retries - 1 || !isNetworkOrTimeout) throw error;
        console.warn(`Tentativa ${i + 1} falhou, aguardando backend acordar...`);
        // Espera 3s antes de tentar de novo
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    throw new Error('Unreachable');
  }

  // Unificado: único fluxo de inicialização com cleanup
  useEffect(() => {
    let cancelled = false;
    const syncAbort = new AbortController();

    const runInit = async () => {
      try {
        setIsSyncing(true);
        // Privacy Fortress: Hydrate local cache from encrypted storage immediately
        await hydrateCacheFromLocalStorage();

        const userData = await fetchWithRetry(() => withTimeout(api.get<BackendUser>("/auth/me"), 5000), 2);
        if (cancelled) return;

        const authUser = mapBackendUserToAuthUser(userData);
        setUser(authUser);
        setIsPro(!!userData.isPro);

        // Restaurar o CSRF token na memória após reload de página.
        // O /auth/me confirma que o cookie JWT é válido, mas o csrfToken
        // in-memory é perdido ao recarregar. O /auth/refresh devolve cookies
        // frescos e o csrfToken que o CSRF middleware exige nos POSTs.
        try {
          const refreshData = await api.post<{ csrfToken?: string }>("/auth/refresh", {});
          if (!cancelled && refreshData?.csrfToken) {
            setCsrfToken(refreshData.csrfToken);
          }
        } catch {
          // Se refresh falhar, seguimos de qualquer forma — o 403 vai disparar
          // o tryRefreshSession interno do api.ts num próximo POST
        }

        syncAllData(authUser.id).catch(err => {
          if (!cancelled) console.error("Background sync failed:", err);
        });
      } catch (error: unknown) {
        if (!cancelled) {
          console.error("Session restoration failed:", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsSyncing(false);
        }
      }
    };

    runInit();

    const unsub = subscribeToAuthSession((snapshot) => {
      if (!snapshot.isAuthenticated && !snapshot.csrfToken && !cancelled) {
        // Só limpa se checkAuth ainda não tiver resolvido com dados
        setUser((prev) => prev ? prev : null);
        setIsPro(false);
      }
    });

    return () => {
      cancelled = true;
      syncAbort.abort();
      unsub();
    };
  }, []);



  const login = useCallback(async (email: string, password?: string) => {
    if (!password) throw new Error("Senha é obrigatória.");
    
    try {
      setIsSyncing(true);
      const { user: backendUser, csrfToken } = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      setCsrfToken(csrfToken);



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
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      setIsSyncing(true);
      const { user: backendUser, csrfToken } = await api.post<LoginResponse>("/auth/register", {
        email,
        password,
        name
      });
      setCsrfToken(csrfToken);
      

      
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
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      setIsSyncing(true);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const { user: apiUser, csrfToken } = await api.post<LoginResponse>("/auth/google", {
        token: idToken
      });
      setCsrfToken(csrfToken);



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
  }, []);

  const logout = useCallback(async () => {
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
    // Privacy Fortress: Unconditional PII wipeout
    clearAllStorage();
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
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
  }, [user]);



  const upgradeToPro = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await api.post<{ success: boolean; user: BackendUser }>("/auth/upgrade", {});
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
  }, [user]);

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
    upgradeToPro,
    refreshUser,
    setGlobalLoading: setIsSyncing,
  }), [user, loading, isSyncing, isPro, login, register, loginWithGoogle, logout, updateProfile, upgradeToPro, refreshUser]);

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
