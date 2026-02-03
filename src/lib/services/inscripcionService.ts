import { supabase } from '$lib/supabase/clienteSupabase';
import { obtenerCursoPorSlug } from './cursoService';

/**
 * Verifica si un usuario está inscrito a un curso (usando slug)
 */
export async function verificarInscripcionPorSlug(
  userId: string, 
  cursoSlug: string
): Promise<{ inscrito: boolean; error: string | null; cursoId?: string }> {
  try {
    if (!userId || !cursoSlug) {
      return { 
        inscrito: false, 
        error: 'ID de usuario o slug del curso no proporcionado' 
      };
    }
    
    // Primero obtenemos el ID del curso desde el slug
    const { curso, error: cursoError } = await obtenerCursoPorSlug(cursoSlug);
    
    if (cursoError || !curso) {
      return { 
        inscrito: false, 
        error: cursoError || 'No se pudo encontrar el curso'
      };
    }
    
    // Con el ID del curso, verificamos la inscripción
    const { data, error } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('usuario_id', userId)
      .eq('curso_id', curso.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // No se encontraron resultados
      return { 
        inscrito: false, 
        error: error.message,
        cursoId: curso.id 
      };
    }
    
    return { 
      inscrito: !!data, 
      error: null, 
      cursoId: curso.id 
    };
  } catch (error: any) {
    console.error('Error al verificar inscripción por slug:', error);
    return {
      inscrito: false,
      error: error.message || 'Error al verificar inscripción'
    };
  }
}

/**
 * Inscribe a un usuario a un curso (usando slug)
 */
export async function inscribirACursoPorSlug(
  userId: string, 
  cursoSlug: string
): Promise<{ success: boolean; error: string | null; message?: string }> {
  try {
    if (!userId || !cursoSlug) {
      return { 
        success: false, 
        error: 'ID de usuario o slug del curso no proporcionado' 
      };
    }
    
    // Primero obtenemos el ID del curso desde el slug
    const { curso, error: cursoError } = await obtenerCursoPorSlug(cursoSlug);
    
    if (cursoError || !curso) {
      return { 
        success: false, 
        error: cursoError || 'No se pudo encontrar el curso' 
      };
    }
    
    // Verificamos si ya está inscrito
    const { inscrito, error: checkError } = await verificarInscripcionPorSlug(userId, cursoSlug);
    
    if (checkError && !inscrito) {
      console.error('Error al verificar inscripción:', checkError);
    }
    
    if (inscrito) {
      return { 
        success: true, 
        error: null, 
        message: 'Ya estás inscrito a este curso' 
      };
    }
    
    // Intentamos la inscripción directa
    const { error: insertError } = await supabase
      .from('inscripciones')
      .insert({
        usuario_id: userId,
        curso_id: curso.id,
        fecha_inscripcion: new Date().toISOString(),
        progreso: 0,
        completado: false
      });
      
    if (insertError) {
      console.error('Error al inscribir al curso:', insertError);
      return { 
        success: false, 
        error: insertError.message || 'Error al inscribir al curso' 
      };
    }
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error general al inscribir por slug:', error);
    return {
      success: false,
      error: error.message || 'Error inesperado al inscribir al curso'
    };
  }
} 