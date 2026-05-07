import React from 'react'
import './BarraLateralCurso.css'
import { useBarraLateralCurso } from './useBarraLateralCurso'
import { prefetchVideoFirmado } from '../../hooks/useVideoFirmado'

interface BarraLateralCursoProps {
  curso: any
  moduloActivo: string
  leccionActiva: string
  progreso?: Record<string, number | boolean>
  tipo?: 'curso' | 'tutorial'
  onCerrarSidebar?: () => void
}

const BarraLateralCurso: React.FC<BarraLateralCursoProps> = ({
  curso,
  moduloActivo,
  leccionActiva,
  progreso = {},
  tipo = 'curso',
  onCerrarSidebar
}) => {
  const {
    cursoAdaptado, modulosExpandidos,
    obtenerMiniatura, toggleModulo, irALeccion,
    esLeccionCompletada, esLeccionActiva,
  } = useBarraLateralCurso({ curso, leccionActiva, progreso, tipo })

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
                        onMouseEnter={() => {
                          // Prefetch en background: pre-firma la URL antes
                          // del click para que el video aparezca instantaneo.
                          if (tipo === 'tutorial') {
                            prefetchVideoFirmado({ parteId: leccion.id });
                          } else {
                            prefetchVideoFirmado({ leccionId: leccion.id });
                          }
                        }}
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
                            ) : (typeof progreso[leccion.id] === 'number' && (progreso[leccion.id] as number) > 0) ? (
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
