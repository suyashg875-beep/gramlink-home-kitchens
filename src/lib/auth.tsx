import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "seller" | "customer" | null;

type AuthState = {
  user: User | null;
  role: Role;
  loading: boolean;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function fetchRole(userId: string): Promise<Role> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("seller")) return "seller";
  if (roles.includes("customer")) return "customer";
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        setTimeout(() => {
          fetchRole(u.id).then((r) => {
            setRole(r);
            setLoading(false);
          });
        }, 0);
      } else {
        setRole(null);
        setLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshRole = useCallback(async () => {
    if (user) setRole(await fetchRole(user.id));
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, refreshRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
