import React from 'react'

interface Props {
  navegarA: (url: string) => void
}

const MenuAdminNav: React.FC<Props> = ({ navegarA }) => {
  return (
    <>
      <div className="menu-lateral-seccion">
        <button className="menu-lateral-enlace" onClick={() => navegarA('/administrador')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
            </svg>
          </div>
          <span>Panel Admin</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/administrador/crear-contenido')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <span>Crear Contenido</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/administrador/usuarios')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="7" r="4" />
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            </svg>
          </div>
          <span>Gestión Usuarios</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/administrador/pagos')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="13" rx="2" />
              <path d="M2 10h20" /><circle cx="8" cy="15" r="2" /><circle cx="16" cy="15" r="2" />
            </svg>
          </div>
          <span>Pagos</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/simulador-gaming')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" /><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="7" cy="7" r="1.5" /><circle cx="17" cy="7" r="1.5" />
              <line x1="7" y1="10" x2="7" y2="12" /><line x1="17" y1="10" x2="17" y2="12" />
            </svg>
          </div>
          <span>Simulador Gaming</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/simulador-app')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <span>Simulador App</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/acordeon-pro-max')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span>Acordeon Pro Max</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/mensajes')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span>Mensajes</span>
          <span className="menu-lateral-badge nuevo">5</span>
        </button>
      </div>

      <div className="menu-lateral-separador">
        <span className="menu-lateral-titulo-seccion">Administración</span>
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
          <span className="menu-lateral-badge nuevo">5</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/mi-perfil')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span>Mi Perfil</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/configuracion')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <span>Configuración</span>
        </button>
      </div>
    </>
  )
}

export default MenuAdminNav
