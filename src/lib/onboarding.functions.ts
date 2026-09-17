import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OnboardingInfo = {
  enabled: boolean;
  email: string | null;
  password: string | null;
};

export const getMyOnboarding = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OnboardingInfo> => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("onboarding_enabled, gologin_email, gologin_password")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new Error("Onboarding-Daten konnten nicht geladen werden.");

    return {
      enabled: Boolean(data?.onboarding_enabled),
      email: data?.gologin_email ?? null,
      password: data?.gologin_password ?? null,
    };
  });
