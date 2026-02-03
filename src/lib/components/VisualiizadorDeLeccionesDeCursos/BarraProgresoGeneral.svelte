<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { progresoLecciones } from '$lib/progresoLeccionesStore';

export let tipo: 'curso' | 'tutorial' = 'curso';
export let contenidoId: string = '';

// Variables de estado local
let completadas = 0;
let total = 0;
let progreso = 0;

// Variables reactivas al store global
$: datosProgreso = $progresoLecciones[contenidoId];
$: {
  if (datosProgreso) {
    completadas = datosProgreso.partes_completadas ?? 0;
    total = datosProgreso.total_partes ?? 0;
    progreso = datosProgreso.progreso ?? 0;
  }
}

// Subscripción manual como backup
let unsubscribe: (() => void) | null = null;

onMount(() => {
  // Subscripción manual al store
  unsubscribe = progresoLecciones.subscribe((store) => {
    const datos = store[contenidoId];
    if (datos) {
      completadas = datos.partes_completadas ?? 0;
      total = datos.total_partes ?? 0;
      progreso = datos.progreso ?? 0;
    }
  });
});

onDestroy(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<div class="barra-progreso-general">
  <div class="progreso-label">
    Progreso: {completadas} / {total} {tipo === 'curso' ? 'lecciones' : 'clases'} ({progreso}%)
  </div>
  <div class="progreso-barra">
    <div class="progreso-barra-interna" style="width: {progreso}%; transition: width 0.6s cubic-bezier(0.4,0,0.2,1);"></div>
    <div class="progreso-marcador">{progreso}%</div>
  </div>
</div>

<style>
.barra-progreso-general {
  margin: 12px 0;
}
.progreso-label {
  font-size: 1rem;
  margin-bottom: 4px;
  color: #ffffff;
}
.progreso-barra {
  width: 100%;
  height: 16px;
  background: #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}
.progreso-barra-interna {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #2196f3);
  width: 0%;
  transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
}
.progreso-marcador {
  position: absolute;
  right: 8px;
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  font-weight: bold;
  color: #f59e0b;
  text-shadow: 1px 1px 2px #fff, 0 0 2px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

/* Responsive para móvil */
@media (max-width: 768px) {
  .barra-progreso-general {
    margin: 2px 0;
  }
  
  .progreso-label {
    display: none;
  }
  
  .progreso-barra {
    height: 10px;
    border-radius: 5px;
  }
  
  .progreso-marcador {
    font-size: 0.7rem;
    right: 3px;
    color: #fbbf24;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
    font-weight: 600;
  }
}
</style>
