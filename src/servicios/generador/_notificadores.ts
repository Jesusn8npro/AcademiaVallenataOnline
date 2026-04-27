import { supabase } from '../clienteSupabase';
import { crearNotificacion } from './_core';

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
        datos_adicionales: { titulo_curso: params.titulo_curso }
    });
}

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
        datos_adicionales: { titulo_tutorial: params.titulo_tutorial }
    });
}

export async function notificarNuevaLeccion(params: {
    curso_id: string;
    leccion_id: string;
    titulo_leccion: string;
    titulo_curso: string;
}) {
    const { data: inscritos, error } = await supabase
        .from('inscripciones')
        .select('usuario_id')
        .eq('curso_id', params.curso_id)
        .eq('estado', 'activa');

    if (error || !inscritos?.length) {
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

export async function notificarNuevoArticuloBlog(params: {
    articulo_id: string;
    titulo_articulo: string;
    resumen: string;
    autor_id: string;
}) {
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
        datos_adicionales: { titulo_articulo: params.titulo_articulo, resumen: params.resumen }
    });
}

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
        datos_adicionales: { transaccion_id: params.transaccion_id, monto: params.monto, razon: params.razon }
    });
}

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
        datos_adicionales: { curso_id: params.curso_id, titulo_curso: params.titulo_curso }
    });
}
