import React, { useState } from 'react';
import { Save, RotateCcw, RefreshCw, Palette, Music2 } from 'lucide-react';
import PestanaDiseno from '../../../../Core/componentes/PanelAjustes/PestanaDiseno';
import PestanaSonido from '../../../../Core/componentes/PanelAjustes/PestanaSonido';

interface Props {
  logica: any;
}

/**
 * Tab "Gestor": ajustes visuales del acordeón (diseño) + sonidos del banco. Reusa los
 * componentes Core compartidos (`PestanaDiseno`, `PestanaSonido`) — son utilitarios genéricos
 * del simulador, no específicos del admin viejo. Solo cambia el chrome (header, botones).
 */
const PanelGestorV2: React.FC<Props> = ({ logica }) => {
  const [tab, setTab] = useState<'diseno' | 'sonido'>('diseno');

  return (
    <div className="grabv2-tab-cuerpo grabv2-gestor">
      <div className="grabv2-gestor-tabs">
        <button
          className={`grabv2-gestor-tab ${tab === 'diseno' ? 'activo' : ''}`}
          onClick={() => setTab('diseno')}
        >
          <Palette size={13} /> Diseño
        </button>
        <button
          className={`grabv2-gestor-tab ${tab === 'sonido' ? 'activo' : ''}`}
          onClick={() => setTab('sonido')}
        >
          <Music2 size={13} /> Sonidos
        </button>
      </div>

      <div className="grabv2-gestor-content">
        {tab === 'diseno' ? (
          <PestanaDiseno ajustes={logica.ajustes} setAjustes={logica.setAjustes} />
        ) : (
          <PestanaSonido
            tonalidadSeleccionada={logica.tonalidadSeleccionada}
            setTonalidadSeleccionada={logica.setTonalidadSeleccionada}
            listaTonalidades={logica.listaTonalidades}
            setListaTonalidades={logica.setListaTonalidades}
            nombresTonalidades={logica.nombresTonalidades}
            actualizarNombreTonalidad={logica.actualizarNombreTonalidad}
            eliminarTonalidad={logica.eliminarTonalidad}
            botonSeleccionado={logica.botonSeleccionado}
            mapaBotonesActual={logica.mapaBotonesActual}
            sonidosVirtuales={logica.sonidosVirtuales}
            ajustes={logica.ajustes}
            setAjustes={logica.setAjustes}
            setSonidosVirtuales={logica.setSonidosVirtuales}
            playPreview={logica.playPreview}
            stopPreview={logica.stopPreview}
            reproduceTono={logica.reproduceTono}
            samplesBrillante={logica.samplesBrillante}
            samplesBajos={logica.samplesBajos}
            samplesArmonizado={logica.samplesArmonizado}
            muestrasDB={logica.muestrasDB}
            soundsPerKey={logica.soundsPerKey}
            obtenerRutasAudio={logica.obtenerRutasAudio}
            guardarNuevoSonidoVirtual={logica.guardarNuevoSonidoVirtual}
            modoVista="controles"
            instrumentoId={logica.instrumentoId}
            setInstrumentoId={logica.setInstrumentoId}
            listaInstrumentos={logica.listaInstrumentos}
          />
        )}
      </div>

      <div className="grabv2-gestor-footer">
        <button className="grabv2-gestor-btn-save" onClick={() => { logica.stopPreview(); logica.guardarAjustes(); }}>
          <Save size={13} /> Guardar
        </button>
        <button className="grabv2-gestor-btn-reset" onClick={() => { logica.stopPreview(); logica.resetearAjustes(); }}>
          <RotateCcw size={13} /> Reset
        </button>
        <button className="grabv2-gestor-btn-sync" onClick={() => logica.sincronizarAudios(true)}>
          <RefreshCw size={13} /> Sincronizar audios
        </button>
      </div>
    </div>
  );
};

export default React.memo(PanelGestorV2);
