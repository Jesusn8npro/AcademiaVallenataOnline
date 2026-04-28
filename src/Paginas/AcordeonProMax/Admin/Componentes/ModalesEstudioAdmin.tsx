import React from 'react';
import PanelAjustes from '../../../../Core/componentes/PanelAjustes/PanelAjustes';
import ModalListaAcordes from '../../../../Core/componentes/ModalListaAcordes';
import ModalGuardarHero from '../../../../Core/componentes/ModalGuardarHero';
import ModalGuardarPracticaLibre from '../../PracticaLibre/Componentes/ModalGuardarPracticaLibre';
import { MODOS_VISTA } from '../../../../Core/constantes/modosVista';

interface ModalesEstudioAdminProps {
  logica: any;
  rec: any;
  libreria: any;
  heroGrabaciones: any;
  acordes: any;
  modoAjuste: boolean;
  setModoAjuste: (v: boolean) => void;
  pestanaActiva: 'diseno' | 'sonido';
  setPestanaActiva: (v: 'diseno' | 'sonido') => void;
  modalListaAcordesVisible: boolean;
  setModalListaAcordesVisible: (v: boolean) => void;
  onGuardarHero: (datos: any) => void;
}

const ModalesEstudioAdmin: React.FC<ModalesEstudioAdminProps> = ({
  logica, rec, libreria, heroGrabaciones, acordes,
  modoAjuste, setModoAjuste,
  pestanaActiva, setPestanaActiva,
  modalListaAcordesVisible, setModalListaAcordesVisible,
  onGuardarHero,
}) => (
  <>
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
      visible={heroGrabaciones.mostrarModalGuardarPractica}
      guardando={heroGrabaciones.guardando}
      error={heroGrabaciones.error}
      tituloSugerido={heroGrabaciones.tituloSugerido}
      resumen={heroGrabaciones.resumenPendiente}
      onCancelar={heroGrabaciones.descartarPendiente}
      onGuardar={(titulo, descripcion) => heroGrabaciones.guardarPendiente({ titulo, descripcion })}
    />

    <ModalListaAcordes
      visible={modalListaAcordesVisible}
      onCerrar={() => setModalListaAcordesVisible(false)}
      tonalidadActual={logica.tonalidadSeleccionada}
      onReproducirAcorde={acordes.onReproducirAcorde}
      onDetener={acordes.onDetener}
      idSonando={acordes.idSonandoCiclo || (acordes.acordeMaestroActivo ? 'activo' : null)}
      onEditarAcorde={acordes.onEditarAcorde}
      onNuevoAcordeEnCirculo={acordes.onNuevoAcordeEnCirculo}
      onReproducirCirculoCompleto={acordes.onReproducirCirculoCompleto}
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
  </>
);

export default ModalesEstudioAdmin;
