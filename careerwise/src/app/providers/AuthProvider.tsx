"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { auth } from "@/app/lib/firebase";

type Ctx = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({
  user: null, loading: true,
  signInWithGoogle: async () => {}, logout: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() =>
    onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }),
  []);

  const signInWithGoogle = async () => { await signInWithPopup(auth, new GoogleAuthProvider()); };
  const logout = async () => { await signOut(auth); };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
