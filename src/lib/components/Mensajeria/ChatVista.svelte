<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { writable } from 'svelte/store';
	import { mensajeriaService, type Chat, type Mensaje } from '$lib/services/mensajeriaService';
	import { supabase } from '$lib/supabase';
	import { modoOscuro, toggleModoOscuro } from '$lib/stores/temaStore';
	import BurbujaMensaje from './BurbujaMensaje.svelte';
	import EntradaMensaje from './EntradaMensaje.svelte';
	import { goto } from '$app/navigation';
	import { obtenerSlugUsuario } from '$lib/utilidades/utilidadesSlug';
	import { audioManager, TipoEfectoUI, TipoEfectoUI2 } from '$lib/components/SimuladorDefinitivo/audio/AudioManager';
	
	// Crear dispatcher para eventos
	const dispatch = createEventDispatcher();

	// ============================================
	// PROPIEDADES
	// ============================================
	export let chat: Chat | null = null;

	// ============================================
	// ESTADOS
	// ============================================
	let mensajes = writable<Mensaje[]>([]);
	let cargando = true;
	let error = '';
	let contenedorMensajes: HTMLElement;
	let usuarioActual: any = null;
	let mensajeEnRespuesta: Mensaje | null = null;
	let mostrarInfoPanel = false;
	let mostrarConfiguracion = false;
	let buscandoMiembros = '';
	let estadoConexion = 'DESCONECTADO';

	// ============================================
	// INFORMACIÓN DEL OTRO USUARIO
	// ============================================
	$: otroUsuario = (() => {
		if (!chat || !usuarioActual) return null;
		
		if (chat.es_grupal) {
			return {
				nombre_completo: chat.nombre || 'Grupo',
				url_foto_perfil: chat.imagen_url || '/favicon.png',
				estado: `${chat.miembros?.length || 0} miembros`,
				en_linea: true
			};
		} else {
			const otroMiembro = chat.miembros?.find(m => m.usuario_id !== usuarioActual?.id) as any;
			return {
				nombre_completo: otroMiembro?.usuario?.nombre_completo || 'Usuario Desconocido',
				url_foto_perfil: otroMiembro?.usuario?.url_foto_perfil || '/favicon.png',
				estado: otroMiembro?.usuario?.en_linea ? 'En línea' : 'Desconectado',
				en_linea: otroMiembro?.usuario?.en_linea || false,
				usuario_nombre: otroMiembro?.usuario?.nombre_usuario
			};
		}
	})();

	// ============================================
	// OBTENER AVATAR DE USUARIO POR ID - ROBUSTO
	// ============================================
	function obtenerAvatarUsuario(usuarioId: string): string {
		try {
			if (!usuarioId) {
				console.warn(`⚠️ [AVATAR] usuarioId vacío`);
				return '/favicon.png';
			}

			if (!chat?.miembros || !Array.isArray(chat.miembros)) {
				console.warn(`⚠️ [AVATAR] No hay miembros en chat`);
				return '/favicon.png';
			}
			
			const miembro = chat.miembros.find(m => m && m.usuario_id === usuarioId) as any;
			
			if (!miembro) {
				console.warn(`⚠️ [AVATAR] Miembro no encontrado para ID: ${usuarioId}`);
				return '/favicon.png';
			}

			const avatar = miembro?.usuario?.url_foto_perfil;
			return avatar && typeof avatar === 'string' ? avatar : '/favicon.png';
		} catch (err) {
			console.error(`❌ [AVATAR] Error obteniendo avatar para ${usuarioId}:`, err);
			return '/favicon.png';
		}
	}

	// ============================================
	// OBTENER NOMBRE DE USUARIO POR ID - ROBUSTO
	// ============================================
	function obtenerNombreUsuario(usuarioId: string): string {
		try {
			if (!usuarioId) {
				console.warn(`⚠️ [NOMBRE] usuarioId vacío`);
				return 'Usuario';
			}

			if (!chat?.miembros || !Array.isArray(chat.miembros)) {
				console.warn(`⚠️ [NOMBRE] No hay miembros en chat`);
				return 'Usuario';
			}
			
			const miembro = chat.miembros.find(m => m && m.usuario_id === usuarioId) as any;
			
			if (!miembro) {
				console.warn(`⚠️ [NOMBRE] Miembro no encontrado para ID: ${usuarioId}`);
				return 'Usuario';
			}

			const nombreCompleto = miembro?.usuario?.nombre_completo;
			const nombreUsuario = miembro?.usuario?.nombre_usuario;
			
			if (nombreCompleto && typeof nombreCompleto === 'string') {
				return nombreCompleto;
			}
			
			if (nombreUsuario && typeof nombreUsuario === 'string') {
				return nombreUsuario;
			}
			
			return 'Usuario';
		} catch (err) {
			console.error(`❌ [NOMBRE] Error obteniendo nombre para ${usuarioId}:`, err);
			return 'Usuario';
		}
	}

	// ============================================
	// NAVEGAR AL PERFIL DEL USUARIO
	// ============================================
	function navegarAlPerfilUsuario() {
		console.log('🔗 Navegando al perfil del usuario desde chat');
		
		if (!otroUsuario) {
			console.error('❌ No hay información del otro usuario');
			return;
		}

		// Si es un chat grupal, no navegar
		if (chat?.es_grupal) {
			console.log('⚠️ Chat grupal - navegación no disponible');
			return;
		}

		// Encontrar el miembro del otro usuario para obtener su información completa
		const otroMiembro = chat?.miembros?.find(m => m.usuario_id !== usuarioActual?.id) as any;
		
		if (!otroMiembro?.usuario) {
			console.error('❌ No se encontró información del otro usuario');
			return;
		}

		// Crear slug usando función unificada
		const datosUsuario = {
			nombre_usuario: otroMiembro.usuario.nombre_usuario,
			nombre: otroMiembro.usuario.nombre_completo || otroMiembro.usuario.nombre,
			usuario_nombre: otroMiembro.usuario.nombre_usuario,
			usuario_id: otroMiembro.usuario.id
		};
		
		const slug = obtenerSlugUsuario(datosUsuario);
		console.log(`✅ Navegando a: /usuarios/${slug}`);
		goto(`/usuarios/${slug}`);
	}

	// ============================================
	// CICLO DE VIDA
	// ============================================
	onMount(async () => {
		// Obtener usuario actual
		const { data: { user } } = await supabase.auth.getUser();
		if (user) {
			const { data: perfil } = await supabase
				.from('perfiles')
				.select('*')
				.eq('id', user.id)
				.single();
			usuarioActual = perfil;
		}

		// ✅ NO configurar aquí - se hace en la reactividad
	});

	onDestroy(async () => {
		console.log('🧹 [CHAT-VISTA-BI] Limpiando componente...');
		if (chat?.id && usuarioActual?.id) {
			console.log(`🔌 [CHAT-VISTA-BI] Desconectando usuario ${usuarioActual.id} de chat: ${chat.id}`);
			await mensajeriaService.desuscribirseDeChat(chat.id);
			console.log(`✅ [CHAT-VISTA-BI] Usuario ${usuarioActual.id} desconectado del chat: ${chat.id}`);
		}
	});

	// ✅ SIMPLE: Solo cuando cambia el chat
	let ultimoChatId = '';
	$: if (chat && usuarioActual && chat.id !== ultimoChatId) {
		ultimoChatId = chat.id;
		inicializarChat();
	}

	/**
	 * 🚀 Inicializar chat SIMPLE
	 */
	async function inicializarChat() {
		if (!chat || !usuarioActual) return;
		
		console.log(`🚀 Iniciando chat ${chat.id}`);
		
		// Cargar mensajes
		await cargarMensajes();
		
		// Configurar tiempo real
		configurarTiempoReal();
	}

	// ============================================
	// FUNCIONES PRINCIPALES
	// ============================================

	/**
	 * 📥 Cargar mensajes SIMPLE
	 */
	async function cargarMensajes() {
		if (!chat || !usuarioActual) return;

		console.log(`📥 Cargando mensajes para: ${chat.id}`);

		try {
			cargando = true;
			error = '';

			const { mensajes: mensajesObtenidos, error: errorObtenido } = 
				await mensajeriaService.obtenerMensajes(chat.id, 50);

			if (errorObtenido) {
				error = errorObtenido;
				console.error(`❌ Error:`, errorObtenido);
			} else {
				console.log(`✅ ${mensajesObtenidos.length} mensajes cargados`);
				
				const mensajesCompletos = mensajesObtenidos.map(mensaje => ({
					...mensaje,
					es_mio: mensaje.usuario_id === usuarioActual.id,
					usuario: {
						id: mensaje.usuario_id,
						nombre_completo: obtenerNombreUsuario(mensaje.usuario_id),
						nombre_usuario: mensaje.usuario?.nombre_usuario || '',
						url_foto_perfil: obtenerAvatarUsuario(mensaje.usuario_id)
					}
				}));
				
				mensajes.set(mensajesCompletos);
				setTimeout(scrollAlFinal, 100);
			}
		} catch (err) {
			console.error('❌ Error cargando:', err);
			error = 'Error cargando mensajes';
		} finally {
			cargando = false;
		}
	}

	/**
	 * 📤 Enviar mensaje - ROBUSTO
	 */
	async function enviarMensaje(datos: {
		contenido: string;
		tipo?: string;
		url_media?: string;
		metadata?: any;
	}) {
		try {
			// ✅ VALIDACIONES CRÍTICAS
			if (!chat || !chat.id) {
				console.error(`❌ [ENVIO] Chat no disponible`);
				alert('Error: Chat no disponible');
				return;
			}

			if (!usuarioActual || !usuarioActual.id) {
				console.error(`❌ [ENVIO] Usuario no disponible`);
				alert('Error: Usuario no disponible');
				return;
			}

			if (!datos || !datos.contenido || typeof datos.contenido !== 'string' || datos.contenido.trim() === '') {
				console.error(`❌ [ENVIO] Contenido inválido:`, datos);
				alert('Error: Contenido del mensaje inválido');
				return;
			}

			const datosCompletos = {
				chat_id: chat.id,
				contenido: datos.contenido.trim(),
				tipo: datos.tipo || 'texto',
				url_media: datos.url_media || undefined,
				metadata: datos.metadata || {},
				mensaje_padre_id: mensajeEnRespuesta?.id || undefined
			};

			console.log(`📤 [CHAT-VISTA-BI] Enviando mensaje: "${datos.contenido}"`);
			
			// ✅ ENVIAR mensaje directamente (sin temporal)
			// El mensaje aparecerá via TIEMPO REAL para AMBOS usuarios
			const { mensaje, error: errorEnvio } = await mensajeriaService.enviarMensaje(datosCompletos);

			if (errorEnvio) {
				console.error(`❌ [CHAT-VISTA-BI] Error enviando mensaje:`, errorEnvio);
				alert('Error enviando mensaje: ' + errorEnvio);
			} else if (mensaje) {
				console.log(`✅ [CHAT-VISTA-BI] Mensaje enviado exitosamente: ${mensaje.id}`);
				console.log(`⏱️ [CHAT-VISTA-BI] Esperando llegada via tiempo real...`);
				
				// 🔊 SONIDO DE ENVÍO EXITOSO
				try {
					audioManager.reproducirEfectoUI2(TipoEfectoUI2.EXITO);
					console.log(`🔊 [CHAT-VISTA-BI] Sonido de envío reproducido`);
				} catch (err) {
					console.warn(`⚠️ [CHAT-VISTA-BI] Error reproduciendo sonido de envío:`, err);
				}
			} else {
				console.warn(`⚠️ [CHAT-VISTA-BI] Respuesta inesperada del servidor`);
				alert('Advertencia: Respuesta inesperada del servidor');
			}
		} catch (err) {
			console.error(`❌ [CHAT-VISTA-BI] Error crítico enviando mensaje:`, err);
			alert('Error crítico enviando mensaje. Ver consola para detalles.');
		}

		// Limpiar respuesta
		mensajeEnRespuesta = null;
	}

	/**
	 * 📜 Scroll al final - ROBUSTO
	 */
	function scrollAlFinal() {
		try {
			if (contenedorMensajes && contenedorMensajes.scrollTo) {
				// Usar scrollTo con smooth para mejor UX
				contenedorMensajes.scrollTo({
					top: contenedorMensajes.scrollHeight,
					behavior: 'smooth'
				});
			} else if (contenedorMensajes) {
				// Fallback para navegadores más antiguos
				contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
			} else {
				console.warn(`⚠️ [SCROLL] Contenedor de mensajes no disponible`);
			}
		} catch (err) {
			console.error(`❌ [SCROLL] Error haciendo scroll:`, err);
			// Intento de fallback básico
			try {
				if (contenedorMensajes) {
					contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
				}
			} catch (fallbackErr) {
				console.error(`❌ [SCROLL] Error en fallback:`, fallbackErr);
			}
		}
	}

	/**
	 * 🚀 Configurar Realtime BIDIRECCIONAL - ROBUSTO
	 */
	function configurarTiempoReal() {
		try {
			// ✅ VALIDACIONES CRÍTICAS
			if (!chat || !chat.id) {
				console.error(`❌ [CONFIG] Chat no disponible para realtime`);
				return;
			}

			if (!usuarioActual || !usuarioActual.id) {
				console.error(`❌ [CONFIG] Usuario actual no disponible para realtime`);
				return;
			}

			console.log(`🚀 [CHAT-VISTA-BI] Configurando REALTIME BIDIRECCIONAL para chat: ${chat.id}`);
			console.log(`👤 [CHAT-VISTA-BI] Usuario actual: ${usuarioActual.id}`);
			
			estadoConexion = 'CONECTANDO';

		mensajeriaService.suscribirseAChat(chat.id, {
			onNuevoMensaje: (payload: any) => {
				try {
					// ✅ VALIDACIONES CRÍTICAS
					if (!payload) {
						console.error(`❌ [CHAT-VISTA-BI] Payload nulo o indefinido`);
						return;
					}

					if (!payload.id || !payload.usuario_id || !payload.contenido) {
						console.error(`❌ [CHAT-VISTA-BI] Payload incompleto:`, payload);
						return;
					}

					if (!usuarioActual || !usuarioActual.id) {
						console.error(`❌ [CHAT-VISTA-BI] Usuario actual no disponible`);
						return;
					}

					console.log(`🎉 [CHAT-VISTA-BI] ¡MENSAJE RECIBIDO EN TIEMPO REAL!`);
					console.log(`📝 [CHAT-VISTA-BI] "${payload.contenido}" de ${payload.usuario_id}`);
					console.log(`🤔 [CHAT-VISTA-BI] ¿Es mi mensaje?: ${payload.usuario_id === usuarioActual.id}`);
					console.log(`👤 [CHAT-VISTA-BI] Mi usuario actual: ${usuarioActual.id}`);
					
					// ✅ PROCESAR TODOS LOS MENSAJES (propios y de otros)
					mensajes.update(lista => {
						try {
							// Verificar si ya existe (evitar duplicados)
							const existe = lista.some(m => m && m.id === payload.id);
							if (existe) {
								console.log(`⚠️ [CHAT-VISTA-BI] Mensaje duplicado ignorado: ${payload.id}`);
								return lista;
							}
							
							// ✅ Si es MI mensaje, agregarlo directamente
							if (payload.usuario_id === usuarioActual.id) {
								console.log(`👤 [CHAT-VISTA-BI] Es mi mensaje, agregando...`);
								
								// Crear mensaje mío con validaciones
								const miMensaje = {
									...payload,
									es_mio: true,
									usuario: {
										id: usuarioActual.id,
										nombre_completo: usuarioActual.nombre_completo || 'Usuario',
										nombre_usuario: usuarioActual.nombre_usuario || '',
										url_foto_perfil: usuarioActual.url_foto_perfil || '/favicon.png'
									}
								};
								
								console.log(`✅ [CHAT-VISTA-BI] MI MENSAJE AGREGADO: "${miMensaje.contenido}"`);
								
								// Auto-scroll
								setTimeout(() => {
									try {
										scrollAlFinal();
									} catch (err) {
										console.error(`❌ [CHAT-VISTA-BI] Error en scroll:`, err);
									}
								}, 100);
								
								return [...lista, miMensaje];
							} 
							// ✅ Si es de OTRO usuario, agregarlo normalmente
							else {
								console.log(`👥 [CHAT-VISTA-BI] Mensaje de otro usuario, agregando...`);
								
								// Obtener datos del usuario con validaciones
								const nombreUsuario = obtenerNombreUsuario(payload.usuario_id) || 'Usuario';
								const avatarUsuario = obtenerAvatarUsuario(payload.usuario_id) || '/favicon.png';
								
								const nuevoMensaje = {
									...payload,
									es_mio: false,
									usuario: {
										id: payload.usuario_id,
										nombre_completo: nombreUsuario,
										nombre_usuario: '',
										url_foto_perfil: avatarUsuario
									}
								};
								
								console.log(`✅ [CHAT-VISTA-BI] MENSAJE DE OTRO AGREGADO: "${nuevoMensaje.contenido}"`);
								
								// 🔊 SONIDO DE MENSAJE RECIBIDO
								try {
									audioManager.reproducirEfectoUI(TipoEfectoUI.ALERTA_PING);
									console.log(`🔊 [CHAT-VISTA-BI] Sonido de mensaje recibido reproducido`);
								} catch (err) {
									console.warn(`⚠️ [CHAT-VISTA-BI] Error reproduciendo sonido de recepción:`, err);
								}
								
								// Auto-scroll
								setTimeout(() => {
									try {
										scrollAlFinal();
									} catch (err) {
										console.error(`❌ [CHAT-VISTA-BI] Error en scroll:`, err);
									}
								}, 100);
								
								return [...lista, nuevoMensaje];
							}
						} catch (err) {
							console.error(`❌ [CHAT-VISTA-BI] Error procesando mensaje:`, err);
							return lista; // Retornar lista sin cambios si hay error
						}
					});
				} catch (err) {
					console.error(`❌ [CHAT-VISTA-BI] Error crítico en callback:`, err);
				}
			},

			onConexionCambiada: (estado: string) => {
				try {
					console.log(`🔗 [CHAT-VISTA-BI] Estado de conexión: ${estado}`);
					
					// Validar que tenemos los datos necesarios
					if (!estado || typeof estado !== 'string') {
						console.warn(`⚠️ [CHAT-VISTA-BI] Estado de conexión inválido:`, estado);
						return;
					}
					
					estadoConexion = estado;
					
					switch (estado) {
						case 'SUBSCRIBED':
							console.log(`🎉 [CHAT-VISTA-BI] ¡TIEMPO REAL BIDIRECCIONAL ACTIVADO! Chat: ${chat?.id} Usuario: ${usuarioActual?.id}`);
							break;
						case 'CHANNEL_ERROR':
							console.error(`❌ [CHAT-VISTA-BI] Error en canal realtime para usuario ${usuarioActual?.id}`);
							break;
						case 'TIMED_OUT':
							console.warn(`⏱️ [CHAT-VISTA-BI] Timeout para usuario ${usuarioActual?.id}, reintentando...`);
							break;
						case 'CLOSED':
							console.log(`🔴 [CHAT-VISTA-BI] Canal cerrado para usuario ${usuarioActual?.id}`);
							break;
						default:
							console.log(`🔄 [CHAT-VISTA-BI] Estado desconocido: ${estado}`);
							break;
					}
				} catch (err) {
					console.error(`❌ [CHAT-VISTA-BI] Error en callback de conexión:`, err);
				}
			}
		});
		} catch (err) {
			console.error(`❌ [CONFIG] Error crítico configurando realtime:`, err);
			estadoConexion = 'ERROR';
		}
	}

	/**
	 * 💭 Responder mensaje
	 */
	function responderMensaje(mensaje: Mensaje) {
		mensajeEnRespuesta = mensaje;
	}

	/**
	 * ❌ Cancelar respuesta
	 */
	function cancelarRespuesta() {
		mensajeEnRespuesta = null;
	}

	/**
	 * 🔄 Alternar panel de información
	 */
	function alternarInfoPanel() {
		mostrarInfoPanel = !mostrarInfoPanel;
	}

	/**
	 * ◀️ Regresar a lista de mensajes
	 */
	function regresarAMensajes() {
		dispatch('regresar');
	}

	/**
	 * 📊 Obtener estadísticas del chat
	 */
	function obtenerEstadisticasChat() {
		const totalMiembros = chat?.miembros?.length || 0;
		const miembrosActivos = chat?.miembros?.filter(m => m.estado_miembro === 'activo').length || 0;
		const administradores = chat?.miembros?.filter(m => m.es_admin).length || 0;
		const conectados = chat?.miembros?.filter(m => m.perfil?.en_linea).length || 0;
		
		return {
			totalMiembros,
			miembrosActivos,
			administradores,
			conectados
		};
	}

	$: estadisticas = obtenerEstadisticasChat();
	$: miembrosFiltrados = (chat?.miembros || []).filter(miembro => {
		if (!buscandoMiembros) return true;
		const termino = buscandoMiembros.toLowerCase();
		const miembroAny = miembro as any;
		const nombre = miembroAny.usuario?.nombre_completo?.toLowerCase() || '';
		const usuario = miembroAny.usuario?.nombre_usuario?.toLowerCase() || '';
		return nombre.includes(termino) || usuario.includes(termino);
	});
