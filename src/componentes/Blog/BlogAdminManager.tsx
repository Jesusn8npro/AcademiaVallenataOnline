import React, { useState, useEffect } from 'react';
import EditorQuill from './EditorQuill';
import { supabase } from '../../servicios/supabaseCliente';
import { notificarNuevoArticuloBlog } from '../../servicios/notificacionesService';
import { eliminarArticuloBlog } from '../../servicios/adminService';
import './BlogAdminManager.css';

function IconPlus(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M12 6v12M6 12h12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconDoc(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M7 2h8l5 5v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" strokeWidth="2"/>
      <path d="M14 2v6h6" strokeWidth="2"/>
      <path d="M9 13h6M9 17h6" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function IconImage(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2"/>
      <path d="M7 14l3-3 4 4 3-3 4 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2" strokeWidth="2"/>
    </svg>
  )
}
function IconText(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M4 6h16M4 10h12M4 14h16M4 18h10" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function IconCalendar(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
      <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function IconUser(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="7" r="4" strokeWidth="2"/>
      <path d="M6 21v-2a6 6 0 0 1 12 0v2" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function IconEye(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3" strokeWidth="2"/>
    </svg>
  )
}
function IconEdit(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M12 20h9" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16.5 3.5l4 4-11 11H5.5v-4z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconTrash(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M3 6h18" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" strokeWidth="2"/>
      <path d="M10 11v6M14 11v6" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function IconCloudUpload(props: React.SVGProps<SVGSVGElement>){
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M20 16.58A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 4 16.25" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 12v6M9 15l3-3 3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Interfaces para tipado
interface Articulo {
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

interface FormularioArticulo {
  titulo: string;
  resumen: string;
  contenido: string;
  imagen_url?: string;
  estado: 'borrador' | 'publicado';
  slug: string;
}

interface EstadoCarga {
  cargando: boolean;
  error: string;
  exito: string;
}

interface EstadoSubida {
  subiendo: boolean;
  progreso: number;
}

const BlogAdminManager: React.FC = () => {
  // Estados del componente
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCarga>({ 
    cargando: false, 
    error: '', 
    exito: '' 
  });
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [archivoParaSubir, setArchivoParaSubir] = useState<File | null>(null);
  const [urlPrevisualizacion, setUrlPrevisualizacion] = useState<string | null>(null);
  const [estadoSubida, setEstadoSubida] = useState<EstadoSubida>({ 
    subiendo: false, 
    progreso: 0 
  });

  const [formulario, setFormulario] = useState<FormularioArticulo>({
    titulo: '',
    resumen: '',
    contenido: '',
    imagen_url: '',
    estado: 'borrador',
    slug: ''
  });

  useEffect(() => {
    obtenerArticulos();
  }, []);

  // --- FUNCIONES CRUD ---

  const obtenerArticulos = async () => {
    try {
      console.log('ðŸ“š Cargando artÃ­culos...');
      setEstadoCarga({ cargando: true, error: '', exito: '' });
      
      const { data, error } = await supabase
        .from('blog_articulos')
        .select('*')
        .neq('estado', 'eliminado') // Excluir artÃ­culos marcados como eliminados
        .order('creado_en', { ascending: false });

      console.log('ðŸ“Š Resultado de carga de artÃ­culos:', { data: data?.length || 0, error });

      if (error) {
        console.error('âŒ Error al cargar artÃ­culos:', error);
        setEstadoCarga(prev => ({ ...prev, error: `No se pudieron cargar los artÃ­culos: ${error.message}` }));
        setArticulos([]);
      } else {
        setArticulos(data || []);
        console.log(`âœ… ${(data || []).length} artÃ­culos cargados exitosamente`);
        // Debug: Mostrar estructura de un artÃ­culo
        if (data && data.length > 0) {
          console.log('ðŸ“‹ Estructura del primer artÃ­culo:', data[0]);
          console.log('ðŸ†” IDs de todos los artÃ­culos:', data.map(a => ({ titulo: a.titulo, id: a.id, tipo: typeof a.id })));
        }
      }
    } catch (err) {
      console.error('ðŸ’¥ Error inesperado al cargar artÃ­culos:', err);
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
    setFormulario({
      titulo: '',
      resumen: '',
      contenido: '',
      imagen_url: '',
      estado: 'borrador',
      slug: ''
    });
    limpiarSeleccionArchivo();
    setMostrandoFormulario(true);
  };

  const iniciarEdicion = (articulo: Articulo) => {
    setEditandoId(articulo.id);
    setFormulario({
      titulo: articulo.titulo,
      resumen: articulo.resumen,
      contenido: articulo.contenido,
      imagen_url: articulo.imagen_url || '',
      estado: articulo.estado,
      slug: articulo.slug
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
      setEstadoCarga(prev => ({ 
        ...prev, 
        error: 'El tÃ­tulo y el contenido son obligatorios.',
        cargando: false 
      }));
      return;
    }

    try {
      // Si se seleccionÃ³ un archivo nuevo, lo subimos primero
      if (archivoParaSubir) {
        const urlImagenSubida = await subirImagen(archivoParaSubir);
        if (urlImagenSubida) {
          setFormulario(prev => ({ ...prev, imagen_url: urlImagenSubida }));
        } else {
          return; // Ya se manejÃ³ el error en subirImagen
        }
      }

      const datosArticulo = {
        ...formulario,
        slug: generarSlug(formulario.titulo)
      };

      const { data, error } = editandoId
        ? await supabase.from('blog_articulos').update(datosArticulo).eq('id', editandoId).select()
        : await supabase.from('blog_articulos').insert([datosArticulo]).select();

      if (error) {
        throw new Error(error.message);
      }

      // ðŸ”” ENVIAR NOTIFICACIONES PARA ARTÃCULOS DEL BLOG (solo para artÃ­culos nuevos y publicados)
      if (!editandoId && datosArticulo.estado === 'publicado' && data && data.length > 0) {
        const articuloCreado = data[0];
        console.log('ðŸ“¢ ENVIANDO NOTIFICACIONES PARA ARTÃCULO DEL BLOG...');
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const resultadoNotificacion = await notificarNuevoArticuloBlog({
            articulo_id: articuloCreado.id,
            titulo_articulo: articuloCreado.titulo,
            resumen: articuloCreado.resumen || 'Nuevo artÃ­culo disponible',
            autor_id: user?.id || ''
          });
          
          if (resultadoNotificacion.exito) {
            console.log(`âœ… Notificaciones de artÃ­culo enviadas: ${resultadoNotificacion.notificaciones_creadas}`);
          } else {
            console.error('âŒ Error enviando notificaciones de artÃ­culo:', resultadoNotificacion.error);
          }
        } catch (errorNotificacion) {
          console.error('âŒ Error inesperado enviando notificaciones de artÃ­culo:', errorNotificacion);
        }
      }

      // Ã‰xito con animaciÃ³n
      setEstadoCarga(prev => ({ 
        ...prev, 
        exito: editandoId ? 'Â¡ArtÃ­culo actualizado exitosamente! ðŸŽ‰' : 'Â¡ArtÃ­culo creado exitosamente! ðŸŽ‰' 
      }));
      
      // PequeÃ±o delay para mostrar el mensaje de Ã©xito
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await obtenerArticulos();
      cancelarFormulario();
      
      // Scroll suave hacia arriba despuÃ©s de guardar
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



  // FunciÃ³n definitiva para eliminar artÃ­culos
  const eliminarArticulo = async (id: string) => {
    console.log('ðŸ—‘ï¸ ELIMINACIÃ“N DEFINITIVA - ID:', id);
    
    if (!id) {
      setEstadoCarga(prev => ({ 
        ...prev, 
        error: 'Error: ID del artÃ­culo no vÃ¡lido' 
      }));
      limpiarNotificacion();
      return;
    }

    if (!confirm('Â¿EstÃ¡s seguro de que deseas eliminar este artÃ­culo? Esta acciÃ³n no se puede deshacer.')) {
      console.log('âŒ EliminaciÃ³n cancelada por el usuario');
      return;
    }

    try {
      setEstadoCarga({ cargando: true, error: '', exito: '' });
      setEliminandoId(id);
      console.log('ðŸ”„ Iniciando eliminaciÃ³n definitiva...');

      // Usar el servicio de administrador para eliminar
      const resultado = await eliminarArticuloBlog(id);
      
      if (resultado.exito) {
        // Eliminar de la interfaz local inmediatamente
        setArticulos(prev => prev.filter(art => art.id !== id));
        
        // Recargar la lista para verificar que se eliminÃ³
        console.log('ðŸ”„ Recargando lista para verificar eliminaciÃ³n...');
        await obtenerArticulos();
        
        console.log('âœ… ArtÃ­culo eliminado exitosamente');
      } else {
        throw new Error(resultado.mensaje || 'Error desconocido');
      }
      
    } catch (err) {
      console.error('ðŸ’¥ Error al eliminar artÃ­culo:', err);
      // Solo mostrar error en consola, no en la interfaz
      
      // Recargar la lista para ver el estado actual
      console.log('ðŸ”„ Recargando lista despuÃ©s del error...');
      await obtenerArticulos();
    } finally {
      setEstadoCarga(prev => ({ ...prev, cargando: false }));
      setEliminandoId(null);
    }
  };

  // --- MANEJO DE IMÃGENES ---

  const subirImagen = async (archivo: File): Promise<string | null> => {
    setEstadoSubida({ subiendo: true, progreso: 0 });
    
    try {
      // Validar tipo de archivo
      if (!archivo.type.startsWith('image/')) {
        setEstadoCarga(prev => ({ 
          ...prev, 
          error: 'Por favor selecciona un archivo de imagen vÃ¡lido.' 
        }));
        setEstadoSubida(prev => ({ ...prev, subiendo: false }));
        return null;
      }

      // Validar tamaÃ±o (5MB mÃ¡ximo)
      if (archivo.size > 5 * 1024 * 1024) {
        setEstadoCarga(prev => ({ 
          ...prev, 
          error: 'La imagen es demasiado grande. MÃ¡ximo 5MB permitido.' 
        }));
        setEstadoSubida(prev => ({ ...prev, subiendo: false }));
        return null;
      }

      // Simular progreso
      const intervalId = setInterval(() => {
        setEstadoSubida(prev => {
          if (prev.progreso < 90) {
            return { ...prev, progreso: prev.progreso + 10 };
          }
          return prev;
        });
      }, 100);

      const nombreArchivo = `${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const rutaArchivo = `public/${nombreArchivo}`;

      const { data, error } = await supabase.storage
        .from('imagenes-blog')
        .upload(rutaArchivo, archivo, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(intervalId);
      setEstadoSubida(prev => ({ ...prev, progreso: 100 }));

      if (error) {
        throw new Error(error.message);
      }

      const { data: urlData } = supabase.storage.from('imagenes-blog').getPublicUrl(data.path);
      
      // PequeÃ±o delay para mostrar el 100%
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
      setFormulario(prev => ({ ...prev, imagen_url: '' })); // Limpiar URL si se selecciona archivo
    }
  };

  const limpiarSeleccionArchivo = () => {
    setArchivoParaSubir(null);
    if (urlPrevisualizacion) {
      URL.revokeObjectURL(urlPrevisualizacion);
      setUrlPrevisualizacion(null);
    }
  };

  // --- UTILIDADES ---

  const generarSlug = (texto: string): string => {
    return texto
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const limpiarNotificacion = () => {
    setTimeout(() => {
      setEstadoCarga(prev => ({ ...prev, error: '', exito: '' }));
    }, 3000);
  };

  return (
    <div className="gestor-blog">
      <header className="encabezado-gestor">
        <h1>Administración de Blog</h1>
        <button className="boton-primario" onClick={iniciarNuevoArticulo}>
          <IconPlus />
          <span>Nuevo Artículo</span>
        </button>
      </header>

      {/* Notificaciones */}
      {estadoCarga.error && (
        <div className="notificacion error">
          {estadoCarga.error}
        </div>
      )}
      {estadoCarga.exito && (
        <div className="notificacion exito">
          {estadoCarga.exito}
        </div>
      )}

      {/* Formulario de CreaciÃ³n/EdiciÃ³n */}
      {mostrandoFormulario && (
        <div className="contenedor-formulario-moderno">
          {/* Header elegante */}
          <div className="header-moderno">
            <div className="info-header">
              <h2 className="titulo-principal">
                {editandoId ? (
                  <>
                    <IconEdit />
                    Editando Artículo
                  </>
                ) : (
                  <>
                    <IconPlus />
                    Crear Nuevo Artículo
                  </>
                )}
              </h2>
              <p className="subtitulo">
                Completa la información para {editandoId ? 'actualizar' : 'crear'} tu artículo
              </p>
            </div>
            <button type="button" className="btn-cerrar" onClick={cancelarFormulario}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); guardarArticulo(); }} className="formulario-elegante">
            {/* Grid responsivo */}
            <div className="grid-moderno">
              {/* Columna izquierda: Info bÃ¡sica */}
              <div className="col-info">
                <div className="seccion-card">
                  <div className="titulo-seccion">
                    <IconDoc />
                    <span>Información Básica</span>
                  </div>
                  
                  <div className="campos-container">
                    <div className="campo-moderno">
                      <label htmlFor="titulo" className="label-elegante">Título del Artículo</label>
                      <input 
                        id="titulo" 
                        type="text" 
                        value={formulario.titulo}
                        onChange={(e) => setFormulario(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Escribe un título atractivo..." 
                        required 
                        className="input-elegante"
                      />
                    </div>

                    <div className="campo-moderno">
                      <label htmlFor="estado" className="label-elegante">Estado de Publicación</label>
                      <div className="select-container">
                        <select 
                          id="estado" 
                          value={formulario.estado}
                          onChange={(e) => setFormulario(prev => ({ ...prev, estado: e.target.value as 'borrador' | 'publicado' }))}
                          className="select-elegante"
                        >
                          <option value="borrador">Borrador</option>
                          <option value="publicado">Publicado</option>
                        </select>
                      </div>
                    </div>

                    <div className="campo-moderno">
                      <label htmlFor="resumen" className="label-elegante">Resumen del Artículo</label>
                      <textarea 
                        id="resumen" 
                        value={formulario.resumen}
                        onChange={(e) => setFormulario(prev => ({ ...prev, resumen: e.target.value }))}
                        placeholder="Escribe un resumen que enganche a tus lectores..." 
                        rows={4}
                        className="textarea-elegante"
                      />
                      <small className="ayuda-texto">Recomendado: máximo 160 caracteres para SEO</small>
                    </div>
                  </div>
                </div>

                {/* Card de imagen */}
                <div className="seccion-card">
                  <div className="titulo-seccion">
                    <IconImage />
                    <span>Imagen Destacada</span>
                  </div>
                  
                  <div className="campos-container">
                    <div className="upload-zone">
                      <label htmlFor="imagen_archivo" className="zona-subida">
                        <div className="contenido-subida">
                          <IconCloudUpload className="icono-subida" />
                          <div className="texto-subida">
                            <span className="titulo-subida">Arrastra tu imagen aquí</span>
                            <span className="subtitulo-subida">o haz clic para seleccionar</span>
                          </div>
                        </div>
                      </label>
                      <input 
                        id="imagen_archivo" 
                        type="file" 
                        accept="image/*" 
                        onChange={manejarSeleccionArchivo} 
                        className="input-oculto" 
                      />
                      
                      <div className="separador-elegante">
                        <span>O</span>
                      </div>
                      
                      <input 
                        type="url" 
                        value={formulario.imagen_url}
                        onChange={(e) => setFormulario(prev => ({ ...prev, imagen_url: e.target.value }))}
                        placeholder="Pega la URL de tu imagen" 
                        disabled={!!archivoParaSubir}
                        className="input-elegante url-input"
                      />
                    </div>

                    {/* Preview elegante */}
                    {(urlPrevisualizacion || formulario.imagen_url) && (
                      <div className="preview-elegante">
                        <div className="imagen-preview">
                          <img src={urlPrevisualizacion || formulario.imagen_url} alt="Preview" />
                          <div className="overlay-preview">
                            <span className="estado-preview">
                              {archivoParaSubir ? 'ðŸ“ Archivo local' : 'ðŸŒ URL externa'}
                            </span>
                          </div>
                          {archivoParaSubir && (
                            <button type="button" className="btn-quitar" onClick={limpiarSeleccionArchivo}>
                              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress elegante */}
                    {estadoSubida.subiendo && (
                      <div className="progreso-elegante">
                        <div className="header-progreso">
                          <span className="texto-progreso">Subiendo imagen...</span>
                          <span className="porcentaje-progreso">{estadoSubida.progreso}%</span>
                        </div>
                        <div className="barra-container">
                          <div className="barra-progreso" style={{ width: `${estadoSubida.progreso}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Columna derecha: Editor */}
              <div className="col-editor">
                <div className="seccion-card editor-card">
                  <div className="titulo-seccion">
                    <IconText />
                    <span>Contenido del Artículo</span>
                  </div>
                  <div className="editor-wrapper">
                    <EditorQuill 
                      value={formulario.contenido}
                      onChange={(value) => setFormulario(prev => ({ ...prev, contenido: value }))}
                      placeholder="Escribe el contenido de tu artículo aquí..." 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="footer-moderno">
              <div className="botones-footer">
                <button 
                  type="button" 
                  className="btn-cancelar-elegante" 
                  onClick={cancelarFormulario} 
                  disabled={estadoCarga.cargando}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  <span>Cancelar</span>
                </button>

                <button 
                  type="submit" 
                  className="btn-guardar-elegante" 
                  disabled={estadoCarga.cargando || estadoSubida.subiendo}
                >
                  {estadoCarga.cargando || estadoSubida.subiendo ? (
                    <>
                      <div className="spinner-elegante"></div>
                      <span>{estadoSubida.subiendo ? 'Subiendo...' : 'Guardando...'}</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                      </svg>
                      <span>{editandoId ? 'Actualizar Artículo' : 'Crear Artículo'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Listado de ArtÃ­culos */}
      <section className="grid-articulos">
        {estadoCarga.cargando && articulos.length === 0 ? (
          <div className="estado-general">Cargando artículos...</div>
        ) : articulos.length === 0 ? (
          <div className="estado-general">
            <h3>No hay artículos todavía</h3>
            <p>¡Crea tu primer artículo para empezar a compartir tu conocimiento!</p>
          </div>
        ) : (
          articulos.map((articulo) => (
            <div key={articulo.id} className="tarjeta-articulo">
              <img
                src={articulo.imagen_url || 'https://placehold.co/600x400/13b67a/ffffff?text=Academia'}
                alt={`Imagen de ${articulo.titulo}`}
                className="imagen-tarjeta"
              />
              <div className="contenido-tarjeta">
                <span className={`estado-etiqueta ${articulo.estado}`}>{articulo.estado}</span>
                <h3>{articulo.titulo}</h3>
                <p className="resumen-tarjeta">
                  {articulo.resumen?.substring(0, 100) || 'Sin resumen...'}...
                </p>
                <div className="meta-tarjeta">
                  <span>
                    <IconCalendar style={{ marginRight: 6 }} /> {new Date(articulo.creado_en).toLocaleDateString('es-ES')}
                  </span>
                  <span>
                    <IconUser style={{ marginRight: 6 }} /> {articulo.autor || 'Admin'}
                  </span>
                </div>
                <div className="acciones-tarjeta">
                  <button 
                    className="accion-ver" 
                    title="Ver" 
                    onClick={() => window.open(`/blog/${articulo.slug}`, '_blank')}
                  >
                    <IconEye />
                  </button>
                  <button 
                    className="accion-editar" 
                    title="Editar" 
                    onClick={() => iniciarEdicion(articulo)}
                  >
                    <IconEdit />
                  </button>
                  <button 
                    className={`accion-eliminar ${eliminandoId === articulo.id ? 'eliminando' : ''}`}
                    title="Eliminar" 
                    disabled={eliminandoId === articulo.id}
                    onClick={() => {
                      console.log('ðŸ” Datos del artÃ­culo completo:', articulo);
                      console.log('ðŸ†” ID especÃ­fico:', articulo.id, typeof articulo.id);
                      eliminarArticulo(articulo.id);
                    }}
                  >
                    {eliminandoId === articulo.id ? (
                      <div className="spinner-pequeno"></div>
                    ) : (
                      <IconTrash />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default BlogAdminManager;
