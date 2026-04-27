import { useState, useEffect } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { TiempoService } from '../../../servicios/tiempoService';
import { GamificacionServicio as GamificacionService, type RankingGlobal } from '../../../servicios/gamificacionServicio';

interface Stats {
    leccionesCompletadas: number;
    tiempoEstudio: number;
    rachaActual: number;
    puntosGanados: number;
}

export function formatearTiempo(minutos: number): string {
    if (minutos < 1) return '0m';
    if (minutos < 60) return `${Math.round(minutos)}m`;
    if (minutos < 1440) {
        const horas = Math.floor(minutos / 60);
        const min = Math.round(minutos % 60);
        return `${horas}h ${min}m`;
    }
    const dias = Math.floor(minutos / 1440);
    const horas = Math.floor((minutos % 1440) / 60);
    return `${dias}d ${horas}h`;
}

export async function calcularTiempoHistoricoRapido(usuarioId: string): Promise<number> {
    try {
        const [leccionesResult, tutorialesResult, simuladorResult, sesionesResult] = await Promise.all([
            supabase.from('progreso_lecciones').select('tiempo_total').eq('usuario_id', usuarioId),
            supabase.from('progreso_tutorial').select('tiempo_visto').eq('usuario_id', usuarioId),
            supabase.from('sesiones_simulador_acordeon').select('duracion_minutos').eq('usuario_id', usuarioId),
            supabase.from('sesiones_usuario').select('tiempo_total_minutos').eq('usuario_id', usuarioId)
        ]);

        const lecciones = leccionesResult.data || [];
        const tutoriales = tutorialesResult.data || [];
        const sesionesSimulador = simuladorResult.data || [];
        const sesionesUsuario = sesionesResult.data || [];

        const calcularTiempo = (items: any[], campo: string): number => {
            if (!items.length) return 0;
            const primer = items[0][campo];
            if (primer > 1000000) return items.reduce((s, i) => s + ((i[campo] || 0) / 60000), 0);
            if (primer > 1000) return items.reduce((s, i) => s + ((i[campo] || 0) / 60), 0);
            return items.reduce((s, i) => s + (i[campo] || 0), 0);
        };

        const totalLecciones = calcularTiempo(lecciones, 'tiempo_total');
        const totalTutoriales = calcularTiempo(tutoriales, 'tiempo_visto');
        const totalSimulador = sesionesSimulador.reduce((s: number, i: any) => s + (i.duracion_minutos || 0), 0);
        const totalSesiones = sesionesUsuario.reduce((s: number, i: any) => {
            const t = i.tiempo_total_minutos || 0;
            return s + (t < 480 ? t : 0);
        }, 0);

        const tiempoReal = totalLecciones + totalTutoriales + totalSimulador;
        const tiempoCombinado = Math.max(tiempoReal, totalSesiones);

        if (tiempoCombinado === 0) {
            const { data: actividad } = await supabase.from('eventos_actividad').select('created_at').eq('usuario_id', usuarioId).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()).order('created_at', { ascending: false });
            if (actividad && actividad.length > 0) return Math.min(actividad.length * 5, 120);
        }

        return Math.round(tiempoCombinado);
    } catch {
        return 0;
    }
}

async function calcularTiempoRealPlataforma(usuarioId: string): Promise<number> {
    try {
        const fechaLimite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const { data: eventos } = await supabase.from('eventos_actividad').select('tipo_evento').eq('usuario_id', usuarioId).gte('created_at', fechaLimite.toISOString());
        if (!eventos || eventos.length === 0) return 0;
        const tiempoTotal = eventos.reduce((total: number, evento: any) => {
            switch (evento.tipo_evento) {
                case 'estudio': case 'leccion': case 'ejercicio': return total + 10;
                case 'simulador': return total + 15;
                case 'navegacion': return total + 2;
                case 'click': return total + 1;
                default: return total + 3;
            }
        }, 0);
        return Math.min(tiempoTotal, 480);
    } catch {
        return 0;
    }
}

export function useLogrosDesafios() {
    const { usuario } = useUsuario();
    const [cargando, setCargando] = useState(true);
    const [stats, setStats] = useState<Stats>({ leccionesCompletadas: 0, tiempoEstudio: 0, rachaActual: 0, puntosGanados: 0 });

    useEffect(() => {
        const cargar = async () => {
            if (!usuario?.id) { setCargando(false); return; }
            try {
                const fechaSQL = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
                const [ranking, progresoLeccionesResult, progresoTutorialesResult, simuladorResult, actividadResult, tiempoHistorico, tiempoReal] = await Promise.all([
                    GamificacionService.obtenerRanking('general', 50).catch(() => []),
                    supabase.from('progreso_lecciones').select('tiempo_total, porcentaje_completado, updated_at, estado').eq('usuario_id', usuario.id).gte('updated_at', fechaSQL),
                    supabase.from('progreso_tutorial').select('tiempo_visto, ultimo_acceso, completado').eq('usuario_id', usuario.id).gte('ultimo_acceso', fechaSQL),
                    supabase.from('sesiones_simulador_acordeon').select('duracion_minutos').eq('usuario_id', usuario.id).gte('created_at', fechaSQL),
                    supabase.from('progreso_lecciones').select('updated_at').eq('usuario_id', usuario.id).gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).order('updated_at', { ascending: false }),
                    calcularTiempoHistoricoRapido(usuario.id),
                    calcularTiempoRealPlataforma(usuario.id)
                ]);

                const miRanking = (ranking as RankingGlobal[]).find(r => r.usuario_id === usuario.id);
                const puntosFinales = miRanking?.puntuacion || 0;

                const progresoLecciones = progresoLeccionesResult.data || [];
                const progresoTutoriales = progresoTutorialesResult.data || [];
                const simuladorSesiones = simuladorResult.data || [];
                const actividadReciente = actividadResult.data || [];

                const leccionesCompletadas = progresoLecciones.filter((p: any) => p.estado === 'completado' || p.porcentaje_completado === 100).length;
                const tutorialesProgreso = progresoTutoriales.length;

                const tiempoSemanal = await TiempoService.obtenerTiempoSemanal(usuario.id);

                const calcTiempo = (items: any[], campo: string): number => {
                    if (!items.length) return 0;
                    const p = items[0][campo];
                    if (p > 1000000) return items.reduce((s, i) => s + ((i[campo] || 0) / 60000), 0);
                    if (p > 1000) return items.reduce((s, i) => s + ((i[campo] || 0) / 60), 0);
                    return items.reduce((s, i) => s + (i[campo] || 0), 0);
                };

                const tiempoManual = calcTiempo(progresoLecciones, 'tiempo_total') + calcTiempo(progresoTutoriales, 'tiempo_visto') + simuladorSesiones.reduce((s: number, i: any) => s + (i.duracion_minutos || 0), 0);
                const rachaCalculada = Math.min(actividadReciente.length, 7);
                let tiempoFinal = Math.max(tiempoReal, tiempoHistorico, tiempoSemanal, tiempoManual);
                if (tiempoFinal === 0 && (leccionesCompletadas > 0 || tutorialesProgreso > 0)) {
                    tiempoFinal = leccionesCompletadas * 15 + tutorialesProgreso * 25;
                }

                setStats({ leccionesCompletadas: leccionesCompletadas + tutorialesProgreso, tiempoEstudio: tiempoFinal, rachaActual: rachaCalculada, puntosGanados: puntosFinales });
            } catch {
                setStats({ leccionesCompletadas: 0, tiempoEstudio: 0, rachaActual: 0, puntosGanados: 0 });
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [usuario]);

    return { cargando, stats };
}
