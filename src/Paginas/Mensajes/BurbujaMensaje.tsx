import React from 'react'
import type { Mensaje } from '../../servicios/mensajeriaService'

interface Props {
    mensaje: Mensaje
    mensajeAnterior?: Mensaje
    mensajeSiguiente?: Mensaje
    chatEsGrupal: boolean
    onResponder?: () => void
}

function hora(iso: string) {
    try {
        const d = new Date(iso)
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    } catch { return '' }
}

// Quita el cache-buster ?t=... heredado de cuando el usuario subió la foto, así
// el navegador puede usar su cache HTTP (la URL es siempre la misma).
const URL_ESTABLE = (u?: string | null) => (u || '').split('?')[0]

const ICONO_LEIDO = (
    <svg viewBox="0 0 16 11" preserveAspectRatio="xMidYMid meet">
        <path fill="#53bdeb" d="M11.071 0.653a.6.6 0 0 1 .849.024l.825.886a.6.6 0 0 1-.024.849L4.846 9.823a.6.6 0 0 1-.849-.024L.823 6.398a.6.6 0 0 1 .024-.849l.825-.768a.6.6 0 0 1 .849.024l2.236 2.4 6.314-6.552z" />
        <path fill="#53bdeb" d="M15.146 0.653a.6.6 0 0 1 .849.024l.825.886a.6.6 0 0 1-.024.849L8.921 9.823a.6.6 0 0 1-.849-.024L7.247 8.91a.6.6 0 0 1 .024-.849l.012-.011 6.628-6.876a.6.6 0 0 1 .849-.024l.387.503z" />
    </svg>
)

const ICONO_ENVIADO = (
    <svg viewBox="0 0 16 11" preserveAspectRatio="xMidYMid meet">
        <path fill="#8696a0" d="M11.071 0.653a.6.6 0 0 1 .849.024l.825.886a.6.6 0 0 1-.024.849L4.846 9.823a.6.6 0 0 1-.849-.024L.823 6.398a.6.6 0 0 1 .024-.849l.825-.768a.6.6 0 0 1 .849.024l2.236 2.4 6.314-6.552z" />
    </svg>
)

export default function BurbujaMensaje({ mensaje, mensajeAnterior, mensajeSiguiente, chatEsGrupal, onResponder }: Props) {
    const esPrimero = !mensajeAnterior || mensajeAnterior.usuario_id !== mensaje.usuario_id
    const esUltimo = !mensajeSiguiente || mensajeSiguiente.usuario_id !== mensaje.usuario_id
    const tipo = mensaje.es_mio ? 'is-own' : 'is-other'

    return (
        <div className={`bm_group ${tipo} ${esPrimero ? 'is-first' : ''}`} onDoubleClick={onResponder}>
            {!mensaje.es_mio && (esUltimo ? (
                <img
                    src={URL_ESTABLE(mensaje.usuario?.url_foto_perfil) || '/images/default-user.png'}
                    alt="avatar"
                    className="bm_avatar"
                    loading="eager"
                    decoding="async"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-user.png' }}
                />
            ) : <div className="bm_avatar_spacer" />)}

            <div className="bm_content">
                {!mensaje.es_mio && chatEsGrupal && esPrimero && (
                    <span className="bm_username">{mensaje.usuario?.nombre_completo || 'Usuario'}</span>
                )}

                <div className="bm_bubble">
                    {mensaje.tipo === 'imagen' && mensaje.url_media && (
                        <img src={mensaje.url_media} alt="adjunto" className="bm_img" />
                    )}
                    <span className="bm_text">{mensaje.contenido}</span>

                    <div className="bm_meta">
                        <span className="bm_time">{hora(mensaje.creado_en)}</span>
                        {mensaje.es_mio && (
                            <span className="bm_checks" title={mensaje.leido ? 'Leído' : 'Enviado'}>
                                {mensaje.leido ? ICONO_LEIDO : ICONO_ENVIADO}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
