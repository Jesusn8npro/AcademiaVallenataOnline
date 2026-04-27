import React from 'react'

interface Props {
  esAdmin: boolean
}

const NavCentralAutenticado: React.FC<Props> = ({ esAdmin }) => {
  return (
    <div className="nav-auth-center">
      {esAdmin ? (
        <>
          <a href="/panel-administracion" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
              </svg>
            </span>
            <span>Panel Admin</span>
          </a>
          <a href="/administrador/crear-contenido" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </span>
            <span>Crear Contenido</span>
          </a>
          <a href="/administrador/usuarios" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <circle cx="12" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              </svg>
            </span>
            <span>Usuarios</span>
          </a>
          <a href="/administrador/pagos" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <rect x="2" y="7" width="20" height="13" rx="2" />
                <path d="M2 10h20" /><circle cx="8" cy="15" r="2" /><circle cx="16" cy="15" r="2" />
              </svg>
            </span>
            <span>Pagos</span>
          </a>
          <a href="/administrador/paquetes" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </span>
            <span>Paquetes</span>
          </a>
          <a href="/administrador/eventos" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <span>Eventos</span>
          </a>
          <a href="/administrador/blog" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1l1-4z" />
              </svg>
            </span>
            <span>Blog</span>
          </a>
          <a href="/simulador-gaming" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" /><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="7" cy="7" r="1.5" /><circle cx="17" cy="7" r="1.5" />
                <line x1="7" y1="10" x2="7" y2="12" /><line x1="17" y1="10" x2="17" y2="12" />
              </svg>
            </span>
            <span>Simulador</span>
          </a>
          <a href="/acordeon-pro-max" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </span>
            <span>Acordeon Pro Max</span>
          </a>
          <a href="/simulador-app" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </span>
            <span>Simulador App</span>
          </a>
          <a href="/mensajes" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span>Mensajes</span>
          </a>
        </>
      ) : (
        <>
          <a href="/panel-estudiante" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 0 5-1 8-1s5 1 8 1v-5" />
              </svg>
            </span>
            <span>Mi Panel</span>
          </a>
          <a href="/cursos" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <rect x="2" y="7" width="20" height="13" rx="2" />
                <path d="M16 3v4M8 3v4" />
              </svg>
            </span>
            <span>Cursos</span>
          </a>
          <a href="/comunidad" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span>Comunidad</span>
          </a>
          <a href="/ranking" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
              </svg>
            </span>
            <span>Ranking</span>
          </a>
          <a href="/eventos" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <span>Eventos</span>
          </a>
          <a href="/blog" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M7 7h10M7 11h10M7 15h6" />
              </svg>
            </span>
            <span>Blog</span>
          </a>
          <a href="/mensajes" className="nav-auth-link">
            <span className="nav-auth-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span>Mensajes</span>
          </a>
        </>
      )}
    </div>
  )
}

export default NavCentralAutenticado
