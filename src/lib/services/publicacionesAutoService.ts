import { supabase } from '$lib/supabase/clienteSupabase';

export interface PublicacionAutomatica {
  usuario_id: string;
  tipo: 'foto_perfil' | 'foto_portada';
  url_imagen: string;
  usuario_nombre?: string;
  usuario_avatar?: string;
}

/**
 * Crear publicación automática cuando el usuario cambia foto de perfil o portada
 * Solo aparece en las publicaciones del perfil del usuario, no en la comunidad general
 */
export async function crearPublicacionAutomatica(data: PublicacionAutomatica) {
  try {
    // Definir textos según el tipo
    const textos = {
      foto_perfil: {
        titulo: "Actualizó su foto de perfil",
        descripcion: ""
      },
      foto_portada: {
        titulo: "Actualizó su foto de portada", 
        descripcion: ""
      }
    };

    const textoPublicacion = textos[data.tipo];

    // Crear la publicación en la base de datos
    const { data: publicacion, error } = await supabase
      .from('comunidad_publicaciones')
      .insert({
        usuario_id: data.usuario_id,
        titulo: textoPublicacion.titulo,
        descripcion: textoPublicacion.descripcion,
        tipo: data.tipo, // 'foto_perfil' o 'foto_portada'
        url_imagen: data.url_imagen,
        usuario_nombre: data.usuario_nombre,
        usuario_avatar: data.usuario_avatar,
        visibilidad: 'publico',
        estado: 'activo'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando publicación automática:', error);
      throw error;
    }

    console.log('✅ Publicación automática creada:', {
      tipo: data.tipo,
      publicacion_id: publicacion.id,
      usuario: data.usuario_nombre
    });

    return publicacion;

  } catch (error) {
    console.error('❌ Error en crearPublicacionAutomatica:', error);
    throw error;
  }
}

/**
 * Verificar si el usuario ya tiene una publicación automática reciente del mismo tipo
 * Para evitar spam de publicaciones si cambia la imagen varias veces seguidas
 */
export async function tienePublicacionReciente(usuario_id: string, tipo: 'foto_perfil' | 'foto_portada', minutosAntiguedad = 10) {
  try {
    const fechaLimite = new Date();
    fechaLimite.setMinutes(fechaLimite.getMinutes() - minutosAntiguedad);

    const { data, error } = await supabase
      .from('comunidad_publicaciones')
      .select('id, fecha_creacion')
      .eq('usuario_id', usuario_id)
      .eq('tipo', tipo)
      .gte('fecha_creacion', fechaLimite.toISOString())
      .order('fecha_creacion', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error verificando publicaciones recientes:', error);
      return false;
    }

    return data && data.length > 0;

  } catch (error) {
    console.error('❌ Error en tienePublicacionReciente:', error);
    return false;
  }
}

/**
 * Crear publicación automática con verificación anti-spam
 */
export async function crearPublicacionAutomaticaSegura(data: PublicacionAutomatica) {
  try {
    // Verificar si ya tiene una publicación reciente del mismo tipo
    const tieneReciente = await tienePublicacionReciente(data.usuario_id, data.tipo, 5); // 5 minutos
    
    if (tieneReciente) {
      console.log('⏱️ Usuario tiene publicación reciente del mismo tipo, omitiendo...');
      return null;
    }

    // Crear la publicación
    return await crearPublicacionAutomatica(data);

  } catch (error) {
    console.error('❌ Error en crearPublicacionAutomaticaSegura:', error);
    throw error;
  }
} 