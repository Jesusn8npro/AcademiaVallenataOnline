import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, Square, Mic, Save, RotateCcw,
  Upload, Loader2, AlertCircle, Music, ListMusic,
} from 'lucide-react';

import CuerpoAcordeonBase from '../../../Core/componentes/CuerpoAcordeon';
import { useLogicaAcordeon } from '../../../Core/hooks/useLogicaAcordeon';
import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';

import { useRelojUnificado } from './hooks/useRelojUnificado';
import { useReproductorMP3V2 } from './hooks/useReproductorMP3V2';
import { useMetronomoV2 } from './hooks/useMetronomoV2';
import { useGrabadorV2 } from './hooks/useGrabadorV2';
import { useAntiNotasPegadas } from './hooks/useAntiNotasPegadas';
import { useRAFPlayback } from './hooks/useRAFPlayback';

import VisorCapturaEnVivo from './componentes/VisorCapturaEnVivo';
import TimelineV2 from './componentes/TimelineV2';
import EditorSeccionesV2 from './componentes/EditorSeccionesV2';
import ListaCancionesV2 from './componentes/ListaCancionesV2';
import PanelMetronomoStudio from './componentes/PanelMetronomoStudio';
import BarraSuperiorV2, { type TabGrabadorV2 } from './componentes/BarraSuperiorV2';
import PanelGestorV2 from './componentes/PanelGestorV2';
import PanelCrearAcordeV2 from './componentes/PanelCrearAcordeV2';
import PanelUSBV2 from './componentes/PanelUSBV2';
import PanelPistasAdmin from './componentes/PanelPistasAdmin';
import ModalListaAcordes from '../../../Core/componentes/ModalListaAcordes';
import { useReproductorAcordesV2 } from './hooks/useReproductorAcordesV2';

import {
  listarCancionesV2, crearCancionV2, actualizarCancionV2,
  subirAudioFondoV2, mezclarPunchIn,
} from './servicioGrabadorV2';
import { supabase } from '../../../servicios/clienteSupabase';
import type { CancionV2, NotaHero, SeccionV2 } from './tipos';
import './PaginaGrabadorV2.css';

const CuerpoAcordeon = React.memo(CuerpoAcordeonBase);
const IMG_ACORDEON = '/Acordeon PRO MAX.webp';

