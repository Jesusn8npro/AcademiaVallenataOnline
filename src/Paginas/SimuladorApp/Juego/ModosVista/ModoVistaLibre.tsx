import React, { useMemo, useRef } from 'react';
import { TICKS_VIAJE } from '../../../AcordeonProMax/TiposProMax';
import './ModoVistaLibre.css';

interface ModoVistaLibreProps {
    cancion: any;
    tickActual: number;
    notasImpactadas: Set<string>;
    rangoSeccion?: { inicio: number; fin: number } | null;
    /** Modo de practica del motor. En 'maestro_solo' el alumno solo observa
     *  (la maestra toca sola): no aplicamos opacidad reducida a no-inminentes
     *  porque no hay urgencia y la atencion debe estar en TODA la secuencia. */
    modoPractica?: string;
}

interface NotaEnVuelo {
    id: string;
    botonId: string;
    fuelle: 'abriendo' | 'cerrando';
    progreso: number;       // [0, 1.05] clamp para posicionar la cabeza.
    progresoCrudo: number;  // sin clamp para fade-out post-impacto y consumo de cola.
    progresoFinal: number;  // posicion del END (avanza durante sustain).
    duracion: number;
    impactada: boolean;
    esFallada: boolean;
    etiqueta: string;
    targetX: number;
    targetY: number;
}

function botonIdToDataPos(botonId: string): string | null {
    const m1 = botonId.match(/^([A-Z])-?(\d+)/);
    if (m1) return `${m1[1]}-${m1[2]}`;
    const m2 = botonId.match(/^(\d+)-(\d+)/);
    if (m2) return `${m2[1]}-${m2[2]}`;
    return null;
}

function extraerEtiqueta(nota: any): string {
    const nombre = nota?.nombre || nota?.notaNombre || '';
    return String(nombre).split(' ')[0].slice(0, 3);
}

