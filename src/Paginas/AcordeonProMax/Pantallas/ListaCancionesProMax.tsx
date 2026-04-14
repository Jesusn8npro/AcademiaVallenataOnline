import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './ListaCancionesProMax.css';
import NavbarProMax from '../Componentes/NavbarProMax';
import DetalleCancionProMax from '../Componentes/DetalleCancionProMax';
import FondoEspacialProMax from '../Componentes/FondoEspacialProMax';
import { useCancionesProMax } from '../Hooks/useLogicaProMax';
import type { CancionHeroConTonalidad } from '../TiposProMax';
import { Howl } from 'howler';
import { supabase } from '../../servicios/clienteSupabase';
import { useUsuario } from '../../contextos/UsuarioContext';
import { 
  Search, 
  Star,
  Zap,
  Activity,
  Heart,
  LibraryBig,
  Sparkles,
  Music4
} from 'lucide-react';

// Precargar sonidos de Rhythm+ (Categoría UI/Navegación)
const sonidoHoverSongs = new Howl({ src: ['/audio/effects/ui/deep.mp3'], volume: 0.5 });
const sonidoClickSongs = new Howl({ src: ['/audio/effects/ui/pop.mp3'], volume: 0.6 });

const sonidoHoverTabs  = new Howl({ src: ['/audio/effects/ui/ta.mp3'], volume: 0.4 });
const sonidoClickTabs  = new Howl({ src: ['/audio/effects/ui/slide2.mp3'], volume: 0.5 });

const COLORES_DIFICULTAD: Record<string, string> = {
  basico: '#22c55e',
  intermedio: '#f59e0b',
  profesional: '#ef4444',
};

const ETIQUETAS_DIFICULTAD: Record<string, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  profesional: 'Extremo',
};

type TabTipo = 'todos' | 'recomendados' | 'nuevos' | 'favoritos';

