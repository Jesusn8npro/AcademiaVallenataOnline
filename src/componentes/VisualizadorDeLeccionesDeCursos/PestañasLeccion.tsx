import React, { useState, useEffect } from 'react'
import './PestañasLeccion.css'
import TabContenido from './TabContenido'
import TarjetaInformacionCurso from './TarjetaInformacionCurso'
import ComentariosLeccion from './ComentariosLeccion'
import NotasLeccion from './NotasLeccion'

interface PestañasLeccionProps {
    contenido?: string
    recursos?: string
    comentarios?: any[]
    cursoId: string
    usuarioActual?: any
    leccionId: string
    tipo?: 'leccion' | 'clase'
    curso?: any
    clases?: any[]
    progreso?: Record<string, any>
    mostrarSidebar?: boolean
    onCambiarLeccion?: (leccion: any) => void
}

const PestañasLeccion: React.FC<PestañasLeccionProps> = ({
    contenido = '',
    recursos = '',
    comentarios = [],
    cursoId,
    usuarioActual = null,
    leccionId,
    tipo = 'clase',
    curso = {},
    clases = [],
    progreso = {},
    mostrarSidebar = true,
    onCambiarLeccion
}) => {
    const [pestañaActiva, setPestañaActiva] = useState(0)
    const CLAVE_TAB = 'leccionTabs-activeTab'

    // Etiquetas dinámicas según mostrarSidebar
    const etiquetasPestañas = mostrarSidebar
        ? ['Información', 'Comentarios', 'Notas']
        : ['Contenido', 'Información', 'Comentarios', 'Notas']

    // Persistencia en localStorage
    useEffect(() => {
        if (!mostrarSidebar) {
            // Si la sidebar está oculta, mostrar Contenido por defecto
            const pestañaGuardada = localStorage.getItem(CLAVE_TAB)
            if (pestañaGuardada !== null) {
                setPestañaActiva(+pestañaGuardada)
            } else {
                setPestañaActiva(0) // Contenido es la primera pestaña
                localStorage.setItem(CLAVE_TAB, '0')
            }
        } else {
            setPestañaActiva(0)
            localStorage.removeItem(CLAVE_TAB)
        }
    }, [mostrarSidebar])

    // Guardar pestaña activa en localStorage
    useEffect(() => {
        if (!mostrarSidebar && pestañaActiva === 0) {
            localStorage.setItem(CLAVE_TAB, '0')
        }
    }, [mostrarSidebar, pestañaActiva])

    function cambiarPestaña(indice: number) {
        setPestañaActiva(indice)
        if (!mostrarSidebar && indice === 1) {
            localStorage.setItem(CLAVE_TAB, '1')
        } else {
            localStorage.removeItem(CLAVE_TAB)
        }
    }

    return (
        <div className="leccion-contenido">
            <div className="pestañas">
                <div className="encabezados-pestañas">
                    {etiquetasPestañas.map((etiqueta, i) => (
                        <button
                            key={i}
                            className={`boton-pestaña ${pestañaActiva === i ? 'active' : ''}`}
                            onClick={() => cambiarPestaña(i)}
                            type="button"
                        >
                            {etiqueta}
                        </button>
                    ))}
                </div>
                <div className="contenido-pestaña">
                    {!mostrarSidebar ? (
                        <>
                            {pestañaActiva === 0 && (
                                <div className="panel-pestaña active">
                                    <TabContenido
                                        clases={clases}
                                        leccionActiva={leccionId}
                                        progreso={progreso}
                                        curso={curso}
                                        modoSPA={true}
                                        onCambiarLeccion={onCambiarLeccion}
                                    />
                                </div>
                            )}
                            {pestañaActiva === 1 && (
                                <div className="panel-pestaña active">
                                    <TarjetaInformacionCurso
                                        titulo={curso?.titulo || ''}
                                        imagen_url={curso?.imagen_url || ''}
                                        categoria={curso?.categoria || ''}
                                        nivel={curso?.nivel || ''}
                                        duracion_estimada={curso?.duracion_estimada || curso?.duracion || 0}
                                        descripcion={curso?.descripcion || ''}
                                        descripcion_corta={curso?.descripcion_corta || ''}
                                        objetivos={curso?.objetivos || []}
                                        requisitos={curso?.requisitos || []}
                                        artista={curso?.artista || ''}
                                        acordeonista={curso?.acordeonista || ''}
                                        tonalidad={curso?.tonalidad || ''}
                                        conteo_lecciones={curso?.conteo_lecciones || 0}
                                        estudiantes_inscritos={curso?.estudiantes_inscritos || 0}
                                        tipo={tipo === 'leccion' ? 'curso' : 'tutorial'}
                                    />
                                </div>
                            )}
                            {pestañaActiva === 2 && (
                                <div className="panel-pestaña active">
                                    <ComentariosLeccion
                                        leccionId={leccionId}
                                        usuarioActual={usuarioActual}
                                        tipo={tipo}
                                    />
                                </div>
                            )}
                            {pestañaActiva === 3 && (
                                <div className="panel-pestaña active">
                                    <NotasLeccion
                                        leccionId={leccionId}
                                        usuarioActual={usuarioActual}
                                        tipo={tipo}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className={`panel-pestaña ${pestañaActiva === 0 ? 'active' : ''}`}>
                                <TarjetaInformacionCurso
                                    titulo={curso?.titulo || ''}
                                    imagen_url={curso?.imagen_url || ''}
                                    categoria={curso?.categoria || ''}
                                    nivel={curso?.nivel || ''}
                                    duracion_estimada={curso?.duracion_estimada || curso?.duracion || 0}
                                    descripcion={curso?.descripcion || ''}
                                    descripcion_corta={curso?.descripcion_corta || ''}
                                    objetivos={curso?.objetivos || []}
                                    requisitos={curso?.requisitos || []}
                                    artista={curso?.artista || ''}
                                    acordeonista={curso?.acordeonista || ''}
                                    tonalidad={curso?.tonalidad || ''}
                                    conteo_lecciones={curso?.conteo_lecciones || 0}
                                    estudiantes_inscritos={curso?.estudiantes_inscritos || 0}
                                    tipo={tipo === 'leccion' ? 'curso' : 'tutorial'}
                                />
                            </div>
                            <div className={`panel-pestaña ${pestañaActiva === 1 ? 'active' : ''}`}>
                                <ComentariosLeccion
                                    leccionId={leccionId}
                                    usuarioActual={usuarioActual}
                                    tipo={tipo}
                                />
                            </div>
                            <div className={`panel-pestaña ${pestañaActiva === 2 ? 'active' : ''}`}>
                                <NotasLeccion
                                    leccionId={leccionId}
                                    usuarioActual={usuarioActual}
                                    tipo={tipo}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PestañasLeccion
