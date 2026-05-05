import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Music, Sliders } from 'lucide-react';
import type { MetronomoV2, SonidoMetronomoV2 } from '../hooks/useMetronomoV2';
import { SONIDOS_METRONOMO } from '../hooks/useMetronomoV2';
import './PanelMetronomoStudio.css';

interface Props {
  met: MetronomoV2;
}

/**
 * Panel del metrónomo con el look exacto del admin (`PanelMetronomoInline` original) pero usando
 * mi `useMetronomoV2` reloj-aware. UI: botón grande INICIAR azul, indicador de pulsos con acento
 * en el beat 1, filas con Velocidad / Tempo / Subdivisión / Efecto / Volumen.
 */
const PanelMetronomoStudio: React.FC<Props> = ({ met }) => {
  const [vistaSonidos, setVistaSonidos] = useState(false);

  return (
    <div className="metstudio-cuerpo">
      {!vistaSonidos ? (
        <>
          <button
            className={`metstudio-btn-principal ${met.activo ? 'detener' : 'iniciar'}`}
            onClick={() => met.setActivo(!met.activo)}
          >
            {met.activo ? 'DETENER' : 'INICIAR'}
          </button>

          <div className="metstudio-pulsos">
            {Array.from({ length: met.compas }).map((_, i) => (
              <div
                key={i}
                className={`metstudio-pulso ${met.pulsoActual === i ? 'activo' : ''} ${i === 0 ? 'acento' : ''}`}
              />
            ))}
          </div>

          <FilaAjuste
            label="Velocidad"
            sublabel="Tempo en BPM"
            valor={met.bpm}
            onInc={() => met.setBpm(met.bpm + 1)}
            onDec={() => met.setBpm(met.bpm - 1)}
          />
          <FilaAjuste
            label="Tempo"
            sublabel="Pulsos por compás"
            valor={met.compas}
            onInc={() => met.setCompas(Math.min(12, met.compas + 1))}
            onDec={() => met.setCompas(Math.max(1, met.compas - 1))}
          />
          <FilaAjuste
            label="Subdivisión"
            sublabel="Clics por pulso"
            valor={met.subdivision}
            onInc={() => met.setSubdivision(Math.min(4, met.subdivision + 1))}
            onDec={() => met.setSubdivision(Math.max(1, met.subdivision - 1))}
          />

          <button className="metstudio-fila clickable" onClick={() => setVistaSonidos(true)}>
            <span className="metstudio-label">Efecto de Sonido</span>
            <span className="metstudio-valor-flecha">
              <span>{met.sonido}</span>
              <ChevronRight size={18} />
            </span>
          </button>

          <div className="metstudio-fila vertical">
            <span className="metstudio-label">Volumen</span>
            <div className="metstudio-volumen">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={met.volumen}
                onChange={(e) => met.setVolumen(parseFloat(e.target.value))}
                className="metstudio-slider"
              />
              <Sliders size={18} className="metstudio-icono-vol" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="metstudio-cabecera">
            <button className="metstudio-back" onClick={() => setVistaSonidos(false)}>
              <ChevronLeft size={20} />
            </button>
            <h3 className="metstudio-titulo">Efectos</h3>
          </div>
          <div className="metstudio-lista-sonidos">
            {SONIDOS_METRONOMO.map((s: SonidoMetronomoV2) => (
              <button
                key={s}
                className={`metstudio-item-sonido ${met.sonido === s ? 'activo' : ''}`}
                onClick={() => {
                  met.setSonido(s);
                  setVistaSonidos(false);
                }}
              >
                <span className="metstudio-nombre-icono">
                  <Music size={16} />
                  <span>{s}</span>
                </span>
                {met.sonido === s && <span className="metstudio-check">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const FilaAjuste: React.FC<{
  label: string;
  sublabel: string;
  valor: number;
  onInc(): void;
  onDec(): void;
}> = ({ label, sublabel, valor, onInc, onDec }) => (
  <div className="metstudio-fila">
    <div className="metstudio-info">
      <span className="metstudio-label">{label}</span>
      <span className="metstudio-sublabel">{sublabel}</span>
    </div>
    <div className="metstudio-control-inc-dec">
      <button onClick={onDec}><ChevronLeft size={20} /></button>
      <span className="metstudio-valor">{valor}</span>
      <button onClick={onInc}><ChevronRight size={20} /></button>
    </div>
  </div>
);

export default React.memo(PanelMetronomoStudio);
