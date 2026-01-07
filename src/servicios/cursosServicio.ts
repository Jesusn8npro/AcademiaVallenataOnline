import { supabaseAnon, supabase } from './supabaseCliente' // Usamos el cliente anónimo para el catálogo público y el autenticado para admin

// ... interfaces ...

// Helper para timeout
const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms));

function aleatorioEstudiantes(): string {
  const base = Math.floor(Math.random() * 2000) + 100
  return `${base.toLocaleString()}+`
}

function aleatorioRating(): string {
  return (4.2 + Math.random() * 0.8).toFixed(1)
}

export async function obtenerCatalogo(): Promise<{ items: (ItemContenido & { rating: string; estudiantes: string })[]; error?: string }> {
  try {
    console.log('Iniciando carga de catálogo...');

    // Promesa de carga de datos
    const loadData = async () => {
      // Cargar cursos primero
      const { data: cursosData, error: cursosError } = await supabaseAnon
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: false });

      if (cursosError) console.error('Error cargando cursos:', cursosError);

      // Cargar tutoriales
      const { data: tutsData, error: tutsError } = await supabaseAnon
        .from('tutoriales')
        .select('*')
        .order('created_at', { ascending: false });

      if (tutsError) console.error('Error cargando tutoriales:', tutsError);

      if (cursosError && tutsError) {
        throw new Error(`Error: Cursos (${cursosError.message}), Tutoriales (${tutsError.message})`);
      }

      return { cursosData, tutsData };
    };

    // Race entre carga y timeout de 10 segundos
    const result: any = await Promise.race([
      loadData(),
      timeout(10000)
    ]);

    const { cursosData, tutsData } = result;

    const cursos = (cursosData || []).map((c: any) => ({
      ...c,
      tipo: 'curso',
      estudiantes: aleatorioEstudiantes(),
      rating: aleatorioRating()
    }))

    const tutoriales = (tutsData || []).map((t: any) => ({
      ...t,
      tipo: 'tutorial',
      estudiantes: aleatorioEstudiantes(),
      rating: aleatorioRating()
    }))

    const items = [...cursos, ...tutoriales]
      .filter((i: any) => i.titulo && i.imagen_url)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log(`Catálogo cargado: ${cursos.length} cursos, ${tutoriales.length} tutoriales`);

    return { items }

  } catch (err: any) {
    console.error('Error general en obtenerCatalogo:', err);
    return { items: [], error: err.message || 'Error desconocido al cargar el catálogo' }
  }
}

export async function obtenerCursosDisponibles(): Promise<{ success: boolean; data: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .eq('estado', 'publicado')
      .order('titulo')

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (e: any) {
    console.error('Error al obtener cursos disponibles:', e)
    return { success: false, data: [], error: e.message }
  }
}

