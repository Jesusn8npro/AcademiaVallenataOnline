import { useState, useCallback, useRef, useEffect } from 'react';
import { useLogicaAcordeon } from '../../../Core/hooks/useLogicaAcordeon';
import { useReproductorHero } from '../../../Core/hooks/useReproductorHero';
import { TONALIDADES } from '../../../Core/acordeon/notasAcordeonDiatonico';
import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';
import { ReproductorMP3 } from '../../../Core/audio/ReproductorMP3';
import { ReproductorMP3PreservaTono } from '../../../Core/audio/ReproductorMP3PreservaTono';

// Cualquiera de los dos players: AudioBufferSource (sample-accurate, default) o
// HTMLAudio + preservesPitch (para modo Maestro donde el alumno baja la velocidad
// y el tono debe mantenerse). Ambos tienen la misma API publica.
type AudioFondoPlayer = ReproductorMP3 | ReproductorMP3PreservaTono;
import { scoresHeroService } from '../../../servicios/scoresHeroService';
import { useUsuario } from '../../../contextos/UsuarioContext';
import type {
  CancionHeroConTonalidad,
  DireccionFuelle,
  EstadoJuego,
  ModoPractica,
  ModoAudioSynthesia,
} from '../TiposProMax';
import { ESTADISTICAS_INICIALES, VENTANA_BIEN_MS, VENTANA_PERFECTO_MS, msATicks } from '../TiposProMax';
import type { ResultadoGolpe } from '../TiposProMax';
import { useSynthesiaProMax } from './useSynthesiaProMax';
import { useScoringProMax } from './useScoringProMax';
import { useGrabacionProMax } from './useGrabacionProMax';
import type { Seccion } from '../tiposSecciones';

export type MensajePrueba = {
  texto: string;
  tipo: 'motivacion' | 'error' | 'aviso';
  id: number;
};

