import { supabase } from './clienteSupabase';
import type { NotaHero } from '../Paginas/SimuladorDeAcordeon/videojuego_acordeon/tipos_Hero';

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

export async function actualizarCancionHeroCompleta(
    id: string,
    actualizaciones: {
        secuencia_json?: NotaHero[];
        secciones?: any[];
        duracion_segundos?: number | null;
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
