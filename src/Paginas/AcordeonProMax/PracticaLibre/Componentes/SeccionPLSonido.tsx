import React from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';

interface Props {
  tonalidadSeleccionada: string;
  listaTonalidades: string[];
  timbreActivo: string;
  onSeleccionarTonalidad: (tonalidad: string) => void;
  onSeleccionarTimbre: (timbre: 'Brillante' | 'Armonizado') => void;
  instrumentoId: string;
  listaInstrumentos: any[];
  onSeleccionarInstrumento: (id: string) => void;
  modoVista: string;
  modosVista: Array<{ valor: any; label: string }>;
  onSeleccionarVista: (vista: any) => void;
  onAbrirEditorAvanzado: () => void;
}

const SeccionPLSonido: React.FC<Props> = ({
  tonalidadSeleccionada, listaTonalidades, timbreActivo, onSeleccionarTonalidad, onSeleccionarTimbre,
  instrumentoId, listaInstrumentos, onSeleccionarInstrumento, modoVista, modosVista, onSeleccionarVista, onAbrirEditorAvanzado,
}) => (
  <div className="estudio-practica-libre-seccion">
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Tonalidades</div>
      <div className="estudio-practica-libre-grid-chips">
        {listaTonalidades.map((tonalidad) => (
          <button key={tonalidad}
            className={`estudio-practica-libre-chip-boton ${tonalidadSeleccionada === tonalidad ? 'activo' : ''}`}
            onClick={() => onSeleccionarTonalidad(tonalidad)}>{tonalidad}</button>
        ))}
      </div>
    </div>
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Timbre de pitos</div>
      <div className="estudio-practica-libre-grid-doble">
        {(['Brillante', 'Armonizado'] as const).map((timbre) => (
          <button key={timbre}
            className={`estudio-practica-libre-card-boton ${timbreActivo === timbre ? 'activo' : ''}`}
            onClick={() => onSeleccionarTimbre(timbre)}>
            <strong>{timbre}</strong>
            <span>{timbre === 'Brillante' ? 'Ataque abierto y definido' : 'Color mas grueso y envolvente'}</span>
          </button>
        ))}
      </div>
    </div>
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Instrumento del acordeon</div>
      <div className="estudio-practica-libre-lista-vertical">
        {listaInstrumentos.length === 0 && (
          <div className="estudio-practica-libre-vacio">Cargando bancos del acordeon...</div>
        )}
        {listaInstrumentos.map((instrumento: any) => (
          <button key={instrumento.id}
            className={`estudio-practica-libre-item-lista ${instrumentoId === instrumento.id ? 'activo' : ''}`}
            onClick={() => onSeleccionarInstrumento(instrumento.id)}>
            <div>
              <strong>{instrumento.nombre || 'Instrumento'}</strong>
              <span>{instrumento.descripcion || 'Banco principal del acordeon.'}</span>
            </div>
            {instrumentoId === instrumento.id && <Check size={16} />}
          </button>
        ))}
      </div>
    </div>
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Modo de vista</div>
      <div className="estudio-practica-libre-grid-chips">
        {modosVista.map(({ valor, label }) => (
          <button key={valor}
            className={`estudio-practica-libre-chip-boton ${modoVista === valor ? 'activo' : ''}`}
            onClick={() => onSeleccionarVista(valor)}>{label}</button>
        ))}
      </div>
    </div>
    <button className="estudio-practica-libre-btn-linea" onClick={onAbrirEditorAvanzado}>
      <SlidersHorizontal size={16} />Abrir editor avanzado del acordeon
    </button>
  </div>
);

export default SeccionPLSonido;
