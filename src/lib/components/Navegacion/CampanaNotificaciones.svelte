<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { notificacionesService, type Notificacion } from '$lib/services/notificacionesService';
	import { goto } from '$app/navigation';

	// Props
	export let esMobile = false;

	// Estado del componente
	let notificaciones: Notificacion[] = [];
	let notificacionesRecientes: Notificacion[] = [];
	let totalNoLeidas = 0;
	let mostrarDropdown = false;
	let cargando = true;

	// Referencias DOM
	let componenteRef: HTMLElement;

	/**
	 * 🚀 Inicialización
	 */
	onMount(async () => {
		await cargarNotificaciones();

		// Suscribirse a nuevas notificaciones en tiempo real
		await notificacionesService.suscribirseANotificaciones(async (nuevaNotificacion) => {
			// Agregar a la lista
			notificaciones = [nuevaNotificacion, ...notificaciones];
			await actualizarEstado();
			
			// Mostrar brevemente el dropdown si hay una nueva notificación importante
			if (nuevaNotificacion.prioridad === 'alta') {
				mostrarDropdown = true;
				setTimeout(() => {
					if (mostrarDropdown) mostrarDropdown = false;
				}, 5000);
			}
		});

		// Suscribirse al contador en tiempo real
		notificacionesService.suscribirseAContador((nuevoContador) => {
			totalNoLeidas = nuevoContador;
		});

		// Listener para cerrar dropdown al hacer clic fuera
		document.addEventListener('click', manejarClickFuera);
	});

	/**
	 * 🧹 Limpiar al destruir
	 */
	onDestroy(() => {
		notificacionesService.desuscribirseDeNotificaciones();
		document.removeEventListener('click', manejarClickFuera);
	});

	/**
	 * 📥 Cargar notificaciones
	 */
	async function cargarNotificaciones() {
		cargando = true;

		const { notificaciones: data, error } = await notificacionesService.obtenerNotificaciones({
			limite: 10 // Solo las 10 más recientes para el dropdown
		});

		if (!error) {
			notificaciones = data;
			await actualizarEstado();
		}

		cargando = false;
	}

	/**
	 * 🔄 Actualizar estado interno
	 */
	async function actualizarEstado() {
		// Obtener contador real desde la base de datos
		totalNoLeidas = await notificacionesService.obtenerContadorNoLeidas();
		
		// Obtener las 5 más recientes para mostrar en dropdown
		notificacionesRecientes = notificaciones.slice(0, 5);
	}

	/**
	 * 🎯 Toggle del dropdown
	 */
	function toggleDropdown() {
		mostrarDropdown = !mostrarDropdown;
	}

	/**
	 * 🖱️ Manejar click fuera del componente
	 */
	function manejarClickFuera(event: MouseEvent) {
		if (componenteRef && !componenteRef.contains(event.target as Node)) {
			mostrarDropdown = false;
		}
	}

	/**
	 * ✅ Marcar notificación como leída
	 */
	async function marcarComoLeida(notificacion: Notificacion, event: MouseEvent) {
		event.stopPropagation();

		if (notificacion.leida) return;

		const { exito } = await notificacionesService.marcarComoLeida([notificacion.id]);
		
		if (exito) {
			// Actualizar localmente
			notificaciones = notificaciones.map(n => 
				n.id === notificacion.id ? { ...n, leida: true } : n
			);
			await actualizarEstado();
		}
	}

	/**
	 * 🔗 Manejar clic en notificación
	 */
	async function manejarClicNotificacion(notificacion: Notificacion) {
		// Marcar como leída automáticamente
		if (!notificacion.leida) {
			await marcarComoLeida(notificacion, new MouseEvent('click'));
		}

		// Cerrar dropdown
		mostrarDropdown = false;

		// Navegar según la acción
		if (notificacion.url_accion) {
			goto(notificacion.url_accion);
		}
	}

	/**
	 * 📋 Ir a página completa de notificaciones
	 */
	function irANotificaciones() {
		mostrarDropdown = false;
		goto('/notificaciones');
	}

	/**
	 * ✅ Marcar todas como leídas
	 */
	async function marcarTodasComoLeidas(event: MouseEvent) {
		event.stopPropagation();

		const { exito } = await notificacionesService.marcarTodasComoLeidas();
		
		if (exito) {
			notificaciones = notificaciones.map(n => ({ ...n, leida: true }));
			await actualizarEstado();
		}
	}

	/**
	 * 🎨 Obtener clase CSS para la campana
	 */
	function obtenerClaseCampana(): string {
		let clases = esMobile ? 'icono-movil notif-movil' : 'icono badge';
		
		if (totalNoLeidas > 0) {
			clases += ' tiene-notificaciones';
		}
		
		if (mostrarDropdown) {
			clases += ' activo';
		}

		return clases;
	}

	/**
	 * ⏰ Formatear tiempo de forma compacta
	 */
	function formatearTiempoCompacto(fecha: string): string {
		const ahora = new Date();
		const fechaNotificacion = new Date(fecha);
		const diferencia = ahora.getTime() - fechaNotificacion.getTime();

		const minutos = Math.floor(diferencia / 60000);
		const horas = Math.floor(diferencia / 3600000);
		const dias = Math.floor(diferencia / 86400000);

		if (minutos < 1) return 'Ahora';
		if (minutos < 60) return `${minutos}m`;
		if (horas < 24) return `${horas}h`;
		if (dias < 7) return `${dias}d`;
		
		return fechaNotificacion.toLocaleDateString('es-ES', {
			day: '2-digit',
			month: '2-digit'
		});
	}

	// Reactividad - Llamar actualizarEstado cuando cambien las notificaciones
	$: if (notificaciones) {
		actualizarEstado();
	}
