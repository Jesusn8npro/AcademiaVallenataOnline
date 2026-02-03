import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { busquedaService, type ResultadosBusqueda } from '../../servicios/busquedaService';
import './ModalBusqueda.css';

interface ModalBusquedaProps {
  abierto: boolean;
  onCerrar: () => void;
}

const recomendacionesEstaticas = [
  {
    titulo: 'Aprende desde Cero',
    descripcion: 'Curso completo para principiantes',
    icono: '⭐',
    baseClass: 'academia-tarjeta-recomendacion',
    colorClass: 'from-red-500 to-red-700',
    url: '/curso-acordeon-desde-cero',
    razon: 'Más de 5,000 estudiantes'
  },
  {
    titulo: 'Simulador de Acordeón',
    descripcion: 'Practica sin instrumento físico',
    icono: '🎮',
    baseClass: 'academia-tarjeta-recomendacion',
    colorClass: 'from-purple-500 to-purple-700',
    url: '/simulador-de-acordeon',
    razon: 'La mejor forma de practicar'
  },
  {
    titulo: 'Tutoriales Gratis',
    descripcion: 'Canciones paso a paso',
    icono: '🎵',
    baseClass: 'academia-tarjeta-recomendacion',
    colorClass: 'from-teal-500 to-teal-700',
    url: '/tutoriales',
    razon: 'Aprende canciones famosas'
  },
  {
    titulo: 'Comunidad',
    descripcion: 'Conecta con otros estudiantes',
    icono: '👥',
    baseClass: 'academia-tarjeta-recomendacion',
    colorClass: 'from-blue-500 to-blue-700',
    url: '/comunidad',
    razon: 'Aprende con otros acordeoneros'
  }
];

