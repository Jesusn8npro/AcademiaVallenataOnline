import React from 'react';
import {
  ArrowLeft,
  ChevronDown,
  CircleHelp,
  Drum,
  Eye,
  Gauge,
  Music2,
  Pause,
  Play,
  Square,
  Volume2,
} from 'lucide-react';
import './HeaderHero.css';
import type { ModoVista } from '../../../Core/acordeon/TiposAcordeon';
import { useHeaderHero } from './useHeaderHero';

interface HeaderHeroProps {
  hero: any;
  modosVista: { valor: ModoVista; label: string }[];
  setMetronomoVisible: React.Dispatch<React.SetStateAction<boolean>>;
  botonMetronomoRef: React.RefObject<HTMLDivElement | null>;
  metronomoVisible: boolean;
  compas: number;
  onVolver: () => void;
  onIrModoLibre: () => void;
  onAlturaChange: (height: number) => void;
}

const DESCRIPCIONES_VISTA: Record<string, string> = {
  teclas: 'Muestra la referencia directa del teclado.',
  numeros: 'Usa la numeracion fisica del acordeon.',
  notas: 'Presenta las notas musicales reales.',
  cifrado: 'Convierte los botones a cifrado americano.',
};

const HeaderHero: React.FC<HeaderHeroProps> = ({
  hero,
  modosVista,
  setMetronomoVisible,
  botonMetronomoRef,
  metronomoVisible,
  compas,
  onVolver,
  onIrModoLibre,
  onAlturaChange,
}) => {
  const {
    headerRef, ayudaRef, vistaRef,
    ayudaAbierta, setAyudaAbierta,
    vistaAbierta, setVistaAbierta,
    confirmacion, setConfirmacion,
    mostrarHeader,
    modoInfo,
    statsCompactas,
    consejos,
    tituloPrincipal,
    lineaEstado,
    vistaActiva,
    tonalidadActiva,
    manejarVolver,
    manejarModoLibre,
  } = useHeaderHero({ hero, modosVista, compas, onAlturaChange, onVolver, onIrModoLibre });

  if (!mostrarHeader) return null;

  return (
    <div ref={headerRef} className={`hero-hud-superior modo-${modoInfo.accent} estado-${hero.estadoJuego}`}>
      <div className="hero-hud-shell">
        <div className="hero-hud-main">
          <div className="hero-hud-identidad">
            <div className="hero-hud-nav-row">
              <button className="hero-btn-toolbar" onClick={manejarVolver}>
                <ArrowLeft size={16} />
                Volver
              </button>

              <button className={`hero-btn-toolbar ${hero.estadoJuego === 'practica_libre' || hero.modoPractica === 'libre' ? 'activo' : ''}`} onClick={manejarModoLibre}>
                <Music2 size={16} />
                Modo libre
              </button>
            </div>

            <div className="hero-hud-copy">
              <div className="hero-hud-title-row">
                <h1>{tituloPrincipal}</h1>

                <div className="hero-hud-badges">
                  <span className="hero-chip hero-chip-modo">{modoInfo.label}</span>
                  <span className="hero-chip">Tono {tonalidadActiva}</span>
                  <span className="hero-chip">Compas {compas}/4</span>
                  {hero.estadisticas.multiplicador > 1 && (
                    <span className="hero-chip hero-chip-destacado">x{hero.estadisticas.multiplicador}</span>
                  )}
                </div>
              </div>

              <p className="hero-hud-status">{lineaEstado}</p>
            </div>
          </div>

          <div className="hero-hud-marcador">
            {statsCompactas.map(({ label, value, icon: Icono, tone }) => (
              <article key={label} className={`hero-stat-pill ${tone}`}>
                <Icono size={14} />
                <span className="hero-stat-pill-label">{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>

          <div className="hero-hud-controles">
            <div className="hero-bpm-control">
              <span className="hero-bpm-label">
                <Gauge size={14} />
                BPM
              </span>

              <button
                className="hero-btn-bpm"
                onClick={() => hero.cambiarBpm((b: number) => Math.max(40, b - 5))}
                aria-label="Bajar BPM"
              >
                -
              </button>

              <span className="hero-bpm-num">{hero.bpm}</span>

              <input
                type="range"
                min={40}
                max={240}
                value={hero.bpm}
                onChange={(e) => hero.cambiarBpm(Number(e.target.value))}
                className="hero-bpm-slider"
              />

              <button
                className="hero-btn-bpm"
                onClick={() => hero.cambiarBpm((b: number) => Math.min(240, b + 5))}
                aria-label="Subir BPM"
              >
                +
              </button>
            </div>

            <div className="hero-popover-wrap" ref={vistaRef}>
              <button
                className={`hero-btn-toolbar ${vistaAbierta ? 'activo' : ''}`}
                onClick={() => {
                  setVistaAbierta((prev) => !prev);
                  setAyudaAbierta(false);
                }}
              >
                <Eye size={16} />
                Vista
                <span className="hero-btn-pill-value">{vistaActiva?.label || 'T'}</span>
                <ChevronDown size={14} />
              </button>

              {vistaAbierta && (
                <div className="hero-popover hero-popover-vista">
                  <div className="hero-popover-header">
                    <Eye size={15} />
                    <span>Vista del teclado</span>
                  </div>

                  <div className="hero-vista-lista">
                    {modosVista.map(({ valor, label }) => (
                      <button
                        key={valor}
                        className={`hero-vista-opcion ${hero.logica?.modoVista === valor ? 'activo' : ''}`}
                        onClick={() => {
                          hero.logica?.setModoVista(valor);
                          setVistaAbierta(false);
                        }}
                      >
                        <span className="hero-vista-opcion-label">{label}</span>
                        <span className="hero-vista-opcion-copy">{DESCRIPCIONES_VISTA[valor] || 'Vista personalizada del teclado.'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="hero-popover-wrap" ref={ayudaRef}>
              <button
                className={`hero-btn-toolbar ${ayudaAbierta ? 'activo' : ''}`}
                onClick={() => {
                  setAyudaAbierta((prev) => !prev);
                  setVistaAbierta(false);
                }}
              >
                <CircleHelp size={16} />
                Ayuda
              </button>

              {ayudaAbierta && (
                <div className="hero-popover hero-popover-ayuda">
                  <div className="hero-popover-header">
                    <CircleHelp size={15} />
                    <span>Consejos rapidos</span>
                  </div>

                  <div className="hero-ayuda-lista">
                    {consejos.map((consejo) => (
                      <div key={consejo} className="hero-ayuda-item">
                        <span className="hero-ayuda-dot" />
                        <p>{consejo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div ref={botonMetronomoRef} className="hero-control-anchor">
              <button
                className={`hero-btn-control ${metronomoVisible ? 'activo' : ''}`}
                onClick={() => setMetronomoVisible((v) => !v)}
                title="Metronomo"
              >
                <Drum size={16} />
                Metronomo
              </button>
            </div>

            <button
              className={`hero-btn-control ${hero.maestroSuena ? 'activo' : ''}`}
              onClick={() => hero.setMaestroSuena((v: boolean) => !v)}
              title={hero.maestroSuena ? 'Silenciar maestro' : 'Activar maestro'}
            >
              <Volume2 size={16} />
              {hero.maestroSuena ? 'Maestro activo' : 'Maestro muteado'}
            </button>

            {hero.estadoJuego === 'jugando' && (
              <button className="hero-btn-control" onClick={hero.alternarPausa}>
                <Pause size={16} />
                Pausar
              </button>
            )}

            {hero.estadoJuego === 'pausado' && (
              <button className="hero-btn-control activo" onClick={hero.alternarPausa}>
                <Play size={16} />
                Reanudar
              </button>
            )}

            {['contando', 'jugando', 'pausado', 'pausado_synthesia', 'resultados', 'gameOver'].includes(hero.estadoJuego) && (
              <button className="hero-btn-control peligro" onClick={hero.detenerJuego}>
                <Square size={16} />
                Terminar
              </button>
            )}
          </div>
        </div>
      </div>

      {confirmacion && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <p style={{ color: 'white', marginBottom: '20px', lineHeight: 1.5 }}>{confirmacion.texto}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmacion(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #4b5563', background: 'transparent', color: 'white', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => { confirmacion.onConfirmar(); setConfirmacion(null); }} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderHero;
