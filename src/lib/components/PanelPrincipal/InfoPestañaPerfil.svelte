<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  export let perfil: any = {};

  const dispatch = createEventDispatcher();
  let guardando = false;
  let listo = false;
  
  // -- Control de Secciones Colapsables --
  let seccionActiva = 'personal'; // 'personal' estará abierta por defecto

  function toggleSeccion(nombreSeccion: string) {
    if (seccionActiva === nombreSeccion) {
      seccionActiva = ''; // Cierra la sección si ya está activa
    } else {
      seccionActiva = nombreSeccion; // Abre la nueva sección
    }
  }
  // ------------------------------------

  let numeroWhatsapp = '';
  const paisesComunes = [
    { codigo: '+57', nombre: 'Colombia', bandera: '🇨🇴' },
    { codigo: '+58', nombre: 'Venezuela', bandera: '🇻🇪' },
    { codigo: '+507', nombre: 'Panamá', bandera: '🇵🇦' },
    { codigo: '+1', nombre: 'Estados Unidos', bandera: '🇺🇸' },
    { codigo: '+52', nombre: 'México', bandera: '🇲🇽' },
    { codigo: '+54', nombre: 'Argentina', bandera: '🇦🇷' },
    { codigo: '+34', nombre: 'España', bandera: '🇪🇸' }
  ];
  let indicativoSeleccionado = '+57';
  
  onMount(() => {
    listo = true;
    if (perfil.whatsapp) {
      const whatsapp = perfil.whatsapp.toString();
      for (const pais of paisesComunes) {
        if (whatsapp.startsWith(pais.codigo)) {
          indicativoSeleccionado = pais.codigo;
          numeroWhatsapp = whatsapp.substring(pais.codigo.length);
          break;
        }
      }
      if (!numeroWhatsapp) {
        numeroWhatsapp = whatsapp;
      }
    }
  });

  async function guardarPerfil() {
    guardando = true;
    
    try {
      if (numeroWhatsapp && indicativoSeleccionado) {
        perfil.whatsapp = indicativoSeleccionado + numeroWhatsapp;
      }
      if (perfil.nombre || perfil.apellido) {
        perfil.nombre_completo = `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim();
      }
      dispatch('actualizar', perfil);
    } catch (error) {
      console.error('Error al guardar perfil:', error);
    } finally {
      guardando = false;
    }
  }
</script>

{#if listo}
<div class="formulario-perfil" in:fly={{ y: 20, duration: 300 }}>
  <form on:submit|preventDefault={guardarPerfil}>
    
    <!-- SECCIÓN: Información Personal -->
    <div class="seccion-acordeon">
      <button type="button" class="header-seccion" on:click={() => toggleSeccion('personal')}>
        <div class="titulo-wrapper">
          <div class="icono-seccion">👤</div>
          <h2 class="titulo-seccion">Información Personal</h2>
        </div>
        <div class="icono-cheveron" class:rotado={seccionActiva === 'personal'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </button>
      
      {#if seccionActiva === 'personal'}
        <div class="contenido-seccion" transition:slide={{ duration: 300, easing: quintOut }}>
          <div class="grid-form grid-3-columnas">
            <div class="campo">
              <label for="nombre">Nombre</label>
              <input id="nombre" type="text" bind:value={perfil.nombre} placeholder="Tu nombre" class="input-principal"/>
            </div>
            <div class="campo">
              <label for="apellido">Apellido</label>
              <input id="apellido" type="text" bind:value={perfil.apellido} placeholder="Tu apellido" class="input-principal"/>
            </div>
            <div class="campo">
              <label for="nombre_usuario">Usuario</label>
              <input id="nombre_usuario" type="text" bind:value={perfil.nombre_usuario} placeholder="@usuario" class="input-principal"/>
            </div>
            <div class="campo campo-completo">
              <label for="biografia">Biografía</label>
              <textarea id="biografia" bind:value={perfil.biografia} placeholder="Cuéntanos sobre ti..." class="textarea-principal" rows="3"></textarea>
            </div>
            <div class="campo">
              <label for="fecha_nacimiento">Fecha de Nacimiento</label>
              <input id="fecha_nacimiento" type="date" bind:value={perfil.fecha_nacimiento} class="input-principal"/>
            </div>
            <div class="campo">
              <label for="profesion">Profesión</label>
              <input id="profesion" type="text" bind:value={perfil.profesion} placeholder="Tu profesión" class="input-principal"/>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- SECCIÓN: Ubicación y Contacto -->
    <div class="seccion-acordeon">
      <button type="button" class="header-seccion" on:click={() => toggleSeccion('ubicacion')}>
        <div class="titulo-wrapper">
          <div class="icono-seccion">📍</div>
          <h2 class="titulo-seccion">Ubicación y Contacto</h2>
        </div>
        <div class="icono-cheveron" class:rotado={seccionActiva === 'ubicacion'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </button>
      
      {#if seccionActiva === 'ubicacion'}
        <div class="contenido-seccion" transition:slide={{ duration: 300, easing: quintOut }}>
          <div class="grid-form grid-3-columnas">
            <div class="campo">
              <label for="pais">País</label>
              <input id="pais" type="text" bind:value={perfil.pais} placeholder="Tu país" class="input-principal"/>
            </div>
            <div class="campo">
              <label for="ciudad">Ciudad</label>
              <input id="ciudad" type="text" bind:value={perfil.ciudad} placeholder="Tu ciudad" class="input-principal"/>
            </div>
            <div class="campo">
              <label for="direccion">Dirección</label>
              <input id="direccion" type="text" bind:value={perfil.direccion_completa} placeholder="Dirección completa" class="input-principal"/>
            </div>
          </div>
          <div class="seccion-whatsapp">
            <label class="whatsapp-label"><span class="icono-whatsapp">📱</span> WhatsApp</label>
            <div class="whatsapp-container">
              <select bind:value={indicativoSeleccionado} class="select-indicativo">
                {#each paisesComunes as pais}
                  <option value={pais.codigo}>{pais.bandera} {pais.codigo}</option>
                {/each}
              </select>
              <input type="tel" bind:value={numeroWhatsapp} placeholder="Número de WhatsApp" class="input-whatsapp"/>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- SECCIÓN: Trayectoria Musical -->
    <div class="seccion-acordeon">
      <button type="button" class="header-seccion" on:click={() => toggleSeccion('trayectoria')}>
        <div class="titulo-wrapper">
          <div class="icono-seccion">🎵</div>
          <h2 class="titulo-seccion">Trayectoria Musical</h2>
        </div>
        <div class="icono-cheveron" class:rotado={seccionActiva === 'trayectoria'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </button>
      
      {#if seccionActiva === 'trayectoria'}
        <div class="contenido-seccion" transition:slide={{ duration: 300, easing: quintOut }}>
          <div class="grid-form grid-3-columnas">
            <div class="campo">
              <label for="instrumento">Instrumento</label>
              <select id="instrumento" bind:value={perfil.instrumento} class="input-principal">
                <option value="">Selecciona...</option>
                <option value="acordeon">Acordeón</option>
                <option value="caja">Caja</option>
                <option value="guacharaca">Guacharaca</option>
                <option value="bajo">Bajo</option>
                <option value="guitarra">Guitarra</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="campo">
              <label for="nivel_habilidad">Nivel</label>
              <select id="nivel_habilidad" bind:value={perfil.nivel_habilidad} class="input-principal">
                <option value="">Selecciona...</option>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
                <option value="experto">Experto</option>
              </select>
            </div>
            <div class="campo">
              <label for="ano_experiencia">Años Exp.</label>
              <input id="ano_experiencia" type="number" min="0" max="100" bind:value={perfil.ano_experiencia} placeholder="0" class="input-principal"/>
            </div>
            <div class="campo">
              <label for="estilo_favorito">Estilo Favorito</label>
              <input id="estilo_favorito" type="text" bind:value={perfil.estilo_favorito} placeholder="Ej: Vallenato" class="input-principal"/>
            </div>
            <div class="campo">
              <label for="estudios_musicales">Estudios</label>
              <input id="estudios_musicales" type="text" bind:value={perfil.estudios_musicales} placeholder="Ej: Autodidacta" class="input-principal"/>
            </div>
            <div class="campo">
              <label for="objetivo_aprendizaje">Objetivo</label>
              <input id="objetivo_aprendizaje" type="text" bind:value={perfil.objetivo_aprendizaje} placeholder="¿Qué quieres lograr?" class="input-principal"/>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- SECCIÓN: Información Adicional -->
    <div class="seccion-acordeon">
      <button type="button" class="header-seccion" on:click={() => toggleSeccion('adicional')}>
        <div class="titulo-wrapper">
          <div class="icono-seccion">📄</div>
          <h2 class="titulo-seccion">Información Adicional</h2>
        </div>
        <div class="icono-cheveron" class:rotado={seccionActiva === 'adicional'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </button>

      {#if seccionActiva === 'adicional'}
        <div class="contenido-seccion" transition:slide={{ duration: 300, easing: quintOut }}>
          <div class="grid-form grid-3-columnas">
            <div class="campo">
              <label for="documento_tipo">Tipo de Documento</label>
              <select id="documento_tipo" bind:value={perfil.documento_tipo} class="input-principal">
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="PP">Pasaporte</option>
              </select>
            </div>
            <div class="campo">
              <label for="documento_numero">Número de Documento</label>
              <input id="documento_numero" type="text" bind:value={perfil.documento_numero} placeholder="Número del documento" class="input-principal"/>
            </div>
            <div class="campo">
              <label for="como_nos_conocio">¿Cómo nos conociste?</label>
              <select id="como_nos_conocio" bind:value={perfil.como_nos_conocio} class="input-principal">
                <option value="">Selecciona una opción...</option>
                <option value="redes_sociales">Redes Sociales</option>
                <option value="youtube">YouTube</option>
                <option value="google">Google</option>
                <option value="recomendacion">Recomendación</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Botón Guardar -->
    <div class="acciones-form">
      <button type="submit" class="btn-guardar" disabled={guardando} class:guardando>
        {#if guardando}
          <div class="spinner"></div>
          Guardando...
        {:else}
          <span class="icono-guardar">💾</span>
          Guardar Cambios
        {/if}
      </button>
    </div>
  </form>
</div>
{/if}

<style>
  .formulario-perfil {
    max-width: 100%;
    margin: 0 ;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 24px;
    padding: 1rem;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(148, 163, 184, 0.1);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .seccion-acordeon {
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    transition: all 0.3s ease;
  }

  .header-seccion {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: transparent;
    border: none;
    padding: 1.25rem;
    cursor: pointer;
    text-align: left;
  }

  .titulo-wrapper {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .icono-seccion {
    font-size: 1.5rem;
    width: 2.75rem;
    height: 2.75rem;
    background: linear-gradient(135deg, #f0f2ff 0%, #e6e9ff 100%);
    color: #4f46e5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  .header-seccion:hover .icono-seccion {
    transform: scale(1.1);
  }

  .titulo-seccion {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }
  
  .icono-cheveron {
    color: #64748b;
    transition: transform 0.3s ease;
  }

  .icono-cheveron.rotado {
    transform: rotate(180deg);
  }
  
  .contenido-seccion {
    padding: 0 1.25rem 1.25rem 1.25rem;
    border-top: 1px solid #e2e8f0;
    overflow: hidden;
  }

  .grid-form {
    display: grid;
    gap: 1.5rem;
    padding-top: 1.25rem;
  }

  .grid-3-columnas {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .campo {
    display: flex;
    flex-direction: column;
  }

  .campo-completo {
    grid-column: 1 / -1;
  }

  .campo label {
    font-weight: 500;
    color: #475569;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .input-principal, .textarea-principal, .select-indicativo, .input-whatsapp {
    padding: 0.75rem 1rem;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    background: white;
  }

  .input-principal:focus, .textarea-principal:focus, .select-indicativo:focus, .input-whatsapp:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  .textarea-principal {
    resize: vertical;
    min-height: 80px;
  }

  .seccion-whatsapp {
    margin-top: 1rem;
  }

  .whatsapp-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: #475569;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }
  
  .icono-whatsapp { font-size: 1.1rem; }
  .whatsapp-container { display: flex; gap: 0.5rem; }
  .select-indicativo { flex: 0 0 130px; }
  .input-whatsapp { flex: 1; }

  .acciones-form {
    margin-top: 1rem;
    display: flex;
    justify-content: center;
  }

  .btn-guardar {
    background: linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%);
    color: white;
    border: none;
    padding: 1rem 2.5rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 8px 25px rgba(79, 70, 229, 0.3);
    min-width: 200px;
    justify-content: center;
  }

  .btn-guardar:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(79, 70, 229, 0.4);
  }

  .btn-guardar:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .icono-guardar { font-size: 1.1rem; }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .formulario-perfil {
      padding: 0.5rem;
    }
    .header-seccion {
      padding: 1rem;
    }
    .contenido-seccion {
      padding: 0 1rem 1rem 1rem;
    }
    .grid-3-columnas {
      grid-template-columns: 1fr;
    }
  }
</style>
