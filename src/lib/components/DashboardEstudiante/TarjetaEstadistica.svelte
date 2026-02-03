<script lang="ts">
  export let icono: string = '📚';
  export let valor: string | number = 0;
  export let titulo: string = 'Estadística';
  export let descripcion: string = '';
  export let color: 'azul' | 'verde' | 'naranja' | 'purpura' | 'rojo' | 'amarillo' = 'azul';
  export let tendencia: 'subiendo' | 'bajando' | 'neutro' | undefined = undefined;
  export let porcentajeCambio: number | undefined = undefined;

  const coloresDisponibles = {
    azul: 'from-blue-500 to-blue-600',
    verde: 'from-green-500 to-green-600', 
    naranja: 'from-orange-500 to-orange-600',
    purpura: 'from-purple-500 to-purple-600',
    rojo: 'from-red-500 to-red-600',
    amarillo: 'from-yellow-500 to-yellow-600'
  };

  $: gradienteColor = coloresDisponibles[color];
</script>

<div class="tarjeta-estadistica">
  <div class="contenedor-icono bg-gradient-to-br {gradienteColor}">
    <span class="icono-estadistica">{icono}</span>
  </div>
  
  <div class="contenido-estadistica">
    <div class="valor-principal">{valor}</div>
    <div class="titulo-estadistica">{titulo}</div>
    {#if descripcion}
      <div class="descripcion-estadistica">{descripcion}</div>
    {/if}
    
    {#if tendencia && porcentajeCambio !== undefined}
      <div class="tendencia {tendencia}">
        <span class="icono-tendencia">
          {#if tendencia === 'subiendo'}▲{:else if tendencia === 'bajando'}▼{:else}●{/if}
        </span>
        <span>{Math.abs(porcentajeCambio)}%</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .tarjeta-estadistica {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .tarjeta-estadistica:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  .contenedor-icono {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .icono-estadistica {
    font-size: 1.75rem;
  }

  .contenido-estadistica {
    flex: 1;
  }

  .valor-principal {
    font-size: 2rem;
    font-weight: 800;
    color: #1e293b;
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .titulo-estadistica {
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
  }

  .descripcion-estadistica {
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .tendencia {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: 0.5rem;
  }

  .tendencia.subiendo {
    color: #059669;
  }

  .tendencia.bajando {
    color: #dc2626;
  }

  .tendencia.neutro {
    color: #6b7280;
  }

  .icono-tendencia {
    font-size: 0.6rem;
  }

  /* Modo oscuro */
  @media (prefers-color-scheme: dark) {
    .tarjeta-estadistica {
      background: #1e293b;
      border-color: #334155;
    }

    .valor-principal {
      color: #f1f5f9;
    }

    .titulo-estadistica {
      color: #94a3b8;
    }

    .descripcion-estadistica {
      color: #64748b;
    }
  }

  /* Responsive */
  @media (max-width: 640px) {
    .tarjeta-estadistica {
      padding: 1rem;
    }

    .contenedor-icono {
      width: 50px;
      height: 50px;
    }

    .icono-estadistica {
      font-size: 1.5rem;
    }

    .valor-principal {
      font-size: 1.5rem;
    }

    .titulo-estadistica {
      font-size: 0.8rem;
    }
  }
</style> 