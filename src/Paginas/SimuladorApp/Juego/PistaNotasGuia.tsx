import React, { useMemo, useRef } from 'react';
import { TICKS_VIAJE } from '../../AcordeonProMax/TiposProMax';
import './PistaNotasGuia.css';

// Modo GUIA — highway estilo Synthesia con etiquetas explicitas
// "ABRIENDO" / "CERRANDO" + flecha grande sobre la nota proxima.
// Pensado para principiantes que aun no internalizan colores azul/rojo.

interface Props {
    cancion: any;
    tickActual: number;
    notasImpactadas: Set<string>;
    rangoSeccion?: { inicio: number; fin: number } | null;
}

interface NotaGuia {
    id: string;
    fuelle: 'abriendo' | 'cerrando';
    progreso: number;
    progresoFinal: number;
    duracion: number;
    impactada: boolean;
    esFallada: boolean;
    etiqueta: string;
    targetX: number;
    targetY: number;
    esActiva: boolean;
}

function botonIdToDataPos(botonId: string): string | null {
    const m1 = botonId.match(/^([A-Z])-?(\d+)/);
    if (m1) return `${m1[1]}-${m1[2]}`;
    const m2 = botonId.match(/^(\d+)-(\d+)/);
    return m2 ? `${m2[1]}-${m2[2]}` : null;
}

const extraerEtiqueta = (n: any): string =>
    String(n?.nombre || n?.notaNombre || '').split(' ')[0].slice(0, 3);

const PistaNotasGuia: React.FC<Props> = ({ cancion, tickActual, notasImpactadas, rangoSeccion }) => {
    const pistaRef = useRef<HTMLDivElement>(null);
    const elementoCache = useRef<Map<string, Element>>(new Map());

    const { notas, notaActiva } = useMemo<{ notas: NotaGuia[]; notaActiva: NotaGuia | null }>(() => {
        if (!cancion?.secuencia || !Array.isArray(cancion.secuencia)) {
            return { notas: [], notaActiva: null };
        }
        const pistaRect = pistaRef.current?.getBoundingClientRect();
        const offsetX = pistaRect?.left ?? 0;
        const offsetY = pistaRect?.top ?? 0;
        const windowStart = tickActual - 60;
        const windowEnd = tickActual + TICKS_VIAJE + 200;
        const result: NotaGuia[] = [];

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
            result.push({
                id,
                fuelle: n.fuelle === 'abriendo' ? 'abriendo' : 'cerrando',
                progreso,
                progresoFinal: Math.max(0, progreso - duracion / TICKS_VIAJE),
                duracion,
                impactada: notasImpactadas?.has(id) ?? false,
                esFallada: progresoCrudo > 1.0 && !(notasImpactadas?.has(id) ?? false),
                etiqueta: extraerEtiqueta(n),
                targetX: r.left + r.width / 2 - offsetX,
                targetY: r.top + r.height / 2 - offsetY,
                esActiva: false,
            });
        }

        // La nota "activa" es la mas cercana al impacto que NO esta impactada
        // ni fallada. Ahi mostramos label + flecha grande.
        let activa: NotaGuia | null = null;
        for (const n of result) {
            if (n.impactada || n.esFallada || n.progreso < 0.55) continue;
            if (!activa || n.progreso > activa.progreso) activa = n;
        }
        if (activa) activa.esActiva = true;
        return { notas: result, notaActiva: activa };
    }, [cancion, tickActual, notasImpactadas, rangoSeccion]);

    const ordenadas = [...notas].sort((a, b) => a.progreso - b.progreso);

    return (
        <div ref={pistaRef} className="pista-notas-guia" aria-hidden="true">
            {ordenadas.map((n) => {
                const noteY = n.targetY * n.progreso;
                const rgb = n.esFallada ? '102, 102, 102' : (n.fuelle === 'abriendo' ? '59, 130, 246' : '239, 68, 68');
                const tieneCola = n.duracion > 30 && !n.esFallada;
                const tailTopY = n.progresoFinal * n.targetY;
                const tailHeight = Math.max(0, noteY - tailTopY);
                // Las notas no-activas se atenuan fuerte para que solo destaque la activa.
                const opacidad = n.esActiva || n.impactada ? 1 : 0.32;
                const escala = n.esActiva ? 1.25 : 1;
                return (
                    <React.Fragment key={n.id}>
                        {tieneCola && tailHeight > 4 && (
                            <div className={`guia-cola ${n.fuelle}`} style={{
                                left: `${n.targetX}px`,
                                top: `${tailTopY}px`,
                                height: `${tailHeight}px`,
                                background: `linear-gradient(to bottom, rgba(${rgb}, 0.35), rgba(${rgb}, 0.85))`,
                                opacity: opacidad,
                            }} />
                        )}
                        <div
                            className={`guia-nota ${n.fuelle} ${n.esActiva ? 'activa' : ''} ${n.impactada ? 'impactada' : ''} ${n.esFallada ? 'fallada' : ''}`}
                            style={{
                                left: `${n.targetX}px`,
                                top: `${noteY}px`,
                                background: n.impactada ? '#fff' : `radial-gradient(circle at 35% 28%, rgba(255,255,255,0.7) 0%, rgb(${rgb}) 55%, rgba(0,0,0,0.25) 100%)`,
                                opacity: opacidad,
                                transform: `translate(-50%, -50%) scale(${escala})`,
                                boxShadow: n.esActiva
                                    ? `0 0 24px rgba(${rgb}, 1), 0 0 0 3px #fff`
                                    : `0 0 8px rgba(${rgb}, 0.5)`,
                            }}
                        >
                            <span className="guia-etiqueta">{n.etiqueta}</span>
                        </div>
                    </React.Fragment>
                );
            })}

            {/* Banner instructivo: posicion fija arriba al centro. Antes lo
                posicionaba relativo a la nota y quedaba fuera del viewport. */}
            {notaActiva && (
                <div className={`guia-banner ${notaActiva.fuelle}`}>
                    <span className="guia-banner-flecha">
                        {notaActiva.fuelle === 'abriendo' ? '↑' : '↓'}
                    </span>
                    <span className="guia-banner-texto">
                        {notaActiva.fuelle === 'abriendo' ? 'ABRIENDO' : 'CERRANDO'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default React.memo(PistaNotasGuia);
