import { supabase } from '../supabase/clienteSupabase';

export interface EventoCompleto {
  id: string;
  titulo: string;
  descripcion: string;
  descripcion_corta: string;
  slug: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  es_todo_el_dia: boolean;
  tipo_evento: string;
  modalidad: string;
  ubicacion_fisica: string | null;
  link_transmision: string | null;
  enlace_grabacion: string | null;
  codigo_acceso: string | null;
  precio: number;
  precio_rebajado: number | null;
  es_gratuito: boolean;
  moneda: string;
  capacidad_maxima: number;
  participantes_inscritos: number;
  requiere_inscripcion: boolean;
  es_publico: boolean;
  es_destacado: boolean;
  permite_grabacion: boolean;
  estado: string;
  categoria: string | null;
  nivel_dificultad: string | null;
  tags: string[] | null;
  imagen_portada: string | null;
  imagen_banner: string | null;
  video_promocional: string | null;
  instructor_id: string | null;
  instructor_nombre: string | null;
  instructor_avatar: string | null;
  creado_por: string | null;
  fecha_publicacion: string | null;
  zona_horaria: string;
  total_visualizaciones: number;
  calificacion_promedio: number;
  total_calificaciones: number;
  acepta_invitados: boolean;
  created_at: string;
  updated_at: string;
  inscrito: boolean;
  fecha_inscripcion: string | null;
}

export interface FiltrosEventos {
  estado?: string;
  categoria?: string;
  modalidad?: string;
  es_gratuito?: boolean;
  tipo_evento?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  busqueda?: string;
  limit?: number;
  offset?: number;
}

class EventosService {
  /**
   * Obtiene todos los eventos (para admin y calendario público)
   */
  async obtenerEventos(filtros?: FiltrosEventos): Promise<{ eventos: EventoCompleto[]; total: number; error?: string }> {
    try {
      let query = supabase
        .from('eventos')
        .select('*', { count: 'exact' })
        .order('fecha_inicio', { ascending: false });

      // Aplicar filtros
      if (filtros?.estado) {
        if (filtros.estado === 'proximos') {
          query = query.gte('fecha_inicio', new Date().toISOString());
        } else if (filtros.estado === 'pasados') {
          query = query.lt('fecha_inicio', new Date().toISOString());
        } else {
          query = query.eq('estado', filtros.estado);
        }
      }

      if (filtros?.categoria) {
        query = query.eq('categoria', filtros.categoria);
      }

      if (filtros?.modalidad) {
        query = query.eq('modalidad', filtros.modalidad);
      }

      if (filtros?.es_gratuito !== undefined) {
        query = query.eq('es_gratuito', filtros.es_gratuito);
      }

      if (filtros?.tipo_evento) {
        query = query.eq('tipo_evento', filtros.tipo_evento);
      }

      if (filtros?.fecha_desde) {
        query = query.gte('fecha_inicio', filtros.fecha_desde);
      }

      if (filtros?.fecha_hasta) {
        query = query.lte('fecha_inicio', filtros.fecha_hasta);
      }

      if (filtros?.busqueda) {
        query = query.or(`titulo.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%,descripcion_corta.ilike.%${filtros.busqueda}%`);
      }

      // Paginación
      if (filtros?.limit) {
        query = query.limit(filtros.limit);
      }

      if (filtros?.offset) {
        query = query.range(filtros.offset, filtros.offset + (filtros.limit || 10) - 1);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error('Error al obtener todos los eventos:', error);
        return { eventos: [], total: 0, error: 'Error al cargar eventos' };
      }

      // Mapear datos a EventoCompleto
      const eventos = data.map((evento: any) => ({
        ...evento,
        inscrito: false, // Para eventos públicos no sabemos si el usuario está inscrito
        fecha_inscripcion: null,
        // Valores por defecto para campos que pueden ser null
        precio: evento.precio || 0,
        capacidad_maxima: evento.capacidad_maxima || 100,
        participantes_inscritos: evento.participantes_inscritos || 0,
        es_todo_el_dia: evento.es_todo_el_dia || false,
        es_gratuito: evento.es_gratuito || false,
        requiere_inscripcion: evento.requiere_inscripcion || true,
        es_publico: evento.es_publico || true,
        es_destacado: evento.es_destacado || false,
        permite_grabacion: evento.permite_grabacion || true,
        acepta_invitados: evento.acepta_invitados || false,
        total_visualizaciones: evento.total_visualizaciones || 0,
        calificacion_promedio: evento.calificacion_promedio || 0,
        total_calificaciones: evento.total_calificaciones || 0,
        zona_horaria: evento.zona_horaria || 'America/Bogota',
        moneda: evento.moneda || 'COP',
        estado: evento.estado || 'programado',
        tipo_evento: evento.tipo_evento || 'masterclass',
        modalidad: evento.modalidad || 'online'
      }));

      return { eventos, total: count || 0 };
    } catch (error) {
      console.error('Error en obtenerEventos:', error);
      return { eventos: [], total: 0, error: 'Error al cargar eventos' };
    }
  }

