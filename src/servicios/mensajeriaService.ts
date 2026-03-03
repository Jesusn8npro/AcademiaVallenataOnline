import { supabase } from './clienteSupabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { notificacionesService } from './notificacionesService';
import { crearNotificacion } from './generadorNotificaciones';

// ============================================
// TIPOS E INTERFACES
// ============================================

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
	// Datos calculados
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
			// Datos del usuario
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
	// Datos relacionados
	usuario?: {
		id: string;
		nombre_completo: string;
		nombre_usuario: string;
		url_foto_perfil?: string;
	};
	mensaje_padre?: Mensaje;
	reacciones?: MensajeReaccion[];
	leido?: boolean;
	es_mio?: boolean; // Calculado en el frontend
}

export interface MensajeReaccion {
	id: string;
	mensaje_id: string;
	usuario_id: string;
	reaccion: string;
	creado_en: string;
	// Datos del usuario
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

// ============================================
// CLASE PRINCIPAL DEL SERVICIO
// ============================================

class MensajeriaService {
	private channels: Map<string, RealtimeChannel> = new Map();

	// ============================================
	// GESTIÓN DE CHATS
	// ============================================

	/**
	 * 💬 Obtener todos los chats del usuario actual
	 */
	async obtenerChatsUsuario(): Promise<{ chats: Chat[]; error: string | null }> {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				return { chats: [], error: 'Usuario no autenticado' };
			}

			// Primero obtener los IDs de chats donde el usuario es miembro
			const { data: chatsUsuario, error: errorChatsUsuario } = await supabase
				.from('miembros_chat')
				.select('chat_id')
				.eq('usuario_id', user.id)
				.eq('estado_miembro', 'activo');

			if (errorChatsUsuario) {
				console.error('Error obteniendo chats del usuario:', errorChatsUsuario);
				return { chats: [], error: errorChatsUsuario.message };
			}

			const chatIds = chatsUsuario?.map((c: any) => c.chat_id) || [];
			
			if (chatIds.length === 0) {
				return { chats: [], error: null };
			}

			// Ahora obtener los chats completos con TODOS sus miembros
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
				console.error('Error obteniendo chats:', error);
				return { chats: [], error: error.message };
			}

			// Procesar datos y obtener último mensaje de cada chat
			const chatsConInfo = await Promise.all((data || []).map(async (chat: any) => {
				const miembroActual = chat.miembros_chat.find((m: any) => m.usuario_id === user.id);
				
				// Obtener el último mensaje del chat
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
					// No hay mensajes en este chat
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
			console.error('Error inesperado obteniendo chats:', err);
			return { chats: [], error: 'Error inesperado' };
		}
	}

	/**
	 * 🆕 Crear un nuevo chat
	 */
	async crearChat(datos: {
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

			// Validaciones
			if (datos.es_grupal && !datos.nombre) {
				return { chat: null, error: 'Los grupos deben tener un nombre' };
			}

			if (datos.miembros_ids.length === 0) {
				return { chat: null, error: 'Debe incluir al menos un miembro' };
			}

			// Verificar si ya existe un chat privado entre estos usuarios
			if (!datos.es_grupal && datos.miembros_ids.length === 1) {
				const chatExistente = await this.buscarChatPrivadoExistente(user.id, datos.miembros_ids[0]);
				if (chatExistente) {
					return { chat: chatExistente, error: null };
				}
			}

			// Crear el chat
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
				console.error('Error creando chat:', errorChat);
				return { chat: null, error: errorChat.message };
			}

			// Agregar miembros (incluyendo al creador)
			const todosLosMiembros = [user.id, ...datos.miembros_ids];
			const miembrosUnicos = [...new Set(todosLosMiembros)];

			const miembrosData = miembrosUnicos.map((usuario_id, index) => ({
				chat_id: chatCreado.id,
				usuario_id,
				es_admin: usuario_id === user.id, // El creador es admin
				puede_escribir: true,
				puede_invitar: datos.es_grupal ? usuario_id === user.id : false
			}));

			const { error: errorMiembros } = await supabase
				.from('miembros_chat')
				.insert(miembrosData);

			if (errorMiembros) {
				console.error('Error agregando miembros:', errorMiembros);
				// Intentar limpiar el chat creado
				await supabase.from('chats').delete().eq('id', chatCreado.id);
				return { chat: null, error: 'Error agregando miembros al chat' };
			}

			// Crear configuración por defecto
			await supabase.from('chats_configuracion').insert({
				chat_id: chatCreado.id,
				solo_admins_pueden_escribir: false,
				permitir_reacciones: true,
				permitir_respuestas: true,
				permitir_adjuntos: true,
				tamaño_maximo_archivo_mb: 10,
				tipos_archivo_permitidos: ['imagen', 'video', 'audio', 'documento']
			});

			// Enviar mensaje de sistema si es un grupo
			if (datos.es_grupal) {
				await this.enviarMensajeSistema(chatCreado.id, `💫 ${datos.nombre} ha sido creado`);
			}

			return { chat: chatCreado, error: null };
		} catch (err) {
			console.error('Error inesperado creando chat:', err);
			return { chat: null, error: 'Error inesperado' };
		}
	}

