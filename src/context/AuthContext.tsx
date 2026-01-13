import { auth, googleProvider } from "@/lib/firebase";
import { loadProfile, saveProfile, syncAllData } from "@/lib/storage";
import { UserProfile } from "@/types";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Sync data when user returns
        setIsSyncing(true);
        // We sync using the UID
        await syncAllData(currentUser.uid);
        const profile = loadProfile();
        if (profile?.isPro) setIsPro(true);
        setIsSyncing(false);
      }
      setUser(currentUser);
      setLoading(false);
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

  const updateProfile = async (data: any) => {
    saveProfile(data);
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
