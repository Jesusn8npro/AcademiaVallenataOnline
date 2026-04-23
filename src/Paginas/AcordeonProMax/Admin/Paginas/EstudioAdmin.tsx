import React from 'react';
import { useNavigate } from 'react-router-dom';
import PanelAjustes from '../../../../Core/componentes/PanelAjustes/PanelAjustes';
import CuerpoAcordeonBase from '../../../../Core/componentes/CuerpoAcordeon';
import ModalCreadorAcordes from '../../../../Core/componentes/ModalCreadorAcordes';
import ModalListaAcordes from '../../../../Core/componentes/ModalListaAcordes';
import ModalGuardarHero from '../../../../Core/componentes/ModalGuardarHero';
import { useMetronomoGlobal } from '../../../../Core/hooks/useMetronomoGlobal';

const CuerpoAcordeon = React.memo(CuerpoAcordeonBase);
import { obtenerModeloVisualPorId, resolverImagenModeloAcordeon } from '../../PracticaLibre/Datos/modelosVisualesAcordeon';
import { useEstudioPracticaLibre } from '../../PracticaLibre/Hooks/useEstudioPracticaLibre';
import { useLogicaProMax } from '../../Hooks/useLogicaProMax';
import BarraSuperiorAdmin from '../Componentes/BarraSuperiorAdmin';
import ModalGuardarPracticaLibre from '../../PracticaLibre/Componentes/ModalGuardarPracticaLibre';
import BarraReproductorPracticaLibre from '../../PracticaLibre/Componentes/BarraReproductorPracticaLibre';
import BarraTransporte from '../../Modos/BarraTransporte';
import PuenteNotas from '../../Componentes/PuenteNotas';
import { usePosicionProMax } from '../../Hooks/usePosicionProMax';
import { useAudioFondoPracticaLibre } from '../../PracticaLibre/Hooks/useAudioFondoPracticaLibre';
import { formatearDuracion } from '../../PracticaLibre/Utilidades/SecuenciaLogic';
import PanelLateralAdmin from '../Componentes/PanelLateralAdmin';
import ModalEditorSecuencia from '../Componentes/ModalEditorSecuencia';
import { useReproductorAcordesAdmin } from '../Hooks/useReproductorAcordesAdmin';
import { useCancionLibreria } from '../Hooks/useCancionLibreria';
import { useEditorSecuenciaAdmin } from '../Hooks/useEditorSecuenciaAdmin';
import '../../PracticaLibre/EstudioPracticaLibre.css';
import './EstudioAdmin.css';
import { MODOS_VISTA } from '../../../../Core/constantes/modosVista';

const IMG_ACORDEON = '/Acordeon PRO MAX.png';

