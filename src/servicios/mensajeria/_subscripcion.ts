import { supabase } from '../clienteSupabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const channels = new Map<string, RealtimeChannel>();

async function limpiarSuscripcion(chatId: string): Promise<void> {
    if (channels.has(chatId)) {
        const oldChannel = channels.get(chatId);
        try {
            await oldChannel?.unsubscribe();
            channels.delete(chatId);
        } catch (error) {
        }
    }
}

export async function suscribirseAChat(
    chatId: string,
    callbacks: {
        onNuevoMensaje?: (mensaje: any) => void;
        onConexionCambiada?: (estado: string) => void;
    }
): Promise<void> {
    try {
        await limpiarSuscripcion(chatId);

        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'unknown';

        const channelName = `bidirectional_chat_${chatId}_${userId}_${Date.now()}`;

        const channel = supabase
            .channel(channelName)
            .on('system', { event: 'connected' }, () => {})
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensajes',
                    filter: `chat_id=eq.${chatId}`
                },
                (payload: any) => {
                    if (payload.new?.chat_id === chatId) {
                        if (callbacks.onNuevoMensaje) {
                            callbacks.onNuevoMensaje(payload.new);
                        }
                    }
                }
            )
            .subscribe((status: any) => {
                switch (status) {
                    case 'TIMED_OUT':
                        setTimeout(() => suscribirseAChat(chatId, callbacks), 3000);
                        break;
                }

                if (callbacks.onConexionCambiada) {
                    callbacks.onConexionCambiada(status);
                }
            });

        channels.set(chatId, channel);

    } catch (error) {
        if (callbacks.onConexionCambiada) {
            callbacks.onConexionCambiada('ERROR');
        }
    }
}

export async function desuscribirseDeChat(chatId: string): Promise<void> {
    try {
        const channel = channels.get(chatId);
        if (channel) {
            await channel.unsubscribe();
            channels.delete(chatId);
        }
    } catch (err) {
    }
}

export async function desuscribirseDeTodosLosChats(): Promise<void> {
    try {
        for (const chatId of channels.keys()) {
            await desuscribirseDeChat(chatId);
        }
    } catch (err) {
    }
}

export async function buscarUsuarios(termino: string): Promise<{ usuarios: any[]; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('perfiles')
            .select('id, nombre_completo, url_foto_perfil, nombre_usuario, rol')
            .or(`nombre_completo.ilike.%${termino}%,nombre_usuario.ilike.%${termino}%`)
            .eq('eliminado', false)
            .limit(10);

        if (error) {
            return { usuarios: [], error: error.message };
        }

        return { usuarios: data || [], error: null };
    } catch (err) {
        return { usuarios: [], error: 'Error inesperado' };
    }
}

export async function obtenerEstadisticasMensajeria(): Promise<{ estadisticas: any; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { estadisticas: null, error: 'Usuario no autenticado' };
        }

        const [
            { count: totalChats },
            { count: mensajesEnviados },
            { data: mensajesNoLeidos }
        ] = await Promise.all([
            supabase
                .from('miembros_chat')
                .select('*', { count: 'exact', head: true })
                .eq('usuario_id', user.id)
                .eq('estado_miembro', 'activo'),
            supabase
                .from('mensajes')
                .select('*', { count: 'exact', head: true })
                .eq('usuario_id', user.id)
                .eq('eliminado', false),
            supabase
                .from('miembros_chat')
                .select('mensajes_no_leidos')
                .eq('usuario_id', user.id)
                .gt('mensajes_no_leidos', 0)
        ]);

        const totalMensajesNoLeidos = mensajesNoLeidos?.reduce((sum: number, item: any) =>
            sum + (item.mensajes_no_leidos || 0), 0) || 0;

        return {
            estadisticas: {
                total_chats: totalChats || 0,
                mensajes_enviados: mensajesEnviados || 0,
                mensajes_no_leidos: totalMensajesNoLeidos
            },
            error: null
        };
    } catch (err) {
        return { estadisticas: null, error: 'Error inesperado' };
    }
}

export async function eliminarChat(chatId: string): Promise<{ exito: boolean; error: string | null }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { exito: false, error: 'Usuario no autenticado' };
        }

        const { data, error } = await supabase.rpc('eliminar_chat_completo', {
            p_chat_id: chatId,
            p_usuario_id: user.id
        });

        if (error) {
            return { exito: false, error: 'Error eliminando el chat: ' + error.message };
        }

        const resultado = data;

        if (resultado.exito) {
            return { exito: true, error: null };
        } else {
            return { exito: false, error: resultado.error };
        }

    } catch (err) {
        return { exito: false, error: 'Error inesperado eliminando chat' };
    }
}
