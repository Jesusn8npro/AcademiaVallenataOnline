import React from 'react';
import { Play, Trash2, Music } from 'lucide-react';
import { supabase } from '../../../../servicios/clienteSupabase';
import './PanelAdminLibreria.css';

interface CancionHero {
  id: string;
  titulo: string;
  bpm: number;
  tipo: 'cancion' | 'ejercicio' | 'secuencia';
  dificultad: 'BASICO' | 'INTERMEDIO' | 'PROFESIONAL';
  creado_en: string;
  audio_fondo_url: string | null;
  secuencia_json: any;
}

interface PanelAdminLibreriaProps {
  onReproducir: (cancion: CancionHero) => void;
}

const PanelAdminLibreria: React.FC<PanelAdminLibreriaProps> = ({ onReproducir }) => {
  const [canciones, setCanciones] = React.useState<CancionHero[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [filtroTipo, setFiltroTipo] = React.useState<'todos' | 'cancion' | 'ejercicio' | 'secuencia'>('todos');

  React.useEffect(() => {
    cargarCanciones();
  }, []);

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

  const eliminarCancion = async (id: string) => {
    if (!confirm('¿Eliminar esta grabación?')) return;
    try {
      await supabase.from('canciones_hero' as any).delete().eq('id', id);
      setCanciones(canciones.filter((c) => c.id !== id));
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
    switch (dificultad) {
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
                >
                  <Play size={16} />
                </button>
                <button
                  onClick={() => eliminarCancion(cancion.id)}
                  className="panel-admin-libreria-btn panel-admin-libreria-btn-eliminar"
                  title="Eliminar"
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
