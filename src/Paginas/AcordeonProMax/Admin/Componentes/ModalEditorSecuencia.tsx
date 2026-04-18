import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Play, Pause, RotateCcw, Clock, Save, Trash2,
  Plus, Layout, Activity, Zap, RefreshCw, MapPin, 
  Scissors, Volume2, Ear, Square, SkipBack, SkipForward
} from 'lucide-react';
import type { NotaHero } from '../../TiposProMax';
import { actualizarCancionHeroCompleta } from '../../../../servicios/cancionesHeroService';
import { motorAudioPro } from '../../../SimuladorDeAcordeon/AudioEnginePro';
import './ModalEditorSecuencia.css';

// ─── Paleta de colores para secciones ───────────────────────────────────────
const PALETA_SECCIONES = [
  { bg: 'rgba(59,130,246,0.45)', borde: '#3b82f6', texto: '#93c5fd' },  // Azul
  { bg: 'rgba(16,185,129,0.45)', borde: '#10b981', texto: '#6ee7b7' },  // Verde
  { bg: 'rgba(245,158,11,0.45)', borde: '#f59e0b', texto: '#fcd34d' },  // Ámbar
  { bg: 'rgba(239,68,68,0.45)', borde: '#ef4444', texto: '#fca5a5' },  // Rojo
  { bg: 'rgba(139,92,246,0.45)', borde: '#8b5cf6', texto: '#c4b5fd' },  // Violeta
  { bg: 'rgba(236,72,153,0.45)', borde: '#ec4899', texto: '#f9a8d4' },  // Rosa
  { bg: 'rgba(20,184,166,0.45)', borde: '#14b8a6', texto: '#99f6e4' },  // Teal
  { bg: 'rgba(251,146,60,0.45)', borde: '#fb923c', texto: '#fed7aa' },  // Naranja
];

interface Seccion {
  nombre: string;
  tickInicio: number;
  tickFin: number;
  tipo: 'melodia' | 'acompanamiento';
}

interface ModalEditorSecuenciaProps {
  cancion: any;
  onCerrar: () => void;
  tickActual: number;
  totalTicks: number;
  reproduciendoHero: boolean;
  onAlternarPausa: () => void;
  onDetener: () => void;
  onBuscarTick: (tick: number) => void;
  bpm: number;
  onCambiarBpm: (bpm: number) => void;
  grabando: boolean;
  tiempoGrabacionMs: number;
  cuentaAtrasPreRoll: number | null;
  onIniciarGrabacion: () => void;
  onDetenerGrabacion: () => void;
  punchInTick: number | null;
  setPunchInTick: (tick: number | null) => void;
  punchOutTick: number | null;
  setPunchOutTick: (tick: number | null) => void;
  notasGrabadas: NotaHero[];
  onNotasActuales?: (notas: NotaHero[]) => void;
  onSecuenciaChange: (secuencia: NotaHero[]) => void;
  duracionAudioProp: number;
  preRollSegundos: number;
  setPreRollSegundos: (s: number) => void;
  metronomoActivo: boolean;
  setMetronomoActivo: (v: boolean) => void;
  mensajeEdicionProp: string | null;
}

function formatearTiempoDesdeSegundos(s: number) {
  const m = Math.floor(s / 60);
  const seg = Math.floor(s % 60);
  return `${m}:${seg.toString().padStart(2, '0')}`;
}

function formatearTiempoDesdeTicks(ticks: number, bpm: number) {
  const seg = (ticks / 192) * (60 / Math.max(1, bpm));
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  const d = Math.floor((seg % 1) * 10);
  return `${m}:${s.toString().padStart(2, '0')}.${d}`;
}

/** Formatea segundos como M:SS con decimales opcionales */
function fmtSeg(s: number, conDecimas = false) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const dec = Math.floor((s % 1) * 10);
  return conDecimas
    ? `${m}:${sec.toString().padStart(2, '0')}.${dec}`
    : `${m}:${sec.toString().padStart(2, '0')}`;
}

