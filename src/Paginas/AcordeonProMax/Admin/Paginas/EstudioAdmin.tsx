import React, { useMemo } from 'react';
import CuerpoAcordeonBase from '../../../../Core/componentes/CuerpoAcordeon';
import BarraSuperiorAdmin from '../Componentes/BarraSuperiorAdmin';
import BarraTransporte from '../../Modos/BarraTransporte';
import PanelLateralAdmin from '../Componentes/PanelLateralAdmin';
import ModalEditorSecuencia from '../Componentes/ModalEditorSecuencia';
import ModalesEstudioAdmin from '../Componentes/ModalesEstudioAdmin';
import FondoEspacialProMax from '../../Componentes/FondoEspacialProMax';
import { useEstudioAdmin } from '../Hooks/useEstudioAdmin';
import { useReproductorAdmin } from '../Hooks/useReproductorAdmin';
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

  // Reproductor independiente solo para EstudioAdmin (transport de la canción de librería).
  // No comparte código con useReproductorHero — usa audio.currentTime como única fuente de verdad.
  // Hero sigue manejando grabaciones; este hook solo maneja play/pause/seek de la pista.
  const cancionParaReproductor = useMemo(() => {
    if (!libreria.cancionActivaLibreria) return null;
    return libreria.cancionActivaLibreria;
  }, [libreria.cancionActivaLibreria]);

  const reproductor = useReproductorAdmin({
    audio: audioRef.current,
    cancion: cancionParaReproductor,
    bpmTransport: hero.bpm,
    logica,
  });

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

          {/* Transport: usa el reproductor INDEPENDIENTE de Admin. No pasa por useReproductorHero. */}
          {!rec.cancionEnModalEditor && (reproductor.reproduciendo || rec.hayGrabacionActiva || Boolean(libreria.pistaUrl)) && (
            <div className="estudio-practica-libre-transport-fixed">
              <BarraTransporte
                reproduciendo={reproductor.reproduciendo}
                pausado={reproductor.pausado}
                onAlternarPausa={() => {
                  if (hero.grabaciones.grabando) { hero.grabaciones.detenerGrabacionPracticaLibre(); return; }
                  if (rec.grabandoRecPro) { rec.detenerGrabacionRecPro(); return; }
                  // Si no hay reproducción activa todavía, arrancar desde tick 0 (o el actual).
                  if (!reproductor.reproduciendo && libreria.cancionActivaLibreria) {
                    void reproductor.play(reproductor.tickActual || 0);
                    return;
                  }
                  reproductor.alternarPausa();
                }}
                onDetener={() => {
                  if (hero.grabaciones.grabando) hero.grabaciones.detenerGrabacionPracticaLibre();
                  if (rec.grabandoRecPro) rec.detenerGrabacionRecPro();
                  reproductor.detener();
                }}
                tickActual={reproductor.tickActual}
                totalTicks={Math.max(reproductor.totalTicks, rec.totalTicksTransporte || 1)}
                onBuscarTick={(tick) => {
                  if (hero.grabaciones.grabando || rec.grabandoRecPro) return;
                  reproductor.buscarTick(tick);
                }}
                bpm={hero.bpm}
                loopAB={hero.loopAB}
                onMarcarLoopInicio={hero.marcarLoopInicio}
                onMarcarLoopFin={hero.marcarLoopFin}
                onActualizarLoopInicio={hero.actualizarLoopInicioTick}
                onActualizarLoopFin={hero.actualizarLoopFinTick}
                onAlternarLoop={hero.alternarLoopAB}
                onLimpiarLoop={hero.limpiarLoopAB}
                onCambiarBpm={hero.cambiarBpm}
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
            onIniciarGrabacion={(audio?: any, startTick?: number, bpmOriginal?: number) => {
              // Pasar el audio + startTick absoluto + bpmOriginal al grabador: las notas se
              // timestampearán contra audio.currentTime con la escala bpm correcta → cero drift entre
              // la secuencia grabada y el MP3 en reproducciones limpias, incluso con slow practice.
              rec.grabadorLocal.iniciarGrabacion([], startTick ?? 0, audio, bpmOriginal);
            }}
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
