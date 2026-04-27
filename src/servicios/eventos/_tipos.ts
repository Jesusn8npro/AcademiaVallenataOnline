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

export function mapearEvento(evento: any, inscrito: boolean = false): EventoCompleto {
    return {
        ...evento,
        inscrito,
        fecha_inscripcion: null,
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
    };
}
