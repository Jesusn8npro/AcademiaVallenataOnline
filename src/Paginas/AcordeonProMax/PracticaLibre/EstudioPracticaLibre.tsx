import React from 'react';
import PanelAjustes from '../../SimuladorDeAcordeon/Componentes/PanelAjustes/PanelAjustes';
import CuerpoAcordeon from '../../SimuladorDeAcordeon/Componentes/CuerpoAcordeon';
import { TONALIDADES } from '../../SimuladorDeAcordeon/notasAcordeonDiatonico';
import { obtenerModeloVisualPorId, resolverImagenModeloAcordeon } from './Datos/modelosVisualesAcordeon';
import { useEstudioPracticaLibre } from './Hooks/useEstudioPracticaLibre';
import BarraSuperiorPracticaLibre from './Componentes/BarraSuperiorPracticaLibre';
import PanelLateralPracticaLibre from './Componentes/PanelLateralPracticaLibre';
import ModalGuardarPracticaLibre from './Componentes/ModalGuardarPracticaLibre';
import './EstudioPracticaLibre.css';

interface EstudioPracticaLibreProps {
  logica: any;
  modoAjuste: boolean;
  setModoAjuste: React.Dispatch<React.SetStateAction<boolean>>;
  pestanaActiva: 'diseno' | 'sonido';
  setPestanaActiva: React.Dispatch<React.SetStateAction<'diseno' | 'sonido'>>;
  imagenFondo: string;
  modosVista: Array<{ valor: any; label: string }>;
  grabando: boolean;
  tiempoGrabacionMs: number;
  mostrarModalGuardar: boolean;
  guardandoGrabacion: boolean;
  errorGuardadoGrabacion: string | null;
  tituloSugeridoGrabacion: string;
  resumenGrabacionPendiente: { duracionMs: number; bpm: number; tonalidad: string | null; notas: number } | null;
  ultimaGrabacionGuardada: { id: string; titulo: string } | null;
  onIniciarGrabacion: () => void;
  onDetenerGrabacion: () => void;
  onGuardarGrabacion: (titulo: string, descripcion: string) => Promise<boolean> | boolean;
  onCancelarGuardado: () => void;
  volumenAcordeon: number;
  setVolumenAcordeon: React.Dispatch<React.SetStateAction<number>>;
}

