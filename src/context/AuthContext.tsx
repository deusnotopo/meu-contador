import { auth, googleProvider } from "@/lib/firebase";
import {
  loadPrivacyMode,
  loadProfile,
  savePrivacyMode,
  saveProfile,
  syncAllData,
} from "@/lib/storage";
import type { UserProfile } from "@/types";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSyncing: boolean;
  isPro: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UserProfile) => Promise<void>;
  privacyMode: boolean;
  togglePrivacy: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(() => loadPrivacyMode());

  useEffect(() => {
    // onAuthStateChanged expects a synchronous function
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      const initializeUser = async () => {
        try {
          if (currentUser) {
            setIsSyncing(true);
            // Move sync to background to avoid blocking the UI
            syncAllData(currentUser.uid)
              .catch((err) =>
                console.error("Initial sync background error:", err)
              )
              .finally(() => {
                const profile = loadProfile();
                if (profile?.isPro) setIsPro(true);
                setIsSyncing(false);
              });
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
        } finally {
          setLoading(false);
        }
      };

      initializeUser();
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) {
      throw new Error("Senha é obrigatória.");
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    setIsSyncing(true);
    await syncAllData(result.user.uid);
    setIsSyncing(false);
  };

  const register = async (email: string, password: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    setIsSyncing(true);
    await syncAllData(result.user.uid);
    setIsSyncing(false);
  };

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    setIsSyncing(true);
    await syncAllData(result.user.uid);
    setIsSyncing(false);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: UserProfile) => {
    saveProfile(data);
  };

  const togglePrivacy = () => {
    const newState = !privacyMode;
    setPrivacyMode(newState);
    savePrivacyMode(newState);
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
