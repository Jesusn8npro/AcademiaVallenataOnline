/**
 * 🎵 REPRODUCTOR REC - INDEPENDIENTE
 * Reproductor limpio y funcional para el modo REC / Grabación Pro
 * NO depende de otros reproductores, totalmente autónomo
 */

import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import './ReproductorRec.css';

interface ReproductorRecProps {
  // Canción a reproducir
  cancion: any;
  bpm: number;
  // Control de reproducción
  reproduciendo: boolean;
  pausado: boolean;
  onAlternarPausa: () => void;
  onDetener: () => void;
  onBuscarTick: (tick: number) => void;
  // Estado del reproductor
  tickActual: number;
  totalTicks: number;
  // Loop
  loopAB?: { start: number; end: number; activo: boolean };
  onSetLoop?: (start: number, end: number) => void;
}

const ReproductorRec: React.FC<ReproductorRecProps> = ({
  cancion,
  bpm,
  reproduciendo,
  pausado,
  onAlternarPausa,
  onDetener,
  onBuscarTick,
  tickActual,
  totalTicks,
  loopAB,
  onSetLoop
}) => {
  const animationFrameRef = useRef<number | null>(null);

  // Formatea tiempo en MM:SS
  const formatearTiempo = (ticks: number) => {
    if (!bpm || !cancion) return '0:00';
    const resolucion = 192;
    const segundos = Math.floor((ticks / resolucion) * (60 / bpm));
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const duracionTotal = formatearTiempo(totalTicks);
  const tiempoActual = formatearTiempo(tickActual);

  // Navegar 5 segundos adelante/atrás
  const navegarSegundos = (segundos: number) => {
    const resolucion = 192;
    const ticksPorSegundo = (bpm / 60) * resolucion;
    const ticksNuevos = Math.max(0, Math.min(totalTicks, tickActual + (ticksPorSegundo * segundos)));
    onBuscarTick(ticksNuevos);
  };

  // Ir al inicio/fin
  const irAlInicio = () => onBuscarTick(0);
  const irAlFinal = () => onBuscarTick(Math.max(0, totalTicks - 1));

  return (
    <div className="reproductor-rec-container">
      {/* === BARRA DE PROGRESO === */}
      <div className="reproductor-rec-progress">
        <div className="reproductor-rec-progress-bar">
          <input
            type="range"
            min="0"
            max={totalTicks}
            value={tickActual}
            onChange={(e) => onBuscarTick(Number(e.target.value))}
            className="reproductor-rec-slider"
          />
          <div
            className="reproductor-rec-progress-fill"
            style={{ width: `${(tickActual / Math.max(1, totalTicks)) * 100}%` }}
          />
        </div>
      </div>

      {/* === TIEMPO === */}
      <div className="reproductor-rec-tiempo">
        <span className="reproductor-rec-tiempo-actual">{tiempoActual}</span>
        <span className="reproductor-rec-tiempo-separador">/</span>
        <span className="reproductor-rec-tiempo-total">{duracionTotal}</span>
      </div>

      {/* === CONTROLES PRINCIPALES === */}
      <div className="reproductor-rec-controles">
        <button
          className="reproductor-rec-btn reproductor-rec-btn-pequeño"
          onClick={irAlInicio}
          title="Ir al inicio"
        >
          <SkipBack size={16} />
        </button>

        <button
          className="reproductor-rec-btn reproductor-rec-btn-pequeño"
          onClick={() => navegarSegundos(-5)}
          title="Retroceder 5s"
        >
          -5s
        </button>

        <button
          className="reproductor-rec-btn reproductor-rec-btn-principal"
          onClick={onAlternarPausa}
          title={reproduciendo && !pausado ? 'Pausar' : 'Reproducir'}
        >
          {reproduciendo && !pausado ? (
            <Pause size={20} />
          ) : (
            <Play size={20} />
          )}
          <span>{reproduciendo && !pausado ? 'Pausar' : 'Reproducir'}</span>
        </button>

        <button
          className="reproductor-rec-btn reproductor-rec-btn-pequeño"
          onClick={() => navegarSegundos(5)}
          title="Avanzar 5s"
        >
          +5s
        </button>

        <button
          className="reproductor-rec-btn reproductor-rec-btn-pequeño"
          onClick={irAlFinal}
          title="Ir al final"
        >
          <SkipForward size={16} />
        </button>

        <button
          className="reproductor-rec-btn reproductor-rec-btn-peligro"
          onClick={onDetener}
          title="Detener"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* === INFO DE BPM === */}
      <div className="reproductor-rec-info">
        <span className="reproductor-rec-info-label">BPM:</span>
        <span className="reproductor-rec-info-valor">{bpm}</span>
      </div>

      {/* === LOOP (Opcional) === */}
      {loopAB && (
        <div className="reproductor-rec-loop">
          <span className="reproductor-rec-loop-label">Loop A-B:</span>
          <span className="reproductor-rec-loop-state">
            {loopAB.activo ? '✓ Activo' : 'Inactivo'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ReproductorRec;
