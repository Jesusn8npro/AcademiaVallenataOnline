import { supabase } from '../clienteSupabase';
import { get } from '../../utilidades/tiendaReact';
import { usuario } from '../UsuarioActivo/usuario';
import type { PublicacionComunidad, ComentarioComunidad } from '../../tipos/comunidad';

export async function cargarPublicaciones(offset: number = 0, limite: number = 10): Promise<PublicacionComunidad[]> {
    if (limite <= 0) return [];
    const currentUser = get(usuario);

    const { data: publicaciones, error } = await supabase
        .from('comunidad_publicaciones')
        .select(`
      *,
      usuario:perfiles!usuario_id (
        id,
        nombre,
        apellido,
        nombre_completo,
        nombre_usuario,
        url_foto_perfil
      ),
      total_likes:comunidad_publicaciones_likes (usuario_id),
      total_comentarios:comunidad_comentarios (id)
    `)
        .order('fecha_creacion', { ascending: false })
        .range(offset, offset + limite - 1);

    if (error) {
        throw error;
    }

    if (!publicaciones) return [];

    let likesUsuario: string[] = [];
    if (currentUser) {
        const { data: likes } = await supabase
            .from('comunidad_publicaciones_likes')
            .select('publicacion_id')
            .eq('usuario_id', currentUser.id)
            .in('publicacion_id', publicaciones.map((p: any) => p.id));

        likesUsuario = likes?.map((like: any) => like.publicacion_id) || [];
    }

    return publicaciones.map((pub: any) => ({
        id: pub.id,
        titulo: pub.titulo || '',
        contenido: pub.descripcion || '',
        fecha: pub.fecha_creacion,
        fecha_creacion: pub.fecha_creacion,
        url_imagen: pub.url_imagen,
        url_video: pub.url_video,
        url_gif: pub.url_gif,
        usuario_id: pub.usuario_id,
        usuario_nombre: pub.usuario?.nombre_completo || pub.usuario_nombre || pub.usuario?.nombre || 'Usuario',
        usuario_apellido: pub.usuario?.apellido || '',
        usuario_slug: pub.usuario?.nombre_usuario || '',
        url_foto_perfil: pub.usuario?.url_foto_perfil,
        tipo: pub.tipo || 'texto',
        encuesta: pub.encuesta,
        me_gusta: [],
        total_likes: Array.isArray(pub.total_likes) ? pub.total_likes.length : 0,
        total_comentarios: Array.isArray(pub.total_comentarios) ? pub.total_comentarios.length : 0,
        total_compartidos: 0,
        like_usuario: likesUsuario.includes(pub.id)
    }));
}

export async function cargarComentarios(publicacionId: string): Promise<ComentarioComunidad[]> {
    const { data: comentarios, error } = await supabase
        .from('comunidad_comentarios')
        .select(`
      *,
      usuario:perfiles!usuario_id (
        id,
        nombre,
        apellido,
        url_foto_perfil
      )
    `)
        .eq('publicacion_id', publicacionId)
        .order('fecha_creacion', { ascending: true });

    if (error) {
        throw error;
    }

    if (!comentarios) return [];

    return comentarios.map((comentario: any) => ({
        id: comentario.id,
        contenido: comentario.contenido,
        fecha_creacion: comentario.fecha_creacion,
        usuario_id: comentario.usuario_id,
        usuario_nombre: comentario.usuario?.nombre || 'Usuario',
        usuario_apellido: comentario.usuario?.apellido || '',
        url_foto_perfil: comentario.usuario?.url_foto_perfil,
        publicacion_id: comentario.publicacion_id
    }));
}

export const obtenerPublicaciones = cargarPublicaciones;

export async function obtenerPublicacionPorId(id: string): Promise<PublicacionComunidad | null> {
    const { data, error } = await supabase
        .from('comunidad_publicaciones')
        .select(`
      *,
      usuario:perfiles!usuario_id (
        id,
        nombre,
        apellido,
        nombre_completo,
        nombre_usuario,
        url_foto_perfil
      ),
      total_likes:comunidad_publicaciones_likes (usuario_id),
      total_comentarios:comunidad_comentarios (id)
    `)
        .eq('id', id)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        titulo: data.titulo || '',
        contenido: data.descripcion || '',
        fecha: data.fecha_creacion,
        fecha_creacion: data.fecha_creacion,
        url_imagen: data.url_imagen,
        url_video: data.url_video,
        url_gif: data.url_gif,
        usuario_id: data.usuario_id,
        usuario_nombre: data.usuario?.nombre_completo || data.usuario_nombre || data.usuario?.nombre || 'Usuario',
        usuario_apellido: data.usuario?.apellido || '',
        usuario_slug: data.usuario?.nombre_usuario || '',
        url_foto_perfil: data.usuario?.url_foto_perfil,
        tipo: data.tipo || 'texto',
        encuesta: data.encuesta,
        me_gusta: [],
        total_likes: Array.isArray(data.total_likes) ? data.total_likes.length : 0,
        total_comentarios: Array.isArray(data.total_comentarios) ? data.total_comentarios.length : 0,
        total_compartidos: 0
    };
}
