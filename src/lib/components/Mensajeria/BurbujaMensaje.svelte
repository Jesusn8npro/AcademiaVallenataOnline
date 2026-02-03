<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { formatearTiempoRelativo } from '$lib/services/imagenUsuarioService';
	import type { Mensaje, Chat } from '$lib/services/mensajeriaService';

	// ============================================
	// PROPS Y EVENTOS
	// ============================================

	export let mensaje: Mensaje;
	export let mensajeAnterior: Mensaje | undefined = undefined;
	export let mensajeSiguiente: Mensaje | undefined = undefined;
	export let chat: Chat;

	const dispatch = createEventDispatcher();

	// ============================================
	// ESTADOS Y VARIABLES
	// ============================================

	let mostrarAcciones = false;
	let mostrarEmojis = false;
	let mostrarTooltipReacciones = false;

	// Emojis más comunes para reacciones rápidas
	const emojisRapidos = ['👍', '❤️', '😍', '😂', '😮', '😢', '🔥', '👏'];

	// ============================================
	// FUNCIONES DE UTILIDAD
	// ============================================

	/**
	 * 🎨 Determinar si mostrar avatar
	 */
	function mostrarAvatar(): boolean {
		if (!mensajeSiguiente) return true;
		if (mensajeSiguiente.usuario_id !== mensaje.usuario_id) return true;
		
		// Mostrar avatar si ha pasado más de 5 minutos
		const tiempoActual = new Date(mensaje.creado_en).getTime();
		const tiempoSiguiente = new Date(mensajeSiguiente.creado_en).getTime();
		const diferencia = tiempoSiguiente - tiempoActual;
		
		return diferencia > 5 * 60 * 1000; // 5 minutos
	}

	/**
	 * 🎨 Determinar si mostrar nombre
	 */
	function mostrarNombre(): boolean {
		if (!chat.es_grupal || mensaje.es_mio) return false;
		if (!mensajeAnterior) return true;
		return mensajeAnterior.usuario_id !== mensaje.usuario_id;
	}

	/**
	 * 🎨 Determinar si mostrar timestamp
	 */
	function mostrarTimestamp(): boolean {
		if (!mensajeSiguiente) return true;
		if (mensajeSiguiente.usuario_id !== mensaje.usuario_id) return true;
		
		// Mostrar timestamp si ha pasado más de 5 minutos
		const tiempoActual = new Date(mensaje.creado_en).getTime();
		const tiempoSiguiente = new Date(mensajeSiguiente.creado_en).getTime();
		const diferencia = tiempoSiguiente - tiempoActual;
		
		return diferencia > 5 * 60 * 1000; // 5 minutos
	}

	/**
	 * 🎨 Obtener clase CSS para la burbuja
	 */
	function obtenerClaseBurbuja(): string {
		let clases = 'burbuja-mensaje p-3 rounded-2xl max-w-xs lg:max-w-md shadow-sm';
		
		if (mensaje.es_mio) {
			clases += ' bg-blue-600 text-white ml-auto';
		} else {
			clases += ' bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white';
		}
		
		// Ajustar bordes según posición en la secuencia
		if (mensaje.es_mio) {
			if (mensajeSiguiente?.es_mio && !mostrarTimestamp()) {
				clases += ' rounded-br-md';
			}
			if (mensajeAnterior?.es_mio && !mostrarNombre()) {
				clases += ' rounded-tr-md';
			}
		} else {
			if (mensajeSiguiente?.usuario_id === mensaje.usuario_id && !mostrarTimestamp()) {
				clases += ' rounded-bl-md';
			}
			if (mensajeAnterior?.usuario_id === mensaje.usuario_id && !mostrarNombre()) {
				clases += ' rounded-tl-md';
			}
		}
		
		return clases;
	}

	/**
	 * 🎨 Obtener estilo del contenedor
	 */
	function obtenerEstiloContenedor(): string {
		return mensaje.es_mio ? 'flex justify-end' : 'flex justify-start';
	}

	/**
	 * 🖼️ Renderizar contenido según tipo
	 */
	function renderizarContenido(): string {
		switch (mensaje.tipo) {
			case 'imagen':
				return `<img src="${mensaje.url_media}" alt="Imagen" class="rounded-lg max-w-full h-auto" />`;
			case 'video':
				return `<video src="${mensaje.url_media}" controls class="rounded-lg max-w-full h-auto"></video>`;
			case 'audio':
				return `<audio src="${mensaje.url_media}" controls class="w-full"></audio>`;
			case 'archivo':
				return `<div class="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
					</svg>
					<span class="text-sm">Archivo adjunto</span>
				</div>`;
			case 'sistema':
				return `<div class="text-xs text-gray-500 dark:text-gray-400 text-center italic">
					${mensaje.contenido}
				</div>`;
			default:
				return mensaje.contenido || '';
		}
	}

	/**
	 * 🎨 Obtener color del nombre de usuario
	 */
	function obtenerColorUsuario(): string {
		if (!mensaje.usuario_id) return 'text-gray-500';
		
		const colores = [
			'text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500',
			'text-purple-500', 'text-pink-500', 'text-indigo-500', 'text-teal-500'
		];
		
		// Usar el ID del usuario para generar un color consistente
		const hash = mensaje.usuario_id.split('').reduce((a, b) => {
			a = ((a << 5) - a) + b.charCodeAt(0);
			return a & a;
		}, 0);
		
		return colores[Math.abs(hash) % colores.length];
	}

	/**
	 * ✅ Obtener estado del mensaje estilo WhatsApp
	 */
	function obtenerEstadoMensaje(mensaje: Mensaje): 'enviando' | 'enviado' | 'entregado' | 'visto' {
		// Si el mensaje no es mío, no mostrar indicadores
		if (!mensaje.es_mio) return 'enviado';
		
		// Simulación de estados basada en propiedades del mensaje
		const messageData = mensaje as any;
		
		// Si tiene fecha de lectura o está marcado como leído = visto
		if (messageData.leido_en || messageData.leido_por_mi || messageData.visto) {
			return 'visto';
		}
		
		// Si tiene fecha de entrega o fue entregado = entregado
		if (messageData.entregado_en || messageData.entregado) {
			return 'entregado';
		}
		
		// Si tiene ID y fecha de creación = enviado
		if (mensaje.id && mensaje.creado_en) {
			return 'enviado';
		}
		
		// Por defecto = enviando
		return 'enviando';
	}

	/**
	 * 📝 Obtener texto descriptivo del estado
	 */
	function obtenerTextoEstado(mensaje: Mensaje): string {
		const estado = obtenerEstadoMensaje(mensaje);
		switch (estado) {
			case 'enviando':
				return 'Enviando...';
			case 'enviado':
				return 'Enviado';
			case 'entregado':
				return 'Entregado';
			case 'visto':
				return 'Visto';
			default:
				return '';
		}
	}

	// ============================================
	// FUNCIONES DE EVENTO
	// ============================================

	/**
	 * 😊 Agregar reacción
	 */
	function agregarReaccion(emoji: string) {
		dispatch('reaccionar', { emoji });
		mostrarEmojis = false;
	}

	/**
	 * 💭 Responder mensaje
	 */
	function responderMensaje() {
		dispatch('responder');
		mostrarAcciones = false;
	}

	/**
	 * ✏️ Editar mensaje
	 */
	function editarMensaje() {
		dispatch('editar');
		mostrarAcciones = false;
	}

	/**
	 * 🗑️ Eliminar mensaje
	 */
	function eliminarMensaje() {
		if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
			dispatch('eliminar');
		}
		mostrarAcciones = false;
	}

	/**
	 * 📋 Copiar mensaje
	 */
	function copiarMensaje() {
		navigator.clipboard.writeText(mensaje.contenido || '');
		mostrarAcciones = false;
		// Aquí podrías mostrar una notificación de "Copiado"
	}

	/**
	 * 🎯 Agrupar reacciones
	 */
	function agruparReacciones() {
		if (!mensaje.reacciones) return [];
		
		const grupos: { [key: string]: any } = {};
		
		mensaje.reacciones.forEach(reaccion => {
			if (!grupos[reaccion.reaccion]) {
				grupos[reaccion.reaccion] = {
					emoji: reaccion.reaccion,
					count: 0,
					usuarios: []
				};
			}
			grupos[reaccion.reaccion].count++;
			grupos[reaccion.reaccion].usuarios.push(reaccion.usuario);
		});
		
		return Object.values(grupos);
	}

	$: reaccionesAgrupadas = agruparReacciones();
