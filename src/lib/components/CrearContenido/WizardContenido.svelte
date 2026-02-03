<script lang="ts">
  import PasoInformacionGeneral from './PasoInformacionGeneral.svelte';
  import GestorEstructuraContenido from './GestorEstructuraContenido.svelte';
  import PasoResumenGuardar from './PasoResumenGuardar.svelte';
  import { generateSlug } from '$lib/utilidades/utilidadesSlug';

  // Props principales
  export let tipo: 'tutorial' | 'curso' = 'tutorial';
  export let datosIniciales: any = null;
  export let estructuraInicial: any[] = [];
  
  // Detectar modo edición
  $: modoEdicion = datosIniciales && datosIniciales.id;

  // Estados principales
  let pasoActual = 1;
  let cargando = false;
  let datosGenerales: any = {};
  let estructuraContenido: any[] = [];
  let resumenFinal: any = {};
  let cursoCreado: any = null;
  let animandoCambio = false;

  // Configuración de pasos
  $: configuracionPasos = {
    tutorial: [
      { id: 1, titulo: '📝 Información General', descripcion: 'Datos básicos del tutorial' },
      { id: 2, titulo: '🎬 Estructura del Contenido', descripcion: 'Partes y organización' },
      { id: 3, titulo: '💾 Resumen y Guardado', descripcion: 'Revisión final y guardar' },
      { id: 4, titulo: '🎉 Finalización', descripcion: 'Proceso completado' }
    ],
    curso: [
      { id: 1, titulo: '📝 Información General', descripcion: 'Datos básicos del curso' },
      { id: 2, titulo: '📚 Módulos y Lecciones', descripcion: 'Estructura educativa' },
      { id: 3, titulo: '💾 Resumen y Guardado', descripcion: 'Revisión final y guardar' },
      { id: 4, titulo: '🎉 Finalización', descripcion: 'Proceso completado' }
    ]
  };

  $: pasos = configuracionPasos[tipo];
  $: totalPasos = pasos.length;
  $: porcentajeProgreso = ((pasoActual - 1) / (totalPasos - 1)) * 100;

  // Inicialización de datos para edición
  $: if (datosIniciales) {
    console.log('🔄 Inicializando datos generales:', datosIniciales);
    datosGenerales = { ...datosIniciales };
  }
  $: if (estructuraInicial?.length > 0) {
    console.log('🔄 Inicializando estructura:', estructuraInicial);
    estructuraContenido = [...estructuraInicial];
  }

  // Funciones de navegación con animación
  async function cambiarPaso(nuevoPaso: number) {
    if (nuevoPaso < 1 || nuevoPaso > totalPasos || nuevoPaso === pasoActual) return;
    
    animandoCambio = true;
    await new Promise(resolve => setTimeout(resolve, 150));
    pasoActual = nuevoPaso;
    await new Promise(resolve => setTimeout(resolve, 150));
    animandoCambio = false;
  }

  function avanzarPaso() {
    if (pasoActual < totalPasos) {
      cambiarPaso(pasoActual + 1);
    }
  }

  function retrocederPaso() {
    if (pasoActual > 1) {
      cambiarPaso(pasoActual - 1);
    }
  }

  function cambiarTipoContenido(nuevoTipo: 'tutorial' | 'curso') {
    if (tipo === nuevoTipo) return;
    
    tipo = nuevoTipo;
    pasoActual = 1;
    datosGenerales = {};
    estructuraContenido = [];
    resumenFinal = {};
  }

  // Manejadores de eventos
  function manejarDatosGenerales(evento: CustomEvent) {
    datosGenerales = evento.detail;
    avanzarPaso();
  }

  function manejarEstructura(evento: CustomEvent) {
    estructuraContenido = evento.detail;
    avanzarPaso();
  }

  function manejarResumen(evento: CustomEvent) {
    resumenFinal = evento.detail;
    if (tipo === 'tutorial') {
      // Para tutoriales, ya estamos listos
      console.log('Tutorial completado:', { datosGenerales, estructuraContenido, resumenFinal });
    } else {
      // Para cursos, ir al paso de finalización
      avanzarPaso();
    }
  }

  function reiniciarWizard() {
    pasoActual = 1;
    datosGenerales = {};
    estructuraContenido = [];
    resumenFinal = {};
  }

  // Función para obtener el número total de pasos
  function getTotalPasos() {
    return tipo === 'curso' ? 4 : 4; // Ambos tienen 4 pasos ahora (incluyendo paso de visualización)
  }

  // Función para manejar cuando se guarda en Supabase
  function manejarGuardado(event: CustomEvent) {
    cursoCreado = event.detail; // Guardar los datos del curso/tutorial creado
    pasoActual = 4; // Ir al paso de visualización
  }
