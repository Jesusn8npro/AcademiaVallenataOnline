import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'cadc_oferta_inicio'
const DURACION_HORAS = 48

const MENSAJES_ROTATIVOS = [
  { icono: '🎯', texto: 'Solo 23 cupos con precio especial' },
  { icono: '👀', texto: '47 personas viendo este curso ahora' },
  { icono: '🔥', texto: 'Último día con $90.000 de descuento' },
  { icono: '🎁', texto: 'Incluye masterclass exclusiva de regalo' },
  { icono: '🛡️', texto: '30 días para probar sin riesgo' },
  { icono: '🚀', texto: '+5,000 estudiantes ya lo lograron' },
  { icono: '⭐', texto: '4.9 / 5 con 847 reseñas verificadas' },
]

interface Props {
  descuento?: number
  onVolver?: () => void
  onCTA?: () => void
}

const pad = (n: number) => n.toString().padStart(2, '0')

const BannerOfertaCurso: React.FC<Props> = ({ descuento = 24, onVolver, onCTA }) => {
  const navigate = useNavigate()
  const [tiempo, setTiempo] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [mensajeIdx, setMensajeIdx] = useState(0)
  const [expirado, setExpirado] = useState(false)

  // Countdown real persistido en localStorage para no mentirle al usuario
  const fechaFin = useMemo(() => {
    if (typeof window === 'undefined') return Date.now() + DURACION_HORAS * 3600 * 1000
    let inicio = localStorage.getItem(STORAGE_KEY)
    if (!inicio) {
      inicio = Date.now().toString()
      localStorage.setItem(STORAGE_KEY, inicio)
    }
    return parseInt(inicio, 10) + DURACION_HORAS * 3600 * 1000
  }, [])

  useEffect(() => {
    const tick = () => {
      const diff = fechaFin - Date.now()
      if (diff <= 0) {
        setTiempo({ d: 0, h: 0, m: 0, s: 0 })
        setExpirado(true)
        return
      }
      setTiempo({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [fechaFin])

  useEffect(() => {
    const id = setInterval(() => {
      setMensajeIdx((prev) => (prev + 1) % MENSAJES_ROTATIVOS.length)
    }, 3500)
    return () => clearInterval(id)
  }, [])

  const volver = () => {
    if (onVolver) return onVolver()
    if (window.history.length > 1) window.history.back()
    else navigate('/')
  }

  const mensajeActual = MENSAJES_ROTATIVOS[mensajeIdx]

  return (
    <div className="cadc-banner-oferta" role="banner">
      <div className="cadc-banner-glow" aria-hidden="true" />
      <div className="cadc-banner-shimmer" aria-hidden="true" />

      <div className="cadc-banner-fila-superior">
        <button className="cadc-banner-volver" onClick={volver} aria-label="Volver">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Volver</span>
        </button>

        <div className="cadc-banner-centro">
          <div className="cadc-banner-titulo-wrap">
            <span className="cadc-banner-emoji" aria-hidden="true">🔥</span>
            <span className="cadc-banner-titulo">
              {expirado ? 'OFERTA FINALIZADA' : 'OFERTA EXCLUSIVA TERMINA EN'}
            </span>
            {!expirado && <span className="cadc-banner-descuento">-{descuento}%</span>}
          </div>

          {!expirado && (
            <div className="cadc-banner-countdown" aria-live="polite">
              <div className="cadc-banner-time-block">
                <div className="cadc-banner-time-num">{pad(tiempo.d)}</div>
                <div className="cadc-banner-time-label">Días</div>
              </div>
              <span className="cadc-banner-time-sep" aria-hidden="true">:</span>
              <div className="cadc-banner-time-block">
                <div className="cadc-banner-time-num">{pad(tiempo.h)}</div>
                <div className="cadc-banner-time-label">Horas</div>
              </div>
              <span className="cadc-banner-time-sep" aria-hidden="true">:</span>
              <div className="cadc-banner-time-block">
                <div className="cadc-banner-time-num">{pad(tiempo.m)}</div>
                <div className="cadc-banner-time-label">Min</div>
              </div>
              <span className="cadc-banner-time-sep" aria-hidden="true">:</span>
              <div className="cadc-banner-time-block cadc-banner-time-pulse">
                <div className="cadc-banner-time-num">{pad(tiempo.s)}</div>
                <div className="cadc-banner-time-label">Seg</div>
              </div>
            </div>
          )}
        </div>

        {onCTA && !expirado && (
          <button className="cadc-banner-cta" onClick={onCTA}>
            <span>Aprovechar</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      <div className="cadc-banner-fila-inferior">
        <div className="cadc-banner-mensaje" key={mensajeIdx}>
          <span className="cadc-banner-mensaje-icono" aria-hidden="true">{mensajeActual.icono}</span>
          <span className="cadc-banner-mensaje-texto">{mensajeActual.texto}</span>
          <span className="cadc-banner-mensaje-dot" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

export default BannerOfertaCurso
