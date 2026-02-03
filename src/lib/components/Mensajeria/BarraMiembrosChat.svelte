<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Chat, MiembroChat } from '$lib/services/mensajeriaService';
	import { formatearTiempoRelativo } from '$lib/services/imagenUsuarioService';

	// ============================================
	// PROPS Y EVENTOS
	// ============================================

	export let chat: Chat;
	export let onCerrar: () => void = () => {};

	const dispatch = createEventDispatcher();

	// ============================================
	// ESTADOS Y VARIABLES
	// ============================================

	let mostrarConfiguracion = false;
	let buscandoMiembros = '';

	// ============================================
	// FUNCIONES DE UTILIDAD
	// ============================================

	/**
	 * 🔍 Filtrar miembros según búsqueda
	 */
	$: miembrosFiltrados = (chat.miembros || []).filter(miembro => {
		if (!buscandoMiembros) return true;
		const termino = buscandoMiembros.toLowerCase();
		const nombre = miembro.usuario?.nombre_completo?.toLowerCase() || '';
		const usuario = miembro.usuario?.nombre_usuario?.toLowerCase() || '';
		return nombre.includes(termino) || usuario.includes(termino);
	});

	/**
	 * 🎨 Obtener badge de rol
	 */
	function obtenerBadgeRol(miembro: MiembroChat): string {
		if (miembro.es_admin) return 'Admin';
		return miembro.usuario?.rol || 'Miembro';
	}

	/**
	 * 🎨 Obtener color del badge
	 */
	function obtenerColorBadge(miembro: MiembroChat): string {
		if (miembro.es_admin) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
		
		switch (miembro.usuario?.rol) {
			case 'administrador':
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
			case 'instructor':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
			case 'estudiante':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
		}
	}

	/**
	 * 🎨 Obtener estado de conexión
	 */
	function obtenerEstadoConexion(miembro: MiembroChat): { texto: string; color: string } {
		if (miembro.usuario?.conectado) {
			return { texto: 'En línea', color: 'text-green-600 dark:text-green-400' };
		}
		
		if (miembro.ultimo_acceso) {
			const tiempoOffline = formatearTiempoRelativo(miembro.ultimo_acceso);
			return { texto: `Visto ${tiempoOffline}`, color: 'text-gray-500 dark:text-gray-400' };
		}
		
		return { texto: 'Desconectado', color: 'text-gray-500 dark:text-gray-400' };
	}

	/**
	 * 📊 Obtener estadísticas del chat
	 */
	function obtenerEstadisticasChat() {
		const totalMiembros = chat.miembros?.length || 0;
		const miembrosActivos = chat.miembros?.filter(m => m.estado_miembro === 'activo').length || 0;
		const administradores = chat.miembros?.filter(m => m.es_admin).length || 0;
		const conectados = chat.miembros?.filter(m => m.usuario?.conectado).length || 0;
		
		return {
			totalMiembros,
			miembrosActivos,
			administradores,
			conectados
		};
	}

	// ============================================
	// FUNCIONES DE ACCIONES
	// ============================================

	/**
	 * 💬 Enviar mensaje privado
	 */
	function enviarMensajePrivado(miembro: MiembroChat) {
		console.log('Enviar mensaje privado a:', miembro.usuario?.nombre_completo);
		// Implementar lógica para crear chat privado
	}

	/**
	 * 👤 Ver perfil del usuario
	 */
	function verPerfil(miembro: MiembroChat) {
		if (miembro.usuario?.nombre_usuario) {
			window.open(`/usuarios/${miembro.usuario.nombre_usuario}`, '_blank');
		}
	}

	/**
	 * ⚙️ Configurar miembro (solo admins)
	 */
	function configurarMiembro(miembro: MiembroChat) {
		console.log('Configurar miembro:', miembro.usuario?.nombre_completo);
		// Implementar modal de configuración de miembro
	}

	/**
	 * 🚪 Salir del chat
	 */
	function salirDelChat() {
		if (confirm('¿Estás seguro de que quieres salir de este chat?')) {
			console.log('Salir del chat');
			// Implementar lógica para salir del chat
		}
	}

	$: estadisticas = obtenerEstadisticasChat();
</script>

<!-- ============================================ -->
<!-- BARRA LATERAL DE MIEMBROS -->
<!-- ============================================ -->

