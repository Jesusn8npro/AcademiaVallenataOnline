import React from 'react';
import { ChevronRight } from 'lucide-react';
import { MODELOS_VISUALES_ACORDEON } from '../Datos/modelosVisualesAcordeon';
import type { ModeloVisualAcordeon, PistaPracticaLibre, PreferenciasPracticaLibre, SeccionPanelPracticaLibre } from '../TiposPracticaLibre';
import SeccionPLSonido from './SeccionPLSonido';
import SeccionPLPistas, { type ModoGrabacionPL } from './SeccionPLPistas';
import SeccionPLEfectos from './SeccionPLEfectos';
import PanelEfectosAudio from '../../../../componentes/Efectos/PanelEfectosAudio';
import SeccionPLLibreria from './SeccionPLLibreria';
import type { CancionHeroConTonalidad } from '../../TiposProMax';
import type { MetronomoComun } from '../../../../Core/audio/metronomoSonidos';

interface PanelLateralEstudianteProps {
  visible: boolean;
  seccionActiva: SeccionPanelPracticaLibre | null;
  tonalidadSeleccionada: string;
  listaTonalidades: string[];
  timbreActivo: string;
  onSeleccionarTonalidad: (tonalidad: string) => void;
  onSeleccionarTimbre: (timbre: 'Brillante' | 'Armonizado') => void;
  instrumentoId: string;
  listaInstrumentos: any[];
  onSeleccionarInstrumento: (id: string) => void;
  modoVista: string;
  modosVista: Array<{ valor: any; label: string }>;
  onSeleccionarVista: (vista: any) => void;
  onAbrirEditorAvanzado: () => void;
  modeloActivo: ModeloVisualAcordeon;
  onSeleccionarModelo: (modeloId: string) => void;
  preferencias: PreferenciasPracticaLibre;
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
  onActualizarEfectos: (cambios: Partial<PreferenciasPracticaLibre['efectos']>) => void;
  volumenAcordeon: number;
  onAjustarVolumenAcordeon: (valor: number) => void;
  onSeleccionarCancionHero?: (cancion: CancionHeroConTonalidad) => void;
  onSeleccionarSeccionHero?: (cancion: CancionHeroConTonalidad, seccion: any) => void;
  modoGrabacion: ModoGrabacionPL;
  onCambiarModoGrabacion: (modo: ModoGrabacionPL) => void;
  metronomo: MetronomoComun;
  grabando: boolean;
  tiempoGrabacionTexto: string;
  onAlternarGrabacion: () => void;
}

const TITULO_SECCION: Partial<Record<SeccionPanelPracticaLibre, string>> = {
  sonido: 'Sonido y lectura', modelos: 'Modelos visuales',
  pistas: 'Pistas y Estudio', teoria: 'Teoria musical', efectos: 'Efectos y mezcla',
  libreria: 'Librería de canciones',
};

