import { supabase } from '../clienteSupabase';

export async function inscribirseEnEvento(eventoId: string, usuarioId: string): Promise<{ inscripcion: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('eventos_inscripciones')
            .insert({ evento_id: eventoId, usuario_id: usuarioId });

        if (error) return { inscripcion: false, error: error.message };

        supabase.functions.invoke('recordatorio-evento', {
            body: { evento_id: eventoId, usuario_id: usuarioId, tipo: 'confirmacion' },
        }).catch(() => {});

        return { inscripcion: true };
    } catch {
        return { inscripcion: false };
    }
}

export async function verificarInscripcion(eventoId: string, usuarioId: string): Promise<{ inscrito: boolean; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('eventos_inscripciones')
            .select('evento_id')
            .eq('evento_id', eventoId)
            .eq('usuario_id', usuarioId)
            .single();

        if (error && error.code !== 'PGRST116') return { inscrito: false, error: error.message };
        return { inscrito: !!data };
    } catch {
        return { inscrito: false };
    }
}

export async function cancelarInscripcion(eventoId: string, usuarioId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('eventos_inscripciones')
            .delete()
            .eq('evento_id', eventoId)
            .eq('usuario_id', usuarioId);

        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function obtenerComentariosEvento(_eventoId: string): Promise<{ comentarios: any[]; error?: string }> {
    return { comentarios: [] };
}

export async function obtenerMaterialesEvento(_eventoId: string): Promise<{ materiales: any[]; error?: string }> {
    return { materiales: [] };
}

export async function agregarComentario(_eventoId: string, _usuarioId: string, _texto: string): Promise<{ error?: string }> {
    return {};
}
