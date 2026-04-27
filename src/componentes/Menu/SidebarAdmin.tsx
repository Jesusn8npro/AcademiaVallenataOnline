import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebarAdmin } from './useSidebarAdmin';
import SidebarNavAdmin from './SidebarNavAdmin';
import SidebarNavStudent from './SidebarNavStudent';
import './SidebarAdmin.css';

const SidebarAdmin = () => {
  const navigate = useNavigate();
  const {
    usuario, tipoUsuario, nombreUsuario,
    colapsado, menuPerfilAbierto, modalBusquedaAbierto, setModalBusquedaAbierto,
    estadisticasAdmin, progresoEstudiante, mensajeMotivacional,
    perfilRef,
    esRutaActiva, alternarBarraLateral, alternarMenuPerfil,
    cerrarSesionCompleta, irAPerfil, irACursos, abrirModalBusqueda
  } = useSidebarAdmin();

  return (
    <div className={`sidebar-admin-moderno ${colapsado ? 'sidebar-admin-colapsado' : ''}`}>
      <div className="sidebar-admin-header">
        <div className="sidebar-admin-icon-container">
          <div className="sidebar-admin-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-label">Menú</span>}
        </div>
        <button className="sidebar-admin-btn-toggle" aria-label={colapsado ? 'Expandir menú' : 'Contraer menú'} onClick={alternarBarraLateral}>
          <div className={`sidebar-admin-toggle-icon ${colapsado ? 'sidebar-admin-rotado' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </div>
        </button>
      </div>

      <div className="sidebar-admin-search-container">
        <button className={`sidebar-admin-search-btn ${colapsado ? 'sidebar-admin-search-colapsado' : ''}`} onClick={abrirModalBusqueda} aria-label="Abrir búsqueda">
          <div className="sidebar-admin-search-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          {!colapsado && (
            <>
              <span className="sidebar-admin-search-text">Buscar contenido...</span>
              <div className="sidebar-admin-search-shortcut">⌘K</div>
            </>
          )}
        </button>
      </div>

      <nav className="sidebar-admin-navegacion">
        {tipoUsuario === 'admin' ? (
          <SidebarNavAdmin esRutaActiva={esRutaActiva} colapsado={colapsado} estadisticasAdmin={estadisticasAdmin} />
        ) : (
          <SidebarNavStudent esRutaActiva={esRutaActiva} colapsado={colapsado} progresoEstudiante={progresoEstudiante} />
        )}
      </nav>

      {!colapsado && tipoUsuario === 'admin' && (
        <div className="sidebar-admin-stats-card">
          <div className="sidebar-admin-stats-header">
            <div className="sidebar-admin-stats-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
            </div>
            <div className="sidebar-admin-stats-title">Estadísticas</div>
          </div>
          <div className="sidebar-admin-stats-content">
            <div className="sidebar-admin-stat-item">
              <div className="sidebar-admin-stat-value">{estadisticasAdmin.totalEstudiantes.toLocaleString()}</div>
              <div className="sidebar-admin-stat-label">Estudiantes</div>
            </div>
            <div className="sidebar-admin-stat-item">
              <div className="sidebar-admin-stat-value">{estadisticasAdmin.totalCursos}</div>
              <div className="sidebar-admin-stat-label">Cursos</div>
            </div>
          </div>
          <div className="sidebar-admin-stats-progress">
            <div className="sidebar-admin-progress-bar">
              <div className="sidebar-admin-progress-fill" style={{ width: `${estadisticasAdmin.porcentajeObjetivo}%` }}></div>
            </div>
            <div className="sidebar-admin-progress-text">{estadisticasAdmin.porcentajeObjetivo}% del objetivo mensual</div>
          </div>
        </div>
      )}

      {!colapsado && tipoUsuario === 'estudiante' && (
        <>
          <div className="sidebar-admin-motivational-card">
            <div className="sidebar-admin-motivational-header">
              <div className="sidebar-admin-motivational-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div className="sidebar-admin-motivational-title">¡Motivación Diaria!</div>
            </div>
            <div className="sidebar-admin-motivational-content">
              <p className="sidebar-admin-motivational-message">{mensajeMotivacional}</p>
            </div>
          </div>

          <div className="sidebar-admin-stats-card-student">
            <div className="sidebar-admin-stats-header-student">
              <div className="sidebar-admin-stats-icon-student">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                </svg>
              </div>
              <div className="sidebar-admin-stats-title-student">⭐ Estadísticas Clave</div>
            </div>
            <div className="sidebar-admin-stats-content-student">
              <div className="sidebar-admin-stat-item-student">
                <span className="sidebar-admin-stat-icon-emoji">💎</span>
                <div className="sidebar-admin-stat-info">
                  <div className="sidebar-admin-stat-value-student">{progresoEstudiante.puntos}</div>
                  <div className="sidebar-admin-stat-label-student">Puntos</div>
                </div>
              </div>
              <div className="sidebar-admin-stat-item-student">
                <span className="sidebar-admin-stat-icon-emoji">📚</span>
                <div className="sidebar-admin-stat-info">
                  <div className="sidebar-admin-stat-value-student">{progresoEstudiante.leccionesCompletadas}</div>
                  <div className="sidebar-admin-stat-label-student">Lecciones</div>
                </div>
              </div>
              <div className="sidebar-admin-stat-item-student">
                <span className="sidebar-admin-stat-icon-emoji">🔥</span>
                <div className="sidebar-admin-stat-info">
                  <div className="sidebar-admin-stat-value-student">{progresoEstudiante.racha}</div>
                  <div className="sidebar-admin-stat-label-student">Días</div>
                </div>
              </div>
            </div>
            <div className="sidebar-admin-stats-buttons">
              <button className="sidebar-admin-stats-btn-left" onClick={() => navigate('/mi-perfil')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Mi Perfil
              </button>
              <button className="sidebar-admin-stats-btn-right" onClick={() => navigate('/mis-cursos')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                Mis Cursos
              </button>
            </div>
          </div>
        </>
      )}

      <div className="sidebar-admin-perfil-usuario" ref={perfilRef}>
        <div
          className={`sidebar-admin-perfil-btn ${colapsado ? 'sidebar-admin-perfil-colapsado' : ''}`}
          onClick={alternarMenuPerfil}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && alternarMenuPerfil(e as any)}
        >
          <div className="sidebar-admin-avatar-container">
            <div className="sidebar-admin-avatar">
              {usuario?.url_foto_perfil ? (
                <img src={usuario.url_foto_perfil} alt="Avatar" />
              ) : (
                <div className="sidebar-admin-avatar-placeholder">{nombreUsuario.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className="sidebar-admin-status-indicator"></div>
          </div>
          {!colapsado && (
            <>
              <div className="sidebar-admin-perfil-info">
                <div className="sidebar-admin-perfil-nombre">{nombreUsuario}</div>
                <div className="sidebar-admin-perfil-rol">{tipoUsuario === 'admin' ? 'Administrador' : 'Estudiante'}</div>
              </div>
              <div className="sidebar-admin-perfil-chevron">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </div>
            </>
          )}
        </div>

        {menuPerfilAbierto && (
          <div className="sidebar-admin-menu-perfil" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-admin-perfil-header">
              <div className="sidebar-admin-avatar-header">
                {usuario?.url_foto_perfil ? (
                  <img src={usuario.url_foto_perfil} alt="Avatar" />
                ) : (
                  <div className="sidebar-admin-avatar-placeholder-large">{nombreUsuario.charAt(0).toUpperCase()}</div>
                )}
                <div className="sidebar-admin-status-indicator-header"></div>
              </div>
              <div className="sidebar-admin-info-header">
                <div className="sidebar-admin-nombre-header">{nombreUsuario}</div>
                <div className="sidebar-admin-correo-header">{usuario?.email || 'usuario@email.com'}</div>
              </div>
            </div>
            <div className="sidebar-admin-menu-opciones">
              <button className="sidebar-admin-opcion" onClick={irAPerfil}>
                <div className="sidebar-admin-opcion-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span className="sidebar-admin-opcion-text">Mi Perfil</span>
              </button>
              <button className="sidebar-admin-opcion" onClick={irACursos}>
                <div className="sidebar-admin-opcion-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <span className="sidebar-admin-opcion-text">{tipoUsuario === 'admin' ? 'Cursos' : 'Mis Cursos'}</span>
              </button>
              <div className="sidebar-admin-menu-divider"></div>
              <button className="sidebar-admin-opcion sidebar-admin-logout" onClick={cerrarSesionCompleta}>
                <div className="sidebar-admin-opcion-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <span className="sidebar-admin-opcion-text">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SidebarAdmin;