</script>

<div class="wizard-futurista">
  <!-- Header del Wizard -->
  <header class="wizard-header">
    <div class="header-content">
      <h1 class="titulo-principal">
        <span class="icono-creator">🚀</span>
        <span class="texto-titulo">Creator Studio</span>
        <span class="subtitulo">Sistema Avanzado de Creación de Contenido</span>
      </h1>
      <div class="selector-tipo">
        <button 
          class="tipo-btn {tipo === 'tutorial' ? 'activo' : ''}" 
          on:click={() => cambiarTipoContenido('tutorial')}
          disabled={pasoActual > 1}
        >
          <span class="icono">📚</span>
          Tutorial
        </button>
        <button 
          class="tipo-btn {tipo === 'curso' ? 'activo' : ''}" 
          on:click={() => cambiarTipoContenido('curso')}
          disabled={pasoActual > 1}
        >
          <span class="icono">🎓</span>
          Curso
        </button>
      </div>
    </div>
  </header>

  <!-- Indicador de Progreso -->
  <div class="indicador-progreso">
    <div class="barra-progreso">
      <div 
        class="progreso-fill" 
        style="width: {porcentajeProgreso}%"
      ></div>
    </div>
    <span class="texto-progreso">
      Paso {pasoActual} de {totalPasos}
    </span>
  </div>

  <!-- Navegación de Pasos -->
  <nav class="navegacion-pasos">
    {#each pasos as paso, index}
      <button 
        class="paso-boton"
        class:activo={pasoActual === paso.id}
        class:completado={pasoActual > paso.id}
        on:click={() => cambiarPaso(paso.id)}
      >
        <div class="numero-paso">
          {#if pasoActual > paso.id}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
          {:else}
            {paso.id}
          {/if}
        </div>
        <div class="info-paso">
          <span class="titulo-paso">{paso.titulo}</span>
          <span class="descripcion-paso">{paso.descripcion}</span>
        </div>
      </button>
    {/each}
  </nav>

  <!-- Contenido del Paso -->
  <main class="contenido-paso" class:animando={animandoCambio}>
    {#if pasoActual === 1}
      <PasoInformacionGeneral 
        tipo={tipo} 
        datos={datosGenerales}
        on:continuar={manejarDatosGenerales} 
      />
    {:else if pasoActual === 2}
      <GestorEstructuraContenido 
        tipo={tipo} 
        datosGenerales={datosGenerales}
        estructura={estructuraContenido}
        on:continuar={manejarEstructura} 
      />
    {:else if pasoActual === 3}
      <PasoResumenGuardar 
        tipo={tipo} 
        datosGenerales={datosGenerales} 
        estructura={estructuraContenido}
        modoEdicion={modoEdicion}
        idContenido={datosIniciales?.id}
        on:guardado={manejarGuardado} 
      />
    {:else if pasoActual === 4}
      <div class="paso-final">
        <div class="exito-container">
          <div class="exito-circulo">
            <div class="check-icon">✓</div>
          </div>
          <h2 class="exito-titulo">¡{tipo === 'curso' ? 'Curso' : 'Tutorial'} Creado Exitosamente!</h2>
          <p class="exito-descripcion">
            Tu {tipo} "{datosGenerales.titulo}" ha sido guardado correctamente en la base de datos.
          </p>
          
          <div class="acciones-finales">
            <a 
              href="/{tipo === 'curso' ? 'cursos' : 'tutoriales'}/{cursoCreado ? (tipo === 'curso' ? cursoCreado.slug : generateSlug(cursoCreado.titulo)) : 'nuevo-contenido'}" 
              class="btn-ver-contenido"
              target="_blank"
            >
              <span class="icono">👁️</span>
              Ver {tipo === 'curso' ? 'Curso' : 'Tutorial'}
            </a>
            <button 
              class="btn-crear-otro" 
              on:click={() => {
                pasoActual = 1;
                datosGenerales = {};
                estructuraContenido = [];
                cursoCreado = null;
              }}
            >
              <span class="icono">➕</span>
              Crear Otro {tipo === 'curso' ? 'Curso' : 'Tutorial'}
            </button>
            <a href="/administrador/panel-contenido" class="btn-panel">
              <span class="icono">📊</span>
              Ir al Panel
            </a>
          </div>
        </div>
      </div>
    {/if}
  </main>

  <!-- Navegación de Controles -->
  <footer class="controles-navegacion">
    <button 
      class="boton-navegacion anterior"
      class:deshabilitado={pasoActual === 1}
      on:click={retrocederPaso}
      disabled={pasoActual === 1}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
      </svg>
      Anterior
    </button>

    <button 
      class="boton-navegacion siguiente"
      class:deshabilitado={pasoActual === totalPasos}
      on:click={avanzarPaso}
      disabled={pasoActual === totalPasos}
    >
      Siguiente
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  </footer>
</div>

<style>
  .wizard-futurista {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  /* === HEADER DEL WIZARD === */
  .wizard-header {
    background: linear-gradient(135deg, 
      #667eea 0%, 
      #764ba2 50%, 
      #f093fb 100%
    );
    padding: 2rem 0;
    position: relative;
    overflow: hidden;
  }

  .wizard-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 70% 80%, rgba(255,255,255,0.08) 0%, transparent 50%);
    pointer-events: none;
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;
  }

  .titulo-principal {
    text-align: center;
    margin: 0 0 2rem 0;
    color: white;
  }

  .icono-creator {
    font-size: 3rem;
    display: block;
    margin-bottom: 0.5rem;
    animation: pulse 2s infinite;
  }

  .texto-titulo {
    font-size: 3.5rem;
    font-weight: 900;
    display: block;
    text-shadow: 0 4px 20px rgba(0,0,0,0.3);
    background: linear-gradient(45deg, #ffffff, #f0f0ff);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -2px;
  }

  .subtitulo {
    font-size: 1.2rem;
    font-weight: 500;
    display: block;
    margin-top: 0.5rem;
    opacity: 0.9;
    letter-spacing: 1px;
  }

  .selector-tipo {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
  }

  .tipo-btn {
    background: rgba(255,255,255,0.15);
    border: 2px solid rgba(255,255,255,0.3);
    color: white;
    padding: 1rem 2rem;
    border-radius: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tipo-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.25);
    border-color: rgba(255,255,255,0.5);
    transform: translateY(-2px);
  }

  .tipo-btn.activo {
    background: rgba(255,255,255,0.9);
    color: #667eea;
    border-color: white;
    transform: scale(1.05);
  }

  .tipo-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .tipo-btn .icono {
    font-size: 1.3rem;
  }

  .indicador-progreso {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .barra-progreso {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    overflow: hidden;
  }

  .progreso-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
    border-radius: 10px;
    transition: width 0.5s ease;
  }

  .texto-progreso {
    font-size: 0.9rem;
    font-weight: 600;
    opacity: 0.9;
  }

  /* === NAVEGACIÓN DE PASOS === */
  .navegacion-pasos {
    display: flex;
    padding: 0;
    background: #f8fafc;
    overflow-x: auto;
  }

  .paso-boton {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 4px solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 200px;
  }

  .paso-boton:hover {
    background: rgba(102, 126, 234, 0.05);
  }

  .paso-boton.activo {
    background: rgba(102, 126, 234, 0.1);
    border-bottom-color: #667eea;
  }

  .paso-boton.completado {
    background: rgba(16, 185, 129, 0.05);
    border-bottom-color: #10b981;
  }

  .numero-paso {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1rem;
    background: #e2e8f0;
    color: #64748b;
    transition: all 0.3s ease;
  }

  .paso-boton.activo .numero-paso {
    background: #667eea;
    color: white;
  }

  .paso-boton.completado .numero-paso {
    background: #10b981;
    color: white;
  }

  .numero-paso svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .info-paso {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .titulo-paso {
    font-weight: 600;
    font-size: 1rem;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }

  .descripcion-paso {
    font-size: 0.85rem;
    color: #64748b;
  }

  /* === CONTENIDO DEL PASO === */
  .contenido-paso {
    padding: 3rem;
    min-height: 400px;
    transition: all 0.3s ease;
  }

  .contenido-paso.animando {
    opacity: 0.7;
    transform: translateY(10px);
  }

  /* === FINALIZACIÓN EXITOSA === */
  .paso-final {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
    padding: 3rem 2rem;
  }

  .exito-container {
    background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
    border-radius: 2rem;
    padding: 4rem 3rem;
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.1);
  }

  .exito-circulo {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    margin: 0 auto 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 30px rgba(79, 172, 254, 0.3);
    animation: successPulse 2s infinite;
  }

  .check-icon {
    font-size: 3rem;
    color: white;
    font-weight: bold;
  }

  .exito-titulo {
    font-size: 2.5rem;
    font-weight: 800;
    color: #2d3748;
    margin: 0 0 1rem 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .exito-descripcion {
    font-size: 1.2rem;
    color: #64748b;
    margin-bottom: 3rem;
    line-height: 1.6;
  }

  .acciones-finales {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-ver-contenido,
  .btn-crear-otro,
  .btn-panel {
    padding: 1rem 2rem;
    border-radius: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    cursor: pointer;
    border: none;
  }

  .btn-ver-contenido {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    box-shadow: 0 8px 25px rgba(79, 172, 254, 0.3);
  }

  .btn-ver-contenido:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(79, 172, 254, 0.4);
  }

  .btn-crear-otro {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  .btn-crear-otro:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
  }

  .btn-panel {
    background: rgba(100, 116, 139, 0.1);
    color: #64748b;
    border: 2px solid rgba(100, 116, 139, 0.2);
  }

  .btn-panel:hover {
    background: rgba(100, 116, 139, 0.15);
    border-color: rgba(100, 116, 139, 0.3);
    transform: translateY(-2px);
  }

  @keyframes successPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  /* === CONTROLES DE NAVEGACIÓN === */
  .controles-navegacion {
    display: flex;
    justify-content: space-between;
    padding: 2rem 3rem;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
  }

  .boton-navegacion {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
  }

  .boton-navegacion.anterior {
    background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
    color: white;
  }

  .boton-navegacion.siguiente {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .boton-navegacion:not(.deshabilitado):hover {
    transform: translateY(-2px);
  }

  .boton-navegacion.anterior:not(.deshabilitado):hover {
    box-shadow: 0 8px 25px rgba(107, 114, 128, 0.3);
  }

  .boton-navegacion.siguiente:not(.deshabilitado):hover {
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  .boton-navegacion.deshabilitado {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .boton-navegacion svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  /* === RESPONSIVE === */
  @media (max-width: 768px) {
    .wizard-header {
      padding: 1.5rem;
    }

    .selector-tipo {
      flex-direction: column;
      align-items: center;
    }

    .navegacion-pasos {
      flex-direction: column;
    }

    .paso-boton {
      min-width: auto;
    }

    .contenido-paso {
      padding: 2rem 1.5rem;
    }

    .controles-navegacion {
      padding: 1.5rem;
      flex-direction: column;
      gap: 1rem;
    }

    .acciones-finales {
      flex-direction: column;
      align-items: center;
    }

    .paso-final {
      padding: 2rem 1rem;
    }

    .titulo-exito {
      font-size: 1.75rem;
    }
  }

  @media (max-width: 480px) {
    .circulo-exito {
      width: 80px;
      height: 80px;
    }

    .circulo-exito svg {
      width: 2rem;
      height: 2rem;
    }

    .indicador-progreso {
      flex-direction: column;
      gap: 0.5rem;
    }

    .texto-progreso {
      font-size: 0.8rem;
    }
  }
</style>
