import React, { useMemo, useRef } from 'react';
import { TICKS_VIAJE } from '../../AcordeonProMax/TiposProMax';
import './PistaNotasBoxed.css';

/**
 * MÉTODO 2 — Pista boxed estilo Synthesia.
 *
 * Las notas caen dentro de un contenedor fijo en la parte superior de la
 * pantalla. Cuando la nota inminente alcanza el borde inferior del contenedor,
 * queda medio recortada (mitad dentro, mitad fuera) y la canción se pausa
 * hasta que el alumno pisa el botón correcto. Al pisar, la nota termina de
 * salir hacia abajo y entra la siguiente.
 *
 * La pausa la maneja el motor `synthesia` que ya existe en `useLogicaProMax`:
 * `tickActual` deja de avanzar mientras espera la nota — este componente solo
 * lee `tickActual` y posiciona las notas, así el "stop-and-wait" es natural.
 *
 * X de cada nota = posición horizontal del pito real (mismo querySelector que
 * la pista vertical), para que el alumno pueda trazar visualmente desde la
 * cajita hacia el botón abajo.
 */

interface PistaNotasBoxedProps {
    cancion: any;
    tickActual: number;
    notasImpactadas: Set<string>;
    rangoSeccion?: { inicio: number; fin: number } | null;
}

interface NotaBoxed {
    id: string;
    botonId: string;
    fuelle: 'abriendo' | 'cerrando';
    progreso: number;
    impactada: boolean;
    etiqueta: string;
    targetX: number;  // X del pito real, en coords de viewport
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

const PistaNotasBoxed: React.FC<PistaNotasBoxedProps> = ({
    cancion, tickActual, notasImpactadas, rangoSeccion
}) => {
    const cajaRef = useRef<HTMLDivElement>(null);
    const elementoCache = useRef<Map<string, Element>>(new Map());

    const notas = useMemo<NotaBoxed[]>(() => {
        if (!cancion?.secuencia || !Array.isArray(cancion.secuencia)) return [];
        const cajaRect = cajaRef.current?.getBoundingClientRect();
        const offsetX = cajaRect?.left ?? 0;

        const result: NotaBoxed[] = [];
        // Ventana mas estrecha: solo notas en vuelo dentro de la cajita
        const windowStart = tickActual - 60;
        const windowEnd = tickActual + TICKS_VIAJE + 200;

        for (const nota of cancion.secuencia) {
            if (String(nota.botonId).includes('-bajo')) continue;
            if (rangoSeccion && (nota.tick < rangoSeccion.inicio || nota.tick > rangoSeccion.fin)) continue;
            if (nota.tick < windowStart) continue;
            if ((nota.tick - TICKS_VIAJE) > windowEnd) continue;

            const tickSalida = nota.tick - TICKS_VIAJE;
            const progresoCrudo = (tickActual - tickSalida) / TICKS_VIAJE;
            // Render entre [-0.05, 1.1]: aparece arriba, sale por abajo tras impactar
            if (progresoCrudo < -0.05 || progresoCrudo > 1.1) continue;
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

            result.push({
                id,
                botonId: nota.botonId,
                fuelle: nota.fuelle === 'abriendo' ? 'abriendo' : 'cerrando',
                progreso,
                impactada,
                etiqueta: extraerEtiqueta(nota),
                targetX,
            });
        }
        return result;
    }, [cancion, tickActual, notasImpactadas, rangoSeccion]);

    // Altura util de la cajita en pixels — calculada al render
    const altoCaja = cajaRef.current?.getBoundingClientRect().height ?? 0;

    // Ordenar por progreso ASC: las que vienen mas atras se renderizan primero,
    // la(s) INMINENTE(s) salen al final → quedan encima en z-stack.
    const notasOrdenadas = [...notas].sort((a, b) => a.progreso - b.progreso);
    // TODAS las notas con el mayor progreso (margen 0.04) reciben .inminente,
    // asi un acorde de 2-3 botones simultaneos pulsa todos a la vez.
    const idsInminente = new Set<string>();
    let mejorProgreso = 0;
    for (const n of notasOrdenadas) {
        if (n.impactada || n.progreso <= 0.7) continue;
        if (n.progreso > mejorProgreso) mejorProgreso = n.progreso;
    }
    if (mejorProgreso > 0) {
        for (const n of notasOrdenadas) {
            if (n.impactada || n.progreso <= 0.7) continue;
            if (n.progreso >= mejorProgreso - 0.04) idsInminente.add(n.id);
        }
    }
    const hayInminente = idsInminente.size > 0;

    return (
        <div ref={cajaRef} className="pista-notas-boxed" aria-hidden="true">
            {notasOrdenadas.map((n) => {
                // Y dentro de la cajita: progreso=0 → arriba (-radio), progreso=1 →
                // borde inferior (medio recortado). Si progreso > 1 (impactada y se
                // resumio), sale por abajo continuando la trayectoria.
                const noteY = n.progreso * altoCaja;
                const rgb = n.fuelle === 'abriendo' ? '59, 130, 246' : '239, 68, 68';
                // Opacidad por progreso: la inminente (cerca de 1) full color,
                // las que vienen mas atras se atenuan para que no compitan.
                const alphaCol = n.impactada ? 1 : Math.min(0.35 + n.progreso * 0.7, 1);
                const fondo = n.impactada
                    ? '#fff'
                    : `radial-gradient(circle at 35% 28%,
                        rgba(255,255,255,${0.5 + alphaCol * 0.3}) 0%,
                        rgba(${rgb}, ${alphaCol}) 55%,
                        rgba(0,0,0,0.25) 100%)`;
                const glow = n.impactada
                    ? `0 0 18px rgba(${rgb}, 0.95)`
                    : n.progreso > 0.85
                        ? `0 0 10px rgba(${rgb}, 0.7), 0 0 0 2px rgba(255,255,255,0.6)`
                        : `0 0 4px rgba(${rgb}, 0.4)`;

                const esInminente = idsInminente.has(n.id);
                // Si HAY notas inminentes, las demas se atenuan fuerte para que
                // destaque la que toca pisar. Si NO hay (estado inicial / final),
                // las notas queue se muestran a opacidad media normal.
                const opacidadFinal = n.impactada
                    ? 1
                    : esInminente
                        ? 1
                        : hayInminente
                            ? 0.28           // hay una inminente → otras muy tenues
                            : 0.5 + alphaCol * 0.5;
                return (
                    <div
                        key={n.id}
                        className={`nota-boxed ${n.fuelle} ${n.impactada ? 'impactada' : ''} ${esInminente ? 'inminente' : ''}`}
                        style={{
                            left: `${n.targetX}px`,
                            top: `${noteY}px`,
                            background: fondo,
                            boxShadow: glow,
                            opacity: opacidadFinal,
                        }}
                    >
                        <span className="nota-boxed-etiqueta">{n.etiqueta}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(PistaNotasBoxed);
