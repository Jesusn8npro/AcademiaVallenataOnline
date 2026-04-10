import React from 'react';
import HeaderHero from './Componentes/HeaderHero';
import FondoEspacialProMax from './Componentes/FondoEspacialProMax';
import { useLogicaProMax } from './Hooks/useLogicaProMax';
import ModalMetronomo from '../SimuladorApp/Componentes/ModalMetronomo';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../servicios/clienteSupabase';

// Componentes de Modos Pro Max
import ModoPracticaLibre from './Modos/ModoPracticaLibre';
import ModoMaestroSolo from './Modos/ModoMaestroSolo';
import ModoCompetitivo from './Modos/ModoCompetitivo';
import ModoLibre from './Modos/ModoLibre';
import ModoSynthesia from './Modos/ModoSynthesia';
import PantallaPreJuegoProMax from './Componentes/PantallaPreJuegoProMax';
import PantallaResultados from './Componentes/PantallaResultados';

import PantallaGameOverProMax from './Componentes/PantallaGameOverProMax';
import MenuPausaProMax from './Componentes/MenuPausaProMax';

import './Modos/_BaseSimulador.css';
import './Componentes/PantallaPreJuegoProMax.css';

/**
 * ACORDEÓN PRO MAX - SIMULADOR 
 * ---------------------------------
 * Esta es la evolución del simulador original, integrada en el ecosistema Pro Max.
 * Soporta modo "Práctica Libre" y modo "Canción" mediante slugs de URL.
 */

const IMG_ALUMNO = '/Acordeon PRO MAX.png';

const MODOS_VISTA: { valor: any; label: string }[] = [
  { valor: 'teclas',  label: 'T'   },
  { valor: 'numeros', label: '123' },
  { valor: 'notas',   label: '♪'   },
  { valor: 'cifrado', label: 'ABC' },
];

