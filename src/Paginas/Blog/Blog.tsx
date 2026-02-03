import React, { useState, useEffect } from 'react';
import { supabase, supabaseAnon } from '../../servicios/supabaseCliente';
import HeroBlog from '../../componentes/Blog/HeroBlog';
import TarjetaArticulo from '../../componentes/Blog/TarjetaArticulo';
import SidebarDerechaBlog from '../../componentes/Blog/SidebarDerechaBlog';
import SEO from '../../componentes/common/SEO';

// Interfaz basada en la estructura COMPLETA (Rich Schema)
interface ArticuloDB {
  id: string;
  titulo: string;
  slug: string;
  resumen?: string;
  contenido?: string;
  imagen_url?: string;
  estado: string;
  creado_en: string;
  actualizado_en: string;
  autor?: string;
  autor_iniciales?: string;
  fecha_publicacion?: string;
  lectura_min?: number;
  calificacion?: number;
  portada_url?: string;
  resumen_breve?: string;
  resumen_completo?: string;
  secciones?: any;
  cta?: any;
  estado_publicacion?: string;
  autor_id?: string;
  meta_titulo?: string;
  meta_descripcion?: string;
  meta_keywords?: string;
  canonical_url?: string;
  og_titulo?: string;
  og_descripcion?: string;
  og_imagen_url?: string;
  twitter_card?: string;
}

