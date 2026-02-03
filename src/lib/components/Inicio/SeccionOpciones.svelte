<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { goto } from '$app/navigation';

  let visible = false;

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visible = true;
        }
      });
    });

    const section = document.querySelector('.seccion-opciones');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  });

  const opciones = [
    {
      titulo: 'Cursos de Acordeón',
      descripcion: 'Programas completos desde principiante hasta experto profesional',
      imagen: '/images/Clusters (Por donde empezart)/Cursos-De-Acordeon.jpg',
      icono: '📚',
      color: 'from-blue-500 to-purple-600',
      beneficios: ['Metodología estructurada probada', 'Progreso garantizado paso a paso', 'Certificados oficiales de logro'],
      precio: 'Desde $189.000',
      destacado: false,
      action: () => goto('/cursos')
    },
    {
      titulo: 'Simulador Gaming de Acordeón',
      descripcion: '¡EL ÚNICO videojuego educativo de acordeón en el mundo!',
      imagen: '/Acordeon PRO MAX.png',
      icono: '🎮',
      color: 'from-purple-600 to-pink-600',
      beneficios: ['Experiencia gaming única', 'Ranking competitivo global', 'Aprende jugando y divirtiéndote'],
      precio: '¡GRATIS!',
      destacado: true,
      etiqueta: '🚀 INNOVACIÓN MUNDIAL',
      action: () => goto('/simulador-gaming')
    },
    {
      titulo: 'Tutoriales Específicos',
      descripcion: 'Lecciones puntuales para dominar técnicas específicas',
      imagen: '/images/Clusters (Por donde empezart)/Tutoriales-De-Acordeon.jpg',
      icono: '🎥',
      color: 'from-green-500 to-teal-600',
      beneficios: ['Técnicas específicas probadas', 'Videos HD profesionales', 'Práctica enfocada y efectiva'],
      precio: 'Desde $45.000',
      destacado: false,
      action: () => goto('/tutoriales')
    },
    {
      titulo: 'Comunidad Exclusiva VIP',
      descripcion: '5,000+ acordeonistas compartiendo, aprendiendo y creciendo juntos',
      imagen: '/images/Home/Comunidad-academia-vallenata-online.jpg',
      icono: '👥',
      color: 'from-orange-500 to-red-600',
      beneficios: ['Red de 5,000+ músicos', 'Feedback y apoyo constante', 'Eventos exclusivos en vivo'],
      precio: 'INCLUIDO',
      destacado: true,
      etiqueta: '💎 COMUNIDAD #1',
      action: () => goto('/comunidad')
    },
    {
      titulo: 'Paquetes Temáticos',
      descripcion: 'Contenido especializado agrupado por estilos y géneros',
      imagen: '/images/Clusters (Por donde empezart)/Paquetes-de-tutoriales.jpg',
      icono: '📦',
      color: 'from-indigo-500 to-purple-600',
      beneficios: ['Contenido perfectamente organizado', 'Mejor precio conjunto', 'Acceso completo inmediato'],
      precio: 'Desde $129.000',
      destacado: false,
      action: () => goto('/paquetes')
    },
    {
      titulo: 'Clases Personalizadas VIP',
      descripcion: 'Atención directa 1 a 1 con el Maestro Jesús González',
      imagen: '/images/Clusters (Por donde empezart)/Clases-Personalizadas!.jpg',
      icono: '👨‍🏫',
      color: 'from-yellow-500 to-orange-600',
      beneficios: ['Atención personal del maestro', 'Horarios 100% flexibles', 'Progreso acelerado garantizado'],
      precio: 'Desde $85.000/hora',
      destacado: false,
      action: () => goto('/contacto')
    }
  ];
</script>

