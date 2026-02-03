<script lang="ts">
	export let filtroActivo: 'todos' | 'cursos' | 'tutoriales' | 'paquetes' = 'todos';
	export let onFiltroChange: (filtro: 'todos' | 'cursos' | 'tutoriales' | 'paquetes') => void;
</script>

<div class="filtros-contenido">
	<button 
		class="filtro-btn"
		class:activo={filtroActivo === 'todos'}
		on:click={() => onFiltroChange('todos')}
	>
		🎯 Todos
	</button>
	<button 
		class="filtro-btn"
		class:activo={filtroActivo === 'cursos'}
		on:click={() => onFiltroChange('cursos')}
	>
		📚 Cursos
	</button>
	<button 
		class="filtro-btn"
		class:activo={filtroActivo === 'tutoriales'}
		on:click={() => onFiltroChange('tutoriales')}
	>
		🎯 Tutoriales
	</button>
	<button 
		class="filtro-btn"
		class:activo={filtroActivo === 'paquetes'}
		on:click={() => onFiltroChange('paquetes')}
	>
		🎁 Paquetes
	</button>
</div>

<style>
	.filtros-contenido {
		display: flex;
		gap: 8px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}

	.filtro-btn {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 8px 16px;
		border-radius: 20px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.filtro-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		transform: translateY(-1px);
	}

	.filtro-btn.activo {
		background: rgba(102, 126, 234, 0.3);
		color: #667eea;
		border-color: #667eea;
	}

	.filtro-btn.activo:hover {
		background: rgba(102, 126, 234, 0.4);
	}
</style> 