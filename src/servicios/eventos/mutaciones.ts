import { supabase } from '../clienteSupabase';

export async function crearEvento(datos: Record<string, unknown>): Promise<{ id?: string; error?: string }> {
    const { data, error } = await supabase.from('eventos').insert(datos as any).select('id').single();
    if (error) return { error: error.message };
    return { id: (data as any)?.id };
}

export async function eliminarEvento(id: string): Promise<{ error?: string }> {
    const { error } = await supabase.from('eventos').delete().eq('id', id as any);
    if (error) return { error: error.message };
    return {};
}
