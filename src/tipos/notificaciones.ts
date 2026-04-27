export interface Notificacion {
    id: string;
    usuario_id: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    icono: string;
    categoria: 'contenido' | 'pago' | 'comunidad' | 'progreso' | 'sistema' | 'promocion';
    prioridad: 'alta' | 'normal' | 'baja';
    leida: boolean;
    archivada: boolean;
    url_accion?: string;
    entidad_id?: string;
    entidad_tipo?: string;
    datos_adicionales: any;
    fecha_creacion: string;
    fecha_lectura?: string;
    fecha_expiracion?: string;
    tiempo_transcurrido?: string;
}

export interface PreferenciaNotificacion {
    id: string;
    usuario_id: string;
    tipo_notificacion: string;
    habilitado: boolean;
    via_plataforma: boolean;
    via_email: boolean;
    via_push: boolean;
    frecuencia: 'inmediata' | 'diaria' | 'semanal' | 'nunca';
}

export interface EstadisticasNotificaciones {
    total: number;
    no_leidas: number;
    por_categoria: { [key: string]: number };
    por_prioridad: { [key: string]: number };
}

export interface EstadisticasNotificacionesLegacy {
    total: number;
    pendientes: number;
    leidas: number;
    vencidas: number;
}
