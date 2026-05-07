import React, { useMemo } from 'react';
import type { GuiaPitoResultado } from '../Hooks/useGuiaPitoObjetivo';

const MAPA_CIFRADO: Record<string, string> = {
    'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb',
    'Mi': 'E', 'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#',
    'Lab': 'Ab', 'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B'
};

const formatearNombreNota = (notaObj: any, modo: string): string => {
    if (!notaObj) return '';
    const notaBase = String(notaObj.nombre || '').split(' ')[0];
    if (modo === 'cifrado') return MAPA_CIFRADO[notaBase] || notaBase;
    return notaBase;
};

interface PitoProps {
    pos: string;
    label: string;
    claseLabel: string;
    claseObjetivo: string;
}

// Pito memoizado: cada pito recibe solo props primitivas. Cuando cambia
// tickActual el padre se re-renderiza pero los pitos individuales NO, a menos
// que su clase objetivo o label realmente hayan cambiado. Esto rompe la
// cascada de 90+ pitos re-renderizandose 60 veces por segundo en competicion.
const Pito = React.memo<PitoProps>(({ pos, label, claseLabel, claseObjetivo }) => (
    <div className={`pito-boton ${claseObjetivo}`} data-pos={pos}>
        <span className={`nota-etiqueta ${claseLabel}`}>{label}</span>
    </div>
));

interface HilerasPitosProps {
    configTonalidad: any;
    direccion: 'halar' | 'empujar';
    modoVista: string;
    objetivosMap: GuiaPitoResultado;
    posicionesObjetivoMaestro: Set<string>;
    direccionMaestro: 'halar' | 'empujar';
}

const armarHilera = (
    fila: any[] | undefined,
    direccion: 'halar' | 'empujar',
    modoVista: string,
    objetivosMap: GuiaPitoResultado,
    posicionesObjetivoMaestro: Set<string>,
    direccionMaestro: 'halar' | 'empujar',
): PitoProps[] => {
    if (!fila) return [];
    const p: Record<string, { halar: any; empujar: any }> = {};
    fila.forEach((n: any) => {
        const pos = n.id.split('-').slice(0, 2).join('-');
        if (!p[pos]) p[pos] = { halar: null, empujar: null };
        n.id.includes('halar') ? p[pos].halar = n : p[pos].empujar = n;
    });
    const esHalar = direccion === 'halar';
    return Object.entries(p)
        .sort((a, b) => parseInt(a[0].split('-')[1]) - parseInt(b[0].split('-')[1]))
        .map(([pos, n]) => {
            const fuelleGuia = objetivosMap.guia.get(pos);
            const esSosteniendo = objetivosMap.sosteniendo.has(pos);
            // Prioridad: guia (notas inminentes/sostenidos) > maestro.
            const claseObjetivo = fuelleGuia
                ? `objetivo-${fuelleGuia}${esSosteniendo ? ' objetivo-sosteniendo' : ''}`
                : posicionesObjetivoMaestro.has(pos)
                    ? (direccionMaestro === 'halar' ? 'objetivo-halar' : 'objetivo-empujar')
                    : '';
            return {
                pos,
                label: formatearNombreNota(esHalar ? n.halar : n.empujar, modoVista),
                claseLabel: esHalar ? 'label-halar' : 'label-empujar',
                claseObjetivo,
            };
        });
};

const HilerasPitos: React.FC<HilerasPitosProps> = ({
    configTonalidad, direccion, modoVista, objetivosMap, posicionesObjetivoMaestro, direccionMaestro,
}) => {
    const hileras = useMemo(() => ({
        adentro: armarHilera(configTonalidad?.terceraFila, direccion, modoVista, objetivosMap, posicionesObjetivoMaestro, direccionMaestro),
        medio: armarHilera(configTonalidad?.segundaFila, direccion, modoVista, objetivosMap, posicionesObjetivoMaestro, direccionMaestro),
        afuera: armarHilera(configTonalidad?.primeraFila, direccion, modoVista, objetivosMap, posicionesObjetivoMaestro, direccionMaestro),
    }), [configTonalidad, direccion, modoVista, objetivosMap, posicionesObjetivoMaestro, direccionMaestro]);

    return (
        <>
            <div className="hilera-pitos hilera-adentro">
                {hileras.adentro.map(p => <Pito key={p.pos} {...p} />)}
            </div>
            <div className="hilera-pitos hilera-medio">
                {hileras.medio.map(p => <Pito key={p.pos} {...p} />)}
            </div>
            <div className="hilera-pitos hilera-afuera">
                {hileras.afuera.map(p => <Pito key={p.pos} {...p} />)}
            </div>
        </>
    );
};

export default React.memo(HilerasPitos);
