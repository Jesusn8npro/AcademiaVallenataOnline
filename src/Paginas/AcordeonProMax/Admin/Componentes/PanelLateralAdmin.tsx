import React from 'react';
import { ChevronRight } from 'lucide-react';
import { TONALIDADES } from '../../../../Core/acordeon/notasAcordeonDiatonico';
import { MODELOS_VISUALES_ACORDEON } from '../../PracticaLibre/Datos/modelosVisualesAcordeon';
import type { ModeloVisualAcordeon, SeccionPanelPracticaLibre } from '../../PracticaLibre/TiposPracticaLibre';
import { PanelAdminRec, PanelAdminGestor, PanelAdminGestorAcordes, PanelAdminListaAcordes, PanelAdminLibreria, PanelAdminUSB } from '..';
import SeccionAdminSonido from './SeccionAdminSonido';
import SeccionAdminPistas from './SeccionAdminPistas';
import SeccionAdminTeoria from './SeccionAdminTeoria';
import SeccionAdminEfectos from './SeccionAdminEfectos';

export interface HeroTransport {
  bpm: number;
  tickActual: number;
  totalTicks: number;
  reproduciendo: boolean;
  pausado: boolean;
  loopAB: any;
  grabaciones: { grabando: boolean };
  alternarPausaReproduccion: () => void;
  buscarTick: (tick: number) => void;
}

export interface AcordesAdmin {
  idSonandoCiclo: string | null;
  acordeMaestroActivo: boolean;
  onReproducirAcorde: (botones: string[], fuelle: string, id?: string) => void;
  onDetener: () => void;
  onEditarAcorde: (acorde: any) => void;
  onNuevoAcordeEnCirculo: (tonalidad?: string, modalidad?: string) => void;
  onReproducirCirculoCompleto: (acordes: any[]) => Promise<void>;
}

interface PanelLateralAdminProps {
  visible: boolean;
  seccionActiva: SeccionPanelPracticaLibre | null;
  logica: any;
  estudio: any;
  rec: any;
  libreria: any;
  hero: HeroTransport;
  acordes: AcordesAdmin;
  modosVista: Array<{ valor: any; label: string }>;
  modeloActivo: ModeloVisualAcordeon;
  onAbrirEditorAvanzado: () => void;
  onCrearAcorde: () => void;
  onVerAcordes: () => void;
  metronomoActivo: boolean;
  setMetronomoActivo: (val: boolean) => void;
}

const TITULO_SECCION: Partial<Record<SeccionPanelPracticaLibre, string>> = {
  sonido: 'Sonido y lectura', modelos: 'Modelos visuales', pistas: 'Pistas y capas',
  teoria: 'Teoria musical', efectos: 'Efectos y mezcla', rec: 'Grabacion pro',
  gestor: 'Gestor de sonidos', gestor_acordes: 'Creador de acordes',
  lista_acordes: 'Biblioteca de acordes', libreria: 'Libreria Hero', usb: 'Conexion USB',
};

