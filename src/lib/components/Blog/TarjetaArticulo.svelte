<script lang="ts">
	import { goto } from '$app/navigation';

	// --- PROPIEDADES ---
	export let titulo = 'Título del artículo';
	export let resumen = 'Resumen breve del artículo.';
	export let autor = '';
	export let creado_en = '';
	export let imagen_url = '';
	export let slug = '';
	export let categoria = 'General';
	export let tiempo_lectura = 5; // en minutos
	export let lecturas = 0;

	// --- ESTADO INTERNO ---
	let imagenCargada = false;

	// --- LÓGICA DERIVADA ---
	// Autor por defecto: Jesús González.
	$: autorFinal = autor || 'Jesús González';

	// Formato de fecha.
	$: fechaFormateada = creado_en
		? new Date(creado_en).toLocaleDateString('es-ES', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})
		: '';

	// Resumen optimizado.
	$: resumenOptimizado =
		resumen && resumen.length > 120
			? resumen.slice(0, 120).replace(/\s+\S*$/, '...')
			: resumen;

	// Imagen de fallback.
	$: imagenFinal =
		imagen_url ||
		'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80';
	
	$: lecturasFormateadas = lecturas > 1000 ? `${(lecturas / 1000).toFixed(1)}k` : lecturas;

	// --- FUNCIONES ---
	function irAlArticulo() {
		if (slug) goto(`/blog/${slug}`);
	}

	function manejarErrorImagen(event: Event) {
		(event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80';
	}
</script>

<article
	class="tarjeta-articulo"
	on:click={irAlArticulo}
	on:keydown={(e) => e.key === 'Enter' && irAlArticulo()}
	tabindex="0"
	role="button"
	aria-label={`Leer artículo: ${titulo}`}
>
	<header class="cabecera-tarjeta">
		<img
			src={imagenFinal}
			alt={`Imagen para ${titulo}`}
			class="imagen-fondo"
			class:cargada={imagenCargada}
			on:load={() => (imagenCargada = true)}
			on:error={manejarErrorImagen}
			loading="lazy"
		/>
		<div class="overlay-gradiente" />
		<div class="info-superpuesta">
			<span class="etiqueta-categoria">
				<span class="icono-etiqueta">🏷️</span>
				{categoria}
			</span>
			<span class="etiqueta-lectura">
				<span class="icono-etiqueta">⏱️</span>
				{tiempo_lectura} min de lectura
			</span>
		</div>
	</header>

	<div class="cuerpo-tarjeta">
		<h2 class="titulo">{titulo}</h2>
		
		<div class="info-autor">
			<div class="avatar">JG</div>
			<div class="info-texto">
				<span class="nombre-autor">Escrito por {autorFinal}</span>
				<span class="fecha">{fechaFormateada}</span>
			</div>
		</div>

		<p class="resumen">{resumenOptimizado}</p>
	</div>

	<footer class="pie-tarjeta">
		<div class="estadisticas">
			{#if lecturas > 0}
			<span class="stat">
				<span class="icono-stat">👁️</span>
				{lecturasFormateadas} Vistas
			</span>
			{/if}
			<span class="stat">
				<span class="icono-stat">⭐</span>
				4.8 Rating
			</span>
		</div>
		<button
			class="boton-accion"
			on:click|stopPropagation={irAlArticulo}
			aria-label="Leer este artículo"
		>
			<span>Leer Artículo</span>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
		</button>
	</footer>
</article>

<style>
	:root {
		--color-primario: #3b82f6;
		--color-secundario: #8b5cf6;
		--color-texto-principal: #1e293b;
		--color-texto-secundario: #64748b;
		--sombra-tarjeta: 0 10px 35px rgba(0, 0, 0, 0.05), 0 2px 10px rgba(0, 0, 0, 0.05);
		--sombra-tarjeta-hover: 0 20px 45px rgba(59, 130, 246, 0.15), 0 8px 15px rgba(139, 92, 246, 0.1);
	}

	.tarjeta-articulo {
		display: flex;
		flex-direction: column;
		background: #ffffff;
		border-radius: 24px;
		box-shadow: var(--sombra-tarjeta);
		border: 1px solid #f1f5f9;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		position: relative;
	}

	.tarjeta-articulo:hover {
		transform: translateY(-10px) scale(1.02);
		box-shadow: var(--sombra-tarjeta-hover);
	}

	/* --- Cabecera --- */
	.cabecera-tarjeta {
		position: relative;
		height: 210px;
		overflow: hidden;
	}

	.imagen-fondo {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}
	.tarjeta-articulo:hover .imagen-fondo {
		transform: scale(1.1);
	}
	.imagen-fondo.cargada {
		animation: aparecerImagen 0.8s ease-out forwards;
	}
	@keyframes aparecerImagen {
		from { opacity: 0; filter: blur(10px); }
		to { opacity: 1; filter: blur(0); }
	}

	.overlay-gradiente {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 60%);
	}

	.info-superpuesta {
		position: absolute;
		top: 1rem; left: 1rem; right: 1rem;
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		font-weight: 600;
		color: white;
	}

	.etiqueta-categoria, .etiqueta-lectura {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 0.8rem;
		border-radius: 99px;
		background: rgba(20, 20, 20, 0.5);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		text-shadow: 0 1px 2px rgba(0,0,0,0.2);
	}

	/* --- Cuerpo --- */
	.cuerpo-tarjeta {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		gap: 1rem;
	}

	.titulo {
		font-size: 1.3rem;
		font-weight: 800;
		color: var(--color-texto-principal);
		line-height: 1.3;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		transition: color 0.3s ease;
	}
	.tarjeta-articulo:hover .titulo {
		color: var(--color-primario);
	}

	.info-autor {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.avatar {
		width: 40px; height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--color-primario), var(--color-secundario));
		color: white;
		font-weight: 700;
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}

	.info-texto {
		display: flex;
		flex-direction: column;
	}
	.nombre-autor {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--color-texto-principal);
	}
	.fecha {
		font-size: 0.85rem;
		color: var(--color-texto-secundario);
	}

	.resumen {
		font-size: 1rem;
		color: var(--color-texto-secundario);
		line-height: 1.6;
		margin: 0;
		flex-grow: 1;
	}
	
	/* --- Pie de Tarjeta --- */
	.pie-tarjeta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem 1.5rem;
		border-top: 1px solid #f1f5f9;
	}

	.estadisticas {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.85rem;
		color: var(--color-texto-secundario);
		font-weight: 500;
	}
	.stat {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.stat .icono-stat {
		filter: grayscale(1);
		opacity: 0.7;
	}

	.boton-accion {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: var(--color-primario);
		color: white;
		font-weight: 700;
		font-size: 0.9rem;
		border: none;
		border-radius: 12px;
		padding: 0.7rem 1.2rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.boton-accion:hover {
		background: var(--color-secundario);
		box-shadow: 0 8px 20px rgba(139, 92, 246, 0.25);
		transform: translateY(-2px);
	}
	.boton-accion svg {
		transition: transform 0.3s ease;
	}
	.boton-accion:hover svg {
		transform: translateX(3px);
	}

	/* --- Accesibilidad --- */
	.tarjeta-articulo:focus-visible {
		outline: 3px solid var(--color-primario);
		outline-offset: 4px;
	}

	@media (prefers-reduced-motion: reduce) {
		.tarjeta-articulo, .imagen-fondo, .boton-accion, .boton-accion svg {
			animation: none;
			transition: none;
		}
		.tarjeta-articulo:hover {
			transform: none;
		}
	}
</style>
