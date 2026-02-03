<script lang="ts">
  import { generateSlug } from '$lib/utilidades/utilidadesSlug';
  import BarraProgresoGeneral from '$lib/components/VisualiizadorDeLeccionesDeCursos/BarraProgresoGeneral.svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { progresoLecciones } from '$lib/progresoLeccionesStore';
  import { obtenerCursoCompletoPorSlug } from '$lib/services/cursoService';
  import { usuario } from '$lib/UsuarioActivo/usuario';
  import { onMount, onDestroy } from 'svelte';

  // Props
  export let inscripcion: any;
  
  // Variables reactivas básicas
  $: esCurso = !!inscripcion.cursos;
  $: esTutorial = !!inscripcion.tutoriales;
  $: contenido = esCurso ? inscripcion.cursos : inscripcion.tutoriales;
  $: titulo = contenido?.titulo || 'Sin título';
  $: imagen = contenido?.imagen_url || '/images/default-curso.jpg';
  $: slug = contenido?.slug || generateSlug(titulo);
  $: completado = inscripcion.completado || false;
  $: fechaInscripcion = inscripcion.fecha_inscripcion ? new Date(inscripcion.fecha_inscripcion).toLocaleDateString('es-ES') : '';
  $: contenidoId = esCurso ? inscripcion.curso_id : inscripcion.tutorial_id;
  $: tipoContenido = esCurso ? 'Curso' : 'Tutorial';

  // Variables de progreso
  let progresoData = { porcentaje: 0, completadas: 0, total: 0 };
  let cargandoProgreso = true;

  // Variables reactivas para progreso
  $: tieneProgreso = progresoData.completadas > 0;
  $: textoBoton = tieneProgreso ? 'Continuar' : 'Empezar';

  // Función para cargar progreso
  async function cargarProgreso() {
    if (!$usuario?.id || !contenidoId) {
      cargandoProgreso = false;
      return;
    }

    try {
      cargandoProgreso = true;

      if (esCurso) {
        // Progreso de curso
        const { data: modulos } = await supabase
          .from('modulos')
          .select('id, lecciones(id)')
          .eq('curso_id', contenidoId);

        if (modulos && modulos.length > 0) {
          const leccionIds = modulos.flatMap((m: any) => m.lecciones?.map((l: any) => l.id) || []);
          
          if (leccionIds.length > 0) {
            const { data: progreso } = await supabase
              .from('progreso_lecciones')
              .select('leccion_id, estado')
              .eq('usuario_id', $usuario.id)
              .in('leccion_id', leccionIds);

            const completadas = progreso?.filter((p: any) => p.estado === 'completada').length || 0;
            const total = leccionIds.length;
            const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

            progresoData = { porcentaje, completadas, total };
          }
        }
      } else if (esTutorial) {
        // Progreso de tutorial
        const { data: partes } = await supabase
          .from('partes_tutorial')
          .select('id')
          .eq('tutorial_id', contenidoId);

        if (partes && partes.length > 0) {
          const { data: progreso } = await supabase
            .from('progreso_tutorial')
            .select('parte_tutorial_id, completado')
            .eq('usuario_id', $usuario.id)
            .eq('tutorial_id', contenidoId);

          const completadas = progreso?.filter((p: any) => p.completado).length || 0;
          const total = partes.length;
          const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

          progresoData = { porcentaje, completadas, total };
        }
      }
    } catch (error) {
      console.error('[TarjetaCurso] Error cargando progreso:', error);
    } finally {
      cargandoProgreso = false;
    }
  }

  // Cargar progreso al montar el componente
  onMount(() => {
    cargarProgreso();
    
    // Listener para actualizar progreso cuando el usuario regrese de ver lecciones
    const handleFocus = () => {
      if ($usuario?.id && contenidoId) {
        cargarProgreso();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Limpiar listener al destruir el componente
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  });

  // Recargar progreso cuando cambie el usuario o el contenido
  $: if ($usuario?.id && contenidoId) {
    cargarProgreso();
  }

  // Recargar progreso cuando cambie el store (para sincronizar con lecciones completadas)
  $: if ($progresoLecciones && contenidoId) {
    cargarProgreso();
  }

  // Función que usa el MISMO SERVICIO que funciona en la página de detalles
  async function navegarAContenido() {
    console.log('[TarjetaCurso] navegarAContenido - contenido:', contenido);
    console.log('[TarjetaCurso] navegarAContenido - tipo:', esCurso ? 'curso' : 'tutorial');
    console.log('[TarjetaCurso] tieneProgreso:', tieneProgreso);

    if (esCurso) {
      // LÓGICA PARA CURSOS MEJORADA CON MANEJO DE PROGRESO
      const cursoSlug = contenido.slug || generateSlug(contenido.titulo);
      
      try {
        const { curso: cursoCompleto, error: errCurso } = await obtenerCursoCompletoPorSlug(cursoSlug);
        if (errCurso || !cursoCompleto) {
            console.error('[TarjetaCurso] No se pudo cargar el curso completo para navegación', errCurso);
            goto(`/cursos/${cursoSlug}`);
            return;
        }

        // Si el usuario tiene progreso, intentar llevarlo a la siguiente lección pendiente
        if (tieneProgreso && $usuario) {
            const todasLasLeccionesIds = cursoCompleto.modulos.flatMap((m: any) => m.lecciones?.map((l: any) => l.id) || []).filter(Boolean);

            if (todasLasLeccionesIds.length > 0) {
                const { data: progresoData, error: progresoError } = await supabase
                    .from('progreso_lecciones')
                    .select('leccion_id, estado')
                    .eq('usuario_id', $usuario.id)
                    .in('leccion_id', todasLasLeccionesIds);
                
                if (!progresoError) {
                    const leccionesCompletadas = new Set(
                        progresoData.filter((p: any) => p.estado === 'completada').map((p: any) => p.leccion_id)
                    );

                    let proximaLeccion = null;
                    let moduloDeLaLeccion = null;

                    for (const modulo of cursoCompleto.modulos) {
                        const leccionEncontrada = modulo.lecciones?.find((l: any) => !leccionesCompletadas.has(l.id));
                        if (leccionEncontrada) {
                            proximaLeccion = leccionEncontrada;
                            moduloDeLaLeccion = modulo;
                            break;
                        }
                    }

                    if (proximaLeccion && moduloDeLaLeccion) {
                        const moduloSlug = moduloDeLaLeccion.slug || generateSlug(moduloDeLaLeccion.titulo);
                        const leccionSlug = proximaLeccion.slug || generateSlug(proximaLeccion.titulo);
                        const rutaDestino = `/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`;
                        console.log('[TarjetaCurso][CURSO][CONTINUAR] Navegando a:', rutaDestino);
                        goto(rutaDestino);
                        return; // Navegación exitosa a la siguiente lección
                    }
                } else {
                  console.error("Error fetching course progress, will navigate to first lesson.", progresoError);
                }
            }
        }

        // FALLBACK: Si no hay progreso, o todo está completo, o hubo un error. Navegar a la primera lección.
        console.log('[TarjetaCurso][CURSO][EMPEZAR/REPASAR] Navegando a primera lección.');
        if (cursoCompleto.modulos && cursoCompleto.modulos.length > 0) {
            const primerModulo = cursoCompleto.modulos.find((m: any) => m.lecciones && m.lecciones.length > 0);
            if (primerModulo) {
                const primeraLeccion = primerModulo.lecciones[0];
                const moduloSlug = primerModulo.slug || generateSlug(primerModulo.titulo);
                const leccionSlug = primeraLeccion.slug || generateSlug(primeraLeccion.titulo);
                const rutaDestino = `/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`;
                console.log('[TarjetaCurso][CURSO] rutaDestino Fallback:', rutaDestino);
                goto(rutaDestino);
                return;
            }
        }
        
        console.warn('[TarjetaCurso] No se encontraron lecciones en el curso, navegando a la página de detalles.');
        goto(`/cursos/${cursoSlug}`);

      } catch (error) {
          console.error('[TarjetaCurso] Error en navegación de curso:', error);
          goto(`/cursos/${cursoSlug}`);
          return;
      }
    }

    if (esTutorial) {
      // LÓGICA PARA TUTORIALES - AHORA IGUAL DE INTELIGENTE QUE LA DE CURSOS
      const tutorialSlug = contenido.slug || generateSlug(contenido.titulo);

      try {
        // 1. Cargar todas las clases (partes) del tutorial
        const { data: todasLasClases, error: clasesError } = await supabase
          .from('partes_tutorial')
          .select('id, titulo, slug, orden')
          .eq('tutorial_id', contenido.id)
          .order('orden', { ascending: true });

        if (clasesError || !todasLasClases || todasLasClases.length === 0) {
          console.error('[TarjetaCurso] Error cargando clases del tutorial o no hay clases:', clasesError);
          goto(`/tutoriales/${tutorialSlug}`); // Ir a la página de detalles como fallback
          return;
        }

        // 2. Si el usuario tiene progreso, buscar la siguiente clase
        if (tieneProgreso && $usuario) {
          const { data: progresoData, error: progresoError } = await supabase
            .from('progreso_tutorial')
            .select('parte_tutorial_id, completado')
            .eq('usuario_id', $usuario.id)
            .eq('tutorial_id', contenido.id);

          if (!progresoError) {
            const clasesCompletadas = new Set(
              progresoData
                .filter((p: any) => p.completado)
                .map((p: any) => p.parte_tutorial_id)
            );

            const proximaClase = todasLasClases.find((clase: any) => !clasesCompletadas.has(clase.id));

            if (proximaClase) {
              const claseSlug = proximaClase.slug || generateSlug(proximaClase.titulo);
              const rutaDestino = `/tutoriales/${tutorialSlug}/clase/${claseSlug}`;
              console.log('[TarjetaCurso][TUTORIAL][CONTINUAR] Navegando a:', rutaDestino);
              goto(rutaDestino);
              return; // Navegación exitosa
            }
          } else {
            console.error("Error fetching tutorial progress, will navigate to first class.", progresoError);
          }
        }

        // 3. FALLBACK: Si no hay progreso, o todo está completo, o hubo un error. Navegar a la primera clase.
        const primeraClase = todasLasClases[0];
        const claseSlug = primeraClase.slug || generateSlug(primeraClase.titulo);
        const rutaDestino = `/tutoriales/${tutorialSlug}/clase/${claseSlug}`;
        console.log('[TarjetaCurso][TUTORIAL][EMPEZAR/REPASAR] Navegando a:', rutaDestino);
        goto(rutaDestino);
        return;

      } catch (error) {
        console.error('[TarjetaCurso] Error en navegación de tutorial:', error);
        goto(`/tutoriales/${tutorialSlug}`);
        return;
      }
    }

    alert('No se encontró la primera lección o clase.\\n\\nRevisa la consola (F12) para ver la estructura de datos recibida.');
    console.error('[TarjetaCurso][ERROR][GENERAL] contenido:', contenido);
  }
</script>

<article class="tarjeta-curso">
  <div class="imagen-contenedor">
    <img 
      src={imagen} 
      alt={titulo}
      class="imagen-curso"
      loading="lazy"
    />
    <div class="badge-tipo" class:curso={esCurso} class:tutorial={esTutorial}>
      {tipoContenido}
    </div>
    {#if completado}
      <div class="badge-completado">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
        Completado
      </div>
    {/if}
  </div>
  
  <div class="contenido-tarjeta">
    <div class="info-principal">
      <a href="{esCurso ? `/mis-cursos/${slug}` : `/tutoriales/${slug}/contenido`}" class="titulo-curso-link">
        <h3 class="titulo-curso">{titulo}</h3>
      </a>
      <p class="fecha-inscripcion">Inscrito el {fechaInscripcion}</p>
      <div class="hint-navegacion">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
        <span>Haz clic en el título para ver todos los {esCurso ? 'módulos' : 'clases'}</span>
      </div>
    </div>
    
    <div class="progreso-seccion">
      {#if cargandoProgreso}
        <div class="cargando-progreso">
          <div class="spinner"></div>
          <span>Cargando progreso...</span>
        </div>
      {:else}
        <div class="progreso-info">
          <div class="progreso-texto">
            Progreso: {progresoData.completadas} / {progresoData.total} {esCurso ? 'lecciones' : 'clases'} ({progresoData.porcentaje}%)
          </div>
          <div class="barra-progreso">
            <div 
              class="progreso-relleno" 
              style="width: {progresoData.porcentaje}%"
              class:curso={esCurso}
              class:tutorial={esTutorial}
            ></div>
          </div>
        </div>
      {/if}
    </div>
    
    <div class="acciones">
      <button on:click={navegarAContenido} class="boton-continuar" class:completado>
        {textoBoton}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>
</article>

<style>
  .tarjeta-curso {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .tarjeta-curso:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    transform: translateY(-4px);
  }

  .imagen-contenedor {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
  }

  .imagen-curso {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .tarjeta-curso:hover .imagen-curso {
    transform: scale(1.05);
  }

  .badge-tipo {
    position: absolute;
    top: 12px;
    left: 12px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge-tipo.curso {
    background: rgba(37, 99, 235, 0.9);
    color: white;
  }

  .badge-tipo.tutorial {
    background: rgba(168, 85, 247, 0.9);
    color: white;
  }

  .badge-completado {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(34, 197, 94, 0.9);
    color: white;
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .contenido-tarjeta {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
  }

  .info-principal {
    flex: 1;
  }

  .titulo-curso-link {
    text-decoration: none;
    color: inherit;
    display: block;
    transition: color 0.2s ease;
  }

  .titulo-curso-link:hover {
    color: #2563eb;
  }

  .titulo-curso-link:hover .titulo-curso {
    color: #2563eb;
  }

  .info-principal:hover .hint-navegacion {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-color: #3b82f6;
    transform: translateY(-1px);
  }

  .titulo-curso {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px 0;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s ease;
  }

  .fecha-inscripcion {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .hint-navegacion {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 8px;
    font-size: 0.8rem;
    color: #0369a1;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .hint-navegacion:hover {
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
    border-color: #0ea5e9;
  }

  .hint-navegacion svg {
    color: #0284c7;
    flex-shrink: 0;
  }

  .hint-navegacion span {
    line-height: 1.4;
  }

  .progreso-seccion {
    margin: 8px 0;
  }

  .cargando-progreso {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .progreso-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .progreso-texto {
    font-size: 0.875rem;
    color: #374151;
    font-weight: 500;
  }

  .barra-progreso {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .progreso-relleno {
    height: 100%;
    transition: width 0.3s ease;
    border-radius: 4px;
  }

  .progreso-relleno.curso {
    background: linear-gradient(90deg, #2563eb, #3b82f6);
  }

  .progreso-relleno.tutorial {
    background: linear-gradient(90deg, #a855f7, #c084fc);
  }

  .acciones {
    margin-top: auto;
  }

  .boton-continuar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px 24px;
    background: #2563eb;
    color: white;
    text-decoration: none;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    cursor: pointer;
    font-family: inherit;
  }

  .boton-continuar:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
  }

  .boton-continuar.completado {
    background: #059669;
  }

  .boton-continuar.completado:hover {
    background: #047857;
  }

  /* Responsivo */
  @media (max-width: 768px) {
    .imagen-contenedor {
      height: 160px;
    }

    .contenido-tarjeta {
      padding: 16px;
      gap: 12px;
    }

    .titulo-curso {
      font-size: 1.1rem;
    }

    .hint-navegacion {
      font-size: 0.75rem;
      padding: 6px 10px;
    }

    .hint-navegacion svg {
      width: 14px;
      height: 14px;
    }

    .boton-continuar {
      padding: 10px 20px;
      font-size: 0.9rem;
    }
  }
</style> 