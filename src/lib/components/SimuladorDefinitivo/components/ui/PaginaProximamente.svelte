<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import FondoEspacial from '../efectos/FondoEspacial.svelte';
  import { audioManager, TipoEfectoUI } from '../../audio/AudioManager';

  let tiempoRestante = {
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0
  };

  let mostrarContenido = false;
  let ventajaActiva = 0;

  // Fecha de lanzamiento: 26 de julio 2025
  const fechaLanzamiento = new Date('2025-07-26T00:00:00');

  const ventajas = [
    {
      icono: '🎵',
      titulo: 'Simulador Hiperrealista',
      descripcion: 'Acordeón virtual con física auténtica y sonido profesional'
    },
    {
      icono: '🎮',
      titulo: 'Modo Gaming',
      descripcion: 'Desafíos, logros y competencias en línea con otros acordeonistas'
    },
    {
      icono: '🎼',
      titulo: 'Editor de Canciones',
      descripcion: 'Crea tus propias composiciones y compártelas con la comunidad'
    },
    {
      icono: '📱',
      titulo: 'Multiplataforma',
      descripcion: 'Disponible en móvil, tablet y escritorio con sincronización'
    },
    {
      icono: '🏆',
      titulo: 'Sistema de Rankings',
      descripción: 'Compite globalmente y alcanza la cima de los acordeonistas'
    }
  ];

  function calcularTiempoRestante() {
    const ahora = new Date();
    const diferencia = fechaLanzamiento.getTime() - ahora.getTime();

    if (diferencia > 0) {
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

      tiempoRestante = { dias, horas, minutos, segundos };
    } else {
      tiempoRestante = { dias: 0, horas: 0, minutos: 0, segundos: 0 };
    }
  }

  function irACursos() {
    audioManager.reproducirEfectoUI(TipoEfectoUI.CLICK_BOTON);
    goto('/cursos');
  }

  function irAMembresias() {
    audioManager.reproducirEfectoUI(TipoEfectoUI.CLICK_BOTON);
    goto('/membresias');
  }

  function hoverBoton() {
    audioManager.reproducirEfectoUI(TipoEfectoUI.HOVER_NAVEGACION);
  }

  onMount(() => {
    // Iniciar animación
    setTimeout(() => {
      mostrarContenido = true;
    }, 500);

    // Actualizar temporizador cada segundo
    const intervalo = setInterval(calcularTiempoRestante, 1000);
    calcularTiempoRestante();

    // Rotar ventajas cada 4 segundos
    const intervaloVentajas = setInterval(() => {
      ventajaActiva = (ventajaActiva + 1) % ventajas.length;
    }, 4000);

    return () => {
      clearInterval(intervalo);
      clearInterval(intervaloVentajas);
    };
  });
</script>

