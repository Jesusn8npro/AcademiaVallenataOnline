import { supabase } from '../clienteSupabase';
import type { Notificacion, PreferenciaNotificacion, EstadisticasNotificaciones } from '../../tipos/notificaciones';

export class NotificacionesCRUDBase {
    async obtenerNotificaciones(filtros?: {
        categoria?: string;
        leida?: boolean;
        limite?: number;
        offset?: number;
    }): Promise<{ notificaciones: Notificacion[]; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { notificaciones: [], error: 'Usuario no autenticado' };
            }

            let query = supabase
                .from('notificaciones')
                .select('*')
                .eq('usuario_id', user.id)
                .order('fecha_creacion', { ascending: false });

            if (filtros?.categoria) {
                query = query.eq('categoria', filtros.categoria);
            }
            if (filtros?.leida !== undefined) {
                query = query.eq('leida', filtros.leida);
            }
            if (filtros?.limite) {
                query = query.limit(filtros.limite);
            }
            if (filtros?.offset) {
                query = query.range(filtros.offset, filtros.offset + (filtros.limite || 20) - 1);
            }

            const { data, error } = await query;

            if (error) {
                return { notificaciones: [], error: error.message };
            }

            return { notificaciones: data || [], error: null };
        } catch (err) {
            return { notificaciones: [], error: 'Error inesperado al obtener notificaciones' };
        }
    }

    async obtenerEstadisticas(): Promise<{ estadisticas: EstadisticasNotificaciones | null; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { estadisticas: null, error: 'Usuario no autenticado' };
            }

            const { data, error } = await supabase
                .from('notificaciones')
                .select('categoria, prioridad, leida')
                .eq('usuario_id', user.id);

            if (error) {
                return { estadisticas: null, error: error.message };
            }

            const estadisticas: EstadisticasNotificaciones = {
                total: data.length,
                no_leidas: data.filter((n: any) => !n.leida).length,
                por_categoria: {},
                por_prioridad: {}
            };

            data.forEach((notif: any) => {
                estadisticas.por_categoria[notif.categoria] =
                    (estadisticas.por_categoria[notif.categoria] || 0) + 1;
                estadisticas.por_prioridad[notif.prioridad] =
                    (estadisticas.por_prioridad[notif.prioridad] || 0) + 1;
            });

            return { estadisticas, error: null };
        } catch (err) {
            return { estadisticas: null, error: 'Error inesperado' };
        }
    }

    async obtenerContadorNoLeidas(): Promise<number> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return 0;

            const { count, error } = await supabase
                .from('notificaciones')
                .select('*', { count: 'exact', head: true })
                .eq('usuario_id', user.id)
                .eq('leida', false)
                .eq('archivada', false);

            if (error) {
                return 0;
            }

            return count || 0;
        } catch (error) {
            return 0;
        }
    }

    async marcarComoLeida(notificacionIds: string[]): Promise<{ exito: boolean; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { exito: false, error: 'Usuario no autenticado' };
            }

            const { error } = await supabase
                .from('notificaciones')
                .update({ leida: true, fecha_lectura: new Date().toISOString() })
                .in('id', notificacionIds)
                .eq('usuario_id', user.id);

            if (error) {
                return { exito: false, error: error.message };
            }

            return { exito: true, error: null };
        } catch (err) {
            return { exito: false, error: 'Error inesperado' };
        }
    }

    async marcarTodasComoLeidas(): Promise<{ exito: boolean; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { exito: false, error: 'Usuario no autenticado' };
            }

            const { error } = await supabase
                .from('notificaciones')
                .update({ leida: true, fecha_lectura: new Date().toISOString() })
                .eq('usuario_id', user.id)
                .eq('leida', false);

            if (error) {
                return { exito: false, error: error.message };
            }

            return { exito: true, error: null };
        } catch (err) {
            return { exito: false, error: 'Error inesperado' };
        }
    }

    async archivarNotificacion(notificacionId: string): Promise<{ exito: boolean; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { exito: false, error: 'Usuario no autenticado' };
            }

            const { error } = await supabase
                .from('notificaciones')
                .update({ archivada: true })
                .eq('id', notificacionId)
                .eq('usuario_id', user.id);

            if (error) {
                return { exito: false, error: error.message };
            }

            return { exito: true, error: null };
        } catch (err) {
            return { exito: false, error: 'Error inesperado' };
        }
    }

    async crearNotificacion(datos: {
        tipo: string;
        titulo: string;
        mensaje: string;
        categoria?: string;
        prioridad?: string;
        url_accion?: string;
        icono?: string;
    }): Promise<{ exito: boolean; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { exito: false, error: 'Usuario no autenticado' };
            }

            const { error } = await supabase.rpc('crear_notificacion', {
                p_usuario_id: user.id,
                p_tipo: datos.tipo,
                p_titulo: datos.titulo,
                p_mensaje: datos.mensaje,
                p_categoria: datos.categoria || 'sistema',
                p_prioridad: datos.prioridad || 'normal',
                p_url_accion: datos.url_accion,
                p_icono: datos.icono || '🔔'
            });

            if (error) {
                return { exito: false, error: error.message };
            }

            return { exito: true, error: null };
        } catch (err) {
            return { exito: false, error: 'Error inesperado' };
        }
    }

    async obtenerPreferencias(): Promise<{ preferencias: PreferenciaNotificacion[]; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { preferencias: [], error: 'Usuario no autenticado' };
            }

            const { data, error } = await supabase
                .from('notificaciones_preferencias')
                .select('*')
                .eq('usuario_id', user.id);

            if (error) {
                return { preferencias: [], error: error.message };
            }

            return { preferencias: data || [], error: null };
        } catch (err) {
            return { preferencias: [], error: 'Error inesperado' };
        }
    }

    async actualizarPreferencias(preferencias: Partial<PreferenciaNotificacion>[]): Promise<{ exito: boolean; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return { exito: false, error: 'Usuario no autenticado' };
            }

            for (const pref of preferencias) {
                const { error } = await supabase
                    .from('notificaciones_preferencias')
                    .upsert({
                        ...pref,
                        usuario_id: user.id,
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    return { exito: false, error: error.message };
                }
            }

            return { exito: true, error: null };
        } catch (err) {
            return { exito: false, error: 'Error inesperado' };
        }
    }
}