const ModalEditorSecuencia: React.FC<ModalEditorSecuenciaProps> = ({
  cancion,
  onCerrar,
  tickActual,
  totalTicks,
  reproduciendoHero,
  onAlternarPausa,
  onDetener,
  onBuscarTick,
  bpm,
  onCambiarBpm,
  grabando,
  tiempoGrabacionMs,
  cuentaAtrasPreRoll,
  onIniciarGrabacion,
  onDetenerGrabacion,
  punchInTick,
  setPunchInTick,
  punchOutTick,
  setPunchOutTick,
  notasGrabadas,
  onNotasActuales,
  onSecuenciaChange,
  duracionAudioProp,
  preRollSegundos,
  setPreRollSegundos,
  metronomoActivo,
  setMetronomoActivo,
  mensajeEdicionProp
}) => {
  const [tickModal, setTickModal] = useState(0);
  const [reproduciendoModal, setReproduciendoModal] = useState(false);
  const [bpmModal, setBpmModal] = useState(cancion?.bpm || 120);

  // Duración: valor actual vs valor guardado (para detectar cambios)
  const [duracionSegundosModal, setDuracionSegundosModal] = useState<number>(cancion?.duracion_segundos || 30);
  const [duracionGuardada, setDuracionGuardada] = useState<number>(cancion?.duracion_segundos || 30);
  const [guardandoDuracion, setGuardandoDuracion] = useState(false);

  const [secuenciaEditada, setSecuenciaEditada] = useState<NotaHero[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [duracionAudio, setDuracionAudio] = useState(duracionAudioProp);
  const [tiempoAudioActual, setTiempoAudioActual] = useState(0);

  // Formulario de nueva sección
  const [seccionNombre, setSeccionNombre] = useState('');
  const [seccionTickInicio, setSeccionTickInicio] = useState(0);
  const [seccionTickFin, setSeccionTickFin] = useState(0);
  // Slider propio de la sección (segundos, 0..duracionAudio)
  const [seccionCursorSeg, setSeccionCursorSeg] = useState(0);

  // Panel secciones colapsable — cerrado por defecto
  const [seccionesAbiertas, setSeccionesAbiertas] = useState(false);
  // Reproducción independiente dentro del panel de secciones
  const [reproduciendoSeccion, setReproduciendoSeccion] = useState(false);

  // Guardado de secciones
  const [guardandoSecciones, setGuardandoSecciones] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rAFRef = useRef<number>(0);
  const ultimoTimestampRef = useRef<number>(0);
  const rAFSeccionRef = useRef<number>(0);   // loop exclusivo del panel secciones
  const resolucion = cancion?.resolucion || 192;

  // totalTicks = el mayor entre las notas Y la duración configurada (en ticks)
  const ticksDeDuracion = Math.round(duracionSegundosModal * (bpmModal / 60) * resolucion);
  const ultimoTickNotas = secuenciaEditada.length > 0
    ? Math.max(...secuenciaEditada.map(n => n.tick + n.duracion))
    : 0;

  // La duración programada manda sobre el timeline. 
  const totalTicksModal = ticksDeDuracion > 0 ? ticksDeDuracion : Math.max(resolucion * 4, ultimoTickNotas);

  const duracionCambiada = Math.abs(duracionSegundosModal - duracionGuardada) > 0.05;

  // ─── Inicializar datos ────────────────────────────────────────────────────
  useEffect(() => {
    if (!cancion) return;

    let sec = cancion.secuencia_json || cancion.secuencia || [];
    if (typeof sec === 'string') try { sec = JSON.parse(sec); } catch { sec = []; }
    setSecuenciaEditada(Array.isArray(sec) ? [...sec] : []);

    let secs = cancion.secciones || [];
    if (typeof secs === 'string') try { secs = JSON.parse(secs); } catch { secs = []; }
    setSecciones(Array.isArray(secs) ? [...secs] : []);

    const dur = cancion.duracion_segundos || 30;
    setBpmModal(cancion.bpm || 120);
    setDuracionSegundosModal(dur);
    setDuracionGuardada(dur);
  }, [cancion]);

  // ─── Cargar Audio ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (cancion?.audio_fondo_url && !audioRef.current) {
      const audio = new Audio(cancion.audio_fondo_url);
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
      audio.onloadedmetadata = () => {
        const dur = audio.duration;
        setDuracionAudio(dur);
        // Si la canción no tiene duración guardada o es inválida (> real), sugerimos la real
        if (!cancion.duracion_segundos || cancion.duracion_segundos > dur) {
          setDuracionSegundosModal(dur);
        }
      };
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [cancion?.audio_fondo_url]);

  // ─── Sincronizar notas con el acordeón ───────────────────────────────────
  // ─── Sincronización con el estudio ───
  useEffect(() => {
    setTickModal(tickActual);
  }, [tickActual]);

  useEffect(() => {
    setReproduciendoModal(reproduciendoHero);
  }, [reproduciendoHero]);

  useEffect(() => {
    setBpmModal(bpm);
  }, [bpm]);

  useEffect(() => {
    if (!onNotasActuales) return;
    if (!reproduciendoModal) { onNotasActuales([]); return; }
    const notasActuales = secuenciaEditada.filter(
      n => tickModal >= n.tick && tickModal < (n.tick + n.duracion)
    );
    onNotasActuales(notasActuales);
  }, [tickModal, reproduciendoModal, secuenciaEditada, onNotasActuales]);

  // ─── Bucle de audio local (solo para streaming del audioRef) ───
  useEffect(() => {
    if (!reproduciendoModal) return;
    const updateAudio = () => {
      if (audioRef.current) setTiempoAudioActual(audioRef.current.currentTime);
      rAFRef.current = requestAnimationFrame(updateAudio);
    };
    rAFRef.current = requestAnimationFrame(updateAudio);
    return () => cancelAnimationFrame(rAFRef.current);
  }, [reproduciendoModal]);

  // ─── Controles de reproducción ───────────────────────────────────────────
  const togglePlay = () => {
    onAlternarPausa();
  };

  const handleSeek = (val: number) => {
    onBuscarTick(val);
  };

  const handleReset = () => {
    onDetener();
  };

  const saltarSegundos = (seg: number) => {
    const ticksSaltar = Math.round(seg * (bpmModal / 60) * resolucion);
    const nuevoTick = Math.max(0, Math.min(totalTicksModal, tickModal + ticksSaltar));
    onBuscarTick(nuevoTick);
  };

  // ─── Loop reproduccion del panel Secciones ───────────────────────────────────────
  useEffect(() => {
    if (!reproduciendoSeccion) {
      cancelAnimationFrame(rAFSeccionRef.current);
      return;
    }
    const loop = () => {
      if (audioRef.current) {
        const t = audioRef.current.currentTime;
        setSeccionCursorSeg(t);
        if (t >= (duracionAudio || duracionSegundosModal)) {
          setReproduciendoSeccion(false);
          return;
        }
      }
      rAFSeccionRef.current = requestAnimationFrame(loop);
    };
    rAFSeccionRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rAFSeccionRef.current);
  }, [reproduciendoSeccion, duracionAudio, duracionSegundosModal]);

  // Controles exclusivos del panel Secciones
  const togglePlaySeccion = useCallback(() => {
    if (!audioRef.current) return;
    if (reproduciendoSeccion) {
      audioRef.current.pause();
      setReproduciendoSeccion(false);
      // Pausa también el modal principal si estuviese corriendo
      setReproduciendoModal(false);
    } else {
      // Detiene el timeline principal si estuviese corrriendo
      setReproduciendoModal(false);
      cancelAnimationFrame(rAFRef.current);
      motorAudioPro.activarContexto();
      audioRef.current.currentTime = seccionCursorSeg;
      audioRef.current.play().catch(console.error);
      setReproduciendoSeccion(true);
    }
  }, [reproduciendoSeccion, seccionCursorSeg]);

  const stopSeccion = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setReproduciendoSeccion(false);
    setSeccionCursorSeg(0);
  }, []);

  const saltarSeccion = useCallback((delta: number) => {
    if (!audioRef.current) return;
    const nuevo = Math.max(0, Math.min(
      (duracionAudio || duracionSegundosModal),
      (audioRef.current.currentTime || seccionCursorSeg) + delta
    ));
    audioRef.current.currentTime = nuevo;
    setSeccionCursorSeg(nuevo);
  }, [duracionAudio, duracionSegundosModal, seccionCursorSeg]);

  // ─── Guardar solo la duración ─────────────────────────────────────────────
  const handleGuardarDuracion = useCallback(async () => {
    if (!cancion?.id) return;
    setGuardandoDuracion(true);
    try {
      await actualizarCancionHeroCompleta(cancion.id, {
        duracion_segundos: duracionSegundosModal,
      });
      setDuracionGuardada(duracionSegundosModal);
    } catch (e: any) {
      alert('❌ Error al guardar duración: ' + e.message);
    } finally {
      setGuardandoDuracion(false);
    }
  }, [cancion?.id, duracionSegundosModal]);

  // ─── Guardar secciones ────────────────────────────────────────────────────
  const handleGuardarSecciones = useCallback(async () => {
    if (!cancion?.id) return;
    setGuardandoSecciones(true);
    try {
      await actualizarCancionHeroCompleta(cancion.id, { secciones });
      alert('✅ Secciones guardadas');
    } catch (e: any) {
      alert('❌ Error al guardar secciones: ' + e.message);
    } finally {
      setGuardandoSecciones(false);
    }
  }, [cancion?.id, secciones]);

  // ─── Guardar todo ─────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    try {
      await actualizarCancionHeroCompleta(cancion.id, {
        secuencia_json: secuenciaEditada,
        secciones,
        duracion_segundos: duracionSegundosModal,
      });
      setDuracionGuardada(duracionSegundosModal);
      alert('✅ Cambios guardados correctamente');
      onCerrar();
    } catch (e: any) {
      alert('❌ Error al guardar: ' + e.message);
    }
  };

  // ─── Agregar sección ──────────────────────────────────────────────────────
  const agregarSeccion = () => {
    if (!seccionNombre.trim()) return;
    setSecciones(prev => [...prev, {
      nombre: seccionNombre.trim(),
      tickInicio: seccionTickInicio,
      tickFin: seccionTickFin,
      tipo: 'melodia',
    }]);
    setSeccionNombre('');
    setSeccionTickInicio(0);
    setSeccionTickFin(0);
  };

  const eliminarSeccion = (i: number) =>
    setSecciones(prev => prev.filter((_, idx) => idx !== i));

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="editor-secuencia-modal">
      {/* HEADER */}
      <div className="editor-cabecera">
        <div>
          <div className="editor-subtitulo">Panel Edición Profesional</div>
          <h2>{cancion?.titulo || 'Editor'}</h2>
        </div>
        <button className="editor-boton-cerrar" onClick={onCerrar}>
          <X size={20} />
        </button>
      </div>

      <div className="editor-cuerpo">

        {/* ── TIMELINE & CONTROL ── */}
        <section className="editor-seccion">
          <div className="editor-seccion-titulo">
            <Activity size={16} /> Timeline &amp; Control
          </div>

          <div className="editor-reproductor-principal">
            {/* Timeline visual con secciones coloreadas */}
            <div className="editor-timeline-visual">
              {/* Capas de secciones */}
              {secciones.map((s, i) => {
                const color = PALETA_SECCIONES[i % PALETA_SECCIONES.length];
                const leftPct = (s.tickInicio / totalTicksModal) * 100;
                const widthPct = ((s.tickFin - s.tickInicio) / totalTicksModal) * 100;
                return (
                  <div
                    key={i}
                    className="timeline-banda-seccion"
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(widthPct, 0.5)}%`,
                      background: color.bg,
                      borderLeft: `2px solid ${color.borde}`,
                    }}
                    title={`${s.nombre}: ${formatearTiempoDesdeTicks(s.tickInicio, bpmModal)} → ${formatearTiempoDesdeTicks(s.tickFin, bpmModal)}`}
                  >
                    {widthPct > 5 && (
                      <span className="timeline-etiqueta-seccion" style={{ color: color.texto }}>
                        {s.nombre}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Progreso de notas (zona de secuencia) */}
              {secuenciaEditada.length > 0 && (() => {
                const finNotas = Math.max(...secuenciaEditada.map(n => n.tick + n.duracion));
                return (
                  <div
                    className="timeline-zona-notas"
                    style={{ width: `${(finNotas / totalTicksModal) * 100}%` }}
                    title="Zona cubierta por la secuencia"
                  />
                );
              })()}

              {/* Marcadores de Punch */}
              {punchInTick !== null && (
                <div 
                  className="timeline-punto-punch"
                  style={{ left: `${(punchInTick / totalTicksModal) * 100}%` }}
                />
              )}
              {punchOutTick !== null && (
                <div 
                  className="timeline-punto-punch out"
                  style={{ left: `${(punchOutTick / totalTicksModal) * 100}%` }}
                />
              )}

              {/* Slider de posición */}
              <input
                type="range" min={0} max={totalTicksModal} value={tickModal}
                onChange={e => handleSeek(Number(e.target.value))}
                className="timeline-control-seek"
              />
            </div>

            {/* Tiempos */}
            <div className="editor-tiempos-fila">
              <div className="bloque-tiempo principal">
                <span className="actual">{formatearTiempoDesdeTicks(tickModal, bpmModal)}</span>
                <span className="sep">/</span>
                <span className="total">{formatearTiempoDesdeTicks(totalTicksModal, bpmModal)}</span>
              </div>
              {duracionAudio > 0 && (
                <div className="bloque-tiempo secundario">
                  🎵 MP3: {fmtSeg(tiempoAudioActual, true)} / {fmtSeg(duracionAudio)}
                </div>
              )}
            </div>

            {/* Controles */}
            <div className="editor-controles-reproduccion">
              <button onClick={handleReset} className="editor-boton-icono" title="Al inicio">
                <RotateCcw size={18} />
              </button>
              
              <button 
                onClick={() => saltarSegundos(-10)} 
                className="editor-boton-icono" 
                title="Atrás 10s"
              >
                <SkipBack size={20} />
              </button>

              <button
                onClick={togglePlay}
                className={`editor-boton-play-grande ${reproduciendoModal ? 'activo' : ''}`}
              >
                {reproduciendoModal ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
              </button>

              <button 
                onClick={() => saltarSegundos(10)} 
                className="editor-boton-icono" 
                title="Adelante 10s"
              >
                <SkipForward size={20} />
              </button>

              <div className="editor-control-bpm-mini">
                <Zap size={14} />
                <input
                  type="number" value={bpmModal}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setBpmModal(v);
                    onCambiarBpm(v);
                  }}
                />
                <span>BPM</span>
              </div>
            </div>
          </div>
        </section>
        {/* ── EDICIÓN QUIRÚRGICA (PUNCH-IN) ── */}
        <section className="editor-seccion seccion-edicion-quirurgica">
          <div className="editor-seccion-titulo">
            <Scissors size={16} /> Edición Quirúrgica de Notas
          </div>

          <div className="edicion-quirurgica-card">
            <div className="edicion-quirurgica-info">
              <div className="tecnica-ajuste-texto">
                <span className="tecnica-ajuste-nombre">Grabación Programada</span>
                <p className="tecnica-ajuste-ayuda">Reemplaza una parte de la secuencia con una toma nueva.</p>
              </div>

              {grabando ? (
                <div className="edicion-status-badge grabando">
                  <Activity size={14} /> GRABANDO...
                </div>
              ) : cuentaAtrasPreRoll !== null ? (
                <div className="edicion-status-badge espera">
                  <Clock size={14} /> PRE-ROLL: {cuentaAtrasPreRoll}s
                </div>
              ) : (
                <div className="edicion-status-badge">
                  LISTO
                </div>
              )}
            </div>

            <div className="edicion-controles-punch">
              {/* Selector de Punto de Entrada */}
              <button 
                className={`btn-punch-config ${punchInTick !== null ? 'activo' : ''}`}
                onClick={() => setPunchInTick(tickModal)}
                title="Marca el inicio de la grabación"
              >
                <strong>Entrada In</strong>
                <span>{punchInTick !== null ? formatearTiempoDesdeTicks(punchInTick, bpmModal) : 'Sin marcar'}</span>
              </button>

              {/* Selector de Punto de Salida */}
              <button 
                className={`btn-punch-config out ${punchOutTick !== null ? 'activo' : ''}`}
                onClick={() => setPunchOutTick(tickModal)}
                title="Opcional: Marca el final automático"
              >
                <strong>Salida Out</strong>
                <span>{punchOutTick !== null ? formatearTiempoDesdeTicks(punchOutTick, bpmModal) : 'Libre'}</span>
              </button>

              <button 
                className={`btn-punch-config ${metronomoActivo ? 'activo' : ''}`}
                onClick={() => setMetronomoActivo(!metronomoActivo)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>Metrónomo</strong>
                  {metronomoActivo ? <Volume2 size={14} /> : <Ear size={14} />}
                </div>
                <span>{metronomoActivo ? 'OK' : 'OFF'}</span>
              </button>
            </div>

            {/* Fila intermedia: Escuchar lo grabado */}
            {punchInTick !== null && !grabando && cuentaAtrasPreRoll === null && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button 
                  className="btn-punch-config"
                  style={{ flex: 1, background: 'rgba(59, 130, 246, 0.2)', borderColor: '#3b82f6' }}
                  onClick={() => {
                    onBuscarTick(Math.max(0, punchInTick - (bpmModal / 60) * resolucion * 2)); // 2s antes
                    setTimeout(() => onAlternarPausa(), 100);
                  }}
                >
                  <Play size={14} fill="currentColor" /> Escuchar Toma
                </button>
                {(punchInTick !== null || punchOutTick !== null) && (
                  <button 
                    className="btn-punch-config"
                    style={{ width: '40px' }}
                    onClick={() => { setPunchInTick(null); setPunchOutTick(null); }}
                    title="Limpiar marcas"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Ajuste de Pre-Roll */}
            <div className="punch-metropoli">
              <div className="punch-metropoli-head">
                <span>Preparación (Pre-roll)</span>
                <span>{preRollSegundos} seg</span>
              </div>
              <input 
                type="range" min={1} max={8} step={1} 
                value={preRollSegundos}
                onChange={(e) => setPreRollSegundos(Number(e.target.value))}
                className="tecnica-slider"
                disabled={grabando || cuentaAtrasPreRoll !== null}
              />
            </div>

            {/* BOTÓN PRINCIPAL DE ACCIÓN */}
            {!grabando && cuentaAtrasPreRoll === null ? (
              <button 
                className="btn-iniciar-edicion-pro"
                onClick={onIniciarGrabacion}
                disabled={punchInTick === null}
              >
                <Play size={18} fill="currentColor" /> Iniciar Edición Programada
              </button>
            ) : (
              <button 
                className="btn-iniciar-edicion-pro detener"
                onClick={onDetenerGrabacion}
              >
                <Square size={18} fill="currentColor" /> Detener Grabación
              </button>
            )}

            {mensajeEdicionProp && (
              <div className="formulario-error-msj" style={{ margin: 0, padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                💡 {mensajeEdicionProp}
              </div>
            )}
          </div>
        </section>

        {/* ── DURACIÓN del MP3: ya gestionada dentro del acordeon de secciones ── */}

        {/* ── SECCIONES (colapsable) ── */}
        <section className="editor-seccion">

          {/* Header colapsable */}
          <button
            className="secciones-cabecera-acordeon"
            onClick={() => setSeccionesAbiertas(v => !v)}
          >
            <div className="editor-seccion-titulo" style={{ marginBottom: 0 }}>
              <Layout size={16} /> Estructura de Secciones
              {secciones.length > 0 && (
                <span className="secciones-contador-badge">{secciones.length}</span>
              )}
            </div>
            <div className="secciones-cabecera-derecha">
              {secciones.length > 0 && seccionesAbiertas && (
                <button
                  onClick={e => { e.stopPropagation(); handleGuardarSecciones(); }}
                  disabled={guardandoSecciones}
                  className="secciones-boton-guardar-mini"
                >
                  {guardandoSecciones
                    ? <><RefreshCw size={12} className="spin" /> Guardando…</>
                    : <><Save size={12} /> Guardar</>
                  }
                </button>
              )}
              <span className="secciones-acordeon-icono">
                {seccionesAbiertas ? '▲' : '▼'}
              </span>
            </div>
          </button>

          {/* Contenido colapsable */}
          {seccionesAbiertas && (
            <div className="secciones-cuerpo-acordeon">

              {/* Lista de secciones existentes */}
              <div className="editor-lista-secciones">
                {secciones.length === 0 && (
                  <div className="editor-vacio-notificacion">
                    Sin secciones aún. Añade la primera usando el formulario de abajo.
                  </div>
                )}
                {secciones.map((s, i) => {
                  const color = PALETA_SECCIONES[i % PALETA_SECCIONES.length];
                  return (
                    <div
                      key={i}
                      className="seccion-fila-pro"
                      style={{ borderLeft: `3px solid ${color.borde}` }}
                    >
                      <div className="seccion-punto-color" style={{ background: color.borde }} />
                      <div className="seccion-info-texto">
                        <strong style={{ color: color.texto }}>{s.nombre}</strong>
                        <span>
                          {fmtSeg((s.tickInicio / resolucion) * (60 / bpmModal))} →{' '}
                          {fmtSeg((s.tickFin / resolucion) * (60 / bpmModal))}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSeek(s.tickInicio)}
                        className="seccion-boton-ir"
                        title="Ir al inicio de esta sección"
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                      <button
                        onClick={() => eliminarSeccion(i)}
                        className="seccion-boton-eliminar"
                        title="Eliminar sección"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Formulario nueva sección */}
              <div className="formulario-nueva-seccion">
                <div className="formulario-titulo">
                  <Plus size={13} /> Nueva sección
                </div>

                {/* REPRODUCTOR de posición + controles */}
                <div className="formulario-posicion-contenedor">

                  {/* Tiempos */}
                  <div className="formulario-posicion-cabecera">
                    <span className="formulario-cursor-valor">{fmtSeg(seccionCursorSeg, true)}</span>
                    <span className="formulario-cursor-etiqueta" style={{ marginLeft: 'auto' }}>
                      / {fmtSeg(duracionAudio || duracionSegundosModal)}
                    </span>
                  </div>

                  {/* Barra de posición (arrastrrable + actualizada en tiempo real) */}
                  <input
                    type="range"
                    min={0}
                    max={duracionAudio || duracionSegundosModal || 300}
                    step={0.1}
                    value={seccionCursorSeg}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setSeccionCursorSeg(v);
                      if (audioRef.current) audioRef.current.currentTime = v;
                    }}
                    className="formulario-posicion-slider"
                  />

                  {/* Controles de reproduccion */}
                  <div className="formulario-controles-audio">
                    <button
                      onClick={() => saltarSeccion(-10)}
                      className="formulario-boton-control" title="-10 segundos"
                    >
                      ⏪ -10s
                    </button>
                    <button
                      onClick={togglePlaySeccion}
                      className={`formulario-boton-control formulario-boton-play ${reproduciendoSeccion ? 'playing' : ''}`}
                    >
                      {reproduciendoSeccion
                        ? <Pause size={16} />
                        : <Play size={16} fill="currentColor" />
                      }
                    </button>
                    <button
                      onClick={stopSeccion}
                      className="formulario-boton-control" title="Detener y volver al inicio"
                    >
                      ⏹
                    </button>
                    <button
                      onClick={() => saltarSeccion(10)}
                      className="formulario-boton-control" title="+10 segundos"
                    >
                      +10s ⏩
                    </button>
                  </div>
                </div>

                <input
                  placeholder="Nombre de la sección (ej: Intro, Estrofa, Coro…)"
                  value={seccionNombre}
                  onChange={e => setSeccionNombre(e.target.value)}
                  className="formulario-input-nombre"
                />

                <div className="formulario-botones-marcadores">
                  {/* Botón Inicio */}
                  <button
                    onClick={() => setSeccionTickInicio(
                      Math.round(seccionCursorSeg * (bpmModal / 60) * resolucion)
                    )}
                    className={`boton-marcador ${seccionTickInicio > 0 ? 'marcado' : ''}`}
                  >
                    📌 Marcar Inicio
                    <span className={`marcador-tiempo-v ${seccionTickInicio > 0 ? 'activo' : ''}`}>
                      {seccionTickInicio > 0
                        ? fmtSeg((seccionTickInicio / resolucion) * (60 / bpmModal))
                        : '--:--'
                      }
                    </span>
                  </button>

                  {/* Botón Fin */}
                  <button
                    onClick={() => setSeccionTickFin(
                      Math.round(seccionCursorSeg * (bpmModal / 60) * resolucion)
                    )}
                    className={`boton-marcador ${seccionTickFin > 0 ? 'marcado' : ''}`}
                  >
                    🏁 Marcar Fin
                    <span className={`marcador-tiempo-v ${seccionTickFin > 0 ? 'activo' : ''}`}>
                      {seccionTickFin > 0
                        ? fmtSeg((seccionTickFin / resolucion) * (60 / bpmModal))
                        : '--:--'
                      }
                    </span>
                  </button>
                </div>

                <button
                  onClick={agregarSeccion}
                  disabled={!seccionNombre.trim() || seccionTickFin <= seccionTickInicio}
                  className="formulario-boton-agregar"
                >
                  <Plus size={16} /> Agregar Sección
                </button>

                {seccionTickFin > 0 && seccionTickFin <= seccionTickInicio && (
                  <div className="formulario-error-msj">
                    ⚠ El tiempo de fin debe ser mayor que el inicio.
                  </div>
                )}
              </div>

            </div>
          )}
        </section>

        {/* ── SECCIÓN: CONFIGURACIÓN MP3 (NUEVA) ── */}
        <section className="editor-seccion seccion-tecnica-mp3">
          <div className="editor-seccion-titulo">
             <Activity size={16} /> Configuración Técnica MP3
          </div>

          <div className="tecnica-tarjeta">
            <div className="tecnica-info-superior">
              <div className="tecnica-info-col">
                <span className="tecnica-etiqueta-mini">Duración Actual (Base Datos)</span>
                <span className="tecnica-valor-db">{fmtSeg(duracionGuardada)}</span>
              </div>
              <div className="tecnica-info-col">
                <span className="tecnica-etiqueta-mini">Longitud Real Archivo MP3</span>
                <span className="tecnica-valor-real">{duracionAudio > 0 ? fmtSeg(duracionAudio) : 'Cargando...'}</span>
              </div>
            </div>

            <div className="tecnica-ajuste-contenedor">
              <div className="tecnica-ajuste-cabecera">
                <Clock size={18} className="icon-main" />
                <div className="tecnica-ajuste-texto">
                  <span className="tecnica-ajuste-nombre">Duración Programada</span>
                  <p className="tecnica-ajuste-ayuda">Define cuánto tiempo se reproducirá el audio en el simulador.</p>
                </div>
                {duracionCambiada && (
                  <span className="tecnica-badge-alerta pulso">⚠ Cambios Pendientes</span>
                )}
              </div>

              <div className="tecnica-valor-central">
                {fmtSeg(duracionSegundosModal, true)} 
                <span className="unidad-segundos">seg</span>
              </div>

              <input
                type="range"
                min={1}
                max={duracionAudio > 0 ? duracionAudio : 600}
                step={0.1}
                value={duracionSegundosModal}
                onChange={e => setDuracionSegundosModal(Number(e.target.value))}
                className="tecnica-slider"
              />

              <div className="tecnica-acciones-finales">
                <button
                  onClick={() => setDuracionSegundosModal(duracionAudio)}
                  disabled={!duracionAudio || Math.abs(duracionSegundosModal - duracionAudio) < 0.2}
                  className="tecnica-boton-sincronizar"
                  title="Ajustar exactamente a la duración completa del archivo MP3"
                >
                  <RefreshCw size={14} /> Usar MP3 Completo
                </button>

                <button
                  onClick={handleGuardarDuracion}
                  disabled={!duracionCambiada || guardandoDuracion}
                  className={`tecnica-boton-guardar ${duracionCambiada ? 'activo' : ''}`}
                >
                  {guardandoDuracion
                    ? <><RefreshCw size={14} className="spin" /> Guardando...</>
                    : <><Save size={14} /> Guardar Duración</>
                  }
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <div className="editor-pie">
        <button className="editor-boton-secundario" onClick={onCerrar}>
          Cancelar
        </button>
        <button className="editor-boton-primario" onClick={handleGuardar}>
          <Save size={16} /> Guardar Todo
        </button>
      </div>
    </div>
  );
};

export default ModalEditorSecuencia;
