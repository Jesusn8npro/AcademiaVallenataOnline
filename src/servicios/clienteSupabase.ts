import { createClient } from '@supabase/supabase-js';

// Variables de entorno para Supabase (Cargadas desde .env por Vite)
const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL;
const LLAVE_ANON_SUPABASE = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Garantizar singleton para evitar múltiples instancias
let instanciaSupabase: ReturnType<typeof createClient> | undefined;

// Uso de globalThis para compatibilidad universal y evitar re-instanciación
const globalAny: any = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {};

if (globalAny.__INSTANCIA_SUPABASE) {
    instanciaSupabase = globalAny.__INSTANCIA_SUPABASE;
} else {
    instanciaSupabase = createClient(URL_SUPABASE, LLAVE_ANON_SUPABASE, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'supabase.auth.token',
        }
    });

    // Guardar en global para persistencia entre recargas de hot-module-replacement (HMR)
    globalAny.__INSTANCIA_SUPABASE = instanciaSupabase;
}

// Cliente anónimo específico para consultas públicas (sin persistencia de sesión)
export const supabaseAnonimo = createClient(URL_SUPABASE, LLAVE_ANON_SUPABASE, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

export const supabase = instanciaSupabase;


