import * as React from 'react';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import CuerpoAcordeon from '../../../Core/componentes/CuerpoAcordeon';
import PuenteNotas from '../Componentes/PuenteNotas';
import JuicioOverlay from '../Componentes/JuicioOverlay';
import { usePosicionProMax } from '../Hooks/usePosicionProMax';
import type { CancionHeroConTonalidad, EstadisticasPartida, EfectoGolpe } from '../TiposProMax';
import { TICKS_VIAJE } from '../TiposProMax';
import { usePersonaje3DGuardado } from '../PracticaLibre/Servicios/usePersonaje3DGuardado';
import {
  SKIN_MAESTRO, SKIN_ALUMNO, ENC_ROTACION, ENC_FILL, ENC_OFFSET_REL_X, ENC_OFFSET_REL_Y,
  ENC_ANCHO_WRAP, ENC_GAP, ENC_INV_FILAS, ENC_INV_COLS, claveBoton,
} from './acordeon3dCompartido';
import './ModoCompetitivo.css';
import './ModoLibre.css';

// Acordeón 3D (three.js ~500KB) — sólo se carga si el usuario activa la vista 3D.
const VisorAcordeon3D = dynamic(
  () => import('../PracticaLibre/Componentes/VisorAcordeon3D'),
  { ssr: false, loading: () => <div className="acordeon-3d-juego-cargando">Cargando acordeón 3D…</div> }
);

// Referencias estables: el Maestro es read-only (no responde a clicks). Pasar `() => {}` inline
// crearia una funcion nueva en cada render y rompe React.memo en CuerpoAcordeon.
const NOOP_SET_BOTON: (id: string) => void = () => {};
const NOOP_ACTUALIZAR: (id: string, accion: 'add' | 'remove', inst?: any[] | null) => void = () => {};
const NOOP_CLICK_PIEZA: (n: string) => void = () => {};
const NOOP_MALLAS: (p: any) => void = () => {};

// ── Vista 3D del modo juego ─────────────────────────────────────────────────────────
// Pieles (SKIN_*), encuadre (ENC_*) y claveBoton viven en ./acordeon3dCompartido (los reusan
// también Maestro y Synthesia vía <AcordeonModo3D>).
// Poner en true para mostrar el panel de ajuste del encuadre 3D (sliders) sobre la página real.
// Ya afinado y guardado en ENC_FILL/ENC_OFFSET_* → queda en false (sin sliders de debug).
const CONTROLES_3D = false;

