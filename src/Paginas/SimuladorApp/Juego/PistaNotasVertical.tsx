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
    progreso: number;
    progresoFinal: number;  // Posicion del END de la nota (cabeza + duracion)
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
            if (nota.tick < windowStart) continue;
            if ((nota.tick - TICKS_VIAJE) > windowEnd) continue;

            const tickSalida = nota.tick - TICKS_VIAJE;
            const progresoCrudo = (tickActual - tickSalida) / TICKS_VIAJE;
            if (progresoCrudo < -0.05 || progresoCrudo > 1.1) continue;
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
            const duracion = Math.max(0, Number(nota.duracion) || 0);
            const progresoFinal = Math.max(0, progreso - duracion / TICKS_VIAJE);

            result.push({
                id,
                botonId: nota.botonId,
                fuelle: nota.fuelle === 'abriendo' ? 'abriendo' : 'cerrando',
                progreso,
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

    // Ordena ASC por progreso: la INMINENTE se renderiza al final → queda
    // encima del resto en el z-stack. Asi nunca se tapa.
    const notasOrdenadas = [...notasEnVuelo].sort((a, b) => a.progreso - b.progreso);
    // Si hay alguna nota muy cerca de impactar, las que vienen lejos se
    // atenuan para que la inminente destaque y no se tape la vista.
    const hayInminente = notasOrdenadas.some(n => !n.impactada && !n.esFallada && n.progreso > 0.78);
    // ID de la nota mas proxima al impacto (la que toca pisar AHORA), para
    // marcarla con anillo blanco pulsante y diferenciarla del resto.
    let idInminente: string | null = null;
    for (let i = notasOrdenadas.length - 1; i >= 0; i--) {
        const n = notasOrdenadas[i];
        if (!n.impactada && !n.esFallada && n.progreso > 0.78) { idInminente = n.id; break; }
    }

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
                // Opacidad: visible normal por default; cuando hay una nota
                // inminente, las que vienen lejos (progreso < 0.55) se atenuan
                // a 0.35 para no tapar la vista del impacto que viene.
                const opacidad = n.impactada
                    ? 1
                    : n.progreso > 1.05
                        ? Math.max(0, 1 - (n.progreso - 1.05) / 0.05)
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
                // Bola 3D — gradiente solido, no transparente
                const fondo = n.impactada
                    ? '#fff'
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

                const esInminente = n.id === idInminente;
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
