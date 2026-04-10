import React, { useState, useEffect } from 'react';
import { useUsuario } from '../../contextos/UsuarioContext';
import CalendarioEventos from './Componentes/CalendarioEventos';
import './eventos.css';

const Eventos: React.FC = () => {
  const { usuario } = useUsuario();
  const [mostrarBannerBienvenida, setMostrarBannerBienvenida] = useState(true);

  useEffect(() => {
    // Verificar si el banner ya fue cerrado
    const bannerCerrado = localStorage.getItem('eventos-banner-cerrado');
    if (bannerCerrado === 'true') {
      setMostrarBannerBienvenida(false);
    }
  }, []);

  const cerrarBanner = () => {
    setMostrarBannerBienvenida(false);
    localStorage.setItem('eventos-banner-cerrado', 'true');
  };

  return (
    <main className="evt-main-page">
      {/* Banner de bienvenida */}
      {mostrarBannerBienvenida && (
        <div className="evt-main-banner">
          <div className="evt-main-banner-overlay"></div>
          <div className="evt-main-banner-content">
            <button
              className="evt-main-close-btn"
              onClick={cerrarBanner}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.5rem', height: '1.5rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            <div className="evt-main-hero-text">
              <div className="evt-main-icon-container">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '2rem', height: '2rem' }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>

              <h1 className="evt-main-title">
                🎵 Eventos en Vivo
              </h1>

              <p className="evt-main-subtitle">
                Participa en masterclasses exclusivas, workshops interactivos y conciertos en vivo.
                Aprende directamente con los mejores maestros del acordeón vallenato.
              </p>

              <div className="evt-main-features">
                <div className="evt-main-feature-pill">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  <span>Eventos en tiempo real</span>
                </div>
                <div className="evt-main-feature-pill">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>Interacción directa</span>
                </div>
                <div className="evt-main-feature-pill">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span>Maestros expertos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acceso rápido para administradores */}
      {usuario && (usuario.rol === 'admin' || usuario.rol === 'instructor') && (
        <div className="evt-main-admin-panel">
          <div className="evt-main-admin-container">
            <div className="flex items-center" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem', color: '#fbbf24' }}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="evt-main-admin-text">
                  <span style={{ fontWeight: 500 }}>Panel de administración:</span>{' '}
                  Gestiona eventos, crea nuevas masterclasses y monitorea inscripciones.
                </p>
              </div>
            </div>
            <div className="evt-main-admin-actions">
              <a
                href="/administrador/eventos"
                className="evt-main-btn-manage"
              >
                Gestionar Eventos
              </a>
              <a
                href="/administrador/eventos/crear"
                className="evt-main-btn-create"
              >
                Crear Evento
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="evt-main-content-wrapper">
        {/* Estadísticas rápidas */}
        <div className="evt-main-kpi-grid">
          <div className="evt-main-kpi-card">
            <div className="evt-main-kpi-inner">
              <div className="flex-shrink-0">
                <svg className="evt-main-kpi-icon evt-text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="evt-main-kpi-info">
                <p className="evt-main-kpi-label">Próximos Eventos</p>
                <p className="evt-main-kpi-value">12</p>
              </div>
            </div>
          </div>

          <div className="evt-main-kpi-card">
            <div className="evt-main-kpi-inner">
              <div className="flex-shrink-0">
                <svg className="evt-main-kpi-icon evt-text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="evt-main-kpi-info">
                <p className="evt-main-kpi-label">Participantes Activos</p>
                <p className="evt-main-kpi-value">1,247</p>
              </div>
            </div>
          </div>

          <div className="evt-main-kpi-card">
            <div className="evt-main-kpi-inner">
              <div className="flex-shrink-0">
                <svg className="evt-main-kpi-icon evt-text-yellow" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="evt-main-kpi-info">
                <p className="evt-main-kpi-label">Calificación Promedio</p>
                <p className="evt-main-kpi-value">4.8</p>
              </div>
            </div>
          </div>

          <div className="evt-main-kpi-card">
            <div className="evt-main-kpi-inner">
              <div className="flex-shrink-0">
                <svg className="evt-main-kpi-icon evt-text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <div className="evt-main-kpi-info">
                <p className="evt-main-kpi-label">En Vivo Ahora</p>
                <p className="evt-main-kpi-value">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Componente principal del calendario */}
        <CalendarioEventos
          mostrarFiltros={true}
          eventosPorPagina={12}
          vistaInicial={'grid'} // React prop
        />
      </div>
    </main>
  );
};

export default Eventos;
