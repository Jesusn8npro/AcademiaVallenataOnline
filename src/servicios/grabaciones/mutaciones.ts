import { supabase } from '../clienteSupabase';
import type { GrabacionEstudianteHero } from './_tipos';
import { TABLA_GRABACIONES_HERO, normalizarGrabacionHero, obtenerUsuarioAutenticado, obtenerPerfilBasicoUsuario } from './_internos';
import { obtenerGrabacion } from './consultas';

export async function actualizarTitulo(id: string, titulo: string, descripcion?: string | null) {
    const tabla: any = supabase.from(TABLA_GRABACIONES_HERO as any);
    const { data, error } = await tabla
        .update({ titulo: titulo.trim(), descripcion: descripcion?.trim() || null })
        .eq('id', id)
        .select('*')
        .single();

    if (error) throw error;
    return normalizarGrabacionHero(data as any);
}

export async function eliminarGrabacion(id: string) {
    const { error } = await supabase
        .from(TABLA_GRABACIONES_HERO as any)
        .delete()
        .eq('id', id);
    if (error) throw error;
}

export async function actualizarVisibilidadGrabacion(grabacionId: string, esPublica: boolean): Promise<GrabacionEstudianteHero> {
    const usuario = await obtenerUsuarioAutenticado();
    const grabacion: any = await obtenerGrabacion(grabacionId);

    if (!grabacion || grabacion.usuario_id !== usuario.id) {
        throw new Error('Solo puedes editar la visibilidad de tus propias grabaciones.');
    }

    if (!esPublica && grabacion.publicacion_id) {
        const { error } = await supabase
            .from('comunidad_publicaciones' as any)
            .delete()
            .eq('id', grabacion.publicacion_id)
            .eq('usuario_id', usuario.id);
        if (error) throw error;
    }

    const tabla: any = supabase.from(TABLA_GRABACIONES_HERO as any);
    const { data, error } = await tabla
        .update({
            es_publica: esPublica,
            publicacion_id: esPublica ? grabacion.publicacion_id || null : null
        })
        .eq('id', grabacionId)
        .eq('usuario_id', usuario.id)
        .select('*')
        .single();

    if (error) throw error;
    return normalizarGrabacionHero(data as any) as GrabacionEstudianteHero;
}

export async function publicarGrabacionEnComunidad(grabacionId: string, datos: { tituloPublicacion: string; descripcionPublicacion?: string | null }) {
    const usuario = await obtenerUsuarioAutenticado();
    const grabacion: any = await obtenerGrabacion(grabacionId);

    if (!grabacion || grabacion.usuario_id !== usuario.id) {
        throw new Error('Solo puedes publicar tus propias grabaciones.');
    }

    if (grabacion.publicacion_id) {
        const { data: pubActiva, error: errPub } = await supabase
            .from('comunidad_publicaciones' as any)
            .select('id')
            .eq('id', grabacion.publicacion_id as string)
            .maybeSingle();

        if (errPub) throw errPub;

        if ((pubActiva as any)?.id) {
            return { publicacionId: grabacion.publicacion_id as string, grabacionId: grabacion.id, yaPublicada: true };
        }

        const tablaLimpieza: any = supabase.from(TABLA_GRABACIONES_HERO as any);
        const { error: errLimpieza } = await tablaLimpieza
            .update({ publicacion_id: null })
            .eq('id', grabacion.id)
            .eq('usuario_id', usuario.id);
        if (errLimpieza) throw errLimpieza;
    }

    const titulo = datos.tituloPublicacion.trim();
    if (!titulo) throw new Error('Debes escribir un titulo para la publicacion.');

    const perfil: any = await obtenerPerfilBasicoUsuario(usuario.id);
    const nombreVisible = perfil?.nombre_completo || perfil?.nombre || 'Usuario';

    const resumen = {
        grabacion_id: grabacion.id,
        titulo_grabacion: grabacion.titulo,
        modo: grabacion.modo,
        precision_porcentaje: grabacion.precision_porcentaje,
        puntuacion: grabacion.puntuacion,
        duracion_ms: grabacion.duracion_ms,
        bpm: grabacion.bpm,
        tonalidad: grabacion.tonalidad,
        cancion_titulo: grabacion.canciones_hero?.titulo || grabacion.metadata?.cancion_titulo || null,
        cancion_autor: grabacion.canciones_hero?.autor || grabacion.metadata?.cancion_autor || null
    };

    const { data: publicacion, error: errPub } = await supabase
        .from('comunidad_publicaciones' as any)
        .insert({
            usuario_id: usuario.id,
            usuario_nombre: nombreVisible,
            usuario_avatar: perfil?.url_foto_perfil || null,
            titulo,
            descripcion: datos.descripcionPublicacion?.trim() || '',
            tipo: 'grabacion_hero',
            encuesta: resumen,
            fecha_creacion: new Date().toISOString()
        } as any)
        .select('id')
        .single();

    if (errPub) throw errPub;

    const tabla: any = supabase.from(TABLA_GRABACIONES_HERO as any);
    const pubId = (publicacion as any).id;
    const { error: errGrab } = await tabla
        .update({ es_publica: true, publicacion_id: pubId })
        .eq('id', grabacionId)
        .eq('usuario_id', usuario.id);

    if (errGrab) throw errGrab;
    return { publicacionId: pubId, grabacionId, yaPublicada: false };
}
