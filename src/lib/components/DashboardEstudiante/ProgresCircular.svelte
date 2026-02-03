<script lang="ts">
  export let porcentaje: number = 0;
  export let titulo: string = 'Progreso';
  export let subtitulo: string = '';
  export let color: 'azul' | 'verde' | 'naranja' | 'purpura' = 'azul';
  export let tamano: 'pequeno' | 'mediano' | 'grande' = 'mediano';
  export let mostrarPorcentaje: boolean = true;
  export let estiloTexto: 'compacto' | 'expandido' = 'compacto';

  const coloresDisponibles = {
    azul: '#3b82f6',
    verde: '#059669', 
    naranja: '#f97316',
    purpura: '#8b5cf6'
  };

  const tamanos = {
    pequeno: { radio: 35, grosor: 4, texto: '1.2rem' },
    mediano: { radio: 50, grosor: 6, texto: '1.5rem' },
    grande: { radio: 70, grosor: 8, texto: '2rem' }
  };

  $: configuracionColor = coloresDisponibles[color];
  $: configuracionTamano = tamanos[tamano];
  $: circunferencia = 2 * Math.PI * configuracionTamano.radio;
  $: desplazamiento = circunferencia - (porcentaje / 100) * circunferencia;
  $: centroSvg = configuracionTamano.radio + configuracionTamano.grosor;
  $: tamanoSvg = (configuracionTamano.radio + configuracionTamano.grosor) * 2;
</script>

<div class="contenedor-progreso-circular {estiloTexto}">
  <div class="circulo-progreso">
    <svg 
      width={tamanoSvg} 
      height={tamanoSvg} 
      class="svg-progreso"
    >
      <!-- Círculo base -->
      <circle
        cx={centroSvg}
        cy={centroSvg}
        r={configuracionTamano.radio}
        stroke="#e2e8f0"
        stroke-width={configuracionTamano.grosor}
        fill="transparent"
        class="circulo-base"
      />
      
      <!-- Círculo de progreso -->
      <circle
        cx={centroSvg}
        cy={centroSvg}
        r={configuracionTamano.radio}
        stroke={configuracionColor}
        stroke-width={configuracionTamano.grosor}
        fill="transparent"
        stroke-dasharray={circunferencia}
        stroke-dashoffset={desplazamiento}
        stroke-linecap="round"
        class="circulo-progreso-activo"
        style="--color-progreso: {configuracionColor}"
      />
    </svg>
    
    <!-- Texto central -->
    {#if mostrarPorcentaje}
      <div class="texto-central" style="font-size: {configuracionTamano.texto}">
        <div class="porcentaje-numero">{Math.round(porcentaje)}</div>
        <div class="simbolo-porcentaje">%</div>
      </div>
    {/if}
  </div>
  
  <!-- Información adicional -->
  {#if estiloTexto === 'expandido'}
    <div class="info-progreso">
      <div class="titulo-progreso">{titulo}</div>
      {#if subtitulo}
        <div class="subtitulo-progreso">{subtitulo}</div>
      {/if}
    </div>
  {:else}
    <div class="info-compacta">
      <span class="titulo-compacto">{titulo}</span>
    </div>
  {/if}
</div>

<style>
  .contenedor-progreso-circular {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .contenedor-progreso-circular.expandido {
    gap: 1rem;
  }

  .circulo-progreso {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .svg-progreso {
    transform: rotate(-90deg);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .circulo-base {
    opacity: 0.2;
  }

  .circulo-progreso-activo {
    transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 0 4px var(--color-progreso));
  }

  .texto-central {
    position: absolute;
    display: flex;
    align-items: baseline;
    justify-content: center;
    font-weight: 800;
    color: #1e293b;
    line-height: 1;
  }

  .porcentaje-numero {
    font-size: 1em;
  }

  .simbolo-porcentaje {
    font-size: 0.6em;
    margin-left: 0.1em;
    opacity: 0.7;
  }

  .info-progreso {
    text-align: center;
  }

  .titulo-progreso {
    font-size: 1.1rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.25rem;
  }

  .subtitulo-progreso {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .info-compacta {
    text-align: center;
  }

  .titulo-compacto {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
  }

  /* Animación de entrada */
  .circulo-progreso-activo {
    animation: progreso-entrada 1.2s ease-out forwards;
  }

  @keyframes progreso-entrada {
    from {
      stroke-dashoffset: var(--circunferencia);
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Modo oscuro */
  @media (prefers-color-scheme: dark) {
    .circulo-base {
      stroke: #475569;
    }

    .texto-central {
      color: #f1f5f9;
    }

    .titulo-progreso {
      color: #e2e8f0;
    }

    .subtitulo-progreso,
    .titulo-compacto {
      color: #94a3b8;
    }
  }

  /* Responsive */
  @media (max-width: 640px) {
    .contenedor-progreso-circular {
      gap: 0.5rem;
    }

    .titulo-progreso {
      font-size: 1rem;
    }

    .subtitulo-progreso {
      font-size: 0.8rem;
    }
  }
</style> 