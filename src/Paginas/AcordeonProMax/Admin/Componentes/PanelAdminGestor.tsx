import React from 'react';
import { Save, RotateCcw, RefreshCw } from 'lucide-react';
import PestanaDiseno from '../../../SimuladorDeAcordeon/Componentes/PanelAjustes/PestanaDiseno';
import PestanaSonido from '../../../SimuladorDeAcordeon/Componentes/PanelAjustes/PestanaSonido';
import type { AjustesAcordeon, SonidoVirtual } from '../../../SimuladorDeAcordeon/TiposAcordeon';
import './PanelAdminGestor.css';

interface PanelAdminGestorProps {
  ajustes: AjustesAcordeon;
  setAjustes: (a: AjustesAcordeon) => void;
  tonalidadSeleccionada: string;
  setTonalidadSeleccionada: (v: string) => void;
  listaTonalidades: string[];
  setListaTonalidades: (l: string[]) => void;
  nombresTonalidades: Record<string, string>;
  actualizarNombreTonalidad: (id: string, nombre: string) => void;
  sonidosVirtuales: SonidoVirtual[];
  setSonidosVirtuales: (sv: SonidoVirtual[]) => void;
  eliminarTonalidad: (t: string) => void;
  mapaBotonesActual: any;
  botonSeleccionado: string | null;
  playPreview: (r: string, p: number) => void;
  stopPreview: () => void;
  reproduceTono: (id: string) => { instances: any[] };
  samplesBrillante: string[];
  samplesBajos: string[];
  samplesArmonizado: string[];
  muestrasDB: any[];
  soundsPerKey: Record<string, string[]>;
  obtenerRutasAudio: (id: string) => string[];
  guardarAjustes: () => void;
  resetearAjustes: () => void;
  sincronizarAudios: () => void;
  guardarNuevoSonidoVirtual: (nombre: string, rutaBase: string, pitch: number, tipo: 'Bajos' | 'Brillante' | 'Armonizado') => void;
  instrumentoId: string;
  setInstrumentoId: (id: string) => void;
  listaInstrumentos: any[];
}

const PanelAdminGestor: React.FC<PanelAdminGestorProps> = (props) => {
  const [pestanaActiva, setPestanaActiva] = React.useState<'diseno' | 'sonido'>('diseno');

  return (
    <div className="panel-admin-gestor">
      {/* Tabs */}
      <div className="panel-admin-gestor-header">
        <button
          onClick={() => setPestanaActiva('diseno')}
          className={`panel-admin-gestor-control-btn ${pestanaActiva === 'diseno' ? 'activo' : ''}`}
        >
          🎨 DISEÑO
        </button>
        <button
          onClick={() => setPestanaActiva('sonido')}
          className={`panel-admin-gestor-control-btn ${pestanaActiva === 'sonido' ? 'activo' : ''}`}
        >
          🎵 SONIDOS
        </button>
      </div>

      {/* Content */}
      <div className="panel-admin-gestor-content">
        {pestanaActiva === 'diseno' ? (
          <PestanaDiseno ajustes={props.ajustes} setAjustes={props.setAjustes} />
        ) : (
          <PestanaSonido
            {...props}
            soundsPerKey={props.soundsPerKey}
            modoVista="controles"
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="panel-admin-gestor-footer">
        <button
          onClick={() => {
            props.stopPreview();
            props.guardarAjustes();
          }}
          className="panel-admin-gestor-btn panel-admin-gestor-btn-save"
        >
          <Save size={14} /> GUARDAR
        </button>
        <button
          onClick={() => {
            props.stopPreview();
            props.resetearAjustes();
          }}
          className="panel-admin-gestor-btn panel-admin-gestor-btn-reset"
        >
          <RotateCcw size={14} /> RESET
        </button>
        <button
          onClick={() => (props.sincronizarAudios as any)(true)}
          className="panel-admin-gestor-btn panel-admin-gestor-btn-sync"
        >
          <RefreshCw size={14} /> AUDIOS
        </button>
      </div>
    </div>
  );
};

export default PanelAdminGestor;
