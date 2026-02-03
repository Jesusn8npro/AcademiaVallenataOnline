<script lang="ts">
	import { goto } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import { generateSlug } from '$lib/utilidades/utilidadesSlug';

	export let items: any[] = [];
	export let cargando = false;
	export let error = '';
	export let paginaActual = 1;
	export let itemsPorPagina = 12;
	export let totalItems = 0;

	$: totalPaginas = Math.ceil(totalItems / itemsPorPagina);
	$: inicioRango = (paginaActual - 1) * itemsPorPagina + 1;
	$: finRango = Math.min(paginaActual * itemsPorPagina, totalItems);

	function verContenido(item: any) {
		const slug = item.slug || generateSlug(item.titulo);
		goto(item.tipo === 'curso' ? `/cursos/${slug}` : `/tutoriales/${slug}`);
	}

	function cambiarPagina(nuevaPagina: number) {
		if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
			paginaActual = nuevaPagina;
			document.getElementById('grid-cursos')?.scrollIntoView({ behavior: 'smooth' });
		}
	}

	function acortarTexto(texto: string, maxLength = 100) {
		if (!texto) return '';
		return texto.length > maxLength ? texto.slice(0, maxLength) + '...' : texto;
	}

	function calcularDescuento(precioNormal: number, precioDescuento: number) {
		if (!precioNormal || !precioDescuento) return 0;
		return Math.round(((precioNormal - precioDescuento) / precioNormal) * 100);
	}

	function formatearPrecio(precio: number) {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0
		}).format(precio);
	}

	function generarPaginas() {
		const paginas = [];
		const maxPaginas = 5;
		
		let inicio = Math.max(1, paginaActual - Math.floor(maxPaginas / 2));
		let fin = Math.min(totalPaginas, inicio + maxPaginas - 1);
		
		if (fin - inicio < maxPaginas - 1) {
			inicio = Math.max(1, fin - maxPaginas + 1);
		}
		
		for (let i = inicio; i <= fin; i++) {
			paginas.push(i);
		}
		
		return paginas;
	}

	$: paginasVisibles = generarPaginas();
</script>