	/**
	 * 🔍 Buscar chat privado existente entre dos usuarios
	 */
	private async buscarChatPrivadoExistente(usuario1_id: string, usuario2_id: string): Promise<Chat | null> {
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

			// Buscar chat que tenga exactamente estos dos usuarios
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
			console.error('Error buscando chat privado existente:', err);
			return null;
		}
	}

	// ============================================
	// GESTIÓN DE MENSAJES
	// ============================================

	/**
	 * 📨 Obtener mensajes de un chat (con paginación)
	 */
	async obtenerMensajes(
		chatId: string, 
		limite: number = 50, 
		antes_de?: string
	): Promise<{ mensajes: Mensaje[]; error: string | null }> {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				return { mensajes: [], error: 'Usuario no autenticado' };
			}

			// CONSULTA SIMPLIFICADA PARA DEBUGGING
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
				console.error('Error obteniendo mensajes:', error);
				return { mensajes: [], error: error.message };
			}

			// Procesar mensajes con información básica
			const mensajesProcesados = (data || []).map((mensaje: any) => ({
				...mensaje,
				es_mio: mensaje.usuario_id === user.id,
				reacciones: [], // Por ahora vacío para debugging
				lecturas: [], // Por ahora vacío para debugging
				leido_por_mi: mensaje.usuario_id === user.id
			})).reverse();

			return { mensajes: mensajesProcesados, error: null };
		} catch (err) {
			console.error('Error inesperado obteniendo mensajes:', err);
			return { mensajes: [], error: 'Error inesperado obteniendo mensajes: ' + (err as Error).message };
		}
	}

	/**
	 * 📤 Enviar un mensaje
	 */
	async enviarMensaje(datos: {
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

			// Verificar permisos
			const { data: miembro } = await supabase
				.from('miembros_chat')
				.select('puede_escribir, estado_miembro')
				.eq('chat_id', datos.chat_id)
				.eq('usuario_id', user.id)
				.single();

			if (!miembro || miembro.estado_miembro !== 'activo' || !miembro.puede_escribir) {
				return { mensaje: null, error: 'No tienes permisos para escribir en este chat' };
			}

			// Crear el mensaje
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
				console.error('Error enviando mensaje:', error);
				return { mensaje: null, error: error.message };
			}

			// Enviar notificaciones a otros miembros
			await this.enviarNotificacionesMensaje(datos.chat_id, mensajeCreado, user.id);

			return { mensaje: mensajeCreado, error: null };
		} catch (err) {
			console.error('Error inesperado enviando mensaje:', err);
			return { mensaje: null, error: 'Error inesperado' };
		}
	}

	/**
	 * 📢 Enviar mensaje de sistema
	 */
	private async enviarMensajeSistema(chatId: string, contenido: string): Promise<void> {
		try {
			await supabase.from('mensajes').insert({
				chat_id: chatId,
				usuario_id: null, // Mensaje del sistema
				contenido,
				tipo: 'sistema'
			});
		} catch (err) {
			console.error('Error enviando mensaje de sistema:', err);
		}
	}

	/**
	 * ✅ Marcar mensajes como leídos
	 */
	async marcarMensajesComoLeidos(chatId: string): Promise<{ exito: boolean; error: string | null }> {
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
				console.error('Error marcando mensajes como leídos:', error);
				return { exito: false, error: error.message };
			}

			return { exito: true, error: null };
		} catch (err) {
			console.error('Error inesperado marcando mensajes como leídos:', err);
			return { exito: false, error: 'Error inesperado' };
		}
	}

	// ============================================
	// GESTIÓN DE REACCIONES
	// ============================================

	/**
	 * 😊 Agregar/quitar reacción a un mensaje
	 */
	async toggleReaccion(mensajeId: string, reaccion: string): Promise<{ exito: boolean; error: string | null }> {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				return { exito: false, error: 'Usuario no autenticado' };
			}

			// Verificar si ya existe la reacción
			const { data: reaccionExistente } = await supabase
				.from('mensajes_reacciones')
				.select('id')
				.eq('mensaje_id', mensajeId)
				.eq('usuario_id', user.id)
				.eq('reaccion', reaccion)
				.single();

			if (reaccionExistente) {
				// Quitar reacción
				const { error } = await supabase
					.from('mensajes_reacciones')
					.delete()
					.eq('id', reaccionExistente.id);

				if (error) {
					return { exito: false, error: error.message };
				}
			} else {
				// Agregar reacción
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
			console.error('Error gestionando reacción:', err);
			return { exito: false, error: 'Error inesperado' };
		}
	}

	// ============================================
	// NOTIFICACIONES
	// ============================================

	/**
	 * 🔔 Enviar notificaciones de nuevo mensaje
	 */
	private async enviarNotificacionesMensaje(chatId: string, mensaje: any, autorId: string): Promise<void> {
		try {
			// Obtener información del chat y miembros
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

			// Obtener datos del autor
			const { data: autor } = await supabase
				.from('perfiles')
				.select('nombre_completo')
				.eq('id', autorId)
				.single();

			// Preparar destinatarios (excluir al autor)
			const destinatarios = chatInfo.miembros_chat
				.filter((m: any) => m.usuario_id !== autorId && m.notificaciones_activadas)
				.map((m: any) => m.usuario_id);

			if (destinatarios.length === 0) return;

			// Determinar nombre del chat para la notificación
			let nombreChat = chatInfo.nombre;
			if (!nombreChat && !chatInfo.es_grupal) {
				// Para chats privados, usar el nombre del otro usuario
				const otroMiembro = chatInfo.miembros_chat.find((m: any) => m.usuario_id !== autorId);
				nombreChat = otroMiembro?.perfil?.nombre_completo || 'Chat';
			}

			// Crear notificación
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
			console.error('Error enviando notificaciones de mensaje:', err);
		}
	}

	// ============================================
	// TIEMPO REAL
	// ============================================

	/**
	 * 🚀 REALTIME BIDIRECCIONAL FUNCIONAL
	 */
	async suscribirseAChat(
		chatId: string, 
		callbacks: {
			onNuevoMensaje?: (mensaje: any) => void;
			onConexionCambiada?: (estado: string) => void;
		}
	): Promise<void> {
		try {
			console.log(`🚀 [REALTIME-BI] Iniciando suscripción BIDIRECCIONAL al chat: ${chatId}`);

			// 1. LIMPIAR suscripción anterior completamente
			await this.limpiarSuscripcion(chatId);

			// 2. OBTENER usuario actual para logs
			const { data: { user } } = await supabase.auth.getUser();
			const userId = user?.id || 'unknown';
			console.log(`👤 [REALTIME-BI] Usuario conectándose: ${userId}`);

			// 3. CREAR canal único con timestamp para evitar conflictos
			const channelName = `bidirectional_chat_${chatId}_${userId}_${Date.now()}`;
			console.log(`📡 [REALTIME-BI] Creando canal: ${channelName}`);

			const channel = supabase
				.channel(channelName)
				// 4. VERIFICAR conexión del sistema
				.on('system', { event: 'connected' }, () => {
					console.log(`🔌 [REALTIME-BI] Canal conectado al sistema Supabase para usuario ${userId}`);
				})
				// 5. ESCUCHAR TODOS los mensajes del chat (sin filtrar por usuario)
				.on(
					'postgres_changes',
					{
						event: 'INSERT',
						schema: 'public',
						table: 'mensajes',
						filter: `chat_id=eq.${chatId}` // ✅ FILTRO CORRECTO - SOLO POR CHAT
					},
					(payload: any) => {
						console.log(`🎉 [REALTIME-BI] ¡MENSAJE DETECTADO! Usuario: ${userId}`);
						console.log(`📝 [REALTIME-BI] "${payload.new?.contenido}" por ${payload.new?.usuario_id}`);
						console.log(`💬 [REALTIME-BI] Chat: ${payload.new?.chat_id}`);
						console.log(`🔄 [REALTIME-BI] ¿Es mi mensaje?: ${payload.new?.usuario_id === userId}`);
						
						// Verificar que es del chat correcto
						if (payload.new?.chat_id === chatId) {
							console.log(`✅ [REALTIME-BI] Mensaje del chat correcto, enviando a callback`);
							
							// IMPORTANTE: Enviar TODOS los mensajes al callback
							// El filtrado se hace en el componente ChatVista
							if (callbacks.onNuevoMensaje) {
								callbacks.onNuevoMensaje(payload.new);
							}
						} else {
							console.log(`⚠️ [REALTIME-BI] Mensaje de otro chat ignorado`);
						}
					}
				)
				// 6. MANEJAR estados de conexión
				.subscribe((status: any) => {
					console.log(`🔗 [REALTIME-BI] Estado para usuario ${userId}: ${status}`);
					
					switch (status) {
						case 'SUBSCRIBED':
							console.log(`✅ [REALTIME-BI] ¡${userId} CONECTADO Y ESCUCHANDO CHAT ${chatId}!`);
							break;
						case 'CHANNEL_ERROR':
							console.error(`❌ [REALTIME-BI] Error en canal para usuario ${userId} en chat ${chatId}`);
							break;
						case 'TIMED_OUT':
							console.warn(`⏱️ [REALTIME-BI] Timeout para ${userId} en chat ${chatId}, reintentando...`);
							// Auto-reconectar en caso de timeout
							setTimeout(() => this.suscribirseAChat(chatId, callbacks), 3000);
							break;
						case 'CLOSED':
							console.log(`🔴 [REALTIME-BI] Canal cerrado para ${userId} en chat ${chatId}`);
							break;
					}
					
					if (callbacks.onConexionCambiada) {
						callbacks.onConexionCambiada(status);
					}
				});

			// 7. GUARDAR referencia del canal
			this.channels.set(chatId, channel);
			console.log(`💾 [REALTIME-BI] Canal bidireccional guardado para usuario ${userId} en chat ${chatId}`);

		} catch (error) {
			console.error(`❌ [REALTIME-BI] Error crítico:`, error);
			if (callbacks.onConexionCambiada) {
				callbacks.onConexionCambiada('ERROR');
			}
		}
	}

	/**
	 * 🧹 LIMPIAR suscripción anterior
	 */
	private async limpiarSuscripcion(chatId: string): Promise<void> {
		if (this.channels.has(chatId)) {
			const oldChannel = this.channels.get(chatId);
			console.log(`🧹 [REALTIME-BI] Limpiando canal anterior para chat ${chatId}`);
			
			try {
				await oldChannel?.unsubscribe();
				this.channels.delete(chatId);
				console.log(`✅ [REALTIME-BI] Canal anterior limpiado correctamente`);
			} catch (error) {
				console.error(`❌ [REALTIME-BI] Error limpiando canal:`, error);
			}
		} else {
			console.log(`🔍 [REALTIME-BI] No hay canal previo para limpiar en chat ${chatId}`);
		}
	}



	/**
	 * 🔴 Desuscribirse de un chat BIDIRECCIONAL
	 */
	async desuscribirseDeChat(chatId: string): Promise<void> {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			const userId = user?.id || 'unknown';
			
			console.log(`🔕 [REALTIME-BI] Usuario ${userId} desuscribiéndose del chat: ${chatId}`);
			
			const channel = this.channels.get(chatId);
			if (channel) {
				console.log(`📡 [REALTIME-BI] Canal encontrado, desconectando...`);
				await channel.unsubscribe();
				this.channels.delete(chatId);
				console.log(`✅ [REALTIME-BI] Usuario ${userId} desconectado exitosamente del chat ${chatId}`);
			} else {
				console.log(`⚠️ [REALTIME-BI] No hay canal activo para chat ${chatId}`);
			}
		} catch (err) {
			console.error(`❌ [REALTIME-BI] Error desuscribiendo del chat ${chatId}:`, err);
		}
	}

	/**
	 * 🔴 Desuscribirse de todos los chats
	 */
	async desuscribirseDeTodosLosChats(): Promise<void> {
		try {
			for (const chatId of this.channels.keys()) {
				await this.desuscribirseDeChat(chatId);
			}
		} catch (err) {
			console.error('Error desuscribiéndose de todos los chats:', err);
		}
	}

	// ============================================
	// UTILIDADES
	// ============================================

	/**
	 * 🔍 Buscar usuarios para agregar a chat
	 */
	async buscarUsuarios(termino: string): Promise<{ usuarios: any[]; error: string | null }> {
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
			console.error('Error buscando usuarios:', err);
			return { usuarios: [], error: 'Error inesperado' };
		}
	}

	/**
	 * 📊 Obtener estadísticas de mensajería del usuario
	 */
	async obtenerEstadisticas(): Promise<{ estadisticas: any; error: string | null }> {
		try {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				return { estadisticas: null, error: 'Usuario no autenticado' };
			}

			const [
				{ count: totalChats },
				{ count: mensajesEnviados },
				{ count: mensajesNoLeidos }
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
					.select('mensajes_no_leidos', { count: 'exact', head: false })
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
			console.error('Error obteniendo estadísticas:', err);
			return { estadisticas: null, error: 'Error inesperado' };
		}
	}

	// ============================================
	// ELIMINAR CHAT
	// ============================================

	async eliminarChat(chatId: string): Promise<{ exito: boolean; error: string | null }> {
		try {
			console.log('🗑️ [MENSAJERIA] Eliminando chat:', chatId);

			// Obtener usuario actual
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				return { exito: false, error: 'Usuario no autenticado' };
			}

			// Usar la función SQL que omite las políticas RLS
			const { data, error } = await supabase.rpc('eliminar_chat_completo', {
				p_chat_id: chatId,
				p_usuario_id: user.id
			});

			if (error) {
				console.error('❌ Error llamando función eliminar_chat_completo:', error);
				return { exito: false, error: 'Error eliminando el chat: ' + error.message };
			}

			// La función devuelve JSON con el resultado
			const resultado = data;
			
			if (resultado.exito) {
				console.log('✅ Chat eliminado exitosamente:', resultado.mensaje);
				return { exito: true, error: null };
			} else {
				console.error('❌ Error eliminando chat:', resultado.error);
				return { exito: false, error: resultado.error };
			}

		} catch (err) {
			console.error('❌ Error inesperado eliminando chat:', err);
			return { exito: false, error: 'Error inesperado eliminando chat' };
		}
	}
}

// ============================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================

export const mensajeriaService = new MensajeriaService();
export default mensajeriaService; 


