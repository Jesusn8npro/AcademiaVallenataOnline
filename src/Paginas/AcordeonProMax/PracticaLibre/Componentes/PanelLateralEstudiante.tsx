import React from 'react';
import { ChevronRight } from 'lucide-react';
import { MODELOS_VISUALES_ACORDEON } from '../Datos/modelosVisualesAcordeon';
import type { ModeloVisualAcordeon, PistaPracticaLibre, PreferenciasPracticaLibre, SeccionPanelPracticaLibre } from '../TiposPracticaLibre';
import SeccionAdminTeoria from '../../Admin/Componentes/SeccionAdminTeoria';
import SeccionPLSonido from './SeccionPLSonido';
import SeccionPLPistas from './SeccionPLPistas';
import SeccionPLEfectos from './SeccionPLEfectos';

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
}

const TITULO_SECCION: Partial<Record<SeccionPanelPracticaLibre, string>> = {
  sonido: 'Sonido y lectura', modelos: 'Modelos visuales',
  pistas: 'Pistas y capas', teoria: 'Teoria musical', efectos: 'Efectos y mezcla',
};

const PanelLateralEstudiante: React.FC<PanelLateralEstudianteProps> = ({
  visible, seccionActiva, tonalidadSeleccionada, listaTonalidades, timbreActivo,
  onSeleccionarTonalidad, onSeleccionarTimbre, instrumentoId, listaInstrumentos,
  onSeleccionarInstrumento, modoVista, modosVista, onSeleccionarVista, onAbrirEditorAvanzado,
  modeloActivo, onSeleccionarModelo, preferencias, pistaActiva, pistasDisponibles,
  cargandoPistas, reproduciendoPista, tiempoPista, duracionPista, onSeleccionarPista,
  onLimpiarPista, onAlternarReproduccionPista, onReiniciarPista, onCargarArchivoLocal,
  onAlternarCapa, onActualizarEfectos, volumenAcordeon, onAjustarVolumenAcordeon,
}) => {
  if (!visible || !seccionActiva) return null;
  if (!['sonido', 'modelos', 'pistas', 'teoria', 'efectos'].includes(seccionActiva)) return null;

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
          <div className="estudio-practica-libre-grid-modelos">
            {MODELOS_VISUALES_ACORDEON.map((modelo) => (
              <button key={modelo.id}
                className={`estudio-practica-libre-modelo-card ${modeloActivo.id === modelo.id ? 'activo' : ''}`}
                onClick={() => onSeleccionarModelo(modelo.id)}>
                <div className="estudio-practica-libre-modelo-imagen-wrap">
                  <img src={modelo.imagen} alt={modelo.nombre} className="estudio-practica-libre-modelo-imagen" />
                </div>
                <strong>{modelo.nombre}</strong><span>{modelo.descripcion}</span>
              </button>
            ))}
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
        />
      )}

      {seccionActiva === 'teoria' && (
        <SeccionAdminTeoria tonalidadSeleccionada={tonalidadSeleccionada} mostrarTeoriaCircular={!!preferencias.mostrarTeoriaCircular} />
      )}

      {seccionActiva === 'efectos' && (
        <SeccionPLEfectos
          preferencias={preferencias} volumenAcordeon={volumenAcordeon}
          onAjustarVolumenAcordeon={onAjustarVolumenAcordeon} onActualizarEfectos={onActualizarEfectos}
        />
      )}
    </aside>
  );
};

export default PanelLateralEstudiante;
