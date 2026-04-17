import React from 'react';
import { Play, Trash2, Music, Pencil, Target, Save, X, Scissors } from 'lucide-react';
import { supabase } from '../../../../servicios/clienteSupabase';
import './PanelAdminLibreria.css';

interface CancionHero {
  id: string;
  titulo: string;
  autor?: string | null;
  descripcion?: string | null;
  bpm: number;
  tipo: 'cancion' | 'ejercicio' | 'secuencia';
  dificultad: 'BASICO' | 'INTERMEDIO' | 'PROFESIONAL' | 'basico' | 'intermedio' | 'profesional';
  creado_en: string;
  audio_fondo_url: string | null;
  tonalidad?: string | null;
  youtube_id?: string | null;
  resolucion?: number | null;
  secuencia_json: any;
  secuencia?: any;
}

interface PanelAdminLibreriaProps {
  onReproducir: (cancion: CancionHero) => void;
  onEditarSecuencia?: (cancion: CancionHero) => void;
  onMarcarEntradaEdicion?: () => void;
  onMarcarSalidaEdicion?: () => void;
  onIniciarPunchIn?: () => void;
  onGuardarEdicionSecuencia?: () => void;
  onCancelarEdicionSecuencia?: () => void;
  onLimpiarRangoEdicion?: () => void;
  cancionEditandoId?: string | null;
  tituloCancionEditando?: string | null;
  bpmCancionEditando?: number;
  tickActual?: number;
  punchInTick?: number | null;
  punchOutTick?: number | null;
  preRollSegundos?: number;
  setPreRollSegundos?: (segundos: number) => void;
  esperandoPunchIn?: boolean;
  grabandoEdicionSecuencia?: boolean;
  guardandoEdicionSecuencia?: boolean;
  hayCambiosEdicionSecuencia?: boolean;
  mensajeEdicionSecuencia?: string | null;
  cancionActualizada?: CancionHero | null;
}

