import React from 'react'

interface Props {
  navegarA: (url: string) => void
}

const MenuEstudianteNav: React.FC<Props> = ({ navegarA }) => {
  return (
    <>
      <div className="menu-lateral-seccion">
        <button className="menu-lateral-enlace activo" onClick={() => navegarA('/panel-estudiante')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 0 5-1 8-1s5 1 8 1v-5" />
            </svg>
          </div>
          <span>Mi Panel</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/cursos')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="13" rx="2" />
              <path d="M16 3v4M8 3v4" />
            </svg>
          </div>
          <span>Cursos</span>
          <span className="menu-lateral-badge progreso">75%</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/ranking')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
            </svg>
          </div>
          <span>Ranking</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/eventos')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <span>Eventos</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/blog')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M7 7h10M7 11h10M7 15h6" />
            </svg>
          </div>
          <span>Blog</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/comunidad')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span>Comunidad</span>
          <span className="menu-lateral-badge">12</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/mensajes')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span>Mensajes</span>
          <span className="menu-lateral-badge nuevo">2</span>
        </button>
      </div>

      <div className="menu-lateral-separador">
        <span className="menu-lateral-titulo-seccion">Mi Cuenta</span>
      </div>

      <div className="menu-lateral-seccion">
        <button className="menu-lateral-enlace" onClick={() => navegarA('/notificaciones')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <span>Notificaciones</span>
          <span className="menu-lateral-badge nuevo">3</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/perfil')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span>Ver Perfil</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/cuenta')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <span>Configuración de Cuenta</span>
        </button>
      </div>
    </>
  )
}

export default MenuEstudianteNav
