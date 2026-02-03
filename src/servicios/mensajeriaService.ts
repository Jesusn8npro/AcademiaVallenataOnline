import { supabase } from './supabaseCliente'
import { notificarNuevoMensaje } from './notificacionesService'

export interface Mensaje {
    id: string
    chat_id: string
    usuario_id: string
    contenido: string
    tipo: 'texto' | 'imagen' | 'audio' | 'video' | 'archivo' | 'sistema'
    url_media?: string
    creado_en: string
    leido: boolean
    usuario?: {
        id: string
        nombre_completo?: string
        nombre_usuario?: string
        url_foto_perfil?: string
    }
    es_mio?: boolean
}

export const mensajeriaService = {
    /**
     * 📤 Enviar mensaje y notificaciones de forma robusta
     */
    async enviarMensaje(datos: {
        chat_id: string
        contenido: string
        tipo?: string
        url_media?: string
    }) {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Usuario no autenticado')

            // 1. Insertar el mensaje
            const { data: mensajeCreado, error } = await supabase
                .from('mensajes')
                .insert({
                    chat_id: datos.chat_id,
                    usuario_id: user.id,
                    contenido: datos.contenido,
                    tipo: datos.tipo || 'texto',
                    url_media: datos.url_media
                })
                .select(`
          *,
          usuario:perfiles!mensajes_usuario_id_fkey(
            id, nombre_completo, nombre_usuario, url_foto_perfil
          )
        `)
                .single()

            if (error) throw error

            // 2. Enviar notificaciones a los otros miembros con lógica Svelte
            await this.enviarNotificaciones(datos.chat_id, mensajeCreado, user)

            return { mensaje: mensajeCreado, error: null }
        } catch (err: any) {
            console.error('Error enviando mensaje:', err)
            return { mensaje: null, error: err.message }
        }
    },

    /**
     * 🔔 Lógica de notificaciones espejo a Svelte
     */
    async enviarNotificaciones(chatId: string, mensaje: any, autor: any) {
        try {
            // Obtener miembros del chat para saber a quién notificar
            const { data: chatInfo } = await supabase
                .from('chats')
                .select(`
          nombre, es_grupal,
          miembros_chat!inner(
            usuario_id,
            usuario:perfiles!miembros_chat_usuario_id_fkey(nombre_completo)
          )
        `)
                .eq('id', chatId)
                .single()

            if (!chatInfo) return

            // Filtrar destinatarios (todos menos el autor)
            const destinatarios = chatInfo.miembros_chat
                .filter((m: any) => m.usuario_id !== autor.id)
                .map((m: any) => m.usuario_id)

            if (destinatarios.length === 0) return

            // Determinar nombre del chat
            let nombreChat = chatInfo.nombre
            if (!nombreChat && !chatInfo.es_grupal) {
                nombreChat = null
            }

            // Nombre del remitente
            let nombreRemitente = 'Usuario'
            if (mensaje.usuario?.nombre_completo) nombreRemitente = mensaje.usuario.nombre_completo

            console.log(`🔔 Enviando notificaciones a ${destinatarios.length} usuarios (RLS Bypassed via RPC)`)

            // Enviar a cada destinatario
            for (const destinatarioId of destinatarios) {
                await notificarNuevoMensaje(
                    destinatarioId,
                    nombreRemitente,
                    mensaje.contenido.substring(0, 50) + (mensaje.contenido.length > 50 ? '...' : ''),
                    chatId
                )
            }

        } catch (err) {
            console.error('Error en proceso de notificaciones:', err)
        }
    },

    /**
     * 📥 Obtener mensajes iniciales
     */
    async obtenerMensajes(chatId: string, limite = 50) {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from('mensajes')
                .select(`
          *,
          usuario:perfiles!mensajes_usuario_id_fkey(
            id, nombre_completo, nombre_usuario, url_foto_perfil
          )
        `)
                .eq('chat_id', chatId)
                .eq('eliminado', false)
                .order('creado_en', { ascending: false })
                .limit(limite)

            if (error) throw error

            const mensajes = (data || []).reverse().map((m: any) => ({
                ...m,
                es_mio: m.usuario_id === user?.id
            }))

            return { mensajes, error: null }
        } catch (err: any) {
            console.error('Error obteniendo mensajes:', err)
            return { mensajes: [], error: err.message }
        }
    },

    /**
     * 🚀 Suscripción en Tiempo Real (Bidireccional)
     */
    suscribirseAChat(chatId: string, onNuevoMensaje: (msg: any) => void) {
        const channelName = `chat_${chatId}_${Date.now()}`

        return supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mensajes',
                    filter: `chat_id=eq.${chatId}`
                },
                async (payload) => {
                    if (payload.new) {
                        const { data: usuario } = await supabase
                            .from('perfiles')
                            .select('id, nombre_completo, nombre_usuario, url_foto_perfil')
                            .eq('id', payload.new.usuario_id)
                            .single()

                        // Determinar si es mío en el momento de recibirlo
                        const { data: { user } } = await supabase.auth.getUser()

                        const mensajeEnriquecido = {
                            ...payload.new,
                            usuario: usuario || null,
                            es_mio: user?.id === payload.new.usuario_id
                        }
                        onNuevoMensaje(mensajeEnriquecido)
                    }
                }
            )
            .subscribe()
    },

    /**
     * 🔍 Buscar usuarios por nombre o username
     */
    async buscarUsuarios(termino: string) {
        try {
            if (!termino || termino.length < 2) return { usuarios: [], error: null }

            const { data: { user } } = await supabase.auth.getUser()

            const query = supabase
                .from('perfiles')
                .select('id, nombre_completo, nombre_usuario, url_foto_perfil')
                .neq('id', user?.id)
                .limit(10)

            if (termino.includes('@')) {
                // Busqueda por email (si tuviéramos acceso, pero perfiles suele ser público)
                // O mejor, busqueda exacta por username si empieza con @
                const cleanTerm = termino.replace('@', '')
                query.ilike('nombre_usuario', `%${cleanTerm}%`)
            } else {
                query.ilike('nombre_completo', `%${termino}%`)
            }

            const { data, error } = await query

            if (error) throw error
            return { usuarios: data, error: null }
        } catch (err: any) {
            console.error('Error buscando usuarios:', err)
            return { usuarios: [], error: err.message }
        }
    },

    /**
     * ➕ Crear nuevo chat (Individual o Grupal)
     */
    async crearChat(datos: {
        es_grupal: boolean
        nombre?: string
        descripcion?: string
        miembros_ids: string[]
    }) {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            // 1. Si es privado, verificar si ya existe
            if (!datos.es_grupal && datos.miembros_ids.length === 1) {
                const otroId = datos.miembros_ids[0]

                // Buscar chats comunes
                const { data: chatsComunes } = await supabase
                    .rpc('obtener_chat_privado_comun', { otro_usuario_id: otroId })

                // Si RPC no existe, fallback manual (más costoso pero funcional)
                if (!chatsComunes) {
                    // Lógica manual simplificada o llamar a nueva implementación
                } else if (chatsComunes.length > 0) {
                    // Ya existe
                    // Devolver el primero
                    // Necesitamos detalles completos del chat
                    const { data: chatExistente } = await supabase
                        .from('chats')
                        .select(`*, miembros_chat!inner(usuario_id)`)
                        .eq('id', chatsComunes[0].id)
                        .single()

                    return { chat: chatExistente, error: null }
                }
            }

            // 2. Crear el chat
            const { data: chat, error: errorChat } = await supabase
                .from('chats')
                .insert({
                    es_grupal: datos.es_grupal,
                    nombre: datos.es_grupal ? datos.nombre : null,
                    // descripcion: datos.descripcion, // Si existe la columna
                    creado_por: user.id,
                    activo: true
                })
                .select()
                .single()

            if (errorChat) throw errorChat

            // 3. Agregar miembros
            const miembrosParaInsertar = [
                { chat_id: chat.id, usuario_id: user.id, es_admin: true, estado_miembro: 'activo' },
                ...datos.miembros_ids.map(id => ({
                    chat_id: chat.id,
                    usuario_id: id,
                    es_admin: false,
                    estado_miembro: 'activo'
                }))
            ]

            const { error: errorMiembros } = await supabase
                .from('miembros_chat')
                .insert(miembrosParaInsertar)

            if (errorMiembros) throw errorMiembros

            // 4. Devolver chat completo con miembros 
            const { data: chatCompleto, error: errorFinal } = await supabase
                .from('chats')
                .select(`
                    *,
                    miembros_chat(*, usuario:perfiles!miembros_chat_usuario_id_fkey(id,nombre_completo,url_foto_perfil,nombre_usuario))
                `)
                .eq('id', chat.id)
                .single()

            if (errorFinal) throw errorFinal

            return { chat: chatCompleto, error: null }

        } catch (err: any) {
            console.error('Error creando chat:', err)
            return { chat: null, error: err.message }
        }
    },

    /**
     * ✅ Marcar como leídos
     */
    async marcarMensajesComoLeidos(chatId: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Esto depende de cómo manejes "leído". 
            // Si es por mensaje:
            await supabase
                .from('mensajes')
                .update({ leido: true })
                .eq('chat_id', chatId)
                .neq('usuario_id', user.id) // No marcar los míos
                .eq('leido', false)

            // Si tienes una tabla de 'lecturas' o 'miembros_chat.ultimo_leido', actualízalo aquí.
        } catch (err) {
            console.error('Error marcando leídos:', err)
        }
    }
}
