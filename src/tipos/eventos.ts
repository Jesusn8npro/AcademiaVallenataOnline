export type EstadoEvento = 'borrador' | 'publicado' | 'en_vivo' | 'finalizado' | 'cancelado';

export interface EventoCompleto {
  id: string;
  slug: string | null;
  titulo: string;
  descripcion: string;
  categoria?: string | null;
  tipo_evento: 'masterclass' | 'workshop' | 'concierto' | 'concurso' | 'webinar' | 'reunion' | string;
  modalidad?: 'virtual' | 'presencial' | 'híbrido' | string | null;
  nivel_dificultad?: 'principiante' | 'intermedio' | 'avanzado' | 'profesional' | string | null;
  es_publico?: boolean;
  es_gratuito?: boolean;
  precio?: number;
  imagen_portada?: string | null;
  participantes_inscritos?: number;
  calificacion_promedio?: number;
  total_calificaciones?: number;
  estado?: EstadoEvento;
  fecha_inicio: string;
  fecha_fin?: string | null;
  creado_en?: string;
  actualizado_en?: string;
}

export interface FiltrosEventos {
  estado?: EstadoEvento | 'proximos' | 'pasados';
  categoria?: string;
  modalidad?: string;
  tipo_evento?: string;
  nivel_dificultad?: string;
  es_gratuito?: boolean;
  busqueda?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  limit?: number;
  offset?: number;
}
