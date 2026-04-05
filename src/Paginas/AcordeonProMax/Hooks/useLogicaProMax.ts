/**
 * ACORDEÓN PRO MAX — Hook Principal de Lógica (Stand-alone)
 * ─────────────────────────────────────────────────────
 * Motor central que gestiona la experiencia Pro Max sin dependencias de la carpeta Hero.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLogicaAcordeon } from '../../SimuladorDeAcordeon/Hooks/useLogicaAcordeon';
import { useGrabadorHero } from '../../SimuladorDeAcordeon/Hooks/useGrabadorHero';
import { useReproductorHero } from '../../SimuladorDeAcordeon/Hooks/useReproductorHero';
import { TONALIDADES } from '../../SimuladorDeAcordeon/notasAcordeonDiatonico';
import { motorAudioPro } from '../../SimuladorDeAcordeon/AudioEnginePro';
import { guardarGrabacion } from '../../../servicios/grabacionesHeroService';
import { scoresHeroService } from '../../../servicios/scoresHeroService';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { obtenerSnapshotMetadataPracticaLibre } from '../PracticaLibre/Servicios/servicioPreferenciasPracticaLibre';
import type { ModoVista } from '../../SimuladorDeAcordeon/TiposAcordeon';
import type {
  CancionHeroConTonalidad,
  DireccionFuelle,
  EstadisticasPartida,
  EstadoJuego,
  ModoPractica,
  ModoAudioSynthesia,
  ResultadoGolpe,
  EfectoGolpe,
  NotaHero,
} from '../TiposProMax';
import {
  VENTANA_PERFECTO_MS,
  VENTANA_BIEN_MS,
  PUNTOS_PERFECTO,
  PUNTOS_BIEN,
  RACHA_PARA_MULTIPLICADOR,
  MULTIPLICADOR_MAXIMO,
  ESTADISTICAS_INICIALES,
  DANO_FALLADA,
  DANO_PERDIDA,
  calcularPrecision,
  msATicks,
} from '../TiposProMax';

export type MensajePrueba = {
  texto: string;
  tipo: 'motivacion' | 'error' | 'aviso';
  id: number;
};

type TipoGrabacionPendiente = 'competencia' | 'practica_libre';

interface GrabacionPendienteProMax {
  tipo: TipoGrabacionPendiente;
  tituloSugerido: string;
  secuencia: NotaHero[];
  tickFinal: number;
  duracionMs: number;
  cancionId: string | null;
  bpm: number;
  resolucion: number;
  tonalidad: string | null;
  precisionPorcentaje: number | null;
  puntuacion: number | null;
  notasTotales: number | null;
  notasCorrectas: number | null;
  metadata: Record<string, any>;
}

interface GrabacionGuardadaProMax {
  id: string;
  tipo: TipoGrabacionPendiente;
  titulo: string;
}

function convertirDireccionAFuelle(direccion: 'halar' | 'empujar'): DireccionFuelle {
  return direccion === 'halar' ? 'abriendo' : 'cerrando';
}

export function useLogicaProMax() {
  const { usuario } = useUsuario();
  const [estadoJuego, setEstadoJuego] = useState<EstadoJuego>('seleccion');
  const [cancionSeleccionada, setCancionSeleccionada] = useState<CancionHeroConTonalidad | null>(null);
  const [bpm, setBpm] = useState(120);
  const [estadisticas, setEstadisticas] = useState<EstadisticasPartida>({ ...ESTADISTICAS_INICIALES });
  const [efectosVisuales, setEfectosVisuales] = useState<EfectoGolpe[]>([]);
  const [cuenta, setCuenta] = useState<number | null>(null);
  const conteoIntervalRef = useRef<any>(null);

  const [maestroSuena, setMaestroSuena] = useState(true);
  const maestroSuenaRef = useRef(true);
  useEffect(() => { maestroSuenaRef.current = maestroSuena; }, [maestroSuena]);

  const [modoAudioSynthesia, setModoAudioSynthesia] = useState<ModoAudioSynthesia>('solo_notas');
  const modoAudioSynthesiaRef = useRef<ModoAudioSynthesia>('solo_notas');
  useEffect(() => { modoAudioSynthesiaRef.current = modoAudioSynthesia; }, [modoAudioSynthesia]);
  const maestroPermitidoEnSynthesiaRef = useRef(false);

  const [velocidad, setVelocidad] = useState(100);
  const velocidadRef = useRef(100);
  useEffect(() => { velocidadRef.current = velocidad; }, [velocidad]);

  const [modoPractica, setModoPractica] = useState<ModoPractica>('ninguno');
  const modoPracticaRef = useRef<ModoPractica>('ninguno');
  useEffect(() => { modoPracticaRef.current = modoPractica; }, [modoPractica]);

  // 🔊 CONTROL DE VOLUMEN (NUEVO)
  const [volumenMusica, setVolumenMusica] = useState(70);
  const [volumenAcordeon, setVolumenAcordeon] = useState(80);
  const [mp3Silenciado, setMp3Silenciado] = useState(false);

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

  const [modoGuiado, setModoGuiado] = useState(false);
  const modoGuiadoRef = useRef(false);
  useEffect(() => { modoGuiadoRef.current = modoGuiado; }, [modoGuiado]);

  const notasEsperandoRef = useRef<NotaHero[]>([]);
  const [notasEsperando, setNotasEsperando] = useState<NotaHero[]>([]);
  const [botonesGuiaAlumno, setBotonesGuiaAlumno] = useState<Record<string, true>>({});

  const [mensajeMotivacional, setMensajeMotivacional] = useState('¡Prepárate para tocar!');
  const [feedbackFuelle, setFeedbackFuelle] = useState('');

  const _bpmCache = useRef(120);
  const cancionPreConfigRef = useRef<CancionHeroConTonalidad | null>(null);
  const [botonesActivosMaestro, setBotonesActivosMaestro] = useState<Record<string, any>>({});
  const [direccionMaestro, setDireccionMaestro] = useState<'halar' | 'empujar'>('halar');

  const estadoJuegoRef = useRef<EstadoJuego>('seleccion');
  const cancionRef = useRef<CancionHeroConTonalidad | null>(null);
  const tickActualRef = useRef<number>(0);
  const notasImpactadasRef = useRef<Set<string>>(new Set());
  const posicionUltimoGolpeRef = useRef<{ x: number; y: number } | null>(null);
  const audioFondoRef = useRef<HTMLAudioElement | null>(null);
  const bpmOriginalRef = useRef<number>(120);
  const _onBeatCallbackRef = useRef<((beatIndex: number) => void) | undefined>(undefined);
  const estadisticasRef = useRef<EstadisticasPartida>({ ...ESTADISTICAS_INICIALES });
  const direccionAlumnoRef = useRef<'halar' | 'empujar'>('halar');

  const grabador = useGrabadorHero(bpm);
  const grabandoHero = grabador.grabando;
  const iniciarGrabacionHero = grabador.iniciarGrabacion;
  const detenerGrabacionHero = grabador.detenerGrabacion;
  const registrarPresionHero = grabador.registrarPresion;
  const registrarLiberacionHero = grabador.registrarLiberacion;
  const grabandoHeroRef = useRef(grabandoHero);
  const iniciarGrabacionHeroRef = useRef(iniciarGrabacionHero);
  const detenerGrabacionHeroRef = useRef(detenerGrabacionHero);
  const [grabacionPendiente, setGrabacionPendiente] = useState<GrabacionPendienteProMax | null>(null);
  const grabacionPendienteRef = useRef<GrabacionPendienteProMax | null>(null);
  const [guardandoGrabacion, setGuardandoGrabacion] = useState(false);
  const [errorGuardadoGrabacion, setErrorGuardadoGrabacion] = useState<string | null>(null);
  const [ultimaGrabacionGuardada, setUltimaGrabacionGuardada] = useState<GrabacionGuardadaProMax | null>(null);
  const [tiempoGrabacionMs, setTiempoGrabacionMs] = useState(0);
  const inicioCronometroGrabacionRef = useRef<number | null>(null);
  const modoGrabacionActivaRef = useRef<TipoGrabacionPendiente | null>(null);
  const tonalidadGrabacionRef = useRef<string | null>(null);
  const modoVistaGrabacionRef = useRef<ModoVista>('notas');
  const timbreGrabacionRef = useRef<string | null>(null);
  const instrumentoGrabacionRef = useRef<string | null>(null);

  const _reproductoActionsRef = useRef({
    alternarPausa: () => {},
    buscarTick: (_t: number) => {},
  });

  useEffect(() => {
    motorAudioPro.cargarSonidoEnBanco('metronomo', 'click_fuerte', '/audio/effects/du2.mp3').catch(() => {});
    motorAudioPro.cargarSonidoEnBanco('metronomo', 'click_debil',  '/audio/effects/du.mp3').catch(() => {});
  }, []);

  useEffect(() => { estadoJuegoRef.current = estadoJuego; }, [estadoJuego]);
  useEffect(() => { cancionRef.current = cancionSeleccionada; }, [cancionSeleccionada]);
  useEffect(() => { estadisticasRef.current = estadisticas; }, [estadisticas]);
  useEffect(() => { grabacionPendienteRef.current = grabacionPendiente; }, [grabacionPendiente]);
  useEffect(() => { grabandoHeroRef.current = grabandoHero; }, [grabandoHero]);
  useEffect(() => { iniciarGrabacionHeroRef.current = iniciarGrabacionHero; }, [iniciarGrabacionHero]);
  useEffect(() => { detenerGrabacionHeroRef.current = detenerGrabacionHero; }, [detenerGrabacionHero]);

  useEffect(() => {
    if (!grabandoHero || inicioCronometroGrabacionRef.current === null) {
      if (!grabandoHero) {
        setTiempoGrabacionMs(0);
      }
      return;
    }

    const actualizarCronometro = () => {
      if (inicioCronometroGrabacionRef.current !== null) {
        setTiempoGrabacionMs(Date.now() - inicioCronometroGrabacionRef.current);
      }
    };

    actualizarCronometro();
    const intervalo = window.setInterval(actualizarCronometro, 250);
    return () => window.clearInterval(intervalo);
  }, [grabandoHero]);

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

  const [loopAB, setLoopAB] = useState<{ start: number; end: number; activo: boolean; hasStart: boolean; hasEnd: boolean }>({ start: 0, end: 0, activo: false, hasStart: false, hasEnd: false });
  const loopABRef = useRef<{ start: number; end: number; activo: boolean; hasStart: boolean; hasEnd: boolean }>({ start: 0, end: 0, activo: false, hasStart: false, hasEnd: false });
  const totalTicksRef = useRef(0);
  const actualizarLoopAB = useCallback((next: { start: number; end: number; activo: boolean; hasStart: boolean; hasEnd: boolean }) => {
    loopABRef.current = next;
    setLoopAB(next);
  }, []);

  const _onLoopJumpAplicado = useCallback((startTick: number) => {
    sincronizarAudioFondoEnTick(startTick);
  }, [sincronizarAudioFondoEnTick]);

  const cancelarCapturaActiva = useCallback(() => {
    if (grabandoHeroRef.current) {
      detenerGrabacionHeroRef.current();
    }

    modoGrabacionActivaRef.current = null;
    inicioCronometroGrabacionRef.current = null;
    setTiempoGrabacionMs(0);
  }, []);

  const limpiarEstadoGrabaciones = useCallback((limpiarUltimaGrabacion: boolean = true) => {
    setGrabacionPendiente(null);
    setErrorGuardadoGrabacion(null);
    if (limpiarUltimaGrabacion) {
      setUltimaGrabacionGuardada(null);
    }
  }, []);

  const iniciarCaptura = useCallback((tipo: TipoGrabacionPendiente) => {
    limpiarEstadoGrabaciones();
    inicioCronometroGrabacionRef.current = Date.now();
    setTiempoGrabacionMs(0);
    modoGrabacionActivaRef.current = tipo;
    iniciarGrabacionHeroRef.current();
  }, [limpiarEstadoGrabaciones]);

  const finalizarCapturaActiva = useCallback(() => {
    if (!grabandoHeroRef.current) return null;

    const captura = detenerGrabacionHeroRef.current();
    const tipo = modoGrabacionActivaRef.current;
    const duracionMsPorTicks = Math.round(
      (captura.tickFinal / Math.max(1, captura.resolucion)) * (60_000 / Math.max(1, captura.bpm))
    );

    modoGrabacionActivaRef.current = null;
    inicioCronometroGrabacionRef.current = null;
    setTiempoGrabacionMs(0);

    return {
      ...captura,
      tipo,
      duracionMs: Math.max(duracionMsPorTicks, 0),
    };
  }, []);

  const prepararGrabacionCompetencia = useCallback(() => {
    const captura = finalizarCapturaActiva();
    const cancion = cancionRef.current;

    if (!captura || captura.tipo !== 'competencia' || !cancion) return;

    const stats = estadisticasRef.current;
    const precision = calcularPrecision(
      stats.notasPerfecto,
      stats.notasBien,
      stats.notasFalladas,
      stats.notasPerdidas
    );

    if (precision < 60 || captura.secuencia.length === 0) {
      setGrabacionPendiente(null);
      return;
    }

    const notasTotales = stats.notasPerfecto + stats.notasBien + stats.notasFalladas + stats.notasPerdidas;
    const notasCorrectas = stats.notasPerfecto + stats.notasBien;

    setGrabacionPendiente({
      tipo: 'competencia',
      tituloSugerido: `Mi mejor intento en ${cancion.titulo}`,
      secuencia: captura.secuencia,
      tickFinal: captura.tickFinal,
      duracionMs: captura.duracionMs,
      cancionId: cancion.id || null,
      bpm: captura.bpm || cancion.bpm,
      resolucion: captura.resolucion || cancion.resolucion || 192,
      tonalidad: cancion.tonalidad || tonalidadGrabacionRef.current || null,
      precisionPorcentaje: precision,
      puntuacion: stats.puntos,
      notasTotales,
      notasCorrectas,
      metadata: {
        origen: 'pro_max',
        cancion_titulo: cancion.titulo,
        cancion_autor: cancion.autor,
        bpm_original: cancion.bpm,
        slug: cancion.slug || null,
        audio_fondo_url: (cancion as any).audio_fondo_url || cancion.audioFondoUrl || null,
        modo_practica: modoPracticaRef.current,
        racha_maxima: stats.rachaMasLarga,
      },
    });
    setErrorGuardadoGrabacion(null);
  }, [finalizarCapturaActiva]);

  const iniciarGrabacionPracticaLibre = useCallback(async () => {
    await motorAudioPro.activarContexto();
    iniciarCaptura('practica_libre');
  }, [iniciarCaptura]);

  const detenerGrabacionPracticaLibre = useCallback(() => {
    const captura = finalizarCapturaActiva();

    if (!captura || captura.tipo !== 'practica_libre') return;

    if (captura.secuencia.length === 0) {
      setErrorGuardadoGrabacion('Toca al menos una nota antes de guardar la practica.');
      return;
    }

    const tonalidadActual = tonalidadGrabacionRef.current || null;
    const snapshotPracticaLibre = obtenerSnapshotMetadataPracticaLibre(tonalidadActual || 'ADG');

    setGrabacionPendiente({
      tipo: 'practica_libre',
      tituloSugerido: `Practica libre ${tonalidadGrabacionRef.current || 'ADG'}`,
      secuencia: captura.secuencia,
      tickFinal: captura.tickFinal,
      duracionMs: captura.duracionMs,
      cancionId: null,
      bpm: captura.bpm || bpm,
      resolucion: captura.resolucion || 192,
      tonalidad: tonalidadGrabacionRef.current || null,
      precisionPorcentaje: null,
      puntuacion: null,
      notasTotales: captura.secuencia.length,
      notasCorrectas: null,
      metadata: {
        origen: 'pro_max',
        vista: modoVistaGrabacionRef.current,
        timbre: timbreGrabacionRef.current,
        instrumento_id: instrumentoGrabacionRef.current,
        modelo_visual_id: snapshotPracticaLibre.modelo_visual_id,
        pista_id: snapshotPracticaLibre.pista_id,
        pista_nombre: snapshotPracticaLibre.pista_nombre,
        audio_fondo_url: snapshotPracticaLibre.pista_url,
        capas_activas: snapshotPracticaLibre.capas_activas,
        efectos: snapshotPracticaLibre.efectos,
        practica_libre: snapshotPracticaLibre,
      },
    });
    setErrorGuardadoGrabacion(null);
  }, [bpm, finalizarCapturaActiva]);

  const descartarGrabacionPendiente = useCallback(() => {
    setGrabacionPendiente(null);
    setErrorGuardadoGrabacion(null);
  }, []);

  const guardarGrabacionPendiente = useCallback(async (titulo: string, descripcion: string) => {
    const pendiente = grabacionPendienteRef.current;

    if (!pendiente) return false;

    const tituloLimpio = titulo.trim();
    if (!tituloLimpio) {
      setErrorGuardadoGrabacion('Debes escribir un titulo para guardar la grabacion.');
      return false;
    }

    setGuardandoGrabacion(true);
    setErrorGuardadoGrabacion(null);

    try {
      const grabacion = await guardarGrabacion({
        cancion_id: pendiente.cancionId,
        modo: pendiente.tipo,
        titulo: tituloLimpio,
        descripcion: descripcion.trim(),
        secuencia_grabada: pendiente.secuencia,
        bpm: pendiente.bpm,
        resolucion: pendiente.resolucion,
        tonalidad: pendiente.tonalidad,
        duracion_ms: pendiente.duracionMs,
        precision_porcentaje: pendiente.precisionPorcentaje,
        puntuacion: pendiente.puntuacion,
        notas_totales: pendiente.notasTotales,
        notas_correctas: pendiente.notasCorrectas,
        metadata: pendiente.metadata,
      });

      setUltimaGrabacionGuardada({
        id: grabacion.id,
        tipo: pendiente.tipo,
        titulo: grabacion.titulo || tituloLimpio,
      });
      setGrabacionPendiente(null);
      return true;
    } catch (error: any) {
      setErrorGuardadoGrabacion(error?.message || 'No se pudo guardar la grabacion.');
      return false;
    } finally {
      setGuardandoGrabacion(false);
    }
  }, []);

  const _golpeHandlerRef = useRef<(idBoton: string) => void>(() => {});
  const _onNotaPresionadaEstable = useCallback((data: { idBoton: string }) => {
    registrarPresionHero(data.idBoton, convertirDireccionAFuelle(direccionAlumnoRef.current));
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
  useEffect(() => { tonalidadGrabacionRef.current = logica.tonalidadSeleccionada; }, [logica.tonalidadSeleccionada]);
  useEffect(() => { modoVistaGrabacionRef.current = logica.modoVista; }, [logica.modoVista]);
  useEffect(() => { timbreGrabacionRef.current = (logica.ajustes as any).timbre || null; }, [logica.ajustes]);
  useEffect(() => { instrumentoGrabacionRef.current = logica.instrumentoId || null; }, [logica.instrumentoId]);

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
    },
    [logica.reproduceTono]
  );

  const reproducirTonoGuia = useCallback((id: string, tiempo?: number, duracion?: number) => {
      return logica.reproduceTono(id, tiempo, duracion);
    },
    [logica.reproduceTono]
  );

  useEffect(() => {
    if (modoPractica !== 'synthesia') return;
    const maestroActivo = modoAudioSynthesia === 'maestro';
    if (maestroSuenaRef.current !== maestroActivo) {
      maestroSuenaRef.current = maestroActivo;
      setMaestroSuena(maestroActivo);
    }
  }, [modoPractica, modoAudioSynthesia, maestroSuena]);

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
  useEffect(() => { totalTicksRef.current = reproductor.totalTicks; }, [reproductor.totalTicks]);
  useEffect(() => {
    _reproductoActionsRef.current.alternarPausa = reproductor.alternarPausa;
    _reproductoActionsRef.current.buscarTick    = reproductor.buscarTick;
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
          // Reanudar si estábamos en pausa por Synthesia
          if (estadoJuegoRef.current === 'pausado_synthesia') {
            const mensajes = ["¡Excelente!", "¡Perfecto!", "¡Muy bien!", "¡Sigue así!", "¡Vamo' que vamo'!", "¡Eso es!", "¡Qué oído!", "¡Acertaste!"];
            setMensajeMotivacional(mensajes[Math.floor(Math.random() * mensajes.length)]);
            setBotonesGuiaAlumno({});
            maestroPermitidoEnSynthesiaRef.current = false;
            
            // 🎯 SYNTHESIA: Reanudar inmediatamente SIN saltos para mantener la sincronía del audio
            setEstadoJuego('jugando');
            estadoJuegoRef.current = 'jugando';
            _reproductoActionsRef.current.alternarPausa();
            audioFondoRef.current?.play().catch(() => {});
          }
        }
      } else { registrarResultado('fallada', posicionUltimoGolpeRef.current); }
      return;
    }

    const tickActual = tickActualRef.current;
    const resolucion = cancion.resolucion || 192;
    const ventanaTicks = msATicks(VENTANA_BIEN_MS, cancion.bpm, resolucion);
    const candidatas = cancion.secuencia.filter(nota => {
      const clave = `${nota.tick}-${nota.botonId}`;
      return (nota.botonId === botonId && Math.abs(nota.tick - tickActual) <= ventanaTicks && !notasImpactadasRef.current.has(clave));
    });
    if (candidatas.length === 0) { registrarResultado('fallada', null); return; }
    const objetivo = candidatas.reduce((mejor, actual) => Math.abs(actual.tick - tickActual) < Math.abs(mejor.tick - tickActual) ? actual : mejor);
    notasImpactadasRef.current.add(`${objetivo.tick}-${objetivo.botonId}`);
    const diferenciaTicks = Math.abs(objetivo.tick - tickActual);
    const ventanaPerfectoTicks = msATicks(VENTANA_PERFECTO_MS, cancion.bpm, resolucion);
    const resultado: ResultadoGolpe = diferenciaTicks <= ventanaPerfectoTicks ? 'perfecto' : 'bien';
    registrarResultado(resultado, posicionUltimoGolpeRef.current);
  }, []);

  useEffect(() => {
    _golpeHandlerRef.current = (idBoton: string) => {
      const estado = estadoJuegoRef.current;
      const modo = modoPracticaRef.current;
      if (modo === 'maestro_solo' && !modoGuiadoRef.current) return;
      if (estado === 'jugando') { procesarGolpeAlumno(idBoton); return; }
      const esModoGuiado = modo === 'maestro_solo' && modoGuiadoRef.current;
      // Synthesia: el golpe se procesa cuando el juego está en pausa interna (pausado_synthesia)
      if (estado === 'pausado_synthesia' && (modo === 'synthesia' || esModoGuiado)) {
        procesarGolpeAlumno(idBoton);
      }
    };
  }, [procesarGolpeAlumno]);

  const registrarResultado = useCallback((resultado: ResultadoGolpe, posicion: { x: number; y: number } | null) => {
    setEstadisticas(prev => {
      const sig = { ...prev };
      const esPractica = modoPracticaRef.current !== 'ninguno';

      if (resultado === 'perfecto') { sig.puntos += PUNTOS_PERFECTO * sig.multiplicador; sig.notasPerfecto++; sig.rachaActual++; } 
      else if (resultado === 'bien') { sig.puntos += PUNTOS_BIEN * sig.multiplicador; sig.notasBien++; sig.rachaActual++; } 
      else if (resultado === 'fallada') { sig.notasFalladas++; sig.rachaActual = 0; sig.multiplicador = 1; if (!esPractica) sig.vida = Math.max(0, sig.vida - DANO_FALLADA); } 
      else { sig.notasPerdidas++; sig.rachaActual = 0; sig.multiplicador = 1; if (!esPractica) sig.vida = Math.max(0, sig.vida - DANO_PERDIDA); }

      if (sig.rachaActual > sig.rachaMasLarga) sig.rachaMasLarga = sig.rachaActual;
      if (sig.rachaActual > 0 && sig.rachaActual % RACHA_PARA_MULTIPLICADOR === 0) sig.multiplicador = Math.min(sig.multiplicador + 1, MULTIPLICADOR_MAXIMO);
      return sig;
    });

    if (posicion && resultado !== 'perdida') {
      const efecto: EfectoGolpe = { id: `${Date.now()}-${Math.random()}`, resultado, x: posicion.x, y: posicion.y, creado: Date.now() };
      setEfectosVisuales(prev => [...prev.slice(-8), efecto]);
      setTimeout(() => setEfectosVisuales(prev => prev.filter(e => e.id !== efecto.id)), 900);
    }
  }, []);

  useEffect(() => {
    const estaActivo = reproductor.reproduciendo || estadoJuego === 'pausado' || estadoJuego === 'pausado_synthesia';
    if (!estaActivo || !cancionSeleccionada) return;
    const tickActual = reproductor.tickActual;
    const resolucion = cancionSeleccionada.resolucion || 192;
    const ventanaTicks = msATicks(VENTANA_BIEN_MS, cancionSeleccionada.bpm, resolucion);
    const modo = modoPracticaRef.current;

    for (const nota of cancionSeleccionada.secuencia) {
      const clave = `${nota.tick}-${nota.botonId}`;
      if (notasImpactadasRef.current.has(clave)) continue;

      if (modo === 'synthesia' || (modo === 'maestro_solo' && modoGuiadoRef.current)) {
        const UMBRAL_ACORDE = 15;
        // 🎯 SYNTHESIA PRECISO: Pausar exactamente cuando el tick llega a la nota (UMBRAL = 0)
        const UMBRAL_ANTICIPACION = 0; 
        
        if (tickActual >= (nota.tick - UMBRAL_ANTICIPACION) && notasEsperandoRef.current.length === 0) {
          const grupoNotas = cancionSeleccionada.secuencia.filter(n => 
            Math.abs(n.tick - nota.tick) <= UMBRAL_ACORDE && 
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
            
            // Iluminar botones para guiar al usuario
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

              // 🔊 En modo guiado por notas, reproducimos solo la referencia del acorde a tocar
              if (maestroSuenaRef.current && modoAudioSynthesiaRef.current === 'solo_notas') {
                grupoNotas.forEach(n => {
                  reproducirTonoGuia(n.botonId, 0, 1.2);
                });
              }

              // Pequeño feedback sonoro de pausa
              motorAudioPro.reproducir('click_debil', 'metronomo', 0.3);
            }
          }
          break; // Procesamos solo una parada por loop para estabilidad
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
        const porcentaje_completado = Math.round((notasTocadas / totalNotas) * 100);
        
        // Ejecutamos insertar en background, fetch es asíncrono pero muchas veces navegadores lo lanzan si es keepalive.
        // Supabase-js usa estandar fetch. Ojalá lo alcance a gatillar.
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
          porcentaje_completado: porcentaje_completado
        }).catch(() => {});
      }
    };

    const resetFuelle = () => {
      _setDireccionRef.current('halar');
      if (document.visibilityState === 'hidden') {
         // Cuando pierde foco (cambia de pestaña)
         handleAbandono();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (estadoJuegoRef.current === 'jugando' && modoPracticaRef.current === 'ninguno') {
        handleAbandono();
      }
    };

    window.addEventListener('blur', resetFuelle);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', resetFuelle);
    return () => { 
       window.removeEventListener('blur', resetFuelle); 
       window.removeEventListener('beforeunload', handleBeforeUnload);
       document.removeEventListener('visibilitychange', resetFuelle); 
    };
  }, [usuario]);

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
    setVelocidad(100);
    setEstadoJuego('seleccion');
    estadoJuegoRef.current = 'seleccion';
    // Aplicar tonalidad de la canción al acordeón inmediatamente
    if (cancion.tonalidad && (TONALIDADES as Record<string, unknown>)[cancion.tonalidad]) {
      logica.setTonalidadSeleccionada(cancion.tonalidad);
    }
  }, [cancelarCapturaActiva, limpiarEstadoGrabaciones, logica.setTonalidadSeleccionada]);

  const confirmarYJugar = useCallback(() => {
    const cancion = cancionPreConfigRef.current;
    if (!cancion) return;
    const vel = velocidadRef.current;
    const bpmAjustado = Math.round(cancion.bpm * (vel / 100));
    iniciarJuego({ ...cancion, bpm: bpmAjustado });
  }, []);

  const cambiarBpm = useCallback((valor: number | ((prev: number) => number)) => {
    const prev = _bpmCache.current;
    const nuevo = typeof valor === 'function' ? valor(prev) : valor;
    _bpmCache.current = nuevo;
    // El reproductor ya reacciona al cambio de 'bpm' que pasamos por props
    setBpm(nuevo);
  }, []);

  const iniciarJuego = useCallback(async (cancion: CancionHeroConTonalidad, saltarConteo: boolean = false, modoPracticaForzado?: ModoPractica) => {
    await motorAudioPro.activarContexto();
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
    notasEsperandoRef.current = [];
    setNotasEsperando([]);
    setBotonesGuiaAlumno({});
    actualizarLoopAB({ start: 0, end: 0, activo: false, hasStart: false, hasEnd: false });
    reproductor.setLoopPoints(0, 0, false);
    maestroPermitidoEnSynthesiaRef.current = false;
    logica.setDireccion('halar');
    if (cancion.tonalidad && (TONALIDADES as Record<string, unknown>)[cancion.tonalidad]) {
      logica.setTonalidadSeleccionada(cancion.tonalidad);
    }
    const vel = velocidadRef.current;
    const modoActual = modoPracticaForzado || modoPracticaRef.current;

    const _arrancarReproduccion = () => {
      if (audioFondoRef.current) { audioFondoRef.current.pause(); audioFondoRef.current.src = ""; audioFondoRef.current = null; }
      if (modoActual === 'ninguno') {
        iniciarCaptura('competencia');
      }
      setEstadoJuego('jugando');
      estadoJuegoRef.current = 'jugando';

      const urlFondo = (cancion as any).audio_fondo_url || cancion.audioFondoUrl;
      if (urlFondo) {
        // 🔴 PROBLEMA VIEJO: Se arrancaba el reproductor ANTES que el audio, causando desincronización
        // 🟢 SOLUCIÓN NUEVA: Crear el audio primero, escuchar cuando está listo, LUEGO arrancar el reproductor

        const audio = new Audio(urlFondo);
        audio.volume = mp3Silenciado ? 0 : volumenMusica / 100;
        audio.playbackRate = vel / 100;
        audio.addEventListener('playing', () => {
          if (typeof (window as any).sincronizarRelojConPista === 'function') {
            (window as any).sincronizarRelojConPista();
          }
        }, { once: true });
        audioFondoRef.current = audio;

        // Esperar a que el audio esté realmente listo para sonar
        let arrancado = false;
        const iniciarTodo = () => {
          if (arrancado) return;
          arrancado = true;

          // Ahora que el audio está cargado (o timeout), arrancamos todo sincronizado
          reproductor.reproducirSecuencia(cancion);

          // Reproducir el audio EN ESTE MISMO INSTANTE, antes de que se ejecute el siguiente frame
          // Permitimos que falle silenciosamente si no está listo
          audio.play().catch(() => console.warn('⚠️ Audio no pudo reproducirse aún'));

          // Limpiar los listeners
          audio.removeEventListener('canplay', iniciarTodo);
          audio.removeEventListener('loadeddata', iniciarTodo);
          audio.removeEventListener('load', iniciarTodo);
          clearTimeout(timeoutId);
        };

        // Escuchar múltiples eventos que indican que el audio está listo
        audio.addEventListener('canplay', iniciarTodo);
        audio.addEventListener('loadeddata', iniciarTodo);
        audio.addEventListener('load', iniciarTodo); // Fallback adicional para autoplay bloqueado

        // Timeout de seguridad: 3 segundos (más corto, con fallback 'load' es más rápido)
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ Audio no cargó a tiempo, iniciando de todas formas');
          iniciarTodo();
        }, 3000);
      } else {
        // Si no hay audio de fondo, simplemente arrancamos el reproductor
        reproductor.reproducirSecuencia(cancion);
      }
    };

    if (modoActual === 'synthesia') {
      const maestroActivo = modoAudioSynthesiaRef.current === 'maestro';
      maestroSuenaRef.current = maestroActivo;
      setMaestroSuena(maestroActivo);
    }
    if (modoActual !== 'ninguno' || saltarConteo) { setCuenta(null); _arrancarReproduccion(); return; }
    if (conteoIntervalRef.current) clearInterval(conteoIntervalRef.current);
    setCuenta(3);
    setEstadoJuego('contando');
    estadoJuegoRef.current = 'contando';
    conteoIntervalRef.current = setInterval(() => {
      setCuenta(prev => {
        if (prev === null || prev <= 1) { clearInterval(conteoIntervalRef.current); conteoIntervalRef.current = null; setCuenta(null); _arrancarReproduccion(); return null; }
        return prev - 1;
      });
    }, 1000);
  }, [actualizarLoopAB, cancelarCapturaActiva, iniciarCaptura, limpiarEstadoGrabaciones, logica.setTonalidadSeleccionada, mp3Silenciado, reproductor.reproducirSecuencia, reproductor.setLoopPoints, volumenMusica]);


  const iniciarConteo = useCallback(() => {
    const cancion = cancionPreConfigRef.current || cancionSeleccionada;
    if (cancion) iniciarJuego(cancion, false, modoPractica);
  }, [cancionSeleccionada, iniciarJuego, modoPractica]);

  const marcarLoopInicio = useCallback(() => {
    const inicio = Math.max(0, Math.floor(tickActualRef.current));
    const siguiente = { start: inicio, end: 0, activo: false, hasStart: true, hasEnd: false };
    reproductor.setLoopPoints(0, 0, false);
    actualizarLoopAB(siguiente);
  }, [actualizarLoopAB, reproductor.setLoopPoints]);

  const marcarLoopFin = useCallback(() => {
    const finActual = Math.max(0, Math.floor(tickActualRef.current));
    const previo = loopABRef.current;
    const inicio = previo.hasStart ? previo.start : Math.max(0, finActual - 192);
    const fin = Math.max(finActual, inicio + 48);
    const siguiente = { start: inicio, end: fin, activo: false, hasStart: true, hasEnd: true };
    reproductor.setLoopPoints(siguiente.start, siguiente.end, false);
    actualizarLoopAB(siguiente);
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
    const siguiente = { start: 0, end: 0, activo: false, hasStart: false, hasEnd: false };
    reproductor.setLoopPoints(0, 0, false);
    actualizarLoopAB(siguiente);
  }, [actualizarLoopAB, reproductor.setLoopPoints]);

  const actualizarLoopInicioTick = useCallback((startTick: number) => {
    const previo = loopABRef.current;
    const inicio = Math.max(0, Math.floor(startTick));
    if (!previo.hasEnd) {
      const siguiente = { start: inicio, end: 0, activo: false, hasStart: true, hasEnd: false };
      reproductor.setLoopPoints(0, 0, false);
      actualizarLoopAB(siguiente);
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
    if (estadoJuegoRef.current !== 'jugando' || !reproductor.reproduciendo) return;
    const vaAPausar = !reproductor.pausado;
    reproductor.alternarPausa();
    if (audioFondoRef.current) {
      if (vaAPausar) audioFondoRef.current.pause();
      else audioFondoRef.current.play().catch(() => {});
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
    else { audioFondoRef.current?.play().catch(() => {}); }
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

          // El audio ya fue pausado en la posición correcta (el browser la preserva).
          // El reproductor también fue pausado en el tick correcto.
          // Solo necesitamos reanudar ambos desde donde estaban.
          reproductor.alternarPausa();
          audioFondoRef.current?.play().catch(() => {});
          
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
    setEstadoJuego('seleccion');
    estadoJuegoRef.current = 'seleccion';
    setEstadisticas({ ...ESTADISTICAS_INICIALES });
    setEfectosVisuales([]);
    notasImpactadasRef.current = new Set();
    notasEsperandoRef.current = [];
    setNotasEsperando([]);
    setBotonesGuiaAlumno({});
    actualizarLoopAB({ start: 0, end: 0, activo: false, hasStart: false, hasEnd: false });
    maestroPermitidoEnSynthesiaRef.current = false;
    if (conteoIntervalRef.current) { clearInterval(conteoIntervalRef.current); conteoIntervalRef.current = null; }
    setCuenta(null);
    logica.setDireccion('halar');
  }, [actualizarLoopAB, cancelarCapturaActiva, limpiarEstadoGrabaciones, reproductor.detenerReproduccion, reproductor.setLoopPoints, logica.setDireccion]);

  const reiniciarDesdeGameOver = useCallback((cancion: CancionHeroConTonalidad) => {
    cancelarCapturaActiva();
    limpiarEstadoGrabaciones();
    setEstadoJuego('seleccion');
    setEstadisticas({ ...ESTADISTICAS_INICIALES });
    setEfectosVisuales([]);
    notasImpactadasRef.current = new Set();
    setTimeout(() => iniciarJuego(cancion), 50);
  }, [cancelarCapturaActiva, iniciarJuego, limpiarEstadoGrabaciones]);

  useEffect(() => {
    if (estadisticas.vida <= 0 && estadoJuego === 'jugando' && modoPractica === 'ninguno') {
      prepararGrabacionCompetencia();
      reproductor.detenerReproduccion();
      const audio = audioFondoRef.current;
      if (audio) {
        const pasos = 20; const volI = audio.volume; let p = 0;
        const int = setInterval(() => { p++; audio.volume = Math.max(0, volI * (1-p/pasos)); if (p>=pasos) { clearInterval(int); audio.pause(); audioFondoRef.current = null; } }, 60);
      }
      setEstadoJuego('gameOver');
    }
  }, [estadisticas.vida, estadoJuego, modoPractica, prepararGrabacionCompetencia, reproductor.detenerReproduccion]);

  // 🔴 PROTECCIÓN: Solo mostrar resultados si la reproducción REALMENTE fue iniciada y terminó
  const reproduccionFueIniciada = useRef(false);
  useEffect(() => {
    if (reproductor.reproduciendo) {
      reproduccionFueIniciada.current = true;
    }
  }, [reproductor.reproduciendo]);

  useEffect(() => {
    // Solo mostrar resultados si:
    // 1. La reproducción fue iniciada en algún momento (reproduccionFueIniciada = true)
    // 2. Ahora no está reproduciendo (!reproductor.reproduciendo)
    // 3. El estado es 'jugando'
    if (reproduccionFueIniciada.current && !reproductor.reproduciendo && estadoJuego === 'jugando' && cancionSeleccionada) {
      reproduccionFueIniciada.current = false; // Reset para la próxima canción
      prepararGrabacionCompetencia();

      const audio = audioFondoRef.current;
      if (audio) {
        const pasos = 30; const volI = audio.volume; let p = 0;
        const int = setInterval(() => { p++; audio.volume = Math.max(0, volI * (1-p/pasos)); if (p>=pasos) { clearInterval(int); audio.pause(); audioFondoRef.current = null; } }, 50);
      }
      try { const sfx = new Audio('/audio/effects/success.mp3'); sfx.volume = 0.75; sfx.play().catch(() => {}); } catch (_) {}
      setEstadoJuego('resultados');
    }
  }, [cancionSeleccionada, estadoJuego, prepararGrabacionCompetencia, reproductor.reproduciendo]);

  const registrarPosicionGolpe = useCallback((x: number, y: number) => {
    posicionUltimoGolpeRef.current = { x, y };
  }, []);

  // 🧹 LIMPIEZA AL DESMONTAR EL COMPONENTE (Solución al "sigue sonando al volver atrás")
  useEffect(() => {
    return () => {
      cancelarCapturaActiva();
      // 1. Detener música de fondo
      if (audioFondoRef.current) {
        audioFondoRef.current.pause();
        audioFondoRef.current.src = "";
        audioFondoRef.current = null;
      }
      
      // 2. Detener el reproductor Hero (ticks, animFrame y motor de audio de notas)
      reproductor.detenerReproduccion();

      // 3. Limpiar cualquier intervalo de conteo regresivo
      if (conteoIntervalRef.current) {
        clearInterval(conteoIntervalRef.current);
        conteoIntervalRef.current = null;
      }

      // 4. Detener sonidos residuales en el motor de audio
      motorAudioPro.detenerTodo();
    };
  }, [cancelarCapturaActiva, reproductor.detenerReproduccion]);

  return {
    estadoJuego,
    setEstadoJuego,
    cancionSeleccionada,
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
    // Datos del reproductor
    tickActual: reproductor.tickActual,
    totalTicks: reproductor.totalTicks,
    reproduciendo: reproductor.reproduciendo,
    pausado: reproductor.pausado,

    // Acciones
    seleccionarCancion,
    confirmarYJugar,
    iniciarJuego,
    detenerJuego,
    alternarPausa,
    alternarPausaReproduccion,
    pausarJuego,
    reanudarConConteo,
    volverASeleccion,
    reiniciarDesdeGameOver,
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
    grabaciones: {
      grabando: grabandoHero,
      tiempoGrabacionMs,
      guardando: guardandoGrabacion,
      error: errorGuardadoGrabacion,
      mostrarGuardadoResultado: grabacionPendiente?.tipo === 'competencia',
      mostrarModalGuardarPractica: grabacionPendiente?.tipo === 'practica_libre',
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

/**
 * Carga la lista de canciones disponibles desde Supabase para Pro Max.
 */
export function useCancionesProMax() {
  const [canciones, setCanciones] = useState<CancionHeroConTonalidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        const m = await import('../../../servicios/clienteSupabase');
        const { data, error: err } = await m.supabase
          .from('canciones_hero')
          .select('*')
          .order('creado_en', { ascending: false });

        if (err) throw err;

        const procesadas: CancionHeroConTonalidad[] = (data || []).map((row: any) => {
          let secuencia = row.secuencia || row.secuencia_json || [];
          if (typeof secuencia === 'string') {
            try { secuencia = JSON.parse(secuencia); } catch { secuencia = []; }
          }
          return { ...row, secuencia } as CancionHeroConTonalidad;
        });

        setCanciones(procesadas);
      } catch (e: any) {
        setError(e.message || 'Error al cargar canciones');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  return { canciones, cargando, error };
}
