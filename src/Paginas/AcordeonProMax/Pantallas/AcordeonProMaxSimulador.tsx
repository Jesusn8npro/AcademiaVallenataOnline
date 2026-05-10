import React from 'react';
import HeaderHero from '../Componentes/HeaderHero';
import FondoEspacialProMax from '../Componentes/FondoEspacialProMax';
import ModalMetronomo from '../../SimuladorApp/Componentes/BarraHerramientas/ModalMetronomo';
import ModoPracticaLibre from '../PracticaLibre/EstudioPracticaLibre';
import ModoMaestroSolo from '../Modos/ModoMaestroSolo';
import ModoJuego from '../Modos/ModoJuego';
import ModoSynthesia from '../Modos/ModoSynthesia';
import PantallaPreJuegoProMax from '../Componentes/PantallaPreJuegoProMax';
import PantallaResultados from '../Componentes/PantallaResultados';
import PantallaGameOverProMax from '../Componentes/PantallaGameOverProMax';
import MenuPausaProMax from '../Componentes/MenuPausaProMax';
import { useAcordeonProMaxSimulador } from '../Hooks/useAcordeonProMaxSimulador';
import '../Modos/_BaseSimulador.css';
import '../Componentes/PantallaPreJuegoProMax.css';
import { MODOS_VISTA } from '../../../Core/constantes/modosVista';

const IMG_ALUMNO = '/Acordeon PRO MAX.webp';

const AcordeonProMaxSimulador: React.FC = () => {
  const {
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
  } = useAcordeonProMaxSimulador();

  return (
    <div className="promax-simulador-container" style={{ ['--promax-header-height' as any]: `${headerHeight}px` }}>
      <FondoEspacialProMax />

      {hero.estadoJuego === 'contando' && hero.cuenta !== null && (
        <div className="hero-cuenta-overlay">
          <span key={hero.cuenta} className="hero-cuenta-numero">
            {hero.cuenta}
          </span>
        </div>
      )}

      {(mostrarHeaderHero && hero.estadoJuego !== 'practica_libre') && (
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
              onVolver={volverAlMenu}
              esp32Conectado={hero.logica.esp32Conectado}
              conectarESP32={hero.logica.conectarESP32}
              hero={hero}
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

          {hero.estadoJuego !== 'practica_libre' && (hero.modoPractica === 'ninguno' || hero.modoPractica === 'libre') && (
            <ModoJuego
              conPenalizacion={hero.modoPractica === 'ninguno'}
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
              rangoSeccion={hero.seccionSeleccionada
                ? { inicio: hero.seccionSeleccionada.tickInicio, fin: hero.seccionSeleccionada.tickFin }
                : null}
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
          seccionSeleccionada={hero.seccionSeleccionada}
          onSeleccionarSeccion={hero.seleccionarSeccion}
          progresoVersion={hero.progresoVersion}
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
          seccionSeleccionada={hero.seccionSeleccionada}
          onJugarSiguienteSeccion={(s) => {
            hero.seleccionarSeccion(s);
            // Pequeño delay para que el ref se actualice antes de que iniciarJuego lo lea
            setTimeout(() => hero.iniciarJuego(hero.cancionSeleccionada!), 50);
          }}
        />
      )}

      {hero.modoPractica === 'ninguno' &&
        (hero.estadoJuego === 'jugando' || hero.estadoJuego === 'pausado') &&
        ((100 - hero.estadisticas.vida) / 100) * 0.88 > 0 && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 900,
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

      {mostrarGameOver && hero.cancionSeleccionada && (
        <PantallaGameOverProMax
          estadisticas={hero.estadisticas}
          cancion={hero.cancionSeleccionada as any}
          onReintentar={() => hero.reiniciarDesdeGameOver(hero.cancionSeleccionada!)}
          onVolverSeleccion={volverAlMenu}
        />
      )}

      <ModalMetronomo
        visible={mostrarHeaderHero && metronomoVisible}
        onCerrar={() => setMetronomoVisible(false)}
        botonRef={botonMetronomoRef}
        bpm={hero.bpm}
        setBpm={hero.cambiarBpm}
        forzarDetencion={false}
      />

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
