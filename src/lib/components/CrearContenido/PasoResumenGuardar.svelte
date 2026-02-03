<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { estadoUsuarioActual } from '$lib/supabase/estadoUsuarioActual';

  export let tipo: 'tutorial' | 'curso' = 'tutorial';
  export let datosGenerales: any = {};
  export let estructura: any[] = [];
  export let modoEdicion: boolean = false;
  export let idContenido: number | null = null;

  const dispatch = createEventDispatcher();

  let guardando = false;
  let error = '';

  function formatearPrecio(precio: string | number): string {
    if (!precio) return 'Gratuito';
    const num = typeof precio === 'string' ? parseFloat(precio) : precio;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(num);
  }

  function obtenerBadgeNivel(nivel: string): { texto: string; color: string } {
    const badges: Record<string, { texto: string; color: string }> = {
      'principiante': { texto: '🌱 Principiante', color: 'bg-green-100 text-green-800' },
      'intermedio': { texto: '📈 Intermedio', color: 'bg-yellow-100 text-yellow-800' },
      'avanzado': { texto: '🚀 Avanzado', color: 'bg-red-100 text-red-800' }
    };
    return badges[nivel] || { texto: nivel, color: 'bg-gray-100 text-gray-800' };
  }

  function obtenerBadgeEstado(estado: string): { texto: string; color: string } {
    const badges: Record<string, { texto: string; color: string }> = {
      'borrador': { texto: '📝 Borrador', color: 'bg-gray-100 text-gray-800' },
      'revision': { texto: '👀 En Revisión', color: 'bg-blue-100 text-blue-800' },
      'publicado': { texto: '✅ Publicado', color: 'bg-green-100 text-green-800' }
    };
    return badges[estado] || { texto: estado, color: 'bg-gray-100 text-gray-800' };
  }

  async function manejarGuardado() {
    if (guardando) return;

    guardando = true;
    error = '';

    try {
      const datosParaGuardar = {
        titulo: datosGenerales.titulo,
        descripcion: datosGenerales.descripcion,
        nivel: datosGenerales.nivel,
        estado: datosGenerales.estado,
        instructor_id: ($estadoUsuarioActual as any)?.user?.id || null,
        categoria: datosGenerales.categoria || 'Acordeón',
        descripcion_corta: datosGenerales.descripcion_corta,
        plantilla_vista: datosGenerales.plantilla_vista || 'clasica',
        ...(tipo === 'curso' ? { es_destacado: datosGenerales.es_destacado } : { destacado: datosGenerales.destacado }),
        tipo_acceso: datosGenerales.tipo_acceso,
        precio_normal: datosGenerales.tipo_acceso === 'pago' ? parseFloat(datosGenerales.precio_normal) || 0 : 0,
        precio_rebajado: datosGenerales.tipo_acceso === 'pago' ? parseFloat(datosGenerales.precio_rebajado) || 0 : 0,
        fecha_expiracion: datosGenerales.fecha_expiracion || null,
        imagen_url: datosGenerales.imagen_url || null,
        ...(tipo === 'tutorial' && {
          artista: datosGenerales.artista,
          tonalidad: datosGenerales.tonalidad,
          acordeonista: datosGenerales.acordeonista,
          video_url: datosGenerales.video_url,
          objetivos: datosGenerales.objetivos,
          requisitos: datosGenerales.requisitos,
          duracion_estimada: datosGenerales.duracion_estimada || 0,
          duracion: datosGenerales.duracion || 0
        }),
        ...(tipo === 'curso' && {
          requisitos: Array.isArray(datosGenerales.requisitos) ? datosGenerales.requisitos : (datosGenerales.requisitos ? [datosGenerales.requisitos] : []),
          objetivos: Array.isArray(datosGenerales.objetivos) ? datosGenerales.objetivos : (datosGenerales.objetivos ? [datosGenerales.objetivos] : []),
          duracion_estimada: datosGenerales.duracion_estimada || 0,
          con_modulos: datosGenerales.con_modulos ?? true
        })
      };

      const tabla = tipo === 'curso' ? 'cursos' : 'tutoriales';
      let data, supabaseError;

      if (modoEdicion && idContenido) {
        // MODO EDICIÓN: Actualizar el registro existente
        const resultado = await supabase
          .from(tabla)
          .update(datosParaGuardar)
          .eq('id', idContenido)
          .select()
          .single();
        
        data = resultado.data;
        supabaseError = resultado.error;
      } else {
        // MODO CREACIÓN: Crear nuevo registro
        const resultado = await supabase
          .from(tabla)
          .insert([datosParaGuardar])
          .select()
          .single();
        
        data = resultado.data;
        supabaseError = resultado.error;
      }

      if (supabaseError) throw supabaseError;

      // Guardar la estructura (partes de tutorial o módulos/lecciones de curso)
      if (estructura.length > 0) {
        await guardarEstructura(data.id, estructura);
      }

      // Emitir evento de guardado exitoso
      dispatch('guardado', { ...datosParaGuardar, id: data.id });

    } catch (err: any) {
      console.error('Error al guardar:', err);
      error = `Error al guardar el ${tipo}: ${err.message}`;
    } finally {
      guardando = false;
    }
  }

  async function guardarEstructura(idContenido: number, estructura: any[]) {
    try {
      if (tipo === 'tutorial') {
        // Guardar partes del tutorial
        if (modoEdicion) {
          // En modo edición, primero eliminar las partes existentes
          await supabase
            .from('partes_tutorial')
            .delete()
            .eq('tutorial_id', idContenido);
        }

        // Insertar las nuevas partes
        const partesParaGuardar = estructura.map((parte, index) => ({
          tutorial_id: idContenido,
          titulo: parte.titulo || `Parte ${index + 1}`,
          descripcion: parte.descripcion || '',
          tipo_parte: parte.tipo_parte || 'introduccion',
          tipo_contenido: parte.tipo_contenido || 'video',
          video_url: parte.video_url || '',
          contenido: parte.contenido || '',
          orden: parte.orden || index + 1,
          visible: parte.visible !== false // Por defecto visible
        }));

        const { error: errorPartes } = await supabase
          .from('partes_tutorial')
          .insert(partesParaGuardar);

        if (errorPartes) {
          console.error('Error guardando partes del tutorial:', errorPartes);
          throw errorPartes;
        }

        console.log('✅ Partes del tutorial guardadas:', partesParaGuardar.length);
      } else {
        // Guardar módulos y lecciones del curso (PRESERVANDO PROGRESO)
        if (modoEdicion) {
          // NUEVA LÓGICA: PRESERVAR módulos y lecciones existentes
          console.log('🔄 MODO EDICIÓN: Preservando progreso existente...');
          
          // Obtener módulos y lecciones actuales
          const { data: modulosExistentes } = await supabase
            .from('modulos')
            .select('id, titulo, descripcion, orden')
            .eq('curso_id', idContenido)
            .order('orden');
          
          // Procesar cada módulo de la estructura
          for (let i = 0; i < estructura.length; i++) {
            const modulo = estructura[i];
            let moduloId;
            
            // Buscar si existe un módulo en la misma posición o con el mismo título
            const moduloExistente = modulosExistentes?.[i] || 
              modulosExistentes?.find((m: any) => m.titulo === modulo.titulo);
            
            if (moduloExistente) {
              // ACTUALIZAR módulo existente
              moduloId = moduloExistente.id;
              await supabase
                .from('modulos')
                .update({
                  titulo: modulo.titulo || 'Módulo sin título',
                  descripcion: modulo.descripcion || '',
                  orden: modulo.orden || (i + 1)
                })
                .eq('id', moduloId);
              console.log(`✅ Módulo actualizado: ${modulo.titulo} (ID: ${moduloId})`);
            } else {
              // CREAR nuevo módulo
              const { data: moduloCreado, error: errorModulo } = await supabase
                .from('modulos')
                .insert({
                  curso_id: idContenido,
                  titulo: modulo.titulo || 'Módulo sin título',
                  descripcion: modulo.descripcion || '',
                  orden: modulo.orden || (i + 1)
                })
                .select()
                .single();
              
              if (errorModulo) throw errorModulo;
              moduloId = moduloCreado.id;
              console.log(`🆕 Módulo creado: ${modulo.titulo} (ID: ${moduloId})`);
            }
            
            // Procesar lecciones del módulo
            if (modulo.lecciones && modulo.lecciones.length > 0) {
              // Obtener lecciones existentes del módulo
              const { data: leccionesExistentes } = await supabase
                .from('lecciones')
                .select('id, titulo, descripcion, orden')
                .eq('modulo_id', moduloId)
                .order('orden');
              
              for (let j = 0; j < modulo.lecciones.length; j++) {
                const leccion = modulo.lecciones[j];
                
                // Buscar si existe una lección en la misma posición o con el mismo título
                const leccionExistente = leccionesExistentes?.[j] ||
                  leccionesExistentes?.find((l: any) => l.titulo === leccion.titulo);
                
                if (leccionExistente) {
                  // ACTUALIZAR lección existente (PRESERVA EL PROGRESO)
                  await supabase
                    .from('lecciones')
                    .update({
                      titulo: leccion.titulo || 'Lección sin título',
                      descripcion: leccion.descripcion || '',
                      tipo_contenido: leccion.tipo_contenido || 'video',
                      video_url: leccion.video_url || '',
                      contenido: leccion.contenido || '',
                      orden: leccion.orden || (j + 1)
                    })
                    .eq('id', leccionExistente.id);
                  console.log(`✅ Lección actualizada: ${leccion.titulo} (ID: ${leccionExistente.id})`);
                } else {
                  // CREAR nueva lección
                  const { error: errorLeccion } = await supabase
                    .from('lecciones')
                    .insert({
                      modulo_id: moduloId,
                      titulo: leccion.titulo || 'Lección sin título',
                      descripcion: leccion.descripcion || '',
                      tipo_contenido: leccion.tipo_contenido || 'video',
                      video_url: leccion.video_url || '',
                      contenido: leccion.contenido || '',
                      orden: leccion.orden || (j + 1)
                    });
                  
                  if (errorLeccion) throw errorLeccion;
                  console.log(`🆕 Lección creada: ${leccion.titulo}`);
                }
              }
            }
          }
        } else {
          // MODO CREACIÓN: Insertar nuevos módulos y lecciones
        for (const modulo of estructura) {
          const { data: moduloCreado, error: errorModulo } = await supabase
            .from('modulos')
            .insert({
              curso_id: idContenido,
              titulo: modulo.titulo || 'Módulo sin título',
              descripcion: modulo.descripcion || '',
              orden: modulo.orden || 1
            })
            .select()
            .single();

          if (errorModulo) throw errorModulo;

          // Insertar lecciones del módulo
          if (modulo.lecciones && modulo.lecciones.length > 0) {
            const leccionesParaGuardar = modulo.lecciones.map((leccion: any) => ({
              modulo_id: moduloCreado.id,
              titulo: leccion.titulo || 'Lección sin título',
              descripcion: leccion.descripcion || '',
              tipo_contenido: leccion.tipo_contenido || 'video',
              video_url: leccion.video_url || '',
              contenido: leccion.contenido || '',
              orden: leccion.orden || 1
            }));

            const { error: errorLecciones } = await supabase
              .from('lecciones')
              .insert(leccionesParaGuardar);

            if (errorLecciones) throw errorLecciones;
            }
          }
        }

        console.log('✅ Módulos y lecciones del curso guardados (progreso preservado)');
      }
    } catch (error) {
      console.error('❌ Error guardando estructura:', error);
      throw error;
    }
  }

  $: badgeNivel = obtenerBadgeNivel(datosGenerales.nivel);
  $: badgeEstado = obtenerBadgeEstado(datosGenerales.estado);
