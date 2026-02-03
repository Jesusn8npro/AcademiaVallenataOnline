import { supabase } from '$lib/supabase';

import { generateSlug } from '$lib/utilidades/utilidadesSlug';

export async function obtenerTutorialCompletoPorSlug(slug: string) {
  // Buscar todos los tutoriales
  const { data: tutoriales, error: tutorialError } = await supabase
    .from('tutoriales')
    .select('*');

  // Buscar el tutorial cuyo slug generado por el título coincida con el de la URL
  const tutorial = (tutoriales || []).find(
    (t: any) => generateSlug(t.titulo) === slug
  );

  if (!tutorial) return { tutorial: null, partes: [], error: tutorialError || 'Tutorial no encontrado' };

  // Buscar todas las partes/lecciones de ese tutorial
  const { data: partes, error: partesError } = await supabase
    .from('partes_tutorial')
    .select('*')
    .eq('tutorial_id', tutorial.id)
    .order('orden', { ascending: true });

  return {
    tutorial,
    partes: partes || [],
    error: partesError
  };
}
