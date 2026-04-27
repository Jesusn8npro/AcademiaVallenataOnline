import React from 'react';
import { Check, Pause, Play, RotateCcw, Square, Upload } from 'lucide-react';
import type { PistaPracticaLibre, PreferenciasPracticaLibre } from '../TiposPracticaLibre';

interface Props {
  pistaActiva: PistaPracticaLibre | null;
  pistasDisponibles: PistaPracticaLibre[];
  cargandoPistas: boolean;
  reproduciendoPista: boolean;
  tiempoPista: string;
  duracionPista: string;
  onSeleccionarPista: (pista: PistaPracticaLibre) => void;
  onLimpiarPista: () => void;
  onAlternarReproduccionPista: () => void;
  onReiniciarPista: () => void;
  onCargarArchivoLocal: (archivo: File) => void;
  onAlternarCapa: (capaId: string) => void;
  preferencias: PreferenciasPracticaLibre;
}

const SeccionPLPistas: React.FC<Props> = ({
  pistaActiva, pistasDisponibles, cargandoPistas, reproduciendoPista,
  tiempoPista, duracionPista, onSeleccionarPista, onLimpiarPista,
  onAlternarReproduccionPista, onReiniciarPista, onCargarArchivoLocal,
  onAlternarCapa, preferencias,
}) => (
  <div className="estudio-practica-libre-seccion">
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Pista activa</div>
      <div className="estudio-practica-libre-pista-activa">
        <div>
          <strong>{pistaActiva?.nombre || 'Sin pista seleccionada'}</strong>
          <span>
            {pistaActiva
              ? `${tiempoPista} / ${duracionPista}${pistaActiva.bpm ? ` · ${pistaActiva.bpm} BPM` : ''}`
              : 'Carga una pista local o elige una del catalogo.'}
          </span>
        </div>
        <div className="estudio-practica-libre-pista-botones">
          <button className="estudio-practica-libre-icon-btn" onClick={onAlternarReproduccionPista} disabled={!pistaActiva}>
            {reproduciendoPista ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button className="estudio-practica-libre-icon-btn" onClick={onReiniciarPista} disabled={!pistaActiva}><RotateCcw size={15} /></button>
          <button className="estudio-practica-libre-icon-btn" onClick={onLimpiarPista} disabled={!pistaActiva}><Square size={15} /></button>
        </div>
      </div>
    </div>
    <div className="estudio-practica-libre-bloque">
      <label className="estudio-practica-libre-carga-local">
        <Upload size={16} />Cargar pista local
        <input type="file" accept="audio/mp3,audio/wav,audio/ogg,audio/mpeg"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onCargarArchivoLocal(f); e.target.value = ''; }} />
      </label>
    </div>
    {pistaActiva?.capas && pistaActiva.capas.length > 0 && (
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Capas sincronizadas</div>
        <div className="estudio-practica-libre-grid-chips">
          {pistaActiva.capas.map((capa) => (
            <button key={capa.id}
              className={`estudio-practica-libre-chip-boton ${preferencias.capasActivas.includes(capa.id) ? 'activo' : ''}`}
              onClick={() => onAlternarCapa(capa.id)}>{capa.nombre}</button>
          ))}
        </div>
      </div>
    )}
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Catalogo disponible</div>
      <div className="estudio-practica-libre-lista-vertical pista-lista">
        {cargandoPistas && <div className="estudio-practica-libre-vacio">Cargando pistas disponibles...</div>}
        {!cargandoPistas && pistasDisponibles.length === 0 && (
          <div className="estudio-practica-libre-vacio">Todavia no hay pistas precargadas. Ya puedes probar con una pista local.</div>
        )}
        {pistasDisponibles.map((pista) => (
          <button key={pista.id}
            className={`estudio-practica-libre-item-lista ${pistaActiva?.id === pista.id ? 'activo' : ''}`}
            onClick={() => onSeleccionarPista(pista)}>
            <div>
              <strong>{pista.nombre}</strong>
              <span>{[pista.artista, pista.tonalidad, pista.bpm ? `${pista.bpm} BPM` : null].filter(Boolean).join(' · ') || 'Pista de practica'}</span>
            </div>
            {pistaActiva?.id === pista.id && <Check size={16} />}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default SeccionPLPistas;
