import React from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';

interface Props {
  logica: any;
  tonalidadSeleccionada: string;
  listaTonalidades: string[];
  modosVista: Array<{ valor: any; label: string }>;
  onAbrirEditorAvanzado: () => void;
}

const SeccionAdminSonido: React.FC<Props> = ({ logica, tonalidadSeleccionada, listaTonalidades, modosVista, onAbrirEditorAvanzado }) => (
  <div className="estudio-practica-libre-seccion">
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Tonalidades</div>
      <div className="estudio-practica-libre-grid-chips">
        {listaTonalidades.map((t) => (
          <button key={t}
            className={`estudio-practica-libre-chip-boton ${tonalidadSeleccionada === t ? 'activo' : ''}`}
            onClick={() => logica.setTonalidadSeleccionada(t)}>{t}</button>
        ))}
      </div>
    </div>
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Timbre de pitos</div>
      <div className="estudio-practica-libre-grid-doble">
        {(['Brillante', 'Armonizado'] as const).map((timbre) => (
          <button key={timbre}
            className={`estudio-practica-libre-card-boton ${(logica.ajustes?.timbre || 'Brillante') === timbre ? 'activo' : ''}`}
            onClick={() => logica.setAjustes((p: any) => ({ ...p, timbre }))}>
            <strong>{timbre}</strong>
            <span>{timbre === 'Brillante' ? 'Ataque abierto y definido' : 'Color mas grueso y envolvente'}</span>
          </button>
        ))}
      </div>
    </div>
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Instrumento</div>
      <div className="estudio-practica-libre-lista-vertical">
        {(logica.listaInstrumentos || []).map((inst: any) => (
          <button key={inst.id}
            className={`estudio-practica-libre-item-lista ${logica.instrumentoId === inst.id ? 'activo' : ''}`}
            onClick={() => logica.setInstrumentoId(inst.id)}>
            <div><strong>{inst.nombre || 'Instrumento'}</strong><span>{inst.descripcion || ''}</span></div>
            {logica.instrumentoId === inst.id && <Check size={16} />}
          </button>
        ))}
      </div>
    </div>
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Modo de vista</div>
      <div className="estudio-practica-libre-grid-chips">
        {modosVista.map(({ valor, label }) => (
          <button key={valor}
            className={`estudio-practica-libre-chip-boton ${logica.modoVista === valor ? 'activo' : ''}`}
            onClick={() => logica.setModoVista(valor)}>{label}</button>
        ))}
      </div>
    </div>
    <button className="estudio-practica-libre-btn-linea" onClick={onAbrirEditorAvanzado}>
      <SlidersHorizontal size={16} />Abrir editor avanzado
    </button>
  </div>
);

export default SeccionAdminSonido;
