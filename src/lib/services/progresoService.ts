import { supabase } from '$lib/supabase';
import { get } from 'svelte/store';
import { estadoUsuarioActual } from '$lib/supabase/estadoUsuarioActual';
// NOTA: Cambia 'authStore' por 'estadoUsuarioActual' en el código si es necesario.

/**
 * Actualiza el progreso de una lección para el usuario actual
 * @param leccionId - ID de la lección
 * @param completada - Estado de completado
 * @returns Objeto que contiene el resultado y posible error
 */
export async function actualizarProgresoLeccion(leccionId: string, completada: boolean) {
  const { user } = get(estadoUsuarioActual);
  
  if (!user || !user.id) {
    console.error('[PROGRESO LECCION] Usuario no autenticado');
    return { error: { message: 'Usuario no autenticado' } };
  }
  
  if (!leccionId) {
    console.error('[PROGRESO LECCION] Falta leccion_id');
    return { error: { message: 'Falta leccion_id' } };
  }
  
  try {
    // Verificar si ya existe un registro de progreso
    const { data: progresoExistente, error: errorBusqueda } = await supabase
      .from('progreso_lecciones')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('leccion_id', leccionId)
      .maybeSingle();

    let resultado;
    if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
      console.error('[PROGRESO LECCION] Error buscando progreso existente:', errorBusqueda);
      return { error: { message: 'Error buscando progreso existente', detail: errorBusqueda } };
    }
    
    if (progresoExistente) {
      // Actualizar progreso existente
      resultado = await supabase
        .from('progreso_lecciones')
        .update({
          estado: completada ? 'completada' : 'en_progreso',
          porcentaje_completado: completada ? 100 : 0,
          updated_at: new Date().toISOString(),
          ultima_actividad: new Date().toISOString()
        })
        .eq('id', progresoExistente.id);
        
      if (resultado.error) {
        console.error('[PROGRESO LECCION] Error UPDATE:', resultado.error);
        return { error: { message: resultado.error.message, detail: resultado.error } };
      }
    } else {
      // Crear un nuevo registro de progreso
      const payload = {
        usuario_id: user.id,
        leccion_id: leccionId,
        estado: completada ? 'completada' : 'en_progreso',
        porcentaje_completado: completada ? 100 : 0,
        tiempo_total: 0,
        calificacion: null,
        notas: null,
        ultima_actividad: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      resultado = await supabase
        .from('progreso_lecciones')
        .insert([payload]);
        
      if (resultado.error) {
        console.error('[PROGRESO LECCION] Error INSERT:', resultado.error);
        return { error: { message: resultado.error.message, detail: resultado.error, payload } };
      }
    }
    return { data: resultado?.data, error: resultado?.error };
  } catch (err) {
    console.error('[PROGRESO LECCION] Error inesperado:', err);
    return { error: { message: 'Error inesperado al actualizar progreso de la lección', detail: err } };
  }
}

/**
 * Obtiene el progreso de una lección para el usuario actual
 * @param leccionId - ID de la lección
 * @returns Objeto que contiene el resultado y posible error
 */
export async function obtenerProgresoLeccion(leccionId: string) {
  const { user } = get(estadoUsuarioActual);
  
  if (!user || !user.id) {
    return { data: null, error: { message: 'Usuario no autenticado' } };
  }
  
  try {
    const { data, error } = await supabase
      .from('progreso_lecciones')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('leccion_id', leccionId)
      .single();
    
    return { data, error };
  } catch (err) {
    console.error('Error al obtener progreso:', err);
    return { data: null, error: { message: 'Error al obtener progreso de la lección' } };
  }
}

/**
 * Obtiene el progreso de todas las lecciones de un curso para el usuario actual
 * @param cursoId - ID del curso
 * @returns Objeto que contiene el resultado y posible error
 */
