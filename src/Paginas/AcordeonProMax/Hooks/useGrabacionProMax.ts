import { useState, useCallback, useRef, useEffect } from 'react';
import { useGrabadorHero } from '../../../Core/hooks/useGrabadorHero';
import { guardarGrabacion } from '../../../servicios/grabacionesHeroService';
import { crearCancionV2, subirAudioFondoV2 } from '../GrabadorV2/servicioGrabadorV2';
import { obtenerSnapshotMetadataPracticaLibre } from '../PracticaLibre/Servicios/servicioPreferenciasPracticaLibre';
import { calcularPrecision } from '../TiposProMax';
import type { ModoVista } from '../../../Core/acordeon/TiposAcordeon';
import type { TipoGrabacionPendiente, GrabacionPendienteProMax, GrabacionGuardadaProMax, UseGrabacionProMaxParams } from './_tiposGrabacionProMax';
import type { NotaHero } from '../../../Core/hero/tipos_Hero';

export function useGrabacionProMax({ bpm, cancionRef, estadisticasRef, modoPracticaRef, seccionRef }: UseGrabacionProMaxParams) {
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

  const iniciarCaptura = useCallback((
    tipo: TipoGrabacionPendiente,
    opciones?: {
      secuenciaBase?: NotaHero[];
      /** Tick absoluto desde donde arranca la captura (típicamente seccion.tickInicio para
       *  punch-in / sección, o 0 para intro). Sin esto, el grabador captura ticks RELATIVOS
       *  al momento de iniciar grabación → la posición musical se pierde. */
      tickInicio?: number;
      /** Audio element (HTMLAudio o ReproductorMP3) en curso. Si se pasa, el grabador ancla
       *  los ticks contra `audio.currentTime` → cero drift contra el MP3 que escucha el alumno. */
      audioElement?: any;
      /** BPM original de la canción. CRÍTICO para que los ticks queden en la misma escala que
       *  la reproducción a velocidad normal (no escalar por slow practice). */
      bpmOriginal?: number;
    }
  ) => {
    limpiarEstadoGrabaciones();
    inicioCronometroGrabacionRef.current = Date.now();
    setTiempoGrabacionMs(0);
    modoGrabacionActivaRef.current = tipo;
    const o = opciones || {};
    iniciarGrabacionHeroRef.current(
      o.secuenciaBase || [],
      o.tickInicio ?? 0,
      o.audioElement,
      o.bpmOriginal,
    );
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

    const seccion = seccionRef?.current || null;
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
        // Datos de la sección que el alumno jugó — el replay los usa para arrancar el audio
        // y el playhead en el mismo offset musical que el alumno vivió. Si jugó la canción
        // entera (sin sección), seccion_id queda null y el replay arranca en tick 0.
        seccion_id: seccion?.id || null,
        seccion_nombre: seccion?.nombre || null,
        seccion_tick_inicio: seccion?.tickInicio ?? 0,
        seccion_tick_fin: seccion?.tickFin ?? null,
        // Secuencia ORIGINAL de la canción — el replay la usa para mostrar las notas que
        // "deberían haberse pisado" además de la ejecución del alumno.
        secuencia_original: (cancion as any).secuencia_json || cancion.secuencia || null,
      },
    });
    setErrorGuardadoGrabacion(null);
  }, [cancionRef, estadisticasRef, finalizarCapturaActiva, modoPracticaRef, seccionRef]);

  const iniciarGrabacionPracticaLibre = useCallback((tipo: 'practica_libre' | 'competencia' = 'practica_libre') => {
    iniciarCaptura(tipo);
  }, [iniciarCaptura]);

  const detenerGrabacionPracticaLibre = useCallback((metadataExtra?: Record<string, any>) => {
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
        // metadataExtra: bandeja libre que el caller usa para meter cosas que no están en el
        // snapshot estándar — por ejemplo `metronomo: {bpm, compas, sonido, ...}` cuando el
        // alumno grabó en modo metrónomo, para que el replay lo reconstruya con el mismo sonido.
        ...(metadataExtra || {}),
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
      // Tanto competencia como práctica libre se guardan en `grabaciones_hero` (Mis grabaciones)
      // como una EJECUCIÓN del alumno, no como una canción nueva. La metadata incluye seccion_*
      // y secuencia_original para que el replay pueda reproducir audio + secuencia original
      // + ejecución del alumno sincronizados.
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
      setGrabacionPendiente(null);
      return true;
    } catch (error: any) {
      setErrorGuardadoGrabacion(error?.message || 'Error al guardar.');
      return false;
    } finally {
      setGuardandoGrabacion(false);
    }
  }, []);

  // Guarda la grabación pendiente como CANCIÓN HERO (tabla canciones_hero,
  // visible para todos los alumnos). Solo debe llamarse desde admin — la
  // protección de rol vive en el componente que lo invoca, no aquí.
  const guardarComoCancionHero = useCallback(async (datos: {
    titulo: string;
    autor: string;
    bpm: number;
    tonalidad: string;
    dificultad: 'basico' | 'intermedio' | 'avanzado';
    tipo: 'cancion' | 'secuencia' | 'melodia';
    usoMetronomo: boolean;
    audioFondoFile?: File | null;
  }) => {
    const pendiente = grabacionPendienteRef.current;
    const titulo = datos.titulo?.trim();
    if (!pendiente || !pendiente.secuencia.length) {
      setErrorGuardadoGrabacion('No hay grabación para guardar.');
      return null;
    }
    if (!titulo) {
      setErrorGuardadoGrabacion('Debes escribir un título.');
      return null;
    }
    setGuardandoGrabacion(true);
    setErrorGuardadoGrabacion(null);
    try {
      // 1) Creamos la canción primero para obtener el ID. El audio se sube
      //    después contra ese ID si el admin adjuntó MP3.
      const cancion = await crearCancionV2({
        titulo,
        autor: datos.autor || 'Jesus Gonzalez',
        bpm: datos.bpm,
        audio_fondo_url: null,
        secuencia_json: pendiente.secuencia as NotaHero[],
        secciones: [],
        tonalidad: datos.tonalidad,
        dificultad: datos.dificultad,
        tipo: datos.tipo,
        usoMetronomo: datos.usoMetronomo,
      });
      // 2) Si hay MP3, subir y actualizar la fila con la URL pública.
      if (datos.audioFondoFile) {
        try {
          const url = await subirAudioFondoV2(datos.audioFondoFile, cancion.id);
          // Actualizamos el campo en la fila recién creada.
          const { actualizarCancionV2 } = await import('../GrabadorV2/servicioGrabadorV2');
          await actualizarCancionV2(cancion.id, { audio_fondo_url: url });
          cancion.audio_fondo_url = url;
        } catch (errAudio: any) {
          // No abortamos: la canción ya quedó guardada, solo el audio falló.
          setErrorGuardadoGrabacion(`Canción guardada, pero falló subir el MP3: ${errAudio?.message || 'error desconocido'}`);
        }
      }
      setUltimaGrabacionGuardada({ id: cancion.id, tipo: 'cancion_hero', titulo: cancion.titulo });
      setGrabacionPendiente(null);
      return cancion;
    } catch (error: any) {
      setErrorGuardadoGrabacion(error?.message || 'Error al guardar como Canción Hero.');
      return null;
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
    guardarComoCancionHero,
    descartarGrabacionPendiente,
  };
}
