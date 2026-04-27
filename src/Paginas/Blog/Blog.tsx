import React, { useState, useEffect } from 'react';
import { supabaseAnonimo } from '../../servicios/clienteSupabase';
import HeroBlog from '../../componentes/Blog/HeroBlog';
import TarjetaArticulo from '../../componentes/Blog/TarjetaArticulo';
import SidebarDerechaBlog from '../../componentes/Blog/SidebarDerechaBlog';
import SEO from '../../componentes/common/SEO';
import { blogStyles as styles } from './Blog.styles';
import './Blog.css';

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
      const { data, error: errorSupabase } = await supabaseAnonimo
        .from('blog_articulos')
        .select('*')
        .eq('estado_publicacion', 'publicado')
        .order('fecha_publicacion', { ascending: false });
      if (errorSupabase) throw new Error('Error al cargar los artículos del blog');
      setArticulos(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado al cargar los artículos');
    } finally {
      setCargando(false);
    }
  };

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      document.getElementById('articulos')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <SEO
        title="Blog - Academia Vallenata Online | Aprende Acordeón"
        description="Descubre historias inspiradoras, técnicas profesionales y consejos de expertos en acordeón vallenato. Únete a nuestra comunidad de músicos apasionados."
      />
      <main style={styles.paginaBlog} className="pagina-blog">
        <HeroBlog onCta={scrollToArticulos} />
        <section id="articulos"
          style={{ ...styles.seccionArticulos, opacity: mostrarContenido ? 1 : 0, transform: mostrarContenido ? 'translateY(0)' : 'translateY(20px)' }}
          className="seccion-articulos">
          {cargando ? (
            <div style={styles.estadoCarga} className="estado-carga">
              <div style={styles.spinnerCarga} className="spinner-carga"></div>
              <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }}>Cargando los mejores artículos...</p>
            </div>
          ) : error ? (
            <div style={styles.estadoError} className="estado-error">
              <div style={styles.iconoError} className="icono-error">⚠️</div>
              <h3 style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Oops, algo salió mal</h3>
              <p style={{ color: '#7f1d1d', marginBottom: '2rem' }}>{error}</p>
              <button style={styles.botonReintentar} className="boton-reintentar" onClick={cargarArticulos}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)'; }}>
                <span>Reintentar</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6M23 20v-6h-6" /><path d="m20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.36 4.36A9 9 0 0 1 3.51 15" />
                </svg>
              </button>
            </div>
          ) : (
            <div style={styles.contenidoPrincipal} className="contenido-principal">
              <div style={styles.areaArticulos} className="area-articulos">
                <div style={styles.encabezadoSeccion} className="encabezado-seccion">
                  <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, background: 'linear-gradient(135deg, #1e40af, #7c3aed, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '1rem' }}>
                    Últimos Artículos
                  </h2>
                  <p style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500 }}>Explora nuestro contenido más reciente sobre acordeón y vallenato</p>
                </div>
                {articulos.length > 0 ? (
                  <>
                    <div style={styles.grillaArticulos} className="grilla-articulos">
                      {articulosPaginados.map((articulo, index) => (
                        <div key={articulo.id} className="envolturio-articulo"
                          style={{ ...styles.envolturioArticulo, animationDelay: `${index * 0.1}s` }}>
                          <TarjetaArticulo {...articulo} />
                        </div>
                      ))}
                    </div>
                    {totalPaginas > 1 && (
                      <div style={styles.paginacion} className="paginacion">
                        <button style={{ ...styles.botonPagina, ...(paginaActual === 1 ? styles.botonDeshabilitado : {}) }}
                          className="boton-pagina" onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}
                          onMouseEnter={(e) => { if (paginaActual !== 1) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)'; } }}
                          onMouseLeave={(e) => { if (paginaActual !== 1) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'; } }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6" /></svg>
                          Anterior
                        </button>
                        <div style={styles.numerosPagina} className="numeros-pagina">
                          {Array(totalPaginas).fill(0).map((_, i) => (
                            <button key={i} className={`numero-pagina ${paginaActual === i + 1 ? 'activa' : ''}`}
                              style={{ ...styles.numeroPagina, ...(paginaActual === i + 1 ? styles.numeroPaginaActiva : {}) }}
                              onClick={() => cambiarPagina(i + 1)}
                              onMouseEnter={(e) => { if (paginaActual !== i + 1) { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.transform = 'scale(1.1)'; } }}
                              onMouseLeave={(e) => { if (paginaActual !== i + 1) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.transform = 'scale(1)'; } }}>
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        <button style={{ ...styles.botonPagina, ...(paginaActual === totalPaginas ? styles.botonDeshabilitado : {}) }}
                          className="boton-pagina" onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}
                          onMouseEnter={(e) => { if (paginaActual !== totalPaginas) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)'; } }}
                          onMouseLeave={(e) => { if (paginaActual !== totalPaginas) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'; } }}>
                          Siguiente
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6" /></svg>
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
              <aside style={styles.barraLateral} className="barra-lateral">
                <SidebarDerechaBlog />
              </aside>
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default Blog;
