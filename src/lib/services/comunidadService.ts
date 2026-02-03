import { supabase } from '$lib/supabase';
import { get } from 'svelte/store';
import { usuario } from '$lib/UsuarioActivo/usuario';

export interface PublicacionComunidad {
  id: string;
  contenido: string;
  fecha_creacion: string;
  url_imagen?: string;
  url_video?: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_apellido: string;
  url_foto_perfil?: string;
  total_likes: number;
  total_comentarios: number;
  like_usuario?: boolean;
  comentarios?: ComentarioComunidad[];
}

export interface ComentarioComunidad {
  id: string;
  contenido: string;
  fecha_creacion: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_apellido: string;
  url_foto_perfil?: string;
  publicacion_id: string;
}

export interface NuevaPublicacion {
  contenido: string;
  url_imagen?: string;
  url_video?: string;
}

export interface NuevoComentario {
  contenido: string;
  publicacion_id: string;
}

// Cargar publicaciones con paginación
export async function cargarPublicaciones(offset: number = 0, limite: number = 10): Promise<PublicacionComunidad[]> {
  const currentUser = get(usuario);
  
  const { data: publicaciones, error } = await supabase
    .from('comunidad_publicaciones')
    .select(`
      *,
      usuario:perfiles!usuario_id (
        id,
        nombre,
        apellido,
        url_foto_perfil
      ),
      total_likes:comunidad_publicaciones_likes (count),
      total_comentarios:comunidad_comentarios (count)
    `)
    .order('fecha_creacion', { ascending: false })
    .range(offset, offset + limite - 1);

  if (error) {
    console.error('Error cargando publicaciones:', error);
    throw error;
  }

  if (!publicaciones) return [];

  // Obtener los likes del usuario actual si está autenticado
  let likesUsuario: string[] = [];
  if (currentUser) {
    const { data: likes } = await supabase
      .from('comunidad_publicaciones_likes')
      .select('publicacion_id')
      .eq('usuario_id', currentUser.id)
      .in('publicacion_id', publicaciones.map((p: any) => p.id));
    
    likesUsuario = likes?.map((like: any) => like.publicacion_id) || [];
  }

  // Formatear las publicaciones
  const publicacionesFormateadas: PublicacionComunidad[] = publicaciones.map((pub: any) => ({
    id: pub.id,
    contenido: pub.contenido,
    fecha_creacion: pub.fecha_creacion,
    url_imagen: pub.url_imagen,
    url_video: pub.url_video,
    usuario_id: pub.usuario_id,
    usuario_nombre: pub.usuario?.nombre || 'Usuario',
    usuario_apellido: pub.usuario?.apellido || '',
    url_foto_perfil: pub.usuario?.url_foto_perfil,
    total_likes: pub.total_likes?.[0]?.count || 0,
    total_comentarios: pub.total_comentarios?.[0]?.count || 0,
    like_usuario: likesUsuario.includes(pub.id)
  }));

  return publicacionesFormateadas;
}

// Cargar comentarios de una publicación
export async function cargarComentarios(publicacionId: string): Promise<ComentarioComunidad[]> {
  const { data: comentarios, error } = await supabase
    .from('comunidad_comentarios')
    .select(`
      *,
      usuario:perfiles!usuario_id (
        id,
        nombre,
        apellido,
        url_foto_perfil
      )
    `)
    .eq('publicacion_id', publicacionId)
    .order('fecha_creacion', { ascending: true });

  if (error) {
    console.error('Error cargando comentarios:', error);
    throw error;
  }

  if (!comentarios) return [];

  return comentarios.map((comentario: any) => ({
    id: comentario.id,
    contenido: comentario.contenido,
    fecha_creacion: comentario.fecha_creacion,
    usuario_id: comentario.usuario_id,
    usuario_nombre: comentario.usuario?.nombre || 'Usuario',
    usuario_apellido: comentario.usuario?.apellido || '',
    url_foto_perfil: comentario.usuario?.url_foto_perfil,
    publicacion_id: comentario.publicacion_id
  }));
}

// Crear una nueva publicación
export async function crearPublicacion(nuevaPublicacion: NuevaPublicacion): Promise<PublicacionComunidad> {
  const currentUser = get(usuario);
  
  if (!currentUser) {
    throw new Error('Debes estar autenticado para crear una publicación');
  }

  const { data: publicacion, error } = await supabase
    .from('comunidad_publicaciones')
    .insert({
      contenido: nuevaPublicacion.contenido,
      url_imagen: nuevaPublicacion.url_imagen,
      url_video: nuevaPublicacion.url_video,
      usuario_id: currentUser.id
    })
    .select(`
      *,
      usuario:perfiles!usuario_id (
        id,
        nombre,
        apellido,
        url_foto_perfil
      )
    `)
    .single();

  if (error) {
    console.error('Error creando publicación:', error);
    throw error;
  }

  return {
    id: publicacion.id,
    contenido: publicacion.contenido,
    fecha_creacion: publicacion.fecha_creacion,
    url_imagen: publicacion.url_imagen,
    url_video: publicacion.url_video,
    usuario_id: publicacion.usuario_id,
    usuario_nombre: publicacion.usuario?.nombre || 'Usuario',
    usuario_apellido: publicacion.usuario?.apellido || '',
    url_foto_perfil: publicacion.usuario?.url_foto_perfil,
    total_likes: 0,
    total_comentarios: 0,
    like_usuario: false
  };
}

