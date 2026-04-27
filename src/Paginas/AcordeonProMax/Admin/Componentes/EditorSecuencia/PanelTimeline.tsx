import React from 'react';
import { Play, Pause, RotateCcw, Zap, SkipBack, SkipForward, Activity } from 'lucide-react';
import type { NotaHero } from '../../../TiposProMax';
import { PALETA_SECCIONES, formatearTiempoDesdeTicks, fmtSeg } from './tiposEditor';
import type { Seccion } from './tiposEditor';

interface PanelTimelineProps {
  secciones: Seccion[];
  totalTicksModal: number;
  bpmModal: number;
  setBpmModal: (v: number) => void;
  onCambiarBpm: (v: number) => void;
  punchInTickLocal: number | null;
  secuenciaEditada: NotaHero[];
  sliderRef: React.RefObject<HTMLInputElement>;
  isSeekingRef: React.MutableRefObject<boolean>;
  tickLocal: number;
  tiempoAudioActual: number;
  duracionAudio: number;
  reproduciendoLocal: boolean;
  handleSeek: (val: number) => void;
  handleReset: () => void;
  saltarSegundos: (seg: number) => void;
  togglePlay: () => void;
  timelineAbierto: boolean;
  setTimelineAbierto: (v: (prev: boolean) => boolean) => void;
}

const PanelTimeline: React.FC<PanelTimelineProps> = ({
  secciones, totalTicksModal, bpmModal, setBpmModal, onCambiarBpm,
  punchInTickLocal, secuenciaEditada, sliderRef, isSeekingRef,
  tickLocal, tiempoAudioActual, duracionAudio, reproduciendoLocal,
  handleSeek, handleReset, saltarSegundos, togglePlay,
  timelineAbierto, setTimelineAbierto,
}) => (
  <section className="editor-seccion">
    <button
      className={`secciones-cabecera-acordeon ${timelineAbierto ? 'abierto' : ''}`}
      onClick={() => setTimelineAbierto(v => !v)}
    >
      <div className="editor-seccion-titulo" style={{ marginBottom: 0 }}>
        <Activity size={16} /> Timeline &amp; Control
        {reproduciendoLocal && (
          <span className="secciones-contador-badge">▶ Reproduciendo</span>
        )}
      </div>
      <div className="secciones-cabecera-derecha">
        <span className="secciones-acordeon-icono">▼</span>
      </div>
    </button>

    <div className={`secciones-cuerpo-acordeon ${timelineAbierto ? 'abierto' : ''}`}>
      <div className="editor-reproductor-principal">
        <div className="editor-timeline-visual">
          {secciones.map((s, i) => {
            const color = PALETA_SECCIONES[i % PALETA_SECCIONES.length];
            const leftPct = (s.tickInicio / totalTicksModal) * 100;
            const widthPct = ((s.tickFin - s.tickInicio) / totalTicksModal) * 100;
            return (
              <div
                key={i}
                className="timeline-banda-seccion"
                style={{
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 0.5)}%`,
                  background: color.bg,
                  borderLeft: `2px solid ${color.borde}`,
                }}
                title={`${s.nombre}: ${formatearTiempoDesdeTicks(s.tickInicio, bpmModal)} → ${formatearTiempoDesdeTicks(s.tickFin, bpmModal)}`}
              >
                {widthPct > 5 && (
                  <span className="timeline-etiqueta-seccion" style={{ color: color.texto }}>
                    {s.nombre}
                  </span>
                )}
              </div>
            );
          })}

          {secuenciaEditada.length > 0 && (() => {
            const finNotas = Math.max(...secuenciaEditada.map(n => n.tick + n.duracion));
            return (
              <div
                className="timeline-zona-notas"
                style={{ width: `${(finNotas / totalTicksModal) * 100}%` }}
                title="Zona cubierta por la secuencia"
              />
            );
          })()}

          {punchInTickLocal !== null && (
            <div
              className="timeline-punto-punch"
              style={{ left: `${(punchInTickLocal / totalTicksModal) * 100}%` }}
            />
          )}

          <input
            ref={sliderRef}
            type="range"
            min={0} max={totalTicksModal} defaultValue={0} step={1}
            className="timeline-control-seek"
            onPointerDown={() => { isSeekingRef.current = true; }}
            onPointerUp={e => {
              isSeekingRef.current = false;
              handleSeek(Number((e.target as HTMLInputElement).value));
            }}
            onPointerCancel={() => { isSeekingRef.current = false; }}
            onChange={e => handleSeek(Number(e.target.value))}
          />
        </div>

        <div className="editor-tiempos-fila">
          <div className="bloque-tiempo principal">
            <span className="actual">{formatearTiempoDesdeTicks(tickLocal, bpmModal)}</span>
            <span className="sep">/</span>
            <span className="total">{formatearTiempoDesdeTicks(totalTicksModal, bpmModal)}</span>
          </div>
          {duracionAudio > 0 && (
            <div className="bloque-tiempo secundario">
              🎵 MP3: {fmtSeg(tiempoAudioActual, true)} / {fmtSeg(duracionAudio)}
            </div>
          )}
        </div>

        <div className="editor-controles-reproduccion">
          <button onClick={handleReset} className="editor-boton-icono" title="Al inicio">
            <RotateCcw size={18} />
          </button>
          <button onClick={() => saltarSegundos(-10)} className="editor-boton-icono" title="Atrás 10s">
            <SkipBack size={20} />
          </button>
          <button
            onClick={togglePlay}
            className={`editor-boton-play-grande ${reproduciendoLocal ? 'activo' : ''}`}
          >
            {reproduciendoLocal ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
          </button>
          <button onClick={() => saltarSegundos(10)} className="editor-boton-icono" title="Adelante 10s">
            <SkipForward size={20} />
          </button>
          <div className="editor-control-bpm-mini">
            <Zap size={14} />
            <input
              type="number" value={bpmModal}
              onChange={e => {
                const v = Number(e.target.value);
                setBpmModal(v);
                onCambiarBpm(v);
              }}
            />
            <span>BPM</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default PanelTimeline;
