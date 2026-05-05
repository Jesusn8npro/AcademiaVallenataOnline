import React from 'react';
import { Check, Pause, Play, RotateCcw, Square, Upload, Mic2, Music2, Activity, Circle } from 'lucide-react';
import type { PistaPracticaLibre, PreferenciasPracticaLibre } from '../TiposPracticaLibre';
import type { MetronomoComun } from '../../../../Core/audio/metronomoSonidos';
import PanelMetronomoStudio from '../../GrabadorV2/componentes/PanelMetronomoStudio';

export type ModoGrabacionPL = 'libre' | 'pista' | 'metronomo';

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
  modoGrabacion: ModoGrabacionPL;
  onCambiarModoGrabacion: (modo: ModoGrabacionPL) => void;
  metronomo: MetronomoComun;
  // REC integrado al panel — el alumno arma su modo y graba en el mismo lugar.
  grabando: boolean;
  tiempoGrabacionTexto: string;
  onAlternarGrabacion: () => void;
}

const MODOS: Array<{ clave: ModoGrabacionPL; label: string; descripcion: string; icono: React.ReactNode }> = [
  { clave: 'libre',     label: 'Solo acordeón', descripcion: 'Sin pista ni metrónomo', icono: <Mic2 size={14} /> },
  { clave: 'pista',     label: 'Con pista',     descripcion: 'MP3 de fondo',           icono: <Music2 size={14} /> },
  { clave: 'metronomo', label: 'Metrónomo',     descripcion: 'Pulso para guiarte',     icono: <Activity size={14} /> },
];

const SeccionPLPistas: React.FC<Props> = ({
  pistaActiva, pistasDisponibles, cargandoPistas, reproduciendoPista,
  tiempoPista, duracionPista, onSeleccionarPista, onLimpiarPista,
  onAlternarReproduccionPista, onReiniciarPista, onCargarArchivoLocal,
  onAlternarCapa, preferencias,
  modoGrabacion, onCambiarModoGrabacion, metronomo,
  grabando, tiempoGrabacionTexto, onAlternarGrabacion,
}) => (
  <div className="estudio-practica-libre-seccion">
    <div className="estudio-practica-libre-bloque">
      <div className="estudio-practica-libre-bloque-titulo">Modo de grabación</div>
      <div className="estudio-practica-libre-grid-chips">
        {MODOS.map(({ clave, label, descripcion, icono }) => (
          <button
            key={clave}
            className={`estudio-practica-libre-chip-boton ${modoGrabacion === clave ? 'activo' : ''}`}
            onClick={() => onCambiarModoGrabacion(clave)}
            disabled={grabando}
            title={descripcion}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {icono}{label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>
        {MODOS.find((m) => m.clave === modoGrabacion)?.descripcion}
      </div>
      <button
        className={`estudio-practica-libre-btn-grabar ${grabando ? 'grabando' : ''}`}
        onClick={onAlternarGrabacion}
        style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
      >
        <Circle size={14} fill={grabando ? 'currentColor' : 'none'} />
        {grabando ? `Detener REC ${tiempoGrabacionTexto}` : 'REC'}
      </button>
    </div>

    {modoGrabacion === 'pista' && (
      <>
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
      </>
    )}

    {modoGrabacion === 'metronomo' && (
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Metrónomo</div>
        <PanelMetronomoStudio met={metronomo} />
      </div>
    )}

    {modoGrabacion === 'libre' && (
      <div className="estudio-practica-libre-bloque">
        <div style={{ fontSize: 13, opacity: 0.85, padding: '8px 4px' }}>
          Vas a grabar solo lo que toques en el acordeón. Sin pista de fondo y sin metrónomo —
          práctica libre pura. Cuando quieras, cambiá de modo arriba.
        </div>
      </div>
    )}
  </div>
);

export default SeccionPLPistas;
