import { Star, Music } from 'lucide-react';
import './DetalleCancionProMax.css';
import type { CancionHeroConTonalidad } from '../TiposProMax';

interface DetalleCancionProMaxProps {
  cancion: CancionHeroConTonalidad | null;
  esFavorito: boolean;
  onCerrar: () => void;
  onToggleFavorito: (id: string) => void;
  onEmpezar: () => void;
  sonidoHover: any;
  sonidoClick: any;
}

const DetalleCancionProMax: React.FC<DetalleCancionProMaxProps> = ({
  cancion,
  esFavorito,
  onCerrar,
  onToggleFavorito,
  onEmpezar,
  sonidoHover,
  sonidoClick
}) => {
  if (!cancion) return <aside className="promax-menu-detalle" />;

  // Mapeo selectivo para mostrar datos reales en el bloque estilizado
  const dificultadTexto = cancion.dificultad.charAt(0).toUpperCase() + cancion.dificultad.slice(1);

  return (
    <aside className="promax-menu-detalle visible sticky-panel">
      <div className="detalle-scroll-container">
        <div className="detalle-contenido-original">
          
          <div className="detalle-image-section">
            {cancion.youtube_id ? (
              <div className="video-aspect-ratio">
                <iframe
                  src={`https://www.youtube.com/embed/${cancion.youtube_id}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${cancion.youtube_id}`}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  title="Vista Previa"
                />
              </div>
            ) : (
              <div className="video-placeholder-original">
                <Music size={40} opacity={0.2} />
                <span>Sin Previa</span>
              </div>
            )}
          </div>

          <div className="detalle-main-info">
            <div className="detalle-title-row">
              <h2 className="detalle-title-original">{cancion.titulo}</h2>
              {cancion.tonalidad && <span className="detalle-subtitle-original">({cancion.tonalidad})</span>}
            </div>
            <div className="detalle-artist-original">{cancion.autor}</div>
          </div>

          {/* Bloque de estadísticas con datos REALES de la canción */}
          <div className="detalle-best-results">
            <div className="br-block">
              <div className="br-txt">Ritmo</div>
              <div className="br-val">{cancion.bpm} <small style={{fontSize: '0.6em'}}>BPM</small></div>
            </div>
            <div className="br-block">
              <div className="br-txt">Tono</div>
              <div className="br-val">{cancion.tonalidad || 'ADG'}</div>
            </div>
            <div className="br-block">
              <div className="br-txt">Nivel</div>
              <div className="br-val" style={{fontSize: '0.9rem'}}>{dificultadTexto}</div>
            </div>
            <div className="br-block">
              <div className="br-txt">Record</div>
              <div className="br-val">---</div>
            </div>
          </div>

          <div className="detalle-footer-original">
            <div className="detalle-instruction">Selecciona un nivel o presiona Jugar</div>
            
            <div className="detalle-actions-original">
              <div className="play-button-wrapper">
                <button
                  className="btn-play-rainbow"
                  onMouseEnter={() => sonidoHover.play()}
                  onClick={() => { sonidoClick.play(); onEmpezar(); }}
                >
                  ¡Jugar!
                </button>
              </div>

              <div className="text-buttons-row">
                <div 
                  className={`text-button ${esFavorito ? 'active' : ''}`}
                  onClick={() => onToggleFavorito(cancion.id)}
                >
                  <Star size={14} fill={esFavorito ? "#fbbf24" : "none"} />
                  {esFavorito ? 'Guardado' : 'Favorito'}
                </div>
                <div className="text-button" onClick={() => { sonidoClick.play(); onCerrar(); }}>
                  Cancelar
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </aside>
  );
};

export default DetalleCancionProMax;
