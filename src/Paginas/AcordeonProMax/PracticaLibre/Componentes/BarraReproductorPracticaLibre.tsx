import React, { useRef } from 'react';
import { Play, Pause, FastForward, Rewind, Square } from 'lucide-react';
import '../EstudioPracticaLibre.css';

interface BarraReproductorPracticaLibreProps {
  reproduciendo: boolean;
  pausado: boolean;
  onAlternarPausa: () => void;
  onDetener: () => void;
  tickActual: number;
  totalTicks: number;
  onBuscarTick: (tick: number) => void;
  bpm: number;
  onCambiarBpm: (bpm: number | ((prev: number) => number)) => void;
}

const BarraReproductorPracticaLibre: React.FC<BarraReproductorPracticaLibreProps> = ({
  reproduciendo,
  pausado,
  onAlternarPausa,
  onDetener,
  tickActual,
  totalTicks,
  onBuscarTick,
  bpm,
  onCambiarBpm,
}) => {
  const sliderWrapRef = useRef<HTMLDivElement | null>(null);

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
  const estaSonando = reproduciendo && !pausado;

  return (
    <div className="hero-transporte-container promax-glass" onClick={(e) => e.stopPropagation()}>
      <div className="transporte-main-track">
        <div className="track-info">
          <div className="track-status-badge">
            {estaSonando ? '▶ REPRODUCIENDO PRÁCTICA' : '⏸ PAUSADO PRÁCTICA'}
          </div>
          <div className="track-time-flex">
            <span>{formatTime(tickActual)}</span>
            <div className="transporte-slider-wrap" ref={sliderWrapRef} onClick={(e) => e.stopPropagation()}>
              <input
                type="range"
                className="transporte-slider"
                min={0}
                max={totalTicks}
                value={tickActual}
                onChange={handleSliderChange}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              />
            </div>
            <span>{formatTime(totalTicks)}</span>
          </div>
        </div>

        <div className="transporte-controles" onClick={(e) => e.stopPropagation()}>
          <div className="transporte-bpm-box">
            <span className="bpm-label">BPM</span>
            <div className="transporte-bpm-inline">
              <button
                className="transporte-bpm-step"
                onClick={(e) => {
                  e.stopPropagation();
                  onCambiarBpm((prev) => Math.max(40, prev - 5));
                }}
              >
                -
              </button>
              <span className="bpm-value">{bpm}</span>
              <button
                className="transporte-bpm-step"
                onClick={(e) => {
                  e.stopPropagation();
                  onCambiarBpm((prev) => Math.min(240, prev + 5));
                }}
              >
                +
              </button>
            </div>
            <input
              type="range"
              className="transporte-bpm-slider"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) => {
                e.stopPropagation();
                onCambiarBpm(Number(e.target.value));
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
          </div>

          <div className="controles-grupo">
            <button
              className="btn-circulo small"
              onClick={(e) => {
                e.stopPropagation();
                onBuscarTick(Math.max(0, tickActual - 500));
              }}
              title="Retroceder 5s"
            >
              <Rewind size={16} fill="white" />
            </button>

            <button
              className={`btn-circulo grande ${estaSonando ? 'activo' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onAlternarPausa();
              }}
              title={reproduciendo ? 'Pausar' : 'Reproducir'}
            >
              {estaSonando ? (
                <Pause size={24} fill="white" />
              ) : (
                <Play size={24} fill="white" style={{ marginLeft: 3 }} />
              )}
            </button>

            <button
              className="btn-circulo small"
              onClick={(e) => {
                e.stopPropagation();
                onDetener();
              }}
              title="Detener / Resetear"
            >
              <Square size={16} fill="white" />
            </button>

            <button
              className="btn-circulo small"
              onClick={(e) => {
                e.stopPropagation();
                onBuscarTick(Math.min(totalTicks, tickActual + 500));
              }}
              title="Avanzar 5s"
            >
              <FastForward size={16} fill="white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BarraReproductorPracticaLibre);