function uuid() { return `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }

function totalTicksDe(secuencia: NotaHero[], duracionSeg: number, bpm: number, resolucion: number): number {
  const factor = (bpm / 60) * resolucion;
  const porAudio = Math.ceil((duracionSeg || 0) * factor);
  const porNotas = secuencia.reduce((m, n) => Math.max(m, n.tick + n.duracion), 0);
  return Math.max(porAudio, porNotas, factor * 16); // fallback: 16 beats si todo está vacío
}

const PaginaGrabadorV2: React.FC = () => {
  const navigate = useNavigate();

  // El fuelle de cada nota se deriva del propio `data.idBoton` (ej: "primeraFila-3-halar" o
  // "primeraFila-3-empujar"). Esto es 100% síncrono y elimina la race condition de leer
  // logica.direccion (que solo se actualiza tras useEffect, una render de delay).
  const logica = useLogicaAcordeon({
    onNotaPresionada: (data: any) => {
      const id = String(data.idBoton ?? '');
      const fuelle: 'abriendo' | 'cerrando' = id.includes('-halar') ? 'abriendo' : 'cerrando';
      grabadorRef.current?.capturarPress(id, fuelle);
    },
    onNotaLiberada: (data: any) => {
      grabadorRef.current?.capturarRelease(String(data.idBoton ?? ''));
    },
  });

  // ------------------------------------------------------------
  // ESTADO DE LA CANCIÓN
  // ------------------------------------------------------------
  const [vista, setVista] = useState<'lista' | 'editor'>('lista');
  const [canciones, setCanciones] = useState<CancionV2[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [cancionId, setCancionId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('Jesus Gonzalez');
  const [bpm, setBpmState] = useState(120);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [secuencia, setSecuencia] = useState<NotaHero[]>([]);
  const [secciones, setSecciones] = useState<SeccionV2[]>([]);
  const [tickActual, setTickActual] = useState(0);
  const [usoMetronomo, setUsoMetronomo] = useState(false);
  const [estadoGuardado, setEstadoGuardado] = useState<'idle' | 'guardando' | 'guardado' | 'error'>('idle');
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Pre-roll: segundos que el MP3 suena ANTES de que arranque la grabación. Le da al usuario
  // tiempo para ubicar las manos y entrar al ritmo. Solo aplica a punch-in de secciones.
  const [prerollSeg, setPrerollSeg] = useState(2);
  const [enPreroll, setEnPreroll] = useState(false);
  const [prerollRestanteSeg, setPrerollRestanteSeg] = useState(0);
  const grabacionPendienteRef = useRef<number>(0);

  // Velocidad de reproducción/grabación. 1.0 = velocidad original. Permite ralentizar canciones
  // rápidas para aprenderlas o grabarlas más fácil. Los TICKS son musicales (invariantes a la
  // velocidad), así que grabar a 50% deja la canción guardada a tempo original — al volver a
  // 100% las notas suenan al ritmo correcto. Internamente: reloj.bpm = bpm * velocidad y
  // MP3.playbackRate = velocidad.
  const [velocidad, setVelocidad] = useState(1.0);

  // Tab activo del header. La pestaña Canciones contiene la lista + editor que ya teníamos.
  // Las otras pestañas son nuevas (Gestor / Crear / Acordes / USB).
  const [tabActivo, setTabActivo] = useState<TabGrabadorV2>('canciones');

  // Si el metrónomo está expandido en el panel del modo (toggle visible/oculto del config).
  const [metronomoExpandido, setMetronomoExpandido] = useState(false);

  // Acorde en edición (cuando el usuario hace click en ✏️ desde la lista, lo cargamos en Crear).
  const [acordeAEditar, setAcordeAEditar] = useState<any | null>(null);

  // ------------------------------------------------------------
  // RELOJ + REPRODUCTOR + METRÓNOMO + GRABADOR
  // ------------------------------------------------------------
  const reloj = useRelojUnificado(bpm, 192);
  const reproductor = useReproductorMP3V2(reloj);
  const metronomo = useMetronomoV2(reloj);
  const grabador = useGrabadorV2(reloj);

  // Ref para que los callbacks de useLogicaAcordeon usen siempre el grabador actual.
  const grabadorRef = useRef(grabador);
  useEffect(() => { grabadorRef.current = grabador; }, [grabador]);

  // logicaRef se usa también en useAntiNotasPegadas y en el RAF de playback más abajo.
  const logicaRef = useRef(logica);
  useEffect(() => { logicaRef.current = logica; }, [logica]);

  useAntiNotasPegadas(logicaRef);

  // Sincronizar bpm → reloj.
  // Reloj corre al BPM "efectivo" = bpm guardado × velocidad. Si velocidad=1.0, suena al
  // tempo original. Si 0.5, todo a la mitad de velocidad pero los ticks musicales son
  // invariantes (la canción guardada NO se modifica).
  useEffect(() => {
    reloj.setBpm(Math.round(bpm * velocidad));
  }, [bpm, velocidad, reloj]);

  // El MP3 se acelera/ralentiza junto con el reloj. AudioBufferSourceNode no preserva pitch
  // (limitación de Web Audio nativo) — al ralentizar se escucha más grave; útil igual para
  // estudiar ritmo.
  useEffect(() => {
    reproductor.setPlaybackRate(velocidad);
  }, [velocidad, reproductor]);

  // ------------------------------------------------------------
  // CARGA DE LISTA
  // ------------------------------------------------------------
  const refrescarLista = useCallback(async () => {
    setCargandoLista(true);
    try {
      const lista = await listarCancionesV2();
      setCanciones(lista);
    } catch (e: any) {
      setMensajeError(`Error cargando canciones: ${e.message || e}`);
    } finally {
      setCargandoLista(false);
    }
  }, []);

  useEffect(() => { void refrescarLista(); }, [refrescarLista]);

  // ------------------------------------------------------------
  // CARGAR / RESETEAR CANCIÓN EN EDITOR
  // ------------------------------------------------------------
  const cargarEnEditor = useCallback(async (c: CancionV2) => {
    reproductor.detener();
    grabador.cancelar();
    // Apagar metrónomo al cambiar de canción para evitar arrastrar estado entre canciones.
    metronomo.setActivo(false);
    setCancionId(c.id);
    setTitulo(c.titulo);
    setAutor(c.autor);
    setBpmState(c.bpm);
    metronomo.setBpm(c.bpm);
    setVelocidad(1.0);
    setAudioUrl(c.audio_fondo_url);
    setSecuencia(c.secuencia_json);
    setSecciones(c.secciones);
    setUsoMetronomo(c.usoMetronomo);
    // Restaurar la tonalidad con la que se grabó la canción → el acordeón muestra los mismos
    // botones/notas que el maestro vio al grabar. Si la canción no tiene tonalidad guardada
    // (datos viejos), no toca la tonalidad actual.
    if (c.tonalidad) {
      try { logica.setTonalidadSeleccionada(c.tonalidad); } catch (_) {}
    }
    setTickActual(0);
    setEstadoGuardado('idle');
    setMensajeError(null);
    setVista('editor');
    if (c.audio_fondo_url) {
      try { await reproductor.cargar(c.audio_fondo_url); } catch (e: any) {
        setMensajeError(`Error cargando audio: ${e.message || e}`);
      }
    }
  }, [reproductor, grabador, metronomo]);

  const nuevoEditor = useCallback(() => {
    reproductor.detener();
    grabador.cancelar();
    setCancionId(null);
    setTitulo('');
    setAutor('Jesus Gonzalez');
    setBpmState(120);
    setVelocidad(1.0);
    setAudioUrl(null);
    setSecuencia([]);
    setSecciones([]);
    setTickActual(0);
    setUsoMetronomo(false);
    setEstadoGuardado('idle');
    setMensajeError(null);
    setVista('editor');
  }, [reproductor, grabador]);

  const volverALista = useCallback(() => {
    reproductor.detener();
    grabador.cancelar();
    metronomo.setActivo(false);
    setVista('lista');
  }, [reproductor, grabador, metronomo]);

  // RAF: tickActual + disparo de notas en playback. Refs internos al hook (ver useRAFPlayback.ts).
  const { apagarTodasNotasPlayback, ultimoTickFiredRef } = useRAFPlayback({
    reproduciendo: reproductor.reproduciendo,
    grabando: grabador.grabando,
    secuencia,
    bpm,
    tickActual,
    reloj,
    logicaRef,
    setTickActual,
  });

  // ------------------------------------------------------------
  // TRANSPORTE
  // ------------------------------------------------------------
  const totalTicks = useMemo(
    () => totalTicksDe(secuencia, reproductor.duracionSeg, bpm, 192),
    [secuencia, reproductor.duracionSeg, bpm],
  );

  // cancelarPreroll DEBE declararse antes de detenerTodo / detenerGrabacion / grabarSeccion porque
  // esos useCallback lo incluyen en sus deps. El TDZ de `const` rompe si se referencia primero.
  const cancelarPreroll = useCallback(() => {
    if (grabacionPendienteRef.current) {
      window.clearTimeout(grabacionPendienteRef.current);
      grabacionPendienteRef.current = 0;
    }
    setEnPreroll(false);
    setPrerollRestanteSeg(0);
  }, []);

  const togglePlay = useCallback(async () => {
    if (grabador.grabando) return; // no tocar play durante grabación
    if (reproductor.reproduciendo) {
      reproductor.pause();
      // Pausar el metrónomo cuando se pausa la pista — sino sigue clicando solo y queda raro.
      if (metronomo.activo) metronomo.setActivo(false);
    } else {
      ultimoTickFiredRef.current = tickActual;
      // Si la canción se grabó con metrónomo, prenderlo automáticamente al hacer play. La fix
      // de `anclaVersionRef` en useMetronomoV2 garantiza que los clicks queden alineados con
      // el ancla nuevo del reproductor → playback idéntico a cuando se grabó.
      if (usoMetronomo && !metronomo.activo) metronomo.setActivo(true);
      await reproductor.play(tickActual);
    }
  }, [grabador.grabando, reproductor, tickActual, metronomo, usoMetronomo]);

  const detenerTodo = useCallback(() => {
    cancelarPreroll();
    if (grabador.grabando) grabador.cancelar();
    reproductor.detener();
    setTickActual(0);
  }, [grabador, reproductor, cancelarPreroll]);

  const seekA = useCallback((tick: number) => {
    if (grabador.grabando) return;
    apagarTodasNotasPlayback();
    setTickActual(tick);
    reproductor.seek(tick);
    ultimoTickFiredRef.current = tick;
  }, [grabador.grabando, reproductor, apagarTodasNotasPlayback]);

  // ------------------------------------------------------------
  // GRABACIÓN — modo NUEVO (regraba toda la canción)
  // ------------------------------------------------------------
  const iniciarGrabacionNueva = useCallback(async () => {
    if (audioUrl && !reproductor.cargado && !reproductor.cargando) {
      // Re-intentar cargar la pista si por alguna razón no quedó decodificada.
      try { await reproductor.cargar(audioUrl); } catch (e: any) {
        setMensajeError(`No se pudo cargar la pista: ${e.message || e}`);
        return;
      }
    }
    await motorAudioPro.activarContexto();
    reproductor.detener();
    setTickActual(0);
    // Si NO hay pista, encender el metrónomo automáticamente (igual que el flow del admin viejo).
    // El metrónomo es la referencia de tempo cuando no hay MP3, y se persiste con `usoMetronomo`
    // para que al recargar la canción el metrónomo se prenda solo.
    if (!audioUrl) {
      if (!metronomo.activo) metronomo.setActivo(true);
      setUsoMetronomo(true);
    }
    grabador.iniciar({ tipo: 'nuevo' });
    await reproductor.play(0);
  }, [audioUrl, reproductor, grabador, metronomo]);

  // ------------------------------------------------------------
  // GRABACIÓN — modo PUNCH-IN sobre una sección existente
  //
  // Con pre-roll: el MP3 arranca `prerollSeg` segundos ANTES del tickInicio. Durante esos
  // segundos NO grabamos — solo el usuario escucha la música y prepara las manos. Cuando el
  // playhead cruza tickInicio, recién ahí `grabador.iniciar` activa la captura.
  // ------------------------------------------------------------
  const grabarSeccion = useCallback(async (s: SeccionV2) => {
    if (audioUrl && !reproductor.cargado && !reproductor.cargando) {
      try { await reproductor.cargar(audioUrl); } catch (e: any) {
        setMensajeError(`No se pudo cargar la pista: ${e.message || e}`);
        return;
      }
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
      // El playhead entrará al rango de grabación después de prerollSeg segundos. Mientras tanto
      // el banner cuenta hacia atrás y la barra muestra "preparate". El grabador NO captura.
      setEnPreroll(true);
      setPrerollRestanteSeg(prerollSeg);
      // Timer visual: actualiza el contador cada 100ms para que el usuario vea el countdown.
      const inicio = Date.now();
      const tickerVisual = window.setInterval(() => {
        const elapsedSeg = (Date.now() - inicio) / 1000;
        const restante = Math.max(0, prerollSeg - elapsedSeg);
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

  // ------------------------------------------------------------
  // DETENER GRABACIÓN — merge con secuencia previa según modo
  // ------------------------------------------------------------
  const detenerGrabacion = useCallback(() => {
    cancelarPreroll();
    const m = grabador.modo;
    const finales = grabador.detener();
    reproductor.detener();
    if (m?.tipo === 'punch' && m.rango) {
      setSecuencia(prev => mezclarPunchIn(prev, finales, m.rango!.tickInicio, m.rango!.tickFin));
    } else {
      // Modo nuevo: reemplaza todo.
      setSecuencia(finales);
    }
  }, [grabador, reproductor, cancelarPreroll]);

  // ------------------------------------------------------------
  // SECCIONES
  // ------------------------------------------------------------
  const agregarSeccion = useCallback((s: Omit<SeccionV2, 'id'>) => {
    setSecciones(prev => [...prev, { ...s, id: uuid() }].sort((a, b) => a.tickInicio - b.tickInicio));
  }, []);
  const actualizarSeccion = useCallback((id: string, cambios: Partial<SeccionV2>) => {
    setSecciones(prev => prev.map(s => s.id === id ? { ...s, ...cambios } : s));
  }, []);
  const eliminarSeccion = useCallback((id: string) => {
    setSecciones(prev => prev.filter(s => s.id !== id));
  }, []);

  // ------------------------------------------------------------
  // SUBIR MP3
  // ------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subirMP3 = useCallback(async (file: File) => {
    setMensajeError(null);
    let idActual = cancionId;
    let url: string;
    try {
      if (!idActual) {
        const creada = await crearCancionV2({
          titulo: titulo || 'Nueva canción',
          autor, bpm,
          audio_fondo_url: null,
          secuencia_json: secuencia,
          secciones,
          usoMetronomo,
          tonalidad: logica.tonalidadSeleccionada,
        });
        idActual = creada.id;
        setCancionId(creada.id);
      }
      url = await subirAudioFondoV2(file, idActual);
      await actualizarCancionV2(idActual, { audio_fondo_url: url });
      setAudioUrl(url);
    } catch (e: any) {
      setMensajeError(`Error subiendo MP3 a Supabase: ${e.message || e}`);
      return;
    }
    // Carga + decode separado: si esto falla, la pista quedó subida pero no se puede reproducir.
    try {
      await reproductor.cargar(url);
      if (!reproductor.cargado) {
        setMensajeError('Pista subida pero no se pudo decodificar (formato no soportado).');
      }
    } catch (e: any) {
      setMensajeError(`Pista subida pero falló el decode: ${e.message || e}. Probá con otro MP3.`);
    }
    void refrescarLista();
  }, [cancionId, titulo, autor, bpm, secuencia, secciones, usoMetronomo, reproductor, refrescarLista, logica.tonalidadSeleccionada]);

  // ------------------------------------------------------------
  // GUARDAR
  // ------------------------------------------------------------
  const guardar = useCallback(async () => {
    setEstadoGuardado('guardando');
    setMensajeError(null);
    try {
      if (cancionId) {
        await actualizarCancionV2(cancionId, {
          titulo, autor, bpm, audio_fondo_url: audioUrl,
          secuencia_json: secuencia, secciones,
          duracion_segundos: reproductor.duracionSeg || null,
          usoMetronomo,
          tonalidad: logica.tonalidadSeleccionada,
        });
      } else {
        const creada = await crearCancionV2({
          titulo: titulo || 'Sin título',
          autor, bpm, audio_fondo_url: audioUrl,
          secuencia_json: secuencia, secciones, usoMetronomo,
          tonalidad: logica.tonalidadSeleccionada,
        });
        setCancionId(creada.id);
      }
      setEstadoGuardado('guardado');
      void refrescarLista();
      window.setTimeout(() => setEstadoGuardado('idle'), 2000);
    } catch (e: any) {
      setEstadoGuardado('error');
      setMensajeError(`Error guardando: ${e.message || e}`);
    }
  }, [cancionId, titulo, autor, bpm, audioUrl, secuencia, secciones, usoMetronomo, reproductor.duracionSeg, refrescarLista, logica.tonalidadSeleccionada]);

  // ------------------------------------------------------------
  // ACORDES — hook idéntico al original `useReproductorAcordesAdmin`. Maneja tocar individual,
  // tocar círculo completo, editar (cambia al tab Crear), nuevo desde círculo (idem).
  // ------------------------------------------------------------
  const acordes = useReproductorAcordesV2(
    logica,
    setAcordeAEditar,
    () => setTabActivo('crear'),
  );

  // Botones presionados FÍSICAMENTE para el creador de acordes (filtrar entries con instancias
  // reales — ignorar los del playback de secuencia que tienen instances=[]).
  const botonesPresionadosCrear = useMemo(() => {
    return Object.entries(logica.botonesActivos as Record<string, any>)
      .filter(([, v]) => Array.isArray(v?.instances) && v.instances.length > 0)
      .map(([id]) => id);
  }, [logica.botonesActivos]);

  // ------------------------------------------------------------
  // ELIMINAR canción de la lista
  // ------------------------------------------------------------
  const eliminarCancionDeLista = useCallback(async (c: CancionV2) => {
    if (!window.confirm(`¿Eliminar "${c.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await (supabase.rpc as any)('eliminar_canciones_hero', { p_ids: [c.id] });
      void refrescarLista();
    } catch (e: any) {
      setMensajeError(`Error eliminando: ${e.message || e}`);
    }
  }, [refrescarLista]);

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  const enGrabacionPunch = grabador.grabando && grabador.modo?.tipo === 'punch';
  const enGrabacionNueva = grabador.grabando && grabador.modo?.tipo === 'nuevo';

  return (
    <div className="grabv2-pagina">
      <BarraSuperiorV2
        tabActivo={tabActivo}
        onCambiarTab={(t) => {
          setTabActivo(t);
          // Si dejo el tab Crear, descarto el "acorde a editar" para volver a modo creación.
          if (t !== 'crear') setAcordeAEditar(null);
          // Si dejo el tab Acordes, detengo cualquier acorde sonando.
          if (t !== 'acordes' && acordes.acordeMaestroActivo) acordes.onDetener();
        }}
        nombreUsuario="JESUS GONZALEZ"
        onSalir={() => navigate('/acordeon-pro-max')}
      />

      {mensajeError && (
        <div className="grabv2-banner-error">
          <AlertCircle size={14} /> {mensajeError}
          <button onClick={() => setMensajeError(null)}>×</button>
        </div>
      )}

      <div className="grabv2-cuerpo">
        {/* IZQUIERDA: ACORDEÓN */}
        <div className="grabv2-izquierda">
          <CuerpoAcordeon
            imagenFondo={IMG_ACORDEON}
            ajustes={logica.ajustes}
            direccion={logica.direccion}
            configTonalidad={logica.configTonalidad}
            botonesActivos={logica.botonesActivos}
            modoAjuste={false}
            botonSeleccionado={null}
            modoVista={logica.modoVista}
            vistaDoble={logica.vistaDoble}
            setBotonSeleccionado={() => {}}
            actualizarBotonActivo={logica.actualizarBotonActivo}
            listo={logica.disenoCargado}
          />
        </div>

        {/* DERECHA: PANEL — switcheado por tabActivo */}
        <aside className="grabv2-derecha">
          {tabActivo === 'gestor' && <PanelGestorV2 logica={logica} />}

          {tabActivo === 'crear' && (
            <PanelCrearAcordeV2
              botonesSeleccionados={botonesPresionadosCrear}
              fuelleActual={logica.direccion === 'halar' ? 'abriendo' : 'cerrando'}
              tonalidadActual={logica.tonalidadSeleccionada}
              acordeAEditar={acordeAEditar}
              key={acordeAEditar?.id ?? 'nuevo'}
              onExitoUpdate={() => setAcordeAEditar(null)}
              onVerTodos={() => setTabActivo('acordes')}
            />
          )}

          {tabActivo === 'acordes' && (
            <ModalListaAcordes
              inline
              visible
              onCerrar={() => {}}
              onReproducirAcorde={acordes.onReproducirAcorde}
              onDetener={acordes.onDetener}
              idSonando={acordes.idSonandoCiclo || (acordes.acordeMaestroActivo ? 'activo' : null)}
              onEditarAcorde={acordes.onEditarAcorde}
              onNuevoAcordeEnCirculo={acordes.onNuevoAcordeEnCirculo}
              onReproducirCirculoCompleto={acordes.onReproducirCirculoCompleto}
              tonalidadActual={logica.tonalidadSeleccionada}
            />
          )}

          {tabActivo === 'usb' && (
            <PanelUSBV2
              conectado={logica.esp32Conectado}
              onConectar={logica.conectarESP32}
            />
          )}

          {tabActivo === 'pistas' && <PanelPistasAdmin />}

          {tabActivo === 'canciones' && vista === 'lista' && (
            <ListaCancionesV2
              canciones={canciones}
              cancionActivaId={cancionId}
              cargando={cargandoLista}
              onSeleccionar={cargarEnEditor}
              onNueva={nuevoEditor}
              onRefrescar={refrescarLista}
              onEliminar={eliminarCancionDeLista}
            />
          )}

          {tabActivo === 'canciones' && vista === 'editor' && (
            <>
              {/* Barra de acciones del editor: volver a lista + guardar */}
              <div className="grabv2-editor-acciones">
                <button className="grabv2-editor-volver" onClick={volverALista}>
                  ← Volver a la lista
                </button>
                <button
                  className={`grabv2-btn-guardar estado-${estadoGuardado}`}
                  onClick={guardar}
                  disabled={estadoGuardado === 'guardando' || grabador.grabando}
                >
                  {estadoGuardado === 'guardando' ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                  {estadoGuardado === 'guardado' ? '¡Guardado!' : 'Guardar'}
                </button>
              </div>

              {/* Datos básicos */}
              <div className="grabv2-bloque">
                <input
                  className="grabv2-input grabv2-titulo"
                  type="text"
                  placeholder="Título de la canción"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
                <input
                  className="grabv2-input"
                  type="text"
                  placeholder="Autor"
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                />
                <div className="grabv2-bpm-row">
                  <label>BPM</label>
                  <button className="grabv2-bpm-step" onClick={() => setBpmState(b => Math.max(30, b - 5))}>−</button>
                  <span className="grabv2-bpm-val">{bpm}</span>
                  <button className="grabv2-bpm-step" onClick={() => setBpmState(b => Math.min(300, b + 5))}>+</button>
                  <input
                    type="range"
                    min={30}
                    max={300}
                    value={bpm}
                    onChange={(e) => setBpmState(Number(e.target.value))}
                    className="grabv2-bpm-slider"
                  />
                </div>
              </div>

              {/* Modo de referencia: Pista MP3 o Metrónomo. Solo se muestra el contenido del
                  modo seleccionado para no abultar la columna. `usoMetronomo` es la fuente de
                  verdad: false = pista, true = metrónomo. Se persiste en la canción. */}
              <div className="grabv2-bloque">
                <div className="grabv2-bloque-titulo">Modo de referencia</div>
                <div className="grabv2-modo-toggle">
                  <button
                    className={`grabv2-modo-opcion ${!usoMetronomo ? 'activa' : ''}`}
                    onClick={() => setUsoMetronomo(false)}
                  >
                    <Music size={13} />
                    <span>Pista MP3</span>
                  </button>
                  <button
                    className={`grabv2-modo-opcion ${usoMetronomo ? 'activa' : ''}`}
                    onClick={() => setUsoMetronomo(true)}
                  >
                    <ListMusic size={13} />
                    <span>Metrónomo</span>
                  </button>
                </div>

                {!usoMetronomo ? (
                  <div className="grabv2-modo-contenido">
                    {audioUrl ? (
                      <div className="grabv2-mp3-cargado">
                        <span className="grabv2-mp3-ok">✓ pista cargada</span>
                        <span className="grabv2-mp3-dur">{reproductor.duracionSeg.toFixed(1)}s</span>
                      </div>
                    ) : (
                      <div className="grabv2-mp3-vacio">Sin pista — subí un MP3 para acompañar la grabación.</div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void subirMP3(f);
                        e.target.value = '';
                      }}
                    />
                    <button className="grabv2-btn-secundario" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={12} /> {audioUrl ? 'Reemplazar pista' : 'Subir pista MP3'}
                    </button>
                  </div>
                ) : (
                  <div className="grabv2-modo-contenido">
                    <button
                      className="grabv2-met-cabecera-toggle"
                      onClick={() => setMetronomoExpandido(v => !v)}
                    >
                      <span className="grabv2-met-resumen">
                        <Music size={12} /> {metronomo.bpm} BPM · {metronomo.compas}/4 ·
                        <span className={metronomo.activo ? 'on' : 'off'}>
                          {metronomo.activo ? ' ON' : ' OFF'}
                        </span>
                      </span>
                      <span className="grabv2-met-chevron">{metronomoExpandido ? '▾' : '▸'}</span>
                    </button>
                    {metronomoExpandido && <PanelMetronomoStudio met={metronomo} />}
                  </div>
                )}
              </div>

              {/* Transporte + timeline */}
              <div className="grabv2-bloque">
                <TimelineV2
                  totalTicks={totalTicks}
                  tickActual={tickActual}
                  secuencia={secuencia}
                  secciones={secciones}
                  bpm={bpm}
                  resolucion={192}
                  onSeek={seekA}
                />
                <div className="grabv2-transporte">
                  <button className="grabv2-btn-trans" onClick={() => seekA(0)} title="Al inicio">
                    <RotateCcw size={14} />
                  </button>
                  <button
                    className={`grabv2-btn-play ${reproductor.reproduciendo ? 'activo' : ''}`}
                    onClick={togglePlay}
                    disabled={grabador.grabando}
                  >
                    {reproductor.reproduciendo ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                  </button>
                  <button className="grabv2-btn-trans" onClick={detenerTodo} title="Detener todo">
                    <Square size={14} />
                  </button>
                  {enPreroll ? (
                    <button className="grabv2-btn-rec preroll" onClick={cancelarPreroll}>
                      <Square size={14} /> Cancelar preroll
                    </button>
                  ) : !grabador.grabando ? (
                    <button className="grabv2-btn-rec" onClick={iniciarGrabacionNueva}>
                      <Mic size={14} /> Grabar todo
                    </button>
                  ) : (
                    <button className="grabv2-btn-rec activa" onClick={detenerGrabacion}>
                      <Square size={14} /> Detener {enGrabacionPunch ? 'punch' : ''}
                    </button>
                  )}
                </div>
                <div className="grabv2-preroll-row">
                  <label>Pre-roll</label>
                  <button className="grabv2-bpm-step" onClick={() => setPrerollSeg(s => Math.max(0, s - 1))} disabled={enPreroll || grabador.grabando}>−</button>
                  <span className="grabv2-preroll-val">{prerollSeg}s</span>
                  <button className="grabv2-bpm-step" onClick={() => setPrerollSeg(s => Math.min(8, s + 1))} disabled={enPreroll || grabador.grabando}>+</button>
                  <span className="grabv2-preroll-hint">segundos antes de empezar a grabar la sección</span>
                </div>
                <div className="grabv2-velocidad-row">
                  <label>Velocidad</label>
                  <button className="grabv2-bpm-step" onClick={() => setVelocidad(v => Math.max(0.25, +(v - 0.05).toFixed(2)))}>−</button>
                  <span className={`grabv2-velocidad-val ${velocidad !== 1 ? 'modificada' : ''}`}>
                    {Math.round(velocidad * 100)}%
                  </span>
                  <button className="grabv2-bpm-step" onClick={() => setVelocidad(v => Math.min(2, +(v + 0.05).toFixed(2)))}>+</button>
                  <input
                    type="range"
                    min={0.25}
                    max={2}
                    step={0.05}
                    value={velocidad}
                    onChange={(e) => setVelocidad(parseFloat(e.target.value))}
                    className="grabv2-velocidad-slider"
                  />
                  {velocidad !== 1 && (
                    <button className="grabv2-velocidad-reset" onClick={() => setVelocidad(1)} title="Restaurar 100%">
                      ↺ {Math.round(bpm * velocidad)} BPM
                    </button>
                  )}
                </div>
                {enPreroll && (
                  <div className="grabv2-banner-preroll">
                    🎬 Preparate… <b>{prerollRestanteSeg.toFixed(1)}s</b> hasta que arranque la grabación
                  </div>
                )}
                {enGrabacionPunch && (
                  <div className="grabv2-banner-punch">
                    🎯 Grabando punch-in en sección [{grabador.modo?.rango?.tickInicio}, {grabador.modo?.rango?.tickFin}]. Las notas fuera del rango se ignoran.
                  </div>
                )}
                {enGrabacionNueva && (
                  <div className="grabv2-banner-grab">
                    ⏺ Grabando canción nueva. Detené para mezclar con la secuencia local.
                  </div>
                )}
              </div>

              {/* Visor en vivo */}
              <VisorCapturaEnVivo
                eventos={grabador.ultimosEventos}
                bpm={bpm}
                resolucion={192}
              />

              {/* Editor secciones */}
              <EditorSeccionesV2
                secciones={secciones}
                tickActual={tickActual}
                bpm={bpm}
                resolucion={192}
                puedeGrabar={!grabador.grabando}
                onAgregar={agregarSeccion}
                onActualizar={actualizarSeccion}
                onEliminar={eliminarSeccion}
                onSeek={seekA}
                onGrabarSeccion={grabarSeccion}
              />

              <div className="grabv2-bloque grabv2-resumen">
                <div className="grabv2-resumen-item">Notas: <b>{secuencia.length}</b></div>
                <div className="grabv2-resumen-item">Secciones: <b>{secciones.length}</b></div>
                <div className="grabv2-resumen-item">
                  Duración: <b>{((totalTicks / ((bpm / 60) * 192))).toFixed(1)}s</b>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default PaginaGrabadorV2;
