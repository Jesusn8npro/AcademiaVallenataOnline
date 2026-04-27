import React, { useState, useEffect } from 'react';
import { supabaseAnonimo } from '../../servicios/clienteSupabase';
import HeroArticulo from '../../componentes/Blog/articulos/HeroArticulo';
import SidebarDerechaBlog from '../../componentes/Blog/SidebarDerechaBlog';
import { articuloStyles as styles } from './ArticuloIndividual.styles';
import './ArticuloIndividual.css';

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
  const slug = window.location.pathname.split('/blog/')[1];
  const [articulo, setArticulo] = useState<Articulo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [progresoLectura, setProgresoLectura] = useState(0);
  const [mostrarPagina, setMostrarPagina] = useState(false);
  const [contenidoProcesado, setContenidoProcesado] = useState('');

  const embedYouTube = (html: string): string => {
    if (!html) return '';
    return html.replace(/https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/g,
      (_match: string, _a: string, _b: string, videoId: string) =>
        `<div class='youtube-embed'><iframe width='100%' height='340' src='https://www.youtube.com/embed/${videoId}' title='YouTube video' frameborder='0' allowfullscreen></iframe></div>`
    );
  };

  const calcularTiempoLectura = (contenido: string): number => {
    const palabras = contenido.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(palabras / 200);
  };

  const procesarContenidoConIds = (html: string): string => {
    return html.replace(/<(h[1-6])([^>]*)>([^<]+)<\/h[1-6]>/gi, (_match, tag, attrs, text) => {
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
      return `<${tag}${attrs} id="${id}">${text}</${tag}>`;
    });
  };

  const manejarScroll = () => {
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
        const { data: art, error: errorArt } = await supabaseAnonimo
          .from('blog_articulos').select('*').eq('slug', slug).eq('estado', 'publicado').single();
        if (errorArt || !art) {
          setError('No se encontró el artículo.');
        } else {
          setArticulo(art as Articulo);
          const htmlConYoutube = embedYouTube(art.contenido || '');
          setContenidoProcesado(procesarContenidoConIds(htmlConYoutube));
        }
      } catch {
        setError('Error al cargar los datos.');
      }
      setCargando(false);
      setMostrarPagina(true);
    };

    cargarArticulo();
    window.addEventListener('scroll', manejarScroll, { passive: true });
    return () => window.removeEventListener('scroll', manejarScroll);
  }, [slug]);

  return (
    <>
      <div style={{ ...styles.barraProgresoLectura, width: `${progresoLectura}%` }} />
      <main style={{ ...styles.paginaArticuloBlog, opacity: mostrarPagina ? 1 : 0 }}>
        {cargando ? (
          <div style={styles.estadoCarga}>
            <div style={styles.spinnerVallenato}>
              <div style={styles.acordeonAnimado}>🪗</div>
            </div>
            <h3 style={{ color: '#2d5a3d', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>Cargando artículo musical...</h3>
            <p style={{ color: '#8b4513', fontSize: '1.1rem' }}>Preparando el mejor contenido sobre acordeón vallenato</p>
          </div>
        ) : error ? (
          <div style={styles.estadoError}>
            <div style={styles.iconoError}>🎵💔</div>
            <h3 style={{ color: '#ff6b35', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem' }}>¡Ups! No encontramos este artículo</h3>
            <p style={{ color: '#8b4513', marginBottom: '2rem' }}>{error}</p>
            <button style={styles.botonVolver} onClick={() => window.history.back()}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 107, 53, 0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 107, 53, 0.15)'; }}>
              ← Volver al Blog
            </button>
          </div>
        ) : articulo ? (
          <div style={styles.contenedorArticulo}>
            <div style={styles.layoutArticulo}>
              <section style={styles.contenidoPrincipal}>
                <HeroArticulo
                  titulo={articulo.titulo} autor={articulo.autor || 'Jesús González'}
                  fecha={articulo.creado_en} imagen_url={articulo.imagen_url}
                  resumen={articulo.resumen} contenidoHtml={contenidoProcesado} slug={articulo.slug}
                />
                <article className="contenido-articulo-blog" id="contenido-articulo"
                  style={styles.contenidoArticuloBlog}
                  dangerouslySetInnerHTML={{ __html: contenidoProcesado }} />
                <div style={styles.ctaFinalArticulo}>
                  <div style={styles.ctaContenido}>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>¿Te gustó este artículo? 🎵</h3>
                    <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>Únete a nuestra academia y aprende acordeón vallenato con Jesús González</p>
                    <div style={styles.botonesCtaContainer}>
                      <a href="/cursos" style={styles.botonCtaPrincipal}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(255, 215, 0, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.3)'; }}>
                        Ver Cursos
                      </a>
                      <a href="/blog" style={styles.botonCtaSecundario}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#ff6b35'; e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}>
                        Más Artículos
                      </a>
                    </div>
                  </div>
                  <div style={{ position: 'absolute' as const, top: '1rem', right: '2rem', fontSize: '2rem', opacity: 0.3, animation: 'brillarCta 2s ease-in-out infinite' }}>🎵🪗🎵</div>
                </div>
              </section>
              <SidebarDerechaBlog />
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
};

export default ArticuloIndividual;