const EstudioAdmin: React.FC = () => {
  const navigate = useNavigate();
  const hero = useLogicaProMax();
  const logica = hero.logica;

  const [modoAjuste, setModoAjuste] = React.useState(false);
  const [pestanaActiva, setPestanaActiva] = React.useState<'diseno' | 'sonido'>('diseno');
  const [modalCreadorAcordesVisible, setModalCreadorAcordesVisible] = React.useState(false);
  const [modalListaAcordesVisible, setModalListaAcordesVisible] = React.useState(false);
  const [acordeAEditar, setAcordeAEditar] = React.useState<any>(null);

  const estudio = useEstudioPracticaLibre({
    tonalidadSeleccionada: logica.tonalidadSeleccionada,
    instrumentoId: logica.instrumentoId,
    grabando: hero.grabaciones.grabando,
    volumenAcordeon: hero.volumenAcordeon,
    setVolumenAcordeon: hero.setVolumenAcordeon,
  });

  const libreria = useCancionLibreria({
    bpm: hero.bpm,
    onCambiarBpm: hero.cambiarBpm,
    logica,
    reproduciendo: hero.reproduciendo,
    pausado: hero.pausado,
    onAlternarPausa: hero.alternarPausaReproduccion,
    onBuscarTick: hero.buscarTick,
    onReproducirSecuencia: hero.reproducirSecuencia,
  });

  const { metronomoActivo, setMetronomoActivo } = useMetronomoGlobal({
    bpmHero: libreria.bpmHero,
    reproduciendo: hero.reproduciendo,
  });

  const rec = useEditorSecuenciaAdmin({
    bpm: hero.bpm,
    grabandoSesion: hero.grabaciones.grabando,
    logica,
    metronomoActivo,
    reproduciendo: hero.reproduciendo,
    pausado: hero.pausado,
    tickActual: hero.tickActual,
    loopAB: hero.loopAB,
    secuencia: hero.secuencia,
    totalTicks: hero.totalTicks,
    onAlternarPausa: hero.alternarPausaReproduccion,
    onAlternarLoop: hero.alternarLoopAB,
    onBuscarTick: hero.buscarTick,
    onReproducirSecuencia: hero.reproducirSecuencia,
    onLimpiarLoop: hero.limpiarLoopAB,
    onCambiarBpm: hero.cambiarBpm,
    libreria,
  });

  const {
    idSonandoCiclo, acordeMaestroActivo,
    onReproducirAcorde, onDetener, onEditarAcorde,
    onNuevoAcordeEnCirculo, onReproducirCirculoCompleto,
  } = useReproductorAcordesAdmin(
    logica,
    setModalListaAcordesVisible,
    setAcordeAEditar,
    setModalCreadorAcordesVisible
  );

  const { refAlumno, obtenerPosicionAlumno } = usePosicionProMax();

  const audioRef = useAudioFondoPracticaLibre({
    reproduciendo: hero.reproduciendo,
    pausado: hero.pausado,
    bpm: hero.bpm,
    tickActual: hero.tickActual,
    cancionData: { bpm: libreria.bpmOriginalGrabacion, resolucion: 192, audio_fondo_url: libreria.pistaUrl },
    audioUrl: libreria.pistaUrl,
    volumen: 0.8,
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
    const actual = logica.listaInstrumentos?.find((i: any) => i.id === logica.instrumentoId);
    return actual?.nombre || 'Acordeon original';
  }, [logica.instrumentoId, logica.listaInstrumentos]);

  const botonesActivosAcordeon = React.useMemo(
    () => (hero.reproduciendo && hero.botonesActivosMaestro ? hero.botonesActivosMaestro : logica.botonesActivos),
    [hero.reproduciendo, hero.botonesActivosMaestro, logica.botonesActivos]
  );

  const direccionAcordeon = React.useMemo(
    () => (hero.reproduciendo && hero.direccionMaestro ? hero.direccionMaestro : logica.direccion),
    [hero.reproduciendo, hero.direccionMaestro, logica.direccion]
  );

  const imagenFondoAcordeon = React.useMemo(
    () => resolverImagenModeloAcordeon(estudio.preferencias.modeloVisualId, IMG_ACORDEON),
    [estudio.preferencias.modeloVisualId]
  );

  React.useEffect(() => {
    if (typeof logica.guardarAjustes !== 'function') return;
    const timer = window.setTimeout(() => void logica.guardarAjustes(), 420);
    return () => window.clearTimeout(timer);
  }, [logica.ajustes?.timbre, logica.guardarAjustes, logica.instrumentoId, logica.modoVista, logica.tonalidadSeleccionada]);

  const onGuardarHero = React.useCallback(async (datos: {
    titulo: string; autor: string; descripcion: string;
    tipo: 'secuencia' | 'cancion' | 'ejercicio';
    dificultad: 'basico' | 'intermedio' | 'profesional';
  }) => {
    const secuenciaFinal = rec.grabadorLocal.secuencia;
    if (!secuenciaFinal?.length) {
      alert('No hay notas grabadas. Presiona algunos botones del acordeon antes de guardar.');
      return;
    }
    try {
      const resultado = await rec.grabadorLocal.guardarSecuencia({
        titulo: datos.titulo, autor: datos.autor, descripcion: datos.descripcion,
        tipo: datos.tipo, dificultad: datos.dificultad,
        usoMetronomo: rec.usoMetronomoRef.current,
        tonalidad: logica.tonalidadSeleccionada, pistaFile: libreria.pistaFile,
      });
      if (resultado.error) {
        const msg = typeof resultado.error === 'string' ? resultado.error : (resultado.error as any)?.message || 'Error al guardar';
        alert('Error al guardar: ' + msg);
      } else {
        alert('Se grabo correctamente en la nube.');
        rec.setModalGuardarHeroVisible(false);
      }
    } catch (error) { alert('Error: ' + (error as any).message); }
  }, [rec, logica.tonalidadSeleccionada, libreria.pistaFile]);

  const manejarGrabacionSesion = async () => {
    if (rec.grabandoRecPro || rec.esperandoPunchIn) return;
    if (hero.grabaciones.grabando) { hero.grabaciones.detenerGrabacionPracticaLibre(); return; }
    if (estudio.pistaActiva) await estudio.prepararPistaParaGrabar();
    hero.grabaciones.iniciarGrabacionPracticaLibre();
  };

  return (
    <section className="estudio-practica-libre estudio-admin">
      <BarraSuperiorAdmin
        panelActivo={estudio.panelActivo}
        onAlternarPanel={estudio.alternarPanel}
        tonalidad={logica.tonalidadSeleccionada}
        timbre={logica.ajustes?.timbre || 'Brillante'}
        nombreInstrumento={nombreInstrumento}
        grabandoSesion={hero.grabaciones.grabando}
        tiempoGrabacionSesion={formatearDuracion(hero.grabaciones.tiempoGrabacionMs)}
        grabandoRecPro={rec.grabandoRecPro || rec.esperandoPunchIn}
        onAlternarGrabacion={manejarGrabacionSesion}
        onVolver={() => navigate('/acordeon-pro-max')}
      />

      {rec.mensajeEdicionSecuencia && (
        <div className="estudio-practica-libre-alerta">{rec.mensajeEdicionSecuencia}</div>
      )}

      <div className="estudio-practica-libre-contenido">
        <div className="estudio-practica-libre-escenario">
          <div className="estudio-practica-libre-escenario-head">
            <div className="estudio-practica-libre-escenario-chip">Modelo {modeloActivo.nombre}</div>
            <div className="estudio-practica-libre-escenario-chip">Vista {MODOS_VISTA.find(({ valor }) => valor === logica.modoVista)?.label || 'T'}</div>
            <div className="estudio-practica-libre-escenario-chip">Instrumento {nombreInstrumento}</div>
            {estudio.pistaActiva && <div className="estudio-practica-libre-escenario-chip">Pista {estudio.pistaActiva.nombre}</div>}
            {libreria.cancionActivaLibreria && <div className="estudio-practica-libre-escenario-chip">Hero {libreria.cancionActivaLibreria.titulo || 'Sin titulo'}</div>}
            {rec.cancionEditandoSecuencia && (
              <div className="estudio-practica-libre-escenario-chip">
                Editando secuencia{rec.hayCambiosEdicionSecuencia ? ' *' : ''}
              </div>
            )}
          </div>

          <div className="estudio-practica-libre-area-acordeon" ref={refAlumno}>
            <div className="estudio-practica-libre-acordeon">
              {logica.disenoCargado && (
                <CuerpoAcordeon
                  imagenFondo={imagenFondoAcordeon}
                  ajustes={ajustesPractica as any}
                  direccion={direccionAcordeon}
                  configTonalidad={logica.configTonalidad}
                  botonesActivos={botonesActivosAcordeon}
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

            {(hero.reproduciendo || rec.hayGrabacionActiva) && !rec.cancionEnModalEditor && (
              <PuenteNotas
                cancion={{
                  id: 'admin-id', titulo: 'Admin',
                  secuencia: rec.secuenciaVisualActiva || [],
                  bpm: rec.grabandoRecPro ? libreria.bpmHero : hero.bpm,
                  tonalidad: logica.tonalidadSeleccionada,
                } as any}
                tickActual={hero.tickActual}
                obtenerPosicionMaestro={(id) => {
                  const pos = obtenerPosicionAlumno(id);
                  if (!pos) return null;
                  return { x: pos.x, y: -200 };
                }}
                obtenerPosicionAlumno={obtenerPosicionAlumno}
                modoVista={logica.modoVista}
                configTonalidad={logica.configTonalidad}
                notasImpactadas={new Set()}
              />
            )}
          </div>

          {(hero.reproduciendo || rec.hayGrabacionActiva || libreria.pistaUrl || Boolean(rec.cancionEditandoSecuencia)) && (
            <div className="estudio-practica-libre-transport-fixed">
              {rec.cancionEditandoSecuencia ? (
                <BarraTransporte
                  reproduciendo={hero.reproduciendo || rec.hayGrabacionActiva}
                  pausado={hero.pausado && !rec.hayGrabacionActiva}
                  onAlternarPausa={() => {
                    if (hero.grabaciones.grabando) hero.grabaciones.detenerGrabacionPracticaLibre();
                    else if (rec.grabandoRecPro || rec.esperandoPunchIn) rec.detenerGrabacionRecPro();
                    else if (!hero.reproduciendo) rec.reproducirCancionActivaDesdeTick(hero.tickActual || 0);
                    else hero.alternarPausaReproduccion();
                  }}
                  onDetener={() => {
                    if (hero.grabaciones.grabando) hero.grabaciones.detenerGrabacionPracticaLibre();
                    else if (rec.grabandoRecPro || rec.esperandoPunchIn) rec.detenerGrabacionRecPro();
                    else libreria.detenerReproduccionLocal(0);
                  }}
                  tickActual={hero.tickActual || 0}
                  totalTicks={rec.totalTicksTransporte}
                  onBuscarTick={(tick) => hero.buscarTick(tick)}
                  bpm={hero.bpm}
                  loopAB={hero.loopAB}
                  onMarcarLoopInicio={hero.marcarLoopInicio}
                  onMarcarLoopFin={hero.marcarLoopFin}
                  onActualizarLoopInicio={hero.actualizarLoopInicioTick}
                  onActualizarLoopFin={hero.actualizarLoopFinTick}
                  onAlternarLoop={hero.alternarLoopAB}
                  onLimpiarLoop={hero.limpiarLoopAB}
                  onCambiarBpm={(valor) => {
                    hero.cambiarBpm(valor);
                    if (typeof valor === 'number') libreria.setBpmHero(valor);
                  }}
                  punchInTick={rec.punchInTick}
                />
              ) : (
                <BarraReproductorPracticaLibre
                  reproduciendo={hero.reproduciendo || rec.hayGrabacionActiva}
                  pausado={hero.pausado && !rec.hayGrabacionActiva}
                  onAlternarPausa={() => {
                    if (hero.grabaciones.grabando) hero.grabaciones.detenerGrabacionPracticaLibre();
                    else if (rec.grabandoRecPro) rec.detenerGrabacionRecPro();
                    else if (!hero.reproduciendo && libreria.cancionActivaLibreria) rec.reproducirCancionActivaDesdeTick(hero.tickActual || 0);
                    else hero.alternarPausaReproduccion();
                  }}
                  onDetener={() => {
                    if (hero.grabaciones.grabando) hero.grabaciones.detenerGrabacionPracticaLibre();
                    else if (rec.grabandoRecPro) rec.detenerGrabacionRecPro();
                    else hero.buscarTick(0);
                  }}
                  tickActual={hero.tickActual || 0}
                  totalTicks={rec.totalTicksTransporte}
                  onBuscarTick={(tick) => hero.buscarTick(tick)}
                  bpm={rec.grabandoRecPro ? libreria.bpmHero : hero.bpm}
                  onCambiarBpm={rec.grabandoRecPro ? libreria.setBpmHero : hero.cambiarBpm}
                />
              )}
            </div>
          )}
        </div>

        {!rec.cancionEnModalEditor && (
          <PanelLateralAdmin
            visible={Boolean(estudio.panelActivo)}
            seccionActiva={estudio.panelActivo}
            logica={logica}
            estudio={estudio}
            rec={rec}
            libreria={libreria}
            hero={{
              bpm: hero.bpm,
              tickActual: hero.tickActual,
              totalTicks: hero.totalTicks,
              reproduciendo: hero.reproduciendo,
              pausado: hero.pausado,
              loopAB: hero.loopAB,
              grabaciones: hero.grabaciones,
              alternarPausaReproduccion: hero.alternarPausaReproduccion,
              buscarTick: hero.buscarTick,
            }}
            acordes={{
              idSonandoCiclo,
              acordeMaestroActivo,
              onReproducirAcorde,
              onDetener,
              onEditarAcorde,
              onNuevoAcordeEnCirculo,
              onReproducirCirculoCompleto,
            }}
            modosVista={MODOS_VISTA}
            modeloActivo={modeloActivo}
            onAbrirEditorAvanzado={() => { setPestanaActiva('sonido'); setModoAjuste(true); }}
            onCrearAcorde={() => setModalCreadorAcordesVisible(true)}
            onVerAcordes={() => setModalListaAcordesVisible(true)}
            metronomoActivo={metronomoActivo}
            setMetronomoActivo={setMetronomoActivo}
          />
        )}

        {rec.cancionEnModalEditor && (
          <ModalEditorSecuencia
            cancion={rec.cancionEnModalEditor}
            onCerrar={() => {
              rec.setCancionEnModalEditor(null);
              logica.limpiarTodasLasNotas();
              rec.notasCheadasModalRef.current.clear();
            }}
            tickActual={hero.tickActual}
            totalTicks={hero.totalTicks}
            reproduciendoHero={hero.reproduciendo}
            onAlternarPausa={hero.alternarPausaReproduccion}
            onDetener={rec.handleDetenerTimeline}
            onBuscarTick={hero.buscarTick}
            bpm={hero.bpm}
            onCambiarBpm={hero.cambiarBpm}
            grabando={rec.grabadorLocal.grabando}
            tiempoGrabacionMs={rec.tiempoGrabacionRecProMs}
            cuentaAtrasPreRoll={rec.esperandoPunchIn ? rec.preRollSegundos : null}
            onIniciarGrabacion={rec.iniciarPunchInEdicion}
            onDetenerGrabacion={rec.detenerGrabacionRecPro}
            punchInTick={rec.punchInTick}
            setPunchInTick={rec.setPunchInTick}
            punchOutTick={rec.punchOutTick}
            setPunchOutTick={rec.setPunchOutTick}
            notasGrabadas={rec.grabadorLocal.secuencia}
            onNotasActuales={rec.handleNotasActualesDelModal}
            onSecuenciaChange={rec.setSecuenciaVisualModal}
            duracionAudioProp={audioRef.current?.duration || 0}
            preRollSegundos={rec.preRollSegundos}
            setPreRollSegundos={rec.setPreRollSegundos}
            metronomoActivo={metronomoActivo}
            setMetronomoActivo={setMetronomoActivo}
            mensajeEdicionProp={rec.mensajeEdicionSecuencia}
          />
        )}
      </div>

      <PanelAjustes
        modoAjuste={modoAjuste} setModoAjuste={setModoAjuste}
        pestanaActiva={pestanaActiva} setPestanaActiva={setPestanaActiva}
        botonSeleccionado={logica.botonSeleccionado} setBotonSeleccionado={logica.setBotonSeleccionado}
        ajustes={logica.ajustes} setAjustes={logica.setAjustes}
        tonalidadSeleccionada={logica.tonalidadSeleccionada} setTonalidadSeleccionada={logica.setTonalidadSeleccionada}
        listaTonalidades={logica.listaTonalidades} setListaTonalidades={logica.setListaTonalidades}
        nombresTonalidades={logica.nombresTonalidades} actualizarNombreTonalidad={logica.actualizarNombreTonalidad}
        sonidosVirtuales={logica.sonidosVirtuales} setSonidosVirtuales={logica.setSonidosVirtuales}
        eliminarTonalidad={logica.eliminarTonalidad} mapaBotonesActual={logica.mapaBotonesActual}
        playPreview={logica.playPreview} stopPreview={logica.stopPreview} reproduceTono={logica.reproduceTono}
        samplesBrillante={logica.samplesBrillante} samplesBajos={logica.samplesBajos} samplesArmonizado={logica.samplesArmonizado}
        muestrasDB={logica.muestrasDB} soundsPerKey={logica.soundsPerKey} obtenerRutasAudio={logica.obtenerRutasAudio}
        guardarAjustes={logica.guardarAjustes} resetearAjustes={logica.resetearAjustes}
        sincronizarAudios={logica.sincronizarAudios} guardarNuevoSonidoVirtual={logica.guardarNuevoSonidoVirtual}
        instrumentoId={logica.instrumentoId} setInstrumentoId={logica.setInstrumentoId} listaInstrumentos={logica.listaInstrumentos}
      />

      <ModalGuardarPracticaLibre
        visible={hero.grabaciones.mostrarModalGuardarPractica}
        guardando={hero.grabaciones.guardando}
        error={hero.grabaciones.error}
        tituloSugerido={hero.grabaciones.tituloSugerido}
        resumen={hero.grabaciones.resumenPendiente}
        onCancelar={hero.grabaciones.descartarPendiente}
        onGuardar={(titulo, descripcion) => hero.grabaciones.guardarPendiente({ titulo, descripcion })}
      />

      <ModalCreadorAcordes
        visible={modalCreadorAcordesVisible}
        onCerrar={() => {
          setModalCreadorAcordesVisible(false);
          if (acordeAEditar) setModalListaAcordesVisible(true);
          setAcordeAEditar(null);
        }}
        botonesSeleccionados={Object.keys(logica.botonesActivos)}
        fuelleActual={logica.direccion === 'halar' ? 'abriendo' : 'cerrando'}
        tonalidadActual={logica.tonalidadSeleccionada}
        acordeAEditar={acordeAEditar}
        onExitoUpdate={() => setModalListaAcordesVisible(true)}
      />

      <ModalListaAcordes
        visible={modalListaAcordesVisible}
        onCerrar={() => setModalListaAcordesVisible(false)}
        tonalidadActual={logica.tonalidadSeleccionada}
        onReproducirAcorde={onReproducirAcorde}
        onDetener={onDetener}
        idSonando={idSonandoCiclo || (acordeMaestroActivo ? 'activo' : null)}
        onEditarAcorde={onEditarAcorde}
        onNuevoAcordeEnCirculo={onNuevoAcordeEnCirculo}
        onReproducirCirculoCompleto={onReproducirCirculoCompleto}
      />

      <ModalGuardarHero
        visible={rec.modalGuardarHeroVisible}
        onCerrar={() => rec.setModalGuardarHeroVisible(false)}
        bpm={libreria.bpmHero}
        totalNotas={rec.grabadorLocal.secuencia.length}
        sugerenciaTipo={rec.tipoSugeridoGrabacion}
        tonalidadActual={logica.tonalidadSeleccionada}
        onGuardar={onGuardarHero}
      />
    </section>
  );
};

export default EstudioAdmin;
