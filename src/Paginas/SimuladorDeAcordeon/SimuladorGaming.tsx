import React from 'react';
import AcordeonSimulador from './AcordeonSimulador';
// @ts-ignore
import bgAcordeon from './Acordeon PRO MAX.png';

const SimuladorGaming: React.FC = () => {
    return (
        <div style={{ width: '100vw', height: '100vh', backgroundColor: '#111', overflow: 'hidden', position: 'relative' }}>
            <AcordeonSimulador
                direccion="halar"
                imagenFondo={bgAcordeon}
                deshabilitarInteraccion={false}
            />
        </div>
    );
};

export default SimuladorGaming;
