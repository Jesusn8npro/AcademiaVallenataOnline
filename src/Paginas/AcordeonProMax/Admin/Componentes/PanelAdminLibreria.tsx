import React from 'react';
import { Play, Trash2, Music, Pencil, X, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../../../../servicios/clienteSupabase';
import { eliminarCancionHero, eliminarCancionesHero } from '../../../../servicios/cancionesHeroService';
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
  cancionEditandoId?: string | null;
  cancionActualizada?: CancionHero | null;
}

const TIPO_ICONO: Record<string, string> = {
  cancion: '🎵',
  ejercicio: '📚',
  secuencia: '🎼',
};

const DIFICULTAD_COLOR: Record<string, string> = {
  BASICO: '#22c55e',
  INTERMEDIO: '#f59e0b',
  PROFESIONAL: '#ef4444',
};

const PanelAdminLibreria: React.FC<PanelAdminLibreriaProps> = ({
  onReproducir,
  onEditarSecuencia,
  cancionEditandoId = null,
  cancionActualizada = null,
}) => {
  const [canciones, setCanciones] = React.useState<CancionHero[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [filtroTipo, setFiltroTipo] = React.useState<'todos' | 'cancion' | 'ejercicio' | 'secuencia'>('todos');
  const [confirmEliminar, setConfirmEliminar] = React.useState<string | null>(null);
  const [modoSeleccion, setModoSeleccion] = React.useState(false);
  const [seleccionados, setSeleccionados] = React.useState<Set<string>>(new Set());
  const [confirmarBulk, setConfirmarBulk] = React.useState(false);
  const [eliminando, setEliminando] = React.useState(false);

  React.useEffect(() => {
    cargarCanciones();
  }, []);

  React.useEffect(() => {
    if (!cancionActualizada?.id) return;
    setCanciones((prev) =>
      prev.map((c) => (c.id === cancionActualizada.id ? { ...c, ...cancionActualizada } : c))
    );
  }, [cancionActualizada]);

  const cargarCanciones = async () => {
    try {
      const { data, error } = await supabase
        .from('canciones_hero' as any)
        .select('*')
        .order('creado_en', { ascending: false });
      if (error) throw error;
      setCanciones(data || []);
    } catch { } finally {
      setCargando(false);
    }
  };

  const eliminarCancion = async (id: string) => {
    if (confirmEliminar !== id) { setConfirmEliminar(id); return; }
    setConfirmEliminar(null);
    try {
      await eliminarCancionHero(id);
      setCanciones((prev) => prev.filter((c) => c.id !== id));
    } catch { }
  };

  const activarSeleccion = () => {
    setModoSeleccion(true);
    setConfirmEliminar(null);
  };

  const cancelarSeleccion = () => {
    setModoSeleccion(false);
    setSeleccionados(new Set());
    setConfirmarBulk(false);
  };

  const alternarSeleccion = (id: string) => {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  };

  const ejecutarBulkDelete = async () => {
    if (!seleccionados.size) return;
    const ids = Array.from(seleccionados);
    setEliminando(true);
    try {
      await eliminarCancionesHero(ids);
      setCanciones((prev) => prev.filter((c) => !seleccionados.has(c.id)));
      setSeleccionados(new Set());
      setConfirmarBulk(false);
      setModoSeleccion(false);
    } catch { } finally {
      setEliminando(false);
    }
  };

  const cancionesFiltradas = canciones.filter(
    (c) => filtroTipo === 'todos' || c.tipo === filtroTipo
  );

  return (
    <div className="pal-root">
      {/* Filtros + botón seleccionar */}
      <div className="pal-filtros">
        {(['todos', 'cancion', 'ejercicio', 'secuencia'] as const).map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            className={`pal-chip ${filtroTipo === tipo ? 'activo' : ''}`}
          >
            {tipo === 'todos' ? 'Todos' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
          </button>
        ))}
        {!modoSeleccion ? (
          <button
            className="pal-chip pal-chip-seleccionar"
            onClick={activarSeleccion}
            title="Seleccionar varias para eliminar"
          >
            <CheckSquare size={12} /> Seleccionar
          </button>
        ) : (
          <button
            className="pal-chip pal-chip-cancelar"
            onClick={cancelarSeleccion}
            title="Salir del modo selección"
          >
            <X size={12} /> Cancelar
          </button>
        )}
      </div>

      {/* Toolbar de selección activa */}
      {modoSeleccion && (
        <div className="pal-toolbar-seleccion">
          {!confirmarBulk ? (
            <>
              <span className="pal-sel-contador">{seleccionados.size} seleccionada{seleccionados.size === 1 ? '' : 's'}</span>
              <button
                className="pal-btn-bulk"
                disabled={!seleccionados.size}
                onClick={() => setConfirmarBulk(true)}
              >
                <Trash2 size={14} /> Eliminar ({seleccionados.size})
              </button>
            </>
          ) : (
            <>
              <span className="pal-sel-contador pal-confirm-text">
                ¿Eliminar {seleccionados.size} canción{seleccionados.size === 1 ? '' : 'es'}?
              </span>
              <button
                className="pal-btn-bulk pal-btn-bulk-danger"
                disabled={eliminando}
                onClick={ejecutarBulkDelete}
              >
                {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
              </button>
              <button
                className="pal-btn-bulk pal-btn-bulk-secundario"
                disabled={eliminando}
                onClick={() => setConfirmarBulk(false)}
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      )}

      {/* Lista */}
      <div className="pal-lista">
        {cargando ? (
          <div className="pal-vacio">Cargando grabaciones...</div>
        ) : cancionesFiltradas.length === 0 ? (
          <div className="pal-vacio">
            <Music size={28} opacity={0.3} />
            <span>No hay grabaciones</span>
          </div>
        ) : (
          cancionesFiltradas.map((cancion) => {
            const dif = cancion.dificultad?.toUpperCase() as string;
            const editando = cancionEditandoId === cancion.id;
            const seleccionado = seleccionados.has(cancion.id);
            const itemClick = modoSeleccion ? () => alternarSeleccion(cancion.id) : undefined;
            return (
              <div
                key={cancion.id}
                className={`pal-item ${editando ? 'editando' : ''} ${modoSeleccion ? 'modo-seleccion' : ''} ${seleccionado ? 'seleccionado' : ''}`}
                onClick={itemClick}
              >
                {modoSeleccion && (
                  <div className="pal-item-checkbox">
                    {seleccionado ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                )}

                <div className="pal-item-icono">
                  {TIPO_ICONO[cancion.tipo] || '🎶'}
                </div>

                <div className="pal-item-info">
                  <div className="pal-item-titulo">{cancion.titulo}</div>
                  <div className="pal-item-meta">
                    <span>{cancion.bpm} BPM</span>
                    <span>·</span>
                    <span>{new Date(cancion.creado_en).toLocaleDateString('es-CO')}</span>
                    <span
                      className="pal-badge"
                      style={{ background: DIFICULTAD_COLOR[dif] ?? '#6b7280' }}
                    >
                      {dif}
                    </span>
                  </div>
                </div>

                {!modoSeleccion && (
                  <div className="pal-item-acciones">
                    <button
                      className="pal-btn verde"
                      onClick={() => onReproducir(cancion)}
                      title="Reproducir"
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                    <button
                      className={`pal-btn azul ${editando ? 'activo' : ''}`}
                      onClick={() => onEditarSecuencia?.(cancion)}
                      title="Abrir editor profesional"
                    >
                      <Pencil size={14} />
                    </button>
                    {confirmEliminar === cancion.id ? (
                      <>
                        <button className="pal-btn rojo" onClick={() => eliminarCancion(cancion.id)} title="Confirmar eliminar">
                          ¿?
                        </button>
                        <button className="pal-btn gris" onClick={() => setConfirmEliminar(null)} title="Cancelar">
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <button
                        className="pal-btn rojo"
                        onClick={() => eliminarCancion(cancion.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PanelAdminLibreria;
