import React from 'react';
import { Check, Pause, Play, RotateCcw, Square, Upload } from 'lucide-react';
import { formatearDuracion } from '../../PracticaLibre/Utilidades/SecuenciaLogic';

interface Props { estudio: any; }

const SeccionAdminPistas: React.FC<Props> = ({ estudio }) => (
  <div className="estudio-practica-libre-seccion">
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Pista activa</div>
      <div className="estudio-practica-libre-pista-activa">
        <div>
          <strong>{estudio.pistaActiva?.nombre || 'Sin pista seleccionada'}</strong>
          <span>{estudio.pistaActiva
            ? `${formatearDuracion(estudio.tiempoPistaActual * 1000)} / ${formatearDuracion(estudio.duracionPista * 1000)}`
            : 'Carga una pista local o elige una del catalogo.'}</span>
        </div>
        <div className="estudio-practica-libre-pista-botones">
          <button className="estudio-practica-libre-icon-btn" onClick={estudio.alternarReproduccionPista} disabled={!estudio.pistaActiva}>
            {estudio.reproduciendoPista ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button className="estudio-practica-libre-icon-btn" onClick={() => estudio.reiniciarPista(estudio.reproduciendoPista)} disabled={!estudio.pistaActiva}><RotateCcw size={15} /></button>
          <button className="estudio-practica-libre-icon-btn" onClick={estudio.limpiarPistaSeleccionada} disabled={!estudio.pistaActiva}><Square size={15} /></button>
        </div>
      </div>
    </div>
    <div className="estudio-practica-libre-bloque">
      <label className="estudio-practica-libre-carga-local">
        <Upload size={16} />Cargar pista local
        <input type="file" accept="audio/mp3,audio/wav,audio/ogg,audio/mpeg"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) estudio.cargarArchivoLocal(f); e.target.value = ''; }} />
      </label>
    </div>
    {estudio.pistaActiva?.capas?.length > 0 && (
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Capas sincronizadas</div>
        <div className="estudio-practica-libre-grid-chips">
          {estudio.pistaActiva.capas.map((capa: any) => (
            <button key={capa.id}
              className={`estudio-practica-libre-chip-boton ${estudio.preferencias.capasActivas.includes(capa.id) ? 'activo' : ''}`}
              onClick={() => estudio.alternarCapa(capa.id)}>{capa.nombre}</button>
          ))}
        </div>
      </div>
    )}
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Catalogo</div>
      <div className="estudio-practica-libre-lista-vertical pista-lista">
        {estudio.cargandoPistas && <div className="estudio-practica-libre-vacio">Cargando...</div>}
        {estudio.pistasDisponibles.map((pista: any) => (
          <button key={pista.id}
            className={`estudio-practica-libre-item-lista ${estudio.pistaActiva?.id === pista.id ? 'activo' : ''}`}
            onClick={() => estudio.seleccionarPista(pista)}>
            <div><strong>{pista.nombre}</strong><span>{pista.artista || ''}</span></div>
            {estudio.pistaActiva?.id === pista.id && <Check size={16} />}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default SeccionAdminPistas;
