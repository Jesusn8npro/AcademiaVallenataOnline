import React from 'react';
import { HILERAS_NATIVAS, TONALIDADES } from '../../../../Core/acordeon/notasAcordeonDiatonico';

const CIRCULO_MAYOR = ['Do', 'Sol', 'Re', 'La', 'Mi', 'Si', 'Solb', 'Reb', 'Lab', 'Mib', 'Sib', 'Fa'];
const CIRCULO_MENOR = ['La', 'Mi', 'Si', 'Solb', 'Reb', 'Lab', 'Mib', 'Sib', 'Fa', 'Do', 'Sol', 'Re'];

function extraerNotas(fila: Array<{ nombre: string }>) {
  return Array.from(new Set(fila.map((n) => n.nombre)));
}

interface Props {
  tonalidadSeleccionada: string;
  mostrarTeoriaCircular: boolean;
}

const SeccionTeoria: React.FC<Props> = ({ tonalidadSeleccionada, mostrarTeoriaCircular }) => {
  const configuracionTonalidad = TONALIDADES[tonalidadSeleccionada as keyof typeof TONALIDADES] || TONALIDADES['ADG'];
  const hileras = HILERAS_NATIVAS[tonalidadSeleccionada] || [];
  return (
    <div className="estudio-practica-libre-seccion">
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Hileras nativas</div>
        <div className="estudio-practica-libre-grid-chips">
          {hileras.map((h: string) => (
            <span key={h} className="estudio-practica-libre-chip-boton activo solo-visual">{h}</span>
          ))}
        </div>
      </div>
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Notas por hilera</div>
        <div className="estudio-practica-libre-teoria-columnas">
          <div><strong>Primera</strong><span>{extraerNotas(configuracionTonalidad.primeraFila).join(', ')}</span></div>
          <div><strong>Segunda</strong><span>{extraerNotas(configuracionTonalidad.segundaFila).join(', ')}</span></div>
          <div><strong>Tercera</strong><span>{extraerNotas(configuracionTonalidad.terceraFila).join(', ')}</span></div>
        </div>
      </div>
      {mostrarTeoriaCircular && (
        <>
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Circulo mayor</div>
            <div className="estudio-practica-libre-grid-circulo">
              {CIRCULO_MAYOR.map((n) => (
                <span key={n} className={`estudio-practica-libre-chip-circulo ${hileras.includes(n.toUpperCase()) ? 'activo' : ''}`}>{n}</span>
              ))}
            </div>
          </div>
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Circulo menor</div>
            <div className="estudio-practica-libre-grid-circulo">
              {CIRCULO_MENOR.map((n) => <span key={n} className="estudio-practica-libre-chip-circulo">{n}m</span>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SeccionTeoria;
