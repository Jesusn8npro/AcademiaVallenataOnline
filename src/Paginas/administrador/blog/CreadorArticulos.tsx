import React, { useState, useEffect } from 'react';
import { supabase } from '../../../servicios/supabaseCliente';
import { useParams, useSearchParams } from 'react-router-dom';
import { PenTool, Sparkles } from 'lucide-react';
import FormularioArticulo from './FormularioArticulo';
import CrearArticuloIA from './Componentes/CrearArticuloIA';
import './CreadorArticulos.css';

const CreadorArticulos: React.FC = () => {
    const { slug } = useParams(); // Si editamos, viene el slug
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'formulario' | 'ia'>('formulario');
    const [articuloEditar, setArticuloEditar] = useState<any>(null);
    const [cargando, setCargando] = useState(!!slug); // Cargando solo si hay slug

    useEffect(() => {
        // Si hay slug, cargamos el artículo para editar
        if (slug) {
            const cargarArticulo = async () => {
                try {
                    const { data, error } = await supabase
                        .from('blog_articulos')
                        .select('*')
                        .eq('slug', slug)
                        .single();

                    if (error) throw error;
                    setArticuloEditar(data);
                } catch (error) {
                    console.error("Error cargando artículo para editar:", error);
                } finally {
                    setCargando(false);
                }
            };
            cargarArticulo();
        } else {
            // Chequear si venimos por query param para activar tab IA inmediatamente
            if (searchParams.get('mode') === 'ia') {
                setActiveTab('ia');
            }
        }
    }, [slug, searchParams]);

    if (cargando) {
        return <div className="p-8 text-center text-gray-500">Cargando editor...</div>;
    }

    return (
        <div className="creador-articulos-container">
            <div className="creador-header">
                <h1>{articuloEditar ? `Editando: ${articuloEditar.titulo}` : 'Crear Nuevo Artículo'}</h1>
                <p>Gestiona el contenido de tu blog o usa la IA para generar borradores.</p>
            </div>

            <div className="tabs-navegacion">
                <button
                    className={`tab-btn ${activeTab === 'formulario' ? 'active' : ''}`}
                    onClick={() => setActiveTab('formulario')}
                >
                    <PenTool size={16} /> Editor Manual
                </button>
                <button
                    className={`tab-btn ${activeTab === 'ia' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ia')}
                >
                    <Sparkles size={16} /> Asistente IA
                </button>
            </div>

            <div className="contenido-tab">
                {activeTab === 'formulario' ? (
                    <FormularioArticulo
                        idArticulo={articuloEditar?.id}
                        datosIniciales={articuloEditar}
                    />
                ) : (
                    <CrearArticuloIA />
                )}
            </div>
        </div>
    );
};

export default CreadorArticulos;
