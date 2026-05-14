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
    /** Si true, muestra el nombre del pito (Si, Re, Fa, La...) dentro de la
     *  nota cayendo, igual que la etiqueta del pito objetivo. Toggle global. */
    verNotas?: boolean;
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
    radioPito: number;       // radio real del pito objetivo (medido del DOM).
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
    cancion, tickActual, notasImpactadas, rangoSeccion, modoPractica, verNotas
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
            const radioPito = r.width / 2;

            const id = `${nota.tick}-${nota.botonId}`;
            const impactada = notasImpactadas?.has(id) ?? false;
            const esFallada = progresoCrudo > 1.0 && !impactada;
            const progresoFinal = Math.max(0, progresoCrudo - duracion / TICKS_VIAJE);

            // Si el toggle "Ver Notas" esta activo, leemos el label del pito
            // objetivo desde el DOM (mismo texto que se ve en la tecla, ej: "Si",
            // "Re", "Fa"). Sin toggle usamos el extractor por defecto que apenas
            // muestra algo cuando la nota lo trae embebido.
            let etiqueta = extraerEtiqueta(nota);
            if (verNotas) {
                const labelEl = (el as Element).querySelector('.nota-etiqueta');
                const labelDom = labelEl?.textContent?.trim();
                if (labelDom) etiqueta = labelDom;
            }

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
                etiqueta,
                targetX,
                targetY,
                radioPito,
            });
        }
        return result;
    }, [cancion, tickActual, notasImpactadas, rangoSeccion, verNotas]);

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
                // rgb solo se usa para colorear la cola y particulas. El fondo del
                // boton-nota lo maneja el CSS (estados .abriendo/.cerrando/.inminente).
                const rgb = n.esFallada
                    ? '180, 120, 60'
                    : (n.fuelle === 'abriendo' ? '14, 165, 233' : '239, 68, 68');
                // En Maestro NO marcamos inminentes — la urgencia visual no aplica cuando
                // el alumno solo observa.
                const esInminente = !esModoMaestro && idsInminente.has(n.id);
                // En Maestro la maestra "toca" las notas → motor las marca impactadas.
                // En este modo el alumno solo observa: queremos las notas cruzando el pito
                // limpias, sin animacion de impacto.
                const renderImpactada = !esModoMaestro && n.impactada;
                const colaConsumida = n.duracion > 30 && n.progresoFinal >= n.progreso - 0.005;
                // Rampa de opacidad por distancia al pito: 0.20 lejos → 1.0 cerca.
                // Antes era 0.65→1.0 pero el usuario reporto que con canciones
                // densas las notas lejanas llenaban la pantalla. Con 0.20 las
                // lejanas son apenas visibles (siluetas tenues) y la inminente
                // destaca claramente. Las notas siguen viendose como botones
                // completos (no puntitos) gracias al tamano constante; lo que
                // cambia es solo la transparencia.
                const rampa = Math.max(0, Math.min(1, n.progreso / 0.78));
                const opacidadDistancia = 0.20 + rampa * 0.80;
                const opacidad = renderImpactada
                    ? (colaConsumida ? Math.max(0, 1 - (n.progresoCrudo - 1.0) / 0.15) : 1)
                    : n.progresoCrudo > 1.05
                        ? Math.max(0, 1 - (n.progresoCrudo - 1.05) / 0.08)
                        : esModoMaestro
                            ? 1
                            : esInminente
                                ? 1
                                : opacidadDistancia;
                // Jerarquia por tamano: lejos = chico, cerca = crece, inminente = grande.
                const escala = renderImpactada
                    ? 1
                    : esModoMaestro
                        ? (n.progreso > 0.88 ? 1 + (n.progreso - 0.88) * 0.6 : 1)
                        : esInminente
                            ? 1.18 + (n.progreso > 0.88 ? (n.progreso - 0.88) * 0.4 : 0)
                            : 0.82 + rampa * 0.13;

                const tieneCola = n.duracion > 30 && !n.esFallada;
                const tailTopY = n.progresoFinal * n.targetY;
                // Cortamos la cola en el BORDE SUPERIOR del pito (radio real medido
                // del DOM), no en su centro, asi siempre queda afuera del boton.
                const tailBottomY = Math.min(noteY, n.targetY) - n.radioPito;
                const tailHeight = Math.max(0, tailBottomY - tailTopY);

                return (
                    <React.Fragment key={n.id}>
                        {tieneCola && tailHeight > 4 && (
                            <div
                                className={`nota-cola ${n.fuelle} ${renderImpactada ? 'impactada' : ''}`}
                                style={{
                                    left: `${n.targetX}px`,
                                    top: `${tailTopY}px`,
                                    height: `${tailHeight}px`,
                                    background: `linear-gradient(to bottom, rgba(${rgb}, 0) 0%, rgba(${rgb}, 0.25) 18%, rgba(${rgb}, 0.7) 55%, rgba(${rgb}, 1) 100%)`,
                                    opacity: opacidad,
                                }}
                            />
                        )}
                        <div
                            className={`nota-cayendo ${esInminente || renderImpactada || n.esFallada ? n.fuelle : 'lejana'} ${renderImpactada ? 'impactada' : ''} ${n.esFallada ? 'fallada' : ''} ${esInminente ? 'inminente' : ''}`}
                            style={{
                                left: `${n.targetX}px`,
                                top: `${noteY}px`,
                                opacity: opacidad,
                                transform: `translate(-50%, -50%) scale(${escala})`,
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
