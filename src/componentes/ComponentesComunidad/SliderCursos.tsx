import React, { useState, useEffect } from 'react';
import { supabase } from '../../servicios/supabaseCliente';
import './SliderCursos.css';

interface Inscripcion {
  id: string;
  curso_id?: string;
  tutorial_id?: string;
  completado: boolean;
  fecha_inscripcion: string;
  cursos?: {
    id: string;
    titulo: string;
    imagen_url: string;
    slug: string;
    descripcion?: string;
    nivel?: string;
    duracion_estimada?: string;
    precio_normal?: number;
  };
  tutoriales?: {
    id: string;
    titulo: string;
    imagen_url: string;
    slug: string;
    descripcion?: string;
    nivel?: string;
    duracion_estimada?: string;
    precio_normal?: number;
    artista?: string;
    acordeonista?: string;
    tonalidad?: string;
  };
}

interface Progreso {
  partes_completadas: number;
  total_partes: number;
  progreso: number;
}

const SliderCursos: React.FC = () => {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [progreso, setProgreso] = useState<Record<string, Progreso>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar inscripciones del usuario (usando la misma lÃ³gica que MIS CURSOS)
  useEffect(() => {
    const cargarInscripciones = async () => {
      try {
        setCargando(true);
        setError(null);

        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('Usuario no autenticado, usando datos de ejemplo');
          const datosEjemplo = obtenerInscripcionesEjemplo();
          setInscripciones(datosEjemplo);
          await cargarProgresoEjemplo(datosEjemplo);
          setCargando(false);
          return;
        }

        console.log('ðŸ” [SLIDER CURSOS] Cargando inscripciones para usuario:', user.id);

        // Primero obtener todas las inscripciones del usuario (igual que MIS CURSOS)
        const { data: inscripcionesData, error } = await supabase
          .from('inscripciones')
          .select('*')
          .eq('usuario_id', user.id)
          .order('fecha_inscripcion', { ascending: false });

        if (error) {
          throw error;
        }

        console.log('ðŸ“‹ [SLIDER CURSOS] Inscripciones encontradas:', inscripcionesData?.length || 0);

        if (!inscripcionesData || inscripcionesData.length === 0) {
          console.log('âŒ [SLIDER CURSOS] No se encontraron inscripciones');
          const datosEjemplo = obtenerInscripcionesEjemplo();
          setInscripciones(datosEjemplo);
          await cargarProgresoEjemplo(datosEjemplo);
          setCargando(false);
          return;
        }

        // Separar las inscripciones por tipo (igual que MIS CURSOS)
        const inscripcionesCursos = inscripcionesData.filter((i: any) => i.curso_id);
        const inscripcionesTutoriales = inscripcionesData.filter((i: any) => i.tutorial_id);

        console.log('ðŸ“Š [SLIDER CURSOS] DistribuciÃ³n de inscripciones:', {
          cursos: inscripcionesCursos.length,
          tutoriales: inscripcionesTutoriales.length
        });

        // Obtener datos de cursos si hay inscripciones a cursos
        let cursosData: any[] = [];
        if (inscripcionesCursos.length > 0) {
          const cursoIds = inscripcionesCursos.map((i: any) => i.curso_id);
          const { data: cursos } = await supabase
            .from('cursos')
            .select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, slug')
            .in('id', cursoIds);
          cursosData = cursos || [];
          console.log('ðŸ“š [SLIDER CURSOS] Cursos cargados:', cursosData.length);
        }

        // Obtener datos de tutoriales si hay inscripciones a tutoriales
        let tutorialesData: any[] = [];
        if (inscripcionesTutoriales.length > 0) {
          const tutorialIds = inscripcionesTutoriales.map((i: any) => i.tutorial_id);
          const { data: tutoriales } = await supabase
            .from('tutoriales')
            .select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, artista, acordeonista, tonalidad')
            .in('id', tutorialIds);
          tutorialesData = tutoriales || [];
          console.log('ðŸŽµ [SLIDER CURSOS] Tutoriales cargados:', tutorialesData.length);
        }

        // Combinar todo (igual que MIS CURSOS)
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

        // Reordenar por fecha de inscripciÃ³n
        inscripcionesCombinadas.sort((a, b) => new Date(b.fecha_inscripcion).getTime() - new Date(a.fecha_inscripcion).getTime());

        console.log('âœ… [SLIDER CURSOS] Inscripciones finales:', inscripcionesCombinadas.length);

        setInscripciones(inscripcionesCombinadas);
        await cargarProgresoReal(inscripcionesCombinadas, user.id);
      } catch (err) {
        console.error('âŒ [SLIDER CURSOS] Error cargando inscripciones:', err);
        console.log('Usando datos de ejemplo debido a error');
        const datosEjemplo = obtenerInscripcionesEjemplo();
        setInscripciones(datosEjemplo);
        await cargarProgresoEjemplo(datosEjemplo);
      } finally {
        setCargando(false);
      }
    };

    cargarInscripciones();
  }, []);

  // FunciÃ³n para obtener datos de ejemplo
  const obtenerInscripcionesEjemplo = (): Inscripcion[] => {
    return [
      {
        id: '1',
        curso_id: '1',
        completado: false,
        fecha_inscripcion: '2025-07-17T10:00:00Z',
        cursos: {
          id: '1',
          titulo: 'AcordeÃ³n Desde Cero',
          imagen_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=300&fit=crop',
          slug: 'acordeon-desde-cero',
          descripcion: 'Aprende acordeÃ³n desde cero con tÃ©cnicas bÃ¡sicas',
          nivel: 'Principiante',
          duracion_estimada: '8 horas',
          precio_normal: 99
        }
      },
      {
        id: '2',
        tutorial_id: '1',
        completado: false,
        fecha_inscripcion: '2025-07-09T14:30:00Z',
        tutoriales: {
          id: '1',
          titulo: 'Tutorial de Vallenato BÃ¡sico',
          imagen_url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=500&h=300&fit=crop',
          slug: 'tutorial-vallenato-basico',
          descripcion: 'Tutorial paso a paso de vallenato clÃ¡sico',
          nivel: 'Intermedio',
          duracion_estimada: '6 horas',
          precio_normal: 79,
          artista: 'Diomedes DÃ­az',
          acordeonista: 'Juancho Rois',
          tonalidad: 'Mayor'
        }
      },
      {
        id: '3',
        curso_id: '2',
        completado: false,
        fecha_inscripcion: '2025-07-09T16:45:00Z',
        cursos: {
          id: '2',
          titulo: 'TeorÃ­a Musical Avanzada',
          imagen_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop',
          slug: 'teoria-musical-avanzada',
          descripcion: 'Domina la teorÃ­a musical avanzada',
          nivel: 'Avanzado',
          duracion_estimada: '12 horas',
          precio_normal: 149
        }
      }
    ];
  };

  // FunciÃ³n para cargar progreso de ejemplo
  const cargarProgresoEjemplo = async (inscripciones: Inscripcion[]) => {
    const progresoMap: Record<string, Progreso> = {};

    inscripciones.forEach((inscripcion, index) => {
      const contenidoId = inscripcion.curso_id || inscripcion.tutorial_id;
      if (contenidoId) {
        // Progreso variado para cada curso
        const progresosEjemplo = [25, 60, 0]; // 25%, 60%, 0%
        const totalesEjemplo = [12, 8, 15]; // Total de lecciones
        const completadasEjemplo = [3, 5, 0]; // Lecciones completadas

        progresoMap[contenidoId] = {
          partes_completadas: completadasEjemplo[index] || 0,
          total_partes: totalesEjemplo[index] || 0,
          progreso: progresosEjemplo[index] || 0
        };
      }
    });

    setProgreso(progresoMap);
  };

  // Cargar progreso real usando la misma lÃ³gica que TarjetaCurso
  const cargarProgresoReal = async (inscripciones: Inscripcion[], usuarioId: string) => {
    const progresoMap: Record<string, Progreso> = {};

    for (const inscripcion of inscripciones) {
      try {
        const esCurso = !!inscripcion.cursos;
        const esTutorial = !!inscripcion.tutoriales;
        const contenidoId = esCurso ? inscripcion.curso_id : inscripcion.tutorial_id;

        if (!contenidoId) continue;

        if (esCurso) {
          // Progreso de curso
          const { data: modulosData } = await supabase
            .from('modulos')
            .select('id')
            .eq('curso_id', contenidoId);

          if (modulosData && modulosData.length > 0) {
            const moduloIds = modulosData.map((m: any) => m.id);

            // Obtener lecciones
            const { data: leccionesData } = await supabase
              .from('lecciones')
              .select('id')
              .in('modulo_id', moduloIds);

            const leccionIds = (leccionesData || []).map((l: any) => l.id);

            if (leccionIds.length > 0) {
              const { data: progreso } = await supabase
                .from('progreso_lecciones')
                .select('leccion_id, estado')
                .eq('usuario_id', usuarioId)
                .in('leccion_id', leccionIds);

              const completadas = progreso?.filter((p: any) => p.estado === 'completada').length || 0;
              const total = leccionIds.length;
              const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

              progresoMap[contenidoId] = {
                partes_completadas: completadas,
                total_partes: total,
                progreso: porcentaje
              };
            }
          }
        } else if (esTutorial) {
          // Progreso de tutorial (igual que TarjetaCurso)
          const { data: partes } = await supabase
            .from('partes_tutorial')
            .select('id')
            .eq('tutorial_id', contenidoId);

          if (partes && partes.length > 0) {
            const { data: progreso } = await supabase
              .from('progreso_tutorial')
              .select('parte_tutorial_id, completado')
              .eq('usuario_id', usuarioId)
              .eq('tutorial_id', contenidoId);

            const completadas = progreso?.filter((p: any) => p.completado).length || 0;
            const total = partes.length;
            const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

            progresoMap[contenidoId] = {
              partes_completadas: completadas,
              total_partes: total,
              progreso: porcentaje
            };
          }
        }
      } catch (error) {
        console.error('[SliderCursos] Error cargando progreso:', error);
        // Usar valores por defecto
        const contenidoId = inscripcion.curso_id || inscripcion.tutorial_id;
        if (contenidoId) {
          progresoMap[contenidoId] = {
            partes_completadas: 0,
            total_partes: 0,
            progreso: 0
          };
        }
      }
    }

    setProgreso(progresoMap);
  };

  const totalItems = inscripciones.length;
  const maxIndex = Math.max(0, totalItems - 1);

  // NavegaciÃ³n del slider
  const nextSlide = () => {
    if (currentIndex < maxIndex && totalItems > 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0 && totalItems > 1) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < totalItems) {
      setCurrentIndex(index);
    }
  };

  // Determinar texto del botÃ³n
  const determinarTextoBoton = (inscripcion: Inscripcion) => {
    const esCurso = !!inscripcion.cursos;
    const contenidoId = esCurso ? inscripcion.curso_id : inscripcion.tutorial_id;
    const progresoReal = contenidoId ? progreso[contenidoId] : null;
    const tieneProgreso = progresoReal && (progresoReal.partes_completadas || 0) > 0;

    if (inscripcion.completado) return 'Completado';
    if (tieneProgreso) return 'Continuar';
    return 'Empezar';
  };

  // NavegaciÃ³n inteligente
  const navegarAContenido = async (inscripcion: Inscripcion) => {
    const esCurso = !!inscripcion.cursos;
    const contenido = esCurso ? inscripcion.cursos : inscripcion.tutoriales;

    if (!contenido) return;

    const contenidoId = esCurso ? inscripcion.curso_id : inscripcion.tutorial_id;
    const progresoReal = contenidoId ? progreso[contenidoId] : null;
    const tieneProgreso = progresoReal && (progresoReal.partes_completadas || 0) > 0;

    if (esCurso) {
      // Navegar a curso
      window.location.href = `/cursos/${contenido.slug}`;
    } else {
      // Navegar a tutorial
      window.location.href = `/tutoriales/${contenido.slug}`;
    }
  };

  // Manejo de teclado
  const handleKeydown = (event: React.KeyboardEvent) => {
    if (totalItems <= 1) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        prevSlide();
        break;
      case 'ArrowRight':
        event.preventDefault();
        nextSlide();
        break;
      case 'Home':
        event.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        event.preventDefault();
        goToSlide(totalItems - 1);
        break;
    }
  };

  if (cargando) {
    return (
      <div className="slider-cursos-contenedor">
        <div className="slider-cursos-header">
          <h3 className="slider-cursos-titulo">
            <span className="slider-cursos-icono">🚀</span> Continúa tu aprendizaje
          </h3>
        </div>
        <div className="slider-cursos-loading">
          <div className="slider-cursos-spinner"></div>
          <p>Cargando tus cursos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slider-cursos-contenedor">
        <div className="slider-cursos-header">
          <h3 className="slider-cursos-titulo">
            <span className="slider-cursos-icono">🚀</span> Continúa tu aprendizaje
          </h3>
        </div>
        <div className="slider-cursos-error">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  if (inscripciones.length === 0) {
    return (
      <div className="slider-cursos-contenedor">
        <div className="slider-cursos-header">
          <h3 className="slider-cursos-titulo">
            <span className="slider-cursos-icono">🚀</span> Continúa tu aprendizaje
          </h3>
        </div>
        <div className="slider-cursos-empty">
          <p>No tienes cursos inscritos aún.</p>
          <a href="/cursos" className="slider-cursos-btn-explorar">Explorar cursos</a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="slider-cursos-contenedor"
      onKeyDown={handleKeydown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="slider-cursos-header">
        <h3 className="slider-cursos-titulo">
          <span className="slider-cursos-icono">🚀</span> Continúa tu aprendizaje
        </h3>
      </div>

      {/* Controles de navegaciÃ³n */}
      {totalItems > 0 && (
        <div className="slider-cursos-nav-controls">
          <button
            className="slider-cursos-nav-btn slider-cursos-nav-prev"
            onClick={prevSlide}
            disabled={currentIndex === 0 || totalItems <= 1}
            aria-label="Curso anterior"
            title="Curso anterior"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>

          <span className="slider-cursos-nav-indicator">{currentIndex + 1} / {totalItems}</span>

          <button
            className="slider-cursos-nav-btn slider-cursos-nav-next"
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex || totalItems <= 1}
            aria-label="Siguiente curso"
            title="Siguiente curso"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9,6 15,12 9,18"></polyline>
            </svg>
          </button>
        </div>
      )}

      {/* Carousel */}
      <div className="slider-cursos-carousel-wrapper">
        <div className="slider-cursos-carousel-container">
          <div
            className="slider-cursos-carousel-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {inscripciones.map((inscripcion) => (
              <div key={inscripcion.id} className="slider-cursos-slide">
                <div className="slider-cursos-card">
                  <div className="slider-cursos-imagen-container">
                    <img
                      src={inscripcion.cursos?.imagen_url || inscripcion.tutoriales?.imagen_url || '/images/default-curso.jpg'}
                      alt={inscripcion.cursos?.titulo || inscripcion.tutoriales?.titulo}
                      className="slider-cursos-imagen"
                    />
                    <div className="slider-cursos-badge-tipo">
                      {inscripcion.cursos ? 'Curso' : 'Tutorial'}
                    </div>
                  </div>

                  <div className="slider-cursos-contenido-card">
                    <h4 className="slider-cursos-titulo-curso">
                      {inscripcion.cursos?.titulo || inscripcion.tutoriales?.titulo}
                    </h4>

                    {/* Barra de progreso */}
                    <div className="slider-cursos-progreso-wrapper">
                      {(() => {
                        const esCurso = !!inscripcion.cursos;
                        const contenidoId = esCurso ? inscripcion.curso_id : inscripcion.tutorial_id;
                        const progresoReal = contenidoId ? progreso[contenidoId] : null;
                        const porcentaje = progresoReal ? progresoReal.progreso : 0;

                        return (
                          <div className="slider-cursos-progreso">
                            <div className="slider-cursos-progreso-bar">
                              <div
                                className="slider-cursos-progreso-fill"
                                style={{ width: `${porcentaje}%` }}
                              ></div>
                            </div>
                            <span className="slider-cursos-progreso-texto">{Math.round(porcentaje)}%</span>
                          </div>
                        );
                      })()}
                    </div>

                    <button
                      className={`slider-cursos-btn-accion ${inscripcion.completado ? 'completado' : ''}`}
                      onClick={() => navegarAContenido(inscripcion)}
                    >
                      {determinarTextoBoton(inscripcion)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indicadores de pÃ¡gina */}
      {totalItems > 1 && (
        <div className="slider-cursos-pagination-dots">
          {Array.from({ length: totalItems }, (_, i) => (
            <button
              key={i}
              className={`slider-cursos-dot ${i === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={`Ir al curso ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SliderCursos;

