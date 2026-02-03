import React, { useState, useEffect } from 'react'
import './ContadorOferta.css'

const ContadorOferta: React.FC = () => {
  const navigate = (url: string) => { window.location.href = url }
  const [dias, setDias] = useState(10)
  const [horas, setHoras] = useState(23)
  const [minutos, setMinutos] = useState(13)
  const [segundos, setSegundos] = useState(10)

  const volverAlHome = () => { navigate('/') }

  useEffect(() => {
    const interval = setInterval(() => {
      if (segundos > 0) setSegundos(prev => prev - 1)
      else if (minutos > 0) { setSegundos(59); setMinutos(prev => prev - 1) }
      else if (horas > 0) { setSegundos(59); setMinutos(59); setHoras(prev => prev - 1) }
      else if (dias > 0) { setSegundos(59); setMinutos(59); setHoras(23); setDias(prev => prev - 1) }
    }, 1000)
    return () => clearInterval(interval)
  }, [dias, horas, minutos, segundos])

  return (
    <div className="contador-banner">
      <div className="container">
        <div className="left-section">
          <button className="btn-volver" onClick={volverAlHome}>← Volver</button>
          <div className="oferta-info">
            <div className="oferta-icon">⚡</div>
            <span className="oferta-text">¡OFERTA EXCLUSIVA!</span>
            <span className="descuento">-50%</span>
          </div>
        </div>
        <div className="right-section">
          <span className="tiempo-text">La oferta termina en:</span>
          <div className="countdown">
            <div className="time-item"><span className="number">{dias.toString().padStart(2, '0')}</span><span className="label">Días</span></div>
            <div className="time-item"><span className="number">{horas.toString().padStart(2, '0')}</span><span className="label">Horas</span></div>
            <div className="time-item"><span className="number">{minutos.toString().padStart(2, '0')}</span><span className="label">Min</span></div>
            <div className="time-item"><span className="number">{segundos.toString().padStart(2, '0')}</span><span className="label">Seg</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContadorOferta

