import { supabase } from '../servicios/supabaseCliente'

export interface EventoCompleto {
  id: string
  titulo: string
  descripcion?: string
  descripcion_corta?: string
  slug: string
  tipo_evento: string
  fecha_inicio: string
  fecha_fin?: string
  modalidad: string
  precio: number
  categoria?: string
  nivel_dificultad?: string
  instructor_nombre?: string
  capacidad_maxima?: number
  requiere_inscripcion?: boolean
  es_publico?: boolean
  estado?: string
  link_transmision?: string
  imagen_portada?: string
  participantes_inscritos: number
  total_visualizaciones: number
  calificacion_promedio: number
  total_calificaciones?: number
  enlace_grabacion?: string
  // Campos adicionales requeridos por la UI
  es_gratuito?: boolean
  es_destacado?: boolean
  moneda?: string
  precio_rebajado?: number
  tags?: string[]
}

interface FiltrosEventos {
  categoria?: string
  tipo_evento?: string
  nivel_dificultad?: string
  es_gratuito?: boolean
  busqueda?: string
  fecha_desde?: string
  fecha_hasta?: string
  estado?: string
  limit?: number
  offset?: number
}

export const eventosService = {
  async obtenerEventos(filtros: FiltrosEventos = {}): Promise<{ eventos: EventoCompleto[]; total: number; error?: string }> {
    try {
      let query = supabase
        .from('eventos')
        .select('*', { count: 'exact' })
        .order('fecha_inicio', { ascending: false })

      // Aplicar filtros
      if (filtros.categoria) query = query.eq('categoria', filtros.categoria)
      if (filtros.tipo_evento) query = query.eq('tipo_evento', filtros.tipo_evento)
      if (filtros.nivel_dificultad) query = query.eq('nivel_dificultad', filtros.nivel_dificultad)
      if (filtros.estado) query = query.eq('estado', filtros.estado)

      if (filtros.es_gratuito !== undefined) {
        if (filtros.es_gratuito) {
          query = query.or('precio.eq.0,es_gratuito.eq.true')
        } else {
          query = query.gt('precio', 0)
        }
      }

      if (filtros.busqueda) {
        query = query.or(`titulo.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`)
      }

      if (filtros.fecha_desde) query = query.gte('fecha_inicio', filtros.fecha_desde)
      if (filtros.fecha_hasta) query = query.lte('fecha_inicio', filtros.fecha_hasta)

      // Paginación
      if (filtros.limit) {
        const from = filtros.offset || 0
        query = query.range(from, from + filtros.limit - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      // Mapeo básico si faltan columnas en BD pero UI las espera
      const eventosMapeados = (data || []).map((e: any) => ({
        ...e,
        es_gratuito: e.es_gratuito ?? (e.precio === 0),
        moneda: e.moneda || 'COP',
        participantes_inscritos: e.participantes_inscritos || 0,
        calificacion_promedio: e.calificacion_promedio || 0,
        total_visualizaciones: e.total_visualizaciones || 0
      })) as EventoCompleto[]

      return { eventos: eventosMapeados, total: count || 0 }
    } catch (e: any) {
      console.error('Error fetching eventos:', e)
      return { eventos: [], total: 0, error: e.message }
    }
  },

  async obtenerEventoPorSlug(slug: string): Promise<{ evento?: EventoCompleto; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) throw error
      return { evento: data as EventoCompleto }
    } catch (e: any) {
      return { error: e.message }
    }
  },

  async crearEvento(evento: Partial<EventoCompleto>): Promise<{ id?: string; error?: string }> {
    try {
      const { data, error } = await supabase.from('eventos').insert(evento).select('id').single()
      if (error) throw error
      return { id: data?.id }
    } catch (e: any) {
      return { error: e.message }
    }
  },

  async eliminarEvento(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('eventos').delete().eq('id', id)
      if (error) throw error
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async obtenerEventosUsuario(usuarioId: string): Promise<EventoCompleto[]> {
    try {
      // Obtener inscripciones del usuario
      const { data: inscripciones, error: errorInsc } = await supabase
        .from('inscripciones_eventos')
        .select('evento_id')
        .eq('usuario_id', usuarioId)
        .eq('estado', 'activo')

      if (errorInsc) throw errorInsc
      if (!inscripciones || inscripciones.length === 0) return []

      const eventosIds = inscripciones.map(i => i.evento_id)

      // Obtener detalles de los eventos
      const { data: eventos, error: errorEventos } = await supabase
        .from('eventos')
        .select('*')
        .in('id', eventosIds)
        .order('fecha_inicio', { ascending: false })

      if (errorEventos) throw errorEventos

      // Mapeo con campos adicionales
      const eventosMapeados = (eventos || []).map((e: any) => ({
        ...e,
        es_gratuito: e.es_gratuito ?? (e.precio === 0),
        moneda: e.moneda || 'COP',
        participantes_inscritos: e.participantes_inscritos || 0,
        calificacion_promedio: e.calificacion_promedio || 0,
        total_visualizaciones: e.total_visualizaciones || 0,
        enlace_grabacion: e.enlace_grabacion || e.link_grabacion || null
      })) as EventoCompleto[]

      return eventosMapeados
    } catch (e: any) {
      console.error('Error obteniendo eventos del usuario:', e)
      return []
    }
  },

  // Stubs para métodos faltantes en la versión original de React pero necesarios para la migración
  async obtenerComentariosEvento(_eventoId: string) {
    // Implementación real pendiente de tabla comentarios_eventos
    return { comentarios: [], error: null }
  },
  async obtenerMaterialesEvento(_eventoId: string) {
    // Implementación real pendiente de tabla materiales_eventos
    return { materiales: [], error: null }
  },
  async verificarInscripcion(_eventoId: string, _userId: string) {
    // Implementación real pendiente
    return { inscrito: false, error: null }
  },
  async inscribirseEvento(_eventoId: string, _userId: string) {
    return { inscripcion: true, error: null } // Mock success
  },
  async cancelarInscripcion(_eventoId: string, _userId: string) {
    return { success: true, error: null } // Mock success
  },
  async agregarComentario(_eventoId: string, _userId: string, _mensaje: string) {
    return { error: null } // Mock success
  }
}
