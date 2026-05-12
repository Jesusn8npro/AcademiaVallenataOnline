import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MenuLateralResponsive.css';
import MenuPublicoNav from './MenuPublicoNav';
import MenuEstudianteNav from './MenuEstudianteNav';
import MenuAdminNav from './MenuAdminNav';

const Avatar: React.FC<{ src?: string; alt: string; nombreCompleto: string; size: 'large' }> = ({ src, nombreCompleto }) => {
  const iniciales = nombreCompleto.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: '50%',
      backgroundColor: '#667eea',
      backgroundImage: src ? `url(${src})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 600, fontSize: '1.2rem'
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
  abierto, usuario, onCerrar, cerrarSesion, cerrandoSesion, abrirModalLogin
}) => {
  const navigate = useNavigate();
  const tipoUsuario = usuario ? (usuario.rol === 'admin' ? 'admin' : 'estudiante') : 'publico';
  const nombreUsuario = usuario?.nombre || usuario?.email?.split('@')[0] || 'Usuario';

  const navegarA = (url: string) => {
    onCerrar();
    setTimeout(() => { navigate(url) }, 10);
  };

  const manejarCerrarSesion = async () => {
    await cerrarSesion();
    onCerrar();
  };

  const manejarIniciarSesion = () => {
    if (abrirModalLogin) abrirModalLogin();
    onCerrar();
  };

  const navegarDesdelogo = () => {
    let destino = '/';
    if (usuario) destino = usuario.rol === 'admin' ? '/administrador' : '/panel-estudiante';
    navegarA(destino);
  };

  if (!abierto) return null;

  return (
    <>
      <div className="menu-lateral-overlay" onClick={onCerrar} />
      <div className="menu-lateral-responsive">
        <div className={`menu-lateral-header ${tipoUsuario}`}>
          {tipoUsuario === 'publico' ? (
            <div className="menu-lateral-bienvenida">
              <div className="menu-lateral-logo" onClick={navegarDesdelogo}>
                <img src="/logo-175.webp" alt="Academia Vallenata" className="menu-lateral-logo-img" width="175" height="113" loading="lazy" decoding="async" />
              </div>
              <div className="menu-lateral-texto">
                <h3 className="menu-lateral-titulo">¡Bienvenido!</h3>
                <p className="menu-lateral-subtitulo">Aprende acordeón vallenato online</p>
              </div>
            </div>
          ) : (
            <div className="menu-lateral-perfil">
              <div className="menu-lateral-avatar">
                <Avatar src={usuario?.url_foto_perfil} alt="Avatar del usuario" nombreCompleto={nombreUsuario} size="large" />
              </div>
              <div className="menu-lateral-info">
                <h3 className="menu-lateral-nombre">{nombreUsuario}</h3>
                <p className="menu-lateral-rol">{tipoUsuario === 'admin' ? 'Administrador' : 'Estudiante'}</p>
              </div>
            </div>
          )}
          <button className="menu-lateral-boton-cerrar" onClick={onCerrar} aria-label="Cerrar menú">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="menu-lateral-navegacion">
          {tipoUsuario === 'publico' && (
            <MenuPublicoNav navegarA={navegarA} manejarIniciarSesion={manejarIniciarSesion} />
          )}
          {tipoUsuario === 'estudiante' && <MenuEstudianteNav navegarA={navegarA} />}
          {tipoUsuario === 'admin' && <MenuAdminNav navegarA={navegarA} />}
        </div>

        {tipoUsuario !== 'publico' && (
          <div className="menu-lateral-footer">
            <button className="menu-lateral-boton-cerrar-sesion" onClick={manejarCerrarSesion} disabled={cerrandoSesion}>
              <div className="menu-lateral-icono">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
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
