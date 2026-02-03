import { supabase } from './supabaseCliente'

export async function eliminarArticuloBlog(id: string): Promise<{ exito: boolean; mensaje?: string }>{
  try {
    const { error } = await supabase.from('blog_articulos').delete().eq('id', id)
    if (error) throw error
    return { exito: true, mensaje: 'Artículo eliminado' }
  } catch (e: any) {
    return { exito: false, mensaje: e.message }
  }
}

