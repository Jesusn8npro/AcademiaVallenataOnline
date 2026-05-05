import React, { useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp, Activity } from 'lucide-react';
import type { EventoCaptura } from '../tipos';

interface Props {
  eventos: EventoCaptura[];
  bpm: number;
  resolucion: number;
}

function fmtTiempo(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = (seg - m * 60).toFixed(2);
  return `${m}:${s.padStart(5, '0')}`;
}

const VisorCapturaEnVivo: React.FC<Props> = ({ eventos, bpm, resolucion }) => {
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listaRef.current) listaRef.current.scrollTop = listaRef.current.scrollHeight;
  }, [eventos.length]);

  const totalCapturados = eventos.length;
  const desvPromedio = eventos.length
    ? eventos.reduce((s, e) => s + Math.abs(e.desviacionMs), 0) / eventos.length
    : 0;

  return (
    <div className="grabv2-visor">
      <div className="grabv2-visor-header">
        <div className="grabv2-visor-titulo">
          <Activity size={14} />
          <span>Captura en vivo</span>
        </div>
        <div className="grabv2-visor-stats">
          <span><b>{totalCapturados}</b> eventos</span>
          <span>desv. media <b>{desvPromedio.toFixed(0)}ms</b></span>
        </div>
      </div>

      <div className="grabv2-visor-lista" ref={listaRef}>
        {eventos.length === 0 && (
          <div className="grabv2-visor-vacio">Esperando notas… toca un botón del acordeón.</div>
        )}
        {eventos.map((e, i) => {
          const beat = (e.tick / resolucion).toFixed(2);
          const claseDesv = Math.abs(e.desviacionMs) < 30
            ? 'ok'
            : Math.abs(e.desviacionMs) < 80 ? 'warn' : 'bad';
          const flecha = e.desviacionMs > 5
            ? <ArrowDown size={11} />
            : e.desviacionMs < -5 ? <ArrowUp size={11} /> : null;
          return (
            <div key={i} className={`grabv2-visor-item accion-${e.accion}`}>
              <span className="grabv2-visor-tick">t{e.tick}</span>
              <span className="grabv2-visor-beat">b{beat}</span>
              <span className="grabv2-visor-tiempo">{fmtTiempo(e.tiempoSeg)}</span>
              <span className="grabv2-visor-boton">{e.botonId}</span>
              <span className={`grabv2-visor-desv ${claseDesv}`}>
                {flecha}
                {e.desviacionMs >= 0 ? '+' : ''}{e.desviacionMs.toFixed(0)}ms
              </span>
            </div>
          );
        })}
      </div>

      <div className="grabv2-visor-leyenda">
        BPM <b>{bpm}</b> · resol. <b>{resolucion}</b> · 1 beat = {resolucion} ticks · ↓ atrasada · ↑ adelantada
      </div>
    </div>
  );
};

export default React.memo(VisorCapturaEnVivo);
