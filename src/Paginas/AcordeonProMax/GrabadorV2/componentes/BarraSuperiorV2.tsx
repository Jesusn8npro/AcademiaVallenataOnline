import React from 'react';
import { ArrowLeft, Music, Settings, Layers, List, Usb, Sparkles, Music2 } from 'lucide-react';

export type TabGrabadorV2 = 'canciones' | 'gestor' | 'crear' | 'acordes' | 'usb' | 'pistas';

const TABS: Array<{ clave: TabGrabadorV2; label: string; icon: React.ReactNode }> = [
  { clave: 'canciones', label: 'Canciones', icon: <Music size={13} /> },
  { clave: 'pistas',    label: 'Pistas',    icon: <Music2 size={13} /> },
  { clave: 'gestor',    label: 'Gestor',    icon: <Settings size={13} /> },
  { clave: 'crear',     label: 'Crear',     icon: <Layers size={13} /> },
  { clave: 'acordes',   label: 'Acordes',   icon: <List size={13} /> },
  { clave: 'usb',       label: 'USB',       icon: <Usb size={13} /> },
];

interface Props {
  tabActivo: TabGrabadorV2;
  onCambiarTab(t: TabGrabadorV2): void;
  nombreUsuario?: string;
  onSalir(): void;
}

const BarraSuperiorV2: React.FC<Props> = ({ tabActivo, onCambiarTab, nombreUsuario = 'Maestro', onSalir }) => (
  <header className="grabv2-hero">
    <div className="grabv2-hero-marco">
      <button className="grabv2-hero-volver" onClick={onSalir} title="Salir al menú">
        <ArrowLeft size={15} />
      </button>
      <div className="grabv2-hero-identidad">
        <span className="grabv2-hero-kicker">
          <Sparkles size={9} /> Studio Admin
        </span>
        <h1 className="grabv2-hero-titulo">{nombreUsuario}</h1>
      </div>
    </div>

    <nav className="grabv2-hero-tabs" role="tablist">
      {TABS.map(({ clave, label, icon }) => (
        <button
          key={clave}
          role="tab"
          aria-selected={tabActivo === clave}
          className={`grabv2-hero-tab ${tabActivo === clave ? 'activo' : ''}`}
          onClick={() => onCambiarTab(clave)}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  </header>
);

export default React.memo(BarraSuperiorV2);
