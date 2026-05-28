import { supabase } from '../servicios/clienteSupabase';

/**
 * Límites por plan — punto único de configuración.
 *
 * Cuando se definan las membresías (precios, qué incluye cada plan, política de freemium),
 * mover los límites a la columna `membresias.permisos` (jsonb) en Supabase y leerlos desde
 * ahí. Por ahora se usa esta constante para no bloquear el lanzamiento.
 */
export const LIMITE_PISTAS_FREE = 3;
export const LIMITE_PISTAS_PREMIUM = Infinity;

// Grabaciones (REC sobre pistas del alumno). Independiente de las pistas subidas:
// las pistas pesan en storage, las grabaciones son JSON livianas — pero igual limitamos
// el free para reservar la feature como diferencial premium.
export const LIMITE_GRABACIONES_FREE = 3;
export const LIMITE_GRABACIONES_PREMIUM = Infinity;

export interface ResultadoLimitePistas {
  limite: number;
  esPremium: boolean;
  motivo: 'free' | 'premium_activa' | 'premium_vencida';
}

/**
 * Devuelve el límite de pistas que puede subir un usuario según su membresía actual.
 * Premium activa = membresia_activa_id != null Y (fecha_vencimiento >= hoy O fecha_vencimiento IS NULL).
 */
export async function obtenerLimitePistas(userId: string): Promise<ResultadoLimitePistas> {
  if (!userId) return { limite: LIMITE_PISTAS_FREE, esPremium: false, motivo: 'free' };

  const { data, error } = await (supabase
    .from('perfiles')
    .select('membresia_activa_id, fecha_vencimiento_membresia')
    .eq('id', userId)
    .maybeSingle() as any);

  if (error || !data || !data.membresia_activa_id) {
    return { limite: LIMITE_PISTAS_FREE, esPremium: false, motivo: 'free' };
  }

  const fechaVenc = data.fecha_vencimiento_membresia;
  if (fechaVenc) {
    const hoy = new Date().toISOString().slice(0, 10);
    if (fechaVenc < hoy) {
      return { limite: LIMITE_PISTAS_FREE, esPremium: false, motivo: 'premium_vencida' };
    }
  }

  return { limite: LIMITE_PISTAS_PREMIUM, esPremium: true, motivo: 'premium_activa' };
}

/**
 * Mismo criterio que pistas pero para grabaciones del alumno.
 * Cuando definas planes, podés diferenciar (ej: free=3 pistas + 3 grabaciones, premium=20+50, etc).
 */
export async function obtenerLimiteGrabaciones(userId: string): Promise<ResultadoLimitePistas> {
  if (!userId) return { limite: LIMITE_GRABACIONES_FREE, esPremium: false, motivo: 'free' };

  const { data, error } = await (supabase
    .from('perfiles')
    .select('membresia_activa_id, fecha_vencimiento_membresia')
    .eq('id', userId)
    .maybeSingle() as any);

  if (error || !data || !data.membresia_activa_id) {
    return { limite: LIMITE_GRABACIONES_FREE, esPremium: false, motivo: 'free' };
  }

  const fechaVenc = data.fecha_vencimiento_membresia;
  if (fechaVenc) {
    const hoy = new Date().toISOString().slice(0, 10);
    if (fechaVenc < hoy) {
      return { limite: LIMITE_GRABACIONES_FREE, esPremium: false, motivo: 'premium_vencida' };
    }
  }

  return { limite: LIMITE_GRABACIONES_PREMIUM, esPremium: true, motivo: 'premium_activa' };
}