<div id="grid-cursos" class="grid-container">
	{#if cargando}
		<div class="loading-container" in:fly="{{ y: 20, duration: 600 }}">
			<div class="loading-grid">
				{#each Array(8) as _}
					<div class="skeleton-card">
						<div class="skeleton-image"></div>
						<div class="skeleton-content">
							<div class="skeleton-line skeleton-title"></div>
							<div class="skeleton-line skeleton-subtitle"></div>
							<div class="skeleton-line skeleton-price"></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if error}
		<div class="error-container" in:fly="{{ y: 20, duration: 600 }}">
			<div class="error-content">
				<svg class="error-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<circle cx="12" cy="12" r="10"/>
					<line x1="15" y1="9" x2="9" y2="15"/>
					<line x1="9" y1="9" x2="15" y2="15"/>
				</svg>
				<h3>¡Oops! Algo salió mal</h3>
				<p>{error}</p>
				<button class="btn-retry" on:click={() => window.location.reload()}>
					Intentar de Nuevo
				</button>
			</div>
		</div>
	{:else if items.length === 0}
		<div class="empty-container" in:fly="{{ y: 20, duration: 600 }}">
			<div class="empty-content">
				<svg class="empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<circle cx="11" cy="11" r="8"/>
					<path d="m21 21-4.35-4.35"/>
				</svg>
				<h3>No encontramos resultados</h3>
				<p>Intenta ajustar tus filtros o buscar algo diferente</p>
			</div>
		</div>
	{:else}
		<div class="cursos-grid">
			{#each items as item, i (item.id)}
				<div 
					class="curso-card"
					in:fly="{{ y: 30, duration: 500, delay: i * 50 }}"
					on:click={() => verContenido(item)}
					role="button"
					tabindex="0"
					on:keydown={(e) => e.key === 'Enter' && verContenido(item)}
				>
					<div class="curso-imagen-container">
						<img 
							src={item.imagen_url || '/images/default-curso.jpg'} 
							alt={item.titulo}
							class="curso-imagen"
							loading="lazy"
						/>
						
						<div class="tipo-badge {item.tipo}">
							{item.tipo === 'curso' ? '🎓 CURSO' : '🎵 TUTORIAL'}
						</div>
						
											{#if item.precio_rebajado && item.precio_normal}
						{@const descuento = calcularDescuento(item.precio_normal, item.precio_rebajado)}
							{#if descuento > 0}
								<div class="descuento-badge">-{descuento}%</div>
							{/if}
						{/if}
						
						<div class="imagen-overlay">
							<button class="btn-ver-curso">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<polygon points="5,3 19,12 5,21"/>
								</svg>
								{item.tipo === 'curso' ? 'Ver Curso' : 'Ver Tutorial'}
							</button>
						</div>
					</div>
					
					<div class="curso-content">
						<div class="curso-header">
							<h3 class="curso-titulo">{item.titulo}</h3>
							{#if item.rating || item.estudiantes}
								<div class="curso-meta">
									{#if item.rating}<span class="rating">⭐ {item.rating}</span>{/if}
									{#if item.estudiantes}<span class="estudiantes">👥 {item.estudiantes}</span>{/if}
								</div>
							{/if}
						</div>
						
						<p class="curso-descripcion">
							{acortarTexto(item.descripcion || 'Contenido educativo de alta calidad para aprender acordeón vallenato')}
						</p>
						
						{#if item.nivel}
							<div class="nivel-container">
								<span class="nivel-badge nivel-{item.nivel}">
									{#if item.nivel === 'principiante'}🌱 Principiante
									{:else if item.nivel === 'intermedio'}🔥 Intermedio
									{:else if item.nivel === 'avanzado'}⚡ Avanzado
									{:else if item.nivel === 'profesional'}👑 Profesional
									{:else}📚 {item.nivel}{/if}
								</span>
							</div>
						{/if}
						
						<div class="curso-footer">
							<div class="precio-container">
								{#if item.precio_normal === 0 || item.precio_normal === null}
									<span class="precio-gratis">¡GRATIS!</span>
								{:else if item.precio_rebajado && item.precio_rebajado < item.precio_normal}
									<span class="precio-original">{formatearPrecio(item.precio_normal)}</span>
									<span class="precio-actual">{formatearPrecio(item.precio_rebajado)}</span>
								{:else}
									<span class="precio-actual">{formatearPrecio(item.precio_normal)}</span>
								{/if}
							</div>
							
							<button class="btn-acceder {item.tipo}">
								{item.precio_normal === 0 || item.precio_normal === null ? 'Acceder Gratis' : 'Comenzar Ahora'}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
		
		{#if totalPaginas > 1}
			<div class="paginacion-container" in:fly="{{ y: 20, duration: 600, delay: 300 }}">
				<div class="paginacion-info">
					<span>Mostrando {inicioRango}-{finRango} de {totalItems} resultados</span>
				</div>
				
				<div class="paginacion">
					<button 
						class="paginacion-btn {paginaActual === 1 ? 'disabled' : ''}"
						on:click={() => cambiarPagina(paginaActual - 1)}
						disabled={paginaActual === 1}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<polyline points="15,18 9,12 15,6"/>
						</svg>
						Anterior
					</button>
					
					{#if paginasVisibles[0] > 1}
						<button class="paginacion-numero" on:click={() => cambiarPagina(1)}>1</button>
						{#if paginasVisibles[0] > 2}
							<span class="paginacion-dots">...</span>
						{/if}
					{/if}
					
					{#each paginasVisibles as pagina}
						<button 
							class="paginacion-numero {pagina === paginaActual ? 'activa' : ''}"
							on:click={() => cambiarPagina(pagina)}
						>
							{pagina}
						</button>
					{/each}
					
					{#if paginasVisibles[paginasVisibles.length - 1] < totalPaginas}
						{#if paginasVisibles[paginasVisibles.length - 1] < totalPaginas - 1}
							<span class="paginacion-dots">...</span>
						{/if}
						<button class="paginacion-numero" on:click={() => cambiarPagina(totalPaginas)}>{totalPaginas}</button>
					{/if}
					
					<button 
						class="paginacion-btn {paginaActual === totalPaginas ? 'disabled' : ''}"
						on:click={() => cambiarPagina(paginaActual + 1)}
						disabled={paginaActual === totalPaginas}
					>
						Siguiente
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<polyline points="9,18 15,12 9,6"/>
						</svg>
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.grid-container {
		min-height: 400px;
	}

	.loading-container, .error-container, .empty-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 400px;
		padding: 2rem;
	}

	.loading-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
		width: 100%;
		max-width: 1200px;
	}

	.skeleton-card {
		background: white;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.skeleton-image {
		height: 200px;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
	}

	.skeleton-content {
		padding: 1.5rem;
	}

	.skeleton-line {
		height: 12px;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
		border-radius: 6px;
		margin-bottom: 0.75rem;
	}

	.skeleton-title { height: 16px; width: 80%; }
	.skeleton-subtitle { height: 12px; width: 60%; }
	.skeleton-price { height: 14px; width: 40%; }

	@keyframes loading {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.error-content, .empty-content {
		text-align: center;
		max-width: 400px;
	}

	.error-icon, .empty-icon {
		color: #6b7280;
		margin: 0 auto 1rem;
	}

	.error-content h3, .empty-content h3 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.error-content p, .empty-content p {
		color: #6b7280;
		margin-bottom: 1.5rem;
	}

	.btn-retry {
		background: linear-gradient(45deg, #667eea, #764ba2);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-retry:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
	}

	.cursos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.curso-card {
		background: white;
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
		cursor: pointer;
		border: 1px solid rgba(0, 0, 0, 0.05);
	}

	.curso-card:hover {
		transform: translateY(-8px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
	}

	.curso-imagen-container {
		position: relative;
		height: 220px;
		overflow: hidden;
	}

	.curso-imagen {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.curso-card:hover .curso-imagen {
		transform: scale(1.05);
	}

	.tipo-badge {
		position: absolute;
		top: 1rem;
		left: 1rem;
		padding: 0.5rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 700;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.tipo-badge.curso {
		background: rgba(34, 197, 94, 0.9);
		color: white;
	}

	.tipo-badge.tutorial {
		background: rgba(59, 130, 246, 0.9);
		color: white;
	}

	.descuento-badge {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: #ef4444;
		color: white;
		padding: 0.5rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 700;
		box-shadow: 0 2px 10px rgba(239, 68, 68, 0.3);
	}

	.imagen-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.curso-card:hover .imagen-overlay {
		opacity: 1;
	}

	.btn-ver-curso {
		background: rgba(255, 255, 255, 0.95);
		color: #1f2937;
		border: none;
		padding: 1rem 1.5rem;
		border-radius: 50px;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s ease;
		transform: translateY(10px);
	}

	.curso-card:hover .btn-ver-curso {
		transform: translateY(0);
	}

	.btn-ver-curso:hover {
		background: white;
		transform: scale(1.05);
	}

	.curso-content {
		padding: 1.5rem;
	}

	.curso-header {
		margin-bottom: 1rem;
	}

	.curso-titulo {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.5rem;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.curso-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.85rem;
		color: #6b7280;
	}

	.rating, .estudiantes {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.curso-descripcion {
		color: #6b7280;
		line-height: 1.5;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.nivel-container {
		margin-bottom: 1rem;
	}

	.nivel-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.nivel-principiante { background: #dcfce7; color: #166534; }
	.nivel-intermedio { background: #fef3c7; color: #92400e; }
	.nivel-avanzado { background: #fecaca; color: #991b1b; }
	.nivel-profesional { background: #e0e7ff; color: #3730a3; }

	.curso-footer {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #f3f4f6;
	}

	.precio-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.precio-gratis {
		font-size: 1.2rem;
		font-weight: 800;
		color: #10b981;
		background: rgba(16, 185, 129, 0.1);
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		width: 100%;
		text-align: center;
	}

	.precio-original {
		text-decoration: line-through;
		color: #9ca3af;
		font-size: 0.8rem;
		font-weight: 500;
		white-space: nowrap;
		opacity: 0.7;
	}

	.precio-original::before {
		content: "Antes: ";
		font-weight: 400;
		color: #6b7280;
	}

	.precio-actual {
		font-size: 1.4rem;
		font-weight: 900;
		color: #ef4444;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		justify-content: flex-end;
	}

	.precio-actual::after {
		content: "¡AHORA!";
		font-size: 0.65rem;
		background: linear-gradient(45deg, #ef4444, #dc2626);
		color: white;
		padding: 0.2rem 0.6rem;
		border-radius: 15px;
		font-weight: 700;
		animation: pulse 2s infinite;
		box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
	}

	@keyframes pulse {
		0%, 100% { 
			transform: scale(1);
			box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
		}
		50% { 
			transform: scale(1.08);
			box-shadow: 0 4px 15px rgba(239, 68, 68, 0.6);
		}
	}

	.btn-acceder {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 12px;
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
		color: white;
		width: 100%;
		text-align: center;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.btn-acceder.curso {
		background: linear-gradient(45deg, #22c55e, #16a34a);
	}

	.btn-acceder.tutorial {
		background: linear-gradient(45deg, #3b82f6, #2563eb);
	}

	.btn-acceder:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
		filter: brightness(1.1);
	}

	.paginacion-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-top: 2rem;
	}

	.paginacion-info {
		color: #6b7280;
		font-size: 0.9rem;
	}

	.paginacion {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.paginacion-btn, .paginacion-numero {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		background: white;
		color: #374151;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.paginacion-btn:hover:not(.disabled), .paginacion-numero:hover:not(.activa) {
		background: #f3f4f6;
		border-color: #9ca3af;
	}

	.paginacion-numero.activa {
		background: linear-gradient(45deg, #667eea, #764ba2);
		color: white;
		border-color: #667eea;
	}

	.paginacion-btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.paginacion-dots {
		color: #9ca3af;
		padding: 0 0.5rem;
	}

	@media (max-width: 768px) {
		.cursos-grid {
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: 1.5rem;
		}

		.curso-content {
			padding: 1rem;
		}

		.curso-titulo {
			font-size: 1.1rem;
		}

		.paginacion {
			gap: 0.25rem;
		}

		.paginacion-btn, .paginacion-numero {
			padding: 0.5rem;
			font-size: 0.8rem;
		}
	}

	@media (max-width: 480px) {
		.cursos-grid {
			grid-template-columns: 1fr;
		}

		.curso-footer {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.btn-acceder {
			width: 100%;
			padding: 0.75rem;
		}
	}
</style> 