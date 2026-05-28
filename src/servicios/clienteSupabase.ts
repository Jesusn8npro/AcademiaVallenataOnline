import { createClient } from '@supabase/supabase-js';

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const LLAVE_ANON_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// AMBOS clientes son singletons sobre globalThis para sobrevivir HMR.
// Bug conocido (supabase-js #37755): si createClient se llama múltiples veces,
// crea instancias duplicadas de GoTrueClient → warning + queries CUELGAN.
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

// noOpLock: el cliente Supabase usa el Web Locks API del navegador para
// serializar operaciones de auth. Cuando hay 2 clientes activos (authenticated
// + anonimo) compitiendo por el mismo lock, uno "roba" el lock del otro con
// la opción 'steal' → "Lock broken by another request" → AbortError.
// supabaseAnonimo NO necesita locks (no persiste sesión, no refresca tokens),
// así que le pasamos un lock que no hace nada.
// Issue: https://github.com/supabase/supabase-js/issues/2111
const noOpLock = async <T>(_name: string, _acquireTimeout: number, fn: () => Promise<T>): Promise<T> => {
    return await fn();
};

if (!globalAny.__INSTANCIA_SUPABASE_ANONIMO) {
    globalAny.__INSTANCIA_SUPABASE_ANONIMO = createClient(URL_SUPABASE, LLAVE_ANON_SUPABASE, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            lock: noOpLock,
        }
    });
}

export const supabase = globalAny.__INSTANCIA_SUPABASE;
export const supabaseAnonimo = globalAny.__INSTANCIA_SUPABASE_ANONIMO;
