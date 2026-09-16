import { createMiddleware } from "@tanstack/react-start";

import { supabase } from "./client";

// Sends the current Supabase access token with every server function call so
// that requireSupabaseAuth can verify the caller.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    if (typeof window === "undefined") {
      return next();
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      return next();
    }

    return next({
      headers: { Authorization: `Bearer ${token}` },
    });
  },
);
