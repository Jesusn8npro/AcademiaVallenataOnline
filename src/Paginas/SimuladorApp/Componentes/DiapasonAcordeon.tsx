import React from 'react';
import { motion, MotionValue } from 'framer-motion';

const MAPA_CIFRADO: Record<string, string> = {
    'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb', 'Mi': 'E',
    'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab', 'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B'
};

type ModoVista = 'notas' | 'cifrado' | 'numeros' | 'teclas';

const formatearNombreNota = (notaObj: any, modo: ModoVista, mostrarOctavas: boolean): string => {
    if (!notaObj) return '';
    const nombre = notaObj.nombre || '';
    const partes = nombre.split(' ');
    let notaBase = partes[0];
    const octava = partes[1] || '';
    if (modo === 'cifrado') notaBase = MAPA_CIFRADO[notaBase] || notaBase;
    return mostrarOctavas ? `${notaBase}${octava}` : notaBase;
};

const renderHilera = (
    fila: any[] | undefined,
    modoVista: ModoVista,
    mostrarOctavas: boolean,
    vistaDoble: boolean,
    direccion: 'halar' | 'empujar',
) => {
    const p: Record<string, any> = {};
    fila?.forEach((n) => {
        const pos = n.id.split('-').slice(0, 2).join('-');
        if (!p[pos]) p[pos] = { halar: null, empujar: null };
        n.id.includes('halar') ? (p[pos].halar = n) : (p[pos].empujar = n);
    });
    return Object.entries(p)
        .sort((a, b) => parseInt(a[0].split('-')[1]) - parseInt(b[0].split('-')[1]))
        .map(([pos, n]) => {
            const labelHalar = formatearNombreNota(n.halar, modoVista, mostrarOctavas);
            const labelEmpujar = formatearNombreNota(n.empujar, modoVista, mostrarOctavas);
            const esHalar = direccion === 'halar';
            return (
                <div key={pos} className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`} data-pos={pos}>
                    {(vistaDoble || esHalar) && (
                        <span className="nota-etiqueta label-halar">{labelHalar}</span>
                    )}
                    {(vistaDoble || !esHalar) && (
                        <span className="nota-etiqueta label-empujar">{labelEmpujar}</span>
                    )}
                </div>
            );
        });
};

interface DiapasonAcordeonProps {
    trenRef: React.RefObject<HTMLDivElement>;
    x: MotionValue<number>;
    configTonalidad: any;
    direccion: 'halar' | 'empujar';
    modoVista: ModoVista;
    mostrarOctavas: boolean;
    vistaDoble: boolean;
}

/**
 * Tren de pitos del diapason: 3 hileras (adentro/medio/afuera) con motion
 * deslizable. Las etiquetas se computan segun modoVista (notas/cifrado/etc),
 * mostrarOctavas y direccion (halar/empujar). En vistaDoble se muestran
 * ambas etiquetas; si no, solo la de la direccion actual.
 */
const DiapasonAcordeon: React.FC<DiapasonAcordeonProps> = ({
    trenRef,
    x,
    configTonalidad,
    direccion,
    modoVista,
    mostrarOctavas,
    vistaDoble,
}) => {
    return (
        <div className="diapason-marco" style={{ touchAction: 'manipulation' }}>
            <motion.div ref={trenRef} className="tren-botones-deslizable" style={{ x, touchAction: 'manipulation' }}>
                <div className="hilera-pitos hilera-adentro">
                    {renderHilera(configTonalidad?.terceraFila, modoVista, mostrarOctavas, vistaDoble, direccion)}
                </div>
                <div className="hilera-pitos hilera-medio">
                    {renderHilera(configTonalidad?.segundaFila, modoVista, mostrarOctavas, vistaDoble, direccion)}
                </div>
                <div className="hilera-pitos hilera-afuera">
                    {renderHilera(configTonalidad?.primeraFila, modoVista, mostrarOctavas, vistaDoble, direccion)}
                </div>
            </motion.div>
        </div>
    );
};

export default DiapasonAcordeon;
