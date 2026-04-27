export interface Chat {
    id: string;
    nombre?: string;
    descripcion?: string;
    imagen_url?: string;
    es_grupal: boolean;
    creado_en: string;
    actualizado_en: string;
    creado_por: string;
    ultimo_mensaje_id?: string;
    ultimo_mensaje_fecha?: string;
    activo: boolean;
    tipo_chat: 'privado' | 'grupo' | 'canal';
    configuracion: Record<string, any>;
    miembros?: MiembroChat[];
    ultimo_mensaje?: Mensaje;
    mensajes_no_leidos?: number;
}

export interface MiembroChat {
    id: string;
    chat_id: string;
    usuario_id: string;
    es_admin: boolean;
    puede_escribir: boolean;
    puede_invitar: boolean;
    unido_en: string;
    ultimo_acceso: string;
    notificaciones_activadas: boolean;
    mensajes_no_leidos: number;
    estado_miembro: 'activo' | 'silenciado' | 'bloqueado' | 'salido';
    perfil?: {
        id: string;
        nombre_completo: string;
        nombre_usuario: string;
        url_foto_perfil?: string;
        en_linea?: boolean;
    };
}

export interface Mensaje {
    id: string;
    chat_id: string;
    usuario_id: string;
    contenido?: string;
    tipo: 'texto' | 'imagen' | 'audio' | 'video' | 'archivo' | 'sistema' | 'ubicacion' | 'contacto';
    url_media?: string;
    metadata: Record<string, any>;
    mensaje_padre_id?: string;
    editado: boolean;
    eliminado: boolean;
    creado_en: string;
    editado_en?: string;
    eliminado_en?: string;
    usuario?: {
        id: string;
        nombre_completo: string;
        nombre_usuario: string;
        url_foto_perfil?: string;
    };
    mensaje_padre?: Mensaje;
    reacciones?: MensajeReaccion[];
    leido?: boolean;
    es_mio?: boolean;
}

export interface MensajeReaccion {
    id: string;
    mensaje_id: string;
    usuario_id: string;
    reaccion: string;
    creado_en: string;
    usuario?: {
        id: string;
        nombre_completo: string;
        url_foto_perfil?: string;
    };
}

export interface MensajeLectura {
    id: string;
    mensaje_id: string;
    usuario_id: string;
    leido_en: string;
}

export interface ChatConfiguracion {
    id: string;
    chat_id: string;
    solo_admins_pueden_escribir: boolean;
    auto_eliminar_mensajes_dias?: number;
    permitir_reacciones: boolean;
    permitir_respuestas: boolean;
    permitir_adjuntos: boolean;
    tamaño_maximo_archivo_mb: number;
    tipos_archivo_permitidos: string[];
}
