import React, { useMemo, useRef } from 'react';
import { TICKS_VIAJE } from '../../AcordeonProMax/TiposProMax';
import './PistaNotasVertical.css';

interface PistaNotasVerticalProps {
    cancion: any;
    tickActual: number;
    notasImpactadas: Set<string>;
    rangoSeccion?: { inicio: number; fin: number } | null;
}

interface NotaEnVuelo {
    id: string;
    botonId: string;
    fuelle: 'abriendo' | 'cerrando';
    progreso: number;       // Clamp [0, 1.05] — para posicionar la cabeza visualmente.
    progresoCrudo: number;  // Sin clamp — para fade-out post-impacto y consumo de cola.
    progresoFinal: number;  // Posicion del END de la nota (sigue avanzando durante sustain)
    duracion: number;       // En ticks
    impactada: boolean;
    esFallada: boolean;
    etiqueta: string;
    targetX: number;
    targetY: number;
}

// Convierte cualquier botonId del cancion ("A1-halar", "A-1-halar", "1-3-halar")
// al data-pos del pito que renderiza SimuladorApp ("A-1" o "1-3").
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

const PistaNotasVertical: React.FC<PistaNotasVerticalProps> = ({
    cancion, tickActual, notasImpactadas, rangoSeccion
}) => {
    const pistaRef = useRef<HTMLDivElement>(null);
    const elementoCache = useRef<Map<string, Element>>(new Map());

    const notasEnVuelo = useMemo<NotaEnVuelo[]>(() => {
        if (!cancion?.secuencia || !Array.isArray(cancion.secuencia)) return [];

        // Offset de la pista respecto al viewport (top: 48px en CSS, 44px en mobile).
        // Se mide en cada render para soportar resize/orientacion.
        const pistaRect = pistaRef.current?.getBoundingClientRect();
        const offsetX = pistaRect?.left ?? 0;
        const offsetY = pistaRect?.top ?? 0;

        const result: NotaEnVuelo[] = [];
        const windowStart = tickActual - 60;
        const windowEnd = tickActual + TICKS_VIAJE + 200;

        for (const nota of cancion.secuencia) {
            // Las notas de bajos no se renderizan en modo juego — no hay donde caigan.
            if (String(nota.botonId).includes('-bajo')) continue;
            if (rangoSeccion && (nota.tick < rangoSeccion.inicio || nota.tick > rangoSeccion.fin)) continue;
            const duracion = Math.max(0, Number(nota.duracion) || 0);
            // Para notas sostenidas el filtro inicial debe considerar la cola: la
            // nota sigue activa hasta tick + duracion. Sin esto, sostenidos largos
            // desaparecen al pisarlos porque su tick base ya es < windowStart.
            if (nota.tick + duracion < windowStart) continue;
            if ((nota.tick - TICKS_VIAJE) > windowEnd) continue;

            const tickSalida = nota.tick - TICKS_VIAJE;
            const progresoCrudo = (tickActual - tickSalida) / TICKS_VIAJE;
            // progresoMax extendido por duracion: una nota con sustain de 100 ticks
            // sobre TICKS_VIAJE=480 mantiene visible hasta ~1.31. Antes, fixed 1.1
            // recortaba la cola justo cuando el alumno pisaba el sostenido.
            const progresoMax = 1.1 + duracion / TICKS_VIAJE;
            if (progresoCrudo < -0.05 || progresoCrudo > progresoMax) continue;
            const progreso = Math.max(0, Math.min(progresoCrudo, 1.05));

            // Posicion real del pito en el DOM (sigue al pan horizontal del tren).
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
            // progresoFinal usa progresoCrudo (no clamp): durante el sustain la cola
            // sigue avanzando hasta consumirse cuando progresoCrudo - duracion/T = progresoCrudo final.
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

    // Ordena ASC por progreso: la(s) INMINENTE(s) se renderizan al final →
    // quedan encima del resto en el z-stack. Asi nunca se tapan.
    const notasOrdenadas = [...notasEnVuelo].sort((a, b) => a.progreso - b.progreso);
    // TODAS las notas con el mayor progreso (margen 0.04) reciben .inminente,
    // asi un acorde de 2-3 botones simultaneos pulsa todos a la vez.
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
    const hayInminente = idsInminente.size > 0;

    return (
        <div ref={pistaRef} className="pista-notas-vertical" aria-hidden="true">
            {notasOrdenadas.map((n) => {
                // Caida vertical estilo Guitar Hero: nace en el tope de la pista (y=0)
                // y baja recto hasta la y real del pito.
                const noteY = n.targetY * n.progreso;
                // Color base — solido (segun research: la opacidad confunde el timing)
                const rgb = n.esFallada
                    ? '102, 102, 102'
                    : (n.fuelle === 'abriendo' ? '59, 130, 246' : '239, 68, 68');
                // Opacidad. Notas no-impactadas que pasaron del target hacen fade
                // rapido (usar progresoCrudo, no progreso clamp); notas impactadas
                // sostenidas se mantienen visibles hasta que la cola se consume,
                // luego fade. Las lejanas se atenuan cuando hay nota inminente.
                const colaConsumida = n.duracion > 30 && n.progresoFinal >= n.progreso - 0.005;
                const opacidad = n.impactada
                    ? (colaConsumida ? Math.max(0, 1 - (n.progresoCrudo - 1.0) / 0.15) : 1)
                    : n.progresoCrudo > 1.05
                        ? Math.max(0, 1 - (n.progresoCrudo - 1.05) / 0.08)
                        : hayInminente && n.progreso < 0.55
                            ? 0.35
                            : 1;
                // Escala: sutil al acercarse para dar foco. El burst al impactar lo
                // maneja el CSS via animation .impactada (no escalamos aqui).
                const escala = n.impactada
                    ? 1
                    : n.progreso > 0.88
                        ? 1 + (n.progreso - 0.88) * 1.0
                        : 1;
                // Bola 3D — gradiente solido. Cuando esta impactada y todavia
                // tiene cola (sostenido en curso), conservamos el color base con
                // un nucleo blanco brillante: el alumno reconoce de un vistazo
                // que pito esta pisando. Antes la bola se volvia 100% blanca y
                // se confundia con cualquier otra nota impactada.
                const tieneSostenido = n.duracion > 30 && !n.esFallada;
                const fondo = n.impactada
                    ? (tieneSostenido
                        ? `radial-gradient(circle at 50% 45%,
                            #fff 0%,
                            rgba(255,255,255,0.85) 28%,
                            rgb(${rgb}) 70%,
                            rgba(${rgb},0.85) 100%)`
                        : '#fff')
                    : `radial-gradient(circle at 35% 28%,
                        rgba(255,255,255,0.7) 0%,
                        rgb(${rgb}) 55%,
                        rgba(0,0,0,0.25) 100%)`;
                const glow = n.impactada
                    ? `0 0 18px rgba(${rgb}, 0.95), 0 0 36px rgba(${rgb}, 0.6)`
                    : `0 0 8px rgba(${rgb},0.55), 0 3px 6px rgba(0,0,0,0.35)`;

                // Cola para notas sostenidas (duracion > 30 ticks ~ corchea).
                // Es un rectangulo vertical detras de la cabeza, va desde la
                // posicion del END (progresoFinal) hasta la cabeza (progreso).
                const tieneCola = n.duracion > 30 && !n.esFallada;
                const tailTopY = n.progresoFinal * n.targetY;
                const tailHeight = Math.max(0, noteY - tailTopY);

                const esInminente = idsInminente.has(n.id);
                return (
                    <React.Fragment key={n.id}>
                        {tieneCola && tailHeight > 4 && (
                            <div
                                className={`nota-cola ${n.fuelle} ${n.impactada ? 'impactada' : ''}`}
                                style={{
                                    left: `${n.targetX}px`,
                                    top: `${tailTopY}px`,
                                    height: `${tailHeight}px`,
                                    background: `linear-gradient(to bottom, rgba(${rgb}, 0.35), rgba(${rgb}, 0.85))`,
                                    boxShadow: `0 0 6px rgba(${rgb}, 0.5)`,
                                }}
                            />
                        )}
                        <div
                            className={`nota-cayendo ${n.fuelle} ${n.impactada ? 'impactada' : ''} ${n.esFallada ? 'fallada' : ''} ${esInminente ? 'inminente' : ''}`}
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
                            {/* Particulas de hit — 6 puntos que salen radial al impactar */}
                            {n.impactada && (
                                <>
                                    {[0, 60, 120, 180, 240, 300].map((deg) => (
                                        <span
                                            key={deg}
                                            className="nota-particula"
                                            style={{
                                                ['--angulo' as any]: `${deg}deg`,
                                                background: `rgb(${rgb})`,
                                            }}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
};


export default React.memo(PistaNotasVertical);
