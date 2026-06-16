import * as React from 'react'
import { Play, Square, Circle, Pause, Rewind, FastForward, User, Grid3x3, Boxes } from 'lucide-react';
import './BarraGrabacionFlotante.css';

interface Props {
    grabando: boolean;
    tiempoMs: number;
    onAlternarGrabacion: () => void;
    onAbrirLista: () => void;
    // Estado opcional de reproduccion. Cuando enReproduccion=true, la barra
    // muestra controles de playback (pause/stop + tickActual/totalTicks)
    // en lugar de los botones REC/Play.
    enReproduccion?: boolean;
    pausado?: boolean;
    tickActual?: number;
    totalTicks?: number;
    bpmReproduccion?: number;
    resolucionReproduccion?: number;
    onAlternarPausa?: () => void;
    onDetenerReproduccion?: () => void;
    onRetroceder?: () => void;
    onAdelantar?: () => void;
    // Vista del replay: teclas ↔ acordeón 3D (solo el acordeón) ↔ personaje 3D. Solo se muestra si se pasa el handler.
    vista3D?: 'teclas' | 'acordeon' | 'personaje';
    onCambiarVista3D?: (v: 'teclas' | 'acordeon' | 'personaje') => void;
}

function formatearTiempo(ms: number): string {
    const totalSegundos = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(totalSegundos / 60);
    const s = totalSegundos % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function tickASegundosMs(tick: number, bpm: number, resolucion: number): number {
    if (!bpm || !resolucion) return 0;
    return (tick / resolucion) * (60 / bpm) * 1000;
}

/**
 * Barra flotante en la esquina superior derecha del simulador. Tres modos:
 * 1. Reposo  → PLAY (lista de grabaciones) + REC (rojo, iniciar grabacion)
 * 2. Grabando → STOP + cronometro
 * 3. Reproduciendo → PAUSE/RESUME + STOP + tick/total ticks
 */
const BarraGrabacionFlotante: React.FC<Props> = ({
    grabando, tiempoMs, onAlternarGrabacion, onAbrirLista,
    enReproduccion = false, pausado = false,
    tickActual = 0, totalTicks = 0,
    bpmReproduccion = 120, resolucionReproduccion = 192,
    onAlternarPausa, onDetenerReproduccion,
    onRetroceder, onAdelantar,
    vista3D = 'teclas', onCambiarVista3D,
}) => {
    if (enReproduccion) {
        const progreso = totalTicks > 0
            ? Math.min(100, Math.max(0, (tickActual / totalTicks) * 100))
            : 0;
        const tiempoActualMs = tickASegundosMs(tickActual, bpmReproduccion, resolucionReproduccion);
        const tiempoTotalMs = tickASegundosMs(totalTicks, bpmReproduccion, resolucionReproduccion);
        return (
            <div className="sim-grab-flotante reproduciendo" data-touch-allow>
                {onCambiarVista3D && (
                    vista3D === 'teclas' ? (
                        <>
                            <button
                                type="button"
                                className="sim-grab-toggle3d"
                                onClick={() => onCambiarVista3D('acordeon')}
                                aria-label="Ver acordeón 3D"
                                title="Reproducir con el acordeón 3D"
                            >
                                <Boxes size={13} /> 3D
                            </button>
                            <button
                                type="button"
                                className="sim-grab-toggle3d"
                                onClick={() => onCambiarVista3D('personaje')}
                                aria-label="Ver personaje 3D"
                                title="Reproducir con el personaje 3D"
                            >
                                <User size={13} /> Personaje
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="sim-grab-toggle3d activo"
                            onClick={() => onCambiarVista3D('teclas')}
                            aria-label="Ver teclas"
                            title="Volver a las teclas"
                        >
                            <Grid3x3 size={13} /> Teclas
                        </button>
                    )
                )}

                {onRetroceder && (
                    <button
                        type="button"
                        className="sim-grab-btn sim-grab-btn-skip"
                        onClick={onRetroceder}
                        aria-label="Retroceder 5 segundos"
                        title="Retroceder 5s"
                    >
                        <Rewind size={14} fill="currentColor" />
                    </button>
                )}

                <button
                    type="button"
                    className="sim-grab-btn sim-grab-btn-pause"
                    onClick={onAlternarPausa}
                    aria-label={pausado ? 'Reanudar' : 'Pausar'}
                    title={pausado ? 'Reanudar' : 'Pausar'}
                >
                    {pausado ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                </button>

                <button
                    type="button"
                    className="sim-grab-btn sim-grab-btn-stop"
                    onClick={onDetenerReproduccion}
                    aria-label="Detener reproduccion"
                    title="Detener reproduccion"
                >
                    <Square size={14} fill="currentColor" />
                </button>

                {onAdelantar && (
                    <button
                        type="button"
                        className="sim-grab-btn sim-grab-btn-skip"
                        onClick={onAdelantar}
                        aria-label="Adelantar 5 segundos"
                        title="Adelantar 5s"
                    >
                        <FastForward size={14} fill="currentColor" />
                    </button>
                )}

                <span className="sim-grab-cronometro reproduciendo" aria-live="polite">
                    {formatearTiempo(tiempoActualMs)}
                    {tiempoTotalMs > 0 && <> / {formatearTiempo(tiempoTotalMs)}</>}
                </span>

                <div
                    className="sim-grab-progreso"
                    role="progressbar"
                    aria-valuenow={Math.round(progreso)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <div className="sim-grab-progreso-barra" style={{ width: `${progreso}%` }} />
                </div>
            </div>
        );
    }

    return (
        <div className="sim-grab-flotante" data-touch-allow>
            <button
                type="button"
                className="sim-grab-btn sim-grab-btn-play"
                onClick={onAbrirLista}
                aria-label="Ver mis grabaciones"
                title="Ver mis grabaciones"
            >
                <Play size={14} fill="currentColor" />
            </button>

            <button
                type="button"
                className={`sim-grab-btn sim-grab-btn-rec ${grabando ? 'grabando' : ''}`}
                onClick={onAlternarGrabacion}
                aria-label={grabando ? 'Detener grabacion' : 'Iniciar grabacion'}
                title={grabando ? 'Detener grabacion' : 'Iniciar grabacion'}
            >
                {grabando
                    ? <Square size={14} fill="currentColor" />
                    : <Circle size={14} fill="currentColor" />}
            </button>

            {grabando && (
                <span className="sim-grab-cronometro" aria-live="polite">
                    {formatearTiempo(tiempoMs)}
                </span>
            )}
        </div>
    );
};

export default React.memo(BarraGrabacionFlotante);
