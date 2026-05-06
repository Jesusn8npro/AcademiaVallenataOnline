import React, { useMemo, useRef } from 'react';
import { TICKS_VIAJE } from '../../AcordeonProMax/TiposProMax';
import './PistaNotasCarril.css';

// Modo CARRIL — el fondo de la pista pinta completamente del color del fuelle
// inminente (azul=abriendo, rojo=cerrando) con la palabra grande detras. El
// alumno asocia "espacio fisico de pantalla = direccion del fuelle". Las
// notas caen normales sobre sus pitos pero se atenuan las lejanas para que
// solo se vea claro la inminente.

interface Props {
    cancion: any;
    tickActual: number;
    notasImpactadas: Set<string>;
    rangoSeccion?: { inicio: number; fin: number } | null;
}

interface NotaCar {
    id: string;
    fuelle: 'abriendo' | 'cerrando';
    progreso: number;
    progresoFinal: number;
    duracion: number;
    impactada: boolean;
    esFallada: boolean;
    esInminente: boolean;
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

const PistaNotasCarril: React.FC<Props> = ({ cancion, tickActual, notasImpactadas, rangoSeccion }) => {
    const pistaRef = useRef<HTMLDivElement>(null);
    const elementoCache = useRef<Map<string, Element>>(new Map());

    const { notas, fuelleInminente } = useMemo<{
        notas: NotaCar[];
        fuelleInminente: 'abriendo' | 'cerrando' | null;
    }>(() => {
        if (!cancion?.secuencia || !Array.isArray(cancion.secuencia)) {
            return { notas: [], fuelleInminente: null };
        }
        const pistaRect = pistaRef.current?.getBoundingClientRect();
        const offsetX = pistaRect?.left ?? 0;
        const offsetY = pistaRect?.top ?? 0;
        const windowStart = tickActual - 60;
        const windowEnd = tickActual + TICKS_VIAJE + 200;
        const result: NotaCar[] = [];
        let mejorProgreso = 0;
        let inminenteFuelle: 'abriendo' | 'cerrando' | null = null;

        for (const n of cancion.secuencia) {
            if (String(n.botonId).includes('-bajo')) continue;
            if (rangoSeccion && (n.tick < rangoSeccion.inicio || n.tick > rangoSeccion.fin)) continue;
            const duracion = Math.max(0, Number(n.duracion) || 0);
            if (n.tick + duracion < windowStart) continue;
            if ((n.tick - TICKS_VIAJE) > windowEnd) continue;

            const tickSalida = n.tick - TICKS_VIAJE;
            const progresoCrudo = (tickActual - tickSalida) / TICKS_VIAJE;
            const progresoMax = 1.1 + duracion / TICKS_VIAJE;
            if (progresoCrudo < -0.05 || progresoCrudo > progresoMax) continue;
            const progreso = Math.max(0, Math.min(progresoCrudo, 1.05));

            const dataPos = botonIdToDataPos(n.botonId);
            if (!dataPos) continue;
            let el = elementoCache.current.get(dataPos);
            if (!el || !(el as any).isConnected) {
                el = document.querySelector(`.pito-boton[data-pos="${dataPos}"]`) || undefined;
                if (!el) continue;
                elementoCache.current.set(dataPos, el);
            }
            const r = (el as Element).getBoundingClientRect();
            const id = `${n.tick}-${n.botonId}`;
            const impactada = notasImpactadas?.has(id) ?? false;
            const esFallada = progresoCrudo > 1.0 && !impactada;
            const fuelle = n.fuelle === 'abriendo' ? 'abriendo' : 'cerrando';

            // Trackear el fuelle de la nota mas proxima al impacto (no impactada)
            if (!impactada && !esFallada && progreso > 0.55 && progreso > mejorProgreso) {
                mejorProgreso = progreso;
                inminenteFuelle = fuelle;
            }

            result.push({
                id,
                fuelle,
                progreso,
                progresoFinal: Math.max(0, progreso - duracion / TICKS_VIAJE),
                duracion,
                impactada,
                esFallada,
                esInminente: false,
                etiqueta: extraerEtiqueta(n),
                targetX: r.left + r.width / 2 - offsetX,
                targetY: r.top + r.height / 2 - offsetY,
            });
        }

        // Marcar inminentes (todas dentro de margen 0.04 del mejorProgreso)
        if (mejorProgreso > 0) {
            for (const n of result) {
                if (!n.impactada && !n.esFallada && n.progreso >= mejorProgreso - 0.04 && n.progreso > 0.55) {
                    n.esInminente = true;
                }
            }
        }
        return { notas: result, fuelleInminente: inminenteFuelle };
    }, [cancion, tickActual, notasImpactadas, rangoSeccion]);

    const ordenadas = [...notas].sort((a, b) => a.progreso - b.progreso);

    return (
        <div ref={pistaRef} className={`pista-notas-carril ${fuelleInminente || ''}`} aria-hidden="true">
            {/* Texto grande de fondo: ABRE / CIERRA */}
            {fuelleInminente && (
                <div className="carril-letrero">
                    {fuelleInminente === 'abriendo' ? 'ABRE' : 'CIERRA'}
                </div>
            )}

            {ordenadas.map((n) => {
                const noteY = n.targetY * n.progreso;
                const rgb = n.esFallada ? '102, 102, 102' : (n.fuelle === 'abriendo' ? '59, 130, 246' : '239, 68, 68');
                const tieneCola = n.duracion > 30 && !n.esFallada;
                const tailTopY = n.progresoFinal * n.targetY;
                const tailHeight = Math.max(0, noteY - tailTopY);
                // Las no-inminentes muy tenues (el foco esta en el letrero del fondo)
                const opacidad = n.impactada ? 0.85 : n.esInminente ? 1 : 0.28;
                const escala = n.esInminente ? 1.18 : 1;
                return (
                    <React.Fragment key={n.id}>
                        {tieneCola && tailHeight > 4 && (
                            <div className={`carril-cola ${n.fuelle}`} style={{
                                left: `${n.targetX}px`,
                                top: `${tailTopY}px`,
                                height: `${tailHeight}px`,
                                background: `linear-gradient(to bottom, rgba(${rgb}, 0.4), rgba(${rgb}, 0.85))`,
                                opacity: opacidad,
                            }} />
                        )}
                        <div
                            className={`carril-nota ${n.fuelle} ${n.esInminente ? 'inminente' : ''} ${n.impactada ? 'impactada' : ''} ${n.esFallada ? 'fallada' : ''}`}
                            style={{
                                left: `${n.targetX}px`,
                                top: `${noteY}px`,
                                background: n.impactada
                                    ? '#fff'
                                    : `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.7) 0%, rgb(${rgb}) 55%, rgba(0,0,0,0.25) 100%)`,
                                opacity: opacidad,
                                transform: `translate(-50%, -50%) scale(${escala})`,
                                boxShadow: n.esInminente
                                    ? `0 0 22px rgba(${rgb}, 1), 0 0 0 3px #fff`
                                    : `0 0 6px rgba(${rgb}, 0.5)`,
                            }}
                        />
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default React.memo(PistaNotasCarril);
