import React from 'react';
import { useModalBusqueda } from './useModalBusqueda';
import ListaResultados from './ResultadosBusqueda';
import './ModalBusqueda.css';

interface ModalBusquedaProps {
  abierto: boolean;
  onCerrar: () => void;
}

const recomendacionesEstaticas = [
  { titulo: 'Aprende desde Cero', descripcion: 'Curso completo para principiantes', icono: '⭐', baseClass: 'academia-tarjeta-recomendacion', colorClass: 'from-red-500 to-red-700', url: '/curso-acordeon-desde-cero', razon: 'Más de 5,000 estudiantes' },
  { titulo: 'Simulador de Acordeón', descripcion: 'Practica sin instrumento físico', icono: '🎮', baseClass: 'academia-tarjeta-recomendacion', colorClass: 'from-purple-500 to-purple-700', url: '/simulador-de-acordeon', razon: 'La mejor forma de practicar' },
  { titulo: 'Tutoriales Gratis', descripcion: 'Canciones paso a paso', icono: '🎵', baseClass: 'academia-tarjeta-recomendacion', colorClass: 'from-teal-500 to-teal-700', url: '/tutoriales', razon: 'Aprende canciones famosas' },
  { titulo: 'Comunidad', descripcion: 'Conecta con otros estudiantes', icono: '👥', baseClass: 'academia-tarjeta-recomendacion', colorClass: 'from-blue-500 to-blue-700', url: '/comunidad', razon: 'Aprende con otros acordeoneros' }
];

const accesosRapidos = [
  { icono: '🎓', texto: 'Todos los Cursos', url: '/cursos' },
  { icono: '🎵', texto: 'Tutoriales', url: '/tutoriales' },
  { icono: '🎮', texto: 'Simulador', url: '/simulador-de-acordeon' },
  { icono: '👥', texto: 'Comunidad', url: '/comunidad' },
  { icono: '🏆', texto: 'Ranking', url: '/ranking' },
  { icono: '📖', texto: 'Blog', url: '/blog' },
  { icono: '🎪', texto: 'Eventos', url: '/eventos' },
  { icono: '📦', texto: 'Paquetes', url: '/paquetes' },
];

