import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../servicios/supabaseCliente';
import './AdminBlog.css';

interface ArticuloResumen {
    id: string;
    titulo: string;
    autor: string;
    estado_publicacion: 'publicado' | 'borrador' | 'archivado';
    slug: string;
}

const AdminBlog: React.FC = () => {
    const [articulos, setArticulos] = useState<ArticuloResumen[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticulos = async () => {
            const { data, error } = await supabase
                .from('blog_articulos') // Updated table name
                .select('id, titulo, autor, estado_publicacion, slug')
                .order('creado_en', { ascending: false });

            if (error) {
                console.error('Error al obtener los artículos:', error);
                setError('No se pudieron cargar los artículos. Inténtalo de nuevo más tarde.');
            } else {
                setArticulos(data || []);
            }
        };

        fetchArticulos();
    }, []);

    return (
        <div className="admin-blog-container">
            <div className="admin-blog-header">
                <h1>Gestión de Artículos del Blog</h1>
                <Link to="/administrador/crear-articulo" className="btn-crear-articulo">
                    Crear Nuevo Artículo
                </Link>
            </div>

            {error && <p className="error-mensaje">{error}</p>}

            <div className="lista-articulos">
                <table>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Autor</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {articulos.length > 0 ? (
                            articulos.map((articulo) => (
                                <tr key={articulo.id}>
                                    <td>{articulo.titulo}</td>
                                    <td>{articulo.autor}</td>
                                    <td>
                                        <span className={`estado-publicacion ${articulo.estado_publicacion}`}>
                                            {articulo.estado_publicacion}
                                        </span>
                                    </td>
                                    <td>
                                        <Link to={`/administrador/blog/editar/${articulo.slug}`} className="btn-editar">
                                            Editar
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4}>No se encontraron artículos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminBlog;