<section class="seccion-opciones" id="opciones">
  <div class="contenedor">
    {#if visible}
      <div in:fly="{{ y: 50, duration: 1000, easing: quintOut }}" class="header-seccion">
        <div class="badge-seccion">🎯 ELIGE TU CAMINO AL ÉXITO</div>
        <h2 class="titulo-seccion">
          6 Formas <span class="texto-destacado">Poderosas</span> de 
          <br><span class="texto-principal">Dominar el Acordeón Vallenato</span>
        </h2>
        <p class="descripcion-seccion">
          No importa tu nivel, experiencia o disponibilidad de tiempo. 
          <br><strong>Tenemos la opción PERFECTA para transformarte en un maestro del acordeón.</strong>
          <br>🚀 <span class="texto-urgencia">¡Más de 5,000 estudiantes ya eligieron su camino al éxito!</span>
        </p>
      </div>
    {/if}

    <div class="grid-opciones">
      {#each opciones as opcion, index}
        {#if visible}
          <div 
            in:scale="{{ start: 0, duration: 800, delay: 200 + (index * 100), easing: quintOut }}"
            class="tarjeta-opcion {opcion.destacado ? 'destacada' : ''}"
            on:click={opcion.action}
            on:keydown={(e) => e.key === 'Enter' && opcion.action()}
            role="button"
            tabindex="0"
          >
            {#if opcion.destacado}
              <div class="etiqueta-destacado">
                {opcion.etiqueta}
              </div>
            {/if}

            <div class="imagen-contenedor">
              <img src={opcion.imagen} alt={opcion.titulo} class="imagen-opcion" />
              <div class="overlay-imagen"></div>
              <div class="icono-opcion">{opcion.icono}</div>
              {#if opcion.destacado}
                <div class="brillo-destacado"></div>
              {/if}
            </div>

            <div class="contenido-tarjeta">
              <div class="header-tarjeta">
                <h3 class="titulo-opcion">{opcion.titulo}</h3>
                <p class="descripcion-opcion">{opcion.descripcion}</p>
              </div>

              <div class="beneficios-lista">
                {#each opcion.beneficios as beneficio}
                  <div class="beneficio-item">
                    <span class="check-icon">✓</span>
                    {beneficio}
                  </div>
                {/each}
              </div>

              <div class="footer-tarjeta">
                <div class="precio-opcion {opcion.destacado ? 'precio-destacado' : ''}">{opcion.precio}</div>
                <button class="boton-explorar bg-gradient-to-r {opcion.color} {opcion.destacado ? 'boton-destacado' : ''}">
                  {opcion.destacado ? '🚀 ¡ACCEDER AHORA!' : 'Explorar Ahora'}
                  <span class="flecha-icon">→</span>
                </button>
              </div>
            </div>

            <div class="efecto-hover"></div>
          </div>
        {/if}
      {/each}
    </div>

    {#if visible}
      <div in:fly="{{ y: 30, duration: 1000, delay: 1000, easing: quintOut }}" class="cta-adicional">
        <div class="cta-contenido">
          <div class="cta-icono">🎯</div>
          <h3>¿No estás seguro cuál elegir para alcanzar el éxito?</h3>
          <p>Nuestros <strong>expertos certificados</strong> te ayudan a encontrar el camino perfecto según tu nivel y objetivos</p>
          <button class="boton-asesoria" on:click={() => goto('/contacto')}>
            💬 Recibir Asesoría Personalizada GRATIS
          </button>
          <div class="garantia-texto">
            ✅ <strong>Asesoría 100% personalizada</strong> • ✅ <strong>Sin compromiso</strong> • ✅ <strong>Respuesta inmediata</strong>
          </div>
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .seccion-opciones {
    padding: 5rem 0;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
    position: relative;
    overflow: hidden;
  }

  .seccion-opciones::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.1) 0%, transparent 100%);
    pointer-events: none;
  }

  .contenedor {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1rem;
    position: relative;
    z-index: 10;
  }

  .header-seccion {
    text-align: center;
    margin-bottom: 4rem;
  }

  .badge-seccion {
    display: inline-block;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    padding: 0.75rem 2rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
    animation: pulseGlow 3s ease-in-out infinite;
  }

  @keyframes pulseGlow {
    0%, 100% { 
      transform: scale(1);
      box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
    }
    50% { 
      transform: scale(1.02);
      box-shadow: 0 12px 35px rgba(251, 191, 36, 0.5);
    }
  }

  .titulo-seccion {
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 900;
    color: #1e293b;
    line-height: 1.2;
    margin-bottom: 1.5rem;
  }

  .texto-destacado {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .texto-principal {
    color: #3b82f6;
  }

  .descripcion-seccion {
    font-size: clamp(1rem, 2.5vw, 1.2rem);
    color: #64748b;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
  }

  .texto-urgencia {
    color: #dc2626;
    font-weight: 700;
  }

  .grid-opciones {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    margin-bottom: 4rem;
  }

  .tarjeta-opcion {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
    transition: all 0.4s ease;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    border: 2px solid transparent;
  }

  .tarjeta-opcion:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  }

  .tarjeta-opcion.destacada {
    border: 2px solid #fbbf24;
    box-shadow: 0 15px 40px rgba(251, 191, 36, 0.2);
    position: relative;
    animation: brilloDestacado 3s ease-in-out infinite;
  }

  @keyframes brilloDestacado {
    0%, 100% { box-shadow: 0 15px 40px rgba(251, 191, 36, 0.2); }
    50% { box-shadow: 0 20px 50px rgba(251, 191, 36, 0.4); }
  }

  .etiqueta-destacado {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 700;
    z-index: 20;
    box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
  }

  .imagen-contenedor {
    position: relative;
    height: 200px;
    overflow: hidden;
  }

  .imagen-opcion {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .tarjeta-opcion:hover .imagen-opcion {
    transform: scale(1.05);
  }

  .overlay-imagen {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%);
  }

  .icono-opcion {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background: rgba(255, 255, 255, 0.9);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .brillo-destacado {
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, transparent, rgba(251, 191, 36, 0.3), transparent);
    animation: brillo 2s ease-in-out infinite;
  }

  @keyframes brillo {
    0% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
    100% { transform: translateX(100%); }
  }

  .contenido-tarjeta {
    padding: 2rem;
  }

  .header-tarjeta {
    margin-bottom: 1.5rem;
  }

  .titulo-opcion {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }

  .descripcion-opcion {
    color: #64748b;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .beneficios-lista {
    margin-bottom: 2rem;
  }

  .beneficio-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
    color: #374151;
  }

  .check-icon {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .footer-tarjeta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .precio-opcion {
    font-size: 1.1rem;
    font-weight: 700;
    color: #dc2626;
  }

  .precio-destacado {
    font-size: 1.3rem;
    color: #fbbf24;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  }

  .boton-explorar {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 25px;
    color: white;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    white-space: nowrap;
  }

  .boton-explorar:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  .boton-destacado {
    padding: 1rem 2rem;
    font-size: 1rem;
    font-weight: 700;
    animation: pulseButton 2s ease-in-out infinite;
  }

  @keyframes pulseButton {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .flecha-icon {
    transition: transform 0.3s ease;
  }

  .boton-explorar:hover .flecha-icon {
    transform: translateX(3px);
  }

  .cta-adicional {
    background: linear-gradient(135deg, #1e293b, #334155);
    border-radius: 30px;
    padding: 3rem 2rem;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
  }

  .cta-adicional::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, transparent, rgba(251, 191, 36, 0.1), transparent);
    animation: shimmer 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .cta-contenido {
    position: relative;
    z-index: 10;
  }

  .cta-icono {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .cta-contenido h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin-bottom: 1rem;
  }

  .cta-contenido p {
    color: #cbd5e1;
    font-size: 1.1rem;
    margin-bottom: 2rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .boton-asesoria {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    padding: 1.2rem 2.5rem;
    border: none;
    border-radius: 25px;
    font-weight: 700;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 1.5rem;
    box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
  }

  .boton-asesoria:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(251, 191, 36, 0.5);
  }

  .garantia-texto {
    color: #94a3b8;
    font-size: 0.9rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .seccion-opciones {
      padding: 3rem 0;
    }

    .grid-opciones {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .tarjeta-opcion {
      margin: 0 0.5rem;
    }

    .footer-tarjeta {
      flex-direction: column;
      gap: 1rem;
    }

    .boton-explorar {
      width: 100%;
      justify-content: center;
    }

    .cta-adicional {
      padding: 2rem 1rem;
      margin: 0 1rem;
    }
  }

  /* Utility classes for gradients */
  :global(.bg-gradient-to-r.from-blue-500.to-purple-600) {
    background: linear-gradient(135deg, #3b82f6, #9333ea);
  }

  :global(.bg-gradient-to-r.from-purple-600.to-pink-600) {
    background: linear-gradient(135deg, #9333ea, #dc2626);
  }

  :global(.bg-gradient-to-r.from-green-500.to-teal-600) {
    background: linear-gradient(135deg, #10b981, #0d9488);
  }

  :global(.bg-gradient-to-r.from-orange-500.to-red-600) {
    background: linear-gradient(135deg, #f97316, #dc2626);
  }

  :global(.bg-gradient-to-r.from-indigo-500.to-purple-600) {
    background: linear-gradient(135deg, #6366f1, #9333ea);
  }

  :global(.bg-gradient-to-r.from-yellow-500.to-orange-600) {
    background: linear-gradient(135deg, #eab308, #ea580c);
  }
</style> 