</script>

<!-- ============================================ -->
<!-- TEMPLATE DEL MENSAJE -->
<!-- ============================================ -->

<div class="grupo-mensaje mb-1 {obtenerEstiloContenedor()}">
	<div class="flex items-end space-x-2 max-w-full">
		<!-- Avatar (para mensajes de otros usuarios - lado izquierdo) -->
		{#if !mensaje.es_mio && mostrarAvatar()}
			<div class="flex-shrink-0 mb-1">
				<img
					src={mensaje.usuario?.url_foto_perfil || '/favicon.png'}
					alt={mensaje.usuario?.nombre_completo || 'Usuario'}
					class="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm"
				>
			</div>
		{:else if !mensaje.es_mio}
			<div class="w-8 flex-shrink-0"></div>
		{/if}
		
		<!-- Contenido del mensaje -->
		<div class="flex flex-col {mensaje.es_mio ? 'items-end' : 'items-start'} max-w-full">
			<!-- Nombre del usuario (solo para grupos y mensajes de otros) -->
			{#if mostrarNombre()}
				<div class="px-3 mb-1">
					<span class="text-xs font-semibold {obtenerColorUsuario()}">
						{mensaje.usuario?.nombre_completo || 'Usuario'}
					</span>
				</div>
			{/if}
			
			<!-- Mensaje padre (si es una respuesta) -->
			{#if mensaje.mensaje_padre}
				<div class="mb-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500 max-w-xs">
					<div class="text-xs text-gray-500 dark:text-gray-400 font-medium">
						{mensaje.mensaje_padre.usuario?.nombre_completo || 'Usuario'}
					</div>
					<div class="text-sm text-gray-600 dark:text-gray-300 truncate">
						{mensaje.mensaje_padre.contenido}
					</div>
				</div>
			{/if}
			
			<!-- Burbuja del mensaje -->
			<div 
				class="{obtenerClaseBurbuja()} relative grupo-hover"
				on:mouseenter={() => mostrarAcciones = true}
				on:mouseleave={() => mostrarAcciones = false}
			>
				<!-- Contenido del mensaje -->
				<div class="contenido-mensaje">
					{#if mensaje.tipo === 'sistema'}
						<div class="text-xs text-gray-500 dark:text-gray-400 text-center italic">
							{mensaje.contenido}
						</div>
					{:else if mensaje.tipo === 'imagen' && mensaje.url_media}
						<img 
							src={mensaje.url_media} 
							alt="Imagen" 
							class="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
							on:click={() => {
								// Aquí podrías abrir un modal de imagen
								console.log('Abrir imagen en modal');
							}}
						/>
						{#if mensaje.contenido}
							<div class="mt-2 text-sm">{mensaje.contenido}</div>
						{/if}
					{:else if mensaje.tipo === 'video' && mensaje.url_media}
						<video 
							src={mensaje.url_media} 
							controls 
							class="rounded-lg max-w-full h-auto"
							preload="metadata"
						>
							Tu navegador no soporta videos.
						</video>
						{#if mensaje.contenido}
							<div class="mt-2 text-sm">{mensaje.contenido}</div>
						{/if}
					{:else if mensaje.tipo === 'audio' && mensaje.url_media}
						<div class="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v6.114A4.369 4.369 0 005 11c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
							</svg>
							<audio src={mensaje.url_media} controls class="flex-1">
								Tu navegador no soporta audio.
							</audio>
						</div>
						{#if mensaje.contenido}
							<div class="mt-2 text-sm">{mensaje.contenido}</div>
						{/if}
					{:else if mensaje.tipo === 'archivo' && mensaje.url_media}
						<a 
							href={mensaje.url_media} 
							download 
							class="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
						>
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
							</svg>
							<span class="text-sm">
								{mensaje.contenido || 'Archivo adjunto'}
							</span>
						</a>
					{:else}
						<!-- Mensaje de texto normal -->
						<div class="text-sm whitespace-pre-wrap break-words">
							{mensaje.contenido}
						</div>
					{/if}
				</div>
				
				<!-- Menú de acciones (visible en hover) -->
				{#if mostrarAcciones && mensaje.tipo !== 'sistema'}
					<div class="absolute {mensaje.es_mio ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-0 flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-1 z-10">
						<!-- Botón de reacción -->
						<button
							class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 relative"
							on:click={() => mostrarEmojis = !mostrarEmojis}
							title="Agregar reacción"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clip-rule="evenodd"/>
							</svg>
							
							<!-- Panel de emojis -->
							{#if mostrarEmojis}
								<div class="absolute bottom-full mb-2 {mensaje.es_mio ? 'right-0' : 'left-0'} bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 flex space-x-1 z-20">
									{#each emojisRapidos as emoji}
										<button
											class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
											on:click={() => agregarReaccion(emoji)}
										>
											{emoji}
										</button>
									{/each}
								</div>
							{/if}
						</button>
						
						<!-- Botón de responder -->
						<button
							class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
							on:click={responderMensaje}
							title="Responder"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
							</svg>
						</button>
						
						<!-- Botón de copiar -->
						<button
							class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
							on:click={copiarMensaje}
							title="Copiar"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
							</svg>
						</button>
						
						<!-- Botones adicionales para mensajes propios -->
						{#if mensaje.es_mio}
							<button
								class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
								on:click={editarMensaje}
								title="Editar"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
								</svg>
							</button>
							
							<button
								class="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
								on:click={eliminarMensaje}
								title="Eliminar"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
								</svg>
							</button>
						{/if}
					</div>
				{/if}
			</div>
			
			<!-- Reacciones -->
			{#if reaccionesAgrupadas.length > 0}
				<div class="flex flex-wrap gap-1 mt-1 px-3">
					{#each reaccionesAgrupadas as reaccionGrupo}
						<button
							class="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-xs transition-colors"
							on:click={() => agregarReaccion(reaccionGrupo.emoji)}
							title={reaccionGrupo.usuarios.map((u: any) => u?.nombre_completo || 'Usuario').join(', ')}
						>
							<span>{reaccionGrupo.emoji}</span>
							<span class="text-gray-600 dark:text-gray-400">{reaccionGrupo.count}</span>
						</button>
					{/each}
				</div>
			{/if}
			
			<!-- Timestamp y estado -->
			{#if mostrarTimestamp()}
				<div class="flex items-center space-x-2 px-3 mt-1">
					<span class="text-xs text-gray-500 dark:text-gray-400">
						{formatearTiempoRelativo(mensaje.creado_en)}
					</span>
					
					{#if mensaje.editado}
						<span class="text-xs text-gray-400 dark:text-gray-500 italic">
							editado
						</span>
					{/if}
					
					{#if mensaje.es_mio && mensaje.tipo !== 'sistema'}
						<!-- Indicadores de estado estilo WhatsApp -->
						<div class="text-xs flex items-center space-x-0.5" title={obtenerTextoEstado(mensaje)}>
							{#if obtenerEstadoMensaje(mensaje) === 'enviado'}
								<!-- ✓ Un check gris - Enviado -->
								<svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
								</svg>
							{:else if obtenerEstadoMensaje(mensaje) === 'entregado'}
								<!-- ✓✓ Dos checks grises - Entregado -->
								<div class="relative">
									<svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
									</svg>
									<svg class="w-3 h-3 text-gray-400 absolute -right-1 top-0" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
									</svg>
								</div>
							{:else if obtenerEstadoMensaje(mensaje) === 'visto'}
								<!-- ✓✓ Dos checks azules - Visto -->
								<div class="relative">
									<svg class="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
									</svg>
									<svg class="w-3 h-3 text-blue-500 absolute -right-1 top-0" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
									</svg>
								</div>
							{:else}
								<!-- Enviando... -->
								<svg class="w-3 h-3 text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
		
		<!-- Avatar (para mensajes propios - lado derecho) -->
		{#if mensaje.es_mio && mostrarAvatar()}
			<div class="flex-shrink-0 mb-1">
				<img
					src={mensaje.usuario?.url_foto_perfil || '/favicon.png'}
					alt={mensaje.usuario?.nombre_completo || 'Usuario'}
					class="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm"
				>
			</div>
		{:else if mensaje.es_mio}
			<div class="w-8 flex-shrink-0"></div>
		{/if}
	</div>
</div>

<style>
	/* Estilos para efectos hover */
	.grupo-hover:hover .acciones-mensaje {
		opacity: 1;
		visibility: visible;
	}
	
	.acciones-mensaje {
		opacity: 0;
		visibility: hidden;
		transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
	}
	
	/* Estilos para burbujas */
	.burbuja-mensaje {
		position: relative;
		word-wrap: break-word;
		hyphens: auto;
	}
	
	/* Animaciones suaves */
	.transition-colors {
		transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
	}
	
	/* Estilos para contenido multimedia */
	.contenido-mensaje img,
	.contenido-mensaje video {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
	}
	
	.contenido-mensaje audio {
		width: 100%;
		height: 32px;
	}
	
	/* Mejoras para accesibilidad */
	@media (prefers-reduced-motion: reduce) {
		.transition-colors {
			transition: none;
		}
	}
</style> 