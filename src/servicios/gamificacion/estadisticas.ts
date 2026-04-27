import { supabase } from '../clienteSupabase';
import type { EstadisticasUsuario } from '../../tipos/gamificacion';

export async function obtenerEstadisticasUsuario(usuarioId: string): Promise<EstadisticasUsuario | null> {
    try {
        const { data, error } = await supabase
            .from('estadisticas_usuario')
            .select('*')
            .eq('usuario_id', usuarioId)
            .single();

        if (error) {
            return null;
        }

        return data;
    } catch (error) {
        return null;
    }
}
