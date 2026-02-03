import { supabase } from './supabaseCliente';

/**
 * 🚀 GENERADOR AUTOMÁTICO DE NOTIFICACIONES
 * Este servicio crea notificaciones automáticamente cuando ocurren eventos importantes
 */

// Tipos de eventos que generan notificaciones
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

// Configuración de tipos de notificación
const CONFIGURACION_NOTIFICACIONES = {
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

/**
 * 🔔 Crear notificación automática
 */
export async function crearNotificacion(params: {
    tipo: TipoEvento;
    usuario_id?: string;          // Si no se especifica, se envía a todos los usuarios
    usuarios_ids?: string[];      // Para enviar a usuarios específicos
    mensaje: string;
    url_accion?: string;
    entidad_id?: string;         // ID del curso, tutorial, etc.
    entidad_tipo?: string;       // 'curso', 'tutorial', 'articulo', etc.
    datos_adicionales?: any;
    solo_roles?: ('admin' | 'user')[];  // Solo para ciertos roles
    excluir_usuario?: string;    // Excluir al usuario que causó el evento
}) {
    // @ts-ignore
    const config = CONFIGURACION_NOTIFICACIONES[params.tipo];

    if (!config) {
        console.error(`Tipo de notificación no configurado: ${params.tipo}`);
        return { exito: false, error: 'Tipo de notificación no válido' };
    }

    try {
        console.log(`🔔 Generando notificación: ${params.tipo}`);

        // Determinar destinatarios
        let destinatarios: string[] = [];

        if (params.usuario_id) {
            // Un usuario específico
            destinatarios = [params.usuario_id];
        } else if (params.usuarios_ids) {
            // Usuarios específicos
            destinatarios = params.usuarios_ids;
        } else {
            // Todos los usuarios (según filtros)
            const { data: usuarios, error: errorUsuarios } = await supabase
                .from('perfiles')
                .select('id, rol')
                .eq('eliminado', false);

            if (errorUsuarios) {
                console.error('Error al obtener usuarios:', errorUsuarios);
                return { exito: false, error: errorUsuarios.message };
            }

            destinatarios = usuarios
                ?.filter(u => {
                    // Filtrar por roles si se especifica
                    if (params.solo_roles && !params.solo_roles.includes(u.rol)) {
                        return false;
                    }
                    // Excluir usuario específico
                    if (params.excluir_usuario && u.id === params.excluir_usuario) {
                        return false;
                    }
                    return true;
                })
                .map(u => u.id) || [];
        }

        console.log(`📤 Enviando a ${destinatarios.length} usuarios`);

        // Calcular fecha de expiración
        const fechaExpiracion = new Date();
        fechaExpiracion.setDate(fechaExpiracion.getDate() + config.dias_expiracion);

        // Crear notificaciones para cada usuario
        const notificaciones = destinatarios.map(usuarioId => {
            const notificacion: any = {
                usuario_id: usuarioId,
                tipo: params.tipo,
                titulo: config.titulo,
                mensaje: params.mensaje,
                icono: config.icono,
                categoria: config.categoria,
                prioridad: config.prioridad,
                leida: false,
                archivada: false,
                url_accion: params.url_accion,
                entidad_tipo: params.entidad_tipo,
                datos_adicionales: params.datos_adicionales || {},
                fecha_expiracion: fechaExpiracion.toISOString()
            };

            // Solo agregar entidad_id si se proporciona (para evitar problemas con tablas que no lo tienen)
            if (params.entidad_id) {
                notificacion.entidad_id = params.entidad_id;
            }

            return notificacion;
        });

        // Insertar notificaciones en lotes
        const TAMANO_LOTE = 50;
        const resultados = [];

        for (let i = 0; i < notificaciones.length; i += TAMANO_LOTE) {
            const lote = notificaciones.slice(i, i + TAMANO_LOTE);

            const { data, error } = await supabase
                .from('notificaciones')
                .insert(lote)
                .select('id, usuario_id');

            if (error) {
                console.error(`Error en lote ${i / TAMANO_LOTE + 1}:`, error);
                return { exito: false, error: error.message };
            }

            resultados.push(...(data || []));
        }

        console.log(`✅ Notificaciones creadas: ${resultados.length}`);

        return {
            exito: true,
            notificaciones_creadas: resultados.length,
            ids_creados: resultados.map(r => r.id)
        };

    } catch (error) {
        console.error('Error al crear notificación:', error);
        return { exito: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

/**
 * 🎓 NOTIFICACIÓN: Nuevo curso publicado
 */
export async function notificarNuevoCurso(params: {
    curso_id: string;
    titulo_curso: string;
    descripcion_curso: string;
    creador_id: string;
}) {
    return await crearNotificacion({
        tipo: 'nuevo_curso',
        mensaje: `¡Nuevo curso disponible: "${params.titulo_curso}"! ${params.descripcion_curso}`,
        url_accion: `/cursos/${params.curso_id}`,
        entidad_id: params.curso_id,
        entidad_tipo: 'curso',
        excluir_usuario: params.creador_id,
        datos_adicionales: {
            titulo_curso: params.titulo_curso
        }
    });
}

/**
 * 📹 NOTIFICACIÓN: Nuevo tutorial publicado
 */
export async function notificarNuevoTutorial(params: {
    tutorial_id: string;
    titulo_tutorial: string;
    descripcion_tutorial: string;
    creador_id: string;
}) {
    return await crearNotificacion({
        tipo: 'nuevo_tutorial',
        mensaje: `¡Nuevo tutorial disponible: "${params.titulo_tutorial}"! ${params.descripcion_tutorial}`,
        url_accion: `/tutoriales/${params.tutorial_id}`,
        entidad_id: params.tutorial_id,
        entidad_tipo: 'tutorial',
        excluir_usuario: params.creador_id,
        datos_adicionales: {
            titulo_tutorial: params.titulo_tutorial
        }
    });
}

/**
 * 📚 NOTIFICACIÓN: Nueva lección agregada
 */
export async function notificarNuevaLeccion(params: {
    curso_id: string;
    leccion_id: string;
    titulo_leccion: string;
    titulo_curso: string;
}) {
    // Obtener usuarios inscritos en el curso
    const { data: inscritos, error } = await supabase
        .from('inscripciones')
        .select('usuario_id')
        .eq('curso_id', params.curso_id)
        .eq('estado', 'activa');

    if (error || !inscritos?.length) {
        console.log('No hay usuarios inscritos para notificar');
        return { exito: true, notificaciones_creadas: 0 };
    }

    return await crearNotificacion({
        tipo: 'nueva_leccion',
        usuarios_ids: inscritos.map(i => i.usuario_id),
        mensaje: `Nueva lección "${params.titulo_leccion}" disponible en tu curso "${params.titulo_curso}".`,
        url_accion: `/cursos/${params.curso_id}/leccion/${params.leccion_id}`,
        entidad_id: params.leccion_id,
        entidad_tipo: 'leccion',
        datos_adicionales: {
            curso_id: params.curso_id,
            titulo_curso: params.titulo_curso,
            titulo_leccion: params.titulo_leccion
        }
    });
}

/**
 * 📝 NOTIFICACIÓN: Nuevo artículo del blog
 */
export async function notificarNuevoArticuloBlog(params: {
    articulo_id: string;
    titulo_articulo: string;
    resumen: string;
    autor_id: string;
}) {
    // Crear resumen atractivo 
    const resumenCompacto = params.resumen.length > 120
        ? params.resumen.substring(0, 120) + '...'
        : params.resumen;

    return await crearNotificacion({
        tipo: 'nuevo_articulo_blog',
        mensaje: `✨ "${params.titulo_articulo}"\n\n${resumenCompacto}\n\n📖 ¡Haz clic para leer el artículo completo!`,
        url_accion: `/blog/${params.articulo_id}`,
        entidad_id: params.articulo_id,
        entidad_tipo: 'articulo',
        excluir_usuario: params.autor_id,
        datos_adicionales: {
            titulo_articulo: params.titulo_articulo,
            resumen: params.resumen
        }
    });
}

/**
 * 💳 NOTIFICACIÓN: Pago aprobado
 */
export async function notificarPagoAprobado(params: {
    usuario_id: string;
    transaccion_id: string;
    monto: number;
    curso_titulo?: string;
    curso_id?: string;
}) {
    return await crearNotificacion({
        tipo: 'pago_aprobado',
        usuario_id: params.usuario_id,
        mensaje: params.curso_titulo
            ? `Tu pago de $${params.monto.toLocaleString()} para el curso "${params.curso_titulo}" ha sido aprobado. ¡Ya puedes empezar a aprender!`
            : `Tu pago de $${params.monto.toLocaleString()} ha sido aprobado exitosamente.`,
        url_accion: params.curso_id ? `/cursos/${params.curso_id}` : '/mis-cursos',
        entidad_id: params.transaccion_id,
        entidad_tipo: 'transaccion',
        datos_adicionales: {
            transaccion_id: params.transaccion_id,
            monto: params.monto,
            curso_titulo: params.curso_titulo
        }
    });
}

/**
 * ❌ NOTIFICACIÓN: Pago rechazado
 */
export async function notificarPagoRechazado(params: {
    usuario_id: string;
    transaccion_id: string;
    monto: number;
    razon?: string;
}) {
    return await crearNotificacion({
        tipo: 'pago_rechazado',
        usuario_id: params.usuario_id,
        mensaje: `Tu pago de $${params.monto.toLocaleString()} ha sido rechazado. ${params.razon || 'Por favor, verifica tus datos de pago e inténtalo nuevamente.'}`,
        url_accion: '/mis-pagos',
        entidad_id: params.transaccion_id,
        entidad_tipo: 'transaccion',
        datos_adicionales: {
            transaccion_id: params.transaccion_id,
            monto: params.monto,
            razon: params.razon
        }
    });
}

/**
 * 🎉 NOTIFICACIÓN: Inscripción confirmada
 */
export async function notificarInscripcionConfirmada(params: {
    usuario_id: string;
    curso_id: string;
    titulo_curso: string;
}) {
    return await crearNotificacion({
        tipo: 'inscripcion_confirmada',
        usuario_id: params.usuario_id,
        mensaje: `¡Felicidades! Tu inscripción al curso "${params.titulo_curso}" ha sido confirmada. ¡Comienza tu aprendizaje ahora!`,
        url_accion: `/cursos/${params.curso_id}`,
        entidad_id: params.curso_id,
        entidad_tipo: 'inscripcion',
        datos_adicionales: {
            curso_id: params.curso_id,
            titulo_curso: params.titulo_curso
        }
    });
}

/**
 * 👥 NOTIFICACIÓN: Nueva publicación en comunidad
 */
export async function notificarNuevaPublicacionComunidad(params: {
    publicacion_id: string;
    titulo_publicacion: string;
    contenido: string;
    autor_id: string;
    autor_nombre: string;
}) {
    // Crear preview del contenido
    const contenidoPreview = params.contenido.length > 100
        ? params.contenido.substring(0, 100) + '...'
        : params.contenido;

    return await crearNotificacion({
        tipo: 'nueva_publicacion_comunidad',
        mensaje: `👥 ${params.autor_nombre} compartió:\n\n"${params.titulo_publicacion}"\n\n${contenidoPreview}\n\n💬 ¡Únete a la conversación!`,
        url_accion: `/comunidad/publicacion/${params.publicacion_id}`,
        entidad_id: params.publicacion_id,
        entidad_tipo: 'publicacion',
        excluir_usuario: params.autor_id,
        datos_adicionales: {
            autor_nombre: params.autor_nombre,
            titulo_publicacion: params.titulo_publicacion,
            contenido: params.contenido
        }
    });
}

/**
 * 💬 NOTIFICACIÓN: Nuevo comentario
 */
export async function notificarNuevoComentario(params: {
    comentario_id: string;
    publicacion_id: string;
    titulo_publicacion: string;
    comentario_texto: string;
    comentarista_id: string;
    comentarista_nombre: string;
    autor_publicacion_id: string;
}) {
    return await crearNotificacion({
        tipo: 'nuevo_comentario',
        usuario_id: params.autor_publicacion_id,
        mensaje: `${params.comentarista_nombre} comentó en tu publicación "${params.titulo_publicacion}": ${params.comentario_texto.substring(0, 100)}${params.comentario_texto.length > 100 ? '...' : ''}`,
        url_accion: `/comunidad/publicacion/${params.publicacion_id}#comentario-${params.comentario_id}`,
        // NO usar entidad_id para comentarios de comunidad porque esa columna no existe
        entidad_tipo: 'comentario',
        datos_adicionales: {
            comentario_id: params.comentario_id,
            publicacion_id: params.publicacion_id,
            comentarista_nombre: params.comentarista_nombre,
            titulo_publicacion: params.titulo_publicacion
        }
    });
}

/**
 * 👋 NOTIFICACIÓN: Bienvenida a nuevo usuario
 */
export async function notificarBienvenidaUsuario(params: {
    usuario_id: string;
    nombre_usuario: string;
}) {
    return await crearNotificacion({
        tipo: 'bienvenida_usuario',
        usuario_id: params.usuario_id,
        mensaje: `¡Hola ${params.nombre_usuario}! Te damos la bienvenida a Academia Vallenata Online. Explora nuestros cursos y comienza tu viaje musical.`,
        url_accion: '/cursos',
        datos_adicionales: {
            nombre_usuario: params.nombre_usuario,
            fecha_registro: new Date().toISOString()
        }
    });
}

/**
 * 🚀 NOTIFICACIÓN: Actualización de la plataforma
 */
export async function notificarActualizacionPlataforma(params: {
    version: string;
    titulo_actualizacion: string;
    descripcion: string;
    url_changelog?: string;
}) {
    return await crearNotificacion({
        tipo: 'nueva_actualizacion_plataforma',
        mensaje: `🚀 ${params.titulo_actualizacion} (v${params.version}): ${params.descripcion}`,
        url_accion: params.url_changelog || '/novedades',
        datos_adicionales: {
            version: params.version,
            titulo_actualizacion: params.titulo_actualizacion
        }
    });
}

/**
 * 🎁 NOTIFICACIÓN: Promoción especial
 */
export async function notificarPromocionEspecial(params: {
    titulo_promocion: string;
    descripcion: string;
    codigo_descuento?: string;
    fecha_limite?: string;
    url_promocion?: string;
    solo_estudiantes?: boolean;
}) {
    return await crearNotificacion({
        tipo: 'promocion_especial',
        mensaje: `${params.descripcion}${params.codigo_descuento ? ` Código: ${params.codigo_descuento}` : ''}${params.fecha_limite ? ` Válido hasta: ${new Date(params.fecha_limite).toLocaleDateString('es-ES')}` : ''}`,
        url_accion: params.url_promocion || '/cursos',
        solo_roles: params.solo_estudiantes ? ['user'] : undefined,
        datos_adicionales: {
            titulo_promocion: params.titulo_promocion,
            codigo_descuento: params.codigo_descuento,
            fecha_limite: params.fecha_limite
        }
    });
}

/**
 * 🧹 Función de limpieza automática de notificaciones expiradas
 */
export async function limpiarNotificacionesExpiradas() {
    try {
        const { data, error } = await supabase
            .from('notificaciones')
            .delete()
            .lt('fecha_expiracion', new Date().toISOString())
            .select('id');

        if (error) {
            console.error('Error al limpiar notificaciones expiradas:', error);
            return { exito: false, error: error.message };
        }

        console.log(`🧹 Notificaciones expiradas eliminadas: ${data?.length || 0}`);
        return { exito: true, eliminadas: data?.length || 0 };

    } catch (error) {
        console.error('Error en limpieza de notificaciones:', error);
        return { exito: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

/**
 * 📊 Función para obtener estadísticas de notificaciones
 */
export async function obtenerEstadisticasNotificaciones() {
    try {
        const { data, error } = await supabase
            .from('notificaciones')
            .select(`
        tipo,
        categoria,
        prioridad,
        leida,
        fecha_creacion
      `);

        if (error) {
            return { exito: false, error: error.message };
        }

        // Procesar estadísticas
        const estadisticas = {
            total: data.length,
            leidas: data.filter(n => n.leida).length,
            no_leidas: data.filter(n => !n.leida).length,
            por_categoria: {} as Record<string, number>,
            por_tipo: {} as Record<string, number>,
            por_prioridad: {} as Record<string, number>,
            ultimos_30_dias: data.filter(n => {
                const fecha = new Date(n.fecha_creacion);
                const hace30dias = new Date();
                hace30dias.setDate(hace30dias.getDate() - 30);
                return fecha >= hace30dias;
            }).length
        };

        // Agrupar por categorías, tipos y prioridades
        data.forEach(notif => {
            estadisticas.por_categoria[notif.categoria] = (estadisticas.por_categoria[notif.categoria] || 0) + 1;
            estadisticas.por_tipo[notif.tipo] = (estadisticas.por_tipo[notif.tipo] || 0) + 1;
            estadisticas.por_prioridad[notif.prioridad] = (estadisticas.por_prioridad[notif.prioridad] || 0) + 1;
        });

        return { exito: true, estadisticas };

    } catch (error) {
        return { exito: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}
