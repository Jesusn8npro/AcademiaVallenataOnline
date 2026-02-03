import React, { useState, useEffect } from 'react';
import './BarraProgresoGeneral.css';

interface BarraProgresoGeneralProps {
  tipo: 'curso' | 'tutorial';
  contenidoId: string;
  completadas?: number;
  total?: number;
  porcentaje?: number;
}

const BarraProgresoGeneral: React.FC<BarraProgresoGeneralProps> = ({ tipo, contenidoId, completadas: propCompletadas, total: propTotal, porcentaje: propPorcentaje }) => {
  // Variables de estado local
  const [completadas, setCompletadas] = useState(0);
  const [total, setTotal] = useState(0);
  const [progreso, setProgreso] = useState(0);

  // Cargar datos de progreso: usar props si vienen, sino simular
  useEffect(() => {
    if (typeof propCompletadas === 'number' && typeof propTotal === 'number' && typeof propPorcentaje === 'number') {
      setCompletadas(propCompletadas);
      setTotal(propTotal);
      setProgreso(propPorcentaje);
      return;
    }
    const timer = setTimeout(() => {
      setCompletadas(0);
      setTotal(0);
      setProgreso(0);
    }, 0);
    return () => clearTimeout(timer);
  }, [contenidoId, propCompletadas, propTotal, propPorcentaje]);

  return (
    <div className="barra-progreso-general">
      <div className="progreso-label">
        Progreso: {completadas} / {total} {tipo === 'curso' ? 'lecciones' : 'clases'} ({progreso}%)
      </div>
      <div className="progreso-barra">
        <div 
          className="progreso-barra-interna" 
          style={{ 
            width: `${progreso}%`, 
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' 
          }}
        ></div>
        <div className="progreso-marcador">{progreso}%</div>
      </div>
    </div>
  );
};

export default BarraProgresoGeneral;
