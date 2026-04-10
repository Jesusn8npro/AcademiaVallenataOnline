import React, { useEffect, useState } from 'react'
import './HeroCursos.css'

const beneficios = [
  '🎮 Simulador Virtual Incluido - Sin Necesidad de Acordeón',
  '📚 +200 Horas de Contenido Premium Exclusivo',
  '🏆 Método Probado por +5,000 Estudiantes Exitosos',
  '📱 Acceso Total desde Cualquier Dispositivo 24/7',
  '👨‍🏫 Maestros Profesionales con Experiencia Real'
]

export default function HeroCursos() {
  const [visible, setVisible] = useState(false)
  const [currentBenefit, setCurrentBenefit] = useState(0)

  useEffect(() => {
    setVisible(true)
    const id = setInterval(() => setCurrentBenefit(prev => (prev + 1) % beneficios.length), 4000)
    return () => clearInterval(id)
  }, [])

  const scrollToCatalogo = () => {
    const el = document.getElementById('catalogo-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="hc-hero-vendedor">
      <div className="hc-hero-background">
        <div className="hc-gradient-overlay" />
        <div className="hc-geometric-pattern" />
      </div>

      <div className="hc-hero-container">
        {visible && (
          <>
            <div className="hc-authority-badge">
              <span className="hc-badge-icon">🔥</span>
              <span className="hc-badge-text">ACADEMIA #1 EN ACORDEÓN VALLENATO</span>
            </div>

            <h1 className="hc-hero-title">
              DOMINA EL <span className="hc-title-highlight">ACORDEÓN VALLENATO</span><br />
              <span className="hc-title-secondary">DESDE CASA - SIN INSTRUMENTO</span>
            </h1>

            <div className="hc-value-proposition">
              <p className="hc-hero-subtitle">
                <strong>CURSOS COMPLETOS + TUTORIALES PREMIUM</strong> que te llevan del nivel
                <span className="hc-highlight-text"> PRINCIPIANTE al PROFESIONAL</span> en tiempo récord
              </p>
            </div>

            <div className="hc-rotating-benefit">
              <div className="hc-benefit-card" key={currentBenefit}>
                <div className="hc-benefit-content">{beneficios[currentBenefit]}</div>
              </div>
            </div>

            <div className="hc-stats-showcase">
              <div className="hc-stat-block">
                <div className="hc-stat-number">5,000+</div>
                <div className="hc-stat-label">ESTUDIANTES<br />ACTIVOS</div>
              </div>
              <div className="hc-stat-separator">|</div>
              <div className="hc-stat-block">
                <div className="hc-stat-number">200+</div>
                <div className="hc-stat-label">HORAS DE<br />CONTENIDO</div>
              </div>
              <div className="hc-stat-separator">|</div>
              <div className="hc-stat-block">
                <div className="hc-stat-number">4.9★</div>
                <div className="hc-stat-label">CALIFICACIÓN<br />PROMEDIO</div>
              </div>
            </div>

            <div className="hc-cta-section">
              <button className="hc-btn-mega-cta" onClick={scrollToCatalogo}>
                <span className="btn-text">VER CURSOS Y TUTORIALES AHORA</span>
                <div className="hc-btn-arrow">→</div>
              </button>
            </div>

            <div className="hc-scroll-indicator">
              <div className="hc-scroll-text">DESCUBRE TODO NUESTRO CATÁLOGO</div>
              <div className="hc-scroll-arrow-down">▼</div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
