import { supabase } from '../servicios/supabaseCliente'

export type EstadoPaquete = 'publicado' | 'borrador' | 'archivado'

export interface PaqueteTutorial {
  id?: string
  titulo: string
  descripcion?: string
  descripcion_corta?: string
  categoria?: string
  nivel?: string
  imagen_url?: string
  precio_normal?: number
  precio_rebajado?: number
  destacado?: boolean
  estado?: EstadoPaquete
  slug?: string
  created_at?: string
}

export function formatearPrecio(valor?: number) {
  if (!valor || valor <= 0) return 'Gratuito'
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor)
}

// ALIAS PARA COMPATIBILIDAD CON LEGACY
export async function obtenerPaquetesPublicados(): Promise<{ success: boolean; data: PaqueteTutorial[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('paquetes_tutoriales')
      .select('*')
      .eq('estado', 'publicado') // Filtrar solo publicados
      .order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data: (data || []) as PaqueteTutorial[] }
  } catch (e: any) {
    return { success: false, data: [], error: e.message }
  }
}

export async function obtenerTodosPaquetes(): Promise<{ success: boolean; data: PaqueteTutorial[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('paquetes_tutoriales')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data: (data || []) as PaqueteTutorial[] }
  } catch (e: any) {
    return { success: false, data: [], error: e.message }
  }
}

export async function buscarPaquetes(busqueda: string, filtros?: { categoria?: string; nivel?: string }): Promise<{ success: boolean; data: PaqueteTutorial[]; error?: string }> {
  try {
    let query = supabase
      .from('paquetes_tutoriales')
      .select('*')
      .eq('estado', 'publicado')

    if (busqueda) {
      query = query.ilike('titulo', `%${busqueda}%`)
    }

    if (filtros?.categoria) {
      query = query.eq('categoria', filtros.categoria)
    }

    if (filtros?.nivel) {
      query = query.eq('nivel', filtros.nivel)
    }

    const { data, error } = await query
    if (error) throw error

    return { success: true, data: (data || []) as PaqueteTutorial[] }
  } catch (e: any) {
    return { success: false, data: [], error: e.message }
  }
}

export async function eliminarPaquete(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { error } = await supabase
      .from('paquetes_tutoriales')
      .delete()
      .eq('id', id)
    if (error) throw error
    return { success: true, message: 'Paquete eliminado exitosamente' }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function obtenerPaquetePorId(id: string): Promise<{ success: boolean; data?: PaqueteTutorial; error?: string }> {
  try {
    const { data, error } = await supabase.from('paquetes_tutoriales').select('*').eq('id', id).single()
    if (error) throw error
    return { success: true, data: data as PaqueteTutorial }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function obtenerPaquetePorSlug(slug: string): Promise<{ success: boolean; data?: PaqueteTutorial; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('paquetes_tutoriales')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error
    return { success: true, data: data as PaqueteTutorial }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function crearPaquete(paquete: PaqueteTutorial): Promise<{ success: boolean; data?: PaqueteTutorial; error?: string }> {
  try {
    const { data, error } = await supabase.from('paquetes_tutoriales').insert(paquete).select('*').single()
    if (error) throw error
    return { success: true, data: data as PaqueteTutorial }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function actualizarPaquete(id: string, cambios: Partial<PaqueteTutorial>): Promise<{ success: boolean; data?: PaqueteTutorial; error?: string }> {
  try {
    const { data, error } = await supabase.from('paquetes_tutoriales').update(cambios).eq('id', id).select('*').single()
    if (error) throw error
    return { success: true, data: data as PaqueteTutorial }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export interface TutorialResumen {
  id: string
  titulo: string
  imagen_url?: string
  categoria?: string
  nivel?: string
  estado?: string
  slug?: string
}

export async function obtenerTutorialesDisponibles(): Promise<{ success: boolean; data: TutorialResumen[]; error?: string }> {
  try {
    // Selección alineada con Svelte
    const baseCols = 'id,titulo,descripcion_corta,categoria,precio_normal,nivel,duracion_estimada,imagen_url,artista,tonalidad,estado'

    const r1 = await supabase
      .from('tutoriales')
      .select(baseCols)
      .eq('estado', 'publicado')
      .order('titulo')
    if (!r1.error) return { success: true, data: (r1.data || []) as TutorialResumen[] }

    const r2 = await supabase
      .from('tutoriales')
      .select(baseCols)
      .eq('estado', 'publicado')
    if (!r2.error) return { success: true, data: (r2.data || []) as TutorialResumen[] }

    const r3 = await supabase
      .from('tutoriales')
      .select('id,titulo,categoria,precio_normal,nivel,imagen_url,estado')
      .eq('estado', 'publicado')
    if (r3.error) throw r3.error
    return { success: true, data: (r3.data || []) as TutorialResumen[] }
  } catch (e: any) {
    return { success: false, data: [], error: e.message }
  }
}

export async function obtenerItemsPaquete(paqueteId: string): Promise<{ success: boolean; data: string[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('paquetes_tutoriales_items')
      .select('tutorial_id')
      .eq('paquete_id', paqueteId)
    if (error) throw error
    const ids = (data || []).map((r: any) => r.tutorial_id).filter(Boolean)
    return { success: true, data: ids }
  } catch (e: any) {
    return { success: false, data: [], error: e.message }
  }
}

export async function obtenerTutorialesPaquete(paqueteId: string): Promise<{ success: boolean; data: any[]; error?: string }> {
  try {
    // Join para obtener datos completos de tutoriales
    const { data, error } = await supabase
      .from('paquetes_tutoriales_items')
      .select(`
        orden,
        tutoriales:tutorial_id (
          id,
          titulo,
          descripcion_corta,
          nivel,
          precio_normal,
          imagen_url,
          estado
        )
      `)
      .eq('paquete_id', paqueteId)
      .order('orden', { ascending: true })

    if (error) throw error

    // Aplanar estructura si es necesario o retornarla tal cual
    // La vista espera { ...tutorial, orden }
    return { success: true, data: data || [] }
  } catch (e: any) {
    return { success: false, data: [], error: e.message }
  }
}

export async function guardarItemsPaquete(paqueteId: string, tutorialIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from('paquetes_tutoriales').update({ tutoriales_ids: tutorialIds }).eq('id', paqueteId)
  } catch { }
  try {
    await supabase.from('paquetes_tutoriales_items').delete().eq('paquete_id', paqueteId)
    if (tutorialIds.length > 0) {
      const filas = tutorialIds.map((tId, idx) => ({ paquete_id: paqueteId, tutorial_id: tId, orden: idx + 1 }))
      const { error } = await supabase.from('paquetes_tutoriales_items').insert(filas)
      if (error) throw error
    }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
