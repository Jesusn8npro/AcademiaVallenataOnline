import React, { useCallback, useRef } from 'react';
import type { NotaHero, SeccionV2 } from '../tipos';

const PALETA = [
  { bg: 'rgba(34,211,238,0.18)', borde: '#22d3ee' },
  { bg: 'rgba(168,85,247,0.18)', borde: '#a855f7' },
  { bg: 'rgba(236,72,153,0.18)', borde: '#ec4899' },
  { bg: 'rgba(251,191,36,0.18)', borde: '#fbbf24' },
  { bg: 'rgba(34,197,94,0.18)', borde: '#22c55e' },
  { bg: 'rgba(248,113,113,0.18)', borde: '#f87171' },
];

interface Props {
  totalTicks: number;
  tickActual: number;
  secuencia: NotaHero[];
  secciones: SeccionV2[];
  punchInTick?: number | null;
  punchOutTick?: number | null;
  bpm: number;
  resolucion: number;
  onSeek(tick: number): void;
}

function fmt(seg: number) {
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg - m * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const TimelineV2: React.FC<Props> = ({
  totalTicks, tickActual, secuencia, secciones,
  punchInTick, punchOutTick, bpm, resolucion, onSeek,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const safeMax = Math.max(totalTicks, 1);
  const segPorTick = 60 / bpm / resolucion;
  const duracionSeg = safeMax * segPorTick;
  const tiempoActualSeg = tickActual * segPorTick;

  const handleClick = useCallback((e: React.MouseEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    onSeek(Math.floor(ratio * safeMax));
  }, [onSeek, safeMax]);

  return (
    <div className="grabv2-timeline">
      <div className="grabv2-timeline-tiempos">
        <span className="grabv2-tiempo-actual">{fmt(tiempoActualSeg)}</span>
        <span className="grabv2-tiempo-sep">/</span>
        <span className="grabv2-tiempo-total">{fmt(duracionSeg)}</span>
      </div>
      <div className="grabv2-timeline-wrap" ref={wrapRef} onClick={handleClick}>
        {/* Bandas de secciones */}
        {secciones.map((s, i) => {
          const color = PALETA[i % PALETA.length];
          const left = (s.tickInicio / safeMax) * 100;
          const width = ((s.tickFin - s.tickInicio) / safeMax) * 100;
          return (
            <div
              key={s.id}
              className="grabv2-banda"
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 0.5)}%`,
                background: color.bg,
                borderLeft: `2px solid ${color.borde}`,
              }}
              title={`${s.nombre}: ${fmt(s.tickInicio * segPorTick)} → ${fmt(s.tickFin * segPorTick)}`}
            >
              {width > 5 && <span className="grabv2-banda-label" style={{ color: color.borde }}>{s.nombre}</span>}
            </div>
          );
        })}

        {/* Marcas de notas (densidad visual) */}
        {secuencia.length > 0 && secuencia.length < 800 && secuencia.map((n, i) => (
          <div
            key={i}
            className="grabv2-nota-marca"
            style={{ left: `${(n.tick / safeMax) * 100}%`, width: `${Math.max(0.15, (n.duracion / safeMax) * 100)}%` }}
          />
        ))}

        {/* Punch markers */}
        {punchInTick != null && (
          <div className="grabv2-marker grabv2-marker-in" style={{ left: `${(punchInTick / safeMax) * 100}%` }} title="Punch IN" />
        )}
        {punchOutTick != null && (
          <div className="grabv2-marker grabv2-marker-out" style={{ left: `${(punchOutTick / safeMax) * 100}%` }} title="Punch OUT" />
        )}

        {/* Playhead */}
        <div className="grabv2-playhead" style={{ left: `${(tickActual / safeMax) * 100}%` }} />
      </div>
    </div>
  );
};

export default React.memo(TimelineV2);
