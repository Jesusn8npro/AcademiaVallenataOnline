<script lang="ts">
  // Props
  export let estadisticasProgreso: { completadas: number; total: number; porcentaje: number };
  export let tipoContenido: 'curso' | 'tutorial' = 'curso';

  // Calcular el nivel de progreso
  $: nivelProgreso = estadisticasProgreso.porcentaje >= 100 ? 'completo' : 
                   estadisticasProgreso.porcentaje >= 75 ? 'avanzado' : 
                   estadisticasProgreso.porcentaje >= 50 ? 'intermedio' : 
                   estadisticasProgreso.porcentaje >= 25 ? 'inicial' : 'comienzo';

  // Obtener color según el tipo de contenido
  function getColorPrincipal(tipo: 'curso' | 'tutorial') {
    return tipo === 'curso' ? '#3b82f6' : '#a855f7';
  }

  // Obtener color de fondo según el tipo de contenido
  function getColorFondo(tipo: 'curso' | 'tutorial') {
    return tipo === 'curso' ? '#dbeafe' : '#f3e8ff';
  }

  // Obtener mensaje motivacional
  function getMensajeMotivacional(porcentaje: number, tipo: 'curso' | 'tutorial') {
    const contenidoTexto = tipo === 'curso' ? 'curso' : 'tutorial';
    
    if (porcentaje >= 100) {
      return `¡Felicidades! Has completado este ${contenidoTexto} 🎉`;
    } else if (porcentaje >= 75) {
      return `¡Casi terminas! Solo te falta un poco más 💪`;
    } else if (porcentaje >= 50) {
      return `¡Vas muy bien! Ya has completado la mitad 🚀`;
    } else if (porcentaje >= 25) {
      return `¡Buen comienzo! Continúa así 📚`;
    } else if (porcentaje > 0) {
      return `¡Acabas de empezar! Cada paso cuenta ✨`;
    } else {
      return `¡Es hora de comenzar tu aprendizaje! 🌟`;
    }
  }

  // Obtener etiqueta de nivel
  function getEtiquetaNivel(nivel: string) {
    switch (nivel) {
      case 'completo': return 'Completado';
      case 'avanzado': return 'Avanzado';
      case 'intermedio': return 'Intermedio';
      case 'inicial': return 'Iniciando';
      default: return 'Comienzo';
    }
  }

  // Obtener color de nivel
  function getColorNivel(nivel: string) {
    switch (nivel) {
      case 'completo': return '#10b981';
      case 'avanzado': return '#3b82f6';
      case 'intermedio': return '#f59e0b';
      case 'inicial': return '#ef4444';
      default: return '#6b7280';
    }
  }

  $: colorPrincipal = getColorPrincipal(tipoContenido);
  $: colorFondo = getColorFondo(tipoContenido);
  $: mensajeMotivacional = getMensajeMotivacional(estadisticasProgreso.porcentaje, tipoContenido);
</script>

