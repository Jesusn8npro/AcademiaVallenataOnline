import { supabase } from '../clienteSupabase';
import { crearNotificacion } from '../generadorNotificaciones';
import type { Mensaje } from '../../tipos/mensajeria';

async function enviarNotificacionesMensaje(chatId: string, mensaje: any, autorId: string): Promise<void> {
    try {
        const { data: chatInfo } = await supabase
            .from('chats')
            .select(`
                nombre,
                es_grupal,
                miembros_chat!inner(
                    usuario_id,
                    notificaciones_activadas,
                    usuario:perfiles!miembros_chat_usuario_id_fkey(nombre_completo)
                )
            `)
            .eq('id', chatId)
            .single();

        if (!chatInfo) return;

        const { data: autor } = await supabase
            .from('perfiles')
            .select('nombre_completo')
            .eq('id', autorId)
            .single();

        const destinatarios = chatInfo.miembros_chat
            .filter((m: any) => m.usuario_id !== autorId && m.notificaciones_activadas)
            .map((m: any) => m.usuario_id);

        if (destinatarios.length === 0) return;

        let nombreChat = chatInfo.nombre;
        if (!nombreChat && !chatInfo.es_grupal) {
            const otroMiembro = chatInfo.miembros_chat.find((m: any) => m.usuario_id !== autorId);
            nombreChat = otroMiembro?.perfil?.nombre_completo || 'Chat';
        }

        await crearNotificacion({
            tipo: 'mensaje_usuario',
            usuarios_ids: destinatarios,
            mensaje: `💬 ${autor?.nombre_completo || 'Usuario'} envió un mensaje${nombreChat ? ` en ${nombreChat}` : ''}`,
            url_accion: `/mensajes/${chatId}`,
            entidad_id: mensaje.id,
            entidad_tipo: 'mensaje',
            datos_adicionales: {
                chat_id: chatId,
                autor_nombre: autor?.nombre_completo,
                nombre_chat: nombreChat,
                contenido_preview: mensaje.contenido?.substring(0, 100) || ''
            }
        });
    } catch (err) {
    }
}

export async function obtenerMensajes(
    chatId: string,
    limite: number = 50,
    antes_de?: string
): Promise<{ mensajes: Mensaje[]; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { mensajes: [], error: 'Usuario no autenticado' };
        }

        let query = supabase
            .from('mensajes')
            .select(`
                *,
                usuario:perfiles!mensajes_usuario_id_fkey(
                    nombre_completo,
                    url_foto_perfil,
                    nombre_usuario
                )
            `)
            .eq('chat_id', chatId)
            .eq('eliminado', false)
            .order('creado_en', { ascending: false })
            .limit(limite);

        if (antes_de) {
            query = query.lt('creado_en', antes_de);
        }

        const { data, error } = await query;

        if (error) {
            return { mensajes: [], error: error.message };
        }

        const mensajesProcesados = (data || []).map((mensaje: any) => ({
            ...mensaje,
            es_mio: mensaje.usuario_id === user.id,
            reacciones: [],
            lecturas: [],
            leido_por_mi: mensaje.usuario_id === user.id
        })).reverse();

        return { mensajes: mensajesProcesados, error: null };
    } catch (err) {
        return { mensajes: [], error: 'Error inesperado obteniendo mensajes: ' + (err as Error).message };
    }
}

export async function enviarMensaje(datos: {
    chat_id: string;
    contenido: string;
    tipo?: string;
    url_media?: string;
    metadata?: any;
    mensaje_padre_id?: string;
}): Promise<{ mensaje: Mensaje | null; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { mensaje: null, error: 'Usuario no autenticado' };
        }

        const { data: miembro } = await supabase
            .from('miembros_chat')
            .select('puede_escribir, estado_miembro')
            .eq('chat_id', datos.chat_id)
            .eq('usuario_id', user.id)
            .single();

        if (!miembro || miembro.estado_miembro !== 'activo' || !miembro.puede_escribir) {
            return { mensaje: null, error: 'No tienes permisos para escribir en este chat' };
        }

        const { data: mensajeCreado, error } = await supabase
            .from('mensajes')
            .insert({
                chat_id: datos.chat_id,
                usuario_id: user.id,
                contenido: datos.contenido,
                tipo: datos.tipo || 'texto',
                url_media: datos.url_media,
                metadata: datos.metadata || {},
                mensaje_padre_id: datos.mensaje_padre_id
            })
            .select(`
                *,
                usuario:perfiles!mensajes_usuario_id_fkey(
                    nombre_completo,
                    url_foto_perfil,
                    nombre_usuario
                )
            `)
            .single();

        if (error) {
            return { mensaje: null, error: error.message };
        }

        await enviarNotificacionesMensaje(datos.chat_id, mensajeCreado, user.id);

        return { mensaje: mensajeCreado, error: null };
    } catch (err) {
        return { mensaje: null, error: 'Error inesperado' };
    }
}

export async function marcarMensajesComoLeidos(chatId: string): Promise<{ exito: boolean; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { exito: false, error: 'Usuario no autenticado' };
        }

        const { error } = await supabase.rpc('marcar_mensajes_como_leidos', {
            p_chat_id: chatId,
            p_usuario_id: user.id
        });

        if (error) {
            return { exito: false, error: error.message };
        }

        return { exito: true, error: null };
    } catch (err) {
        return { exito: false, error: 'Error inesperado' };
    }
}

export async function toggleReaccion(mensajeId: string, reaccion: string): Promise<{ exito: boolean; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { exito: false, error: 'Usuario no autenticado' };
        }

        const { data: reaccionExistente } = await supabase
            .from('mensajes_reacciones')
            .select('id')
            .eq('mensaje_id', mensajeId)
            .eq('usuario_id', user.id)
            .eq('reaccion', reaccion)
            .single();

        if (reaccionExistente) {
            const { error } = await supabase
                .from('mensajes_reacciones')
                .delete()
                .eq('id', reaccionExistente.id);

            if (error) {
                return { exito: false, error: error.message };
            }
        } else {
            const { error } = await supabase
                .from('mensajes_reacciones')
                .insert({
                    mensaje_id: mensajeId,
                    usuario_id: user.id,
                    reaccion
                });

            if (error) {
                return { exito: false, error: error.message };
            }
        }

        return { exito: true, error: null };
    } catch (err) {
        return { exito: false, error: 'Error inesperado' };
    }
}
