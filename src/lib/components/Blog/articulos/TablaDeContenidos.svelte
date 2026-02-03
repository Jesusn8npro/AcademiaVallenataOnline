<script lang="ts">
	import type { EncabezadoArticulo } from '$lib/utils/seoUtils';

	export let headers: EncabezadoArticulo[] = [];
	
	// Estados para los botones de TOC
	let tocExpandido = true;
	let tocCompletoExpandido = false;
	
	// Número de elementos a mostrar inicialmente
	const MAX_TOC_INICIAL = 3;

	// Funciones para manejar la TOC
	function alternarToc() {
		tocExpandido = !tocExpandido;
		if (!tocExpandido) {
			tocCompletoExpandido = false; // Reset cuando se cierra
		}
	}
	
	function expandirTocCompleto() {
		tocCompletoExpandido = true;
	}

	// Función para el scroll suave, manteniendo el HTML limpio
	function irASeccion(id: string) {
		const elemento = document.getElementById(id);
		if (elemento) {
			elemento.scrollIntoView({ behavior: 'smooth' });
		}
	}
</script>

{#if headers.length >= 2}
	<div class="contenedor-toc">
		<!-- Botón para expandir/colapsar TOC -->
		<button class="boton-toc-toggle" on:click={alternarToc}>
			<span class="icono-toc">📑</span>
			<span class="texto-toc">Tabla de Contenidos</span>
			<span class="flecha-toc" class:rotada={tocExpandido}>▼</span>
		</button>
		
		<!-- Tabla de contenidos colapsable -->
		{#if tocExpandido}
			<nav class="toc toc-expandida">
				<div class="toc-desc">Navega fácilmente por el contenido de este artículo 🎵</div>
				<ul>
					{#each (tocCompletoExpandido ? headers : headers.slice(0, MAX_TOC_INICIAL)) as h, index}
						<li class={h.level === 'H2' ? 'toc-h2' : 'toc-h3'} style="--delay: {index * 0.1}s">
							<a href={'#' + h.id} on:click|preventDefault={() => irASeccion(h.id)}>
								{h.text}
							</a>
						</li>
					{/each}
				</ul>
				
				<!-- Botón para expandir toda la TOC si hay más elementos -->
				{#if !tocCompletoExpandido && headers.length > MAX_TOC_INICIAL}
					<div class="toc-expandir-todo">
						<button class="boton-expandir-toc" on:click={expandirTocCompleto}>
							<span class="icono-expandir">📋</span>
							<span class="texto-expandir">Mostrar todos los temas</span>
							<span class="flecha-expandir-toc">▼</span>
						</button>
					</div>
				{/if}
			</nav>
		{/if}
	</div>
{/if}

<style>
/* === CONTENEDOR TOC COLAPSABLE === */
.contenedor-toc {
	margin: 28px 0 38px 0;
}

.boton-toc-toggle {
	width: 100%;
	background: linear-gradient(135deg, #ff6b35, #f7931e);
	color: white;
	border: none;
	border-radius: 16px;
	padding: 18px 25px;
	font-size: 1.1rem;
	font-weight: 700;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	box-shadow: 0 6px 20px rgba(255, 107, 53, 0.25);
	position: relative;
	overflow: hidden;
}

.boton-toc-toggle::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 4px;
	background: linear-gradient(90deg, #ffd700, #ffed4e);
}

.boton-toc-toggle:hover {
	transform: translateY(-2px) scale(1.02);
	box-shadow: 0 10px 30px rgba(255, 107, 53, 0.35);
}

.icono-toc {
	font-size: 1.3rem;
}

.texto-toc {
	flex: 1;
	text-align: left;
	margin-left: 10px;
}

.flecha-toc {
	font-size: 1rem;
	transition: transform 0.3s ease;
	margin-left: 10px;
}

.flecha-toc.rotada {
	transform: rotate(180deg);
}

.toc {
	background: linear-gradient(135deg, #f6fff1, #e8f5e8);
	border: 2px solid #ff6b35;
	border-radius: 0 0 16px 16px;
	border-top: none;
	box-shadow: 0 8px 25px rgba(255, 107, 53, 0.15);
	padding: 0;
	margin: 0;
	max-width: 100%;
	font-size: 1.08rem;
	color: #215a2b;
	overflow: hidden;
}

.toc-expandida {
	animation: expandirToc 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes expandirToc {
	0% { 
		opacity: 0; 
		max-height: 0;
		transform: translateY(-20px);
	}
	100% { 
		opacity: 1; 
		max-height: 2000px;
		transform: translateY(0);
	}
}

/* === BOTÓN EXPANDIR TOC COMPLETA === */
.toc-expandir-todo {
	padding: 10px 20px 12px 20px;
	text-align: center;
	border-top: 1px solid rgba(255, 107, 53, 0.1);
	background: linear-gradient(135deg, rgba(255, 215, 0, 0.05), rgba(247, 147, 30, 0.05));
}

.boton-expandir-toc {
	background: linear-gradient(135deg, #ffd700, #ffed4e);
	color: #2d5a3d;
	border: none;
	border-radius: 25px;
	padding: 12px 25px;
	font-size: 1rem;
	font-weight: 700;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
	position: relative;
	overflow: hidden;
}

.boton-expandir-toc:hover {
	transform: translateY(-2px) scale(1.05);
	box-shadow: 0 8px 25px rgba(255, 215, 0, 0.5);
}

.boton-expandir-toc::before {
	content: '';
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
	transition: left 0.5s ease;
}

.boton-expandir-toc:hover::before {
	left: 100%;
}

.flecha-expandir-toc {
	transition: transform 0.3s ease;
	font-size: 0.8rem;
}

.boton-expandir-toc:hover .flecha-expandir-toc {
	transform: translateY(2px);
}

.toc-desc {
	font-size: 1.01rem;
	color: #548d5b;
	margin: 20px 25px 15px 25px;
	font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
	letter-spacing: 0.01em;
	font-weight: 500;
}

.toc ul {
	list-style: none;
	padding: 0 20px 15px 20px;
	margin: 0;
}

.toc li {
	margin: 0;
	padding: 0;
	border-bottom: 1px solid rgba(255, 107, 53, 0.1);
	transition: all 0.3s ease;
	position: relative;
	min-height: 32px;
	display: flex;
	align-items: center;
	animation: aparecerItem 0.4s ease-out both;
	animation-delay: var(--delay);
}

@keyframes aparecerItem {
	0% {
		opacity: 0;
		transform: translateX(-20px);
	}
	100% {
		opacity: 1;
		transform: translateX(0);
	}
}

.toc li:last-child {
	border-bottom: none;
}

.toc li::before {
	content: '';
	display: inline-block;
	width: 10px;
	height: 10px;
	background: linear-gradient(135deg, #ff6b35, #f7931e);
	border-radius: 50%;
	margin-right: 12px;
	box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	flex-shrink: 0;
}

.toc li:hover::before {
	transform: scale(1.3);
	box-shadow: 0 4px 15px rgba(255, 107, 53, 0.5);
}

.toc-h3::before {
	margin-left: 20px;
	width: 7px;
	height: 7px;
	background: linear-gradient(135deg, #ffd700, #ffed4e);
}

.toc a {
	display: block;
	width: 100%;
	padding: 8px 10px;
	color: #2d5a3d;
	text-decoration: none;
	border-radius: 10px;
	font-weight: 600;
	font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
	transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	outline: none;
	position: relative;
	z-index: 1;
	margin: 0;
}

.toc a:hover, .toc a:focus {
	background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(247, 147, 30, 0.1));
	color: #ff6b35;
	transform: translateX(5px);
	box-shadow: 0 4px 15px rgba(255, 107, 53, 0.15);
	border-left: 3px solid #ff6b35;
}

.toc-h2 > a {
	font-size: 1rem;
	font-weight: 700;
}

.toc-h3 > a {
	font-size: 0.9rem;
	font-weight: 500;
	margin-left: 20px;
}

/* === RESPONSIVE MOBILE === */
@media (max-width: 700px) {
	.contenedor-toc {
		margin: 20px 0 25px 0;
	}

	.boton-toc-toggle {
		padding: 15px 20px;
		font-size: 1rem;
		border-radius: 12px;
	}

	.toc {
		border-radius: 0 0 12px 12px;
		font-size: 0.95rem;
	}

	.toc-desc {
		margin: 15px 20px 12px 20px;
		font-size: 0.9rem;
	}

	.toc ul {
		padding: 0 15px 10px 15px;
	}

	.toc li {
		min-height: 30px;
	}

	.toc a {
		padding: 6px 8px;
		font-size: 0.85rem;
	}

	.toc-h2 > a {
		font-size: 0.9rem;
	}

	.toc-h3 > a {
		font-size: 0.8rem;
		margin-left: 15px;
	}

	.toc-h3::before {
		margin-left: 15px;
	}

	.toc-expandir-todo {
		padding: 10px 20px 12px 20px;
	}

	.boton-expandir-toc {
		padding: 10px 20px;
		font-size: 0.9rem;
	}
}
</style> 