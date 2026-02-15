import React from 'react';
import './BarraHerramientasVPRO.css';

interface BarraHerramientasVPROProps {
    alAlternarMenu: () => void;
    menuAbierto: boolean;
}

/**
 * Componente de la Barra de Herramientas V-PRO para el simulador de acordeón.
 */
const BarraHerramientasVPRO: React.FC<BarraHerramientasVPROProps> = ({ alAlternarMenu, menuAbierto }) => {
    return (
        <div className="barra-herramientas-vpro-contenedor">
            <div className="barra-herramientas-vpro-cuerpo">

                {/* Espacio para futuras herramientas a la izquierda */}
                <div className="vpro-herramientas-flex-grow"></div>

                {/* Botón de los Tres Puntos (Opciones) */}
                <button
                    className={`btn-vpro-opciones ${menuAbierto ? 'activo' : ''}`}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        alAlternarMenu();
                    }}
                >
                    <div className="puntos-v">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default BarraHerramientasVPRO;
