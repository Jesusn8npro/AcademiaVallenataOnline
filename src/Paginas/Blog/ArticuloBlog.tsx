import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import './ArticuloBlog.css';
import SidebarDerechaBlog from '../../componentes/Blog/SidebarDerechaBlog';
import SkeletonBlog from '../../componentes/Skeletons/SkeletonBlog';
import { supabaseAnonimo } from '../../servicios/clienteSupabase';
import BarraProgresoLectura from '../../componentes/ui/BarraProgresoLectura';
import ReproductorAudio from './ReproductorAudio';

interface ContenidoSeccion {
    tipo: string;
    contenido: string;
    url?: string;
    alt?: string;
    caption?: string;
    nivel?: number;
    ordenada?: boolean;
    items?: string[];
}

interface ArticuloData {
    titulo: string;
    fecha_publicacion: string;
    lectura_min: number;
    calificacion: number;
    portada_url: string;
    autor: string;
    autor_iniciales: string;
    resumen_breve: string;
    resumen_completo: string;
    secciones: ContenidoSeccion[];
    cta: { items: any[] };
}

const slugify = (text: string) =>
    text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');

const RenderizadorContenido = ({ secciones }: { secciones: ContenidoSeccion[] }) => {
    if (!Array.isArray(secciones)) {
        return <p>El contenido del artículo no es válido.</p>;
    }

    return (
        <>
            {secciones.map((seccion, index) => {
                const id = seccion.titulo ? slugify(seccion.titulo) : `seccion-${index}`;

                switch (seccion.tipo) {
                    case 'encabezado':
                        const Nivel = `h${seccion.nivel || 2}` as keyof JSX.IntrinsicElements;
                        return React.createElement(Nivel, { key: id, id, className: "bloque-titulo" }, seccion.contenido);

                    case 'parrafo':
                        return <p key={id} className="bloque-texto">{seccion.contenido}</p>;

                    case 'imagen':
                        return (
                            <figure key={id} className="imagen-inline">
                                <img src={seccion.url} alt={seccion.alt || 'Imagen del artículo'} loading="lazy" decoding="async" />
                                {seccion.caption && <figcaption>{seccion.caption}</figcaption>}
                            </figure>
                        );

                    case 'lista':
                        const Lista = seccion.ordenada ? 'ol' : 'ul';
                        return (
                            <Lista key={id} className="bloque-texto">
                                {Array.isArray(seccion.items) && seccion.items.map((item, i) => <li key={i}>{item}</li>)}
                            </Lista>
                        );

                    default:
                        return null;
                }
            })}
        </>
    );
};

const BannerCtaBlog = () => (
    <div className="cta-banner-final">
        <div className="icono-musica-flotante nota-1">♪</div>
        <div className="icono-musica-flotante nota-2">♫</div>
        <div className="icono-musica-flotante nota-3">♩</div>
        <h3 className="cta-banner-titulo">¿Te gustó este artículo? 🎵</h3>
        <p className="cta-banner-descripcion">
            Únete a nuestra academia y aprende acordeón vallenato con Jesús González. Técnicas, teoría y práctica en un solo lugar.
        </p>
        <div className="cta-banner-acciones">
            <Link to="/cursos" className="btn-banner primary">Ver Cursos</Link>
            <Link to="/blog" className="btn-banner outline">Más Artículos</Link>
        </div>
    </div>
);

export default function ArticuloBlog() {
    const { slug } = useParams();
    const [articuloData, setArticuloData] = useState<ArticuloData | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const formatearFecha = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch {
            return iso;
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);

        let activo = true;
        async function cargar() {
            if (!slug) { setCargando(false); return; }
            setCargando(true);
            setError(null);
            try {
                const { data, error: err } = await supabaseAnonimo
                    .from('blog_articulos')
                    .select('*')
                    .eq('slug', slug)
                    .eq('estado_publicacion', 'publicado')
                    .maybeSingle();

                if (err) throw err;

                if (activo) {
                    if (data) {
                        // supabase-js sometimes returns JSON fields as strings
                        const secciones = typeof data.secciones === 'string' ? JSON.parse(data.secciones) : data.secciones;
                        const cta = typeof data.cta === 'string' ? JSON.parse(data.cta) : data.cta;
                        setArticuloData({ ...data, secciones, cta });
                    } else {
                        setArticuloData(null);
                    }
                }
            } catch {
                if (activo) setError('No pudimos cargar el artículo.');
            } finally {
                if (activo) setCargando(false);
            }
        }
        cargar();
        return () => { activo = false; };
    }, [slug]);

    if (cargando) return <SkeletonBlog />;
    if (!articuloData) return <div className="pagina-blog-estado"><h2>Artículo no encontrado</h2><Link to="/blog" className="btn-cta">Volver</Link></div>;

    const cabecera = {
        titulo: articuloData.titulo,
        autor: articuloData.autor || "JESUS GONZALEZ",
        autorIniciales: articuloData.autor_iniciales || "JG",
        fecha: formatearFecha(articuloData.fecha_publicacion),
        lecturaMin: articuloData.lectura_min ?? 5,
        portada: articuloData.portada_url || '/placeholder-blog.jpg'
    };

    const textoParaHablar = [
        cabecera.titulo,
        articuloData.resumen_completo,
        ...(Array.isArray(articuloData.secciones) ? articuloData.secciones.map(s => s.contenido).filter(Boolean) : [])
    ].join('. ');

    const encabezados = Array.isArray(articuloData.secciones)
        ? articuloData.secciones.filter(s => s.tipo === 'encabezado')
        : [];

    return (
        <div className="pagina-blog">
            <BarraProgresoLectura />
            <section className="seccion-articulos articulo-contenedor">
                <div className="grid-blog">
                    <article className="articulo">
                        <header className="articulo-header">
                            <h1 className="articulo-titulo">{cabecera.titulo}</h1>
                            <div className="articulo-meta">
                                <div className="avatar">{cabecera.autorIniciales}</div>
                                <span>{cabecera.autor}</span>
                                <span className="dot">•</span>
                                <span className="fecha">{cabecera.fecha}</span>
                                <span className="dot">•</span>
                                <span className="lectura"><Clock size={14} /> {cabecera.lecturaMin} min</span>
                            </div>
                            <ReproductorAudio texto={textoParaHablar} />
                        </header>

                        <div className="articulo-imagen">
                            <img src={cabecera.portada} alt={cabecera.titulo} />
                        </div>

                        <div className="articulo-contenido">
                            {(articuloData.resumen_breve || articuloData.resumen_completo) && (
                                <div className="resumen-destacado">
                                    <p className="resumen-texto" style={{ fontStyle: 'italic', fontSize: '1.1em', color: '#4b5563' }}>
                                        {articuloData.resumen_completo || articuloData.resumen_breve}
                                    </p>
                                </div>
                            )}

                            {encabezados.length > 0 && (
                                <nav className="tabla-contenidos">
                                    <p className="toc-title">En este artículo:</p>
                                    <ul>
                                        {encabezados.map((h, i) => (
                                            <li key={i}><a href={`#${slugify(h.contenido)}`}>{h.contenido}</a></li>
                                        ))}
                                    </ul>
                                </nav>
                            )}

                            <RenderizadorContenido secciones={articuloData.secciones} />
                            <BannerCtaBlog />
                        </div>
                    </article>

                    <SidebarDerechaBlog />
                </div>
            </section>
        </div>
    );
}
