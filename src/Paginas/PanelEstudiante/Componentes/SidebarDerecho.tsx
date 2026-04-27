import React from 'react';
import Avatar from './Avatar';
import { useSidebarDerecho, formatearFecha, truncarTexto } from '../Hooks/useSidebarDerecho';
import './SidebarDerecho.css';

const SidebarDerecho: React.FC = () => {
    const { cargando, articulosBlog, rankingTop, publicacionesRecientes, navigate } = useSidebarDerecho();

    return (
        <aside className="academia-sidebar-derecho">
            {cargando ? (
                <div className="academia-loading-sidebar">
                    <div className="academia-spinner"></div>
                    <p>Cargando...</p>
                </div>
            ) : (
                <>
                    <div className="academia-widget-card academia-blog-widget">
                        <div className="academia-widget-header">
                            <h4>📰 Blog Reciente</h4>
                            <button className="academia-ver-todo" onClick={() => navigate('/blog')}>Ver todo</button>
                        </div>
                        {articulosBlog.length > 0 ? (
                            <div className="academia-blog-lista">
                                {articulosBlog.map((articulo) => (
                                    <div key={articulo.id} className="academia-blog-item" onClick={() => navigate(`/blog/${articulo.slug}`)} role="button" tabIndex={0}>
                                        <div className="academia-blog-imagen">
                                            <img
                                                src={articulo.imagen_url || 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80'}
                                                alt={articulo.titulo}
                                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80'; }}
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
                            <div className="academia-no-data"><p>📰 No hay artículos recientes</p></div>
                        )}
                    </div>

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
                                            <Avatar src={usuario.perfiles?.url_foto_perfil} alt={usuario.perfiles?.nombre} nombreCompleto={`${usuario.perfiles?.nombre || ''} ${usuario.perfiles?.apellido || ''}`} size="small" />
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
                            <div className="academia-no-data"><p>🏆 Ranking no disponible</p></div>
                        )}
                    </div>

                    <div className="academia-widget-card academia-comunidad-widget">
                        <div className="academia-widget-header">
                            <h4>👥 Comunidad</h4>
                            <button className="academia-ver-todo" onClick={() => navigate('/comunidad')}>Ver todo</button>
                        </div>
                        {publicacionesRecientes.length > 0 ? (
                            <div className="academia-comunidad-lista">
                                {publicacionesRecientes.slice(0, 2).map((pub) => (
                                    <div key={pub.id} className="academia-comunidad-item" onClick={() => pub.usuario_slug && navigate(`/usuarios/${pub.usuario_slug}/publicaciones`)} role="button" tabIndex={0}>
                                        <div className="academia-publicacion-avatar">
                                            <Avatar src={pub.perfiles?.url_foto_perfil} alt={pub.usuario_nombre} nombreCompleto={`${pub.perfiles?.nombre || pub.usuario_nombre} ${pub.perfiles?.apellido || ''}`} size="small" />
                                        </div>
                                        <div className="academia-publicacion-info">
                                            <h6>{pub.usuario_nombre}</h6>
                                            <p>{truncarTexto(pub.contenido, 50)}</p>
                                            <div className="academia-publicacion-stats">
                                                <span>❤️ {pub.total_comentarios || 0}</span>
                                                <span>{formatearFecha(pub.fecha_creacion)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="academia-no-data"><p>👥 No hay publicaciones recientes</p></div>
                        )}
                    </div>
                </>
            )}
        </aside>
    );
};

export default SidebarDerecho;
