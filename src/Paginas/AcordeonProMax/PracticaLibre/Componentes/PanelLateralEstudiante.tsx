import * as React from 'react'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react';
import { MODELOS_VISUALES_ACORDEON } from '../Datos/modelosVisualesAcordeon';
import type { ModeloVisualAcordeon, PistaPracticaLibre, PreferenciasPracticaLibre, SeccionPanelPracticaLibre } from '../TiposPracticaLibre';
import SeccionPLSonido from './SeccionPLSonido';
import SeccionPLPistas, { type ModoGrabacionPL } from './SeccionPLPistas';
import SeccionPLEfectos from './SeccionPLEfectos';
// Panel de efectos unificado: el de SimuladorApp se usa tambien en escritorio
// (antes habia un PanelEfectosAudio ~85% duplicado). Misma logica y props.
import PanelEfectosSimulador from '@/Paginas/SimuladorApp/Componentes/PanelEfectosSimulador';
import SeccionPLLibreria from './SeccionPLLibreria';
import SeccionPL3D, { type VarianteId } from './SeccionPL3D';
import type { PresetAcordeon } from '../Servicios/servicioPresetsAcordeon';
import SeccionPLPersonaje from './SeccionPLPersonaje';
import type { AnimShapeKeyId, AnimProgramaticaId, InfoPieza, NombresCajasConfig, NombreCajaConfig } from './VisorAcordeon3D';
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
  // Visor 3D
  visor3dPiezaSeleccionada: string | null;
  visor3dPiezas: InfoPieza[];
  visor3dGrupoActivo: string;
  onCambiarVisor3DGrupo: (grupo: string) => void;
  onAplicarVisor3DTinta: (hex: string) => void;
  onAplicarVisor3DVariante: (id: VarianteId) => void;
  onDispararVisor3DShapeKey: (id: AnimShapeKeyId) => void;
  onDispararVisor3DProgramatica: (id: AnimProgramaticaId) => void;
  onDetenerVisor3DProgramatica: () => void;
  visor3dProgramaticaActiva: AnimProgramaticaId | null;
  onCopiarVisor3DColor: () => void;
  onPegarVisor3DColor: () => void;
  hayVisor3DColorCopiado: boolean;
  visor3dNombresCajas: NombresCajasConfig;
  onCambiarVisor3DNombreCaja: (caja: 'melodia' | 'bajos', patch: Partial<NombreCajaConfig>) => void;
  visor3dColoresBase: Record<string, string>;
  visor3dPresets: PresetAcordeon[];
  onGuardarVisor3DPreset: (nombre: string) => Promise<{ ok: boolean; error?: string }>;
  onAplicarVisor3DPreset: (preset: PresetAcordeon) => void;
  onEliminarVisor3DPreset: (id: string) => Promise<{ ok: boolean; error?: string }>;
  visor3dSkinSeleccionado: string;
  visor3dPresetAplicadoId: string | null;
  onSeleccionarVisor3DModelo: (skin: string) => void;
  // Grabador de pistas (dentro de "Pistas y Estudio" → Mis pistas): usa la lógica compartida.
  logica: any;
}

const TITULO_SECCION: Partial<Record<SeccionPanelPracticaLibre, string>> = {
  sonido: 'Sonido y lectura', modelos: 'Modelos visuales',
  pistas: 'Pistas y Estudio', teoria: 'Teoria musical', efectos: 'Efectos y mezcla',
  libreria: 'Librería de canciones', visor3d: 'Visor 3D del acordeón',
  personaje3d: 'Personaje 3D',
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
  visor3dPiezaSeleccionada, visor3dPiezas, visor3dGrupoActivo,
  onCambiarVisor3DGrupo, onAplicarVisor3DTinta, onAplicarVisor3DVariante,
  onDispararVisor3DShapeKey, onDispararVisor3DProgramatica,
  onDetenerVisor3DProgramatica, visor3dProgramaticaActiva,
  onCopiarVisor3DColor, onPegarVisor3DColor, hayVisor3DColorCopiado,
  visor3dNombresCajas, onCambiarVisor3DNombreCaja,
  visor3dColoresBase, visor3dPresets,
  onGuardarVisor3DPreset, onAplicarVisor3DPreset, onEliminarVisor3DPreset,
  visor3dSkinSeleccionado, visor3dPresetAplicadoId, onSeleccionarVisor3DModelo,
  logica,
}) => {
  if (!visible || !seccionActiva) return null;
  if (!['sonido', 'modelos', 'pistas', 'efectos', 'libreria', 'visor3d', 'personaje3d'].includes(seccionActiva)) return null;

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
                  <div className="estudio-practica-libre-modelo-row-img" style={{ position: 'relative' }}>
                    <Image src={modelo.imagen} alt={modelo.nombre} fill style={{ objectFit: 'cover' }} />
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
          logica={logica}
        />
      )}

      {seccionActiva === 'efectos' && (
        <PanelEfectosSimulador
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

      {seccionActiva === 'visor3d' && (
        <SeccionPL3D
          piezaSeleccionada={visor3dPiezaSeleccionada}
          piezasDisponibles={visor3dPiezas}
          grupoActivo={visor3dGrupoActivo}
          onCambiarGrupoActivo={onCambiarVisor3DGrupo}
          onAplicarTinta={onAplicarVisor3DTinta}
          onAplicarVariante={onAplicarVisor3DVariante}
          onDispararShapeKey={onDispararVisor3DShapeKey}
          onDispararProgramatica={onDispararVisor3DProgramatica}
          onDetenerProgramatica={onDetenerVisor3DProgramatica}
          programaticaActiva={visor3dProgramaticaActiva}
          onCopiarColor={onCopiarVisor3DColor}
          onPegarColor={onPegarVisor3DColor}
          hayColorCopiado={hayVisor3DColorCopiado}
          nombresCajas={visor3dNombresCajas}
          onCambiarNombreCaja={onCambiarVisor3DNombreCaja}
          coloresBase={visor3dColoresBase}
          presets={visor3dPresets}
          onGuardarPreset={onGuardarVisor3DPreset}
          onAplicarPreset={onAplicarVisor3DPreset}
          onEliminarPreset={onEliminarVisor3DPreset}
          skinSeleccionado={visor3dSkinSeleccionado}
          presetAplicadoId={visor3dPresetAplicadoId}
          onSeleccionarModelo={onSeleccionarVisor3DModelo}
        />
      )}

      {seccionActiva === 'personaje3d' && <SeccionPLPersonaje />}
    </aside>
  );
};

export default PanelLateralEstudiante;
