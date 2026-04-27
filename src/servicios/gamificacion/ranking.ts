import { supabase } from '../clienteSupabase';
import type { RankingGlobal } from '../../tipos/gamificacion';

export async function obtenerRanking(tipo: string = 'general', limite: number = 200): Promise<RankingGlobal[]> {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ranking')), 10000));

    try {
        const fetchLogic = async () => {
            const { data, error } = await supabase.rpc('obtener_ranking_hibrido_completo', {
                p_tipo_ranking: tipo,
                p_limite: limite
            });
            if (!error && data?.length) {
                return (data as any[]).map(item => ({
                    id: `${item.usuario_id}_${tipo}`,
                    usuario_id: item.usuario_id,
                    tipo_ranking: tipo,
                    puntuacion: item.puntuacion || 0,
                    posicion: item.posicion || 0,
                    metricas: {
                        nivel: item.nivel || 1,
                        xp_total: item.xp_total || 0,
                        cursos_completados: item.cursos_completados || 0,
                        tutoriales_completados: item.tutoriales_completados || 0,
                        publicaciones_creadas: item.publicaciones_creadas || 0,
                        likes_recibidos: item.likes_recibidos || 0,
                        comentarios_hechos: item.comentarios_hechos || 0,
                        racha_actual_dias: item.racha_actual_dias || 0,
                        logros_conseguidos: item.logros_totales || 0,
                        es_gaming: item.es_gaming || false
                    },
                    perfiles: {
                        nombre: item.nombre || 'Usuario',
                        apellido: item.apellido || '',
                        url_foto_perfil: item.url_foto_perfil || null
                    }
                }));
            }
            const { data: fallback, error: err2 } = await supabase
                .from('ranking_global')
                .select('*, perfiles:perfiles(nombre,apellido,url_foto_perfil)')
                .eq('tipo_ranking', tipo)
                .eq('activo', true)
                .order('puntuacion', { ascending: false })
                .limit(limite);

            if (err2) return [];

            return (fallback as any[]).map(item => ({
                id: `${item.usuario_id}_${tipo}`,
                usuario_id: item.usuario_id,
                tipo_ranking: tipo,
                puntuacion: item.puntuacion || 0,
                posicion: item.posicion || 0,
                perfiles: item.perfiles
            }));
        };

        const result = await Promise.race([fetchLogic(), timeoutPromise]);
        return result as RankingGlobal[];
    } catch (error) {
        return [];
    }
}

export async function obtenerPosicionUsuario(usuarioId: string, tipo: string = 'general'): Promise<RankingGlobal | null> {
    try {
        const { data, error } = await supabase
            .from('ranking_global')
            .select('*, perfiles:perfiles(nombre,apellido,url_foto_perfil)')
            .eq('usuario_id', usuarioId)
            .eq('tipo_ranking', tipo)
            .eq('activo', true)
            .maybeSingle();
        if (error) return null;
        return data as any;
    } catch { return null; }
}
