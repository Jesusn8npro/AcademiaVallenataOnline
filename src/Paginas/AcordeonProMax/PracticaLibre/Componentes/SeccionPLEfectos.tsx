import React from 'react';
import { Volume2 } from 'lucide-react';
import type { PreferenciasPracticaLibre } from '../TiposPracticaLibre';

interface Props {
  preferencias: PreferenciasPracticaLibre;
  volumenAcordeon: number;
  onAjustarVolumenAcordeon: (valor: number) => void;
  onActualizarEfectos: (cambios: Partial<PreferenciasPracticaLibre['efectos']>) => void;
}

const SeccionPLEfectos: React.FC<Props> = ({ preferencias, volumenAcordeon, onAjustarVolumenAcordeon, onActualizarEfectos }) => (
  <div className="estudio-practica-libre-seccion">
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Mezcla funcional</div>
      <label className="estudio-practica-libre-slider-row">
        <span>Volumen acordeon</span><strong>{volumenAcordeon}%</strong>
        <input type="range" min={0} max={100} value={volumenAcordeon} onChange={(e) => onAjustarVolumenAcordeon(Number(e.target.value))} />
      </label>
      <label className="estudio-practica-libre-slider-row">
        <span>Volumen pista</span><strong>{preferencias.efectos.volumenPista}%</strong>
        <input type="range" min={0} max={100} value={preferencias.efectos.volumenPista} onChange={(e) => onActualizarEfectos({ volumenPista: Number(e.target.value) })} />
      </label>
    </div>
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Preset guardado de FX</div>
      <label className="estudio-practica-libre-slider-row">
        <span>Reverb</span><strong>{preferencias.efectos.reverb}%</strong>
        <input type="range" min={0} max={100} value={preferencias.efectos.reverb} onChange={(e) => onActualizarEfectos({ reverb: Number(e.target.value) })} />
      </label>
      <label className="estudio-practica-libre-slider-row">
        <span>Graves</span><strong>{preferencias.efectos.bajos}</strong>
        <input type="range" min={-12} max={12} value={preferencias.efectos.bajos} onChange={(e) => onActualizarEfectos({ bajos: Number(e.target.value) })} />
      </label>
      <label className="estudio-practica-libre-slider-row">
        <span>Medios</span><strong>{preferencias.efectos.medios}</strong>
        <input type="range" min={-12} max={12} value={preferencias.efectos.medios} onChange={(e) => onActualizarEfectos({ medios: Number(e.target.value) })} />
      </label>
      <label className="estudio-practica-libre-slider-row">
        <span>Agudos</span><strong>{preferencias.efectos.agudos}</strong>
        <input type="range" min={-12} max={12} value={preferencias.efectos.agudos} onChange={(e) => onActualizarEfectos({ agudos: Number(e.target.value) })} />
      </label>
    </div>
    <div className="estudio-practica-libre-bloque">
      <label className="estudio-practica-libre-switch-row">
        <div>
          <strong>Reiniciar pista al grabar</strong>
          <span>Ideal para mantener sincronizada la toma desde cero.</span>
        </div>
        <button
          className={`estudio-practica-libre-switch ${preferencias.efectos.autoReiniciarPista ? 'activo' : ''}`}
          onClick={() => onActualizarEfectos({ autoReiniciarPista: !preferencias.efectos.autoReiniciarPista })}>
          <span />
        </button>
      </label>
      <div className="estudio-practica-libre-aviso-fx">
        <Volume2 size={15} />Los valores de reverb y ecualizador ya quedan guardados en tu preset de practica.
      </div>
    </div>
  </div>
);

export default SeccionPLEfectos;
