<script lang="ts">
	import { inscribirUsuarioEnPaquete } from '$lib/services/paquetesService';
	
	export let usuarioId: string;
	export let paqueteId: string;
	
	let resultado = '';
	let cargando = false;
	
	async function probarInscripcion() {
		cargando = true;
		resultado = '';
		
		try {
			console.log('🧪 Probando inscripción:', { usuarioId, paqueteId });
			const respuesta = await inscribirUsuarioEnPaquete(usuarioId, paqueteId);
			
			if (respuesta.success) {
				resultado = '✅ Inscripción exitosa: ' + respuesta.message;
				console.log('✅ Respuesta exitosa:', respuesta);
			} else {
				resultado = '❌ Error: ' + respuesta.error;
				console.error('❌ Error en inscripción:', respuesta);
			}
		} catch (error) {
			resultado = '❌ Error inesperado: ' + error;
			console.error('❌ Error inesperado:', error);
		} finally {
			cargando = false;
		}
	}
</script>

<div class="test-container">
	<h4>🧪 Prueba de Inscripción de Paquete</h4>
	<p>Usuario ID: {usuarioId}</p>
	<p>Paquete ID: {paqueteId}</p>
	
	<button 
		class="btn-test"
		on:click={probarInscripcion}
		disabled={cargando}
	>
		{cargando ? 'Probando...' : 'Probar Inscripción'}
	</button>
	
	{#if resultado}
		<div class="resultado" class:exito={resultado.includes('✅')} class:error={resultado.includes('❌')}>
			{resultado}
		</div>
	{/if}
</div>

<style>
	.test-container {
		background: rgba(255, 255, 255, 0.1);
		padding: 20px;
		border-radius: 8px;
		margin: 20px 0;
		border: 2px solid rgba(255, 255, 255, 0.2);
	}
	
	.btn-test {
		background: rgba(102, 126, 234, 0.3);
		color: #667eea;
		border: 1px solid #667eea;
		padding: 10px 20px;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.3s ease;
	}
	
	.btn-test:hover:not(:disabled) {
		background: rgba(102, 126, 234, 0.4);
		transform: translateY(-1px);
	}
	
	.btn-test:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.resultado {
		margin-top: 15px;
		padding: 12px;
		border-radius: 6px;
		font-weight: 600;
	}
	
	.resultado.exito {
		background: rgba(40, 167, 69, 0.2);
		color: #28a745;
		border: 1px solid #28a745;
	}
	
	.resultado.error {
		background: rgba(220, 53, 69, 0.2);
		color: #dc3545;
		border: 1px solid #dc3545;
	}
</style> 