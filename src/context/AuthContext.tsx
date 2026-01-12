import { auth, googleProvider, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from "@/lib/auth-mock";
import { saveProfile, syncAllData } from "@/lib/storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSyncing: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Sync data when user returns
        setIsSyncing(true);
        await syncAllData(currentUser.uid);
        setIsSyncing(false);
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) {
      // In a real app with magic links or similar, this would be different.
      // For now, we assume email/password.
      throw new Error("Senha é obrigatória.");
    }
    const { user: loggedInUser } = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    setIsSyncing(true);
    await syncAllData(loggedInUser.uid);
    setIsSyncing(false);
  };

  const register = async (email: string, password: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    setIsSyncing(true);
    await syncAllData(newUser.uid);
    setIsSyncing(false);
  };

  const loginWithGoogle = async () => {
    const { user: googleUser } = await signInWithPopup(auth, googleProvider);
    setIsSyncing(true);
    await syncAllData(googleUser.uid);
    setIsSyncing(false);
  };

  const logout = async () => {
    await signOut(auth);
    // Clear local storage on logout for security/privacy?
    // User might want this, but for now let's keep it to avoid data loss if offline
    // localStorage.clear();
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
