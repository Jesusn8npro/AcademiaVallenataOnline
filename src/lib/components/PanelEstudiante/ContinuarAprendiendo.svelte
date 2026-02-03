<script lang="ts">
  // 🎵 Continuar Aprendiendo - Estilo Platzi
  // Hero principal con última clase visitada
  
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import { usuario } from '$lib/UsuarioActivo/usuario';
  import { generateSlug } from '$lib/utilidades/utilidadesSlug';
  import Avatar from '$lib/components/ui/Avatar.svelte'; // 🚀 Importar componente Avatar

  // 📊 Estados
  let cargando = true;
  let ultimaActividad: any = null;
  let error = '';
  
  // 🎠 Estados del slider
  let todasLasActividades: any[] = [];
  let actividadActual = 0;
  let autoPlayInterval: any = null;
  let isPaused = false;
  let isChanging = false;
  
  // ⚡ ESTADOS DE CARGA VISUALES
  let cargandoCursos = true;
  let cargandoTutoriales = true;
  let cargandoActividad = true;
  
  // 🎯 DATOS POR DEFECTO PARA MOSTRAR INMEDIATAMENTE
  const datosPorDefecto = {
    curso: {
      titulo: 'Fundamentos del Acordeón Vallenato',
      descripcion: 'Aprende desde cero con el método probado del Maestro Jesús González',
      imagen_url: '/images/Home/academia-vallenata-1.jpg',
      progreso: 0,
      clases_totales: 4,
      ultima_actividad: 'Hoy'
    }
  };

  // 🚀 MENSAJES MOTIVACIONALES PERSUASIVOS
  const mensajesMotivacionales = [
    "¡Tu pasión por el acordeón te llevará lejos! 🎵",
    "Cada nota que aprendes es un paso hacia tu sueño musical ✨",
    "El talento se desarrolla con práctica constante 🎯",
    "Tu dedicación hoy construye tu mañana musical 🌟",
    "El acordeón es tu voz, ¡hazla cantar! 🎼",
    "Cada clase te acerca más a ser el músico que quieres ser 🚀",
    "La música está en tu corazón, ¡déjala salir! 💫",
    "Tu progreso musical inspira a otros a seguir sus sueños 🌈",
    "El ritmo vallenato corre por tus venas 🎭",
    "Cada acorde que dominas es una victoria personal 🏆",
    "Tu amor por la música te hace único y especial 💝",
    "El acordeón es tu compañero de vida musical 🎪",
    "Cada día de práctica te hace más fuerte musicalmente 💪",
    "Tu determinación es la clave de tu éxito musical 🔑",
    "La música no tiene límites, ¡tú tampoco! 🌌"
  ];

  // 🎲 Mensaje motivacional aleatorio para esta sesión
  let mensajeMotivacional = '';

    // 🎯 LÓGICA EXACTA DE "MIS CURSOS" - COPIADA COMPLETA
  async function cargarUltimaActividad() {
    if (!$usuario?.id) {
      cargando = false;
      return;
    }

    try {
      cargando = true;
      console.log('🎯 [DASHBOARD] Iniciando carga con lógica de Mis Cursos');

      // PASO 1: Obtener TODAS las inscripciones (IGUAL que en Mis Cursos)
      const { data: inscripcionesData, error: inscripcionError } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('usuario_id', $usuario.id)
        .order('fecha_inscripcion', { ascending: false });

      if (inscripcionError) {
        console.error('❌ Error obteniendo inscripciones:', inscripcionError);
        throw inscripcionError;
      }

      console.log('📋 [DASHBOARD] Inscripciones encontradas:', inscripcionesData?.length || 0);

      if (!inscripcionesData || inscripcionesData.length === 0) {
        console.log('⚠️ [DASHBOARD] No se encontraron inscripciones');
        ultimaActividad = null;
        return;
      }

      // PASO 2: Separar por tipo (IGUAL que en Mis Cursos)
      const inscripcionesCursos = inscripcionesData.filter((i: any) => i.curso_id);
      const inscripcionesTutoriales = inscripcionesData.filter((i: any) => i.tutorial_id);

      console.log('📊 [DASHBOARD] Distribución:', {
        total: inscripcionesData.length,
        cursos: inscripcionesCursos.length,
        tutoriales: inscripcionesTutoriales.length
      });

      // 🚀 PASO 3-4: CONSULTAS EN PARALELO (OPTIMIZADO)
      const [cursosResult, tutorialesResult] = await Promise.all([
        // 📚 CURSOS
        inscripcionesCursos.length > 0 ? 
          supabase
            .from('cursos')
            .select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, slug, instructor_id, categoria')
            .in('id', inscripcionesCursos.map((i: any) => i.curso_id)) :
          Promise.resolve({ data: [], error: null }),
          
        // 🎵 TUTORIALES  
        inscripcionesTutoriales.length > 0 ?
          supabase
            .from('tutoriales')
            .select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, artista, acordeonista, tonalidad, instructor_id')
            .in('id', inscripcionesTutoriales.map((i: any) => i.tutorial_id)) :
          Promise.resolve({ data: [], error: null })
      ]);

      const cursosData = cursosResult.data || [];
      const tutorialesData = tutorialesResult.data || [];
      
      console.log('🚀 [DASHBOARD] Carga paralela completada:', {
        cursos: cursosData.length,
        tutoriales: tutorialesData.length
      });

      // PASO 5: Combinar inscripciones con contenido (IGUAL que en Mis Cursos)
      const inscripcionesCombinadas = [
        // Inscripciones a cursos
        ...inscripcionesCursos.map((inscripcion: any) => ({
          ...inscripcion,
          cursos: cursosData.find((curso: any) => curso.id === inscripcion.curso_id)
        })),
        // Inscripciones a tutoriales
        ...inscripcionesTutoriales.map((inscripcion: any) => ({
          ...inscripcion,
          tutoriales: tutorialesData.find((tutorial: any) => tutorial.id === inscripcion.tutorial_id)
        }))
      ];

      console.log('🔄 [DASHBOARD] Inscripciones combinadas:', inscripcionesCombinadas.length);

      // PASO 6: Calcular progreso REAL usando LÓGICA EXACTA de TarjetaCurso.svelte
      const cursosConProgreso = [];
      
      console.log('🎯 [DASHBOARD] Calculando progreso para', inscripcionesCombinadas.length, 'inscripciones');
      console.log('🎯 [DASHBOARD] Inscripciones detalladas:', inscripcionesCombinadas);
      
      for (const inscripcionCompleta of inscripcionesCombinadas.slice(0, 5)) { // Solo primeros 5
        const esCurso = !!inscripcionCompleta.cursos;
        const contenido = esCurso ? inscripcionCompleta.cursos : inscripcionCompleta.tutoriales;
        const contenidoId = esCurso ? inscripcionCompleta.curso_id : inscripcionCompleta.tutorial_id;
        
        console.log('📊 [DASHBOARD] Procesando:', { 
          tipo: esCurso ? 'curso' : 'tutorial', 
          titulo: contenido?.titulo,
          id: contenidoId 
        });

        if (!contenido || !contenidoId) {
          console.warn('⚠️ [DASHBOARD] Contenido o ID faltante para inscripción');
          continue;
        }
        
        // ===== LÓGICA EXACTA COPIADA DE TarjetaCurso.svelte =====
        let progresoData = { porcentaje: 0, completadas: 0, total: 0 };
        let ultimaLeccionTitulo = null;

        try {
          if (esCurso) {
            // Progreso de curso (COPIA EXACTA)
            const { data: modulos } = await supabase
              .from('modulos')
              .select('id, lecciones(id, titulo, slug, orden)')
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

                // Encontrar siguiente lección
                const leccionesCompletadas = new Set(progreso?.filter((p: any) => p.estado === 'completada').map((p: any) => p.leccion_id) || []);
                const todasLasLecciones = modulos.flatMap((m: any) => m.lecciones || []);
                const siguienteLeccion = todasLasLecciones.find((l: any) => !leccionesCompletadas.has(l.id));
                ultimaLeccionTitulo = siguienteLeccion?.titulo || null;
                
                console.log('📚 [DASHBOARD] Progreso curso:', contenido.titulo, `${completadas}/${total} (${porcentaje}%)`);
              }
            }
          } else {
            // Progreso de tutorial (COPIA EXACTA)
            const { data: partes } = await supabase
              .from('partes_tutorial')
              .select('id, titulo, slug, orden')
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

              // Encontrar siguiente parte
              const partesCompletadas = new Set(progreso?.filter((p: any) => p.completado).map((p: any) => p.parte_tutorial_id) || []);
              const siguienteParte = partes.find((p: any) => !partesCompletadas.has(p.id));
              ultimaLeccionTitulo = siguienteParte?.titulo || null;
              
              console.log('🎵 [DASHBOARD] Progreso tutorial:', contenido.titulo, `${completadas}/${total} (${porcentaje}%)`);
            }
          }

          // Generar slug seguro
          const slugFinal = contenido.slug || generateSlug(contenido.titulo);
          console.log(`🔗 [DASHBOARD] Slug generado para ${contenido.titulo}: ${slugFinal}`);

          // Agregar a la lista
          const cursoParaAgregar = {
            id: contenido.id,
            titulo: contenido.titulo,
            imagen_url: contenido.imagen_url,
            slug: slugFinal, // ✅ Generar slug si no existe
            porcentaje_completado: progresoData.porcentaje,
            ultima_leccion_titulo: ultimaLeccionTitulo || (progresoData.porcentaje === 100 ? '¡Completado!' : 'Sin iniciar'),
            instructor_id: contenido.instructor_id, // ✅ Corregido a instructor_id
            categoria: contenido.categoria || null, // ✅ Puede ser null para tutoriales
            tipo: esCurso ? 'curso' : 'tutorial',
            artista: contenido.artista,
            acordeonista: contenido.acordeonista,
            completadas: progresoData.completadas,
            total: progresoData.total
          };

          cursosConProgreso.push(cursoParaAgregar);
          console.log(`✅ [DASHBOARD] Agregado ${esCurso ? 'curso' : 'tutorial'}:`, cursoParaAgregar);

        } catch (error) {
          console.error('[DASHBOARD] Error calculando progreso para:', contenido.titulo, error);
        }
      }

      // PASO 7: Generar TODAS las actividades para el slider
      if (cursosConProgreso.length > 0) {
        // Convertir cada curso/tutorial en actividad para el slider
        todasLasActividades = [];
        
        console.log('🎠 [SLIDER] Procesando', cursosConProgreso.length, 'cursos para el slider');
        console.log('🎠 [SLIDER] Cursos a procesar:', cursosConProgreso.map(c => ({ titulo: c.titulo, tipo: c.tipo, id: c.id })));
        
        for (const curso of cursosConProgreso) {
          try {
            let rutaEspecifica = null;
            let leccionTexto = curso.ultima_leccion_titulo || 'Continuar';
            let moduloTexto = curso.tipo === 'curso' ? 'Módulo actual' : null;

            if (curso.tipo === 'curso') {
              // 🎯 GENERAR RUTA ESPECÍFICA PARA CURSO
              const { data: modulos } = await supabase
                .from('modulos')
                .select('id, titulo, slug, orden, lecciones(id, titulo, slug, orden)')
                .eq('curso_id', curso.id)
                .order('orden');

              if (modulos && modulos.length > 0) {
                const todasLasLecciones = modulos.flatMap((m: any) => m.lecciones || []);
                const { data: progresoData } = await supabase
                  .from('progreso_lecciones')
                  .select('leccion_id, estado, ultima_actividad')
                  .eq('usuario_id', $usuario.id)
                  .in('leccion_id', todasLasLecciones.map((l: any) => l.id))
                  .not('ultima_actividad', 'is', null)
                  .order('ultima_actividad', { ascending: false })
                  .limit(1);

                // Encontrar próxima lección o última vista
                let leccionFinal: any = null;
                let moduloFinal: any = null;

                // Si hay progreso reciente, usar esa lección
                if (progresoData && progresoData.length > 0) {
                  const ultimoProgreso = progresoData[0];
                  leccionFinal = todasLasLecciones.find((l: any) => l.id === ultimoProgreso.leccion_id);
                  if (leccionFinal) {
                    moduloFinal = modulos.find((m: any) => m.lecciones?.some((l: any) => l.id === leccionFinal.id));
                  }
                }

                // Si no hay progreso reciente, buscar próxima lección pendiente
                if (!leccionFinal) {
                  for (const modulo of modulos) {
                    const leccionPendiente = modulo.lecciones?.find((l: any) => {
                      const progreso = progresoData?.find((p: any) => p.leccion_id === l.id);
                      return !progreso || progreso.estado !== 'completada';
                    });
                    
                    if (leccionPendiente) {
                      leccionFinal = leccionPendiente;
                      moduloFinal = modulo;
                      break;
                    }
                  }
                }

                // Generar ruta específica
                if (leccionFinal && moduloFinal) {
                  const cursoSlug = curso.slug;
                  const moduloSlug = moduloFinal.slug || generateSlug(moduloFinal.titulo);
                  const leccionSlug = leccionFinal.slug || generateSlug(leccionFinal.titulo);
                  rutaEspecifica = `/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`;
                  leccionTexto = leccionFinal.titulo;
                  moduloTexto = moduloFinal.titulo;
                }
              }

              // Fallback si no se puede generar ruta específica
              if (!rutaEspecifica) {
                rutaEspecifica = `/cursos/${curso.slug}`;
              }

            } else if (curso.tipo === 'tutorial') {
              // 🎯 GENERAR RUTA ESPECÍFICA PARA TUTORIAL
              const { data: partes } = await supabase
                .from('partes_tutorial')
                .select('id, titulo, slug, orden')
                .eq('tutorial_id', curso.id)
                .order('orden');

              if (partes && partes.length > 0) {
                const { data: progresoData } = await supabase
                  .from('progreso_tutorial')
                  .select('parte_tutorial_id, completado, ultimo_acceso')
                  .eq('usuario_id', $usuario.id)
                  .eq('tutorial_id', curso.id)
                  .not('ultimo_acceso', 'is', null)
                  .order('ultimo_acceso', { ascending: false })
                  .limit(1);

                // Encontrar próxima clase o última vista
                let claseFinal: any = null;

                // Si hay progreso reciente, usar esa clase
                if (progresoData && progresoData.length > 0) {
                  const ultimoProgreso = progresoData[0];
                  claseFinal = partes.find((p: any) => p.id === ultimoProgreso.parte_tutorial_id);
                }

                // Si no hay progreso reciente, buscar próxima clase pendiente
                if (!claseFinal) {
                  claseFinal = partes.find((p: any) => {
                    const progreso = progresoData?.find((pr: any) => pr.parte_tutorial_id === p.id);
                    return !progreso || !progreso.completado;
                  });
                }

                // Generar ruta específica
                if (claseFinal) {
                  const tutorialSlug = curso.slug;
                  const claseSlug = claseFinal.slug || generateSlug(claseFinal.titulo);
                  rutaEspecifica = `/tutoriales/${tutorialSlug}/clase/${claseSlug}`;
                  leccionTexto = claseFinal.titulo;
                }
              }

              // Fallback si no se puede generar ruta específica
              if (!rutaEspecifica) {
                rutaEspecifica = `/tutoriales/${curso.slug}`;
              }
            }

            // Agregar actividad al slider
            todasLasActividades.push({
              id: curso.id,
              tipo: curso.tipo,
              titulo: curso.titulo,
              leccion: leccionTexto,
              modulo: moduloTexto,
              artista: curso.artista,
              acordeonista: curso.acordeonista,
              imagen: curso.imagen_url,
              progreso: curso.porcentaje_completado,
              totalLecciones: curso.total,
              leccionesCompletadas: curso.completadas,
              totalClases: curso.total,
              clasesCompletadas: curso.completadas,
              ruta: rutaEspecifica,
              ultimaActividad: new Date(inscripcionesData[0].created_at)
            });

            console.log(`🎯 [SLIDER] ${curso.tipo} procesado:`, {
              titulo: curso.titulo,
              leccion: leccionTexto,
              ruta: rutaEspecifica
            });

          } catch (error) {
            console.error(`❌ [SLIDER] Error procesando ${curso.tipo}:`, curso.titulo, error);
            
            // Fallback básico en caso de error
            const rutaBase = curso.tipo === 'tutorial' ? '/tutoriales' : '/cursos';
            todasLasActividades.push({
              id: curso.id,
              tipo: curso.tipo,
              titulo: curso.titulo,
              leccion: curso.ultima_leccion_titulo || 'Continuar',
              modulo: curso.tipo === 'curso' ? 'Módulo actual' : null,
              artista: curso.artista,
              acordeonista: curso.acordeonista,
              imagen: curso.imagen_url,
              progreso: curso.porcentaje_completado,
              totalLecciones: curso.total,
              leccionesCompletadas: curso.completadas,
              totalClases: curso.total,
              clasesCompletadas: curso.completadas,
              ruta: `${rutaBase}/${curso.slug}`,
              ultimaActividad: new Date(inscripcionesData[0].created_at)
            });
          }
        }

        // Establecer la primera como actividad actual
        actividadActual = 0;
        ultimaActividad = todasLasActividades[0];

        console.log('✅ [DASHBOARD] Todas las actividades procesadas:', todasLasActividades.length);
        console.log('🎯 [DASHBOARD] Lista completa de actividades:', todasLasActividades);
        console.log('🎯 [DASHBOARD] Actividad inicial:', ultimaActividad);
      } else {
        console.log('⚠️ [DASHBOARD] No se procesó ningún curso con progreso');
        todasLasActividades = [];
        ultimaActividad = null;
      }

    } catch (error) {
      console.error('❌ [DASHBOARD] Error cargando última actividad:', error);
      error = 'Error al cargar la información';
    } finally {
      cargando = false;
      console.log('🏁 [DASHBOARD] Carga finalizada. Última actividad:', ultimaActividad);
    }
  }

  // 🚀 Continuar aprendizaje
  function continuarAprendizaje() {
    if (ultimaActividad?.ruta) {
      console.log('🎯 [NAVEGACIÓN] Navegando a:', ultimaActividad.ruta);
      console.log('🎯 [NAVEGACIÓN] Actividad completa:', ultimaActividad);
      goto(ultimaActividad.ruta);
    } else {
      console.error('❌ [NAVEGACIÓN] No hay ruta disponible para:', ultimaActividad);
    }
  }

  // 🎠 Funciones de navegación del slider
  function anteriorActividad() {
    pausarAutoPlay();
    isChanging = true;
    setTimeout(() => {
      if (actividadActual > 0) {
        actividadActual--;
        ultimaActividad = todasLasActividades[actividadActual];
      }
      setTimeout(() => {
        isChanging = false;
      }, 300);
    }, 100);
    reanudarAutoPlayDespuesDe(10000); // Más tiempo después de interacción manual
  }

  function siguienteActividad() {
    pausarAutoPlay();
    isChanging = true;
    setTimeout(() => {
      if (actividadActual < todasLasActividades.length - 1) {
        actividadActual++;
        ultimaActividad = todasLasActividades[actividadActual];
      } else {
        // Si está en el último, volver al primero
        actividadActual = 0;
        ultimaActividad = todasLasActividades[actividadActual];
      }
      setTimeout(() => {
        isChanging = false;
      }, 300);
    }, 100);
    reanudarAutoPlayDespuesDe(10000); // Más tiempo después de interacción manual
  }

  function irAActividad(index: number) {
    pausarAutoPlay();
    isChanging = true;
    setTimeout(() => {
      actividadActual = index;
      ultimaActividad = todasLasActividades[actividadActual];
      setTimeout(() => {
        isChanging = false;
      }, 300);
    }, 100);
    reanudarAutoPlayDespuesDe(10000); // Más tiempo después de interacción manual
  }

  // 🔄 CONTROL ESTRICTO DE AUTO-PLAY (SIN DUPLICACIONES)
  function iniciarAutoPlay() {
    // 🚨 SIEMPRE limpiar cualquier interval previo
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
    
    // ✅ Solo crear nuevo interval si hay múltiples actividades y no está pausado
    if (todasLasActividades.length > 1 && !isPaused) {
      console.log('🔄 [AUTO-PLAY] Iniciando nuevo interval');
      autoPlayInterval = setInterval(() => {
        siguienteActividadAuto();
      }, 15000); // Cambiar cada 15 segundos
    }
  }

  function siguienteActividadAuto() {
    // 🛡️ Verificar que el auto-play sigue activo
    if (isPaused || !autoPlayInterval) {
      console.log('🛑 [AUTO-PLAY] Cancelado - pausado o sin interval');
      return;
    }
    
    console.log('🎯 [AUTO-PLAY] Cambiando slide automáticamente');
    isChanging = true;
    setTimeout(() => {
      if (actividadActual < todasLasActividades.length - 1) {
        actividadActual++;
      } else {
        actividadActual = 0; // Volver al primero
      }
      ultimaActividad = todasLasActividades[actividadActual];
      setTimeout(() => {
        isChanging = false;
      }, 300);
    }, 150);
  }

  function pausarAutoPlay() {
    console.log('⏸️ [AUTO-PLAY] Pausando...');
    isPaused = true;
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  function reanudarAutoPlay() {
    console.log('▶️ [AUTO-PLAY] Reanudando...');
    isPaused = false;
    iniciarAutoPlay(); // iniciarAutoPlay ya limpia intervals previos
  }

  function reanudarAutoPlayDespuesDe(ms: number) {
    console.log(`⏰ [AUTO-PLAY] Programado para reanudar en ${ms}ms`);
    setTimeout(() => {
      reanudarAutoPlay();
    }, ms);
  }

  // 🎨 Formatear fecha de última actividad
  function formatearUltimaActividad(fecha: Date): string {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(horas / 24);
    
    if (horas < 1) return 'Hace menos de una hora';
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  }

  // 🚀 CARGA INMEDIATA DE INTERFAZ
  onMount(() => {
    console.log('🚀 [CONTINUAR] Componente cargado INMEDIATAMENTE');
    
    // 🎲 SELECCIONAR MENSAJE MOTIVACIONAL ALEATORIO
    const indiceAleatorio = Math.floor(Math.random() * mensajesMotivacionales.length);
    mensajeMotivacional = mensajesMotivacionales[indiceAleatorio];
    console.log('💫 [MOTIVACIÓN] Mensaje seleccionado:', mensajeMotivacional);
    
    // 📊 CARGAR DATOS PRINCIPALES
    cargarUltimaActividad();
    
    // ⚡ CARGAR DATOS ADICIONALES EN SEGUNDO PLANO
    setTimeout(async () => {
      try {
        console.log('📊 [CONTINUAR] Cargando datos adicionales en segundo plano...');
        
        // Aquí puedes agregar la carga de datos específicos del panel
        // Por ahora solo simulamos un delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('✅ [CONTINUAR] Datos adicionales cargados en segundo plano');
        
      } catch (error) {
        console.warn('⚠️ [CONTINUAR] Error cargando datos adicionales en segundo plano:', error);
      }
    }, 100); // 100ms después de cargar la interfaz
  });

  // 🔄 INICIAR AUTO-PLAY SOLO UNA VEZ AL CARGAR DATOS
  $: if (todasLasActividades.length > 1 && !autoPlayInterval && !isPaused) {
    console.log('📊 [AUTO-PLAY] Datos cargados, programando inicio...');
    setTimeout(() => {
      // 🛡️ Verificar nuevamente antes de iniciar
      if (!autoPlayInterval && !isPaused) {
        iniciarAutoPlay();
      }
    }, 8000); // Esperar 8 segundos antes de iniciar
  }

  onDestroy(() => {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
    }
  });
