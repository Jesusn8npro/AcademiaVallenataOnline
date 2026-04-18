import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Play, Pause, RotateCcw, Clock, Save, Trash2,
  Plus, Layout, Activity, Zap, RefreshCw, MapPin
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
  onSecuenciaChange: (nuevaSecuencia: NotaHero[], duracionSegundos: number, secciones: any[]) => void;
  onNotasActuales?: (notas: NotaHero[]) => void;
  onBuscarTick?: (tick: number) => void;
  duracionAudioProp?: number;
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
  onSecuenciaChange,
  onNotasActuales,
  onBuscarTick,
  duracionAudioProp = 0
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
  const totalTicksModal = Math.max(
    secuenciaEditada.length > 0
      ? Math.max(...secuenciaEditada.map(n => n.tick + n.duracion))
      : 0,
    Math.round(duracionSegundosModal * (bpmModal / 60) * resolucion)
  );

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
        // Siempre usa la duración real del MP3 automáticamente
        setDuracionSegundosModal(dur);
        setDuracionGuardada(dur);
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
  useEffect(() => {
    if (!onNotasActuales) return;
    if (!reproduciendoModal) { onNotasActuales([]); return; }
    const notasActuales = secuenciaEditada.filter(
      n => tickModal >= n.tick && tickModal < (n.tick + n.duracion)
    );
    onNotasActuales(notasActuales);
  }, [tickModal, reproduciendoModal, secuenciaEditada, onNotasActuales]);

  // ─── Bucle de reproducción ───────────────────────────────────────────────
  useEffect(() => {
    if (!reproduciendoModal) return;

    const loop = (timestamp: number) => {
      if (ultimoTimestampRef.current === 0) ultimoTimestampRef.current = timestamp;
      const delta = timestamp - ultimoTimestampRef.current;
      ultimoTimestampRef.current = timestamp;

      const ticksPorMs = (bpmModal / 60) * resolucion / 1000;
      setTickModal(prev => {
        const next = prev + ticksPorMs * delta;
        // Para cuando se llega al final de la duración configurada
        if (next >= totalTicksModal) {
          setReproduciendoModal(false);
          return totalTicksModal;
        }
        return next;
      });

      if (audioRef.current) setTiempoAudioActual(audioRef.current.currentTime);
      rAFRef.current = requestAnimationFrame(loop);
    };

    ultimoTimestampRef.current = performance.now();
    rAFRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rAFRef.current);
      ultimoTimestampRef.current = 0;
    };
  }, [reproduciendoModal, bpmModal, totalTicksModal, resolucion]);

  // ─── Controles de reproducción ───────────────────────────────────────────
  const togglePlay = () => {
    if (!reproduciendoModal) {
      motorAudioPro.activarContexto();
      if (audioRef.current) {
        const startTime = (tickModal / resolucion) * (60 / bpmModal);
        audioRef.current.currentTime = startTime;
        audioRef.current.play().catch(console.error);
      }
      setReproduciendoModal(true);
    } else {
      if (audioRef.current) audioRef.current.pause();
      setReproduciendoModal(false);
    }
  };

  const handleSeek = useCallback((val: number) => {
    setTickModal(val);
    if (audioRef.current) {
      audioRef.current.currentTime = (val / resolucion) * (60 / bpmModal);
    }
    onBuscarTick?.(val);
  }, [resolucion, bpmModal, onBuscarTick]);

  const handleReset = useCallback(() => {
    setReproduciendoModal(false);
    setReproduciendoSeccion(false);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setTickModal(0);
    setSeccionCursorSeg(0);
    onBuscarTick?.(0);
  }, [onBuscarTick]);

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
    <div className="modal-editor-secuencia">
      {/* HEADER */}
      <div className="modal-editor-secuencia-header">
        <div>
          <div className="modal-editor-secuencia-kicker">Panel Edición Profesional</div>
          <h2>{cancion?.titulo || 'Editor'}</h2>
        </div>
        <button className="modal-editor-secuencia-btn-cerrar" onClick={onCerrar}>
          <X size={20} />
        </button>
      </div>

      <div className="modal-editor-secuencia-contenido">

        {/* ── TIMELINE & CONTROL ── */}
        <section className="modal-editor-secuencia-zona">
          <div className="modal-editor-secuencia-zona-titulo">
            <Activity size={16} /> Timeline &amp; Control
          </div>

          <div className="modal-editor-secuencia-reproductor-master">
            {/* Timeline visual con secciones coloreadas */}
            <div className="modal-editor-secuencia-timeline-visual">
              {/* Capas de secciones */}
              {secciones.map((s, i) => {
                const color = PALETA_SECCIONES[i % PALETA_SECCIONES.length];
                const leftPct = (s.tickInicio / totalTicksModal) * 100;
                const widthPct = ((s.tickFin - s.tickInicio) / totalTicksModal) * 100;
                return (
                  <div
                    key={i}
                    className="timeline-seccion-banda"
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(widthPct, 0.5)}%`,
                      background: color.bg,
                      borderLeft: `2px solid ${color.borde}`,
                    }}
                    title={`${s.nombre}: ${formatearTiempoDesdeTicks(s.tickInicio, bpmModal)} → ${formatearTiempoDesdeTicks(s.tickFin, bpmModal)}`}
                  >
                    {widthPct > 5 && (
                      <span className="timeline-seccion-label" style={{ color: color.texto }}>
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

              {/* Slider de posición */}
              <input
                type="range" min={0} max={totalTicksModal} value={tickModal}
                onChange={e => handleSeek(Number(e.target.value))}
                className="timeline-input"
              />
            </div>

            {/* Tiempos */}
            <div className="modal-editor-secuencia-tiempos-fila">
              <div className="time-block main">
                <span className="current">{formatearTiempoDesdeTicks(tickModal, bpmModal)}</span>
                <span className="sep">/</span>
                <span className="total">{formatearTiempoDesdeTicks(totalTicksModal, bpmModal)}</span>
              </div>
              {duracionAudio > 0 && (
                <div className="time-block sub">
                  🎵 MP3: {fmtSeg(tiempoAudioActual, true)} / {fmtSeg(duracionAudio)}
                </div>
              )}
            </div>

            {/* Controles */}
            <div className="modal-editor-secuencia-controles-reproduccion">
              <button onClick={handleReset} className="modal-editor-secuencia-btn-icon" title="Reiniciar">
                <RotateCcw size={18} />
              </button>
              <button
                onClick={togglePlay}
                className={`modal-editor-secuencia-btn-play-big ${reproduciendoModal ? 'active' : ''}`}
              >
                {reproduciendoModal ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
              </button>
              <div className="modal-editor-secuencia-control-bpm-mini">
                <Zap size={14} />
                <input
                  type="number" value={bpmModal}
                  onChange={e => setBpmModal(Number(e.target.value))}
                />
                <span>BPM</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── DURACIÓN del MP3: ya gestionada dentro del acordeon de secciones ── */}

        {/* ── SECCIONES (colapsable) ── */}
        <section className="modal-editor-secuencia-zona">

          {/* Header colapsable */}
          <button
            className="secciones-acordeon-header"
            onClick={() => setSeccionesAbiertas(v => !v)}
          >
            <div className="modal-editor-secuencia-zona-titulo" style={{ marginBottom: 0 }}>
              <Layout size={16} /> Estructura de Secciones
              {secciones.length > 0 && (
                <span className="secciones-count-badge">{secciones.length}</span>
              )}
            </div>
            <div className="secciones-acordeon-right">
              {secciones.length > 0 && seccionesAbiertas && (
                <button
                  onClick={e => { e.stopPropagation(); handleGuardarSecciones(); }}
                  disabled={guardandoSecciones}
                  className="secciones-btn-guardar-mini"
                >
                  {guardandoSecciones
                    ? <><RefreshCw size={12} className="spin" /> Guardando…</>
                    : <><Save size={12} /> Guardar</>
                  }
                </button>
              )}
              <span className="secciones-acordeon-chevron">
                {seccionesAbiertas ? '▲' : '▼'}
              </span>
            </div>
          </button>

          {/* Contenido colapsable */}
          {seccionesAbiertas && (
            <div className="secciones-acordeon-body">

              {/* ── Configuración de duración de uso ── */}
              <div className="dur-config-card">
                <div className="dur-config-header">
                  <Clock size={14} />
                  <span>Duración de uso</span>
                  {duracionAudio > 0 && (
                    <span className="dur-config-real">
                      MP3 real: {fmtSeg(duracionAudio)}
                    </span>
                  )}
                  {duracionCambiada && (
                    <span className="dur-config-badge">⚠ Sin guardar</span>
                  )}
                </div>

                {/* Valor actual grande */}
                <div className="dur-config-valor">{fmtSeg(duracionSegundosModal)}</div>

                {/* Slider limitado a la duración real del MP3 */}
                <input
                  type="range"
                  min={1}
                  max={duracionAudio || 600}
                  step={1}
                  value={duracionSegundosModal}
                  onChange={e => setDuracionSegundosModal(Number(e.target.value))}
                  className="dur-config-slider"
                />

                {/* Acciones */}
                <div className="dur-config-acciones">
                  {duracionAudio > 0 && duracionSegundosModal !== duracionAudio && (
                    <button
                      onClick={() => setDuracionSegundosModal(duracionAudio)}
                      className="dur-config-btn-sync"
                    >
                      ⚡ Usar duración completa ({fmtSeg(duracionAudio)})
                    </button>
                  )}
                  <button
                    onClick={handleGuardarDuracion}
                    disabled={!duracionCambiada || guardandoDuracion}
                    className={`dur-config-btn-guardar ${duracionCambiada ? 'activo' : ''}`}
                  >
                    {guardandoDuracion
                      ? <><RefreshCw size={12} className="spin" /> Guardando…</>
                      : <><Save size={12} /> Guardar duración</>
                    }
                  </button>
                </div>
              </div>

              {/* Lista de secciones existentes */}
              <div className="modal-editor-secuencia-lista">
                {secciones.length === 0 && (
                  <div className="modal-editor-secuencia-vacio">
                    Sin secciones aún. Añade la primera usando el formulario de abajo.
                  </div>
                )}
                {secciones.map((s, i) => {
                  const color = PALETA_SECCIONES[i % PALETA_SECCIONES.length];
                  return (
                    <div
                      key={i}
                      className="seccion-item-pro"
                      style={{ borderLeft: `3px solid ${color.borde}` }}
                    >
                      <div className="seccion-item-color-dot" style={{ background: color.borde }} />
                      <div className="modal-editor-secuencia-seccion-info">
                        <strong style={{ color: color.texto }}>{s.nombre}</strong>
                        <span>
                          {fmtSeg((s.tickInicio / resolucion) * (60 / bpmModal))} →{' '}
                          {fmtSeg((s.tickFin / resolucion) * (60 / bpmModal))}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSeek(s.tickInicio)}
                        className="seccion-btn-ir"
                        title="Ir al inicio de esta sección"
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                      <button
                        onClick={() => eliminarSeccion(i)}
                        className="modal-editor-secuencia-btn-chico"
                        title="Eliminar sección"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Formulario nueva sección */}
              <div className="nueva-seccion-form">
                <div className="nueva-seccion-form-titulo">
                  <Plus size={13} /> Nueva sección
                </div>

                {/* REPRODUCTOR de posición + controles */}
                <div className="seccion-pos-slider-wrap">

                  {/* Tiempos */}
                  <div className="seccion-pos-header">
                    <span className="seccion-cursor-valor">{fmtSeg(seccionCursorSeg, true)}</span>
                    <span className="seccion-cursor-label" style={{ marginLeft: 'auto' }}>
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
                    className="seccion-pos-slider"
                  />

                  {/* Controles de reproduccion */}
                  <div className="seccion-controles-repro">
                    <button
                      onClick={() => saltarSeccion(-10)}
                      className="seccion-ctrl-btn" title="-10 segundos"
                    >
                      ⏪ -10s
                    </button>
                    <button
                      onClick={togglePlaySeccion}
                      className={`seccion-ctrl-btn seccion-ctrl-play ${reproduciendoSeccion ? 'playing' : ''}`}
                    >
                      {reproduciendoSeccion
                        ? <Pause size={16} />
                        : <Play size={16} fill="currentColor" />
                      }
                    </button>
                    <button
                      onClick={stopSeccion}
                      className="seccion-ctrl-btn" title="Detener y volver al inicio"
                    >
                      ⏹
                    </button>
                    <button
                      onClick={() => saltarSeccion(10)}
                      className="seccion-ctrl-btn" title="+10 segundos"
                    >
                      +10s ⏩
                    </button>
                  </div>
                </div>

                <input
                  placeholder="Nombre de la sección (ej: Intro, Estrofa, Coro…)"
                  value={seccionNombre}
                  onChange={e => setSeccionNombre(e.target.value)}
                  className="nueva-seccion-input"
                />

                <div className="nueva-seccion-marcadores">
                  {/* Botón Inicio */}
                  <button
                    onClick={() => setSeccionTickInicio(
                      Math.round(seccionCursorSeg * (bpmModal / 60) * resolucion)
                    )}
                    className={`btn-marker btn-marker-inicio ${seccionTickInicio > 0 ? 'marcado' : ''}`}
                  >
                    📌 Marcar Inicio
                    <span className={`marker-tiempo ${seccionTickInicio > 0 ? 'activo' : ''}`}>
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
                    className={`btn-marker btn-marker-fin ${seccionTickFin > 0 ? 'marcado' : ''}`}
                  >
                    🏁 Marcar Fin
                    <span className={`marker-tiempo ${seccionTickFin > 0 ? 'activo' : ''}`}>
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
                  className="modal-editor-secuencia-btn-add-section"
                >
                  <Plus size={16} /> Agregar Sección
                </button>

                {seccionTickFin > 0 && seccionTickFin <= seccionTickInicio && (
                  <div className="nueva-seccion-error">
                    ⚠ El tiempo de fin debe ser mayor que el inicio.
                  </div>
                )}
              </div>

            </div>
          )}
        </section>

      </div>

      {/* FOOTER */}
      <div className="modal-editor-secuencia-footer">
        <button className="modal-editor-secuencia-btn-secundario" onClick={onCerrar}>
          Cancelar
        </button>
        <button className="modal-editor-secuencia-btn-primario" onClick={handleGuardar}>
          <Save size={16} /> Guardar Todo
        </button>
      </div>
    </div>
  );
};

export default ModalEditorSecuencia;
