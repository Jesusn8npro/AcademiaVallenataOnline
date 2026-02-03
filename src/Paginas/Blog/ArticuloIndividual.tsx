import React, { useState, useEffect } from 'react';
import { supabase, supabaseAnon } from '../../servicios/supabaseCliente';
import HeroArticulo from '../../componentes/Blog/articulos/HeroArticulo';
import SidebarDerechaBlog from '../../componentes/Blog/SidebarDerechaBlog';

interface Articulo {
  id: string;
  titulo: string;
  resumen: string;
  contenido: string;
  imagen_url?: string;
  slug: string;
  estado: 'borrador' | 'publicado';
  creado_en: string;
  actualizado_en: string;
  autor?: string;
  categoria?: string;
  etiquetas?: string[];
  lecturas?: number;
}

const ArticuloIndividual: React.FC = () => {
  // Extraer slug de la URL actual
  const slug = window.location.pathname.split('/blog/')[1];
  const [articulo, setArticulo] = useState<Articulo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [progresoLectura, setProgresoLectura] = useState(0);
  const [tiempoEstimadoLectura, setTiempoEstimadoLectura] = useState(0);
  const [mostrarPagina, setMostrarPagina] = useState(false);
  const [contenidoProcesado, setContenidoProcesado] = useState('');

  // Función para embeber videos de YouTube
  const embedYouTube = (html: string): string => {
    if (!html) return '';
    return html.replace(/https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/g,
      (match: string, _: string, __: string, videoId: string) => {
        return `<div class='youtube-embed'><iframe width='100%' height='340' src='https://www.youtube.com/embed/${videoId}' title='YouTube video' frameborder='0' allowfullscreen></iframe></div>`;
      });
  };

  // Calcular tiempo de lectura
  const calcularTiempoLectura = (contenido: string): number => {
    const palabras = contenido.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(palabras / 200); // 200 palabras por minuto
  };

  // Procesar contenido con IDs para navegación
  const procesarContenidoConIds = (html: string): string => {
    return html.replace(/<(h[1-6])([^>]*)>([^<]+)<\/h[1-6]>/gi, (match, tag, attrs, text) => {
      const id = text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      return `<${tag}${attrs} id="${id}">${text}</${tag}>`;
    });
  };

  // Manejar scroll para barra de progreso
  const manejarScroll = () => {
    const contenidoElemento = document.querySelector('.contenido-articulo-blog');
    if (!contenidoElemento) return;

    const scrollTop = window.scrollY;
    const alturaDocumento = document.documentElement.scrollHeight - window.innerHeight;
    setProgresoLectura(Math.min((scrollTop / alturaDocumento) * 100, 100));
  };

  useEffect(() => {
    const cargarArticulo = async () => {
      setCargando(true);
      setError('');
      setArticulo(null);

      try {
        const { data: art, error: errorArt } = await supabaseAnon
          .from('blog_articulos')
          .select('*')
          .eq('slug', slug)
          .eq('estado', 'publicado')
          .single();

        if (errorArt || !art) {
          setError('No se encontró el artículo.');
        } else {
          setArticulo(art as Articulo);
          setTiempoEstimadoLectura(calcularTiempoLectura(art.contenido || ''));

          // Procesar contenido con IDs para navegación
          const htmlConYoutube = embedYouTube(art.contenido || '');
          setContenidoProcesado(procesarContenidoConIds(htmlConYoutube));
        }
      } catch (e) {
        setError('Error al cargar los datos.');
        console.error('Error cargando artículo:', e);
      }

      setCargando(false);
      setMostrarPagina(true);
    };

    cargarArticulo();

    // Configurar scroll listener
    window.addEventListener('scroll', manejarScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', manejarScroll);
    };
  }, [slug]);

  const styles = {
    barraProgresoLectura: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #ff6b35, #ffd700)',
      zIndex: 9999,
      transition: 'width 0.2s ease',
      width: `${progresoLectura}%`,
    },
    paginaArticuloBlog: {
      width: '100%',
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '2rem 1rem',
      transition: 'opacity 0.5s ease-out',
      opacity: mostrarPagina ? 1 : 0,
      marginTop: '50px',
    },
    contenedorArticulo: {
      maxWidth: '1500px',
      margin: '0 auto',
      padding: 0,
      position: 'relative' as const,
      zIndex: 2,
    },
    layoutArticulo: {
      display: 'grid',
      gridTemplateColumns: '1fr 320px',
      gap: '3rem',
      alignItems: 'flex-start',
    },
    contenidoPrincipal: {
      minWidth: 0,
    },
    contenidoArticuloBlog: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '24px',
      boxShadow: '0 8px 32px rgba(255, 107, 53, 0.15)',
      padding: '2.5rem',
      marginTop: '1.5rem',
      fontSize: '1.1rem',
      color: '#2c3e50',
      lineHeight: 1.8,
      wordBreak: 'break-word' as const,
      overflowWrap: 'anywhere' as const,
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      scrollMarginTop: '100px',
    },
    ctaFinalArticulo: {
      background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
      borderRadius: '24px',
      padding: '3rem 2rem',
      marginTop: '3rem',
      textAlign: 'center' as const,
      color: 'white',
      boxShadow: '0 8px 32px rgba(255, 107, 53, 0.15)',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    ctaContenido: {
      position: 'relative' as const,
      zIndex: 2,
    },
    botonesCtaContainer: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      flexWrap: 'wrap' as const,
    },
    botonCtaPrincipal: {
      padding: '1rem 2rem',
      borderRadius: '50px',
      textDecoration: 'none',
      fontWeight: 700,
      fontSize: '1.1rem',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      border: '2px solid transparent',
      background: '#ffd700',
      color: '#2d5a3d',
      boxShadow: '0 8px 25px rgba(255, 215, 0, 0.3)',
    },
    botonCtaSecundario: {
      padding: '1rem 2rem',
      borderRadius: '50px',
      textDecoration: 'none',
      fontWeight: 700,
      fontSize: '1.1rem',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      border: '2px solid white',
      background: 'transparent',
      color: 'white',
    },
    estadoCarga: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center' as const,
      minHeight: '60vh',
      padding: '3rem 2rem',
    },
    spinnerVallenato: {
      position: 'relative' as const,
      marginBottom: '2rem',
    },
    acordeonAnimado: {
      fontSize: '4rem',
      animation: 'tocarAcordeon 1.5s ease-in-out infinite',
    },
    estadoError: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center' as const,
      minHeight: '60vh',
      padding: '3rem 2rem',
      background: 'rgba(255, 107, 53, 0.05)',
      borderRadius: '24px',
      border: '2px solid rgba(255, 107, 53, 0.2)',
    },
    iconoError: {
      fontSize: '4rem',
      marginBottom: '1rem',
    },
    botonVolver: {
      background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
      color: 'white',
      border: 'none',
      borderRadius: '50px',
      padding: '1rem 2rem',
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 32px rgba(255, 107, 53, 0.15)',
    },
  };

  return (
    <>
      {/* Barra de progreso de lectura */}
      <div style={styles.barraProgresoLectura}></div>

      <main style={styles.paginaArticuloBlog}>
        {cargando ? (
          <div style={styles.estadoCarga}>
            <div style={styles.spinnerVallenato}>
              <div style={styles.acordeonAnimado}>🪗</div>
            </div>
            <h3 style={{ color: '#2d5a3d', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>
              Cargando artículo musical...
            </h3>
            <p style={{ color: '#8b4513', fontSize: '1.1rem' }}>
              Preparando el mejor contenido sobre acordeón vallenato
            </p>
          </div>
        ) : error ? (
          <div style={styles.estadoError}>
            <div style={styles.iconoError}>🎵💔</div>
            <h3 style={{ color: '#ff6b35', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>
              ¡Ups! No encontramos este artículo
            </h3>
            <p style={{ color: '#8b4513', marginBottom: '2rem' }}>{error}</p>
            <button
              style={styles.botonVolver}
              onClick={() => window.history.back()}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 107, 53, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 107, 53, 0.15)';
              }}
            >
              ← Volver al Blog
            </button>
          </div>
        ) : articulo ? (
          <div style={styles.contenedorArticulo}>
            <div style={styles.layoutArticulo}>
              <section style={styles.contenidoPrincipal}>
                <HeroArticulo
                  titulo={articulo.titulo}
                  autor={articulo.autor || 'Jesús González'}
                  fecha={articulo.creado_en}
                  imagen_url={articulo.imagen_url}
                  resumen={articulo.resumen}
                  contenidoHtml={contenidoProcesado}
                  slug={articulo.slug}
                />

                <article
                  className="contenido-articulo-blog"
                  id="contenido-articulo"
                  style={styles.contenidoArticuloBlog}
                  dangerouslySetInnerHTML={{ __html: contenidoProcesado }}
                />

                {/* Call to Action final */}
                <div style={styles.ctaFinalArticulo}>
                  <div style={styles.ctaContenido}>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>
                      ¿Te gustó este artículo? 🎵
                    </h3>
                    <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
                      Únete a nuestra academia y aprende acordeón vallenato con Jesús González
                    </p>
                    <div style={styles.botonesCtaContainer}>
                      <a
                        href="/cursos"
                        style={styles.botonCtaPrincipal}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 15px 35px rgba(255, 215, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.3)';
                        }}
                      >
                        Ver Cursos
                      </a>
                      <a
                        href="/blog"
                        style={styles.botonCtaSecundario}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'white';
                          e.currentTarget.style.color = '#ff6b35';
                          e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        }}
                      >
                        Más Artículos
                      </a>
                    </div>
                  </div>
                  <div style={{
                    content: '🎵🪗🎵',
                    position: 'absolute' as const,
                    top: '1rem',
                    right: '2rem',
                    fontSize: '2rem',
                    opacity: 0.3,
                    animation: 'brillarCta 2s ease-in-out infinite',
                  }}>
                    🎵🪗🎵
                  </div>
                </div>
              </section>

              <SidebarDerechaBlog />
            </div>
          </div>
        ) : null}
      </main>

      <style>{`
        @keyframes tocarAcordeon {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }

        @keyframes brillarCta {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        /* YouTube embeds */
        .youtube-embed {
          position: relative;
          width: 100%;
          height: 0;
          padding-bottom: 56.25%;
          margin: 2rem 0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(255, 107, 53, 0.15);
        }

        .youtube-embed iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        /* Estilos del contenido del artículo */
        .contenido-articulo-blog h1,
        .contenido-articulo-blog h2,
        .contenido-articulo-blog h3 {
          scroll-margin-top: 120px;
        }

        .contenido-articulo-blog h1 {
          font-size: 2.1rem;
          font-weight: 800;
          color: #2d5a3d;
          border-bottom: 2.5px solid rgba(19, 182, 122, 0.1);
          padding-bottom: 0.5rem;
          margin: 2rem 0 1rem 0;
        }

        .contenido-articulo-blog h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ff6b35;
          border-bottom: 2px solid rgba(19, 182, 122, 0.1);
          padding-bottom: 0.3rem;
          margin: 1.5rem 0 1rem 0;
        }

        .contenido-articulo-blog h3 {
          font-size: 1.18rem;
          font-weight: 700;
          color: #1976d2;
          margin: 1.2rem 0 0.8rem 0;
        }

        .contenido-articulo-blog p {
          margin-bottom: 1.1em;
          line-height: 1.75;
        }

        .contenido-articulo-blog ul,
        .contenido-articulo-blog ol {
          margin: 1em 0;
          padding-left: 2em;
        }

        .contenido-articulo-blog li {
          margin-bottom: 0.5em;
        }

        .contenido-articulo-blog blockquote {
          border-left: 4px solid #ff6b35;
          background: rgba(255, 107, 53, 0.05);
          margin: 1.5em 0;
          padding: 1em 1.5em;
          border-radius: 0 12px 12px 0;
          font-style: italic;
        }

        .contenido-articulo-blog pre {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1em;
          overflow-x: auto;
          margin: 1.5em 0;
        }

        .contenido-articulo-blog code {
          background: rgba(255, 107, 53, 0.1);
          border-radius: 4px;
          padding: 0.2em 0.4em;
          font-size: 0.9em;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .layout-articulo {
            grid-template-columns: 1fr 300px;
            gap: 2rem;
          }
        }

        @media (max-width: 900px) {
          .layout-articulo {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          
          .contenido-articulo-blog {
            padding: 1.5rem;
          }
          
          .cta-final-articulo {
            padding: 2rem 1rem;
          }
          
          .botones-cta {
            flex-direction: column;
            align-items: center;
          }
        }

        @media (max-width: 500px) {
          .boton-cta-principal, .boton-cta-secundario {
            width: 100%;
            text-align: center;
          }
          
          .cta-contenido h3 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
};

export default ArticuloIndividual;
