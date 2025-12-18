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

    // YouTube
    const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch?.[1]) {
        return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`
    }

    // Bunny CDN
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

    // Procesar datos y crear módulos
    useEffect(() => {
        let modulos: any[] = []

        if (curso && Array.isArray(curso.modulos) && curso.modulos.length > 0) {
            // Cursos: usar módulos existentes
            modulos = curso.modulos.map((modulo: any) => ({
                id: modulo.id,
                titulo: modulo.titulo,
                slug: modulo.slug,
                lecciones: modulo.lecciones || [],
                esDeModulo: true
            }))
        } else if (clases && clases.length > 0) {
            // Tutoriales: crear módulo único
            modulos = [{
                id: 'tutorial-clases',
                titulo: 'Clases del Tutorial',
                slug: 'clases',
                lecciones: clases,
                esDeModulo: false
            }]
        }

        setModulosData(modulos)

        // Encontrar módulo actual basado en lección activa
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
            // Navegación para cursos
            const moduloSlug = moduloActual.slug || (moduloActual.titulo ? generarSlug(moduloActual.titulo) : '')
            if (cursoSlug && moduloSlug && leccionSlug) {
                window.location.href = `/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`
                return
            }
        } else {
            // Navegación para tutoriales
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

    const moduloActual = modulosData[moduloActualIndex]
    const leccionesDelModulo = moduloActual?.lecciones || []

    if (modulosData.length === 0) {
        return (
            <div className="sin-contenido">
                <div className="sin-contenido-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                </div>
                <p>No hay clases disponibles en este momento.</p>
            </div>
        )
    }

    return (
        <div className="contenedor-principal">
            {/* Navegación de módulos */}
            <div className="navegacion-modulos">
                <button
                    className={`btn-navegacion anterior ${moduloActualIndex === 0 ? 'deshabilitado' : ''}`}
                    onClick={() => navegarModulo('anterior')}
                    disabled={moduloActualIndex === 0}
                    aria-label="Módulo anterior"
                    type="button"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>

                <div className="info-modulo">
                    <h3 className="titulo-modulo">{moduloActual?.titulo || 'Módulo'}</h3>
                    <span className="contador-modulo">{moduloActualIndex + 1} de {modulosData.length}</span>
                </div>

                <button
                    className={`btn-navegacion siguiente ${moduloActualIndex === modulosData.length - 1 ? 'deshabilitado' : ''}`}
                    onClick={() => navegarModulo('siguiente')}
                    disabled={moduloActualIndex === modulosData.length - 1}
                    aria-label="Módulo siguiente"
                    type="button"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>

            {/* Contenedor de scroll */}
            <div className="contenedor-scroll" ref={contenedorScrollRef}>
                <div className="lecciones-contenedor">
                    {leccionesDelModulo.map((leccion: any) => (
                        <div
                            key={leccion.id}
                            className={`leccion-item ${esLeccionActiva(leccion) ? 'activa' : ''} ${esLeccionCompletada(leccion.id) ? 'completada' : ''}`}
                            onClick={() => irALeccion(leccion)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Ir a la lección ${leccion.titulo}`}
                        >
                            <div className="leccion-thumbnail">
                                {leccion.video_url && (leccion.video_url.includes('youtube') || leccion.video_url.includes('youtu.be')) ? (
                                    <img
                                        src={obtenerMiniatura(leccion.video_url)}
                                        alt={leccion.titulo}
                                        loading="lazy"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-video.jpg' }}
                                    />
                                ) : leccion.video_url ? (
                                    <div className="tipo-parte-container">
                                        <div className="tipo-parte">
                                            <span className="tipo-texto">{leccion.tipo_parte || 'Clase'}</span>
                                            <span className="titulo-texto">{leccion.titulo}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="thumbnail-placeholder">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="23 7 16 12 23 17 23 7" />
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                    </div>
                                )}

                                <div className="leccion-play-icon">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                </div>

                                {leccion.duracion && (
                                    <div className="duracion-badge">{formatearDuracion(leccion.duracion)}</div>
                                )}
                            </div>

                            <div className="leccion-info">
                                <div className="leccion-titulo">{leccion.titulo}</div>
                                <div className="leccion-estado">
                                    {esLeccionCompletada(leccion.id) ? (
                                        <div className="estado-completado">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>Completada</span>
                                        </div>
                                    ) : progreso[leccion.id] && progreso[leccion.id] > 0 ? (
                                        <div className="estado-progreso">
                                            <div className="progreso-mini-bar">
                                                <div className="progreso-mini-fill" style={{ width: `${Math.round(progreso[leccion.id])}%` }}></div>
                                            </div>
                                            <span>{Math.round(progreso[leccion.id])}%</span>
                                        </div>
                                    ) : (
                                        <div className="estado-pendiente">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

            {/* Contador de lecciones */}
            <div className="contador-lecciones">
                <span>{leccionesDelModulo.length} lecciones en este módulo</span>
            </div>
        </div>
    )
}

export default TabContenido
