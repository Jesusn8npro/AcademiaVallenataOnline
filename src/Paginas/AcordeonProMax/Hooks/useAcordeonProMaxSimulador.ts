import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../servicios/clienteSupabase';
import { useLogicaProMax } from './useLogicaProMax';

export function useAcordeonProMaxSimulador() {
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
    if (searchId) {
      cargarCancion(searchId, false);
    } else if (slug) {
      const esProbableId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      cargarCancion(slug, !esProbableId);
    } else {
      hero.iniciarPracticaLibre();
    }
    return () => { montado = false; };
  }, [slug, searchParams]);

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
    hero.volverASeleccion();
    navigate('/acordeon-pro-max/lista');
  };

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
