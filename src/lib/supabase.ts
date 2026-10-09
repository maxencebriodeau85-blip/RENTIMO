import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let navigateur: SupabaseClient | null = null;

/** Client navigateur (session persistée). */
export function supabase(): SupabaseClient {
  if (!navigateur) {
    navigateur = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return navigateur;
}

/** Client serveur sans session (lecture publique, RPC). */
export function supabaseServeur(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface Abonnement {
  plan: "free" | "pro";
  status: string;
  current_period_end: string | null;
}

export function estPro(a: Abonnement | null | undefined): boolean {
  if (!a || a.plan !== "pro") return false;
  if (!["active", "trialing"].includes(a.status)) return false;
  return !a.current_period_end || new Date(a.current_period_end).getTime() > Date.now();
}
