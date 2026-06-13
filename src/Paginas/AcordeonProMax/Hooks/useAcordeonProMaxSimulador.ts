import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from '@/compat/router';
import { supabase } from '../../../servicios/clienteSupabase';
import { useLogicaProMax } from './useLogicaProMax';

// opts (opcional): permite EMBEBER el simulador fuera de su ruta (ej. el duelo del Mundo 3D):
//   idDirecto   → carga la canción por id en vez de leerla de la URL (slug/searchParams).
//   onSalir     → "volver" llama esto en vez de navegar (se queda en el mundo).
//   onResultado → se dispara UNA vez con el puntaje al terminar (resultados/gameOver) → el duelo lo captura.
//   autoIniciar → SALTA la pantalla de pre-juego: arranca solo, competitivo, SIN maestro/guía (evita el
//                 doble acordeón), en cuanto la canción y el diseño cargan.
//   seccionId   → arranca directamente en esa sección de la canción.
export function useAcordeonProMaxSimulador(opts?: { idDirecto?: string; onSalir?: () => void; onResultado?: (puntos: number) => void; autoIniciar?: boolean; seccionId?: string | null }) {
  const idDirecto = opts?.idDirecto;
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hero = useLogicaProMax();

  const [metronomoVisible, setMetronomoVisible] = useState(false);
  const [modoAjuste, setModoAjuste] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState<'diseno' | 'sonido'>('diseno');
  const [headerHeight, setHeaderHeight] = useState(0);
  const botonMetronomoRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    const debePausar = hero.estadoJuego === 'pausado'
      || hero.estadoJuego === 'pausado_synthesia'
      || hero.estadoJuego === 'resultados'
      || hero.estadoJuego === 'gameOver';
    const comando = debePausar ? 'pauseVideo' : 'playVideo';
    try {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: comando, args: [] }),
        '*'
      );
    } catch { }
  }, [hero.estadoJuego]);

  useEffect(() => {
    if (!iframeRef.current || !hero.cancionSeleccionada?.bpm) return;
    const bpmOriginal = hero.cancionSeleccionada.bpm;
    const bpmActual = hero.bpm;
    const playbackRate = Math.max(0.25, Math.min(2, bpmActual / bpmOriginal));
    try {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'setPlaybackRate', args: [playbackRate, true] }),
        '*'
      );
    } catch { }
  }, [hero.bpm, hero.cancionSeleccionada?.bpm]);

  // El metrónomo síncrono del Simulador ya está manejado en useLogicaProMax (engancha
  // 'click_fuerte'/'click_debil' al onBeat del reproductor cuando cancionSeleccionada
  // tiene usoMetronomo). NO instanciar useMetronomo aquí en paralelo — causaría doble
  // click desfasado. La sincronización con el slider de BPM es automática porque el
  // onBeat se dispara en cada beat real del reproductor.

  useEffect(() => {
    let montado = true;
    const cargarCancion = async (identificador: string, esSlug: boolean) => {
      try {
        let query = supabase.from('canciones_hero').select('*');
        if (esSlug) {
          query = query.eq('slug', identificador);
        } else {
          query = query.eq('id', identificador);
        }
        const { data, error } = await query.single();
        if (error) throw error;
        if (data && montado) {
          const cancionData = data as any;
          // Preferir secuencia_json (donde se persisten ediciones por punch-in) sobre secuencia legacy.
          let secuenciaStr = cancionData.secuencia_json || cancionData.secuencia;
          let secuencia: any[] = [];
          if (typeof secuenciaStr === 'string') {
            try { secuencia = JSON.parse(secuenciaStr); } catch { secuencia = []; }
          } else if (Array.isArray(secuenciaStr)) {
            secuencia = secuenciaStr;
          }
          hero.seleccionarCancion({ ...cancionData, secuencia });
        }
      } catch {
        if (montado) hero.iniciarPracticaLibre();
      }
    };
    const searchId = searchParams.get('id');
    if (idDirecto) {
      cargarCancion(idDirecto, false); // embebido (duelo): carga por id, ignora la URL
    } else if (searchId) {
      cargarCancion(searchId, false);
    } else if (slug) {
      const esProbableId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      cargarCancion(slug, !esProbableId);
    } else {
      hero.iniciarPracticaLibre();
    }
    return () => { montado = false; };
  }, [slug, searchParams, idDirecto]);

  useEffect(() => {
    const handlePausaGlobal = (e: KeyboardEvent) => {
      if (hero.estadoJuego === 'jugando' && e.key === 'Escape') {
        e.preventDefault();
        hero.pausarJuego();
      }
    };
    window.addEventListener('keydown', handlePausaGlobal);
    return () => window.removeEventListener('keydown', handlePausaGlobal);
  }, [hero.estadoJuego, hero.pausarJuego]);

  const volverAlMenu = () => {
    if (opts?.onSalir) { opts.onSalir(); return; } // embebido: no navega, vuelve al mundo
    hero.volverASeleccion();
    navigate('/acordeon-pro-max/lista');
  };

  // Embebido (duelo): avisar UNA vez con el puntaje al terminar la partida.
  const onResultadoRef = useRef(opts?.onResultado);
  useEffect(() => { onResultadoRef.current = opts?.onResultado; }, [opts?.onResultado]);
  const resultadoEnviadoRef = useRef(false);
  useEffect(() => {
    if (resultadoEnviadoRef.current) return;
    if (hero.estadoJuego === 'resultados' || hero.estadoJuego === 'gameOver') {
      resultadoEnviadoRef.current = true;
      onResultadoRef.current?.(hero.estadisticas?.puntos ?? 0);
    }
  }, [hero.estadoJuego, hero.estadisticas]);

  // Embebido (duelo) con autoIniciar: SALTA el pre-juego. En cuanto la canción está seleccionada y el
  // diseño del acordeón cargó, arranca SOLO en competitivo con el MAESTRO APAGADO (sin acordeón guía →
  // no hay doble sonido) y en la sección pedida. Forzamos modoPractica='ninguno' por argumento.
  const autoIniciadoRef = useRef(false);
  useEffect(() => {
    if (!opts?.autoIniciar || autoIniciadoRef.current) return;
    if (hero.estadoJuego !== 'seleccion' || !hero.cancionSeleccionada) return;
    if (!hero.logica?.disenoCargado) return;
    autoIniciadoRef.current = true;
    hero.setMaestroSuena(false);
    const secId = opts?.seccionId;
    if (secId && typeof hero.seleccionarSeccion === 'function') {
      let secs: any = (hero.cancionSeleccionada as any)?.secciones || [];
      if (typeof secs === 'string') { try { secs = JSON.parse(secs); } catch { secs = []; } }
      const sec = Array.isArray(secs) ? secs.find((s: any) => s.id === secId) : null;
      if (sec) hero.seleccionarSeccion(sec);
    }
    Promise.resolve(hero.iniciarJuego(hero.cancionSeleccionada, false, 'ninguno')).catch(() => {});
  }, [opts?.autoIniciar, opts?.seccionId, hero.estadoJuego, hero.cancionSeleccionada, hero.logica?.disenoCargado]);

  // GUARD de tonalidad (solo embebido/duelo): los ajustes del usuario cargan de la nube y PISAN la
  // tonalidad de la canción (se veía "Tono F-Bb-Eb" en una canción GDC). Forzamos SIEMPRE la tonalidad
  // de la canción. NO forzamos el instrumento: cambiarlo dispara una RECARGA del banco de samples que
  // pelea con iniciarJuego → causaba el RETARDO en la ejecución (la página oficial tampoco lo fuerza).
  // El pitch correcto lo da la tonalidad; el instrumento sólo cambia el timbre.
  useEffect(() => {
    if (!idDirecto) return;
    const L = hero.logica;
    if (!L) return;
    const tono = (hero.cancionSeleccionada as any)?.tonalidad;
    if (tono && L.setTonalidadSeleccionada && L.tonalidadSeleccionada !== tono) L.setTonalidadSeleccionada(tono);
  }, [idDirecto, hero.cancionSeleccionada, hero.logica?.tonalidadSeleccionada, hero.logica?.setTonalidadSeleccionada]);

  const irAModoLibre = () => {
    hero.iniciarPracticaLibre();
    navigate('/acordeon-pro-max/acordeon');
  };

  const mostrarSeleccion = hero.estadoJuego === 'seleccion';
  const mostrarResultados = hero.estadoJuego === 'resultados' && Boolean(hero.cancionSeleccionada);
  const mostrarGameOver = hero.estadoJuego === 'gameOver' && Boolean(hero.cancionSeleccionada);
  const mostrarHeaderHero = !['seleccion', 'resultados', 'gameOver'].includes(hero.estadoJuego);
  const mostrarEscenario = !mostrarSeleccion;
  const mostrarVideoFondo = Boolean(
    mostrarEscenario &&
    hero.cancionSeleccionada?.youtube_id &&
    hero.modoPractica !== 'maestro_solo'
  );

  return {
    hero,
    metronomoVisible, setMetronomoVisible,
    modoAjuste, setModoAjuste,
    pestanaActiva, setPestanaActiva,
    headerHeight, setHeaderHeight,
    botonMetronomoRef,
    iframeRef,
    volverAlMenu,
    irAModoLibre,
    mostrarSeleccion,
    mostrarResultados,
    mostrarGameOver,
    mostrarHeaderHero,
    mostrarEscenario,
    mostrarVideoFondo,
  };
}
