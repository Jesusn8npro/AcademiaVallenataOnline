import { createClient } from '@supabase/supabase-js';

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const LLAVE_ANON_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// Singleton — sobrevive HMR en desarrollo
const globalAny: any = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {};

if (!globalAny.__INSTANCIA_SUPABASE) {
    globalAny.__INSTANCIA_SUPABASE = createClient(URL_SUPABASE, LLAVE_ANON_SUPABASE, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'supabase.auth.token',
        }
    });
}

export const supabase = globalAny.__INSTANCIA_SUPABASE;

export const supabaseAnonimo = createClient(URL_SUPABASE, LLAVE_ANON_SUPABASE, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});
