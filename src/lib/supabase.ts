import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || "";
const hasValidSupabaseUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl);

export const isDemoMode = !hasValidSupabaseUrl || !supabaseAnonKey;

export const supabase = createClient(
  isDemoMode ? "https://placeholder.supabase.co" : supabaseUrl,
  isDemoMode ? "placeholder-anon-key" : supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export const supabaseConfigError = !supabaseUrl
  ? "Missing VITE_SUPABASE_URL."
  : !hasValidSupabaseUrl
    ? "VITE_SUPABASE_URL must be a valid https://*.supabase.co URL."
    : !supabaseAnonKey
      ? "Missing VITE_SUPABASE_ANON_KEY."
      : "";
