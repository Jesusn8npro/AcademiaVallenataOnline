import React, { useMemo, useRef } from 'react';
import CuerpoAcordeonBase from '../../../../Core/componentes/CuerpoAcordeon';
import BarraSuperiorAdmin from '../Componentes/BarraSuperiorAdmin';
import BarraTimelineProMax from '../Componentes/BarraTimelineProMax';
import PanelLateralAdmin from '../Componentes/PanelLateralAdmin';
import ModalEditorSecuencia from '../Componentes/ModalEditorSecuencia';
import ModalesEstudioAdmin from '../Componentes/ModalesEstudioAdmin';
import FondoEspacialProMax from '../../Componentes/FondoEspacialProMax';
import { useEstudioAdmin } from '../Hooks/useEstudioAdmin';
import { formatearDuracion } from '../../PracticaLibre/Utilidades/SecuenciaLogic';
import '../../PracticaLibre/EstudioPracticaLibre.css';
import './EstudioAdmin.css';
import { MODOS_VISTA } from '../../../../Core/constantes/modosVista';

const CuerpoAcordeon = React.memo(CuerpoAcordeonBase);

const EstudioAdmin: React.FC = () => {
  const {
    navigate, hero, logica, estudio, libreria, rec, acordes,
    refAlumno, audioRef,
    modeloActivo, ajustesPractica, nombreInstrumento,
    botonesActivosAcordeon, direccionAcordeon, imagenFondoAcordeon,
    metronomoActivo, setMetronomoActivo, metronomoPro,
    modoAjuste, setModoAjuste, pestanaActiva, setPestanaActiva,
    manejarGrabacionSesion, modalesProps,
  } = useEstudioAdmin();

  const seccionesHero = useMemo(() => {
    const raw = libreria.cancionActivaLibreria?.secciones;
    if (!raw) return [];
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return []; } }
    return Array.isArray(raw) ? raw : [];
  }, [libreria.cancionActivaLibreria]);

  return (
    <section className="estudio-practica-libre estudio-admin">
      <FondoEspacialProMax />
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

          </div>

          {/* Slot para el portal del timeline del modal editor */}
          {rec.cancionEnModalEditor && (
            <div id="barra-timeline-slot" className="estudio-practica-libre-transport-fixed" />
          )}

          {/* Transport hero: solo cuando no hay modal editor abierto */}
          {!rec.cancionEnModalEditor && (hero.reproduciendo || rec.hayGrabacionActiva || Boolean(libreria.pistaUrl)) && (
            <div className="estudio-practica-libre-transport-fixed">
              <BarraTimelineProMax
                secciones={seccionesHero}
                totalTicksModal={rec.totalTicksTransporte || 1}
                bpmModal={rec.grabandoRecPro ? libreria.bpmHero : hero.bpm}
                bpmOriginal={libreria.cancionActivaLibreria?.bpm || 0}
                setBpmModal={rec.grabandoRecPro ? libreria.setBpmHero : hero.cambiarBpm}
                onCambiarBpm={rec.grabandoRecPro ? libreria.setBpmHero : hero.cambiarBpm}
                secuenciaEditada={rec.secuenciaVisualActiva || []}
                tickLocal={hero.tickActual || 0}
                // reproduciendoLocal controla el ícono del botón (Pause vs Play).
                // Cuando hero.pausado=true, el reproductor sigue en sesión
                // (reproduciendo=true) pero está pausado — debe mostrar Play.
                reproduciendoLocal={(hero.reproduciendo && !hero.pausado) || rec.hayGrabacionActiva}
                handleSeek={hero.buscarTick}
                handleReset={() => hero.buscarTick(0)}
                saltarSegundos={(seg) => hero.buscarTick(
                  Math.max(0, Math.min(rec.totalTicksTransporte, (hero.tickActual || 0) + Math.round(seg * (hero.bpm / 60) * 192)))
                )}
                togglePlay={() => {
                  if (hero.grabaciones.grabando) hero.grabaciones.detenerGrabacionPracticaLibre();
                  else if (rec.grabandoRecPro) rec.detenerGrabacionRecPro();
                  else if (!hero.reproduciendo && libreria.cancionActivaLibreria) rec.reproducirCancionActivaDesdeTick(hero.tickActual || 0);
                  else hero.alternarPausaReproduccion();
                }}
                onSeleccionarSeccion={(tickInicio) => {
                  // Atómico: pasa el tickInicio explícito → reproducirCancionActivaDesdeTick lo lleva a iniciarReproduccionSincronizada
                  // como offset real del seek, sin depender de hero.tickActual (state stale).
                  if (hero.grabaciones.grabando || rec.grabandoRecPro) return;
                  rec.reproducirCancionActivaDesdeTick(tickInicio);
                }}
                metronomoActivo={metronomoPro.activo}
                onToggleMetronomo={() => metronomoPro.activo ? metronomoPro.detener() : metronomoPro.iniciar()}
              />
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
            onVerAcordes={() => estudio.alternarPanel('lista_acordes')}
            acordeAEditar={modalesProps.acordeAEditar}
            metronomoActivo={metronomoActivo}
            setMetronomoActivo={setMetronomoActivo}
            metronomoPro={metronomoPro}
          />
        )}

        {rec.cancionEnModalEditor && (
          <ModalEditorSecuencia
            cancion={rec.cancionEnModalEditor}
            onCerrar={() => {
              rec.forzarCerrarEditor();
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
            onIniciarGrabacion={() => rec.grabadorLocal.iniciarGrabacion()}
            onDetenerGrabacion={() => {
              const resultado = rec.grabadorLocal.detenerGrabacion();
              logica.limpiarTodasLasNotas?.();
              rec.notasCheadasModalRef.current.clear();
              return resultado.secuencia;
            }}
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
            onReproducirNota={(idBoton, tiempo, duracion) => logica.reproduceTono(idBoton, tiempo, duracion)}
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
