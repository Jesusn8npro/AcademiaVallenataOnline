import { supabase, supabaseAnon } from './supabaseCliente'

// ... interfaces ...

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

    async crearPublicacion(publicacion: Partial<PublicacionComunidad>) {
        // Implementación pendiente o básica
        return { success: true }
    }
}

export default ComunidadService
