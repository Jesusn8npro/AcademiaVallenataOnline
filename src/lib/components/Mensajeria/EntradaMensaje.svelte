<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Chat, Mensaje } from '$lib/services/mensajeriaService';

	// ============================================
	// PROPS Y EVENTOS
	// ============================================

	export let chat: Chat;
	export let mensajeEnRespuesta: Mensaje | null = null;
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher();

	// ============================================
	// ESTADOS Y VARIABLES
	// ============================================

	let contenidoMensaje = '';
	let inputMensaje: HTMLTextAreaElement;
	let enviandoMensaje = false;
	let mostrarEmojis = false;
	let mostrarAdjuntos = false;
	let archivoSeleccionado: File | null = null;
	let previsualizacionArchivo: string | null = null;
	let tipoArchivo: string | null = null;

	// Lista de emojis comunes
	const emojisComunes = [
		'😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
		'🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
		'😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
		'😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
		'😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
		'😔', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩',
		'🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
		'😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
		'🤗', '🤔', '🤭', '🤫', '🤥', '🤐', '🤨', '😐'
	];

	// ============================================
	// FUNCIONES PRINCIPALES
	// ============================================

	/**
	 * 📤 Enviar mensaje
	 */
	async function enviarMensaje() {
		const contenido = contenidoMensaje.trim();
		
		if (!contenido && !archivoSeleccionado) {
			return;
		}

		if (enviandoMensaje || disabled) {
			return;
		}

		try {
			enviandoMensaje = true;

			const datosEnvio: any = {
				contenido: contenido || ''
			};

			// Si hay archivo adjunto
			if (archivoSeleccionado) {
				// Aquí normalmente subirías el archivo y obtendrías la URL
				// Por ahora simulamos con la previsualización
				datosEnvio.url_media = previsualizacionArchivo;
				datosEnvio.tipo = tipoArchivo;
			}

			// Disparar evento
			dispatch('enviar', datosEnvio);

			// Limpiar formulario
			limpiarFormulario();

		} catch (error) {
			console.error('Error enviando mensaje:', error);
		} finally {
			enviandoMensaje = false;
		}
	}

	/**
	 * 🧹 Limpiar formulario
	 */
	function limpiarFormulario() {
		contenidoMensaje = '';
		archivoSeleccionado = null;
		previsualizacionArchivo = null;
		tipoArchivo = null;
		mostrarEmojis = false;
		mostrarAdjuntos = false;
		ajustarAlturaTextarea();
	}

	/**
	 * ⌨️ Manejar teclas especiales
	 */
	function manejarTecla(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			enviarMensaje();
		}
	}

	/**
	 * 📏 Ajustar altura del textarea
	 */
	function ajustarAlturaTextarea() {
		if (inputMensaje) {
			inputMensaje.style.height = 'auto';
			inputMensaje.style.height = Math.min(inputMensaje.scrollHeight, 120) + 'px';
		}
	}

	/**
	 * 😊 Insertar emoji
	 */
	function insertarEmoji(emoji: string) {
		const cursorPos = inputMensaje.selectionStart || 0;
		const textoAntes = contenidoMensaje.substring(0, cursorPos);
		const textoDespues = contenidoMensaje.substring(cursorPos);
		
		contenidoMensaje = textoAntes + emoji + textoDespues;
		
		// Reestablecer cursor
		setTimeout(() => {
			inputMensaje.focus();
			inputMensaje.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
		}, 0);
		
		mostrarEmojis = false;
		ajustarAlturaTextarea();
	}

	/**
	 * 📎 Manejar selección de archivo
	 */
	function manejarSeleccionArchivo(event: Event) {
		const input = event.target as HTMLInputElement;
		const archivo = input.files?.[0];
		
		if (!archivo) return;

		archivoSeleccionado = archivo;

		// Determinar tipo de archivo
		if (archivo.type.startsWith('image/')) {
			tipoArchivo = 'imagen';
		} else if (archivo.type.startsWith('video/')) {
			tipoArchivo = 'video';
		} else if (archivo.type.startsWith('audio/')) {
			tipoArchivo = 'audio';
		} else {
			tipoArchivo = 'archivo';
		}

		// Generar previsualización si es imagen
		if (tipoArchivo === 'imagen') {
			const reader = new FileReader();
			reader.onload = (e) => {
				previsualizacionArchivo = e.target?.result as string;
			};
			reader.readAsDataURL(archivo);
		} else {
			previsualizacionArchivo = URL.createObjectURL(archivo);
		}

		mostrarAdjuntos = false;
	}

	/**
	 * 🗑️ Remover archivo
	 */
	function removerArchivo() {
		archivoSeleccionado = null;
		previsualizacionArchivo = null;
		tipoArchivo = null;
	}

	/**
	 * 🎯 Enfocar input al montar
	 */
	function enfocarInput() {
		if (inputMensaje) {
			inputMensaje.focus();
		}
	}

	// Ajustar altura cuando cambia el contenido
	$: if (contenidoMensaje !== undefined) {
		setTimeout(ajustarAlturaTextarea, 0);
	}