  /**
   * Obtiene todos los eventos del usuario actual con sus inscripciones
   */
  async obtenerEventosUsuario(usuarioId: string, filtros?: FiltrosEventos): Promise<EventoCompleto[]> {
    try {
      // 1. Primero obtener los IDs de eventos en los que está inscrito
      const { data: inscripciones } = await supabase
        .from('eventos_inscripciones')
        .select('evento_id')
        .eq('usuario_id', usuarioId);

      if (!inscripciones || inscripciones.length === 0) {
        return [];
      }

      const eventosIds = inscripciones.map((i: any) => i.evento_id);

      // 2. Obtener los eventos usando solo la tabla eventos
      let query = supabase
        .from('eventos')
        .select('*')
        .in('id', eventosIds)
        .order('fecha_inicio', { ascending: false });

      // Aplicar filtros
      if (filtros?.estado) {
        if (filtros.estado === 'proximos') {
          query = query.gte('fecha_inicio', new Date().toISOString());
        } else if (filtros.estado === 'pasados') {
          query = query.lt('fecha_inicio', new Date().toISOString());
        }
      }

      if (filtros?.categoria) {
        query = query.eq('categoria', filtros.categoria);
      }

      if (filtros?.modalidad) {
        query = query.eq('modalidad', filtros.modalidad);
      }

      if (filtros?.es_gratuito !== undefined) {
        query = query.eq('es_gratuito', filtros.es_gratuito);
      }

      if (filtros?.tipo_evento) {
        query = query.eq('tipo_evento', filtros.tipo_evento);
      }

      if (filtros?.fecha_desde) {
        query = query.gte('fecha_inicio', filtros.fecha_desde);
      }

      if (filtros?.fecha_hasta) {
        query = query.lte('fecha_inicio', filtros.fecha_hasta);
      }

      if (filtros?.busqueda) {
        query = query.or(`titulo.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%,descripcion_corta.ilike.%${filtros.busqueda}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener eventos del usuario:', error);
        throw error;
      }

      // Mapear datos a EventoCompleto
      return data.map((evento: any) => ({
        ...evento,
        inscrito: true, // Si está aquí es porque está inscrito
        fecha_inscripcion: null, // Por simplicidad
        // Valores por defecto para campos que pueden ser null
        precio: evento.precio || 0,
        capacidad_maxima: evento.capacidad_maxima || 100,
        participantes_inscritos: evento.participantes_inscritos || 0,
        es_todo_el_dia: evento.es_todo_el_dia || false,
        es_gratuito: evento.es_gratuito || false,
        requiere_inscripcion: evento.requiere_inscripcion || true,
        es_publico: evento.es_publico || true,
        es_destacado: evento.es_destacado || false,
        permite_grabacion: evento.permite_grabacion || true,
        acepta_invitados: evento.acepta_invitados || false,
        total_visualizaciones: evento.total_visualizaciones || 0,
        calificacion_promedio: evento.calificacion_promedio || 0,
        total_calificaciones: evento.total_calificaciones || 0,
        zona_horaria: evento.zona_horaria || 'America/Bogota',
        moneda: evento.moneda || 'COP',
        estado: evento.estado || 'programado',
        tipo_evento: evento.tipo_evento || 'masterclass',
        modalidad: evento.modalidad || 'online'
      }));
    } catch (error) {
      console.error('Error en obtenerEventosUsuario:', error);
      throw error;
    }
  }

  /**
   * Obtiene un evento específico por su ID
   */
  async obtenerEventoPorId(eventoId: string): Promise<EventoCompleto | null> {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventoId)
        .single();

      if (error) {
        console.error('Error al obtener evento:', error);
        return null;
      }

      return {
        ...data,
        inscrito: false,
        fecha_inscripcion: null,
        // Valores por defecto
        precio: data.precio || 0,
        capacidad_maxima: data.capacidad_maxima || 100,
        participantes_inscritos: data.participantes_inscritos || 0,
        es_todo_el_dia: data.es_todo_el_dia || false,
        es_gratuito: data.es_gratuito || false,
        requiere_inscripcion: data.requiere_inscripcion || true,
        es_publico: data.es_publico || true,
        es_destacado: data.es_destacado || false,
        permite_grabacion: data.permite_grabacion || true,
        acepta_invitados: data.acepta_invitados || false,
        total_visualizaciones: data.total_visualizaciones || 0,
        calificacion_promedio: data.calificacion_promedio || 0,
        total_calificaciones: data.total_calificaciones || 0,
        zona_horaria: data.zona_horaria || 'America/Bogota',
        moneda: data.moneda || 'COP',
        estado: data.estado || 'programado',
        tipo_evento: data.tipo_evento || 'masterclass',
        modalidad: data.modalidad || 'online'
      };
    } catch (error) {
      console.error('Error en obtenerEventoPorId:', error);
      return null;
    }
  }

  /**
   * Inscribe a un usuario en un evento
   */
  async inscribirseEnEvento(eventoId: string, usuarioId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('eventos_inscripciones')
        .insert({
          evento_id: eventoId,
          usuario_id: usuarioId
        });

      if (error) {
        console.error('Error al inscribirse en evento:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en inscribirseEnEvento:', error);
      return false;
    }
  }

  /**
   * Verifica si un usuario está inscrito en un evento
   */
  async verificarInscripcion(eventoId: string, usuarioId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('eventos_inscripciones')
        .select('evento_id')
        .eq('evento_id', eventoId)
        .eq('usuario_id', usuarioId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error al verificar inscripción:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error en verificarInscripcion:', error);
      return false;
    }
  }

  /**
   * Obtiene las categorías disponibles de eventos
   */
  async obtenerCategorias(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('categoria')
        .not('categoria', 'is', null);

      if (error) {
        console.error('Error al obtener categorías:', error);
        return [];
      }

      const categorias = [...new Set(data.map((item: any) => item.categoria).filter(Boolean))] as string[];
      return categorias;
    } catch (error) {
      console.error('Error en obtenerCategorias:', error);
      return [];
    }
  }

  /**
   * Obtiene los tipos de evento disponibles
   */
  async obtenerTiposEvento(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('tipo_evento')
        .not('tipo_evento', 'is', null);

      if (error) {
        console.error('Error al obtener tipos de evento:', error);
        return [];
      }

      const tipos = [...new Set(data.map((item: any) => item.tipo_evento).filter(Boolean))] as string[];
      return tipos;
    } catch (error) {
      console.error('Error en obtenerTiposEvento:', error);
      return [];
    }
  }

  /**
   * Formatea la fecha de un evento para mostrar
   */
  formatearFechaEvento(fecha: string, esFinalizacion: boolean = false): string {
    const fechaObj = new Date(fecha);
    const ahora = new Date();
    
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
    };

    const fechaFormateada = fechaObj.toLocaleDateString('es-CO', opciones);
    
    if (esFinalizacion) {
      return `Finaliza: ${fechaFormateada}`;
    }
    
    if (fechaObj < ahora) {
      return `Finalizó: ${fechaFormateada}`;
    }
    
    return fechaFormateada;
  }

  /**
   * Obtiene el estado visual del evento
   */
  obtenerEstadoEvento(fecha_inicio: string, fecha_fin: string | null, estado: string): {
    texto: string;
    clase: string;
    color: string;
  } {
    const ahora = new Date();
    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = fecha_fin ? new Date(fecha_fin) : null;

    if (estado === 'cancelado') {
      return { texto: 'Cancelado', clase: 'cancelado', color: 'text-red-500' };
    }

    if (fechaFin && ahora > fechaFin) {
      return { texto: 'Finalizado', clase: 'finalizado', color: 'text-gray-500' };
    }

    if (ahora >= fechaInicio && (!fechaFin || ahora <= fechaFin)) {
      return { texto: 'En vivo', clase: 'en-vivo', color: 'text-green-500' };
    }

    if (ahora < fechaInicio) {
      return { texto: 'Próximo', clase: 'proximo', color: 'text-blue-500' };
    }

    return { texto: 'Programado', clase: 'programado', color: 'text-yellow-500' };
  }
}

export const eventosService = new EventosService(); 