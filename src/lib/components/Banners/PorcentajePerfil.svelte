<script lang="ts">
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { spring } from 'svelte/motion';

  export let perfil: any = {};
  let listo = false;

  const progresoAnimado = spring(0, {
    stiffness: 0.04,
    damping: 0.3
  });

  onMount(() => {
    setTimeout(() => {
      listo = true;
    }, 150);
  });

  function isRealValue(val: any) {
    return val !== undefined && val !== null && val !== '' && val !== 'NULL';
  }

  $: camposGenerales = [
    perfil?.nombre,
    perfil?.apellido,
    perfil?.nombre_usuario,
    perfil?.biografia,
    perfil?.pais,
    perfil?.ciudad
  ];
  $: generalCompletadas = camposGenerales.filter(campo => isRealValue(campo)).length;

  $: camposTrayectoria = [
    perfil?.instrumento,
    perfil?.nivel_habilidad,
    perfil?.ano_experiencia,
    perfil?.estilo_favorito,
    perfil?.estudios_musicales,
    perfil?.objetivo_aprendizaje
  ];
  $: trayectoriaCompletadas = camposTrayectoria.filter(campo => isRealValue(campo)).length;

  $: camposAdicionales = [
    perfil?.fecha_nacimiento,
    perfil?.profesion,
    perfil?.whatsapp,
    perfil?.direccion_completa,
    perfil?.documento_tipo,
    perfil?.documento_numero
  ];
  $: adicionalesCompletadas = camposAdicionales.filter(campo => isRealValue(campo)).length;

  $: totalCampos = camposGenerales.length + camposTrayectoria.length + camposAdicionales.length;
  $: camposCompletados = generalCompletadas + trayectoriaCompletadas + adicionalesCompletadas;
  $: porcentaje = Math.round((camposCompletados / totalCampos) * 100);

  $: {
    if (listo && progresoAnimado) {
      progresoAnimado.set(porcentaje);
    }
  }

  // Función para determinar el color del progreso
  $: colorProgreso = porcentaje >= 80 ? '#10b981' : porcentaje >= 50 ? '#f59e0b' : '#ef4444';
  $: colorFondo = porcentaje >= 80 ? '#d1fae5' : porcentaje >= 50 ? '#fef3c7' : '#fee2e2';

</script>