function formatearTiempoDesdeTicks(ticks: number, bpm: number) {
  const segundosTotales = Math.max(0, Math.floor((ticks / 192) * (60 / Math.max(1, bpm))));
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

const PanelAdminLibreria: React.FC<PanelAdminLibreriaProps> = ({
  onReproducir,
  onEditarSecuencia,
  onMarcarEntradaEdicion,
  onMarcarSalidaEdicion,
  onIniciarPunchIn,
  onGuardarEdicionSecuencia,
  onCancelarEdicionSecuencia,
  onLimpiarRangoEdicion,
  cancionEditandoId = null,
  tituloCancionEditando = null,
  bpmCancionEditando = 120,
  tickActual = 0,
  punchInTick = null,
  punchOutTick = null,
  preRollSegundos = 4,
  setPreRollSegundos,
  esperandoPunchIn = false,
  grabandoEdicionSecuencia = false,
  guardandoEdicionSecuencia = false,
  hayCambiosEdicionSecuencia = false,
  mensajeEdicionSecuencia = null,
  cancionActualizada = null,
}) => {
  const [canciones, setCanciones] = React.useState<CancionHero[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [filtroTipo, setFiltroTipo] = React.useState<'todos' | 'cancion' | 'ejercicio' | 'secuencia'>('todos');

  React.useEffect(() => {
    cargarCanciones();
  }, []);

  React.useEffect(() => {
    if (!cancionActualizada?.id) return;

    setCanciones((previas) => previas.map((cancion) => (
      cancion.id === cancionActualizada.id
        ? { ...cancion, ...cancionActualizada }
        : cancion
    )));
  }, [cancionActualizada]);

  const cargarCanciones = async () => {
    try {
      const { data, error } = await supabase
        .from('canciones_hero' as any)
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) throw error;
      setCanciones(data || []);
    } catch (error) {
      console.error('Error cargando canciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const cancionesFiltradas = canciones.filter(
    (c) => filtroTipo === 'todos' || c.tipo === filtroTipo
  );

  const hayEditorActivo = Boolean(cancionEditandoId);
  const puedeGrabarPunch = punchInTick !== null && !esperandoPunchIn && !grabandoEdicionSecuencia && !guardandoEdicionSecuencia;
  const descripcionEntrada = punchInTick !== null ? formatearTiempoDesdeTicks(punchInTick, bpmCancionEditando) : '--:--';
  const descripcionSalida = punchOutTick !== null ? formatearTiempoDesdeTicks(punchOutTick, bpmCancionEditando) : 'Manual';

  const eliminarCancion = async (id: string) => {
    if (!confirm('¿Eliminar esta cancion Hero?')) return;
    try {
      await supabase.from('canciones_hero' as any).delete().eq('id', id);
      setCanciones((previas) => previas.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Error eliminando canción:', error);
    }
  };

  const obtenerIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'cancion': return '🎵';
      case 'ejercicio': return '📚';
      case 'secuencia': return '📝';
      default: return '🎶';
    }
  };

  const obtenerColorDificultad = (dificultad: string) => {
    switch (dificultad?.toUpperCase()) {
      case 'BASICO': return '#22c55e';
      case 'INTERMEDIO': return '#f59e0b';
      case 'PROFESIONAL': return '#ef4444';
      default: return '#999';
    }
  };

  return (
    <div className="panel-admin-libreria">
      {/* Filtros */}
      <div className="panel-admin-libreria-filter">
        {(['todos', 'cancion', 'ejercicio', 'secuencia'] as const).map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            className={`panel-admin-libreria-btn ${filtroTipo === tipo ? 'activo' : ''}`}
            style={{ textTransform: 'capitalize' }}
          >
            {tipo}
          </button>
        ))}
      </div>

      {hayEditorActivo && (
        <div className="panel-admin-libreria-editor">
          <div className="panel-admin-libreria-editor-encabezado">
            <div>
              <div className="panel-admin-libreria-editor-kicker">Editor de secuencia</div>
              <strong>{tituloCancionEditando || 'Cancion en edicion'}</strong>
            </div>
            <button
              className="panel-admin-libreria-btn panel-admin-libreria-btn-cerrar"
              onClick={onCancelarEdicionSecuencia}
              title="Cerrar editor"
            >
              <X size={16} />
            </button>
          </div>

          <div className="panel-admin-libreria-editor-resumen">
            <span>Cursor: {formatearTiempoDesdeTicks(tickActual, bpmCancionEditando)}</span>
            <span>Entrada: {descripcionEntrada}</span>
            <span>Salida: {descripcionSalida}</span>
          </div>

          <div className="panel-admin-libreria-editor-campos">
            <label className="panel-admin-libreria-editor-campo">
              <span>Pre-roll</span>
              <input
                type="number"
                min={1}
                max={8}
                step={1}
                value={preRollSegundos}
                onChange={(event) => setPreRollSegundos?.(Math.max(1, Math.min(8, Number(event.target.value) || 4)))}
              />
            </label>
          </div>

          <div className="panel-admin-libreria-editor-acciones">
            <button className="panel-admin-libreria-btn" onClick={onMarcarEntradaEdicion}>
              <Target size={15} /> Entrada aqui
            </button>
            <button className="panel-admin-libreria-btn" onClick={onMarcarSalidaEdicion}>
              <Scissors size={15} /> Salida aqui
            </button>
            <button className="panel-admin-libreria-btn" onClick={onLimpiarRangoEdicion}>
              Limpiar rango
            </button>
          </div>

          <div className="panel-admin-libreria-editor-acciones principales">
            <button
              className="panel-admin-libreria-btn panel-admin-libreria-btn-editar"
              onClick={onIniciarPunchIn}
              disabled={!puedeGrabarPunch}
            >
              {esperandoPunchIn ? 'Pre-roll activo...' : grabandoEdicionSecuencia ? 'Grabando tramo...' : 'Grabar reemplazo'}
            </button>
            <button
              className="panel-admin-libreria-btn panel-admin-libreria-btn-guardar"
              onClick={onGuardarEdicionSecuencia}
              disabled={!hayCambiosEdicionSecuencia || guardandoEdicionSecuencia || grabandoEdicionSecuencia || esperandoPunchIn}
            >
              <Save size={15} /> {guardandoEdicionSecuencia ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>

          {mensajeEdicionSecuencia && (
            <div className="panel-admin-libreria-editor-mensaje">{mensajeEdicionSecuencia}</div>
          )}
        </div>
      )}

      {/* Lista de canciones */}
      <div className="panel-admin-libreria-lista">
        {cargando ? (
          <div className="panel-admin-libreria-vacio">
            <div className="panel-admin-libreria-vacio-text">Cargando grabaciones...</div>
          </div>
        ) : cancionesFiltradas.length === 0 ? (
          <div className="panel-admin-libreria-vacio">
            <div className="panel-admin-libreria-vacio-icon">
              <Music size={24} />
            </div>
            <div className="panel-admin-libreria-vacio-text">No hay grabaciones</div>
          </div>
        ) : (
          cancionesFiltradas.map((cancion) => (
            <div key={cancion.id} className="panel-admin-libreria-item">
              {/* Tipo e info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="panel-admin-libreria-item-meta">
                  <span>{obtenerIconoTipo(cancion.tipo)}</span>
                  <span className="panel-admin-libreria-item-titulo" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cancion.titulo}
                  </span>
                  <span className="panel-admin-libreria-item-badge" style={{ background: obtenerColorDificultad(cancion.dificultad) }}>
                    {cancion.dificultad}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  {cancion.bpm} BPM • {new Date(cancion.creado_en).toLocaleDateString('es-CO')}
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => onReproducir(cancion)}
                  className="panel-admin-libreria-btn panel-admin-libreria-btn-reproducir"
                  title="Reproducir"
                  disabled={esperandoPunchIn || grabandoEdicionSecuencia || guardandoEdicionSecuencia}
                >
                  <Play size={16} />
                </button>
                <button
                  onClick={() => onEditarSecuencia?.(cancion)}
                  className={`panel-admin-libreria-btn panel-admin-libreria-btn-editar ${cancionEditandoId === cancion.id ? 'activo' : ''}`}
                  title="Editar secuencia"
                  disabled={esperandoPunchIn || grabandoEdicionSecuencia || guardandoEdicionSecuencia}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => eliminarCancion(cancion.id)}
                  className="panel-admin-libreria-btn panel-admin-libreria-btn-eliminar"
                  title="Eliminar"
                  disabled={cancionEditandoId === cancion.id || guardandoEdicionSecuencia}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default PanelAdminLibreria;
