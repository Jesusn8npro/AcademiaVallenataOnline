import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Save } from 'lucide-react';
import type { NotaHero } from '../../TiposProMax';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import type { ModalEditorSecuenciaProps } from './EditorSecuencia/tiposEditor';
import { usePunchInEditor } from './EditorSecuencia/usePunchInEditor';
import { useSeccionesModal } from './EditorSecuencia/useSeccionesModal';
import PanelTimeline from './EditorSecuencia/PanelTimeline';
import PanelPunchIn from './EditorSecuencia/PanelPunchIn';
import PanelSecciones from './EditorSecuencia/PanelSecciones';
import PanelConfigMP3 from './EditorSecuencia/PanelConfigMP3';
import './ModalEditorSecuencia.css';

const ModalEditorSecuencia: React.FC<ModalEditorSecuenciaProps> = ({
  cancion, onCerrar, bpm, onCambiarBpm,
  grabando: _grabando, onIniciarGrabacion, onDetenerGrabacion,
  notasGrabadas, onNotasActuales, onSecuenciaChange,
  preRollSegundos, setPreRollSegundos, metronomoActivo, setMetronomoActivo,
}) => {
  const resolucion = cancion?.resolucion || 192;

  const [tickLocal, setTickLocal] = useState(0);
  const [reproduciendoLocal, setReproduciendoLocal] = useState(false);
  const [bpmModal, setBpmModal] = useState(cancion?.bpm || 120);
  const tickLocalRef = useRef(0);
  const inicioLocalRef = useRef<{ ts: number; tick: number } | null>(null);
  const rAFLocalRef = useRef<number>(0);
  const sliderRef = useRef<HTMLInputElement>(null);
  const isSeekingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duracionAudio, setDuracionAudio] = useState(0);
  const [tiempoAudioActual, setTiempoAudioActual] = useState(0);
  const checkpointTickRef = useRef(0);
  const checkpointTimeRef = useRef(0);
  const tickAnteriorRef = useRef(-1);
  const bpmOriginalRef = useRef(cancion?.bpm || 120);
  const syncAudioRef = useRef<number>(0);

  const secuenciaEditadaRef = useRef<NotaHero[]>([]);
  const punch = usePunchInEditor({
    cancionId: cancion?.id, cancionBpm: cancion?.bpm || 120, bpmModal, resolucion,
    secuenciaEditadaRef, notasGrabadas, grabandoProp: _grabando,
    preRollSegundos, setPreRollSegundos, metronomoActivo, setMetronomoActivo,
    onIniciarGrabacion, onDetenerGrabacion, onSecuenciaChange,
    audioRef, tickLocalRef, inicioLocalRef, setReproduciendoLocal,
  });

  const [secuenciaEditada, setSecuenciaEditada] = useState<NotaHero[]>([]);
  const [timelineAbierto, setTimelineAbierto] = useState(true);
  const [edicionAbierta, setEdicionAbierta] = useState(false);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState(false);

  const sec = useSeccionesModal({
    cancion, audioRef, duracionAudio, reproduciendoLocal, setReproduciendoLocal,
    rAFLocalRef, inicioLocalRef, onCerrar, secuenciaEditada,
  });

  const secuenciaPreviewRef = useRef<NotaHero[]>([]);
  const modoEdicionRef = useRef(punch.modoEdicion);
  const onNotasActualesRef = useRef(onNotasActuales);
  useEffect(() => { secuenciaEditadaRef.current = secuenciaEditada; }, [secuenciaEditada]);
  useEffect(() => { secuenciaPreviewRef.current = punch.secuenciaPreview; }, [punch.secuenciaPreview]);
  useEffect(() => { modoEdicionRef.current = punch.modoEdicion; }, [punch.modoEdicion]);
  useEffect(() => { onNotasActualesRef.current = onNotasActuales; }, [onNotasActuales]);

  const ticksDeDuracion = Math.round(sec.duracionSegundosModal * (bpmModal / 60) * resolucion);
  const ultimoTickNotas = secuenciaEditada.length > 0 ? Math.max(...secuenciaEditada.map(n => n.tick + n.duracion)) : 0;
  const totalTicksModal = ticksDeDuracion > 0 ? ticksDeDuracion : Math.max(resolucion * 4, ultimoTickNotas);

  useEffect(() => {
    if (!cancion) return;
    let secArr = cancion.secuencia_json || cancion.secuencia || [];
    if (typeof secArr === 'string') try { secArr = JSON.parse(secArr); } catch { secArr = []; }
    setSecuenciaEditada(Array.isArray(secArr) ? [...secArr] : []);
    setBpmModal(cancion.bpm || 120);
  }, [cancion]);

  useEffect(() => {
    if (cancion?.audio_fondo_url && !audioRef.current) {
      const audio = new Audio(cancion.audio_fondo_url);
      audio.crossOrigin = 'anonymous';
      audioRef.current = audio;
      audio.onloadedmetadata = () => {
        const dur = audio.duration;
        setDuracionAudio(dur);
        if (!cancion.duracion_segundos || cancion.duracion_segundos > dur) sec.setDuracionSegundosModal(dur);
        bpmOriginalRef.current = cancion?.bpm || 120;
      };
    }
    return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };
  }, [cancion?.audio_fondo_url]);

  useEffect(() => { setBpmModal(bpm); }, [bpm]);

  useEffect(() => {
    if (!onNotasActuales) return;
    if (!reproduciendoLocal || punch.modoEdicion === 'grabando') onNotasActuales([]);
  }, [reproduciendoLocal, punch.modoEdicion, onNotasActuales]);

  useEffect(() => {
    if (!reproduciendoLocal) {
      cancelAnimationFrame(rAFLocalRef.current);
      inicioLocalRef.current = null;
      if (audioRef.current && !sec.reproduciendoSeccion) audioRef.current.pause();
      return;
    }
    let lastUIUpdate = 0;
    const bpmOrig = cancion?.bpm || 120;
    if (audioRef.current) {
      audioRef.current.playbackRate = Math.min(4, Math.max(0.1, bpmModal / Math.max(1, bpmOrig)));
      (audioRef.current as any).preservesPitch = true;
    }
    const loop = () => {
      const ahora = motorAudioPro.tiempoActual;
      if (!inicioLocalRef.current) inicioLocalRef.current = { ts: ahora, tick: tickLocalRef.current };
      const newTick = Math.min(totalTicksModal, inicioLocalRef.current.tick + (ahora - inicioLocalRef.current.ts) * (bpmModal / 60) * resolucion);
      tickLocalRef.current = newTick;
      if (onNotasActualesRef.current && modoEdicionRef.current !== 'grabando') {
        const seq = modoEdicionRef.current === 'revisando' ? secuenciaPreviewRef.current : secuenciaEditadaRef.current;
        onNotasActualesRef.current(seq.filter(n => newTick >= n.tick && newTick < n.tick + n.duracion));
      }
      if (!isSeekingRef.current) {
        if (sliderRef.current) sliderRef.current.value = String(newTick);
        const ahoraMs = ahora * 1000;
        if (ahoraMs - lastUIUpdate >= 67) {
          lastUIUpdate = ahoraMs;
          setTickLocal(newTick);
          if (audioRef.current) setTiempoAudioActual(audioRef.current.currentTime);
        }
      }
      if (punch.punchActivoRef.current && punch.punchTickTargetRef.current !== null) {
        const rem = (punch.punchTickTargetRef.current - newTick) / resolucion * (60 / Math.max(1, bpmModal));
        if (rem <= 0) {
          punch.punchActivoRef.current = false;
          punch.punchTickTargetRef.current = null;
          punch.setCuentaAtrasLocal(null);
          punch.setModoEdicion('grabando');
          onIniciarGrabacion();
        } else {
          punch.setCuentaAtrasLocal(Math.ceil(rem));
        }
      }
      if (newTick < totalTicksModal) rAFLocalRef.current = requestAnimationFrame(loop);
      else setReproduciendoLocal(false);
    };
    rAFLocalRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rAFLocalRef.current); inicioLocalRef.current = null; };
  }, [reproduciendoLocal, bpmModal, resolucion, totalTicksModal, onIniciarGrabacion, sec.reproduciendoSeccion]);

  useEffect(() => {
    if (!audioRef.current || !reproduciendoLocal) return;
    const seg = tickLocalRef.current / ((bpmOriginalRef.current / 60) * resolucion);
    audioRef.current.currentTime = seg;
    checkpointTickRef.current = tickLocalRef.current;
    checkpointTimeRef.current = seg;
    tickAnteriorRef.current = tickLocalRef.current;
    motorAudioPro.activarContexto();
    audioRef.current.play().catch(() => {});
  }, [reproduciendoLocal]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (Math.abs(tickLocal - tickAnteriorRef.current) > 50) {
      const t = tickLocal / ((bpmOriginalRef.current / 60) * resolucion);
      audioRef.current.currentTime = t;
      checkpointTimeRef.current = t;
      checkpointTickRef.current = tickLocal;
    }
    tickAnteriorRef.current = tickLocal;
    setTiempoAudioActual(audioRef.current.currentTime);
  }, [tickLocal]);

  useEffect(() => {
    if (!reproduciendoLocal) return;
    const sync = () => {
      if (!audioRef.current || audioRef.current.paused) return;
      const esperado = checkpointTimeRef.current + (tickLocalRef.current - checkpointTickRef.current) / ((bpmOriginalRef.current / 60) * resolucion);
      if (Math.abs(esperado - audioRef.current.currentTime) > 0.15) {
        audioRef.current.currentTime = esperado;
        checkpointTimeRef.current = esperado;
        checkpointTickRef.current = tickLocalRef.current;
      }
      syncAudioRef.current = requestAnimationFrame(sync);
    };
    syncAudioRef.current = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(syncAudioRef.current);
  }, [reproduciendoLocal]);

  const togglePlay = useCallback(() => {
    if (reproduciendoLocal) { setReproduciendoLocal(false); audioRef.current?.pause(); }
    else { if (sec.reproduciendoSeccion) sec.setReproduciendoSeccion(false); inicioLocalRef.current = null; setReproduciendoLocal(true); }
  }, [reproduciendoLocal, sec.reproduciendoSeccion, sec.setReproduciendoSeccion]);

  const handleSeek = useCallback((val: number) => {
    const t = Math.max(0, Math.min(totalTicksModal, val));
    tickLocalRef.current = t; setTickLocal(t); inicioLocalRef.current = null;
    if (sliderRef.current) sliderRef.current.value = String(t);
    if (audioRef.current) audioRef.current.currentTime = (t / resolucion) * (60 / Math.max(1, cancion?.bpm || 120));
  }, [resolucion, totalTicksModal, cancion?.bpm]);

  const handleReset = useCallback(() => {
    setReproduciendoLocal(false); tickLocalRef.current = 0; setTickLocal(0); inicioLocalRef.current = null;
    if (sliderRef.current) sliderRef.current.value = '0';
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  }, []);

  const saltarSegundos = useCallback((seg: number) => {
    handleSeek(Math.max(0, Math.min(totalTicksModal, tickLocalRef.current + Math.round(seg * (bpmModal / 60) * resolucion))));
  }, [bpmModal, resolucion, totalTicksModal, handleSeek]);

  return (
    <div className="editor-secuencia-modal">
      <div className="editor-cabecera">
        <div>
          <div className="editor-subtitulo">Panel Edición Profesional</div>
          <h2>{cancion?.titulo || 'Editor'}</h2>
        </div>
        <button className="editor-boton-cerrar" onClick={onCerrar}><X size={20} /></button>
      </div>

      <div className="editor-cuerpo">
        <PanelTimeline
          secciones={sec.secciones} totalTicksModal={totalTicksModal} bpmModal={bpmModal}
          setBpmModal={setBpmModal} onCambiarBpm={onCambiarBpm} punchInTickLocal={punch.punchInTickLocal}
          secuenciaEditada={secuenciaEditada} sliderRef={sliderRef} isSeekingRef={isSeekingRef}
          tickLocal={tickLocal} tiempoAudioActual={tiempoAudioActual} duracionAudio={duracionAudio}
          reproduciendoLocal={reproduciendoLocal} handleSeek={handleSeek} handleReset={handleReset}
          saltarSegundos={saltarSegundos} togglePlay={togglePlay}
          timelineAbierto={timelineAbierto} setTimelineAbierto={setTimelineAbierto}
        />

        <PanelPunchIn
          modoEdicion={punch.modoEdicion} cuentaAtrasLocal={punch.cuentaAtrasLocal}
          notasGrabadas={notasGrabadas} punchInTickLocal={punch.punchInTickLocal}
          setPunchInTickLocal={t => { punch.setPunchInTickLocal(t); punch.setMensajeLocal(null); }}
          punchInTickSnapshotCurrent={punch.punchInTickSnapshot.current}
          mensajeLocal={punch.mensajeLocal} bpmModal={bpmModal} resolucion={resolucion}
          secuenciaPreview={punch.secuenciaPreview} reproduciendoLocal={reproduciendoLocal}
          handleSeek={handleSeek} togglePlay={togglePlay}
          preRollSegsLocal={punch.preRollSegsLocal} setPreRollSegsLocal={punch.setPreRollSegsLocal}
          setPreRollSegundos={setPreRollSegundos} metronomoLocal={punch.metronomoLocal}
          setMetronomoLocal={punch.setMetronomoLocal} setMetronomoActivo={setMetronomoActivo}
          iniciarEdicionPunch={punch.iniciarEdicionPunch} detenerEdicionPunch={punch.detenerEdicionPunch}
          guardarToma={punch.guardarToma} guardandoToma={punch.guardandoToma}
          onRepetirToma={() => punch.onRepetirToma(reproduciendoLocal)}
          descartarToma={punch.descartarToma} tickLocalRefCurrent={() => tickLocalRef.current}
          edicionAbierta={edicionAbierta} setEdicionAbierta={setEdicionAbierta}
          totalTicksModal={totalTicksModal}
        />

        <PanelSecciones
          secciones={sec.secciones} eliminarSeccion={i => sec.setSecciones(prev => prev.filter((_, idx) => idx !== i))}
          handleSeek={handleSeek} bpmModal={bpmModal} resolucion={resolucion}
          duracionAudio={duracionAudio} duracionSegundosModal={sec.duracionSegundosModal}
          seccionCursorSeg={sec.seccionCursorSeg} setSeccionCursorSeg={sec.setSeccionCursorSeg}
          audioCurrentTime={t => { if (audioRef.current) audioRef.current.currentTime = t; }}
          reproduciendoSeccion={sec.reproduciendoSeccion} togglePlaySeccion={sec.togglePlaySeccion}
          stopSeccion={sec.stopSeccion} saltarSeccion={sec.saltarSeccion}
          seccionNombre={sec.seccionNombre} setSeccionNombre={sec.setSeccionNombre}
          seccionTickInicio={sec.seccionTickInicio} setSeccionTickInicio={sec.setSeccionTickInicio}
          seccionTickFin={sec.seccionTickFin} setSeccionTickFin={sec.setSeccionTickFin}
          agregarSeccion={sec.agregarSeccion} handleGuardarSecciones={sec.handleGuardarSecciones}
          guardandoSecciones={sec.guardandoSecciones} seccionesAbiertas={seccionesAbiertas}
          setSeccionesAbiertas={setSeccionesAbiertas}
        />

        <PanelConfigMP3
          duracionGuardada={sec.duracionGuardada} duracionAudio={duracionAudio}
          duracionSegundosModal={sec.duracionSegundosModal} setDuracionSegundosModal={sec.setDuracionSegundosModal}
          duracionCambiada={sec.duracionCambiada} guardandoDuracion={sec.guardandoDuracion}
          handleGuardarDuracion={sec.handleGuardarDuracion}
        />
      </div>

      <div className="editor-pie">
        {sec.mensajeGuardar && (
          <span style={{ color: sec.mensajeGuardar.startsWith('Error') ? '#ef4444' : '#22c55e', fontSize: '0.85rem' }}>
            {sec.mensajeGuardar}
          </span>
        )}
        <button className="editor-boton-secundario" onClick={onCerrar}>Cancelar</button>
        <button className="editor-boton-primario" onClick={sec.handleGuardar}>
          <Save size={16} /> Guardar Todo
        </button>
      </div>
    </div>
  );
};

export default ModalEditorSecuencia;
