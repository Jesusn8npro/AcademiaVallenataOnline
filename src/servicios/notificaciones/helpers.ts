import { supabase } from '../clienteSupabase';
import type { EstadisticasNotificacionesLegacy } from '../../tipos/notificaciones';

export async function obtenerEstadisticasNotificaciones(): Promise<{ success: boolean; data: EstadisticasNotificacionesLegacy; error?: string }> {
    try {
        const [todas, pendientes, leidas, vencidas] = await Promise.all([
            supabase.from('notificaciones').select('id', { count: 'exact' }),
            supabase.from('notificaciones').select('id', { count: 'exact' }).eq('leida', false),
            supabase.from('notificaciones').select('id', { count: 'exact' }).eq('leida', true),
            supabase.from('notificaciones').select('id', { count: 'exact' }).eq('archivada', true),
        ]);

        const data: EstadisticasNotificacionesLegacy = {
            total: Number(todas.count || 0),
            pendientes: Number(pendientes.count || 0),
            leidas: Number(leidas.count || 0),
            vencidas: Number(vencidas.count || 0)
        };
        return { success: true, data };
    } catch (e: any) {
        return { success: false, data: { total: 0, pendientes: 0, leidas: 0, vencidas: 0 }, error: e.message };
    }
}

export async function notificarNuevoCurso(titulo: string, descripcion?: string) {
    await supabase.from('notificaciones').insert({ tipo: 'nuevo_curso', mensaje: descripcion || `Nuevo curso: ${titulo}`, prioridad: 'normal' });
    return { success: true };
}

export async function notificarNuevoTutorial(titulo: string, descripcion?: string) {
    await supabase.from('notificaciones').insert({ tipo: 'nuevo_tutorial', mensaje: descripcion || `Nuevo tutorial: ${titulo}`, prioridad: 'normal' });
    return { success: true };
}

export async function notificarPagoAprobado(usuario_id: string, monto: number, curso_titulo?: string) {
    await supabase.from('notificaciones').insert({
        tipo: 'pago_aprobado',
        mensaje: curso_titulo ? `Pago aprobado de ${monto} para ${curso_titulo}` : `Pago aprobado de ${monto}`,
        usuario_id,
        prioridad: 'alta'
    });
    return { success: true };
}

export async function notificarPromocionEspecial(titulo: string, descripcion: string, codigo: string, fecha_limite: string) {
    await supabase.from('notificaciones').insert({ tipo: 'promocion', mensaje: `${titulo}: ${descripcion}`, codigo, fecha_limite, prioridad: 'alta' });
    return { success: true };
}

export async function limpiarNotificacionesExpiradas() {
    await supabase.from('notificaciones').update({ archivada: true }).lt('fecha_expiracion', new Date().toISOString());
    return { success: true };
}

export async function notificarNuevoArticuloBlog(payload: {
    articulo_id: string;
    titulo_articulo: string;
    resumen: string;
    autor_id: string;
}): Promise<{ exito: boolean; notificaciones_creadas?: number; error?: string }> {
    try {
        const { error } = await supabase.from('notificaciones').insert({
            tipo: 'nuevo_articulo_blog',
            mensaje: payload.resumen || `Nuevo artículo: ${payload.titulo_articulo}`,
            entidad_id: payload.articulo_id,
            usuario_id: payload.autor_id,
            prioridad: 'normal'
        });
        if (error) throw error;
        return { exito: true, notificaciones_creadas: 1 };
    } catch (e: any) {
        return { exito: false, error: e.message };
    }
}

export async function notificarNuevoMensaje(
    destinatarioId: string,
    remitenteNombre: string,
    mensajePreview: string,
    chatId: string
) {
    try {
        const { error: errorRpc } = await supabase.rpc('crear_notificacion', {
            p_usuario_id: destinatarioId,
            p_tipo: 'mensaje_nuevo',
            p_titulo: `Mensaje de ${remitenteNombre}`,
            p_mensaje: mensajePreview,
            p_categoria: 'comunidad',
            p_prioridad: 'alta',
            p_url_accion: `/mensajes/${chatId}`,
            p_icono: '💬'
        });

        if (!errorRpc) {
            return { success: true };
        }

        const { error: errorInsert } = await supabase.from('notificaciones').insert({
            tipo: 'mensaje_nuevo',
            usuario_id: destinatarioId,
            titulo: `Mensaje de ${remitenteNombre}`,
            mensaje: mensajePreview,
            prioridad: 'alta',
            categoria: 'comunidad',
            icono: '💬',
            url_accion: `/mensajes/${chatId}`
        });

        if (errorInsert) {
            return { success: false, error: errorInsert };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}
