import { supabase } from '../clienteSupabase';
import { get } from '../../utilidades/tiendaReact';
import { usuario } from '../UsuarioActivo/usuario';
import type { PublicacionComunidad, ComentarioComunidad, NuevaPublicacion, NuevoComentario } from '../../tipos/comunidad';

export async function crearPublicacion(nuevaPublicacion: NuevaPublicacion): Promise<PublicacionComunidad> {
    const currentUser = get(usuario);

    if (!currentUser) {
        throw new Error('Debes estar autenticado para crear una publicación');
    }

    const { data: publicacion, error } = await supabase
        .from('comunidad_publicaciones')
        .insert({
            contenido: nuevaPublicacion.contenido,
            url_imagen: nuevaPublicacion.url_imagen,
            url_video: nuevaPublicacion.url_video,
            usuario_id: currentUser.id
        })
        .select(`
      *,
      usuario:perfiles!usuario_id (
        id,
        nombre,
        apellido,
        url_foto_perfil
      )
    `)
        .single();

    if (error) {
        throw error;
    }

    return {
        id: publicacion.id,
        titulo: publicacion.titulo || '',
        contenido: publicacion.descripcion || '',
        fecha: publicacion.fecha_creacion,
        fecha_creacion: publicacion.fecha_creacion,
        url_imagen: publicacion.url_imagen,
        url_video: publicacion.url_video,
        url_gif: publicacion.url_gif,
        usuario_id: publicacion.usuario_id,
        usuario_nombre: publicacion.usuario?.nombre_completo || publicacion.usuario_nombre || publicacion.usuario?.nombre || 'Usuario',
        usuario_apellido: publicacion.usuario?.apellido || '',
        usuario_slug: publicacion.usuario?.nombre_usuario || '',
        url_foto_perfil: publicacion.usuario?.url_foto_perfil,
        tipo: publicacion.tipo || 'texto',
        encuesta: publicacion.encuesta,
        me_gusta: [],
        total_likes: 0,
        total_comentarios: 0,
        total_compartidos: 0,
        like_usuario: false
    };
}

export async function crearComentario(nuevoComentario: NuevoComentario): Promise<ComentarioComunidad> {
    const currentUser = get(usuario);

    if (!currentUser) {
        throw new Error('Debes estar autenticado para comentar');
    }

    const { data: comentario, error } = await supabase
        .from('comunidad_comentarios')
        .insert({
            contenido: nuevoComentario.contenido,
            publicacion_id: nuevoComentario.publicacion_id,
            usuario_id: currentUser.id
        })
        .select(`
      *,
      usuario:perfiles!usuario_id (
        id,
        nombre,
        apellido,
        url_foto_perfil
      )
    `)
        .single();

    if (error) {
        throw error;
    }

    return {
        id: comentario.id,
        contenido: comentario.contenido,
        fecha_creacion: comentario.fecha_creacion,
        usuario_id: comentario.usuario_id,
        usuario_nombre: comentario.usuario?.nombre || 'Usuario',
        usuario_apellido: comentario.usuario?.apellido || '',
        url_foto_perfil: comentario.usuario?.url_foto_perfil,
        publicacion_id: comentario.publicacion_id
    };
}

export async function toggleLike(publicacionId: string): Promise<{ esLike: boolean; totalLikes: number }> {
    const currentUser = get(usuario);

    if (!currentUser) {
        throw new Error('Debes estar autenticado para dar like');
    }

    const { data: likeExistente } = await supabase
        .from('comunidad_publicaciones_likes')
        .select('id')
        .eq('publicacion_id', publicacionId)
        .eq('usuario_id', currentUser.id)
        .single();

    let esLike = false;

    if (likeExistente) {
        const { error } = await supabase
            .from('comunidad_publicaciones_likes')
            .delete()
            .eq('id', likeExistente.id);

        if (error) throw error;
        esLike = false;
    } else {
        const { error } = await supabase
            .from('comunidad_publicaciones_likes')
            .insert({
                publicacion_id: publicacionId,
                usuario_id: currentUser.id
            });

        if (error) throw error;
        esLike = true;
    }

    const { data: totalLikes } = await supabase
        .from('comunidad_publicaciones_likes')
        .select('id', { count: 'exact' })
        .eq('publicacion_id', publicacionId);

    return {
        esLike,
        totalLikes: totalLikes?.length || 0
    };
}

export async function eliminarPublicacion(publicacionId: string): Promise<void> {
    const currentUser = get(usuario);

    if (!currentUser) {
        throw new Error('Debes estar autenticado para eliminar');
    }

    const { data: publicacion } = await supabase
        .from('comunidad_publicaciones')
        .select('usuario_id,tipo,encuesta')
        .eq('id', publicacionId)
        .single();

    if (!publicacion || publicacion.usuario_id !== currentUser.id) {
        throw new Error('Solo puedes eliminar tus propias publicaciones');
    }

    const publicacionActual: any = publicacion;

    const { error } = await supabase
        .from('comunidad_publicaciones')
        .delete()
        .eq('id', publicacionId);

    if (error) throw error;

    const grabacionId = publicacionActual.tipo === 'grabacion_hero'
        ? publicacionActual.encuesta?.grabacion_id
        : null;

    if (grabacionId) {
        const { error: errorLimpiarGrabacion } = await supabase
            .from('grabaciones_estudiantes_hero' as any)
            .update({ publicacion_id: null } as any)
            .eq('id', grabacionId)
            .eq('usuario_id', currentUser.id);

        if (errorLimpiarGrabacion) throw errorLimpiarGrabacion;
    }
}

export async function eliminarComentario(comentarioId: string): Promise<void> {
    const currentUser = get(usuario);

    if (!currentUser) {
        throw new Error('Debes estar autenticado para eliminar');
    }

    const { data: comentario } = await supabase
        .from('comunidad_comentarios')
        .select('usuario_id')
        .eq('id', comentarioId)
        .single();

    if (!comentario || comentario.usuario_id !== currentUser.id) {
        throw new Error('Solo puedes eliminar tus propios comentarios');
    }

    const { error } = await supabase
        .from('comunidad_comentarios')
        .delete()
        .eq('id', comentarioId);

    if (error) throw error;
}
