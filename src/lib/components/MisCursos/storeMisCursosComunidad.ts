import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase/clienteSupabase';
import { obtenerSesion } from '$lib/supabase/autenticacionSupabase';

export const inscripcionesComunidad = writable({
  inscripciones: [] as any[],
  isLoading: true,
  error: null as string | null
});

export async function cargarInscripcionesComunidad() {
  inscripcionesComunidad.set({ inscripciones: [], isLoading: true, error: null });

  try {
    const sesion = await obtenerSesion();
    if (!sesion?.user) {
      inscripcionesComunidad.set({ inscripciones: [], isLoading: false, error: 'No autenticado' });
      return;
    }

    // 🚀 USAR LA MISMA LÓGICA QUE FUNCIONA EN MIS-CURSOS
    // Primero obtener todas las inscripciones del usuario
    const { data: inscripcionesData, error } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('usuario_id', sesion.user.id)
      .order('fecha_inscripcion', { ascending: false });

    if (error) {
      throw error;
    }

    if (!inscripcionesData || inscripcionesData.length === 0) {
      inscripcionesComunidad.set({ inscripciones: [], isLoading: false, error: null });
      return;
    }

    // Separar las inscripciones por tipo
    const inscripcionesCursos = inscripcionesData.filter((i: any) => i.curso_id);
    const inscripcionesTutoriales = inscripcionesData.filter((i: any) => i.tutorial_id);

    // Obtener datos de cursos si hay inscripciones a cursos
    let cursosData = [];
    if (inscripcionesCursos.length > 0) {
      const cursoIds = inscripcionesCursos.map((i: any) => i.curso_id);
      const { data: cursos } = await supabase
        .from('cursos')
        .select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, slug')
        .in('id', cursoIds);
      cursosData = cursos || [];
    }

    // Obtener datos de tutoriales si hay inscripciones a tutoriales
    let tutorialesData = [];
    if (inscripcionesTutoriales.length > 0) {
      const tutorialIds = inscripcionesTutoriales.map((i: any) => i.tutorial_id);
      const { data: tutoriales } = await supabase
        .from('tutoriales')
        .select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, artista, acordeonista, tonalidad, slug')
        .in('id', tutorialIds);
      tutorialesData = tutoriales || [];
    }

    // Combinar todo EXACTAMENTE como en mis-cursos
    const inscripciones = [
      // Inscripciones a cursos
      ...inscripcionesCursos.map((inscripcion: any) => ({
        ...inscripcion,
        cursos: cursosData.find((curso: any) => curso.id === inscripcion.curso_id)
      })),
      // Inscripciones a tutoriales  
      ...inscripcionesTutoriales.map((inscripcion: any) => ({
        ...inscripcion,
        tutoriales: tutorialesData.find((tutorial: any) => tutorial.id === inscripcion.tutorial_id)
      }))
    ];

    // Reordenar por fecha de inscripción
    inscripciones.sort((a, b) => new Date(b.fecha_inscripcion).getTime() - new Date(a.fecha_inscripcion).getTime());

    // 🐛 DEBUG: Log para verificar cuántas inscripciones se encontraron
    console.log('[storeMisCursosComunidad] 🧪 TOTAL inscripciones encontradas:', inscripciones.length);
    console.log('[storeMisCursosComunidad] 📋 Inscripciones detalle:', inscripciones);
    console.log('[storeMisCursosComunidad] 📋 Cursos encontrados:', inscripcionesCursos.length);
    console.log('[storeMisCursosComunidad] 📋 Tutoriales encontrados:', inscripcionesTutoriales.length);

    inscripcionesComunidad.set({
      inscripciones: inscripciones,
      isLoading: false,
      error: null
    });

  } catch (err: any) {
    console.error('Error inesperado en cargarInscripcionesComunidad:', err);
    inscripcionesComunidad.set({
      inscripciones: [],
      isLoading: false,
      error: err.message || 'Ocurrió un error inesperado.'
    });
  }
}