const Blog: React.FC = () => {
  const [articulos, setArticulos] = useState<ArticuloDB[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarContenido, setMostrarContenido] = useState(false);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const articulosPorPagina = 9;
  const totalPaginas = Math.ceil(articulos.length / articulosPorPagina);
  const articulosPaginados = articulos.slice(
    (paginaActual - 1) * articulosPorPagina,
    paginaActual * articulosPorPagina
  );

  const scrollToArticulos = () => {
    document.getElementById('articulos')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setTimeout(() => setMostrarContenido(true), 500);
    cargarArticulos();
  }, []);

  const cargarArticulos = async () => {
    try {
      setCargando(true);
      setError('');

      const { data, error: errorSupabase } = await supabaseAnon
        .from('blog_articulos')
        .select('*')
        // Intentamos filtrar por 'publicado', asumiendo que el campo 'estado_publicacion' o 'estado' existe y tiene ese valor.
        // Si hay conflicto entre schemas, el 'or' ayuda a cubrir ambos casos temporalmente, o ajustamos a lo que haya.
        // Dado el schema "Rich", el campo es 'estado_publicacion' -> 'publicado'
        .eq('estado_publicacion', 'publicado')
        .order('fecha_publicacion', { ascending: false });

      if (errorSupabase) {
        throw new Error('Error al cargar los artículos del blog');
      }

      setArticulos(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado al cargar los artículos');
      console.error('Error cargando artículos:', e);
    } finally {
      setCargando(false);
    }
  };

  const reintentarCarga = async () => {
    await cargarArticulos();
  };

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      document.getElementById('articulos')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const paginaAnterior = () => {
    cambiarPagina(paginaActual - 1);
  };

  const paginaSiguiente = () => {
    cambiarPagina(paginaActual + 1);
  };

  const styles = {
    paginaBlog: {
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    },
    seccionArticulos: {
      padding: '4rem 1.5rem',
      maxWidth: '1800px',
      width: '95%',
      margin: '0 auto',
      opacity: mostrarContenido ? 1 : 0,
      transform: mostrarContenido ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    estadoCarga: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center' as const,
      minHeight: '400px',
      padding: '3rem 2rem',
    },
    spinnerCarga: {
      width: '50px',
      height: '50px',
      border: '4px solid #e2e8f0',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'girar 1s linear infinite',
      marginBottom: '1.5rem',
    },
    estadoError: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center' as const,
      minHeight: '400px',
      padding: '3rem 2rem',
      background: 'rgba(239, 68, 68, 0.05)',
      borderRadius: '20px',
      border: '1px solid rgba(239, 68, 68, 0.1)',
    },
    iconoError: {
      fontSize: '3rem',
      marginBottom: '1rem',
    },
    botonReintentar: {
      background: 'linear-gradient(135deg, #dc2626, #ef4444)',
      color: 'white',
      border: 'none',
      borderRadius: '25px',
      padding: '0.8rem 2rem',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
    },
    encabezadoSeccion: {
      textAlign: 'center' as const,
      marginBottom: '3rem',
    },
    contenidoPrincipal: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 340px',
      gap: '3rem',
      alignItems: 'start',
    },
    areaArticulos: {
      width: '100%',
    },
    grillaArticulos: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', // Auto fill mejorado
      gap: '2rem',
    },
    envolturioArticulo: {
      opacity: 0,
      transform: 'translateY(30px)',
      animation: 'aparecerArriba 0.6s forwards ease-out',
    },
    estadoVacio: {
      gridColumn: '1 / -1',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center' as const,
      minHeight: '400px',
      padding: '3rem 2rem',
      background: 'rgba(59, 130, 246, 0.05)',
      borderRadius: '20px',
      border: '1px solid rgba(59, 130, 246, 0.1)',
    },
    paginacion: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1rem',
      marginTop: '3rem',
      padding: '2rem 0',
    },
    botonPagina: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
      color: 'white',
      border: 'none',
      borderRadius: '25px',
      padding: '0.8rem 1.5rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
    },
    botonDeshabilitado: {
      background: '#e2e8f0',
      color: '#94a3b8',
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    numerosPagina: {
      display: 'flex',
      gap: '0.5rem',
    },
    numeroPagina: {
      width: '40px',
      height: '40px',
      border: '1px solid #e2e8f0',
      background: 'white',
      color: '#64748b',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontWeight: 600,
    },
    numeroPaginaActiva: {
      background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
      color: 'white',
      borderColor: 'transparent',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
    },
    barraLateral: {
      position: 'relative' as const,
    },
  };

  return (
    <>
      {/* SEO Head */}
      <SEO
        title="Blog - Academia Vallenata Online | Aprende Acordeón"
        description="Descubre historias inspiradoras, técnicas profesionales y consejos de expertos en acordeón vallenato. Únete a nuestra comunidad de músicos apasionados."
      />

      <main style={styles.paginaBlog} className="pagina-blog">
        <HeroBlog onCta={scrollToArticulos} />

        <section id="articulos" style={styles.seccionArticulos} className="seccion-articulos">
          {/* Loading State */}
          {cargando ? (
            <div style={styles.estadoCarga} className="estado-carga">
              <div style={styles.spinnerCarga} className="spinner-carga"></div>
              <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }}>Cargando los mejores artículos...</p>
            </div>
          ) : error ? (
            /* Error State */
            <div style={styles.estadoError} className="estado-error">
              <div style={styles.iconoError} className="icono-error">⚠️</div>
              <h3 style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Oops, algo salió mal</h3>
              <p style={{ color: '#7f1d1d', marginBottom: '2rem' }}>{error}</p>
              <button
                style={styles.botonReintentar}
                className="boton-reintentar"
                onClick={reintentarCarga}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)';
                }}
              >
                <span>Reintentar</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="m20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.36 4.36A9 9 0 0 1 3.51 15" />
                </svg>
              </button>
            </div>
          ) : (
            /* Content */
            <div style={styles.contenidoPrincipal} className="contenido-principal">
              {/* Área de artículos */}
              <div style={styles.areaArticulos} className="area-articulos">
                {/* Header de sección */}
                <div style={styles.encabezadoSeccion} className="encabezado-seccion">
                  <h2 style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #1e40af, #7c3aed, #059669)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '1rem',
                  }}>
                    Últimos Artículos
                  </h2>
                  <p style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500 }}>
                    Explora nuestro contenido más reciente sobre acordeón y vallenato
                  </p>
                </div>

                {/* Grid de artículos */}
                {articulos.length > 0 ? (
                  <>
                    <div style={styles.grillaArticulos} className="grilla-articulos">
                      {articulosPaginados.map((articulo, index) => (
                        <div
                          key={articulo.id}
                          className="envolturio-articulo"
                          style={{
                            ...styles.envolturioArticulo,
                            animationDelay: `${index * 0.1}s`
                          }}
                        >
                          <TarjetaArticulo {...articulo} />
                        </div>
                      ))}
                    </div>

                    {/* Paginación */}
                    {totalPaginas > 1 && (
                      <div style={styles.paginacion} className="paginacion">
                        <button
                          style={{
                            ...styles.botonPagina,
                            ...(paginaActual === 1 ? styles.botonDeshabilitado : {})
                          }}
                          className="boton-pagina"
                          onClick={paginaAnterior}
                          disabled={paginaActual === 1}
                          onMouseEnter={(e) => {
                            if (paginaActual !== 1) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (paginaActual !== 1) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                            }
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,18 9,12 15,6"></polyline>
                          </svg>
                          Anterior
                        </button>

                        <div style={styles.numerosPagina} className="numeros-pagina">
                          {Array(totalPaginas).fill(0).map((_, i) => (
                            <button
                              key={i}
                              className={`numero-pagina ${paginaActual === i + 1 ? 'activa' : ''}`}
                              style={{
                                ...styles.numeroPagina,
                                ...(paginaActual === i + 1 ? styles.numeroPaginaActiva : {})
                              }}
                              onClick={() => cambiarPagina(i + 1)}
                              onMouseEnter={(e) => {
                                if (paginaActual !== i + 1) {
                                  e.currentTarget.style.borderColor = '#3b82f6';
                                  e.currentTarget.style.color = '#3b82f6';
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (paginaActual !== i + 1) {
                                  e.currentTarget.style.borderColor = '#e2e8f0';
                                  e.currentTarget.style.color = '#64748b';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }
                              }}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          style={{
                            ...styles.botonPagina,
                            ...(paginaActual === totalPaginas ? styles.botonDeshabilitado : {})
                          }}
                          className="boton-pagina"
                          onClick={paginaSiguiente}
                          disabled={paginaActual === totalPaginas}
                          onMouseEnter={(e) => {
                            if (paginaActual !== totalPaginas) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (paginaActual !== totalPaginas) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                            }
                          }}
                        >
                          Siguiente
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9,18 15,12 9,6"></polyline>
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={styles.estadoVacio} className="estado-vacio">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
                    <h3 style={{ color: '#1e40af', fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Próximamente...</h3>
                    <p style={{ color: '#1e40af', fontSize: '1.1rem' }}>Estamos preparando contenido increíble para ti. ¡Regresa pronto!</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside style={styles.barraLateral} className="barra-lateral">
                <SidebarDerechaBlog />
              </aside>
            </div>
          )}
        </section>
      </main>

      <style>{`
        @keyframes girar {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes aparecerArriba {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .contenido-principal {
            grid-template-columns: 1fr 280px !important;
            gap: 3rem !important;
          }
        }

        @media (max-width: 900px) {
          .contenido-principal {
            display: flex !important;
            flex-direction: column !important;
            gap: 3rem !important;
          }

          .area-articulos {
            width: 100% !important;
            order: 1 !important;
          }
          
          .barra-lateral {
            width: 100% !important;
            order: 2 !important;
            margin-top: 1rem;
          }

          .grilla-articulos {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }

          .seccion-articulos {
            padding: 2rem 1rem !important;
          }

          .paginacion {
            flex-direction: column !important;
            gap: 1.5rem !important;
          }

          .numeros-pagina {
            order: -1;
          }
        }

        @media (max-width: 500px) {
          .estado-carga, .estado-error, .estado-vacio {
            min-height: 300px !important;
            padding: 2rem 1rem !important;
          }

          .boton-pagina {
            padding: 0.6rem 1rem !important;
            font-size: 0.9rem !important;
          }

          .numero-pagina {
            width: 35px !important;
            height: 35px !important;
            font-size: 0.9rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default Blog; 
