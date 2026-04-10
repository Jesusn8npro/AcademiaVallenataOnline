import React from 'react';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Drum,
  Eye,
  Gauge,
  HeartPulse,
  Music2,
  Pause,
  Play,
  Radio,
  Square,
  TimerReset,
  Trophy,
  Volume2,
  Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import './HeaderHero.css';
import type { ModoVista } from '../../SimuladorDeAcordeon/TiposAcordeon';

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

type TonoStat = 'gold' | 'green' | 'blue' | 'red' | 'neutral';

type HeroStat = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: TonoStat;
};

const DESCRIPCIONES_VISTA: Record<string, string> = {
  teclas: 'Muestra la referencia directa del teclado.',
  numeros: 'Usa la numeracion fisica del acordeon.',
  notas: 'Presenta las notas musicales reales.',
  cifrado: 'Convierte los botones a cifrado americano.',
};

function formatearTiempo(ms: number) {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

function obtenerClaveModo(hero: any) {
  if (hero.estadoJuego === 'practica_libre' || hero.modoPractica === 'libre') return 'libre';
  if (hero.modoPractica === 'synthesia') return 'synthesia';
  if (hero.modoPractica === 'maestro_solo') return 'maestro_solo';
  return 'competencia';
}

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
  const headerRef = React.useRef<HTMLDivElement | null>(null);
  const ayudaRef = React.useRef<HTMLDivElement | null>(null);
  const vistaRef = React.useRef<HTMLDivElement | null>(null);
  const [ayudaAbierta, setAyudaAbierta] = React.useState(false);
  const [vistaAbierta, setVistaAbierta] = React.useState(false);

  const mostrarHeader = !['seleccion', 'resultados', 'gameOver'].includes(hero.estadoJuego);
  const claveModo = obtenerClaveModo(hero);
  const esModoLibre = claveModo === 'libre';
  const cancion = hero.cancionSeleccionada;
  const tonalidadActiva = hero.logica?.tonalidadSeleccionada || cancion?.tonalidad || 'ADG';
  const bpmBase = cancion?.bpm || hero.bpm || 120;
  const vistaActiva = modosVista.find(({ valor }) => hero.logica?.modoVista === valor) || modosVista[0];
  const totalIntentos = hero.estadisticas.notasPerfecto + hero.estadisticas.notasBien + hero.estadisticas.notasFalladas + hero.estadisticas.notasPerdidas;
  const aciertos = hero.estadisticas.notasPerfecto + hero.estadisticas.notasBien;
  const precision = totalIntentos > 0 ? Math.round((aciertos / totalIntentos) * 100) : 0;
  const avance = hero.totalTicks > 0 ? Math.round((hero.tickActual / hero.totalTicks) * 100) : 0;
  const grabando = Boolean(hero.grabaciones?.grabando);
  const tiempoGrabacion = hero.grabaciones?.tiempoGrabacionMs || 0;
  const haySesionActiva = ['contando', 'jugando', 'pausado', 'pausado_synthesia'].includes(hero.estadoJuego) || grabando;

  const modoInfo = React.useMemo(() => {
    switch (claveModo) {
      case 'libre':
        return {
          label: 'Modo libre',
          accent: 'libre',
          descripcion: 'Improvisa, graba frases y practica sin puntaje.',
        };
      case 'synthesia':
        return {
          label: 'Synthesia',
          accent: 'synthesia',
          descripcion: 'El sistema te guia nota por nota para estudiar limpio.',
        };
      case 'maestro_solo':
        return {
          label: 'Maestro solo',
          accent: 'maestro',
          descripcion: 'Escucha y repasa la ejecucion del maestro con calma.',
        };
      default:
        return {
          label: 'Competencia',
          accent: 'competencia',
          descripcion: 'Puntaje, vida y racha activos en tiempo real.',
        };
    }
  }, [claveModo]);

  const estadoInfo = React.useMemo(() => {
    switch (hero.estadoJuego) {
      case 'contando':
        return 'Cuenta regresiva';
      case 'jugando':
        return 'En curso';
      case 'pausado':
        return 'En pausa';
      case 'pausado_synthesia':
        return 'Esperando nota';
      case 'resultados':
        return 'Resultados';
      case 'gameOver':
        return 'Intento terminado';
      case 'practica_libre':
        return 'Sesion libre';
      default:
        return 'Activo';
    }
  }, [hero.estadoJuego]);

  const statsCompactas = React.useMemo<HeroStat[]>(() => {
    if (claveModo === 'competencia') {
      return [
        { label: 'Puntos', value: hero.estadisticas.puntos.toLocaleString('es-CO'), icon: Trophy, tone: 'gold' },
        { label: 'Precision', value: totalIntentos > 0 ? `${precision}%` : '--', icon: CheckCircle2, tone: 'green' },
        { label: 'Vida', value: `${hero.estadisticas.vida}%`, icon: HeartPulse, tone: 'red' },
        { label: 'Racha', value: `${hero.estadisticas.rachaActual}`, icon: Waves, tone: 'blue' },
      ];
    }

    if (claveModo === 'libre') {
      return [
        { label: 'Estado', value: grabando ? 'Grabando' : 'Listo', icon: Radio, tone: grabando ? 'red' : 'green' },
        { label: 'Tiempo', value: formatearTiempo(tiempoGrabacion), icon: TimerReset, tone: 'blue' },
        { label: 'Tono', value: tonalidadActiva, icon: Music2, tone: 'gold' },
        { label: 'Vista', value: vistaActiva?.label || 'T', icon: Eye, tone: 'neutral' },
      ];
    }

    return [
      { label: 'Precision', value: totalIntentos > 0 ? `${precision}%` : '--', icon: Trophy, tone: 'gold' },
      { label: 'Aciertos', value: `${aciertos}/${Math.max(totalIntentos, aciertos)}`, icon: CheckCircle2, tone: 'green' },
      { label: 'Avance', value: `${avance}%`, icon: Activity, tone: 'blue' },
      { label: 'Maestro', value: hero.maestroSuena ? 'Activo' : 'Muteado', icon: Volume2, tone: hero.maestroSuena ? 'gold' : 'neutral' },
    ];
  }, [aciertos, avance, claveModo, grabando, hero.estadisticas, hero.maestroSuena, precision, tiempoGrabacion, tonalidadActiva, totalIntentos, vistaActiva?.label]);

  const consejos = React.useMemo(() => {
    switch (claveModo) {
      case 'libre':
        return [
          'Usa este modo para grabar ideas, probar tonos y practicar sin puntaje.',
          'Abre Vista para cambiar la lectura del teclado sin mover el acordeon.',
          'Si estas grabando, mantente en el BPM actual para que el replay quede mas limpio.',
        ];
      case 'synthesia':
        return [
          'El sistema se detiene para que toques la nota correcta antes de seguir.',
          'Mira primero el fuelle y luego confirma el boton iluminado.',
          'Baja el BPM cuando quieras estudiar el fraseo por bloques.',
        ];
      case 'maestro_solo':
        return [
          'Usa este modo para escuchar, rebobinar y estudiar frases del maestro.',
          'Combina Maestro activo con BPM mas lento para limpiar pasajes dificiles.',
          'Fijate en el compas y en la direccion del fuelle para entrar seguro.',
        ];
      default:
        return [
          'La racha se sostiene mejor cuando ajustas el BPM en pasos pequenos.',
          'Escucha el primer golpe del metronomo para entrar firme en cada compas.',
          `Compas actual ${compas}/4. Mantener el pulso vale mas que correr.`,
        ];
    }
  }, [claveModo, compas]);

  const tituloPrincipal = cancion?.titulo || 'Acordeon Pro Max';
  const detalleBpm = hero.bpm !== bpmBase ? ` / base ${bpmBase}` : '';
  const lineaEstado =
    hero.feedbackFuelle ||
    hero.mensajeMotivacional ||
    (cancion
      ? `${estadoInfo}${cancion.autor ? ` · ${cancion.autor}` : ''} · BPM ${hero.bpm}${detalleBpm} · Vista ${vistaActiva?.label || 'T'}`
      : `${estadoInfo} · ${modoInfo.descripcion}`);

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ayudaRef.current && !ayudaRef.current.contains(target)) {
        setAyudaAbierta(false);
      }
      if (vistaRef.current && !vistaRef.current.contains(target)) {
        setVistaAbierta(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAyudaAbierta(false);
        setVistaAbierta(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  React.useEffect(() => {
    if (!mostrarHeader) {
      onAlturaChange(0);
      return;
    }

    const header = headerRef.current;
    if (!header) return;

    const actualizarAltura = () => {
      const altura = Math.ceil(header.getBoundingClientRect().height + 8);
      onAlturaChange(altura);
    };

    actualizarAltura();

    const resizeObserver = new ResizeObserver(actualizarAltura);
    resizeObserver.observe(header);
    window.addEventListener('resize', actualizarAltura);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', actualizarAltura);
    };
  }, [mostrarHeader, onAlturaChange, ayudaAbierta, vistaAbierta, lineaEstado, statsCompactas.length]);

  const manejarVolver = () => {
    if (haySesionActiva) {
      const confirmado = window.confirm('Vas a salir de la sesion actual. Los cambios no guardados se perderan.');
      if (!confirmado) return;
    }
    onVolver();
  };

  const manejarModoLibre = () => {
    if (!esModoLibre && haySesionActiva) {
      const confirmado = window.confirm('Se cerrara la sesion actual para pasar a modo libre.');
      if (!confirmado) return;
    }
    onIrModoLibre();
  };

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

              <button className={`hero-btn-toolbar ${esModoLibre ? 'activo' : ''}`} onClick={manejarModoLibre}>
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
                  {grabando && (
                    <span className="hero-chip hero-chip-grabando">REC {formatearTiempo(tiempoGrabacion)}</span>
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
    </div>
  );
};

export default HeaderHero;
