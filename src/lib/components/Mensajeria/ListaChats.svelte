<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { mensajeriaService, type Chat } from '$lib/services/mensajeriaService';
	import { formatearTiempoRelativo } from '$lib/services/imagenUsuarioService';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	
	// Props
	export let chatSeleccionado: string | null = null;
	export let onSeleccionarChat: (chat: Chat) => void = () => {};
	export let usuarioActual: any = null;
	
	// Estados principales
	let chats = writable<Chat[]>([]);
	let cargando = true;
	let error = '';
	let terminoBusqueda = '';
	let mostrarModalNuevoChat = false;

	// Estados para menú contextual
	let menuContextualVisible = false;
	let chatMenuSeleccionado: Chat | null = null;
	let posicionMenu = { x: 0, y: 0 };
	let eliminandoChat = false;
	
	// Estados del modal
	let usuariosBusqueda: any[] = [];
	let usuariosSeleccionados: any[] = [];
	let esGrupal = false;
	let nombreGrupo = '';
	let descripcionGrupo = '';
	let buscandoUsuarios = false;
	
	// Funciones principales
	async function cargarChats() {
		try {
			cargando = true;
			const { chats: chatsObtenidos, error: errorObtenido } = await mensajeriaService.obtenerChatsUsuario();
			
			if (errorObtenido) {
				error = errorObtenido;
				console.error('Error cargando chats:', errorObtenido);
			} else {
				chats.set(chatsObtenidos);
			}
		} catch (err) {
			error = 'Error inesperado cargando chats';
			console.error('Error:', err);
		} finally {
			cargando = false;
		}
	}
	
	// Funciones del menú contextual
	function mostrarMenuContextual(event: MouseEvent, chat: Chat) {
		event.preventDefault();
		event.stopPropagation();
		
		chatMenuSeleccionado = chat;
		posicionMenu = { x: event.clientX, y: event.clientY };
		menuContextualVisible = true;
		
		// Cerrar el menú al hacer clic fuera
		setTimeout(() => {
			document.addEventListener('click', cerrarMenuContextual);
		}, 0);
	}

	function cerrarMenuContextual() {
		menuContextualVisible = false;
		chatMenuSeleccionado = null;
		document.removeEventListener('click', cerrarMenuContextual);
	}

	async function confirmarEliminarChat() {
		if (!chatMenuSeleccionado || eliminandoChat) return;
		
		const nombreChat = obtenerNombreChat(chatMenuSeleccionado);
		const esGrupo = chatMenuSeleccionado.es_grupal;
		
		// Usar confirm más específico
		const mensaje = esGrupo 
			? `🗑️ ELIMINAR GRUPO\n\n¿Eliminar "${nombreChat}"?\n\n⚠️ Esta acción NO se puede deshacer:\n• Se eliminarán todos los mensajes\n• Se eliminarán todos los miembros\n• El grupo desaparecerá permanentemente\n\n¿Continuar?`
			: `🚪 SALIR DEL CHAT\n\n¿Salir del chat con "${nombreChat}"?\n\nPodrás volver a unirte más tarde.`;
		
		const confirmar = confirm(mensaje);
		
		if (!confirmar) {
			cerrarMenuContextual();
			return;
		}
		
		await eliminarChat();
	}

	async function eliminarChat() {
		if (!chatMenuSeleccionado) return;
		
		try {
			eliminandoChat = true;
			cerrarMenuContextual();
			
			console.log('🗑️ Eliminando chat:', chatMenuSeleccionado.id);
			
			const { exito, error: errorEliminacion } = await mensajeriaService.eliminarChat(chatMenuSeleccionado.id);
			
			if (exito) {
				// Actualizar la lista de chats
				await cargarChats();
				
				// Si el chat eliminado era el seleccionado, limpiar selección
				if (chatSeleccionado === chatMenuSeleccionado.id) {
					chatSeleccionado = null;
					// Redirigir a la página principal de mensajes si estamos en el chat eliminado
					if ($page.url.pathname.includes(chatMenuSeleccionado.id)) {
						goto('/mensajes');
					}
				}
				
				// Mostrar mensaje de éxito
				const esGrupo = chatMenuSeleccionado.es_grupal;
				const mensaje = esGrupo 
					? `✅ Grupo eliminado exitosamente`
					: `✅ Has salido del chat exitosamente`;
				
				// Usar setTimeout para mostrar el mensaje después del cierre del menú
				setTimeout(() => alert(mensaje), 100);
				
				console.log('✅ Chat eliminado exitosamente');
			} else {
				console.error('❌ Error eliminando chat:', errorEliminacion);
				alert(`❌ Error: ${errorEliminacion || 'Error desconocido al eliminar el chat'}`);
			}
		} catch (err) {
			console.error('❌ Error inesperado:', err);
			alert('Error inesperado eliminando el chat');
		} finally {
			eliminandoChat = false;
			chatMenuSeleccionado = null;
		}
	}

	// Filtrar chats por búsqueda
	$: chatsFiltrados = $chats.filter(chat => {
		if (!terminoBusqueda) return true;
		
		const termino = terminoBusqueda.toLowerCase();
		const nombreChat = obtenerNombreChat(chat).toLowerCase();
		const ultimoMensaje = chat.ultimo_mensaje?.contenido?.toLowerCase() || '';
		
		return nombreChat.includes(termino) || ultimoMensaje.includes(termino);
	});
	
	// Seleccionar chat
	function seleccionarChat(chat: Chat) {
		chatSeleccionado = chat.id;
		onSeleccionarChat(chat);
		
		// Marcar como leído
		if (chat.mensajes_no_leidos && chat.mensajes_no_leidos > 0) {
			mensajeriaService.marcarMensajesComoLeidos(chat.id);
			chats.update(chatsActuales => 
				chatsActuales.map(c => 
					c.id === chat.id ? { ...c, mensajes_no_leidos: 0 } : c
				)
			);
		}
		
		goto(`/mensajes/${chat.id}`);
	}
	
	// Obtener nombre del chat
	function obtenerNombreChat(chat: Chat): string {
		if (chat.es_grupal && chat.nombre) {
			return chat.nombre;
		}
		
		// Para chats privados: buscar al otro usuario
		if (!chat.es_grupal && chat.miembros && usuarioActual?.id) {
			for (const miembro of chat.miembros) {
				const miembroData = miembro as any;
				
				if (miembroData.usuario_id && miembroData.usuario_id !== usuarioActual.id) {
					const usuario = miembroData.usuario || {};
					
					// Prioridad: nombre_completo
					if (usuario.nombre_completo?.trim()) {
						return usuario.nombre_completo.trim();
					}
					
					// Combinar nombre + apellido
					const nombre = usuario.nombre?.trim() || '';
					const apellido = usuario.apellido?.trim() || '';
					
					if (nombre && apellido) {
						return `${nombre} ${apellido}`;
					}
					
					// Solo nombre o apellido
					if (nombre) return nombre;
					if (apellido) return apellido;
					
					// Nombre de usuario
					if (usuario.nombre_usuario?.trim()) {
						return `@${usuario.nombre_usuario.trim()}`;
					}
					
					// Último recurso
					return `Usuario ${miembroData.usuario_id.slice(-8)}`;
				}
			}
		}
		
		return chat.es_grupal ? 'Grupo sin nombre' : 'Chat Privado';
	}

	// Obtener avatar del chat
	function obtenerAvatarChat(chat: Chat): string {
		if (chat.es_grupal && chat.imagen_url) {
			return chat.imagen_url;
		}
		
		// Para chats privados: buscar avatar del otro usuario
		if (!chat.es_grupal && chat.miembros && usuarioActual?.id) {
			for (const miembro of chat.miembros) {
				const miembroData = miembro as any;
				
				if (miembroData.usuario_id && miembroData.usuario_id !== usuarioActual.id) {
					const usuario = miembroData.usuario || {};
					
					if (usuario.url_foto_perfil?.trim()) {
						return usuario.url_foto_perfil.trim();
					}
					
					return '/favicon.png';
				}
			}
		}
		
		return '/favicon.png';
	}
	
	// Formatear fecha del último mensaje
	function formatearFechaUltimoMensaje(fecha: string | undefined): string {
		if (!fecha) return '';
		return formatearTiempoRelativo(fecha);
	}

	// Formatear último mensaje para mostrar
	function formatearUltimoMensaje(chat: Chat): string {
		if (!chat.ultimo_mensaje) {
			return 'Sin mensajes aún';
		}

		const mensaje = chat.ultimo_mensaje;
		const esElUsuarioActual = mensaje.usuario_id === usuarioActual?.id;
		const prefijo = esElUsuarioActual ? 'Tú: ' : '';

		// Obtener nombre del remitente si no es el usuario actual
		let nombreRemitente = '';
		if (!esElUsuarioActual) {
			const miembroRemitente = chat.miembros?.find((m: any) => m.usuario_id === mensaje.usuario_id);
			if (miembroRemitente) {
				const usuario = (miembroRemitente as any).usuario;
				const nombreCompleto = usuario?.nombre_completo || 
									`${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim() || 
									usuario?.nombre_usuario || 'Usuario';
				nombreRemitente = nombreCompleto.split(' ')[0];
			}
			
			if (chat.es_grupal && nombreRemitente) {
				nombreRemitente = nombreRemitente + ': ';
			} else if (!chat.es_grupal) {
				nombreRemitente = '';
			}
		}

		// Formatear según el tipo de mensaje
		const tiposMensaje = {
			texto: `${prefijo}${nombreRemitente}${mensaje.contenido || ''}`,
			imagen: `${prefijo}${nombreRemitente}📷 Imagen`,
			video: `${prefijo}${nombreRemitente}🎥 Video`,
			audio: `${prefijo}${nombreRemitente}🎵 Audio`,
			archivo: `${prefijo}${nombreRemitente}📎 Archivo`,
			ubicacion: `${prefijo}${nombreRemitente}📍 Ubicación`,
			contacto: `${prefijo}${nombreRemitente}👤 Contacto`,
			sistema: `💫 ${mensaje.contenido || ''}`
		};

		const textoMensaje = tiposMensaje[mensaje.tipo] || `${prefijo}${nombreRemitente}${mensaje.contenido || 'Mensaje'}`;
		
		return textoMensaje.length > 60 ? textoMensaje.substring(0, 57) + '...' : textoMensaje;
	}
	
	// Funciones del modal de nuevo chat
	async function buscarUsuarios() {
		if (terminoBusqueda.length < 2) {
			usuariosBusqueda = [];
			return;
		}
		
		try {
			buscandoUsuarios = true;
			const { usuarios, error: errorBusqueda } = await mensajeriaService.buscarUsuarios(terminoBusqueda);
			
			if (errorBusqueda) {
				console.error('Error buscando usuarios:', errorBusqueda);
			} else {
				usuariosBusqueda = usuarios.filter(u => 
					!usuariosSeleccionados.some(sel => sel.id === u.id)
				);
			}
		} catch (err) {
			console.error('Error inesperado buscando usuarios:', err);
		} finally {
			buscandoUsuarios = false;
		}
	}
	
	function agregarUsuario(usuario: any) {
		usuariosSeleccionados = [...usuariosSeleccionados, usuario];
		usuariosBusqueda = usuariosBusqueda.filter(u => u.id !== usuario.id);
		terminoBusqueda = '';
	}
	
	function removerUsuario(usuario: any) {
		usuariosSeleccionados = usuariosSeleccionados.filter(u => u.id !== usuario.id);
	}
	
	async function crearNuevoChat() {
		if (usuariosSeleccionados.length === 0) {
			alert('Debes seleccionar al menos un usuario');
			return;
		}
		
		if (esGrupal && !nombreGrupo.trim()) {
			alert('Los grupos deben tener un nombre');
			return;
		}
		
		try {
			const { chat, error: errorCreacion } = await mensajeriaService.crearChat({
				es_grupal: esGrupal,
				nombre: esGrupal ? nombreGrupo : undefined,
				descripcion: esGrupal ? descripcionGrupo : undefined,
				miembros_ids: usuariosSeleccionados.map(u => u.id)
			});
			
			if (errorCreacion) {
				alert(`Error creando chat: ${errorCreacion}`);
			} else if (chat) {
				cerrarModalNuevoChat();
				await cargarChats();
				seleccionarChat(chat);
			}
		} catch (err) {
			console.error('Error inesperado creando chat:', err);
			alert('Error inesperado creando el chat');
		}
	}
	
	function cerrarModalNuevoChat() {
		mostrarModalNuevoChat = false;
		usuariosSeleccionados = [];
		usuariosBusqueda = [];
		terminoBusqueda = '';
		nombreGrupo = '';
		descripcionGrupo = '';
		esGrupal = false;
	}
	
	// Ciclo de vida
	onMount(async () => {
		await cargarChats();
		
		const chatIdFromUrl = $page.params.chat_id;
		if (chatIdFromUrl) {
			const chatEncontrado = $chats.find(c => c.id === chatIdFromUrl);
			if (chatEncontrado) {
				seleccionarChat(chatEncontrado);
			}
		}
	});
</script>

<!-- Template Principal -->

<div class="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
	<!-- Header -->
	<div class="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-850">
		<!-- Título -->
		<div class="flex items-center justify-between mb-5">
			<div class="flex items-center space-x-4">
				<div class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
					<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
					</svg>
				</div>
				<div>
					<h2 class="text-xl font-bold text-gray-900 dark:text-white">Mensajes</h2>
					<p class="text-sm text-gray-500 dark:text-gray-400">Mantente conectado</p>
				</div>
			</div>
			<button
				on:click={() => mostrarModalNuevoChat = true}
				class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
				title="Nuevo Chat"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
				</svg>
			</button>
		</div>
		
		<!-- Búsqueda -->
		<div class="relative">
			<input
				type="text"
				bind:value={terminoBusqueda}
				placeholder="Buscar chats, mensajes..."
				class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl 
					   bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 
					   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm
					   transition-all duration-200 hover:shadow-md focus:shadow-lg"
			>
			<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
				<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
				</svg>
			</div>
		</div>
	</div>
	
	<!-- Lista de chats -->
	<div class="flex-1 overflow-y-auto min-h-0">
		{#if cargando}
			<!-- Estado de carga -->
			<div class="px-4 py-2">
				{#each Array(5) as _}
					<div class="flex items-center space-x-4 p-4 mx-2 my-1 animate-pulse">
						<div class="w-14 h-14 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
						<div class="flex-1">
							<div class="h-4 bg-gray-300 dark:bg-gray-600 rounded-lg w-3/4 mb-2"></div>
							<div class="h-3 bg-gray-300 dark:bg-gray-600 rounded-lg w-1/2"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else if error}
			<!-- Estado de error -->
			<div class="p-8 text-center">
				<div class="mb-4">
					<div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
						<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
					</div>
					<div class="text-red-500 dark:text-red-400 font-medium mb-2">Error al cargar chats</div>
					<div class="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</div>
					<button
						on:click={cargarChats}
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Reintentar
					</button>
				</div>
			</div>
		{:else if chatsFiltrados.length === 0}
			<!-- Estado vacío -->
			<div class="p-8 text-center">
				<div class="mb-4">
					<div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
						{#if terminoBusqueda}
							<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
							</svg>
						{:else}
							<svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
							</svg>
						{/if}
					</div>
					<div class="text-gray-600 dark:text-gray-300 font-medium mb-2">
						{#if terminoBusqueda}
							No se encontraron resultados
						{:else}
							No tienes chats aún
						{/if}
					</div>
					<div class="text-sm text-gray-500 dark:text-gray-400">
						{#if terminoBusqueda}
							No hay chats que coincidan con "{terminoBusqueda}"
						{:else}
							¡Crea tu primer chat y comienza a conversar!
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<!-- Lista de chats -->
			{#each chatsFiltrados as chat (chat.id)}
				<div
					class="flex items-center p-4 mx-3 my-2 rounded-xl cursor-pointer transition-all duration-200
						   hover:bg-gray-50 dark:hover:bg-gray-800 hover:shadow-md transform hover:scale-[1.02]
						   {chatSeleccionado === chat.id ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-l-4 border-blue-500 shadow-lg' : 'hover:border-l-4 hover:border-transparent'}"
					on:click={() => seleccionarChat(chat)}
					on:contextmenu={(event) => mostrarMenuContextual(event, chat)}
					role="button"
					tabindex="0"
					on:keydown={(e) => e.key === 'Enter' && seleccionarChat(chat)}
				>
					<!-- Avatar del chat -->
					<div class="relative flex-shrink-0">
						<img
							src={obtenerAvatarChat(chat)}
							alt={obtenerNombreChat(chat)}
							class="w-14 h-14 rounded-xl object-cover border-2 border-white dark:border-gray-600 shadow-lg"
						>
						
						<!-- Indicador de estado online (solo para chats privados) -->
						{#if !chat.es_grupal}
							<div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-700 animate-pulse"></div>
						{/if}
						
						<!-- Badge de tipo de chat -->
						{#if chat.es_grupal}
							<div class="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
								<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
								</svg>
							</div>
						{/if}
					</div>
					
					<!-- Información del chat -->
					<div class="flex-1 ml-4 min-w-0">
						<!-- Nombre y fecha -->
						<div class="flex items-center justify-between mb-1">
							<h3 class="text-base font-semibold text-gray-900 dark:text-white truncate">
								{obtenerNombreChat(chat)}
							</h3>
							<span class="text-xs text-gray-500 dark:text-gray-400 ml-3 flex-shrink-0 font-medium">
								{formatearFechaUltimoMensaje(chat.ultimo_mensaje_fecha)}
							</span>
						</div>
						
						<!-- Último mensaje y contador -->
						<div class="flex items-center justify-between">
							<p class="text-sm text-gray-600 dark:text-gray-400 truncate mr-2">
								{formatearUltimoMensaje(chat)}
							</p>
							
							<!-- Contador de mensajes no leídos -->
							{#if chat.mensajes_no_leidos && chat.mensajes_no_leidos > 0}
								<span class="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[24px] text-center shadow-lg">
									{chat.mensajes_no_leidos > 99 ? '99+' : chat.mensajes_no_leidos}
								</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- Modal Nuevo Chat -->

{#if mostrarModalNuevoChat}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
			<!-- Header del modal -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">💬 Nuevo Chat</h3>
				<button
					on:click={cerrarModalNuevoChat}
					class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
			
			<!-- Contenido del modal -->
			<div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
				<!-- Toggle tipo de chat -->
				<div class="mb-4">
					<label class="flex items-center space-x-3">
						<input
							type="checkbox"
							bind:checked={esGrupal}
							class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
						>
						<span class="text-sm font-medium text-gray-900 dark:text-white">Crear grupo</span>
					</label>
				</div>
				
				<!-- Campos para grupo -->
				{#if esGrupal}
					<div class="space-y-4 mb-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Nombre del grupo *
							</label>
							<input
								type="text"
								bind:value={nombreGrupo}
								placeholder="Ej: Estudiantes de Acordeón"
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
									   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
									   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
								Descripción (opcional)
							</label>
							<textarea
								bind:value={descripcionGrupo}
								placeholder="Describe de qué trata este grupo..."
								rows="2"
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
									   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
									   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							></textarea>
						</div>
					</div>
				{/if}
				
				<!-- Búsqueda de usuarios -->
				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
						Buscar usuarios
					</label>
					<input
						type="text"
						bind:value={terminoBusqueda}
						on:input={buscarUsuarios}
						placeholder="Escribe el nombre del usuario..."
						class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
							   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
							   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					>
				</div>
				
				<!-- Usuarios encontrados -->
				{#if buscandoUsuarios}
					<div class="text-center py-2 text-gray-500">Buscando...</div>
				{:else if usuariosBusqueda.length > 0}
					<div class="mb-4">
						<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Usuarios encontrados:</h4>
						<div class="space-y-2">
							{#each usuariosBusqueda as usuario}
								<div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
									<div class="flex items-center space-x-3">
										<img
											src={usuario.url_foto_perfil || 'https://via.placeholder.com/32'}
											alt={usuario.nombre_completo}
											class="w-8 h-8 rounded-full object-cover"
										>
										<div>
											<div class="text-sm font-medium text-gray-900 dark:text-white">
												{usuario.nombre_completo}
											</div>
											<div class="text-xs text-gray-500 dark:text-gray-400">
												@{usuario.nombre_usuario}
											</div>
										</div>
									</div>
									<button
										on:click={() => agregarUsuario(usuario)}
										class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
										</svg>
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Usuarios seleccionados -->
				{#if usuariosSeleccionados.length > 0}
					<div class="mb-4">
						<h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Participantes:</h4>
						<div class="space-y-2">
							{#each usuariosSeleccionados as usuario}
								<div class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
									<div class="flex items-center space-x-3">
										<img
											src={usuario.url_foto_perfil || 'https://via.placeholder.com/32'}
											alt={usuario.nombre_completo}
											class="w-8 h-8 rounded-full object-cover"
										>
										<div>
											<div class="text-sm font-medium text-gray-900 dark:text-white">
												{usuario.nombre_completo}
											</div>
											<div class="text-xs text-gray-500 dark:text-gray-400">
												@{usuario.nombre_usuario}
											</div>
										</div>
									</div>
									<button
										on:click={() => removerUsuario(usuario)}
										class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
										</svg>
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Footer del modal -->
			<div class="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
				<button
					on:click={cerrarModalNuevoChat}
					class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
				>
					Cancelar
				</button>
				<button
					on:click={crearNuevoChat}
					disabled={usuariosSeleccionados.length === 0 || (esGrupal && !nombreGrupo.trim())}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{esGrupal ? 'Crear Grupo' : 'Crear Chat'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Menú Contextual -->
{#if menuContextualVisible && chatMenuSeleccionado}
	<div 
		class="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50"
		style="left: {posicionMenu.x}px; top: {posicionMenu.y}px;"
		on:click|stopPropagation
	>
		<!-- Opción eliminar -->
		<button
			class="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
			on:click={confirmarEliminarChat}
			disabled={eliminandoChat}
		>
			{#if eliminandoChat}
				<div class="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
				<span>Eliminando...</span>
			{:else}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
				</svg>
				<span>
					{chatMenuSeleccionado.es_grupal ? 'Eliminar grupo' : 'Salir del chat'}
				</span>
			{/if}
		</button>
		
		<!-- Opción información (futura) -->
		<button
			class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
			on:click={cerrarMenuContextual}
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
			</svg>
			<span>Información</span>
		</button>
	</div>
{/if}

<style>
	/* Transiciones suaves */
	.transition-colors {
		transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
	}
	
	/* Efectos hover */
	.hover\:bg-gray-50:hover {
		background-color: rgba(249, 250, 251, 0.8);
	}
	
	.dark .hover\:bg-gray-800:hover {
		background-color: rgba(31, 41, 55, 0.8);
	}
	
	/* Animación de carga */
	.animate-pulse {
		animation: pulso 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
	
	@keyframes pulso {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	/* Estilos de scroll mejorados */
	.flex-1.overflow-y-auto {
		height: 0; /* Fuerza el contenedor flex a respetar min-height */
		flex-grow: 1;
		flex-shrink: 1;
		flex-basis: 0%;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch; /* Scroll suave en iOS */
		scrollbar-width: thin; /* Firefox */
		scrollbar-color: rgba(156, 163, 175, 0.3) transparent; /* Firefox */
	}

	/* Scrollbar para navegadores WebKit */
	.flex-1.overflow-y-auto::-webkit-scrollbar {
		width: 8px;
	}

	.flex-1.overflow-y-auto::-webkit-scrollbar-track {
		background: transparent;
	}

	.flex-1.overflow-y-auto::-webkit-scrollbar-thumb {
		background-color: rgba(156, 163, 175, 0.3);
		border-radius: 4px;
		border: 2px solid transparent;
		background-clip: content-box;
	}

	.flex-1.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background-color: rgba(156, 163, 175, 0.5);
	}

	/* Para modo oscuro */
	.dark .flex-1.overflow-y-auto::-webkit-scrollbar-thumb {
		background-color: rgba(75, 85, 99, 0.5);
	}

	.dark .flex-1.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background-color: rgba(75, 85, 99, 0.7);
	}
</style> 