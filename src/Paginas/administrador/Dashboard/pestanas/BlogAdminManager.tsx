import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../servicios/supabaseCliente';
import './BlogAdminManager.css';
import { Plus, Edit3, Trash2, Eye } from 'lucide-react';

const BlogAdminManager = () => {
    const [articulos, setArticulos] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarArticulos();
    }, []);

    const cargarArticulos = async () => {
        try {
            setCargando(true);
            const { data, error } = await supabase
                .from('blog_articulos')
                .select('*')
                .order('fecha_publicacion', { ascending: false });

            if (error) throw error;
            setArticulos(data || []);
        } catch (error) {
            console.error('Error cargando artículos:', error);
        } finally {
            setCargando(false);
        }
    };

    const iniciarNuevoArticulo = () => {
        // Navegar a crear o mostrar modal
        console.log("Crear nuevo artículo");
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="gestor-blog">
            <header className="encabezado-gestor">
                <h1>Administración de Blog</h1>
                <button className="boton-primario" onClick={iniciarNuevoArticulo}>
                    <Plus size={20} />
                    <span>Nuevo Artículo</span>
                </button>
            </header>

            {/* Listado de Artículos */}
            <section className="grid-articulos">
                {cargando ? (
                    <div className="estado-general">
                        <div className="spinner-blog"></div>
                        <p>Cargando artículos...</p>
                    </div>
                ) : articulos.length === 0 ? (
                    <div className="estado-general">
                        <h3>No hay artículos todavía</h3>
                        <p>¡Crea tu primer artículo para empezar a compartir tu conocimiento!</p>
                    </div>
                ) : (
                    articulos.map((articulo) => (
                        <div key={articulo.id} className="tarjeta-articulo">
                            <div className="imagen-articulo">
                                {articulo.portada_url ? (
                                    <img src={articulo.portada_url} alt={articulo.titulo} />
                                ) : (
                                    <div className="placeholder-imagen">
                                        <span style={{ fontSize: '2rem' }}>📝</span>
                                    </div>
                                )}
                                <span className={`badge-estado ${articulo.estado_publicacion}`}>
                                    {articulo.estado_publicacion === 'publicado' ? 'Publicado' : 'Borrador'}
                                </span>
                            </div>
                            <div className="contenido-articulo">
                                <h3>{articulo.titulo}</h3>
                                <p className="resumen">{articulo.resumen_breve || 'Sin resumen disponible'}</p>

                                <div className="meta-articulo">
                                    <div className="autor">
                                        <span className="icono-autor">👤</span>
                                        <span>{articulo.autor}</span>
                                    </div>
                                    <div className="fecha">
                                        <span className="icono-fecha">📅</span>
                                        <span>{formatearFecha(articulo.fecha_publicacion)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="acciones-articulo">
                                <button className="btn-accion editar" title="Editar">
                                    <Edit3 size={18} />
                                </button>
                                <button className="btn-accion ver" title="Ver">
                                    <Eye size={18} />
                                </button>
                                <button className="btn-accion eliminar" title="Eliminar">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
};

export default BlogAdminManager;
