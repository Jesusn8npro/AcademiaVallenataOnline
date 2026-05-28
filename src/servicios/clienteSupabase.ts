import { createClient } from '@supabase/supabase-js';

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const LLAVE_ANON_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// AMBOS clientes son singletons sobre globalThis para sobrevivir HMR.
// Bug conocido (supabase-js #37755): si createClient se llama múltiples veces,
// crea instancias duplicadas de GoTrueClient → warning + queries CUELGAN.
// Antes supabaseAnonimo NO era singleton → se recreaba en cada HMR
// → todo cargaba lento y las queries colgaban en panel-contenido y sidebars.
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

if (!globalAny.__INSTANCIA_SUPABASE_ANONIMO) {
    globalAny.__INSTANCIA_SUPABASE_ANONIMO = createClient(URL_SUPABASE, LLAVE_ANON_SUPABASE, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            // storageKey distinto: evita que ambos clientes peleen por el mismo
            // localStorage (causa de warnings "Multiple GoTrueClient instances").
            storageKey: 'supabase.anon.notoken',
        }
    });
}

export const supabase = globalAny.__INSTANCIA_SUPABASE;
export const supabaseAnonimo = globalAny.__INSTANCIA_SUPABASE_ANONIMO;
