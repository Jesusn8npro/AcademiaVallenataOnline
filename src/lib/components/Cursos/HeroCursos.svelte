<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';

	let visible = false;
	let currentBenefit = 0;

	const beneficios = [
		"🎮 Simulador Virtual Incluido - Sin Necesidad de Acordeón",
		"📚 +200 Horas de Contenido Premium Exclusivo",
		"🏆 Método Probado por +5,000 Estudiantes Exitosos",
		"📱 Acceso Total desde Cualquier Dispositivo 24/7",
		"👨‍🏫 Maestros Profesionales con Experiencia Real"
	];

	onMount(() => {
		visible = true;
		
		const interval = setInterval(() => {
			currentBenefit = (currentBenefit + 1) % beneficios.length;
		}, 4000);

		return () => clearInterval(interval);
	});

	function scrollToCatalogo() {
		const catalogo = document.getElementById('catalogo-section');
		if (catalogo) {
			catalogo.scrollIntoView({ behavior: 'smooth' });
		}
	}
</script>

<section class="hero-vendedor">
	<div class="hero-background">
		<div class="gradient-overlay"></div>
		<div class="geometric-pattern"></div>
	</div>

	<div class="hero-container">
		{#if visible}
			<div class="authority-badge" in:scale="{{ duration: 600, delay: 200 }}">
				<span class="badge-icon">🔥</span>
				<span class="badge-text">ACADEMIA #1 EN ACORDEÓN VALLENATO</span>
			</div>

			<h1 class="hero-title" in:fly="{{ y: 50, duration: 800, delay: 300 }}">
				DOMINA EL <span class="title-highlight">ACORDEÓN VALLENATO</span><br>
				<span class="title-secondary">DESDE CASA - SIN INSTRUMENTO</span>
			</h1>

			<div class="value-proposition" in:fly="{{ y: 30, duration: 800, delay: 500 }}">
				<p class="hero-subtitle">
					<strong>CURSOS COMPLETOS + TUTORIALES PREMIUM</strong> que te llevan del nivel 
					<span class="highlight-text">PRINCIPIANTE al PROFESIONAL</span> en tiempo récord
				</p>
			</div>

			<div class="rotating-benefit" in:fly="{{ y: 20, duration: 800, delay: 700 }}">
				{#key currentBenefit}
					<div class="benefit-card" in:fade="{{ duration: 400 }}">
						<div class="benefit-content">
							{beneficios[currentBenefit]}
						</div>
					</div>
				{/key}
			</div>

			<div class="stats-showcase" in:fly="{{ y: 20, duration: 800, delay: 900 }}">
				<div class="stat-block">
					<div class="stat-number">5,000+</div>
					<div class="stat-label">ESTUDIANTES<br>ACTIVOS</div>
				</div>
				<div class="stat-separator">|</div>
				<div class="stat-block">
					<div class="stat-number">200+</div>
					<div class="stat-label">HORAS DE<br>CONTENIDO</div>
				</div>
				<div class="stat-separator">|</div>
				<div class="stat-block">
					<div class="stat-number">4.9★</div>
					<div class="stat-label">CALIFICACIÓN<br>PROMEDIO</div>
				</div>
			</div>

			<div class="cta-section" in:fly="{{ y: 20, duration: 800, delay: 1100 }}">
				<button class="btn-mega-cta" on:click={scrollToCatalogo}>
					<span class="btn-text">VER CURSOS Y TUTORIALES AHORA</span>
					<div class="btn-arrow">→</div>
				</button>
			</div>

			<div class="scroll-indicator" in:fade="{{ delay: 2000 }}">
				<div class="scroll-text">DESCUBRE TODO NUESTRO CATÁLOGO</div>
				<div class="scroll-arrow-down">▼</div>
			</div>
		{/if}
	</div>
</section>

<style>
	.hero-vendedor {
		position: relative;
		min-height: 100vh;
		display: flex;
		align-items: center;
		overflow: hidden;
		background: #0a0a0a;
		width: 100%;
	}

	.hero-background {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.gradient-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			135deg,
			#1a1a2e 0%,
			#16213e 25%,
			#0f3460 50%,
			#e94560 75%,
			#f39c12 100%
		);
		opacity: 0.95;
	}

	.geometric-pattern {
		position: absolute;
		inset: 0;
		background-image: 
			linear-gradient(45deg, rgba(255,193,7,0.1) 25%, transparent 25%),
			linear-gradient(-45deg, rgba(233,69,96,0.1) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, rgba(255,193,7,0.1) 75%),
			linear-gradient(-45deg, transparent 75%, rgba(233,69,96,0.1) 75%);
		background-size: 60px 60px;
		background-position: 0 0, 0 30px, 30px -30px, -30px 0px;
		animation: patternMove 15s linear infinite;
	}

	@keyframes patternMove {
		0% { transform: translateX(0) translateY(0); }
		100% { transform: translateX(60px) translateY(60px); }
	}

	.hero-container {
		position: relative;
		z-index: 10;
		width: 100%;
		max-width: 100%;
		margin: 0;
		padding: 3rem 1rem;
		text-align: center;
		color: white;
	}

	.authority-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		background: linear-gradient(45deg, #e94560, #f39c12);
		padding: 1rem 2.5rem;
		border-radius: 50px;
		font-size: 1rem;
		font-weight: 900;
		margin-bottom: 2.5rem;
		box-shadow: 0 10px 40px rgba(233, 69, 96, 0.4);
		text-transform: uppercase;
		letter-spacing: 1px;
		border: 2px solid rgba(255, 255, 255, 0.2);
	}

	.badge-icon {
		font-size: 1.5rem;
	}

	.hero-title {
		font-size: clamp(3rem, 8vw, 6.5rem);
		font-weight: 900;
		line-height: 1.1;
		margin-bottom: 2rem;
		text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
		letter-spacing: -0.02em;
		text-transform: uppercase;
	}

	.title-highlight {
		background: linear-gradient(45deg, #f39c12, #ffd700, #ffed4e);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		position: relative;
		text-shadow: none;
	}

	.title-secondary {
		color: #e94560;
		font-size: 0.7em;
		display: block;
		margin-top: 0.5rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.value-proposition {
		max-width: 1200px;
		margin: 0 auto 3rem;
		padding: 0 2rem;
	}

	.hero-subtitle {
		font-size: clamp(1.3rem, 3vw, 1.8rem);
		line-height: 1.5;
		font-weight: 600;
		opacity: 0.95;
	}

	.highlight-text {
		color: #f39c12;
		font-weight: 800;
	}

	.rotating-benefit {
		margin-bottom: 3rem;
		min-height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 2rem;
	}

	.benefit-card {
		background: linear-gradient(135deg, rgba(233, 69, 96, 0.2), rgba(243, 156, 18, 0.2));
		backdrop-filter: blur(15px);
		border: 2px solid rgba(255, 255, 255, 0.2);
		padding: 1.5rem 3rem;
		border-radius: 20px;
		max-width: 1000px;
		width: 100%;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.benefit-content {
		font-size: clamp(1.1rem, 2.5vw, 1.4rem);
		font-weight: 700;
		text-align: center;
		color: #ffffff;
	}

	.stats-showcase {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 3rem;
		margin-bottom: 4rem;
		flex-wrap: wrap;
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
		padding: 0 2rem;
	}

	.stat-block {
		text-align: center;
		flex: 1;
		min-width: 150px;
	}

	.stat-number {
		font-size: clamp(3rem, 6vw, 4.5rem);
		font-weight: 900;
		color: #f39c12;
		text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
		line-height: 1;
		margin-bottom: 0.5rem;
	}

	.stat-label {
		font-size: clamp(0.9rem, 2vw, 1.1rem);
		font-weight: 700;
		color: #ffffff;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		line-height: 1.2;
	}

	.stat-separator {
		font-size: 3rem;
		color: rgba(255, 255, 255, 0.3);
		font-weight: 100;
	}

	.cta-section {
		margin-bottom: 4rem;
		padding: 0 2rem;
	}

	.btn-mega-cta {
		background: linear-gradient(45deg, #e94560, #f39c12);
		color: #ffffff;
		border: none;
		padding: 1.5rem 4rem;
		border-radius: 60px;
		font-size: clamp(1.2rem, 3vw, 1.6rem);
		font-weight: 900;
		cursor: pointer;
		transition: all 0.4s ease;
		display: inline-flex;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 15px 50px rgba(233, 69, 96, 0.5);
		text-transform: uppercase;
		letter-spacing: 1px;
		border: 3px solid rgba(255, 255, 255, 0.2);
		position: relative;
		overflow: hidden;
	}

	.btn-mega-cta::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
		transition: left 0.5s;
	}

	.btn-mega-cta:hover::before {
		left: 100%;
	}

	.btn-mega-cta:hover {
		transform: translateY(-5px) scale(1.05);
		box-shadow: 0 20px 60px rgba(233, 69, 96, 0.7);
		background: linear-gradient(45deg, #f39c12, #e94560);
	}

	.btn-arrow {
		font-size: 2rem;
		font-weight: 900;
		transition: transform 0.3s ease;
	}

	.btn-mega-cta:hover .btn-arrow {
		transform: translateX(10px);
	}

	.scroll-indicator {
		text-align: center;
		opacity: 0.8;
		animation: bounce 2s infinite;
		padding: 0 2rem;
	}

	.scroll-text {
		font-size: 1rem;
		margin-bottom: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.scroll-arrow-down {
		font-size: 1.5rem;
		opacity: 0.8;
		color: #f39c12;
	}

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
		40% { transform: translateY(-15px); }
		60% { transform: translateY(-8px); }
	}

	@media (max-width: 1024px) {
		.stats-showcase {
			gap: 2rem;
		}

		.stat-separator {
			display: none;
		}
	}

	@media (max-width: 768px) {
		.authority-badge {
			padding: 0.75rem 1.5rem;
			font-size: 0.9rem;
		}

		.stats-showcase {
			flex-direction: column;
			gap: 2rem;
		}

		.btn-mega-cta {
			padding: 1.25rem 2.5rem;
			font-size: 1.2rem;
		}

		.benefit-card {
			padding: 1.25rem 2rem;
		}
	}

	@media (max-width: 480px) {
		.hero-container {
			padding: 1.5rem 0.5rem;
		}

		.rotating-benefit {
			margin-bottom: 2rem;
			padding: 0 1rem;
		}

		.benefit-card {
			padding: 1rem 1.5rem;
		}

		.value-proposition,
		.stats-showcase,
		.cta-section,
		.scroll-indicator {
			padding: 0 1rem;
		}
	}
</style> 