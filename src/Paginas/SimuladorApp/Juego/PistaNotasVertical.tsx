import React, { useMemo } from 'react';
import { TICKS_VIAJE, COLOR_ABRIENDO, COLOR_CERRANDO } from '../../AcordeonProMax/TiposProMax';
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
    columna: number;     // 1..10
    fuelle: 'abriendo' | 'cerrando';
    progreso: number;
    impactada: boolean;
    esFallada: boolean;
    etiqueta: string;
}

// Extrae la posición numérica del botonId. Soporta:
//   "A1-halar", "A1-empujar", "A-1-halar", "A-1-empujar", "1-3-halar"
function extraerColumna(botonId: string): number {
    // Formato compacto: "A1", "B12"
    let m = botonId.match(/^[A-Z](\d+)/);
    if (m) return parseInt(m[1], 10);
    // Formato con guion: "A-1", "1-3"
    m = botonId.match(/^[A-Z0-9]+-(\d+)/);
    if (m) return parseInt(m[1], 10);
    return 1;
}

// Etiqueta corta para mostrar dentro del círculo (Do/Re/Mi/...)
function extraerEtiqueta(nota: any): string {
    const nombre = nota?.nombre || nota?.notaNombre || '';
    return String(nombre).split(' ')[0].slice(0, 3);
}

const PistaNotasVertical: React.FC<PistaNotasVerticalProps> = ({
    cancion, tickActual, notasImpactadas, rangoSeccion
}) => {
    const totalSecuencia = Array.isArray(cancion?.secuencia) ? cancion.secuencia.length : 0;

    const notasEnVuelo = useMemo<NotaEnVuelo[]>(() => {
        if (!cancion?.secuencia || !Array.isArray(cancion.secuencia)) return [];
        const result: NotaEnVuelo[] = [];
        // Ventana ampliada: incluye notas que aun no salen (progreso < 0)
        // para que el usuario las vea apareciendo desde arriba.
        const windowStart = tickActual - 60;
        const windowEnd = tickActual + TICKS_VIAJE + 200;

        for (const nota of cancion.secuencia) {
            if (rangoSeccion && (nota.tick < rangoSeccion.inicio || nota.tick > rangoSeccion.fin)) continue;
            if (nota.tick < windowStart) continue;
            if ((nota.tick - TICKS_VIAJE) > windowEnd) continue;

            const tickSalida = nota.tick - TICKS_VIAJE;
            const progresoCrudo = (tickActual - tickSalida) / TICKS_VIAJE;
            // Solo renderizamos notas en el rango visible [-0.05, 1.1]
            if (progresoCrudo < -0.05 || progresoCrudo > 1.1) continue;
            const progreso = Math.max(0, Math.min(progresoCrudo, 1.05));

            const id = `${nota.tick}-${nota.botonId}`;
            const impactada = notasImpactadas?.has(id) ?? false;
            const esFallada = progresoCrudo > 1.0 && !impactada;

            result.push({
                id,
                botonId: nota.botonId,
                columna: extraerColumna(nota.botonId),
                fuelle: nota.fuelle === 'abriendo' ? 'abriendo' : 'cerrando',
                progreso,
                impactada,
                esFallada,
                etiqueta: extraerEtiqueta(nota),
            });
        }
        return result;
    }, [cancion, tickActual, notasImpactadas, rangoSeccion]);

    // DEBUG: log al primer render con datos de la cancion
    React.useEffect(() => {
        console.log('[PistaNotasVertical] DEBUG', {
            cancionExiste: !!cancion,
            tieneSecuencia: !!cancion?.secuencia,
            esArray: Array.isArray(cancion?.secuencia),
            totalNotas: totalSecuencia,
            primeraNota: cancion?.secuencia?.[0],
            ultimaNota: cancion?.secuencia?.[totalSecuencia - 1],
        });
    }, [cancion?.id, totalSecuencia]);

    return (
        <div className="pista-notas-vertical" aria-hidden="true">
            {/* TEST: circulo hardcoded — si lo ves, la pista se monta bien */}
            <div
                style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: 'magenta',
                    border: '3px solid yellow',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 11,
                }}
            >
                TEST
            </div>

            {/* Debug overlay — muestra cuantas notas estan visibles */}
            <div className="pista-debug">
                {notasEnVuelo.length} / {totalSecuencia} notas · tick {Math.round(tickActual)}
            </div>

            {notasEnVuelo.map((n) => {
                const xPct = ((n.columna - 0.5) / 10) * 100;
                // top:0% = arriba de la pista (debajo del header)
                // top:75% = linea de impacto (centro de los pitos del acordeon)
                const yPct = n.progreso * 75;
                const color = n.esFallada
                    ? '#666'
                    : (n.fuelle === 'abriendo' ? COLOR_ABRIENDO : COLOR_CERRANDO);
                // Opacidad simple: siempre visible, fade out solo al impactar/pasar
                const opacidad = n.impactada
                    ? Math.max(0, 1 - (n.progreso - 1.0) / 0.08)
                    : n.progreso > 1.05
                        ? Math.max(0, 1 - (n.progreso - 1.05) / 0.05)
                        : 1;
                const escala = n.impactada
                    ? 1.4
                    : n.progreso > 0.85
                        ? 1 + (n.progreso - 0.85) * 1.5
                        : 1;

                return (
                    <div
                        key={n.id}
                        className={`nota-cayendo ${n.fuelle} ${n.impactada ? 'impactada' : ''} ${n.esFallada ? 'fallada' : ''}`}
                        style={{
                            left: `${xPct}%`,
                            top: `${yPct}%`,
                            background: color,
                            opacity: opacidad,
                            transform: `translate(-50%, -50%) scale(${escala})`,
                            boxShadow: `0 0 24px ${color}, 0 0 48px ${color}88`,
                        }}
                    >
                        <span className="nota-etiqueta-cayendo">{n.etiqueta}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(PistaNotasVertical);
