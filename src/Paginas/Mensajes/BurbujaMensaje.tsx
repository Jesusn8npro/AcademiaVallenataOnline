import React, { useState } from 'react'
import type { Mensaje } from '../../servicios/mensajeriaService'
import './BurbujaMensaje.css'

interface Props {
    mensaje: Mensaje
    mensajeAnterior?: Mensaje
    mensajeSiguiente?: Mensaje
    chatEsGrupal: boolean
    onResponder?: () => void
}

function formatearHora(iso: string): string {
    try {
        const d = new Date(iso)
        const h = d.getHours()
        const m = d.getMinutes()
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    } catch {
        return ''
    }
}

export default function BurbujaMensaje({ mensaje, mensajeAnterior, mensajeSiguiente, chatEsGrupal, onResponder }: Props) {
    const [, setMostrarAcciones] = useState(false)

    const esPrimero = !mensajeAnterior || mensajeAnterior.usuario_id !== mensaje.usuario_id
    const esUltimo = !mensajeSiguiente || mensajeSiguiente.usuario_id !== mensaje.usuario_id

    return (
        <div
            className={`bm-group ${mensaje.es_mio ? 'bm-own' : 'bm-other'} ${esPrimero ? 'bm-first' : ''}`}
            onMouseEnter={() => setMostrarAcciones(true)}
            onMouseLeave={() => setMostrarAcciones(false)}
            onDoubleClick={onResponder}
        >
            {!mensaje.es_mio && (
                <div className="bm-avatar-container">
                    {esUltimo ? (
                        <img
                            src={mensaje.usuario?.url_foto_perfil || '/images/default-user.png'}
                            alt="avatar"
                            className="bm-avatar-img"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-user.png' }}
                        />
                    ) : (
                        <div className="bm-avatar-spacer" />
                    )}
                </div>
            )}

            <div className="bm-content-wrapper">
                {!mensaje.es_mio && chatEsGrupal && esPrimero && (
                    <span className="bm-username">
                        {mensaje.usuario?.nombre_completo || 'Usuario'}
                    </span>
                )}

                <div className="bm-bubble">
                    {mensaje.tipo === 'imagen' && mensaje.url_media ? (
                        <img src={mensaje.url_media} alt="adjunto" />
                    ) : null}
                    <span>{mensaje.contenido}</span>

                    <div className="bm-meta">
                        <span className="bm-time">{formatearHora(mensaje.creado_en)}</span>
                        {mensaje.es_mio && (
                            <span className="bm-checks" title={mensaje.leido ? 'Leído' : 'Enviado'}>
                                {mensaje.leido ? (
                                    <svg viewBox="0 0 16 11" preserveAspectRatio="xMidYMid meet" version="1.1">
                                        <path fill="#53bdeb" d="M11.071 0.653a0.6 0.6 0 0 1 0.849 0.024l0.825 0.886a0.6 0.6 0 0 1-0.024 0.849L4.846 9.823a0.6 0.6 0 0 1-0.849-0.024L0.823 6.398a0.6 0.6 0 0 1 0.024-0.849l0.825-0.768a0.6 0.6 0 0 1 0.849 0.024l2.236 2.4 6.314-6.552z" />
                                        <path fill="#53bdeb" d="M15.146 0.653a0.6 0.6 0 0 1 0.849 0.024l0.825 0.886a0.6 0.6 0 0 1-0.024 0.849L8.921 9.823a0.6 0.6 0 0 1-0.849-0.024L7.247 8.91a0.6 0.6 0 0 1 0.024-0.849l0.012-0.011 6.628-6.876a0.6 0.6 0 0 1 0.849-0.024l0.387 0.503z" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 16 11" preserveAspectRatio="xMidYMid meet">
                                        <path fill="#8696a0" d="M11.071 0.653a0.6 0.6 0 0 1 0.849 0.024l0.825 0.886a0.6 0.6 0 0 1-0.024 0.849L4.846 9.823a0.6 0.6 0 0 1-0.849-0.024L0.823 6.398a0.6 0.6 0 0 1 0.024-0.849l0.825-0.768a0.6 0.6 0 0 1 0.849 0.024l2.236 2.4 6.314-6.552z" />
                                    </svg>
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
