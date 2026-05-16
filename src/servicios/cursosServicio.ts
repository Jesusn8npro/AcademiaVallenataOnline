import { supabaseAnonimo, supabase } from './clienteSupabase' // Usamos el cliente anónimo para el catálogo público y el autenticado para admin

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

    // Promesa de carga de datos — cursos y tutoriales en paralelo
    const loadData = async () => {
      const [cursosResult, tutsResult] = await Promise.all([
        supabaseAnonimo.from('cursos').select('*').order('created_at', { ascending: false }),
        supabaseAnonimo.from('tutoriales').select('*').order('created_at', { ascending: false })
      ]);

      if (cursosResult.error && tutsResult.error) {
        throw new Error(`Error: Cursos (${cursosResult.error.message}), Tutoriales (${tutsResult.error.message})`);
      }

      return { cursosData: cursosResult.data, tutsData: tutsResult.data };
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


    return { items }

  } catch (err: any) {
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
    return { success: false, data: [], error: e.message }
  }
}