export function useLogicaProMax() {
  const { usuario } = useUsuario();
  const [estadoJuego, setEstadoJuego] = useState<EstadoJuego>('seleccion');
  const [cancionSeleccionada, setCancionSeleccionada] = useState<CancionHeroConTonalidad | null>(null);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<Seccion | null>(null);
  const seccionSeleccionadaRef = useRef<Seccion | null>(null);
  useEffect(() => { seccionSeleccionadaRef.current = seccionSeleccionada; }, [seccionSeleccionada]);
  // Counter para forzar recarga del progreso de secciones tras un intento o al volver a selección.
  const [progresoVersion, setProgresoVersion] = useState(0);
  const refrescarProgresoSecciones = useCallback(() => setProgresoVersion(v => v + 1), []);
  const [bpm, setBpm] = useState(120);
  const [cuenta, setCuenta] = useState<number | null>(null);
  const conteoIntervalRef = useRef<any>(null);

  const [maestroSuena, setMaestroSuena] = useState(true);
  const maestroSuenaRef = useRef(true);
  useEffect(() => { maestroSuenaRef.current = maestroSuena; }, [maestroSuena]);

  const [modoAudioSynthesia, setModoAudioSynthesia] = useState<ModoAudioSynthesia>('solo_notas');
  const modoAudioSynthesiaRef = useRef<ModoAudioSynthesia>('solo_notas');
  useEffect(() => { modoAudioSynthesiaRef.current = modoAudioSynthesia; }, [modoAudioSynthesia]);

  const [velocidad, setVelocidad] = useState(100);
  const velocidadRef = useRef(100);
  useEffect(() => { velocidadRef.current = velocidad; }, [velocidad]);

  const [modoPractica, setModoPractica] = useState<ModoPractica>('ninguno');
  const modoPracticaRef = useRef<ModoPractica>('ninguno');
  useEffect(() => { modoPracticaRef.current = modoPractica; }, [modoPractica]);

  const [volumenMusica, setVolumenMusica] = useState(70);
  const [volumenAcordeon, setVolumenAcordeon] = useState(80);
  const [mp3Silenciado, setMp3Silenciado] = useState(false);

  const [modoGuiado, setModoGuiado] = useState(false);
  const modoGuiadoRef = useRef(false);
  useEffect(() => { modoGuiadoRef.current = modoGuiado; }, [modoGuiado]);

  const [botonesActivosMaestro, setBotonesActivosMaestro] = useState<Record<string, any>>({});
  const [direccionMaestro, setDireccionMaestro] = useState<'halar' | 'empujar'>('halar');

  const _bpmCache = useRef(120);
  const cancionPreConfigRef = useRef<CancionHeroConTonalidad | null>(null);

  const estadoJuegoRef = useRef<EstadoJuego>('seleccion');
  const cancionRef = useRef<CancionHeroConTonalidad | null>(null);
  const tickActualRef = useRef<number>(0);
  const notasImpactadasRef = useRef<Set<string>>(new Set());
  const posicionUltimoGolpeRef = useRef<{ x: number; y: number } | null>(null);
  // Reproductor de la pista de fondo (ReproductorMP3 emula API HTMLAudio, comparte AudioContext con las notas → cero drift).
  const audioFondoRef = useRef<AudioFondoPlayer | null>(null);
  const bpmOriginalRef = useRef<number>(120);
  const _onBeatCallbackRef = useRef<((beatIndex: number) => void) | undefined>(undefined);
  const direccionAlumnoRef = useRef<'halar' | 'empujar'>('halar');
  const _reproductoActionsRef = useRef({ alternarPausa: () => { }, buscarTick: (_t: number) => { } });
  const [loopAB, setLoopAB] = useState<{ start: number; end: number; activo: boolean; hasStart: boolean; hasEnd: boolean }>(
    { start: 0, end: 0, activo: false, hasStart: false, hasEnd: false }
  );
  const loopABRef = useRef<{ start: number; end: number; activo: boolean; hasStart: boolean; hasEnd: boolean }>(
    { start: 0, end: 0, activo: false, hasStart: false, hasEnd: false }
  );
  const reproduccionFueIniciada = useRef(false);

  const synthesia = useSynthesiaProMax();
  const scoring = useScoringProMax({ modoPracticaRef });
  const grabacion = useGrabacionProMax({
    bpm,
    cancionRef,
    estadisticasRef: scoring.estadisticasRef,
    modoPracticaRef,
    seccionRef: seccionSeleccionadaRef,
  });

  const {
    notasEsperando, setNotasEsperando, notasEsperandoRef,
    botonesGuiaAlumno, setBotonesGuiaAlumno,
    mensajeMotivacional, setMensajeMotivacional,
    feedbackFuelle, setFeedbackFuelle,
    maestroPermitidoEnSynthesiaRef, limpiarSynthesia,
  } = synthesia;

  const { estadisticas, setEstadisticas, estadisticasRef, efectosVisuales, setEfectosVisuales, registrarResultado } = scoring;

  const {
    grabandoHero, registrarPresionHero, registrarLiberacionHero, secuenciaGrabacion,
    tiempoGrabacionMs, grabacionPendiente, guardandoGrabacion, errorGuardadoGrabacion,
    ultimaGrabacionGuardada, tonalidadGrabacionRef, modoVistaGrabacionRef,
    timbreGrabacionRef, instrumentoGrabacionRef,
    cancelarCapturaActiva, limpiarEstadoGrabaciones, iniciarCaptura,
    prepararGrabacionCompetencia, iniciarGrabacionPracticaLibre, detenerGrabacionPracticaLibre,
    guardarGrabacionPendiente, descartarGrabacionPendiente,
  } = grabacion;

  useEffect(() => {
    motorAudioPro.cargarSonidoEnBanco('metronomo', 'click_fuerte', '/audio/effects/du2.mp3').catch(() => { });
    motorAudioPro.cargarSonidoEnBanco('metronomo', 'click_debil', '/audio/effects/du.mp3').catch(() => { });
  }, []);

  useEffect(() => {
    if (audioFondoRef.current) {
      audioFondoRef.current.volume = mp3Silenciado ? 0 : volumenMusica / 100;
    }
  }, [volumenMusica, mp3Silenciado]);

  useEffect(() => {
    motorAudioPro.activarContexto().then(() => {
      motorAudioPro.setVolumenMaestro(volumenAcordeon / 100);
    });
  }, [volumenAcordeon]);

  useEffect(() => { estadoJuegoRef.current = estadoJuego; }, [estadoJuego]);
  useEffect(() => { cancionRef.current = cancionSeleccionada; }, [cancionSeleccionada]);

  const _golpeHandlerRef = useRef<(idBoton: string) => void>(() => { });

  const _onNotaPresionadaEstable = useCallback((data: { idBoton: string }) => {
    const fuelle: DireccionFuelle = direccionAlumnoRef.current === 'halar' ? 'abriendo' : 'cerrando';
    registrarPresionHero(data.idBoton, fuelle);
    _golpeHandlerRef.current(data.idBoton);
  }, [registrarPresionHero]);

  const _onNotaLiberadaEstable = useCallback((data: { idBoton: string }) => {
    registrarLiberacionHero(data.idBoton);
  }, [registrarLiberacionHero]);

  const logica = useLogicaAcordeon({
    onNotaPresionada: _onNotaPresionadaEstable,
    onNotaLiberada: _onNotaLiberadaEstable,
  });

  useEffect(() => { direccionAlumnoRef.current = logica.direccion; }, [logica.direccion]);

  useEffect(() => { tonalidadGrabacionRef.current = logica.tonalidadSeleccionada; }, [logica.tonalidadSeleccionada, tonalidadGrabacionRef]);
  useEffect(() => { modoVistaGrabacionRef.current = logica.modoVista; }, [logica.modoVista, modoVistaGrabacionRef]);
  useEffect(() => { timbreGrabacionRef.current = (logica.ajustes as any).timbre || null; }, [logica.ajustes, timbreGrabacionRef]);
  useEffect(() => { instrumentoGrabacionRef.current = logica.instrumentoId || null; }, [logica.instrumentoId, instrumentoGrabacionRef]);

  const actualizarBotonMaestro = useCallback((id: string, accion: 'add' | 'remove', instancias?: any[] | null) => {
    setBotonesActivosMaestro(prev => {
      const siguiente = { ...prev };
      if (accion === 'add') { siguiente[id] = instancias ?? true; }
      else { delete siguiente[id]; }
      return siguiente;
    });
  }, []);

  const setDireccionSoloMaestro = useCallback((dir: 'halar' | 'empujar') => {
    setDireccionMaestro(dir);
  }, []);

  const reproducirTonoMaestro = useCallback((id: string, tiempo?: number, duracion?: number) => {
    if (!maestroSuenaRef.current) return null;
    if (
      modoPracticaRef.current === 'synthesia' &&
      modoAudioSynthesiaRef.current === 'solo_notas' &&
      !maestroPermitidoEnSynthesiaRef.current
    ) return null;
    return logica.reproduceTono(id, tiempo, duracion);
  }, [logica.reproduceTono, maestroPermitidoEnSynthesiaRef]);

  const reproducirTonoGuia = useCallback((id: string, tiempo?: number, duracion?: number) => {
    return logica.reproduceTono(id, tiempo, duracion);
  }, [logica.reproduceTono]);

  useEffect(() => {
    if (modoPractica !== 'synthesia') return;
    const maestroActivo = modoAudioSynthesia === 'maestro';
    if (maestroSuenaRef.current !== maestroActivo) {
      maestroSuenaRef.current = maestroActivo;
      setMaestroSuena(maestroActivo);
    }
  }, [modoPractica, modoAudioSynthesia, maestroSuena]);

  const _onBpmAplicado = useCallback((nuevoBpm: number) => {
    if (audioFondoRef.current && bpmOriginalRef.current > 0) {
      audioFondoRef.current.playbackRate = Math.min(4, Math.max(0.1, nuevoBpm / bpmOriginalRef.current));
    }
  }, []);

  const sincronizarAudioFondoEnTick = useCallback((tick: number) => {
    if (!audioFondoRef.current || !cancionRef.current) return;
    const cancion = cancionRef.current;
    const resolucion = cancion.resolucion || 192;
    const bpmOriginal = bpmOriginalRef.current || cancion.bpm || 120;
    const tiempoSegundos = (tick / resolucion) * (60 / bpmOriginal);
    audioFondoRef.current.currentTime = tiempoSegundos;
  }, []);

  const _onBeatEstable = useCallback((beatIndex: number) => {
    _onBeatCallbackRef.current?.(beatIndex);
  }, []);

  useEffect(() => {
    if (!cancionSeleccionada || !(cancionSeleccionada as any).usoMetronomo) {
      _onBeatCallbackRef.current = undefined;
      return;
    }
    const compas = (cancionSeleccionada as any).compas ?? 4;
    _onBeatCallbackRef.current = (beatIndex: number) => {
      const beatEnCompas = beatIndex % compas;
      motorAudioPro.reproducir(
        beatEnCompas === 0 ? 'click_fuerte' : 'click_debil',
        'metronomo',
        beatEnCompas === 0 ? 0.7 : 0.45
      );
    };
  }, [cancionSeleccionada]);

  const actualizarLoopAB = useCallback((next: { start: number; end: number; activo: boolean; hasStart: boolean; hasEnd: boolean }) => {
    loopABRef.current = next;
    setLoopAB(next);
  }, []);

  const _onLoopJumpAplicado = useCallback((startTick: number) => {
    sincronizarAudioFondoEnTick(startTick);
  }, [sincronizarAudioFondoEnTick]);

  const reproductor = useReproductorHero(
    actualizarBotonMaestro,
    setDireccionSoloMaestro,
    reproducirTonoMaestro,
    bpm,
    _onBpmAplicado,
    _onBeatEstable,
    _onLoopJumpAplicado
  );

  useEffect(() => { tickActualRef.current = reproductor.tickActual; }, [reproductor.tickActual]);
  useEffect(() => {
    _reproductoActionsRef.current.alternarPausa = reproductor.alternarPausa;
    _reproductoActionsRef.current.buscarTick = reproductor.buscarTick;
  }, [reproductor.alternarPausa, reproductor.buscarTick]);

  const procesarGolpeAlumno = useCallback((botonId: string) => {
    const cancion = cancionRef.current;
    if (!cancion) return;

    const esModoSynthesia = modoPracticaRef.current === 'synthesia' || (modoPracticaRef.current === 'maestro_solo' && modoGuiadoRef.current);

    if (esModoSynthesia) {
      const esperando = notasEsperandoRef.current;
      if (esperando.length === 0) return;

      const indiceNota = esperando.findIndex(n => n.botonId === botonId);
      if (indiceNota !== -1) {
        const notaEsp = esperando[indiceNota];
        notasImpactadasRef.current.add(`${notaEsp.tick}-${notaEsp.botonId}`);
        const nuevasNotas = [...esperando];
        nuevasNotas.splice(indiceNota, 1);
        notasEsperandoRef.current = nuevasNotas;
        setNotasEsperando(nuevasNotas);
        setBotonesGuiaAlumno(prev => {
          const siguiente = { ...prev };
          delete siguiente[notaEsp.botonId];
          return siguiente;
        });
        registrarResultado('perfecto', posicionUltimoGolpeRef.current);
        setBotonesActivosMaestro(prev => {
          const n = { ...prev };
          delete n[notaEsp.botonId];
          return n;
        });
        if (nuevasNotas.length === 0) {
          if (estadoJuegoRef.current === 'pausado_synthesia') {
            const mensajes = ["¡Excelente!", "¡Perfecto!", "¡Muy bien!", "¡Sigue así!", "¡Vamo' que vamo'!", "¡Eso es!", "¡Qué oído!", "¡Acertaste!"];
            setMensajeMotivacional(mensajes[Math.floor(Math.random() * mensajes.length)]);
            setBotonesGuiaAlumno({});
            maestroPermitidoEnSynthesiaRef.current = false;
            setEstadoJuego('jugando');
            estadoJuegoRef.current = 'jugando';
            _reproductoActionsRef.current.alternarPausa();
            audioFondoRef.current?.play().catch(() => { });
          }
        }
      } else { registrarResultado('fallada', posicionUltimoGolpeRef.current); }
      return;
    }

    const tickActual = tickActualRef.current;
    const resolucion = cancion.resolucion || 192;
    const ventanaTicks = msATicks(VENTANA_BIEN_MS, cancion.bpm, resolucion);
    const seccionAct = seccionSeleccionadaRef.current;
    const rMin = seccionAct ? seccionAct.tickInicio - ventanaTicks : -Infinity;
    const rMax = seccionAct ? seccionAct.tickFin + ventanaTicks : Infinity;
    const candidatas = cancion.secuencia.filter(nota => {
      const clave = `${nota.tick}-${nota.botonId}`;
      return nota.botonId === botonId
        && nota.tick >= rMin && nota.tick <= rMax
        && Math.abs(nota.tick - tickActual) <= ventanaTicks
        && !notasImpactadasRef.current.has(clave);
    });
    if (candidatas.length === 0) { registrarResultado('fallada', null); return; }
    const objetivo = candidatas.reduce((mejor, actual) =>
      Math.abs(actual.tick - tickActual) < Math.abs(mejor.tick - tickActual) ? actual : mejor
    );
    notasImpactadasRef.current.add(`${objetivo.tick}-${objetivo.botonId}`);
    const diferenciaTicks = Math.abs(objetivo.tick - tickActual);
    const ventanaPerfectoTicks = msATicks(VENTANA_PERFECTO_MS, cancion.bpm, resolucion);
    const resultado: ResultadoGolpe = diferenciaTicks <= ventanaPerfectoTicks ? 'perfecto' : 'bien';
    registrarResultado(resultado, posicionUltimoGolpeRef.current);
  }, [notasEsperandoRef, setNotasEsperando, setBotonesGuiaAlumno, maestroPermitidoEnSynthesiaRef, setMensajeMotivacional, registrarResultado]);

  useEffect(() => {
    _golpeHandlerRef.current = (idBoton: string) => {
      const estado = estadoJuegoRef.current;
      const modo = modoPracticaRef.current;
      if (modo === 'maestro_solo' && !modoGuiadoRef.current) return;
      if (estado === 'jugando') { procesarGolpeAlumno(idBoton); return; }
      const esModoGuiado = modo === 'maestro_solo' && modoGuiadoRef.current;
      if (estado === 'pausado_synthesia' && (modo === 'synthesia' || esModoGuiado)) {
        procesarGolpeAlumno(idBoton);
      }
    };
  }, [procesarGolpeAlumno]);

  useEffect(() => {
    const estaActivo = reproductor.reproduciendo || estadoJuego === 'pausado' || estadoJuego === 'pausado_synthesia';
    if (!estaActivo || !cancionSeleccionada) return;
    const tickActual = reproductor.tickActual;
    const resolucion = cancionSeleccionada.resolucion || 192;
    const ventanaTicks = msATicks(VENTANA_BIEN_MS, cancionSeleccionada.bpm, resolucion);
    const modo = modoPracticaRef.current;

    // Sin restringir al rango de la sección, las notas anteriores se marcan en masa como "perdidas" → vida cae a 0.
    const seccionActiva = seccionSeleccionadaRef.current;
    const rangoMin = seccionActiva ? seccionActiva.tickInicio - ventanaTicks : -Infinity;
    const rangoMax = seccionActiva ? seccionActiva.tickFin + ventanaTicks : Infinity;

    for (const nota of cancionSeleccionada.secuencia) {
      if (nota.tick < rangoMin || nota.tick > rangoMax) continue;
      const clave = `${nota.tick}-${nota.botonId}`;
      if (notasImpactadasRef.current.has(clave)) continue;

      if (modo === 'synthesia' || (modo === 'maestro_solo' && modoGuiadoRef.current)) {
        const UMBRAL_ACORDE = 15;

        if (tickActual >= nota.tick && notasEsperandoRef.current.length === 0) {
          const grupoNotas = cancionSeleccionada.secuencia.filter(n =>
            Math.abs(n.tick - nota.tick) <= UMBRAL_ACORDE &&
            n.tick >= rangoMin && n.tick <= rangoMax &&
            !notasImpactadasRef.current.has(`${n.tick}-${n.botonId}`)
          );

          if (grupoNotas.length > 0) {
            const botonesActivosActuales = logica.botonesActivos ?? {};
            const idsEsperados = Array.from(new Set(grupoNotas.map(n => n.botonId)));
            const alumnoYaVaCorrecto = idsEsperados.every(id => Boolean(botonesActivosActuales[id]));

            if (alumnoYaVaCorrecto) {
              grupoNotas.forEach(n => {
                notasImpactadasRef.current.add(`${n.tick}-${n.botonId}`);
                registrarResultado('perfecto', posicionUltimoGolpeRef.current);
              });
              setMensajeMotivacional('Excelente, sigue tocando');
              setFeedbackFuelle('');
              setNotasEsperando([]);
              setBotonesGuiaAlumno({});
              break;
            }

            notasEsperandoRef.current = grupoNotas;
            setNotasEsperando(grupoNotas);
            setBotonesGuiaAlumno(
              grupoNotas.reduce<Record<string, true>>((acc, current) => {
                acc[current.botonId] = true;
                return acc;
              }, {})
            );

            const luces: Record<string, any[]> = {};
            grupoNotas.forEach(n => { luces[n.botonId] = []; });
            setBotonesActivosMaestro(prev => ({ ...prev, ...luces }));

            if (estadoJuegoRef.current === 'jugando') {
              setEstadoJuego('pausado_synthesia');
              estadoJuegoRef.current = 'pausado_synthesia';
              reproductor.alternarPausa();
              audioFondoRef.current?.pause();
              maestroPermitidoEnSynthesiaRef.current = modoAudioSynthesiaRef.current === 'solo_notas';

              const fueAbriendo = nota.fuelle === 'abriendo';
              logica.setDireccion(fueAbriendo ? 'halar' : 'empujar');
              setFeedbackFuelle(fueAbriendo ? 'Jala el fuelle' : 'Empuja el fuelle');
              setMensajeMotivacional('Toca el acorde iluminado');

              if (maestroSuenaRef.current && modoAudioSynthesiaRef.current === 'solo_notas') {
                grupoNotas.forEach(n => { reproducirTonoGuia(n.botonId, 0, 1.2); });
              }

              motorAudioPro.reproducir('click_debil', 'metronomo', 0.3);
            }
          }
          break;
        }
      } else {
        if (tickActual > nota.tick + ventanaTicks) {
          notasImpactadasRef.current.add(clave);
          registrarResultado('perdida', null);
        }
      }
    }
  }, [reproductor.tickActual, estadoJuego]);

  const _setDireccionRef = useRef(logica.setDireccion);
  useEffect(() => { _setDireccionRef.current = logica.setDireccion; }, [logica.setDireccion]);

  useEffect(() => {
    const handleAbandono = () => {
      if (estadoJuegoRef.current === 'jugando' && modoPracticaRef.current === 'ninguno' && cancionRef.current && usuario) {
        const cancion = cancionRef.current;
        const totalNotas = cancion.secuencia.length || 1;
        const notasTocadas = estadisticasRef.current.notasPerfecto + estadisticasRef.current.notasBien + estadisticasRef.current.notasFalladas + estadisticasRef.current.notasPerdidas;
        const seccion = seccionSeleccionadaRef.current;
        scoresHeroService.guardarScoreGame({
          usuario_id: usuario.id,
          cancion_id: cancion.id!,
          puntuacion: estadisticasRef.current.puntos,
          precision_porcentaje: 0,
          notas_totales: totalNotas,
          notas_correctas: estadisticasRef.current.notasPerfecto + estadisticasRef.current.notasBien,
          notas_falladas: estadisticasRef.current.notasFalladas + estadisticasRef.current.notasPerdidas,
          racha_maxima: estadisticasRef.current.rachaMasLarga,
          multiplicador_maximo: estadisticasRef.current.multiplicador,
          modo: 'competencia',
          tonalidad: cancion.tonalidad || 'N/A',
          duracion_ms: 0,
          abandono: true,
          porcentaje_completado: Math.round((notasTocadas / totalNotas) * 100),
          seccion_id: seccion?.id ?? null,
          seccion_nombre: seccion?.nombre ?? null,
        }).catch(() => { });
      }
    };

    const resetFuelle = () => {
      _setDireccionRef.current('halar');
      if (document.visibilityState === 'hidden') handleAbandono();
    };

    const handleBeforeUnload = () => {
      if (estadoJuegoRef.current === 'jugando' && modoPracticaRef.current === 'ninguno') handleAbandono();
    };

    window.addEventListener('blur', resetFuelle);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', resetFuelle);
    return () => {
      window.removeEventListener('blur', resetFuelle);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', resetFuelle);
    };
  }, [usuario, estadisticasRef]);

  useEffect(() => {
    if (estadisticas.vida <= 0 && estadoJuego === 'jugando' && modoPractica === 'ninguno') {
      prepararGrabacionCompetencia();
      reproductor.detenerReproduccion();
      const audio = audioFondoRef.current;
      if (audio) {
        const pasos = 20; const volI = audio.volume; let p = 0;
        const int = setInterval(() => {
          p++;
          audio.volume = Math.max(0, volI * (1 - p / pasos));
          if (p >= pasos) { clearInterval(int); audio.pause(); audioFondoRef.current = null; }
        }, 60);
      }
      setEstadoJuego('gameOver');
    }
  }, [estadisticas.vida, estadoJuego, modoPractica, prepararGrabacionCompetencia, reproductor.detenerReproduccion]);

  useEffect(() => {
    if (reproductor.reproduciendo) { reproduccionFueIniciada.current = true; }
  }, [reproductor.reproduciendo]);

  useEffect(() => {
    if (reproduccionFueIniciada.current && !reproductor.reproduciendo && estadoJuego === 'jugando' && cancionSeleccionada) {
      reproduccionFueIniciada.current = false;
      prepararGrabacionCompetencia();
      const audio = audioFondoRef.current;
      if (audio) {
        const pasos = 30; const volI = audio.volume; let p = 0;
        const int = setInterval(() => {
          p++;
          audio.volume = Math.max(0, volI * (1 - p / pasos));
          if (p >= pasos) { clearInterval(int); audio.pause(); audioFondoRef.current = null; }
        }, 50);
      }
      try { const sfx = new Audio('/audio/effects/success.mp3'); sfx.volume = 0.75; sfx.play().catch(() => { }); } catch (_) { }
      setEstadoJuego('resultados');
    }
  }, [cancionSeleccionada, estadoJuego, prepararGrabacionCompetencia, reproductor.reproduciendo]);

  useEffect(() => {
    return () => {
      cancelarCapturaActiva();
      if (audioFondoRef.current) {
        try { audioFondoRef.current.pause(); } catch (_) {}
        try { audioFondoRef.current.destruir(); } catch (_) {}
        audioFondoRef.current = null;
      }
      reproductor.detenerReproduccion();
      if (conteoIntervalRef.current) { clearInterval(conteoIntervalRef.current); conteoIntervalRef.current = null; }
      motorAudioPro.detenerTodo();
    };
  }, [cancelarCapturaActiva, reproductor.detenerReproduccion]);

  const registrarPosicionGolpe = useCallback((x: number, y: number) => {
    posicionUltimoGolpeRef.current = { x, y };
  }, []);

  const iniciarPracticaLibre = useCallback(() => {
    motorAudioPro.activarContexto();
    cancelarCapturaActiva();
    limpiarEstadoGrabaciones();
    setCancionSeleccionada(null);
    cancionRef.current = null;
    logica.setDireccion('halar');
    setEstadoJuego('practica_libre');
    estadoJuegoRef.current = 'practica_libre' as any;
  }, [cancelarCapturaActiva, limpiarEstadoGrabaciones, logica.setDireccion]);

  const seleccionarCancion = useCallback((cancion: CancionHeroConTonalidad) => {
    cancelarCapturaActiva();
    limpiarEstadoGrabaciones();
    setCancionSeleccionada(cancion);
    cancionRef.current = cancion;
    cancionPreConfigRef.current = cancion;
    setSeccionSeleccionada(null);
    seccionSeleccionadaRef.current = null;
    setVelocidad(100);
    setEstadoJuego('seleccion');
    estadoJuegoRef.current = 'seleccion';
    if (cancion.tonalidad && (TONALIDADES as Record<string, unknown>)[cancion.tonalidad]) {
      logica.setTonalidadSeleccionada(cancion.tonalidad);
    }
  }, [cancelarCapturaActiva, limpiarEstadoGrabaciones, logica.setTonalidadSeleccionada]);

  const seleccionarSeccion = useCallback((seccion: Seccion | null) => {
    setSeccionSeleccionada(seccion);
    seccionSeleccionadaRef.current = seccion;
  }, []);

  const cambiarBpm = useCallback((valor: number | ((prev: number) => number)) => {
    const prev = _bpmCache.current;
    const nuevo = typeof valor === 'function' ? valor(prev) : valor;
    _bpmCache.current = nuevo;
    setBpm(nuevo);
  }, []);

  const iniciarJuego = useCallback(async (cancion: CancionHeroConTonalidad, saltarConteo: boolean = false, modoPracticaForzado?: ModoPractica) => {
    await motorAudioPro.activarContexto();

    // Espera bank de samples (≤2s) — sin esto, primera reproducción tras montar dispara notas con bank vacío.
    try {
      const bancoId = logica.instrumentoId || 'acordeon';
      const idsUnicos = new Set<string>();
      ((cancion as any).secuencia || []).forEach((nota: any) => {
        if (nota?.botonId) idsUnicos.add(nota.botonId);
      });
      const inicio = Date.now();
      const TIMEOUT_MS = 2000;
      while (Date.now() - inicio < TIMEOUT_MS) {
        const banco = (motorAudioPro as any).bancos?.get?.(bancoId);
        if (banco && banco.muestras && banco.muestras.size > 0) {
          // Bank listo: cargar las muestras que falten para esta cancion (idempotente).
          const cargas: Promise<void>[] = [];
          idsUnicos.forEach(id => {
            const rutas = logica.obtenerRutasAudio?.(id) || [];
            rutas.forEach((rRaw: string) => {
              const r = rRaw.startsWith('pitch:') ? rRaw.split('|')[1] : rRaw;
              const rutaFinal = r.startsWith('http') || r.startsWith('/') ? r : `/${r}`;
              cargas.push(motorAudioPro.cargarSonidoEnBanco(bancoId, r, rutaFinal));
            });
          });
          if (cargas.length > 0) await Promise.all(cargas);
          break;
        }
        await new Promise(r => setTimeout(r, 50));
      }
    } catch (_) { /* si la espera falla, seguimos: mejor que bloquear el juego */ }

    cancelarCapturaActiva();
    limpiarEstadoGrabaciones();
    bpmOriginalRef.current = cancionPreConfigRef.current?.bpm ?? cancion.bpm;
    setCancionSeleccionada(cancion);
    _bpmCache.current = cancion.bpm;
    setBpm(cancion.bpm);
    setEstadisticas({ ...ESTADISTICAS_INICIALES });
    setEfectosVisuales([]);
    setBotonesActivosMaestro({});
    notasImpactadasRef.current = new Set();
    limpiarSynthesia();
    actualizarLoopAB({ start: 0, end: 0, activo: false, hasStart: false, hasEnd: false });
    reproductor.setLoopPoints(0, 0, false);
    logica.setDireccion('halar');
    if (cancion.tonalidad && (TONALIDADES as Record<string, unknown>)[cancion.tonalidad]) {
      logica.setTonalidadSeleccionada(cancion.tonalidad);
    }
    const vel = velocidadRef.current;
    const modoActual = modoPracticaForzado || modoPracticaRef.current;

    if (audioFondoRef.current) { try { audioFondoRef.current.pause(); } catch (_) {} try { audioFondoRef.current.destruir(); } catch (_) {} audioFondoRef.current = null; }

    const seccion = seccionSeleccionadaRef.current;
    const resolucion = (cancion as any).resolucion || 192;
    const bpmOriginal = bpmOriginalRef.current || cancion.bpm || 120;
    const rangoTicks = seccion ? { inicio: seccion.tickInicio, fin: seccion.tickFin } : null;
    const offsetSegundos = seccion ? (seccion.tickInicio / resolucion) * (60 / bpmOriginal) : 0;

    // Lead-in para secciones no-intro: MP3 arranca 3s antes del tickInicio. La secuencia de notas se suelta junto.
    const LEADIN_SEGUNDOS_SECCION = 3;
    const tieneLeadIn = !!(seccion && offsetSegundos > 0);
    const offsetSegundosAudio = tieneLeadIn
      ? Math.max(0, offsetSegundos - LEADIN_SEGUNDOS_SECCION)
      : offsetSegundos;

    const urlFondo = (cancion as any).audio_fondo_url || cancion.audioFondoUrl;

    // Modo Maestro baja BPM y necesita preservesPitch (HTMLAudio). Resto: AudioBufferSource (sample-accurate, mismo clock que notas).
    const audioPrecargado: AudioFondoPlayer | null = urlFondo
      ? (modoActual === 'maestro_solo'
          ? new ReproductorMP3PreservaTono(motorAudioPro.contextoAudio)
          : new ReproductorMP3(motorAudioPro.contextoAudio))
      : null;
    if (audioPrecargado) {
      audioPrecargado.volume = mp3Silenciado ? 0 : volumenMusica / 100;
      audioPrecargado.playbackRate = vel / 100;
      audioFondoRef.current = audioPrecargado;
    }

    // Carga upfront del buffer + seek (sin descarga progresiva → cero buffer underruns).
    const audioListo: Promise<void> = audioPrecargado
      ? (async () => {
          try {
            await audioPrecargado.cargar(urlFondo);
            // Posicionar en offsetSegundosAudio (con lead-in restado si es sección no-intro).
            // Sample-accurate: setear currentTime cuando paused solo actualiza startOffset.
            audioPrecargado.currentTime = offsetSegundosAudio;
          } catch (_) {
            // Falla de red: arrancamos igual con currentTime=0; mejor algo que nada.
          }
        })()
      : Promise.resolve();

    // Arranca audio + reloj de ticks alineados. audio.play() tarda 100-300ms en producir sonido real (latencia decoder),
    // así que esperamos el evento 'playing' y arrancamos el RAF con tickInicialOverride = audio.currentTime real.
    const dispararJuegoSincronizado = () => {
      setEstadoJuego('jugando');
      estadoJuegoRef.current = 'jugando';

      // Sin MP3 (modo libre / canción sin audio): arranca el reloj inmediato.
      if (!audioPrecargado) {
        if (modoActual === 'ninguno') {
          iniciarCaptura('competencia', {
            tickInicio: rangoTicks?.inicio || 0,
            bpmOriginal,
          });
        }
        reproductor.reproducirSecuencia(cancion, rangoTicks ? { rangoTicks } : undefined);
        return;
      }

      const factor = (bpmOriginal / 60) * resolucion;
      let arrancado = false;
      let fallbackId: number | undefined;

      // Suelta secuencia anclada al audio (tickInicio absoluto si hay rango, sino 0).
      const soltarSecuencia = () => {
        if (audioFondoRef.current !== audioPrecargado) return;
        if (modoActual === 'ninguno') {
          iniciarCaptura('competencia', {
            tickInicio: rangoTicks?.inicio || 0,
            audioElement: audioPrecargado,
            bpmOriginal,
          });
        }
        const targetTick = rangoTicks ? rangoTicks.inicio : 0;
        const audioTickPos = Math.max(0, Math.floor(audioPrecargado.currentTime * factor));
        const tickInicialReal = rangoTicks
          ? audioTickPos
          : (audioTickPos < 64 ? targetTick : audioTickPos);
        reproductor.reproducirSecuencia(cancion, {
          rangoTicks: rangoTicks ?? null,
          tickInicialOverride: tickInicialReal,
        });
        reproductor.setAudioSync(audioPrecargado, bpmOriginal);
      };

      const arrancarTickClock = () => {
        if (arrancado) return;
        arrancado = true;
        if (fallbackId !== undefined) window.clearTimeout(fallbackId);
        audioPrecargado.removeEventListener('playing', arrancarTickClock);
        // Si el usuario canceló/reinició antes de 'playing', audioFondoRef ya apunta a otro audio — no interferir.
        if (audioFondoRef.current !== audioPrecargado) return;
        // Suelta la secuencia incluso durante el lead-in: el alumno ve las notas acercándose 3s antes (preview visual).
        // El maestro NO dispara tonos durante el lead-in (gate en useReproductorHero por rangoSeccion.inicio).
        soltarSecuencia();
      };

      audioPrecargado.addEventListener('playing', arrancarTickClock);
      // Fallback 1500ms: si 'playing' no llega (audio dañado / browser raro), arrancar igual.
      fallbackId = window.setTimeout(() => arrancarTickClock(), 1500);
      // Si play() es rechazado (autoplay policy), arrancar para que el alumno pueda jugar las notas.
      audioPrecargado.play().catch(() => arrancarTickClock());
    };

    if (modoActual === 'synthesia') {
      const maestroActivo = modoAudioSynthesiaRef.current === 'maestro';
      maestroSuenaRef.current = maestroActivo;
      setMaestroSuena(maestroActivo);
    }

    if (modoActual !== 'ninguno' || saltarConteo) {
      setCuenta(null);
      audioListo.then(() => dispararJuegoSincronizado());
      return;
    }

    // Competencia con conteo de 3s: el audio se precarga y posiciona durante el conteo, al final arrancan juntos.
    if (conteoIntervalRef.current) clearInterval(conteoIntervalRef.current);
    setCuenta(3);
    setEstadoJuego('contando');
    estadoJuegoRef.current = 'contando';
    conteoIntervalRef.current = setInterval(() => {
      setCuenta(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(conteoIntervalRef.current);
          conteoIntervalRef.current = null;
          setCuenta(null);
          audioListo.then(() => dispararJuegoSincronizado());
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [actualizarLoopAB, cancelarCapturaActiva, iniciarCaptura, limpiarEstadoGrabaciones, limpiarSynthesia, logica.setTonalidadSeleccionada, mp3Silenciado, reproductor.reproducirSecuencia, reproductor.setLoopPoints, setEstadisticas, setEfectosVisuales, volumenMusica]);

  const confirmarYJugar = useCallback(() => {
    const cancion = cancionPreConfigRef.current;
    if (!cancion) return;
    iniciarJuego({ ...cancion, bpm: Math.round(cancion.bpm * (velocidadRef.current / 100)) });
  }, [iniciarJuego]);

  const iniciarConteo = useCallback(() => {
    const cancion = cancionPreConfigRef.current || cancionSeleccionada;
    if (cancion) iniciarJuego(cancion, false, modoPractica);
  }, [cancionSeleccionada, iniciarJuego, modoPractica]);

  const marcarLoopInicio = useCallback(() => {
    const inicio = Math.max(0, Math.floor(tickActualRef.current));
    reproductor.setLoopPoints(0, 0, false);
    actualizarLoopAB({ start: inicio, end: 0, activo: false, hasStart: true, hasEnd: false });
  }, [actualizarLoopAB, reproductor.setLoopPoints]);

  const marcarLoopFin = useCallback(() => {
    const finActual = Math.max(0, Math.floor(tickActualRef.current));
    const previo = loopABRef.current;
    const inicio = previo.hasStart ? previo.start : Math.max(0, finActual - 192);
    const fin = Math.max(finActual, inicio + 48);
    reproductor.setLoopPoints(inicio, fin, false);
    actualizarLoopAB({ start: inicio, end: fin, activo: false, hasStart: true, hasEnd: true });
  }, [actualizarLoopAB, reproductor.setLoopPoints]);

  const alternarLoopAB = useCallback(() => {
    const previo = loopABRef.current;
    const rangoValido = previo.hasStart && previo.hasEnd && previo.end > previo.start + 24;
    if (!rangoValido) return;
    const siguiente = { ...previo, activo: !previo.activo };
    reproductor.setLoopPoints(siguiente.start, siguiente.end, siguiente.activo);
    actualizarLoopAB(siguiente);
    if (siguiente.activo && (tickActualRef.current < siguiente.start || tickActualRef.current > siguiente.end)) {
      reproductor.buscarTick(siguiente.start);
      sincronizarAudioFondoEnTick(siguiente.start);
    }
  }, [actualizarLoopAB, reproductor.buscarTick, reproductor.setLoopPoints, sincronizarAudioFondoEnTick]);

  const limpiarLoopAB = useCallback(() => {
    reproductor.setLoopPoints(0, 0, false);
    actualizarLoopAB({ start: 0, end: 0, activo: false, hasStart: false, hasEnd: false });
  }, [actualizarLoopAB, reproductor.setLoopPoints]);

  const actualizarLoopInicioTick = useCallback((startTick: number) => {
    const previo = loopABRef.current;
    const inicio = Math.max(0, Math.floor(startTick));
    if (!previo.hasEnd) {
      reproductor.setLoopPoints(0, 0, false);
      actualizarLoopAB({ start: inicio, end: 0, activo: false, hasStart: true, hasEnd: false });
      return;
    }
    const fin = Math.max(previo.end, inicio + 24);
    const siguiente = { start: inicio, end: fin, activo: previo.activo && fin > inicio + 24, hasStart: true, hasEnd: true };
    reproductor.setLoopPoints(siguiente.start, siguiente.end, siguiente.activo);
    actualizarLoopAB(siguiente);
  }, [actualizarLoopAB, reproductor.setLoopPoints]);

  const actualizarLoopFinTick = useCallback((endTick: number) => {
    const previo = loopABRef.current;
    const fin = Math.max(0, Math.floor(endTick));
    const inicioBase = previo.hasStart ? previo.start : Math.max(0, fin - 192);
    const inicio = Math.min(inicioBase, Math.max(0, fin - 24));
    const siguiente = { start: inicio, end: Math.max(fin, inicio + 24), activo: previo.activo && fin > inicio + 24, hasStart: true, hasEnd: true };
    reproductor.setLoopPoints(siguiente.start, siguiente.end, siguiente.activo);
    actualizarLoopAB(siguiente);
  }, [actualizarLoopAB, reproductor.setLoopPoints]);

  const alternarPausaReproduccion = useCallback(() => {
    // Guard por `reproduciendo` (no por estadoJuego): EstudioAdmin queda en estadoJuego='seleccion' y un check
    // previo por estado rompía el pause ahí. En EstudioAdmin el audio lo gestiona useAudioFondoPracticaLibre.
    if (!reproductor.reproduciendo) return;
    const vaAPausar = !reproductor.pausado;
    reproductor.alternarPausa();
    if (audioFondoRef.current) {
      if (vaAPausar) audioFondoRef.current.pause();
      else audioFondoRef.current.play().catch(() => { });
    }
  }, [reproductor.alternarPausa, reproductor.pausado, reproductor.reproduciendo]);

  const detenerJuego = useCallback(() => {
    if (modoPracticaRef.current === 'ninguno') {
      prepararGrabacionCompetencia();
    } else {
      cancelarCapturaActiva();
    }
    reproductor.detenerReproduccion();
    reproductor.setLoopPoints(0, 0, false);
    actualizarLoopAB({ start: 0, end: 0, activo: false, hasStart: false, hasEnd: false });
    audioFondoRef.current?.pause();
    audioFondoRef.current = null;
    setEstadoJuego('resultados');
  }, [actualizarLoopAB, cancelarCapturaActiva, prepararGrabacionCompetencia, reproductor.detenerReproduccion, reproductor.setLoopPoints]);

  const alternarPausa = useCallback(() => {
    const estaJugando = estadoJuegoRef.current === 'jugando';
    if (estaJugando) { audioFondoRef.current?.pause(); }
    else { audioFondoRef.current?.play().catch(() => { }); }
    reproductor.alternarPausa();
    setEstadoJuego(prev => prev === 'pausado' ? 'jugando' : 'pausado');
  }, [reproductor.alternarPausa]);

  const pausarJuego = useCallback(() => {
    if (estadoJuegoRef.current === 'jugando') {
      audioFondoRef.current?.pause();
      if (!reproductor.pausado) reproductor.alternarPausa();
      setEstadoJuego('pausado');
      estadoJuegoRef.current = 'pausado';
    }
  }, [reproductor.alternarPausa, reproductor.pausado]);

  const reanudarConConteo = useCallback(() => {
    if (estadoJuegoRef.current !== 'pausado') return;
    if (conteoIntervalRef.current) clearInterval(conteoIntervalRef.current);
    setCuenta(3);
    setEstadoJuego('contando');
    estadoJuegoRef.current = 'contando' as any;
    conteoIntervalRef.current = setInterval(() => {
      setCuenta(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(conteoIntervalRef.current);
          conteoIntervalRef.current = null;
          setCuenta(null);
          reproductor.alternarPausa();
          audioFondoRef.current?.play().catch(() => { });
          setEstadoJuego('jugando');
          estadoJuegoRef.current = 'jugando';
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [reproductor.alternarPausa]);

  const volverASeleccion = useCallback(() => {
    cancelarCapturaActiva();
    limpiarEstadoGrabaciones();
    reproductor.detenerReproduccion();
    reproductor.setLoopPoints(0, 0, false);
    audioFondoRef.current?.pause();
    audioFondoRef.current = null;
    setCancionSeleccionada(null);
    setSeccionSeleccionada(null);
    seccionSeleccionadaRef.current = null;
    setEstadoJuego('seleccion');
    estadoJuegoRef.current = 'seleccion';
    setEstadisticas({ ...ESTADISTICAS_INICIALES });
    setEfectosVisuales([]);
    notasImpactadasRef.current = new Set();
    limpiarSynthesia();
    actualizarLoopAB({ start: 0, end: 0, activo: false, hasStart: false, hasEnd: false });
    if (conteoIntervalRef.current) { clearInterval(conteoIntervalRef.current); conteoIntervalRef.current = null; }
    setCuenta(null);
    logica.setDireccion('halar');
    // Recarga progreso de secciones: la sección recién completada debe aparecer desbloqueada al volver al pre-juego.
    refrescarProgresoSecciones();
  }, [actualizarLoopAB, cancelarCapturaActiva, limpiarEstadoGrabaciones, limpiarSynthesia, reproductor.detenerReproduccion, reproductor.setLoopPoints, logica.setDireccion, setEstadisticas, setEfectosVisuales, refrescarProgresoSecciones]);

  const reset = useCallback(() => {
    setEstadisticas({ ...ESTADISTICAS_INICIALES });
    estadisticasRef.current = { ...ESTADISTICAS_INICIALES };
    setEstadoJuego('seleccion');
    estadoJuegoRef.current = 'seleccion';
    notasImpactadasRef.current = new Set();
    limpiarSynthesia();
    setEfectosVisuales([]);
    setCuenta(null);
    motorAudioPro.detenerTodo();
    if (typeof (motorAudioPro as any).reset === 'function') (motorAudioPro as any).reset();
    if (typeof (motorAudioPro as any).stop === 'function') (motorAudioPro as any).stop();
    reproductor.detenerReproduccion();
    reproductor.setLoopPoints(0, 0, false);
    actualizarLoopAB({ start: 0, end: 0, activo: false, hasStart: false, hasEnd: false });
    if (audioFondoRef.current) {
      try { audioFondoRef.current.pause(); } catch (_) {}
      try { audioFondoRef.current.destruir(); } catch (_) {}
      audioFondoRef.current = null;
    }
    cancelarCapturaActiva();
    limpiarEstadoGrabaciones();
  }, [actualizarLoopAB, cancelarCapturaActiva, estadisticasRef, limpiarEstadoGrabaciones, limpiarSynthesia, reproductor, setEstadisticas, setEfectosVisuales]);

  const reiniciarDesdeGameOver = useCallback((cancion: CancionHeroConTonalidad) => {
    cancelarCapturaActiva();
    limpiarEstadoGrabaciones();
    setEstadoJuego('seleccion');
    setEstadisticas({ ...ESTADISTICAS_INICIALES });
    setEfectosVisuales([]);
    notasImpactadasRef.current = new Set();
    setTimeout(() => iniciarJuego(cancion), 50);
  }, [cancelarCapturaActiva, iniciarJuego, limpiarEstadoGrabaciones, setEstadisticas, setEfectosVisuales]);

  return {
    estadoJuego,
    setEstadoJuego,
    cancionSeleccionada,
    seccionSeleccionada,
    seleccionarSeccion,
    progresoVersion,
    refrescarProgresoSecciones,
    bpm,
    cambiarBpm,
    estadisticas,
    efectosVisuales,
    cuenta,
    maestroSuena,
    setMaestroSuena,
    velocidad,
    setVelocidad,
    modoPractica,
    setModoPractica,
    modoGuiado,
    setModoGuiado,
    volumenMusica,
    setVolumenMusica,
    mp3Silenciado,
    setMp3Silenciado,
    volumenAcordeon,
    setVolumenAcordeon,
    modoAudioSynthesia,
    setModoAudioSynthesia,
    notasEsperando,
    botonesGuiaAlumno,
    botonesActivosMaestro,
    direccionMaestro,
    logica,
    tickActual: reproductor.tickActual,
    totalTicks: reproductor.totalTicks,
    reproduciendo: reproductor.reproduciendo,
    pausado: reproductor.pausado,
    secuencia: reproductor.secuencia,
    secuenciaGrabacion,
    seleccionarCancion,
    confirmarYJugar,
    iniciarJuego,
    detenerJuego,
    alternarPausa,
    alternarPausaReproduccion,
    detenerReproduccion: () => reproductor.detenerReproduccion(),
    pausarJuego,
    reanudarConConteo,
    volverASeleccion,
    reiniciarDesdeGameOver,
    reset,
    registrarPosicionGolpe,
    iniciarConteo,
    loopAB,
    marcarLoopInicio,
    marcarLoopFin,
    actualizarLoopInicioTick,
    actualizarLoopFinTick,
    alternarLoopAB,
    limpiarLoopAB,
    buscarTick: (tick: number) => {
      reproductor.buscarTick(tick);
      sincronizarAudioFondoEnTick(tick);
    },
    iniciarPracticaLibre,
    reproducirSecuencia: reproductor.reproducirSecuencia,
    setAudioSync: reproductor.setAudioSync,
    arrancarReproduccionAnclada: reproductor.arrancarReproduccionAnclada,
    grabaciones: {
      grabando: grabandoHero,
      tiempoGrabacionMs,
      guardando: guardandoGrabacion,
      error: errorGuardadoGrabacion,
      mostrarGuardadoResultado: grabacion.grabacionPendiente?.tipo === 'competencia',
      mostrarModalGuardarPractica: grabacion.grabacionPendiente?.tipo === 'practica_libre',
      tituloSugerido: grabacionPendiente?.tituloSugerido || '',
      resumenPendiente: grabacionPendiente ? {
        tipo: grabacionPendiente.tipo,
        duracionMs: grabacionPendiente.duracionMs,
        bpm: grabacionPendiente.bpm,
        tonalidad: grabacionPendiente.tonalidad,
        notas: grabacionPendiente.secuencia.length,
      } : null,
      ultimaGuardada: ultimaGrabacionGuardada,
      iniciarGrabacionPracticaLibre,
      detenerGrabacionPracticaLibre,
      guardarPendiente: guardarGrabacionPendiente,
      descartarPendiente: descartarGrabacionPendiente,
    },
    notasImpactadas: notasImpactadasRef.current,
    mensajeMotivacional,
    feedbackFuelle,
  };
}

export { useCancionesProMax } from './useCancionesProMax';