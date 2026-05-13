import React, { useMemo, useRef } from 'react';
import { TICKS_VIAJE } from '../../../AcordeonProMax/TiposProMax';
import './PistaNotasHighway.css';

/**
 * MODO HIGHWAY — pista grande tipo Guitar Hero / Synthesia.
 *
 * Diferencia clave con `cayendo` (Libre clasico): las notas NO se posicionan
 * EN las coordenadas X,Y del pito objetivo (que producia solape en acordes y
 * rafagas). En su lugar usan CARRILES VERTICALES FIJOS — cada nota cae por
 * el carril correspondiente a la X de su pito, y el carril es siempre la
 * misma columna independiente de cuantas notas haya en simultaneo. Acordes
 * = una nota por carril, lado a lado. Cero solape.
 *
 * La pista ocupa el espacio entre el header (~48px) y los pitos (~38vh
 * desde abajo), dejando 40-45vh para mostrar notas con espacio real. En la
 * base de cada carril hay un indicador con la nota objetivo (Si, Re, Fa..)
 * — el alumno asocia visualmente "este carril → ese pito de abajo".
 *
 * No tiene stop-and-wait (a diferencia de boxed/synthesia). La cancion
 * avanza continuo, tickActual avanza, las notas cruzan la pista en
 * trayectoria recta hacia su pito objetivo abajo.
 */

interface PistaNotasHighwayProps {
    cancion: any;
    tickActual: number;
    notasImpactadas: Set<string>;
    rangoSeccion?: { inicio: number; fin: number } | null;
    /** Toggle "Ver Notas": muestra el nombre del pito en cada nota cayendo
     *  ademas de en la base del carril. */
    verNotas?: boolean;
}

