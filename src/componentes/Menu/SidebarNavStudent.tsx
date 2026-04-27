import React from 'react';
import type { ProgresoEstudiante } from './useSidebarAdmin';

interface Props {
  esRutaActiva: (ruta: string) => boolean;
  colapsado: boolean;
  progresoEstudiante: ProgresoEstudiante;
}

export default function SidebarNavStudent({ esRutaActiva, colapsado, progresoEstudiante }: Props) {
  return (
    <>
      <div className="sidebar-admin-nav-section">
        {!colapsado && <div className="sidebar-admin-section-title">Mi Aprendizaje</div>}

        <a href="/panel-estudiante" className={`sidebar-admin-nav-item ${esRutaActiva('/panel-estudiante') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Mi Panel</span>}
        </a>

        <a href="/mis-cursos" className={`sidebar-admin-nav-item ${esRutaActiva('/mis-cursos') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          {!colapsado && (
            <>
              <span className="sidebar-admin-nav-text">Mis Cursos</span>
              <div className="sidebar-admin-nav-badge sidebar-admin-badge-progreso">{progresoEstudiante.porcentajeProgreso}%</div>
            </>
          )}
        </a>

        <a href="/cursos" className={`sidebar-admin-nav-item ${esRutaActiva('/cursos') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Cursos & Tutoriales</span>}
        </a>
      </div>

      <div className="sidebar-admin-nav-section">
        {!colapsado && <div className="sidebar-admin-section-title">Práctica</div>}

        <a href="/comunidad" className={`sidebar-admin-nav-item ${esRutaActiva('/comunidad') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          {!colapsado && (
            <>
              <span className="sidebar-admin-nav-text">Comunidad</span>
              <div className="sidebar-admin-nav-badge">{progresoEstudiante.miembrosComunidad}</div>
            </>
          )}
        </a>

        <a href="/ranking" className={`sidebar-admin-nav-item ${esRutaActiva('/ranking') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 16v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10c0-1.1.9-2 2-2h2l3-3 3 3h2a2 2 0 0 1 2 2v4M8 12l2 2 4-4" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Ranking</span>}
        </a>

        <a href="/eventos" className={`sidebar-admin-nav-item ${esRutaActiva('/eventos') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Eventos</span>}
        </a>

        <a href="/mensajes" className={`sidebar-admin-nav-item ${esRutaActiva('/mensajes') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Mensajes</span>}
        </a>
      </div>

      <div className="sidebar-admin-nav-section">
        {!colapsado && <div className="sidebar-admin-section-title">Configuración</div>}

        <a href="/mi-perfil" className={`sidebar-admin-nav-item ${esRutaActiva('/mi-perfil') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Mi Perfil</span>}
        </a>

        <a href="/configuracion" className={`sidebar-admin-nav-item ${esRutaActiva('/configuracion') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Configuración</span>}
        </a>

        <a href="/grabaciones" className={`sidebar-admin-nav-item ${esRutaActiva('/grabaciones') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="23" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Grabaciones</span>}
        </a>
      </div>
    </>
  );
}
