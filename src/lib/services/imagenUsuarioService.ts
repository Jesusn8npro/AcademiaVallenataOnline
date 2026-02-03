import { supabase } from '$lib/supabase/clienteSupabase';

// Tipos para el sistema de imágenes de usuario
export interface UsuarioImagen {
  id: string;
  usuario_id: string;
  url_imagen: string;
  tipo: 'avatar' | 'portada';
  fecha_subida: string;
  es_actual: boolean;
}

export interface UsuarioImagenComentario {
  id: string;
  imagen_id: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_avatar: string;
  comentario: string;
  fecha_creacion: string;
  comentario_padre_id: string | null;
}

export interface UsuarioImagenLike {
  id: number;
  imagen_id: string;
  usuario_id: string;
  fecha_creacion: string;
}

export interface EstadisticasImagen {
  totalLikes: number;
  totalComentarios: number;
  yaLikee: boolean;
}

/**
 * Obtiene o crea una imagen de usuario en la base de datos
 */
export async function obtenerOCrearImagenUsuario(
  usuarioId: string,
  urlImagen: string,
  tipo: 'avatar' | 'portada'
): Promise<UsuarioImagen | null> {
  try {
    // Buscar imagen existente
    const { data: imagenExistente, error: errorBuscar } = await supabase
      .from('usuario_imagenes')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('tipo', tipo)
      .eq('es_actual', true)
      .single();

    if (!errorBuscar && imagenExistente) {
      return imagenExistente;
    }

    // Crear nueva imagen
    const { data: nuevaImagen, error: errorCrear } = await supabase
      .from('usuario_imagenes')
      .insert({
        usuario_id: usuarioId,
        url_imagen: urlImagen,
        tipo: tipo,
        fecha_subida: new Date().toISOString(),
        es_actual: true
      })
      .select()
      .single();

    if (errorCrear) {
      console.error('Error creando imagen:', errorCrear);
      return null;
    }

    // Marcar otras imágenes del mismo tipo como no actuales
    await supabase
      .from('usuario_imagenes')
      .update({ es_actual: false })
      .eq('usuario_id', usuarioId)
      .eq('tipo', tipo)
      .neq('id', nuevaImagen.id);

    return nuevaImagen;
  } catch (error) {
    console.error('Error en obtenerOCrearImagenUsuario:', error);
    return null;
  }
}

/**
 * Obtiene las estadísticas de una imagen (likes y comentarios)
 */
export async function obtenerEstadisticasImagen(
  imagenId: string,
  usuarioActualId?: string
): Promise<EstadisticasImagen> {
  try {
    // Obtener likes
    const { data: likes, error: errorLikes } = await supabase
      .from('usuario_imagenes_likes')
      .select('*')
      .eq('imagen_id', imagenId);

    if (errorLikes) throw errorLikes;

    // Obtener comentarios
    const { data: comentarios, error: errorComentarios } = await supabase
      .from('usuario_imagenes_comentarios')
      .select('id')
      .eq('imagen_id', imagenId);

    if (errorComentarios) throw errorComentarios;

    const totalLikes = likes?.length || 0;
    const totalComentarios = comentarios?.length || 0;
    const yaLikee = usuarioActualId ? 
      likes?.some(like => like.usuario_id === usuarioActualId) || false : 
      false;

    return {
      totalLikes,
      totalComentarios,
      yaLikee
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      totalLikes: 0,
      totalComentarios: 0,
      yaLikee: false
    };
  }
}

/**
 * Obtiene todos los likes de una imagen
 */
export async function obtenerLikesImagen(imagenId: string): Promise<UsuarioImagenLike[]> {
  try {
    const { data, error } = await supabase
      .from('usuario_imagenes_likes')
      .select('*')
      .eq('imagen_id', imagenId)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo likes:', error);
    return [];
  }
}

/**
 * Obtiene todos los comentarios de una imagen
 */