// Crear un nuevo comentario
export async function crearComentario(nuevoComentario: NuevoComentario): Promise<ComentarioComunidad> {
  const currentUser = get(usuario);
  
  if (!currentUser) {
    throw new Error('Debes estar autenticado para comentar');
  }

  const { data: comentario, error } = await supabase
    .from('comunidad_comentarios')
    .insert({
      contenido: nuevoComentario.contenido,
      publicacion_id: nuevoComentario.publicacion_id,
      usuario_id: currentUser.id
    })
    .select(`
      *,
      usuario:perfiles!usuario_id (
        id,
        nombre,
        apellido,
        url_foto_perfil
      )
    `)
    .single();

  if (error) {
    console.error('Error creando comentario:', error);
    throw error;
  }

  return {
    id: comentario.id,
    contenido: comentario.contenido,
    fecha_creacion: comentario.fecha_creacion,
    usuario_id: comentario.usuario_id,
    usuario_nombre: comentario.usuario?.nombre || 'Usuario',
    usuario_apellido: comentario.usuario?.apellido || '',
    url_foto_perfil: comentario.usuario?.url_foto_perfil,
    publicacion_id: comentario.publicacion_id
  };
}

// Dar/quitar like a una publicación
export async function toggleLike(publicacionId: string): Promise<{ esLike: boolean; totalLikes: number }> {
  const currentUser = get(usuario);
  
  if (!currentUser) {
    throw new Error('Debes estar autenticado para dar like');
  }

  // Verificar si ya le dio like
  const { data: likeExistente } = await supabase
    .from('comunidad_publicaciones_likes')
    .select('id')
    .eq('publicacion_id', publicacionId)
    .eq('usuario_id', currentUser.id)
    .single();

  let esLike = false;
  
  if (likeExistente) {
    // Quitar like
    const { error } = await supabase
      .from('comunidad_publicaciones_likes')
      .delete()
      .eq('id', likeExistente.id);
    
    if (error) {
      console.error('Error quitando like:', error);
      throw error;
    }
    
    esLike = false;
  } else {
    // Dar like
    const { error } = await supabase
      .from('comunidad_publicaciones_likes')
      .insert({
        publicacion_id: publicacionId,
        usuario_id: currentUser.id
      });
    
    if (error) {
      console.error('Error dando like:', error);
      throw error;
    }
    
    esLike = true;
  }

  // Obtener el total de likes actualizado
  const { data: totalLikes } = await supabase
    .from('comunidad_publicaciones_likes')
    .select('id', { count: 'exact' })
    .eq('publicacion_id', publicacionId);

  return {
    esLike,
    totalLikes: totalLikes?.length || 0
  };
}

// Eliminar una publicación (solo el autor)
export async function eliminarPublicacion(publicacionId: string): Promise<void> {
  const currentUser = get(usuario);
  
  if (!currentUser) {
    throw new Error('Debes estar autenticado para eliminar');
  }

  // Verificar que sea el autor
  const { data: publicacion } = await supabase
    .from('comunidad_publicaciones')
    .select('usuario_id')
    .eq('id', publicacionId)
    .single();

  if (!publicacion || publicacion.usuario_id !== currentUser.id) {
    throw new Error('Solo puedes eliminar tus propias publicaciones');
  }

  const { error } = await supabase
    .from('comunidad_publicaciones')
    .delete()
    .eq('id', publicacionId);

  if (error) {
    console.error('Error eliminando publicación:', error);
    throw error;
  }
}

// Eliminar un comentario (solo el autor)
export async function eliminarComentario(comentarioId: string): Promise<void> {
  const currentUser = get(usuario);
  
  if (!currentUser) {
    throw new Error('Debes estar autenticado para eliminar');
  }

  // Verificar que sea el autor
  const { data: comentario } = await supabase
    .from('comunidad_comentarios')
    .select('usuario_id')
    .eq('id', comentarioId)
    .single();

  if (!comentario || comentario.usuario_id !== currentUser.id) {
    throw new Error('Solo puedes eliminar tus propios comentarios');
  }

  const { error } = await supabase
    .from('comunidad_comentarios')
    .delete()
    .eq('id', comentarioId);

  if (error) {
    console.error('Error eliminando comentario:', error);
    throw error;
  }
}

// Formatear fecha para mostrar
export function formatearFecha(fecha: string): string {
  const ahora = new Date();
  const fechaPublicacion = new Date(fecha);
  const diferencia = ahora.getTime() - fechaPublicacion.getTime();
  
  const minutos = Math.floor(diferencia / (1000 * 60));
  const horas = Math.floor(diferencia / (1000 * 60 * 60));
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  
  if (minutos < 1) {
    return 'Ahora';
  } else if (minutos < 60) {
    return `${minutos}m`;
  } else if (horas < 24) {
    return `${horas}h`;
  } else if (dias < 7) {
    return `${dias}d`;
  } else {
    return fechaPublicacion.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }
}

// Validar contenido de publicación
export function validarPublicacion(contenido: string): string | null {
  if (!contenido || contenido.trim().length === 0) {
    return 'El contenido no puede estar vacío';
  }
  
  if (contenido.length > 500) {
    return 'El contenido no puede tener más de 500 caracteres';
  }
  
  return null;
}

// Validar comentario
export function validarComentario(contenido: string): string | null {
  if (!contenido || contenido.trim().length === 0) {
    return 'El comentario no puede estar vacío';
  }
  
  if (contenido.length > 200) {
    return 'El comentario no puede tener más de 200 caracteres';
  }
  
  return null;
} 