</script>

<!-- 🎵 CONTINUAR APRENDIENDO - HERO PRINCIPAL -->
<section class="continuar-aprendiendo">
  
  {#if cargando}
    <!-- 🎯 MENSAJE MOTIVACIONAL MIENTRAS CARGA -->
    <div class="hero-motivacional">
      <div class="motivacion-container">
        <!-- 🎵 Icono animado -->
        <div class="icono-acordeon">
          <span class="acordeon-animado">🎹</span>
          <div class="notas-musicales">
            <span class="nota">♪</span>
            <span class="nota">♫</span>
            <span class="nota">♬</span>
          </div>
        </div>
        
        <!-- 🚀 Mensaje principal -->
        <div class="mensaje-principal">
          <h2 class="titulo-bienvenida">¡Bienvenido a tu Panel de Estudiante!</h2>
          <p class="subtitulo-motivacional">Aquí podrás ver todas tus clases, retos completados y mucho más</p>
        </div>
        
        <!-- ✨ Características destacadas -->
        <div class="caracteristicas-destacadas">
          <div class="caracteristica">
            <span class="icono-caracteristica">📚</span>
            <span class="texto-caracteristica">Tus cursos en progreso</span>
          </div>
          <div class="caracteristica">
            <span class="icono-caracteristica">🏆</span>
            <span class="texto-caracteristica">Logros y retos</span>
          </div>
          <div class="caracteristica">
            <span class="icono-caracteristica">🎵</span>
            <span class="texto-caracteristica">Próxima clase</span>
          </div>
        </div>
        
        <!-- 🔄 Indicador de carga sutil -->
        <div class="indicador-carga">
          <div class="puntos-carga">
            <span class="punto"></span>
            <span class="punto"></span>
            <span class="punto"></span>
          </div>
          <p class="texto-carga">Preparando tu experiencia de aprendizaje...</p>
        </div>
      </div>
    </div>
    
  {:else if ultimaActividad && todasLasActividades.length > 0}
    <!-- 🎠 SLIDER DE ACTIVIDADES -->
    <div 
      class="slider-container"
      on:mouseenter={pausarAutoPlay}
      on:mouseleave={reanudarAutoPlay}
    >
      
      <!-- Header del slider con navegación -->
      <div class="slider-header">
        <div class="usuario-info">
          <Avatar 
            src={$usuario?.url_foto_perfil}
            alt="Foto de perfil"
            nombreCompleto={$usuario?.nombre || 'Usuario'}
            size="large"
            onClick={() => goto('/perfil')}
          />
          
          <div class="saludo-usuario">
            <span class="saludo">¡Hola {$usuario?.nombre || 'Estudiante'}!</span>
            <span class="submensaje">{mensajeMotivacional}</span>
          </div>
        </div>
        
        {#if todasLasActividades.length > 1}
          <div class="navegacion-externa">
            <!-- ✅ NUEVO: FLECHAS OCULTAS - SOLO FUNCIONALIDAD -->
            <button 
              class="nav-btn-external nav-prev" 
              on:click={anteriorActividad} 
              disabled={actividadActual === 0}
              aria-label="Actividad anterior"
              style="opacity: 0; pointer-events: none;"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            
            <span class="contador-externo">
              {actividadActual + 1} / {todasLasActividades.length}
              {#if !isPaused && todasLasActividades.length > 1}
                <span class="auto-indicator active">●</span>
              {:else if isPaused && todasLasActividades.length > 1}
                <span class="auto-indicator paused">⏸</span>
              {/if}
            </span>
            
            <button 
              class="nav-btn-external nav-next" 
              on:click={siguienteActividad} 
              disabled={actividadActual === todasLasActividades.length - 1}
              aria-label="Siguiente actividad"
              style="opacity: 0; pointer-events: none;"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        {/if}
      </div>

      <!-- Contenido del slide actual CON transición CSS suave -->
      {#key actividadActual}
        <div class="hero-actividad slide-content" class:changing={isChanging}>
          <div class="contenido-izquierdo">
            <div class="etiqueta-continuar">
              <span class="icono">{ultimaActividad.tipo === 'curso' ? '📚' : '🎵'}</span>
              <span>Continuar Aprendiendo</span>
            </div>
          
          <h2 class="titulo-principal">{ultimaActividad.titulo}</h2>
          
          <div class="info-actividad">
            {#if ultimaActividad.tipo === 'curso'}
              <p class="descripcion">
                <span class="modulo">📖 {ultimaActividad.modulo}</span>
                <span class="separador">•</span>
                <span class="leccion">🎯 {ultimaActividad.leccion}</span>
              </p>
            {:else}
              <p class="descripcion">
                <span class="artista">🎵 {ultimaActividad.artista}</span>
                <span class="separador">•</span>
                <span class="leccion">🎯 {ultimaActividad.leccion}</span>
              </p>
            {/if}
            
            <div class="estadisticas">
              <div class="stat">
                <span class="valor">{ultimaActividad.progreso}%</span>
                <span class="label">completado</span>
              </div>
              <div class="stat">
                <span class="valor">{ultimaActividad.tipo === 'curso' ? ultimaActividad.leccionesCompletadas : ultimaActividad.clasesCompletadas}</span>
                <span class="label">de {ultimaActividad.tipo === 'curso' ? ultimaActividad.totalLecciones : ultimaActividad.totalClases} {ultimaActividad.tipo === 'curso' ? 'lecciones' : 'clases'}</span>
              </div>
            </div>
            
            <div class="progreso-visual">
              <div class="barra-progreso">
                <div class="progreso-fill" style="width: {ultimaActividad.progreso}%"></div>
              </div>
              <span class="progreso-texto">{ultimaActividad.progreso}% completado</span>
            </div>
            
            <p class="ultima-sesion">
              Última actividad: {formatearUltimaActividad(ultimaActividad.ultimaActividad)}
            </p>
          </div>
          
          <!-- ✅ NUEVO: CONTENEDOR DE BOTONES LADO A LADO -->
          <div class="botones-container">
          <button class="boton-continuar" on:click={continuarAprendizaje}>
            <span class="icono-play">▶️</span>
            <span>Continuar {ultimaActividad.tipo === 'curso' ? 'Lección' : 'Clase'}</span>
              <!-- ✅ NUEVO: FLECHA OCULTA -->
              <svg class="icono-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0;">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            
            <!-- 🚀 BOTÓN PARA IR A MIS CURSOS -->
            <button class="boton-mis-cursos" on:click={() => goto('/mis-cursos')}>
              <span class="icono-libros">📚</span>
              <span>Ver Todos Mis Cursos</span>
              <!-- ✅ NUEVO: FLECHA OCULTA -->
              <svg class="icono-flecha" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0;">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          </div>
        </div>
        
        <div class="contenido-derecho">
          <div class="imagen-contenedor">
            <img 
              src={ultimaActividad.imagen || '/images/Home/academia-vallenata-1.jpg'} 
              alt={ultimaActividad.titulo}
              class="imagen-curso"
            />
            <div class="overlay-progreso">
              <div class="progreso-circular">
                <div class="circular-chart">
                  <svg viewBox="0 0 36 36" class="circular-chart-svg">
                    <path class="circle-bg"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path class="circle"
                      stroke-dasharray="{ultimaActividad.progreso}, 100"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div class="percentage">{ultimaActividad.progreso}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/key}

      <!-- Indicadores de slides -->
      {#if todasLasActividades.length > 1}
        <div class="slider-indicators">
          {#each todasLasActividades as actividad, index}
            <button 
              class="indicator {index === actividadActual ? 'active' : ''}"
              on:click={() => irAActividad(index)}
              aria-label="Ir a {actividad.titulo}"
            >
              <span class="tipo-indicator">{actividad.tipo === 'curso' ? '📚' : '🎵'}</span>
            </button>
          {/each}
        </div>
      {/if}

    </div>
    
  {:else}
    <!-- Sin actividad reciente -->
    <div class="hero-sin-actividad">
      <div class="contenido-vacio">
        <div class="icono-vacio">🎵</div>
        <h2>¡Comienza tu viaje musical!</h2>
        <p>Inscríbete en un curso o tutorial para empezar a aprender acordeón</p>
        <div class="botones-accion">
          <button class="boton-principal" on:click={() => goto('/cursos')}>
            📚 Explorar Cursos
          </button>
          <button class="boton-secundario" on:click={() => goto('/tutoriales')}>
            🎵 Ver Tutoriales
          </button>
        </div>
      </div>
    </div>
  {/if}
  
</section>

<style>
  /* 🎵 CONTINUAR APRENDIENDO - ESTILO PLATZI */
  .continuar-aprendiendo {
    margin-bottom: 32px;
  }

  /* 🎠 SLIDER CONTAINER */
  .slider-container {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
    border-radius: 20px;
    padding: 24px; /* ✅ NUEVO: Reducir padding de 40px a 24px */
    color: white;
    position: relative;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(99, 102, 241, 0.3);
  }

  .slider-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  /* 🎯 HERO CON ACTIVIDAD */
  .hero-actividad {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 24px; /* ✅ NUEVO: Reducir gap de 40px a 24px */
    padding: 24px; /* ✅ NUEVO: Reducir padding de 40px a 24px */
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%);
    border-radius: 20px;
    color: white;
    position: relative;
    overflow: hidden;
  }

  .hero-actividad::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(1px);
  }

  .contenido-izquierdo, .contenido-derecho {
    position: relative;
    z-index: 2;
  }

  .etiqueta-continuar {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 16px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .titulo-principal {
    font-size: 2.2rem; /* ✅ NUEVO: Reducir de 3rem a 2.2rem para mejor legibilidad */
    font-weight: 700; /* ✅ NUEVO: Reducir de 900 a 700 para menos agresividad */
    margin: 0 0 16px 0; /* ✅ NUEVO: Reducir margen inferior de 20px a 16px */
    line-height: 1.2; /* ✅ NUEVO: Ajustar line-height para mejor espaciado */
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* ✅ NUEVO: Reducir sombra para menos agresividad */
  }

  .info-actividad {
    margin-bottom: 24px;
  }

  .descripcion {
    font-size: 1.1rem;
    margin: 0 0 16px 0;
    opacity: 0.9;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .separador {
    opacity: 0.6;
  }

  .estadisticas {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat .valor {
    font-size: 1.4rem;
    font-weight: bold;
  }

  .stat .label {
    font-size: 0.85rem;
    opacity: 0.8;
  }

  .progreso-visual {
    margin-bottom: 16px;
  }

  .barra-progreso {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progreso-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #34d399);
    border-radius: 4px;
    transition: width 0.8s ease;
  }

  .progreso-texto {
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .ultima-sesion {
    font-size: 0.9rem;
    opacity: 0.8;
    margin: 0;
  }

  .boton-continuar {
    display: inline-flex;
    align-items: center;
    gap: 8px; /* ✅ NUEVO: Reducir gap de 12px a 8px */
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 8px 12px; /* ✅ NUEVO: Reducir padding de 10px 16px a 8px 12px */
    border-radius: 10px; /* ✅ NUEVO: Reducir border-radius de 12px a 10px */
    font-size: 1rem; /* ✅ NUEVO: Reducir font-size de 1.1rem a 1rem */
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .boton-continuar:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
  }

  /* ✅ NUEVO: CONTENEDOR DE BOTONES LADO A LADO */
  .botones-container {
    display: flex;
    gap: 8px; /* ✅ NUEVO: Reducir gap de 12px a 8px */
    align-items: center;
    flex-wrap: wrap;
  }
  
  /* 🚀 BOTÓN MIS CURSOS */
  .boton-mis-cursos {
    display: inline-flex;
    align-items: center;
    gap: 8px; /* ✅ NUEVO: Reducir gap de 12px a 8px */
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 6px 10px; /* ✅ NUEVO: Reducir padding de 10px 16px a 6px 10px */
    border-radius: 8px; /* ✅ NUEVO: Reducir border-radius de 10px a 8px */
    font-size: 0.9rem; /* ✅ NUEVO: Reducir font-size de 1rem a 0.9rem */
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-left: 0; /* ✅ NUEVO: Eliminar margin-left ya que está en contenedor */
  }

  .boton-mis-cursos:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(255, 255, 255, 0.15);
  }

  .icono-flecha {
    width: 20px;
    height: 20px;
    opacity: 0 !important; /* ✅ NUEVO: OCULTAR FLECHAS COMPLETAMENTE */
    pointer-events: none; /* ✅ NUEVO: DESHABILITAR INTERACCIÓN */
  }

  /* 🖼️ IMAGEN Y PROGRESO CIRCULAR */
  .contenido-derecho {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .imagen-contenedor {
    position: relative;
    width: 350px; /* ✅ NUEVO: Aumentar de 250px a 350px */
    height: 280px; /* ✅ NUEVO: Aumentar de 200px a 280px */
    border-radius: 16px;
    overflow: hidden;
  }

  .imagen-curso {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .overlay-progreso {
    position: absolute;
    top: 12px;
    right: 12px;
  }

  .progreso-circular {
    width: 80px; /* ✅ NUEVO: Aumentar de 60px a 80px */
    height: 80px; /* ✅ NUEVO: Aumentar de 60px a 80px */
  }

  .circular-chart-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .circle-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.2);
    stroke-width: 2;
  }

  .circle {
    fill: none;
    stroke: #10b981;
    stroke-width: 3;
    stroke-linecap: round;
    transition: stroke-dasharray 0.8s ease;
  }

  .percentage {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem; /* ✅ NUEVO: Aumentar de 0.8rem a 1.2rem */
    font-weight: bold;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  /* 🌟 SIN ACTIVIDAD */
  .hero-sin-actividad {
    padding: 60px 40px;
    background: rgba(100, 116, 139, 0.1);
    border-radius: 20px;
    border: 2px dashed rgba(100, 116, 139, 0.3);
    text-align: center;
  }

  .contenido-vacio {
    max-width: 400px;
    margin: 0 auto;
  }

  .icono-vacio {
    font-size: 4rem;
    margin-bottom: 16px;
  }

  .contenido-vacio h2 {
    font-size: 1.8rem;
    margin: 0 0 12px 0;
    color: white;
  }

  .contenido-vacio p {
    color: #94a3b8;
    margin: 0 0 24px 0;
    font-size: 1.1rem;
  }

  .botones-accion {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .boton-principal, .boton-secundario {
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
  }

  .boton-principal {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
  }

  .boton-secundario {
    background: transparent;
    color: #6366f1;
    border: 2px solid #6366f1;
  }

  .boton-principal:hover, .boton-secundario:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 900px) {
    .hero-actividad {
      grid-template-columns: 1fr;
      gap: 24px;
      padding: 24px;
    }

    .titulo-principal {
      font-size: 1.8rem;
    }

    .estadisticas {
      gap: 16px;
    }

    .imagen-contenedor {
      width: 200px;
      height: 150px;
      margin: 0 auto;
    }

    .botones-accion {
      flex-direction: column;
      align-items: center;
    }

    .boton-principal, .boton-secundario {
      width: 100%;
      max-width: 250px;
    }

    /* 🎠 SLIDER MÓVIL */
    .slider-header {
      padding: 0 10px;
      margin-bottom: 15px;
    }

    .usuario-info {
      gap: 8px;
    }

    .saludo {
      font-size: 1rem;
    }

    .submensaje {
      font-size: 0.8rem;
    }

    .navegacion-externa {
      gap: 12px;
    }

    .nav-btn-external {
      width: 35px;
      height: 35px;
    }

    .nav-btn-external svg {
      width: 18px;
      height: 18px;
    }

    .contador-externo {
      font-size: 0.9rem;
      min-width: 40px;
      gap: 6px;
    }
  
  /* ✅ NUEVO: OCULTAR CONTADOR EN PANTALLAS < 750px */
  @media (max-width: 750px) {
    .contador-externo {
      display: none !important;
    }
  }

    .auto-indicator {
      font-size: 0.7rem;
    }

    .auto-indicator.paused {
      font-size: 0.6rem;
    }

    .slider-indicators {
      gap: 8px;
      margin-top: 15px;
    }

    .indicator {
      width: 40px;
      height: 40px;
    }

    .tipo-indicator {
      font-size: 1rem;
    }
  }

  /* 📱 HEADER DEL SLIDER */
  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 20px;
  }

  .usuario-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  /* 🚀 ESTILOS PARA EL COMPONENTE AVATAR */
  .usuario-info :global(.avatar) {
    width: 50px !important;
    height: 50px !important;
    border: 3px solid rgba(255, 255, 255, 0.3) !important;
    transition: all 0.3s ease !important;
  }

  .usuario-info :global(.avatar:hover) {
    border-color: rgba(255, 255, 255, 0.7) !important;
    transform: scale(1.05) !important;
    box-shadow: 0 4px 20px rgba(255, 255, 255, 0.2) !important;
  }

  .saludo-usuario {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .saludo {
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .submensaje {
    font-size: 1.1rem;
    opacity: 0.9;
    font-style: italic; /* 🚀 Agregar estilo itálico */
    color: #fbbf24; /* 🚀 Color dorado para destacar */
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); /* 🚀 Sombra sutil */
    font-weight: 500; /* 🚀 Peso medio para mejor legibilidad */
  }

  .navegacion-externa {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .nav-btn-external {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    opacity: 0 !important; /* ✅ NUEVO: OCULTAR FLECHAS EXTERNAS */
    pointer-events: none !important; /* ✅ NUEVO: DESHABILITAR INTERACCIÓN */
    justify-content: center;
  }

  .nav-btn-external:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: scale(1.1);
  }

  .nav-btn-external:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: scale(0.9);
  }

  .nav-btn-external svg {
    width: 20px;
    height: 20px;
  }

  .contador-externo {
    color: white;
    font-weight: 600;
    font-size: 1rem;
    min-width: 50px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .auto-indicator {
    font-size: 0.8rem;
    transition: all 0.3s ease;
  }

  .auto-indicator.active {
    color: #10b981;
    animation: autoPlayPulse 3s infinite;
  }

  .auto-indicator.paused {
    color: #f59e0b;
    opacity: 0.8;
  }

  @keyframes autoPlayPulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(0.9);
    }
  }

  /* 🎯 MENSAJE MOTIVACIONAL MIENTRAS CARGA */
  .hero-motivacional {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    border-radius: 24px;
    padding: 40px;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
  }

  .hero-motivacional::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  .motivacion-container {
    text-align: center;
    color: white;
    max-width: 600px;
    z-index: 1;
    position: relative;
  }

  /* 🎵 ICONO ACORDEÓN ANIMADO */
  .icono-acordeon {
    margin-bottom: 32px;
    position: relative;
  }

  .acordeon-animado {
    font-size: 4rem;
    display: block;
    margin-bottom: 16px;
    animation: acordeon-float 3s ease-in-out infinite;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  .notas-musicales {
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  .nota {
    font-size: 1.5rem;
    opacity: 0.8;
    animation: nota-bounce 2s ease-in-out infinite;
  }

  .nota:nth-child(1) { animation-delay: 0s; }
  .nota:nth-child(2) { animation-delay: 0.3s; }
  .nota:nth-child(3) { animation-delay: 0.6s; }

  /* 🚀 MENSAJE PRINCIPAL */
  .mensaje-principal {
    margin-bottom: 32px;
  }

  .titulo-bienvenida {
    font-size: 2.5rem;
    font-weight: 900;
    margin: 0 0 16px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    background: linear-gradient(45deg, #ffffff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: titulo-glow 2s ease-in-out infinite alternate;
  }

  .subtitulo-motivacional {
    font-size: 1.2rem;
    opacity: 0.9;
    margin: 0;
    line-height: 1.6;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  /* ✨ CARACTERÍSTICAS DESTACADAS */
  .caracteristicas-destacadas {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }

  .caracteristica {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    min-width: 120px;
  }

  .caracteristica:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  .icono-caracteristica {
    font-size: 2rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .texto-caracteristica {
    font-size: 0.9rem;
    font-weight: 600;
    text-align: center;
    opacity: 0.9;
  }

  /* 🔄 INDICADOR DE CARGA SUTIL */
  .indicador-carga {
    margin-top: 24px;
  }

  .puntos-carga {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .punto {
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    animation: punto-pulse 1.5s ease-in-out infinite;
  }

  .punto:nth-child(1) { animation-delay: 0s; }
  .punto:nth-child(2) { animation-delay: 0.2s; }
  .punto:nth-child(3) { animation-delay: 0.4s; }

  .texto-carga {
    font-size: 0.9rem;
    opacity: 0.7;
    margin: 0;
    font-style: italic;
  }

  /* 🎭 ANIMACIONES */
  @keyframes acordeon-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes nota-bounce {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }

  @keyframes titulo-glow {
    0% { filter: brightness(1) drop-shadow(0 0 5px rgba(255, 255, 255, 0.3)); }
    100% { filter: brightness(1.1) drop-shadow(0 0 10px rgba(255, 255, 255, 0.5)); }
  }

  @keyframes punto-pulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 768px) {
    .hero-motivacional {
      padding: 24px;
      min-height: 350px;
    }

    .titulo-bienvenida {
      font-size: 2rem;
    }

    .subtitulo-motivacional {
      font-size: 1rem;
    }

    .caracteristicas-destacadas {
      gap: 16px;
    }

    .caracteristica {
      min-width: 100px;
      padding: 12px;
    }

    .acordeon-animado {
      font-size: 3rem;
    }
    
    /* ✅ NUEVO: OPTIMIZACIONES PARA PANTALLAS PEQUEÑAS */
    .slider-container {
      padding: 16px;
    }
    
    .hero-actividad {
      grid-template-columns: 1fr;
      gap: 16px;
      padding: 16px;
    }
    
    .titulo-principal {
      font-size: 1.8rem;
      margin-bottom: 12px;
    }
    
    /* ✅ NUEVO: BOTONES LADO A LADO EN MÓVILES */
    .botones-container {
      flex-direction: row; /* ✅ NUEVO: Mantener lado a lado */
      gap: 8px;
      width: 100%;
      flex-wrap: wrap; /* ✅ NUEVO: Permitir wrap si es necesario */
    }
    
    .boton-continuar {
      padding: 8px 12px; /* ✅ NUEVO: Reducir padding */
      font-size: 0.9rem;
      flex: 1; /* ✅ NUEVO: Ocupar espacio disponible */
      min-width: 0; /* ✅ NUEVO: Permitir que se reduzca */
    }
    
    .boton-mis-cursos {
      padding: 6px 10px; /* ✅ NUEVO: Reducir padding */
      font-size: 0.9rem;
      flex: 1; /* ✅ NUEVO: Ocupar espacio disponible */
      min-width: 0; /* ✅ NUEVO: Permitir que se reduzca */
    }
    
    .imagen-contenedor {
      width: 280px; /* ✅ NUEVO: Aumentar de 200px a 280px para pantallas estrechas */
      height: 210px; /* ✅ NUEVO: Aumentar de 150px a 210px para pantallas estrechas */
    }
    
    /* ✅ NUEVO: ASEGURAR QUE LAS FLECHAS ESTÉN OCULTAS EN MÓVILES */
    .nav-btn-external {
      opacity: 0 !important;
      pointer-events: none !important;
    }
    
    .icono-flecha {
      opacity: 0 !important;
      pointer-events: none !important;
    }
  }
  
  /* ✅ NUEVO: MEDIA QUERY PARA PANTALLAS MUY PEQUEÑAS */
  @media (max-width: 480px) {
    .slider-container {
      padding: 12px;
    }
    
    .hero-actividad {
      padding: 12px;
      gap: 12px;
    }
    
    .titulo-principal {
      font-size: 1.5rem;
      margin-bottom: 10px;
    }
    
    .boton-continuar {
      padding: 8px 14px;
      font-size: 0.85rem;
    }
    
    .boton-mis-cursos {
      padding: 6px 12px;
      font-size: 0.8rem;
      margin-left: 6px;
    }
    
    .imagen-contenedor {
      width: 220px; /* ✅ NUEVO: Aumentar de 150px a 220px para pantallas muy pequeñas */
      height: 165px; /* ✅ NUEVO: Aumentar de 120px a 165px para pantallas muy pequeñas */
    }
    
    .estadisticas {
      gap: 16px;
    }
    
    .stat .valor {
      font-size: 1.2rem;
    }
    
      /* ✅ NUEVO: ASEGURAR QUE LAS FLECHAS ESTÉN OCULTAS EN PANTALLAS MUY PEQUEÑAS */
  .nav-btn-external {
    opacity: 0 !important;
    pointer-events: none !important;
  }
  
  .icono-flecha {
    opacity: 0 !important;
    pointer-events: none !important;
  }
  
  /* ✅ NUEVO: BOTONES EN PANTALLAS MUY PEQUEÑAS */
  .botones-container {
    flex-direction: row; /* ✅ NUEVO: Mantener lado a lado */
    gap: 6px;
    width: 100%;
    flex-wrap: wrap; /* ✅ NUEVO: Permitir wrap si es necesario */
  }
  
      .boton-continuar {
      flex: 1; /* ✅ NUEVO: Ocupar espacio disponible */
      min-width: 0; /* ✅ NUEVO: Permitir que se reduzca */
      padding: 6px 10px; /* ✅ NUEVO: Padding ultra-compacto */
    }
    
    .boton-mis-cursos {
      flex: 1; /* ✅ NUEVO: Ocupar espacio disponible */
      min-width: 0; /* ✅ NUEVO: Permitir que se reduzca */
      padding: 5px 8px; /* ✅ NUEVO: Padding ultra-compacto */
    }
}

/* ✅ NUEVO: CSS ESPECÍFICO PARA PANTALLAS ESTRECHAS (400-500px) */
@media (min-width: 400px) and (max-width: 500px) {
  .botones-container {
    flex-direction: row;
    gap: 10px;
  }
  
  .boton-continuar {
    flex: 1;
    min-width: 0;
    font-size: 0.85rem;
    padding: 6px 10px; /* ✅ NUEVO: Padding más compacto */
  }
  
  .boton-mis-cursos {
    flex: 1;
    min-width: 0;
    font-size: 0.8rem;
    padding: 5px 8px; /* ✅ NUEVO: Padding más compacto */
  }
  
  .imagen-contenedor {
    width: 300px; /* ✅ NUEVO: Imagen más grande para pantallas estrechas */
    height: 225px;
    }
  }

  /* 📍 INDICADORES DEL SLIDER */
  .slider-indicators {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 20px;
    padding: 0 20px;
  }

  .indicator {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
  }

  .indicator:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
    transform: scale(1.1);
  }

  .indicator.active {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.7);
    transform: scale(1.15);
    box-shadow: 0 4px 20px rgba(255, 255, 255, 0.2);
  }

  .tipo-indicator {
    font-size: 1.2rem;
  }

  .contador {
    opacity: 0.8;
    font-size: 0.85rem;
    margin-left: 8px;
  }
</style> 