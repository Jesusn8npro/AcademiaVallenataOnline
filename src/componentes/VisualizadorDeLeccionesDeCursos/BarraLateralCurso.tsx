import React, { useState, useEffect } from 'react'
import './BarraLateralCurso.css'

interface BarraLateralCursoProps {
  curso: any
  moduloActivo: string
  leccionActiva: string
  progreso?: Record<string, number | boolean>
  tipo?: 'curso' | 'tutorial'
  mostrarSidebar?: boolean
  onCerrarSidebar?: () => void
}

// Función para generar slug
function generarSlug(texto: string = ''): string {
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const BarraLateralCurso: React.FC<BarraLateralCursoProps> = ({
  curso,
  moduloActivo,
  leccionActiva,
  progreso = {},
  tipo = 'curso',
  mostrarSidebar = true,
  onCerrarSidebar
}) => {
  const [modulosExpandidos, setModulosExpandidos] = useState<Record<string, boolean>>({})
  const [cursoAdaptado, setCursoAdaptado] = useState<any>(curso)

  // Adaptar tutoriales para funcionar como cursos
  useEffect(() => {
    if (curso && !curso.modulos) {
      const opcionesLecciones = ['partes_tutorial', 'clases_tutorial', 'partes', 'clases']

      let leccionesArray = null
      for (const opcion of opcionesLecciones) {
        if (Array.isArray(curso[opcion]) && curso[opcion].length > 0) {
          leccionesArray = curso[opcion]
          break
        }
      }

      if (leccionesArray && leccionesArray.length > 0) {
        const leccionesUnicas = leccionesArray.filter((parte: any, index: number, array: any[]) =>
          array.findIndex((p: any) => p.id === parte.id) === index
        )

        const partesNormalizadas = leccionesUnicas.map((parte: any) => ({
          ...parte,
          thumbnail_url: parte.thumbnail_url || parte.thumbnail || parte.video_miniatura_url || '',
        }))

        setCursoAdaptado({
          ...curso,
          modulos: [{
            id: 'tutorial-partes',
            titulo: 'Clases',
            lecciones: partesNormalizadas
          }]
        })
      }
    } else {
      setCursoAdaptado(curso)
    }
  }, [curso])

  // Expandir módulos por defecto
  useEffect(() => {
    if (cursoAdaptado?.modulos) {
      const nuevosExpandidos: Record<string, boolean> = { ...modulosExpandidos }
      cursoAdaptado.modulos.forEach((modulo: any) => {
        if (!(modulo.id in nuevosExpandidos)) {
          nuevosExpandidos[modulo.id] = true
        }
      })
      setModulosExpandidos(nuevosExpandidos)
    }
  }, [cursoAdaptado])

  // Funciones para manejo de videos
  function obtenerVideoId(url: string): { source: 'youtube' | 'bunny' | null; id: string | null; libraryId: string | null } {
    if (!url) return { source: null, id: null, libraryId: null }

    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ]

    for (const pattern of youtubePatterns) {
      const match = url.match(pattern)
      if (match?.[1]) {
        return { source: 'youtube', id: match[1], libraryId: null }
      }
    }

    const bunnyPatterns = [
      /iframe\.mediadelivery\.net\/embed\/([0-9]+)\/([a-zA-Z0-9-]+)/,
      /iframe\.mediadelivery\.net\/play\/([0-9]+)\/([a-zA-Z0-9-]+)/
    ]

    for (const pattern of bunnyPatterns) {
      const match = url.match(pattern)
      if (match) {
        return { source: 'bunny', id: match[2], libraryId: match[1] }
      }
    }

    return { source: null, id: null, libraryId: null }
  }

  function obtenerMiniatura(videoUrl: string): string {
    const { source, id, libraryId } = obtenerVideoId(videoUrl)

    if (source === 'youtube' && id) {
      return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
    } else if (source === 'bunny' && libraryId && id) {
      return `https://iframe.mediadelivery.net/thumbnail/${libraryId}/${id}`
    }

    return 'https://academiavallenataonline.com/wp-content/uploads/2023/06/placeholder-video.jpg'
  }

  function toggleModulo(moduloId: string) {
    setModulosExpandidos(prev => ({
      ...prev,
      [moduloId]: !prev[moduloId]
    }))
  }

  function irALeccion(modulo: any, leccion: any) {
    const cursoSlug = curso?.slug || (curso?.titulo ? generarSlug(curso.titulo) : '')
    const moduloSlug = modulo?.slug || (modulo?.titulo ? generarSlug(modulo.titulo) : '')
    const leccionSlug = leccion?.slug || (leccion?.titulo ? generarSlug(leccion.titulo) : '')

    if (tipo === 'curso' && cursoSlug && moduloSlug && leccionSlug) {
      window.location.href = `/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`
    } else if (tipo === 'tutorial' && cursoSlug && leccionSlug) {
      window.location.href = `/tutoriales/${cursoSlug}/clase/${leccionSlug}`
    }
  }

  function esLeccionCompletada(leccionId: string): boolean {
    const p = progreso[leccionId]
    // Soporte para boolean (tutoriales) o porcentaje (cursos)
    return p === true || p >= 90 || p === 100
  }

  function esLeccionActiva(leccion: any): boolean {
    return String(leccion.slug) === String(leccionActiva) ||
      String(leccion.id) === String(leccionActiva) ||
      leccion.id === parseInt(String(leccionActiva))
  }

  function manejarCerrarSidebar(e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation()

    const overlay = document.querySelector('.sidebar-mobile-overlay') as HTMLElement
    if (overlay) {
      overlay.click()
    } else {
      if (onCerrarSidebar) {
        onCerrarSidebar()
      }
    }
  }

  return (
    <div className="blc-container">
      <div className="blc-header">
        <h2>{curso.titulo}</h2>
        <button
          className="blc-close-btn"
          onClick={manejarCerrarSidebar}
          onTouchStart={manejarCerrarSidebar}
          aria-label="Cerrar menú del curso"
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="blc-content">
        {cursoAdaptado?.modulos ? (
          cursoAdaptado.modulos.map((modulo: any) => (
            <div
              key={modulo.id}
              className={`blc-module ${modulo.slug === moduloActivo || modulo.id === 'tutorial-partes' ? 'blc-active' : ''}`}
            >
              <div
                className="blc-module-header"
                onClick={() => toggleModulo(modulo.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleModulo(modulo.id) }}
                role="button"
                tabIndex={0}
                aria-expanded={modulosExpandidos[modulo.id]}
              >
                <span className="blc-module-title">{modulo.titulo}</span>
                <svg
                  className={`blc-toggle-icon ${modulosExpandidos[modulo.id] ? 'blc-expanded' : ''}`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>

              {modulosExpandidos[modulo.id] && (
                <div className="blc-lessons-list">
                  {modulo.lecciones?.length > 0 ? (
                    modulo.lecciones.map((leccion: any) => (
                      <div
                        key={leccion.id}
                        className={`blc-lesson-item ${esLeccionActiva(leccion) ? 'blc-active' : ''} ${esLeccionCompletada(leccion.id) ? 'blc-completed' : ''}`}
                        onClick={() => irALeccion(modulo, leccion)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') irALeccion(modulo, leccion) }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Ir a la lección ${leccion.titulo}`}
                      >
                        <div className="blc-lesson-thumbnail">
                          {leccion.video_url ? (
                            leccion.video_url.includes('youtube.com') || leccion.video_url.includes('youtu.be') ? (
                              <img
                                src={obtenerMiniatura(leccion.video_url)}
                                alt={leccion.titulo}
                                loading="lazy"
                                onError={(e) => {
                                  const imgElement = e.currentTarget as HTMLImageElement
                                  if (imgElement) {
                                    imgElement.onerror = null
                                    imgElement.src = 'https://academiavallenataonline.com/wp-content/uploads/2023/06/placeholder-video.jpg'
                                  }
                                }}
                              />
                            ) : (
                              <div className="blc-part-type-container">
                                <div className="blc-part-type">
                                  <span className="blc-type-text">{leccion.tipo_parte || 'Clase'}</span>
                                  <span className="blc-title-text">{leccion.titulo}</span>
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="blc-thumbnail-placeholder">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                              </svg>
                            </div>
                          )}

                          <div className="blc-play-icon">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                        </div>

                        <div className="blc-lesson-info">
                          <div className="blc-lesson-title">{leccion.titulo}</div>

                          <div className="blc-lesson-status">
                            {esLeccionCompletada(leccion.id) ? (
                              <div className="blc-status-completed">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Completada</span>
                              </div>
                            ) : (typeof progreso[leccion.id] === 'number' && progreso[leccion.id] > 0) ? (
                              <div className="blc-status-progress">
                                <div className="blc-progress-bar">
                                  <div className="blc-progress-fill" style={{ width: `${progreso[leccion.id]}%` }}></div>
                                </div>
                                <span>{Math.round(progreso[leccion.id] as number)}%</span>
                              </div>
                            ) : (
                              <div className="blc-status-pending">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                <span>Pendiente</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="blc-no-lessons">No hay lecciones en este módulo.</div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="blc-no-modules">No hay contenido disponible.</div>
        )}
      </div>
    </div>
  )
}

export default BarraLateralCurso
