import React from 'react';
import { useSliderCursos } from './Hooks/useSliderCursos';
import './SliderCursos.css';

const SliderCursos: React.FC = () => {
  const {
    inscripciones, progreso, currentIndex, cargando, error,
    totalItems, maxIndex,
    nextSlide, prevSlide, goToSlide, handleKeydown,
    determinarTextoBoton, navegarAContenido,
  } = useSliderCursos();

  if (cargando) {
    return (
      <div className="slider-cursos-contenedor">
        <div className="slider-cursos-header">
          <h3 className="slider-cursos-titulo">
            <span className="slider-cursos-icono">🎓</span> Continúa tu aprendizaje
          </h3>
        </div>
        <div className="slider-cursos-loading">
          <div className="slider-cursos-spinner"></div>
          <p>Cargando tus cursos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slider-cursos-contenedor">
        <div className="slider-cursos-header">
          <h3 className="slider-cursos-titulo">
            <span className="slider-cursos-icono">🎓</span> Continúa tu aprendizaje
          </h3>
        </div>
        <div className="slider-cursos-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (inscripciones.length === 0) {
    return (
      <div className="slider-cursos-contenedor">
        <div className="slider-cursos-header">
          <h3 className="slider-cursos-titulo">
            <span className="slider-cursos-icono">🎓</span> Continúa tu aprendizaje
          </h3>
        </div>
        <div className="slider-cursos-empty">
          <p>No tienes cursos inscritos aún.</p>
          <a href="/cursos" className="slider-cursos-btn-explorar">Explorar cursos</a>
        </div>
      </div>
    );
  }

  return (
    <div className="slider-cursos-contenedor" onKeyDown={handleKeydown} tabIndex={0}>
      <div className="slider-cursos-header">
        <h3 className="slider-cursos-titulo">
          <span className="slider-cursos-icono">🎓</span> Continúa tu aprendizaje
        </h3>
      </div>

      {totalItems > 0 && (
        <div className="slider-cursos-nav-controls">
          <button
            className="slider-cursos-nav-btn slider-cursos-nav-prev"
            onClick={prevSlide}
            disabled={currentIndex === 0 || totalItems <= 1}
            aria-label="Curso anterior"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>

          <span className="slider-cursos-nav-indicator">{currentIndex + 1} / {totalItems}</span>

          <button
            className="slider-cursos-nav-btn slider-cursos-nav-next"
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex || totalItems <= 1}
            aria-label="Siguiente curso"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9,6 15,12 9,18"></polyline>
            </svg>
          </button>
        </div>
      )}

      <div className="slider-cursos-carousel-wrapper">
        <div className="slider-cursos-carousel-container">
          <div
            className="slider-cursos-carousel-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {inscripciones.map((inscripcion) => {
              const esCurso = !!inscripcion.cursos;
              const contenidoId = esCurso ? inscripcion.curso_id : inscripcion.tutorial_id;
              const progresoReal = contenidoId ? progreso[contenidoId] : null;
              const porcentaje = progresoReal ? progresoReal.progreso : 0;

              return (
                <div key={inscripcion.id} className="slider-cursos-slide">
                  <div className="slider-cursos-card">
                    <div className="slider-cursos-imagen-container">
                      <img
                        src={inscripcion.cursos?.imagen_url || inscripcion.tutoriales?.imagen_url || '/images/default-curso.jpg'}
                        alt={inscripcion.cursos?.titulo || inscripcion.tutoriales?.titulo}
                        className="slider-cursos-imagen"
                      />
                      <div className="slider-cursos-badge-tipo">
                        {inscripcion.cursos ? 'Curso' : 'Tutorial'}
                      </div>
                    </div>

                    <div className="slider-cursos-contenido-card">
                      <h4 className="slider-cursos-titulo-curso">
                        {inscripcion.cursos?.titulo || inscripcion.tutoriales?.titulo}
                      </h4>

                      <div className="slider-cursos-progreso-wrapper">
                        <div className="slider-cursos-progreso">
                          <div className="slider-cursos-progreso-bar">
                            <div
                              className="slider-cursos-progreso-fill"
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                          <span className="slider-cursos-progreso-texto">{Math.round(porcentaje)}%</span>
                        </div>
                      </div>

                      <button
                        className={`slider-cursos-btn-accion ${inscripcion.completado ? 'completado' : ''}`}
                        onClick={() => navegarAContenido(inscripcion)}
                      >
                        {determinarTextoBoton(inscripcion)}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {totalItems > 1 && (
        <div className="slider-cursos-pagination-dots">
          {Array.from({ length: totalItems }, (_, i) => (
            <button
              key={i}
              className={`slider-cursos-dot ${i === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={`Ir al curso ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SliderCursos;
