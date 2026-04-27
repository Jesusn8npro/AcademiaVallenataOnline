import { supabase } from '../clienteSupabase';
export type { NotaHero } from '../../Core/hero/tipos_Hero';

export const TABLA_GRABACIONES_HERO = 'grabaciones_estudiantes_hero';

export function normalizarGrabacionHero<T extends Record<string, any>>(grabacion: T): T {
    const secuencia = grabacion?.secuencia_grabada || grabacion?.secuencia_json || [];
    return {
        ...grabacion,
        secuencia_grabada: secuencia,
        metadata: grabacion?.metadata ?? {}
    } as T;
}

export async function obtenerUsuarioAutenticado() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Debes iniciar sesion para guardar tus grabaciones.');
    return data.user;
}

export async function obtenerPerfilBasicoUsuario(usuarioId: string) {
    const { data, error } = await supabase
        .from('perfiles')
        .select('nombre,nombre_completo,url_foto_perfil')
        .eq('id', usuarioId)
        .maybeSingle();
    if (error) throw error;
    return data;
}

export async function validarPublicacionesActivasDeGrabaciones(grabaciones: any[], usuarioId: string) {
    const publicacionesIds = Array.from(new Set(
        grabaciones.map((g) => g.publicacion_id).filter(Boolean)
    ));

    if (publicacionesIds.length === 0) return grabaciones;

    const { data, error } = await supabase
        .from('comunidad_publicaciones' as any)
        .select('id')
        .in('id', publicacionesIds as string[]);

    if (error) throw error;

    const activas = new Set((data || []).map((p: any) => p.id));
    const conPublicacionEliminada = grabaciones.filter(
        (g) => g.publicacion_id && !activas.has(g.publicacion_id)
    );

    if (conPublicacionEliminada.length === 0) return grabaciones;

    const ids = conPublicacionEliminada.map((g) => g.id);
    const tabla: any = supabase.from(TABLA_GRABACIONES_HERO as any);

    const { error: errAct } = await tabla
        .update({ publicacion_id: null })
        .in('id', ids)
        .eq('usuario_id', usuarioId);

    if (errAct) throw errAct;

    return grabaciones.map((g) => ids.includes(g.id) ? { ...g, publicacion_id: null } : g);
}
