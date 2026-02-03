import { supabase } from '$lib/supabase/clienteSupabase';
import { generateSlug, getIdFromSlug } from '$lib/utilidades/utilidadesSlug';
import type { CursoBase, ModuloBase, LeccionBase, CursoCompleto, ModuloConLecciones } from '$lib/types';

/**
 * Obtiene todos los cursos y genera sus slugs
 */
export async function obtenerCursos(): Promise<{ cursos: CursoBase[], error: any }> {
  try {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .eq('estado', 'publicado');
    
    if (error) throw error;
    
    // Generar slugs para cada curso
    const cursosConSlug = data.map((curso: CursoBase) => ({
      ...curso,
      slug: generateSlug(curso.titulo)
    }));
    
    return { cursos: cursosConSlug, error: null };
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    return { cursos: [], error };
  }
}

/**
 * Obtiene un curso por su slug
 */
export async function obtenerCursoPorSlug(slug: string): Promise<{ curso: CursoBase | null, error: any }> {
  try {
    console.log(`Buscando curso con slug: ${slug}`);
    
    // Obtenemos todos los cursos que podrían coincidir con el slug o parte de él
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .or(`slug.eq.${slug},slug.like.${slug}-%`);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      // Si no encontramos un curso con el slug exacto o con un prefijo,
      // intentamos con todos los cursos y la función de helper
      const { cursos, error: cursosError } = await obtenerCursos();
      if (cursosError) throw cursosError;
      
      const cursoId = getIdFromSlug(slug, cursos);
      if (!cursoId) {
        return { curso: null, error: 'Curso no encontrado' };
      }
      
      // Obtener detalles del curso por ID
      const { data: cursoData, error: cursoError } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', cursoId)
        .single();
      
      if (cursoError) throw cursoError;
      
      // Añadir el slug al curso
      const cursoConSlug = {
        ...cursoData,
        slug: cursoData.slug || generateSlug(cursoData.titulo)
      };
      
      return { curso: cursoConSlug, error: null };
    }
    
    // Si encontramos resultados, tomamos el primero
    const curso = data[0];
    
    // Aseguramos que el curso tenga un slug
    const cursoConSlug = {
      ...curso,
      slug: curso.slug || generateSlug(curso.titulo)
    };
    
    return { curso: cursoConSlug, error: null };
  } catch (error) {
    console.error('Error al obtener curso por slug:', error);
    return { curso: null, error };
  }
}

/**
 * Obtiene un curso completo con sus módulos y lecciones
 */
export async function obtenerCursoCompletoPorSlug(slug: string): Promise<{ curso: CursoCompleto & { leccionesSueltas?: any[] } | null, error: any }> {
  try {
    // Primero obtenemos el curso por su slug
    const { curso, error } = await obtenerCursoPorSlug(slug);
    if (error || !curso) {
      console.error('Error al obtener curso por slug:', error);
      return { curso: null, error };
    }
    // Obtener los módulos del curso
    const { data: modulos, error: modulosError } = await supabase
      .from('modulos')
      .select('*')
      .eq('curso_id', curso.id)
      .order('orden');
    let modulosConSlug: ModuloBase[] = [];
    if (modulosError) {
      console.error('Error al obtener módulos:', modulosError);
      modulosConSlug = [];
    } else {
      modulosConSlug = (modulos || []).map((modulo: ModuloBase) => ({
        ...modulo,
        slug: generateSlug(modulo.titulo)
      }));
    }
    // Para cada módulo, obtener sus lecciones
    const modulosConLecciones = await Promise.all(
      modulosConSlug.map(async (modulo: ModuloBase) => {
        const { data: lecciones, error: leccionesError } = await supabase
          .from('lecciones')
          .select('*')
          .eq('modulo_id', modulo.id)
          .order('orden');
        let leccionesConSlug: LeccionBase[] = [];
        if (leccionesError) {
          console.error('Error al obtener lecciones:', leccionesError);
          leccionesConSlug = [];
        } else {
          leccionesConSlug = (lecciones || []).map((leccion: LeccionBase) => ({
            ...leccion,
            slug: generateSlug(leccion.titulo)
          }));
        }
        return {
          ...modulo,
          lecciones: leccionesConSlug
        };
      })
    );
    // Buscar lecciones sueltas (sin módulo)
    const { data: leccionesSueltas, error: leccionesSueltasError } = await supabase
      .from('lecciones')
      .select('*')
      .eq('curso_id', curso.id)
      .is('modulo_id', null)
      .order('orden');
    let leccionesSueltasConSlug: any[] = [];
    if (leccionesSueltasError) {
      console.error('Error al obtener lecciones sueltas:', leccionesSueltasError);
      leccionesSueltasConSlug = [];
    } else {
      leccionesSueltasConSlug = (leccionesSueltas || []).map((leccion: any) => ({
        ...leccion,
        slug: generateSlug(leccion.titulo)
      }));
    }

    // Construir el curso completo
    const cursoCompleto: CursoCompleto & { lecciones_sueltas?: any[] } = {
      ...curso,
      modulos: modulosConLecciones,
      lecciones_sueltas: leccionesSueltasConSlug
    };

    return { curso: cursoCompleto, error: null };
  } catch (error) {
    console.error('Error al obtener curso completo:', error);
    return { curso: null, error };
  }
}

/**
 * Obtiene un módulo por su slug dentro de un curso específico
 */
export async function obtenerModuloPorSlug(cursoSlug: string, moduloSlug: string): Promise<{ modulo: ModuloConLecciones | null, error: any }> {
  try {
    // Primero obtenemos el curso completo
    const { curso, error } = await obtenerCursoCompletoPorSlug(cursoSlug);
    if (error || !curso) throw error || new Error('Curso no encontrado');
    
    // Buscar el módulo por su slug
    const modulo = curso.modulos.find(modulo => modulo.slug === moduloSlug);
    if (!modulo) {
      return { modulo: null, error: 'Módulo no encontrado' };
    }
    
    return { modulo, error: null };
  } catch (error) {
    console.error('Error al obtener módulo por slug:', error);
    return { modulo: null, error };
  }
}

/**
 * Obtiene una lección por su slug dentro de un módulo y curso específicos
 */
export async function obtenerLeccionPorSlug(cursoSlug: string, moduloSlug: string, leccionSlug: string): Promise<{ leccion: LeccionBase | null, error: any }> {
  try {
    // Primero obtenemos el módulo
    const { modulo, error } = await obtenerModuloPorSlug(cursoSlug, moduloSlug);
    if (error || !modulo) throw error || new Error('Módulo no encontrado');
    
    // Buscar la lección por su slug
    const leccion = modulo.lecciones.find(leccion => leccion.slug === leccionSlug);
    if (!leccion) {
      return { leccion: null, error: 'Lección no encontrada' };
    }
    
    return { leccion, error: null };
  } catch (error) {
    console.error('Error al obtener lección por slug:', error);
    return { leccion: null, error };
  }
} 