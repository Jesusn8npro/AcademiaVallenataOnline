// Store reactivo para el usuario autenticado con Supabase
import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase/clienteSupabase';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

// Interfaz para el estado del usuario
interface EstadoUsuario {
  user: User | null;
}

// Store que contiene el usuario actual (null si no está autenticado)
export const estadoUsuarioActual = writable<EstadoUsuario>({ user: null });

// Inicializa el store con la sesión actual
supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
  estadoUsuarioActual.set({ user: data.session?.user || null });
});

// Escucha cambios de autenticación y actualiza el store
supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
  estadoUsuarioActual.set({ user: session?.user || null });
});
