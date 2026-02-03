import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, Star, ChevronDown, AlertTriangle, Loader, Play, Pause } from 'lucide-react';
import './ArticuloBlog.css';
import SidebarDerechaBlog from '../../componentes/Blog/SidebarDerechaBlog';
import SkeletonBlog from '../../componentes/Skeletons/SkeletonBlog';
import { supabaseAnon } from '../../servicios/supabaseCliente';

// Propiedades de las secciones del artículo
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

// Función utilitaria para slugs consistentes
const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Reemplazar espacios con -
        .replace(/[^\w\-]+/g, '') // Eliminar caracteres no permitidos
        .replace(/\-\-+/g, '-');  // Reemplazar múltiples guiones
};

// Componente para renderizar el contenido dinámico del artículo
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

// Componente Banner CTA Final
const BannerCtaBlog = () => {
    return (
        <div className="cta-banner-final">
            <div className="icono-musica-flotante nota-1">♪</div>
            <div className="icono-musica-flotante nota-2">♫</div>
            <div className="icono-musica-flotante nota-3">♩</div>

            <h3 className="cta-banner-titulo">
                ¿Te gustó este artículo? 🎵
            </h3>
            <p className="cta-banner-descripcion">
                Únete a nuestra academia y aprende acordeón vallenato con Jesús González. Técnicas, teoría y práctica en un solo lugar.
            </p>

            <div className="cta-banner-acciones">
                <Link to="/cursos" className="btn-banner primary">Ver Cursos</Link>
                <Link to="/blog" className="btn-banner outline">Más Artículos</Link>
            </div>
        </div>
    );
};

