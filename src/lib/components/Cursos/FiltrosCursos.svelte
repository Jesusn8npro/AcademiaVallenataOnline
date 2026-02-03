<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let filtros = {
		texto: '',
		tipo: '',
		nivel: '',
		precio: ''
	};

	export let estadisticas = {
		totalCursos: 0,
		totalTutoriales: 0
	};

	function cambiarFiltro(campo: string, valor: any) {
		(filtros as any)[campo] = valor;
		dispatch('filtrar', filtros);
	}

	function limpiarTodo() {
		filtros = { texto: '', tipo: '', nivel: '', precio: '' };
		dispatch('filtrar', filtros);
	}

	$: totalResultados = estadisticas.totalCursos + estadisticas.totalTutoriales;
	$: hayFiltros = filtros.texto || filtros.tipo || filtros.nivel || filtros.precio;
</script>

<div class="filtros-container">
	<div class="filtros-desktop">
		<div class="buscador-item">
			<input
				type="text"
				placeholder="🔍 Buscar..."
				bind:value={filtros.texto}
				on:input={() => cambiarFiltro('texto', filtros.texto)}
				class="input-buscar"
			/>
		</div>

		<select 
			bind:value={filtros.tipo}
			on:change={() => cambiarFiltro('tipo', filtros.tipo)}
			class="filtro-select"
		>
			<option value="">📚 Cursos y Tutoriales</option>
			<option value="curso">🎓 Cursos</option>
			<option value="tutorial">🎵 Tutoriales</option>
		</select>

		<select 
			bind:value={filtros.nivel}
			on:change={() => cambiarFiltro('nivel', filtros.nivel)}
			class="filtro-select"
		>
			<option value="">🎯 Nivel</option>
			<option value="principiante">🌱 Principiante</option>
			<option value="intermedio">🔥 Intermedio</option>
			<option value="avanzado">⚡ Avanzado</option>
			<option value="profesional">👑 Profesional</option>
		</select>

		<select 
			bind:value={filtros.precio}
			on:change={() => cambiarFiltro('precio', filtros.precio)}
			class="filtro-select"
		>
			<option value="">💰 Precio</option>
			<option value="gratis">🆓 Gratis</option>
			<option value="pago">💎 Premium</option>
		</select>

		{#if hayFiltros}
			<button class="btn-limpiar" on:click={limpiarTodo}>
				🗑️ Limpiar
			</button>
		{/if}

		{#if hayFiltros}
			<div class="resultados-desktop">
				<span class="resultados-count">{totalResultados}</span>
				<span class="resultados-text">resultados</span>
			</div>
		{/if}
	</div>

	<div class="filtros-mobile">
		<div class="buscador-completo">
			<input
				type="text"
				placeholder="🔍 Buscar..."
				bind:value={filtros.texto}
				on:input={() => cambiarFiltro('texto', filtros.texto)}
				class="input-buscar"
			/>
		</div>

		<div class="filtros-fila">
			<select 
				bind:value={filtros.tipo}
				on:change={() => cambiarFiltro('tipo', filtros.tipo)}
				class="filtro-select-mobile"
			>
				<option value="">📚 Todos</option>
				<option value="curso">🎓 Cursos</option>
				<option value="tutorial">🎵 Tutoriales</option>
			</select>

			<select 
				bind:value={filtros.nivel}
				on:change={() => cambiarFiltro('nivel', filtros.nivel)}
				class="filtro-select-mobile"
			>
				<option value="">🎯 Nivel</option>
				<option value="principiante">🌱 Principiante</option>
				<option value="intermedio">🔥 Intermedio</option>
				<option value="avanzado">⚡ Avanzado</option>
				<option value="profesional">👑 Profesional</option>
			</select>

			<select 
				bind:value={filtros.precio}
				on:change={() => cambiarFiltro('precio', filtros.precio)}
				class="filtro-select-mobile"
			>
				<option value="">💰 Precio</option>
				<option value="gratis">🆓 Gratis</option>
				<option value="pago">💎 Premium</option>
			</select>
		</div>

		{#if hayFiltros}
			<div class="limpiar-mobile">
				<button class="btn-limpiar" on:click={limpiarTodo}>
					🗑️ Limpiar
				</button>
			</div>
		{/if}

		{#if hayFiltros}
			<div class="resultados-mobile">
				<span class="resultados-count">{totalResultados}</span>
				<span class="resultados-text">resultados</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.filtros-container {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 2rem;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		border: 1px solid #e5e7eb;
	}

	.filtros-desktop {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: nowrap;
	}

	.filtros-mobile {
		display: none;
	}

	.buscador-item {
		flex: 1;
		min-width: 300px;
	}

	.input-buscar {
		width: 100%;
		padding: 0.875rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 1rem;
		background: #f9fafb;
		transition: all 0.2s ease;
	}

	.input-buscar:focus {
		outline: none;
		border-color: #3b82f6;
		background: white;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.filtro-select {
		min-width: 140px;
		padding: 0.875rem 2.5rem 0.875rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		background: #f9fafb;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s ease;
		appearance: none;
		background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		background-size: 1em;
	}

	.filtro-select:focus {
		outline: none;
		border-color: #3b82f6;
		background-color: white;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.btn-limpiar {
		padding: 0.875rem 1.25rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.btn-limpiar:hover {
		background: #dc2626;
		transform: translateY(-1px);
	}

	.resultados-desktop {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin-left: 1rem;
		flex-shrink: 0;
	}

	.resultados-mobile {
		display: none;
	}

	.resultados-count {
		font-size: 1.25rem;
		font-weight: 700;
		color: #3b82f6;
	}

	.resultados-text {
		color: #6b7280;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.filtros-desktop {
			display: none;
		}

		.filtros-mobile {
			display: block;
		}

		.filtros-container {
			padding: 1rem;
		}

		.buscador-completo {
			margin-bottom: 1rem;
		}

		.filtros-fila {
			display: flex;
			gap: 0.5rem;
			margin-bottom: 1rem;
		}

		.filtro-select-mobile {
			flex: 1;
			padding: 0.75rem 2rem 0.75rem 0.75rem;
			border: 1px solid #d1d5db;
			border-radius: 8px;
			background: #f9fafb;
			font-size: 0.85rem;
			cursor: pointer;
			transition: all 0.2s ease;
			appearance: none;
			background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
			background-repeat: no-repeat;
			background-position: right 0.5rem center;
			background-size: 0.9em;
		}

		.filtro-select-mobile:focus {
			outline: none;
			border-color: #3b82f6;
			background-color: white;
			box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		}

		.limpiar-mobile {
			display: flex;
			justify-content: center;
			margin-bottom: 1rem;
		}

		.limpiar-mobile .btn-limpiar {
			padding: 0.75rem 1rem;
			font-size: 0.85rem;
		}

		.resultados-mobile {
			display: flex;
			align-items: baseline;
			gap: 0.5rem;
			justify-content: center;
			padding-top: 1rem;
			border-top: 1px solid #f3f4f6;
		}
	}
</style> 