const ModalBusqueda: React.FC<ModalBusquedaProps> = ({ abierto, onCerrar }) => {
  const navigate = useNavigate();
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [resultadoIndiceActivo, setResultadoIndiceActivo] = useState(-1);
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [mostrandoSugerencias, setMostrandoSugerencias] = useState(false);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ResultadosBusqueda>({
    cursos: [],
    tutoriales: [],
    blog: [],
    usuarios: [],
    eventos: [],
    paquetes: [],
    total: 0
  });

  // Efecto para abrir/enfocar
  useEffect(() => {
    if (abierto) {
      setTimeout(() => {
        inputBusquedaRef.current?.focus();
        reproducirSonido('abrir');
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [abierto]);

  // Efecto debounce para búsqueda
  useEffect(() => {
    const timeoutBusqueda = setTimeout(() => {
      if (terminoBusqueda.length >= 2) {
        realizarBusqueda();
      } else if (terminoBusqueda.length < 2) {
        setResultadosBusqueda({
          cursos: [], tutoriales: [], blog: [], usuarios: [], eventos: [], paquetes: [], total: 0
        });
      }
    }, 300);

    return () => clearTimeout(timeoutBusqueda);
  }, [terminoBusqueda]);

  // Efecto para sugerencias
  useEffect(() => {
    generarSugerencias();
  }, [terminoBusqueda]);

  const realizarBusqueda = async () => {
    if (!terminoBusqueda || terminoBusqueda.length < 2) return;

    console.log('🔍 [BÚSQUEDA] Buscando:', terminoBusqueda);
    setCargandoResultados(true);
    setMostrandoSugerencias(false);
    setResultadoIndiceActivo(-1);

    try {
      const resultados = await busquedaService.buscarTodo(terminoBusqueda);
      setResultadosBusqueda(resultados);
    } catch (error) {
      console.error('❌ [BÚSQUEDA] Error:', error);
      setResultadosBusqueda({
        cursos: [], tutoriales: [], blog: [], usuarios: [], eventos: [], paquetes: [], total: 0
      });
    } finally {
      setCargandoResultados(false);
    }
  };

  const generarSugerencias = async () => {
    if (terminoBusqueda.length >= 1) {
      const sugerenciasBasicas = [
        'acordeón', 'vallenato', 'diomedes', 'carlos vives', 'binomio de oro',
        'principiante', 'intermedio', 'avanzado', 'técnicas', 'historia',
        'la gota fría', 'mi primera cana', 'masterclass', 'festival'
      ];

      const filtradas = sugerenciasBasicas
        .filter(s => s.toLowerCase().includes(terminoBusqueda.toLowerCase()))
        .slice(0, 5);

      setSugerencias(filtradas);
      setMostrandoSugerencias(filtradas.length > 0 && terminoBusqueda.length < 3);
    } else {
      setSugerencias([]);
      setMostrandoSugerencias(false);
    }
  };

  // 🔊 SISTEMA DE SONIDOS
  const reproducirSonido = (tipo: string) => {
    try {
      let rutaAudio = '';

      switch (tipo) {
        case 'hover': rutaAudio = '/audio/effects/ui/ping.mp3'; break;
        case 'click': rutaAudio = '/audio/effects/ui/click.mp3'; break;
        case 'abrir': rutaAudio = '/audio/effects/ui/mopen.mp3'; break;
        case 'cerrar': rutaAudio = '/audio/effects/ui/mclose.mp3'; break;
        case 'buscar': rutaAudio = '/audio/effects/ui/flourish.mp3'; break;
        case 'sugerencia': rutaAudio = '/audio/effects/ui/pop.mp3'; break;
        case 'resultado': rutaAudio = '/audio/effects/success.mp3'; break;
        case 'error': rutaAudio = '/audio/effects/error.mp3'; break;
        default: return;
      }

      const audio = new Audio(rutaAudio);
      audio.volume = 0.2;
      audio.play().catch(() => { }); // Ignorar errores de autoplay
    } catch (error) {
      // Ignorar
    }
  };

  const abrirChatDesdeModal = () => {
    console.log('🎯 [MODAL] Abriendo Chat Widget desde búsqueda');
    reproducirSonido('click');
    onCerrar();

    setTimeout(() => {
      const event = new CustomEvent('abrirChatWidget', {
        detail: {
          mensaje: `Hola! Me interesa aprender sobre: "${terminoBusqueda || 'acordeón vallenato'}"`,
          origen: 'busqueda'
        }
      });
      window.dispatchEvent(event);
    }, 300);
  };

  const navigarAResultado = (url: string) => {
    reproducirSonido('resultado');
    navigate(url);
    onCerrar();
  };

  const manejarTeclas = (event: React.KeyboardEvent) => {
    const { key } = event;

    const todosLosResultados = [
      ...resultadosBusqueda.cursos,
      ...resultadosBusqueda.tutoriales,
      ...resultadosBusqueda.blog,
      ...resultadosBusqueda.eventos
    ];

    switch (key) {
      case 'Escape':
        reproducirSonido('cerrar');
        onCerrar();
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (todosLosResultados.length > 0) {
          setResultadoIndiceActivo(prev => Math.min(prev + 1, todosLosResultados.length - 1));
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (todosLosResultados.length > 0) {
          setResultadoIndiceActivo(prev => Math.max(prev - 1, -1));
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (resultadoIndiceActivo >= 0 && todosLosResultados[resultadoIndiceActivo]) {
          reproducirSonido('resultado');
          navigarAResultado(todosLosResultados[resultadoIndiceActivo].url);
        } else if (terminoBusqueda.length >= 2) {
          reproducirSonido('buscar');
          realizarBusqueda();
        }
        break;
    }
  };

  if (!abierto) return null;

  return (
    <div
      className="academia-modal-busqueda-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda Universal"
      tabIndex={-1}
    >
      <div className="academia-modal-busqueda-contenido">
        {/* Header con botón cerrar */}
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

        {/* Barra de búsqueda */}
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

              {/* SUGERENCIAS INTELIGENTES */}
              {mostrandoSugerencias && sugerencias.length > 0 && (
                <div className="academia-sugerencias-flotantes">
                  <p className="academia-sugerencias-titulo">💡 Prueba buscando:</p>
                  <div className="academia-sugerencias-grid">
                    {sugerencias.map((sugerencia, index) => (
                      <button
                        key={index}
                        className="academia-sugerencia-tag"
                        onClick={() => {
                          reproducirSonido('sugerencia');
                          setTerminoBusqueda(sugerencia);
                          // Debounce will trigger search 
                        }}
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

        {/* Contenido principal */}
        <div className="academia-modal-body">
          {terminoBusqueda.length === 0 ? (
            <>
              {/* Recomendaciones personalizadas */}
              <div className="academia-seccion-recomendaciones">
                <h3 className="academia-seccion-titulo">✨ Recomendado para ti</h3>

                <div className="academia-grid-recomendaciones">
                  {recomendacionesEstaticas.map((recomendacion, index) => (
                    <button
                      key={index}
                      className={`${recomendacion.baseClass} bg-gradient-to-r ${recomendacion.colorClass}`}
                      onClick={() => { reproducirSonido('click'); navigarAResultado(recomendacion.url); }}
                      onMouseEnter={() => reproducirSonido('hover')}
                    >
                      <div className="academia-recomendacion-icono">{recomendacion.icono}</div>
                      <div className="academia-recomendacion-contenido">
                        <h4 className="academia-recomendacion-titulo">{recomendacion.titulo}</h4>
                        <p className="academia-recomendacion-descripcion">{recomendacion.descripcion}</p>
                        <span className="academia-recomendacion-razon">{recomendacion.razon}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accesos rápidos */}
              <div className="academia-accesos-rapidos">
                <h3 className="academia-seccion-titulo">🚀 Accesos Rápidos</h3>
                <div className="academia-grid-accesos">
                  <button className="academia-acceso-rapido" onClick={() => { reproducirSonido('click'); navigarAResultado('/cursos'); }} onMouseEnter={() => reproducirSonido('hover')}>
                    <span className="academia-acceso-icono">🎓</span>
                    <span className="academia-acceso-texto">Todos los Cursos</span>
                  </button>
                  <button className="academia-acceso-rapido" onClick={() => { reproducirSonido('click'); navigarAResultado('/tutoriales'); }} onMouseEnter={() => reproducirSonido('hover')}>
                    <span className="academia-acceso-icono">🎵</span>
                    <span className="academia-acceso-texto">Tutoriales</span>
                  </button>
                  <button className="academia-acceso-rapido" onClick={() => { reproducirSonido('click'); navigarAResultado('/simulador-de-acordeon'); }} onMouseEnter={() => reproducirSonido('hover')}>
                    <span className="academia-acceso-icono">🎮</span>
                    <span className="academia-acceso-texto">Simulador</span>
                  </button>
                  <button className="academia-acceso-rapido" onClick={() => { reproducirSonido('click'); navigarAResultado('/comunidad'); }} onMouseEnter={() => reproducirSonido('hover')}>
                    <span className="academia-acceso-icono">👥</span>
                    <span className="academia-acceso-texto">Comunidad</span>
                  </button>
                  <button className="academia-acceso-rapido" onClick={() => { reproducirSonido('click'); navigarAResultado('/ranking'); }} onMouseEnter={() => reproducirSonido('hover')}>
                    <span className="academia-acceso-icono">🏆</span>
                    <span className="academia-acceso-texto">Ranking</span>
                  </button>
                  <button className="academia-acceso-rapido" onClick={() => { reproducirSonido('click'); navigarAResultado('/blog'); }} onMouseEnter={() => reproducirSonido('hover')}>
                    <span className="academia-acceso-icono">📖</span>
                    <span className="academia-acceso-texto">Blog</span>
                  </button>
                  <button className="academia-acceso-rapido" onClick={() => { reproducirSonido('click'); navigarAResultado('/eventos'); }} onMouseEnter={() => reproducirSonido('hover')}>
                    <span className="academia-acceso-icono">🎪</span>
                    <span className="academia-acceso-texto">Eventos</span>
                  </button>
                  <button className="academia-acceso-rapido" onClick={() => { reproducirSonido('click'); navigarAResultado('/paquetes'); }} onMouseEnter={() => reproducirSonido('hover')}>
                    <span className="academia-acceso-icono">📦</span>
                    <span className="academia-acceso-texto">Paquetes</span>
                  </button>
                </div>
              </div>
            </>
          ) : cargandoResultados ? (
            /* Loading mientras busca */
            <div className="academia-buscando-mensaje">
              <div className="academia-buscando-icono">🔍</div>
              <h3 className="academia-buscando-titulo">Buscando "{terminoBusqueda}"...</h3>
              <p className="academia-buscando-descripcion">
                Buscando en cursos, tutoriales, blog, usuarios, eventos y paquetes...
              </p>

              {/* BOTÓN DE AYUDA DURANTE LA BÚSQUEDA */}
              <div className="academia-ayuda-busqueda">
                <button className="academia-boton-ayuda-chat" onClick={abrirChatDesdeModal} onMouseEnter={() => reproducirSonido('hover')}>
                  💬 ¿Necesitas ayuda con tu búsqueda?
                </button>
              </div>
            </div>
          ) : resultadosBusqueda.total === 0 ? (
            /* Sin resultados */
            <div className="academia-sin-resultados">
              <div className="academia-sin-resultados-icono">😔</div>
              <h3 className="academia-sin-resultados-titulo">No encontramos nada</h3>
              <p className="academia-sin-resultados-descripcion">
                No pudimos encontrar contenido para "<strong>{terminoBusqueda}</strong>"
              </p>
              <div className="academia-sugerencias-busqueda">
                <p>💡 Intenta con:</p>
                <ul>
                  <li>"acordeón" - para contenido general</li>
                  <li>"Diomedes" o "Binomio de Oro" - para artistas</li>
                  <li>"principiante" - para nivel</li>
                  <li>"masterclass" - para eventos en vivo</li>
                  <li>"técnicas" - para artículos del blog</li>
                </ul>

                {/* BOTÓN DE AYUDA CUANDO NO HAY RESULTADOS */}
                <div className="academia-ayuda-sin-resultados">
                  <button className="academia-boton-ayuda-chat" onClick={abrirChatDesdeModal} onMouseEnter={() => reproducirSonido('hover')}>
                    💬 Habla con un asesor
                  </button>
                  <p className="academia-ayuda-texto">Te ayudamos a encontrar el contenido perfecto para ti</p>
                </div>
              </div>
            </div>
          ) : (
            /* RESULTADOS DE BÚSQUEDA */
            <div className="academia-resultados-container">
              <div className="academia-resultados-header">
                <h3 className="academia-resultados-titulo">
                  📊 {resultadosBusqueda.total} resultado{resultadosBusqueda.total !== 1 ? 's' : ''} para "{terminoBusqueda}"
                </h3>
              </div>

              {/* CURSOS */}
              {resultadosBusqueda.cursos.length > 0 && (
                <div className="academia-categoria-seccion">
                  <h4 className="academia-categoria-titulo">
                    <span className="academia-categoria-icono">🎓</span>
                    Cursos ({resultadosBusqueda.cursos.length})
                  </h4>
                  <div className="academia-grid-resultados">
                    {resultadosBusqueda.cursos.map((curso, index) => (
                      <button key={index} className="academia-tarjeta-resultado" onClick={() => { reproducirSonido('resultado'); navigarAResultado(curso.url); }} onMouseEnter={() => reproducirSonido('hover')}>
                        {curso.imagen ? (
                          <img src={curso.imagen} alt={curso.titulo} className="academia-resultado-imagen" loading="lazy" />
                        ) : (
                          <div className="academia-resultado-imagen-placeholder bg-gradient-to-r from-blue-500 to-blue-700">
                            <span className="academia-placeholder-icono">🎓</span>
                          </div>
                        )}
                        <div className="academia-resultado-contenido">
                          <h5 className="academia-resultado-titulo">{curso.titulo}</h5>
                          {curso.descripcion && (
                            <p className="academia-resultado-descripcion">{curso.descripcion}</p>
                          )}
                          <div className="academia-resultado-meta">
                            {curso.nivel && (
                              <span className="academia-meta-item">📊 {curso.nivel}</span>
                            )}
                            {curso.precio && (
                              <span className="academia-meta-item academia-precio">${new Intl.NumberFormat('es-CO').format(curso.precio)} COP</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TUTORIALES */}
              {resultadosBusqueda.tutoriales.length > 0 && (
                <div className="academia-categoria-seccion">
                  <h4 className="academia-categoria-titulo">
                    <span className="academia-categoria-icono">🎵</span>
                    Tutoriales ({resultadosBusqueda.tutoriales.length})
                  </h4>
                  <div className="academia-grid-resultados">
                    {resultadosBusqueda.tutoriales.map((tutorial, index) => (
                      <button key={index} className="academia-tarjeta-resultado" onClick={() => { reproducirSonido('resultado'); navigarAResultado(tutorial.url); }} onMouseEnter={() => reproducirSonido('hover')}>
                        {tutorial.imagen ? (
                          <img src={tutorial.imagen} alt={tutorial.titulo} className="academia-resultado-imagen" loading="lazy" />
                        ) : (
                          <div className="academia-resultado-imagen-placeholder bg-gradient-to-r from-teal-500 to-teal-700">
                            <span className="academia-placeholder-icono">🎵</span>
                          </div>
                        )}
                        <div className="academia-resultado-contenido">
                          <h5 className="academia-resultado-titulo">{tutorial.titulo}</h5>
                          {tutorial.descripcion && (
                            <p className="academia-resultado-descripcion">{tutorial.descripcion}</p>
                          )}
                          <div className="academia-resultado-meta">
                            {tutorial.autor && (
                              <span className="academia-meta-item">👤 {tutorial.autor}</span>
                            )}
                            {tutorial.nivel && (
                              <span className="academia-meta-item">📊 {tutorial.nivel}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* BLOG */}
              {resultadosBusqueda.blog.length > 0 && (
                <div className="academia-categoria-seccion">
                  <h4 className="academia-categoria-titulo">
                    <span className="academia-categoria-icono">📖</span>
                    Blog ({resultadosBusqueda.blog.length})
                  </h4>
                  <div className="academia-grid-resultados">
                    {resultadosBusqueda.blog.map((articulo, index) => (
                      <button key={index} className="academia-tarjeta-resultado" onClick={() => { reproducirSonido('resultado'); navigarAResultado(articulo.url); }} onMouseEnter={() => reproducirSonido('hover')}>
                        {articulo.imagen ? (
                          <img src={articulo.imagen} alt={articulo.titulo} className="academia-resultado-imagen" loading="lazy" />
                        ) : (
                          <div className="academia-resultado-imagen-placeholder bg-gradient-to-r from-orange-500 to-orange-700">
                            <span className="academia-placeholder-icono">📖</span>
                          </div>
                        )}
                        <div className="academia-resultado-contenido">
                          <h5 className="academia-resultado-titulo">{articulo.titulo}</h5>
                          {articulo.descripcion && (
                            <p className="academia-resultado-descripcion">{articulo.descripcion}</p>
                          )}
                          <div className="academia-resultado-meta">
                            {articulo.autor && (
                              <span className="academia-meta-item">👤 {articulo.autor}</span>
                            )}
                            {articulo.categoria && (
                              <span className="academia-meta-item">🏷️ {articulo.categoria}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* USUARIOS */}
              {resultadosBusqueda.usuarios.length > 0 && (
                <div className="academia-categoria-seccion">
                  <h4 className="academia-categoria-titulo">
                    <span className="academia-categoria-icono">👥</span>
                    Usuarios ({resultadosBusqueda.usuarios.length})
                  </h4>
                  <div className="academia-grid-resultados">
                    {resultadosBusqueda.usuarios.map((usuario, index) => (
                      <button key={index} className="academia-tarjeta-resultado" onClick={() => navigarAResultado(usuario.url)}>
                        {usuario.imagen ? (
                          <img src={usuario.imagen} alt={usuario.titulo} className="academia-resultado-imagen" loading="lazy" />
                        ) : (
                          <div className="academia-resultado-imagen-placeholder bg-gradient-to-r from-purple-500 to-purple-700">
                            <span className="academia-placeholder-icono">👤</span>
                          </div>
                        )}
                        <div className="academia-resultado-contenido">
                          <h5 className="academia-resultado-titulo">{usuario.titulo}</h5>
                          {usuario.descripcion && (
                            <p className="academia-resultado-descripcion">{usuario.descripcion}</p>
                          )}
                          <div className="academia-resultado-meta">
                            {usuario.nivel && (
                              <span className="academia-meta-item">📊 {usuario.nivel}</span>
                            )}
                            <span className="academia-meta-item">🎵 Acordeonista</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* EVENTOS */}
              {resultadosBusqueda.eventos.length > 0 && (
                <div className="academia-categoria-seccion">
                  <h4 className="academia-categoria-titulo">
                    <span className="academia-categoria-icono">🎪</span>
                    Eventos ({resultadosBusqueda.eventos.length})
                  </h4>
                  <div className="academia-grid-resultados">
                    {resultadosBusqueda.eventos.map((evento, index) => (
                      <button key={index} className="academia-tarjeta-resultado" onClick={() => { reproducirSonido('resultado'); navigarAResultado(evento.url); }} onMouseEnter={() => reproducirSonido('hover')}>
                        {evento.imagen ? (
                          <img src={evento.imagen} alt={evento.titulo} className="academia-resultado-imagen" loading="lazy" />
                        ) : (
                          <div className="academia-resultado-imagen-placeholder bg-gradient-to-r from-green-500 to-green-700">
                            <span className="academia-placeholder-icono">🎪</span>
                          </div>
                        )}
                        <div className="academia-resultado-contenido">
                          <h5 className="academia-resultado-titulo">{evento.titulo}</h5>
                          {evento.descripcion && (
                            <p className="academia-resultado-descripcion">{evento.descripcion}</p>
                          )}
                          <div className="academia-resultado-meta">
                            {evento.fechaCreacion && (
                              <span className="academia-meta-item">📅 {new Date(evento.fechaCreacion).toLocaleDateString('es-ES')}</span>
                            )}
                            <span className="academia-meta-item">🎫 Evento</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PAQUETES */}
              {resultadosBusqueda.paquetes.length > 0 && (
                <div className="academia-categoria-seccion">
                  <h4 className="academia-categoria-titulo">
                    <span className="academia-categoria-icono">📦</span>
                    Paquetes ({resultadosBusqueda.paquetes.length})
                  </h4>
                  <div className="academia-grid-resultados">
                    {resultadosBusqueda.paquetes.map((paquete, index) => (
                      <button key={index} className="academia-tarjeta-resultado" onClick={() => navigarAResultado(paquete.url)}>
                        {paquete.imagen ? (
                          <img src={paquete.imagen} alt={paquete.titulo} className="academia-resultado-imagen" loading="lazy" />
                        ) : (
                          <div className="academia-resultado-imagen-placeholder bg-gradient-to-r from-yellow-500 to-yellow-700">
                            <span className="academia-placeholder-icono">📦</span>
                          </div>
                        )}
                        <div className="academia-resultado-contenido">
                          <h5 className="academia-resultado-titulo">{paquete.titulo}</h5>
                          {paquete.descripcion && (
                            <p className="academia-resultado-descripcion">{paquete.descripcion}</p>
                          )}
                          <div className="academia-resultado-meta">
                            {paquete.precio && (
                              <span className="academia-meta-item academia-precio">${new Intl.NumberFormat('es-CO').format(paquete.precio)} COP</span>
                            )}
                            <span className="academia-meta-item">📦 Paquete</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con atajos mejorados */}
        <div className="academia-modal-footer">
          <div className="academia-atajos-teclado">
            <span className="academia-atajo"><kbd>↑</kbd><kbd>↓</kbd> Navegar</span>
            <span className="academia-atajo"><kbd>Enter</kbd> Abrir</span>
            <span className="academia-atajo"><kbd>Esc</kbd> Cerrar</span>
          </div>
          <div className="academia-footer-ayuda">
            <button className="academia-boton-chat-footer" onClick={abrirChatDesdeModal} onMouseEnter={() => reproducirSonido('hover')}>
              💬 ¿Necesitas ayuda?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalBusqueda;
