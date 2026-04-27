import { useState, useRef, useCallback, useEffect } from 'react';
import { useGrabadorHero } from '../../../../Core/hooks/useGrabadorHero';
import { actualizarSecuenciaCancionHero } from '../../../../servicios/cancionesHeroService';
import {
  normalizarSecuenciaHero,
  combinarSecuenciasPorPunch,
  calcularTicksDesdeSegundos,
  calcularTotalTicksSecuencia,
  formatearTickComoTiempo,
} from '../../PracticaLibre/Utilidades/SecuenciaLogic';
import type { NotaHero } from '../../../../Core/hero/tipos_Hero';
import {
  type LibreriaAPI,
  type UseEditorSecuenciaAdminParams,
  sincronizarNotasModalConLogica,
} from '../Componentes/EditorSecuencia/tiposEditor';

export const useEditorSecuenciaAdmin = ({
  bpm, grabandoSesion, logica, metronomoActivo,
  reproduciendo, pausado, tickActual, loopAB,
  secuencia, totalTicks,
  onAlternarPausa, onAlternarLoop, onBuscarTick,
  onReproducirSecuencia, onLimpiarLoop, onCambiarBpm,
  libreria,
}: UseEditorSecuenciaAdminParams) => {
  const {
    bpmHero, setBpmHero, pistaFile, setPistaUrl,
    bpmGrabacion, bpmOriginalGrabacion, setBpmOriginalGrabacion,
    cancionActivaLibreria, setCancionActivaLibreria,
    setUltimaCancionLibreriaActualizada,
    construirCancionHero, prepararCancionEnEscenario, detenerReproduccionLocal,
  } = libreria;

  const [modalGuardarHeroVisible, setModalGuardarHeroVisible] = useState(false);
  const [tipoSugeridoGrabacion, setTipoSugeridoGrabacion] = useState<'secuencia' | 'cancion' | 'ejercicio'>('secuencia');
  const [tiempoGrabacionRecProMs, setTiempoGrabacionRecProMs] = useState(0);
  const [modoCapturaRec, setModoCapturaRec] = useState<'libre' | 'edicion' | null>(null);
  const [esperandoPunchIn, setEsperandoPunchIn] = useState(false);
  const [hayCambiosEdicionSecuencia, setHayCambiosEdicionSecuencia] = useState(false);
  const [guardandoEdicionSecuencia, setGuardandoEdicionSecuencia] = useState(false);
  const [mensajeEdicionSecuencia, setMensajeEdicionSecuencia] = useState<string | null>(null);
  const [cancionEditandoSecuencia, setCancionEditandoSecuencia] = useState<any | null>(null);
  const [cancionEnModalEditor, setCancionEnModalEditor] = useState<any | null>(null);
  const [secuenciaEditada, setSecuenciaEditada] = useState<NotaHero[]>([]);
  const [preRollSegundos, setPreRollSegundos] = useState(4);
  const [punchInTick, setPunchInTick] = useState<number | null>(null);
  const [punchOutTick, setPunchOutTick] = useState<number | null>(null);
  const [secuenciaVisualModal, setSecuenciaVisualModal] = useState<NotaHero[]>([]);
  const [confirmacion, setConfirmacion] = useState<{ texto: string; onConfirmar: () => void } | null>(null);

  const usoMetronomoRef = useRef(false);
  const inicioGrabacionRecProRef = useRef<number | null>(null);
  const secuenciaEditadaRef = useRef<NotaHero[]>([]);
  const botonesActivosAnteriorRef = useRef<Record<string, any>>({});
  const notasCheadasModalRef = useRef<Set<string>>(new Set());

  const grabadorLocal = useGrabadorHero(bpmHero);
  const grabandoRecPro = grabadorLocal.grabando;
  const hayGrabacionActiva = grabandoSesion || grabandoRecPro;
  const estaGrabandoEdicionSecuencia = grabandoRecPro && modoCapturaRec === 'edicion';

  useEffect(() => { usoMetronomoRef.current = metronomoActivo; }, [metronomoActivo]);
  useEffect(() => { secuenciaEditadaRef.current = secuenciaEditada; }, [secuenciaEditada]);

  useEffect(() => {
    if (cancionEditandoSecuencia || grabandoRecPro) setBpmHero(bpm);
  }, [bpm, cancionEditandoSecuencia, grabandoRecPro, setBpmHero]);

  useEffect(() => {
    if (!grabadorLocal.grabando) {
      botonesActivosAnteriorRef.current = {};
      return;
    }
    const botonActualesIds = Object.keys(logica.botonesActivos || {});
    const botonesAnterioresIds = Object.keys(botonesActivosAnteriorRef.current);
    for (const id of botonActualesIds) {
      if (!botonesActivosAnteriorRef.current[id]) {
        const dirHero = logica.direccion === 'halar' ? 'abriendo' : 'cerrando';
        grabadorLocal.registrarPresion(id, dirHero);
      }
    }
    for (const id of botonesAnterioresIds) {
      if (!logica.botonesActivos[id]) grabadorLocal.registrarLiberacion(id);
    }
    botonesActivosAnteriorRef.current = { ...logica.botonesActivos };
  }, [logica.botonesActivos, logica.direccion, grabadorLocal.grabando]);

  useEffect(() => {
    if (!grabandoRecPro || inicioGrabacionRecProRef.current === null) {
      if (!grabandoRecPro) setTiempoGrabacionRecProMs(0);
      return;
    }
    const actualizarCronometro = () => {
      if (inicioGrabacionRecProRef.current !== null)
        setTiempoGrabacionRecProMs(Date.now() - inicioGrabacionRecProRef.current);
    };
    actualizarCronometro();
    const intervalo = window.setInterval(actualizarCronometro, 250);
    return () => window.clearInterval(intervalo);
  }, [grabandoRecPro]);

  useEffect(() => {
    if (modoCapturaRec === 'edicion' && grabadorLocal.grabando && punchOutTick !== null) {
      if (tickActual >= punchOutTick) detenerGrabacionRecPro();
    }
  }, [tickActual, modoCapturaRec, grabadorLocal.grabando, punchOutTick]);

  useEffect(() => {
    if (!esperandoPunchIn || modoCapturaRec !== 'edicion' || punchInTick === null || tickActual < punchInTick) return;
    usoMetronomoRef.current = metronomoActivo;
    inicioGrabacionRecProRef.current = Date.now();
    setTiempoGrabacionRecProMs(0);
    setEsperandoPunchIn(false);
    setMensajeEdicionSecuencia('Grabando reemplazo desde la entrada marcada.');
    grabadorLocal.iniciarGrabacion(secuenciaEditadaRef.current, punchInTick);
  }, [esperandoPunchIn, grabadorLocal, metronomoActivo, modoCapturaRec, punchInTick, tickActual]);

  useEffect(() => {
    if (!estaGrabandoEdicionSecuencia || punchOutTick === null || tickActual < punchOutTick) return;
    const resumen = finalizarGrabacionEdicion(punchOutTick);
    if (reproduciendo && !pausado) onAlternarPausa();
    if (resumen) onBuscarTick(Math.max(0, resumen.tickInicio - calcularTicksDesdeSegundos(preRollSegundos, bpm)));
  }, [bpm, estaGrabandoEdicionSecuencia, onAlternarPausa, onBuscarTick, pausado, preRollSegundos, punchOutTick, reproduciendo, tickActual]);

  const iniciarGrabacionRecPro = useCallback(() => {
    if (grabandoSesion || grabadorLocal.grabando || esperandoPunchIn) return;
    setModoCapturaRec('libre');
    usoMetronomoRef.current = metronomoActivo;
    inicioGrabacionRecProRef.current = Date.now();
    setTiempoGrabacionRecProMs(0);
    grabadorLocal.iniciarGrabacion();
  }, [esperandoPunchIn, grabandoSesion, grabadorLocal, metronomoActivo]);

  const finalizarGrabacionEdicion = useCallback((tickFinForzado?: number) => {
    if (!grabadorLocal.grabando || punchInTick === null) return null;
    const resultado = grabadorLocal.detenerGrabacion();
    inicioGrabacionRecProRef.current = null;
    const tickFin = Math.max(
      punchInTick + 1,
      Math.floor(typeof tickFinForzado === 'number' ? tickFinForzado : resultado.tickFinal)
    );
    const secuenciaCombinada = combinarSecuenciasPorPunch(
      secuenciaEditadaRef.current, resultado.secuencia, punchInTick, tickFin
    );
    const cancionActualizada = cancionEditandoSecuencia
      ? construirCancionHero(cancionEditandoSecuencia, secuenciaCombinada) : null;
    setSecuenciaEditada(secuenciaCombinada);
    setHayCambiosEdicionSecuencia(true);
    setEsperandoPunchIn(false);
    setModoCapturaRec(null);
    setMensajeEdicionSecuencia(
      `Tramo actualizado de ${formatearTickComoTiempo(punchInTick, bpm)} a ${formatearTickComoTiempo(tickFin, bpm)}.`
    );
    if (cancionActualizada) {
      setCancionEditandoSecuencia(cancionActualizada);
      setCancionActivaLibreria(cancionActualizada);
    }
    return { tickInicio: punchInTick, tickFin, secuenciaCombinada };
  }, [bpm, cancionEditandoSecuencia, construirCancionHero, grabadorLocal, punchInTick, setCancionActivaLibreria]);

  const detenerGrabacionRecPro = useCallback(() => {
    if (!grabadorLocal.grabando) {
      if (esperandoPunchIn) {
        setEsperandoPunchIn(false);
        setModoCapturaRec(null);
        setMensajeEdicionSecuencia('Punch-in cancelado antes de comenzar a grabar.');
        detenerReproduccionLocal(Math.max(0, (punchInTick || 0) - calcularTicksDesdeSegundos(preRollSegundos, bpm)));
      }
      return;
    }
    if (modoCapturaRec === 'edicion') {
      const resumen = finalizarGrabacionEdicion();
      if (reproduciendo && !pausado) onAlternarPausa();
      if (resumen) onBuscarTick(Math.max(0, resumen.tickInicio - calcularTicksDesdeSegundos(preRollSegundos, bpm)));
      return;
    }
    const resultado = grabadorLocal.detenerGrabacion();
    inicioGrabacionRecProRef.current = null;
    setModoCapturaRec(null);
    if (!resultado.secuencia.length) {
      setMensajeEdicionSecuencia('No hay notas grabadas. Presiona algunos botones del acordeon antes de guardar.');
      return;
    }
    setTipoSugeridoGrabacion(usoMetronomoRef.current ? 'secuencia' : 'ejercicio');
    setModalGuardarHeroVisible(true);
  }, [bpm, esperandoPunchIn, finalizarGrabacionEdicion, grabadorLocal, modoCapturaRec,
    onAlternarPausa, onBuscarTick, pausado, preRollSegundos, punchInTick, reproduciendo, detenerReproduccionLocal]);

  const marcarEntradaEdicion = useCallback(() => {
    setPunchInTick(Math.max(0, Math.floor(tickActual)));
    setMensajeEdicionSecuencia('Entrada de punch marcada en el cursor actual.');
  }, [tickActual]);

  const marcarSalidaEdicion = useCallback(() => {
    setPunchOutTick(Math.max(0, Math.floor(tickActual)));
    setMensajeEdicionSecuencia('Salida de punch marcada en el cursor actual.');
  }, [tickActual]);

  const limpiarRangoEdicion = useCallback(() => {
    setPunchInTick(null);
    setPunchOutTick(null);
    setMensajeEdicionSecuencia('Rango de edición limpio.');
  }, []);

  const guardarEdicionSecuencia = useCallback(async () => {
    if (!cancionEditandoSecuencia) return;
    if (!hayCambiosEdicionSecuencia) { setMensajeEdicionSecuencia('No hay cambios nuevos por guardar.'); return; }
    if (grabadorLocal.grabando || esperandoPunchIn) { setMensajeEdicionSecuencia('Deten el punch-in antes de guardar la secuencia.'); return; }
    try {
      setGuardandoEdicionSecuencia(true);
      const data = await actualizarSecuenciaCancionHero(cancionEditandoSecuencia.id, secuenciaEditadaRef.current);
      const cancionGuardada = construirCancionHero(data, secuenciaEditadaRef.current);
      setCancionEditandoSecuencia(cancionGuardada);
      setCancionActivaLibreria(cancionGuardada);
      setUltimaCancionLibreriaActualizada(cancionGuardada);
      setHayCambiosEdicionSecuencia(false);
      setMensajeEdicionSecuencia('Secuencia guardada correctamente en canciones_hero.');
    } catch (error: any) {
      setMensajeEdicionSecuencia(error?.message || 'No se pudo guardar la secuencia editada.');
    } finally {
      setGuardandoEdicionSecuencia(false);
    }
  }, [cancionEditandoSecuencia, construirCancionHero, esperandoPunchIn, grabadorLocal.grabando,
    hayCambiosEdicionSecuencia, setCancionActivaLibreria, setUltimaCancionLibreriaActualizada]);

  const cancelarEdicionSecuencia = useCallback(() => {
    const ejecutar = () => {
      if (grabadorLocal.grabando) grabadorLocal.detenerGrabacion();
      setEsperandoPunchIn(false);
      setModoCapturaRec(null);
      setHayCambiosEdicionSecuencia(false);
      setMensajeEdicionSecuencia(null);
      setCancionEditandoSecuencia(null);
      setSecuenciaEditada([]);
      onLimpiarLoop();
      detenerReproduccionLocal(0);
    };
    if (hayCambiosEdicionSecuencia || esperandoPunchIn || grabadorLocal.grabando) {
      setConfirmacion({ texto: 'Tienes una edicion activa con cambios sin guardar. ¿Deseas salir del editor?', onConfirmar: ejecutar });
      return;
    }
    ejecutar();
  }, [detenerReproduccionLocal, esperandoPunchIn, grabadorLocal, hayCambiosEdicionSecuencia, onLimpiarLoop]);

  const iniciarPunchInEdicion = useCallback(() => {
    if (!cancionEditandoSecuencia) { setMensajeEdicionSecuencia('Primero elige una cancion de la libreria para editar.'); return; }
    if (grabandoSesion || grabadorLocal.grabando) { setMensajeEdicionSecuencia('Deten la grabacion actual antes de iniciar un punch-in.'); return; }
    if (punchInTick === null) { setMensajeEdicionSecuencia('Marca la entrada de punch antes de grabar el reemplazo.'); return; }
    if (loopAB.activo) onAlternarLoop();
    const cancionPreparada = { ...cancionEditandoSecuencia, secuencia_hero: secuenciaEditadaRef.current };
    const tickPreRoll = Math.max(0, punchInTick - calcularTicksDesdeSegundos(preRollSegundos, bpm));
    setEsperandoPunchIn(true);
    setModoCapturaRec('edicion');
    setMensajeEdicionSecuencia('Reproduciendo pre-roll. La grabación arrancará en la entrada marcada.');
    inicioGrabacionRecProRef.current = null;
    onBuscarTick(tickPreRoll);
    onReproducirSecuencia(cancionPreparada);
  }, [bpm, cancionEditandoSecuencia, grabadorLocal, loopAB.activo, onAlternarLoop,
    preRollSegundos, punchInTick, onBuscarTick, onReproducirSecuencia, grabandoSesion]);

  const reproducirCancionActivaDesdeTick = useCallback((tickInicio = 0, cancionForzada?: any) => {
    const cancionBase = cancionForzada
      || (cancionEditandoSecuencia
        ? construirCancionHero(cancionEditandoSecuencia, secuenciaEditadaRef.current)
        : cancionActivaLibreria
          ? construirCancionHero(
            cancionActivaLibreria,
            cancionEditandoSecuencia?.id === cancionActivaLibreria.id ? secuenciaEditadaRef.current : undefined
          )
          : null);
    if (!cancionBase) return;
    prepararCancionEnEscenario(cancionBase);
    window.setTimeout(() => {
      onReproducirSecuencia(cancionBase);
      window.setTimeout(() => onBuscarTick(Math.max(0, Math.floor(tickInicio))), 0);
    }, 0);
  }, [cancionActivaLibreria, cancionEditandoSecuencia, construirCancionHero, onBuscarTick, onReproducirSecuencia, prepararCancionEnEscenario]);

  const handleReproducirLibreria = useCallback((cancion: any) => {
    const secuenciaActiva = cancionEditandoSecuencia?.id === cancion.id
      ? secuenciaEditadaRef.current : undefined;
    const cancionPreparada = {
      ...cancion,
      secuencia_hero: secuenciaActiva || normalizarSecuenciaHero(cancion.secuencia_json || cancion.secuencia),
    };
    onBuscarTick(0);
    onReproducirSecuencia(cancionPreparada);
  }, [cancionEditandoSecuencia?.id, onBuscarTick, onReproducirSecuencia]);

  const handleEditarSecuenciaLibreria = useCallback((cancion: any) => {
    const continuar = () => {
      if (grabandoSesion || grabadorLocal.grabando || esperandoPunchIn) {
        setMensajeEdicionSecuencia('Deten la grabacion o el pre-roll actual antes de abrir otra secuencia.');
        return;
      }
      const cancionPreparada = { ...cancion, secuencia_hero: normalizarSecuenciaHero(cancion.secuencia_json || cancion.secuencia) };
      prepararCancionEnEscenario(cancionPreparada);
      setCancionEditandoSecuencia(cancionPreparada);
      setSecuenciaEditada(cancionPreparada.secuencia_hero);
      setHayCambiosEdicionSecuencia(false);
      setMensajeEdicionSecuencia('Editor de secuencia listo. Marca entrada y salida para grabar por tramos.');
      onLimpiarLoop();
      detenerReproduccionLocal(0);
    };
    if (cancionEditandoSecuencia && hayCambiosEdicionSecuencia && cancion.id !== cancionEditandoSecuencia.id) {
      setConfirmacion({ texto: 'Hay cambios sin guardar en la cancion actual. ¿Deseas abrir otra cancion y perder esos cambios?', onConfirmar: continuar });
      return;
    }
    continuar();
  }, [cancionEditandoSecuencia, detenerReproduccionLocal, esperandoPunchIn,
    grabadorLocal.grabando, grabandoSesion, hayCambiosEdicionSecuencia, onLimpiarLoop, prepararCancionEnEscenario]);

  const handleAbrirModalEditor = useCallback((cancion: any) => {
    if (grabandoSesion || grabadorLocal.grabando || esperandoPunchIn) {
      setMensajeEdicionSecuencia('Detén la grabación o el pre-roll actual antes de abrir el editor.');
      return;
    }
    if (reproduciendo && !pausado) onAlternarPausa();
    onBuscarTick(0);
    if (cancion.audio_fondo_url) setPistaUrl(cancion.audio_fondo_url);
    const cancionPreparada = { ...cancion, secuencia_hero: normalizarSecuenciaHero(cancion.secuencia_json || cancion.secuencia) };
    prepararCancionEnEscenario(cancionPreparada);
    setCancionEnModalEditor(cancion);
    setCancionEditandoSecuencia(cancion);
    setSecuenciaEditada(cancionPreparada.secuencia_hero);
    setBpmOriginalGrabacion(cancion.bpm || 120);
    onCambiarBpm(cancion.bpm || 120);
    setHayCambiosEdicionSecuencia(false);
    setMensajeEdicionSecuencia('Editor de secuencia listo. Marca entrada y salida para grabar por tramos.');
  }, [grabandoSesion, grabadorLocal.grabando, esperandoPunchIn, onBuscarTick, onAlternarPausa,
    reproduciendo, pausado, onCambiarBpm, prepararCancionEnEscenario, setPistaUrl, setBpmOriginalGrabacion]);

  const handleDetenerTimeline = useCallback(() => {
    onBuscarTick(0);
    if (reproduciendo && !pausado) onAlternarPausa();
  }, [onBuscarTick, onAlternarPausa, reproduciendo, pausado]);

  const handleNotasActualesDelModal = useCallback((notas: NotaHero[]) => {
    sincronizarNotasModalConLogica(notas, logica, notasCheadasModalRef);
  }, [logica]);

  const secuenciaVisualActiva = cancionEnModalEditor
    ? secuenciaVisualModal
    : cancionEditandoSecuencia
      ? secuenciaEditada
      : cancionActivaLibreria?.secuencia || secuencia || [];

  const totalTicksTransporte = cancionEditandoSecuencia
    ? Math.max(totalTicks || 0, calcularTotalTicksSecuencia(secuenciaEditada))
    : totalTicks || 2100;

  return {
    modalGuardarHeroVisible, setModalGuardarHeroVisible,
    tipoSugeridoGrabacion,
    tiempoGrabacionRecProMs,
    modoCapturaRec,
    esperandoPunchIn,
    hayCambiosEdicionSecuencia,
    guardandoEdicionSecuencia,
    mensajeEdicionSecuencia,
    cancionEditandoSecuencia,
    cancionEnModalEditor, setCancionEnModalEditor,
    secuenciaEditada,
    preRollSegundos, setPreRollSegundos,
    punchInTick, setPunchInTick,
    punchOutTick, setPunchOutTick,
    secuenciaVisualModal, setSecuenciaVisualModal,
    grabandoRecPro,
    hayGrabacionActiva,
    estaGrabandoEdicionSecuencia,
    secuenciaVisualActiva,
    totalTicksTransporte,
    grabadorLocal,
    usoMetronomoRef,
    notasCheadasModalRef,
    iniciarGrabacionRecPro,
    detenerGrabacionRecPro,
    finalizarGrabacionEdicion,
    marcarEntradaEdicion,
    marcarSalidaEdicion,
    limpiarRangoEdicion,
    guardarEdicionSecuencia,
    cancelarEdicionSecuencia,
    iniciarPunchInEdicion,
    reproducirCancionActivaDesdeTick,
    handleReproducirLibreria,
    handleEditarSecuenciaLibreria,
    handleAbrirModalEditor,
    handleDetenerTimeline,
    handleNotasActualesDelModal,
    confirmacion, setConfirmacion,
    setMensajeEdicionSecuencia,
  };
};
