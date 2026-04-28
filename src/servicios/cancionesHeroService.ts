import { supabase } from './clienteSupabase';
import type { NotaHero } from '../Core/hero/tipos_Hero';

export async function actualizarSecuenciaCancionHero(id: string, secuencia: NotaHero[]) {
    const tablaCanciones: any = supabase.from('canciones_hero' as any);

    const { data, error } = await tablaCanciones
        .update({ secuencia_json: secuencia } as any)
        .eq('id', id)
        .select('*')
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function eliminarCancionHero(id: string) {
    return eliminarCancionesHero([id]);
}

export async function eliminarCancionesHero(ids: string[]) {
    if (!ids.length) return;
    // Usa RPC SECURITY DEFINER porque varias tablas dependientes (scores_hero,
    // xp_cancion_usuario, monedas_cancion_usuario) no tienen política RLS DELETE
    // y el CASCADE falla con 409 desde el cliente. El RPC valida rol=admin.
    const { error } = await supabase.rpc('eliminar_canciones_hero' as any, { p_ids: ids });
    if (error) throw error;
}

export async function actualizarCancionHeroCompleta(
    id: string,
    actualizaciones: {
        secuencia_json?: NotaHero[];
        secciones?: any[];
        duracion_segundos?: number | null;
        desbloqueo_secuencial?: boolean;
        umbral_precision_seccion?: number;
        intentos_para_moneda?: number;
    }
) {
    const tablaCanciones: any = supabase.from('canciones_hero' as any);

    const { data, error } = await tablaCanciones
        .update(actualizaciones as any)
        .eq('id', id)
        .select('*')
        .single();

    if (error) {
        throw error;
    }

    return data;
}
