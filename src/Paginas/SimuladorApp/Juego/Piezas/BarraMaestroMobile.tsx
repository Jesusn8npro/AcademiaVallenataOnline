import React from 'react';
import { Play, Pause, RotateCcw, Repeat, ChevronLeft, ChevronRight } from 'lucide-react';
import './BarraMaestroMobile.css';

// Barra de transporte compacta para el modo Maestro en mobile landscape.
// Diferente de BarraTransporte de ProMax: optimizada para una sola fila,
// botones chicos, scrubber fino, sin labels gigantes. Ocupa ~38px de altura.
//
// Controles esenciales: play/pause, scrubber, BPM (slider compacto),
// loop A/B (un solo boton que cicla: marca inicio -> marca fin -> activa
// -> limpia), saltos +/- 500 ticks. Lo demas se queda fuera por espacio.

interface Props {
    reproduciendo: boolean;
    pausado: boolean;
    onAlternarPausa: () => void;
    tickActual: number;
    totalTicks: number;
    onBuscarTick: (tick: number) => void;
    bpm: number;
    onCambiarBpm: (bpm: number | ((prev: number) => number)) => void;
    loopAB: { start: number; end: number; activo: boolean; hasStart: boolean; hasEnd: boolean };
    onMarcarLoopInicio: () => void;
    onMarcarLoopFin: () => void;
    onAlternarLoop: () => void;
    onLimpiarLoop: () => void;
}

const BarraMaestroMobile: React.FC<Props> = ({
    reproduciendo, pausado, onAlternarPausa,
    tickActual, totalTicks, onBuscarTick,
    bpm, onCambiarBpm,
    loopAB, onMarcarLoopInicio, onMarcarLoopFin, onAlternarLoop, onLimpiarLoop,
}) => {
    const maxSeguro = Math.max(totalTicks, 1);
    const enPausa = pausado || !reproduciendo;

    // Loop ciclico en un solo boton: nada -> hasStart -> hasEnd -> activo -> limpia
    const onClickLoop = () => {
        if (!loopAB.hasStart) onMarcarLoopInicio();
        else if (!loopAB.hasEnd) onMarcarLoopFin();
        else if (!loopAB.activo) onAlternarLoop();
        else onLimpiarLoop();
    };

    const estadoLoop = loopAB.activo ? 'activo'
        : loopAB.hasEnd ? 'listo'
        : loopAB.hasStart ? 'a'
        : 'off';

    const labelLoop = estadoLoop === 'off' ? 'A' : estadoLoop === 'a' ? 'B' : estadoLoop === 'listo' ? 'AB' : '✓';

    return (
        <div className="bmm-root" data-touch-allow>
            {/* Saltos + play/pause */}
            <button
                type="button"
                className="bmm-btn"
                onClick={() => onBuscarTick(Math.max(0, tickActual - 500))}
                aria-label="Atrás"
            ><ChevronLeft size={16} /></button>

            <button
                type="button"
                className="bmm-btn bmm-btn-play"
                onClick={onAlternarPausa}
                aria-label={enPausa ? 'Reproducir' : 'Pausar'}
            >
                {enPausa ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
            </button>

            <button
                type="button"
                className="bmm-btn"
                onClick={() => onBuscarTick(Math.min(maxSeguro, tickActual + 500))}
                aria-label="Adelante"
            ><ChevronRight size={16} /></button>

            {/* Scrubber */}
            <input
                type="range"
                className="bmm-scrubber"
                min={0}
                max={maxSeguro}
                value={Math.min(tickActual, maxSeguro)}
                onChange={(e) => onBuscarTick(parseInt(e.target.value))}
                aria-label="Posición de la canción"
            />

            {/* BPM compacto: slider + valor */}
            <div className="bmm-bpm" title="Velocidad (BPM)">
                <span className="bmm-bpm-label">BPM</span>
                <input
                    type="range"
                    className="bmm-bpm-slider"
                    min={40}
                    max={240}
                    value={bpm}
                    onChange={(e) => onCambiarBpm(parseInt(e.target.value))}
                />
                <span className="bmm-bpm-valor">{bpm}</span>
            </div>

            {/* Loop ciclico (un boton) + reset */}
            <button
                type="button"
                className={`bmm-btn bmm-btn-loop bmm-loop-${estadoLoop}`}
                onClick={onClickLoop}
                aria-label="Loop A/B"
                title={
                    estadoLoop === 'off' ? 'Marcar inicio del loop'
                    : estadoLoop === 'a' ? 'Marcar fin del loop'
                    : estadoLoop === 'listo' ? 'Activar loop'
                    : 'Limpiar loop'
                }
            >
                <Repeat size={14} />
                <span className="bmm-loop-letra">{labelLoop}</span>
            </button>

            <button
                type="button"
                className="bmm-btn"
                onClick={() => { if (!enPausa) onAlternarPausa(); onBuscarTick(0); }}
                aria-label="Reiniciar"
                title="Volver al inicio"
            ><RotateCcw size={14} /></button>
        </div>
    );
};

export default React.memo(BarraMaestroMobile);
