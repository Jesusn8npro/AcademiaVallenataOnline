export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      _backup_perfiles_eliminados_2026_04: {
        Row: {
          apellido: string | null
          correo_electronico: string | null
          email_confirmed_at: string | null
          fecha_creacion: string | null
          fecha_eliminacion: string | null
          id: string | null
          last_sign_in_at: string | null
          nombre: string | null
          razon: string | null
        }
        Insert: {
          apellido?: string | null
          correo_electronico?: string | null
          email_confirmed_at?: string | null
          fecha_creacion?: string | null
          fecha_eliminacion?: string | null
          id?: string | null
          last_sign_in_at?: string | null
          nombre?: string | null
          razon?: string | null
        }
        Update: {
          apellido?: string | null
          correo_electronico?: string | null
          email_confirmed_at?: string | null
          fecha_creacion?: string | null
          fecha_eliminacion?: string | null
          id?: string | null
          last_sign_in_at?: string | null
          nombre?: string | null
          razon?: string | null
        }
        Relationships: []
      }
      acordes_hero: {
        Row: {
          actualizado_en: string | null
          botones: Json
          creado_en: string | null
          descripcion: string | null
          etiquetas: string[] | null
          fuelle: string | null
          grado: string | null
          hilera_lider: number | null
          id: string
          inv_abriendo: number | null
          inv_cerrando: number | null
          inversion: number | null
          modalidad_circulo: string | null
          nombre: string
          orden_circulo: number | null
          tipo: string | null
          tonalidad_referencia: string
        }
        Insert: {
          actualizado_en?: string | null
          botones: Json
          creado_en?: string | null
          descripcion?: string | null
          etiquetas?: string[] | null
          fuelle?: string | null
          grado?: string | null
          hilera_lider?: number | null
          id?: string
          inv_abriendo?: number | null
          inv_cerrando?: number | null
          inversion?: number | null
          modalidad_circulo?: string | null
          nombre: string
          orden_circulo?: number | null
          tipo?: string | null
          tonalidad_referencia: string
        }
        Update: {
          actualizado_en?: string | null
          botones?: Json
          creado_en?: string | null
          descripcion?: string | null
          etiquetas?: string[] | null
          fuelle?: string | null
          grado?: string | null
          hilera_lider?: number | null
          id?: string
          inv_abriendo?: number | null
          inv_cerrando?: number | null
          inversion?: number | null
          modalidad_circulo?: string | null
          nombre?: string
          orden_circulo?: number | null
          tipo?: string | null
          tonalidad_referencia?: string
        }
        Relationships: []
      }
      actividades_pendientes: {
        Row: {
          created_at: string | null
          datos_actividad: Json | null
          id: string
          procesado: boolean | null
          tipo_actividad: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          datos_actividad?: Json | null
          id?: string
          procesado?: boolean | null
          tipo_actividad: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          datos_actividad?: Json | null
          id?: string
          procesado?: boolean | null
          tipo_actividad?: string
          usuario_id?: string
        }
        Relationships: []
      }
      agente_chat_config: {
        Row: {
          activo: boolean | null
          id: string
          nombre: string | null
          prompt_adicional: string | null
          tono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          id?: string
          nombre?: string | null
          prompt_adicional?: string | null
          tono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          id?: string
          nombre?: string | null
          prompt_adicional?: string | null
          tono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_perfiles_eliminados_2026_04: {
        Row: {
          ano_experiencia: number | null
          apellido: string | null
          biografia: string | null
          ciudad: string | null
          codigo_postal: string | null
          como_nos_conocio: string | null
          configuracion_simulador: Json | null
          correo_electronico: string | null
          created_at: string | null
          direccion_completa: string | null
          documento_numero: string | null
          documento_tipo: string | null
          eliminado: boolean | null
          estilo_favorito: string | null
          estudios_musicales: string | null
          experiencia_total: number | null
          fecha_actualizacion: string | null
          fecha_backup: string | null
          fecha_creacion: string | null
          fecha_inicio_membresia: string | null
          fecha_nacimiento: string | null
          fecha_vencimiento_membresia: string | null
          id: string | null
          insignias: Json | null
          instrumento: string | null
          logros_obtenidos: Json | null
          membresia_activa_id: string | null
          motivo: string | null
          nivel_habilidad: string | null
          nivel_usuario: number | null
          nombre: string | null
          nombre_completo: string | null
          nombre_usuario: string | null
          notificaciones_membresia: boolean | null
          objetivo_aprendizaje: string | null
          onboarding_completado: boolean | null
          pais: string | null
          portada_url: string | null
          posicion_img_portada: string | null
          preferencias_contenido: Json | null
          preferencias_membresia: Json | null
          primera_vez: boolean | null
          profesion: string | null
          puntos_experiencia: number | null
          racha_dias: number | null
          rol: string | null
          suscripcion: string | null
          ultima_actividad: string | null
          updated_at: string | null
          url_foto_perfil: string | null
          whatsapp: string | null
        }
        Insert: {
          ano_experiencia?: number | null
          apellido?: string | null
          biografia?: string | null
          ciudad?: string | null
          codigo_postal?: string | null
          como_nos_conocio?: string | null
          configuracion_simulador?: Json | null
          correo_electronico?: string | null
          created_at?: string | null
          direccion_completa?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          eliminado?: boolean | null
          estilo_favorito?: string | null
          estudios_musicales?: string | null
          experiencia_total?: number | null
          fecha_actualizacion?: string | null
          fecha_backup?: string | null
          fecha_creacion?: string | null
          fecha_inicio_membresia?: string | null
          fecha_nacimiento?: string | null
          fecha_vencimiento_membresia?: string | null
          id?: string | null
          insignias?: Json | null
          instrumento?: string | null
          logros_obtenidos?: Json | null
          membresia_activa_id?: string | null
          motivo?: string | null
          nivel_habilidad?: string | null
          nivel_usuario?: number | null
          nombre?: string | null
          nombre_completo?: string | null
          nombre_usuario?: string | null
          notificaciones_membresia?: boolean | null
          objetivo_aprendizaje?: string | null
          onboarding_completado?: boolean | null
          pais?: string | null
          portada_url?: string | null
          posicion_img_portada?: string | null
          preferencias_contenido?: Json | null
          preferencias_membresia?: Json | null
          primera_vez?: boolean | null
          profesion?: string | null
          puntos_experiencia?: number | null
          racha_dias?: number | null
          rol?: string | null
          suscripcion?: string | null
          ultima_actividad?: string | null
          updated_at?: string | null
          url_foto_perfil?: string | null
          whatsapp?: string | null
        }
        Update: {
          ano_experiencia?: number | null
          apellido?: string | null
          biografia?: string | null
          ciudad?: string | null
          codigo_postal?: string | null
          como_nos_conocio?: string | null
          configuracion_simulador?: Json | null
          correo_electronico?: string | null
          created_at?: string | null
          direccion_completa?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          eliminado?: boolean | null
          estilo_favorito?: string | null
          estudios_musicales?: string | null
          experiencia_total?: number | null
          fecha_actualizacion?: string | null
          fecha_backup?: string | null
          fecha_creacion?: string | null
          fecha_inicio_membresia?: string | null
          fecha_nacimiento?: string | null
          fecha_vencimiento_membresia?: string | null
          id?: string | null
          insignias?: Json | null
          instrumento?: string | null
          logros_obtenidos?: Json | null
          membresia_activa_id?: string | null
          motivo?: string | null
          nivel_habilidad?: string | null
          nivel_usuario?: number | null
          nombre?: string | null
          nombre_completo?: string | null
          nombre_usuario?: string | null
          notificaciones_membresia?: boolean | null
          objetivo_aprendizaje?: string | null
          onboarding_completado?: boolean | null
          pais?: string | null
          portada_url?: string | null
          posicion_img_portada?: string | null
          preferencias_contenido?: Json | null
          preferencias_membresia?: Json | null
          primera_vez?: boolean | null
          profesion?: string | null
          puntos_experiencia?: number | null
          racha_dias?: number | null
          rol?: string | null
          suscripcion?: string | null
          ultima_actividad?: string | null
          updated_at?: string | null
          url_foto_perfil?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      blog_articulos: {
        Row: {
          actualizado_en: string | null
          autor: string | null
          autor_id: string | null
          autor_iniciales: string | null
          calificacion: number | null
          canonical_url: string | null
          contenido: string | null
          creado_en: string | null
          cta: Json | null
          estado: string
          estado_publicacion: string | null
          fecha_publicacion: string | null
          id: string
          imagen_url: string | null
          lectura_min: number | null
          meta_descripcion: string | null
          meta_keywords: string | null
          meta_titulo: string | null
          og_descripcion: string | null
          og_imagen_url: string | null
          og_titulo: string | null
          portada_url: string | null
          resumen: string | null
          resumen_breve: string | null
          resumen_completo: string | null
          secciones: Json | null
          slug: string | null
          titulo: string
          twitter_card: string | null
        }
        Insert: {
          actualizado_en?: string | null
          autor?: string | null
          autor_id?: string | null
          autor_iniciales?: string | null
          calificacion?: number | null
          canonical_url?: string | null
          contenido?: string | null
          creado_en?: string | null
          cta?: Json | null
          estado?: string
          estado_publicacion?: string | null
          fecha_publicacion?: string | null
          id?: string
          imagen_url?: string | null
          lectura_min?: number | null
          meta_descripcion?: string | null
          meta_keywords?: string | null
          meta_titulo?: string | null
          og_descripcion?: string | null
          og_imagen_url?: string | null
          og_titulo?: string | null
          portada_url?: string | null
          resumen?: string | null
          resumen_breve?: string | null
          resumen_completo?: string | null
          secciones?: Json | null
          slug?: string | null
          titulo: string
          twitter_card?: string | null
        }
        Update: {
          actualizado_en?: string | null
          autor?: string | null
          autor_id?: string | null
          autor_iniciales?: string | null
          calificacion?: number | null
          canonical_url?: string | null
          contenido?: string | null
          creado_en?: string | null
          cta?: Json | null
          estado?: string
          estado_publicacion?: string | null
          fecha_publicacion?: string | null
          id?: string
          imagen_url?: string | null
          lectura_min?: number | null
          meta_descripcion?: string | null
          meta_keywords?: string | null
          meta_titulo?: string | null
          og_descripcion?: string | null
          og_imagen_url?: string | null
          og_titulo?: string | null
          portada_url?: string | null
          resumen?: string | null
          resumen_breve?: string | null
          resumen_completo?: string | null
          secciones?: Json | null
          slug?: string | null
          titulo?: string
          twitter_card?: string | null
        }
        Relationships: []
      }
      canciones_hero: {
        Row: {
          actualizado_en: string | null
          audio_fondo_url: string | null
          audio_maestro_url: string | null
          autor: string
          bpm: number
          compas: number | null
          creado_en: string | null
          desbloqueo_secuencial: boolean
          descripcion: string | null
          dificultad: string | null
          duracion_segundos: number | null
          id: string
          intentos_para_moneda: number
          intro_compases: number | null
          metronomo_activado: boolean | null
          resolucion: number
          secciones: Json | null
          secuencia_json: Json
          slug: string | null
          tipo: string | null
          titulo: string
          tonalidad: string | null
          umbral_precision_seccion: number
          usoMetronomo: boolean | null
          youtube_id: string | null
        }
        Insert: {
          actualizado_en?: string | null
          audio_fondo_url?: string | null
          audio_maestro_url?: string | null
          autor: string
          bpm?: number
          compas?: number | null
          creado_en?: string | null
          desbloqueo_secuencial?: boolean
          descripcion?: string | null
          dificultad?: string | null
          duracion_segundos?: number | null
          id?: string
          intentos_para_moneda?: number
          intro_compases?: number | null
          metronomo_activado?: boolean | null
          resolucion?: number
          secciones?: Json | null
          secuencia_json?: Json
          slug?: string | null
          tipo?: string | null
          titulo: string
          tonalidad?: string | null
          umbral_precision_seccion?: number
          usoMetronomo?: boolean | null
          youtube_id?: string | null
        }
        Update: {
          actualizado_en?: string | null
          audio_fondo_url?: string | null
          audio_maestro_url?: string | null
          autor?: string
          bpm?: number
          compas?: number | null
          creado_en?: string | null
          desbloqueo_secuencial?: boolean
          descripcion?: string | null
          dificultad?: string | null
          duracion_segundos?: number | null
          id?: string
          intentos_para_moneda?: number
          intro_compases?: number | null
          metronomo_activado?: boolean | null
          resolucion?: number
          secciones?: Json | null
          secuencia_json?: Json
          slug?: string | null
          tipo?: string | null
          titulo?: string
          tonalidad?: string | null
          umbral_precision_seccion?: number
          usoMetronomo?: boolean | null
          youtube_id?: string | null
        }
        Relationships: []
      }
      chats: {
        Row: {
          activo: boolean | null
          actualizado_en: string | null
          configuracion: Json | null
          creado_en: string | null
          creado_por: string | null
          descripcion: string | null
          es_grupal: boolean | null
          id: string
          imagen_url: string | null
          nombre: string | null
          tipo_chat: string | null
          ultimo_mensaje_fecha: string | null
          ultimo_mensaje_id: string | null
        }
        Insert: {
          activo?: boolean | null
          actualizado_en?: string | null
          configuracion?: Json | null
          creado_en?: string | null
          creado_por?: string | null
          descripcion?: string | null
          es_grupal?: boolean | null
          id?: string
          imagen_url?: string | null
          nombre?: string | null
          tipo_chat?: string | null
          ultimo_mensaje_fecha?: string | null
          ultimo_mensaje_id?: string | null
        }
        Update: {
          activo?: boolean | null
          actualizado_en?: string | null
          configuracion?: Json | null
          creado_en?: string | null
          creado_por?: string | null
          descripcion?: string | null
          es_grupal?: boolean | null
          id?: string
          imagen_url?: string | null
          nombre?: string | null
          tipo_chat?: string | null
          ultimo_mensaje_fecha?: string | null
          ultimo_mensaje_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chats_ultimo_mensaje_id_fkey"
            columns: ["ultimo_mensaje_id"]
            isOneToOne: false
            referencedRelation: "mensajes"
            referencedColumns: ["id"]
          },
        ]
      }
      chats_creador_productos: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      chats_envivo_academia: {
        Row: {
          chat_id: string | null
          created_at: string | null
          fecha_creacion: string | null
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          chat_id?: string | null
          created_at?: string | null
          fecha_creacion?: string | null
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          chat_id?: string | null
          created_at?: string | null
          fecha_creacion?: string | null
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      comentarios_clases: {
        Row: {
          clase_id: string | null
          contenido: string
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          id: string
          likes: number | null
          respuesta_a: string | null
          usuario_id: string | null
        }
        Insert: {
          clase_id?: string | null
          contenido: string
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: string
          likes?: number | null
          respuesta_a?: string | null
          usuario_id?: string | null
        }
        Update: {
          clase_id?: string | null
          contenido?: string
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: string
          likes?: number | null
          respuesta_a?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_clases_clase_id_fkey"
            columns: ["clase_id"]
            isOneToOne: false
            referencedRelation: "partes_tutorial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_clases_respuesta_a_fkey"
            columns: ["respuesta_a"]
            isOneToOne: false
            referencedRelation: "comentarios_clases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_clases_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_clases_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_clases_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comentarios_lecciones: {
        Row: {
          contenido: string
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          id: string
          leccion_id: string
          likes: number | null
          respuesta_a: string | null
          usuario_id: string | null
        }
        Insert: {
          contenido: string
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: string
          leccion_id: string
          likes?: number | null
          respuesta_a?: string | null
          usuario_id?: string | null
        }
        Update: {
          contenido?: string
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: string
          leccion_id?: string
          likes?: number | null
          respuesta_a?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_lecciones_respuesta_a_fkey"
            columns: ["respuesta_a"]
            isOneToOne: false
            referencedRelation: "comentarios_lecciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_lecciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_lecciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_lecciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comunidad_comentarios: {
        Row: {
          comentario: string
          comentario_padre_id: string | null
          fecha_creacion: string
          id: string
          publicacion_id: string
          total_likes: number | null
          usuario_avatar: string | null
          usuario_id: string | null
          usuario_nombre: string
        }
        Insert: {
          comentario: string
          comentario_padre_id?: string | null
          fecha_creacion?: string
          id?: string
          publicacion_id: string
          total_likes?: number | null
          usuario_avatar?: string | null
          usuario_id?: string | null
          usuario_nombre: string
        }
        Update: {
          comentario?: string
          comentario_padre_id?: string | null
          fecha_creacion?: string
          id?: string
          publicacion_id?: string
          total_likes?: number | null
          usuario_avatar?: string | null
          usuario_id?: string | null
          usuario_nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidad_comentarios_comentario_padre_id_fkey"
            columns: ["comentario_padre_id"]
            isOneToOne: false
            referencedRelation: "comunidad_comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_comentarios_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "comunidad_publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_comentarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_comentarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_comentarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comunidad_comentarios_likes: {
        Row: {
          comentario_id: string | null
          fecha_creacion: string | null
          id: number
          usuario_id: string | null
        }
        Insert: {
          comentario_id?: string | null
          fecha_creacion?: string | null
          id?: never
          usuario_id?: string | null
        }
        Update: {
          comentario_id?: string | null
          fecha_creacion?: string | null
          id?: never
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comunidad_comentarios_likes_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comunidad_comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_comentarios_likes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_comentarios_likes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_comentarios_likes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comunidad_encuesta_votos: {
        Row: {
          fecha_voto: string | null
          id: number
          opcion: string
          publicacion_id: string
          usuario_id: string | null
        }
        Insert: {
          fecha_voto?: string | null
          id?: number
          opcion: string
          publicacion_id: string
          usuario_id?: string | null
        }
        Update: {
          fecha_voto?: string | null
          id?: number
          opcion?: string
          publicacion_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comunidad_encuesta_votos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "comunidad_publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_encuesta_votos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_encuesta_votos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_encuesta_votos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comunidad_publicaciones: {
        Row: {
          descripcion: string | null
          encuesta: Json | null
          estado: string | null
          fecha_creacion: string
          guardados: string[] | null
          id: string
          me_gusta: string[] | null
          tipo: string
          titulo: string
          total_likes: number | null
          url_gif: string | null
          url_imagen: string | null
          url_video: string | null
          usuario_avatar: string | null
          usuario_id: string | null
          usuario_nombre: string | null
          visibilidad: string | null
        }
        Insert: {
          descripcion?: string | null
          encuesta?: Json | null
          estado?: string | null
          fecha_creacion?: string
          guardados?: string[] | null
          id?: string
          me_gusta?: string[] | null
          tipo: string
          titulo: string
          total_likes?: number | null
          url_gif?: string | null
          url_imagen?: string | null
          url_video?: string | null
          usuario_avatar?: string | null
          usuario_id?: string | null
          usuario_nombre?: string | null
          visibilidad?: string | null
        }
        Update: {
          descripcion?: string | null
          encuesta?: Json | null
          estado?: string | null
          fecha_creacion?: string
          guardados?: string[] | null
          id?: string
          me_gusta?: string[] | null
          tipo?: string
          titulo?: string
          total_likes?: number | null
          url_gif?: string | null
          url_imagen?: string | null
          url_video?: string | null
          usuario_avatar?: string | null
          usuario_id?: string | null
          usuario_nombre?: string | null
          visibilidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comunidad_publicaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_publicaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_publicaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      comunidad_publicaciones_likes: {
        Row: {
          fecha_creacion: string | null
          id: number
          publicacion_id: string
          usuario_id: string
        }
        Insert: {
          fecha_creacion?: string | null
          id?: number
          publicacion_id: string
          usuario_id: string
        }
        Update: {
          fecha_creacion?: string | null
          id?: number
          publicacion_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunidad_publicaciones_likes_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "comunidad_publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_publicaciones_likes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_publicaciones_likes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunidad_publicaciones_likes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cupones: {
        Row: {
          activo: boolean | null
          codigo: string
          created_at: string | null
          descripcion: string | null
          fecha_expiracion: string | null
          id: string
          tipo: string
          usos_actuales: number | null
          usos_maximos: number | null
          valor: number
          valor_minimo: number | null
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          created_at?: string | null
          descripcion?: string | null
          fecha_expiracion?: string | null
          id?: string
          tipo: string
          usos_actuales?: number | null
          usos_maximos?: number | null
          valor: number
          valor_minimo?: number | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          created_at?: string | null
          descripcion?: string | null
          fecha_expiracion?: string | null
          id?: string
          tipo?: string
          usos_actuales?: number | null
          usos_maximos?: number | null
          valor?: number
          valor_minimo?: number | null
        }
        Relationships: []
      }
      cupones_uso: {
        Row: {
          created_at: string | null
          cupon_id: string | null
          descuento_aplicado: number
          id: string
          referencia: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          cupon_id?: string | null
          descuento_aplicado: number
          id?: string
          referencia?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          cupon_id?: string | null
          descuento_aplicado?: number
          id?: string
          referencia?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cupones_uso_cupon_id_fkey"
            columns: ["cupon_id"]
            isOneToOne: false
            referencedRelation: "cupones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupones_uso_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupones_uso_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupones_uso_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cursos: {
        Row: {
          categoria: string | null
          con_modulos: boolean | null
          conteo_lecciones: number | null
          creado_por: string | null
          created_at: string
          descripcion: string | null
          descripcion_corta: string | null
          duracion_estimada: number | null
          duracion_total: number | null
          es_destacado: boolean | null
          es_publico: boolean | null
          estado: string | null
          estudiantes_inscritos: number | null
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          fecha_expiracion: string | null
          id: string
          imagen_url: string | null
          instructor_id: string | null
          nivel: string | null
          objetivos: string[] | null
          plantilla_vista: string | null
          precio_normal: number | null
          precio_rebajado: number | null
          requisitos: string[] | null
          slug: string | null
          tipo: string
          tipo_acceso: string
          titulo: string
          ultima_actualizacion: string | null
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          con_modulos?: boolean | null
          conteo_lecciones?: number | null
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          descripcion_corta?: string | null
          duracion_estimada?: number | null
          duracion_total?: number | null
          es_destacado?: boolean | null
          es_publico?: boolean | null
          estado?: string | null
          estudiantes_inscritos?: number | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          fecha_expiracion?: string | null
          id?: string
          imagen_url?: string | null
          instructor_id?: string | null
          nivel?: string | null
          objetivos?: string[] | null
          plantilla_vista?: string | null
          precio_normal?: number | null
          precio_rebajado?: number | null
          requisitos?: string[] | null
          slug?: string | null
          tipo?: string
          tipo_acceso?: string
          titulo: string
          ultima_actualizacion?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          con_modulos?: boolean | null
          conteo_lecciones?: number | null
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          descripcion_corta?: string | null
          duracion_estimada?: number | null
          duracion_total?: number | null
          es_destacado?: boolean | null
          es_publico?: boolean | null
          estado?: string | null
          estudiantes_inscritos?: number | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          fecha_expiracion?: string | null
          id?: string
          imagen_url?: string | null
          instructor_id?: string | null
          nivel?: string | null
          objetivos?: string[] | null
          plantilla_vista?: string | null
          precio_normal?: number | null
          precio_rebajado?: number | null
          requisitos?: string[] | null
          slug?: string | null
          tipo?: string
          tipo_acceso?: string
          titulo?: string
          ultima_actualizacion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daw_proyectos: {
        Row: {
          bpm: number
          compas: number
          created_at: string
          descripcion: string | null
          duracion_ms: number | null
          es_publico: boolean
          estado: string
          id: string
          metadata: Json
          publicacion_id: string | null
          thumbnail_url: string | null
          titulo: string
          tonalidad: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          bpm?: number
          compas?: number
          created_at?: string
          descripcion?: string | null
          duracion_ms?: number | null
          es_publico?: boolean
          estado?: string
          id?: string
          metadata?: Json
          publicacion_id?: string | null
          thumbnail_url?: string | null
          titulo?: string
          tonalidad?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          bpm?: number
          compas?: number
          created_at?: string
          descripcion?: string | null
          duracion_ms?: number | null
          es_publico?: boolean
          estado?: string
          id?: string
          metadata?: Json
          publicacion_id?: string | null
          thumbnail_url?: string | null
          titulo?: string
          tonalidad?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daw_proyectos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "comunidad_publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daw_proyectos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daw_proyectos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daw_proyectos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daw_sesiones_grabacion: {
        Row: {
          audio_url: string
          bpm: number | null
          created_at: string
          duracion_ms: number
          estado: string
          formato: string | null
          id: string
          notas: string | null
          pista_id: string | null
          tamano_bytes: number | null
          titulo: string | null
          tonalidad: string | null
          track_id: string | null
          usuario_id: string
          waveform_data: Json | null
        }
        Insert: {
          audio_url: string
          bpm?: number | null
          created_at?: string
          duracion_ms?: number
          estado?: string
          formato?: string | null
          id?: string
          notas?: string | null
          pista_id?: string | null
          tamano_bytes?: number | null
          titulo?: string | null
          tonalidad?: string | null
          track_id?: string | null
          usuario_id: string
          waveform_data?: Json | null
        }
        Update: {
          audio_url?: string
          bpm?: number | null
          created_at?: string
          duracion_ms?: number
          estado?: string
          formato?: string | null
          id?: string
          notas?: string | null
          pista_id?: string | null
          tamano_bytes?: number | null
          titulo?: string | null
          tonalidad?: string | null
          track_id?: string | null
          usuario_id?: string
          waveform_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "daw_sesiones_grabacion_pista_id_fkey"
            columns: ["pista_id"]
            isOneToOne: false
            referencedRelation: "pistas_acompanamiento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daw_sesiones_grabacion_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "daw_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daw_sesiones_grabacion_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daw_sesiones_grabacion_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daw_sesiones_grabacion_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daw_tracks: {
        Row: {
          audio_url: string | null
          created_at: string
          duracion_ms: number | null
          grabacion_id: string | null
          id: string
          metadata: Json
          nombre: string
          offset_ms: number
          orden: number
          pan: number
          pista_id: string | null
          proyecto_id: string
          silenciado: boolean
          solo: boolean
          tipo: string
          updated_at: string
          usuario_id: string
          volumen: number
          waveform_data: Json | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duracion_ms?: number | null
          grabacion_id?: string | null
          id?: string
          metadata?: Json
          nombre?: string
          offset_ms?: number
          orden?: number
          pan?: number
          pista_id?: string | null
          proyecto_id: string
          silenciado?: boolean
          solo?: boolean
          tipo: string
          updated_at?: string
          usuario_id: string
          volumen?: number
          waveform_data?: Json | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duracion_ms?: number | null
          grabacion_id?: string | null
          id?: string
          metadata?: Json
          nombre?: string
          offset_ms?: number
          orden?: number
          pan?: number
          pista_id?: string | null
          proyecto_id?: string
          silenciado?: boolean
          solo?: boolean
          tipo?: string
          updated_at?: string
          usuario_id?: string
          volumen?: number
          waveform_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "daw_tracks_grabacion_id_fkey"
            columns: ["grabacion_id"]
            isOneToOne: false
            referencedRelation: "grabaciones_estudiantes_hero"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daw_tracks_pista_id_fkey"
            columns: ["pista_id"]
            isOneToOne: false
            referencedRelation: "pistas_acompanamiento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daw_tracks_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "daw_proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daw_tracks_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daw_tracks_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daw_tracks_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      desafios_diarios: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string
          dificultad: string
          duracion_minutos: number
          id: string
          monedas_completar: number | null
          objetivo_principal: string
          tipo_desafio: string
          titulo: string
          updated_at: string | null
          xp_completar: number | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion: string
          dificultad: string
          duracion_minutos: number
          id?: string
          monedas_completar?: number | null
          objetivo_principal: string
          tipo_desafio: string
          titulo: string
          updated_at?: string | null
          xp_completar?: number | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string
          dificultad?: string
          duracion_minutos?: number
          id?: string
          monedas_completar?: number | null
          objetivo_principal?: string
          tipo_desafio?: string
          titulo?: string
          updated_at?: string | null
          xp_completar?: number | null
        }
        Relationships: []
      }
      estadisticas_acordeon: {
        Row: {
          canciones_aprendidas: number | null
          canciones_merengue: number | null
          canciones_paseo: number | null
          canciones_puya: number | null
          canciones_son: number | null
          created_at: string | null
          desafios_completados: number | null
          id: string
          lecciones_completadas: number | null
          precision_promedio: number | null
          racha_actual_dias: number | null
          racha_maxima_dias: number | null
          tiempo_total_minutos: number | null
          total_sesiones: number | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          canciones_aprendidas?: number | null
          canciones_merengue?: number | null
          canciones_paseo?: number | null
          canciones_puya?: number | null
          canciones_son?: number | null
          created_at?: string | null
          desafios_completados?: number | null
          id?: string
          lecciones_completadas?: number | null
          precision_promedio?: number | null
          racha_actual_dias?: number | null
          racha_maxima_dias?: number | null
          tiempo_total_minutos?: number | null
          total_sesiones?: number | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          canciones_aprendidas?: number | null
          canciones_merengue?: number | null
          canciones_paseo?: number | null
          canciones_puya?: number | null
          canciones_son?: number | null
          created_at?: string | null
          desafios_completados?: number | null
          id?: string
          lecciones_completadas?: number | null
          precision_promedio?: number | null
          racha_actual_dias?: number | null
          racha_maxima_dias?: number | null
          tiempo_total_minutos?: number | null
          total_sesiones?: number | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estadisticas_acordeon_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estadisticas_acordeon_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estadisticas_acordeon_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      estadisticas_usuario: {
        Row: {
          calculado_en: string | null
          comentarios_hechos: number | null
          created_at: string | null
          cursos_completados: number | null
          dias_activos_total: number | null
          id: string
          lecciones_completadas: number | null
          likes_recibidos: number | null
          logros_dificiles: number | null
          logros_faciles: number | null
          logros_legendarios: number | null
          logros_medios: number | null
          logros_totales: number | null
          mejor_posicion_global: number | null
          mejor_posicion_semanal: number | null
          notas_correctas_totales: number | null
          notas_totales_tocadas: number | null
          precision_maxima: number | null
          precision_promedio: number | null
          primer_sesion: string | null
          publicaciones_creadas: number | null
          racha_actual_dias: number | null
          racha_maxima_dias: number | null
          semanas_en_top_10: number | null
          tiempo_total_minutos: number | null
          total_sesiones: number | null
          tutoriales_completados: number | null
          ultima_sesion: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          calculado_en?: string | null
          comentarios_hechos?: number | null
          created_at?: string | null
          cursos_completados?: number | null
          dias_activos_total?: number | null
          id?: string
          lecciones_completadas?: number | null
          likes_recibidos?: number | null
          logros_dificiles?: number | null
          logros_faciles?: number | null
          logros_legendarios?: number | null
          logros_medios?: number | null
          logros_totales?: number | null
          mejor_posicion_global?: number | null
          mejor_posicion_semanal?: number | null
          notas_correctas_totales?: number | null
          notas_totales_tocadas?: number | null
          precision_maxima?: number | null
          precision_promedio?: number | null
          primer_sesion?: string | null
          publicaciones_creadas?: number | null
          racha_actual_dias?: number | null
          racha_maxima_dias?: number | null
          semanas_en_top_10?: number | null
          tiempo_total_minutos?: number | null
          total_sesiones?: number | null
          tutoriales_completados?: number | null
          ultima_sesion?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          calculado_en?: string | null
          comentarios_hechos?: number | null
          created_at?: string | null
          cursos_completados?: number | null
          dias_activos_total?: number | null
          id?: string
          lecciones_completadas?: number | null
          likes_recibidos?: number | null
          logros_dificiles?: number | null
          logros_faciles?: number | null
          logros_legendarios?: number | null
          logros_medios?: number | null
          logros_totales?: number | null
          mejor_posicion_global?: number | null
          mejor_posicion_semanal?: number | null
          notas_correctas_totales?: number | null
          notas_totales_tocadas?: number | null
          precision_maxima?: number | null
          precision_promedio?: number | null
          primer_sesion?: string | null
          publicaciones_creadas?: number | null
          racha_actual_dias?: number | null
          racha_maxima_dias?: number | null
          semanas_en_top_10?: number | null
          tiempo_total_minutos?: number | null
          total_sesiones?: number | null
          tutoriales_completados?: number | null
          ultima_sesion?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estadisticas_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estadisticas_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estadisticas_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      eventos: {
        Row: {
          acepta_invitados: boolean | null
          calificacion_promedio: number | null
          capacidad_maxima: number | null
          categoria: string | null
          codigo_acceso: string | null
          creado_por: string | null
          created_at: string | null
          descripcion: string | null
          descripcion_corta: string | null
          enlace_grabacion: string | null
          es_destacado: boolean | null
          es_gratuito: boolean | null
          es_publico: boolean | null
          es_todo_el_dia: boolean | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string
          fecha_publicacion: string | null
          id: string
          imagen_banner: string | null
          imagen_portada: string | null
          instructor_avatar: string | null
          instructor_id: string | null
          instructor_nombre: string | null
          link_transmision: string | null
          modalidad: string | null
          moneda: string | null
          nivel_dificultad: string | null
          participantes_inscritos: number | null
          permite_grabacion: boolean | null
          precio: number | null
          precio_rebajado: number | null
          requiere_inscripcion: boolean | null
          slug: string
          tags: string[] | null
          tipo_evento: string
          titulo: string
          total_calificaciones: number | null
          total_visualizaciones: number | null
          ubicacion_fisica: string | null
          updated_at: string | null
          video_promocional: string | null
          zona_horaria: string | null
        }
        Insert: {
          acepta_invitados?: boolean | null
          calificacion_promedio?: number | null
          capacidad_maxima?: number | null
          categoria?: string | null
          codigo_acceso?: string | null
          creado_por?: string | null
          created_at?: string | null
          descripcion?: string | null
          descripcion_corta?: string | null
          enlace_grabacion?: string | null
          es_destacado?: boolean | null
          es_gratuito?: boolean | null
          es_publico?: boolean | null
          es_todo_el_dia?: boolean | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio: string
          fecha_publicacion?: string | null
          id?: string
          imagen_banner?: string | null
          imagen_portada?: string | null
          instructor_avatar?: string | null
          instructor_id?: string | null
          instructor_nombre?: string | null
          link_transmision?: string | null
          modalidad?: string | null
          moneda?: string | null
          nivel_dificultad?: string | null
          participantes_inscritos?: number | null
          permite_grabacion?: boolean | null
          precio?: number | null
          precio_rebajado?: number | null
          requiere_inscripcion?: boolean | null
          slug: string
          tags?: string[] | null
          tipo_evento?: string
          titulo: string
          total_calificaciones?: number | null
          total_visualizaciones?: number | null
          ubicacion_fisica?: string | null
          updated_at?: string | null
          video_promocional?: string | null
          zona_horaria?: string | null
        }
        Update: {
          acepta_invitados?: boolean | null
          calificacion_promedio?: number | null
          capacidad_maxima?: number | null
          categoria?: string | null
          codigo_acceso?: string | null
          creado_por?: string | null
          created_at?: string | null
          descripcion?: string | null
          descripcion_corta?: string | null
          enlace_grabacion?: string | null
          es_destacado?: boolean | null
          es_gratuito?: boolean | null
          es_publico?: boolean | null
          es_todo_el_dia?: boolean | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          fecha_publicacion?: string | null
          id?: string
          imagen_banner?: string | null
          imagen_portada?: string | null
          instructor_avatar?: string | null
          instructor_id?: string | null
          instructor_nombre?: string | null
          link_transmision?: string | null
          modalidad?: string | null
          moneda?: string | null
          nivel_dificultad?: string | null
          participantes_inscritos?: number | null
          permite_grabacion?: boolean | null
          precio?: number | null
          precio_rebajado?: number | null
          requiere_inscripcion?: boolean | null
          slug?: string
          tags?: string[] | null
          tipo_evento?: string
          titulo?: string
          total_calificaciones?: number | null
          total_visualizaciones?: number | null
          ubicacion_fisica?: string | null
          updated_at?: string | null
          video_promocional?: string | null
          zona_horaria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "eventos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      eventos_actividad: {
        Row: {
          detalles: Json | null
          duracion_minutos: number | null
          id: string
          pagina: string | null
          timestamp_evento: string | null
          tipo_evento: string
          usuario_id: string | null
        }
        Insert: {
          detalles?: Json | null
          duracion_minutos?: number | null
          id?: string
          pagina?: string | null
          timestamp_evento?: string | null
          tipo_evento: string
          usuario_id?: string | null
        }
        Update: {
          detalles?: Json | null
          duracion_minutos?: number | null
          id?: string
          pagina?: string | null
          timestamp_evento?: string | null
          tipo_evento?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_actividad_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_actividad_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_actividad_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      eventos_inscripciones: {
        Row: {
          calificacion: number | null
          comentario_calificacion: string | null
          created_at: string | null
          estado_inscripcion: string | null
          evento_id: string | null
          fecha_calificacion: string | null
          fecha_inscripcion: string | null
          fecha_pago: string | null
          fecha_ultima_conexion: string | null
          id: string
          monto_pagado: number | null
          notas_usuario: string | null
          notificaciones_habilitadas: boolean | null
          pago_id: string | null
          tiempo_total_conectado: number | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          calificacion?: number | null
          comentario_calificacion?: string | null
          created_at?: string | null
          estado_inscripcion?: string | null
          evento_id?: string | null
          fecha_calificacion?: string | null
          fecha_inscripcion?: string | null
          fecha_pago?: string | null
          fecha_ultima_conexion?: string | null
          id?: string
          monto_pagado?: number | null
          notas_usuario?: string | null
          notificaciones_habilitadas?: boolean | null
          pago_id?: string | null
          tiempo_total_conectado?: number | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          calificacion?: number | null
          comentario_calificacion?: string | null
          created_at?: string | null
          estado_inscripcion?: string | null
          evento_id?: string | null
          fecha_calificacion?: string | null
          fecha_inscripcion?: string | null
          fecha_pago?: string | null
          fecha_ultima_conexion?: string | null
          id?: string
          monto_pagado?: number | null
          notas_usuario?: string | null
          notificaciones_habilitadas?: boolean | null
          pago_id?: string | null
          tiempo_total_conectado?: number | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_inscripciones_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_inscripciones_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos_epayco"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_inscripciones_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "vista_pagos_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_inscripciones_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "vista_pagos_problematicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_inscripciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_inscripciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_inscripciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      experiencia_usuario: {
        Row: {
          created_at: string | null
          id: string
          nivel: number | null
          racha_dias: number | null
          racha_maxima: number | null
          ultima_sesion: string | null
          updated_at: string | null
          usuario_id: string
          xp_actual: number | null
          xp_comunidad: number | null
          xp_cursos: number | null
          xp_logros: number | null
          xp_siguiente_nivel: number | null
          xp_simulador: number | null
          xp_total: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nivel?: number | null
          racha_dias?: number | null
          racha_maxima?: number | null
          ultima_sesion?: string | null
          updated_at?: string | null
          usuario_id: string
          xp_actual?: number | null
          xp_comunidad?: number | null
          xp_cursos?: number | null
          xp_logros?: number | null
          xp_siguiente_nivel?: number | null
          xp_simulador?: number | null
          xp_total?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nivel?: number | null
          racha_dias?: number | null
          racha_maxima?: number | null
          ultima_sesion?: string | null
          updated_at?: string | null
          usuario_id?: string
          xp_actual?: number | null
          xp_comunidad?: number | null
          xp_cursos?: number | null
          xp_logros?: number | null
          xp_siguiente_nivel?: number | null
          xp_simulador?: number | null
          xp_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "experiencia_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiencia_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiencia_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      favoritos: {
        Row: {
          contenido_id: string
          created_at: string | null
          id: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          contenido_id: string
          created_at?: string | null
          id?: string
          tipo: string
          usuario_id: string
        }
        Update: {
          contenido_id?: string
          created_at?: string | null
          id?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      favoritos_acordeon_hero: {
        Row: {
          cancion_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          cancion_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          cancion_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_acordeon_hero_cancion_id_fkey"
            columns: ["cancion_id"]
            isOneToOne: false
            referencedRelation: "canciones_hero"
            referencedColumns: ["id"]
          },
        ]
      }
      geolocalizacion_usuarios: {
        Row: {
          asn: string | null
          bandera_url: string | null
          capital_pais: string | null
          ciudad: string
          codigo_llamada_pais: string | null
          codigo_postal: string | null
          continente_codigo: string | null
          created_at: string | null
          datos_completos_raw: Json | null
          en_ue: boolean | null
          es_movil: boolean | null
          es_proxy: boolean | null
          es_vpn: boolean | null
          id: string
          idiomas: string | null
          ip: unknown
          latitud: number | null
          longitud: number | null
          moneda: string | null
          nivel_confianza: string | null
          nombre_moneda: string | null
          offset_utc: string | null
          organizacion: string | null
          pais: string
          primera_visita: string | null
          proveedor: string | null
          proveedor_api: string | null
          region: string | null
          region_codigo: string | null
          timezone: string | null
          ultima_visita: string | null
          updated_at: string | null
          usuario_id: string | null
          visitas_totales: number | null
        }
        Insert: {
          asn?: string | null
          bandera_url?: string | null
          capital_pais?: string | null
          ciudad: string
          codigo_llamada_pais?: string | null
          codigo_postal?: string | null
          continente_codigo?: string | null
          created_at?: string | null
          datos_completos_raw?: Json | null
          en_ue?: boolean | null
          es_movil?: boolean | null
          es_proxy?: boolean | null
          es_vpn?: boolean | null
          id?: string
          idiomas?: string | null
          ip: unknown
          latitud?: number | null
          longitud?: number | null
          moneda?: string | null
          nivel_confianza?: string | null
          nombre_moneda?: string | null
          offset_utc?: string | null
          organizacion?: string | null
          pais: string
          primera_visita?: string | null
          proveedor?: string | null
          proveedor_api?: string | null
          region?: string | null
          region_codigo?: string | null
          timezone?: string | null
          ultima_visita?: string | null
          updated_at?: string | null
          usuario_id?: string | null
          visitas_totales?: number | null
        }
        Update: {
          asn?: string | null
          bandera_url?: string | null
          capital_pais?: string | null
          ciudad?: string
          codigo_llamada_pais?: string | null
          codigo_postal?: string | null
          continente_codigo?: string | null
          created_at?: string | null
          datos_completos_raw?: Json | null
          en_ue?: boolean | null
          es_movil?: boolean | null
          es_proxy?: boolean | null
          es_vpn?: boolean | null
          id?: string
          idiomas?: string | null
          ip?: unknown
          latitud?: number | null
          longitud?: number | null
          moneda?: string | null
          nivel_confianza?: string | null
          nombre_moneda?: string | null
          offset_utc?: string | null
          organizacion?: string | null
          pais?: string
          primera_visita?: string | null
          proveedor?: string | null
          proveedor_api?: string | null
          region?: string | null
          region_codigo?: string | null
          timezone?: string | null
          ultima_visita?: string | null
          updated_at?: string | null
          usuario_id?: string | null
          visitas_totales?: number | null
        }
        Relationships: []
      }
      grabaciones_estudiantes_hero: {
        Row: {
          bpm: number
          cancion_id: string | null
          created_at: string
          descripcion: string | null
          duracion_ms: number | null
          es_publica: boolean
          id: string
          metadata: Json
          modo: string
          notas_correctas: number | null
          notas_totales: number | null
          origen: string
          precision_porcentaje: number | null
          publicacion_id: string | null
          puntuacion: number | null
          resolucion: number
          secuencia_grabada: Json
          titulo: string | null
          tonalidad: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          bpm?: number
          cancion_id?: string | null
          created_at?: string
          descripcion?: string | null
          duracion_ms?: number | null
          es_publica?: boolean
          id?: string
          metadata?: Json
          modo?: string
          notas_correctas?: number | null
          notas_totales?: number | null
          origen?: string
          precision_porcentaje?: number | null
          publicacion_id?: string | null
          puntuacion?: number | null
          resolucion?: number
          secuencia_grabada?: Json
          titulo?: string | null
          tonalidad?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          bpm?: number
          cancion_id?: string | null
          created_at?: string
          descripcion?: string | null
          duracion_ms?: number | null
          es_publica?: boolean
          id?: string
          metadata?: Json
          modo?: string
          notas_correctas?: number | null
          notas_totales?: number | null
          origen?: string
          precision_porcentaje?: number | null
          publicacion_id?: string | null
          puntuacion?: number | null
          resolucion?: number
          secuencia_grabada?: Json
          titulo?: string | null
          tonalidad?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grabaciones_estudiantes_hero_cancion_id_fkey"
            columns: ["cancion_id"]
            isOneToOne: false
            referencedRelation: "canciones_hero"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grabaciones_estudiantes_hero_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "comunidad_publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grabaciones_estudiantes_hero_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grabaciones_estudiantes_hero_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grabaciones_estudiantes_hero_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inscripciones: {
        Row: {
          completado: boolean | null
          created_at: string | null
          curso_id: string | null
          estado: string | null
          fecha_expiracion: string | null
          fecha_inscripcion: string | null
          id: string
          pago_id: string | null
          paquete_id: string | null
          porcentaje_completado: number | null
          progreso: number | null
          tipo_acceso: string | null
          tutorial_id: string | null
          ultima_actividad: string | null
          ultima_leccion_id: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          completado?: boolean | null
          created_at?: string | null
          curso_id?: string | null
          estado?: string | null
          fecha_expiracion?: string | null
          fecha_inscripcion?: string | null
          id?: string
          pago_id?: string | null
          paquete_id?: string | null
          porcentaje_completado?: number | null
          progreso?: number | null
          tipo_acceso?: string | null
          tutorial_id?: string | null
          ultima_actividad?: string | null
          ultima_leccion_id?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          completado?: boolean | null
          created_at?: string | null
          curso_id?: string | null
          estado?: string | null
          fecha_expiracion?: string | null
          fecha_inscripcion?: string | null
          id?: string
          pago_id?: string | null
          paquete_id?: string | null
          porcentaje_completado?: number | null
          progreso?: number | null
          tipo_acceso?: string | null
          tutorial_id?: string | null
          ultima_actividad?: string | null
          ultima_leccion_id?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inscripciones_curso"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inscripciones_curso"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos_publicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inscripciones_curso"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inscripciones_curso"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_minima"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos_epayco"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "vista_pagos_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "vista_pagos_problematicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_paquete_id_fkey"
            columns: ["paquete_id"]
            isOneToOne: false
            referencedRelation: "paquetes_tutoriales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_paquete_id_fkey"
            columns: ["paquete_id"]
            isOneToOne: false
            referencedRelation: "vista_paquetes_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      instrumentos_simulador: {
        Row: {
          activo: boolean | null
          afinacion: string
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          afinacion: string
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          afinacion?: string
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      jesusgonzalezchats: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      leads_chat_anonimos: {
        Row: {
          apellido: string | null
          chat_id: string
          ciudad: string | null
          contexto_inicial: string | null
          converted: boolean | null
          convertido_a_usuario: boolean | null
          created_at: string | null
          datos_envio: Json | null
          direccion: string | null
          email: string | null
          estado: string | null
          id: string
          imagen_url: string | null
          metodo_pago_preferido: string | null
          miedos_cliente: string | null
          nivel_acordeon: string | null
          nivel_interes: number | null
          nombre: string | null
          notas_adicionales: string | null
          pagina_origen: string | null
          precio_maximo_mencionado: number | null
          principales_objeciones: string | null
          probabilidad_compra: number | null
          productos_consultados: string[] | null
          que_quiere_aprender: string | null
          source: string | null
          tecnicas_persuasion: string | null
          tiene_acordeon: boolean | null
          tipo_consulta: string | null
          updated_at: string | null
          urgencia_compra: string | null
          usuario_id: string | null
          valor_potencial: number | null
          whatsapp: string | null
        }
        Insert: {
          apellido?: string | null
          chat_id: string
          ciudad?: string | null
          contexto_inicial?: string | null
          converted?: boolean | null
          convertido_a_usuario?: boolean | null
          created_at?: string | null
          datos_envio?: Json | null
          direccion?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          imagen_url?: string | null
          metodo_pago_preferido?: string | null
          miedos_cliente?: string | null
          nivel_acordeon?: string | null
          nivel_interes?: number | null
          nombre?: string | null
          notas_adicionales?: string | null
          pagina_origen?: string | null
          precio_maximo_mencionado?: number | null
          principales_objeciones?: string | null
          probabilidad_compra?: number | null
          productos_consultados?: string[] | null
          que_quiere_aprender?: string | null
          source?: string | null
          tecnicas_persuasion?: string | null
          tiene_acordeon?: boolean | null
          tipo_consulta?: string | null
          updated_at?: string | null
          urgencia_compra?: string | null
          usuario_id?: string | null
          valor_potencial?: number | null
          whatsapp?: string | null
        }
        Update: {
          apellido?: string | null
          chat_id?: string
          ciudad?: string | null
          contexto_inicial?: string | null
          converted?: boolean | null
          convertido_a_usuario?: boolean | null
          created_at?: string | null
          datos_envio?: Json | null
          direccion?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          imagen_url?: string | null
          metodo_pago_preferido?: string | null
          miedos_cliente?: string | null
          nivel_acordeon?: string | null
          nivel_interes?: number | null
          nombre?: string | null
          notas_adicionales?: string | null
          pagina_origen?: string | null
          precio_maximo_mencionado?: number | null
          principales_objeciones?: string | null
          probabilidad_compra?: number | null
          productos_consultados?: string[] | null
          que_quiere_aprender?: string | null
          source?: string | null
          tecnicas_persuasion?: string | null
          tiene_acordeon?: boolean | null
          tipo_consulta?: string | null
          updated_at?: string | null
          urgencia_compra?: string | null
          usuario_id?: string | null
          valor_potencial?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      lecciones: {
        Row: {
          contenido: string | null
          created_at: string | null
          curso_id: string | null
          descripcion: string | null
          es_publicado: boolean | null
          id: string
          modulo_id: string | null
          monedas_recompensa: number
          orden: number | null
          tipo_contenido: string
          titulo: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          contenido?: string | null
          created_at?: string | null
          curso_id?: string | null
          descripcion?: string | null
          es_publicado?: boolean | null
          id?: string
          modulo_id?: string | null
          monedas_recompensa?: number
          orden?: number | null
          tipo_contenido: string
          titulo: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          contenido?: string | null
          created_at?: string | null
          curso_id?: string | null
          descripcion?: string | null
          es_publicado?: boolean | null
          id?: string
          modulo_id?: string | null
          monedas_recompensa?: number
          orden?: number | null
          tipo_contenido?: string
          titulo?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos_publicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_minima"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecciones_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecciones_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "vw_modulos_con_cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      logros_acordeon: {
        Row: {
          activo: boolean | null
          categoria: string
          condiciones: Json
          created_at: string | null
          descripcion: string
          dificultad: string | null
          id: string
          monedas_recompensa: number | null
          nombre: string
          updated_at: string | null
          xp_recompensa: number | null
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          condiciones?: Json
          created_at?: string | null
          descripcion: string
          dificultad?: string | null
          id?: string
          monedas_recompensa?: number | null
          nombre: string
          updated_at?: string | null
          xp_recompensa?: number | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          condiciones?: Json
          created_at?: string | null
          descripcion?: string
          dificultad?: string | null
          id?: string
          monedas_recompensa?: number | null
          nombre?: string
          updated_at?: string | null
          xp_recompensa?: number | null
        }
        Relationships: []
      }
      logros_sistema: {
        Row: {
          activo: boolean | null
          categoria: string
          condiciones: Json | null
          created_at: string | null
          descripcion: string
          descripcion_corta: string | null
          dificultad: string
          fecha_fin: string | null
          fecha_inicio: string | null
          icono: string | null
          id: string
          monedas_recompensa: number | null
          nombre: string
          orden_mostrar: number | null
          titulo_especial: string | null
          updated_at: string | null
          visible: boolean | null
          xp_recompensa: number | null
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          condiciones?: Json | null
          created_at?: string | null
          descripcion: string
          descripcion_corta?: string | null
          dificultad: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          icono?: string | null
          id: string
          monedas_recompensa?: number | null
          nombre: string
          orden_mostrar?: number | null
          titulo_especial?: string | null
          updated_at?: string | null
          visible?: boolean | null
          xp_recompensa?: number | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          condiciones?: Json | null
          created_at?: string | null
          descripcion?: string
          descripcion_corta?: string | null
          dificultad?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          icono?: string | null
          id?: string
          monedas_recompensa?: number | null
          nombre?: string
          orden_mostrar?: number | null
          titulo_especial?: string | null
          updated_at?: string | null
          visible?: boolean | null
          xp_recompensa?: number | null
        }
        Relationships: []
      }
      membresias: {
        Row: {
          activa: boolean | null
          beneficios: Json
          color_hex: string | null
          created_at: string | null
          descripcion: string
          descuento_anual: number | null
          destacada: boolean | null
          icono: string | null
          id: string
          nombre: string
          orden: number
          permisos: Json
          precio_anual: number | null
          precio_mensual: number
          tagline: string | null
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          beneficios?: Json
          color_hex?: string | null
          created_at?: string | null
          descripcion: string
          descuento_anual?: number | null
          destacada?: boolean | null
          icono?: string | null
          id?: string
          nombre: string
          orden: number
          permisos?: Json
          precio_anual?: number | null
          precio_mensual: number
          tagline?: string | null
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          beneficios?: Json
          color_hex?: string | null
          created_at?: string | null
          descripcion?: string
          descuento_anual?: number | null
          destacada?: boolean | null
          icono?: string | null
          id?: string
          nombre?: string
          orden?: number
          permisos?: Json
          precio_anual?: number | null
          precio_mensual?: number
          tagline?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mensajes: {
        Row: {
          chat_id: string | null
          contenido: string | null
          creado_en: string | null
          editado: boolean | null
          editado_en: string | null
          eliminado: boolean | null
          eliminado_en: string | null
          id: string
          mensaje_padre_id: string | null
          metadata: Json | null
          tipo: string | null
          url_media: string | null
          usuario_id: string | null
        }
        Insert: {
          chat_id?: string | null
          contenido?: string | null
          creado_en?: string | null
          editado?: boolean | null
          editado_en?: string | null
          eliminado?: boolean | null
          eliminado_en?: string | null
          id?: string
          mensaje_padre_id?: string | null
          metadata?: Json | null
          tipo?: string | null
          url_media?: string | null
          usuario_id?: string | null
        }
        Update: {
          chat_id?: string | null
          contenido?: string | null
          creado_en?: string | null
          editado?: boolean | null
          editado_en?: string | null
          eliminado?: boolean | null
          eliminado_en?: string | null
          id?: string
          mensaje_padre_id?: string | null
          metadata?: Json | null
          tipo?: string | null
          url_media?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_mensaje_padre_id_fkey"
            columns: ["mensaje_padre_id"]
            isOneToOne: false
            referencedRelation: "mensajes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      miembros_chat: {
        Row: {
          chat_id: string | null
          es_admin: boolean | null
          estado_miembro: string | null
          id: string
          mensajes_no_leidos: number | null
          notificaciones_activadas: boolean | null
          puede_escribir: boolean | null
          puede_invitar: boolean | null
          ultimo_acceso: string | null
          unido_en: string | null
          usuario_id: string | null
        }
        Insert: {
          chat_id?: string | null
          es_admin?: boolean | null
          estado_miembro?: string | null
          id?: string
          mensajes_no_leidos?: number | null
          notificaciones_activadas?: boolean | null
          puede_escribir?: boolean | null
          puede_invitar?: boolean | null
          ultimo_acceso?: string | null
          unido_en?: string | null
          usuario_id?: string | null
        }
        Update: {
          chat_id?: string | null
          es_admin?: boolean | null
          estado_miembro?: string | null
          id?: string
          mensajes_no_leidos?: number | null
          notificaciones_activadas?: boolean | null
          puede_escribir?: boolean | null
          puede_invitar?: boolean | null
          ultimo_acceso?: string | null
          unido_en?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "miembros_chat_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "miembros_chat_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "miembros_chat_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "miembros_chat_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      modulos: {
        Row: {
          created_at: string
          curso_id: string | null
          descripcion: string | null
          id: string
          orden: number
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curso_id?: string | null
          descripcion?: string | null
          id?: string
          orden: number
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curso_id?: string | null
          descripcion?: string | null
          id?: string
          orden?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos_publicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_minima"
            referencedColumns: ["id"]
          },
        ]
      }
      monedas_cancion_usuario: {
        Row: {
          cancion_dominada: boolean | null
          cancion_id: string
          monedas_acumuladas: number | null
          secciones_progreso: Json
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          cancion_dominada?: boolean | null
          cancion_id: string
          monedas_acumuladas?: number | null
          secciones_progreso?: Json
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          cancion_dominada?: boolean | null
          cancion_id?: string
          monedas_acumuladas?: number | null
          secciones_progreso?: Json
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monedas_cancion_usuario_cancion_id_fkey"
            columns: ["cancion_id"]
            isOneToOne: false
            referencedRelation: "canciones_hero"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monedas_cancion_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monedas_cancion_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monedas_cancion_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      monedas_transacciones: {
        Row: {
          cantidad: number
          concepto: string
          created_at: string | null
          id: string
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          cantidad: number
          concepto: string
          created_at?: string | null
          id?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          cantidad?: number
          concepto?: string
          created_at?: string | null
          id?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monedas_transacciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monedas_transacciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monedas_transacciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      monedas_usuario: {
        Row: {
          saldo: number | null
          total_ganadas: number | null
          total_gastadas: number | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          saldo?: number | null
          total_ganadas?: number | null
          total_gastadas?: number | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          saldo?: number | null
          total_ganadas?: number | null
          total_gastadas?: number | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monedas_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monedas_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monedas_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notas_lecciones: {
        Row: {
          contenido: string | null
          fecha_actualizacion: string
          fecha_creacion: string
          id: string
          leccion_id: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          contenido?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          leccion_id: string
          tipo: string
          usuario_id: string
        }
        Update: {
          contenido?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          id?: string
          leccion_id?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      notas_musicales_simulador: {
        Row: {
          archivo_url: string
          boton_id: string
          created_at: string | null
          es_bajo: boolean | null
          fuelle: string | null
          hilera: number | null
          id: string
          instrumento_id: string | null
          nota_nombre: string | null
          octava: number | null
          volumen_ajuste: number | null
        }
        Insert: {
          archivo_url: string
          boton_id: string
          created_at?: string | null
          es_bajo?: boolean | null
          fuelle?: string | null
          hilera?: number | null
          id?: string
          instrumento_id?: string | null
          nota_nombre?: string | null
          octava?: number | null
          volumen_ajuste?: number | null
        }
        Update: {
          archivo_url?: string
          boton_id?: string
          created_at?: string | null
          es_bajo?: boolean | null
          fuelle?: string | null
          hilera?: number | null
          id?: string
          instrumento_id?: string | null
          nota_nombre?: string | null
          octava?: number | null
          volumen_ajuste?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_musicales_simulador_instrumento_id_fkey"
            columns: ["instrumento_id"]
            isOneToOne: false
            referencedRelation: "instrumentos_simulador"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          archivada: boolean | null
          categoria: string
          datos_adicionales: Json | null
          entidad_id: string | null
          entidad_tipo: string | null
          fecha_creacion: string | null
          fecha_expiracion: string | null
          fecha_lectura: string | null
          icono: string | null
          id: string
          leida: boolean | null
          mensaje: string
          prioridad: string | null
          tipo: string
          titulo: string
          url_accion: string | null
          usuario_id: string
        }
        Insert: {
          archivada?: boolean | null
          categoria: string
          datos_adicionales?: Json | null
          entidad_id?: string | null
          entidad_tipo?: string | null
          fecha_creacion?: string | null
          fecha_expiracion?: string | null
          fecha_lectura?: string | null
          icono?: string | null
          id?: string
          leida?: boolean | null
          mensaje: string
          prioridad?: string | null
          tipo: string
          titulo: string
          url_accion?: string | null
          usuario_id: string
        }
        Update: {
          archivada?: boolean | null
          categoria?: string
          datos_adicionales?: Json | null
          entidad_id?: string | null
          entidad_tipo?: string | null
          fecha_creacion?: string | null
          fecha_expiracion?: string | null
          fecha_lectura?: string | null
          icono?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string
          prioridad?: string | null
          tipo?: string
          titulo?: string
          url_accion?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notificaciones_plantillas: {
        Row: {
          activa: boolean | null
          categoria: string
          created_at: string | null
          icono_default: string | null
          id: string
          mensaje_plantilla: string
          tipo: string
          titulo_plantilla: string
        }
        Insert: {
          activa?: boolean | null
          categoria: string
          created_at?: string | null
          icono_default?: string | null
          id?: string
          mensaje_plantilla: string
          tipo: string
          titulo_plantilla: string
        }
        Update: {
          activa?: boolean | null
          categoria?: string
          created_at?: string | null
          icono_default?: string | null
          id?: string
          mensaje_plantilla?: string
          tipo?: string
          titulo_plantilla?: string
        }
        Relationships: []
      }
      notificaciones_preferencias: {
        Row: {
          created_at: string | null
          frecuencia: string | null
          habilitado: boolean | null
          horario_silencio_fin: string | null
          horario_silencio_inicio: string | null
          id: string
          tipo_notificacion: string
          updated_at: string | null
          usuario_id: string
          via_email: boolean | null
          via_plataforma: boolean | null
          via_push: boolean | null
        }
        Insert: {
          created_at?: string | null
          frecuencia?: string | null
          habilitado?: boolean | null
          horario_silencio_fin?: string | null
          horario_silencio_inicio?: string | null
          id?: string
          tipo_notificacion: string
          updated_at?: string | null
          usuario_id: string
          via_email?: boolean | null
          via_plataforma?: boolean | null
          via_push?: boolean | null
        }
        Update: {
          created_at?: string | null
          frecuencia?: string | null
          habilitado?: boolean | null
          horario_silencio_fin?: string | null
          horario_silencio_inicio?: string | null
          id?: string
          tipo_notificacion?: string
          updated_at?: string | null
          usuario_id?: string
          via_email?: boolean | null
          via_plataforma?: boolean | null
          via_push?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_preferencias_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_preferencias_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_preferencias_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      objetivos_admin: {
        Row: {
          categoria: string
          creado_por: string | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_objetivo"]
          fecha_creacion: string | null
          fecha_limite: string | null
          id: string
          prioridad: Database["public"]["Enums"]["prioridad_objetivo"]
          titulo: string
        }
        Insert: {
          categoria: string
          creado_por?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_objetivo"]
          fecha_creacion?: string | null
          fecha_limite?: string | null
          id?: string
          prioridad?: Database["public"]["Enums"]["prioridad_objetivo"]
          titulo: string
        }
        Update: {
          categoria?: string
          creado_por?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_objetivo"]
          fecha_creacion?: string | null
          fecha_limite?: string | null
          id?: string
          prioridad?: Database["public"]["Enums"]["prioridad_objetivo"]
          titulo?: string
        }
        Relationships: []
      }
      pagos_epayco: {
        Row: {
          apellido: string | null
          base_iva: number | null
          ciudad: string | null
          cod_respuesta: string | null
          codigo_postal: string | null
          como_nos_conocio: string | null
          created_at: string | null
          curso_id: string | null
          datos_adicionales: Json | null
          descripcion: string | null
          direccion_completa: string | null
          documento_numero: string | null
          documento_tipo: string | null
          estado: string | null
          factura: string | null
          fecha_nacimiento: string | null
          fecha_transaccion: string | null
          ico: number | null
          id: string
          ip_cliente: unknown
          iva: number | null
          membresia_id: string | null
          metodo_pago: string | null
          moneda: string | null
          nombre_producto: string
          pais: string | null
          paquete_id: string | null
          profesion: string | null
          ref_payco: string
          respuesta: string | null
          telefono: string | null
          tutorial_id: string | null
          updated_at: string | null
          user_agent: string | null
          usuario_id: string
          valor: number
          whatsapp: string | null
        }
        Insert: {
          apellido?: string | null
          base_iva?: number | null
          ciudad?: string | null
          cod_respuesta?: string | null
          codigo_postal?: string | null
          como_nos_conocio?: string | null
          created_at?: string | null
          curso_id?: string | null
          datos_adicionales?: Json | null
          descripcion?: string | null
          direccion_completa?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          estado?: string | null
          factura?: string | null
          fecha_nacimiento?: string | null
          fecha_transaccion?: string | null
          ico?: number | null
          id?: string
          ip_cliente?: unknown
          iva?: number | null
          membresia_id?: string | null
          metodo_pago?: string | null
          moneda?: string | null
          nombre_producto: string
          pais?: string | null
          paquete_id?: string | null
          profesion?: string | null
          ref_payco: string
          respuesta?: string | null
          telefono?: string | null
          tutorial_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
          usuario_id: string
          valor: number
          whatsapp?: string | null
        }
        Update: {
          apellido?: string | null
          base_iva?: number | null
          ciudad?: string | null
          cod_respuesta?: string | null
          codigo_postal?: string | null
          como_nos_conocio?: string | null
          created_at?: string | null
          curso_id?: string | null
          datos_adicionales?: Json | null
          descripcion?: string | null
          direccion_completa?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          estado?: string | null
          factura?: string | null
          fecha_nacimiento?: string | null
          fecha_transaccion?: string | null
          ico?: number | null
          id?: string
          ip_cliente?: unknown
          iva?: number | null
          membresia_id?: string | null
          metodo_pago?: string | null
          moneda?: string | null
          nombre_producto?: string
          pais?: string | null
          paquete_id?: string | null
          profesion?: string | null
          ref_payco?: string
          respuesta?: string | null
          telefono?: string | null
          tutorial_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
          usuario_id?: string
          valor?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_epayco_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos_publicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_minima"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_membresia_id_fkey"
            columns: ["membresia_id"]
            isOneToOne: false
            referencedRelation: "membresias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_paquete_id_fkey"
            columns: ["paquete_id"]
            isOneToOne: false
            referencedRelation: "paquetes_tutoriales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_paquete_id_fkey"
            columns: ["paquete_id"]
            isOneToOne: false
            referencedRelation: "vista_paquetes_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutoriales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      paquetes_tutoriales: {
        Row: {
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          descripcion_corta: string | null
          descuento_porcentaje: number | null
          destacado: boolean | null
          duracion_total_estimada: number | null
          estado: string | null
          fecha_expiracion: string | null
          id: string
          imagen_url: string | null
          incluye: string | null
          instructor_id: string | null
          meta_descripcion: string | null
          meta_titulo: string | null
          nivel: string | null
          objetivos: string | null
          orden_mostrar: number | null
          precio_normal: number
          precio_rebajado: number | null
          requisitos: string | null
          slug: string | null
          tags: string[] | null
          tipo_acceso: string | null
          titulo: string
          total_tutoriales: number | null
          updated_at: string | null
          ventajas: string | null
          visible: boolean | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          descripcion_corta?: string | null
          descuento_porcentaje?: number | null
          destacado?: boolean | null
          duracion_total_estimada?: number | null
          estado?: string | null
          fecha_expiracion?: string | null
          id?: string
          imagen_url?: string | null
          incluye?: string | null
          instructor_id?: string | null
          meta_descripcion?: string | null
          meta_titulo?: string | null
          nivel?: string | null
          objetivos?: string | null
          orden_mostrar?: number | null
          precio_normal: number
          precio_rebajado?: number | null
          requisitos?: string | null
          slug?: string | null
          tags?: string[] | null
          tipo_acceso?: string | null
          titulo: string
          total_tutoriales?: number | null
          updated_at?: string | null
          ventajas?: string | null
          visible?: boolean | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          descripcion_corta?: string | null
          descuento_porcentaje?: number | null
          destacado?: boolean | null
          duracion_total_estimada?: number | null
          estado?: string | null
          fecha_expiracion?: string | null
          id?: string
          imagen_url?: string | null
          incluye?: string | null
          instructor_id?: string | null
          meta_descripcion?: string | null
          meta_titulo?: string | null
          nivel?: string | null
          objetivos?: string | null
          orden_mostrar?: number | null
          precio_normal?: number
          precio_rebajado?: number | null
          requisitos?: string | null
          slug?: string | null
          tags?: string[] | null
          tipo_acceso?: string | null
          titulo?: string
          total_tutoriales?: number | null
          updated_at?: string | null
          ventajas?: string | null
          visible?: boolean | null
        }
        Relationships: []
      }
      paquetes_tutoriales_items: {
        Row: {
          created_at: string | null
          id: string
          incluido: boolean | null
          notas: string | null
          orden: number | null
          paquete_id: string
          precio_individual_referencia: number | null
          tutorial_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          incluido?: boolean | null
          notas?: string | null
          orden?: number | null
          paquete_id: string
          precio_individual_referencia?: number | null
          tutorial_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          incluido?: boolean | null
          notas?: string | null
          orden?: number | null
          paquete_id?: string
          precio_individual_referencia?: number | null
          tutorial_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paquetes_tutoriales_items_paquete_id_fkey"
            columns: ["paquete_id"]
            isOneToOne: false
            referencedRelation: "paquetes_tutoriales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paquetes_tutoriales_items_paquete_id_fkey"
            columns: ["paquete_id"]
            isOneToOne: false
            referencedRelation: "vista_paquetes_completos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paquetes_tutoriales_items_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutoriales"
            referencedColumns: ["id"]
          },
        ]
      }
      partes_tutorial: {
        Row: {
          contenido: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          monedas_recompensa: number | null
          orden: number | null
          slug: string | null
          tipo_contenido: string
          tipo_parte: string | null
          titulo: string
          tutorial_id: string | null
          updated_at: string | null
          video_url: string | null
          visible: boolean | null
        }
        Insert: {
          contenido?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          monedas_recompensa?: number | null
          orden?: number | null
          slug?: string | null
          tipo_contenido?: string
          tipo_parte?: string | null
          titulo: string
          tutorial_id?: string | null
          updated_at?: string | null
          video_url?: string | null
          visible?: boolean | null
        }
        Update: {
          contenido?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          monedas_recompensa?: number | null
          orden?: number | null
          slug?: string | null
          tipo_contenido?: string
          tipo_parte?: string | null
          titulo?: string
          tutorial_id?: string | null
          updated_at?: string | null
          video_url?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "partes_tutorial_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutoriales"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          ano_experiencia: number | null
          apellido: string | null
          biografia: string | null
          ciudad: string | null
          codigo_postal: string | null
          como_nos_conocio: string | null
          configuracion_simulador: Json | null
          correo_electronico: string | null
          created_at: string | null
          direccion_completa: string | null
          documento_numero: string | null
          documento_tipo: string | null
          eliminado: boolean | null
          estilo_favorito: string | null
          estudios_musicales: string | null
          experiencia_total: number | null
          fecha_actualizacion: string
          fecha_creacion: string
          fecha_inicio_membresia: string | null
          fecha_nacimiento: string | null
          fecha_vencimiento_membresia: string | null
          id: string
          insignias: Json | null
          instrumento: string | null
          logros_obtenidos: Json | null
          membresia_activa_id: string | null
          nivel_habilidad: string | null
          nivel_usuario: number | null
          nombre: string | null
          nombre_completo: string | null
          nombre_usuario: string | null
          notificaciones_membresia: boolean | null
          objetivo_aprendizaje: string | null
          onboarding_completado: boolean | null
          pais: string | null
          portada_url: string | null
          posicion_img_portada: string | null
          preferencias_contenido: Json | null
          preferencias_membresia: Json | null
          primera_vez: boolean | null
          profesion: string | null
          puntos_experiencia: number | null
          racha_dias: number | null
          rol: string
          suscripcion: string | null
          ultima_actividad: string | null
          updated_at: string | null
          url_foto_perfil: string | null
          whatsapp: string | null
          xp: number
        }
        Insert: {
          ano_experiencia?: number | null
          apellido?: string | null
          biografia?: string | null
          ciudad?: string | null
          codigo_postal?: string | null
          como_nos_conocio?: string | null
          configuracion_simulador?: Json | null
          correo_electronico?: string | null
          created_at?: string | null
          direccion_completa?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          eliminado?: boolean | null
          estilo_favorito?: string | null
          estudios_musicales?: string | null
          experiencia_total?: number | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          fecha_inicio_membresia?: string | null
          fecha_nacimiento?: string | null
          fecha_vencimiento_membresia?: string | null
          id: string
          insignias?: Json | null
          instrumento?: string | null
          logros_obtenidos?: Json | null
          membresia_activa_id?: string | null
          nivel_habilidad?: string | null
          nivel_usuario?: number | null
          nombre?: string | null
          nombre_completo?: string | null
          nombre_usuario?: string | null
          notificaciones_membresia?: boolean | null
          objetivo_aprendizaje?: string | null
          onboarding_completado?: boolean | null
          pais?: string | null
          portada_url?: string | null
          posicion_img_portada?: string | null
          preferencias_contenido?: Json | null
          preferencias_membresia?: Json | null
          primera_vez?: boolean | null
          profesion?: string | null
          puntos_experiencia?: number | null
          racha_dias?: number | null
          rol?: string
          suscripcion?: string | null
          ultima_actividad?: string | null
          updated_at?: string | null
          url_foto_perfil?: string | null
          whatsapp?: string | null
          xp?: number
        }
        Update: {
          ano_experiencia?: number | null
          apellido?: string | null
          biografia?: string | null
          ciudad?: string | null
          codigo_postal?: string | null
          como_nos_conocio?: string | null
          configuracion_simulador?: Json | null
          correo_electronico?: string | null
          created_at?: string | null
          direccion_completa?: string | null
          documento_numero?: string | null
          documento_tipo?: string | null
          eliminado?: boolean | null
          estilo_favorito?: string | null
          estudios_musicales?: string | null
          experiencia_total?: number | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          fecha_inicio_membresia?: string | null
          fecha_nacimiento?: string | null
          fecha_vencimiento_membresia?: string | null
          id?: string
          insignias?: Json | null
          instrumento?: string | null
          logros_obtenidos?: Json | null
          membresia_activa_id?: string | null
          nivel_habilidad?: string | null
          nivel_usuario?: number | null
          nombre?: string | null
          nombre_completo?: string | null
          nombre_usuario?: string | null
          notificaciones_membresia?: boolean | null
          objetivo_aprendizaje?: string | null
          onboarding_completado?: boolean | null
          pais?: string | null
          portada_url?: string | null
          posicion_img_portada?: string | null
          preferencias_contenido?: Json | null
          preferencias_membresia?: Json | null
          primera_vez?: boolean | null
          profesion?: string | null
          puntos_experiencia?: number | null
          racha_dias?: number | null
          rol?: string
          suscripcion?: string | null
          ultima_actividad?: string | null
          updated_at?: string | null
          url_foto_perfil?: string | null
          whatsapp?: string | null
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_membresia_activa_id_fkey"
            columns: ["membresia_activa_id"]
            isOneToOne: false
            referencedRelation: "membresias"
            referencedColumns: ["id"]
          },
        ]
      }
      pistas_acompanamiento: {
        Row: {
          audio_url: string
          bpm: number
          cancion_hero_id: string | null
          compas: number
          created_at: string
          descripcion: string | null
          duracion_segundos: number | null
          es_publica: boolean
          genero: string
          id: string
          instrumentos: string[] | null
          nivel: string | null
          orden: number | null
          titulo: string
          tonalidad: string
          updated_at: string
        }
        Insert: {
          audio_url: string
          bpm?: number
          cancion_hero_id?: string | null
          compas?: number
          created_at?: string
          descripcion?: string | null
          duracion_segundos?: number | null
          es_publica?: boolean
          genero?: string
          id?: string
          instrumentos?: string[] | null
          nivel?: string | null
          orden?: number | null
          titulo: string
          tonalidad?: string
          updated_at?: string
        }
        Update: {
          audio_url?: string
          bpm?: number
          cancion_hero_id?: string | null
          compas?: number
          created_at?: string
          descripcion?: string | null
          duracion_segundos?: number | null
          es_publica?: boolean
          genero?: string
          id?: string
          instrumentos?: string[] | null
          nivel?: string | null
          orden?: number | null
          titulo?: string
          tonalidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pistas_acompanamiento_cancion_hero_id_fkey"
            columns: ["cancion_hero_id"]
            isOneToOne: false
            referencedRelation: "canciones_hero"
            referencedColumns: ["id"]
          },
        ]
      }
      progreso_lecciones: {
        Row: {
          calificacion: number | null
          created_at: string
          estado: string | null
          id: string
          leccion_id: string | null
          notas: string | null
          porcentaje_completado: number | null
          tiempo_total: number | null
          ultima_actividad: string | null
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          calificacion?: number | null
          created_at?: string
          estado?: string | null
          id?: string
          leccion_id?: string | null
          notas?: string | null
          porcentaje_completado?: number | null
          tiempo_total?: number | null
          ultima_actividad?: string | null
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          calificacion?: number | null
          created_at?: string
          estado?: string | null
          id?: string
          leccion_id?: string | null
          notas?: string | null
          porcentaje_completado?: number | null
          tiempo_total?: number | null
          ultima_actividad?: string | null
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progreso_lecciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progreso_lecciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progreso_lecciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      progreso_tutorial: {
        Row: {
          completado: boolean | null
          fecha_actualizacion: string | null
          fecha_inicio: string | null
          id: string
          parte_tutorial_id: string | null
          tiempo_visto: number | null
          tutorial_id: string | null
          ultimo_acceso: string | null
          usuario_id: string | null
        }
        Insert: {
          completado?: boolean | null
          fecha_actualizacion?: string | null
          fecha_inicio?: string | null
          id?: string
          parte_tutorial_id?: string | null
          tiempo_visto?: number | null
          tutorial_id?: string | null
          ultimo_acceso?: string | null
          usuario_id?: string | null
        }
        Update: {
          completado?: boolean | null
          fecha_actualizacion?: string | null
          fecha_inicio?: string | null
          id?: string
          parte_tutorial_id?: string | null
          tiempo_visto?: number | null
          tutorial_id?: string | null
          ultimo_acceso?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progreso_tutorial_parte_tutorial_id_fkey"
            columns: ["parte_tutorial_id"]
            isOneToOne: false
            referencedRelation: "partes_tutorial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progreso_tutorial_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutoriales"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_global: {
        Row: {
          activo: boolean | null
          calculated_at: string | null
          created_at: string | null
          id: string
          metricas: Json | null
          periodo_fin: string | null
          periodo_inicio: string | null
          posicion: number | null
          posicion_anterior: number | null
          puntuacion: number | null
          temporada: string | null
          tipo_ranking: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          activo?: boolean | null
          calculated_at?: string | null
          created_at?: string | null
          id?: string
          metricas?: Json | null
          periodo_fin?: string | null
          periodo_inicio?: string | null
          posicion?: number | null
          posicion_anterior?: number | null
          puntuacion?: number | null
          temporada?: string | null
          tipo_ranking: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          activo?: boolean | null
          calculated_at?: string | null
          created_at?: string | null
          id?: string
          metricas?: Json | null
          periodo_fin?: string | null
          periodo_inicio?: string | null
          posicion?: number | null
          posicion_anterior?: number | null
          puntuacion?: number | null
          temporada?: string | null
          tipo_ranking?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ranking_global_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranking_global_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ranking_global_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rate_limit_buckets: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      scores_hero: {
        Row: {
          abandono: boolean | null
          cancion_id: string | null
          created_at: string | null
          duracion_ms: number | null
          es_mejor_personal: boolean | null
          grabacion_id: string | null
          id: string
          modo: string | null
          multiplicador_maximo: number | null
          notas_correctas: number | null
          notas_falladas: number | null
          notas_totales: number | null
          porcentaje_completado: number | null
          precision_porcentaje: number | null
          puntuacion: number
          racha_maxima: number | null
          seccion_id: string | null
          seccion_nombre: string | null
          tonalidad: string | null
          usuario_id: string | null
          xp_acumulado_cancion: number | null
          xp_ganado: number | null
        }
        Insert: {
          abandono?: boolean | null
          cancion_id?: string | null
          created_at?: string | null
          duracion_ms?: number | null
          es_mejor_personal?: boolean | null
          grabacion_id?: string | null
          id?: string
          modo?: string | null
          multiplicador_maximo?: number | null
          notas_correctas?: number | null
          notas_falladas?: number | null
          notas_totales?: number | null
          porcentaje_completado?: number | null
          precision_porcentaje?: number | null
          puntuacion: number
          racha_maxima?: number | null
          seccion_id?: string | null
          seccion_nombre?: string | null
          tonalidad?: string | null
          usuario_id?: string | null
          xp_acumulado_cancion?: number | null
          xp_ganado?: number | null
        }
        Update: {
          abandono?: boolean | null
          cancion_id?: string | null
          created_at?: string | null
          duracion_ms?: number | null
          es_mejor_personal?: boolean | null
          grabacion_id?: string | null
          id?: string
          modo?: string | null
          multiplicador_maximo?: number | null
          notas_correctas?: number | null
          notas_falladas?: number | null
          notas_totales?: number | null
          porcentaje_completado?: number | null
          precision_porcentaje?: number | null
          puntuacion?: number
          racha_maxima?: number | null
          seccion_id?: string | null
          seccion_nombre?: string | null
          tonalidad?: string | null
          usuario_id?: string | null
          xp_acumulado_cancion?: number | null
          xp_ganado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_hero_cancion_id_fkey"
            columns: ["cancion_id"]
            isOneToOne: false
            referencedRelation: "canciones_hero"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_hero_grabacion_id_fkey"
            columns: ["grabacion_id"]
            isOneToOne: false
            referencedRelation: "grabaciones_estudiantes_hero"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_hero_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_hero_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_hero_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sesiones_usuario: {
        Row: {
          created_at: string | null
          esta_activo: boolean | null
          fecha: string | null
          id: string
          pagina_actual: string | null
          sesiones_totales: number | null
          tiempo_sesion_actual: number | null
          tiempo_total_minutos: number | null
          ultima_actividad: string | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          esta_activo?: boolean | null
          fecha?: string | null
          id?: string
          pagina_actual?: string | null
          sesiones_totales?: number | null
          tiempo_sesion_actual?: number | null
          tiempo_total_minutos?: number | null
          ultima_actividad?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          esta_activo?: boolean | null
          fecha?: string | null
          id?: string
          pagina_actual?: string | null
          sesiones_totales?: number | null
          tiempo_sesion_actual?: number | null
          tiempo_total_minutos?: number | null
          ultima_actividad?: string | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sim_ajustes_usuario: {
        Row: {
          ajustes_visuales: Json | null
          instrumento_id: string | null
          lista_tonalidades_activa: Json | null
          sonidos_personalizados: Json | null
          tonalidad_activa: string | null
          tonalidades_configuradas: Json | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          ajustes_visuales?: Json | null
          instrumento_id?: string | null
          lista_tonalidades_activa?: Json | null
          sonidos_personalizados?: Json | null
          tonalidad_activa?: string | null
          tonalidades_configuradas?: Json | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          ajustes_visuales?: Json | null
          instrumento_id?: string | null
          lista_tonalidades_activa?: Json | null
          sonidos_personalizados?: Json | null
          tonalidad_activa?: string | null
          tonalidades_configuradas?: Json | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sim_ajustes_usuario_instrumento_id_fkey"
            columns: ["instrumento_id"]
            isOneToOne: false
            referencedRelation: "sim_instrumentos"
            referencedColumns: ["id"]
          },
        ]
      }
      sim_instrumentos: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      sim_muestras: {
        Row: {
          created_at: string | null
          id: string
          instrumento_id: string
          nota: string
          octava: number
          pitch_ajuste: number | null
          tipo: string
          url_audio: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instrumento_id: string
          nota: string
          octava: number
          pitch_ajuste?: number | null
          tipo: string
          url_audio: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instrumento_id?: string
          nota?: string
          octava?: number
          pitch_ajuste?: number | null
          tipo?: string
          url_audio?: string
        }
        Relationships: [
          {
            foreignKeyName: "sim_muestras_instrumento_id_fkey"
            columns: ["instrumento_id"]
            isOneToOne: false
            referencedRelation: "sim_instrumentos"
            referencedColumns: ["id"]
          },
        ]
      }
      sim_pistas_practica_libre: {
        Row: {
          audio_url: string
          bpm: number | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          audio_url: string
          bpm?: number | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          audio_url?: string
          bpm?: number | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      suscripciones_usuario: {
        Row: {
          auto_renovar: boolean | null
          created_at: string | null
          datos_pago: Json | null
          estado: string
          fecha_cancelacion: string | null
          fecha_inicio: string
          fecha_pausada: string | null
          fecha_vencimiento: string
          id: string
          intentos_renovacion: number | null
          max_intentos_renovacion: number | null
          membresia_id: string
          metodo_pago: string | null
          notas_admin: string | null
          origen_suscripcion: string | null
          periodo: string
          precio_pagado: number
          razon_cancelacion: string | null
          ref_payco: string | null
          transaction_id: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          auto_renovar?: boolean | null
          created_at?: string | null
          datos_pago?: Json | null
          estado?: string
          fecha_cancelacion?: string | null
          fecha_inicio?: string
          fecha_pausada?: string | null
          fecha_vencimiento: string
          id?: string
          intentos_renovacion?: number | null
          max_intentos_renovacion?: number | null
          membresia_id: string
          metodo_pago?: string | null
          notas_admin?: string | null
          origen_suscripcion?: string | null
          periodo?: string
          precio_pagado: number
          razon_cancelacion?: string | null
          ref_payco?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          auto_renovar?: boolean | null
          created_at?: string | null
          datos_pago?: Json | null
          estado?: string
          fecha_cancelacion?: string | null
          fecha_inicio?: string
          fecha_pausada?: string | null
          fecha_vencimiento?: string
          id?: string
          intentos_renovacion?: number | null
          max_intentos_renovacion?: number | null
          membresia_id?: string
          metodo_pago?: string | null
          notas_admin?: string | null
          origen_suscripcion?: string | null
          periodo?: string
          precio_pagado?: number
          razon_cancelacion?: string | null
          ref_payco?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_usuario_membresia_id_fkey"
            columns: ["membresia_id"]
            isOneToOne: false
            referencedRelation: "membresias"
            referencedColumns: ["id"]
          },
        ]
      }
      suscriptores_boletin: {
        Row: {
          activo: boolean
          created_at: string
          email: string
          id: string
          nombre: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email: string
          id?: string
          nombre?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string
          id?: string
          nombre?: string | null
        }
        Relationships: []
      }
      tutoriales: {
        Row: {
          acordeonista: string | null
          artista: string | null
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          descripcion_corta: string | null
          destacado: boolean | null
          duracion: number | null
          duracion_estimada: number | null
          estado: string | null
          fecha_expiracion: string | null
          id: string
          imagen_url: string | null
          instructor_id: string | null
          nivel: string | null
          objetivos: string | null
          plantilla_vista: string | null
          precio_normal: number | null
          precio_rebajado: number | null
          requisitos: string | null
          tipo_acceso: string | null
          titulo: string
          tonalidad: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          acordeonista?: string | null
          artista?: string | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          descripcion_corta?: string | null
          destacado?: boolean | null
          duracion?: number | null
          duracion_estimada?: number | null
          estado?: string | null
          fecha_expiracion?: string | null
          id?: string
          imagen_url?: string | null
          instructor_id?: string | null
          nivel?: string | null
          objetivos?: string | null
          plantilla_vista?: string | null
          precio_normal?: number | null
          precio_rebajado?: number | null
          requisitos?: string | null
          tipo_acceso?: string | null
          titulo: string
          tonalidad?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          acordeonista?: string | null
          artista?: string | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          descripcion_corta?: string | null
          destacado?: boolean | null
          duracion?: number | null
          duracion_estimada?: number | null
          estado?: string | null
          fecha_expiracion?: string | null
          id?: string
          imagen_url?: string | null
          instructor_id?: string | null
          nivel?: string | null
          objetivos?: string | null
          plantilla_vista?: string | null
          precio_normal?: number | null
          precio_rebajado?: number | null
          requisitos?: string | null
          tipo_acceso?: string | null
          titulo?: string
          tonalidad?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutoriales_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutoriales_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutoriales_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      usuario_imagenes: {
        Row: {
          es_actual: boolean
          fecha_subida: string
          id: string
          tipo: string
          url_imagen: string
          usuario_id: string
        }
        Insert: {
          es_actual?: boolean
          fecha_subida?: string
          id?: string
          tipo: string
          url_imagen: string
          usuario_id: string
        }
        Update: {
          es_actual?: boolean
          fecha_subida?: string
          id?: string
          tipo?: string
          url_imagen?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_imagenes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_imagenes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_imagenes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      usuario_imagenes_comentarios: {
        Row: {
          comentario: string
          comentario_padre_id: string | null
          fecha_creacion: string
          id: string
          imagen_id: string
          usuario_avatar: string | null
          usuario_id: string
          usuario_nombre: string
        }
        Insert: {
          comentario: string
          comentario_padre_id?: string | null
          fecha_creacion?: string
          id?: string
          imagen_id: string
          usuario_avatar?: string | null
          usuario_id: string
          usuario_nombre: string
        }
        Update: {
          comentario?: string
          comentario_padre_id?: string | null
          fecha_creacion?: string
          id?: string
          imagen_id?: string
          usuario_avatar?: string | null
          usuario_id?: string
          usuario_nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_imagenes_comentarios_comentario_padre_id_fkey"
            columns: ["comentario_padre_id"]
            isOneToOne: false
            referencedRelation: "usuario_imagenes_comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_imagenes_comentarios_imagen_id_fkey"
            columns: ["imagen_id"]
            isOneToOne: false
            referencedRelation: "usuario_imagenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_imagenes_comentarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_imagenes_comentarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_imagenes_comentarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      usuario_imagenes_likes: {
        Row: {
          fecha_creacion: string
          id: number
          imagen_id: string
          usuario_id: string
        }
        Insert: {
          fecha_creacion?: string
          id?: number
          imagen_id: string
          usuario_id: string
        }
        Update: {
          fecha_creacion?: string
          id?: number
          imagen_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_imagenes_likes_imagen_id_fkey"
            columns: ["imagen_id"]
            isOneToOne: false
            referencedRelation: "usuario_imagenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_imagenes_likes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_imagenes_likes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_imagenes_likes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      validaciones_tutorial: {
        Row: {
          comentario_profesor: string | null
          created_at: string | null
          estado: string | null
          fase1_otorgada: boolean | null
          fase2_otorgada: boolean | null
          id: string
          leccion_id: string | null
          monedas_fase1: number | null
          monedas_fase2: number | null
          parte_tutorial_id: string | null
          profesor_id: string | null
          tutorial_id: string | null
          updated_at: string | null
          usuario_id: string | null
          video_url: string
        }
        Insert: {
          comentario_profesor?: string | null
          created_at?: string | null
          estado?: string | null
          fase1_otorgada?: boolean | null
          fase2_otorgada?: boolean | null
          id?: string
          leccion_id?: string | null
          monedas_fase1?: number | null
          monedas_fase2?: number | null
          parte_tutorial_id?: string | null
          profesor_id?: string | null
          tutorial_id?: string | null
          updated_at?: string | null
          usuario_id?: string | null
          video_url: string
        }
        Update: {
          comentario_profesor?: string | null
          created_at?: string | null
          estado?: string | null
          fase1_otorgada?: boolean | null
          fase2_otorgada?: boolean | null
          id?: string
          leccion_id?: string | null
          monedas_fase1?: number | null
          monedas_fase2?: number | null
          parte_tutorial_id?: string | null
          profesor_id?: string | null
          tutorial_id?: string | null
          updated_at?: string | null
          usuario_id?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "validaciones_tutorial_leccion_id_fkey"
            columns: ["leccion_id"]
            isOneToOne: false
            referencedRelation: "lecciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validaciones_tutorial_leccion_id_fkey"
            columns: ["leccion_id"]
            isOneToOne: false
            referencedRelation: "vw_lecciones_completas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validaciones_tutorial_parte_tutorial_id_fkey"
            columns: ["parte_tutorial_id"]
            isOneToOne: false
            referencedRelation: "partes_tutorial"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validaciones_tutorial_profesor_id_fkey"
            columns: ["profesor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validaciones_tutorial_profesor_id_fkey"
            columns: ["profesor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validaciones_tutorial_profesor_id_fkey"
            columns: ["profesor_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "validaciones_tutorial_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutoriales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validaciones_tutorial_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validaciones_tutorial_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validaciones_tutorial_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      xp_cancion_usuario: {
        Row: {
          cancion_id: string
          updated_at: string | null
          usuario_id: string
          xp_acumulado: number | null
        }
        Insert: {
          cancion_id: string
          updated_at?: string | null
          usuario_id: string
          xp_acumulado?: number | null
        }
        Update: {
          cancion_id?: string
          updated_at?: string | null
          usuario_id?: string
          xp_acumulado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "xp_cancion_usuario_cancion_id_fkey"
            columns: ["cancion_id"]
            isOneToOne: false
            referencedRelation: "canciones_hero"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_cancion_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_cancion_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_cancion_usuario_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      xp_transacciones: {
        Row: {
          created_at: string | null
          fecha: string | null
          id: string
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
          usuario_id: string | null
          xp_ganado: number
        }
        Insert: {
          created_at?: string | null
          fecha?: string | null
          id?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: string
          usuario_id?: string | null
          xp_ganado: number
        }
        Update: {
          created_at?: string | null
          fecha?: string | null
          id?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          usuario_id?: string | null
          xp_ganado?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_transacciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_transacciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_transacciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      cursos_publicados: {
        Row: {
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          duracion_estimada: number | null
          duracion_total: number | null
          es_destacado: boolean | null
          es_publico: boolean | null
          estado: string | null
          id: string | null
          imagen_url: string | null
          instructor_id: string | null
          nivel: string | null
          objetivos: string[] | null
          precio: number | null
          requisitos: string[] | null
          tipo_acceso: string | null
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          duracion_estimada?: number | null
          duracion_total?: number | null
          es_destacado?: boolean | null
          es_publico?: boolean | null
          estado?: string | null
          id?: string | null
          imagen_url?: string | null
          instructor_id?: string | null
          nivel?: string | null
          objetivos?: string[] | null
          precio?: number | null
          requisitos?: string[] | null
          tipo_acceso?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          duracion_estimada?: number | null
          duracion_total?: number | null
          es_destacado?: boolean | null
          es_publico?: boolean | null
          estado?: string | null
          id?: string | null
          imagen_url?: string | null
          instructor_id?: string | null
          nivel?: string | null
          objetivos?: string[] | null
          precio?: number | null
          requisitos?: string[] | null
          tipo_acceso?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cursos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      perfiles_publica: {
        Row: {
          apellido: string | null
          biografia: string | null
          ciudad: string | null
          experiencia_total: number | null
          fecha_creacion: string | null
          id: string | null
          instrumento: string | null
          nivel_habilidad: string | null
          nivel_usuario: number | null
          nombre: string | null
          nombre_completo: string | null
          nombre_usuario: string | null
          pais: string | null
          portada_url: string | null
          posicion_img_portada: string | null
          puntos_experiencia: number | null
          racha_dias: number | null
          rol: string | null
          url_foto_perfil: string | null
        }
        Insert: {
          apellido?: string | null
          biografia?: string | null
          ciudad?: string | null
          experiencia_total?: number | null
          fecha_creacion?: string | null
          id?: string | null
          instrumento?: string | null
          nivel_habilidad?: string | null
          nivel_usuario?: number | null
          nombre?: string | null
          nombre_completo?: string | null
          nombre_usuario?: string | null
          pais?: string | null
          portada_url?: string | null
          posicion_img_portada?: string | null
          puntos_experiencia?: number | null
          racha_dias?: number | null
          rol?: string | null
          url_foto_perfil?: string | null
        }
        Update: {
          apellido?: string | null
          biografia?: string | null
          ciudad?: string | null
          experiencia_total?: number | null
          fecha_creacion?: string | null
          id?: string | null
          instrumento?: string | null
          nivel_habilidad?: string | null
          nivel_usuario?: number | null
          nombre?: string | null
          nombre_completo?: string | null
          nombre_usuario?: string | null
          pais?: string | null
          portada_url?: string | null
          posicion_img_portada?: string | null
          puntos_experiencia?: number | null
          racha_dias?: number | null
          rol?: string | null
          url_foto_perfil?: string | null
        }
        Relationships: []
      }
      vista_consulta_reclamos: {
        Row: {
          curso_id: string | null
          email: string | null
          estado_pago: string | null
          estado_perfil: string | null
          factura: string | null
          fecha_transaccion: string | null
          monto: number | null
          nombre: string | null
          producto: string | null
          ref_payco: string | null
          tutorial_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_epayco_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos_publicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_minima"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutoriales"
            referencedColumns: ["id"]
          },
        ]
      }
      vista_cursos_completa: {
        Row: {
          categoria: string | null
          con_modulos: boolean | null
          creado_por: string | null
          created_at: string | null
          descripcion: string | null
          descripcion_corta: string | null
          duracion_estimada: number | null
          duracion_total: number | null
          es_destacado: boolean | null
          es_publico: boolean | null
          estado: string | null
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          id: string | null
          imagen_url: string | null
          instructor_id: string | null
          leccion_count: number | null
          nivel: string | null
          objetivos: string[] | null
          precio: number | null
          requisitos: string[] | null
          slug: string | null
          tipo_acceso: string | null
          titulo: string | null
          ultima_actualizacion: string | null
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          con_modulos?: boolean | null
          creado_por?: string | null
          created_at?: string | null
          descripcion?: string | null
          descripcion_corta?: string | null
          duracion_estimada?: number | null
          duracion_total?: number | null
          es_destacado?: boolean | null
          es_publico?: boolean | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: string | null
          imagen_url?: string | null
          instructor_id?: string | null
          leccion_count?: number | null
          nivel?: string | null
          objetivos?: string[] | null
          precio?: number | null
          requisitos?: string[] | null
          slug?: string | null
          tipo_acceso?: string | null
          titulo?: string | null
          ultima_actualizacion?: string | null
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          con_modulos?: boolean | null
          creado_por?: string | null
          created_at?: string | null
          descripcion?: string | null
          descripcion_corta?: string | null
          duracion_estimada?: number | null
          duracion_total?: number | null
          es_destacado?: boolean | null
          es_publico?: boolean | null
          estado?: string | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: string | null
          imagen_url?: string | null
          instructor_id?: string | null
          leccion_count?: number | null
          nivel?: string | null
          objetivos?: string[] | null
          precio?: number | null
          requisitos?: string[] | null
          slug?: string | null
          tipo_acceso?: string | null
          titulo?: string | null
          ultima_actualizacion?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cursos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cursos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vista_cursos_minima: {
        Row: {
          descripcion: string | null
          id: string | null
          imagen_url: string | null
          precio: number | null
          slug: string | null
          titulo: string | null
        }
        Insert: {
          descripcion?: string | null
          id?: string | null
          imagen_url?: string | null
          precio?: number | null
          slug?: string | null
          titulo?: string | null
        }
        Update: {
          descripcion?: string | null
          id?: string | null
          imagen_url?: string | null
          precio?: number | null
          slug?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      vista_notificaciones: {
        Row: {
          archivada: boolean | null
          categoria: string | null
          correo_electronico: string | null
          datos_adicionales: Json | null
          entidad_id: string | null
          entidad_tipo: string | null
          fecha_creacion: string | null
          fecha_expiracion: string | null
          fecha_lectura: string | null
          icono: string | null
          id: string | null
          leida: boolean | null
          mensaje: string | null
          nombre_completo: string | null
          prioridad: string | null
          tiempo_transcurrido: string | null
          tipo: string | null
          titulo: string | null
          url_accion: string | null
          url_foto_perfil: string | null
          usuario_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vista_pagos_completa: {
        Row: {
          base_iva: number | null
          cod_respuesta: string | null
          created_at: string | null
          curso_id: string | null
          curso_imagen: string | null
          curso_slug: string | null
          curso_titulo: string | null
          datos_adicionales: Json | null
          descripcion: string | null
          estado: string | null
          factura: string | null
          fecha_transaccion: string | null
          ico: number | null
          id: string | null
          ip_cliente: unknown
          iva: number | null
          metodo_pago: string | null
          moneda: string | null
          nombre_producto: string | null
          ref_payco: string | null
          respuesta: string | null
          tipo_contenido: string | null
          tutorial_id: string | null
          tutorial_imagen: string | null
          tutorial_titulo: string | null
          updated_at: string | null
          usuario_email: string | null
          usuario_id: string | null
          usuario_nombre: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_epayco_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos_publicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_minima"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutoriales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles_publica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_epayco_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vista_usuario_completo"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vista_pagos_problematicos: {
        Row: {
          alerta: string | null
          correo_electronico: string | null
          estado: string | null
          fecha_pago: string | null
          id: string | null
          nombre_producto: string | null
          nombre_usuario: string | null
          ref_payco: string | null
          ultimo_update_epayco: string | null
          valor: number | null
        }
        Relationships: []
      }
      vista_paquetes_completos: {
        Row: {
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          descripcion_corta: string | null
          descuento_porcentaje: number | null
          destacado: boolean | null
          duracion_calculada: number | null
          duracion_total_estimada: number | null
          estado: string | null
          fecha_expiracion: string | null
          id: string | null
          imagen_url: string | null
          incluye: string | null
          instructor_id: string | null
          meta_descripcion: string | null
          meta_titulo: string | null
          nivel: string | null
          objetivos: string | null
          orden_mostrar: number | null
          porcentaje_ahorro_real: number | null
          precio_normal: number | null
          precio_rebajado: number | null
          precio_total_individual: number | null
          requisitos: string | null
          slug: string | null
          tags: string[] | null
          tipo_acceso: string | null
          titulo: string | null
          total_tutoriales: number | null
          tutoriales_incluidos: number | null
          updated_at: string | null
          ventajas: string | null
          visible: boolean | null
        }
        Relationships: []
      }
      vista_usuario_completo: {
        Row: {
          ano_experiencia: number | null
          apellido: string | null
          biografia: string | null
          ciudad: string | null
          configuracion_simulador: Json | null
          correo_electronico: string | null
          created_at: string | null
          dias_restantes: number | null
          estilo_favorito: string | null
          experiencia_total: number | null
          fecha_inicio_membresia: string | null
          fecha_vencimiento_membresia: string | null
          insignias: Json | null
          instrumento: string | null
          logros_obtenidos: Json | null
          membresia_color: string | null
          membresia_descripcion: string | null
          membresia_nombre: string | null
          membresia_permisos: Json | null
          nivel_habilidad: string | null
          nivel_usuario: number | null
          nombre: string | null
          nombre_completo: string | null
          nombre_usuario: string | null
          objetivo_aprendizaje: string | null
          onboarding_completado: boolean | null
          pais: string | null
          periodo_pago: string | null
          precio_pagado: number | null
          preferencias_contenido: Json | null
          preferencias_membresia: Json | null
          primera_vez: boolean | null
          puntos_experiencia: number | null
          racha_dias: number | null
          rol: string | null
          suscripcion: string | null
          suscripcion_estado: string | null
          ultima_actividad: string | null
          updated_at: string | null
          url_foto_perfil: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Relationships: []
      }
      vw_lecciones_completas: {
        Row: {
          contenido: string | null
          created_at: string | null
          curso_id: string | null
          curso_titulo: string | null
          descripcion: string | null
          es_publicado: boolean | null
          id: string | null
          modulo_curso_id: string | null
          modulo_id: string | null
          modulo_titulo: string | null
          orden: number | null
          tipo_contenido: string | null
          titulo: string | null
          updated_at: string | null
          video_url: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos_publicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecciones_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_minima"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecciones_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecciones_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "vw_modulos_con_cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["modulo_curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["modulo_curso_id"]
            isOneToOne: false
            referencedRelation: "cursos_publicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["modulo_curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["modulo_curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_minima"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_modulos_con_cursos: {
        Row: {
          created_at: string | null
          curso_estado: string | null
          curso_id: string | null
          curso_imagen: string | null
          curso_titulo: string | null
          descripcion: string | null
          id: string | null
          orden: number | null
          titulo: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos_publicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_completa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "vista_cursos_minima"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      actualizar_actividad_usuario: {
        Args: {
          p_duracion_minutos?: number
          p_pagina?: string
          p_tipo_evento?: string
          p_usuario_id: string
        }
        Returns: undefined
      }
      actualizar_imagen_curso: {
        Args: { curso_id: string; nueva_url: string }
        Returns: undefined
      }
      actualizar_portada_usuario: {
        Args: { portada_url_nueva: string; user_id: string }
        Returns: Json
      }
      actualizar_slug_usuario: {
        Args: { nuevo_slug: string; usuario_id: string }
        Returns: boolean
      }
      actualizar_suscripciones_vencidas: { Args: never; Returns: number }
      actualizar_xp_balanceado: {
        Args: { p_tipo_actividad: string; p_usuario_id: string }
        Returns: undefined
      }
      actualizar_xp_simple: {
        Args: { p_tipo_actividad: string; p_usuario_id: string }
        Returns: undefined
      }
      admin_actualizar_monedas_evaluacion: {
        Args: { p_monedas: number; p_parte_id: string }
        Returns: undefined
      }
      admin_buscar_perfiles_por_emails: {
        Args: { p_emails: string[] }
        Returns: {
          correo_electronico: string
          id: string
        }[]
      }
      admin_create_curso: {
        Args: {
          p_categoria: string
          p_descripcion: string
          p_estado?: string
          p_instructor_id: string
          p_nivel: string
          p_precio?: number
          p_tipo_acceso?: string
          p_titulo: string
        }
        Returns: string
      }
      admin_listar_perfiles_con_pii: {
        Args: { p_ids: string[] }
        Returns: {
          ano_experiencia: number | null
          apellido: string | null
          biografia: string | null
          ciudad: string | null
          codigo_postal: string | null
          como_nos_conocio: string | null
          configuracion_simulador: Json | null
          correo_electronico: string | null
          created_at: string | null
          direccion_completa: string | null
          documento_numero: string | null
          documento_tipo: string | null
          eliminado: boolean | null
          estilo_favorito: string | null
          estudios_musicales: string | null
          experiencia_total: number | null
          fecha_actualizacion: string
          fecha_creacion: string
          fecha_inicio_membresia: string | null
          fecha_nacimiento: string | null
          fecha_vencimiento_membresia: string | null
          id: string
          insignias: Json | null
          instrumento: string | null
          logros_obtenidos: Json | null
          membresia_activa_id: string | null
          nivel_habilidad: string | null
          nivel_usuario: number | null
          nombre: string | null
          nombre_completo: string | null
          nombre_usuario: string | null
          notificaciones_membresia: boolean | null
          objetivo_aprendizaje: string | null
          onboarding_completado: boolean | null
          pais: string | null
          portada_url: string | null
          posicion_img_portada: string | null
          preferencias_contenido: Json | null
          preferencias_membresia: Json | null
          primera_vez: boolean | null
          profesion: string | null
          puntos_experiencia: number | null
          racha_dias: number | null
          rol: string
          suscripcion: string | null
          ultima_actividad: string | null
          updated_at: string | null
          url_foto_perfil: string | null
          whatsapp: string | null
          xp: number
        }[]
        SetofOptions: {
          from: "*"
          to: "perfiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_listar_todos_perfiles: {
        Args: { p_mostrar_eliminados?: boolean }
        Returns: {
          ano_experiencia: number | null
          apellido: string | null
          biografia: string | null
          ciudad: string | null
          codigo_postal: string | null
          como_nos_conocio: string | null
          configuracion_simulador: Json | null
          correo_electronico: string | null
          created_at: string | null
          direccion_completa: string | null
          documento_numero: string | null
          documento_tipo: string | null
          eliminado: boolean | null
          estilo_favorito: string | null
          estudios_musicales: string | null
          experiencia_total: number | null
          fecha_actualizacion: string
          fecha_creacion: string
          fecha_inicio_membresia: string | null
          fecha_nacimiento: string | null
          fecha_vencimiento_membresia: string | null
          id: string
          insignias: Json | null
          instrumento: string | null
          logros_obtenidos: Json | null
          membresia_activa_id: string | null
          nivel_habilidad: string | null
          nivel_usuario: number | null
          nombre: string | null
          nombre_completo: string | null
          nombre_usuario: string | null
          notificaciones_membresia: boolean | null
          objetivo_aprendizaje: string | null
          onboarding_completado: boolean | null
          pais: string | null
          portada_url: string | null
          posicion_img_portada: string | null
          preferencias_contenido: Json | null
          preferencias_membresia: Json | null
          primera_vez: boolean | null
          profesion: string | null
          puntos_experiencia: number | null
          racha_dias: number | null
          rol: string
          suscripcion: string | null
          ultima_actividad: string | null
          updated_at: string | null
          url_foto_perfil: string | null
          whatsapp: string | null
          xp: number
        }[]
        SetofOptions: {
          from: "*"
          to: "perfiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_obtener_perfil_completo: {
        Args: { p_id: string }
        Returns: {
          ano_experiencia: number | null
          apellido: string | null
          biografia: string | null
          ciudad: string | null
          codigo_postal: string | null
          como_nos_conocio: string | null
          configuracion_simulador: Json | null
          correo_electronico: string | null
          created_at: string | null
          direccion_completa: string | null
          documento_numero: string | null
          documento_tipo: string | null
          eliminado: boolean | null
          estilo_favorito: string | null
          estudios_musicales: string | null
          experiencia_total: number | null
          fecha_actualizacion: string
          fecha_creacion: string
          fecha_inicio_membresia: string | null
          fecha_nacimiento: string | null
          fecha_vencimiento_membresia: string | null
          id: string
          insignias: Json | null
          instrumento: string | null
          logros_obtenidos: Json | null
          membresia_activa_id: string | null
          nivel_habilidad: string | null
          nivel_usuario: number | null
          nombre: string | null
          nombre_completo: string | null
          nombre_usuario: string | null
          notificaciones_membresia: boolean | null
          objetivo_aprendizaje: string | null
          onboarding_completado: boolean | null
          pais: string | null
          portada_url: string | null
          posicion_img_portada: string | null
          preferencias_contenido: Json | null
          preferencias_membresia: Json | null
          primera_vez: boolean | null
          profesion: string | null
          puntos_experiencia: number | null
          racha_dias: number | null
          rol: string
          suscripcion: string | null
          ultima_actividad: string | null
          updated_at: string | null
          url_foto_perfil: string | null
          whatsapp: string | null
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "perfiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_update_curso: {
        Args: {
          p_categoria: string
          p_curso_id: string
          p_descripcion: string
          p_estado: string
          p_nivel: string
          p_precio: number
          p_tipo_acceso: string
          p_titulo: string
        }
        Returns: boolean
      }
      agregar_evaluacion_modulo: {
        Args: { p_curso_id: string; p_modulo_id: string; p_monedas?: number }
        Returns: undefined
      }
      bump_rate_limit: {
        Args: {
          p_key: string
          p_max_requests: number
          p_window_seconds?: number
        }
        Returns: boolean
      }
      calcular_descuento_paquete: {
        Args: { p_paquete_id: string }
        Returns: {
          ahorro: number
          porcentaje_descuento: number
          precio_individual_total: number
          precio_paquete: number
        }[]
      }
      calcular_estadisticas_cancion: {
        Args: { p_cancion_id: string }
        Returns: Json
      }
      calcular_progreso_curso: {
        Args: { p_curso_id: string; p_usuario_id: string }
        Returns: number
      }
      calcular_puntuacion_hibrida: {
        Args: { p_usuario_id: string }
        Returns: number
      }
      cambiar_password_usuario: {
        Args: { nueva_password: string; usuario_id: string }
        Returns: Json
      }
      completar_parte_tutorial: {
        Args: { p_parte_tutorial_id: string; p_usuario_id: string }
        Returns: string
      }
      completar_parte_tutorial_15xp: {
        Args: { p_parte_tutorial_id: string; p_usuario_id: string }
        Returns: string
      }
      completar_tutorial_existente: {
        Args: { p_tutorial_id: string; p_usuario_id: string }
        Returns: string
      }
      contar_comentarios_publicacion: {
        Args: { p_publicacion_id: string }
        Returns: number
      }
      contar_likes_publicacion: {
        Args: { p_publicacion_id: string }
        Returns: number
      }
      contar_likes_publicacion_seguro: {
        Args: { p_publicacion_id: string }
        Returns: number
      }
      crear_notificacion: {
        Args: {
          p_categoria?: string
          p_datos_adicionales?: Json
          p_entidad_id?: string
          p_entidad_tipo?: string
          p_icono?: string
          p_mensaje: string
          p_prioridad?: string
          p_tipo: string
          p_titulo: string
          p_url_accion?: string
          p_usuario_id: string
        }
        Returns: string
      }
      crear_notificacion_masiva: {
        Args: {
          p_categoria?: string
          p_filtro_suscripcion?: string
          p_mensaje: string
          p_tipo: string
          p_titulo: string
          p_url_accion?: string
          p_usuarios_ids: string[]
        }
        Returns: number
      }
      crear_notificacion_segura: {
        Args: {
          p_categoria?: string
          p_datos_adicionales?: Json
          p_entidad_id?: string
          p_entidad_tipo?: string
          p_icono?: string
          p_mensaje: string
          p_prioridad?: string
          p_tipo: string
          p_titulo: string
          p_url_accion?: string
          p_usuario_id: string
        }
        Returns: string
      }
      crear_suscripcion: {
        Args: {
          p_membresia_id: string
          p_metodo_pago?: string
          p_periodo?: string
          p_precio_pagado?: number
          p_transaction_id?: string
          p_usuario_id: string
        }
        Returns: string
      }
      eliminar_canciones_hero: { Args: { p_ids: string[] }; Returns: number }
      eliminar_usuario_completo: {
        Args: { user_id: string }
        Returns: undefined
      }
      es_admin_chat: {
        Args: { p_chat_id: string; p_usuario_id: string }
        Returns: boolean
      }
      es_miembro_chat: {
        Args: { p_chat_id: string; p_usuario_id: string }
        Returns: boolean
      }
      esta_inscrito: {
        Args: { curso_id: string; usuario_id: string }
        Returns: boolean
      }
      force_delete_blog_article: {
        Args: { article_id: string }
        Returns: boolean
      }
      get_sesiones_hoy: { Args: never; Returns: number }
      get_usuarios_activos: {
        Args: { minutos?: number }
        Returns: {
          apellido: string
          correo_electronico: string
          nombre: string
          pagina_actual: string
          tiempo_sesion_actual: number
          ultima_actividad: string
          url_foto_perfil: string
          usuario_id: string
        }[]
      }
      increment_progreso: { Args: { increment_by?: number }; Returns: number }
      inscribir_a_curso: {
        Args: { p_curso_id: string; p_usuario_id: string }
        Returns: boolean
      }
      inscribir_usuario_automaticamente: {
        Args: {
          p_curso_id: string
          p_pago_id: string
          p_tutorial_id: string
          p_usuario_id: string
        }
        Returns: undefined
      }
      inscribir_usuario_en_paquete_admin: {
        Args: { p_paquete_id: string; p_usuario_id: string }
        Returns: Json
      }
      inscribir_usuario_paquete: {
        Args: { p_paquete_id: string; p_usuario_id: string }
        Returns: boolean
      }
      inscripcion_directa: { Args: { p_curso_id: string }; Returns: boolean }
      insertar_actualizar_ubicacion_usuario: {
        Args: {
          p_datos_ipapi: Json
          p_direccion_ip: string
          p_id_usuario: string
        }
        Returns: string
      }
      insertar_actualizar_ubicacion_usuario_completa: {
        Args: {
          p_datos_ipapi: Json
          p_direccion_ip: string
          p_id_usuario: string
        }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      limpiar_sesiones_expiradas: { Args: never; Returns: number }
      marcar_actividad_procesada: {
        Args: { p_actividad_id: string }
        Returns: undefined
      }
      marcar_mensajes_como_leidos: {
        Args: { p_chat_id: string; p_usuario_id: string }
        Returns: number
      }
      marcar_notificaciones_leidas: {
        Args: { p_notificacion_ids?: string[]; p_usuario_id: string }
        Returns: number
      }
      marcar_parte_completada: {
        Args: {
          p_parte_id: string
          p_tutorial_id: string
          p_usuario_id: string
        }
        Returns: undefined
      }
      marcar_usuario_inactivo: {
        Args: { p_usuario_id: string }
        Returns: undefined
      }
      monitoreo_uso_ipapi_espanol: {
        Args: never
        Returns: {
          paises_detectados: number
          registros_hoy: number
          total_registros: number
          ultimo_registro: string
        }[]
      }
      mover_monedas: {
        Args: {
          p_cantidad: number
          p_concepto: string
          p_referencia_id?: string
          p_referencia_tipo?: string
          p_tipo: string
          p_usuario_id: string
        }
        Returns: undefined
      }
      obtener_actividades_pendientes: {
        Args: { p_usuario_id: string }
        Returns: {
          created_at: string
          datos_actividad: Json
          id: string
          tipo_actividad: string
        }[]
      }
      obtener_canciones_recomendadas: {
        Args: { p_limite?: number; p_usuario_id: string }
        Returns: {
          artista: string
          cancion_id: string
          nivel_dificultad: number
          razon_recomendacion: string
          titulo: string
        }[]
      }
      obtener_comentarios_publicacion: {
        Args: { p_publicacion_id: string }
        Returns: {
          comentario: string
          comentario_padre_id: string
          fecha_creacion: string
          id: string
          publicacion_id: string
          usuario_avatar: string
          usuario_id: string
          usuario_nombre: string
        }[]
      }
      obtener_contenido_curso: { Args: { p_curso_id: string }; Returns: Json }
      obtener_estadisticas_geograficas_completas: {
        Args: never
        Returns: {
          capital: string
          continente: string
          moneda: string
          nivel_confianza: string
          pais: string
          proveedor_api: string
          total_usuarios: number
          total_visitas: number
        }[]
      }
      obtener_estadisticas_geograficas_espanol: {
        Args: never
        Returns: {
          pais: string
          total_usuarios: number
          total_visitas: number
        }[]
      }
      obtener_eventos_proximos: {
        Args: { limite?: number }
        Returns: {
          capacidad_maxima: number
          fecha_inicio: string
          id: string
          instructor_nombre: string
          participantes_inscritos: number
          tipo_evento: string
          titulo: string
        }[]
      }
      obtener_membresia_activa: {
        Args: { p_usuario_id: string }
        Returns: {
          dias_restantes: number
          estado: string
          fecha_vencimiento: string
          membresia_id: string
          membresia_nombre: string
          periodo: string
          permisos: Json
          precio_pagado: number
          suscripcion_id: string
        }[]
      }
      obtener_mi_perfil_completo: {
        Args: never
        Returns: {
          ano_experiencia: number | null
          apellido: string | null
          biografia: string | null
          ciudad: string | null
          codigo_postal: string | null
          como_nos_conocio: string | null
          configuracion_simulador: Json | null
          correo_electronico: string | null
          created_at: string | null
          direccion_completa: string | null
          documento_numero: string | null
          documento_tipo: string | null
          eliminado: boolean | null
          estilo_favorito: string | null
          estudios_musicales: string | null
          experiencia_total: number | null
          fecha_actualizacion: string
          fecha_creacion: string
          fecha_inicio_membresia: string | null
          fecha_nacimiento: string | null
          fecha_vencimiento_membresia: string | null
          id: string
          insignias: Json | null
          instrumento: string | null
          logros_obtenidos: Json | null
          membresia_activa_id: string | null
          nivel_habilidad: string | null
          nivel_usuario: number | null
          nombre: string | null
          nombre_completo: string | null
          nombre_usuario: string | null
          notificaciones_membresia: boolean | null
          objetivo_aprendizaje: string | null
          onboarding_completado: boolean | null
          pais: string | null
          portada_url: string | null
          posicion_img_portada: string | null
          preferencias_contenido: Json | null
          preferencias_membresia: Json | null
          primera_vez: boolean | null
          profesion: string | null
          puntos_experiencia: number | null
          racha_dias: number | null
          rol: string
          suscripcion: string | null
          ultima_actividad: string | null
          updated_at: string | null
          url_foto_perfil: string | null
          whatsapp: string | null
          xp: number
        }
        SetofOptions: {
          from: "*"
          to: "perfiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      obtener_modulos_curso: {
        Args: { p_curso_id: string }
        Returns: {
          created_at: string
          curso_id: string | null
          descripcion: string | null
          id: string
          orden: number
          titulo: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "modulos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      obtener_paquetes_usuario: {
        Args: { p_usuario_id: string }
        Returns: {
          estado: string
          fecha_inscripcion: string
          inscripcion_id: string
          paquete_id: string
          porcentaje_completado: number
          titulo: string
        }[]
      }
      obtener_precio_contenido: {
        Args: { p_contenido_id: string; p_tipo: string }
        Returns: number
      }
      obtener_ranking_hibrido_completo: {
        Args: { p_limite?: number; p_tipo_ranking?: string }
        Returns: {
          apellido: string
          comentarios_hechos: number
          cursos_completados: number
          es_gaming: boolean
          likes_recibidos: number
          logros_totales: number
          nivel: number
          nombre: string
          posicion: number
          publicaciones_creadas: number
          puntuacion: number
          racha_actual_dias: number
          tutoriales_completados: number
          url_foto_perfil: string
          usuario_id: string
          xp_total: number
        }[]
      }
      obtener_ranking_hibrido_paginado: {
        Args: { p_limite?: number; p_offset?: number; p_tipo_ranking?: string }
        Returns: {
          apellido: string
          comentarios_hechos: number
          cursos_completados: number
          es_gaming: boolean
          likes_recibidos: number
          logros_totales: number
          nivel: number
          nombre: string
          posicion: number
          precision_promedio: number
          publicaciones_creadas: number
          puntuacion: number
          racha_actual_dias: number
          racha_maxima: number
          tiempo_total_minutos: number
          total_sesiones: number
          tutoriales_completados: number
          url_foto_perfil: string
          usuario_id: string
          xp_total: number
        }[]
      }
      obtener_url_imagen_paquete: {
        Args: { nombre_archivo: string }
        Returns: string
      }
      obtener_usuario_con_membresia_real: {
        Args: { p_usuario_id: string }
        Returns: {
          correo_electronico: string
          dias_restantes: number
          experiencia_total: number
          fecha_vencimiento: string
          membresia_nombre: string
          membresia_permisos: Json
          nivel_usuario: number
          nombre_usuario: string
          racha_dias: number
          user_id: string
        }[]
      }
      probar_notificacion_curso_manual: {
        Args: { curso_id_param: string }
        Returns: undefined
      }
      probar_parte_tutorial_15xp: {
        Args: {
          p_parte_tutorial_id: string
          p_tutorial_id: string
          p_usuario_id: string
        }
        Returns: string
      }
      probar_parte_tutorial_seguro: {
        Args: {
          p_parte_tutorial_id: string
          p_tutorial_id: string
          p_usuario_id: string
        }
        Returns: string
      }
      probar_parte_tutorial_simple: {
        Args: {
          p_parte_tutorial_id: string
          p_tutorial_id: string
          p_usuario_id: string
        }
        Returns: string
      }
      probar_parte_tutorial_xp: {
        Args: {
          p_parte_tutorial_id: string
          p_tutorial_id: string
          p_usuario_id: string
        }
        Returns: string
      }
      probar_tutorial_completado: {
        Args: { p_tutorial_id: string; p_usuario_id: string }
        Returns: string
      }
      probar_tutorial_xp: {
        Args: { p_tutorial_id: string; p_usuario_id: string }
        Returns: string
      }
      procesar_actividad_gamificacion: {
        Args: {
          p_datos_actividad: Json
          p_tipo_actividad: string
          p_usuario_id: string
        }
        Returns: undefined
      }
      ranking_comunidad_total: {
        Args: never
        Returns: {
          comentarios: number
          likes: number
          publicaciones: number
          puntaje_total: number
          tutoriales_completados: number
          usuario_id: string
        }[]
      }
      recalcular_puntuaciones_todos: { Args: never; Returns: undefined }
      registrar_actividad_usuario: {
        Args: {
          p_increment_progreso?: number
          p_pagina?: string
          p_tipo_actividad?: string
          p_usuario_id: string
        }
        Returns: undefined
      }
      registrar_progreso_leccion:
        | { Args: { p_curso_id: string; p_leccion_id: string }; Returns: Json }
        | {
            Args: {
              p_completado: boolean
              p_leccion_id: string
              p_progreso: number
              p_tiempo_visto: number
              p_usuario_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_curso_id?: string
              p_leccion_id: string
              p_usuario_id: string
            }
            Returns: undefined
          }
      sincronizar_estado_con_epayco: {
        Args: { p_ref_payco: string }
        Returns: {
          estado_anterior: string
          estado_nuevo: string
          ref_payco: string
          sincronizado: boolean
        }[]
      }
      sincronizar_membresia_perfil_real: {
        Args: { p_usuario_id: string }
        Returns: undefined
      }
      sumar_xp_usuario: {
        Args: {
          p_referencia_id?: string
          p_referencia_tipo?: string
          p_tipo: string
          p_usuario_id: string
          p_xp: number
        }
        Returns: undefined
      }
      unaccent: { Args: { "": string }; Returns: string }
      upsert_geolocalizacion_usuario:
        | {
            Args: { p_datos_geo: Json; p_ip: string; p_usuario_id: string }
            Returns: string
          }
        | {
            Args: {
              p_ciudad: string
              p_ip: string
              p_latitud?: number
              p_longitud?: number
              p_pais: string
              p_proveedor?: string
              p_region?: string
              p_timezone?: string
              p_usuario_id: string
            }
            Returns: number
          }
      usuario_dio_like: {
        Args: { p_publicacion_id: string; p_usuario_id: string }
        Returns: boolean
      }
      usuario_tiene_acceso: {
        Args: {
          p_recurso_especifico?: string
          p_tipo_recurso: string
          p_usuario_id: string
        }
        Returns: boolean
      }
      usuario_tiene_like_seguro: {
        Args: { p_publicacion_id: string; p_usuario_id: string }
        Returns: boolean
      }
      usuario_ya_pago: {
        Args: {
          p_curso_id?: string
          p_tutorial_id?: string
          p_usuario_id: string
        }
        Returns: boolean
      }
      verificar_disponibilidad_evento: {
        Args: { evento_uuid: string; usuario_uuid: string }
        Returns: Json
      }
    }
    Enums: {
      estado_objetivo: "pendiente" | "en_progreso" | "completado"
      prioridad_objetivo: "alta" | "media" | "baja"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_objetivo: ["pendiente", "en_progreso", "completado"],
      prioridad_objetivo: ["alta", "media", "baja"],
    },
  },
} as const
