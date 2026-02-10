import { supabase, supabaseAnon } from './supabaseCliente'

export interface PublicacionComunidad {
    id: string;
    usuario_id: string;
    usuario_nombre: string;
    url_foto_perfil?: string;
    usuario_slug?: string;
    fecha: string;
    contenido: string;
    tipo: string;
    url_imagen?: string;
    encuesta?: any;
    me_gusta: string[];
    total_comentarios: number;
    total_compartidos: number;
}

const ComunidadService = {
    async obtenerPublicaciones(limite: number = 20, offset: number = 0): Promise<PublicacionComunidad[]> {
        try {
            const { data, error } = await supabaseAnon
                .from('comunidad_publicaciones')
                .select(`
          *,
          perfiles (
            nombre,
            apellido,
            url_foto_perfil,
            nombre_usuario
          ),
          comunidad_publicaciones_likes (
            usuario_id
          ),
          comunidad_comentarios (count)
        `)
                .order('fecha_creacion', { ascending: false })
                .range(offset, offset + limite - 1)

            if (error) throw error

            return data.map((p: any) => ({
                id: p.id,
                usuario_id: p.usuario_id,
                usuario_nombre: p.perfiles?.nombre ? `${p.perfiles.nombre} ${p.perfiles.apellido || ''}`.trim() : 'Usuario Desconocido',
                url_foto_perfil: p.perfiles?.url_foto_perfil,
                usuario_slug: p.perfiles?.nombre_usuario,
                fecha: p.fecha_creacion,
                contenido: p.descripcion,
                tipo: p.tipo || 'texto',
                url_imagen: p.url_imagen,
                encuesta: p.encuesta,
                me_gusta: p.comunidad_publicaciones_likes?.map((l: any) => l.usuario_id) || [],
                total_comentarios: p.comunidad_comentarios?.[0]?.count || 0,
                total_compartidos: p.total_compartidos || 0
            }))
        } catch (error) {
            console.error('Error al obtener publicaciones:', error)
            throw error
        }
    },

    async obtenerPublicacionPorId(id: string): Promise<PublicacionComunidad | null> {
        try {
            const { data, error } = await supabaseAnon
                .from('comunidad_publicaciones')
                .select(`
                  *,
                  perfiles (
                    nombre,
                    apellido,
                    url_foto_perfil,
                    nombre_usuario
                  ),
                  comunidad_publicaciones_likes (
                    usuario_id
                  ),
                  comunidad_comentarios (count)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return null;

            return {
                id: data.id,
                usuario_id: data.usuario_id,
                usuario_nombre: data.perfiles?.nombre ? `${data.perfiles.nombre} ${data.perfiles.apellido || ''}`.trim() : 'Usuario Desconocido',
                url_foto_perfil: data.perfiles?.url_foto_perfil,
                usuario_slug: data.perfiles?.nombre_usuario,
                fecha: data.fecha_creacion,
                contenido: data.descripcion,
                tipo: data.tipo || 'texto',
                url_imagen: data.url_imagen,
                encuesta: data.encuesta,
                me_gusta: data.comunidad_publicaciones_likes?.map((l: any) => l.usuario_id) || [],
                total_comentarios: data.comunidad_comentarios?.[0]?.count || 0,
                total_compartidos: data.total_compartidos || 0
            };
        } catch (error) {
            console.error('Error al obtener publicación por ID:', error);
            return null;
        }
    },

    async crearPublicacion(publicacion: Partial<PublicacionComunidad>) {
        // Implementación pendiente o básica
        return { success: true }
    },

    async eliminarPublicacion(publicacionId: string) {
        try {
            const { error } = await supabase
                .from('comunidad_publicaciones')
                .delete()
                .eq('id', publicacionId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar publicación:', error);
            throw error;
        }
    },

    async eliminarComentario(comentarioId: string) {
        try {
            const { error } = await supabase
                .from('comunidad_comentarios')
                .delete()
                .eq('id', comentarioId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar comentario:', error);
            throw error;
        }
    }
}

export default ComunidadService
