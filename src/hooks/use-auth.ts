import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "mitarbeiter";

export type Profile = {
  first_name: string;
  last_name: string;
  email: string;
  onboarding_enabled?: boolean;
};

export function panelPathForRole(role: AppRole | null): "/admin" | "/mitarbeiter" {
  return role === "admin" ? "/admin" : "/mitarbeiter";
}

export async function fetchRole(userId: string): Promise<AppRole> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const roles = (data ?? []).map((row) => row.role as AppRole);
  return roles.includes("admin") ? "admin" : "mitarbeiter";
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, onboarding_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  return data ?? null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const [nextRole, nextProfile] = await Promise.all([
        fetchRole(nextSession.user.id),
        fetchProfile(nextSession.user.id),
      ]);
      if (!active) return;
      setRole(nextRole);
      setProfile(nextProfile);
      setLoading(false);
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void load(nextSession);
    });

    void supabase.auth.getSession().then(({ data }) => load(data.session));

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { session, user, role, profile, loading };
}
