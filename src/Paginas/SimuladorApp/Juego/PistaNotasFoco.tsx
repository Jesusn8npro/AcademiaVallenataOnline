import React, { useMemo, useRef } from 'react';
import { TICKS_VIAJE } from '../../AcordeonProMax/TiposProMax';
import './PistaNotasFoco.css';

// Modo FOCO — minimalista. Solo se muestra UNA tile grande sobre el pito
// que toca AHORA. La siguiente nota aparece pequena y desaturada al fondo.
// Pensado para mobile pequeno y canciones rapidas: cero distraccion.

interface Props {
    cancion: any;
    tickActual: number;
    notasImpactadas: Set<string>;
    rangoSeccion?: { inicio: number; fin: number } | null;
}

interface NotaFoco {
    id: string;
    tick: number;
    fuelle: 'abriendo' | 'cerrando';
    duracion: number;
    progreso: number;
    impactada: boolean;
    etiqueta: string;
    targetX: number;
    targetY: number;
    targetW: number;
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

    // Calcula: nota(s) ACTUAL(es) — la mas proxima sin impactar (incluye sus
    // hermanas de acorde dentro de UMBRAL_ACORDE) + la SIGUIENTE despues.
    const { actuales, siguiente } = useMemo<{ actuales: NotaFoco[]; siguiente: NotaFoco | null }>(() => {
        if (!cancion?.secuencia || !Array.isArray(cancion.secuencia)) return { actuales: [], siguiente: null };

        const pistaRect = pistaRef.current?.getBoundingClientRect();
        const offsetX = pistaRect?.left ?? 0;
        const offsetY = pistaRect?.top ?? 0;

        // 1) tick de la proxima nota no-impactada-no-pasada
        let proxTick: number | null = null;
        for (const n of cancion.secuencia) {
            if (String(n.botonId).includes('-bajo')) continue;
            if (rangoSeccion && (n.tick < rangoSeccion.inicio || n.tick > rangoSeccion.fin)) continue;
            const id = `${n.tick}-${n.botonId}`;
            if (notasImpactadas?.has(id)) continue;
            if (n.tick < tickActual - 60) continue; // ya paso
            if (proxTick === null || n.tick < proxTick) proxTick = n.tick;
        }

        const matearPosicion = (n: any): { x: number; y: number; w: number } | null => {
            const dataPos = botonIdToDataPos(n.botonId);
            if (!dataPos) return null;
            let el = elementoCache.current.get(dataPos);
            if (!el || !(el as any).isConnected) {
                el = document.querySelector(`.pito-boton[data-pos="${dataPos}"]`) || undefined;
                if (!el) return null;
                elementoCache.current.set(dataPos, el);
            }
            const r = (el as Element).getBoundingClientRect();
            return { x: r.left + r.width / 2 - offsetX, y: r.top + r.height / 2 - offsetY, w: r.width };
        };

        const armar = (n: any): NotaFoco | null => {
            const p = matearPosicion(n);
            if (!p) return null;
            const tickSalida = n.tick - TICKS_VIAJE;
            const progreso = Math.max(0, Math.min(1.05, (tickActual - tickSalida) / TICKS_VIAJE));
            return {
                id: `${n.tick}-${n.botonId}`,
                tick: n.tick,
                fuelle: n.fuelle === 'abriendo' ? 'abriendo' : 'cerrando',
                duracion: Math.max(0, Number(n.duracion) || 0),
                progreso,
                impactada: notasImpactadas?.has(`${n.tick}-${n.botonId}`) ?? false,
                etiqueta: extraerEtiqueta(n),
                targetX: p.x, targetY: p.y, targetW: p.w,
            };
        };

        const UMBRAL_ACORDE = 30;
        const actuales: NotaFoco[] = [];
        let siguiente: NotaFoco | null = null;

        if (proxTick !== null) {
            for (const n of cancion.secuencia) {
                if (String(n.botonId).includes('-bajo')) continue;
                if (rangoSeccion && (n.tick < rangoSeccion.inicio || n.tick > rangoSeccion.fin)) continue;
                const id = `${n.tick}-${n.botonId}`;
                if (notasImpactadas?.has(id)) continue;
                if (Math.abs(n.tick - proxTick) <= UMBRAL_ACORDE) {
                    const armada = armar(n);
                    if (armada) actuales.push(armada);
                } else if (n.tick > proxTick + UMBRAL_ACORDE && (!siguiente || n.tick < siguiente.tick)) {
                    const armada = armar(n);
                    if (armada) siguiente = armada;
                }
            }
        }
        return { actuales, siguiente };
    }, [cancion, tickActual, notasImpactadas, rangoSeccion]);

    return (
        <div ref={pistaRef} className="pista-notas-foco" aria-hidden="true">
            {/* Preview tenue de la siguiente nota (despues del impacto actual) */}
            {siguiente && (
                <div
                    className={`foco-preview ${siguiente.fuelle}`}
                    style={{
                        left: `${siguiente.targetX}px`,
                        top: `${siguiente.targetY * siguiente.progreso}px`,
                        width: `${siguiente.targetW * 0.55}px`,
                        height: `${siguiente.targetW * 0.55}px`,
                    }}
                >
                    <span>{siguiente.etiqueta}</span>
                </div>
            )}
            {/* Tile grande sobre los pitos del acorde actual */}
            {actuales.map((n) => (
                <div
                    key={n.id}
                    className={`foco-tile ${n.fuelle}`}
                    style={{
                        left: `${n.targetX}px`,
                        top: `${n.targetY * n.progreso}px`,
                        width: `${n.targetW * 1.15}px`,
                        height: `${n.targetW * 1.15}px`,
                    }}
                >
                    <span className="foco-tile-letra">{n.etiqueta}</span>
                </div>
            ))}
        </div>
    );
};

export default React.memo(PistaNotasFoco);
