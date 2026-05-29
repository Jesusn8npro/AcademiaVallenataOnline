import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import { subscribirNotas } from '../../../../Core/audio/emisorNotasAcordeon';
import { useUsuario } from '../../../../contextos/UsuarioContext';
import { obtenerLimiteGrabaciones, LIMITE_GRABACIONES_FREE } from '../../../../config/limitesPlan';

import { useRelojUnificado } from '../../GrabadorV2/hooks/useRelojUnificado';
import { useReproductorMP3V2 } from '../../GrabadorV2/hooks/useReproductorMP3V2';
import { useMetronomoV2 } from '../../GrabadorV2/hooks/useMetronomoV2';
import { useGrabadorV2 } from '../../GrabadorV2/hooks/useGrabadorV2';
import { useAntiNotasPegadas } from '../../GrabadorV2/hooks/useAntiNotasPegadas';
import { useRAFPlayback } from '../../GrabadorV2/hooks/useRAFPlayback';
import { mezclarPunchIn } from '../../GrabadorV2/servicioGrabadorV2';
import type { NotaHero, SeccionV2 } from '../../GrabadorV2/tipos';

import {
  listarCancionesEstudio, cargarCancionEstudio, crearCancionEstudioDesdeArchivo,
  guardarCancionEstudio, eliminarCancionEstudio, type CancionEstudio,
} from '../Servicios/servicioEstudioUsuario';
import { useDescargaEstudio } from './useDescargaEstudio';

