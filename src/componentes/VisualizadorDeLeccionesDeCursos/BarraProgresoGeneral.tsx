import React from 'react';
import './BarraProgresoGeneral.css';

interface BarraProgresoGeneralProps {
  tipo: 'curso' | 'tutorial';
  completadas?: number;
  total?: number;
  porcentaje?: number;
}

const BarraProgresoGeneral: React.FC<BarraProgresoGeneralProps> = ({
  tipo,
  completadas = 0,
  total = 0,
  porcentaje = 0,
}) => (
  <div className="barra-progreso-general">
    <div className="progreso-label">
      Progreso: {completadas} / {total} {tipo === 'curso' ? 'lecciones' : 'clases'} ({porcentaje}%)
    </div>
    <div className="progreso-barra">
      <div
        className="progreso-barra-interna"
        style={{ width: `${porcentaje}%`, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }}
      />
      <div className="progreso-marcador">{porcentaje}%</div>
    </div>
  </div>
);

export default BarraProgresoGeneral;
