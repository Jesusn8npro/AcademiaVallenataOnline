import { supabase } from '../clienteSupabase';
import { crearNotificacion } from './_core';

export async function notificarNuevaPublicacionComunidad(params: {
    publicacion_id: string;
    titulo_publicacion: string;
    contenido: string;
    autor_id: string;
    autor_nombre: string;
}) {
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
        entidad_tipo: 'comentario',
        datos_adicionales: {
            comentario_id: params.comentario_id,
            publicacion_id: params.publicacion_id,
            comentarista_nombre: params.comentarista_nombre,
            titulo_publicacion: params.titulo_publicacion
        }
    });
}

export async function notificarBienvenidaUsuario(params: {
    usuario_id: string;
    nombre_usuario: string;
}) {
    return await crearNotificacion({
        tipo: 'bienvenida_usuario',
        usuario_id: params.usuario_id,
        mensaje: `¡Hola ${params.nombre_usuario}! Te damos la bienvenida a Academia Vallenata Online. Explora nuestros cursos y comienza tu viaje musical.`,
        url_accion: '/cursos',
        datos_adicionales: { nombre_usuario: params.nombre_usuario, fecha_registro: new Date().toISOString() }
    });
}

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
        datos_adicionales: { version: params.version, titulo_actualizacion: params.titulo_actualizacion }
    });
}

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

export async function limpiarNotificacionesExpiradas() {
    try {
        const { data, error } = await supabase
            .from('notificaciones')
            .delete()
            .lt('fecha_expiracion', new Date().toISOString())
            .select('id');

        if (error) {
            return { exito: false, error: error.message };
        }

        return { exito: true, eliminadas: data?.length || 0 };

    } catch (error) {
        return { exito: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

export async function obtenerEstadisticasNotificaciones() {
    try {
        const { data, error } = await supabase
            .from('notificaciones')
            .select('tipo, categoria, prioridad, leida, fecha_creacion');

        if (error) {
            return { exito: false, error: error.message };
        }

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
