import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../servicios/supabaseCliente';
import Avatar from './Avatar';
import { GamificacionServicio as GamificacionService } from '../../../servicios/gamificacionServicio';
import { obtenerSlugUsuario } from '../../../utils/utilidadesSlug';
import './SidebarDerecho.css';

const SidebarDerecho: React.FC = () => {
    const navigate = useNavigate();

    // 📊 Estados
    const [cargando, setCargando] = useState(true);
    const [articulosBlog, setArticulosBlog] = useState<any[]>([]);
    const [rankingTop, setRankingTop] = useState<any[]>([]);
    const [publicacionesRecientes, setPublicacionesRecientes] = useState<any[]>([]);

    // 🎯 DATOS POR DEFECTO
    const datosPorDefecto = {
        blog: [
            {
                id: 1,
                titulo: '¿Cómo convertir tu talento musical en un negocio real?',
                fecha: '24 jun', // Usamos string si no hay fecha real
                vistas: '0',
                estado: 'publicado',
                creado_en: new Date().toISOString()
            },
            {
                id: 2,
                titulo: '¿Y si no encuentro mi estilo al tocar acordeón?',
                fecha: '24 jun',
                vistas: '0',
                estado: 'publicado',
                creado_en: new Date().toISOString()
            }
        ],
        ranking: [
            { nombre: 'Jesus Gonzalez', puntos: 3537, posicion: 1, perfiles: { nombre: 'Jesus', apellido: 'Gonzalez' } },
            { nombre: 'Robinson Niñez', puntos: 1900, posicion: 2, perfiles: { nombre: 'Robinson', apellido: 'Niñez' } },
            { nombre: 'John Orozco', puntos: 1900, posicion: 3, perfiles: { nombre: 'John', apellido: 'Orozco' } }
        ]
    };

    // 📰 Cargar artículos del blog
    const cargarBlog = async () => {
        try {
            // 📊 CARGAR DATOS REALES
            const { data: articulos, error } = await supabase
                .from('blog_articulos')
                .select('*')
                .eq('estado', 'publicado')
                .order('creado_en', { ascending: false })
                .limit(2);

            if (error) throw error;

            if (articulos && articulos.length > 0) {
                setArticulosBlog(articulos);
                console.log('📰 Blog actualizado con datos reales:', articulos.length);
            } else {
                setArticulosBlog(datosPorDefecto.blog);
            }
        } catch (error) {
            console.error('Error cargando blog:', error);
            setArticulosBlog(datosPorDefecto.blog);
        }
    };

    // 🏆 Cargar ranking top
    const cargarRanking = async () => {
        try {
            // 📊 CARGAR DATOS REALES
            const ranking = await GamificacionService.obtenerRanking('general', 3);

            if (ranking && ranking.length > 0) {
                setRankingTop(ranking);
                console.log('🏆 Ranking actualizado:', ranking.length);
            } else {
                setRankingTop(datosPorDefecto.ranking);
            }
        } catch (error) {
            console.error('Error cargando ranking:', error);
            setRankingTop(datosPorDefecto.ranking);
        }
    };

    // 👥 Cargar publicaciones recientes
    const cargarComunidad = async () => {
        try {
            const { data: publicaciones, error } = await supabase
                .from('comunidad_publicaciones')
                .select('*, perfiles(nombre, apellido, url_foto_perfil, nombre_usuario, nombre_completo)') // Asegurar campos
                .order('fecha_creacion', { ascending: false })
                .limit(2);

            if (error) throw error;

            const publicacionesProcesadas = (publicaciones || []).map((pub: any) => {
                // Adaptamos para que coincida con la interfaz esperada por obtenerSlugUsuario y visualización
                const perfil = pub.perfiles || {};
                const datosUsuario = {
                    nombre_usuario: perfil.nombre_usuario,
                    nombre: perfil.nombre || pub.usuario_nombre,
                    apellido: perfil.apellido,
                    nombre_completo: perfil.nombre_completo,
                    usuario_nombre: pub.usuario_nombre
                };

                const usuarioSlug = obtenerSlugUsuario(datosUsuario);

                return {
                    ...pub,
                    usuario_slug: usuarioSlug,
                    contenido: pub.descripcion || pub.contenido || '',
                    usuario_nombre: pub.usuario_nombre || perfil.nombre || 'Usuario',
                    perfiles: perfil // Asegurar que perfiles este disponible
                };
            });

            setPublicacionesRecientes(publicacionesProcesadas);
            console.log('👥 Comunidad cargada:', publicacionesProcesadas.length);
        } catch (error) {
            console.error('Error cargando comunidad:', error);
            setPublicacionesRecientes([]);
        }
    };

    useEffect(() => {
        // Inicializar con datos por defecto para evitar layout shift brusco
        setArticulosBlog(datosPorDefecto.blog);
        setRankingTop(datosPorDefecto.ranking);
        setCargando(false);

        const cargarDatos = async () => {
            await Promise.all([
                cargarBlog(),
                cargarRanking(),
                cargarComunidad()
            ]);
        };

        cargarDatos();
    }, []);

    // 🎨 Formatear fecha
    const formatearFecha = (fecha: string): string => {
        if (!fecha) return '';
        const ahora = new Date();
        const fechaPost = new Date(fecha);
        const diferencia = ahora.getTime() - fechaPost.getTime();
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

        if (dias === 0) return 'Hoy';
        if (dias === 1) return 'Ayer';
        if (dias < 7) return `${dias} días`;
        return fechaPost.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
    };

    // 🎯 Truncar texto
    const truncarTexto = (texto: string, limite: number = 80): string => {
        if (!texto) return '';
        return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
    };

    return (
        <aside className="academia-sidebar-derecho">

            {cargando ? (
                <div className="academia-loading-sidebar">
                    <div className="academia-spinner"></div>
                    <p>Cargando...</p>
                </div>
            ) : (
                <>
                    {/* 📰 BLOG RECIENTE */}
                    <div className="academia-widget-card academia-blog-widget">
                        <div className="academia-widget-header">
                            <h4>📰 Blog Reciente</h4>
                            <button className="academia-ver-todo" onClick={() => navigate('/blog')}>Ver todo</button>
                        </div>

                        {articulosBlog.length > 0 ? (
                            <div className="academia-blog-lista">
                                {articulosBlog.map((articulo) => (
                                    <div
                                        key={articulo.id}
                                        className="academia-blog-item"
                                        onClick={() => navigate(`/blog/${articulo.slug}`)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <div className="academia-blog-imagen">
                                            <img
                                                src={articulo.imagen_url || 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80'}
                                                alt={articulo.titulo}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80';
                                                }}
                                            />
                                        </div>
                                        <div className="academia-blog-info">
                                            <h5>{truncarTexto(articulo.titulo, 60)}</h5>
                                            <p className="academia-blog-fecha">{formatearFecha(articulo.creado_en)}</p>
                                            <div className="academia-blog-stats">
                                                <span>👁️ {articulo.lecturas || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="academia-no-data">
                                <p>📰 No hay artículos recientes</p>
                            </div>
                        )}
                    </div>

                    {/* 🏆 RANKING TOP 5 */}
                    <div className="academia-widget-card academia-ranking-widget">
                        <div className="academia-widget-header">
                            <h4>🏆 Top Ranking</h4>
                            <button className="academia-ver-todo" onClick={() => navigate('/ranking')}>Ver todo</button>
                        </div>

                        {rankingTop.length > 0 ? (
                            <div className="academia-ranking-lista">
                                {rankingTop.map((usuario, index) => (
                                    <div key={index} className="academia-ranking-item">
                                        <div className="academia-ranking-posicion">
                                            <span className={`academia-posicion-numero ${index < 3 ? 'academia-top-tres' : ''}`}>
                                                {usuario.posicion || index + 1}
                                            </span>
                                        </div>
                                        <div className="academia-ranking-avatar">
                                            <Avatar
                                                src={usuario.perfiles?.url_foto_perfil}
                                                alt={usuario.perfiles?.nombre}
                                                nombreCompleto={`${usuario.perfiles?.nombre || ''} ${usuario.perfiles?.apellido || ''}`}
                                                size="small"
                                            />
                                        </div>
                                        <div className="academia-ranking-info">
                                            <h6>{usuario.perfiles?.nombre || 'Usuario'} {usuario.perfiles?.apellido || ''}</h6>
                                            <div className="academia-ranking-stats">
                                                <span className="academia-xp">Pos. #{usuario.posicion}</span>
                                                <span className="academia-puntos">{(usuario.puntuacion || 0).toLocaleString()} pts</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="academia-no-data">
                                <p>🏆 Ranking no disponible</p>
                            </div>
                        )}
                    </div>

                    {/* 👥 COMUNIDAD RECIENTE */}
                    <div className="academia-widget-card academia-comunidad-widget">
                        <div className="academia-widget-header">
                            <h4>👥 Comunidad</h4>
                            <button className="academia-ver-todo" onClick={() => navigate('/comunidad')}>Ver todo</button>
                        </div>

                        {publicacionesRecientes.length > 0 ? (
                            <div className="academia-comunidad-lista">
                                {publicacionesRecientes.slice(0, 2).map((publicacion) => (
                                    <div
                                        key={publicacion.id}
                                        className="academia-comunidad-item"
                                        onClick={() => publicacion.usuario_slug && navigate(`/usuarios/${publicacion.usuario_slug}/publicaciones`)} // Usar el slug generado
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <div className="academia-publicacion-avatar">
                                            <Avatar
                                                src={publicacion.perfiles?.url_foto_perfil}
                                                alt={publicacion.usuario_nombre}
                                                nombreCompleto={`${publicacion.perfiles?.nombre || publicacion.usuario_nombre} ${publicacion.perfiles?.apellido || ''}`}
                                                size="small"
                                            />
                                        </div>
                                        <div className="academia-publicacion-info">
                                            <h6>{publicacion.usuario_nombre}</h6>
                                            <p>{truncarTexto(publicacion.contenido, 50)}</p>
                                            <div className="academia-publicacion-stats">
                                                <span>❤️ {publicacion.total_comentarios || 0}</span>
                                                <span>{formatearFecha(publicacion.fecha_creacion)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="academia-no-data">
                                <p>👥 No hay publicaciones recientes</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </aside>
    );
};

export default SidebarDerecho;
