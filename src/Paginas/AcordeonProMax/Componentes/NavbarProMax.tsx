import React, { useState } from 'react';
import './NavbarProMax.css';
import { Howl } from 'howler';
import {
  Home,
  Search,
  Trophy,
  Settings,
  ExternalLink,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  UserCircle,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { usePerfilStore } from '../../../stores/perfilStore';

// Precargar los sonidos originales de Rhythm+
const sonidoHover = new Howl({
  src: ['/efectos/ui/hover_menu.mp3'],
  volume: 0.5
});

const sonidoClick = new Howl({
  src: ['/efectos/ui/click_menu.mp3'],
  volume: 0.6
});

interface PropsNavbarProMax {
  onToggleMute?: (muted: boolean) => void;
}

/**
 * NAVBAR PRO MAX
 * Copia exacta de los estilos y comportamiento de Rhythm+ Music Game.
 * Incluye navegación dinámica con expansión en Hover y controles de sistema.
 */
const NavbarProMax: React.FC<PropsNavbarProMax> = ({ onToggleMute }) => {
  const navigate = useNavigate();
  const { usuario, estaAutenticado } = useUsuario();
  const { perfil } = usePerfilStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const reproducirHover = () => sonidoHover.play();
  const reproducirClick = () => sonidoClick.play();

  const handleNav = (path: string) => {
    reproducirClick();
    navigate(path);
  };

  const toggleMute = () => {
    reproducirClick();
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    if (onToggleMute) onToggleMute(newMuteState);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const nombreUsuario = perfil?.nombre_completo || usuario?.email?.split('@')[0] || 'Usuario';
  // Solo muestra el item de Admin si el rol confirma admin (mismo gate que ProteccionAdmin).
  const esAdmin = usuario?.rol === 'admin';

  return (
    <nav className="navbar-promax">
      {/* ── Nav Izquierdo Expansible ────────────────────────────────────── */}
      <div className="nav-promax-izquierdo">
        <div className="nav-promax-item" onMouseEnter={reproducirHover} onClick={() => handleNav('/acordeon-pro-max')}>
          <Home size={22} />
          <span className="nav-promax-texto">Inicio</span>
        </div>
        <div className="nav-promax-item" onMouseEnter={reproducirHover} onClick={() => handleNav('/acordeon-pro-max/lista')}>
          <Search size={22} />
          <span className="nav-promax-texto">Buscar Canciones</span>
        </div>
        <div className="nav-promax-item" onMouseEnter={reproducirHover} onClick={() => handleNav('/ranking')}>
          <Trophy size={22} />
          <span className="nav-promax-texto">Ránkings</span>
        </div>
        <div className="nav-promax-item" onMouseEnter={reproducirHover} onClick={() => handleNav('/acordeon-pro-max/configuracion')}>
          <Settings size={22} />
          <span className="nav-promax-texto">Configuraciones</span>
        </div>
        {esAdmin && (
          <div
            className="nav-promax-item nav-promax-item-admin"
            onMouseEnter={reproducirHover}
            onClick={() => handleNav('/acordeon-pro-max/admin')}
          >
            <ShieldCheck size={22} />
            <span className="nav-promax-texto">Studio Admin</span>
          </div>
        )}
        <div className="nav-promax-item"
          onMouseEnter={reproducirHover}
          onClick={() => { reproducirClick(); window.open('https://academiavallenata.online', '_blank'); }}
        >
          <ExternalLink size={22} />
          <span className="nav-promax-texto">Academia Online</span>
        </div>
      </div>

      {/* ── Nav Derecho (Controles y Perfil) ────────────────────────────── */}
      <div className="nav-promax-derecho">
        <div className="nav-promax-controles">
          <div className="nav-promax-control-icon pulse" onMouseEnter={reproducirHover} onClick={toggleMute}>
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </div>
          <div className="nav-promax-control-icon pulse" onMouseEnter={reproducirHover} onClick={() => { reproducirClick(); toggleFullscreen(); }}>
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </div>
        </div>

        <div className="nav-promax-perfil" onMouseEnter={reproducirHover} onClick={() => handleNav('/acordeon-pro-max/configuracion')}>
          <UserCircle size={22} />
          <div className="nav-promax-perfil-texto">
            {estaAutenticado ? (
              <>
                <div className="nav-promax-nombre">{nombreUsuario}</div>
                <div className="nav-promax-estado">Perfil y Mas</div>
              </>
            ) : (
              <>
                <div className="nav-promax-nombre">Inicia Sesión</div>
                <div className="nav-promax-estado">o Regístrate ahora</div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};;

export default NavbarProMax;
