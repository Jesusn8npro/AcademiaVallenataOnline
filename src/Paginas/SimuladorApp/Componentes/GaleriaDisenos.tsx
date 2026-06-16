import * as React from 'react';
import { X, Check, Palette } from 'lucide-react';
// Reusa la estética full-screen de la Galería de Acordeones (mismas clases gal-*).
import './GaleriaAcordeones.css';

// Galería de DISEÑOS del acordeón para el Simulador App: los MISMOS diseños que el
// selector "Acordeón" de Pro Max (pieles original + 1..7, con sus miniaturas render).
// Por ahora solo selecciona/recuerda la elección (global vía localStorage compartido);
// el enganche del diseño al acordeón 2D del simulador se cuadra más adelante.

const DISENOS: { skin: string; nombre: string }[] = [
  { skin: 'original', nombre: 'Original' },
  { skin: '1', nombre: 'Diseño 1' },
  { skin: '2', nombre: 'Diseño 2' },
  { skin: '3', nombre: 'Diseño 3' },
  { skin: '4', nombre: 'Diseño 4' },
  { skin: '5', nombre: 'Diseño 5' },
  { skin: '6', nombre: 'Diseño 6' },
  { skin: '7', nombre: 'Diseño 7' },
];

interface Props {
  visible: boolean;
  disenoActivoId: string;
  onCerrar: () => void;
  onSeleccionar: (skin: string) => void;
}

const GaleriaDisenos: React.FC<Props> = ({ visible, disenoActivoId, onCerrar, onSeleccionar }) => {
  if (!visible) return null;

  return (
    <div className="gal-overlay" onClick={onCerrar} role="dialog" aria-modal="true">
      <div className="gal-contenido" onClick={(e) => e.stopPropagation()}>
        <header className="gal-header">
          <div className="gal-header-titulo">
            <Palette size={18} className="gal-icono-titulo" />
            <h2>Diseños del Acordeón</h2>
          </div>
          <button type="button" className="gal-btn-cerrar" onClick={onCerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <div className="gal-grid">
          {DISENOS.map((d) => {
            const esActivo = d.skin === disenoActivoId;
            return (
              <button
                key={d.skin}
                type="button"
                className={`gal-card ${esActivo ? 'activo' : ''}`}
                onClick={() => onSeleccionar(d.skin)}
                title={d.nombre}
              >
                {esActivo && (
                  <div className="gal-badge-activo">
                    <Check size={14} />
                    <span>EN USO</span>
                  </div>
                )}
                <div className="gal-card-imagen">
                  <img src={`/pieles-acordeon/${d.skin}.webp`} alt={d.nombre} loading="lazy" />
                </div>
                <div className="gal-card-info">
                  <h3 className="gal-card-nombre">{d.nombre}</h3>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GaleriaDisenos;
