<script lang="ts">
import { onMount } from 'svelte';
import { supabase } from '$lib/supabase/clienteSupabase';

export let publicacionId: string;
export let encuesta: any;
export let usuario: any;

interface OpcionEncuesta {
  texto: string;
  votos: number;
  porcentaje: number;
}

let opciones: OpcionEncuesta[] = [];
let totalVotos = 0;
let votoUsuario: string | null = null;
let cargandoVoto = false;
let errorVotacion = '';
let yaVoto = false;

// Cargar datos de la encuesta y votos
onMount(async () => {
  await cargarDatosEncuesta();
  await verificarVotoUsuario();
});

async function cargarDatosEncuesta() {
  if (!encuesta || !encuesta.opciones) return;

  try {
    // Obtener votos por opción
    const { data: votos, error } = await supabase
      .from('comunidad_encuesta_votos')
      .select('opcion')
      .eq('publicacion_id', publicacionId);

    if (error) {
      console.error('Error al cargar votos:', error);
      return;
    }

    // Contar votos por opción
    const conteoVotos: Record<string, number> = {};
    votos?.forEach((voto: { opcion: string }) => {
      conteoVotos[voto.opcion] = (conteoVotos[voto.opcion] || 0) + 1;
    });

    totalVotos = votos?.length || 0;

    // Preparar opciones con porcentajes
    opciones = encuesta.opciones.map((opcion: string) => {
      const votosOpcion = conteoVotos[opcion] || 0;
      const porcentaje = totalVotos > 0 ? (votosOpcion / totalVotos) * 100 : 0;
      
      return {
        texto: opcion,
        votos: votosOpcion,
        porcentaje: Math.round(porcentaje * 10) / 10
      };
    });
  } catch (error) {
    console.error('Error al procesar encuesta:', error);
  }
}

async function verificarVotoUsuario() {
  if (!usuario?.id) return;

  try {
    const { data: votoExistente, error } = await supabase
      .from('comunidad_encuesta_votos')
      .select('opcion')
      .eq('publicacion_id', publicacionId)
      .eq('usuario_id', usuario.id)
      .single();

    if (!error && votoExistente) {
      votoUsuario = votoExistente.opcion;
      yaVoto = true;
    }
  } catch (error) {
    // Usuario no ha votado aún
  }
}

async function votar(opcion: string) {
  if (!usuario?.id || cargandoVoto || yaVoto) return;

  cargandoVoto = true;
  errorVotacion = '';

  try {
    const { error } = await supabase
      .from('comunidad_encuesta_votos')
      .insert({
        publicacion_id: publicacionId,
        usuario_id: usuario.id,
        opcion: opcion,
        fecha_voto: new Date().toISOString()
      });

    if (error) {
      errorVotacion = 'Error al registrar tu voto. Inténtalo de nuevo.';
      console.error('Error al votar:', error);
    } else {
      votoUsuario = opcion;
      yaVoto = true;
      await cargarDatosEncuesta(); // Actualizar conteos
    }
  } catch (error) {
    errorVotacion = 'Error de conexión. Inténtalo de nuevo.';
    console.error('Error al votar:', error);
  }

  cargandoVoto = false;
}

function obtenerColorOpcion(index: number): string {
  const colores = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  ];
  return colores[index % colores.length];
}

function obtenerColorTexto(index: number): string {
  const coloresTexto = [
    '#667eea',
    '#f5576c', 
    '#00f2fe',
    '#38f9d7',
    '#fa709a',
    '#a8edea'
  ];
  return coloresTexto[index % coloresTexto.length];
}

$: encuestaTitulo = encuesta?.pregunta || encuesta?.titulo || 'Encuesta';
$: tiempoRestante = encuesta?.fecha_cierre ? calcularTiempoRestante(encuesta.fecha_cierre) : null;
$: encuestaCerrada = tiempoRestante === 0;

function calcularTiempoRestante(fechaCierre: string): number | null {
  if (!fechaCierre) return null;
  const ahora = new Date().getTime();
  const cierre = new Date(fechaCierre).getTime();
  return Math.max(0, Math.floor((cierre - ahora) / (1000 * 60 * 60 * 24)));
}

function formatearTiempoRestante(dias: number | null): string {
  if (dias === null) return '';
  if (dias === 0) return 'Encuesta cerrada';
  if (dias === 1) return '1 día restante';
  return `${dias} días restantes`;
}
</script>

