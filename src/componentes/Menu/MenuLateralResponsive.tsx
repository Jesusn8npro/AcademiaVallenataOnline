import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MenuLateralResponsive.css';

// Componente Avatar simple
const Avatar: React.FC<{ src?: string; alt: string; nombreCompleto: string; size: 'large' }> = ({
  src,
  nombreCompleto
}) => {
  const iniciales = nombreCompleto
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      backgroundColor: '#667eea', // Fallback color
      backgroundImage: src ? `url(${src})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 600,
      fontSize: '1.2rem'
    }}>
      {!src && iniciales}
    </div>
  );
};

interface MenuLateralResponsiveProps {
  abierto: boolean;
  usuario: any;
  onCerrar: () => void;
  cerrarSesion: () => Promise<void>;
  cerrandoSesion: boolean;
  abrirModalLogin?: () => void;
}

const MenuLateralResponsive: React.FC<MenuLateralResponsiveProps> = ({
  abierto,
  usuario,
  onCerrar,
  cerrarSesion,
  cerrandoSesion,
  abrirModalLogin
}) => {
  const navigate = useNavigate();

  // Determinar tipo de usuario
  const tipoUsuario = usuario ? (usuario.rol === 'admin' ? 'admin' : 'estudiante') : 'publico';
  const nombreUsuario = usuario?.nombre || usuario?.email?.split('@')[0] || 'Usuario';

  const navegarA = (url: string) => {
    navigate(url);
    onCerrar();
  };

  const manejarCerrarSesion = async () => {
    await cerrarSesion();
    onCerrar();
  };

  const manejarIniciarSesion = () => {
    if (abrirModalLogin) {
      abrirModalLogin();
    }
    onCerrar();
  };

  const navegarDesdelogo = () => {
    let destino = '/';
    if (usuario) {
      destino = usuario.rol === 'admin' ? '/administrador' : '/panel-estudiante';
    }
    navegarA(destino);
  };

  if (!abierto) return null;

  return (
    <>
      {/* Overlay */}
      <div className="menu-lateral-overlay" onClick={onCerrar} />

      {/* Menú Lateral */}
      <div className="menu-lateral-responsive">
        {/* Header del Perfil / Bienvenida */}
        <div className={`menu-lateral-header ${tipoUsuario}`}>
          {tipoUsuario === 'publico' ? (
            <div className="menu-lateral-bienvenida">
              <div className="menu-lateral-logo" onClick={navegarDesdelogo}>
                <img
                  src="/imagenes/logo academia vallenata.png"
                  alt="Academia Vallenata"
                  className="menu-lateral-logo-img"
                />
              </div>
              <div className="menu-lateral-texto">
                <h3 className="menu-lateral-titulo">¡Bienvenido!</h3>
                <p className="menu-lateral-subtitulo">Aprende acordeón vallenato online</p>
              </div>
            </div>
          ) : (
            <div className="menu-lateral-perfil">
              <div className="menu-lateral-avatar">
                <Avatar
                  src={usuario?.url_foto_perfil}
                  alt="Avatar del usuario"
                  nombreCompleto={nombreUsuario}
                  size="large"
                />
              </div>
              <div className="menu-lateral-info">
                <h3 className="menu-lateral-nombre">{nombreUsuario}</h3>
                <p className="menu-lateral-rol">
                  {tipoUsuario === 'admin' ? 'Administrador' : 'Estudiante'}
                </p>
              </div>
            </div>
          )}

          <button className="menu-lateral-boton-cerrar" onClick={onCerrar} aria-label="Cerrar menú">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navegación Principal */}
        <div className="menu-lateral-navegacion">
          {tipoUsuario === 'publico' && (
            <>
              <div className="menu-lateral-seccion">
                <button className="menu-lateral-enlace" onClick={() => navegarA('/')}>
                  <div className="menu-lateral-icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12L12 3l9 9" />
                      <path d="M9 21V9h6v12" />
                    </svg>
                  </div>
                  <span>Inicio</span>
                </button>
                <button className="menu-lateral-enlace" onClick={() => navegarA('/blog')}>
                  <div className="menu-lateral-icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M8 3v4" />
                      <path d="M16 3v4" />
                    </svg>
                  </div>
                  <span>Blog</span>
                </button>
                <button className="menu-lateral-enlace" onClick={() => navegarA('/cursos')}>
                  <div className="menu-lateral-icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="13" rx="2" />
                      <path d="M16 3v4" />
                      <path d="M8 3v4" />
                    </svg>
                  </div>
                  <span>Cursos</span>
                </button>
                <button className="menu-lateral-enlace" onClick={() => navegarA('/paquetes')}>
                  <div className="menu-lateral-icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="7" width="18" height="13" rx="2" />
                      <path d="M12 3v4" />
                      <path d="M8 3v4" />
                      <path d="M16 3v4" />
                    </svg>
                  </div>
                  <span>Paquetes</span>
                </button>
                <button className="menu-lateral-enlace" onClick={() => navegarA('/eventos')}>
                  <div className="menu-lateral-icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M8 3v4" />
                      <path d="M16 3v4" />
                    </svg>
                  </div>
                  <span>Eventos</span>
                </button>
                <button className="menu-lateral-enlace" onClick={() => navegarA('/nuestra-academia')}>
                  <div className="menu-lateral-icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 15h8" />
                      <path d="M8 11h8" />
                      <path d="M8 7h8" />
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
                      <polyline points="10,17 15,12 10,7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </div>
                  <span>Iniciar Sesión</span>
                </button>

                <button className="menu-lateral-boton-accion secundario" onClick={() => navegarA('/registro')}>
                  <div className="menu-lateral-icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  </div>
                  <span>Crear Cuenta</span>
                </button>
              </div>
            </>
          )}

          {tipoUsuario === 'estudiante' && (
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
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
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
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
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
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
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
          )}

          {tipoUsuario === 'admin' && (
            <>
              <div className="menu-lateral-seccion">
                <button className="menu-lateral-enlace" onClick={() => navegarA('/administrador')}>
                  <div className="menu-lateral-icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="9" />
                      <rect x="14" y="3" width="7" height="5" />
                      <rect x="14" y="12" width="7" height="9" />
                      <rect x="3" y="16" width="7" height="5" />
                    </svg>
                  </div>
                  <span>Panel Admin</span>
                </button>

                <button className="menu-lateral-enlace" onClick={() => navegarA('/administrador/crear-contenido')}>
                  <div className="menu-lateral-icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
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
                      <path d="M2 10h20" />
                      <circle cx="8" cy="15" r="2" />
                      <circle cx="16" cy="15" r="2" />
                    </svg>
                  </div>
                  <span>Pagos</span>
                </button>

                <button className="menu-lateral-enlace" onClick={() => navegarA('/simulador-gaming')}>
                  <div className="menu-lateral-icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="7" cy="7" r="1.5" />
                      <circle cx="17" cy="7" r="1.5" />
                      <line x1="7" y1="10" x2="7" y2="12" />
                      <line x1="17" y1="10" x2="17" y2="12" />
                    </svg>
                  </div>
                  <span>Simulador</span>
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
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
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
          )}
        </div>

        {/* Footer con Cerrar Sesión (solo para usuarios autenticados) */}
        {tipoUsuario !== 'publico' && (
          <div className="menu-lateral-footer">
            <button
              className="menu-lateral-boton-cerrar-sesion"
              onClick={manejarCerrarSesion}
              disabled={cerrandoSesion}
            >
              <div className="menu-lateral-icono">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <span>{cerrandoSesion ? 'Cerrando...' : 'Cerrar Sesión'}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default MenuLateralResponsive;
