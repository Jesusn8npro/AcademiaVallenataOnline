import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../servicios/clienteSupabase';
import type { ImagenArticulo } from './Componentes/UploaderImagenesArticulo';
import type { SeccionArticulo, CtaItem } from './Componentes/EditorJsonArticulo';

export interface ArticuloForm {
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

interface Opciones {
    idArticulo?: string;
    datosIniciales?: Partial<ArticuloForm> & { secciones?: any; cta?: any; portada_url?: string };
}

export function useFormularioArticulo({ idArticulo, datosIniciales }: Opciones) {
    const navigate = useNavigate();
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

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

    useEffect(() => {
        if (datosIniciales) {
            setFormData(prev => ({ ...prev, ...datosIniciales }));
            if (datosIniciales.secciones) {
                setSecciones(typeof datosIniciales.secciones === 'string' ? JSON.parse(datosIniciales.secciones) : datosIniciales.secciones);
            }
            if (datosIniciales.cta) {
                setCta(typeof datosIniciales.cta === 'string' ? JSON.parse(datosIniciales.cta) : datosIniciales.cta);
            }
            if (datosIniciales.portada_url) {
                setImagenPortada([{ id: 'portada_existente', url: datosIniciales.portada_url, alt_text: 'Portada actual', tipo_imagen: 'portada', estado: 'subido' }]);
            }
        }
    }, [datosIniciales]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generarSlug = () => {
        const slug = formData.titulo.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        setFormData(prev => ({ ...prev, slug }));
    };

    const handleImagenesChange = (nuevasImagenes: ImagenArticulo[]) => {
        setImagenPortada(nuevasImagenes);
    };

    const subirImagen = async (archivo: File): Promise<string | null> => {
        try {
            const nombreArchivo = `${Date.now()}_${archivo.name.replace(/\s/g, '_')}`;
            const { error } = await supabase.storage.from('blog_imagenes').upload(nombreArchivo, archivo);
            if (error) throw error;
            const { data: publicUrl } = supabase.storage.from('blog_imagenes').getPublicUrl(nombreArchivo);
            return publicUrl.publicUrl;
        } catch {
            return null;
        }
    };

    const guardarArticulo = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        setMensaje(null);
        try {
            let urlPortada = imagenPortada.length > 0 ? imagenPortada[0].url : null;
            if (imagenPortada.length > 0 && imagenPortada[0].estado === 'local' && imagenPortada[0].archivo) {
                const urlSubida = await subirImagen(imagenPortada[0].archivo);
                if (urlSubida) urlPortada = urlSubida;
            }

            const payload = {
                ...formData,
                secciones,
                cta,
                portada_url: urlPortada,
                autor_id: (await supabase.auth.getUser()).data.user?.id
            };

            let errorSupabase;
            if (idArticulo) {
                const { error } = await supabase.from('blog_articulos').update(payload).eq('id', idArticulo);
                errorSupabase = error;
            } else {
                const { error } = await supabase.from('blog_articulos').insert([payload]);
                errorSupabase = error;
            }
            if (errorSupabase) throw errorSupabase;

            setMensaje({ tipo: 'exito', texto: 'Artículo guardado con éxito' });
            if (!idArticulo) setTimeout(() => navigate('/administrador/blog'), 1500);
        } catch (error: any) {
            setMensaje({ tipo: 'error', texto: `Error al guardar: ${error.message}` });
        } finally {
            setGuardando(false);
        }
    };

    const onSeccionesChange = (campo: string, valor: any) => {
        if (campo === 'secciones') setSecciones(valor);
        if (campo === 'cta') setCta(valor);
    };

    return {
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
    };
}