</script>

<div class="campana-container" bind:this={componenteRef}>
	<!-- 🔔 Botón de campana -->
	<button 
		class={obtenerClaseCampana()}
		on:click={toggleDropdown}
		aria-label="Notificaciones"
		class:cargando
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
			<path d="M13.73 21a2 2 0 0 1-3.46 0"/>
		</svg>
		
		<!-- Badge con número de notificaciones -->
		{#if totalNoLeidas > 0}
			<span class={esMobile ? 'num-movil' : 'num'}>
				{totalNoLeidas > 99 ? '99+' : totalNoLeidas}
			</span>
		{/if}

		<!-- Indicador de actividad -->
		{#if cargando}
			<div class="indicador-carga"></div>
		{/if}
	</button>

	<!-- 📋 Dropdown de notificaciones -->
	{#if mostrarDropdown}
		<div class="dropdown-notificaciones" transition:slide={{ duration: 300 }}>
			<!-- Header del dropdown -->
			<div class="header-dropdown">
				<h3>
					<span class="icono-header">🔔</span>
					Notificaciones
				</h3>
				
				{#if totalNoLeidas > 0}
					<button 
						class="boton-marcar-todas-mini"
						on:click={marcarTodasComoLeidas}
						title="Marcar todas como leídas"
					>
						✅
					</button>
				{/if}
			</div>

			<!-- Lista de notificaciones recientes -->
			<div class="lista-dropdown">
				{#if cargando}
					<div class="cargando-mini">
						<div class="spinner-mini"></div>
						<span>Cargando...</span>
					</div>
				{:else if notificacionesRecientes.length === 0}
					<div class="sin-notificaciones-mini">
						<span class="icono-vacio-mini">📭</span>
						<p>No hay notificaciones nuevas</p>
					</div>
				{:else}
					{#each notificacionesRecientes as notificacion (notificacion.id)}
						<div 
							class="item-notificacion-dropdown"
							class:no-leida={!notificacion.leida}
							class:clickeable={notificacion.url_accion}
							on:click={() => manejarClicNotificacion(notificacion)}
							transition:fade={{ duration: 200 }}
						>
							<!-- Icono -->
							<div 
								class="icono-mini"
								style="background-color: {notificacionesService.obtenerColorPorCategoria(notificacion.categoria)}"
							>
								{notificacion.icono || notificacionesService.obtenerIconoPorTipo(notificacion.tipo)}
							</div>

							<!-- Contenido -->
							<div class="contenido-mini">
								<div class="titulo-mini">{notificacion.titulo}</div>
								<div class="mensaje-mini">{notificacion.mensaje}</div>
								<div class="tiempo-mini">{formatearTiempoCompacto(notificacion.fecha_creacion)}</div>
							</div>

							<!-- Acción rápida -->
							{#if !notificacion.leida}
								<button 
									class="boton-marcar-mini"
									on:click={(e) => marcarComoLeida(notificacion, e)}
									title="Marcar como leída"
								>
									✓
								</button>
							{/if}

							<!-- Indicador de no leída -->
							{#if !notificacion.leida}
								<div class="punto-no-leida"></div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>

			<!-- Footer del dropdown -->
			<div class="footer-dropdown">
				<button class="boton-ver-todas" on:click={irANotificaciones}>
					<span class="icono-ver-todas">👀</span>
					Ver todas las notificaciones
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
/* 🏗️ Contenedor principal */
.campana-container {
	position: relative;
	display: inline-block;
}

/* 🔔 Estilos de la campana */
.icono,
.icono-movil {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0.75rem;
	background: transparent;
	border: none;
	border-radius: 50%;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	color: #64748b;
}

.icono {
	width: 44px;
	height: 44px;
}

.icono-movil {
	width: 40px;
	height: 40px;
}

.icono svg,
.icono-movil svg {
	width: 24px;
	height: 24px;
	transition: all 0.3s ease;
}

/* Estados de la campana */
.icono:hover,
.icono-movil:hover {
	background: rgba(59, 130, 246, 0.1);
	color: #3b82f6;
	transform: scale(1.05);
}

.icono.activo,
.icono-movil.activo {
	background: #3b82f6;
	color: white;
	transform: scale(1.1);
}

.icono.tiene-notificaciones,
.icono-movil.tiene-notificaciones {
	color: #3b82f6;
}

.icono.tiene-notificaciones svg,
.icono-movil.tiene-notificaciones svg {
	animation: campanilla 2s ease-in-out infinite;
}

@keyframes campanilla {
	0%, 100% { transform: rotate(0deg); }
	10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
	20%, 40%, 60%, 80% { transform: rotate(10deg); }
}

.icono.cargando svg,
.icono-movil.cargando svg {
	animation: none;
	opacity: 0.6;
}

/* 🏷️ Badge de números */
.num,
.num-movil {
	position: absolute;
	top: -2px;
	right: -2px;
	background: linear-gradient(135deg, #ef4444, #dc2626);
	color: white;
	border-radius: 50%;
	font-size: 0.75rem;
	font-weight: 700;
	min-width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2px solid white;
	animation: pulso 2s ease-in-out infinite;
}

.num-movil {
	font-size: 0.7rem;
	min-width: 18px;
	height: 18px;
}

@keyframes pulso {
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.1); }
}

/* 🔄 Indicador de carga */
.indicador-carga {
	position: absolute;
	top: 2px;
	right: 2px;
	width: 8px;
	height: 8px;
	background: #3b82f6;
	border-radius: 50%;
	animation: parpadeo 1.5s ease-in-out infinite;
}

@keyframes parpadeo {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.3; }
}

/* 📋 Dropdown de notificaciones */
.dropdown-notificaciones {
	position: absolute;
	top: calc(100% + 0.5rem);
	right: 0;
	width: 380px;
	max-width: 90vw;
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 16px;
	box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
	z-index: 1000;
	overflow: hidden;
}

/* 🔝 Header del dropdown */
.header-dropdown {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem 1.25rem;
	background: linear-gradient(135deg, #f8fafc, #e2e8f0);
	border-bottom: 1px solid #e2e8f0;
}

.header-dropdown h3 {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: #1e293b;
}

.icono-header {
	font-size: 1.1rem;
}

.boton-marcar-todas-mini {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	background: #dcfce7;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 0.875rem;
}

.boton-marcar-todas-mini:hover {
	background: #16a34a;
	color: white;
	transform: scale(1.05);
}

/* 📋 Lista de notificaciones */
.lista-dropdown {
	max-height: 400px;
	overflow-y: auto;
}

.item-notificacion-dropdown {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 1rem 1.25rem;
	border-bottom: 1px solid #f1f5f9;
	position: relative;
	transition: all 0.3s ease;
	cursor: pointer;
}

.item-notificacion-dropdown:hover {
	background: #f8fafc;
}

.item-notificacion-dropdown.clickeable:hover {
	background: #eff6ff;
	transform: translateX(2px);
}

.item-notificacion-dropdown.no-leida {
	background: linear-gradient(90deg, #eff6ff 0%, #ffffff 100%);
	border-left: 3px solid #3b82f6;
}

.item-notificacion-dropdown:last-child {
	border-bottom: none;
}

/* 🎨 Iconos mini */
.icono-mini {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 10px;
	color: white;
	font-size: 1rem;
	font-weight: bold;
	flex-shrink: 0;
}

/* 📝 Contenido mini */
.contenido-mini {
	flex: 1;
	min-width: 0;
}

.titulo-mini {
	font-size: 0.875rem;
	font-weight: 600;
	color: #1e293b;
	margin-bottom: 0.25rem;
	line-height: 1.3;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.mensaje-mini {
	font-size: 0.8rem;
	color: #64748b;
	line-height: 1.3;
	margin-bottom: 0.25rem;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.tiempo-mini {
	font-size: 0.7rem;
	color: #94a3b8;
	font-weight: 500;
}

/* 🎯 Botón marcar mini */
.boton-marcar-mini {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	background: #dcfce7;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
	font-size: 0.75rem;
	color: #16a34a;
	flex-shrink: 0;
}

.boton-marcar-mini:hover {
	background: #16a34a;
	color: white;
	transform: scale(1.1);
}

/* 🔴 Punto de no leída */
.punto-no-leida {
	position: absolute;
	top: 1rem;
	right: 1rem;
	width: 8px;
	height: 8px;
	background: #3b82f6;
	border-radius: 50%;
}

/* 📄 Footer del dropdown */
.footer-dropdown {
	padding: 1rem 1.25rem;
	background: #f8fafc;
	border-top: 1px solid #e2e8f0;
}

.boton-ver-todas {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	width: 100%;
	padding: 0.75rem;
	background: white;
	border: 2px solid #e2e8f0;
	border-radius: 10px;
	font-size: 0.875rem;
	font-weight: 600;
	color: #475569;
	cursor: pointer;
	transition: all 0.3s ease;
}

.boton-ver-todas:hover {
	background: #3b82f6;
	border-color: #3b82f6;
	color: white;
	transform: translateY(-1px);
}

.icono-ver-todas {
	font-size: 1rem;
}

/* 🎯 Estados especiales */
.cargando-mini,
.sin-notificaciones-mini {
	text-align: center;
	padding: 2rem 1rem;
	color: #64748b;
}

.spinner-mini {
	width: 24px;
	height: 24px;
	border: 2px solid #e5e7eb;
	border-top: 2px solid #3b82f6;
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin: 0 auto 0.5rem;
}

.icono-vacio-mini {
	font-size: 2rem;
	display: block;
	margin-bottom: 0.5rem;
}

.sin-notificaciones-mini p {
	margin: 0;
	font-size: 0.875rem;
}

/* 📱 Responsive */
@media (max-width: 768px) {
	.dropdown-notificaciones {
		width: 320px;
		right: -50px;
	}

	.item-notificacion-dropdown {
		padding: 0.75rem 1rem;
	}

	.titulo-mini,
	.mensaje-mini {
		white-space: normal;
		overflow: visible;
		text-overflow: initial;
	}

	.titulo-mini {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.mensaje-mini {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
}
</style> 