const AcordeonProMaxSimulador: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hero = useLogicaProMax();

  // Estados locales para UI
  const [metronomoVisible, setMetronomoVisible] = React.useState(false);
  const [modoAjuste, setModoAjuste] = React.useState(false);
  const [pestanaActiva, setPestanaActiva] = React.useState<'diseno' | 'sonido'>('diseno');
  const [headerHeight, setHeaderHeight] = React.useState(0);
  const botonMetronomoRef = React.useRef<HTMLDivElement>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // ── Sincronización de Video (YouTube) con Pausa/Reanudar ─────────────────
  React.useEffect(() => {
    if (!iframeRef.current) return;
    
    // El video de fondo se pausa en pausa, pausado_synthesia, resultados o game over
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
    } catch (e) {
      console.warn('Error al sincronizar video YouTube:', e);
    }
  }, [hero.estadoJuego]);

  // ── Sincronización de Velocidad del Video con BPM ──────────────────
  React.useEffect(() => {
    if (!iframeRef.current || !hero.cancionSeleccionada?.bpm) return;

    // Calculamos el ratio: BPM actual / BPM original
    const bpmOriginal = hero.cancionSeleccionada.bpm;
    const bpmActual = hero.bpm;
    const playbackRate = Math.max(0.25, Math.min(2, bpmActual / bpmOriginal));

    try {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'setPlaybackRate', args: [playbackRate, true] }),
        '*'
      );
    } catch (e) {
      console.warn('Error al ajustar velocidad de video YouTube:', e);
    }
  }, [hero.bpm, hero.cancionSeleccionada?.bpm]);

  // Efecto inicial: Si hay slug, cargar la canción. Si no, entrar en modo práctica.
  React.useEffect(() => {
    let montado = true;

    const cargarCancion = async (identificador: string, esSlug: boolean) => {
      try {
        console.log(`[Simulador] Cargando canción: ${identificador} (esSlug: ${esSlug})`);
        
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
          let secuenciaStr = cancionData.secuencia || cancionData.secuencia_json;
          let secuencia = [];

          if (typeof secuenciaStr === 'string') {
            try { secuencia = JSON.parse(secuenciaStr); } catch { secuencia = []; }
          } else if (Array.isArray(secuenciaStr)) {
            secuencia = secuenciaStr;
          }
          
          hero.seleccionarCancion({ ...cancionData, secuencia });
        }
      } catch (err) {
        console.error("Error cargando canción:", err);
        if (montado) hero.iniciarPracticaLibre();
      }
    };

    const searchId = searchParams.get('id');

    if (searchId) {
      cargarCancion(searchId, false);
    } else if (slug) {
      // Si el slug parece un UUID, intentamos cargarlo como ID primero por seguridad
      const esProbableId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      cargarCancion(slug, !esProbableId);
    } else {
      hero.iniciarPracticaLibre();
    }

    return () => { montado = false; };
  }, [slug, searchParams]);

  // Función para volver al menú principal
  const volverAlMenu = () => {
    hero.volverASeleccion();
    navigate('/acordeon-pro-max/lista');
  };

  const irAModoLibre = () => {
    hero.iniciarPracticaLibre();
    navigate('/acordeon-pro-max/acordeon');
  };

  // ⏸️ ESCUCHA GLOBAL PARA PAUSAR (Rhythm+ Style)
  React.useEffect(() => {
    const handlePausaGlobal = (e: KeyboardEvent) => {
      // Solo abrir menú de pausa con ESC
      if (hero.estadoJuego === 'jugando' && e.key === 'Escape') {
        e.preventDefault();
        hero.pausarJuego();
      }
    };
    window.addEventListener('keydown', handlePausaGlobal);
    return () => window.removeEventListener('keydown', handlePausaGlobal);
  }, [hero.estadoJuego, hero.pausarJuego]);

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

  return (
    <div className="promax-simulador-container" style={{ ['--promax-header-height' as any]: `${headerHeight}px` }}>
      {/* Fondo espacial de Rhythm+ */}
      <FondoEspacialProMax />

      {/* ── Cuenta regresiva ── */}
      {hero.estadoJuego === 'contando' && hero.cuenta !== null && (
        <div className="hero-cuenta-overlay">
          <span key={hero.cuenta} className="hero-cuenta-numero">
            {hero.cuenta}
          </span>
        </div>
      )}

      {mostrarHeaderHero && (
        <HeaderHero
          hero={hero}
          modosVista={MODOS_VISTA as any}
          setMetronomoVisible={setMetronomoVisible}
          botonMetronomoRef={botonMetronomoRef}
          metronomoVisible={metronomoVisible}
          compas={4}
          onVolver={volverAlMenu}
          onIrModoLibre={irAModoLibre}
          onAlturaChange={setHeaderHeight}
        />
      )}

      {mostrarEscenario && (
        <main className="promax-simulador-content">
          {/* ── Fondo de Video de YouTube (solo dentro del stage) ── */}
          {mostrarVideoFondo && (
            <div className="hero-youtube-fondo-wrap">
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${hero.cancionSeleccionada?.youtube_id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${hero.cancionSeleccionada?.youtube_id}&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1`}
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
                style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
              />
              <div className="hero-youtube-oscurecedor" />
            </div>
          )}

          {hero.estadoJuego === 'practica_libre' && (
            <ModoPracticaLibre
              logica={hero.logica}
              modoAjuste={modoAjuste}
              setModoAjuste={setModoAjuste}
              pestanaActiva={pestanaActiva}
              setPestanaActiva={setPestanaActiva}
              onVolver={volverAlMenu}
              imagenFondo={IMG_ALUMNO}
              modosVista={MODOS_VISTA}
              grabando={hero.grabaciones.grabando}
              tiempoGrabacionMs={hero.grabaciones.tiempoGrabacionMs}
              mostrarModalGuardar={hero.grabaciones.mostrarModalGuardarPractica}
              guardandoGrabacion={hero.grabaciones.guardando}
              errorGuardadoGrabacion={hero.grabaciones.error}
              tituloSugeridoGrabacion={hero.grabaciones.tituloSugerido}
              resumenGrabacionPendiente={hero.grabaciones.resumenPendiente}
              ultimaGrabacionGuardada={hero.grabaciones.ultimaGuardada?.tipo === 'practica_libre' ? hero.grabaciones.ultimaGuardada : null}
              onIniciarGrabacion={hero.grabaciones.iniciarGrabacionPracticaLibre}
              onDetenerGrabacion={hero.grabaciones.detenerGrabacionPracticaLibre}
              onGuardarGrabacion={hero.grabaciones.guardarPendiente}
              onCancelarGuardado={hero.grabaciones.descartarPendiente}
              volumenAcordeon={hero.volumenAcordeon}
              setVolumenAcordeon={hero.setVolumenAcordeon}
            />
          )}

          {hero.estadoJuego !== 'practica_libre' && hero.modoPractica === 'maestro_solo' && (
            <ModoMaestroSolo
              estadoJuego={hero.estadoJuego}
              tickActual={hero.tickActual}
              totalTicks={hero.totalTicks}
              reproduciendo={hero.reproduciendo}
              pausado={hero.pausado}
              botonesActivosMaestro={hero.botonesActivosMaestro}
              direccionMaestro={hero.direccionMaestro}
              logica={hero.logica}
              buscarTick={hero.buscarTick}
              alternarPausa={hero.alternarPausaReproduccion}
              maestroSuena={hero.maestroSuena}
              setMaestroSuena={hero.setMaestroSuena}
              mp3Silenciado={hero.mp3Silenciado}
              setMp3Silenciado={hero.setMp3Silenciado}
              modoGuiado={hero.modoGuiado}
              setModoGuiado={hero.setModoGuiado}
              bpm={hero.bpm}
              cambiarBpm={hero.cambiarBpm}
              loopAB={hero.loopAB}
              marcarLoopInicio={hero.marcarLoopInicio}
              marcarLoopFin={hero.marcarLoopFin}
              actualizarLoopInicioTick={hero.actualizarLoopInicioTick}
              actualizarLoopFinTick={hero.actualizarLoopFinTick}
              alternarLoopAB={hero.alternarLoopAB}
              limpiarLoopAB={hero.limpiarLoopAB}
            />
          )}

          {hero.estadoJuego !== 'practica_libre' && hero.modoPractica === 'ninguno' && (
            <ModoCompetitivo
              cancion={hero.cancionSeleccionada}
              tickActual={hero.tickActual}
              botonesActivosMaestro={hero.botonesActivosMaestro}
              direccionMaestro={hero.direccionMaestro}
              logica={hero.logica}
              configTonalidad={hero.logica.configTonalidad}
              estadisticas={hero.estadisticas}
              efectosVisuales={hero.efectosVisuales}
              notasImpactadas={hero.notasImpactadas}
              imagenFondo={IMG_ALUMNO}
              actualizarBotonActivo={hero.logica.actualizarBotonActivo}
              registrarPosicionGolpe={hero.registrarPosicionGolpe}
            />
          )}

          {hero.estadoJuego !== 'practica_libre' && hero.modoPractica === 'libre' && (
            <ModoLibre
              cancion={hero.cancionSeleccionada}
              tickActual={hero.tickActual}
              botonesActivosMaestro={hero.botonesActivosMaestro}
              direccionMaestro={hero.direccionMaestro}
              logica={hero.logica}
              configTonalidad={hero.logica.configTonalidad}
              estadisticas={hero.estadisticas}
              efectosVisuales={hero.efectosVisuales}
              notasImpactadas={hero.notasImpactadas}
              imagenFondo={IMG_ALUMNO}
              actualizarBotonActivo={hero.logica.actualizarBotonActivo}
              registrarPosicionGolpe={hero.registrarPosicionGolpe}
            />
          )}

          {hero.estadoJuego !== 'practica_libre' && hero.modoPractica === 'synthesia' && (
            <ModoSynthesia
              cancion={hero.cancionSeleccionada}
              tickActual={hero.tickActual}
              botonesActivosMaestro={hero.botonesActivosMaestro}
              direccionMaestro={hero.direccionMaestro}
              logica={hero.logica}
              configTonalidad={hero.logica.configTonalidad}
              estadisticas={hero.estadisticas}
              efectosVisuales={hero.efectosVisuales}
              notasEsperando={hero.notasEsperando}
              botonesGuiaAlumno={hero.botonesGuiaAlumno}
              notasImpactadas={hero.notasImpactadas}
              imagenFondo={IMG_ALUMNO}
              actualizarBotonActivo={hero.logica.actualizarBotonActivo}
              registrarPosicionGolpe={hero.registrarPosicionGolpe}
              mensajeMotivacional={hero.mensajeMotivacional}
              feedbackFuelle={hero.feedbackFuelle}
            />
          )}
        </main>
      )}

      {mostrarSeleccion && (
        <PantallaPreJuegoProMax
          cancion={hero.cancionSeleccionada}
          modoSeleccionado={hero.modoPractica}
          setModoSeleccionado={hero.setModoPractica}
          bpm={hero.bpm}
          setBpm={hero.cambiarBpm}
          bpmOriginal={hero.cancionSeleccionada?.bpm || 120}
          maestroSuena={hero.maestroSuena}
          setMaestroSuena={hero.setMaestroSuena}
          modoAudioSynthesia={hero.modoAudioSynthesia}
          setModoAudioSynthesia={hero.setModoAudioSynthesia}
          onEmpezar={hero.iniciarConteo}
          onVolver={volverAlMenu}
        />
      )}

      {mostrarResultados && hero.cancionSeleccionada && (
        <PantallaResultados
          estadisticas={hero.estadisticas}
          cancion={hero.cancionSeleccionada}
          esModoCompetencia={hero.modoPractica === 'ninguno'}
          modo={hero.modoPractica === 'ninguno' ? 'competencia' : hero.modoPractica}
          mostrarGuardado={hero.grabaciones.mostrarGuardadoResultado}
          guardandoGrabacion={hero.grabaciones.guardando}
          errorGuardado={hero.grabaciones.error}
          tituloSugeridoGrabacion={hero.grabaciones.tituloSugerido}
          tituloGrabacionGuardada={hero.grabaciones.ultimaGuardada?.tipo === 'competencia' ? hero.grabaciones.ultimaGuardada.titulo : null}
          onGuardarGrabacion={hero.grabaciones.guardarPendiente}
          onDescartarGuardado={hero.grabaciones.descartarPendiente}
          onJugarDeNuevo={() => hero.iniciarJuego(hero.cancionSeleccionada!)}
          onVolverSeleccion={volverAlMenu}
        />
      )}

      {/* ── Vignette lateral roja de daño (solo modo competitivo) */}
      {hero.modoPractica === 'ninguno' &&
        (hero.estadoJuego === 'jugando' || hero.estadoJuego === 'pausado') &&
        ((100 - hero.estadisticas.vida) / 100) * 0.88 > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 900, // Debajo de los diálogos pero arriba de todo lo demás
            background: [
              'linear-gradient(to right,  rgba(200,0,0,1) 0%, transparent 22%)',
              'linear-gradient(to left,   rgba(200,0,0,1) 0%, transparent 22%)',
              'linear-gradient(to bottom, rgba(180,0,0,0.5) 0%, transparent 18%)',
              'linear-gradient(to top,    rgba(180,0,0,0.5) 0%, transparent 18%)',
            ].join(', '),
            opacity: ((100 - hero.estadisticas.vida) / 100) * 0.88,
            transition: 'opacity 0.5s ease',
          }}
        />
      )}

      {/* ── Pantalla de Game Over ── */}
      {mostrarGameOver && hero.cancionSeleccionada && (
        <PantallaGameOverProMax
          estadisticas={hero.estadisticas}
          cancion={hero.cancionSeleccionada as any}
          onReintentar={() => hero.reiniciarDesdeGameOver(hero.cancionSeleccionada!)}
          onVolverSeleccion={volverAlMenu}
        />
      )}

      {/* Metrónomo */}
      <ModalMetronomo
        visible={mostrarHeaderHero && metronomoVisible}
        onCerrar={() => setMetronomoVisible(false)}
        botonRef={botonMetronomoRef}
        bpm={hero.bpm}
        setBpm={hero.cambiarBpm}
        forzarDetencion={false}
      />

      {/* ⏸️ MENÚ DE PAUSA PRO MAX — Solo visible con pausa manual del usuario */}
      <MenuPausaProMax 
          visible={hero.estadoJuego === 'pausado'}
          onReanudar={hero.reanudarConConteo}
          onReiniciar={() => {
              if (hero.cancionSeleccionada) {
                  hero.reiniciarDesdeGameOver(hero.cancionSeleccionada);
              }
          }}
          maestroSuena={hero.maestroSuena}
          onToggleMaestroSuena={hero.setMaestroSuena}
          modoPractica={hero.modoPractica}
          modoAudioSynthesia={hero.modoAudioSynthesia}
          onCambiarModoAudioSynthesia={hero.setModoAudioSynthesia}
          bpm={hero.bpm}
          onCambiarBpm={hero.cambiarBpm}
          modoVista={hero.logica.modoVista}
          onCambiarVista={hero.logica.setModoVista}
          volumenMusica={hero.volumenMusica}
          onCambiarVolumenMusica={hero.setVolumenMusica}
          volumenAcordeon={hero.volumenAcordeon}
          onCambiarVolumenAcordeon={hero.setVolumenAcordeon}
          onSalir={volverAlMenu}
      />
    </div>
  );
};

export default AcordeonProMaxSimulador;
