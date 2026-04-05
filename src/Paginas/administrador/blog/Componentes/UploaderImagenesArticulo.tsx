import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Loader, AlertCircle } from 'lucide-react';
import './UploaderImagenesArticulo.css';

export interface ImagenArticulo {
    id: string;
    url: string;
    alt_text: string;
    tipo_imagen: 'portada' | 'contenido' | 'meta';
    nombre_archivo?: string;
    archivo?: File | null;
    estado?: 'subido' | 'local' | 'error' | 'subiendo';
    error?: string;
}

interface UploaderImagenesArticuloProps {
    onImagenesChange: (imagenes: ImagenArticulo[]) => void;
    imagenesIniciales?: ImagenArticulo[];
}

const UploaderImagenesArticulo: React.FC<UploaderImagenesArticuloProps> = ({ onImagenesChange, imagenesIniciales = [] }) => {
    const [imagenes, setImagenes] = useState<ImagenArticulo[]>([]);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        // Inicializa el estado con una estructura unificada
        // Aseguramos que los datos que vienen (posiblemente de BD) se mapeen correctamente
        if (imagenesIniciales && imagenesIniciales.length > 0) {
            const imagenesEstructuradas: ImagenArticulo[] = imagenesIniciales.map((img: any) => ({
                id: img.id || `id_${Date.now()}_${Math.random()}`,
                url: img.url || img.url_imagen || '',
                alt_text: img.alt_text || '',
                tipo_imagen: img.tipo_imagen || 'contenido',
                nombre_archivo: img.nombre_archivo,
                archivo: null, // No hay archivo local para imágenes existentes
                estado: 'subido',
            }));
            setImagenes(imagenesEstructuradas);
        }
    }, [imagenesIniciales]); // Solo actualizar si imagenesIniciales cambia externamente de forma significativa

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setCargando(true);
        const nuevasImagenes: ImagenArticulo[] = acceptedFiles.map(file => ({
            id: `local_${Date.now()}_${Math.random()}`,
            url: URL.createObjectURL(file), // URL temporal para vista previa
            alt_text: '',
            tipo_imagen: 'contenido',
            archivo: file, // El objeto File real
            estado: 'local', // Nuevo estado para archivos no subidos
            nombre_archivo: file.name
        }));

        setImagenes(prev => {
            const listaActualizada = [...prev, ...nuevasImagenes];
            onImagenesChange(listaActualizada); // Notificar al padre
            return listaActualizada;
        });
        setCargando(false);
    }, [onImagenesChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
        disabled: cargando,
    });

    const eliminarImagen = (id: string) => {
        // eslint-disable-next-line no-restricted-globals
        const confirmacion = window.confirm('¿Estás seguro de que quieres eliminar esta imagen?');
        if (!confirmacion) return;

        setImagenes(prev => {
            const nuevasImagenes = prev.filter(img => img.id !== id);
            onImagenesChange(nuevasImagenes);
            return nuevasImagenes;
        });
    };

    const actualizarCampo = (id: string, campo: keyof ImagenArticulo, valor: string) => {
        setImagenes(prev => {
            const nuevasImagenes = prev.map(img => {
                if (img.id === id) {
                    return { ...img, [campo]: valor };
                }
                return img;
            });
            onImagenesChange(nuevasImagenes);
            return nuevasImagenes;
        });
    };

    return (
        <div className="uploader-articulo-container">
            <div {...getRootProps({ className: `dropzone ${isDragActive ? 'active' : ''}` })}>
                <input {...getInputProps()} />
                <Upload className="upload-icon" />
                {isDragActive ? (
                    <p>Suelta las imágenes aquí...</p>
                ) : (
                    <p>Arrastra y suelta imágenes, o haz clic para seleccionar</p>
                )}
            </div>

            {cargando && (
                <div className="uploader-spinner">
                    <Loader className="animate-spin" />
                    <p>Procesando imágenes...</p>
                </div>
            )}

            <div className="lista-imagenes-container">
                {imagenes.map((imagen) => (
                    <div key={imagen.id} className={`imagen-card ${imagen.estado || ''}`}>
                        <div className="imagen-preview">
                            <img src={imagen.url} alt={imagen.alt_text || 'preview'} />
                            {imagen.estado === 'error' && <div className="imagen-overlay error"><AlertCircle /></div>}
                        </div>
                        <div className="imagen-detalles">
                            <input
                                type="text"
                                value={imagen.alt_text}
                                onChange={(e) => actualizarCampo(imagen.id, 'alt_text', e.target.value)}
                                placeholder="Texto alternativo (ALT)"
                                className="input-alt"
                            />
                            <select
                                value={imagen.tipo_imagen}
                                onChange={(e) => actualizarCampo(imagen.id, 'tipo_imagen', e.target.value as any)}
                                className="select-tipo"
                            >
                                <option value="portada">Portada</option>
                                <option value="contenido">Contenido</option>
                                <option value="meta">Meta (SEO)</option>
                            </select>
                            <button onClick={() => eliminarImagen(imagen.id)} className="btn-eliminar" aria-label="Eliminar imagen">
                                <Trash2 size={16} />
                            </button>
                        </div>
                        {imagen.error && <p className="error-message">{imagen.error}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UploaderImagenesArticulo;