<div class="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-lg z-50 flex flex-col">
	<!-- Header -->
	<div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
			{chat.es_grupal ? 'Miembros del Grupo' : 'Información del Chat'}
		</h3>
		<button
			on:click={onCerrar}
			class="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
			</svg>
		</button>
	</div>

	<!-- Información del chat -->
	<div class="p-4 border-b border-gray-200 dark:border-gray-700">
		<!-- Avatar y nombre del chat -->
		<div class="flex items-center space-x-3 mb-4">
			<img
				src={chat.imagen_url || 'https://via.placeholder.com/60'}
				alt={chat.nombre || 'Chat'}
				class="w-15 h-15 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
			>
			<div class="flex-1">
				<h4 class="text-lg font-semibold text-gray-900 dark:text-white">
					{chat.nombre || (chat.es_grupal ? 'Grupo sin nombre' : 'Chat Privado')}
				</h4>
				{#if chat.descripcion}
					<p class="text-sm text-gray-600 dark:text-gray-400">
						{chat.descripcion}
					</p>
				{/if}
			</div>
		</div>

		<!-- Estadísticas del chat -->
		{#if chat.es_grupal}
			<div class="grid grid-cols-2 gap-3 mb-4">
				<div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
					<div class="text-lg font-bold text-gray-900 dark:text-white">{estadisticas.totalMiembros}</div>
					<div class="text-xs text-gray-500 dark:text-gray-400">Miembros</div>
				</div>
				<div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
					<div class="text-lg font-bold text-green-600 dark:text-green-400">{estadisticas.conectados}</div>
					<div class="text-xs text-gray-500 dark:text-gray-400">En línea</div>
				</div>
			</div>
		{/if}

		<!-- Botones de acción -->
		<div class="flex space-x-2">
			{#if chat.es_grupal}
				<button
					on:click={() => mostrarConfiguracion = !mostrarConfiguracion}
					class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
				>
					⚙️ Configurar
				</button>
				<button
					on:click={salirDelChat}
					class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
				>
					🚪 Salir
				</button>
			{:else}
				<button
					class="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
				>
					🔇 Silenciar
				</button>
				<button
					class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
				>
					🚫 Bloquear
				</button>
			{/if}
		</div>
	</div>

	<!-- Búsqueda de miembros -->
	{#if chat.es_grupal && (chat.miembros?.length || 0) > 5}
		<div class="p-4 border-b border-gray-200 dark:border-gray-700">
			<div class="relative">
				<input
					type="text"
					bind:value={buscandoMiembros}
					placeholder="Buscar miembros..."
					class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
						   bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white 
						   focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				>
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
					</svg>
				</div>
			</div>
		</div>
	{/if}

	<!-- Lista de miembros -->
	<div class="flex-1 overflow-y-auto">
		{#if miembrosFiltrados.length === 0}
			<div class="p-4 text-center text-gray-500 dark:text-gray-400">
				{#if buscandoMiembros}
					🔍 No se encontraron miembros con "{buscandoMiembros}"
				{:else}
					👤 No hay miembros para mostrar
				{/if}
			</div>
		{:else}
			<div class="p-2">
				{#each miembrosFiltrados as miembro (miembro.id)}
					<div class="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg group">
						<!-- Avatar con indicador de estado -->
						<div class="relative">
							<img
								src={miembro.usuario?.url_foto_perfil || 'https://via.placeholder.com/40'}
								alt={miembro.usuario?.nombre_completo || 'Usuario'}
								class="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700"
							>
							<!-- Indicador de conexión -->
							<div class="absolute bottom-0 right-0 w-3 h-3 {miembro.usuario?.conectado ? 'bg-green-500' : 'bg-gray-400'} rounded-full border-2 border-white dark:border-gray-700"></div>
						</div>

						<!-- Información del miembro -->
						<div class="flex-1 min-w-0">
							<div class="flex items-center space-x-2">
								<h5 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
									{miembro.usuario?.nombre_completo || 'Usuario'}
								</h5>
								<!-- Badge de rol -->
								<span class="px-2 py-1 text-xs font-medium rounded-full {obtenerColorBadge(miembro)}">
									{obtenerBadgeRol(miembro)}
								</span>
							</div>
							
							<div class="flex items-center justify-between">
								<p class="text-xs {obtenerEstadoConexion(miembro).color}">
									{obtenerEstadoConexion(miembro).texto}
								</p>
								
								{#if miembro.mensajes_no_leidos > 0}
									<span class="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
										{miembro.mensajes_no_leidos}
									</span>
								{/if}
							</div>
						</div>

						<!-- Acciones (visibles en hover) -->
						<div class="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
							{#if !chat.es_grupal || miembro.usuario_id !== 'current_user_id'}
								<button
									on:click={() => enviarMensajePrivado(miembro)}
									class="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
									title="Mensaje privado"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
									</svg>
								</button>
							{/if}
							
							<button
								on:click={() => verPerfil(miembro)}
								class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
								title="Ver perfil"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
								</svg>
							</button>
							
							{#if chat.es_grupal && miembro.es_admin}
								<button
									on:click={() => configurarMiembro(miembro)}
									class="p-1 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
									title="Configurar miembro"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
									</svg>
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Panel de configuración (opcional) -->
	{#if mostrarConfiguracion && chat.es_grupal}
		<div class="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
			<h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
				⚙️ Configuración del Grupo
			</h4>
			
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-700 dark:text-gray-300">Notificaciones</span>
					<button class="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
						<span class="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6"></span>
					</button>
				</div>
				
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-700 dark:text-gray-300">Sonidos</span>
					<button class="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 transition-colors">
						<span class="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1"></span>
					</button>
				</div>
				
				<button class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
					🗑️ Eliminar historial
				</button>
				
				<button class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
					🚪 Abandonar grupo
				</button>
			</div>
		</div>
	{/if}
</div>

<!-- Overlay para cerrar en mobile -->
<div 
	class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
	on:click={onCerrar}
	role="button"
	tabindex="0"
	on:keydown={(e) => e.key === 'Escape' && onCerrar()}
></div>

<style>
	/* Scroll personalizado */
	.overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-track {
		background: transparent;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: rgba(156, 163, 175, 0.5);
		border-radius: 3px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: rgba(156, 163, 175, 0.7);
	}
	
	/* Transiciones suaves */
	.transition-colors {
		transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
	}
	
	.transition-opacity {
		transition: opacity 0.2s ease-in-out;
	}
	
	/* Efectos de grupo */
	.group:hover .group-hover\:opacity-100 {
		opacity: 1;
	}
</style> 