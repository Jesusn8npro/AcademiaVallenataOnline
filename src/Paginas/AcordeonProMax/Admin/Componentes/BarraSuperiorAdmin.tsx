import React from 'react';
import {
  Circle,
  Eye,
  Home,
  Layers,
  Library,
  List,
  Mic2,
  PauseCircle,
  Settings,
  Sparkles,
  Usb,
} from 'lucide-react';
import type { SeccionPanelPracticaLibre } from '../../PracticaLibre/TiposPracticaLibre';

const MENSAJES_MOTIVACIONALES = [
  'Hoy es un gran dia para subir un exito',
  'El Vallenato Pro Max depende de tu orden',
  'Nuevos alumnos esperan tu contenido',
  'Cada cancion que subes es una clase que se imparte sola',
  'Tu biblioteca es el corazon del aprendizaje',
  'Sin contenido no hay experiencia. A grabar.',
  'La calidad de tus grabaciones define el nivel del alumno',
  'Organiza, graba, publica. El ciclo del maestro.',
  'Un exito bien grabado vale mil clases',
  'El sistema espera tu proxima cancion',
  'Tus alumnos avanzan al ritmo que tu subes contenido',
  'Construyendo el mejor repertorio vallenato del mundo',
  'Cada nota que grabas es historia musical',
  'Panel listo. Acordeon listo. Maestro listo.',
  'El orden del catalogo es la primera leccion del alumno',
];

const ACCIONES_ADMIN: Array<{ clave: SeccionPanelPracticaLibre; label: string; icono: React.ReactNode }> = [
  { clave: 'rec',           label: 'REC Pro',  icono: <Circle size={15} /> },
  { clave: 'gestor',        label: 'Gestor',   icono: <Settings size={15} /> },
  { clave: 'gestor_acordes',label: 'Crear',    icono: <Layers size={15} /> },
  { clave: 'lista_acordes', label: 'Acordes',  icono: <List size={15} /> },
  { clave: 'libreria',      label: 'Libreria', icono: <Library size={15} /> },
  { clave: 'usb',           label: 'USB',      icono: <Usb size={15} /> },
];

interface BarraSuperiorAdminProps {
  panelActivo: SeccionPanelPracticaLibre | null;
  onAlternarPanel: (seccion: SeccionPanelPracticaLibre) => void;
  tonalidad: string;
  timbre: string;
  nombreInstrumento: string;
  grabandoSesion: boolean;
  tiempoGrabacionSesion: string;
  grabandoRecPro?: boolean;
  onAlternarGrabacion: () => void;
  onVolver?: () => void;
}

const BarraSuperiorAdmin: React.FC<BarraSuperiorAdminProps> = ({
  panelActivo,
  onAlternarPanel,
  tonalidad,
  timbre,
  nombreInstrumento,
  grabandoSesion,
  tiempoGrabacionSesion,
  grabandoRecPro = false,
  onAlternarGrabacion,
  onVolver,
}) => {
  const [mensaje] = React.useState(
    () => MENSAJES_MOTIVACIONALES[Math.floor(Math.random() * MENSAJES_MOTIVACIONALES.length)]
  );

  return (
    <div className="estudio-practica-libre-topbar admin-topbar">
      <div className="estudio-practica-libre-topbar-copy">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {onVolver && (
            <button className="estudio-practica-libre-btn-salir" onClick={onVolver} title="Volver al menu">
              <Home size={18} />
            </button>
          )}
          <div>
            <span className="estudio-practica-libre-kicker admin-kicker">
              Panel de Control
            </span>
            <h2 className="admin-titulo">JESUS GONZALEZ</h2>
            <p className="admin-mensaje">{mensaje}</p>
          </div>
        </div>
      </div>

      <div className="estudio-practica-libre-topbar-acciones">
        <div className="estudio-practica-libre-grupo-paneles admin">
          {ACCIONES_ADMIN.map(({ clave, label, icono }) => (
            <button
              key={clave}
              className={`estudio-practica-libre-btn admin-btn ${panelActivo === clave ? 'activo' : ''}`}
              onClick={() => onAlternarPanel(clave)}
              title={label}
            >
              {icono}
              {label}
            </button>
          ))}
        </div>

        <button
          className="estudio-practica-libre-btn admin-ver-estudiante"
          onClick={() => window.open('/acordeon-pro-max/acordeon', '_blank')}
          title="Ver como estudiante en una pestana nueva"
        >
          <Eye size={15} />
          Ver como Estudiante
        </button>

        <button
          className={`estudio-practica-libre-btn-grabar ${grabandoSesion ? 'grabando' : ''}`}
          onClick={onAlternarGrabacion}
          disabled={grabandoRecPro}
          title={grabandoRecPro ? 'El REC Pro esta activo en la pestana REC.' : 'Grabar una sesion personal'}
        >
          {grabandoSesion ? <PauseCircle size={16} /> : <Mic2 size={16} />}
          {grabandoSesion ? `Detener ${tiempoGrabacionSesion}` : 'Grabar sesion'}
        </button>

        <div className={`estudio-practica-libre-pill admin-pill ${grabandoSesion ? 'grabando' : ''}`}>
          <Sparkles size={14} />
          {grabandoSesion
            ? `Grabando sesion ${tiempoGrabacionSesion}`
            : grabandoRecPro
              ? 'REC Pro activo'
              : 'Studio Admin'}
        </div>
      </div>
    </div>
  );
};

export default BarraSuperiorAdmin;