const PanelLateralEstudiante: React.FC<PanelLateralEstudianteProps> = ({
  visible, seccionActiva, tonalidadSeleccionada, listaTonalidades, timbreActivo,
  onSeleccionarTonalidad, onSeleccionarTimbre, instrumentoId, listaInstrumentos,
  onSeleccionarInstrumento, modoVista, modosVista, onSeleccionarVista, onAbrirEditorAvanzado,
  modeloActivo, onSeleccionarModelo, preferencias, pistaActiva, pistasDisponibles,
  cargandoPistas, reproduciendoPista, tiempoPista, duracionPista, onSeleccionarPista,
  onLimpiarPista, onAlternarReproduccionPista, onReiniciarPista, onCargarArchivoLocal,
  onAlternarCapa, onActualizarEfectos, volumenAcordeon, onAjustarVolumenAcordeon,
  onSeleccionarCancionHero, onSeleccionarSeccionHero,
  modoGrabacion, onCambiarModoGrabacion, metronomo,
  grabando, tiempoGrabacionTexto, onAlternarGrabacion,
}) => {
  if (!visible || !seccionActiva) return null;
  if (!['sonido', 'modelos', 'pistas', 'efectos', 'libreria'].includes(seccionActiva)) return null;

  return (
    <aside className="estudio-practica-libre-panel">
      <div className="estudio-practica-libre-panel-encabezado">
        <div>
          <span className="estudio-practica-libre-panel-kicker">Panel del estudio</span>
          <h3>{TITULO_SECCION[seccionActiva] || seccionActiva}</h3>
        </div>
        <div className="estudio-practica-libre-chip-simple">
          <ChevronRight size={14} />{tonalidadSeleccionada}
        </div>
      </div>

      {seccionActiva === 'sonido' && (
        <SeccionPLSonido
          tonalidadSeleccionada={tonalidadSeleccionada} listaTonalidades={listaTonalidades}
          timbreActivo={timbreActivo} onSeleccionarTonalidad={onSeleccionarTonalidad}
          onSeleccionarTimbre={onSeleccionarTimbre} instrumentoId={instrumentoId}
          listaInstrumentos={listaInstrumentos} onSeleccionarInstrumento={onSeleccionarInstrumento}
          modoVista={modoVista} modosVista={modosVista} onSeleccionarVista={onSeleccionarVista}
          onAbrirEditorAvanzado={onAbrirEditorAvanzado}
        />
      )}

      {seccionActiva === 'modelos' && (
        <div className="estudio-practica-libre-seccion">
          <div className="estudio-practica-libre-bloque">
            <div className="estudio-practica-libre-bloque-titulo">Elegí tu acordeón</div>
            <div className="estudio-practica-libre-modelos-lista">
              {MODELOS_VISUALES_ACORDEON.map((modelo) => (
                <button
                  key={modelo.id}
                  className={`estudio-practica-libre-modelo-row ${modeloActivo.id === modelo.id ? 'activo' : ''}`}
                  onClick={() => onSeleccionarModelo(modelo.id)}
                >
                  <div className="estudio-practica-libre-modelo-row-img">
                    <img src={modelo.imagen} alt={modelo.nombre} />
                  </div>
                  <div className="estudio-practica-libre-modelo-row-info">
                    <strong>{modelo.nombre}</strong>
                    <span>{modelo.descripcion}</span>
                  </div>
                  {modeloActivo.id === modelo.id && (
                    <div className="estudio-practica-libre-modelo-row-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {seccionActiva === 'pistas' && (
        <SeccionPLPistas
          pistaActiva={pistaActiva} pistasDisponibles={pistasDisponibles}
          cargandoPistas={cargandoPistas} reproduciendoPista={reproduciendoPista}
          tiempoPista={tiempoPista} duracionPista={duracionPista}
          onSeleccionarPista={onSeleccionarPista} onLimpiarPista={onLimpiarPista}
          onAlternarReproduccionPista={onAlternarReproduccionPista} onReiniciarPista={onReiniciarPista}
          onCargarArchivoLocal={onCargarArchivoLocal} onAlternarCapa={onAlternarCapa}
          preferencias={preferencias}
          modoGrabacion={modoGrabacion}
          onCambiarModoGrabacion={onCambiarModoGrabacion}
          metronomo={metronomo}
          grabando={grabando}
          tiempoGrabacionTexto={tiempoGrabacionTexto}
          onAlternarGrabacion={onAlternarGrabacion}
        />
      )}

      {seccionActiva === 'efectos' && (
        <PanelEfectosAudio
          reverbActivo={preferencias.efectos.reverb > 0}
          reverbIntensidad={preferencias.efectos.reverb}
          reverbPreset={preferencias.efectos.reverbPreset}
          onCambiarReverbActivo={(activo) => onActualizarEfectos({ reverb: activo ? Math.max(preferencias.efectos.reverb, 25) : 0 })}
          onCambiarReverbIntensidad={(v) => onActualizarEfectos({ reverb: v })}
          onCambiarReverbPreset={(preset) => onActualizarEfectos({ reverbPreset: preset })}
          graves={preferencias.efectos.bajos}
          medios={preferencias.efectos.medios}
          agudos={preferencias.efectos.agudos}
          onCambiarGraves={(v) => onActualizarEfectos({ bajos: v })}
          onCambiarMedios={(v) => onActualizarEfectos({ medios: v })}
          onCambiarAgudos={(v) => onActualizarEfectos({ agudos: v })}
          volumenTeclado={volumenAcordeon}
          volumenBajos={volumenAcordeon}
          volumenLoops={preferencias.efectos.volumenPista}
          volumenMetronomo={50}
          onCambiarVolumenTeclado={onAjustarVolumenAcordeon}
          onCambiarVolumenBajos={onAjustarVolumenAcordeon}
          onCambiarVolumenLoops={(v) => onActualizarEfectos({ volumenPista: v })}
          onCambiarVolumenMetronomo={() => { /* preview-only en Práctica Libre */ }}
          onRestaurar={() => onActualizarEfectos({ reverb: 0, bajos: 0, medios: 0, agudos: 0 })}
        />
      )}

      {seccionActiva === 'libreria' && onSeleccionarCancionHero && (
        <SeccionPLLibreria
          onSeleccionarCancion={onSeleccionarCancionHero}
          onSeleccionarSeccion={onSeleccionarSeccionHero}
        />
      )}
    </aside>
  );
};

export default PanelLateralEstudiante;
