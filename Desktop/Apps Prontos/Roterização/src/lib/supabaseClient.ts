import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
} else {
  console.warn("Supabase não configurado: verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
}

export const getSupabaseClient = () => supabase;

export const isSupabaseConfigured = () => Boolean(supabase);
