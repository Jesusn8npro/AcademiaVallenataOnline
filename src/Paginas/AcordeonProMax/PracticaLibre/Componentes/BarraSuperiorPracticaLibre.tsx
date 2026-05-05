import React from 'react';
import {
  Image,
  Mic2,
  Music2,
  PauseCircle,
  SlidersHorizontal,
  Volume2,
  Circle,
  Layers,
  List,
  Usb,
  Music,
  Home,
  Settings,
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
  grabandoSesion: boolean;
  tiempoGrabacionSesion: string;
  grabandoRecPro?: boolean;
  onAlternarGrabacion: () => void;
  onVolver?: () => void;
  esAdmin?: boolean;
  esp32Conectado?: boolean;
}

// "Libreria" se quitó del estudiante: las clases de canciones se ven directamente en
// /acordeon-pro-max (módulo principal). "Teoria" tampoco — la pestaña no estaba
// funcionando y se eliminó hasta que esté lista. Acá solo controles del estudio.
const ACCIONES_PANEL: Array<{ clave: SeccionPanelPracticaLibre; label: string; icono: React.ReactNode }> = [
  { clave: 'sonido', label: 'Sonido', icono: <Volume2 size={15} /> },
  { clave: 'modelos', label: 'Modelos', icono: <Image size={15} /> },
  { clave: 'pistas', label: 'Pistas y Estudio', icono: <Music2 size={15} /> },
  { clave: 'efectos', label: 'FX', icono: <SlidersHorizontal size={15} /> },
];

const ACCIONES_PANEL_ADMIN: Array<{ clave: SeccionPanelPracticaLibre; label: string; icono: React.ReactNode }> = [
  { clave: 'rec', label: 'REC', icono: <Circle size={15} /> },
  { clave: 'gestor', label: 'Gestor', icono: <Settings size={15} /> },
  { clave: 'gestor_acordes', label: 'Crear', icono: <Layers size={15} /> },
  { clave: 'lista_acordes', label: 'Acordes', icono: <List size={15} /> },
  { clave: 'libreria', label: 'Libreria', icono: <Music size={15} /> },
  { clave: 'usb', label: 'USB', icono: <Usb size={15} /> },
];

const BarraSuperiorPracticaLibre: React.FC<BarraSuperiorPracticaLibreProps> = ({
  panelActivo,
  onAlternarPanel,
  tonalidad,
  timbre,
  nombreInstrumento,
  nombreModelo,
  nombrePista,
  grabandoSesion,
  tiempoGrabacionSesion,
  grabandoRecPro = false,
  onAlternarGrabacion,
  onVolver,
  esAdmin = false,
  esp32Conectado = false,
}) => {
  return (
    <div className="estudio-practica-libre-topbar">
      <div className="estudio-practica-libre-topbar-copy">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {onVolver && (
            <button className="estudio-practica-libre-btn-salir" onClick={onVolver} title="Volver al menú">
               <Home size={18} />
            </button>
          )}
          <div>
            <span className="estudio-practica-libre-kicker">Estudio Practica Libre</span>
            <h2>Cabina de sonido y practica</h2>
            <p>
              Tono {tonalidad} · Timbre {timbre} · {nombreInstrumento}
              {nombrePista ? ` · Pista ${nombrePista}` : ''}
            </p>
          </div>
        </div>
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

        {esAdmin && (
          <div className="estudio-practica-libre-grupo-paneles admin" style={{ marginLeft: '12px', paddingLeft: '12px', borderLeft: '2px solid #3b82f6' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#3b82f6', alignSelf: 'center', marginRight: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ADMIN
            </span>
            {ACCIONES_PANEL_ADMIN.map(({ clave, label, icono }) => (
              <button
                key={clave}
                className={`estudio-practica-libre-btn ${panelActivo === clave ? 'activo' : ''}`}
                onClick={() => onAlternarPanel(clave)}
                title={label}
              >
                {icono}
                {label}
              </button>
            ))}
          </div>
        )}

        <button
          className={`estudio-practica-libre-btn-grabar ${grabandoSesion ? 'grabando' : ''}`}
          onClick={onAlternarGrabacion}
          disabled={grabandoRecPro}
          title={grabandoRecPro ? 'El REC Pro esta activo en la pestana REC.' : 'Acceso rápido — el modo se elige en la pestaña Pistas y Estudio'}
        >
          {grabandoSesion ? <PauseCircle size={16} /> : <Mic2 size={16} />}
          {grabandoSesion ? `${tiempoGrabacionSesion}` : 'REC'}
        </button>
      </div>
    </div>
  );
};

export default BarraSuperiorPracticaLibre;
