import React from 'react';
import {
  BookOpen,
  Image,
  Mic2,
  Music2,
  PauseCircle,
  SlidersHorizontal,
  Sparkles,
  Volume2,
} from 'lucide-react';
import type { SeccionPanelPracticaLibre } from '../TiposPracticaLibre';

interface BarraSuperiorPracticaLibreProps {
  panelActivo: SeccionPanelPracticaLibre | null;
  onAlternarPanel: (seccion: SeccionPanelPracticaLibre) => void;
  tonalidad: string;
  timbre: string;
  nombreInstrumento: string;
  nombreModelo: string;
  nombrePista: string | null;
  grabando: boolean;
  tiempoGrabacion: string;
  onAlternarGrabacion: () => void;
}

const ACCIONES_PANEL: Array<{ clave: SeccionPanelPracticaLibre; label: string; icono: React.ReactNode }> = [
  { clave: 'sonido', label: 'Sonido', icono: <Volume2 size={15} /> },
  { clave: 'modelos', label: 'Modelos', icono: <Image size={15} /> },
  { clave: 'pistas', label: 'Pistas', icono: <Music2 size={15} /> },
  { clave: 'teoria', label: 'Teoria', icono: <BookOpen size={15} /> },
  { clave: 'efectos', label: 'FX', icono: <SlidersHorizontal size={15} /> },
];

const BarraSuperiorPracticaLibre: React.FC<BarraSuperiorPracticaLibreProps> = ({
  panelActivo,
  onAlternarPanel,
  tonalidad,
  timbre,
  nombreInstrumento,
  nombreModelo,
  nombrePista,
  grabando,
  tiempoGrabacion,
  onAlternarGrabacion,
}) => {
  return (
    <div className="estudio-practica-libre-topbar">
      <div className="estudio-practica-libre-topbar-copy">
        <span className="estudio-practica-libre-kicker">Estudio Practica Libre</span>
        <h2>Cabina de sonido y practica personalizada</h2>
        <p>
          Tono {tonalidad} · Timbre {timbre} · {nombreInstrumento} · {nombreModelo}
          {nombrePista ? ` · Pista ${nombrePista}` : ' · Sin pista seleccionada'}
        </p>
      </div>

      <div className="estudio-practica-libre-topbar-acciones">
        <div className="estudio-practica-libre-grupo-paneles">
          {ACCIONES_PANEL.map(({ clave, label, icono }) => (
            <button
              key={clave}
              className={`estudio-practica-libre-btn ${panelActivo === clave ? 'activo' : ''}`}
              onClick={() => onAlternarPanel(clave)}
            >
              {icono}
              {label}
            </button>
          ))}
        </div>

        <button
          className={`estudio-practica-libre-btn-grabar ${grabando ? 'grabando' : ''}`}
          onClick={onAlternarGrabacion}
        >
          {grabando ? <PauseCircle size={16} /> : <Mic2 size={16} />}
          {grabando ? `Detener ${tiempoGrabacion}` : 'Grabar sesion'}
        </button>

        <div className={`estudio-practica-libre-pill ${grabando ? 'grabando' : ''}`}>
          <Sparkles size={14} />
          {grabando ? `Grabando ${tiempoGrabacion}` : 'Studio listo'}
        </div>
      </div>
    </div>
  );
};

export default BarraSuperiorPracticaLibre;
