import { supabase } from '../clienteSupabase';
import type { PublicacionComunidad, ComentarioComunidad } from '../../tipos/comunidad';

export async function cargarPublicaciones(offset: number = 0, limite: number = 10, userId?: string): Promise<PublicacionComunidad[]> {
    if (limite <= 0) return [];

    // Parallel: feed query + user's likes (no sequential dependency)
    const feedPromise = supabase
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

    const likesPromise = userId
        ? supabase.from('comunidad_publicaciones_likes').select('publicacion_id').eq('usuario_id', userId)
        : Promise.resolve({ data: [] as { publicacion_id: string }[], error: null });

    const [feedResult, likesResult] = await Promise.all([feedPromise, likesPromise]);

    if (feedResult.error) throw feedResult.error;

    const publicaciones = (feedResult.data || []) as any[];
    const likesSet = new Set((likesResult.data || []).map((l: any) => l.publicacion_id));

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
        me_gusta: Array.isArray(pub.total_likes) ? pub.total_likes.map((l: any) => l.usuario_id) : [],
        total_likes: Array.isArray(pub.total_likes) ? pub.total_likes.length : 0,
        total_comentarios: Array.isArray(pub.total_comentarios) ? pub.total_comentarios.length : 0,
        total_compartidos: 0,
        like_usuario: likesSet.has(pub.id)
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
    const d = data as any;

    return {
        id: d.id,
        titulo: d.titulo || '',
        contenido: d.descripcion || '',
        fecha: d.fecha_creacion,
        fecha_creacion: d.fecha_creacion,
        url_imagen: d.url_imagen,
        url_video: d.url_video,
        url_gif: d.url_gif,
        usuario_id: d.usuario_id,
        usuario_nombre: d.usuario?.nombre_completo || d.usuario_nombre || d.usuario?.nombre || 'Usuario',
        usuario_apellido: d.usuario?.apellido || '',
        usuario_slug: d.usuario?.nombre_usuario || '',
        url_foto_perfil: d.usuario?.url_foto_perfil,
        tipo: d.tipo || 'texto',
        encuesta: d.encuesta,
        me_gusta: Array.isArray(d.total_likes) ? d.total_likes.map((l: any) => l.usuario_id) : [],
        total_likes: Array.isArray(d.total_likes) ? d.total_likes.length : 0,
        total_comentarios: Array.isArray(d.total_comentarios) ? d.total_comentarios.length : 0,
        total_compartidos: 0
    };
}
