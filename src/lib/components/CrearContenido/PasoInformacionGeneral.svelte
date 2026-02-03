<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import GestorLista from './GestorLista.svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';

  export let tipo: 'tutorial' | 'curso' = 'tutorial';
  export let datos: any = {};

  const dispatch = createEventDispatcher();

  let titulo = datos.titulo || '';
  let descripcion = datos.descripcion || '';
  let nivel = datos.nivel || 'principiante';
  let estado = datos.estado || 'borrador';
  let es_destacado = datos.es_destacado || datos.destacado || false;

  // Variables para manejo de imagen
  let imagen_url = datos.imagen_url || '';
  let tipoSubida: 'url' | 'archivo' = 'url';
  let archivoSeleccionado: File | null = null;
  let inputArchivo: HTMLInputElement;
  let subiendoImagen = false;
  let progresoSubida = 0;
  let errorSubida = '';
  let imagenError = false;
  let tipo_acceso = datos.tipo_acceso || 'gratuito';
  let precio_normal = datos.precio_normal || datos.precio || '';
  let precio_rebajado = datos.precio_rebajado || datos.precio_descuento || '';
  let fecha_expiracion = datos.fecha_expiracion || '';

  // Nuevos campos comunes
  let descripcion_corta = datos.descripcion_corta || '';
  let categoria = datos.categoria || 'Acordeón';
  let plantilla_vista = datos.plantilla_vista || 'clasica';

  // Específicos para cursos - Manejo tanto arrays (nuevos) como strings (legados)
  let requisitos_curso = Array.isArray(datos.requisitos) 
    ? datos.requisitos 
    : (datos.requisitos && typeof datos.requisitos === 'string' 
        ? datos.requisitos.split('\n').filter((r: string) => r.trim()) 
        : []);
  let objetivos_curso = Array.isArray(datos.objetivos) 
    ? datos.objetivos 
    : (datos.objetivos && typeof datos.objetivos === 'string'
        ? datos.objetivos.split('\n').filter((o: string) => o.trim()) 
        : []);
  let duracion_estimada = datos.duracion_estimada || 0;
  let con_modulos = datos.con_modulos ?? true;

  // Específicos para tutoriales
  let requisitos_tutorial = datos.requisitos || '';
  let objetivos_tutorial = datos.objetivos || '';
  let acordeonista = datos.acordeonista || '';
  let video_url = datos.video_url || '';
  let artista = datos.artista || '';
  let tonalidad = datos.tonalidad || '';

  // Función para manejar subida de archivos
  async function manejarSubidaArchivo(event: Event) {
    const target = event.target as HTMLInputElement;
    const archivo = target.files?.[0];
    
    if (!archivo) return;

    // Validar tipo de archivo
    if (!archivo.type.startsWith('image/')) {
      errorSubida = 'Solo se permiten archivos de imagen';
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (archivo.size > 5 * 1024 * 1024) {
      errorSubida = 'El archivo no puede superar los 5MB';
      return;
    }

    archivoSeleccionado = archivo;
    subiendoImagen = true;
    progresoSubida = 0;
    errorSubida = '';

    try {
      // Generar nombre único para el archivo
      const extension = archivo.name.split('.').pop();
      const nombreArchivo = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
      const rutaArchivo = `imagenes-contenido/${nombreArchivo}`;

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('imagenes')
        .upload(rutaArchivo, archivo, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('imagenes')
        .getPublicUrl(rutaArchivo);

      imagen_url = urlData.publicUrl;
      progresoSubida = 100;
      
      setTimeout(() => {
        subiendoImagen = false;
        progresoSubida = 0;
      }, 1000);

    } catch (error: any) {
      console.error('Error subiendo imagen:', error);
      errorSubida = error.message || 'Error al subir la imagen';
      subiendoImagen = false;
      progresoSubida = 0;
    }
  }

  function continuar() {
    const datosCompletos = {
      titulo,
      descripcion,
      nivel,
      estado,
      ...(tipo === 'curso' ? { es_destacado } : { destacado: es_destacado }),
      tipo_acceso,
      precio_normal: tipo_acceso === 'pago' ? precio_normal : '',
      precio_rebajado: tipo_acceso === 'pago' ? precio_rebajado : '',
      fecha_expiracion: tipo_acceso === 'pago' ? fecha_expiracion : '',
      descripcion_corta,
      categoria,
      plantilla_vista,
      imagen_url,
      ...(tipo === 'curso' && { 
        requisitos: requisitos_curso,
        objetivos: objetivos_curso,
        duracion_estimada,
        con_modulos
      }),
      ...(tipo === 'tutorial' && { 
        artista, 
        tonalidad,
        acordeonista,
        video_url,
        requisitos: requisitos_tutorial,
        objetivos: objetivos_tutorial
      })
    };

    dispatch('continuar', datosCompletos);
  }
</script>

<div class="formulario-contenedor">
  <div class="contenido-formulario">
    <h2 class="titulo-seccion">
      <span class="icono-titulo">🎓</span>
      Información General del {tipo === 'curso' ? 'Curso' : 'Tutorial'}
    </h2>
    <p class="descripcion-seccion">Completa los datos básicos de tu {tipo} para comenzar</p>

    <div class="grid-formulario">
      <!-- Sección 1: Información Básica -->
      <div class="seccion-formulario">
        <h3 class="subtitulo-seccion">
          <span class="numero-seccion">1</span>
          Información Básica
        </h3>
        
        <div class="campo-formulario campo-completo">
          <label class="etiqueta-campo">
            <span class="texto-etiqueta">Título del {tipo}</span>
            <span class="descripcion-campo">Escribe un título claro y descriptivo</span>
          </label>
          <input 
            type="text" 
            bind:value={titulo} 
            class="input-destacado"
            placeholder="Ej: Aprende acordeón desde cero"
            maxlength="100"
          />
          <div class="contador-caracteres">{titulo.length}/100</div>
        </div>

        <div class="campo-formulario campo-completo">
          <label class="etiqueta-campo">
            <span class="texto-etiqueta">Descripción</span>
            <span class="descripcion-campo">Describe qué aprenderán los estudiantes</span>
          </label>
          <textarea 
            bind:value={descripcion} 
            class="textarea-moderno"
            placeholder="Explica los objetivos y beneficios de tu {tipo}..."
            rows="4"
            maxlength="500"
          ></textarea>
          <div class="contador-caracteres">{descripcion.length}/500</div>
        </div>

        <div class="campo-formulario campo-completo">
          <label class="etiqueta-campo">
            <span class="texto-etiqueta">Descripción Corta</span>
            <span class="descripcion-campo">Un resumen rápido para vistas previas y SEO.</span>
          </label>
          <input 
            type="text" 
            bind:value={descripcion_corta} 
            class="input-moderno"
            placeholder="Ej: Conviértete en un maestro del vallenato..."
            maxlength="150"
          />
          <div class="contador-caracteres">{descripcion_corta.length}/150</div>
        </div>

        <div class="campos-en-linea">
            <div class="campo-formulario">
              <label class="etiqueta-campo">
                <span class="texto-etiqueta">Categoría</span>
              </label>
              <input 
                type="text" 
                bind:value={categoria} 
                class="input-moderno"
                placeholder="Ej: Acordeón, Técnica, Teoría"
              />
            </div>
            <div class="campo-formulario">
              <label class="etiqueta-campo">
                <span class="texto-etiqueta">Plantilla de Vista</span>
              </label>
              <select bind:value={plantilla_vista} class="select-moderno">
                <option value="clasica">Clásica</option>
                <option value="minimal">Minimal</option>
                <option value="video_hero">Video Hero</option>
                <option value="premium">Premium</option>
              </select>
            </div>
        </div>

        <div class="campos-en-linea">
          <div class="campo-formulario">
            <label class="etiqueta-campo">
              <span class="texto-etiqueta">Nivel de Dificultad</span>
            </label>
            <select bind:value={nivel} class="select-moderno">
              <option value="principiante">🌱 Principiante</option>
              <option value="intermedio">📈 Intermedio</option>
              <option value="avanzado">🚀 Avanzado</option>
            </select>
          </div>

          <div class="campo-formulario">
            <label class="etiqueta-campo">
              <span class="texto-etiqueta">Estado</span>
            </label>
            <select bind:value={estado} class="select-moderno">
              <option value="borrador">📝 Borrador</option>
              <option value="revision">👀 En Revisión</option>
              <option value="publicado">✅ Publicado</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Sección 2: Imagen de Portada -->
      <div class="seccion-formulario">
        <h3 class="subtitulo-seccion">
          <span class="numero-seccion">2</span>
          Imagen de Portada
        </h3>

        <div class="seccion-imagen">
          <div class="preview-imagen">
            {#if imagen_url}
              <img 
                src={imagen_url} 
                alt="Preview" 
                class="imagen-preview"
                on:error={() => imagenError = true}
              />
              <button 
                class="btn-remover-imagen" 
                on:click={() => { imagen_url = ''; imagenError = false; }}
                title="Remover imagen"
              >
                ✕
              </button>
            {:else}
              <div class="placeholder-imagen">
                <div class="icono-placeholder">
                  📸
                </div>
                <p>Sin imagen de portada</p>
              </div>
            {/if}
          </div>

          <div class="controles-imagen">
            <div class="tabs-imagen">
              <button 
                class="tab-boton {tipoSubida === 'url' ? 'activo' : ''}"
                on:click={() => { tipoSubida = 'url'; archivoSeleccionado = null; }}
              >
                🔗 URL
              </button>
              <button 
                class="tab-boton {tipoSubida === 'archivo' ? 'activo' : ''}"
                on:click={() => { tipoSubida = 'archivo'; imagen_url = ''; }}
              >
                📁 Subir Archivo
              </button>
            </div>

            {#if tipoSubida === 'url'}
              <div class="campo-imagen-url">
                <input 
                  type="url" 
                  bind:value={imagen_url}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  class="input-moderno"
                  on:input={() => imagenError = false}
                />
                {#if imagenError}
                  <p class="error-imagen">❌ No se pudo cargar la imagen desde esta URL</p>
                {/if}
              </div>
            {:else}
              <div class="campo-subir-archivo">
                <input 
                  type="file" 
                  accept="image/*"
                  bind:this={inputArchivo}
                  on:change={manejarSubidaArchivo}
                  class="input-archivo-oculto"
                  id="input-imagen"
                />
                <label for="input-imagen" class="btn-subir-archivo">
                  <span class="icono-subir">📤</span>
                  {archivoSeleccionado ? archivoSeleccionado.name : 'Seleccionar imagen...'}
                </label>
                {#if subiendoImagen}
                  <div class="progreso-subida">
                    <div class="barra-progreso">
                      <div class="progreso-fill" style="width: {progresoSubida}%"></div>
                    </div>
                    <span class="texto-progreso">{progresoSubida}% subido</span>
                  </div>
                {/if}
                {#if errorSubida}
                  <p class="error-imagen">❌ {errorSubida}</p>
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Sección 3: Detalles del Contenido -->
      <div class="seccion-formulario">
        <h3 class="subtitulo-seccion">
          <span class="numero-seccion">2</span>
          Detalles del Contenido
        </h3>

        {#if tipo === 'curso'}
          <div class="campos-en-linea">
            <div class="campo-formulario">
              <label class="etiqueta-campo" for="duracion-estimada">
                <span class="texto-etiqueta">Duración Estimada (Horas)</span>
              </label>
              <input 
                id="duracion-estimada"
                type="number" 
                bind:value={duracion_estimada} 
                class="input-moderno"
                placeholder="Ej: 10"
              />
            </div>
            <div class="campo-formulario">
               <label class="etiqueta-campo">
                <span class="texto-etiqueta">¿El curso tiene módulos?</span>
              </label>
              <div class="campo-toggle simple">
                <label class="toggle-container">
                  <input type="checkbox" bind:checked={con_modulos} class="toggle-input">
                  <div class="toggle-slider" class:activo={con_modulos}>
                    <div class="toggle-knob"></div>
                  </div>
                  <span class="toggle-text-simple">{con_modulos ? 'Sí, usa módulos' : 'No, es simple'}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="campo-formulario campo-completo">
            <GestorLista
              titulo="Objetivos del Curso"
              placeholder="Añadir un objetivo..."
              bind:items={objetivos_curso}
              on:update={(e) => objetivos_curso = e.detail}
            />
          </div>
          <div class="campo-formulario campo-completo">
            <GestorLista
              titulo="Requisitos del Curso"
              placeholder="Añadir un requisito..."
              bind:items={requisitos_curso}
              on:update={(e) => requisitos_curso = e.detail}
            />
          </div>
        {:else}
          <div class="campo-formulario campo-completo">
            <label class="etiqueta-campo" for="video-url">
              <span class="texto-etiqueta">URL del Video Principal</span>
              <span class="descripcion-campo">Enlace al video de YouTube, Vimeo, etc.</span>
            </label>
            <input 
              id="video-url"
              type="url" 
              bind:value={video_url} 
              class="input-moderno"
              placeholder="https://..."
            />
          </div>
          <div class="campo-formulario campo-completo">
            <label class="etiqueta-campo" for="objetivos-tutorial">
              <span class="texto-etiqueta">Objetivos del Tutorial</span>
            </label>
            <textarea 
              id="objetivos-tutorial"
              bind:value={objetivos_tutorial} 
              class="textarea-moderno"
              placeholder="Describe los objetivos separados por comas: Aprenderás acordeón, Técnicas básicas, Ritmo vallenato..."
              rows="3"
            ></textarea>
          </div>
          <div class="campo-formulario campo-completo">
            <label class="etiqueta-campo" for="requisitos-tutorial">
              <span class="texto-etiqueta">Requisitos del Tutorial</span>
            </label>
            <textarea 
              id="requisitos-tutorial"
              bind:value={requisitos_tutorial} 
              class="textarea-moderno"
              placeholder="Describe los requisitos, uno por línea..."
              rows="3"
            ></textarea>
          </div>
        {/if}
      </div>

      <!-- Sección 3: Configuraciones Especiales -->
      <div class="seccion-formulario">
        <h3 class="subtitulo-seccion">
          <span class="numero-seccion">3</span>
          Configuraciones Especiales
        </h3>

        <div class="configuraciones-especiales">
          <div class="campo-toggle">
            <label class="toggle-container">
              <input type="checkbox" bind:checked={es_destacado} class="toggle-input">
              <div class="toggle-slider" class:activo={es_destacado}>
                <div class="toggle-knob"></div>
              </div>
              <div class="toggle-text">
                <span class="toggle-titulo">Contenido Destacado</span>
                <span class="toggle-descripcion">Aparecerá en la página principal</span>
              </div>
            </label>
          </div>

          <div class="campo-acceso">
            <span class="texto-etiqueta">Tipo de Acceso</span>
            <div class="radio-group">
              <label class="radio-opcion">
                <input type="radio" bind:group={tipo_acceso} value="gratuito" class="radio-input">
                <div class="radio-custom"></div>
                <span>🎁 Gratuito</span>
              </label>
              <label class="radio-opcion">
                <input type="radio" bind:group={tipo_acceso} value="pago" class="radio-input">
                <div class="radio-custom"></div>
                <span>💰 De Pago</span>
              </label>
            </div>
          </div>
        </div>

        {#if tipo_acceso === 'pago'}
          <div class="seccion-precios">
            <div class="campos-en-linea">
              <div class="campo-formulario">
                <label class="etiqueta-campo">
                  <span class="texto-etiqueta">Precio (COP)</span>
                </label>
                <div class="input-precio">
                  <span class="simbolo-precio">$</span>
                  <input 
                    type="number" 
                    bind:value={precio_normal} 
                    class="input-moderno input-precio-campo"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div class="campo-formulario">
                <label class="etiqueta-campo">
                  <span class="texto-etiqueta">Precio con Descuento (COP)</span>
                </label>
                <div class="input-precio">
                  <span class="simbolo-precio">$</span>
                  <input 
                    type="number" 
                    bind:value={precio_rebajado} 
                    class="input-moderno input-precio-campo"
                    placeholder="35000"
                  />
                </div>
              </div>

              <div class="campo-formulario">
                <label class="etiqueta-campo">
                  <span class="texto-etiqueta">Fecha de Expiración del Descuento</span>
                </label>
                <input 
                  type="date" 
                  bind:value={fecha_expiracion} 
                  class="input-moderno"
                />
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Sección 4: Información Musical (Solo para Tutoriales) -->
      {#if tipo === 'tutorial'}
        <div class="seccion-formulario">
          <h3 class="subtitulo-seccion">
            <span class="numero-seccion">4</span>
            Información Musical
          </h3>

          <div class="campos-en-linea">
            <div class="campo-formulario">
              <label class="etiqueta-campo">
                <span class="texto-etiqueta">Artista</span>
              </label>
              <input 
                type="text" 
                bind:value={artista} 
                class="input-moderno"
                placeholder="Nombre del artista"
              />
            </div>

            <div class="campo-formulario">
              <label class="etiqueta-campo">
                <span class="texto-etiqueta">Tonalidad</span>
              </label>
              <input 
                type="text" 
                bind:value={tonalidad} 
                class="input-moderno"
                placeholder="Ej: Do Mayor, La menor"
              />
            </div>
          </div>

          <div class="campo-formulario">
            <label class="etiqueta-campo">
              <span class="texto-etiqueta">Acordeonista</span>
            </label>
            <input 
              type="text" 
              bind:value={acordeonista} 
              class="input-moderno"
              placeholder="Nombre del acordeonista"
            />
          </div>
        </div>
      {/if}
    </div>

    <div class="acciones-formulario">
      <button class="btn-continuar" on:click={continuar}>
        <span class="icono-btn">🚀</span>
        Continuar al Siguiente Paso
        <span class="flecha-btn">→</span>
      </button>
    </div>
  </div>
</div>

<style>
  .formulario-contenedor {
    max-width: 1200px;
    margin: 0 auto;
    background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
    border-radius: 2rem;
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.08);
    border: 1px solid rgba(102, 126, 234, 0.1);
    overflow: hidden;
  }

  .contenido-formulario {
    padding: 3rem 2rem;
  }

  .titulo-seccion {
    font-size: 2.5rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    text-align: center;
    color: #2d3748;
  }

  .icono-titulo {
    font-size: 3rem;
  }

  .descripcion-seccion {
    font-size: 1.1rem;
    color: #64748b;
    margin: 0 0 3rem 0;
    text-align: center;
  }

  .grid-formulario {
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .seccion-formulario {
    background: white;
    border-radius: 1.5rem;
    padding: 2.5rem;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(226, 232, 240, 0.5);
  }

  .subtitulo-seccion {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0 0 2rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #e2e8f0;
  }

  .numero-seccion {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .campo-formulario {
    margin-bottom: 1.5rem;
  }

  .campo-completo {
    grid-column: 1 / -1;
  }

  .etiqueta-campo {
    display: block;
    margin-bottom: 0.5rem;
  }

  .texto-etiqueta {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    display: block;
  }

  .descripcion-campo {
    font-size: 0.875rem;
    color: #6b7280;
    display: block;
    margin-top: 0.25rem;
  }

  .input-moderno, .select-moderno, .textarea-moderno {
    width: 100%;
    padding: 1rem 1.25rem;
    border: 2px solid #e5e7eb;
    border-radius: 1rem;
    font-size: 1rem;
    background: #f9fafb;
    transition: all 0.3s ease;
    font-family: inherit;
  }

  .input-destacado {
    width: 100%;
    padding: 1.25rem 1.5rem;
    border: 3px solid #667eea;
    border-radius: 1.25rem;
    font-size: 1.125rem;
    font-weight: 600;
    background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
    transition: all 0.3s ease;
    font-family: inherit;
  }

  .input-moderno:focus, .select-moderno:focus, .textarea-moderno:focus, .input-destacado:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }

  .contador-caracteres {
    text-align: right;
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.25rem;
  }

  .campos-en-linea {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .configuraciones-especiales {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .campo-toggle {
    background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%);
    border-radius: 1rem;
    padding: 1.5rem;
    border: 2px solid #f59e0b;
  }

  .toggle-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
  }

  .toggle-input {
    display: none;
  }

  .toggle-slider {
    width: 3.5rem;
    height: 2rem;
    background: #d1d5db;
    border-radius: 1rem;
    position: relative;
    transition: all 0.3s ease;
  }

  .toggle-slider.activo {
    background: #667eea;
  }

  .toggle-knob {
    width: 1.5rem;
    height: 1.5rem;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .toggle-slider.activo .toggle-knob {
    transform: translateX(1.5rem);
  }

  .toggle-text {
    margin-left: 0.75rem;
  }

  .toggle-text-simple {
    margin-left: 0.75rem;
    font-size: 0.9rem;
    color: #4a5568;
  }

  .campo-toggle.simple {
    display: flex;
    align-items: center;
    height: 100%;
    margin-top: 1.5rem; /* Alinea con los inputs */
  }

  .toggle-titulo {
    font-weight: 600;
  }

  .toggle-descripcion {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .campo-acceso {
    background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
    border-radius: 1rem;
    padding: 1.5rem;
    border: 2px solid #10b981;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .radio-opcion {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }

  .radio-opcion:hover {
    background: rgba(16, 185, 129, 0.1);
  }

  .radio-input {
    display: none;
  }

  .radio-custom {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid #d1d5db;
    border-radius: 50%;
    position: relative;
    transition: all 0.2s ease;
  }

  .radio-input:checked + .radio-custom {
    border-color: #10b981;
    background: #10b981;
  }

  .radio-input:checked + .radio-custom::after {
    content: '';
    width: 0.5rem;
    height: 0.5rem;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .seccion-precios {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .input-precio {
    position: relative;
    display: flex;
    align-items: center;
  }

  .simbolo-precio {
    position: absolute;
    left: 1rem;
    font-weight: 600;
    color: #667eea;
    z-index: 1;
  }

  .input-precio-campo {
    padding-left: 2.5rem;
  }

  .acciones-formulario {
    text-align: center;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn-continuar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 1.25rem 3rem;
    border-radius: 1.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 0 auto;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  .btn-continuar:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
  }

  .icono-btn {
    font-size: 1.2rem;
  }

  .flecha-btn {
    font-size: 1.2rem;
    transition: transform 0.2s ease;
  }

  .btn-continuar:hover .flecha-btn {
    transform: translateX(5px);
  }

  /* === ESTILOS PARA SUBIDA DE IMAGEN === */
  .seccion-imagen {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
  }

  .preview-imagen {
    position: relative;
    width: 200px;
    height: 120px;
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .imagen-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder-imagen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #64748b;
    background: #f8fafc;
  }

  .icono-placeholder {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .btn-remover-imagen {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s ease;
  }

  .btn-remover-imagen:hover {
    background: #dc2626;
    transform: scale(1.1);
  }

  .controles-imagen {
    flex: 1;
  }

  .tabs-imagen {
    display: flex;
    margin-bottom: 1rem;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    width: fit-content;
  }

  .tab-boton {
    padding: 0.5rem 1rem;
    border: none;
    background: #f8fafc;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
  }

  .tab-boton.activo {
    background: var(--color-primario, #3b82f6);
    color: white;
  }

  .tab-boton:hover:not(.activo) {
    background: #e2e8f0;
  }

  .campo-imagen-url input {
    width: 100%;
  }

  .btn-subir-archivo {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #f1f5f9;
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    width: 100%;
    text-align: center;
    justify-content: center;
  }

  .btn-subir-archivo:hover {
    background: #e2e8f0;
    border-color: #94a3b8;
  }

  .input-archivo-oculto {
    display: none;
  }

  .progreso-subida {
    margin-top: 1rem;
  }

  .barra-progreso {
    width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .progreso-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    transition: width 0.3s ease;
  }

  .texto-progreso {
    font-size: 0.75rem;
    color: #64748b;
  }

  .error-imagen {
    color: #dc2626;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    margin-bottom: 0;
  }

  @media (max-width: 768px) {
    .configuraciones-especiales {
      grid-template-columns: 1fr;
    }
    
    .campos-en-linea {
      grid-template-columns: 1fr;
    }
    
    .formulario-contenedor {
      border-radius: 1rem;
    }
    
    .contenido-formulario {
      padding: 2rem 1rem;
    }
    
    .seccion-formulario {
      padding: 1.5rem;
    }

    .seccion-imagen {
      flex-direction: column;
      gap: 1rem;
    }
    
    .preview-imagen {
      width: 100%;
      max-width: 300px;
    }
  }
</style>
