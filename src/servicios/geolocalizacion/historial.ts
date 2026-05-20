import { supabase } from '../clienteSupabase';

export async function obtenerHistorialUsuario(usuarioId: string, limite = 10) {
    const { data, error } = await supabase
        .from('geolocalizacion_usuarios')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('ultima_visita', { ascending: false })
        .limit(limite);
    if (error) throw error;
    return data || [];
}

export async function obtenerEstadisticasUsuario(usuarioId: string) {
    const { data, error } = await supabase
        .from('geolocalizacion_usuarios')
        .select('usuario_id, pais, visitas_totales')
        .eq('usuario_id', usuarioId);
    if (error) throw error;
    const totalRegistros = (data || []).length;
    const visitas = (data || []).reduce((acc: number, r: any) => acc + (r.visitas_totales || 0), 0);
    const paisesUnicos = Array.from(new Set((data || []).map((r: any) => r.pais))).filter(Boolean).length;
    return { totalRegistros, visitas, paisesUnicos };
}

export function detectarRiesgo(d: any): 'ALTO' | 'MEDIO' | 'BAJO' {
    if (d.es_proxy || d.es_vpn) return 'ALTO';
    if (d.es_movil) return 'MEDIO';
    return 'BAJO';
}

export function colorRiesgo(nivel: 'ALTO' | 'MEDIO' | 'BAJO') {
    return nivel === 'ALTO' ? '#ef4444' : nivel === 'MEDIO' ? '#f59e0b' : '#10b981';
}
