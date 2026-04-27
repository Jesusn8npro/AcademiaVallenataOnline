export interface EstadisticasUsuarios {
    total: number;
    nuevos_mes: number;
    activos: number;
    crecimiento: number;
    premium: number;
}

export interface EstadisticasCursos {
    total: number;
    publicados: number;
    estudiantes: number;
    completados: number;
    rating: number;
}

export interface EstadisticasVentas {
    total: number;
    mes_actual: number;
    ingresos: number;
    crecimiento_ventas: number;
    ticket_promedio: number;
}

export interface EstadisticasBlog {
    articulos: number;
    publicados: number;
    borradores: number;
    visitas: number;
    engagement: number;
}

export interface EstadisticasComunidad {
    publicaciones: number;
    comentarios: number;
    likes: number;
    usuarios_activos: number;
    engagement: number;
}

export interface EstadisticasTutoriales {
    total: number;
    completados: number;
    progreso: number;
    tiempo_promedio: number;
    satisfaccion: number;
}

export interface EstadisticasEventos {
    proximos: number;
    pasados: number;
    participantes: number;
    cancelados: number;
}

export interface EstadisticasNotificaciones {
    enviadas: number;
    pendientes: number;
    abiertas: number;
    clicks: number;
}

export interface EstadisticasCompletas {
    usuarios: EstadisticasUsuarios;
    cursos: EstadisticasCursos;
    ventas: EstadisticasVentas;
    blog: EstadisticasBlog;
    comunidad: EstadisticasComunidad;
    tutoriales: EstadisticasTutoriales;
    eventos: EstadisticasEventos;
    notificaciones: EstadisticasNotificaciones;
}
