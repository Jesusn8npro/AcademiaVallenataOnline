import { useState, useCallback, useRef, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import { useGrabadorHero } from '../../../Core/hooks/useGrabadorHero';
import { guardarGrabacion } from '../../../servicios/grabacionesHeroService';
import { scoresHeroService } from '../../../servicios/scoresHeroService';
import { obtenerSnapshotMetadataPracticaLibre } from '../PracticaLibre/Servicios/servicioPreferenciasPracticaLibre';
import { calcularPrecision } from '../TiposProMax';
import type { ModoVista } from '../../../Core/acordeon/TiposAcordeon';
import type { CancionHeroConTonalidad, EstadisticasPartida, ModoPractica, NotaHero } from '../TiposProMax';

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

interface UseGrabacionProMaxParams {
  bpm: number;
  cancionRef: MutableRefObject<CancionHeroConTonalidad | null>;
  estadisticasRef: MutableRefObject<EstadisticasPartida>;
  modoPracticaRef: MutableRefObject<ModoPractica>;
}

export function useGrabacionProMax({ bpm, cancionRef, estadisticasRef, modoPracticaRef }: UseGrabacionProMaxParams) {
  const grabador = useGrabadorHero(bpm);
  const grabandoHero = grabador.grabando;
  const iniciarGrabacionHeroRef = useRef(grabador.iniciarGrabacion);
  const detenerGrabacionHeroRef = useRef(grabador.detenerGrabacion);
  const grabandoHeroRef = useRef(grabandoHero);

  useEffect(() => { grabandoHeroRef.current = grabandoHero; }, [grabandoHero]);
  useEffect(() => { iniciarGrabacionHeroRef.current = grabador.iniciarGrabacion; }, [grabador.iniciarGrabacion]);
  useEffect(() => { detenerGrabacionHeroRef.current = grabador.detenerGrabacion; }, [grabador.detenerGrabacion]);

  const [grabacionPendiente, setGrabacionPendiente] = useState<GrabacionPendienteProMax | null>(null);
  const grabacionPendienteRef = useRef<GrabacionPendienteProMax | null>(null);
  const [guardandoGrabacion, setGuardandoGrabacion] = useState(false);
  const [errorGuardadoGrabacion, setErrorGuardadoGrabacion] = useState<string | null>(null);
  const [ultimaGrabacionGuardada, setUltimaGrabacionGuardada] = useState<GrabacionGuardadaProMax | null>(null);
  const [tiempoGrabacionMs, setTiempoGrabacionMs] = useState(0);
  const inicioCronometroGrabacionRef = useRef<number | null>(null);
  const modoGrabacionActivaRef = useRef<TipoGrabacionPendiente | null>(null);

  // Refs synced by coordinator from logica values
  const tonalidadGrabacionRef = useRef<string | null>(null);
  const modoVistaGrabacionRef = useRef<ModoVista>('notas');
  const timbreGrabacionRef = useRef<string | null>(null);
  const instrumentoGrabacionRef = useRef<string | null>(null);

  useEffect(() => { grabacionPendienteRef.current = grabacionPendiente; }, [grabacionPendiente]);

  useEffect(() => {
    if (!grabandoHero || inicioCronometroGrabacionRef.current === null) {
      if (!grabandoHero) setTiempoGrabacionMs(0);
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

  const cancelarCapturaActiva = useCallback(() => {
    if (grabandoHeroRef.current) detenerGrabacionHeroRef.current();
    modoGrabacionActivaRef.current = null;
    inicioCronometroGrabacionRef.current = null;
    setTiempoGrabacionMs(0);
  }, []);

  const limpiarEstadoGrabaciones = useCallback((limpiarUltimaGrabacion: boolean = true) => {
    setGrabacionPendiente(null);
    setErrorGuardadoGrabacion(null);
    if (limpiarUltimaGrabacion) setUltimaGrabacionGuardada(null);
  }, []);

  const iniciarCaptura = useCallback((tipo: TipoGrabacionPendiente, secuenciaBase?: NotaHero[], tickInicio?: number) => {
    limpiarEstadoGrabaciones();
    inicioCronometroGrabacionRef.current = Date.now();
    setTiempoGrabacionMs(0);
    modoGrabacionActivaRef.current = tipo;
    if (secuenciaBase && tickInicio !== undefined) {
      iniciarGrabacionHeroRef.current(secuenciaBase, tickInicio);
    } else {
      iniciarGrabacionHeroRef.current();
    }
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
    return { ...captura, tipo, duracionMs: Math.max(duracionMsPorTicks, 0) };
  }, []);

  const prepararGrabacionCompetencia = useCallback(() => {
    const captura = finalizarCapturaActiva();
    const cancion = cancionRef.current;
    if (!captura || captura.tipo !== 'competencia' || !cancion) return;

    const stats = estadisticasRef.current;
    const precision = calcularPrecision(stats.notasPerfecto, stats.notasBien, stats.notasFalladas, stats.notasPerdidas);
    if (precision < 60 || captura.secuencia.length === 0) { setGrabacionPendiente(null); return; }

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
  }, [cancionRef, estadisticasRef, finalizarCapturaActiva, modoPracticaRef]);

  const iniciarGrabacionPracticaLibre = useCallback((tipo: 'practica_libre' | 'competencia' = 'practica_libre') => {
    iniciarCaptura(tipo);
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

  const guardarGrabacionPendiente = useCallback(async (datos: any) => {
    let pendiente = grabacionPendienteRef.current;
    if (!pendiente && datos.secuencia) {
      console.log('🔧 Creando pendiente temporal desde datos directos...');
      pendiente = {
        tipo: datos.tipo || 'practica_libre',
        secuencia: datos.secuencia,
        bpm: datos.bpm || 120,
        tonalidad: datos.tonalidad || 'ADG',
        duracionMs: datos.duracionMs || 0,
        tituloSugerido: datos.titulo || 'Grabación',
        tickFinal: 0,
        resolucion: 192,
        precisionPorcentaje: 0,
        puntuacion: 0,
        notasTotales: datos.secuencia?.length || 0,
        notasCorrectas: datos.secuencia?.length || 0,
        cancionId: null,
        metadata: { audio_fondo_url: datos.pistaUrl || null },
      };
    }

    if (!pendiente) return false;
    const tituloLimpio = datos.titulo?.trim();
    if (!tituloLimpio) { setErrorGuardadoGrabacion('Debes escribir un titulo.'); return false; }

    setGuardandoGrabacion(true);
    setErrorGuardadoGrabacion(null);
    try {
      if (pendiente.tipo === 'competencia') {
        const { data, error } = await scoresHeroService.crearCancionHeroDesdeGrabacion({
          titulo: tituloLimpio,
          autor: datos.autor || 'Jesus Gonzalez',
          descripcion: datos.descripcion || '',
          youtube_id: datos.youtube_id || '',
          tipo: datos.tipo || 'cancion',
          dificultad: datos.dificultad || 'basico',
          secuencia: pendiente.secuencia,
          bpm: pendiente.bpm,
          tonalidad: pendiente.tonalidad || 'ADG',
          audio_fondo_url: pendiente.metadata?.audio_fondo_url || null,
        });
        if (error) throw error;
        setUltimaGrabacionGuardada({ id: data.id, tipo: 'competencia', titulo: data.titulo });
      } else {
        const grabacion = await guardarGrabacion({
          cancion_id: pendiente.cancionId,
          modo: pendiente.tipo,
          titulo: tituloLimpio,
          descripcion: datos.descripcion?.trim() || '',
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
        setUltimaGrabacionGuardada({ id: grabacion.id, tipo: pendiente.tipo, titulo: grabacion.titulo || tituloLimpio });
      }
      setGrabacionPendiente(null);
      return true;
    } catch (error: any) {
      setErrorGuardadoGrabacion(error?.message || 'Error al guardar.');
      return false;
    } finally {
      setGuardandoGrabacion(false);
    }
  }, []);

  return {
    grabandoHero,
    registrarPresionHero: grabador.registrarPresion,
    registrarLiberacionHero: grabador.registrarLiberacion,
    secuenciaGrabacion: grabador.secuencia,
    tiempoGrabacionMs,
    grabacionPendiente,
    grabacionPendienteRef,
    guardandoGrabacion,
    errorGuardadoGrabacion,
    ultimaGrabacionGuardada,
    tonalidadGrabacionRef,
    modoVistaGrabacionRef,
    timbreGrabacionRef,
    instrumentoGrabacionRef,
    cancelarCapturaActiva,
    limpiarEstadoGrabaciones,
    iniciarCaptura,
    prepararGrabacionCompetencia,
    iniciarGrabacionPracticaLibre,
    detenerGrabacionPracticaLibre,
    guardarGrabacionPendiente,
    descartarGrabacionPendiente,
  };
}
