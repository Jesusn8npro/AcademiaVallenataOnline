import { supabase } from '../clienteSupabase';
import type { LogroSistema, LogroUsuario } from '../../tipos/gamificacion';

export async function obtenerLogrosSistema(): Promise<LogroSistema[]> {
    try {
        const { data, error } = await supabase
            .from('logros_sistema')
            .select('*')
            .eq('activo', true)
            .eq('visible', true)
            .order('orden_mostrar');

        if (error) {
            return [];
        }

        return data || [];
    } catch (error) {
        return [];
    }
}

export async function obtenerLogrosUsuario(usuarioId: string): Promise<LogroUsuario[]> {
    try {
        const { data, error } = await supabase
            .from('logros_usuario')
            .select(`
          *,
          logros_sistema (*)
        `)
            .eq('usuario_id', usuarioId)
            .order('created_at', { ascending: false });

        if (error) {
            return [];
        }

        return data || [];
    } catch (error) {
        return [];
    }
}
