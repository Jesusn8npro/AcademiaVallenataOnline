import React, { useState, useEffect } from 'react'
import './BannerSlider.css'

const banners = [
  {
    titulo: '¡Nueva funcionalidad!',
    descripcion: 'Ahora puedes compartir videos y audios directamente en tus publicaciones. ¡Pruébalo en la comunidad!',
    link: '/comunidad'
  },
  {
    titulo: 'Novedad: Ranking actualizado',
    descripcion: 'El ranking de la comunidad ahora se actualiza en tiempo real con tus logros y participaciones.',
    link: '/comunidad/ranking'
  },
  {
    titulo: 'Evento especial de junio',
    descripcion: 'Participa en el reto musical de junio y gana una mentoría exclusiva. Más info en la sección de eventos.',
    link: '/eventos'
  }
]

export default function BannerSlider() {
  const [actual, setActual] = useState(0)

  useEffect(() => {
    const intervalo = setInterval(() => {
      setActual(prev => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(intervalo)
  }, [])

  function irA(idx: number) {
    setActual(idx)
  }

  return (
    <div className="banner-slider">
      <div className="banner-contenido" key={actual}>
        <div className="banner-texto solo-texto">
          <h3>{banners[actual].titulo}</h3>
          <p>{banners[actual].descripcion}</p>
          {banners[actual].link && (
            <a className="banner-btn" href={banners[actual].link}>Ver más</a>
          )}
        </div>
      </div>
      <div className="banner-dots">
        {banners.map((_, idx) => (
          <button
            key={idx}
            className={idx === actual ? 'dots-active' : ''}
            onClick={() => irA(idx)}
            aria-label={`Banner ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
