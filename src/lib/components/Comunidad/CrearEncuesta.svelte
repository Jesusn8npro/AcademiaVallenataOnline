<script lang="ts">
import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher<{
  guardarEncuesta: any;
  cancelar: void;
}>();

export let encuestaInicial: any = null;

// Estado de la encuesta
let preguntaEncuesta = encuestaInicial?.pregunta || encuestaInicial?.titulo || '';
let opciones: string[] = encuestaInicial?.opciones || ['', ''];
let fechaCierre = encuestaInicial?.fecha_cierre || '';
let permitirMultiplesRespuestas = encuestaInicial?.multiple || false;
let encuestaAnonima = encuestaInicial?.anonima || false;

// Validación y errores
let errores: string[] = [];

function agregarOpcion() {
  if (opciones.length < 10) {
    opciones = [...opciones, ''];
  }
}

function eliminarOpcion(index: number) {
  if (opciones.length > 2) {
    opciones = opciones.filter((_, i) => i !== index);
  }
}

function validarEncuesta(): boolean {
  errores = [];
  
  if (!preguntaEncuesta.trim()) {
    errores.push('La pregunta es obligatoria');
  }
  
  if (preguntaEncuesta.length > 200) {
    errores.push('La pregunta no puede tener más de 200 caracteres');
  }
  
  const opcionesValidas = opciones.filter(op => op.trim());
  if (opcionesValidas.length < 2) {
    errores.push('Debe haber al menos 2 opciones válidas');
  }
  
  if (opcionesValidas.some(op => op.length > 100)) {
    errores.push('Las opciones no pueden tener más de 100 caracteres');
  }
  
  if (fechaCierre && new Date(fechaCierre) <= new Date()) {
    errores.push('La fecha de cierre debe ser en el futuro');
  }
  
  return errores.length === 0;
}

function guardarEncuesta() {
  if (!validarEncuesta()) return;
  
  const opcionesLimpias = opciones.filter(op => op.trim()).map(op => op.trim());
  
  const datosEncuesta = {
    pregunta: preguntaEncuesta.trim(),
    titulo: preguntaEncuesta.trim(), // Compatibilidad
    opciones: opcionesLimpias,
    fecha_cierre: fechaCierre || null,
    multiple: permitirMultiplesRespuestas,
    anonima: encuestaAnonima,
    fecha_creacion: new Date().toISOString()
  };
  
  dispatch('guardarEncuesta', datosEncuesta);
}

function cancelar() {
  dispatch('cancelar');
}

// Calcular fecha mínima (hoy)
$: fechaMinima = new Date().toISOString().split('T')[0];

// Generar fecha por defecto (7 días)
$: fechaDefecto = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
</script>

<div class="modal-fondo" on:click={cancelar}>
  <div class="modal-contenedor" on:click|stopPropagation>
    <!-- Encabezado del modal -->
    <header class="encabezado-modal">
      <h2 class="titulo-modal">
        <svg class="icono-titulo" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
        </svg>
        Crear Encuesta
      </h2>
      <button class="boton-cerrar" on:click={cancelar} aria-label="Cerrar modal">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </header>

    <!-- Contenido del modal -->
    <div class="contenido-modal">
      <!-- Pregunta de la encuesta -->
      <div class="campo-formulario">
        <label for="pregunta" class="etiqueta-campo">
          <svg class="icono-campo" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h11c.55 0 1-.45 1-1z"/>
          </svg>
          Pregunta de la encuesta *
        </label>
        <textarea
          id="pregunta"
          bind:value={preguntaEncuesta}
          placeholder="¿Cuál es tu canción vallenata favorita?"
          class="input-textarea"
          maxlength="200"
          rows="3"
        ></textarea>
        <div class="contador-caracteres">
          {preguntaEncuesta.length}/200 caracteres
        </div>
      </div>

      <!-- Opciones de la encuesta -->
      <div class="campo-formulario">
        <label class="etiqueta-campo">
          <svg class="icono-campo" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
          </svg>
          Opciones de respuesta *
        </label>
        <div class="lista-opciones">
          {#each opciones as opcion, index}
            <div class="contenedor-opcion">
              <div class="numero-opcion">{index + 1}</div>
              <input
                type="text"
                bind:value={opcion}
                placeholder={`Opción ${index + 1}`}
                class="input-opcion"
                maxlength="100"
              />
              {#if opciones.length > 2}
                <button
                  type="button"
                  class="boton-eliminar-opcion"
                  on:click={() => eliminarOpcion(index)}
                  title="Eliminar opción"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              {/if}
            </div>
          {/each}
        </div>
        
        {#if opciones.length < 10}
          <button
            type="button"
            class="boton-agregar-opcion"
            on:click={agregarOpcion}
          >
            <svg class="icono-agregar" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Agregar opción
          </button>
        {/if}
      </div>

      <!-- Configuración avanzada -->
      <div class="campo-formulario">
        <label class="etiqueta-campo">
          <svg class="icono-campo" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
          Configuración avanzada
        </label>
        
        <div class="opciones-configuracion">
          <div class="opcion-configuracion">
            <input
              type="checkbox"
              id="fecha-cierre"
              bind:checked={fechaCierre}
                             on:change={(e) => {
                 const target = e.target as HTMLInputElement;
                 if (target?.checked) {
                   fechaCierre = fechaDefecto;
                 } else {
                   fechaCierre = '';
                 }
               }}
            />
            <label for="fecha-cierre" class="etiqueta-checkbox">
              Establecer fecha de cierre
            </label>
          </div>
          
          {#if fechaCierre}
            <div class="campo-fecha">
              <input
                type="date"
                bind:value={fechaCierre}
                min={fechaMinima}
                class="input-fecha"
              />
            </div>
          {/if}
          
          <div class="opcion-configuracion">
            <input
              type="checkbox"
              id="multiples-respuestas"
              bind:checked={permitirMultiplesRespuestas}
            />
            <label for="multiples-respuestas" class="etiqueta-checkbox">
              Permitir múltiples respuestas (próximamente)
            </label>
          </div>
          
          <div class="opcion-configuracion">
            <input
              type="checkbox"
              id="encuesta-anonima"
              bind:checked={encuestaAnonima}
            />
            <label for="encuesta-anonima" class="etiqueta-checkbox">
              Encuesta anónima (próximamente)
            </label>
          </div>
        </div>
      </div>

      <!-- Errores de validación -->
      {#if errores.length > 0}
        <div class="contenedor-errores">
          <div class="icono-error">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z"/>
            </svg>
          </div>
          <div class="lista-errores">
            {#each errores as error}
              <p class="mensaje-error">{error}</p>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer del modal -->
    <footer class="footer-modal">
      <button
        type="button"
        class="boton-secundario"
        on:click={cancelar}
      >
        Cancelar
      </button>
      <button
        type="button"
        class="boton-primario"
        on:click={guardarEncuesta}
        disabled={!preguntaEncuesta.trim() || opciones.filter(op => op.trim()).length < 2}
      >
        <svg class="icono-boton" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Crear Encuesta
      </button>
    </footer>
  </div>
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
    --sombra-modal: 0 20px 60px rgba(0, 0, 0, 0.25);
    --transicion-suave: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Modal */
  .modal-fondo {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
    animation: aparecerFondo 0.3s ease-out;
  }

  @keyframes aparecerFondo {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal-contenedor {
    background: var(--color-fondo);
    border-radius: var(--radio-borde);
    box-shadow: var(--sombra-modal);
    width: 95%;
    max-width: 520px;
    max-height: 85vh;
    overflow-y: auto;
    scroll-behavior: smooth;
    animation: aparecerModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes aparecerModal {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Encabezado */
  .encabezado-modal {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-borde);
  }

  .titulo-modal {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-texto-principal);
  }

  .icono-titulo {
    width: 28px;
    height: 28px;
    color: var(--color-primario);
  }

  .boton-cerrar {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    color: var(--color-texto-secundario);
    transition: var(--transicion-suave);
  }

  .boton-cerrar:hover {
    background: var(--color-hover);
    color: var(--color-texto-principal);
  }

  .boton-cerrar svg {
    width: 24px;
    height: 24px;
  }

  /* Contenido */
  .contenido-modal {
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .campo-formulario {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .etiqueta-campo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--color-texto-principal);
    font-size: 0.95rem;
  }

  .icono-campo {
    width: 20px;
    height: 20px;
    color: var(--color-primario);
    flex-shrink: 0;
  }

  /* Inputs */
  .input-textarea {
    width: 100%;
    padding: 0.875rem;
    border: 2px solid var(--color-borde);
    border-radius: var(--radio-borde);
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    min-height: 60px;
    transition: var(--transicion-suave);
  }

  .input-textarea:focus {
    outline: none;
    border-color: var(--color-primario);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .contador-caracteres {
    font-size: 0.8rem;
    color: var(--color-texto-secundario);
    text-align: right;
  }

  /* Lista de opciones */
  .lista-opciones {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .contenedor-opcion {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .numero-opcion {
    background: linear-gradient(135deg, var(--color-primario), var(--color-secundario));
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    flex-shrink: 0;
  }

  .input-opcion {
    flex: 1;
    padding: 0.875rem 1rem;
    border: 2px solid var(--color-borde);
    border-radius: var(--radio-borde);
    font-size: 1rem;
    transition: var(--transicion-suave);
  }

  .input-opcion:focus {
    outline: none;
    border-color: var(--color-primario);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .boton-eliminar-opcion {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    color: var(--color-error);
    transition: var(--transicion-suave);
  }

  .boton-eliminar-opcion:hover {
    background: rgba(245, 101, 101, 0.1);
  }

  .boton-eliminar-opcion svg {
    width: 20px;
    height: 20px;
  }

  .boton-agregar-opcion {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--color-hover);
    border: 2px dashed var(--color-borde);
    border-radius: var(--radio-borde);
    color: var(--color-texto-secundario);
    font-weight: 600;
    cursor: pointer;
    transition: var(--transicion-suave);
    width: 100%;
    justify-content: center;
  }

  .boton-agregar-opcion:hover {
    border-color: var(--color-primario);
    background: rgba(102, 126, 234, 0.05);
    color: var(--color-primario);
  }

  .icono-agregar {
    width: 20px;
    height: 20px;
  }

  /* Configuración avanzada */
  .opciones-configuracion {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    padding: 0.875rem 1rem;
    background: var(--color-hover);
    border-radius: var(--radio-borde);
  }

  .opcion-configuracion {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .opcion-configuracion input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .etiqueta-checkbox {
    font-weight: 500;
    color: var(--color-texto-principal);
    cursor: pointer;
    font-size: 0.95rem;
  }

  .campo-fecha {
    margin-left: 2.25rem;
    margin-top: 0.5rem;
  }

  .input-fecha {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-borde);
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
  }

  /* Errores */
  .contenedor-errores {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(245, 101, 101, 0.1);
    border: 1px solid rgba(245, 101, 101, 0.3);
    border-radius: var(--radio-borde);
    color: var(--color-error);
  }

  .icono-error {
    flex-shrink: 0;
  }

  .icono-error svg {
    width: 24px;
    height: 24px;
  }

  .lista-errores {
    flex: 1;
  }

  .mensaje-error {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .mensaje-error:not(:last-child) {
    margin-bottom: 0.5rem;
  }

  /* Footer */
  .footer-modal {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    border-top: 1px solid var(--color-borde);
    background: var(--color-hover);
  }

  .boton-secundario,
  .boton-primario {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radio-borde);
    font-weight: 600;
    cursor: pointer;
    transition: var(--transicion-suave);
    border: none;
    font-size: 0.95rem;
  }

  .boton-secundario {
    background: var(--color-fondo);
    color: var(--color-texto-secundario);
    border: 2px solid var(--color-borde);
  }

  .boton-secundario:hover {
    background: var(--color-hover);
    border-color: var(--color-texto-secundario);
  }

  .boton-primario {
    background: linear-gradient(135deg, var(--color-primario), var(--color-secundario));
    color: white;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .boton-primario:hover:not(:disabled) {
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    transform: translateY(-2px);
  }

  .boton-primario:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .icono-boton {
    width: 18px;
    height: 18px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .modal-fondo {
      padding: 0.75rem 1.25rem 0.75rem 0.75rem;
    }

    .modal-contenedor {
      width: 100%;
      max-width: none;
      max-height: 90vh;
      margin: 0;
    }

    .encabezado-modal {
      padding: 0.875rem 1rem;
    }

    .contenido-modal {
      padding: 0.875rem 1rem;
      gap: 0.875rem;
    }

    .footer-modal {
      padding: 0.875rem 1rem;
      flex-direction: row;
      gap: 0.75rem;
    }

    .titulo-modal {
      font-size: 1.25rem;
    }

    .icono-titulo {
      width: 24px;
      height: 24px;
    }

    .contenedor-opcion {
      flex-direction: row;
      align-items: center;
      gap: 0.75rem;
    }

    .numero-opcion {
      width: 28px;
      height: 28px;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .boton-secundario,
    .boton-primario {
      flex: 1;
      justify-content: center;
      padding: 0.75rem 0.5rem;
      font-size: 0.9rem;
    }

    .opciones-configuracion {
      padding: 0.65rem 0.75rem;
      gap: 0.65rem;
      display: grid;
      grid-template-columns: 1fr;
    }

    .opcion-configuracion {
      gap: 0.4rem;
    }

    .etiqueta-checkbox {
      font-size: 0.9rem;
      line-height: 1.3;
    }
  }

  @media (max-width: 480px) {
    .modal-fondo {
      padding: 0.5rem 1rem 0.5rem 0.5rem;
    }

    .encabezado-modal {
      padding: 0.75rem 0.875rem;
    }

    .contenido-modal {
      padding: 0.75rem 0.875rem;
      gap: 0.75rem;
    }

    .footer-modal {
      padding: 0.75rem 0.875rem;
    }

    .titulo-modal {
      font-size: 1.125rem;
    }

    .campo-formulario {
      gap: 0.5rem;
    }

    .lista-opciones {
      gap: 0.65rem;
    }

    .boton-agregar-opcion {
      padding: 0.6rem 0.75rem;
      font-size: 0.85rem;
    }

    .input-textarea {
      min-height: 50px;
      padding: 0.75rem;
      font-size: 0.95rem;
    }

    .input-opcion {
      padding: 0.75rem;
      font-size: 0.95rem;
    }

    .contenedor-opcion {
      gap: 0.5rem;
    }

    .numero-opcion {
      width: 26px;
      height: 26px;
      font-size: 0.75rem;
    }

    .opciones-configuracion {
      padding: 0.5rem 0.65rem;
      gap: 0.5rem;
    }

    .opcion-configuracion {
      gap: 0.35rem;
    }

    .etiqueta-checkbox {
      font-size: 0.8rem;
      line-height: 1.2;
    }

    .opcion-configuracion input[type="checkbox"] {
      width: 14px;
      height: 14px;
    }

    .campo-fecha {
      margin-left: 1.5rem;
      margin-top: 0.4rem;
    }

    .input-fecha {
      padding: 0.6rem 0.75rem;
      font-size: 0.9rem;
      width: 100%;
      max-width: 180px;
    }

    .boton-secundario,
    .boton-primario {
      padding: 0.65rem 0.4rem;
      font-size: 0.85rem;
    }
  }

</style> 