<div class="contenedor-encuesta">
  <!-- Encabezado de la encuesta -->
  <header class="encabezado-encuesta">
    <div class="info-encuesta">
      <h3 class="titulo-encuesta">
        <svg class="icono-encuesta" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
        </svg>
        {encuestaTitulo}
      </h3>
      {#if tiempoRestante !== null}
        <div class="tiempo-restante" class:cerrada={encuestaCerrada}>
          <svg class="icono-reloj" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
            <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          <span>{formatearTiempoRestante(tiempoRestante)}</span>
        </div>
      {/if}
    </div>
    
    <div class="estadisticas-encuesta">
      <div class="total-votos">
        <span class="numero-votos">{totalVotos}</span>
        <span class="texto-votos">{totalVotos === 1 ? 'voto' : 'votos'}</span>
      </div>
    </div>
  </header>

  <!-- Opciones de la encuesta -->
  <div class="lista-opciones">
    {#each opciones as opcion, index}
      <div class="contenedor-opcion">
        <button
          class="opcion-encuesta"
          class:votada={votoUsuario === opcion.texto}
          class:deshabilitada={yaVoto || encuestaCerrada}
          disabled={cargandoVoto || yaVoto || encuestaCerrada}
          on:click={() => votar(opcion.texto)}
          style="--color-opcion: {obtenerColorTexto(index)}"
        >
          <!-- Barra de progreso -->
          {#if yaVoto || encuestaCerrada}
            <div 
              class="barra-progreso" 
              style="width: {opcion.porcentaje}%; background: {obtenerColorOpcion(index)}"
            ></div>
          {/if}
          
          <!-- Contenido de la opción -->
          <div class="contenido-opcion">
            <div class="texto-opcion">
              {opcion.texto}
              {#if votoUsuario === opcion.texto}
                <svg class="icono-check" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              {/if}
            </div>
            
            {#if yaVoto || encuestaCerrada}
              <div class="resultados-opcion">
                <span class="porcentaje">{opcion.porcentaje}%</span>
                <span class="votos-opcion">({opcion.votos})</span>
              </div>
            {/if}
            
            {#if cargandoVoto}
              <div class="spinner-voto"></div>
            {/if}
          </div>
        </button>
      </div>
    {/each}
  </div>

  <!-- Estado de la encuesta -->
  {#if yaVoto && !encuestaCerrada}
    <div class="mensaje-estado exito">
      <svg class="icono-mensaje" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <span>¡Gracias por participar! Tu voto ha sido registrado.</span>
    </div>
  {/if}

  {#if encuestaCerrada}
    <div class="mensaje-estado cerrada">
      <svg class="icono-mensaje" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM12 13.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"/>
      </svg>
      <span>Esta encuesta ha finalizado. Resultados finales mostrados.</span>
    </div>
  {/if}

  {#if !yaVoto && !encuestaCerrada}
    <div class="mensaje-estado info">
      <svg class="icono-mensaje" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
      </svg>
      <span>Selecciona una opción para ver los resultados de la encuesta.</span>
    </div>
  {/if}

  <!-- Error de votación -->
  {#if errorVotacion}
    <div class="mensaje-estado error">
      <svg class="icono-mensaje" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z"/>
      </svg>
      <span>{errorVotacion}</span>
      <button class="boton-reintentar" on:click={() => errorVotacion = ''}>
        Cerrar
      </button>
    </div>
  {/if}
</div>

<style>
  /* Variables CSS */
  :root {
    --color-primario: #667eea;
    --color-secundario: #764ba2;
    --color-texto-principal: #1a202c;
    --color-texto-secundario: #718096;
    --color-fondo: #ffffff;
    --color-borde: #e2e8f0;
    --color-hover: #f7fafc;
    --color-exito: #48bb78;
    --color-error: #f56565;
    --color-advertencia: #ed8936;
    --color-info: #3182ce;
    --radio-borde: 12px;
    --sombra-sutil: 0 2px 8px rgba(0, 0, 0, 0.08);
    --sombra-hover: 0 4px 16px rgba(0, 0, 0, 0.12);
    --transicion-suave: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transicion-rapida: all 0.15s ease-out;
  }

  /* Contenedor principal */
  .contenedor-encuesta {
    background: var(--color-fondo);
    border: 2px solid var(--color-borde);
    border-radius: var(--radio-borde);
    padding: 1.5rem;
    margin: 1rem 0;
    box-shadow: var(--sombra-sutil);
    transition: var(--transicion-suave);
  }

  .contenedor-encuesta:hover {
    box-shadow: var(--sombra-hover);
    border-color: var(--color-primario);
  }

  /* Encabezado */
  .encabezado-encuesta {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-borde);
  }

  .info-encuesta {
    flex: 1;
  }

  .titulo-encuesta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-texto-principal);
    line-height: 1.3;
  }

  .icono-encuesta {
    width: 24px;
    height: 24px;
    color: var(--color-primario);
    flex-shrink: 0;
  }

  .tiempo-restante {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.85rem;
    color: var(--color-info);
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    background: rgba(49, 130, 206, 0.1);
    border-radius: 16px;
    width: fit-content;
  }

  .tiempo-restante.cerrada {
    color: var(--color-error);
    background: rgba(245, 101, 101, 0.1);
  }

  .icono-reloj {
    width: 14px;
    height: 14px;
  }

  .estadisticas-encuesta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
  }

  .total-votos {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, var(--color-primario), var(--color-secundario));
    color: white;
    border-radius: var(--radio-borde);
    box-shadow: var(--sombra-sutil);
    min-width: 80px;
  }

  .numero-votos {
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1;
  }

  .texto-votos {
    font-size: 0.75rem;
    font-weight: 600;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Lista de opciones */
  .lista-opciones {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .contenedor-opcion {
    position: relative;
  }

  .opcion-encuesta {
    width: 100%;
    position: relative;
    background: var(--color-fondo);
    border: 2px solid var(--color-borde);
    border-radius: var(--radio-borde);
    padding: 1rem 1.25rem;
    cursor: pointer;
    transition: var(--transicion-suave);
    overflow: hidden;
    font-size: 1rem;
    text-align: left;
  }

  .opcion-encuesta:not(.deshabilitada):hover {
    border-color: var(--color-opcion);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .opcion-encuesta.votada {
    border-color: var(--color-opcion);
    background: rgba(102, 126, 234, 0.03);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  }

  .opcion-encuesta.deshabilitada {
    cursor: default;
  }

  .opcion-encuesta:disabled {
    cursor: not-allowed;
  }

  /* Barra de progreso */
  .barra-progreso {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: var(--radio-borde);
    opacity: 0.1;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;
  }

  /* Contenido de la opción */
  .contenido-opcion {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .texto-opcion {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--color-texto-principal);
    flex: 1;
    line-height: 1.4;
  }

  .icono-check {
    width: 18px;
    height: 18px;
    color: var(--color-exito);
    flex-shrink: 0;
  }

  .resultados-opcion {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    color: var(--color-opcion);
  }

  .porcentaje {
    font-size: 1.1rem;
  }

  .votos-opcion {
    font-size: 0.9rem;
    opacity: 0.8;
  }

  /* Spinner de votación */
  .spinner-voto {
    width: 20px;
    height: 20px;
    border: 2px solid var(--color-borde);
    border-top: 2px solid var(--color-primario);
    border-radius: 50%;
    animation: girar 1s linear infinite;
  }

  @keyframes girar {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Mensajes de estado */
  .mensaje-estado {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: var(--radio-borde);
    font-size: 0.9rem;
    font-weight: 600;
    margin-top: 1rem;
    animation: aparecerMensaje 0.4s ease-out;
  }

  @keyframes aparecerMensaje {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .mensaje-estado.exito {
    background: rgba(72, 187, 120, 0.1);
    color: var(--color-exito);
    border: 1px solid rgba(72, 187, 120, 0.3);
  }

  .mensaje-estado.error {
    background: rgba(245, 101, 101, 0.1);
    color: var(--color-error);
    border: 1px solid rgba(245, 101, 101, 0.3);
  }

  .mensaje-estado.info {
    background: rgba(49, 130, 206, 0.1);
    color: var(--color-info);
    border: 1px solid rgba(49, 130, 206, 0.3);
  }

  .mensaje-estado.cerrada {
    background: rgba(237, 137, 54, 0.1);
    color: var(--color-advertencia);
    border: 1px solid rgba(237, 137, 54, 0.3);
  }

  .icono-mensaje {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  .boton-reintentar {
    background: none;
    border: none;
    color: var(--color-error);
    font-weight: 700;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    transition: var(--transicion-rapida);
    margin-left: auto;
  }

  .boton-reintentar:hover {
    background: rgba(245, 101, 101, 0.2);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .contenedor-encuesta {
      padding: 1rem;
      margin: 0.75rem 0;
    }

    .encabezado-encuesta {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .estadisticas-encuesta {
      align-items: flex-start;
    }

    .total-votos {
      flex-direction: row;
      gap: 0.5rem;
      align-items: center;
      min-width: auto;
      width: fit-content;
    }

    .numero-votos {
      font-size: 1.25rem;
    }

    .titulo-encuesta {
      font-size: 1.1rem;
    }

    .opcion-encuesta {
      padding: 0.875rem 1rem;
    }

    .contenido-opcion {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .resultados-opcion {
      align-self: flex-end;
    }
  }

  @media (max-width: 480px) {
    .contenedor-encuesta {
      padding: 0.875rem;
    }

    .titulo-encuesta {
      font-size: 1rem;
    }

    .tiempo-restante {
      font-size: 0.8rem;
    }

    .opcion-encuesta {
      padding: 0.75rem;
    }

    .mensaje-estado {
      padding: 0.75rem;
      font-size: 0.85rem;
    }
  }

  /* Mejoras de accesibilidad */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Tema oscuro */
  @media (prefers-color-scheme: dark) {
    :root {
      --color-texto-principal: #f7fafc;
      --color-texto-secundario: #a0aec0;
      --color-fondo: #2d3748;
      --color-borde: #4a5568;
      --color-hover: #4a5568;
    }
  }
</style> 