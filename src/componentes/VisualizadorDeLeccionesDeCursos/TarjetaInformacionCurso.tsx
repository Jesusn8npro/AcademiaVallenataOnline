import React, { useMemo } from 'react'
import './TarjetaInformacionCurso.css'

interface TarjetaInformacionCursoProps {
    titulo?: string
    imagen_url?: string
    categoria?: string
    nivel?: string
    duracion_estimada?: number
    descripcion?: string
    descripcion_corta?: string
    objetivos?: string[] | string
    requisitos?: string[] | string
    artista?: string
    acordeonista?: string
    tonalidad?: string
    conteo_lecciones?: number
    estudiantes_inscritos?: number
    tipo?: 'curso' | 'tutorial'
}

// Función para procesar objetivos/requisitos (copiada del Svelte)
function procesarLista(lista: string[] | string | undefined): string[] {
    if (!lista) return []
    if (typeof lista === 'string') {
        try {
            if (lista.startsWith('[') || lista.startsWith('{')) {
                return JSON.parse(lista)
            }
            return lista.split(/[,\n•\-\*]/).map(item => item.trim()).filter(item => item.length > 0)
        } catch {
            return [lista]
        }
    }
    return Array.isArray(lista) ? lista : []
}

const TarjetaInformacionCurso: React.FC<TarjetaInformacionCursoProps> = ({
    titulo = '',
    imagen_url = '',
    categoria = '',
    nivel = '',
    duracion_estimada = 0,
    descripcion = '',
    descripcion_corta = '',
    objetivos = [],
    requisitos = [],
    artista = '',
    acordeonista = '',
    tonalidad = ''
}) => {
    // Procesar objetivos y requisitos
    const objetivosLista = useMemo(() => procesarLista(objetivos), [objetivos])
    const requisitosLista = useMemo(() => procesarLista(requisitos), [requisitos])

    function formatearDuracion(minutos: number): string {
        if (!minutos) return '0 min'
        const horas = Math.floor(minutos / 60)
        const mins = minutos % 60
        if (horas > 0) {
            return `${horas}h ${mins}min`
        }
        return `${mins} min`
    }

    return (
        <div className="tarjeta-informacion-curso">
            {/* Encabezado con imagen */}
            <div className="encabezado-curso">
                {imagen_url && (
                    <img src={imagen_url} alt={titulo} className="imagen-curso" />
                )}
                <div className="info-basica">
                    <h2 className="titulo-curso">{titulo}</h2>
                    <div className="chips-info">
                        {categoria && (
                            <span className="chip categoria">{categoria}</span>
                        )}
                        {nivel && (
                            <span className="chip nivel">{nivel}</span>
                        )}
                        {duracion_estimada > 0 && (
                            <span className="chip duracion">⏱️ {formatearDuracion(duracion_estimada)}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Descripción */}
            {(descripcion || descripcion_corta) && (
                <div className="seccion">
                    <h3>Descripción</h3>
                    <p className="descripcion">{descripcion || descripcion_corta}</p>
                </div>
            )}

            {/* Información musical */}
            {(artista || acordeonista || tonalidad) && (
                <div className="seccion">
                    <h3>Información Musical</h3>
                    <div className="info-musical">
                        {artista && (
                            <div className="item-musical">
                                <span className="etiqueta">🎤 Artista:</span>
                                <span className="valor">{artista}</span>
                            </div>
                        )}
                        {acordeonista && (
                            <div className="item-musical">
                                <span className="etiqueta">🎹 Acordeonista:</span>
                                <span className="valor">{acordeonista}</span>
                            </div>
                        )}
                        {tonalidad && (
                            <div className="item-musical">
                                <span className="etiqueta">🎵 Tonalidad:</span>
                                <span className="valor">{tonalidad}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Objetivos y Requisitos lado a lado */}
            {(objetivosLista.length > 0 || requisitosLista.length > 0) && (
                <div className="objetivos-requisitos-container">
                    {/* Objetivos (izquierda) */}
                    {objetivosLista.length > 0 && (
                        <div className="objetivos-columna">
                            <h3>¿Qué aprenderás?</h3>
                            <ul className="lista-objetivos">
                                {objetivosLista.slice(0, 3).map((objetivo, i) => (
                                    <li key={i}>{objetivo}</li>
                                ))}
                            </ul>
                            {objetivosLista.length > 3 && (
                                <div className="mas-items">+{objetivosLista.length - 3} más...</div>
                            )}
                        </div>
                    )}

                    {/* Requisitos (derecha) */}
                    {requisitosLista.length > 0 && (
                        <div className="requisitos-columna">
                            <h3>Requisitos</h3>
                            <ul className="lista-requisitos">
                                {requisitosLista.slice(0, 3).map((requisito, i) => (
                                    <li key={i}>{requisito}</li>
                                ))}
                            </ul>
                            {requisitosLista.length > 3 && (
                                <div className="mas-items">+{requisitosLista.length - 3} más...</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default TarjetaInformacionCurso
