import { createClient } from '@supabase/supabase-js';

// Variables de entorno para Supabase
const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL;
const LLAVE_ANON_SUPABASE = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Garantizar singleton para evitar múltiples instancias
let instanciaSupabase;
if (typeof window !== 'undefined') {
  instanciaSupabase = window.__INSTANCIA_SUPABASE;
  if (!instanciaSupabase) {
    instanciaSupabase = createClient(URL_SUPABASE, LLAVE_ANON_SUPABASE, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'supabase.auth.token',
      }
    });
    window.__INSTANCIA_SUPABASE = instanciaSupabase;
  }
} else {
  instanciaSupabase = createClient(URL_SUPABASE, LLAVE_ANON_SUPABASE);
}

export const supabase = instanciaSupabase;
