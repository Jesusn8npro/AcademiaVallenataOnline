import { supabase } from './clienteSupabase';
import type { EstadoSeccionUsuario } from '../Paginas/AcordeonProMax/TiposProMax';

/**
 * Carga el progreso por sección de una canción para el usuario actual.
 * Lee `monedas_cancion_usuario.secciones_progreso` (jsonb).
 * Devuelve un mapa {seccion_id → EstadoSeccionUsuario}, o {} si no hay registro aún.
 */
export async function cargarProgresoSecciones(
    usuarioId: string,
    cancionId: string,
): Promise<Record<string, EstadoSeccionUsuario>> {
    const tabla: any = supabase.from('monedas_cancion_usuario' as any);
    const { data, error } = await tabla
        .select('secciones_progreso')
        .eq('usuario_id', usuarioId)
        .eq('cancion_id', cancionId)
        .maybeSingle();

    if (error) return {};

    const raw = data?.secciones_progreso;
    if (!raw || typeof raw !== 'object') return {};
    return raw as Record<string, EstadoSeccionUsuario>;
}