function formatearDuracion(ms: number) {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

const EstudioPracticaLibre: React.FC<EstudioPracticaLibreProps> = ({
  logica,
  modoAjuste,
  setModoAjuste,
  pestanaActiva,
  setPestanaActiva,
  imagenFondo,
  modosVista,
  grabando,
  tiempoGrabacionMs,
  mostrarModalGuardar,
  guardandoGrabacion,
  errorGuardadoGrabacion,
  tituloSugeridoGrabacion,
  resumenGrabacionPendiente,
  ultimaGrabacionGuardada,
  onIniciarGrabacion,
  onDetenerGrabacion,
  onGuardarGrabacion,
  onCancelarGuardado,
  volumenAcordeon,
  setVolumenAcordeon,
}) => {
  const estudio = useEstudioPracticaLibre({
    tonalidadSeleccionada: logica.tonalidadSeleccionada,
    instrumentoId: logica.instrumentoId,
    grabando,
    volumenAcordeon,
    setVolumenAcordeon,
  });

  const modeloActivo = React.useMemo(
    () => obtenerModeloVisualPorId(estudio.preferencias.modeloVisualId),
    [estudio.preferencias.modeloVisualId]
  );

  const ajustesPractica = React.useMemo(() => ({
    ...logica.ajustes,
    tamano: 'var(--estudio-acordeon-tamano)',
    x: 'var(--estudio-acordeon-x)',
    y: 'var(--estudio-acordeon-y)',
  }), [logica.ajustes]);

  const nombreInstrumento = React.useMemo(() => {
    const actual = logica.listaInstrumentos?.find((instrumento: any) => instrumento.id === logica.instrumentoId);
    return actual?.nombre || 'Acordeon original';
  }, [logica.instrumentoId, logica.listaInstrumentos]);

  React.useEffect(() => {
    if (typeof logica.guardarAjustes !== 'function') return;

    const timer = window.setTimeout(() => {
      void logica.guardarAjustes();
    }, 420);

    return () => {
      window.clearTimeout(timer);
    };
  }, [logica.ajustes?.timbre, logica.guardarAjustes, logica.instrumentoId, logica.modoVista, logica.tonalidadSeleccionada]);

  const manejarGrabacion = async () => {
    if (grabando) {
      onDetenerGrabacion();
      return;
    }

    await estudio.prepararPistaParaGrabar();
    onIniciarGrabacion();
  };

  return (
    <section className="estudio-practica-libre">
      <BarraSuperiorPracticaLibre
        panelActivo={estudio.panelActivo}
        onAlternarPanel={estudio.alternarPanel}
        tonalidad={logica.tonalidadSeleccionada}
        timbre={logica.ajustes?.timbre || 'Brillante'}
        nombreInstrumento={nombreInstrumento}
        nombreModelo={modeloActivo.nombre}
        nombrePista={estudio.pistaActiva?.nombre || estudio.preferencias.pistaNombre}
        grabando={grabando}
        tiempoGrabacion={formatearDuracion(tiempoGrabacionMs)}
        onAlternarGrabacion={manejarGrabacion}
      />

      {!mostrarModalGuardar && errorGuardadoGrabacion && (
        <div className="estudio-practica-libre-alerta">{errorGuardadoGrabacion}</div>
      )}

      <div className="estudio-practica-libre-contenido">
        <div className="estudio-practica-libre-escenario">
          <div className="estudio-practica-libre-escenario-head">
            <div className="estudio-practica-libre-escenario-chip">Modelo {modeloActivo.nombre}</div>
            <div className="estudio-practica-libre-escenario-chip">Vista {modosVista.find(({ valor }) => valor === logica.modoVista)?.label || 'T'}</div>
            <div className="estudio-practica-libre-escenario-chip">Instrumento {nombreInstrumento}</div>
            {estudio.pistaActiva && (
              <div className="estudio-practica-libre-escenario-chip">Pista {estudio.pistaActiva.nombre}</div>
            )}
            {ultimaGrabacionGuardada && !grabando && (
              <div className="estudio-practica-libre-escenario-chip">Guardada {ultimaGrabacionGuardada.titulo}</div>
            )}
          </div>

          <div className="estudio-practica-libre-area-acordeon">
            <div className="estudio-practica-libre-acordeon">
              {logica.disenoCargado && (
                <CuerpoAcordeon
                  imagenFondo={resolverImagenModeloAcordeon(estudio.preferencias.modeloVisualId, imagenFondo)}
                  ajustes={ajustesPractica as any}
                  direccion={logica.direccion}
                  configTonalidad={logica.configTonalidad}
                  botonesActivos={logica.botonesActivos}
                  modoAjuste={modoAjuste}
                  botonSeleccionado={logica.botonSeleccionado}
                  modoVista={logica.modoVista}
                  vistaDoble={false}
                  setBotonSeleccionado={logica.setBotonSeleccionado}
                  actualizarBotonActivo={logica.actualizarBotonActivo}
                  listo
                />
              )}
            </div>
          </div>

          <div className="estudio-practica-libre-footer">
            <div className="estudio-practica-libre-footer-copy">
              <strong>Fuelle</strong>
              <span>{logica.direccion === 'halar' ? 'Abriendo (Q)' : 'Cerrando (Q)'}</span>
              <strong>Tono</strong>
              <span>{logica.tonalidadSeleccionada}</span>
            </div>

            <div className="estudio-practica-libre-footer-estado">
              <strong>Pista</strong>
              <span>{estudio.pistaActiva ? `${formatearDuracion(estudio.tiempoPistaActual * 1000)} / ${formatearDuracion(estudio.duracionPista * 1000)}` : 'Sin pista'}</span>
              <strong>Vol acordeon</strong>
              <span>{volumenAcordeon}%</span>
            </div>
          </div>
        </div>

        <PanelLateralPracticaLibre
          visible={Boolean(estudio.panelActivo)}
          seccionActiva={estudio.panelActivo}
          tonalidadSeleccionada={logica.tonalidadSeleccionada}
          listaTonalidades={logica.listaTonalidades?.length ? logica.listaTonalidades : Object.keys(TONALIDADES)}
          timbreActivo={logica.ajustes?.timbre || 'Brillante'}
          onSeleccionarTonalidad={logica.setTonalidadSeleccionada}
          onSeleccionarTimbre={(timbre) => logica.setAjustes((prev: any) => ({ ...prev, timbre }))}
          instrumentoId={logica.instrumentoId}
          listaInstrumentos={logica.listaInstrumentos || []}
          onSeleccionarInstrumento={logica.setInstrumentoId}
          modoVista={logica.modoVista}
          modosVista={modosVista}
          onSeleccionarVista={logica.setModoVista}
          onAbrirEditorAvanzado={() => {
            setPestanaActiva('sonido');
            setModoAjuste(true);
          }}
          modeloActivo={modeloActivo}
          onSeleccionarModelo={estudio.seleccionarModeloVisual}
          preferencias={estudio.preferencias}
          pistaActiva={estudio.pistaActiva}
          pistasDisponibles={estudio.pistasDisponibles}
          cargandoPistas={estudio.cargandoPistas}
          reproduciendoPista={estudio.reproduciendoPista}
          tiempoPista={formatearDuracion(estudio.tiempoPistaActual * 1000)}
          duracionPista={formatearDuracion(estudio.duracionPista * 1000)}
          onSeleccionarPista={estudio.seleccionarPista}
          onLimpiarPista={estudio.limpiarPistaSeleccionada}
          onAlternarReproduccionPista={estudio.alternarReproduccionPista}
          onReiniciarPista={() => void estudio.reiniciarPista(estudio.reproduciendoPista)}
          onCargarArchivoLocal={estudio.cargarArchivoLocal}
          onAlternarCapa={estudio.alternarCapa}
          onActualizarEfectos={estudio.actualizarEfectos}
          volumenAcordeon={estudio.volumenAcordeon}
          onAjustarVolumenAcordeon={estudio.ajustarVolumenAcordeon}
        />
      </div>

      <PanelAjustes
        modoAjuste={modoAjuste}
        setModoAjuste={setModoAjuste}
        pestanaActiva={pestanaActiva}
        setPestanaActiva={setPestanaActiva}
        botonSeleccionado={logica.botonSeleccionado}
        setBotonSeleccionado={logica.setBotonSeleccionado}
        ajustes={logica.ajustes}
        setAjustes={logica.setAjustes}
        tonalidadSeleccionada={logica.tonalidadSeleccionada}
        setTonalidadSeleccionada={logica.setTonalidadSeleccionada}
        listaTonalidades={logica.listaTonalidades}
        setListaTonalidades={logica.setListaTonalidades}
        nombresTonalidades={logica.nombresTonalidades}
        actualizarNombreTonalidad={logica.actualizarNombreTonalidad}
        sonidosVirtuales={logica.sonidosVirtuales}
        setSonidosVirtuales={logica.setSonidosVirtuales}
        eliminarTonalidad={logica.eliminarTonalidad}
        mapaBotonesActual={logica.mapaBotonesActual}
        playPreview={logica.playPreview}
        stopPreview={logica.stopPreview}
        reproduceTono={logica.reproduceTono}
        samplesBrillante={logica.samplesBrillante}
        samplesBajos={logica.samplesBajos}
        samplesArmonizado={logica.samplesArmonizado}
        muestrasDB={logica.muestrasDB}
        soundsPerKey={logica.soundsPerKey}
        obtenerRutasAudio={logica.obtenerRutasAudio}
        guardarAjustes={logica.guardarAjustes}
        resetearAjustes={logica.resetearAjustes}
        sincronizarAudios={logica.sincronizarAudios}
        guardarNuevoSonidoVirtual={logica.guardarNuevoSonidoVirtual}
        instrumentoId={logica.instrumentoId}
        setInstrumentoId={logica.setInstrumentoId}
        listaInstrumentos={logica.listaInstrumentos}
      />

      <ModalGuardarPracticaLibre
        visible={mostrarModalGuardar}
        guardando={guardandoGrabacion}
        error={errorGuardadoGrabacion}
        tituloSugerido={tituloSugeridoGrabacion}
        resumen={resumenGrabacionPendiente}
        onCancelar={onCancelarGuardado}
        onGuardar={onGuardarGrabacion}
      />
    </section>
  );
};

export default EstudioPracticaLibre;