// ── Director multicámara (opcional) ──────────────────────────────────────────────────
// "Tomas" = presets de ENCUADRE (zoom + desplazamiento). Al elegir una, EncuadreJuego interpola
// suave hacia ella (no mueve la cámara → no pelea con el auto-fit; las notas siguen alineadas).
// Aplica a AMBOS acordeones (vista pareja). Los valores de melodía/bajos son aproximados: afínalos
// con los sliders si hace falta. (Ángulos rotados / cenital = siguiente fase.)
interface TomaCamara { id: string; nombre: string; icono: string; fill: number; offX: number; offY: number }
// Valores MEDIDOS (proyección real) para centrar melodía/bajos; zoom moderado (no satura, "fácil de
// entender" en competencia). offX/offY centran el grupo; el centrado es independiente del zoom (fill).
const TOMAS_CAMARA: TomaCamara[] = [
  { id: 'general', nombre: 'General', icono: '🎥', fill: ENC_FILL, offX: ENC_OFFSET_REL_X, offY: ENC_OFFSET_REL_Y },
  { id: 'cerca',   nombre: 'Cerca',   icono: '🔍', fill: 1.55, offX: ENC_OFFSET_REL_X, offY: ENC_OFFSET_REL_Y },
  { id: 'melodia', nombre: 'Melodía', icono: '🎵', fill: 1.70, offX: 0.39, offY: 0.21 },
  { id: 'bajos',   nombre: 'Bajos',   icono: '🪗', fill: 1.70, offX: -0.18, offY: 0.25 },
];

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
  imagenFondo,
  actualizarBotonActivo,
  registrarPosicionGolpe,
  rangoSeccion,
}) => {
  const { refMaestro, refAlumno, obtenerPosicionMaestro, obtenerPosicionAlumno } = usePosicionProMax();
  // El acordeón del ALUMNO muestra el DISEÑO que el usuario eligió (mismo que Mundo 3D / Personaje).
  // El maestro queda con su acordeón "de profesor" fijo (SKIN_MAESTRO). El ESCENARIO 3D del usuario
  // va detrás de AMBOS acordeones (global), con selector para cambiarlo.
  const { skin: skinAlumno, escenario: escenarioGuardado } = usePersonaje3DGuardado(SKIN_ALUMNO);
  const [escenarioDuelo, setEscenarioDuelo] = useState(escenarioGuardado);
  useEffect(() => { setEscenarioDuelo(escenarioGuardado); }, [escenarioGuardado]);
  const [mostrarEscenarios, setMostrarEscenarios] = useState(false);

  // ── Toggle Imágenes ↔ Acordeón 3D (persistido). Default = imágenes (no cambia nada). ──
  const [use3D, setUse3D] = useState(true);
  useEffect(() => { setUse3D(localStorage.getItem('juego:use3D') !== '0'); }, []);
  const toggle3D = useCallback(() => {
    setUse3D((v) => { const n = !v; localStorage.setItem('juego:use3D', n ? '1' : '0'); return n; });
  }, []);
  // Posiciones en pantalla de los botones, proyectadas por cada acordeón 3D (reemplazan al
  // cálculo por DOM de usePosicionProMax cuando estamos en 3D; los botones 3D no son DOM).
  const posMaestroRef = useRef<Record<string, { x: number; y: number }>>({});
  const posAlumnoRef = useRef<Record<string, { x: number; y: number }>>({});
  const obtenerPosMaestro3D = useCallback((id: string) => posMaestroRef.current[claveBoton(id)] ?? null, []);
  const obtenerPosAlumno3D = useCallback((id: string) => posAlumnoRef.current[claveBoton(id)] ?? null, []);
  // Botones OBJETIVO próximos a pisar (clave→proximidad 0..1) → el acordeón del ALUMNO los ilumina
  // con anticipación (estilo Guitar Hero): el botón que viene se enciende antes, más brillante al
  // acercarse, para que se vea CLARO cuál pisar. Se recalcula cada frame desde la canción + tick.
  const objetivosRef = useRef<Record<string, number>>({});
  // ── MAESTRO ADELANTADO + fuelle de ambos ───────────────────────────────────────────────────
  // El acordeón del MAESTRO va ADELANTADO: enciende/anima el botón cuando la nota SALE de él
  // (en `nota.tick − TICKS_VIAJE`), para que la nota VIAJE al alumno y el estudiante toque al
  // LLEGAR (en `nota.tick`). Antes el maestro encendía en `nota.tick` = justo cuando la nota
  // llegaba al alumno → ambos se animaban al mismo tiempo. El ALUMNO se queda en `nota.tick`.
  // Fuelle (empujar=cerrando→cierra, halar=abriendo→abre; actividad=cuántas notas suenan = velocidad).
  const fuelleDirAlumnoRef = useRef(false);
  const fuelleActAlumnoRef = useRef(0);
  fuelleDirAlumnoRef.current = direccionMaestro === 'empujar';
  fuelleActAlumnoRef.current = Math.min(Object.values(botonesActivosMaestro).filter(Boolean).length / 2, 1);
  // Botones + fuelle del MAESTRO calculados ADELANTADOS (ventana que arranca en nota.tick − TICKS_VIAJE).
  const fuelleDirMaestroRef = useRef(false);
  const fuelleActMaestroRef = useRef(0);
  const botonesMaestroLead: Record<string, boolean> = {};
  let _leadCount = 0;
  let _leadEmpujar = false;
  {
    const sec = cancion?.secuencia as Array<{ tick: number; botonId: string; duracion?: number; fuelle?: string }> | undefined;
    if (Array.isArray(sec)) {
      for (const n of sec) {
        if (rangoSeccion && (n.tick < rangoSeccion.inicio || n.tick > rangoSeccion.fin)) continue;
        const ini = n.tick - TICKS_VIAJE;
        if (tickActual >= ini && tickActual < ini + Math.max(n.duracion || 0, 40)) {
          botonesMaestroLead[n.botonId] = true;
          _leadCount++;
          _leadEmpujar = n.fuelle === 'cerrando';
        }
      }
    }
  }
  fuelleDirMaestroRef.current = _leadEmpujar;
  fuelleActMaestroRef.current = Math.min(_leadCount / 2, 1);
  const direccionMaestroLead: 'halar' | 'empujar' = _leadEmpujar ? 'empujar' : 'halar';

  // Ajuste en vivo del encuadre 3D (solo si CONTROLES_3D). Arrancan en los valores fijos.
  const [fill3D, setFill3D] = useState(ENC_FILL);
  const [offX3D, setOffX3D] = useState(ENC_OFFSET_REL_X);
  const [offY3D, setOffY3D] = useState(ENC_OFFSET_REL_Y);
  // Navegar (orbitar) el acordeón 3D para explorarlo en el espacio.
  const [navegar3D, setNavegar3D] = useState(false);
  // Director multicámara: toma activa + panel de tomas. Elegir una mueve el encuadre (EncuadreJuego
  // interpola fill/offset hacia los valores de la toma → zoom/acercamiento suave a ambos acordeones).
  const [tomaActual, setTomaActual] = useState('general');
  const [mostrarCamaras, setMostrarCamaras] = useState(false);
  const aplicarToma = useCallback((t: TomaCamara) => {
    setTomaActual(t.id); setFill3D(t.fill); setOffX3D(t.offX); setOffY3D(t.offY);
  }, []);
  // Modo AUTO: el director va cambiando de toma solo cada pocos segundos (vista cinematográfica).
  const [autoCamara, setAutoCamara] = useState(false);
  const autoIdxRef = useRef(0);
  useEffect(() => {
    if (!autoCamara) return;
    const timer = setInterval(() => {
      autoIdxRef.current = (autoIdxRef.current + 1) % TOMAS_CAMARA.length;
      aplicarToma(TOMAS_CAMARA[autoIdxRef.current]);
    }, 5200);
    return () => clearInterval(timer);
  }, [autoCamara, aplicarToma]);

  const ajustesDuelo = useMemo(() => ({
    ...logica.ajustes,
    tamano: 'var(--duelo-acordeon-tamano, min(70vh, 32vw))',
    x: 'var(--duelo-acordeon-x, 50%)',
    y: 'var(--duelo-acordeon-y, 50%)',
  }), [logica.ajustes]);

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

  // Botones próximos a pisar en el alumno (proximidad 0..1) — alimenta la iluminación anticipada.
  {
    const obj: Record<string, number> = {};
    const sec = cancion?.secuencia;
    if (Array.isArray(sec)) {
      for (const n of sec) {
        const dt = n.tick - tickActual;
        if (dt <= -12 || dt > TICKS_VIAJE) continue;
        if (rangoSeccion && (n.tick < rangoSeccion.inicio || n.tick > rangoSeccion.fin)) continue;
        const prox = Math.max(0, Math.min(1, 1 - dt / TICKS_VIAJE));
        const k = claveBoton(n.botonId);
        if (prox > (obj[k] ?? 0)) obj[k] = prox;
      }
    }
    objetivosRef.current = obj;
  }

  return (
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

      {/* Toggle Imágenes ↔ Acordeón 3D */}
      <button
        type="button"
        onClick={toggle3D}
        className="juego-toggle-3d"
        title="Cambiar entre acordeón de imagen y 3D"
      >
        {use3D ? '🪗 Acordeón 3D' : '🖼️ Imágenes'}
      </button>

      {/* Navegar (orbitar) el acordeón 3D. Sólo visible en modo 3D. */}
      {use3D && (
        <button
          type="button"
          onClick={() => setNavegar3D((v) => !v)}
          className="juego-toggle-3d juego-toggle-navegar"
          title="Rotar el acordeón para verlo en 3D"
          style={{ left: 150, background: navegar3D ? 'rgba(16,185,129,0.85)' : undefined }}
        >
          {navegar3D ? '🔄 Navegando' : '🔄 Navegar'}
        </button>
      )}

      {/* Director multicámara (opcional): botón 🎥 + tomas (zoom/acercamiento a ambos acordeones). */}
      {use3D && (
        <>
          <button
            type="button"
            onClick={() => setMostrarCamaras((v) => !v)}
            className="juego-toggle-3d"
            title="Cámaras: ver el acordeón de cerca / distintos encuadres"
            style={{ left: 290, background: mostrarCamaras ? 'rgba(99,102,241,0.85)' : undefined }}
          >
            🎥 Cámara
          </button>
          {mostrarCamaras && (
            <div style={{ position: 'fixed', bottom: 58, left: 290, zIndex: 50, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 360 }}>
              <button
                type="button"
                onClick={() => setAutoCamara((v) => !v)}
                className="juego-toggle-3d"
                title="Cambiar de toma automáticamente"
                style={{ position: 'static', padding: '6px 12px', fontSize: 12, background: autoCamara ? 'rgba(16,185,129,0.9)' : undefined }}
              >
                {autoCamara ? '⏸ Auto' : '▶ Auto'}
              </button>
              {TOMAS_CAMARA.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setAutoCamara(false); aplicarToma(t); }}
                  className="juego-toggle-3d"
                  style={{ position: 'static', padding: '6px 12px', fontSize: 12, background: tomaActual === t.id ? 'rgba(99,102,241,0.9)' : undefined }}
                >
                  {t.icono} {t.nombre}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Escenario 3D del duelo: por defecto el que el usuario tiene guardado; selector para cambiarlo. */}
      {use3D && (
        <>
          <button
            type="button"
            onClick={() => setMostrarEscenarios((v) => !v)}
            className="juego-toggle-3d"
            title="Escenario 3D detrás de los acordeones"
            style={{ left: 430, background: mostrarEscenarios ? 'rgba(99,102,241,0.85)' : undefined }}
          >
            🌆 Escenario
          </button>
          {mostrarEscenarios && (
            <div style={{ position: 'fixed', bottom: 58, left: 430, zIndex: 50, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 360 }}>
              {[{ id: 'estudio', nombre: 'Estudio' }, { id: 'tarima', nombre: 'Tarima' }, { id: 'plaza', nombre: 'Plaza' }, { id: 'ninguno', nombre: 'Ninguno' }].map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setEscenarioDuelo(e.id)}
                  className="juego-toggle-3d"
                  style={{ position: 'static', padding: '6px 12px', fontSize: 12, background: escenarioDuelo === e.id ? 'rgba(99,102,241,0.9)' : undefined }}
                >
                  {e.nombre}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Panel de ajuste del encuadre 3D (temporal). Cuando demos con los valores, se ponen
          en ENC_FILL/ENC_OFFSET_REL_Y y se pone CONTROLES_3D = false. */}
      {use3D && CONTROLES_3D && (
        <div className="juego-controles-3d">
          <div className="juego-controles-3d-fila titulo">
            Botones → M: {Object.keys(posMaestroRef.current).length} · A: {Object.keys(posAlumnoRef.current).length}
          </div>
          <label className="juego-controles-3d-fila">
            <span>Tamaño: {fill3D.toFixed(2)}</span>
            <input type="range" min={0.3} max={2} step={0.01} value={fill3D} onChange={(e) => setFill3D(+e.target.value)} />
          </label>
          <label className="juego-controles-3d-fila">
            <span>Mover X: {offX3D.toFixed(2)}</span>
            <input type="range" min={-1.5} max={1.5} step={0.01} value={offX3D} onChange={(e) => setOffX3D(+e.target.value)} />
          </label>
          <label className="juego-controles-3d-fila">
            <span>Subir/Bajar: {offY3D.toFixed(2)}</span>
            <input type="range" min={-1} max={1} step={0.01} value={offY3D} onChange={(e) => setOffY3D(+e.target.value)} />
          </label>
        </div>
      )}

      {/* ── Escenario Maestro / Alumno (compartido) ── */}
      <div className="hero-escenario" style={use3D ? { gap: ENC_GAP } : undefined}>
        <div className="hero-acordeon-wrap maestro" ref={refMaestro} style={use3D ? { width: ENC_ANCHO_WRAP } : undefined}>
          <span className="hero-acordeon-label">Maestro</span>
          {use3D ? (
            /* Maestro: read-only (sin onTocarBoton); hundimiento driveado por botonesActivosMaestro. */
            <VisorAcordeon3D
              materialPorMesh={{}}
              piezaSeleccionada={null}
              onClickPieza={NOOP_CLICK_PIEZA}
              onMallasDetectadas={NOOP_MALLAS}
              fuelleCerrandoRef={fuelleDirMaestroRef}
              fuelleActividadRef={fuelleActMaestroRef}
              animShapeKey={null}
              animProgramatica={null}
              pulseEpoch={null}
              skin={SKIN_MAESTRO}
              camaraFija
              botonesActivosExternos={botonesMaestroLead}
              direccion={direccionMaestroLead}
              rotacionModelo={ENC_ROTACION}
              fillModelo={fill3D}
              offsetRelXModelo={offX3D}
              offsetRelYModelo={offY3D}
              invFilasModelo={ENC_INV_FILAS}
              invColsModelo={ENC_INV_COLS}
              navegable={navegar3D}
              escenarioId={escenarioDuelo}
              onPosicionesBotones={(m) => { posMaestroRef.current = m; }}
              className="acordeon-3d-juego"
            />
          ) : logica.disenoCargado ? (
            <CuerpoAcordeon
              imagenFondo={'/Acordeon Jugador.webp'}
              ajustes={ajustesDuelo}
              direccion={direccionMaestroLead}
              configTonalidad={configTonalidad}
              botonesActivos={botonesMaestroLead}
              modoAjuste={false}
              botonSeleccionado={null}
              modoVista={logica.modoVista}
              vistaDoble={false}
              setBotonSeleccionado={NOOP_SET_BOTON}
              actualizarBotonActivo={NOOP_ACTUALIZAR}
              listo={true}
            />
          ) : null}
        </div>
        <div
          className="hero-acordeon-wrap alumno"
          ref={refAlumno}
          onPointerMove={(e) => registrarPosicionGolpe(e.clientX, e.clientY)}
          style={use3D ? { width: ENC_ANCHO_WRAP } : undefined}
        >
          <span className="hero-acordeon-label">Alumno</span>
          {use3D ? (
            /* Alumno: tocable (clic/tap suena vía actualizarBotonActivo, el motor real). */
            <VisorAcordeon3D
              materialPorMesh={{}}
              piezaSeleccionada={null}
              onClickPieza={NOOP_CLICK_PIEZA}
              onMallasDetectadas={NOOP_MALLAS}
              fuelleCerrandoRef={fuelleDirAlumnoRef}
              fuelleActividadRef={fuelleActAlumnoRef}
              animShapeKey={null}
              animProgramatica={null}
              pulseEpoch={null}
              skin={skinAlumno}
              camaraFija
              botonesActivosExternos={logica.botonesActivos}
              direccion={logica.direccion}
              rotacionModelo={ENC_ROTACION}
              fillModelo={fill3D}
              offsetRelXModelo={offX3D}
              offsetRelYModelo={offY3D}
              invFilasModelo={ENC_INV_FILAS}
              invColsModelo={ENC_INV_COLS}
              navegable={navegar3D}
              escenarioId={escenarioDuelo}
              objetivosRef={objetivosRef}
              onTocarBoton={(id, accion) => actualizarBotonActivo(id, accion === 'down' ? 'add' : 'remove')}
              onPosicionesBotones={(m) => { posAlumnoRef.current = m; }}
              className="acordeon-3d-juego"
            />
          ) : logica.disenoCargado ? (
            <CuerpoAcordeon
              imagenFondo={imagenFondo}
              ajustes={ajustesDuelo}
              direccion={logica.direccion}
              configTonalidad={configTonalidad}
              botonesActivos={logica.botonesActivos}
              modoAjuste={false}
              botonSeleccionado={null}
              modoVista={logica.modoVista}
              vistaDoble={false}
              setBotonSeleccionado={NOOP_SET_BOTON}
              actualizarBotonActivo={actualizarBotonActivo}
              listo={true}
            />
          ) : null}
        </div>
      </div>

      <PuenteNotas
        cancion={cancion}
        tickActual={tickActual}
        obtenerPosicionMaestro={use3D ? obtenerPosMaestro3D : obtenerPosicionMaestro}
        obtenerPosicionAlumno={use3D ? obtenerPosAlumno3D : obtenerPosicionAlumno}
        modoVista={logica.modoVista}
        configTonalidad={configTonalidad}
        notasImpactadas={notasImpactadas}
        rangoSeccion={rangoSeccion}
      />

      <JuicioOverlay estadisticas={estadisticas} efectosVisuales={efectosVisuales} />
    </div>
  );
};

export default React.memo(ModoJuego);