export async function obtenerProgresoCurso(cursoId: string) {
  const { user } = get(estadoUsuarioActual);
  
  if (!user || !user.id) {
    return { data: null, error: { message: 'Usuario no autenticado' } };
  }
  
  try {
    // Primero obtener todos los módulos del curso
    const { data: modulos, error: errorModulos } = await supabase
      .from('modulos')
      .select('id')
      .eq('curso_id', cursoId);
    
    if (errorModulos) {
      return { data: null, error: errorModulos };
    }
    
    if (!modulos || modulos.length === 0) {
      return { data: { progreso: 0, partes_completadas: 0, total_partes: 0 }, error: null };
    }
    
    // Luego obtener todas las lecciones de esos módulos
    const moduloIds = modulos.map((m: any) => m.id);
    const { data: lecciones, error: errorLecciones } = await supabase
      .from('lecciones')
      .select('id, modulo_id')
      .in('modulo_id', moduloIds);
    
    if (errorLecciones) {
      return { data: null, error: errorLecciones };
    }
    
    if (!lecciones || lecciones.length === 0) {
      return { data: { progreso: 0, partes_completadas: 0, total_partes: 0 }, error: null };
    }
    
    // Obtener el progreso de todas las lecciones del curso
    const leccionIds = lecciones.map((l: any) => l.id);
    const { data: progreso, error: errorProgreso } = await supabase
      .from('progreso_lecciones')
      .select('leccion_id, estado, porcentaje_completado')
      .eq('usuario_id', user.id)
      .in('leccion_id', leccionIds);
    
    if (errorProgreso) {
      return { data: null, error: errorProgreso };
    }
    
    // Considera completada si estado === 'completada' o porcentaje_completado === 100
    const leccionesCompletadas = progreso
      ? progreso.filter((p: any) => p.estado === 'completada' || p.porcentaje_completado === 100).length
      : 0;
    const totalLecciones = lecciones.length;
    const porcentajeProgreso = totalLecciones > 0 ? Math.round((leccionesCompletadas / totalLecciones) * 100) : 0;
    
    return {
      data: {
        progreso: porcentajeProgreso,
        partes_completadas: leccionesCompletadas,
        total_partes: totalLecciones,
        lecciones_completadas: leccionesCompletadas, // Mantener compatibilidad
        total_lecciones: totalLecciones, // Mantener compatibilidad
        detalle: progreso || []
      },
      error: null
    };
  } catch (err) {
    console.error('Error al obtener progreso del curso:', err);
    return { data: null, error: { message: 'Error al obtener progreso del curso' } };
  }
}

/**
 * Verifica si una lección está completada
 * @param leccionId - ID de la lección
 * @returns Booleano indicando si está completada
 */
export async function verificarLeccionCompletada(leccionId: string) {
  const { data, error } = await obtenerProgresoLeccion(leccionId);
  
  if (error || !data) {
    return false;
  }
  
  // Verificar si está completada usando los campos correctos
  return data.estado === 'completada' || data.porcentaje_completado === 100;
}

/**
 * Guarda un comentario del usuario en una lección
 * @param leccionId - ID de la lección
 * @param comentario - Texto del comentario
 * @returns Objeto que contiene el resultado y posible error
 */
export async function guardarComentarioLeccion(leccionId: string, comentario: string) {
  const { user } = get(estadoUsuarioActual);
  
  if (!user || !user.id) {
    return { error: { message: 'Usuario no autenticado' } };
  }
  
  try {
    const { data, error } = await supabase
      .from('comentarios_lecciones')
      .insert({
        usuario_id: user.id,
        leccion_id: leccionId,
        contenido: comentario,
        fecha_creacion: new Date().toISOString()
      })
      .select();
    
    return { data, error };
  } catch (err) {
    console.error('Error al guardar comentario:', err);
    return { error: { message: 'Error al guardar comentario' } };
  }
}

/**
 * Obtiene los comentarios de una lección
 * @param leccionId - ID de la lección
 * @returns Objeto que contiene el resultado y posible error
 */
export async function obtenerComentariosLeccion(leccionId: string) {
  try {
    const { data, error } = await supabase
      .from('comentarios_lecciones')
      .select(`
        *,
        profiles:usuario_id (
          id,
          nombre,
          apellido,
          avatar_url
        )
      `)
      .eq('leccion_id', leccionId)
      .order('fecha_creacion', { ascending: false });
    
    return { data, error };
  } catch (err) {
    console.error('Error al obtener comentarios:', err);
    return { data: null, error: { message: 'Error al obtener comentarios' } };
  }
} 