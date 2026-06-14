import * as React from 'react';
import { useRef, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import PuenteNotas from '../Componentes/PuenteNotas';
import JuicioOverlay from '../Componentes/JuicioOverlay';
import { PersonajeEstudioProvider, usePersonajeEstudio } from '../PracticaLibre/contextoPersonajeEstudio';
import { PERSONAJES } from '../PracticaLibre/personajes';
import type { CancionHeroConTonalidad, EstadisticasPartida, EfectoGolpe } from '../TiposProMax';
import './ModoCompetitivo.css';
import './ModoLibre.css';

// Acordeón 3D (three.js ~500KB) — sólo se carga al entrar al juego.
const VisorAcordeon3D = dynamic(
  () => import('../PracticaLibre/Componentes/VisorAcordeon3D'),
  { ssr: false, loading: () => <div className="acordeon-3d-juego-cargando">Cargando acordeón 3D…</div> }
);

// Personaje 3D (GLB pesado) — sólo se carga si el alumno activa "Mi personaje".
const VisorPersonaje3D = dynamic(
  () => import('../PracticaLibre/Componentes/VisorPersonaje3D'),
  { ssr: false, loading: () => <div className="acordeon-3d-juego-cargando">Cargando personaje…</div> }
);

// Control flotante: alterna el avatar del alumno (acordeón ↔ personaje) y, si está en personaje,
// permite elegir cuál. Vive dentro del PersonajeEstudioProvider para leer/escribir la elección.
const ControlAvatarAlumno: React.FC<{ usarPersonaje: boolean; onToggle: () => void }> = ({ usarPersonaje, onToggle }) => {
  const { personajeId, setPersonajeId } = usePersonajeEstudio();
  return (
    <div className="juego-avatar-control">
      <button className={`juego-avatar-btn ${usarPersonaje ? 'modo-personaje' : ''}`} onClick={onToggle}>
        {usarPersonaje ? '🕺 Mi personaje' : '🪗 Acordeón 3D'}
      </button>
      {usarPersonaje && (
        <div className="juego-avatar-selector">
          {PERSONAJES.map((p) => (
            <button
              key={p.id}
              className={`juego-avatar-foto ${personajeId === p.id ? 'activo' : ''}`}
              onClick={() => setPersonajeId(p.id)}
              title={p.nombre}
              style={{ backgroundImage: `url("${p.foto}")` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Motivos (pieles) distintos para diferenciar Maestro y Alumno. Cambiables aquí.
const SKIN_MAESTRO = '3';
const SKIN_ALUMNO = '5';

// Props que el visor exige pero el juego no usa (sin paneo de pieza ni detección de mallas).
const NOOP_CLICK_PIEZA: (n: string) => void = () => {};
const NOOP_MALLAS: (p: any) => void = () => {};

// strip dirección → clave espacial del botón (idéntico a keyDeId del visor 3D): el PuenteNotas
// pregunta por "1-5-halar" y el visor reporta posiciones por "1-5" / "bajo-1-3".
function claveBoton(idBoton: string): string {
  let s = idBoton;
  let bajo = false;
  if (s.endsWith('-bajo')) { bajo = true; s = s.slice(0, -5); }
  s = s.replace(/-halar$/, '').replace(/-empujar$/, '');
  return bajo ? `bajo-${s}` : s;
}

interface ModoJuegoProps {
  conPenalizacion: boolean;
  cancion: CancionHeroConTonalidad;
  tickActual: number;
  botonesActivosMaestro: Record<string, any>;
  direccionMaestro: 'halar' | 'empujar';
  logica: any;
  configTonalidad: any;
  estadisticas: EstadisticasPartida;
  efectosVisuales: EfectoGolpe[];
  notasImpactadas: Set<string>;
  imagenFondo: string;
  actualizarBotonActivo: (id: string, accion: 'add' | 'remove', inst?: any[] | null) => void;
  registrarPosicionGolpe: (x: number, y: number) => void;
  // Rango de la sección activa: PuenteNotas filtra notas fuera de él para no mostrar "fantasmas" durante el lead-in.
  rangoSeccion?: { inicio: number; fin: number } | null;
}

const ModoJuego: React.FC<ModoJuegoProps> = ({
  conPenalizacion,
  cancion,
  tickActual,
  botonesActivosMaestro,
  direccionMaestro,
  logica,
  configTonalidad,
  estadisticas,
  efectosVisuales,
  notasImpactadas,
  actualizarBotonActivo,
  registrarPosicionGolpe,
  rangoSeccion,
}) => {
  // Posiciones en pantalla de los botones, proyectadas desde cada acordeón 3D (cámara fija).
  // Reemplazan al cálculo por DOM de usePosicionProMax (los botones 3D no son elementos DOM).
  const posMaestroRef = useRef<Record<string, { x: number; y: number }>>({});
  const posAlumnoRef = useRef<Record<string, { x: number; y: number }>>({});
  const obtenerPosicionMaestro = useCallback((id: string) => posMaestroRef.current[claveBoton(id)] ?? null, []);
  const obtenerPosicionAlumno = useCallback((id: string) => posAlumnoRef.current[claveBoton(id)] ?? null, []);
  // El visor exige un ref de fuelle (control con tecla Q en el estudio); en el juego el fuelle
  // va cerrado fijo, así que este ref dummy nunca se activa.
  const fuelleDummyRef = useRef(false);

  // Avatar del alumno: acordeón 3D (default) o el personaje elegido. Se persiste en localStorage.
  const [usarPersonaje, setUsarPersonaje] = useState(false);
  useEffect(() => { setUsarPersonaje(localStorage.getItem('juego:usarPersonaje') === '1'); }, []);
  const toggleAvatar = useCallback(() => {
    setUsarPersonaje((v) => {
      const n = !v;
      localStorage.setItem('juego:usarPersonaje', n ? '1' : '0');
      return n;
    });
  }, []);
  // En modo personaje no hay botones de acordeón que proyectar → limpiamos las posiciones del
  // alumno para que el PuenteNotas no dibuje notas sobre coordenadas viejas.
  useEffect(() => { if (usarPersonaje) posAlumnoRef.current = {}; }, [usarPersonaje]);

  // — Competitivo: flash de pantalla al recibir daño
  const vidaPreviaRef = useRef(estadisticas.vida);
  const [mostrarFlash, setMostrarFlash] = useState(false);
  useEffect(() => {
    if (!conPenalizacion) return;
    if (estadisticas.vida < vidaPreviaRef.current) {
      setMostrarFlash(true);
      setTimeout(() => setMostrarFlash(false), 600);
    }
    vidaPreviaRef.current = estadisticas.vida;
  }, [estadisticas.vida, conPenalizacion]);

  // — Libre: banner de bienvenida temporal
  const [mostrarBanner, setMostrarBanner] = useState(!conPenalizacion);

  const getColorVida = () => {
    if (estadisticas.vida > 60) return 'verde';
    if (estadisticas.vida > 30) return 'amarillo';
    return 'rojo';
  };

  const getMensajeDinamico = () => {
    if (estadisticas.rachaActual >= 10) return '¡Vas excelente! Cuando domines esta canción, prueba el Modo Competitivo 🚀';
    if (estadisticas.rachaActual >= 5) return '¡Muy bien! Mantén la racha, vas en buen camino 🎵';
    if (estadisticas.notasFalladas > 10) return 'Sin presión, cada nota cuenta. Sigue practicando 💪';
    return 'Practica con tranquilidad, aprendes al ritmo que necesites 🎼';
  };

  return (
    <PersonajeEstudioProvider>
    <div className={conPenalizacion ? 'competitivo-modo' : 'libre-modo'}>

      {conPenalizacion ? (
        /* ── HUD COMPETITIVO ── */
        <motion.div
          className="competitivo-hud-superior"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`competitivo-hud-container ${mostrarFlash ? 'dano-flash' : ''}`}>
            <div className="competitivo-vida-section">
              <span className="competitivo-label">VIDA</span>
              <div className={`competitivo-health-bar ${getColorVida()}`}>
                <div className="competitivo-health-fill" style={{ width: `${estadisticas.vida}%` }} />
              </div>
              <span className="competitivo-vida-porcentaje">{Math.ceil(estadisticas.vida)}%</span>
            </div>
            <div className="competitivo-divider" />
            <div className="competitivo-puntos-section">
              <span className="competitivo-label">PUNTOS</span>
              <motion.span
                className="competitivo-puntos-valor"
                key={estadisticas.puntos}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {estadisticas.puntos}
              </motion.span>
            </div>
            <div className="competitivo-divider" />
            <AnimatePresence>
              {estadisticas.multiplicador >= 2 && (
                <motion.div
                  className="competitivo-multiplicador-section"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <span className="competitivo-label">MULTI</span>
                  <div className={`competitivo-multi-badge multi-${estadisticas.multiplicador}`}>
                    ×{estadisticas.multiplicador}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {estadisticas.rachaActual >= 5 && (
                <motion.div
                  className="competitivo-racha-section"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <span className="competitivo-label">RACHA</span>
                  <motion.span
                    className="competitivo-racha-valor"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  >
                    {estadisticas.rachaActual}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        /* ── HUD LIBRE ── */
        <>
          <AnimatePresence>
            {mostrarBanner && (
              <motion.div
                className="libre-banner-bienvenida"
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                onAnimationComplete={() => { setTimeout(() => setMostrarBanner(false), 8000); }}
              >
                <div className="libre-banner-content">
                  <div className="libre-banner-header">
                    <span className="libre-banner-titulo">🎵 Practica sin presión</span>
                    <button className="libre-banner-close" onClick={() => setMostrarBanner(false)}>
                      <X size={18} />
                    </button>
                  </div>
                  <p className="libre-banner-texto">
                    Toca la melodía con tranquilidad. No hay vida, no hay penalizaciones.
                    Cuando domines la canción, prueba el <strong>Modo Competitivo</strong> para un desafío real.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            className="libre-hud-superior"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="libre-badge-modo">🎵 MODO LIBRE</div>
            <div className="libre-estadisticas-container">
              <div className="libre-stat-item">
                <span className="stat-label">PERFECTAS</span>
                <span className="stat-valor perfecto">{estadisticas.notasPerfecto}</span>
              </div>
              <div className="libre-stat-item">
                <span className="stat-label">BIEN</span>
                <span className="stat-valor bien">{estadisticas.notasBien}</span>
              </div>
              <div className="libre-stat-item">
                <span className="stat-label">FALLADAS</span>
                <span className="stat-valor fallada">{estadisticas.notasFalladas}</span>
              </div>
              <div className="libre-stat-divider" />
              <div className="libre-stat-item">
                <span className="stat-label">RACHA</span>
                <motion.span
                  className="stat-valor racha"
                  key={estadisticas.rachaActual}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                >
                  {estadisticas.rachaActual}
                </motion.span>
              </div>
              <div className="libre-stat-item">
                <span className="stat-label">PUNTOS</span>
                <span className="stat-valor puntos">{estadisticas.puntos}</span>
              </div>
            </div>
            <motion.div
              className="libre-mensaje-dinamico"
              key={estadisticas.rachaActual}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {getMensajeDinamico()}
            </motion.div>
          </motion.div>
        </>
      )}

      {/* ── Escenario Maestro / Alumno (acordeón 3D) ── */}
      <div className="hero-escenario">
        <div className="hero-acordeon-wrap maestro">
          <span className="hero-acordeon-label">Maestro</span>
          {/* Maestro: read-only (sin onTocarBoton), hundimiento driveado por botonesActivosMaestro. */}
          <VisorAcordeon3D
            materialPorMesh={{}}
            piezaSeleccionada={null}
            onClickPieza={NOOP_CLICK_PIEZA}
            onMallasDetectadas={NOOP_MALLAS}
            fuelleCerrandoRef={fuelleDummyRef}
            animShapeKey={null}
            animProgramatica={null}
            pulseEpoch={null}
            skin={SKIN_MAESTRO}
            fuelleCerradoFijo
            camaraFija
            botonesActivosExternos={botonesActivosMaestro}
            direccion={direccionMaestro}
            onPosicionesBotones={(m) => { posMaestroRef.current = m; }}
            className="acordeon-3d-juego"
          />
        </div>
        <div
          className="hero-acordeon-wrap alumno"
          onPointerMove={(e) => registrarPosicionGolpe(e.clientX, e.clientY)}
        >
          <span className="hero-acordeon-label">Alumno</span>
          <ControlAvatarAlumno usarPersonaje={usarPersonaje} onToggle={toggleAvatar} />
          {usarPersonaje ? (
            /* El personaje elegido toca/recibe las notas en vivo (useNotasSuscripcion ← emisor
               global; el alumno toca vía actualizarBotonActivo, que emite). */
            <VisorPersonaje3D />
          ) : (
            /* Alumno: tocable (clic/tap suena) + hundimiento driveado por logica.botonesActivos. */
            <VisorAcordeon3D
              materialPorMesh={{}}
              piezaSeleccionada={null}
              onClickPieza={NOOP_CLICK_PIEZA}
              onMallasDetectadas={NOOP_MALLAS}
              fuelleCerrandoRef={fuelleDummyRef}
              animShapeKey={null}
              animProgramatica={null}
              pulseEpoch={null}
              skin={SKIN_ALUMNO}
              fuelleCerradoFijo
              camaraFija
              botonesActivosExternos={logica.botonesActivos}
              direccion={logica.direccion}
              onTocarBoton={(id, accion) => actualizarBotonActivo(id, accion === 'down' ? 'add' : 'remove')}
              onPosicionesBotones={(m) => { posAlumnoRef.current = m; }}
              className="acordeon-3d-juego"
            />
          )}
        </div>
      </div>

      <PuenteNotas
        cancion={cancion}
        tickActual={tickActual}
        obtenerPosicionMaestro={obtenerPosicionMaestro}
        obtenerPosicionAlumno={obtenerPosicionAlumno}
        modoVista={logica.modoVista}
        configTonalidad={configTonalidad}
        notasImpactadas={notasImpactadas}
        rangoSeccion={rangoSeccion}
      />

      <JuicioOverlay estadisticas={estadisticas} efectosVisuales={efectosVisuales} />
    </div>
    </PersonajeEstudioProvider>
  );
};

export default React.memo(ModoJuego);
