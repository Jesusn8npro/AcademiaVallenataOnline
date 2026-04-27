import { supabase } from '../clienteSupabase';

export async function inscribirseEnEvento(eventoId: string, usuarioId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('eventos_inscripciones')
            .insert({
                evento_id: eventoId,
                usuario_id: usuarioId
            });

        if (error) return false;
        return true;
    } catch (error) {
        return false;
    }
}

export async function verificarInscripcion(eventoId: string, usuarioId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('eventos_inscripciones')
            .select('evento_id')
            .eq('evento_id', eventoId)
            .eq('usuario_id', usuarioId)
            .single();

        if (error && error.code !== 'PGRST116') return false;
        return !!data;
    } catch (error) {
        return false;
    }
}