const ModalBusqueda: React.FC<ModalBusquedaProps> = ({ abierto, onCerrar }) => {
  const {
    inputBusquedaRef, terminoBusqueda, setTerminoBusqueda,
    cargandoResultados, sugerencias, mostrandoSugerencias,
    resultadosBusqueda, reproducirSonido, abrirChatDesdeModal, navigarAResultado, manejarTeclas
  } = useModalBusqueda({ abierto, onCerrar });

  if (!abierto) return null;

  return (
    <div
      className="academia-modal-busqueda-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda Universal"
      tabIndex={-1}
    >
      <div className="academia-modal-busqueda-contenido">
        <div className="academia-modal-header">
          <h2 className="academia-modal-titulo">🔍 Buscar en la Academia</h2>
          <button
            className="academia-boton-cerrar-modal"
            onClick={() => { reproducirSonido('cerrar'); onCerrar(); }}
            onMouseEnter={() => reproducirSonido('hover')}
            aria-label="Cerrar búsqueda"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="academia-busqueda-principal">
          <div className="academia-input-busqueda-container">
            <div className="academia-input-wrapper">
              <svg className="academia-icono-busqueda" width="20" height="20" fill="none" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                ref={inputBusquedaRef}
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                type="search"
                placeholder="Buscar cursos, tutoriales, artículos..."
                className="academia-input-busqueda-modal"
                autoComplete="off"
                spellCheck="false"
                onKeyDown={manejarTeclas}
              />
              {cargandoResultados && (
                <div className="academia-spinner-busqueda">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 12a8 8 0 018-8V2.5" />
                  </svg>
                </div>
              )}
              {mostrandoSugerencias && sugerencias.length > 0 && (
                <div className="academia-sugerencias-flotantes">
                  <p className="academia-sugerencias-titulo">💡 Prueba buscando:</p>
                  <div className="academia-sugerencias-grid">
                    {sugerencias.map((sugerencia, index) => (
                      <button
                        key={index}
                        className="academia-sugerencia-tag"
                        onClick={() => { reproducirSonido('sugerencia'); setTerminoBusqueda(sugerencia); }}
                        onMouseEnter={() => reproducirSonido('hover')}
                      >
                        {sugerencia}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="academia-modal-body">
          {terminoBusqueda.length === 0 ? (
            <>
              <div className="academia-seccion-recomendaciones">
                <h3 className="academia-seccion-titulo">✨ Recomendado para ti</h3>
                <div className="academia-grid-recomendaciones">
                  {recomendacionesEstaticas.map((rec, index) => (
                    <button
                      key={index}
                      className={`${rec.baseClass} bg-gradient-to-r ${rec.colorClass}`}
                      onClick={() => { reproducirSonido('click'); navigarAResultado(rec.url); }}
                      onMouseEnter={() => reproducirSonido('hover')}
                    >
                      <div className="academia-recomendacion-icono">{rec.icono}</div>
                      <div className="academia-recomendacion-contenido">
                        <h4 className="academia-recomendacion-titulo">{rec.titulo}</h4>
                        <p className="academia-recomendacion-descripcion">{rec.descripcion}</p>
                        <span className="academia-recomendacion-razon">{rec.razon}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="academia-accesos-rapidos">
                <h3 className="academia-seccion-titulo">🚀 Accesos Rápidos</h3>
                <div className="academia-grid-accesos">
                  {accesosRapidos.map((acceso) => (
                    <button key={acceso.url} className="academia-acceso-rapido" onClick={() => { reproducirSonido('click'); navigarAResultado(acceso.url); }} onMouseEnter={() => reproducirSonido('hover')}>
                      <span className="academia-acceso-icono">{acceso.icono}</span>
                      <span className="academia-acceso-texto">{acceso.texto}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : cargandoResultados ? (
            <div className="academia-buscando-mensaje">
              <div className="academia-buscando-icono">🔍</div>
              <h3 className="academia-buscando-titulo">Buscando "{terminoBusqueda}"...</h3>
              <p className="academia-buscando-descripcion">Buscando en cursos, tutoriales, blog, usuarios, eventos y paquetes...</p>
              <div className="academia-ayuda-busqueda">
                <button className="academia-boton-ayuda-chat" onClick={abrirChatDesdeModal} onMouseEnter={() => reproducirSonido('hover')}>
                  💬 ¿Necesitas ayuda con tu búsqueda?
                </button>
              </div>
            </div>
          ) : resultadosBusqueda.total === 0 ? (
            <div className="academia-sin-resultados">
              <div className="academia-sin-resultados-icono">😔</div>
              <h3 className="academia-sin-resultados-titulo">No encontramos nada</h3>
              <p className="academia-sin-resultados-descripcion">No pudimos encontrar contenido para "<strong>{terminoBusqueda}</strong>"</p>
              <div className="academia-sugerencias-busqueda">
                <p>💡 Intenta con:</p>
                <ul>
                  <li>"acordeón" - para contenido general</li>
                  <li>"Diomedes" o "Binomio de Oro" - para artistas</li>
                  <li>"principiante" - para nivel</li>
                  <li>"masterclass" - para eventos en vivo</li>
                  <li>"técnicas" - para artículos del blog</li>
                </ul>
                <div className="academia-ayuda-sin-resultados">
                  <button className="academia-boton-ayuda-chat" onClick={abrirChatDesdeModal} onMouseEnter={() => reproducirSonido('hover')}>
                    💬 Habla con un asesor
                  </button>
                  <p className="academia-ayuda-texto">Te ayudamos a encontrar el contenido perfecto para ti</p>
                </div>
              </div>
            </div>
          ) : (
            <ListaResultados
              resultados={resultadosBusqueda}
              reproducirSonido={reproducirSonido}
              navigarAResultado={navigarAResultado}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalBusqueda;
