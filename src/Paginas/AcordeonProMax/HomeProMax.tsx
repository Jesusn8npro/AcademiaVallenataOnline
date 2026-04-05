import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeProMax.css';
import NavbarProMax from './Componentes/NavbarProMax';
import FondoEspacialProMax from './Componentes/FondoEspacialProMax';
import { Howl } from 'howler';
import { 
  Info,
  Github,
  Mail,
  Heart
} from 'lucide-react';

/**
 * ACORDEÓN PRO MAX - HOME PRINCIPAL
 * Una experiencia de juego musical vallenato inmersiva.
 * Inspirada en el diseño de Rhythm+ Music Game.
 */
const HomeProMax: React.FC = () => {
  const [musicaIniciada, setMusicaIniciada] = useState(false);
  const navigate = useNavigate();
  const musicaRef = useRef<Howl | null>(null);

  // Inicializar música de fondo (vallenato pedido por el usuario)
  useEffect(() => {
    musicaRef.current = new Howl({
      src: ['/audio/149_036 LLORE - 1999 MAS VA.mp3'],
      loop: true,
      volume: 0.02, // Volumen al 2% para que sea casi un susurro sutil
      autoplay: false,
      html5: true, 
      preload: true
    });

    // Reproducir solo al primer clic para máxima compatibilidad y control del usuario
    const iniciarMusicaAlClic = () => {
      if (musicaRef.current && !musicaIniciada) {
        musicaRef.current.play();
        setMusicaIniciada(true);
        // Quitar el listener después del primer disparo exitoso
        window.removeEventListener('click', iniciarMusicaAlClic);
      }
    };

    window.addEventListener('click', iniciarMusicaAlClic);

    return () => {
      musicaRef.current?.unload();
      window.removeEventListener('click', iniciarMusicaAlClic);
    };
  }, []);

  const handleStartMusic = () => {
    // Esto se maneja con el listener global de clic
    if (musicaRef.current && !musicaIniciada) {
      musicaRef.current.play();
      setMusicaIniciada(true);
    }
  };

  const handleToggleMute = (muted: boolean) => {
    musicaRef.current?.volume(muted ? 0 : 0.02);
  };

  return (
    <div className="home-promax-contenedor" onClick={handleStartMusic}>
      {/* ── Fondo Inmersivo (Copia exacta de Rhythm+) ───────────────────── */}
      <FondoEspacialProMax />

      {/* ── Navbar Superior (Copia exacta de Rhythm+) ────────────────────── */}
      <NavbarProMax onToggleMute={handleToggleMute} />

      {/* ── Contenido Central ─────────────────────────────────────────────── */}
      <main className="home-promax-centro">
        <h1 className="home-promax-logo-texto">
          Acordeón <br /> Pro Max
        </h1>
        <p className="home-promax-subtitulo">Academia de Acordeón Online</p>
        
        <div className="home-promax-button-group">
          <button
            className="home-promax-btn-start"
            onClick={() => navigate('/acordeon-pro-max/lista')}
          >
            ¡EMPEZAR A TOCAR!
          </button>
          
          <button
            className="home-promax-btn-practice"
            onClick={() => navigate('/acordeon-pro-max/acordeon')}
          >
            PRÁCTICA LIBRE
          </button>
        </div>
        
        <div className="home-promax-login-sub">
          Iniciar sesión o Registrarse
        </div>
      </main>

      {/* ── Aviso Alpha y Versión ─────────────────────────────────────────── */}
      <div className="home-promax-version">
        alpha-2.4.0-build-premium
      </div>

      <div className="home-promax-aviso">
        <div className="home-promax-aviso-icono">
          <Info size={16} color="#fbbf24" />
        </div>
        <div className="home-promax-aviso-texto">
          <h4>ESTADO DE DESARROLLO (ALPHA)</h4>
          <p>Este simulador está bajo desarrollo activo por Jesus Gonzalez.</p>
        </div>
      </div>

      {/* ── Redes Sociales Inferior Derecha ───────────────────────────────── */}
      <footer style={{
        position: 'absolute', bottom: '20px', right: '20px', 
        display: 'flex', gap: '15px', color: 'rgba(255,255,255,0.4)', zIndex: 50
      }}>
        <Github size={20} style={{cursor: 'pointer'}} />
        <Mail size={20} style={{cursor: 'pointer'}} />
        <Heart size={20} color="#ec4899" style={{cursor: 'pointer'}} />
      </footer>
    </div>
  );
};

export default HomeProMax;
