import React from 'react'

interface Props {
  navegarA: (url: string) => void
  manejarIniciarSesion: () => void
}

const MenuPublicoNav: React.FC<Props> = ({ navegarA, manejarIniciarSesion }) => {
  return (
    <>
      <div className="menu-lateral-seccion">
        <button className="menu-lateral-enlace" onClick={() => navegarA('/')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12L12 3l9 9" /><path d="M9 21V9h6v12" />
            </svg>
          </div>
          <span>Inicio</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/blog')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M8 3v4" /><path d="M16 3v4" />
            </svg>
          </div>
          <span>Blog</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/cursos')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="13" rx="2" />
              <path d="M16 3v4" /><path d="M8 3v4" />
            </svg>
          </div>
          <span>Cursos</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/paquetes')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M12 3v4" /><path d="M8 3v4" /><path d="M16 3v4" />
            </svg>
          </div>
          <span>Paquetes</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/eventos')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M8 3v4" /><path d="M16 3v4" />
            </svg>
          </div>
          <span>Eventos</span>
        </button>
        <button className="menu-lateral-enlace" onClick={() => navegarA('/nuestra-academia')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 15h8" /><path d="M8 11h8" /><path d="M8 7h8" />
            </svg>
          </div>
          <span>Nuestra Academia</span>
        </button>
      </div>

      <div className="menu-lateral-acciones">
        <button className="menu-lateral-boton-accion primario" onClick={manejarIniciarSesion}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10,17 15,12 10,7" /><line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <span>Iniciar Sesión</span>
        </button>
        <button className="menu-lateral-boton-accion secundario" onClick={() => navegarA('/registro')}>
          <div className="menu-lateral-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <span>Crear Cuenta</span>
        </button>
      </div>
    </>
  )
}

export default MenuPublicoNav