</script>

<!-- ============================================ -->
<!-- TEMPLATE DE ENTRADA DE MENSAJE -->
<!-- ============================================ -->

<div class="entrada-mensaje bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
	<!-- Previsualización de archivo adjunto -->
	{#if archivoSeleccionado && previsualizacionArchivo}
		<div class="p-3 border-b border-gray-200 dark:border-gray-700">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					{#if tipoArchivo === 'imagen'}
						<img 
							src={previsualizacionArchivo} 
							alt="Vista previa" 
							class="w-16 h-16 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
						>
					{:else if tipoArchivo === 'video'}
						<div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-600">
							<svg class="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
								<path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM8 11a1 1 0 100 2h4a1 1 0 100-2H8z"/>
							</svg>
						</div>
					{:else if tipoArchivo === 'audio'}
						<div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-600">
							<svg class="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
								<path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v6.114A4.369 4.369 0 005 11c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
							</svg>
						</div>
					{:else}
						<div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-600">
							<svg class="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
								<path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
							</svg>
						</div>
					{/if}
					
					<div>
						<div class="text-sm font-medium text-gray-900 dark:text-white">
							{archivoSeleccionado.name}
						</div>
						<div class="text-xs text-gray-500 dark:text-gray-400">
							{(archivoSeleccionado.size / 1024 / 1024).toFixed(1)} MB
						</div>
					</div>
				</div>
				
				<button
					on:click={removerArchivo}
					class="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
					title="Remover archivo"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<!-- Área principal de entrada -->
	<div class="p-4">
		<div class="flex items-end space-x-3">
			<!-- Botones de acciones -->
			<div class="flex space-x-1">
				<!-- Botón de adjuntar archivo -->
				<div class="relative">
					<button
						class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
						on:click={() => mostrarAdjuntos = !mostrarAdjuntos}
						title="Adjuntar archivo"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
						</svg>
					</button>
					
					<!-- Panel de adjuntos -->
					{#if mostrarAdjuntos}
						<div class="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-2 min-w-[200px] z-20">
							<div class="space-y-1">
								<label class="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
									<svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
									</svg>
									<span class="text-sm text-gray-700 dark:text-gray-300">Imagen</span>
									<input type="file" accept="image/*" class="hidden" on:change={manejarSeleccionArchivo}>
								</label>
								
								<label class="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
									<svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
										<path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
									</svg>
									<span class="text-sm text-gray-700 dark:text-gray-300">Video</span>
									<input type="file" accept="video/*" class="hidden" on:change={manejarSeleccionArchivo}>
								</label>
								
								<label class="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
									<svg class="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
										<path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v6.114A4.369 4.369 0 005 11c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
									</svg>
									<span class="text-sm text-gray-700 dark:text-gray-300">Audio</span>
									<input type="file" accept="audio/*" class="hidden" on:change={manejarSeleccionArchivo}>
								</label>
								
								<label class="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
									<svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
										<path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
									</svg>
									<span class="text-sm text-gray-700 dark:text-gray-300">Documento</span>
									<input type="file" accept=".pdf,.doc,.docx,.txt" class="hidden" on:change={manejarSeleccionArchivo}>
								</label>
							</div>
						</div>
					{/if}
				</div>

				<!-- Botón de emojis -->
				<div class="relative">
					<button
						class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
						on:click={() => mostrarEmojis = !mostrarEmojis}
						title="Agregar emoji"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clip-rule="evenodd"/>
						</svg>
					</button>
					
					<!-- Panel de emojis -->
					{#if mostrarEmojis}
						<div class="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-3 w-80 max-h-60 overflow-y-auto z-20">
							<div class="grid grid-cols-8 gap-1">
								{#each emojisComunes as emoji}
									<button
										class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
										on:click={() => insertarEmoji(emoji)}
										title={emoji}
									>
										{emoji}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Campo de texto -->
			<div class="flex-1 relative">
				<textarea
					bind:this={inputMensaje}
					bind:value={contenidoMensaje}
					on:keydown={manejarTecla}
					on:input={ajustarAlturaTextarea}
					placeholder={mensajeEnRespuesta ? `Respondiendo a ${mensajeEnRespuesta.usuario?.nombre_completo}...` : `Escribe un mensaje en ${chat.nombre || 'este chat'}...`}
					class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none 
						   bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
						   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
						   placeholder-gray-500 dark:placeholder-gray-400
						   text-base leading-relaxed"
					style="min-height: 44px; max-height: 120px;"
					{disabled}
					rows="1"
				></textarea>
			</div>

			<!-- Botón de enviar -->
			<button
				on:click={enviarMensaje}
				disabled={(!contenidoMensaje.trim() && !archivoSeleccionado) || enviandoMensaje || disabled}
				class="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
				title="Enviar mensaje (Enter)"
			>
				{#if enviandoMensaje}
					<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
					</svg>
				{:else}
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
					</svg>
				{/if}
			</button>
		</div>

		<!-- Información adicional -->
		<div class="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
			<div class="flex items-center space-x-4">
				{#if mensajeEnRespuesta}
					<span>💭 Respondiendo a {mensajeEnRespuesta.usuario?.nombre_completo}</span>
				{/if}
				{#if archivoSeleccionado}
					<span>📎 Archivo adjunto</span>
				{/if}
			</div>
			
			<div class="flex items-center space-x-2">
				<span>Presiona Enter para enviar</span>
				<span>•</span>
				<span>Shift + Enter para nueva línea</span>
			</div>
		</div>
	</div>
</div>

<!-- Click fuera para cerrar paneles -->
<svelte:window 
	on:click={(e) => {
		if (!(e.target as Element)?.closest('.entrada-mensaje')) {
			mostrarEmojis = false;
			mostrarAdjuntos = false;
		}
	}}
/>

<style>
	/* Estilos personalizados para el textarea */
	textarea {
		field-sizing: content;
		overflow-y: hidden;
	}
	
	/* Scroll personalizado para panel de emojis */
	.overflow-y-auto::-webkit-scrollbar {
		width: 4px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: rgba(156, 163, 175, 0.5);
		border-radius: 2px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: rgba(156, 163, 175, 0.7);
	}
	
	/* Transiciones suaves */
	.transition-colors {
		transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
	}
	
	/* Animación de envío */
	.animate-spin {
		animation: spin 1s linear infinite;
	}
	
		/* Margen bottom específico para móvil */
	@media (max-width: 768px) {
		.entrada-mensaje {
			margin-bottom: 20px;
		}
	}
	
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style> 