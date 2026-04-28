import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import type { NotaHero } from '../../TiposProMax';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import type { ModalEditorSecuenciaProps } from './EditorSecuencia/tiposEditor';
import { usePunchInEditor } from './EditorSecuencia/usePunchInEditor';
import { useSeccionesModal } from './EditorSecuencia/useSeccionesModal';
import PanelPunchIn from './EditorSecuencia/PanelPunchIn';
import PanelSecciones from './EditorSecuencia/PanelSecciones';
import PanelConfigMP3 from './EditorSecuencia/PanelConfigMP3';
import BarraTimelineProMax from './BarraTimelineProMax';
import './ModalEditorSecuencia.css';

const ModalEditorSecuencia: React.FC<ModalEditorSecuenciaProps> = ({
  cancion, onCerrar, bpm, onCambiarBpm,
  grabando: _grabando, onIniciarGrabacion, onDetenerGrabacion,
  notasGrabadas, onNotasActuales, onSecuenciaChange,
  preRollSegundos, setPreRollSegundos, metronomoActivo, setMetronomoActivo,
  onReproducirNota,
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
  const [edicionAbierta, setEdicionAbierta] = useState(false);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => { setPortalTarget(document.getElementById('barra-timeline-slot')); }, []);

  const sec = useSeccionesModal({
    cancion, audioRef, duracionAudio, reproduciendoLocal, setReproduciendoLocal,
    rAFLocalRef, inicioLocalRef, onCerrar, secuenciaEditada,
  });

  const secuenciaPreviewRef = useRef<NotaHero[]>([]);
  const modoEdicionRef = useRef(punch.modoEdicion);
  const onNotasActualesRef = useRef(onNotasActuales);
  const onIniciarGrabacionRef = useRef(onIniciarGrabacion);
  const onReproducirNotaRef = useRef(onReproducirNota);
  const notasYaSonadasRef = useRef<Set<string>>(new Set());
  const notasActivasReprodRef = useRef<Map<string, { instancias: any[]; endTick: number }>>(new Map());
  // Hasta que el audio dispare 'playing', el RAF no debe disparar notas (evita "secuencia antes que mp3").
  const audioRealmenteSonandoRef = useRef<boolean>(false);
  useEffect(() => { secuenciaEditadaRef.current = secuenciaEditada; }, [secuenciaEditada]);
  useEffect(() => { secuenciaPreviewRef.current = punch.secuenciaPreview; }, [punch.secuenciaPreview]);
  useEffect(() => { modoEdicionRef.current = punch.modoEdicion; }, [punch.modoEdicion]);
  useEffect(() => { onNotasActualesRef.current = onNotasActuales; }, [onNotasActuales]);
  useEffect(() => { onIniciarGrabacionRef.current = onIniciarGrabacion; }, [onIniciarGrabacion]);
  useEffect(() => { onReproducirNotaRef.current = onReproducirNota; }, [onReproducirNota]);
  const apagarTodasLasNotasActivas = React.useCallback(() => {
    notasActivasReprodRef.current.forEach(({ instancias }) => {
      instancias.forEach((inst: any) => {
        try { (motorAudioPro as any).detener?.(inst, 0.05); } catch (_) {}
      });
    });
    notasActivasReprodRef.current.clear();
    notasYaSonadasRef.current = new Set();
  }, []);

  useEffect(() => {
    if (!reproduciendoLocal) {
      apagarTodasLasNotasActivas();
      audioRealmenteSonandoRef.current = false;
    }
  }, [reproduciendoLocal, apagarTodasLasNotasActivas]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlaying = () => { audioRealmenteSonandoRef.current = true; };
    const onSeeked = () => { if (!audio.paused) audioRealmenteSonandoRef.current = true; };
    const onPause = () => { audioRealmenteSonandoRef.current = false; };
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('seeked', onSeeked);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('seeked', onSeeked);
      audio.removeEventListener('pause', onPause);
    };
  }, [audioRef.current]);

  useEffect(() => { apagarTodasLasNotasActivas(); }, [punch.modoEdicion, apagarTodasLasNotasActivas]);

  useEffect(() => {
    return () => {
      apagarTodasLasNotasActivas();
      try { (motorAudioPro as any).detenerTodo?.(); } catch (_) {}
    };
  }, [apagarTodasLasNotasActivas]);

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
      const ahora = performance.now() / 1000;
      if (!inicioLocalRef.current) inicioLocalRef.current = { ts: ahora, tick: tickLocalRef.current };

      // Tick: (1) audio sonando → sigue audio.currentTime (cero drift); (2) audio pendiente → reloj congelado para no adelantar las notas; (3) sin audio → performance.now().
      const audio = audioRef.current;
      const hayAudio = !!(audio && audio.src);
      const audioActivo = audioRealmenteSonandoRef.current
        && !!(audio && !audio.paused && audio.readyState >= 2);

      let newTick: number;
      if (audioActivo) {
        newTick = Math.min(totalTicksModal, audio!.currentTime * (bpmOrig / 60) * resolucion);
        inicioLocalRef.current = { ts: ahora, tick: newTick };
      } else if (hayAudio) {
        newTick = tickLocalRef.current;
        inicioLocalRef.current = { ts: ahora, tick: newTick };
      } else {
        newTick = Math.min(totalTicksModal, inicioLocalRef.current.tick + (ahora - inicioLocalRef.current.ts) * (bpmModal / 60) * resolucion);
      }
      tickLocalRef.current = newTick;
      if (onNotasActualesRef.current && modoEdicionRef.current !== 'grabando') {
        const seq = modoEdicionRef.current === 'revisando' ? secuenciaPreviewRef.current : secuenciaEditadaRef.current;
        onNotasActualesRef.current(seq.filter(n => newTick >= n.tick && newTick < n.tick + n.duracion));

        // Sonar tonos en idle/revisando (no durante grabación, para no superponer audio).
        const modoSuena = modoEdicionRef.current === 'idle' || modoEdicionRef.current === 'revisando';
        if (onReproducirNotaRef.current && modoSuena) {
          const tickAnterior = tickAnteriorRef.current;

          notasActivasReprodRef.current.forEach((info, llave) => {
            if (newTick >= info.endTick) {
              info.instancias.forEach((inst: any) => {
                try { (motorAudioPro as any).detener?.(inst, 0.05); } catch (_) {}
              });
              notasActivasReprodRef.current.delete(llave);
            }
          });

          for (const n of seq) {
            if (n.tick >= tickAnterior && n.tick < newTick) {
              const llave = `${n.tick}-${n.botonId}`;
              if (!notasYaSonadasRef.current.has(llave)) {
                notasYaSonadasRef.current.add(llave);
                try {
                  const result: any = onReproducirNotaRef.current(n.botonId);
                  const instancias: any[] = result?.instances || [];
                  if (instancias.length > 0) {
                    notasActivasReprodRef.current.set(llave, {
                      instancias,
                      endTick: n.tick + n.duracion,
                    });
                  }
                } catch (_) {}
              }
            }
          }
        }
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
          onIniciarGrabacionRef.current();
        } else {
          punch.setCuentaAtrasLocal(Math.ceil(rem));
        }
      }
      if (modoEdicionRef.current === 'grabando' && punch.punchOutTickRef.current !== null && newTick >= punch.punchOutTickRef.current) {
        punch.detenerEdicionPunch();
      }
      if (newTick < totalTicksModal) rAFLocalRef.current = requestAnimationFrame(loop);
      else setReproduciendoLocal(false);
    };
    rAFLocalRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rAFLocalRef.current); inicioLocalRef.current = null; };
  }, [reproduciendoLocal, bpmModal, resolucion, totalTicksModal, sec.reproduciendoSeccion]);

  useEffect(() => {
    if (!audioRef.current || !reproduciendoLocal) return;
    const audio = audioRef.current;
    const seg = tickLocalRef.current / ((bpmOriginalRef.current / 60) * resolucion);
    audio.currentTime = seg;
    checkpointTickRef.current = tickLocalRef.current;
    checkpointTimeRef.current = seg;
    tickAnteriorRef.current = tickLocalRef.current;
    audioRealmenteSonandoRef.current = false;
    motorAudioPro.activarContexto();
    audio.play().catch(() => {});

    const onPlayingSync = () => {
      audioRealmenteSonandoRef.current = true;
      const tiempoReal = audio.currentTime;
      const tickReal = tiempoReal * (bpmOriginalRef.current / 60) * resolucion;
      tickLocalRef.current = tickReal;
      tickAnteriorRef.current = tickReal;
      inicioLocalRef.current = null;
      setTickLocal(tickReal);
    };
    audio.addEventListener('playing', onPlayingSync, { once: true });

    // Fallback: si 'playing' no llega en 1500ms, soltar el RAF igualmente.
    const fallbackId = setTimeout(() => {
      if (!audioRealmenteSonandoRef.current) {
        audioRealmenteSonandoRef.current = true;
        inicioLocalRef.current = null;
      }
    }, 1500);

    return () => {
      audio.removeEventListener('playing', onPlayingSync);
      clearTimeout(fallbackId);
    };
  }, [reproduciendoLocal, resolucion]);

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
      if (audioRef.current && !audioRef.current.paused) {
        const esperado = checkpointTimeRef.current + (tickLocalRef.current - checkpointTickRef.current) / ((bpmOriginalRef.current / 60) * resolucion);
        if (Math.abs(esperado - audioRef.current.currentTime) > 0.15) {
          audioRef.current.currentTime = esperado;
          checkpointTimeRef.current = esperado;
          checkpointTickRef.current = tickLocalRef.current;
        }
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
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.currentTime = (t / resolucion) * (60 / Math.max(1, cancion?.bpm || 120));
      audioRealmenteSonandoRef.current = false;
      // Listener 'seeked' one-shot: si seekeamos durante reproducción, no se dispara 'playing' otra vez,
      // así que aquí reactivamos el flag manualmente y recalibramos el tick a la posición real.
      const onSeekedReanudar = () => {
        audio.removeEventListener('seeked', onSeekedReanudar);
        if (!audio.paused) {
          audioRealmenteSonandoRef.current = true;
          const tickReal = audio.currentTime * (bpmOriginalRef.current / 60) * resolucion;
          tickLocalRef.current = tickReal;
          tickAnteriorRef.current = tickReal;
        }
      };
      audio.addEventListener('seeked', onSeekedReanudar, { once: true });
    }
    notasYaSonadasRef.current = new Set();
    notasActivasReprodRef.current.forEach(({ instancias }) => {
      instancias.forEach((inst: any) => {
        try { (motorAudioPro as any).detener?.(inst, 0.05); } catch (_) {}
      });
    });
    notasActivasReprodRef.current.clear();
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
    <>
    <div className="editor-secuencia-modal">
      <div className="editor-cabecera">
        <div>
          <div className="editor-subtitulo">Panel Edición Profesional</div>
          <h2>{cancion?.titulo || 'Editor'}</h2>
        </div>
        <button className="editor-boton-cerrar" onClick={onCerrar}><X size={20} /></button>
      </div>

      <div className="editor-cuerpo">
        <PanelPunchIn
          modoEdicion={punch.modoEdicion} cuentaAtrasLocal={punch.cuentaAtrasLocal}
          notasGrabadas={notasGrabadas} punchInTickLocal={punch.punchInTickLocal}
          setPunchInTickLocal={t => { punch.setPunchInTickLocal(t); punch.setMensajeLocal(null); }}
          punchOutTickLocal={punch.punchOutTickLocal}
          setPunchOutTickLocal={punch.setPunchOutTickLocal}
          punchInTickSnapshotCurrent={punch.punchInTickSnapshot.current}
          mensajeLocal={punch.mensajeLocal} bpmModal={bpmModal} resolucion={resolucion}
          secuenciaPreview={punch.secuenciaPreview} reproduciendoLocal={reproduciendoLocal}
          handleSeek={handleSeek} togglePlay={togglePlay}
          preRollSegsLocal={punch.preRollSegsLocal} setPreRollSegsLocal={punch.setPreRollSegsLocal}
          setPreRollSegundos={setPreRollSegundos}
          iniciarEdicionPunch={punch.iniciarEdicionPunch} detenerEdicionPunch={punch.detenerEdicionPunch}
          guardarToma={punch.guardarToma} guardandoToma={punch.guardandoToma}
          onRepetirToma={() => punch.onRepetirToma(reproduciendoLocal)}
          descartarToma={punch.descartarToma} tickLocalRefCurrent={() => tickLocalRef.current}
          edicionAbierta={edicionAbierta} setEdicionAbierta={setEdicionAbierta}
          totalTicksModal={totalTicksModal}
          secciones={sec.secciones}
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
          seccionMonedas={sec.seccionMonedas} setSeccionMonedas={sec.setSeccionMonedas}
          actualizarMonedasSeccion={sec.actualizarMonedasSeccion}
          agregarSeccion={sec.agregarSeccion} handleGuardarSecciones={sec.handleGuardarSecciones}
          guardandoSecciones={sec.guardandoSecciones}
          desbloqueoSecuencial={sec.desbloqueoSecuencial}
          setDesbloqueoSecuencial={sec.setDesbloqueoSecuencial}
          umbralPrecisionSeccion={sec.umbralPrecisionSeccion}
          setUmbralPrecisionSeccion={sec.setUmbralPrecisionSeccion}
          intentosParaMoneda={sec.intentosParaMoneda}
          setIntentosParaMoneda={sec.setIntentosParaMoneda}
          guardandoConfigSecciones={sec.guardandoConfigSecciones}
          handleGuardarConfigSecciones={sec.handleGuardarConfigSecciones}
          seccionesAbiertas={seccionesAbiertas}
          setSeccionesAbiertas={setSeccionesAbiertas}
          seccionEditandoIndex={sec.seccionEditandoIndex}
          iniciarEdicionSeccion={sec.iniciarEdicionSeccion}
          cancelarEdicionSeccion={sec.cancelarEdicionSeccion}
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

    {portalTarget && createPortal(
      <BarraTimelineProMax
        secciones={sec.secciones}
        totalTicksModal={totalTicksModal}
        bpmModal={bpmModal}
        bpmOriginal={cancion?.bpm || 120}
        setBpmModal={setBpmModal}
        onCambiarBpm={onCambiarBpm}
        punchInTickLocal={punch.punchInTickLocal}
        punchOutTickLocal={punch.punchOutTickLocal}
        secuenciaEditada={secuenciaEditada}
        sliderRef={sliderRef}
        isSeekingRef={isSeekingRef}
        tickLocal={tickLocal}
        tiempoAudioActual={tiempoAudioActual}
        duracionAudio={duracionAudio}
        reproduciendoLocal={reproduciendoLocal}
        handleSeek={handleSeek}
        handleReset={handleReset}
        saltarSegundos={saltarSegundos}
        togglePlay={togglePlay}
        resolucion={resolucion}
        seccionNombre={sec.seccionNombre}
        setSeccionNombre={sec.setSeccionNombre}
        seccionTickInicio={sec.seccionTickInicio}
        setSeccionTickInicio={sec.setSeccionTickInicio}
        seccionTickFin={sec.seccionTickFin}
        setSeccionTickFin={sec.setSeccionTickFin}
        seccionMonedas={sec.seccionMonedas}
        setSeccionMonedas={sec.setSeccionMonedas}
        agregarSeccion={sec.agregarSeccion}
        eliminarSeccion={(i) => sec.setSecciones(prev => prev.filter((_, idx) => idx !== i))}
        seccionEditandoIndex={sec.seccionEditandoIndex}
        iniciarEdicionSeccion={sec.iniciarEdicionSeccion}
        cancelarEdicionSeccion={sec.cancelarEdicionSeccion}
      />,
      portalTarget
    )}
    </>
  );
};

export default ModalEditorSecuencia;
