import { supabase } from '../clienteSupabase';
import type { ExperienciaUsuario } from '../../tipos/gamificacion';
import { crearNotificacionGaming } from './notificaciones';

const CONFIGURACION_NIVELES = {
    base_xp: 1000,
    multiplicador: 1.15,
    nivel_maximo: 100
};

export function calcularXPParaNivel(nivel: number): number {
    let totalXP = 0;
    for (let i = 1; i < nivel; i++) {
        totalXP += Math.floor(CONFIGURACION_NIVELES.base_xp * Math.pow(CONFIGURACION_NIVELES.multiplicador, i - 1));
    }
    return totalXP;
}

export function calcularNivelDesdeXP(xpTotal: number): { nivel: number; xpActual: number; xpSiguienteNivel: number } {
    let nivel = 1;
    let xpAcumulado = 0;

    while (nivel < CONFIGURACION_NIVELES.nivel_maximo) {
        const xpNivel = Math.floor(CONFIGURACION_NIVELES.base_xp * Math.pow(CONFIGURACION_NIVELES.multiplicador, nivel - 1));
        if (xpAcumulado + xpNivel > xpTotal) {
            break;
        }
        xpAcumulado += xpNivel;
        nivel++;
    }

    const xpActual = xpTotal - xpAcumulado;
    const xpSiguienteNivel = Math.floor(CONFIGURACION_NIVELES.base_xp * Math.pow(CONFIGURACION_NIVELES.multiplicador, nivel - 1));

    return { nivel, xpActual, xpSiguienteNivel };
}

export async function obtenerExperienciaUsuario(usuarioId: string): Promise<ExperienciaUsuario | null> {
    try {
        const { data, error } = await supabase
            .from('experiencia_usuario')
            .select('*')
            .eq('usuario_id', usuarioId)
            .single();

        if (error && error.code !== 'PGRST116') {
            return null;
        }

        if (!data) {
            return await inicializarExperienciaUsuario(usuarioId);
        }

        return data;
    } catch (error) {
        return null;
    }
}

export async function inicializarExperienciaUsuario(usuarioId: string): Promise<ExperienciaUsuario | null> {
    try {
        const { data, error } = await supabase
            .from('experiencia_usuario')
            .insert({
                usuario_id: usuarioId,
                nivel: 1,
                xp_actual: 0,
                xp_total: 0,
                xp_siguiente_nivel: CONFIGURACION_NIVELES.base_xp,
                xp_cursos: 0,
                xp_simulador: 0,
                xp_comunidad: 0,
                xp_logros: 0,
                racha_dias: 0,
                racha_maxima: 0,
                ultima_sesion: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            return null;
        }

        return data;
    } catch (error) {
        return null;
    }
}

export async function agregarXP(usuarioId: string, cantidad: number, categoria: 'cursos' | 'simulador' | 'comunidad' | 'logros'): Promise<{
    success: boolean;
    nivelAnterior: number;
    nivelNuevo: number;
    subioNivel: boolean;
    experiencia: ExperienciaUsuario | null;
}> {
    try {
        const experienciaActual = await obtenerExperienciaUsuario(usuarioId);
        if (!experienciaActual) {
            return { success: false, nivelAnterior: 1, nivelNuevo: 1, subioNivel: false, experiencia: null };
        }

        const nivelAnterior = experienciaActual.nivel;
        const nuevoXPTotal = experienciaActual.xp_total + cantidad;
        const datosNivel = calcularNivelDesdeXP(nuevoXPTotal);

        const actualizacion: any = {
            xp_total: nuevoXPTotal,
            nivel: datosNivel.nivel,
            xp_actual: datosNivel.xpActual,
            xp_siguiente_nivel: datosNivel.xpSiguienteNivel,
            ultima_sesion: new Date().toISOString()
        };

        actualizacion[`xp_${categoria}`] = (experienciaActual[`xp_${categoria}` as keyof ExperienciaUsuario] as number) + cantidad;

        const { data, error } = await supabase
            .from('experiencia_usuario')
            .update(actualizacion)
            .eq('usuario_id', usuarioId)
            .select()
            .single();

        if (error) {
            return { success: false, nivelAnterior, nivelNuevo: nivelAnterior, subioNivel: false, experiencia: null };
        }

        const subioNivel = datosNivel.nivel > nivelAnterior;

        if (subioNivel) {
            await crearNotificacionGaming(usuarioId, {
                tipo: 'subida_nivel',
                titulo: `¡Nivel ${datosNivel.nivel} alcanzado!`,
                mensaje: `¡Felicidades! Has subido al nivel ${datosNivel.nivel}`,
                icono: '🎉',
                datos_notificacion: {
                    nivel_anterior: nivelAnterior,
                    nivel_nuevo: datosNivel.nivel,
                    xp_ganado: cantidad
                },
                prioridad: 'alta',
                estilo_visual: 'celebracion',
                fecha_expiracion: null
            });
        }

        return {
            success: true,
            nivelAnterior,
            nivelNuevo: datosNivel.nivel,
            subioNivel,
            experiencia: data
        };
    } catch (error) {
        return { success: false, nivelAnterior: 1, nivelNuevo: 1, subioNivel: false, experiencia: null };
    }
}
