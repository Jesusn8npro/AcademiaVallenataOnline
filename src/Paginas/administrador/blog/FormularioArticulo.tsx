import React, { useState, useEffect } from 'react';
import { Save, Eye, ArrowLeft, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../servicios/supabaseCliente';
import UploaderImagenesArticulo, { type ImagenArticulo } from './Componentes/UploaderImagenesArticulo';
import EditorJsonArticulo, { type SeccionArticulo, type CtaItem } from './Componentes/EditorJsonArticulo';
import './FormularioArticulo.css'; // We will create this CSS based on what we likely need or if we find it.

interface ArticuloForm {
    titulo: string;
    slug: string;
    resumen_breve: string;
    resumen_completo: string;
    autor: string;
    autor_iniciales: string;
    lectura_min: number;
    calificacion: number;
    estado_publicacion: 'borrador' | 'publicado' | 'archivado';
    fecha_publicacion: string;
    meta_titulo: string;
    meta_descripcion: string;
    meta_keywords: string;
    canonical_url: string;
    og_titulo: string;
    og_descripcion: string;
    twitter_card: string;
}

interface FormularioArticuloProps {
    idArticulo?: string; // If present, editing mode
    datosIniciales?: Partial<ArticuloForm> & { secciones?: any, cta?: any, portada_url?: string };
}

const FormularioArticulo: React.FC<FormularioArticuloProps> = ({ idArticulo, datosIniciales }) => {
    const navigate = useNavigate();
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error', texto: string } | null>(null);

    // Estados del formulario
    const [formData, setFormData] = useState<ArticuloForm>({
        titulo: '',
        slug: '',
        resumen_breve: '',
        resumen_completo: '',
        autor: 'JESUS GONZALEZ',
        autor_iniciales: 'JG',
        lectura_min: 5,
        calificacion: 5.0,
        estado_publicacion: 'borrador',
        fecha_publicacion: new Date().toISOString(),
        meta_titulo: '',
        meta_descripcion: '',
        meta_keywords: '',
        canonical_url: '',
        og_titulo: '',
        og_descripcion: '',
        twitter_card: 'summary_large_image'
    });

    const [secciones, setSecciones] = useState<SeccionArticulo[]>([]);
    const [cta, setCta] = useState<{ items: CtaItem[] }>({ items: [] });
    const [imagenPortada, setImagenPortada] = useState<ImagenArticulo[]>([]);

    // Cargar datos iniciales si existen
    useEffect(() => {
        if (datosIniciales) {
            setFormData(prev => ({
                ...prev,
                ...datosIniciales
            }));

            if (datosIniciales.secciones) {
                setSecciones(typeof datosIniciales.secciones === 'string' ? JSON.parse(datosIniciales.secciones) : datosIniciales.secciones);
            }
            if (datosIniciales.cta) {
                setCta(typeof datosIniciales.cta === 'string' ? JSON.parse(datosIniciales.cta) : datosIniciales.cta);
            }
            if (datosIniciales.portada_url) {
                setImagenPortada([{
                    id: 'portada_existente',
                    url: datosIniciales.portada_url,
                    alt_text: 'Portada actual',
                    tipo_imagen: 'portada',
                    estado: 'subido'
                }]);
            }
        }
    }, [datosIniciales]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generarSlug = () => {
        const slug = formData.titulo
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
        setFormData(prev => ({ ...prev, slug }));
    };

    const handleImagenesChange = (nuevasImagenes: ImagenArticulo[]) => {
        // Solo permitimos una imagen de portada, así que tomamos la última o filtramos
        // Si el uploader permite múltiples, aquí decidimos. Para portada suele ser una.
        // Asumiremos que el uploader maneja todas, pero aquí solo nos importa la URL de la portada.
        setImagenPortada(nuevasImagenes);
    };

    const subirImagen = async (archivo: File): Promise<string | null> => {
        try {
            const nombreArchivo = `${Date.now()}_${archivo.name.replace(/\s/g, '_')}`;
            const { data, error } = await supabase.storage
                .from('blog_imagenes') // Asegúrate de crear este bucket
                .upload(nombreArchivo, archivo);

            if (error) throw error;

            const { data: publicUrl } = supabase.storage
                .from('blog_imagenes')
                .getPublicUrl(nombreArchivo);

            return publicUrl.publicUrl;
        } catch (error) {
            console.error('Error subiendo imagen:', error);
            return null;
        }
    };

    const guardarArticulo = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        setMensaje(null);

        try {
            // 1. Subir imagen si es nueva (estado 'local')
            let urlPortada = imagenPortada.length > 0 ? imagenPortada[0].url : null;

            if (imagenPortada.length > 0 && imagenPortada[0].estado === 'local' && imagenPortada[0].archivo) {
                const urlSubida = await subirImagen(imagenPortada[0].archivo);
                if (urlSubida) urlPortada = urlSubida;
            }

            // 2. Preparar payload
            const payload = {
                ...formData,
                secciones: secciones, // Supabase lo convertirá a JSONB automáticamente si el tipo es jsonb
                cta: cta,
                portada_url: urlPortada,
                autor_id: (await supabase.auth.getUser()).data.user?.id
            };

            // 3. Insertar o Actualizar
            let errorSupabase;
            if (idArticulo) {
                const { error } = await supabase
                    .from('blog_articulos')
                    .update(payload)
                    .eq('id', idArticulo);
                errorSupabase = error;
            } else {
                const { error } = await supabase
                    .from('blog_articulos')
                    .insert([payload]);
                errorSupabase = error;
            }

            if (errorSupabase) throw errorSupabase;

            setMensaje({ tipo: 'exito', texto: 'Artículo guardado con éxito' });

            // Opcional: redirigir después de un tiempo
            if (!idArticulo) {
                setTimeout(() => navigate('/administrador/blog'), 1500);
            }

        } catch (error: any) {
            console.error(error);
            setMensaje({ tipo: 'error', texto: `Error al guardar: ${error.message}` });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="formulario-articulo-container">
            <div className="toolbar-acciones">
                <Link to="/administrador/blog" className="btn-volver">
                    <ArrowLeft size={18} /> Volver
                </Link>
                <div className="acciones-derecha">
                    <a href={`/blog/${formData.slug}`} target="_blank" rel="noopener noreferrer" className="btn-preview">
                        <Eye size={18} /> Ver Previa
                    </a>
                    <button onClick={guardarArticulo} disabled={guardando} className="btn-guardar">
                        {guardando ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                        {idArticulo ? 'Actualizar' : 'Publicar'}
                    </button>
                </div>
            </div>

            {mensaje && (
                <div className={`mensaje-alerta ${mensaje.tipo}`}>
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={guardarArticulo} className="grid-formulario">
                {/* Columna Izquierda: Contenido Principal */}
                <div className="columna-principal">
                    <div className="card-formulario">
                        <h3>Información General</h3>
                        <div className="form-group">
                            <label>Título del Artículo</label>
                            <input
                                type="text"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleInputChange}
                                onBlur={generarSlug} // Auto-generar slug al salir del título
                                required
                                className="input-grande"
                            />
                        </div>

                        <div className="form-group">
                            <label>Slug (URL amigable)</label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Resumen Breve (Card)</label>
                            <textarea
                                name="resumen_breve"
                                value={formData.resumen_breve}
                                onChange={handleInputChange}
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label>Resumen Completo (Intro Artículo)</label>
                            <textarea
                                name="resumen_completo"
                                value={formData.resumen_completo}
                                onChange={handleInputChange}
                                rows={5}
                            />
                        </div>
                    </div>

                    <div className="card-formulario">
                        <h3>Contenido del Artículo</h3>
                        <EditorJsonArticulo
                            secciones_json={secciones}
                            cta_json={cta}
                            onChange={(campo, valor) => {
                                if (campo === 'secciones') setSecciones(valor);
                                if (campo === 'cta') setCta(valor);
                            }}
                        />
                    </div>
                </div>

                {/* Columna Derecha: Configuración y Medios */}
                <div className="columna-lateral">
                    <div className="card-formulario">
                        <h3>Publicación</h3>
                        <div className="form-group">
                            <label>Estado</label>
                            <select name="estado_publicacion" value={formData.estado_publicacion} onChange={handleInputChange}>
                                <option value="borrador">Borrador</option>
                                <option value="publicado">Publicado</option>
                                <option value="archivado">Archivado</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Fecha Publicación</label>
                            <input
                                type="datetime-local"
                                name="fecha_publicacion"
                                value={formData.fecha_publicacion.slice(0, 16)} // Ajuste formato
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="card-formulario">
                        <h3>Imagen de Portada</h3>
                        <UploaderImagenesArticulo
                            imagenesIniciales={imagenPortada}
                            onImagenesChange={handleImagenesChange}
                        />
                        <p className="nota-help">Sube una imagen. Se usará la primera como portada.</p>
                    </div>

                    <div className="card-formulario">
                        <h3>Detalles Autor</h3>
                        <div className="form-group">
                            <label>Nombre Autor</label>
                            <input
                                type="text"
                                name="autor"
                                value={formData.autor}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Iniciales Autor</label>
                            <input
                                type="text"
                                name="autor_iniciales"
                                value={formData.autor_iniciales}
                                onChange={handleInputChange}
                                maxLength={3}
                            />
                        </div>
                    </div>

                    <div className="card-formulario">
                        <h3>SEO & Metadatos</h3>
                        <div className="form-group">
                            <label>Meta Título</label>
                            <input type="text" name="meta_titulo" value={formData.meta_titulo} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Meta Descripción</label>
                            <textarea name="meta_descripcion" value={formData.meta_descripcion} onChange={handleInputChange} rows={3} />
                        </div>
                        <div className="form-group">
                            <label>Keywords</label>
                            <input type="text" name="meta_keywords" value={formData.meta_keywords} onChange={handleInputChange} placeholder="sepados, por, comas" />
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
};

export default FormularioArticulo;