// Componente para el reproductor de audio TTS Mejorado
const ReproductorAudio = ({ texto }: { texto: string }) => {
    const [reproduciendo, setReproduciendo] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [tiempoActual, setTiempoActual] = useState('0:00');
    const [duracion, setDuracion] = useState('0:00');
    const [vozSeleccionada, setVozSeleccionada] = useState<SpeechSynthesisVoice | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Cargar voces y seleccionar una mejor (Prioridad: Colombia > Latino > Español)
    useEffect(() => {
        const cargarVoces = () => {
            const voces = window.speechSynthesis.getVoices();
            console.log("Voces disponibles:", voces.map(v => `${v.name} (${v.lang})`)); // Debug para el usuario si mira consola

            // 1. Prioridad: Español Colombia (es-CO)
            // 2. Prioridad: Voces masculinas conocidas en español (Microsoft Pablo, Google español de Latinoamérica)
            // 3. Fallback: Cualquier español

            let vozElegida = voces.find(v => v.lang === 'es-CO');

            if (!vozElegida) {
                // Intentar buscar voces masculinas latinas conocidas
                vozElegida = voces.find(v =>
                    (v.name.includes('Pablo') || v.name.includes('Raul') || v.name.includes('Latinoamérica')) && v.lang.startsWith('es')
                );
            }

            if (!vozElegida) {
                // Fallback general a español
                vozElegida = voces.find(v => v.lang.startsWith('es'));
            }

            if (vozElegida) {
                console.log("Voz seleccionada:", vozElegida.name);
                setVozSeleccionada(vozElegida);
            }
        };

        window.speechSynthesis.onvoiceschanged = cargarVoces;
        cargarVoces();

        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    const formatearTiempo = (segundos: number) => {
        if (!isFinite(segundos) || isNaN(segundos)) return "0:00";
        const s = Math.floor(segundos);
        return `${Math.floor(s / 60)}:${('0' + (s % 60)).slice(-2)}`;
    };

    const limpiarSpeech = () => {
        window.speechSynthesis.cancel();
    };

    // Inicializar Utterance
    useEffect(() => {
        if (!texto) return;

        // Limpiamos cualquier instancia previa
        limpiarSpeech();

        const ut = new SpeechSynthesisUtterance(texto);
        ut.rate = 1.0; // Velocidad normal
        ut.pitch = 1.0;
        if (vozSeleccionada) ut.voice = vozSeleccionada;
        else ut.lang = 'es-ES';

        // Estimación de duración (aprox 150 palabras por minuto ~ 2.5 palabras por segundo)
        const palabras = texto.split(/\s+/).length;
        const duracionEstimadaSegundos = palabras / 2.5;
        setDuracion(formatearTiempo(duracionEstimadaSegundos));

        utteranceRef.current = ut;

        return () => limpiarSpeech();
    }, [texto, vozSeleccionada]);

    const togglePlay = () => {
        const synth = window.speechSynthesis;
        if (!utteranceRef.current) return;

        if (reproduciendo) {
            synth.pause();
            setReproduciendo(false);
        } else {
            if (synth.paused) {
                synth.resume();
            } else {
                // Configurar eventos justo antes de hablar para asegurar consistencia
                utteranceRef.current.onend = () => {
                    setReproduciendo(false);
                    setProgreso(100);
                };
                utteranceRef.current.onboundary = (event) => {
                    const charIndex = event.charIndex;
                    const textLen = utteranceRef.current?.text.length || 1;
                    const percent = (charIndex / textLen) * 100;
                    setProgreso(percent);

                    // Actualizar tiempo actual basado en porcentaje
                    const palabras = texto.split(/\s+/).length;
                    const totalSeg = palabras / 2.5;
                    setTiempoActual(formatearTiempo((percent / 100) * totalSeg));
                };

                synth.speak(utteranceRef.current);
            }
            setReproduciendo(true);
        }
    };

    if (!texto) return null;

    return (
        <div className="reproductor-audio">
            <span className="reproductor-label">Audio Artículo</span>
            <button onClick={togglePlay} className="btn-play" aria-label={reproduciendo ? 'Pausar' : 'Escuchar'}>
                {reproduciendo ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
            </button>
            <div className="progreso-audio">
                <div className="barra-progreso" style={{ width: `${progreso}%` }}></div>
            </div>
            <div className="tiempo-audio">{tiempoActual}</div>
        </div>
    );
};


import BarraProgresoLectura from '../../componentes/ui/BarraProgresoLectura';

// Página de detalle de artículo con contenido completo y tabla de contenidos
export default function ArticuloBlog() {
    const { slug } = useParams();
    const [resumenExpandido, setResumenExpandido] = useState(false);
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
        // Scroll top al cargar
        window.scrollTo(0, 0);

        // Lógica de carga
        let activo = true;
        async function cargar() {
            if (!slug) {
                setCargando(false);
                return;
            }

            setCargando(true);
            setError(null);

            try {
                const { data, error: err } = await supabaseAnon
                    .from('blog_articulos')
                    .select('*')
                    .eq('slug', slug)
                    .eq('estado_publicacion', 'publicado')
                    .maybeSingle();

                if (err) throw err;

                if (activo) {
                    if (data) {
                        // Parsear campos JSON si vienen como string (depende de la versión de supabase-js a veces)
                        const secciones = typeof data.secciones === 'string' ? JSON.parse(data.secciones) : data.secciones;
                        const cta = typeof data.cta === 'string' ? JSON.parse(data.cta) : data.cta;
                        setArticuloData({ ...data, secciones, cta });
                    } else {
                        // Intento de fallback o error
                        setArticuloData(null);
                    }
                }
            } catch (e: any) {
                console.error(e);
                if (activo) setError('No pudimos cargar el artículo.');
            } finally {
                if (activo) setCargando(false);
            }
        }
        cargar();
        return () => { activo = false; };
    }, [slug]);

    if (cargando) {
        return <SkeletonBlog />;
    }

    if (!articuloData) return <div className="pagina-blog-estado"><h2>Artículo no encontrado</h2><Link to="/blog" className="btn-cta">Volver</Link></div>;

    const cabecera = {
        titulo: articuloData.titulo,
        autor: articuloData.autor || "JESUS GONZALEZ",
        autorIniciales: articuloData.autor_iniciales || "JG",
        fecha: formatearFecha(articuloData.fecha_publicacion),
        lecturaMin: articuloData.lectura_min ?? 5,
        rating: articuloData.calificacion ?? 5,
        portada: articuloData.portada_url || '/placeholder-blog.jpg'
    };

    const textoParaHablar = [
        cabecera.titulo,
        articuloData.resumen_completo,
        ...(Array.isArray(articuloData.secciones) ? articuloData.secciones.map(s => s.contenido).filter(Boolean) : [])
    ].join('. ');

    const encabezados = Array.isArray(articuloData.secciones) ? articuloData.secciones.filter(s => s.tipo === 'encabezado') : [];

    // Función simple de slug para anchor links
    const slugify = (text: string) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

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

                            <ReproductorAudio texto={textoParaHablar} duracionEstimadaMinutos={cabecera.lecturaMin} />
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
