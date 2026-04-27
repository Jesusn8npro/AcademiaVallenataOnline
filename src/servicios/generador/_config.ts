export type TipoEvento =
    | 'nuevo_curso'
    | 'nuevo_tutorial'
    | 'nueva_leccion'
    | 'nuevo_articulo_blog'
    | 'pago_aprobado'
    | 'pago_rechazado'
    | 'inscripcion_confirmada'
    | 'nueva_publicacion_comunidad'
    | 'nuevo_comentario'
    | 'nuevo_like'
    | 'nuevo_ejercicio'
    | 'actualizacion_curso'
    | 'nueva_actualizacion_plataforma'
    | 'bienvenida_usuario'
    | 'recordatorio_pago'
    | 'mensaje_usuario'
    | 'promocion_especial';

export const CONFIGURACION_NOTIFICACIONES = {
    nuevo_curso: {
        titulo: '🎓 ¡Nuevo curso disponible!',
        icono: '🎓',
        categoria: 'contenido' as const,
        prioridad: 'alta' as const,
        dias_expiracion: 30
    },
    nuevo_tutorial: {
        titulo: '📹 ¡Nuevo tutorial publicado!',
        icono: '📹',
        categoria: 'contenido' as const,
        prioridad: 'normal' as const,
        dias_expiracion: 15
    },
    nueva_leccion: {
        titulo: '📚 Nueva lección en tu curso',
        icono: '📚',
        categoria: 'contenido' as const,
        prioridad: 'normal' as const,
        dias_expiracion: 20
    },
    nuevo_articulo_blog: {
        titulo: '📝 ¡Nueva publicación en el blog!',
        icono: '📝',
        categoria: 'contenido' as const,
        prioridad: 'baja' as const,
        dias_expiracion: 10
    },
    pago_aprobado: {
        titulo: '✅ ¡Pago aprobado exitosamente!',
        icono: '✅',
        categoria: 'pago' as const,
        prioridad: 'alta' as const,
        dias_expiracion: 60
    },
    pago_rechazado: {
        titulo: '❌ Pago rechazado',
        icono: '❌',
        categoria: 'pago' as const,
        prioridad: 'alta' as const,
        dias_expiracion: 7
    },
    inscripcion_confirmada: {
        titulo: '🎉 ¡Inscripción confirmada!',
        icono: '🎉',
        categoria: 'pago' as const,
        prioridad: 'alta' as const,
        dias_expiracion: 90
    },
    nueva_publicacion_comunidad: {
        titulo: '👥 Nueva publicación en la comunidad',
        icono: '👥',
        categoria: 'comunidad' as const,
        prioridad: 'baja' as const,
        dias_expiracion: 7
    },
    nuevo_comentario: {
        titulo: '💬 Nuevo comentario en tu publicación',
        icono: '💬',
        categoria: 'comunidad' as const,
        prioridad: 'normal' as const,
        dias_expiracion: 14
    },
    nuevo_like: {
        titulo: '❤️ A alguien le gustó tu contenido',
        icono: '❤️',
        categoria: 'comunidad' as const,
        prioridad: 'baja' as const,
        dias_expiracion: 7
    },
    nuevo_ejercicio: {
        titulo: '🎯 ¡Nuevo ejercicio de práctica!',
        icono: '🎯',
        categoria: 'progreso' as const,
        prioridad: 'normal' as const,
        dias_expiracion: 20
    },
    actualizacion_curso: {
        titulo: '🔄 Curso actualizado',
        icono: '🔄',
        categoria: 'contenido' as const,
        prioridad: 'normal' as const,
        dias_expiracion: 30
    },
    nueva_actualizacion_plataforma: {
        titulo: '🚀 ¡Nueva actualización de la plataforma!',
        icono: '🚀',
        categoria: 'sistema' as const,
        prioridad: 'normal' as const,
        dias_expiracion: 30
    },
    bienvenida_usuario: {
        titulo: '👋 ¡Bienvenido a Academia Vallenata!',
        icono: '👋',
        categoria: 'sistema' as const,
        prioridad: 'alta' as const,
        dias_expiracion: 90
    },
    recordatorio_pago: {
        titulo: '💳 Recordatorio de pago pendiente',
        icono: '💳',
        categoria: 'pago' as const,
        prioridad: 'alta' as const,
        dias_expiracion: 7
    },
    mensaje_usuario: {
        titulo: '📧 Nuevo mensaje',
        icono: '📧',
        categoria: 'comunidad' as const,
        prioridad: 'normal' as const,
        dias_expiracion: 30
    },
    promocion_especial: {
        titulo: '🎁 ¡Promoción especial disponible!',
        icono: '🎁',
        categoria: 'promocion' as const,
        prioridad: 'alta' as const,
        dias_expiracion: 7
    }
};
