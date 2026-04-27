import { useState, useEffect } from 'react';
import { supabase } from '../../servicios/clienteSupabase';
import { notificarNuevoArticuloBlog } from '../../servicios/notificacionesService';
import { eliminarArticuloBlog } from '../../servicios/adminService';

export interface Articulo {
  id: string;
  titulo: string;
  resumen: string;
  contenido: string;
  imagen_url?: string;
  estado: 'borrador' | 'publicado';
  slug: string;
  creado_en: string;
  autor?: string;
}

export interface FormularioArticulo {
  titulo: string;
  resumen: string;
  contenido: string;
  imagen_url?: string;
  estado: 'borrador' | 'publicado';
  slug: string;
}

export interface EstadoCarga {
  cargando: boolean;
  error: string;
  exito: string;
}

export interface EstadoSubida {
  subiendo: boolean;
  progreso: number;
}

export function useBlogAdminManager() {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCarga>({ cargando: false, error: '', exito: '' });
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [articuloParaEliminar, setArticuloParaEliminar] = useState<string | null>(null);
  const [archivoParaSubir, setArchivoParaSubir] = useState<File | null>(null);
  const [urlPrevisualizacion, setUrlPrevisualizacion] = useState<string | null>(null);
  const [estadoSubida, setEstadoSubida] = useState<EstadoSubida>({ subiendo: false, progreso: 0 });
  const [formulario, setFormulario] = useState<FormularioArticulo>({
    titulo: '', resumen: '', contenido: '', imagen_url: '', estado: 'borrador', slug: ''
  });

  useEffect(() => { obtenerArticulos(); }, []);

  const obtenerArticulos = async () => {
    try {
      setEstadoCarga({ cargando: true, error: '', exito: '' });
      const { data, error } = await supabase
        .from('blog_articulos')
        .select('*')
        .neq('estado', 'eliminado')
        .order('creado_en', { ascending: false });

      if (error) {
        setEstadoCarga(prev => ({ ...prev, error: `No se pudieron cargar los artículos: ${error.message}` }));
        setArticulos([]);
      } else {
        setArticulos(data || []);
      }
    } catch (err) {
      setEstadoCarga(prev => ({
        ...prev,
        error: `Error inesperado: ${err instanceof Error ? err.message : 'Error desconocido'}`
      }));
      setArticulos([]);
    } finally {
      setEstadoCarga(prev => ({ ...prev, cargando: false }));
    }
  };

  const iniciarNuevoArticulo = () => {
    setEditandoId(null);
    setFormulario({ titulo: '', resumen: '', contenido: '', imagen_url: '', estado: 'borrador', slug: '' });
    limpiarSeleccionArchivo();
    setMostrandoFormulario(true);
  };

  const iniciarEdicion = (articulo: Articulo) => {
    setEditandoId(articulo.id);
    setFormulario({
      titulo: articulo.titulo, resumen: articulo.resumen, contenido: articulo.contenido,
      imagen_url: articulo.imagen_url || '', estado: articulo.estado, slug: articulo.slug
    });
    limpiarSeleccionArchivo();
    setMostrandoFormulario(true);
  };

  const cancelarFormulario = () => {
    setMostrandoFormulario(false);
    setEditandoId(null);
    setEstadoCarga({ cargando: false, error: '', exito: '' });
  };

  const guardarArticulo = async () => {
    setEstadoCarga({ cargando: true, error: '', exito: '' });

    if (!formulario.titulo || !formulario.contenido) {
      setEstadoCarga(prev => ({ ...prev, error: 'El título y el contenido son obligatorios.', cargando: false }));
      return;
    }

    try {
      if (archivoParaSubir) {
        const urlImagenSubida = await subirImagen(archivoParaSubir);
        if (urlImagenSubida) {
          setFormulario(prev => ({ ...prev, imagen_url: urlImagenSubida }));
        } else {
          return;
        }
      }

      const datosArticulo = { ...formulario, slug: generarSlug(formulario.titulo) };
      const { data, error } = editandoId
        ? await supabase.from('blog_articulos').update(datosArticulo).eq('id', editandoId).select()
        : await supabase.from('blog_articulos').insert([datosArticulo]).select();

      if (error) throw new Error(error.message);

      if (!editandoId && datosArticulo.estado === 'publicado' && data && data.length > 0) {
        const articuloCreado = data[0];
        try {
          const { data: { user } } = await supabase.auth.getUser();
          await notificarNuevoArticuloBlog({
            articulo_id: articuloCreado.id,
            titulo_articulo: articuloCreado.titulo,
            resumen: articuloCreado.resumen || 'Nuevo artículo disponible',
            autor_id: user?.id || ''
          });
        } catch {
          // ignore notification errors
        }
      }

      setEstadoCarga(prev => ({
        ...prev,
        exito: editandoId ? '¡Artículo actualizado exitosamente! 🎉' : '¡Artículo creado exitosamente! 🎉'
      }));

      await new Promise(resolve => setTimeout(resolve, 1000));
      await obtenerArticulos();
      cancelarFormulario();
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      setEstadoCarga(prev => ({
        ...prev,
        error: `Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }));
    } finally {
      setEstadoCarga(prev => ({ ...prev, cargando: false }));
      limpiarNotificacion();
    }
  };

  const pedirConfirmacionEliminar = (id: string) => {
    if (!id) {
      setEstadoCarga(prev => ({ ...prev, error: 'Error: ID del artículo no válido' }));
      limpiarNotificacion();
      return;
    }
    setArticuloParaEliminar(id);
  };

  const confirmarEliminar = async () => {
    const id = articuloParaEliminar;
    if (!id) return;
    setArticuloParaEliminar(null);

    try {
      setEstadoCarga({ cargando: true, error: '', exito: '' });
      setEliminandoId(id);
      const resultado = await eliminarArticuloBlog(id);

      if (resultado.exito) {
        setArticulos(prev => prev.filter(art => art.id !== id));
        await obtenerArticulos();
      } else {
        throw new Error(resultado.mensaje || 'Error desconocido');
      }
    } catch {
      await obtenerArticulos();
    } finally {
      setEstadoCarga(prev => ({ ...prev, cargando: false }));
      setEliminandoId(null);
    }
  };

  const cancelarEliminar = () => setArticuloParaEliminar(null);

  const subirImagen = async (archivo: File): Promise<string | null> => {
    setEstadoSubida({ subiendo: true, progreso: 0 });
    try {
      if (!archivo.type.startsWith('image/')) {
        setEstadoCarga(prev => ({ ...prev, error: 'Por favor selecciona un archivo de imagen válido.' }));
        setEstadoSubida(prev => ({ ...prev, subiendo: false }));
        return null;
      }
      if (archivo.size > 5 * 1024 * 1024) {
        setEstadoCarga(prev => ({ ...prev, error: 'La imagen es demasiado grande. Máximo 5MB permitido.' }));
        setEstadoSubida(prev => ({ ...prev, subiendo: false }));
        return null;
      }

      const intervalId = setInterval(() => {
        setEstadoSubida(prev => prev.progreso < 90 ? { ...prev, progreso: prev.progreso + 10 } : prev);
      }, 100);

      const nombreArchivo = `${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('imagenes-blog')
        .upload(`public/${nombreArchivo}`, archivo, { cacheControl: '3600', upsert: false });

      clearInterval(intervalId);
      setEstadoSubida(prev => ({ ...prev, progreso: 100 }));

      if (error) throw new Error(error.message);

      const { data: urlData } = supabase.storage.from('imagenes-blog').getPublicUrl(data.path);
      await new Promise(resolve => setTimeout(resolve, 500));
      setEstadoSubida(prev => ({ ...prev, subiendo: false }));
      return urlData.publicUrl;

    } catch (error) {
      setEstadoSubida(prev => ({ ...prev, subiendo: false }));
      setEstadoCarga(prev => ({
        ...prev,
        error: `Error al subir la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`
      }));
      return null;
    }
  };

  const manejarSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    if (input.files && input.files[0]) {
      const archivo = input.files[0];
      setArchivoParaSubir(archivo);
      setUrlPrevisualizacion(URL.createObjectURL(archivo));
      setFormulario(prev => ({ ...prev, imagen_url: '' }));
    }
  };

  const limpiarSeleccionArchivo = () => {
    setArchivoParaSubir(null);
    if (urlPrevisualizacion) { URL.revokeObjectURL(urlPrevisualizacion); setUrlPrevisualizacion(null); }
  };

  const generarSlug = (texto: string): string => {
    return texto.toString().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const limpiarNotificacion = () => {
    setTimeout(() => { setEstadoCarga(prev => ({ ...prev, error: '', exito: '' })); }, 3000);
  };

  return {
    articulos, estadoCarga, mostrandoFormulario, editandoId, eliminandoId,
    articuloParaEliminar, archivoParaSubir, urlPrevisualizacion, estadoSubida,
    formulario, setFormulario,
    iniciarNuevoArticulo, iniciarEdicion, cancelarFormulario, guardarArticulo,
    pedirConfirmacionEliminar, confirmarEliminar, cancelarEliminar,
    manejarSeleccionArchivo, limpiarSeleccionArchivo
  };
}
