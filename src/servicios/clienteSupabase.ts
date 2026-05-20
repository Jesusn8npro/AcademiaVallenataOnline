import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Variables de entorno para Supabase. Fallback inerte para que el BUILD no
// reviente ("supabaseUrl is required") si la env falta o está mal escrita;
// en runtime con las env correctas funciona normal.
const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const LLAVE_ANON_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa las variables de entorno (¿typo NEXT_PUBLIC_SUPABASE_URLL?).');
}

// Garantizar singleton para evitar múltiples instancias
let instanciaSupabase: ReturnType<typeof createClient<Database>> | undefined;

// Uso de globalThis para compatibilidad universal y evitar re-instanciación
const globalAny: any = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {};

if (globalAny.__INSTANCIA_SUPABASE) {
    instanciaSupabase = globalAny.__INSTANCIA_SUPABASE;
} else {
    instanciaSupabase = createClient<Database>(URL_SUPABASE, LLAVE_ANON_SUPABASE, {
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
export const supabaseAnonimo = createClient<Database>(URL_SUPABASE, LLAVE_ANON_SUPABASE, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

export const supabase = instanciaSupabase;