{#if listo}
<div class="widget-progreso" in:fly={{ y: 20, duration: 500 }}>
  <div class="header-widget">
    <div class="emoji-estado">
      {#if porcentaje >= 80}🎉{:else if porcentaje >= 50}⚡{:else}🚀{/if}
    </div>
    <h3 class="titulo-progreso">Completa tu perfil</h3>
    <p class="subtitulo">
      {#if porcentaje >= 80}
        ¡Excelente trabajo!
      {:else if porcentaje >= 50}
        ¡Vas muy bien!
      {:else}
        ¡Empecemos!
      {/if}
    </p>
  </div>

  <div class="contenedor-circulo">
    <div class="progreso-circular">
      <svg viewBox="0 0 120 120" class="circulo-svg">
        <defs>
          <linearGradient id="gradienteProgreso" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:{colorProgreso};stop-opacity:1" />
            <stop offset="100%" style="stop-color:{colorProgreso}80;stop-opacity:1" />
          </linearGradient>
          <filter id="sombra" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="{colorProgreso}" flood-opacity="0.2"/>
          </filter>
        </defs>
        
        <!-- Círculo de fondo -->
        <circle 
          cx="60" 
          cy="60" 
          r="50" 
          fill="none" 
          stroke="#f1f5f9" 
          stroke-width="8"
          class="fondo-circulo"
        />
        
        <!-- Círculo de progreso -->
        <circle 
          cx="60" 
          cy="60" 
          r="50" 
          fill="none" 
          stroke="url(#gradienteProgreso)" 
          stroke-width="8" 
          stroke-linecap="round"
          stroke-dasharray="314.16"
          stroke-dashoffset="{314.16 - (314.16 * $progresoAnimado / 100)}"
          class="barra-progreso"
          filter="url(#sombra)"
        />
      </svg>
      
      <div class="contenido-centro">
        <div class="porcentaje-numero">{Math.round($progresoAnimado)}<span class="simbolo-porcentaje">%</span></div>
        <div class="texto-completado">Completado</div>
      </div>
    </div>
  </div>

  <div class="lista-progreso">
    <div class="item-progreso" class:completado={generalCompletadas === camposGenerales.length}>
      <div class="icono-item">
        {#if generalCompletadas === camposGenerales.length}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {:else}
          <div class="circulo-vacio"></div>
        {/if}
      </div>
      <div class="info-item">
        <span class="nombre-item">Datos personales</span>
        <span class="progreso-item">{generalCompletadas}/{camposGenerales.length}</span>
      </div>
    </div>

    <div class="item-progreso" class:completado={trayectoriaCompletadas === camposTrayectoria.length}>
      <div class="icono-item">
        {#if trayectoriaCompletadas === camposTrayectoria.length}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {:else}
          <div class="circulo-vacio"></div>
        {/if}
      </div>
      <div class="info-item">
        <span class="nombre-item">Trayectoria musical</span>
        <span class="progreso-item">{trayectoriaCompletadas}/{camposTrayectoria.length}</span>
      </div>
    </div>

    <div class="item-progreso" class:completado={adicionalesCompletadas === camposAdicionales.length}>
      <div class="icono-item">
        {#if adicionalesCompletadas === camposAdicionales.length}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {:else}
          <div class="circulo-vacio"></div>
        {/if}
      </div>
      <div class="info-item">
        <span class="nombre-item">Datos adicionales</span>
        <span class="progreso-item">{adicionalesCompletadas}/{camposAdicionales.length}</span>
      </div>
    </div>
  </div>

  {#if porcentaje < 100}
    <div class="motivacion">
      <p class="texto-motivacion">
        {#if porcentaje >= 80}
          ¡Solo faltan unos detalles más!
        {:else if porcentaje >= 50}
          ¡Estás a mitad de camino!
        {:else}
          ¡Completa tu perfil para destacar!
        {/if}
      </p>
    </div>
  {/if}
</div>
{/if}

<style>
.widget-progreso {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  padding: 2rem;
  max-width: 320px;
  margin-left: auto;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.widget-progreso::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
  background-size: 200% 100%;
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.header-widget {
  text-align: center;
  margin-bottom: 2rem;
}

.emoji-estado {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.titulo-progreso {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.subtitulo {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
}

.contenedor-circulo {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  position: relative;
}

.progreso-circular {
  position: relative;
  width: 140px;
  height: 140px;
}

.circulo-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.fondo-circulo {
  opacity: 0.3;
}

.barra-progreso {
  transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.contenido-centro {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.porcentaje-numero {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.simbolo-porcentaje {
  font-size: 1.25rem;
  font-weight: 600;
  color: #64748b;
  margin-left: 2px;
}

.texto-completado {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;
}

.lista-progreso {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-progreso {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.item-progreso.completado {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #a7f3d0;
  transform: scale(1.02);
}

.icono-item {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #64748b;
  transition: all 0.3s;
  flex-shrink: 0;
}

.item-progreso.completado .icono-item {
  background: #10b981;
  color: white;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.circulo-vacio {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid currentColor;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.nombre-item {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
}

.item-progreso.completado .nombre-item {
  color: #065f46;
}

.progreso-item {
  font-size: 0.8rem;
  font-weight: 700;
  color: #6b7280;
  background: #ffffff;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  min-width: 40px;
  text-align: center;
}

.item-progreso.completado .progreso-item {
  background: #ffffff;
  color: #059669;
  border-color: #a7f3d0;
}

.motivacion {
  margin-top: 1.5rem;
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 12px;
  border: 1px solid #bfdbfe;
}

.texto-motivacion {
  margin: 0;
  font-size: 0.875rem;
  color: #1e40af;
  font-weight: 600;
}

@media (max-width: 768px) {
  .widget-progreso {
    margin-left: 0;
    max-width: 100%;
    padding: 1.5rem;
  }
  
  .progreso-circular {
    width: 120px;
    height: 120px;
  }
  
  .porcentaje-numero {
    font-size: 2rem;
  }
}
</style>
