import React, { useMemo } from 'react';
import { TICKS_VIAJE } from '../../AcordeonProMax/TiposProMax';
import PistaNotasVertical from './PistaNotasVertical';
import './PistaNotasGuia.css';

// Modo GUIA — REUSA todo el render de la pista vertical (notas cayendo desde
// arriba con el mismo timing y animaciones) y agrega un banner fijo arriba que
// dice ABRIENDO o CERRANDO segun el fuelle de la nota inminente. El banner
// existe para principiantes que aun no asocian colores azul/rojo con dirccion.

interface Props {
    cancion: any;
    tickActual: number;
    notasImpactadas: Set<string>;
    rangoSeccion?: { inicio: number; fin: number } | null;
}

const PistaNotasGuia: React.FC<Props> = ({ cancion, tickActual, notasImpactadas, rangoSeccion }) => {
    // Calcula el fuelle de la nota mas proxima al impacto (no impactada,
    // dentro del rango visible). El banner lo lee.
    const fuelleInminente = useMemo<'abriendo' | 'cerrando' | null>(() => {
        const seq = cancion?.secuencia;
        if (!Array.isArray(seq)) return null;
        let mejorTick: number | null = null;
        let fuelle: 'abriendo' | 'cerrando' | null = null;
        for (const n of seq) {
            if (String(n.botonId).includes('-bajo')) continue;
            if (rangoSeccion && (n.tick < rangoSeccion.inicio || n.tick > rangoSeccion.fin)) continue;
            const id = `${n.tick}-${n.botonId}`;
            if (notasImpactadas?.has(id)) continue;
            // Ventana: nota viene en camino o esta justo pasando
            const ticksHasta = n.tick - tickActual;
            if (ticksHasta < -10 || ticksHasta > TICKS_VIAJE * 0.6) continue;
            if (mejorTick === null || n.tick < mejorTick) {
                mejorTick = n.tick;
                fuelle = n.fuelle === 'abriendo' ? 'abriendo' : 'cerrando';
            }
        }
        return fuelle;
    }, [cancion, tickActual, notasImpactadas, rangoSeccion]);

    return (
        <>
            <PistaNotasVertical
                cancion={cancion}
                tickActual={tickActual}
                notasImpactadas={notasImpactadas}
                rangoSeccion={rangoSeccion}
            />
            {fuelleInminente && (
                <div className={`guia-banner ${fuelleInminente}`} aria-hidden="true">
                    <span className="guia-banner-flecha">
                        {fuelleInminente === 'abriendo' ? '↑' : '↓'}
                    </span>
                    <span className="guia-banner-texto">
                        {fuelleInminente === 'abriendo' ? 'ABRIENDO' : 'CERRANDO'}
                    </span>
                </div>
            )}
        </>
    );
};

export default React.memo(PistaNotasGuia);
