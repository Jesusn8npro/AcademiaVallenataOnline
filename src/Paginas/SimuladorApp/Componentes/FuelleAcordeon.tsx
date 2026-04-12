import React from 'react';
import './FuelleAcordeon.css';

/**
 * 🎵 COMPONENTE FUELLE ACORDEÓN CASSOTO
 * Copia visual EXACTA del fuelle con geometría precisa, codos metálicos realistas y animaciones suaves
 */

interface FuelleAcordeonProps {
    direccion: 'abriendo' | 'cerrando';
    nombreAcordeon?: string;
}

const FuelleAcordeon: React.FC<FuelleAcordeonProps> = ({
    direccion = 'cerrando',
    nombreAcordeon = 'Cassoto'
}) => {
    // Número de pliegues: más cuando abriendo, menos cuando cerrando
    const numPliegues = direccion === 'abriendo' ? 20 : 12;

    return (
        <div className={`fuelle-acordeon fuelle-${direccion}`}>
            {/* 📝 NOMBRE DEL ACORDEÓN */}
            <div className="fuelle-nombre">
                {nombreAcordeon}
            </div>

            {/* 🎼 CONTENEDOR DE PLIEGUES */}
            <div className="contenedor-pliegues">
                {Array.from({ length: numPliegues }).map((_, index) => (
                    <div key={index} className="pliegue-fuelle">
                        {/* 📍 LÍNEA SUPERIOR BRILLANTE */}
                        <div className="pliegue-linea-superior"></div>

                        {/* 📦 CUERPO DEL PLIEGUE - Codos + Centro */}
                        <div className="pliegue-cuerpo">
                            <div className="codo-metalico codo-izquierdo"></div>
                            <div className="pliegue-centro"></div>
                            <div className="codo-metalico codo-derecho"></div>
                        </div>

                        {/* 📍 LÍNEA INFERIOR OSCURA */}
                        <div className="pliegue-linea-inferior"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FuelleAcordeon;
