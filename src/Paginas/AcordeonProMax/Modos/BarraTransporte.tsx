import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, FastForward, Rewind, Repeat, Square } from 'lucide-react';
import './BarraTransporte.css';

interface BarraTransporteProps {
    reproduciendo: boolean;
    pausado: boolean;
    onAlternarPausa: () => void;
    onDetener: () => void;
    tickActual: number;
    totalTicks: number;
    onBuscarTick: (tick: number) => void;
    bpm: number;
    loopAB: { start: number; end: number; activo: boolean; hasStart: boolean; hasEnd: boolean };
    onMarcarLoopInicio: () => void;
    onMarcarLoopFin: () => void;
    onActualizarLoopInicio: (tick: number) => void;
    onActualizarLoopFin: (tick: number) => void;
    onAlternarLoop: () => void;
    onLimpiarLoop: () => void;
    onCambiarBpm: (bpm: number | ((prev: number) => number)) => void;
    punchInTick?: number | null;
}

const BarraTransporte: React.FC<BarraTransporteProps> = ({
    reproduciendo,
    pausado,
    onAlternarPausa,
    onDetener,
    tickActual,
    totalTicks,
    onBuscarTick,
    bpm,
    loopAB,
    onMarcarLoopInicio,
    onMarcarLoopFin,
    onActualizarLoopInicio,
    onActualizarLoopFin,
    onAlternarLoop,
    onLimpiarLoop,
    onCambiarBpm,
    punchInTick,
}) => {
    const sliderWrapRef = useRef<HTMLDivElement | null>(null);
    const [draggingMarker, setDraggingMarker] = useState<'start' | 'end' | null>(null);

    const formatTime = (ticks: number) => {
        const seg = (ticks / 192) * (60 / bpm);
        const m = Math.floor(seg / 60);
        const s = Math.floor(seg % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onBuscarTick(parseInt(e.target.value));
    };

    const maxSeguro = Math.max(totalTicks, 1);
    const loopTieneInicio = loopAB.hasStart;
    const loopTieneFin = loopAB.hasEnd;
    const loopValido = loopAB.hasStart && loopAB.hasEnd && loopAB.end > loopAB.start;
    const loopInicioPct = loopTieneInicio ? (loopAB.start / maxSeguro) * 100 : 0;
    const loopFinPct = loopTieneFin ? (loopAB.end / maxSeguro) * 100 : 0;
    const anchoLoopPct = loopValido ? Math.max(loopFinPct - loopInicioPct, 0.8) : 0;
    const estaSonando = reproduciendo && !pausado;

    const clientXATick = (clientX: number) => {
        const rect = sliderWrapRef.current?.getBoundingClientRect();
        if (!rect) return 0;
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        return Math.round(ratio * maxSeguro);
    };

    useEffect(() => {
        if (!draggingMarker) return;

        const handlePointerMove = (event: PointerEvent) => {
            const nuevoTick = clientXATick(event.clientX);
            if (draggingMarker === 'start') {
                if (!loopAB.hasEnd) {
                    onActualizarLoopInicio(nuevoTick);
                    return;
                }
                onActualizarLoopInicio(Math.min(nuevoTick, Math.max(0, loopAB.end - 24)));
                return;
            }
            if (!loopAB.hasStart) {
                onActualizarLoopFin(nuevoTick);
                return;
            }
            onActualizarLoopFin(Math.max(nuevoTick, loopAB.start + 24));
        };

        const handlePointerUp = () => setDraggingMarker(null);

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [clientXATick, draggingMarker, loopAB.end, loopAB.start, onActualizarLoopFin, onActualizarLoopInicio]);

    return (
        <div className="hero-transporte-container promax-glass">
            <div className="transporte-main-track">
                <div className="track-info">
                    <div className="track-status-badge">{estaSonando ? 'REPRODUCIENDO V-PRO' : 'PAUSADO V-PRO'}</div>
                    <div className="track-time-flex">
                        <span>{formatTime(tickActual)}</span>
                        <div className="transporte-slider-wrap" ref={sliderWrapRef}>
                            {loopTieneInicio && (
                                <>
                                    {loopValido && (
                                        <div
                                            className={`loop-range-highlight ${loopAB.activo ? 'activo' : ''}`}
                                            style={{ left: `${loopInicioPct}%`, width: `${anchoLoopPct}%` }}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        className="loop-marker loop-a"
                                        style={{ left: `${loopInicioPct}%` }}
                                        onPointerDown={(e) => {
                                            e.preventDefault();
                                            setDraggingMarker('start');
                                        }}
                                        title="Arrastra el punto A"
                                    >
                                        A
                                    </button>
                                    {loopTieneFin && (
                                        <button
                                            type="button"
                                            className="loop-marker loop-b"
                                            style={{ left: `${loopFinPct}%` }}
                                            onPointerDown={(e) => {
                                                e.preventDefault();
                                                setDraggingMarker('end');
                                            }}
                                            title="Arrastra el punto B"
                                        >
                                            B
                                        </button>
                                    )}
                                </>
                            )}
                            
                            {punchInTick !== null && (
                                <div 
                                    className="punch-in-marker"
                                    style={{ left: `${(punchInTick / maxSeguro) * 100}%` }}
                                    title="Punto de Punch-In"
                                >
                                    🎯
                                </div>
                            )}

                            <input
                                type="range"
                                className="transporte-slider"
                                min={0}
                                max={totalTicks}
                                value={tickActual}
                                onChange={handleSliderChange}
                            />
                        </div>
                        <span>{formatTime(totalTicks)}</span>
                    </div>
                    {loopTieneInicio && (
                        <div className="loop-status-text">
                            {loopValido
                                ? `A ${formatTime(loopAB.start)} - B ${formatTime(loopAB.end)} ${loopAB.activo ? '- bucle activo' : '- rango listo'}`
                                : `A ${formatTime(loopAB.start)} - marca B para cerrar el bucle`}
                        </div>
                    )}
                </div>

                <div className="transporte-controles">
                    <div className="transporte-bpm-box">
                        <span className="bpm-label">BPM</span>
                        <div className="transporte-bpm-inline">
                            <button className="transporte-bpm-step" onClick={() => onCambiarBpm((prev) => Math.max(40, prev - 5))}>-</button>
                            <span className="bpm-value">{bpm}</span>
                            <button className="transporte-bpm-step" onClick={() => onCambiarBpm((prev) => Math.min(240, prev + 5))}>+</button>
                        </div>
                        <input
                            type="range"
                            className="transporte-bpm-slider"
                            min={40}
                            max={240}
                            value={bpm}
                            onChange={(e) => onCambiarBpm(Number(e.target.value))}
                        />
                    </div>

                    <div className="controles-grupo">
                        <button className="btn-circulo small" onClick={() => onBuscarTick(Math.max(0, tickActual - 500))}>
                            <Rewind size={16} fill="white" />
                        </button>

                        <button
                            className={`btn-circulo grande ${estaSonando ? 'activo' : ''}`}
                            onClick={onAlternarPausa}
                            title={reproduciendo ? "Pausar" : "Reproducir"}
                        >
                            {estaSonando ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" style={{ marginLeft: 3 }} />}
                        </button>

                        <button 
                            className="btn-circulo small" 
                            onClick={onDetener}
                            title="Detener / Resetear"
                        >
                            <Square size={16} fill="white" />
                        </button>

                        <button className="btn-circulo small" onClick={() => onBuscarTick(Math.min(totalTicks, tickActual + 500))}>
                            <FastForward size={16} fill="white" />
                        </button>
                    </div>

                    <div className="transporte-opciones">
                        <button className="opcion-tag opcion-boton" onClick={onMarcarLoopInicio}>A</button>
                        <button className="opcion-tag opcion-boton" onClick={onMarcarLoopFin}>B</button>
                        <button className={`opcion-tag opcion-boton ${loopAB.activo ? 'activo' : ''}`} onClick={onAlternarLoop}>
                            <Repeat size={14} /> {loopAB.activo ? 'Bucle on' : 'Bucle off'}
                        </button>
                        <button className="opcion-tag opcion-boton" onClick={onLimpiarLoop}>Limpiar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(BarraTransporte);
