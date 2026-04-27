import React from 'react';
import { Volume2 } from 'lucide-react';

interface Props { estudio: any; }

const SeccionAdminEfectos: React.FC<Props> = ({ estudio }) => (
  <div className="estudio-practica-libre-seccion">
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Mezcla funcional</div>
      <label className="estudio-practica-libre-slider-row">
        <span>Volumen acordeon</span><strong>{estudio.volumenAcordeon}%</strong>
        <input type="range" min={0} max={100} value={estudio.volumenAcordeon}
          onChange={(e) => estudio.ajustarVolumenAcordeon(Number(e.target.value))} />
      </label>
      <label className="estudio-practica-libre-slider-row">
        <span>Volumen pista</span><strong>{estudio.preferencias.efectos.volumenPista}%</strong>
        <input type="range" min={0} max={100} value={estudio.preferencias.efectos.volumenPista}
          onChange={(e) => estudio.actualizarEfectos({ volumenPista: Number(e.target.value) })} />
      </label>
    </div>
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Preset FX</div>
      {(['reverb', 'bajos', 'medios', 'agudos'] as const).map((fx) => (
        <label key={fx} className="estudio-practica-libre-slider-row">
          <span>{fx.charAt(0).toUpperCase() + fx.slice(1)}</span>
          <strong>{estudio.preferencias.efectos[fx]}{fx === 'reverb' ? '%' : ''}</strong>
          <input type="range" min={fx === 'reverb' ? 0 : -12} max={fx === 'reverb' ? 100 : 12}
            value={estudio.preferencias.efectos[fx]}
            onChange={(e) => estudio.actualizarEfectos({ [fx]: Number(e.target.value) })} />
        </label>
      ))}
    </div>
    <div className="estudio-practica-libre-bloque">
      <label className="estudio-practica-libre-switch-row">
        <div>
          <strong>Reiniciar pista al grabar</strong>
          <span>Mantiene sincronizada la toma desde cero.</span>
        </div>
        <button
          className={`estudio-practica-libre-switch ${estudio.preferencias.efectos.autoReiniciarPista ? 'activo' : ''}`}
          onClick={() => estudio.actualizarEfectos({ autoReiniciarPista: !estudio.preferencias.efectos.autoReiniciarPista })}>
          <span />
        </button>
      </label>
      <div className="estudio-practica-libre-aviso-fx"><Volume2 size={15} />Valores guardados en preset de practica.</div>
    </div>
  </div>
);

export default SeccionAdminEfectos;