<div class="pagina-proximamente">
  <FondoEspacial />
  
  <div class="contenido-principal" class:visible={mostrarContenido}>
    <!-- Header con logo -->
    <header class="header-proximamente">
      <div class="logo-container">
        <div class="logo-acordeon">🪗</div>
        <h1 class="titulo-principal">Simulador de Acordeón</h1>
        <div class="subtitulo">Academia Vallenata Online</div>
      </div>
    </header>

    <!-- Mensaje principal -->
    <section class="seccion-mensaje">
      <div class="badge-proximamente">
        <span class="icono-reloj">⏰</span>
        <span>¡Muy Pronto!</span>
      </div>
      
      <h2 class="mensaje-principal">
        ¡La experiencia de acordeón más realista está llegando!
      </h2>
      
      <p class="descripcion">
        Prepárate para sumergirte en el simulador de acordeón más avanzado del mundo, 
        con tecnología de vanguardia y la esencia auténtica del vallenato.
      </p>
    </section>

    <!-- Temporizador -->
    <section class="seccion-temporizador">
      <h3 class="titulo-temporizador">Lanzamiento Oficial</h3>
      <div class="temporizador">
        <div class="unidad-tiempo">
          <div class="numero">{tiempoRestante.dias}</div>
          <div class="etiqueta">Días</div>
        </div>
        <div class="separador">:</div>
        <div class="unidad-tiempo">
          <div class="numero">{tiempoRestante.horas}</div>
          <div class="etiqueta">Horas</div>
        </div>
        <div class="separador">:</div>
        <div class="unidad-tiempo">
          <div class="numero">{tiempoRestante.minutos}</div>
          <div class="etiqueta">Minutos</div>
        </div>
        <div class="separador">:</div>
        <div class="unidad-tiempo">
          <div class="numero">{tiempoRestante.segundos}</div>
          <div class="etiqueta">Segundos</div>
        </div>
      </div>
      <div class="fecha-lanzamiento">26 de Julio, 2025</div>
    </section>

    <!-- Ventajas rotativas -->
    <section class="seccion-ventajas">
      <h3 class="titulo-ventajas">¿Qué te espera?</h3>
      <div class="ventajas-container">
        {#each ventajas as ventaja, index}
          <div class="ventaja-item" class:activa={index === ventajaActiva}>
            <div class="ventaja-icono">{ventaja.icono}</div>
            <div class="ventaja-contenido">
              <h4 class="ventaja-titulo">{ventaja.titulo}</h4>
              <p class="ventaja-descripcion">{ventaja.descripcion}</p>
            </div>
          </div>
        {/each}
      </div>
      <div class="indicadores">
        {#each ventajas as _, index}
          <div class="indicador" class:activo={index === ventajaActiva}></div>
        {/each}
      </div>
    </section>

    <!-- Botones de acción -->
    <section class="seccion-acciones">
      <div class="botones-principales">
        <button 
          class="boton-accion boton-primario"
          on:click={irACursos}
          on:mouseenter={hoverBoton}
        >
          <span class="icono-boton">📚</span>
          <span>Ver Cursos Disponibles</span>
          <span class="efecto-hover"></span>
        </button>
        
        <button 
          class="boton-accion boton-secundario"
          on:click={irAMembresias}
          on:mouseenter={hoverBoton}
        >
          <span class="icono-boton">💎</span>
          <span>Conocer Membresías</span>
          <span class="efecto-hover"></span>
        </button>
      </div>
      
      <p class="texto-motivacional">
        🎵 Mientras tanto, ¡mejora tus habilidades con nuestros cursos profesionales!
      </p>
    </section>

    <!-- Footer -->
    <footer class="footer-proximamente">
      <p>© 2025 Academia Vallenata Online - El futuro del aprendizaje musical</p>
    </footer>
  </div>
</div>

<style>
  .pagina-proximamente {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
    overflow: hidden;
  }

  .contenido-principal {
    max-width: 1000px;
    padding: 2rem;
    text-align: center;
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .contenido-principal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .header-proximamente {
    margin-bottom: 3rem;
  }

  .logo-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .logo-acordeon {
    font-size: 4rem;
    animation: float 3s ease-in-out infinite;
    filter: drop-shadow(0 0 20px rgba(230, 168, 0, 0.5));
  }

  .titulo-principal {
    font-size: 3rem;
    font-weight: 800;
    background: linear-gradient(135deg, #e6a800, #ff8c00, #e6a800);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 3s ease infinite;
    margin: 0;
  }

  .subtitulo {
    font-size: 1.2rem;
    color: #cbd5e1;
    margin-top: 0.5rem;
  }

  /* Mensaje */
  .seccion-mensaje {
    margin-bottom: 4rem;
  }

  .badge-proximamente {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(230, 168, 0, 0.2);
    border: 1px solid rgba(230, 168, 0, 0.3);
    border-radius: 50px;
    padding: 0.5rem 1.5rem;
    color: #e6a800;
    font-weight: 600;
    margin-bottom: 2rem;
    animation: pulse 2s infinite;
  }

  .mensaje-principal {
    font-size: 2.5rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 2rem 0;
    line-height: 1.2;
  }

  .descripcion {
    font-size: 1.2rem;
    color: #94a3b8;
    line-height: 1.6;
    max-width: 600px;
    margin: 0 auto;
  }

  /* Temporizador */
  .seccion-temporizador {
    margin-bottom: 4rem;
  }

  .titulo-temporizador {
    font-size: 1.5rem;
    color: #cbd5e1;
    margin-bottom: 2rem;
  }

  .temporizador {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .unidad-tiempo {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 1.5rem 1rem;
    min-width: 80px;
    backdrop-filter: blur(10px);
    animation: glow 2s ease-in-out infinite alternate;
  }

  .numero {
    font-size: 2.5rem;
    font-weight: 800;
    color: #e6a800;
    line-height: 1;
  }

  .etiqueta {
    font-size: 0.9rem;
    color: #94a3b8;
    margin-top: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .separador {
    font-size: 2rem;
    color: #64748b;
    font-weight: bold;
  }

  .fecha-lanzamiento {
    font-size: 1.1rem;
    color: #e6a800;
    font-weight: 600;
    margin-top: 1rem;
  }

  /* Ventajas */
  .seccion-ventajas {
    margin-bottom: 4rem;
  }

  .titulo-ventajas {
    font-size: 1.8rem;
    color: #f1f5f9;
    margin-bottom: 2rem;
  }

  .ventajas-container {
    position: relative;
    height: 120px;
    margin-bottom: 2rem;
  }

  .ventaja-item {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    backdrop-filter: blur(10px);
    opacity: 0;
    transform: translateX(50px);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .ventaja-item.activa {
    opacity: 1;
    transform: translateX(0);
  }

  .ventaja-icono {
    font-size: 3rem;
    animation: bounce 2s ease-in-out infinite;
  }

  .ventaja-contenido {
    text-align: left;
    flex: 1;
  }

  .ventaja-titulo {
    font-size: 1.3rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 0.5rem 0;
  }

  .ventaja-descripcion {
    font-size: 1rem;
    color: #94a3b8;
    margin: 0;
  }

  .indicadores {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }

  .indicador {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
  }

  .indicador.activo {
    background: #e6a800;
    transform: scale(1.3);
  }

  /* Botones */
  .seccion-acciones {
    margin-bottom: 3rem;
  }

  .botones-principales {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .boton-accion {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem 2rem;
    border: none;
    border-radius: 50px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    text-decoration: none;
  }

  .boton-primario {
    background: linear-gradient(135deg, #e6a800, #ff8c00);
    color: white;
    box-shadow: 0 4px 20px rgba(230, 168, 0, 0.3);
  }

  .boton-secundario {
    background: rgba(255, 255, 255, 0.1);
    color: #f1f5f9;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  }

  .boton-accion:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  }

  .boton-primario:hover {
    box-shadow: 0 8px 30px rgba(230, 168, 0, 0.4);
  }

  .icono-boton {
    font-size: 1.2rem;
  }

  .efecto-hover {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  .boton-accion:hover .efecto-hover {
    left: 100%;
  }

  .texto-motivacional {
    font-size: 1.1rem;
    color: #cbd5e1;
    margin-top: 2rem;
  }

  /* Footer */
  .footer-proximamente {
    color: #64748b;
    font-size: 0.9rem;
  }

  /* Animaciones */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }

  @keyframes glow {
    0% { box-shadow: 0 0 5px rgba(230, 168, 0, 0.3); }
    100% { box-shadow: 0 0 20px rgba(230, 168, 0, 0.6); }
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .titulo-principal {
      font-size: 2rem;
    }

    .mensaje-principal {
      font-size: 1.8rem;
    }

    .temporizador {
      gap: 0.5rem;
    }

    .unidad-tiempo {
      min-width: 60px;
      padding: 1rem 0.5rem;
    }

    .numero {
      font-size: 1.8rem;
    }

    .botones-principales {
      flex-direction: column;
      align-items: center;
    }

    .boton-accion {
      width: 100%;
      max-width: 300px;
    }

    .ventaja-item {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .ventaja-contenido {
      text-align: center;
    }
  }
</style> 