const ListaCancionesProMax: React.FC = () => {
  const { canciones, cargando } = useCancionesProMax();
  const { usuario } = useUsuario();
  const navigate = useNavigate();
  const [cancionSeleccionada, setCancionSeleccionada] = useState<CancionHeroConTonalidad | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [tabActual, setTabActual] = useState<TabTipo>('todos');
  const [idsFavoritos, setIdsFavoritos] = useState<string[]>([]);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // 1. Cargar favoritos del usuario desde Supabase
  useEffect(() => {
    const cargarFavoritos = async () => {
      if (!usuario?.id) return;
      
      const { data, error } = await (supabase
        .from('favoritos_acordeon_hero' as any) as any)
        .select('cancion_id')
        .eq('user_id', usuario.id);

      if (!error && data) {
        setIdsFavoritos(data.map((f: any) => f.cancion_id));
      }
    };

    cargarFavoritos();
  }, [usuario]);

  // Limpiar mensaje de error automáticamente
  useEffect(() => {
    if (mensajeError) {
      const timer = setTimeout(() => setMensajeError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensajeError]);

  // 2. Lógica para alternar favorito
  const toggleFavorito = async (songId: string) => {
    if (!usuario?.id) {
       setMensajeError("Debes iniciar sesión para guardar favoritos.");
       return;
    }

    sonidoClickSongs.play();
    const esFavorito = idsFavoritos.includes(songId);

    if (esFavorito) {
      const { error } = await (supabase
        .from('favoritos_acordeon_hero' as any) as any)
        .delete()
        .eq('user_id', usuario.id)
        .eq('cancion_id', songId);
      
      if (!error) {
        setIdsFavoritos(prev => prev.filter(id => id !== songId));
      }
    } else {
      const { error } = await (supabase
        .from('favoritos_acordeon_hero' as any) as any)
        .insert({ user_id: usuario.id, cancion_id: songId });
      
      if (!error) {
        setIdsFavoritos(prev => [...prev, songId]);
      }
    }
  };

  // 3. Filtrar canciones
  const cancionesFiltradas = useMemo(() => {
    return canciones.filter(c => {
      const coincideBusqueda = 
        c.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.autor.toLowerCase().includes(busqueda.toLowerCase());
      
      if (!coincideBusqueda) return false;

      switch (tabActual) {
        case 'recomendados': return c.dificultad === 'intermedio';
        case 'favoritos': return idsFavoritos.includes(c.id);
        default: return true;
      }
    });
  }, [canciones, busqueda, tabActual, idsFavoritos]);

  const handleEmpezarJuego = useCallback(() => {
    if (cancionSeleccionada) {
      // Priorizar el slug que viene de la base de datos
      const slugReal = cancionSeleccionada.slug ||
                       cancionSeleccionada.titulo
                         .toLowerCase()
                         .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                         .replace(/[^\w\s-]/g, "")
                         .replace(/\s+/g, "-");

      // Navegación SPA limpia: /acordeon-pro-max/acordeon/[slug]
      navigate(`/acordeon-pro-max/acordeon/${slugReal}`);
    }
  }, [cancionSeleccionada, navigate]);

  // Handlers memoizados para evitar funciones inline
  const handleTabClick = useCallback((id: TabTipo) => {
    sonidoClickTabs.play();
    setTabActual(id);
  }, []);

  const handleTabHover = useCallback(() => {
    sonidoHoverTabs.play();
  }, []);

  const handleCancionClick = useCallback((cancion: CancionHeroConTonalidad) => {
    sonidoClickSongs.play();
    setCancionSeleccionada(cancion);
  }, []);

  const handleCancionHover = useCallback(() => {
    sonidoHoverSongs.play();
  }, []);

  return (
    <div className="promax-menu-contenedor">
      <FondoEspacialProMax />
      <NavbarProMax />

      <main className="promax-menu-layout">
        <section className={`promax-menu-lista-wrap ${cancionSeleccionada ? 'colapsado' : ''}`}>
          <header className="promax-menu-header">
            <div className="promax-page-title">Selección de Canciones</div>
            
            <div className="promax-menu-tabs-container">
              <div className="promax-menu-tabs">
                {[
                  { id: 'favoritos', label: 'Favoritos', icono: Heart },
                  { id: 'recomendados', label: 'Destacadas', icono: Sparkles },
                  { id: 'nuevos', label: 'Nuevas', icono: Music4 },
                  { id: 'todos', label: 'Catalogo', icono: LibraryBig }
                ].map(tab => (
                  <React.Fragment key={tab.id}>
                  <button
                    className={`promax-tab ${tabActual === tab.id ? 'activo' : ''}`}
                    onMouseEnter={handleTabHover}
                    onClick={() => handleTabClick(tab.id as TabTipo)}
                  >
                    <tab.icono size={15} />
                    {tab.label}
                  </button>
                    {tab.id !== 'todos' && <span className="promax-tab-divider">|</span>}
                  </React.Fragment>
                ))}
              </div>

              <div className="promax-menu-buscador">
                <Search size={16} className="buscador-icono" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>
          </header>

          <div className="promax-listado-scroll">
            <div className="promax-listado-header">
              <div>
                <h2 className="promax-listado-titulo">Ultimas canciones</h2>
                <p className="promax-listado-subtitulo">Explora el repertorio disponible y elige tu siguiente practica.</p>
              </div>
              <button className="promax-listado-accion" type="button">
                Ver mas
              </button>
            </div>

            {cargando ? (
              <div className="promax-cargando">
                <div className="promax-spinner" />
                <span>Cargando...</span>
              </div>
            ) : cancionesFiltradas.length === 0 ? (
              <div className="promax-lista-vacia">
                <p>No hay canciones en esta lista.</p>
              </div>
            ) : (
              cancionesFiltradas.map(cancion => (
                <div
                  key={cancion.id}
                  className={`promax-cancion-card ${cancionSeleccionada?.id === cancion.id ? 'seleccionada' : ''}`}
                  onMouseEnter={handleCancionHover}
                  onClick={() => handleCancionClick(cancion)}
                >
                  <div className="card-image-wrap">
                    <img 
                      src={cancion.youtube_id ? `https://img.youtube.com/vi/${cancion.youtube_id}/mqdefault.jpg` : '/imagenes/placeholder_acordeon.jpg'} 
                      alt={cancion.titulo} 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  
                  <div className="card-content-wrap">
                    <div className="card-info">
                      <span className="card-titulo">
                        {idsFavoritos.includes(cancion.id) && <Star size={14} fill="#fbbf24" color="#fbbf24" className="card-titulo-star" />}
                        {cancion.titulo}
                      </span>
                      <span className="card-autor">{cancion.autor}</span>
                    </div>
                    <div className="card-meta">
                      <div className="card-dificultad" style={{ color: cancionSeleccionada?.id === cancion.id ? '#fbbf24' : COLORES_DIFICULTAD[cancion.dificultad] }}>
                        <Zap size={14} />
                        {ETIQUETAS_DIFICULTAD[cancion.dificultad]}
                      </div>
                      <div className="card-bpm">
                        <Activity size={14} />
                        {cancion.bpm} BPM
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <DetalleCancionProMax 
          cancion={cancionSeleccionada}
          esFavorito={!!cancionSeleccionada && idsFavoritos.includes(cancionSeleccionada.id)}
          onCerrar={() => setCancionSeleccionada(null)}
          onToggleFavorito={toggleFavorito}
          onEmpezar={handleEmpezarJuego}
          sonidoHover={sonidoHoverSongs}
          sonidoClick={sonidoClickSongs}
        />
      </main>
    </div>
  );
};

export default ListaCancionesProMax;
