import React, { useMemo } from 'react';
import marcoSimuladorApp from '../../../../assets/Marco acordeon simulador app.webp';
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

const MAPA_CIFRADO: Record<string, string> = {
    'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb', 'Mi': 'E',
    'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab',
    'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B',
};

function formatearNombreNota(notaObj: any, modo: string): string {
    if (!notaObj) return '';
    const nombre = notaObj.nombre || '';
    const partes = nombre.split(' ');
    let notaBase = partes[0];
    if (modo === 'cifrado') notaBase = MAPA_CIFRADO[notaBase] || notaBase;
    return notaBase;
}

const VisorReplaySimulador: React.FC<VisorReplaySimuladorProps> = ({ logica, direccion }) => {
    const filas = useMemo(() => ({
        afuera: logica?.configTonalidad?.primeraFila || [],
        medio: logica?.configTonalidad?.segundaFila || [],
        adentro: logica?.configTonalidad?.terceraFila || [],
    }), [logica?.configTonalidad]);

    const botonesActivos = logica?.botonesActivos || {};
    const modoVista: string = logica?.modoVista || 'notas';
    const esHalar = direccion === 'halar';

    const renderHilera = (fila: any[]) => {
        // Agrupar por posicion (cada pito tiene una nota halar y una empujar).
        const grupos: Record<string, { halar: any; empujar: any }> = {};
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
            <div className="vrs-hilera">
                {ordenadas.map(([pos, n]) => {
                    const idActivo = `${pos}-${direccion}`;
                    const activo = !!botonesActivos[idActivo];
                    const labelHalar = formatearNombreNota(n.halar, modoVista);
                    const labelEmpujar = formatearNombreNota(n.empujar, modoVista);
                    return (
                        <div
                            key={pos}
                            className={`vrs-pito ${activo ? 'nota-activa' : ''}`}
                            data-pos={pos}
                        >
                            {esHalar && (
                                <span className="vrs-nota-etiqueta vrs-label-halar">{labelHalar}</span>
                            )}
                            {!esHalar && (
                                <span className="vrs-nota-etiqueta vrs-label-empujar">{labelEmpujar}</span>
                            )}
                        </div>
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
                    {renderHilera(filas.adentro)}
                    {renderHilera(filas.medio)}
                    {renderHilera(filas.afuera)}
                </div>
            </div>
        </div>
    );
};

export default VisorReplaySimulador;