<div class="progreso-avanzado">
  <div class="progreso-header">
    <div class="progreso-titulo">
      <h3>Tu Progreso</h3>
      <div class="nivel-badge" style="background-color: {getColorNivel(nivelProgreso)};">
        {getEtiquetaNivel(nivelProgreso)}
      </div>
    </div>
    
    <div class="progreso-stats">
      <div class="stat-principal">
        <div class="porcentaje" style="color: {colorPrincipal};">
          {estadisticasProgreso.porcentaje}%
        </div>
        <div class="progreso-texto">
          {estadisticasProgreso.completadas} de {estadisticasProgreso.total} 
          {tipoContenido === 'curso' ? 'lecciones' : 'clases'}
        </div>
      </div>
    </div>
  </div>

  <div class="progreso-visual">
    <div class="barra-principal">
      <div class="barra-fondo" style="background-color: {colorFondo};">
        <div 
          class="barra-progreso" 
          style="width: {estadisticasProgreso.porcentaje}%; background-color: {colorPrincipal};"
        ></div>
        <div class="indicador-progreso" style="left: {estadisticasProgreso.porcentaje}%;">
          <div class="punto-indicador" style="background-color: {colorPrincipal};"></div>
        </div>
      </div>
    </div>
    
    <div class="marcadores">
      <div class="marcador">
        <div class="marcador-linea"></div>
        <span>0%</span>
      </div>
      <div class="marcador">
        <div class="marcador-linea"></div>
        <span>25%</span>
      </div>
      <div class="marcador">
        <div class="marcador-linea"></div>
        <span>50%</span>
      </div>
      <div class="marcador">
        <div class="marcador-linea"></div>
        <span>75%</span>
      </div>
      <div class="marcador">
        <div class="marcador-linea"></div>
        <span>100%</span>
      </div>
    </div>
  </div>

  <div class="mensaje-motivacional">
    <div class="mensaje-icono">
      {#if estadisticasProgreso.porcentaje >= 100}
        🎉
      {:else if estadisticasProgreso.porcentaje >= 75}
        💪
      {:else if estadisticasProgreso.porcentaje >= 50}
        🚀
      {:else if estadisticasProgreso.porcentaje >= 25}
        📚
      {:else if estadisticasProgreso.porcentaje > 0}
        ✨
      {:else}
        🌟
      {/if}
    </div>
    <p>{mensajeMotivacional}</p>
  </div>

  <div class="progreso-detalles">
    <div class="detalle-item">
      <div class="detalle-valor">{estadisticasProgreso.completadas}</div>
      <div class="detalle-label">Completadas</div>
    </div>
    <div class="detalle-item">
      <div class="detalle-valor">{estadisticasProgreso.total - estadisticasProgreso.completadas}</div>
      <div class="detalle-label">Restantes</div>
    </div>
    <div class="detalle-item">
      <div class="detalle-valor">{estadisticasProgreso.total}</div>
      <div class="detalle-label">Total</div>
    </div>
  </div>
</div>

<style>
  .progreso-avanzado {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .progreso-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .progreso-titulo {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .progreso-titulo h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .nivel-badge {
    padding: 4px 12px;
    border-radius: 20px;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .progreso-stats {
    text-align: right;
  }

  .stat-principal {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  .porcentaje {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1;
  }

  .progreso-texto {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .progreso-visual {
    margin-bottom: 2rem;
  }

  .barra-principal {
    margin-bottom: 0.5rem;
  }

  .barra-fondo {
    position: relative;
    width: 100%;
    height: 16px;
    border-radius: 8px;
    overflow: hidden;
  }

  .barra-progreso {
    height: 100%;
    border-radius: 8px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .indicador-progreso {
    position: absolute;
    top: -4px;
    transform: translateX(-50%);
    transition: left 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .punto-indicador {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 4px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .marcadores {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
  }

  .marcador {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .marcador-linea {
    width: 1px;
    height: 8px;
    background: #cbd5e1;
  }

  .marcador span {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
  }

  .mensaje-motivacional {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 12px;
    border: 1px solid #bae6fd;
    margin-bottom: 1.5rem;
  }

  .mensaje-icono {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .mensaje-motivacional p {
    color: #0c4a6e;
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;
    line-height: 1.4;
  }

  .progreso-detalles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .detalle-item {
    text-align: center;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .detalle-valor {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }

  .detalle-label {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .progreso-avanzado {
      padding: 1.5rem;
    }
    
    .progreso-header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
    
    .progreso-titulo {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .progreso-stats {
      text-align: left;
    }
    
    .stat-principal {
      flex-direction: row;
      align-items: center;
      gap: 1rem;
    }
    
    .porcentaje {
      font-size: 2rem;
    }
    
    .progreso-detalles {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .progreso-avanzado {
      padding: 1rem;
    }
    
    .marcadores {
      display: none;
    }
    
    .mensaje-motivacional {
      padding: 0.75rem;
    }
  }
</style> 