import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../configuracion/supabase.config';

const URL_SUPABASE = SUPABASE_CONFIG.url;
const LLAVE_ANON_SUPABASE = SUPABASE_CONFIG.anonKey;

if (!URL_SUPABASE || !LLAVE_ANON_SUPABASE) {
  throw new Error('Configuración de Supabase incompleta. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
}

// Cliente estándar con persistencia de sesión
export const supabase = createClient(URL_SUPABASE, LLAVE_ANON_SUPABASE, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token'
  }
});

/**
 * Cliente específico para consultas públicas que NO deben verse afectadas
 * por el estado de autenticación del usuario (bypass de RLS para auth users si está mal configurado)
 */
export const supabaseAnon = createClient(URL_SUPABASE, LLAVE_ANON_SUPABASE, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
