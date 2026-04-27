import { supabase } from '../clienteSupabase';
import type { EventoCompleto, FiltrosEventos } from './_tipos';
import { mapearEvento } from './_tipos';

export async function obtenerEventos(filtros?: FiltrosEventos): Promise<{ eventos: EventoCompleto[]; total: number; error?: string }> {
    try {
        let query = supabase
            .from('eventos')
            .select('*', { count: 'exact' })
            .order('fecha_inicio', { ascending: false });

        if (filtros?.estado) {
            if (filtros.estado === 'proximos') {
                query = query.gte('fecha_inicio', new Date().toISOString());
            } else if (filtros.estado === 'pasados') {
                query = query.lt('fecha_inicio', new Date().toISOString());
            } else {
                query = query.eq('estado', filtros.estado);
            }
        }
        if (filtros?.categoria) query = query.eq('categoria', filtros.categoria);
        if (filtros?.modalidad) query = query.eq('modalidad', filtros.modalidad);
        if (filtros?.es_gratuito !== undefined) query = query.eq('es_gratuito', filtros.es_gratuito);
        if (filtros?.tipo_evento) query = query.eq('tipo_evento', filtros.tipo_evento);
        if (filtros?.fecha_desde) query = query.gte('fecha_inicio', filtros.fecha_desde);
        if (filtros?.fecha_hasta) query = query.lte('fecha_inicio', filtros.fecha_hasta);
        if (filtros?.busqueda) {
            query = query.or(`titulo.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%,descripcion_corta.ilike.%${filtros.busqueda}%`);
        }
        if (filtros?.limit) query = query.limit(filtros.limit);
        if (filtros?.offset) query = query.range(filtros.offset, filtros.offset + (filtros.limit || 10) - 1);

        const { data, count, error } = await query;

        if (error) {
            return { eventos: [], total: 0, error: 'Error al cargar eventos' };
        }

        return { eventos: data.map((e: any) => mapearEvento(e, false)), total: count || 0 };
    } catch (error) {
        return { eventos: [], total: 0, error: 'Error al cargar eventos' };
    }
}

export async function obtenerEventosUsuario(usuarioId: string, filtros?: FiltrosEventos): Promise<EventoCompleto[]> {
    try {
        const { data: inscripciones } = await supabase
            .from('eventos_inscripciones')
            .select('evento_id')
            .eq('usuario_id', usuarioId);

        if (!inscripciones || inscripciones.length === 0) {
            return [];
        }

        const eventosIds = inscripciones.map((i: any) => i.evento_id);

        let query = supabase
            .from('eventos')
            .select('*')
            .in('id', eventosIds)
            .order('fecha_inicio', { ascending: false });

        if (filtros?.estado) {
            if (filtros.estado === 'proximos') {
                query = query.gte('fecha_inicio', new Date().toISOString());
            } else if (filtros.estado === 'pasados') {
                query = query.lt('fecha_inicio', new Date().toISOString());
            }
        }
        if (filtros?.categoria) query = query.eq('categoria', filtros.categoria);
        if (filtros?.modalidad) query = query.eq('modalidad', filtros.modalidad);
        if (filtros?.es_gratuito !== undefined) query = query.eq('es_gratuito', filtros.es_gratuito);
        if (filtros?.tipo_evento) query = query.eq('tipo_evento', filtros.tipo_evento);
        if (filtros?.fecha_desde) query = query.gte('fecha_inicio', filtros.fecha_desde);
        if (filtros?.fecha_hasta) query = query.lte('fecha_inicio', filtros.fecha_hasta);
        if (filtros?.busqueda) {
            query = query.or(`titulo.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%,descripcion_corta.ilike.%${filtros.busqueda}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map((e: any) => mapearEvento(e, true));
    } catch (error) {
        throw error;
    }
}

export async function obtenerEventoPorId(eventoId: string): Promise<EventoCompleto | null> {
    try {
        const { data, error } = await supabase
            .from('eventos')
            .select('*')
            .eq('id', eventoId)
            .single();

        if (error) return null;
        return mapearEvento(data, false);
    } catch (error) {
        return null;
    }
}

export async function obtenerCategorias(): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('eventos')
            .select('categoria')
            .not('categoria', 'is', null);

        if (error) return [];
        return [...new Set(data.map((item: any) => item.categoria).filter(Boolean))] as string[];
    } catch (error) {
        return [];
    }
}

export async function obtenerTiposEvento(): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('eventos')
            .select('tipo_evento')
            .not('tipo_evento', 'is', null);

        if (error) return [];
        return [...new Set(data.map((item: any) => item.tipo_evento).filter(Boolean))] as string[];
    } catch (error) {
        return [];
    }
}
