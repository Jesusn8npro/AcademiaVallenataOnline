import { supabase } from '../clienteSupabase';

export { supabase };

// supabaseAdmin se mantiene como alias de supabase por compatibilidad con
// los módulos que ya lo importan (inscripciones, consultas, mutaciones,
// utilidades, _inscripcionesHelper). NO usa SERVICE_ROLE_KEY: la clave
// privada nunca debe vivir en el bundle del navegador. Cualquier acción
// que requiera privilegios elevados debe ir vía RPC SECURITY DEFINER o
// Edge Function con verify_jwt + check de rol.
export const supabaseAdmin = supabase;
