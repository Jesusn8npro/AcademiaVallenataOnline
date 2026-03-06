import React from 'react';
import AcordeonSimulador from './AcordeonSimulador';
const SimuladorGaming: React.FC = () => {
    return (
        <div style={{ width: '100vw', height: '100vh', backgroundColor: '#111', overflow: 'hidden', position: 'relative' }}>
            <AcordeonSimulador
                direccion="halar"
                imagenFondo="/AcordeonJugador.png"
                deshabilitarInteraccion={false}
            />
        </div>
    );
};

export default SimuladorGaming;