interface NotaHighway {
    id: string;
    botonId: string;
    fuelle: 'abriendo' | 'cerrando';
    progreso: number;
    progresoFinal: number;   // posicion del END (cola larga)
    duracion: number;
    impactada: boolean;
    etiqueta: string;
    targetX: number;         // X del pito (en coords de la pista)
    laneEtiqueta: string;    // etiqueta del pito para la base del carril
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

const PistaNotasHighway: React.FC<PistaNotasHighwayProps> = ({
    cancion, tickActual, notasImpactadas, rangoSeccion, verNotas
}) => {
    const pistaRef = useRef<HTMLDivElement>(null);
    const elementoCache = useRef<Map<string, Element>>(new Map());

    // Carriles unicos derivados de la cancion: cada pito que aparece al menos
    // una vez en la secuencia obtiene su carril. Asi la base del highway
    // muestra solo los carriles que realmente se usan, no los 33 pitos.
    const carrilesUnicos = useMemo<Array<{ dataPos: string; targetX: number; etiqueta: string }>>(() => {
        if (!cancion?.secuencia || !Array.isArray(cancion.secuencia)) return [];
        const pistaRect = pistaRef.current?.getBoundingClientRect();
        const offsetX = pistaRect?.left ?? 0;
        const map = new Map<string, { dataPos: string; targetX: number; etiqueta: string }>();
        for (const nota of cancion.secuencia) {
            if (String(nota.botonId).includes('-bajo')) continue;
            const dataPos = botonIdToDataPos(nota.botonId);
            if (!dataPos || map.has(dataPos)) continue;
            let el = elementoCache.current.get(dataPos);
            if (!el || !(el as any).isConnected) {
                el = document.querySelector(`.pito-boton[data-pos="${dataPos}"]`) || undefined;
                if (!el) continue;
                elementoCache.current.set(dataPos, el);
            }
            const r = (el as Element).getBoundingClientRect();
            const targetX = r.left + r.width / 2 - offsetX;
            const labelEl = (el as Element).querySelector('.nota-etiqueta');
            const etiqueta = (labelEl?.textContent?.trim() || extraerEtiqueta(nota)) || '·';
            map.set(dataPos, { dataPos, targetX, etiqueta });
        }
        return Array.from(map.values()).sort((a, b) => a.targetX - b.targetX);
    }, [cancion, tickActual]);

    const notas = useMemo<NotaHighway[]>(() => {
        if (!cancion?.secuencia || !Array.isArray(cancion.secuencia)) return [];
        const pistaRect = pistaRef.current?.getBoundingClientRect();
        const offsetX = pistaRect?.left ?? 0;

        const result: NotaHighway[] = [];
        const windowStart = tickActual - 60;
        const windowEnd = tickActual + TICKS_VIAJE + 200;

        for (const nota of cancion.secuencia) {
            if (String(nota.botonId).includes('-bajo')) continue;
            if (rangoSeccion && (nota.tick < rangoSeccion.inicio || nota.tick > rangoSeccion.fin)) continue;
            const duracion = Math.max(0, Number(nota.duracion) || 0);
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

            const id = `${nota.tick}-${nota.botonId}`;
            const impactada = notasImpactadas?.has(id) ?? false;
            const progresoFinal = Math.max(0, progresoCrudo - duracion / TICKS_VIAJE);

            let etiqueta = extraerEtiqueta(nota);
            if (verNotas) {
                const labelEl = (el as Element).querySelector('.nota-etiqueta');
                const labelDom = labelEl?.textContent?.trim();
                if (labelDom) etiqueta = labelDom;
            }
            const laneEtiqueta = (() => {
                const labelEl = (el as Element).querySelector('.nota-etiqueta');
                return (labelEl?.textContent?.trim() || etiqueta || '·');
            })();

            result.push({
                id,
                botonId: nota.botonId,
                fuelle: nota.fuelle === 'abriendo' ? 'abriendo' : 'cerrando',
                progreso,
                progresoFinal,
                duracion,
                impactada,
                etiqueta,
                targetX,
                laneEtiqueta,
            });
        }
        return result;
    }, [cancion, tickActual, notasImpactadas, rangoSeccion, verNotas]);

    // Altura util de la pista (calculada al render). Las notas viajan de
    // top=0 (entrada arriba) a top=altoPista (zona de impacto abajo).
    const altoPista = pistaRef.current?.getBoundingClientRect().height ?? 0;

    const notasOrdenadas = [...notas].sort((a, b) => a.progreso - b.progreso);
    const idsInminente = new Set<string>();
    let mejorProgreso = 0;
    for (const n of notasOrdenadas) {
        if (n.impactada || n.progreso <= 0.78) continue;
        if (n.progreso > mejorProgreso) mejorProgreso = n.progreso;
    }
    if (mejorProgreso > 0) {
        for (const n of notasOrdenadas) {
            if (n.impactada || n.progreso <= 0.78) continue;
            if (n.progreso >= mejorProgreso - 0.04) idsInminente.add(n.id);
        }
    }
    const hayInminente = idsInminente.size > 0;

    return (
        <div ref={pistaRef} className="pista-notas-highway" aria-hidden="true">
            {/* Carriles verticales tenues — guias visuales para mapear nota -> pito */}
            {carrilesUnicos.map((c) => (
                <div
                    key={`lane-${c.dataPos}`}
                    className="highway-carril"
                    style={{ left: `${c.targetX}px` }}
                />
            ))}

            {/* Notas cayendo por su carril */}
            {notasOrdenadas.map((n) => {
                const noteY = n.progreso * altoPista;
                const esInminente = idsInminente.has(n.id);
                const tieneCola = n.duracion > 30 && !n.impactada;
                const tailTopY = n.progresoFinal * altoPista;
                const tailBottomY = Math.min(noteY, altoPista);
                const tailHeight = Math.max(0, tailBottomY - tailTopY);

                const opacidadFinal = n.impactada
                    ? 1
                    : esInminente
                        ? 1
                        : hayInminente
                            ? 0.45
                            : 0.85;

                return (
                    <React.Fragment key={n.id}>
                        {tieneCola && tailHeight > 4 && (
                            <div
                                className={`highway-cola ${n.fuelle} ${n.impactada ? 'impactada' : ''}`}
                                style={{
                                    left: `${n.targetX}px`,
                                    top: `${tailTopY}px`,
                                    height: `${tailHeight}px`,
                                    opacity: opacidadFinal,
                                }}
                            />
                        )}
                        <div
                            className={`highway-nota ${n.fuelle} ${n.impactada ? 'impactada' : ''} ${esInminente ? 'inminente' : ''}`}
                            style={{
                                left: `${n.targetX}px`,
                                top: `${noteY}px`,
                                opacity: opacidadFinal,
                            }}
                        >
                            <span className="highway-nota-etiqueta">{n.etiqueta}</span>
                        </div>
                    </React.Fragment>
                );
            })}

            {/* Base — indicadores fijos abajo de cada carril con el nombre del pito.
                Linea visual que conecta el final del carril con el pito real abajo. */}
            <div className="highway-base">
                {carrilesUnicos.map((c) => (
                    <div
                        key={`base-${c.dataPos}`}
                        className="highway-base-marca"
                        style={{ left: `${c.targetX}px` }}
                    >
                        <span className="highway-base-etiqueta">{c.etiqueta}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default React.memo(PistaNotasHighway);
