import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { WorkspaceRole } from "@/types";
import { AuthService, mapBackendUserToAuthUser, type AuthUser } from "@/services/AuthService";
import { ErrorService } from "@/services/ErrorService";
import { useAuthInit } from "@/hooks/useAuthInit";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { syncAllData } from "@/lib/storage";

export type { AuthUser };

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isSyncing: boolean;
  isPro: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
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

  /**
   * 🛠️ AKITA-STYLE REFACTOR: 
   * Extraímos a inicialização e o guard de sessão para hooks isolados.
   */
  useAuthInit({ setUser, setIsPro, setLoading, setIsSyncing });

  useSessionGuard(user, () => {
    setUser(null);
    setIsPro(false);
  });

  const refreshUser = useCallback(async () => {
    try {
      const backendUser = await AuthService.fetchCurrentUser();
      const authUser = mapBackendUserToAuthUser(backendUser);
      setUser(authUser);
      setIsPro(!!backendUser.isPro);
    } catch (error) {
      ErrorService.log(error, "AuthContext:refreshUser");
    }
  }, []);

  const handlePostAuth = useCallback((authUser: AuthUser) => {
    setUser(authUser);
    setIsPro(authUser.isPro || false);
    window.dispatchEvent(new CustomEvent('auth:session-ready'));
    syncAllData(authUser.id).catch((err: unknown) => {
      ErrorService.log(err, "AuthContext:syncData");
    });
  }, []);

  const login = useCallback(async (email: string, password?: string) => {
    try {
      setIsSyncing(true);
      const { user: authUser } = await AuthService.login(email, password);
      handlePostAuth(authUser);
    } catch (error) {
      const appError = ErrorService.normalize(error);
      ErrorService.log(error, "AuthContext:login");
      throw appError; // Lançamos para que a UI possa mostrar a mensagem normalizada
    } finally {
      setIsSyncing(false);
    }
  }, [handlePostAuth]);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    try {
      setIsSyncing(true);
      const { user: authUser } = await AuthService.register(email, password, name);
      handlePostAuth(authUser);
    } catch (error) {
      const appError = ErrorService.normalize(error);
      ErrorService.log(error, "AuthContext:register");
      throw appError;
    } finally {
      setIsSyncing(false);
    }
  }, [handlePostAuth]);

  const loginWithGoogle = useCallback(async () => {
    try {
      setIsSyncing(true);
      const { user: authUser } = await AuthService.loginWithGoogle();
      handlePostAuth(authUser);
    } catch (error) {
      const appError = ErrorService.normalize(error);
      ErrorService.log(error, "AuthContext:loginWithGoogle");
      throw appError;
    } finally {
      setIsSyncing(false);
    }
  }, [handlePostAuth]);

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      ErrorService.log(error, "AuthContext:logout");
    } finally {
      setUser(null);
      setIsPro(false);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      await AuthService.deleteAccount();
    } catch (error) {
      ErrorService.log(error, "AuthContext:deleteAccount");
      throw error;
    } finally {
      setUser(null);
      setIsPro(false);
    }
  }, []);

  const value = useMemo(() => ({
    user, loading, isSyncing, isPro,
    login, register, loginWithGoogle, logout, deleteAccount, refreshUser,
  }), [user, loading, isSyncing, isPro, login, register, loginWithGoogle, logout, deleteAccount, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const useRole = () => {
  const { user } = useAuth();
  if (!user) return { role: "owner" as WorkspaceRole, isOwner: true, isEditorAtLeast: true, isViewer: false };
  const activeWorkspaceId = user.currentWorkspaceId || user.uid || user.id;
  const role = (user.workspaceRoles?.[activeWorkspaceId] || "owner") as WorkspaceRole;
  return { role, isOwner: role === "owner", isEditorAtLeast: role === "owner" || role === "editor", isViewer: role === "viewer" };
};
