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

    // SOLO mostrar las proximas N notas (no las impactadas). En canciones
    // densas (rafagas) renderizar todas crea "avalancha visual" — el alumno
    // no sabe a cual mirar. Limitar a las mas cercanas al impacto + asignar
    // rank por proximidad da JERARQUIA VISUAL CLARA: el ojo siempre encuentra
    // la mas grande como "la siguiente a pisar".
    const MAX_NOTAS_VISIBLES = 6;

    // Ordenar DESC por progreso (mas cerca del impacto primero).
    // Las impactadas se mantienen visibles brevemente para el burst.
    const notasActivas = notas.filter(n => n.impactada || n.progreso > 0.05);
    const notasOrdenadasDesc = [...notasActivas].sort((a, b) => b.progreso - a.progreso);

    // Asignar rank: 0 = mas inminente (mayor progreso), 1 = siguiente, etc.
    // Impactadas no entran al ranking — siempre visibles a full opacidad/escala.
    const notasNoImpactadas = notasOrdenadasDesc.filter(n => !n.impactada).slice(0, MAX_NOTAS_VISIBLES);
    const rankPorId = new Map<string, number>();
    notasNoImpactadas.forEach((n, idx) => rankPorId.set(n.id, idx));

    // INMINENTE: todas las notas con rank=0 + las que esten en el mismo tick
    // (acordes). Definida por: misma proximidad temporal que la primera (margen
    // 0.04 de progreso) y progreso > 0.7 (zona de impacto).
    const idsInminente = new Set<string>();
    const primera = notasNoImpactadas[0];
    if (primera && primera.progreso > 0.7) {
        const umbral = primera.progreso - 0.04;
        for (const n of notasNoImpactadas) {
            if (n.progreso >= umbral && n.progreso > 0.7) idsInminente.add(n.id);
        }
    }
    const hayInminente = idsInminente.size > 0;

    // Notas finalmente visibles: las impactadas (burst) + las top N no-impactadas.
    const notasParaRender = [
        ...notasActivas.filter(n => n.impactada),
        ...notasNoImpactadas,
    ];
    // Ordenar ASC por progreso para z-stacking (las cercanas al impacto arriba).
    notasParaRender.sort((a, b) => a.progreso - b.progreso);

    // Construir set de targetX inminentes para resaltar los carriles activos.
    const carrilesInminentes = new Set<number>();
    for (const n of notasParaRender) {
        if (idsInminente.has(n.id)) carrilesInminentes.add(Math.round(n.targetX));
    }

    return (
        <div ref={pistaRef} className="pista-notas-highway" aria-hidden="true">
            {/* Carriles verticales tenues — guias visuales para mapear nota -> pito.
                Los carriles cuyo pito corresponde a una nota INMINENTE se iluminan
                para guiar el ojo del alumno hacia donde debe pisar. */}
            {carrilesUnicos.map((c) => {
                const esActivo = carrilesInminentes.has(Math.round(c.targetX));
                return (
                    <div
                        key={`lane-${c.dataPos}`}
                        className={`highway-carril ${esActivo ? 'activo' : ''}`}
                        style={{ left: `${c.targetX}px` }}
                    />
                );
            })}

            {/* Notas cayendo por su carril (solo top N por proximidad). */}
            {notasParaRender.map((n) => {
                const noteY = n.progreso * altoPista;
                const esInminente = idsInminente.has(n.id);
                const rank = rankPorId.get(n.id) ?? 0;
                const tieneCola = n.duracion > 30 && !n.impactada;
                const tailTopY = n.progresoFinal * altoPista;
                const tailBottomY = Math.min(noteY, altoPista);
                const tailHeight = Math.max(0, tailBottomY - tailTopY);

                // Opacidad por rank: la rank 0 (inminente o cercana) full,
                // y las siguientes se atenuan progresivamente. Asi el ojo
                // distingue claramente "esta primero, esta despues...".
                const opacidadPorRank = n.impactada
                    ? 1
                    : esInminente
                        ? 1
                        : rank === 0 ? 0.95
                        : rank === 1 ? 0.7
                        : rank === 2 ? 0.5
                        : rank === 3 ? 0.35
                        : 0.22;

                // Escala por rank: jerarquia visual fuerte. Inminente GIGANTE
                // (1.5x), las siguientes decrecen. El ojo automaticamente va
                // a la mas grande = "esta es la que debo pisar AHORA".
                const escalaPorRank = n.impactada
                    ? 1.3
                    : esInminente
                        ? 1.5
                        : rank === 0 ? 1.15
                        : rank === 1 ? 0.95
                        : rank === 2 ? 0.78
                        : rank === 3 ? 0.65
                        : 0.55;

                return (
                    <React.Fragment key={n.id}>
                        {tieneCola && tailHeight > 4 && (
                            <div
                                className={`highway-cola ${n.fuelle} ${n.impactada ? 'impactada' : ''}`}
                                style={{
                                    left: `${n.targetX}px`,
                                    top: `${tailTopY}px`,
                                    height: `${tailHeight}px`,
                                    opacity: opacidadPorRank,
                                }}
                            />
                        )}
                        <div
                            className={`highway-nota ${n.fuelle} ${n.impactada ? 'impactada' : ''} ${esInminente ? 'inminente' : ''}`}
                            style={{
                                left: `${n.targetX}px`,
                                top: `${noteY}px`,
                                opacity: opacidadPorRank,
                                transform: `translate(-50%, -50%) scale(${escalaPorRank})`,
                            }}
                        >
                            <span className="highway-nota-etiqueta">{n.etiqueta}</span>
                        </div>
                    </React.Fragment>
                );
            })}

            {/* Base — indicadores fijos abajo de cada carril con el nombre del pito.
                Linea visual que conecta el final del carril con el pito real abajo.
                Los carriles INMINENTES tienen su badge agrandado + glow + flecha. */}
            <div className="highway-base">
                {carrilesUnicos.map((c) => {
                    const esActivo = carrilesInminentes.has(Math.round(c.targetX));
                    return (
                        <div
                            key={`base-${c.dataPos}`}
                            className={`highway-base-marca ${esActivo ? 'activo' : ''}`}
                            style={{ left: `${c.targetX}px` }}
                        >
                            {esActivo && <span className="highway-base-flecha">▼</span>}
                            <span className="highway-base-etiqueta">{c.etiqueta}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(PistaNotasHighway);