const ModoVistaLibre: React.FC<ModoVistaLibreProps> = ({
    cancion, tickActual, notasImpactadas, rangoSeccion, modoPractica
}) => {
    const esModoMaestro = modoPractica === 'maestro_solo';
    const pistaRef = useRef<HTMLDivElement>(null);
    const elementoCache = useRef<Map<string, Element>>(new Map());

    // Fuelle de la nota inminente (no impactada, mas cercana al impacto). El
   // root rota un tinte de fondo + el letrero "ABRE/CIERRA" segun este valor.
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
            const ticksHasta = n.tick - tickActual;
            if (ticksHasta < -10 || ticksHasta > TICKS_VIAJE * 0.6) continue;
            if (mejorTick === null || n.tick < mejorTick) {
                mejorTick = n.tick;
                fuelle = n.fuelle === 'abriendo' ? 'abriendo' : 'cerrando';
            }
        }
        return fuelle;
    }, [cancion, tickActual, notasImpactadas, rangoSeccion]);

    const notasEnVuelo = useMemo<NotaEnVuelo[]>(() => {
        if (!cancion?.secuencia || !Array.isArray(cancion.secuencia)) return [];

        const pistaRect = pistaRef.current?.getBoundingClientRect();
        const offsetX = pistaRect?.left ?? 0;
        const offsetY = pistaRect?.top ?? 0;

        const result: NotaEnVuelo[] = [];
        const windowStart = tickActual - 60;
        const windowEnd = tickActual + TICKS_VIAJE + 200;

        for (const nota of cancion.secuencia) {
            if (String(nota.botonId).includes('-bajo')) continue;
            if (rangoSeccion && (nota.tick < rangoSeccion.inicio || nota.tick > rangoSeccion.fin)) continue;
            const duracion = Math.max(0, Number(nota.duracion) || 0);
            // Filtro inicial considera la cola: notas sostenidas siguen activas
            // hasta tick + duracion. Sin esto desaparecen al pisarlas.
            if (nota.tick + duracion < windowStart) continue;
            if ((nota.tick - TICKS_VIAJE) > windowEnd) continue;

            const tickSalida = nota.tick - TICKS_VIAJE;
            const progresoCrudo = (tickActual - tickSalida) / TICKS_VIAJE;
            const progresoMax = 1.1 + duracion / TICKS_VIAJE;
            if (progresoCrudo < -0.05 || progresoCrudo > progresoMax) continue;
            const progreso = Math.max(0, Math.min(progresoCrudo, 1.05));

            const dataPos = botonIdToDataPos(nota.botonId);
            if (!dataPos) continue;

            let el = elementoCache.current.get(dataPos);
            if (!el || !(el as any).isConnected) {
                el = document.querySelector(`.pito-boton[data-pos="${dataPos}"]`) || undefined;
                if (!el) continue;
                elementoCache.current.set(dataPos, el);
            }
            const r = (el as Element).getBoundingClientRect();
            const targetX = r.left + r.width / 2 - offsetX;
            const targetY = r.top + r.height / 2 - offsetY;

            const id = `${nota.tick}-${nota.botonId}`;
            const impactada = notasImpactadas?.has(id) ?? false;
            const esFallada = progresoCrudo > 1.0 && !impactada;
            const progresoFinal = Math.max(0, progresoCrudo - duracion / TICKS_VIAJE);

            result.push({
                id,
                botonId: nota.botonId,
                fuelle: nota.fuelle === 'abriendo' ? 'abriendo' : 'cerrando',
                progreso,
                progresoCrudo,
                progresoFinal,
                duracion,
                impactada,
                esFallada,
                etiqueta: extraerEtiqueta(nota),
                targetX,
                targetY,
            });
        }
        return result;
    }, [cancion, tickActual, notasImpactadas, rangoSeccion]);

    // ASC por progreso: las inminentes salen al final del map → quedan encima
    // en el z-stack. Sin esto las notas mas viejas tapan a las nuevas.
    const notasOrdenadas = [...notasEnVuelo].sort((a, b) => a.progreso - b.progreso);

    // Todas las notas dentro del margen 0.04 del progreso maximo se marcan
    // como inminentes para que un acorde de 2-3 botones pulse en sincronia.
    const idsInminente = new Set<string>();
    let mejorProgreso = 0;
    for (const n of notasOrdenadas) {
        if (n.impactada || n.esFallada || n.progreso <= 0.78) continue;
        if (n.progreso > mejorProgreso) mejorProgreso = n.progreso;
    }
    if (mejorProgreso > 0) {
        for (const n of notasOrdenadas) {
            if (n.impactada || n.esFallada || n.progreso <= 0.78) continue;
            if (n.progreso >= mejorProgreso - 0.04) idsInminente.add(n.id);
        }
    }

    return (
        <div
            ref={pistaRef}
            className={`pista-notas-vertical ${fuelleInminente || ''}`}
            aria-hidden="true"
        >
            {fuelleInminente && (
                <div className="libre-letrero">
                    {fuelleInminente === 'abriendo' ? '↑ ABRE' : '↓ CIERRA'}
                </div>
            )}
            {notasOrdenadas.map((n) => {
                const noteY = n.targetY * n.progreso;
                const rgb = n.esFallada
                    ? '102, 102, 102'
                    : (n.fuelle === 'abriendo' ? '59, 130, 246' : '239, 68, 68');
                // En Maestro NO marcamos inminentes — la urgencia visual no aplica cuando
                // el alumno solo observa. Sin esto las notas ganan outline pulsante que
                // distrae mas de lo que ayuda en este modo.
                const esInminente = !esModoMaestro && idsInminente.has(n.id);
                // En Maestro la maestra "toca" las notas → motor las marca impactadas →
                // dispararia animacion nota-burst (white + scale + opacity 0). El alumno
                // ve una "sombra" porque la nota esta en su animacion de salida. En este
                // modo el alumno solo observa: las queremos cruzando el pito limpias,
                // sin animacion de impacto. Render como NO-impactada para todo proposito visual.
                const renderImpactada = !esModoMaestro && n.impactada;
                const colaConsumida = n.duracion > 30 && n.progresoFinal >= n.progreso - 0.005;
                const opacidad = renderImpactada
                    ? (colaConsumida ? Math.max(0, 1 - (n.progresoCrudo - 1.0) / 0.15) : 1)
                    : n.progresoCrudo > 1.05
                        ? Math.max(0, 1 - (n.progresoCrudo - 1.05) / 0.08)
                        : esModoMaestro
                            ? 1
                            : esInminente
                                ? 1
                                : 0.4;
                const escala = renderImpactada
                    ? 1
                    : n.progreso > 0.88
                        ? 1 + (n.progreso - 0.88) * 1.0
                        : 1;
                const tieneSostenido = n.duracion > 30 && !n.esFallada;
                const fondo = renderImpactada
                    ? (tieneSostenido
                        ? `radial-gradient(circle at 50% 45%, #fff 0%, rgba(255,255,255,0.85) 28%, rgb(${rgb}) 70%, rgba(${rgb},0.85) 100%)`
                        : '#fff')
                    : `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.7) 0%, rgb(${rgb}) 55%, rgba(0,0,0,0.25) 100%)`;
                const glow = renderImpactada
                    ? `0 0 18px rgba(${rgb}, 0.95), 0 0 36px rgba(${rgb}, 0.6)`
                    : `0 0 8px rgba(${rgb},0.55), 0 3px 6px rgba(0,0,0,0.35)`;

                const tieneCola = n.duracion > 30 && !n.esFallada;
                const tailTopY = n.progresoFinal * n.targetY;
                const tailHeight = Math.max(0, noteY - tailTopY);

                return (
                    <React.Fragment key={n.id}>
                        {tieneCola && tailHeight > 4 && (
                            <div
                                className={`nota-cola ${n.fuelle} ${renderImpactada ? 'impactada' : ''}`}
                                style={{
                                    left: `${n.targetX}px`,
                                    top: `${tailTopY}px`,
                                    height: `${tailHeight}px`,
                                    background: `linear-gradient(to bottom, rgba(${rgb}, 0) 0%, rgba(${rgb}, 0.4) 28%, rgba(${rgb}, 0.95) 100%)`,
                                    opacity: opacidad,
                                }}
                            />
                        )}
                        <div
                            className={`nota-cayendo ${n.fuelle} ${renderImpactada ? 'impactada' : ''} ${n.esFallada ? 'fallada' : ''} ${esInminente ? 'inminente' : ''}`}
                            style={{
                                left: `${n.targetX}px`,
                                top: `${noteY}px`,
                                background: fondo,
                                opacity: opacidad,
                                transform: `translate(-50%, -50%) scale(${escala})`,
                                boxShadow: esInminente
                                    ? `${glow}, 0 0 0 3px rgba(255,255,255,0.9)`
                                    : glow,
                                borderColor: esInminente ? '#fff' : 'rgba(255,255,255,0.55)',
                            }}
                        >
                            <span className="nota-etiqueta-cayendo">{n.etiqueta}</span>
                            {renderImpactada && [0, 60, 120, 180, 240, 300].map((deg) => (
                                <span
                                    key={deg}
                                    className="nota-particula"
                                    style={{
                                        ['--angulo' as any]: `${deg}deg`,
                                        background: `rgb(${rgb})`,
                                    }}
                                />
                            ))}
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default React.memo(ModoVistaLibre);
