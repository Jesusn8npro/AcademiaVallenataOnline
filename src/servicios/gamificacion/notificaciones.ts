import { supabase } from '../clienteSupabase';
import type { NotificacionGaming } from '../../tipos/gamificacion';

export async function crearNotificacionGaming(usuarioId: string, notificacion: Partial<NotificacionGaming>): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notificaciones_gaming')
            .insert({
                usuario_id: usuarioId,
                leida: false,
                mostrada: false,
                ...notificacion
            });

        if (error) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}
