import React, { useState } from 'react'
import type { Mensaje } from '../../servicios/mensajeriaService'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import './BurbujaMensaje.css' // Importar estilos nuevos

interface Props {
    mensaje: Mensaje
    mensajeAnterior?: Mensaje
    mensajeSiguiente?: Mensaje
    chatEsGrupal: boolean
    onResponder?: () => void
}

export default function BurbujaMensaje({ mensaje, mensajeAnterior, mensajeSiguiente, chatEsGrupal, onResponder }: Props) {
    const [mostrarAcciones, setMostrarAcciones] = useState(false)

    // Lógica para agrupar visualmente
    const esPrimero = !mensajeAnterior || mensajeAnterior.usuario_id !== mensaje.usuario_id
    const esUltimo = !mensajeSiguiente || mensajeSiguiente.usuario_id !== mensaje.usuario_id

    return (
        <div
            className={`bm-group ${mensaje.es_mio ? 'bm-own' : 'bm-other'} ${esPrimero ? 'bm-first' : ''}`}
            onMouseEnter={() => setMostrarAcciones(true)}
            onMouseLeave={() => setMostrarAcciones(false)}
        >
            {/* Avatar Izquierdo (Para Otros) */}
            {!mensaje.es_mio && (
                <div className="bm-avatar-container bm-mr">
                    {esUltimo ? (
                        <img
                            src={mensaje.usuario?.url_foto_perfil || '/images/default-user.png'}
                            alt="avatar"
                            className="bm-avatar-img"
                        />
                    ) : (
                        <div className="bm-avatar-spacer" />
                    )}
                </div>
            )}

            {/* Contenido */}
            <div className="bm-content-wrapper">
                {/* Nombre en Grupos (Solo el primero del bloque) */}
                {!mensaje.es_mio && chatEsGrupal && esPrimero && (
                    <span className="bm-username">
                        {mensaje.usuario?.nombre_completo || 'Usuario'}
                    </span>
                )}

                {/* Burbuja */}
                <div className="bm-bubble">
                    {/* Texto o Media */}
                    {mensaje.tipo === 'imagen' && mensaje.url_media ? (
                        <img src={mensaje.url_media} alt="adjunto" className="rounded-lg max-w-full h-auto mb-1" />
                    ) : (
                        <span>{mensaje.contenido}</span>
                    )}

                    {/* Metadata Flotante (Hora + Leído) */}
                    <div className="bm-meta">
                        <span className="bm-time">
                            {formatDistanceToNow(new Date(mensaje.creado_en), { addSuffix: false, locale: es })}
                        </span>
                        {mensaje.es_mio && (
                            <span className="bm-checks" title={mensaje.leido ? "Leído" : "Enviado"}>
                                {mensaje.leido ? (
                                    <svg viewBox="0 0 16 11" height="11" width="16" preserveAspectRatio="xMidYMid meet" version="1.1">
                                        <path fill="#53bdeb" d="M11.575 0.575a0.6 0.6 0 0 1 0.85 0l3 3a0.6 0.6 0 0 1 0 0.85l-8.5 8.5a0.6 0.6 0 0 1 -0.85 0l-5.5 -5.5a0.6 0.6 0 0 1 0.85 -0.85l5.075 5.075L11.575 0.575Z" />
                                        <path fill="#53bdeb" d="M8.575 0.575a0.6 0.6 0 0 1 0.85 0l3 3a0.6 0.6 0 0 1 0 0.85l-8.5 8.5a0.6 0.6 0 0 1 -0.85 0l-5.5 -5.5a0.6 0.6 0 0 1 0.85 -0.85l5.075 5.075L8.575 0.575Z" transform="translate(4,0)" opacity="0.8" />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 16 15" height="11" width="11" preserveAspectRatio="xMidYMid meet">
                                        <path fill="#9ca3af" d="M15.01 3.316L8.555 9.77L5.432 6.648a.832.832 0 00-1.176 0 .832.832 0 000 1.176l3.711 3.711a.83.83 0 001.176 0L16.185 4.492a.832.832 0 000-1.176.832.832 0 00-1.176 0z" />
                                    </svg>
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Avatar Derecho (Opcional para 'Mio' si se desea, por ahora oculto para look WhatsApp/Svelte standard) */}
        </div>
    )
}
