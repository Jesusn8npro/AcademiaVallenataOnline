import React from 'react';
import { Save, Eye, ArrowLeft, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import UploaderImagenesArticulo from './Componentes/UploaderImagenesArticulo';
import EditorJsonArticulo from './Componentes/EditorJsonArticulo';
import { useFormularioArticulo, type ArticuloForm } from './useFormularioArticulo';
import './FormularioArticulo.css';

interface FormularioArticuloProps {
    idArticulo?: string;
    datosIniciales?: Partial<ArticuloForm> & { secciones?: any; cta?: any; portada_url?: string };
}

const FormularioArticulo: React.FC<FormularioArticuloProps> = ({ idArticulo, datosIniciales }) => {
    const {
        formData,
        secciones,
        cta,
        imagenPortada,
        guardando,
        mensaje,
        handleInputChange,
        generarSlug,
        handleImagenesChange,
        guardarArticulo,
        onSeccionesChange
    } = useFormularioArticulo({ idArticulo, datosIniciales });

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
                                onBlur={generarSlug}
                                required
                                className="input-grande"
                            />
                        </div>
                        <div className="form-group">
                            <label>Slug (URL amigable)</label>
                            <input type="text" name="slug" value={formData.slug} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Resumen Breve (Card)</label>
                            <textarea name="resumen_breve" value={formData.resumen_breve} onChange={handleInputChange} rows={3} />
                        </div>
                        <div className="form-group">
                            <label>Resumen Completo (Intro Artículo)</label>
                            <textarea name="resumen_completo" value={formData.resumen_completo} onChange={handleInputChange} rows={5} />
                        </div>
                    </div>

                    <div className="card-formulario">
                        <h3>Contenido del Artículo</h3>
                        <EditorJsonArticulo
                            secciones_json={secciones}
                            cta_json={cta}
                            onChange={onSeccionesChange}
                        />
                    </div>
                </div>

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
                                value={formData.fecha_publicacion.slice(0, 16)}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="card-formulario">
                        <h3>Imagen de Portada</h3>
                        <UploaderImagenesArticulo imagenesIniciales={imagenPortada} onImagenesChange={handleImagenesChange} />
                        <p className="nota-help">Sube una imagen. Se usará la primera como portada.</p>
                    </div>

                    <div className="card-formulario">
                        <h3>Detalles Autor</h3>
                        <div className="form-group">
                            <label>Nombre Autor</label>
                            <input type="text" name="autor" value={formData.autor} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Iniciales Autor</label>
                            <input type="text" name="autor_iniciales" value={formData.autor_iniciales} onChange={handleInputChange} maxLength={3} />
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
