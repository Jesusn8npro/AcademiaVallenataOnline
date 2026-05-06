import React, { useMemo, useRef } from 'react';
import { TICKS_VIAJE } from '../../AcordeonProMax/TiposProMax';
import './PistaNotasFoco.css';

// Modo FOCO — tile en la pista superior con flecha grande apuntando al pito
// que toca pisar. La tile NO tapa el pito ni su nombre. Acordes muestran
// varias tiles lado a lado, todas alineadas al X de su pito objetivo.

interface Props {
    cancion: any;
    tickActual: number;
    notasImpactadas: Set<string>;
    rangoSeccion?: { inicio: number; fin: number } | null;
}

interface NotaActual {
    id: string;
    fuelle: 'abriendo' | 'cerrando';
    duracion: number;
    progreso: number;
    impactada: boolean;
    etiqueta: string;
    targetX: number;
    targetY: number;
}

function botonIdToDataPos(botonId: string): string | null {
    const m1 = botonId.match(/^([A-Z])-?(\d+)/);
    if (m1) return `${m1[1]}-${m1[2]}`;
    const m2 = botonId.match(/^(\d+)-(\d+)/);
    return m2 ? `${m2[1]}-${m2[2]}` : null;
}

const extraerEtiqueta = (n: any): string =>
    String(n?.nombre || n?.notaNombre || '').split(' ')[0].slice(0, 3);

const PistaNotasFoco: React.FC<Props> = ({ cancion, tickActual, notasImpactadas, rangoSeccion }) => {
    const pistaRef = useRef<HTMLDivElement>(null);
    const elementoCache = useRef<Map<string, Element>>(new Map());

    const { actuales, fuelleGrupo } = useMemo<{
        actuales: NotaActual[];
        fuelleGrupo: 'abriendo' | 'cerrando' | null;
    }>(() => {
        if (!cancion?.secuencia || !Array.isArray(cancion.secuencia)) {
            return { actuales: [], fuelleGrupo: null };
        }
        const pistaRect = pistaRef.current?.getBoundingClientRect();
        const offsetX = pistaRect?.left ?? 0;
        const offsetY = pistaRect?.top ?? 0;

        // Tick de la nota mas proxima no impactada y no muy pasada
        let proxTick: number | null = null;
        for (const n of cancion.secuencia) {
            if (String(n.botonId).includes('-bajo')) continue;
            if (rangoSeccion && (n.tick < rangoSeccion.inicio || n.tick > rangoSeccion.fin)) continue;
            const id = `${n.tick}-${n.botonId}`;
            if (notasImpactadas?.has(id)) continue;
            if (n.tick < tickActual - 60) continue;
            if (proxTick === null || n.tick < proxTick) proxTick = n.tick;
        }

        if (proxTick === null) return { actuales: [], fuelleGrupo: null };

        const matearPosicion = (n: any): { x: number; y: number } | null => {
            const dataPos = botonIdToDataPos(n.botonId);
            if (!dataPos) return null;
            let el = elementoCache.current.get(dataPos);
            if (!el || !(el as any).isConnected) {
                el = document.querySelector(`.pito-boton[data-pos="${dataPos}"]`) || undefined;
                if (!el) return null;
                elementoCache.current.set(dataPos, el);
            }
            const r = (el as Element).getBoundingClientRect();
            return { x: r.left + r.width / 2 - offsetX, y: r.top + r.height / 2 - offsetY };
        };

        const UMBRAL_ACORDE = 30;
        const result: NotaActual[] = [];
        let fuelle: 'abriendo' | 'cerrando' | null = null;

        for (const n of cancion.secuencia) {
            if (String(n.botonId).includes('-bajo')) continue;
            if (rangoSeccion && (n.tick < rangoSeccion.inicio || n.tick > rangoSeccion.fin)) continue;
            const id = `${n.tick}-${n.botonId}`;
            if (notasImpactadas?.has(id)) continue;
            if (Math.abs(n.tick - proxTick) > UMBRAL_ACORDE) continue;
            const p = matearPosicion(n);
            if (!p) continue;
            const tickSalida = n.tick - TICKS_VIAJE;
            const progreso = Math.max(0, Math.min(1.05, (tickActual - tickSalida) / TICKS_VIAJE));
            const f = n.fuelle === 'abriendo' ? 'abriendo' : 'cerrando';
            if (!fuelle) fuelle = f;
            result.push({
                id, fuelle: f,
                duracion: Math.max(0, Number(n.duracion) || 0),
                progreso,
                impactada: false,
                etiqueta: extraerEtiqueta(n),
                targetX: p.x, targetY: p.y,
            });
        }

        // Ordenar por X para que las tiles del acorde queden alineadas
        result.sort((a, b) => a.targetX - b.targetX);
        return { actuales: result, fuelleGrupo: fuelle };
    }, [cancion, tickActual, notasImpactadas, rangoSeccion]);

    return (
        <div ref={pistaRef} className="pista-notas-foco" aria-hidden="true">
            {/* Banner de direccion arriba */}
            {fuelleGrupo && (
                <div className={`foco-direccion ${fuelleGrupo}`}>
                    {fuelleGrupo === 'abriendo' ? '↑ ABRIENDO' : '↓ CERRANDO'}
                </div>
            )}

            {/* Una tile por nota actual, posicionada arriba en la X del pito */}
            {actuales.map((n) => {
                // La tile esta en la mitad superior; la flecha conecta con el pito.
                // tileTop fijo (no escala con progreso): el alumno siempre mira el
                // mismo punto. La proximidad la indica el "ringando" del pito objetivo.
                const tileTop = 18;
                return (
                    <React.Fragment key={n.id}>
                        {/* Linea/conector visual de tile hacia el pito (debajo de la tile) */}
                        <div
                            className={`foco-conector ${n.fuelle}`}
                            style={{
                                left: `${n.targetX}px`,
                                top: `${tileTop + 78}px`,
                                height: `${Math.max(0, n.targetY - tileTop - 78)}px`,
                            }}
                        />
                        {/* Tile con nombre del pito + flecha grande hacia abajo */}
                        <div
                            className={`foco-tile ${n.fuelle}`}
                            style={{ left: `${n.targetX}px`, top: `${tileTop}px` }}
                        >
                            <span className="foco-tile-nombre">{n.etiqueta}</span>
                            <span className="foco-tile-flecha">▼</span>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default React.memo(PistaNotasFoco);
