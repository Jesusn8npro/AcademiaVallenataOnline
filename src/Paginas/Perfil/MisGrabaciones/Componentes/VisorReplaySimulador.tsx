import React, { useMemo } from 'react';
import marcoSimuladorApp from '../../../../assets/Marco acordeon simulador app.png';
import './VisorReplaySimulador.css';

/**
 * Vista alternativa del replay con la forma del SimuladorApp móvil.
 *
 * Usa el marco visual del simulador (PNG con el cuerpo azul "Pro MAX") como
 * fondo y dibuja encima 3 hileras de pitos en las mismas posiciones del
 * SimuladorApp real. Los pitos se iluminan automaticamente porque leen
 * `logica.botonesActivos` (mismo state que el reproductor del modal).
 *
 * Layout autosuficiente — clases prefijadas con `vrs-` para no chocar con
 * los estilos del SimuladorApp real.
 */
interface VisorReplaySimuladorProps {
    logica: any;
    direccion: 'halar' | 'empujar';
}

const VisorReplaySimulador: React.FC<VisorReplaySimuladorProps> = ({ logica, direccion }) => {
    const filas = useMemo(() => ({
        afuera: logica?.configTonalidad?.primeraFila || [],
        medio: logica?.configTonalidad?.segundaFila || [],
        adentro: logica?.configTonalidad?.terceraFila || [],
    }), [logica?.configTonalidad]);

    const botonesActivos = logica?.botonesActivos || {};

    const renderHilera = (fila: any[], hileraClass: string) => {
        // Agrupar por posicion (cada pito tiene una nota halar y una empujar).
        const grupos: Record<string, any> = {};
        fila?.forEach((n: any) => {
            const pos = n.id.split('-').slice(0, 2).join('-');
            if (!grupos[pos]) grupos[pos] = { halar: null, empujar: null };
            if (n.id.includes('halar')) grupos[pos].halar = n;
            else grupos[pos].empujar = n;
        });

        const ordenadas = Object.entries(grupos).sort(
            (a, b) => parseInt(a[0].split('-')[1]) - parseInt(b[0].split('-')[1])
        );

        return (
            <div className={`vrs-hilera ${hileraClass}`}>
                {ordenadas.map(([pos]) => {
                    const idActivo = `${pos}-${direccion}`;
                    const activo = !!botonesActivos[idActivo];
                    return (
                        <div
                            key={pos}
                            className={`vrs-pito ${activo ? 'nota-activa' : ''}`}
                            data-pos={pos}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className={`vrs-root modo-${direccion}`}>
            <div
                className="vrs-marco"
                style={{ backgroundImage: `url(${marcoSimuladorApp})` }}
            >
                <div className="vrs-tren">
                    {renderHilera(filas.adentro, 'vrs-hilera-adentro')}
                    {renderHilera(filas.medio, 'vrs-hilera-medio')}
                    {renderHilera(filas.afuera, 'vrs-hilera-afuera')}
                </div>
            </div>
        </div>
    );
};

export default VisorReplaySimulador;