</script>

<!-- ============================================ -->
<!-- TEMPLATE PRINCIPAL -->
<!-- ============================================ -->

<div class="chat-vista {$modoOscuro ? 'dark' : ''}" class:panel-abierto={mostrarInfoPanel}>
	{#if !chat}
		<!-- Sin chat seleccionado -->
		<div class="estado-vacio">
			<div class="icono-chat">💬</div>
			<h3>Selecciona un chat</h3>
			<p>Elige una conversación para comenzar a chatear</p>
		</div>
	{:else}
		<!-- Contenedor principal con flexbox -->
		<div class="contenedor-principal">
			<!-- Área del chat -->
			<div class="area-chat">
				<!-- Header estilo WhatsApp -->
				<div class="header-whatsapp">
					<div class="info-usuario">
						<button class="btn-regresar" on:click={regresarAMensajes} title="Volver">
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
							</svg>
						</button>
						
											{#if otroUsuario}
						<button class="avatar-container boton-perfil" on:click={navegarAlPerfilUsuario} title="Ver perfil de {otroUsuario.nombre_completo}">
							<img src={otroUsuario.url_foto_perfil} alt={otroUsuario.nombre_completo} class="avatar-usuario" />
							{#if otroUsuario.en_linea}
								<div class="indicador-online"></div>
				{/if}
			</button>
			
						<div class="info-texto">
							<button class="nombre-usuario boton-nombre-perfil" on:click={navegarAlPerfilUsuario} title="Ver perfil de {otroUsuario.nombre_completo}">
								{otroUsuario.nombre_completo}
							</button>
							<p class="estado-usuario" class:online={otroUsuario.en_linea}>
								{otroUsuario.estado}
							</p>
						</div>
				{/if}
				
				<!-- Indicador simple de tiempo real -->
				<div class="indicador-conexion" class:conectado={estadoConexion === 'SUBSCRIBED'}>
					{#if estadoConexion === 'SUBSCRIBED'}
						<span class="icono-estado">🟢</span>
						<span class="texto-estado">En vivo</span>
					{:else}
						<span class="icono-estado">🔴</span>
						<span class="texto-estado">Conectando...</span>
					{/if}
				</div>
			</div>
			
					<div class="acciones-header">
											<!-- Botón modo oscuro/claro - Temporalmente oculto -->
					<!-- 
					<button
						class="btn-tema"
						on:click={toggleModoOscuro}
						title="{$modoOscuro ? 'Modo claro' : 'Modo oscuro'}"
					>
						{#if $modoOscuro}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
							</svg>
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
							</svg>
						{/if}
					</button>
					-->
				
						<!-- Botón panel de información -->
				<button
							class="btn-info"
							on:click={alternarInfoPanel}
							title="Información del chat"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</button>
			</div>
		</div>
		
		<!-- Área de mensajes -->
				<div class="area-mensajes mensajes-scroll" bind:this={contenedorMensajes}>
			{#if cargando}
						<div class="cargando">
							<div class="spinner"></div>
							<p>Cargando mensajes...</p>
				</div>
			{:else if error}
						<div class="error">
							<p>❌ {error}</p>
				</div>
			{:else}
				{#each $mensajes as mensaje, index (mensaje.id)}
					<BurbujaMensaje
						{mensaje}
						{chat}
							mensajeAnterior={index > 0 ? $mensajes[index - 1] : undefined}
							mensajeSiguiente={index < $mensajes.length - 1 ? $mensajes[index + 1] : undefined}
						on:responder={() => responderMensaje(mensaje)}
					/>
				{/each}
			{/if}
		</div>
		
				<!-- Entrada de mensaje -->
				<div class="entrada-seccion">
		{#if mensajeEnRespuesta}
						<div class="respuesta-preview">
							<div class="respuesta-contenido">
								<strong>Respondiendo a {mensajeEnRespuesta.usuario?.nombre_completo}</strong>
								<p>{mensajeEnRespuesta.contenido}</p>
						</div>
							<button class="btn-cancelar" on:click={cancelarRespuesta}>✕</button>
						</div>
					{/if}

					<div class="entrada-container">
						<EntradaMensaje {chat} {mensajeEnRespuesta} on:enviar={(e) => enviarMensaje(e.detail)} />
					</div>
				</div>
			</div>

			<!-- Panel de información lateral (empuja el contenido) -->
			{#if mostrarInfoPanel}
				<div class="panel-info">
					<div class="panel-header">
						<h3>Información del chat</h3>
						<button class="btn-cerrar" on:click={alternarInfoPanel}>✕</button>
					</div>

					<div class="panel-contenido">
						<!-- Información principal -->
						{#if otroUsuario}
							<div class="info-principal">
								<img src={otroUsuario.url_foto_perfil} alt={otroUsuario.nombre_completo} class="avatar-grande" />
								<h4>{otroUsuario.nombre_completo}</h4>
								{#if otroUsuario.usuario_nombre}
									<p class="username">@{otroUsuario.usuario_nombre}</p>
								{/if}
								<span class="estado-badge" class:online={otroUsuario.en_linea}>
									{otroUsuario.estado}
								</span>
			</div>
		{/if}
		
						<!-- Estadísticas -->
						<div class="estadisticas">
							<h5>Estadísticas</h5>
							<div class="stats-grid">
								<div class="stat">
									<strong>{estadisticas.totalMiembros}</strong>
									<span>Miembros</span>
								</div>
								<div class="stat">
									<strong>{estadisticas.conectados}</strong>
									<span>En línea</span>
								</div>
								{#if chat?.es_grupal}
									<div class="stat">
										<strong>{estadisticas.administradores}</strong>
										<span>Admins</span>
									</div>
	{/if}
							</div>
</div>

						<!-- Miembros (solo para grupos) -->
						{#if chat?.es_grupal && chat.miembros}
							<div class="miembros-seccion">
								<h5>Miembros ({chat.miembros.length})</h5>
								
								{#if chat.miembros.length > 10}
									<input 
										type="search" 
										placeholder="Buscar miembros..." 
										bind:value={buscandoMiembros}
										class="buscar-input"
	/>
{/if}

								<div class="lista-miembros">
									{#each miembrosFiltrados as miembro}
										{@const miembroData = miembro as any}
										<div class="miembro-item">
											<img 
												src={miembroData.usuario?.url_foto_perfil || '/favicon.png'} 
												alt={miembroData.usuario?.nombre_completo}
												class="avatar-miembro"
											/>
											<div class="miembro-info">
												<strong>{miembroData.usuario?.nombre_completo}</strong>
												<p>@{miembroData.usuario?.nombre_usuario}</p>
											</div>
											{#if miembroData.es_admin}
												<span class="badge admin">Admin</span>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Acciones -->
						<div class="acciones">
							<button class="btn-accion peligro">
								🚪 Salir del chat
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* ============================================ */
	/* CONTENEDOR PRINCIPAL */
	/* ============================================ */
	.chat-vista {
		height: 100vh;
		background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		margin: 0;
		padding: 0;
		/* En escritorio: posición relativa normal */
		position: relative;
		z-index: 1;
	}

	.chat-vista.dark {
		background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
	}

	.contenedor-principal {
		display: flex;
		height: 100%;
		width: 100%;
		transition: all 0.3s ease;
		overflow: hidden;
		margin: 0;
		padding: 0;
		margin-bottom: 60px;
	}

	.area-chat {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		width: 100%;
		transition: all 0.3s ease;
		height: 100%;
		margin: 0;
		padding: 0;
	}

	.panel-abierto .area-chat {
		margin-right: 320px;
	}

	/* ============================================ */
	/* HEADER ESTILO WHATSAPP */
	/* ============================================ */
	.header-whatsapp {
		background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
		padding: 16px 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		z-index: 2;
		flex-shrink: 0;
		position: relative;
		width: 100%;
		min-height: 70px;
	}

	.chat-vista.dark .header-whatsapp {
		background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
	}

	.info-usuario {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
		min-width: 0;
	}

	.btn-regresar {
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		padding: 8px;
		border-radius: 50%;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.btn-regresar:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: scale(1.1);
	}

	.avatar-container {
		position: relative;
		flex-shrink: 0;
	}

	.boton-perfil {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		border-radius: 50%;
		transition: all 0.2s ease;
		position: relative;
		flex-shrink: 0;
	}

	.boton-perfil:hover {
		transform: scale(1.05);
		opacity: 0.9;
	}

	.avatar-usuario {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgba(255, 255, 255, 0.3);
		transition: all 0.2s ease;
	}

	.boton-perfil:hover .avatar-usuario {
		border-color: rgba(255, 255, 255, 0.7);
	}

	.indicador-online {
		position: absolute;
		bottom: 2px;
		right: 2px;
		width: 14px;
		height: 14px;
		background: #4ade80;
		border-radius: 50%;
		border: 2px solid white;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% { opacity: 1; }
		50% { opacity: 0.5; }
		100% { opacity: 1; }
	}

	.info-texto {
		flex: 1;
		min-width: 0;
	}

	.nombre-usuario {
		color: white;
		font-size: 16px;
		font-weight: 600;
		margin: 0;
		line-height: 1.2;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.boton-nombre-perfil {
		background: none;
		border: none;
		color: white;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		padding: 2px 4px;
		border-radius: 4px;
		transition: all 0.2s ease;
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin: 0;
		line-height: 1.2;
	}

	.boton-nombre-perfil:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-1px);
	}

	.estado-usuario {
		color: rgba(255, 255, 255, 0.8);
		font-size: 13px;
		margin: 2px 0 0 0;
		line-height: 1;
	}

	.estado-usuario.online {
		color: #4ade80;
		font-weight: 500;
	}

	.acciones-header {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}

	.btn-tema, .btn-info {
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: white;
		cursor: pointer;
		padding: 10px;
		border-radius: 50%;
		transition: all 0.2s ease;
		backdrop-filter: blur(10px);
	}

	.btn-tema:hover, .btn-info:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.1);
	}

	/* ============================================ */
	/* INDICADOR DE CONEXIÓN EN TIEMPO REAL */
	/* ============================================ */
	.indicador-conexion {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		font-size: 12px;
		font-weight: 500;
		color: white;
		transition: all 0.3s ease;
		border: 1px solid rgba(255, 255, 255, 0.2);
		margin-left: 8px;
	}

	.indicador-conexion.conectado {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.4);
		color: #dcfce7;
	}

	.indicador-conexion.conectando {
		background: rgba(234, 179, 8, 0.2);
		border-color: rgba(234, 179, 8, 0.4);
		color: #fef3c7;
	}

	.indicador-conexion.reconectando {
		background: rgba(249, 115, 22, 0.2);
		border-color: rgba(249, 115, 22, 0.4);
		color: #fed7aa;
		animation: pulse-reconnect 2s infinite;
	}

	.indicador-conexion.error {
		background: rgba(239, 68, 68, 0.2);
		border-color: rgba(239, 68, 68, 0.4);
		color: #fecaca;
	}

	@keyframes pulse-reconnect {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	.icono-estado {
		font-size: 10px;
		line-height: 1;
	}

	.texto-estado {
		font-size: 11px;
		font-weight: 600;
		white-space: nowrap;
	}

	.indicador-conexion.reconectando .icono-estado {
		animation: rotate-icon 1s linear infinite;
	}

	@keyframes rotate-icon {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Responsive para móviles */
	@media (max-width: 768px) {
		.indicador-conexion {
			padding: 3px 6px;
			font-size: 10px;
			margin-left: 4px;
		}
		
		.texto-estado {
			display: none; /* Solo mostrar icono en móvil */
		}
	}

	/* ============================================ */
	/* ÁREA DE MENSAJES */
	/* ============================================ */
	.area-mensajes {
		flex: 1;
		overflow-y: auto;
		padding: 20px;
		background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5e7eb' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
		min-height: 0;
	}

	.chat-vista.dark .area-mensajes {
		background: #1f2937 url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
	}

	.cargando, .error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #6b7280;
	}

	.chat-vista.dark .cargando, 
	.chat-vista.dark .error {
		color: #9ca3af;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #25d366;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 12px;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* ============================================ */
	/* ENTRADA DE MENSAJE */
	/* ============================================ */
	.entrada-seccion {
		flex-shrink: 0;
		background: white;
		border-top: 1px solid #e5e7eb;
	}

	.chat-vista.dark .entrada-seccion {
		background: #1f2937;
		border-top: 1px solid #374151;
	}

	.respuesta-preview {
		background: #f3f4f6;
		border-left: 4px solid #25d366;
		padding: 12px 16px;
		margin: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #e5e7eb;
	}

	.chat-vista.dark .respuesta-preview {
		background: #374151;
		color: #e5e7eb;
		border-bottom: 1px solid #4b5563;
	}

	.respuesta-contenido strong {
		color: #25d366;
		display: block;
		font-size: 14px;
		margin-bottom: 4px;
	}

	.respuesta-contenido p {
		margin: 0;
		font-size: 13px;
		color: #6b7280;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 300px;
	}

	.btn-cancelar {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		font-size: 18px;
		padding: 4px;
		border-radius: 50%;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.btn-cancelar:hover {
		background: #e5e7eb;
		color: #ef4444;
	}

	.entrada-container {
		padding: 16px 20px;
	}

	/* ============================================ */
	/* PANEL DE INFORMACIÓN LATERAL */
	/* ============================================ */
	.panel-info {
		position: fixed;
		right: 0;
		top: 0;
		width: 320px;
		height: 100vh;
		background: white;
		border-left: 1px solid #e5e7eb;
		box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
		z-index: 20;
		transform: translateX(0);
		transition: transform 0.3s ease;
		overflow-y: auto;
	}

	.chat-vista.dark .panel-info {
		background: #1f2937;
		border-left: 1px solid #374151;
	}

	.panel-header {
		background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
		color: white;
		padding: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: sticky;
		top: 0;
		z-index: 21;
	}

	.chat-vista.dark .panel-header {
		background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
	}

	.panel-header h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
	}

	.btn-cerrar {
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: white;
		cursor: pointer;
		font-size: 20px;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.btn-cerrar:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.1);
	}

	.panel-contenido {
		padding: 20px;
	}

	.info-principal {
		text-align: center;
		margin-bottom: 30px;
		padding-bottom: 20px;
		border-bottom: 1px solid #e5e7eb;
	}

	.chat-vista.dark .info-principal {
		border-bottom: 1px solid #374151;
	}

	.avatar-grande {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		margin-bottom: 12px;
		border: 3px solid #25d366;
	}

	.info-principal h4 {
		margin: 0 0 8px 0;
		font-size: 20px;
		font-weight: 600;
		color: #1f2937;
	}

	.chat-vista.dark .info-principal h4 {
		color: #e5e7eb;
	}

	.username {
		margin: 0 0 12px 0;
		color: #6b7280;
		font-size: 14px;
	}

	.estado-badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 500;
		background: #e5e7eb;
		color: #6b7280;
	}

	.estado-badge.online {
		background: #dcfce7;
		color: #16a34a;
	}

	.estadisticas {
		margin-bottom: 30px;
	}

	.estadisticas h5 {
		margin: 0 0 16px 0;
		font-size: 16px;
		font-weight: 600;
		color: #1f2937;
	}

	.chat-vista.dark .estadisticas h5 {
		color: #e5e7eb;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
		gap: 12px;
	}

	.stat {
		text-align: center;
		padding: 12px;
		background: #f9fafb;
		border-radius: 8px;
	}

	.chat-vista.dark .stat {
		background: #374151;
	}

	.stat strong {
		display: block;
		font-size: 20px;
		font-weight: 700;
		color: #25d366;
		margin-bottom: 4px;
	}

	.stat span {
		font-size: 12px;
		color: #6b7280;
	}

	.miembros-seccion h5 {
		margin: 0 0 16px 0;
		font-size: 16px;
		font-weight: 600;
		color: #1f2937;
	}

	.chat-vista.dark .miembros-seccion h5 {
		color: #e5e7eb;
	}

	.buscar-input {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		margin-bottom: 16px;
		font-size: 14px;
	}

	.chat-vista.dark .buscar-input {
		background: #374151;
		border: 1px solid #4b5563;
		color: #e5e7eb;
	}

	.lista-miembros {
		max-height: 300px;
		overflow-y: auto;
	}

	.miembro-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 0;
		border-bottom: 1px solid #f3f4f6;
	}

	.chat-vista.dark .miembro-item {
		border-bottom: 1px solid #374151;
	}

	.avatar-miembro {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
	}

	.miembro-info {
		flex: 1;
		min-width: 0;
	}

	.miembro-info strong {
		display: block;
		font-size: 14px;
		color: #1f2937;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chat-vista.dark .miembro-info strong {
		color: #e5e7eb;
	}

	.miembro-info p {
		margin: 2px 0 0 0;
		font-size: 12px;
		color: #6b7280;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 4px;
		font-weight: 500;
	}

	.badge.admin {
		background: #ddd6fe;
		color: #7c3aed;
	}

	.acciones {
		margin-top: 30px;
		padding-top: 20px;
		border-top: 1px solid #e5e7eb;
	}

	.chat-vista.dark .acciones {
		border-top: 1px solid #374151;
	}

	.btn-accion {
		width: 100%;
		padding: 12px;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: 8px;
	}

	.btn-accion.peligro {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.btn-accion.peligro:hover {
		background: #fee2e2;
		border-color: #fca5a5;
	}

	.chat-vista.dark .btn-accion.peligro {
		background: #7f1d1d;
		color: #fca5a5;
		border: 1px solid #991b1b;
	}

	/* ============================================ */
	/* ESTADO VACÍO */
	/* ============================================ */
	.estado-vacio {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		color: #6b7280;
	}

	.chat-vista.dark .estado-vacio {
		color: #9ca3af;
	}

	.icono-chat {
		font-size: 64px;
		margin-bottom: 16px;
		opacity: 0.5;
	}

	.estado-vacio h3 {
		margin: 0 0 8px 0;
		font-size: 20px;
		font-weight: 600;
	}

	.estado-vacio p {
		margin: 0;
		font-size: 14px;
		opacity: 0.8;
	}

	/* ============================================ */
	/* RESPONSIVE */
	/* ============================================ */

	
	@media (max-width: 900px) {
		/* Layout estilo Facebook - fullscreen en móvil */
		.chat-vista {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			width: 100vw;
			height: 100vh;
			height: 100dvh; /* Para dispositivos móviles */
			margin: 0;
			padding: 0;
			z-index: 9999; /* Solo en móvil va por encima de todo */
			background: white;
		}
		
		.panel-abierto .area-chat {
			margin-right: 0;
		}

		/* Panel info fullscreen en móvil */
		.panel-info {
			width: 100%;
			transform: translateX(0);
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 10001; /* Por encima del chat en móvil */
		}
		
		/* Header con z-index alto solo en móvil */
		.header-whatsapp {
			z-index: 10000;
			position: relative;
			background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
		}

		.header-whatsapp {
			padding: 12px 16px;
		}

		.info-usuario {
			gap: 8px;
		}

		.avatar-usuario {
			width: 50px;
			height: 50px;
		}

		.nombre-usuario {
			font-size: 14px;
		}

		/* Entrada de mensajes siempre visible */
		.entrada-container {
			padding: 10px;
			min-height: 80px;
			border-top: 1px solid #e5e7eb;
			position: sticky;
			bottom: 0;
			z-index: 10;
		}

		/* Mejorar el área de mensajes para dejar espacio al input */
		.area-mensajes {
			padding: 8px 16px 100px 16px;
			width: 100%;
			margin: 0;
		}
		
		.header-whatsapp {
			width: 100%;
			margin: 0;
			padding: 16px 20px;
			z-index: 10000;
			position: relative;
			background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
		}
		



		.respuesta-preview {
			padding: 8px 12px;
		}

		.respuesta-contenido p {
			max-width: 200px;
		}


		/* Asegurar que el layout funcione correctamente en móvil */
		.chat-vista {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 9999;
			width: 100vw;
			height: 100vh;
		}

		.contenedor-principal {
			height: 100vh;
			width: 100%;
			display: flex;
			flex-direction: column;
			margin-bottom: 2px;
		}

	}
	
	/* ============================================ */
	/* SCROLLBAR PERSONALIZADA */
	/* ============================================ */
	.mensajes-scroll::-webkit-scrollbar {
		width: 6px;
	}
	
	.mensajes-scroll::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.mensajes-scroll::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 3px;
	}
	
	.mensajes-scroll::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.3);
	}
	
	.chat-vista.dark .mensajes-scroll::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
	}
	
	.chat-vista.dark .mensajes-scroll::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}
</style> 