const PanelLateralAdmin: React.FC<PanelLateralAdminProps> = ({
  visible, seccionActiva, logica, estudio, rec, libreria, hero,
  acordes, modosVista, modeloActivo, onAbrirEditorAvanzado,
  onCrearAcorde, onVerAcordes, metronomoActivo, setMetronomoActivo,
}) => {
  if (!visible || !seccionActiva) return null;

  const tonalidadSeleccionada: string = logica.tonalidadSeleccionada;
  const listaTonalidades: string[] = logica.listaTonalidades?.length
    ? logica.listaTonalidades
    : Object.keys(TONALIDADES);

  const detenerHero = () => {
    hero.buscarTick(0);
    if (hero.reproduciendo && !hero.pausado) hero.alternarPausaReproduccion();
  };

  return (
    <aside className="estudio-practica-libre-panel">
      <div className="estudio-practica-libre-panel-encabezado">
        <div>
          <span className="estudio-practica-libre-panel-kicker">Panel Admin</span>
          <h3>{TITULO_SECCION[seccionActiva] || seccionActiva}</h3>
        </div>
        <div className="estudio-practica-libre-chip-simple">
          <ChevronRight size={14} />
          {tonalidadSeleccionada}
        </div>
      </div>

      {seccionActiva === 'sonido' && (
        <SeccionAdminSonido logica={logica} tonalidadSeleccionada={tonalidadSeleccionada} listaTonalidades={listaTonalidades} modosVista={modosVista} onAbrirEditorAvanzado={onAbrirEditorAvanzado} />
      )}

      {seccionActiva === 'modelos' && (
        <div className="estudio-practica-libre-seccion">
          <div className="estudio-practica-libre-grid-modelos">
            {MODELOS_VISUALES_ACORDEON.map((modelo) => (
              <button key={modelo.id}
                className={`estudio-practica-libre-modelo-card ${modeloActivo.id === modelo.id ? 'activo' : ''}`}
                onClick={() => estudio.seleccionarModeloVisual(modelo.id)}>
                <div className="estudio-practica-libre-modelo-imagen-wrap">
                  <img src={modelo.imagen} alt={modelo.nombre} className="estudio-practica-libre-modelo-imagen" />
                </div>
                <strong>{modelo.nombre}</strong><span>{modelo.descripcion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {seccionActiva === 'pistas' && <SeccionAdminPistas estudio={estudio} />}

      {seccionActiva === 'teoria' && (
        <SeccionAdminTeoria tonalidadSeleccionada={tonalidadSeleccionada} mostrarTeoriaCircular={!!estudio.preferencias?.mostrarTeoriaCircular} />
      )}

      {seccionActiva === 'efectos' && <SeccionAdminEfectos estudio={estudio} />}

      {seccionActiva === 'rec' && (
        <PanelAdminRec
          bpm={libreria.bpmHero}
          setBpm={libreria.setBpmHero}
          grabando={rec.grabandoRecPro || rec.esperandoPunchIn}
          onIniciarGrabacion={rec.cancionEditandoSecuencia ? rec.iniciarPunchInEdicion : rec.iniciarGrabacionRecPro}
          onDetenerGrabacion={rec.detenerGrabacionRecPro}
          totalNotas={rec.grabadorLocal.secuencia.length}
          tiempoGrabacionMs={rec.tiempoGrabacionRecProMs}
          pistaActualUrl={libreria.pistaUrl}
          onPistaChange={libreria.handlePistaChange}
          reproduciendoHero={hero.reproduciendo}
          cancionActual={null}
          tickActual={hero.tickActual}
          totalTicks={hero.totalTicks}
          onAlternarPausaHero={hero.alternarPausaReproduccion}
          onDetenerHero={detenerHero}
          onBuscarTick={hero.buscarTick}
          bpmGrabacion={libreria.bpmGrabacion}
          punchInTick={rec.punchInTick}
          setPunchInTick={rec.setPunchInTick}
          preRollSegundos={rec.preRollSegundos}
          setPreRollSegundos={rec.setPreRollSegundos}
          cuentaAtrasPreRoll={rec.esperandoPunchIn ? rec.preRollSegundos : null}
          onIniciarPunchIn={rec.iniciarPunchInEdicion}
          esperandoPunchIn={rec.esperandoPunchIn}
          metronomoActivo={metronomoActivo}
          setMetronomoActivo={setMetronomoActivo}
          bloqueadoPorSesion={hero.grabaciones.grabando}
        />
      )}

      {seccionActiva === 'gestor' && logica.ajustes && (
        <PanelAdminGestor
          ajustes={logica.ajustes}
          setAjustes={logica.setAjustes}
          tonalidadSeleccionada={logica.tonalidadSeleccionada}
          setTonalidadSeleccionada={logica.setTonalidadSeleccionada}
          listaTonalidades={logica.listaTonalidades || []}
          setListaTonalidades={logica.setListaTonalidades}
          nombresTonalidades={logica.nombresTonalidades || {}}
          actualizarNombreTonalidad={logica.actualizarNombreTonalidad}
          sonidosVirtuales={logica.sonidosVirtuales || []}
          setSonidosVirtuales={logica.setSonidosVirtuales}
          eliminarTonalidad={logica.eliminarTonalidad}
          mapaBotonesActual={logica.mapaBotonesActual || {}}
          botonSeleccionado={logica.botonSeleccionado || null}
          playPreview={logica.playPreview}
          stopPreview={logica.stopPreview}
          reproduceTono={logica.reproduceTono}
          samplesBrillante={logica.samplesBrillante || []}
          samplesBajos={logica.samplesBajos || []}
          samplesArmonizado={logica.samplesArmonizado || []}
          muestrasDB={logica.muestrasDB || []}
          soundsPerKey={logica.soundsPerKey || {}}
          obtenerRutasAudio={logica.obtenerRutasAudio}
          guardarAjustes={logica.guardarAjustes}
          resetearAjustes={logica.resetearAjustes}
          sincronizarAudios={logica.sincronizarAudios}
          guardarNuevoSonidoVirtual={logica.guardarNuevoSonidoVirtual}
          instrumentoId={logica.instrumentoId}
          setInstrumentoId={logica.setInstrumentoId}
          listaInstrumentos={logica.listaInstrumentos || []}
        />
      )}

      {seccionActiva === 'gestor_acordes' && (
        <PanelAdminGestorAcordes
          onCrearNuevo={onCrearAcorde}
          onVerTodos={onVerAcordes}
          totalAcordes={0}
        />
      )}

      {seccionActiva === 'lista_acordes' && (
        <PanelAdminListaAcordes
          onReproducirAcorde={acordes.onReproducirAcorde}
          onDetener={acordes.onDetener}
          idSonando={acordes.idSonandoCiclo}
          onEditarAcorde={acordes.onEditarAcorde}
          tonalidadActual={logica.tonalidadSeleccionada}
        />
      )}

      {seccionActiva === 'libreria' && (
        <PanelAdminLibreria
          onReproducir={rec.handleReproducirLibreria}
          onEditarSecuencia={rec.handleAbrirModalEditor}
          onMarcarEntradaEdicion={rec.marcarEntradaEdicion}
          onMarcarSalidaEdicion={rec.marcarSalidaEdicion}
          onIniciarPunchIn={rec.iniciarPunchInEdicion}
          onGuardarEdicionSecuencia={rec.guardarEdicionSecuencia}
          onCancelarEdicionSecuencia={rec.cancelarEdicionSecuencia}
          onLimpiarRangoEdicion={rec.limpiarRangoEdicion}
          cancionEditandoId={rec.cancionEditandoSecuencia?.id || null}
          tituloCancionEditando={rec.cancionEditandoSecuencia?.titulo || null}
          bpmCancionEditando={rec.cancionEditandoSecuencia?.bpm || hero.bpm}
          tickActual={hero.tickActual}
          punchInTick={rec.punchInTick ?? null}
          punchOutTick={hero.loopAB?.hasEnd ? hero.loopAB.end : null}
          preRollSegundos={rec.preRollSegundos || 4}
          setPreRollSegundos={rec.setPreRollSegundos}
          esperandoPunchIn={rec.esperandoPunchIn}
          grabandoEdicionSecuencia={rec.estaGrabandoEdicionSecuencia}
          guardandoEdicionSecuencia={rec.guardandoEdicionSecuencia}
          hayCambiosEdicionSecuencia={rec.hayCambiosEdicionSecuencia}
          mensajeEdicionSecuencia={rec.mensajeEdicionSecuencia}
          cancionActualizada={libreria.ultimaCancionLibreriaActualizada}
        />
      )}

      {seccionActiva === 'usb' && (
        <PanelAdminUSB
          conectado={logica.esp32Conectado}
          onConectar={logica.conectarESP32}
        />
      )}
    </aside>
  );
};

export default PanelLateralAdmin;
