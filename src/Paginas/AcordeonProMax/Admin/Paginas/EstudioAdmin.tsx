import React from 'react';
import CuerpoAcordeonBase from '../../../../Core/componentes/CuerpoAcordeon';
import BarraSuperiorAdmin from '../Componentes/BarraSuperiorAdmin';
import BarraReproductorPracticaLibre from '../../PracticaLibre/Componentes/BarraReproductorPracticaLibre';
import BarraTransporte from '../../Modos/BarraTransporte';
import PuenteNotas from '../../Componentes/PuenteNotas';
import PanelLateralAdmin from '../Componentes/PanelLateralAdmin';
import ModalEditorSecuencia from '../Componentes/ModalEditorSecuencia';
import ModalesEstudioAdmin from '../Componentes/ModalesEstudioAdmin';
import { useEstudioAdmin } from '../Hooks/useEstudioAdmin';
import { formatearDuracion } from '../../PracticaLibre/Utilidades/SecuenciaLogic';
import '../../PracticaLibre/EstudioPracticaLibre.css';
import './EstudioAdmin.css';
import { MODOS_VISTA } from '../../../../Core/constantes/modosVista';

const CuerpoAcordeon = React.memo(CuerpoAcordeonBase);

const EstudioAdmin: React.FC = () => {
  const {
    navigate, hero, logica, estudio, libreria, rec, acordes,
    refAlumno, obtenerPosicionAlumno, audioRef,
    modeloActivo, ajustesPractica, nombreInstrumento,
    botonesActivosAcordeon, direccionAcordeon, imagenFondoAcordeon,
    metronomoActivo, setMetronomoActivo,
    modoAjuste, setModoAjuste, pestanaActiva, setPestanaActiva,
    manejarGrabacionSesion, modalesProps,
  } = useEstudioAdmin();

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
            acordes={acordes}
            modosVista={MODOS_VISTA}
            modeloActivo={modeloActivo}
            onAbrirEditorAvanzado={() => { setPestanaActiva('sonido'); setModoAjuste(true); }}
            onCrearAcorde={() => modalesProps.setModalCreadorAcordesVisible(true)}
            onVerAcordes={() => modalesProps.setModalListaAcordesVisible(true)}
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

      {rec.confirmacion && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%' }}>
            <p style={{ color: 'white', marginBottom: '20px', lineHeight: 1.5 }}>{rec.confirmacion.texto}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => rec.setConfirmacion(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #4b5563', background: 'transparent', color: 'white', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => { rec.confirmacion!.onConfirmar(); rec.setConfirmacion(null); }} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <ModalesEstudioAdmin {...modalesProps} />
    </section>
  );
};

export default EstudioAdmin;
