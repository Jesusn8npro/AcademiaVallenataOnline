import React, { useMemo } from 'react';
import './PistaNotasFoco.css';

// Modo FOCO — minimalismo extremo. Una sola tarjeta grande arriba al centro
// que muestra el nombre de la(s) nota(s) que toca pisar AHORA + un indicador
// claro de la direccion del fuelle. Cero distraccion: las demas notas no se
// renderizan. Pensado para alumnos completamente nuevos o canciones rapidas
// donde el "highway" satura.

interface Props {
    cancion: any;
    tickActual: number;
    notasImpactadas: Set<string>;
    rangoSeccion?: { inicio: number; fin: number } | null;
}

const UMBRAL_ACORDE = 30;

const extraerEtiqueta = (n: any): string =>
    String(n?.nombre || n?.notaNombre || '').split(' ')[0].slice(0, 4);

const PistaNotasFoco: React.FC<Props> = ({ cancion, tickActual, notasImpactadas, rangoSeccion }) => {
    const grupoActual = useMemo(() => {
        const seq = cancion?.secuencia;
        if (!Array.isArray(seq)) return null;

        // Encontrar el tick de la proxima nota no-impactada
        let proxTick: number | null = null;
        for (const n of seq) {
            if (String(n.botonId).includes('-bajo')) continue;
            if (rangoSeccion && (n.tick < rangoSeccion.inicio || n.tick > rangoSeccion.fin)) continue;
            const id = `${n.tick}-${n.botonId}`;
            if (notasImpactadas?.has(id)) continue;
            if (n.tick < tickActual - 30) continue;
            if (proxTick === null || n.tick < proxTick) proxTick = n.tick;
        }
        if (proxTick === null) return null;

        // Agrupar todas las notas dentro de UMBRAL_ACORDE
        const etiquetas: string[] = [];
        let fuelle: 'abriendo' | 'cerrando' = 'abriendo';
        for (const n of seq) {
            if (String(n.botonId).includes('-bajo')) continue;
            if (rangoSeccion && (n.tick < rangoSeccion.inicio || n.tick > rangoSeccion.fin)) continue;
            const id = `${n.tick}-${n.botonId}`;
            if (notasImpactadas?.has(id)) continue;
            if (Math.abs(n.tick - proxTick) > UMBRAL_ACORDE) continue;
            etiquetas.push(extraerEtiqueta(n));
            fuelle = n.fuelle === 'abriendo' ? 'abriendo' : 'cerrando';
        }
        if (etiquetas.length === 0) return null;

        // Distancia hasta impacto: 0 cuando es el momento, 1 cuando aun esta lejos
        const distancia = Math.max(0, Math.min(1, (proxTick - tickActual) / 240));

        return { etiquetas: Array.from(new Set(etiquetas)), fuelle, distancia };
    }, [cancion, tickActual, notasImpactadas, rangoSeccion]);

    if (!grupoActual) return <div className="pista-notas-foco" aria-hidden="true" />;

    const { etiquetas, fuelle, distancia } = grupoActual;
    const proximidad = 1 - distancia; // 0 lejos, 1 inminente
    const escala = 1 + proximidad * 0.15; // crece al acercarse el momento

    return (
        <div className="pista-notas-foco" aria-hidden="true">
            <div
                className={`foco-tarjeta ${fuelle}`}
                style={{ transform: `translate(-50%, 0) scale(${escala})` }}
            >
                <div className="foco-direccion">
                    <span className="foco-direccion-flecha">{fuelle === 'abriendo' ? '↑' : '↓'}</span>
                    <span className="foco-direccion-texto">
                        {fuelle === 'abriendo' ? 'ABRIENDO' : 'CERRANDO'}
                    </span>
                </div>
                <div className="foco-notas">
                    {etiquetas.map((et, i) => (
                        <span key={`${et}-${i}`} className="foco-nota">{et}</span>
                    ))}
                </div>
                <div className="foco-flecha-grande" aria-hidden="true">▼</div>
            </div>
        </div>
    );
};

export default React.memo(PistaNotasFoco);