function uuid() { return `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

function totalTicksDe(secuencia: NotaHero[], duracionSeg: number, bpm: number, resolucion: number): number {
  const factor = (bpm / 60) * resolucion;
  const porAudio = Math.ceil((duracionSeg || 0) * factor);
  const porNotas = secuencia.reduce((m, n) => Math.max(m, n.tick + n.duracion), 0);
  return Math.max(porAudio, porNotas, factor * 16);
}

/**
 * Toda la lógica del Grabador de pistas del alumno (motor + lista + transporte + secciones +
 * guardar + descargas). El componente `EstudioUsuario` solo consume este hook y renderiza.
 */
export function useEstudioGrabador(logica: any, onEditorActivo?: (activo: boolean) => void) {
  const { usuario } = useUsuario();
  const [vista, setVista] = useState<'lista' | 'editor'>('lista');
  const [canciones, setCanciones] = useState<CancionEstudio[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [limite, setLimite] = useState<number>(LIMITE_GRABACIONES_FREE);
  const [esPremium, setEsPremium] = useState(false);

  const [cancionId, setCancionId] = useState<string | null>(null);
  const [grabacionId, setGrabacionId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [bpm, setBpmState] = useState(120);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duracionSegCancion, setDuracionSegCancion] = useState<number | null>(null);
  const [secuencia, setSecuencia] = useState<NotaHero[]>([]);
  const [secciones, setSecciones] = useState<SeccionV2[]>([]);
  const [tickActual, setTickActual] = useState(0);
  const [usoMetronomo, setUsoMetronomo] = useState(false);
  const [velocidad, setVelocidad] = useState(1.0);
  const [estadoGuardado, setEstadoGuardado] = useState<'idle' | 'guardando' | 'guardado' | 'error'>('idle');
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const [prerollSeg, setPrerollSeg] = useState(2);
  const [enPreroll, setEnPreroll] = useState(false);
  const [prerollRestanteSeg, setPrerollRestanteSeg] = useState(0);
  const grabacionPendienteRef = useRef<number>(0);
  const [metronomoExpandido, setMetronomoExpandido] = useState(false);
  const fileNuevaRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);

  // ─── Motor (idéntico a admin GrabadorV2) ─────────────────────────────────
  const reloj = useRelojUnificado(bpm, 192);
  const reproductor = useReproductorMP3V2(reloj);
  const metronomo = useMetronomoV2(reloj);
  const grabador = useGrabadorV2(reloj);

  // Captura: la lógica compartida emite cada nota por el emisor global → alimenta el grabador.
  const grabadorRef = useRef(grabador);
  useEffect(() => { grabadorRef.current = grabador; }, [grabador]);
  useEffect(() => {
    const off = subscribirNotas((e) => {
      const g = grabadorRef.current;
      if (e.accion === 'down') g.capturarPress(e.idBoton, e.fuelle);
      else g.capturarRelease(e.idBoton);
    });
    return off;
  }, []);

  const logicaRef = useRef(logica);
  useEffect(() => { logicaRef.current = logica; }, [logica]);
  useAntiNotasPegadas(logicaRef);

  useEffect(() => { reloj.setBpm(Math.round(bpm * velocidad)); }, [bpm, velocidad, reloj]);
  useEffect(() => { reproductor.setPlaybackRate(velocidad); }, [velocidad, reproductor]);

  const { apagarTodasNotasPlayback, ultimoTickFiredRef } = useRAFPlayback({
    reproduciendo: reproductor.reproduciendo,
    grabando: grabador.grabando,
    secuencia, bpm, tickActual, reloj, logicaRef, setTickActual,
  });

  // ─── Lista ────────────────────────────────────────────────────────────────
  const refrescarLista = useCallback(async () => {
    setCargandoLista(true);
    try {
      const [lista, info] = await Promise.all([
        listarCancionesEstudio(),
        usuario?.id ? obtenerLimiteGrabaciones(usuario.id) : Promise.resolve({ limite: LIMITE_GRABACIONES_FREE, esPremium: false } as any),
      ]);
      setCanciones(lista);
      setLimite(info.limite);
      setEsPremium(info.esPremium);
    } catch (e: any) {
      setMensajeError(`Error cargando tus canciones: ${e.message || e}`);
    } finally {
      setCargandoLista(false);
    }
  }, [usuario?.id]);
  useEffect(() => { void refrescarLista(); }, [refrescarLista]);

  const enLimite = !esPremium && canciones.length >= limite;
  useEffect(() => { onEditorActivo?.(vista === 'editor'); }, [vista, onEditorActivo]);

  // ─── Cargar / nueva ─────────────────────────────────────────────────────────
  const cargarEnEditor = useCallback(async (c: CancionEstudio) => {
    reproductor.detener();
    grabador.cancelar();
    metronomo.setActivo(false);
    setMensajeError(null);
    try {
      const full = await cargarCancionEstudio(c.id);
      if (!full) { setMensajeError('No se pudo abrir la canción.'); return; }
      setCancionId(full.id);
      setGrabacionId(full.grabacionId);
      setTitulo(full.titulo);
      setAutor(full.autor);
      setBpmState(full.bpm);
      metronomo.setBpm(full.bpm);
      setVelocidad(1.0);
      setAudioUrl(full.audio_fondo_url);
      setDuracionSegCancion(full.duracion_segundos);
      setSecuencia(full.secuencia_json);
      setSecciones(full.secciones);
      setUsoMetronomo(full.usoMetronomo);
      if (full.tonalidad) { try { logica.setTonalidadSeleccionada(full.tonalidad); } catch (_) {} }
      setTickActual(0);
      setEstadoGuardado('idle');
      setVista('editor');
      if (full.audio_fondo_url) {
        try { await reproductor.cargar(full.audio_fondo_url); } catch (e: any) {
          setMensajeError(`Error cargando audio: ${e.message || e}`);
        }
      }
    } catch (e: any) {
      setMensajeError(`Error abriendo canción: ${e.message || e}`);
    }
  }, [reproductor, grabador, metronomo, logica]);

  const onArchivoNueva = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMensajeError(null);
    try {
      await motorAudioPro.activarContexto();
      const c = await crearCancionEstudioDesdeArchivo(file, (fase, pct) =>
        setSubiendo(fase === 'comprimiendo' ? `Comprimiendo ${pct}%` : fase === 'subiendo' ? 'Subiendo…' : 'Guardando…'));
      setSubiendo(null);
      await refrescarLista();
      await cargarEnEditor(c);
    } catch (err: any) {
      setSubiendo(null);
      setMensajeError(`Error subiendo: ${err.message || err}`);
    }
  }, [refrescarLista, cargarEnEditor]);

  const pedirNueva = useCallback(() => {
    if (enLimite) { setMensajeError(`Llegaste al límite de ${LIMITE_GRABACIONES_FREE} grabaciones.`); return; }
    fileNuevaRef.current?.click();
  }, [enLimite]);

  const volverALista = useCallback(() => {
    reproductor.detener();
    grabador.cancelar();
    metronomo.setActivo(false);
    setVista('lista');
    void refrescarLista();
  }, [reproductor, grabador, metronomo, refrescarLista]);

  // ─── Transporte ─────────────────────────────────────────────────────────────
  const totalTicks = useMemo(
    () => totalTicksDe(secuencia, reproductor.duracionSeg || duracionSegCancion || 0, bpm, 192),
    [secuencia, reproductor.duracionSeg, duracionSegCancion, bpm],
  );

  const cancelarPreroll = useCallback(() => {
    if (grabacionPendienteRef.current) { window.clearTimeout(grabacionPendienteRef.current); grabacionPendienteRef.current = 0; }
    setEnPreroll(false);
    setPrerollRestanteSeg(0);
  }, []);

  const togglePlay = useCallback(async () => {
    if (grabador.grabando) return;
    if (reproductor.reproduciendo) {
      reproductor.pause();
      if (metronomo.activo) metronomo.setActivo(false);
    } else {
      ultimoTickFiredRef.current = tickActual;
      if (usoMetronomo && !metronomo.activo) metronomo.setActivo(true);
      await motorAudioPro.activarContexto();
      await reproductor.play(tickActual);
    }
  }, [grabador.grabando, reproductor, tickActual, metronomo, usoMetronomo, ultimoTickFiredRef]);

  const detenerTodo = useCallback(() => {
    cancelarPreroll();
    if (grabador.grabando) grabador.cancelar();
    reproductor.detener();
    if (metronomo.activo) metronomo.setActivo(false);
    setTickActual(0);
  }, [grabador, reproductor, metronomo, cancelarPreroll]);

  const seekA = useCallback((tick: number) => {
    if (grabador.grabando) return;
    apagarTodasNotasPlayback();
    setTickActual(tick);
    reproductor.seek(tick);
    ultimoTickFiredRef.current = tick;
  }, [grabador.grabando, reproductor, apagarTodasNotasPlayback, ultimoTickFiredRef]);

  const iniciarGrabacionNueva = useCallback(async () => {
    if (audioUrl && !reproductor.cargado && !reproductor.cargando) {
      try { await reproductor.cargar(audioUrl); } catch (e: any) { setMensajeError(`No se pudo cargar la pista: ${e.message || e}`); return; }
    }
    await motorAudioPro.activarContexto();
    reproductor.detener();
    setTickActual(0);
    if (!audioUrl) { if (!metronomo.activo) metronomo.setActivo(true); setUsoMetronomo(true); }
    grabador.iniciar({ tipo: 'nuevo' });
    await reproductor.play(0);
  }, [audioUrl, reproductor, grabador, metronomo]);

  const grabarSeccion = useCallback(async (s: SeccionV2) => {
    if (audioUrl && !reproductor.cargado && !reproductor.cargando) {
      try { await reproductor.cargar(audioUrl); } catch (e: any) { setMensajeError(`No se pudo cargar la pista: ${e.message || e}`); return; }
    }
    await motorAudioPro.activarContexto();
    cancelarPreroll();
    reproductor.detener();

    const factor = (bpm / 60) * 192;
    const prerollTicks = Math.floor(Math.max(0, prerollSeg) * factor);
    const tickPlayStart = Math.max(0, s.tickInicio - prerollTicks);
    const tieneMargenPreroll = tickPlayStart < s.tickInicio;

    setTickActual(tickPlayStart);
    await reproductor.play(tickPlayStart);

    if (tieneMargenPreroll) {
      setEnPreroll(true);
      setPrerollRestanteSeg(prerollSeg);
      const inicio = Date.now();
      const tickerVisual = window.setInterval(() => {
        const restante = Math.max(0, prerollSeg - (Date.now() - inicio) / 1000);
        setPrerollRestanteSeg(restante);
        if (restante <= 0) window.clearInterval(tickerVisual);
      }, 100);
      grabacionPendienteRef.current = window.setTimeout(() => {
        window.clearInterval(tickerVisual);
        grabacionPendienteRef.current = 0;
        setEnPreroll(false);
        setPrerollRestanteSeg(0);
        grabador.iniciar({ tipo: 'punch', rango: { tickInicio: s.tickInicio, tickFin: s.tickFin } });
      }, prerollSeg * 1000);
    } else {
      grabador.iniciar({ tipo: 'punch', rango: { tickInicio: s.tickInicio, tickFin: s.tickFin } });
    }
  }, [audioUrl, reproductor, grabador, bpm, prerollSeg, cancelarPreroll]);

  const detenerGrabacion = useCallback(() => {
    cancelarPreroll();
    const m = grabador.modo;
    const finales = grabador.detener();
    reproductor.detener();
    if (m?.tipo === 'punch' && m.rango) {
      setSecuencia(prev => mezclarPunchIn(prev, finales, m.rango!.tickInicio, m.rango!.tickFin));
    } else {
      setSecuencia(finales);
    }
  }, [grabador, reproductor, cancelarPreroll]);

  // ─── Secciones ──────────────────────────────────────────────────────────────
  const agregarSeccion = useCallback((s: Omit<SeccionV2, 'id'>) => {
    setSecciones(prev => [...prev, { ...s, id: uuid() }].sort((a, b) => a.tickInicio - b.tickInicio));
  }, []);
  const actualizarSeccion = useCallback((id: string, cambios: Partial<SeccionV2>) => {
    setSecciones(prev => prev.map(s => s.id === id ? { ...s, ...cambios } : s));
  }, []);
  const eliminarSeccion = useCallback((id: string) => {
    setSecciones(prev => prev.filter(s => s.id !== id));
  }, []);

  // ─── Guardar / eliminar ─────────────────────────────────────────────────────
  const guardar = useCallback(async () => {
    if (!cancionId) { setMensajeError('Subí una canción primero.'); return; }
    setEstadoGuardado('guardando');
    setMensajeError(null);
    try {
      const { grabacionId: nuevoId } = await guardarCancionEstudio({
        pistaId: cancionId, grabacionId,
        titulo: titulo || 'Sin título',
        bpm, resolucion: 192,
        tonalidad: logica.tonalidadSeleccionada ?? null,
        usoMetronomo, secuencia, secciones,
        duracionSeg: reproductor.duracionSeg || duracionSegCancion || null,
      });
      setGrabacionId(nuevoId);
      setEstadoGuardado('guardado');
      void refrescarLista();
      window.setTimeout(() => setEstadoGuardado('idle'), 2000);
    } catch (e: any) {
      setEstadoGuardado('error');
      setMensajeError(`Error guardando: ${e.message || e}`);
    }
  }, [cancionId, grabacionId, titulo, bpm, usoMetronomo, secuencia, secciones, reproductor.duracionSeg, duracionSegCancion, refrescarLista, logica.tonalidadSeleccionada]);

  const eliminarCancionDeLista = useCallback(async (c: any) => {
    if (!window.confirm(`¿Eliminar "${c.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await eliminarCancionEstudio({ id: c.id, storage_path: (c as CancionEstudio).storage_path });
      void refrescarLista();
    } catch (e: any) {
      setMensajeError(`Error eliminando: ${e.message || e}`);
    }
  }, [refrescarLista]);

  // ─── Descargas (offline + fallback) ─────────────────────────────────────────
  const descargas = useDescargaEstudio({
    reproductor, bpm, totalTicks, secuencia, vista,
    logicaRef, ultimoTickFiredRef, setTickActual, setMensajeError, cargarEnEditor,
  });

  return {
    // lista
    vista, canciones, cargandoLista, cancionId, limite, esPremium, enLimite,
    refrescarLista, cargarEnEditor, eliminarCancionDeLista, pedirNueva,
    // upload
    fileNuevaRef, onArchivoNueva, subiendo,
    // editor / transporte
    titulo, setTitulo, autor, setAutor, bpm, setBpmState, velocidad, setVelocidad,
    audioUrl, usoMetronomo, setUsoMetronomo, metronomoExpandido, setMetronomoExpandido, metronomo,
    totalTicks, tickActual, secuencia, secciones, reproductor, grabador,
    prerollSeg, setPrerollSeg, enPreroll, prerollRestanteSeg,
    enGrabacionPunch: grabador.grabando && grabador.modo?.tipo === 'punch',
    enGrabacionNueva: grabador.grabando && grabador.modo?.tipo === 'nuevo',
    seekA, togglePlay, detenerTodo, cancelarPreroll, iniciarGrabacionNueva, detenerGrabacion,
    agregarSeccion, actualizarSeccion, eliminarSeccion, grabarSeccion, volverALista,
    guardar, estadoGuardado,
    // estado / errores
    mensajeError, setMensajeError,
    // descargas
    ...descargas,
  };
}
