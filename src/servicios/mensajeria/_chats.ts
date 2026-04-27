import { supabase } from '../clienteSupabase';
import type { Chat } from '../../tipos/mensajeria';

async function buscarChatPrivadoExistente(usuario1_id: string, usuario2_id: string): Promise<Chat | null> {
    try {
        const { data, error } = await supabase
            .from('chats')
            .select(`
                *,
                miembros_chat!inner(usuario_id)
            `)
            .eq('es_grupal', false)
            .eq('activo', true);

        if (error || !data) return null;

        for (const chat of data) {
            const miembrosIds = chat.miembros_chat.map((m: any) => m.usuario_id);
            if (miembrosIds.length === 2 &&
                miembrosIds.includes(usuario1_id) &&
                miembrosIds.includes(usuario2_id)) {
                return chat;
            }
        }

        return null;
    } catch (err) {
        return null;
    }
}

async function enviarMensajeSistema(chatId: string, contenido: string): Promise<void> {
    try {
        await supabase.from('mensajes').insert({
            chat_id: chatId,
            usuario_id: null,
            contenido,
            tipo: 'sistema'
        });
    } catch (err) {
    }
}

export async function obtenerChatsUsuario(): Promise<{ chats: Chat[]; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { chats: [], error: 'Usuario no autenticado' };
        }

        const { data: chatsUsuario, error: errorChatsUsuario } = await supabase
            .from('miembros_chat')
            .select('chat_id')
            .eq('usuario_id', user.id)
            .eq('estado_miembro', 'activo');

        if (errorChatsUsuario) {
            return { chats: [], error: errorChatsUsuario.message };
        }

        const chatIds = chatsUsuario?.map((c: any) => c.chat_id) || [];

        if (chatIds.length === 0) {
            return { chats: [], error: null };
        }

        const { data, error } = await supabase
            .from('chats')
            .select(`
                *,
                miembros_chat(
                    *,
                    usuario:perfiles!miembros_chat_usuario_id_fkey(
                        id,
                        nombre,
                        apellido,
                        nombre_completo,
                        url_foto_perfil,
                        nombre_usuario,
                        rol
                    )
                )
            `)
            .in('id', chatIds)
            .eq('activo', true)
            .order('ultimo_mensaje_fecha', { ascending: false, nullsFirst: false });

        if (error) {
            return { chats: [], error: error.message };
        }

        const chatsConInfo = await Promise.all((data || []).map(async (chat: any) => {
            const miembroActual = chat.miembros_chat.find((m: any) => m.usuario_id === user.id);

            let ultimoMensaje = null;
            try {
                const { data: mensajeData } = await supabase
                    .from('mensajes')
                    .select(`
                        id,
                        contenido,
                        tipo,
                        creado_en,
                        usuario_id,
                        usuario:perfiles!mensajes_usuario_id_fkey(
                            nombre,
                            apellido,
                            nombre_completo,
                            nombre_usuario
                        )
                    `)
                    .eq('chat_id', chat.id)
                    .eq('eliminado', false)
                    .order('creado_en', { ascending: false })
                    .limit(1)
                    .single();

                ultimoMensaje = mensajeData;
            } catch (err) {
                ultimoMensaje = null;
            }

            return {
                ...chat,
                mensajes_no_leidos: miembroActual?.mensajes_no_leidos || 0,
                miembros: chat.miembros_chat,
                ultimo_mensaje: ultimoMensaje
            };
        }));

        return { chats: chatsConInfo, error: null };
    } catch (err) {
        return { chats: [], error: 'Error inesperado' };
    }
}

export async function crearChat(datos: {
    es_grupal: boolean;
    nombre?: string;
    descripcion?: string;
    imagen_url?: string;
    miembros_ids: string[];
}): Promise<{ chat: Chat | null; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { chat: null, error: 'Usuario no autenticado' };
        }

        if (datos.es_grupal && !datos.nombre) {
            return { chat: null, error: 'Los grupos deben tener un nombre' };
        }

        if (datos.miembros_ids.length === 0) {
            return { chat: null, error: 'Debe incluir al menos un miembro' };
        }

        if (!datos.es_grupal && datos.miembros_ids.length === 1) {
            const chatExistente = await buscarChatPrivadoExistente(user.id, datos.miembros_ids[0]);
            if (chatExistente) {
                return { chat: chatExistente, error: null };
            }
        }

        const { data: chatCreado, error: errorChat } = await supabase
            .from('chats')
            .insert({
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                imagen_url: datos.imagen_url,
                es_grupal: datos.es_grupal,
                tipo_chat: datos.es_grupal ? 'grupo' : 'privado',
                creado_por: user.id
            })
            .select()
            .single();

        if (errorChat) {
            return { chat: null, error: errorChat.message };
        }

        const todosLosMiembros = [user.id, ...datos.miembros_ids];
        const miembrosUnicos = [...new Set(todosLosMiembros)];

        const miembrosData = miembrosUnicos.map((usuario_id) => ({
            chat_id: chatCreado.id,
            usuario_id,
            es_admin: usuario_id === user.id,
            puede_escribir: true,
            puede_invitar: datos.es_grupal ? usuario_id === user.id : false
        }));

        const { error: errorMiembros } = await supabase
            .from('miembros_chat')
            .insert(miembrosData);

        if (errorMiembros) {
            await supabase.from('chats').delete().eq('id', chatCreado.id);
            return { chat: null, error: 'Error agregando miembros al chat' };
        }

        await supabase.from('chats_configuracion').insert({
            chat_id: chatCreado.id,
            solo_admins_pueden_escribir: false,
            permitir_reacciones: true,
            permitir_respuestas: true,
            permitir_adjuntos: true,
            tamaño_maximo_archivo_mb: 10,
            tipos_archivo_permitidos: ['imagen', 'video', 'audio', 'documento']
        });

        if (datos.es_grupal) {
            await enviarMensajeSistema(chatCreado.id, `💫 ${datos.nombre} ha sido creado`);
        }

        return { chat: chatCreado, error: null };
    } catch (err) {
        return { chat: null, error: 'Error inesperado' };
    }
}
