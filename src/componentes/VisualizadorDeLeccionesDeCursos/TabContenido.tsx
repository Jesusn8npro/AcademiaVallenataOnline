import React, { useEffect, useRef, useState } from 'react'
import './TabContenido.css'

interface TabContenidoProps {
    clases?: any[]
    leccionActiva?: string
    progreso?: Record<string, any>
    curso?: any
    modoSPA?: boolean
    onCambiarLeccion?: (leccion: any) => void
}

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

function obtenerMiniatura(videoUrl: string): string {
    if (!videoUrl) return '/placeholder-video.jpg'

    const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch?.[1]) {
        return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`
    }

    const bunnyMatch = videoUrl.match(/iframe\.mediadelivery\.net\/(?:embed|play)\/([0-9]+)\/([a-zA-Z0-9-]+)/)
    if (bunnyMatch) {
        return `https://iframe.mediadelivery.net/thumbnail/${bunnyMatch[1]}/${bunnyMatch[2]}`
    }

    return '/placeholder-video.jpg'
}

function formatearDuracion(segundos: number): string {
    if (!segundos) return '0:00'
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = Math.floor(segundos % 60)

    if (horas > 0) {
        return `${horas}:${minutos < 10 ? '0' : ''}${minutos}:${segs < 10 ? '0' : ''}${segs}`
    }
    return `${minutos}:${segs < 10 ? '0' : ''}${segs}`
}

