import { supabase } from './clienteSupabase';
import { get } from '$utilidades/tiendaReact';
import { estadoUsuarioActual } from '$servicios/estadoUsuarioActual';

/**
 * Marca el progreso de una parte de tutorial para el usuario actual
 */
export async function actualizarProgresoTutorial(parteId: string, completada: boolean, tutorialId?: string) {
  const { user } = get(estadoUsuarioActual);
  
  if (!user || !user.id) {
    return { error: { message: 'Usuario no autenticado' } };
  }
  
  if (!tutorialId || !parteId) {
    return { error: { message: 'Faltan campos obligatorios', payload: { usuario_id: user.id, tutorial_id: tutorialId, parte_tutorial_id: parteId } } };
  }
  
  try {
    // Busca si ya existe el registro
    const { data: progresoExistente, error: errorBusqueda } = await supabase
      .from('progreso_tutorial')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('parte_tutorial_id', parteId)
      .maybeSingle();

    let resultado;
    if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
      return { error: { message: 'Error buscando progreso existente', detail: errorBusqueda } };
    }
    
    if (progresoExistente) {
      // Ya existe, actualiza
      resultado = await supabase
        .from('progreso_tutorial')
        .update({
          completado: completada,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', progresoExistente.id);
        
      if (resultado.error) {
        return { error: { message: resultado.error.message, detail: resultado.error } };
      }
    } else {
      // No existe, inserta
      const payload = {
        usuario_id: user.id,
        tutorial_id: tutorialId,
        parte_tutorial_id: parteId,
        completado: completada,
        fecha_inicio: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      };
      
      resultado = await supabase
        .from('progreso_tutorial')
        .insert([payload]);
        
      if (resultado.error) {
        return { error: { message: resultado.error.message, detail: resultado.error, payload } };
      }
    }
    return { data: resultado?.data, error: resultado?.error };
  } catch (err) {
    return { error: { message: 'Error inesperado al actualizar progreso', detail: err } };
  }
}

/**
 * Obtiene el progreso de una parte específica del tutorial para el usuario actual
 */
export async function obtenerProgresoTutorialDeParte(parteId: string) {
  const { user } = get(estadoUsuarioActual);
  
  if (!user || !user.id) {
    return { data: null, error: { message: 'Usuario no autenticado' } };
  }
  
  if (!parteId) {
    return { data: null, error: { message: 'Parte ID no proporcionada' } };
  }
  
  try {
    
    const { data, error } = await supabase
      .from('progreso_tutorial')
      .select('id, usuario_id, parte_tutorial_id, tutorial_id, completado, fecha_inicio, fecha_actualizacion')
      .eq('usuario_id', user.id)
      .eq('parte_tutorial_id', parteId)
      .maybeSingle(); // Usar maybeSingle en lugar de single para evitar errores si no existe
      
    if (error) {
      return { data: null, error: { message: 'Error al obtener progreso de la parte', detail: error } };
    }
    
    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Error inesperado al obtener progreso de la parte', detail: err } };
  }
}

/**
 * Obtiene el progreso general del tutorial para el usuario actual
 */
export async function obtenerProgresoTutorial(tutorialId: string) {
  const { user } = get(estadoUsuarioActual);
  
  if (!user || !user.id) {
    return { data: null, error: { message: 'Usuario no autenticado' } };
  }
  
  if (!tutorialId) {
    return { data: null, error: { message: 'Tutorial ID no proporcionado' } };
  }
  
  try {
    
    // Obtener todas las partes del tutorial
    const { data: partes, error: errorPartes } = await supabase
      .from('partes_tutorial')
      .select('id')
      .eq('tutorial_id', tutorialId);
      
    if (errorPartes) {
      return { data: null, error: errorPartes };
    }
    
    if (!partes || partes.length === 0) {
      return { data: { progreso: 0, partes_completadas: 0, total_partes: 0 }, error: null };
    }
    
    const parteIds = partes.map((p: any) => p.id);
    
    // Obtener progreso del usuario en esas partes
    const { data: progreso, error: errorProgreso } = await supabase
      .from('progreso_tutorial')
      .select('id, usuario_id, parte_tutorial_id, tutorial_id, completado, fecha_inicio, fecha_actualizacion')
      .eq('usuario_id', user.id)
      .in('parte_tutorial_id', parteIds);
    
    if (errorProgreso) {
      return { data: null, error: errorProgreso };
    }
    
    const partesCompletadas = progreso ? progreso.filter((p: any) => p.completado).length : 0;
    const totalPartes = partes.length;
    const porcentajeProgreso = totalPartes > 0 ? Math.round((partesCompletadas / totalPartes) * 100) : 0;
    
    const resultado = {
        progreso: porcentajeProgreso,
        partes_completadas: partesCompletadas,
        total_partes: totalPartes,
        detalle: progreso || []
    };
    
    return { data: resultado, error: null };
  } catch (err) {
    return { data: null, error: { message: 'Error inesperado al obtener progreso del tutorial', detail: err } };
  }
}

/**
 * Verifica si una parte del tutorial está completada
 */
export async function verificarParteCompletada(tutorialId: string, parteId: string) {
  const { data, error } = await obtenerProgresoTutorialDeParte(parteId);
  
  if (error || !data) {
    return false;
  }
  
  return data.completado;
}






