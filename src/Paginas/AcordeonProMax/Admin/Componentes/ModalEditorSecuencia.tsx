import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Edit2,
  Save,
  MapPin,
  Clock,
} from 'lucide-react';
import { actualizarCancionHeroCompleta } from '../../../../servicios/cancionesHeroService';
import type { NotaHero } from '../../SimuladorDeAcordeon/videojuego_acordeon/tipos_Hero';
import './ModalEditorSecuencia.css';

interface Seccion {
  nombre: string;
  tickInicio: number;
  tickFin: number;
  tipo: 'melodia' | 'acompanamiento';
}

interface ModalEditorSecuenciaProps {
  cancion: any | null;
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
  notasGrabadas: NotaHero[];
  onNotasActuales?: (notas: NotaHero[]) => void;
}

function formatearTiempoDesdeMs(ms: number) {
  const segundosTotales = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

function formatearTiempoDesdeTicks(ticks: number, bpm: number) {
  const segundosTotales = Math.max(0, Math.floor((ticks / 192) * (60 / Math.max(1, bpm))));
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
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
  notasGrabadas,
  onNotasActuales,
}) => {
  // ===== REPRODUCTOR INDEPENDIENTE DEL MODAL CON AUDIO DIRECTO =====
  const [tickModal, setTickModal] = useState(0);
  const [reproduciendoModal, setReproduciendoModal] = useState(false);
  const [pausadoModal, setPausadoModal] = useState(false);
  const [bpmModal, setBpmModal] = useState(120);

  // Referencias para el audio del modal
  const audioModalRef = useRef<HTMLAudioElement | null>(null);
  const rAFRef = useRef<number>(0);
  const ultimoTimestampRef = useRef<number>(0);
  const tickAnteriorRef = useRef(0);
  const bpmOriginalModalRef = useRef(120);

  // Estados internos del modal
  const [secuenciaEditada, setSecuenciaEditada] = useState<NotaHero[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [duracionSegundos, setDuracionSegundos] = useState<number | null>(null);
  const [historialEdiciones, setHistorialEdiciones] = useState<any[]>([]);
  const [punchOutTick, setPunchOutTick] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tiempoAudioActual, setTiempoAudioActual] = useState(0);
  const [duracionAudio, setDuracionAudio] = useState(0);

  // Estados para agregar nueva sección
  const [nuevoaNombreSec, setNuevoaNombreSec] = useState('');
  const [nuevoaTipoSec, setNuevoaTipoSec] = useState<'melodia' | 'acompanamiento'>('melodia');
  const [seccionTickInicio, setSeccionTickInicio] = useState<number | null>(null);
  const [seccionTickFin, setSeccionTickFin] = useState<number | null>(null);

  // Estados para editar nombre de sección
  const [seccionEditandoId, setSeccionEditandoId] = useState<number | null>(null);
  const [seccionEditandoNombre, setSeccionEditandoNombre] = useState('');

  // Guardar estado original para cancelar
  const cancionOriginalRef = useRef(cancion);

  // ===== CALCULAR TOTAL TICKS DEL MODAL =====
  const resolucion = cancion?.resolucion || 192;
  const totalTicksModal = secuenciaEditada.length > 0
    ? Math.max(...secuenciaEditada.map((n) => n.tick + n.duracion))
    : duracionSegundos ? Math.round(duracionSegundos * (bpmModal / 60) * resolucion) : 0;

  // ===== CREAR ELEMENTO DE AUDIO AL ABRIR MODAL =====
  useEffect(() => {
    if (cancion && !audioModalRef.current) {
      const audio = new Audio(cancion.audio_fondo_url);
      audio.crossOrigin = 'anonymous';
      audio.volume = 0.8;
      audioModalRef.current = audio;
    }

    return () => {
      if (audioModalRef.current) {
        audioModalRef.current.pause();
        audioModalRef.current.src = '';
        audioModalRef.current = null;
      }
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    };
  }, [cancion?.id]);

  // ===== ACTUALIZAR TIEMPO DE AUDIO PARA SLIDER =====
  useEffect(() => {
    if (!reproduciendoModal || !audioModalRef.current) return;

    const updateAudioTime = () => {
      if (audioModalRef.current) {
        setTiempoAudioActual(audioModalRef.current.currentTime);
        if (audioModalRef.current.duration && !isNaN(audioModalRef.current.duration)) {
          setDuracionAudio(audioModalRef.current.duration);
        }
      }
    };

    const interval = setInterval(updateAudioTime, 100);
    return () => clearInterval(interval);
  }, [reproduciendoModal]);

  // ===== REPRODUCCIÓN CON PERFORMANCE.NOW() =====
  useEffect(() => {
    if (!reproduciendoModal || pausadoModal || !audioModalRef.current) {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      audioModalRef.current?.pause();
      return;
    }

    // Iniciar reproducción
    const tickEnSegundos = (tickModal / resolucion) * (60 / bpmOriginalModalRef.current);
    audioModalRef.current.currentTime = tickEnSegundos;
    audioModalRef.current.playbackRate = bpmModal / bpmOriginalModalRef.current;
    audioModalRef.current.play().catch((e) => console.warn('⚠️ Audio no pudo reproducirse:', e));

    ultimoTimestampRef.current = performance.now();

    const loopReproduccion = (timestamp: number) => {
      if (!reproduciendoModal || pausadoModal) {
        if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
        return;
      }

      const deltaMs = timestamp - ultimoTimestampRef.current;
      ultimoTimestampRef.current = timestamp;

      // Calcular incremento de ticks usando performance.now()
      const ticksPorMs = (bpmModal / 60) * resolucion / 1000;
      setTickModal((prevTick) => {
        const nuevoTick = prevTick + ticksPorMs * deltaMs;

        // Detener al final
        if (nuevoTick >= totalTicksModal) {
          setReproduciendoModal(false);
          audioModalRef.current?.pause();
          return totalTicksModal;
        }

        // Sincronizar audio cada cierto tiempo
        if (audioModalRef.current && !pausadoModal) {
          const audioTime = (nuevoTick / resolucion) * (60 / bpmOriginalModalRef.current);
          const diff = Math.abs(audioModalRef.current.currentTime - audioTime);
          if (diff > 0.2) {
            audioModalRef.current.currentTime = audioTime;
          }
        }

        return nuevoTick;
      });

      rAFRef.current = requestAnimationFrame(loopReproduccion);
    };

    rAFRef.current = requestAnimationFrame(loopReproduccion);

    return () => {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    };
  }, [reproduciendoModal, pausadoModal, bpmModal, totalTicksModal, resolucion]);

  // Notificar notas actuales para iluminar botones del acordeón
  useEffect(() => {
    if (!onNotasActuales || !reproduciendoModal) {
      return;
    }

    // Encontrar todas las notas que están sonando en el tick actual
    const notasActuales = secuenciaEditada.filter(
      (nota) => nota.tick <= tickModal && tickModal < nota.tick + nota.duracion
    );

    onNotasActuales(notasActuales);
  }, [tickModal, reproduciendoModal, secuenciaEditada, onNotasActuales]);

  // Inicializar estados cuando se abre el modal
  useEffect(() => {
    if (!cancion) return;

    cancionOriginalRef.current = cancion;

    // Normalizar secuencia
    let secuenciaBase = cancion.secuencia_json || cancion.secuencia || [];
    if (typeof secuenciaBase === 'string') {
      try {
        secuenciaBase = JSON.parse(secuenciaBase);
      } catch {
        secuenciaBase = [];
      }
    }
    setSecuenciaEditada(Array.isArray(secuenciaBase) ? [...secuenciaBase] : []);

    // Cargar secciones
    let seccionesBase = cancion.secciones || [];
    if (typeof seccionesBase === 'string') {
      try {
        seccionesBase = JSON.parse(seccionesBase);
      } catch {
        seccionesBase = [];
      }
    }
    setSecciones(Array.isArray(seccionesBase) ? [...seccionesBase] : []);

    // Cargar duración
    setDuracionSegundos(cancion.duracion_segundos || null);

    // Inicializar BPM modal
    const bpmCancion = cancion.bpm || 120;
    setBpmModal(bpmCancion);
    bpmOriginalModalRef.current = bpmCancion;

    // Limpiar estados de edición y reproductor modal
    setHistorialEdiciones([]);
    setPunchOutTick(null);
    setPunchInTick(null);
    setMensaje(null);
    setTickModal(0);
    setReproduciendoModal(false);
    setPausadoModal(false);
  }, [cancion]);

  // Monitorear grabación completada
  useEffect(() => {
    if (!grabando && notasGrabadas && notasGrabadas.length > 0 && punchInTick !== null) {
      const punchOut = punchOutTick || tickActual;

      // Eliminar notas en el rango y agregar las nuevas
      const secuenciaSinRango = secuenciaEditada.filter(
        (nota) => nota.tick < punchInTick || (nota.tick + nota.duracion) > punchOut
      );

      const secuenciaCombinada = [...secuenciaSinRango, ...notasGrabadas].sort(
        (a, b) => a.tick - b.tick
      );

      setSecuenciaEditada(secuenciaCombinada);

      // Agregar al historial
      setHistorialEdiciones([
        ...historialEdiciones,
        {
          descripcion: `Grabación ${formatearTiempoDesdeTicks(punchInTick, bpm)} - ${formatearTiempoDesdeTicks(punchOut, bpm)}`,
          tickInicio: punchInTick,
          tickFin: punchOut,
          notasReemplazadas: notasGrabadas.length,
        },
      ]);

      setMensaje(`✅ Tramo actualizado: ${notasGrabadas.length} notas grabadas`);
      setPunchInTick(null);
      setPunchOutTick(null);
    }
  }, [grabando, notasGrabadas]);

  const marcarEntrada = useCallback(() => {
    setPunchInTick(Math.max(0, Math.floor(tickActual)));
    setMensaje(`📍 Entrada marcada en ${formatearTiempoDesdeTicks(tickActual, bpm)}`);
  }, [tickActual, bpm]);

  const marcarSalida = useCallback(() => {
    setPunchOutTick(Math.max(0, Math.floor(tickActual)));
    setMensaje(`📍 Salida marcada en ${formatearTiempoDesdeTicks(tickActual, bpm)}`);
  }, [tickActual, bpm]);

  const limpiarRango = useCallback(() => {
    setPunchInTick(null);
    setPunchOutTick(null);
    setMensaje('🧹 Rango limpio');
  }, []);

  const agregarSeccion = useCallback(() => {
    if (!nuevoaNombreSec.trim() || seccionTickInicio === null || seccionTickFin === null) {
      setMensaje('⚠️ Completa todos los campos para agregar una sección');
      return;
    }

    if (seccionTickInicio >= seccionTickFin) {
      setMensaje('⚠️ La entrada debe ser menor que la salida');
      return;
    }

    const nuevaSeccion: Seccion = {
      nombre: nuevoaNombreSec,
      tickInicio: seccionTickInicio,
      tickFin: seccionTickFin,
      tipo: nuevoaTipoSec,
    };

    setSecciones([...secciones, nuevaSeccion]);
    setNuevoaNombreSec('');
    setSeccionTickInicio(null);
    setSeccionTickFin(null);
    setMensaje('✅ Sección agregada');
  }, [nuevoaNombreSec, seccionTickInicio, seccionTickFin, nuevoaTipoSec, secciones]);

  const eliminarSeccion = useCallback((indice: number) => {
    setSecciones(secciones.filter((_, i) => i !== indice));
    setMensaje('✅ Sección eliminada');
  }, [secciones]);

  const iniciarEdicionSeccion = useCallback((indice: number) => {
    setSeccionEditandoId(indice);
    setSeccionEditandoNombre(secciones[indice].nombre);
  }, [secciones]);

  const guardarEdicionSeccion = useCallback((indice: number) => {
    if (!seccionEditandoNombre.trim()) {
      setMensaje('⚠️ El nombre no puede estar vacío');
      return;
    }

    const seccionesActualizadas = [...secciones];
    seccionesActualizadas[indice].nombre = seccionEditandoNombre;
    setSecciones(seccionesActualizadas);
    setSeccionEditandoId(null);
    setMensaje('✅ Sección actualizada');
  }, [secciones, seccionEditandoNombre]);

  const reproducirDesdeInicio = useCallback(() => {
    onBuscarTick(0);
    if (!reproduciendoHero) {
      onAlternarPausa();
    }
    setMensaje('▶️ Reproduciendo desde el inicio');
  }, [reproduciendoHero, onBuscarTick, onAlternarPausa]);

  const guardarCambios = async () => {
    if (!cancion) return;

    try {
      setGuardando(true);
      setMensaje('💾 Guardando cambios...');

      await actualizarCancionHeroCompleta(cancion.id, {
        secuencia_json: secuenciaEditada,
        secciones: secciones,
        duracion_segundos: duracionSegundos,
      });

      setMensaje('✅ Cambios guardados correctamente');
      setTimeout(() => onCerrar(), 1500);
    } catch (error: any) {
      console.error('❌ Error guardando:', error);
      setMensaje(`❌ Error: ${error.message || 'No se pudo guardar'}`);
    } finally {
      setGuardando(false);
    }
  };

  const cancelar = () => {
    if (historialEdiciones.length > 0) {
      if (!window.confirm('Tienes cambios sin guardar. ¿Deseas salir sin guardar?')) {
        return;
      }
    }
    onCerrar();
  };

  if (!cancion) return null;

  // Calcular duración mínima a partir del totalTicksModal
  const duracionMinimaSegundos = totalTicksModal > 0
    ? (totalTicksModal / resolucion) * (60 / Math.max(1, bpmModal))
    : 0;

  return (
    <div className="modal-editor-secuencia">
        {/* HEADER */}
        <div className="modal-editor-secuencia-header">
          <div>
            <div className="modal-editor-secuencia-kicker">Editor de Secuencia</div>
            <h2>{cancion.titulo || 'Canción sin título'}</h2>
          </div>
          <button className="modal-editor-secuencia-btn-cerrar" onClick={cancelar}>
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="modal-editor-secuencia-contenido">
        {/* REPRODUCTOR INDEPENDIENTE DEL MODAL */}
        <div className="modal-editor-secuencia-zona reproductor">
          <div className="modal-editor-secuencia-zona-titulo">Reproductor del Editor</div>

          {/* Slider de progreso */}
          <div className="modal-editor-secuencia-slider-container">
            <input
              type="range"
              min="0"
              max={Math.max(totalTicksModal, 1)}
              value={Math.floor(tickModal)}
              onChange={(e) => {
                setTickModal(Number(e.target.value));
                tickAnteriorRef.current = Number(e.target.value);
              }}
              className="modal-editor-secuencia-slider"
            />
          </div>

          {/* Tiempo */}
          <div className="modal-editor-secuencia-tiempo">
            <span>{formatearTiempoDesdeTicks(Math.floor(tickModal), bpmModal)}</span>
            <span>/</span>
            <span>{formatearTiempoDesdeTicks(totalTicksModal, bpmModal)}</span>
          </div>

          {/* Info del MP3 */}
          <div className="modal-editor-secuencia-info-mp3">
            {cancion?.audio_fondo_url ? (
              <span style={{ color: '#bbf7d0' }}>🎵 MP3 cargado</span>
            ) : (
              <span style={{ color: '#fbbf24' }}>⚠️ Sin MP3</span>
            )}
          </div>

          {/* Botones de reproducción */}
          <div className="modal-editor-secuencia-botones-fila">
            <button
              className="modal-editor-secuencia-btn"
              onClick={() => {
                setTickModal(0);
                tickAnteriorRef.current = 0;
              }}
              title="Ir al inicio"
            >
              ⏮️
            </button>
            <button
              className="modal-editor-secuencia-btn"
              onClick={() => {
                if (reproduciendoModal && !pausadoModal) {
                  setPausadoModal(true);
                } else {
                  setReproduciendoModal(true);
                  setPausadoModal(false);
                }
              }}
              title={reproduciendoModal && !pausadoModal ? 'Pausar' : 'Reproducir'}
            >
              {reproduciendoModal && !pausadoModal ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              className="modal-editor-secuencia-btn"
              onClick={() => {
                setReproduciendoModal(false);
                setPausadoModal(false);
                setTickModal(0);
                tickAnteriorRef.current = 0;
              }}
              title="Detener"
            >
              <Square size={16} />
            </button>
          </div>

          {/* Control BPM del modal */}
          <div className="modal-editor-secuencia-control-bpm">
            <label>
              <span>BPM</span>
              <div className="modal-editor-secuencia-bpm-inputs">
                <button onClick={() => setBpmModal(Math.max(60, bpmModal - 1))}>−</button>
                <input
                  type="number"
                  value={bpmModal}
                  onChange={(e) => setBpmModal(Number(e.target.value))}
                  min="60"
                  max="200"
                />
                <button onClick={() => setBpmModal(Math.min(200, bpmModal + 1))}>+</button>
              </div>
            </label>
          </div>
        </div>

        {/* SECCIONES */}
        <div className="modal-editor-secuencia-zona secciones">
          <div className="modal-editor-secuencia-zona-titulo">Secciones Nombradas</div>

          {secciones.length === 0 ? (
            <div className="modal-editor-secuencia-vacio">Sin secciones definidas</div>
          ) : (
            <div className="modal-editor-secuencia-lista">
              {secciones.map((sec, idx) => (
                <div key={idx} className="modal-editor-secuencia-seccion-item">
                  {seccionEditandoId === idx ? (
                    <div className="modal-editor-secuencia-seccion-editar">
                      <input
                        type="text"
                        value={seccionEditandoNombre}
                        onChange={(e) => setSeccionEditandoNombre(e.target.value)}
                        autoFocus
                      />
                      <button
                        onClick={() => guardarEdicionSeccion(idx)}
                        className="modal-editor-secuencia-btn-chico"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={() => setSeccionEditandoId(null)}
                        className="modal-editor-secuencia-btn-chico"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="modal-editor-secuencia-seccion-info">
                        <strong>{sec.nombre}</strong>
                        <span>
                          {formatearTiempoDesdeTicks(sec.tickInicio, bpm)} −{' '}
                          {formatearTiempoDesdeTicks(sec.tickFin, bpm)}
                        </span>
                        <span className="modal-editor-secuencia-badge">{sec.tipo}</span>
                      </div>
                      <div className="modal-editor-secuencia-seccion-botones">
                        <button
                          onClick={() => onBuscarTick(sec.tickInicio)}
                          className="modal-editor-secuencia-btn-chico"
                          title="Ir a esta sección"
                        >
                          <MapPin size={14} />
                        </button>
                        <button
                          onClick={() => iniciarEdicionSeccion(idx)}
                          className="modal-editor-secuencia-btn-chico"
                          title="Editar nombre"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => eliminarSeccion(idx)}
                          className="modal-editor-secuencia-btn-chico"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Agregar nueva sección */}
          <div className="modal-editor-secuencia-agregar-seccion">
            <input
              type="text"
              placeholder="Nombre de la sección"
              value={nuevoaNombreSec}
              onChange={(e) => setNuevoaNombreSec(e.target.value)}
            />
            <select
              value={nuevoaTipoSec}
              onChange={(e) => setNuevoaTipoSec(e.target.value as 'melodia' | 'acompanamiento')}
            >
              <option value="melodia">Melodía</option>
              <option value="acompanamiento">Acompañamiento</option>
            </select>
            <button
              onClick={() => setSeccionTickInicio(tickActual)}
              className="modal-editor-secuencia-btn-chico"
            >
              📍 Inicio
            </button>
            <button
              onClick={() => setSeccionTickFin(tickActual)}
              className="modal-editor-secuencia-btn-chico"
            >
              📍 Fin
            </button>
            <button onClick={agregarSeccion} className="modal-editor-secuencia-btn-guardar">
              <Plus size={14} /> Agregar
            </button>
          </div>
        </div>

        {/* PUNCH-IN / TRAMOS */}
        <div className="modal-editor-secuencia-zona punch">
          <div className="modal-editor-secuencia-zona-titulo">Editor de Tramos (Punch-In)</div>

          <div className="modal-editor-secuencia-control-punch">
            <button
              onClick={marcarEntrada}
              className="modal-editor-secuencia-btn modal-editor-secuencia-btn-entrada"
            >
              📍 Marcar Entrada
            </button>
            <button
              onClick={marcarSalida}
              className="modal-editor-secuencia-btn modal-editor-secuencia-btn-salida"
            >
              📍 Marcar Salida
            </button>
            <button onClick={limpiarRango} className="modal-editor-secuencia-btn">
              🧹 Limpiar
            </button>
          </div>

          <div className="modal-editor-secuencia-puntos-marcados">
            <div>
              <span>Entrada:</span>
              <strong>
                {punchInTick !== null ? formatearTiempoDesdeTicks(punchInTick, bpm) : '--:--'}
              </strong>
            </div>
            <div>
              <span>Salida:</span>
              <strong>
                {punchOutTick !== null ? formatearTiempoDesdeTicks(punchOutTick, bpm) : '--:--'}
              </strong>
            </div>
          </div>

          <div className="modal-editor-secuencia-grabacion">
            {cuentaAtrasPreRoll !== null && (
              <div className="modal-editor-secuencia-cuenta-regresiva">
                <div className="modal-editor-secuencia-numero-grande">
                  {cuentaAtrasPreRoll}
                </div>
              </div>
            )}

            <button
              onClick={onIniciarGrabacion}
              disabled={punchInTick === null || grabando}
              className="modal-editor-secuencia-btn modal-editor-secuencia-btn-grabar"
            >
              🔴 GRABAR TRAMO
            </button>

            {grabando && (
              <button
                onClick={onDetenerGrabacion}
                className="modal-editor-secuencia-btn modal-editor-secuencia-btn-detener"
              >
                ⏹ DETENER
              </button>
            )}

            {grabando && (
              <div className="modal-editor-secuencia-grabando">
                <div className="modal-editor-secuencia-indicador-rojo" />
                <span>{formatearTiempoDesdeMs(tiempoGrabacionMs)}</span>
              </div>
            )}
          </div>
        </div>

        {/* RESULTADO */}
        {historialEdiciones.length > 0 && (
          <div className="modal-editor-secuencia-zona resultado">
            <div className="modal-editor-secuencia-zona-titulo">
              Ediciones Acumuladas ({historialEdiciones.length})
            </div>

            <div className="modal-editor-secuencia-historial">
              {historialEdiciones.map((edicion, idx) => (
                <div key={idx} className="modal-editor-secuencia-edicion-item">
                  <span>{edicion.descripcion}</span>
                  <button
                    onClick={() => onBuscarTick(edicion.tickInicio)}
                    className="modal-editor-secuencia-btn-chico"
                  >
                    ▶️
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={reproducirDesdeInicio}
              className="modal-editor-secuencia-btn modal-editor-secuencia-btn-reproducir"
            >
              ▶ ESCUCHAR DESDE EL INICIO
            </button>
          </div>
        )}

        {/* DURACIÓN DE LA SECUENCIA — siempre visible */}
        <div className="modal-editor-secuencia-zona duracion">
          <div className="modal-editor-secuencia-zona-titulo">Duración de la Secuencia</div>
          <p className="modal-editor-secuencia-zona-desc">
            Ajusta el punto de fin. El MP3 puede tener silencio al final.
          </p>

          <div className="modal-editor-secuencia-duracion-slider">
            <div className="modal-editor-secuencia-duracion-fila">
              <span className="modal-editor-secuencia-duracion-valor">
                {(duracionSegundos ?? duracionMinimaSegundos).toFixed(1)} s
              </span>
              <span className="modal-editor-secuencia-duracion-min">
                Mín: {duracionMinimaSegundos.toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min={Math.round(duracionMinimaSegundos * 10) / 10}
              max={Math.max(duracionMinimaSegundos * 2, duracionMinimaSegundos + 60, 300)}
              step={0.5}
              value={duracionSegundos ?? duracionMinimaSegundos}
              onChange={(e) => setDuracionSegundos(parseFloat(e.target.value))}
              className="modal-editor-secuencia-slider"
            />
          </div>
        </div>

        {/* MENSAJE */}
        {mensaje && (
          <div className="modal-editor-secuencia-mensaje">
            {mensaje}
          </div>
        )}
        </div>

        {/* FOOTER */}
        <div className="modal-editor-secuencia-footer">
          <button
            onClick={cancelar}
            className="modal-editor-secuencia-btn modal-editor-secuencia-btn-secundario"
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            onClick={guardarCambios}
            disabled={historialEdiciones.length === 0 || guardando}
            className="modal-editor-secuencia-btn modal-editor-secuencia-btn-primario"
          >
            {guardando ? '💾 Guardando...' : '💾 GUARDAR CAMBIOS'}
          </button>
        </div>
    </div>
  );
};

export default ModalEditorSecuencia;
