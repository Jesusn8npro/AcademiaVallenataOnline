export interface PublicacionComunidad {
  id: string;
  titulo?: string;
  contenido: string;
  fecha: string;
  fecha_creacion: string;
  url_imagen?: string;
  url_video?: string;
  url_gif?: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_apellido?: string;
  usuario_slug?: string;
  url_foto_perfil?: string;
  tipo: string;
  encuesta?: any;
  me_gusta: string[];
  total_likes: number;
  total_comentarios: number;
  total_compartidos: number;
  like_usuario?: boolean;
  comentarios?: ComentarioComunidad[];
}

export interface ComentarioComunidad {
  id: string;
  contenido: string;
  fecha_creacion: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_apellido: string;
  url_foto_perfil?: string;
  publicacion_id: string;
}

export interface NuevaPublicacion {
  contenido: string;
  url_imagen?: string;
  url_video?: string;
}

export interface NuevoComentario {
  contenido: string;
  publicacion_id: string;
}