</script>

<div class="resumen-contenedor">
  <div class="header-resumen">
    <h2 class="titulo-resumen">
      <span class="icono-resumen">📋</span>
      {modoEdicion ? 'Editar' : 'Resumen del'} {tipo === 'curso' ? 'Curso' : 'Tutorial'}
    </h2>
    <p class="descripcion-resumen">
      {modoEdicion ? 'Revisa los cambios antes de actualizar' : 'Revisa toda la información antes de guardar'}
    </p>
  </div>

  <div class="contenido-resumen">
    <!-- Información General -->
    <div class="seccion-resumen">
      <h3 class="subtitulo-resumen">
        <span class="numero-resumen">1</span>
        Información General
      </h3>
      
      <div class="grid-info">
        <div class="info-item">
          <span class="info-label">Título:</span>
          <span class="info-value">{datosGenerales.titulo}</span>
        </div>
        
        <div class="info-item">
          <span class="info-label">Descripción:</span>
          <span class="info-value">{datosGenerales.descripcion}</span>
        </div>
        
        <div class="info-item">
          <span class="info-label">Nivel:</span>
          <span class="badge {badgeNivel.color}">{badgeNivel.texto}</span>
        </div>
        
        <div class="info-item">
          <span class="info-label">Estado:</span>
          <span class="badge {badgeEstado.color}">{badgeEstado.texto}</span>
        </div>
        
        <div class="info-item">
          <span class="info-label">Destacado:</span>
          <span class="badge {datosGenerales.es_destacado ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}">
            {datosGenerales.es_destacado ? '⭐ Sí' : '📄 No'}
          </span>
        </div>
        
        <div class="info-item">
          <span class="info-label">Acceso:</span>
          <span class="badge {datosGenerales.tipo_acceso === 'pago' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
            {datosGenerales.tipo_acceso === 'pago' ? '💰 De Pago' : '🎁 Gratuito'}
          </span>
        </div>

        {#if datosGenerales.imagen_url}
          <div class="info-item imagen-preview-resumen">
            <span class="info-label">Imagen de Portada:</span>
            <div class="imagen-miniatura">
              <img 
                src={datosGenerales.imagen_url} 
                alt="Portada del {tipo}" 
                class="imagen-resumen"
              />
            </div>
          </div>
        {/if}
      </div>

      {#if datosGenerales.tipo_acceso === 'pago'}
        <div class="seccion-precios">
          <h4 class="subtitulo-precio">💰 Información de Precios</h4>
          <div class="grid-precios">
            <div class="precio-item">
              <span class="precio-label">Precio Normal:</span>
              <span class="precio-value">{formatearPrecio(datosGenerales.precio_normal)}</span>
            </div>
            
            {#if datosGenerales.precio_rebajado}
              <div class="precio-item">
                <span class="precio-label">Precio Rebajado:</span>
                <span class="precio-value descuento">{formatearPrecio(datosGenerales.precio_rebajado)}</span>
              </div>
            {/if}
            
            {#if datosGenerales.fecha_expiracion}
              <div class="precio-item">
                <span class="precio-label">Expiración del Descuento:</span>
                <span class="precio-value">{new Date(datosGenerales.fecha_expiracion).toLocaleDateString('es-CO')}</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Información Musical (Solo para Tutoriales) -->
    {#if tipo === 'tutorial'}
      <div class="seccion-resumen">
        <h3 class="subtitulo-resumen">
          <span class="numero-resumen">2</span>
          Información Musical
        </h3>
        
        <div class="grid-info">
          <div class="info-item">
            <span class="info-label">Artista:</span>
            <span class="info-value">{datosGenerales.artista || 'No especificado'}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Tonalidad:</span>
            <span class="info-value">{datosGenerales.tonalidad || 'No especificada'}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Acordeonista:</span>
            <span class="info-value">{datosGenerales.acordeonista || 'No especificado'}</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Estructura del Contenido -->
    {#if estructura.length > 0}
      <div class="seccion-resumen">
        <h3 class="subtitulo-resumen">
          <span class="numero-resumen">{tipo === 'tutorial' ? '3' : '2'}</span>
          Estructura del Contenido
        </h3>
        
        <div class="estructura-preview">
          {#each estructura as item, index}
            <div class="estructura-item">
              <div class="estructura-header">
                <span class="estructura-numero">{index + 1}</span>
                <span class="estructura-titulo">{item.titulo || `${tipo === 'curso' ? 'Módulo' : 'Parte'} ${index + 1}`}</span>
              </div>
              
              {#if item.lecciones && item.lecciones.length > 0}
                <div class="lecciones-preview">
                  {#each item.lecciones as leccion, lIndex}
                    <div class="leccion-item">
                      <span class="leccion-numero">{index + 1}.{lIndex + 1}</span>
                      <span class="leccion-titulo">{leccion.titulo || `Lección ${lIndex + 1}`}</span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if error}
      <div class="error-mensaje">
        <span class="error-icono">❌</span>
        {error}
      </div>
    {/if}

    <div class="acciones-resumen">
      <button 
        class="btn-guardar {guardando ? 'guardando' : ''}" 
        on:click={manejarGuardado}
        disabled={guardando}
      >
        {#if guardando}
          <div class="spinner"></div>
          Guardando...
        {:else}
          <span class="icono-btn">{modoEdicion ? '✏️' : '💾'}</span>
          {modoEdicion ? 'Actualizar' : 'Guardar'} {tipo === 'curso' ? 'Curso' : 'Tutorial'}
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .resumen-contenedor {
    max-width: 1000px;
    margin: 0 auto;
    background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
    border-radius: 2rem;
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.08);
    border: 1px solid rgba(102, 126, 234, 0.1);
    overflow: hidden;
  }

  .header-resumen {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2.5rem 2rem;
    text-align: center;
    color: white;
  }

  .titulo-resumen {
    font-size: 2.5rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .icono-resumen {
    font-size: 3rem;
  }

  .descripcion-resumen {
    font-size: 1.1rem;
    opacity: 0.9;
    margin: 0;
  }

  .contenido-resumen {
    padding: 3rem 2rem;
  }

  .seccion-resumen {
    background: white;
    border-radius: 1.5rem;
    padding: 2.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(226, 232, 240, 0.5);
  }

  .subtitulo-resumen {
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

  .numero-resumen {
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

  .grid-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .info-label {
    font-weight: 600;
    color: #6b7280;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-value {
    font-size: 1rem;
    color: #374151;
    font-weight: 500;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
    width: fit-content;
  }

  .seccion-precios {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }

  .subtitulo-precio {
    font-size: 1.25rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0 0 1.5rem 0;
  }

  .grid-precios {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .precio-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
  }

  .precio-label {
    font-weight: 600;
    color: #6b7280;
  }

  .precio-value {
    font-weight: 700;
    color: #374151;
  }

  .precio-value.descuento {
    color: #059669;
  }

  .estructura-preview {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .estructura-item {
    background: #f9fafb;
    border-radius: 1rem;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
  }

  .estructura-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .estructura-numero {
    width: 2rem;
    height: 2rem;
    background: #667eea;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .estructura-titulo {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
  }

  .lecciones-preview {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-left: 3rem;
  }

  .leccion-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
  }

  .leccion-numero {
    font-size: 0.875rem;
    font-weight: 600;
    color: #667eea;
  }

  .leccion-titulo {
    color: #6b7280;
  }

  .error-mensaje {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 1rem 1.5rem;
    border-radius: 1rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .error-icono {
    font-size: 1.25rem;
  }

  .acciones-resumen {
    text-align: center;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }

  .btn-guardar {
    background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
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
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
  }

  .btn-guardar:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
  }

  .btn-guardar:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .btn-guardar.guardando {
    background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
  }

  .spinner {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Estilos para imagen en resumen */
  .imagen-preview-resumen {
    grid-column: 1 / -1;
    align-items: flex-start;
  }

  .imagen-miniatura {
    margin-top: 0.5rem;
  }

  .imagen-resumen {
    width: 120px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
    border: 2px solid #e2e8f0;
  }

  .icono-btn {
    font-size: 1.2rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .grid-info {
      grid-template-columns: 1fr;
    }
    
    .grid-precios {
      grid-template-columns: 1fr;
    }
    
    .resumen-contenedor {
      border-radius: 1rem;
    }
    
    .contenido-resumen {
      padding: 2rem 1rem;
    }
    
    .seccion-resumen {
      padding: 1.5rem;
    }
    
    .lecciones-preview {
      margin-left: 1.5rem;
    }
  }
</style>
