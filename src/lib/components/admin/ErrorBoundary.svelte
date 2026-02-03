<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	export let mostrarErrores = false;
	
	let erroresDesarrollo: string[] = [];
	let errorCount = 0;
	
	onMount(() => {
		if (!browser) return;
		
		// Capturar errores no críticos solo en desarrollo
		const isDevelopment = window.location.hostname === 'localhost';
		
		if (isDevelopment) {
			// Interceptar errores de fetch que no son críticos
			const originalFetch = window.fetch;
			window.fetch = async (...args) => {
				try {
					return await originalFetch(...args);
				} catch (error: unknown) {
					const url = args[0]?.toString() || '';
					const errorMessage = error instanceof Error ? error.message : String(error);
					
					// Ignorar errores conocidos de desarrollo
					const erroresIgnorados = [
						'/iconos-pwa/',
						'websocket',
						'NotificationService',
						'realtime',
						'_app/version.json'
					];
					
					const esErrorIgnorado = erroresIgnorados.some(pattern => 
						url.includes(pattern) || errorMessage.includes(pattern)
					);
					
					if (!esErrorIgnorado) {
						console.warn('🔧 Error de fetch interceptado:', url, error);
						erroresDesarrollo = [...erroresDesarrollo, `Fetch error: ${url}`];
						errorCount++;
					}
					
					// Re-lanzar el error para que la aplicación lo maneje normalmente
					throw error;
				}
			};
			
			// Solo registrar errores de WebSocket sin interceptar
			console.info('🔧 Error boundary activo para desarrollo');
			
			// Interceptar errores globales no críticos
			window.addEventListener('error', (event) => {
				const esErrorConocido = [
					'NotificationService',
					'IconifyIcon',
					'WebSocket',
					'realtime'
				].some(pattern => event.error?.message?.includes(pattern));
				
				if (esErrorConocido) {
					console.warn('🔧 Error conocido interceptado:', event.error?.message);
					erroresDesarrollo = [...erroresDesarrollo, `Global error: ${event.error?.message}`];
					errorCount++;
					event.preventDefault(); // Prevenir que se muestre en consola
				}
			});
			
			// Limpiar errores antiguos cada 30 segundos
			setInterval(() => {
				if (erroresDesarrollo.length > 10) {
					erroresDesarrollo = erroresDesarrollo.slice(-5);
				}
			}, 30000);
		}
	});
</script>

<!-- Slot principal -->
<slot />

<!-- Panel de errores de desarrollo (solo si se solicita) -->
{#if mostrarErrores && erroresDesarrollo.length > 0}
	<div class="error-dev-panel">
		<div class="error-header">
			<h4>🔧 Errores de Desarrollo ({errorCount})</h4>
			<button on:click={() => mostrarErrores = false}>×</button>
		</div>
		<div class="error-list">
			{#each erroresDesarrollo.slice(-5) as error}
				<div class="error-item">{error}</div>
			{/each}
		</div>
		<div class="error-footer">
			<small>Estos errores son normales en desarrollo y no afectan la funcionalidad</small>
		</div>
	</div>
{/if}

<style>
	.error-dev-panel {
		position: fixed;
		top: 10px;
		right: 10px;
		width: 300px;
		background: rgba(0, 0, 0, 0.9);
		color: #fbbf24;
		border: 1px solid #fbbf24;
		border-radius: 8px;
		font-size: 12px;
		z-index: 9999;
		max-height: 200px;
		overflow: hidden;
	}
	
	.error-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		border-bottom: 1px solid #fbbf24;
	}
	
	.error-header h4 {
		margin: 0;
		font-size: 13px;
	}
	
	.error-header button {
		background: none;
		border: none;
		color: #fbbf24;
		cursor: pointer;
		font-size: 16px;
	}
	
	.error-list {
		max-height: 120px;
		overflow-y: auto;
		padding: 8px;
	}
	
	.error-item {
		padding: 4px 0;
		border-bottom: 1px solid rgba(251, 191, 36, 0.2);
		font-family: monospace;
		word-break: break-all;
	}
	
	.error-footer {
		padding: 6px 12px;
		background: rgba(251, 191, 36, 0.1);
		text-align: center;
	}
</style> 