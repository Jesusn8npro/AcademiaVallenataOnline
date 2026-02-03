import { supabase, supabaseAnon } from './supabaseCliente';
import type { EventoCompleto, FiltrosEventos } from '../tipos/eventos';

class EventosServicio {
  async obtenerEventos(filtros?: FiltrosEventos): Promise<{ eventos: EventoCompleto[]; total: number; error?: string }> {
    try {
      let query = supabaseAnon
        .from('eventos')
        .select('*', { count: 'exact' })
        .eq('es_publico', true)
        .order('fecha_inicio', { ascending: true });

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
      if (filtros?.tipo_evento) query = query.eq('tipo_evento', filtros.tipo_evento);
      if (filtros?.nivel_dificultad) query = query.eq('nivel_dificultad', filtros.nivel_dificultad);
      if (filtros?.es_gratuito !== undefined) query = query.eq('es_gratuito', filtros.es_gratuito);

      if (filtros?.fecha_desde) query = query.gte('fecha_inicio', filtros.fecha_desde);
      if (filtros?.fecha_hasta) query = query.lte('fecha_inicio', filtros.fecha_hasta);

      if (filtros?.busqueda) {
        query = query.or(`titulo.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`);
      }

      if (filtros?.limit) query = query.limit(filtros.limit);
      if (filtros?.offset) query = query.range(filtros.offset, filtros.offset + (filtros.limit || 12) - 1);

      const { data, error, count } = await query;
      if (error) return { eventos: [], total: 0, error: error.message };
      return { eventos: (data as EventoCompleto[]) || [], total: count || 0 };
    } catch (err: any) {
      return { eventos: [], total: 0, error: err.message };
    }
  }

  async obtenerEventoPorSlug(slug: string): Promise<{ evento: EventoCompleto | null; error?: string }> {
    try {
      const { data, error } = await supabaseAnon
        .from('eventos')
        .select('*')
        .eq('slug', slug)
        .eq('es_publico', true)
        .single();
      if (error) return { evento: null, error: error.message };
      return { evento: data as EventoCompleto };
    } catch (err: any) {
      return { evento: null, error: err.message };
    }
  }
}

export const eventosService = new EventosServicio();
export default eventosService;
export type { EventoCompleto, FiltrosEventos };