export async function obtenerComentariosImagen(imagenId: string): Promise<UsuarioImagenComentario[]> {
  try {
    const { data, error } = await supabase
      .from('usuario_imagenes_comentarios')
      .select('*')
      .eq('imagen_id', imagenId)
      .order('fecha_creacion', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    return [];
  }
}

/**
 * Alterna el like de un usuario en una imagen
 */
export async function toggleLikeImagen(
  imagenId: string,
  usuarioId: string
): Promise<{ exito: boolean; yaLikee: boolean; totalLikes: number }> {
  try {
    // Verificar si ya existe el like
    const { data: likeExistente, error: errorBuscar } = await supabase
      .from('usuario_imagenes_likes')
      .select('*')
      .eq('imagen_id', imagenId)
      .eq('usuario_id', usuarioId)
      .single();

    if (likeExistente && !errorBuscar) {
      // Quitar like
      const { error: errorEliminar } = await supabase
        .from('usuario_imagenes_likes')
        .delete()
        .eq('imagen_id', imagenId)
        .eq('usuario_id', usuarioId);

      if (errorEliminar) throw errorEliminar;

      // Obtener nuevo total
      const estadisticas = await obtenerEstadisticasImagen(imagenId, usuarioId);
      
      return {
        exito: true,
        yaLikee: false,
        totalLikes: estadisticas.totalLikes
      };
    } else {
      // Dar like
      const { error: errorInsertar } = await supabase
        .from('usuario_imagenes_likes')
        .insert({
          imagen_id: imagenId,
          usuario_id: usuarioId,
          fecha_creacion: new Date().toISOString()
        });

      if (errorInsertar) throw errorInsertar;

      // Obtener nuevo total
      const estadisticas = await obtenerEstadisticasImagen(imagenId, usuarioId);
      
      return {
        exito: true,
        yaLikee: true,
        totalLikes: estadisticas.totalLikes
      };
    }
  } catch (error) {
    console.error('Error en toggleLikeImagen:', error);
    return {
      exito: false,
      yaLikee: false,
      totalLikes: 0
    };
  }
}

/**
 * Agrega un comentario a una imagen
 */
export async function agregarComentarioImagen(
  imagenId: string,
  usuarioId: string,
  usuarioNombre: string,
  usuarioAvatar: string,
  comentario: string,
  comentarioPadreId?: string | null
): Promise<{ exito: boolean; comentario?: UsuarioImagenComentario }> {
  try {
    const { data, error } = await supabase
      .from('usuario_imagenes_comentarios')
      .insert({
        imagen_id: imagenId,
        usuario_id: usuarioId,
        usuario_nombre: usuarioNombre,
        usuario_avatar: usuarioAvatar,
        comentario: comentario.trim(),
        fecha_creacion: new Date().toISOString(),
        comentario_padre_id: comentarioPadreId || null
      })
      .select()
      .single();

    if (error) throw error;

    return {
      exito: true,
      comentario: data
    };
  } catch (error) {
    console.error('Error agregando comentario:', error);
    return {
      exito: false
    };
  }
}

/**
 * Elimina un comentario (solo el propietario puede hacerlo)
 */
export async function eliminarComentarioImagen(
  comentarioId: string,
  usuarioId: string
): Promise<{ exito: boolean }> {
  try {
    // Verificar que el usuario sea el propietario del comentario
    const { data: comentario, error: errorBuscar } = await supabase
      .from('usuario_imagenes_comentarios')
      .select('usuario_id')
      .eq('id', comentarioId)
      .single();

    if (errorBuscar || !comentario || comentario.usuario_id !== usuarioId) {
      return { exito: false };
    }

    // Eliminar el comentario
    const { error: errorEliminar } = await supabase
      .from('usuario_imagenes_comentarios')
      .delete()
      .eq('id', comentarioId);

    if (errorEliminar) throw errorEliminar;

    return { exito: true };
  } catch (error) {
    console.error('Error eliminando comentario:', error);
    return { exito: false };
  }
}

/**
 * Obtiene comentarios principales (sin padre) y sus respuestas
 */
export interface ComentarioConRespuestas extends UsuarioImagenComentario {
  respuestas: UsuarioImagenComentario[];
}

export async function obtenerComentariosConRespuestas(imagenId: string): Promise<ComentarioConRespuestas[]> {
  try {
    const todosLosComentarios = await obtenerComentariosImagen(imagenId);
    
    // Separar comentarios principales de las respuestas
    const comentariosPrincipales = todosLosComentarios.filter(c => !c.comentario_padre_id);
    const respuestas = todosLosComentarios.filter(c => c.comentario_padre_id);
    
    // Asociar respuestas con sus comentarios padre
    const comentariosConRespuestas: ComentarioConRespuestas[] = comentariosPrincipales.map(comentario => ({
      ...comentario,
      respuestas: respuestas.filter(r => r.comentario_padre_id === comentario.id)
    }));

    return comentariosConRespuestas;
  } catch (error) {
    console.error('Error obteniendo comentarios con respuestas:', error);
    return [];
  }
}

/**
 * Formatea una fecha para mostrar en el UI (tiempo relativo)
 */
export function formatearTiempoRelativo(fecha: string): string {
  const ahora = new Date();
  const fechaComentario = new Date(fecha);
  const diffMs = ahora.getTime() - fechaComentario.getTime();
  
  const diffSegundos = Math.floor(diffMs / 1000);
  const diffMinutos = Math.floor(diffSegundos / 60);
  const diffHoras = Math.floor(diffMinutos / 60);
  const diffDias = Math.floor(diffHoras / 24);
  const diffSemanas = Math.floor(diffDias / 7);
  const diffMeses = Math.floor(diffDias / 30);
  const diffAños = Math.floor(diffDias / 365);

  if (diffSegundos < 30) return 'Ahora mismo';
  if (diffMinutos < 1) return `${diffSegundos}s`;
  if (diffMinutos < 60) return `${diffMinutos}m`;
  if (diffHoras < 24) return `${diffHoras}h`;
  if (diffDias < 7) return `${diffDias}d`;
  if (diffSemanas < 4) return `${diffSemanas}sem`;
  if (diffMeses < 12) return `${diffMeses}mes`;
  return `${diffAños}a`;
}

/**
 * Valida que un comentario sea válido antes de enviarlo
 */
export function validarComentario(comentario: string): { valido: boolean; error?: string } {
  const comentarioLimpio = comentario.trim();
  
  if (!comentarioLimpio) {
    return { valido: false, error: 'El comentario no puede estar vacío' };
  }
  
  if (comentarioLimpio.length > 1000) {
    return { valido: false, error: 'El comentario es demasiado largo (máximo 1000 caracteres)' };
  }
  
  if (comentarioLimpio.length < 1) {
    return { valido: false, error: 'El comentario es demasiado corto' };
  }
  
  return { valido: true };
} 