const TabContenido: React.FC<TabContenidoProps> = ({
    clases = [],
    leccionActiva = '',
    progreso = {},
    curso = {},
    modoSPA = false,
    onCambiarLeccion
}) => {
    const contenedorScrollRef = useRef<HTMLDivElement>(null)
    const [moduloActualIndex, setModuloActualIndex] = useState(0)
    const [modulosData, setModulosData] = useState<any[]>([])

    useEffect(() => {
        let modulos: any[] = []

        if (curso && Array.isArray(curso.modulos) && curso.modulos.length > 0) {
            modulos = curso.modulos.map((modulo: any) => ({
                id: modulo.id,
                titulo: modulo.titulo,
                slug: modulo.slug,
                lecciones: modulo.lecciones || [],
                esDeModulo: true
            }))
        } else if (clases && clases.length > 0) {
            modulos = [{
                id: 'tutorial-clases',
                titulo: 'Clases del Tutorial',
                slug: 'clases',
                lecciones: clases,
                esDeModulo: false
            }]
        }

        setModulosData(modulos)

        const indiceModulo = modulos.findIndex((modulo: any) =>
            modulo.lecciones.some((leccion: any) => esLeccionActiva(leccion))
        )
        setModuloActualIndex(indiceModulo >= 0 ? indiceModulo : 0)
    }, [curso, clases, leccionActiva])

    function esLeccionActiva(leccion: any): boolean {
        if (!leccion || !leccionActiva) return false

        const idURL = String(leccionActiva).toLowerCase()
        const idLeccion = String(leccion.id).toLowerCase()
        const slugLeccion = (leccion.slug || '').toLowerCase()
        const slugGenerado = leccion.titulo ? generarSlug(leccion.titulo).toLowerCase() : ''

        return idLeccion === idURL ||
            slugLeccion === idURL ||
            slugGenerado === idURL
    }

    function esLeccionCompletada(leccionId: string): boolean {
        const p = progreso[leccionId]
        return p === true || (typeof p === 'number' && p >= 90)
    }

    function irALeccion(leccion: any) {
        const cursoSlug = curso?.slug || (curso?.titulo ? generarSlug(curso.titulo) : '')
        const leccionSlug = leccion?.slug || (leccion?.titulo ? generarSlug(leccion.titulo) : '')
        const moduloActual = modulosData[moduloActualIndex]

        if (moduloActual?.esDeModulo) {
            const moduloSlug = moduloActual.slug || (moduloActual.titulo ? generarSlug(moduloActual.titulo) : '')
            if (cursoSlug && moduloSlug && leccionSlug) {
                window.location.href = `/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`
                return
            }
        } else {
            if (cursoSlug && leccionSlug) {
                window.location.href = `/tutoriales/${cursoSlug}/clase/${leccionSlug}`
                return
            }
        }

        if (onCambiarLeccion) {
            onCambiarLeccion(leccion)
        }
    }

    function navegarModulo(direccion: 'anterior' | 'siguiente') {
        if (direccion === 'anterior' && moduloActualIndex > 0) {
            setModuloActualIndex(moduloActualIndex - 1)
        } else if (direccion === 'siguiente' && moduloActualIndex < modulosData.length - 1) {
            setModuloActualIndex(moduloActualIndex + 1)
        }
    }

    useEffect(() => {
        setTimeout(() => {
            const elLeccionActiva = document.querySelector('.tbc-lesson-card--active')
            if (elLeccionActiva && contenedorScrollRef.current) {
                elLeccionActiva.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
            }
        }, 100)
    }, [moduloActualIndex])

    const moduloActual = modulosData[moduloActualIndex]
    const leccionesDelModulo = moduloActual?.lecciones || []

    if (modulosData.length === 0) {
        return (
            <div className="tbc-empty-state">
                <div className="tbc-empty-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                </div>
                <p className="tbc-empty-text">No hay clases disponibles en este momento.</p>
            </div>
        )
    }

    return (
        <div className="tbc-wrapper">
            <div className="tbc-module-nav">
                <button
                    className={`tbc-nav-btn ${moduloActualIndex === 0 ? 'tbc-nav-btn--disabled' : ''}`}
                    onClick={() => navegarModulo('anterior')}
                    disabled={moduloActualIndex === 0}
                    aria-label="Módulo anterior"
                    type="button"
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>

                <div className="tbc-module-info">
                    <h3 className="tbc-module-title">{moduloActual?.titulo || 'Módulo'}</h3>
                    <span className="tbc-module-counter">{moduloActualIndex + 1} de {modulosData.length}</span>
                </div>

                <button
                    className={`tbc-nav-btn ${moduloActualIndex === modulosData.length - 1 ? 'tbc-nav-btn--disabled' : ''}`}
                    onClick={() => navegarModulo('siguiente')}
                    disabled={moduloActualIndex === modulosData.length - 1}
                    aria-label="Módulo siguiente"
                    type="button"
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>

            <div className="tbc-scroll-area" ref={contenedorScrollRef}>
                <div className="tbc-lessons-track">
                    {leccionesDelModulo.map((leccion: any) => (
                        <div
                            key={leccion.id}
                            className={`tbc-lesson-card ${esLeccionActiva(leccion) ? 'tbc-lesson-card--active' : ''} ${esLeccionCompletada(leccion.id) ? 'tbc-lesson-card--completed' : ''}`}
                            onClick={() => irALeccion(leccion)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Ir a la lección ${leccion.titulo}`}
                        >
                            <div className="tbc-lesson-thumb">
                                {leccion.video_url && (leccion.video_url.includes('youtube') || leccion.video_url.includes('youtu.be')) ? (
                                    <img
                                        src={obtenerMiniatura(leccion.video_url)}
                                        alt={leccion.titulo}
                                        loading="lazy"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-video.jpg' }}
                                    />
                                ) : leccion.video_url ? (
                                    <div className="tbc-part-type-wrapper">
                                        <div className="tbc-part-type-content">
                                            <span className="tbc-part-type-label">{leccion.tipo_parte || 'Clase'}</span>
                                            <span className="tbc-part-type-title">{leccion.titulo}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="tbc-thumb-placeholder">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="23 7 16 12 23 17 23 7" />
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                    </div>
                                )}

                                <div className="tbc-play-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                </div>

                                {leccion.duracion && (
                                    <div className="tbc-duration-badge">{formatearDuracion(leccion.duracion)}</div>
                                )}
                            </div>

                            <div className="tbc-lesson-info">
                                <div className="tbc-lesson-title">{leccion.titulo}</div>
                                <div className="tbc-lesson-status">
                                    {esLeccionCompletada(leccion.id) ? (
                                        <div className="tbc-status--completed">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>Completada</span>
                                        </div>
                                    ) : progreso[leccion.id] && progreso[leccion.id] > 0 ? (
                                        <div className="tbc-status--progress">
                                            <div className="tbc-progress-bar">
                                                <div className="tbc-progress-fill" style={{ width: `${Math.round(progreso[leccion.id])}%` }}></div>
                                            </div>
                                            <span>{Math.round(progreso[leccion.id])}%</span>
                                        </div>
                                    ) : (
                                        <div className="tbc-status--pending">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="5 3 19 12 5 21 5 3" />
                                            </svg>
                                            <span>Pendiente</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="tbc-footer-counter">
                <span>{leccionesDelModulo.length} lecciones en este módulo</span>
            </div>
        </div>
    )
}

export default TabContenido
