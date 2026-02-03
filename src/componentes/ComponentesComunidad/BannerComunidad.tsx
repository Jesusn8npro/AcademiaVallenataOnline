import React from 'react';
import './BannerComunidad.css';

const BannerComunidad: React.FC = () => {
  return (
    <div className="banner-comunidad-contenedor">
      <div className="banner-comunidad-contenido">
        <div className="banner-comunidad-texto">
          <h1 className="banner-comunidad-titulo">🎵 Comunidad de Acordeonistas</h1>
          <p className="banner-comunidad-subtitulo">
            Comparte tus grabaciones, conecta con otros músicos y aprende juntos
          </p>
          <div className="banner-comunidad-caracteristicas">
            <div className="banner-comunidad-elemento">
              <span className="banner-comunidad-icono">🎥</span>
              <span className="banner-comunidad-texto-caracteristica">Videos</span>
            </div>
            <div className="banner-comunidad-elemento">
              <span className="banner-comunidad-icono">🎼</span>
              <span className="banner-comunidad-texto-caracteristica">Grabaciones</span>
            </div>
            <div className="banner-comunidad-elemento">
              <span className="banner-comunidad-icono">💬</span>
              <span className="banner-comunidad-texto-caracteristica">Preguntas</span>
            </div>
            <div className="banner-comunidad-elemento">
              <span className="banner-comunidad-icono">📊</span>
              <span className="banner-comunidad-texto-caracteristica">Encuestas</span>
            </div>
          </div>
        </div>
        <div className="banner-comunidad-visual">
          <div className="banner-comunidad-onda-musical">
            <div className="banner-comunidad-barra-onda"></div>
            <div className="banner-comunidad-barra-onda"></div>
            <div className="banner-comunidad-barra-onda"></div>
            <div className="banner-comunidad-barra-onda"></div>
            <div className="banner-comunidad-barra-onda"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerComunidad;
