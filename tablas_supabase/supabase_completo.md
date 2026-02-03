[
  {
    "tabla": "actividades_pendientes",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "actividades_pendientes",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "actividades_pendientes",
    "columna": "tipo_actividad",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "actividades_pendientes",
    "columna": "datos_actividad",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "actividades_pendientes",
    "columna": "procesado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "actividades_pendientes",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "blog_articulos",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "blog_articulos",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "blog_articulos",
    "columna": "resumen",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "blog_articulos",
    "columna": "contenido",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "blog_articulos",
    "columna": "imagen_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "blog_articulos",
    "columna": "estado",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'borrador'::text"
  },
  {
    "tabla": "blog_articulos",
    "columna": "creado_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "blog_articulos",
    "columna": "actualizado_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "blog_articulos",
    "columna": "slug",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "titulo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "artista",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "genero",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'vallenato'::text"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "nivel_dificultad",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": "1"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "duracion_segundos",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "bpm",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "afinacion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'FBE'::text"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "url_audio",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "url_audio_backing",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "url_audio_preview",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "letra",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "tags",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "dificultad_tecnica",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'principiante'::text"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "requiere_cambios_fuelle",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "requiere_acordes",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "requiere_bajos",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "xp_recompensa",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "monedas_recompensa",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "puntos_precision",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "tiempo_maximo_minutos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "10"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "precision_minima_requerida",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "75"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "intentos_maximos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "5"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'activa'::text"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "es_publica",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "es_premium",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "orden_mostrar",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "creador_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "canciones_simulador_acordeon",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "titulo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "artista",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "aire_vallenato",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "tonalidad",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "dificultad",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "tempo_bpm",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "120"
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "region_origen",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "puntos_completar",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "500"
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "xp_dominar",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "200"
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "monedas_completar",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "100"
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "veces_tocada",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "rating_promedio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "activa",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "canciones_vallenatas",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "categorias",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "uuid_generate_v4()"
  },
  {
    "tabla": "categorias",
    "columna": "nombre",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "categorias",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "categorias",
    "columna": "imagen_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "categorias",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "categorias",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "chats",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "chats",
    "columna": "nombre",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "chats",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "chats",
    "columna": "imagen_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "chats",
    "columna": "es_grupal",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "chats",
    "columna": "creado_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "chats",
    "columna": "actualizado_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "chats",
    "columna": "creado_por",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "chats",
    "columna": "ultimo_mensaje_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "chats",
    "columna": "ultimo_mensaje_fecha",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "chats",
    "columna": "activo",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "chats",
    "columna": "tipo_chat",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'privado'::character varying"
  },
  {
    "tabla": "chats",
    "columna": "configuracion",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "chats_envivo_academia",
    "columna": "id",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": "nextval('chats_envivo_academia_id_seq'::regclass)"
  },
  {
    "tabla": "chats_envivo_academia",
    "columna": "session_id",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "chats_envivo_academia",
    "columna": "message",
    "tipo": "jsonb",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "chats_envivo_academia",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "chats_envivo_academia",
    "columna": "chat_id",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "chats_envivo_academia",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comentarios",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "comentarios",
    "columna": "id_usuario",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comentarios",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comentarios",
    "columna": "comentario_padre_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comentarios",
    "columna": "texto",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comentarios",
    "columna": "fecha_comentario",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comentarios",
    "columna": "es_destacado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "comentarios",
    "columna": "es_instructor",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "comentarios",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comentarios",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comentarios_clases",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "uuid_generate_v4()"
  },
  {
    "tabla": "comentarios_clases",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_clases",
    "columna": "clase_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_clases",
    "columna": "contenido",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_clases",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comentarios_clases",
    "columna": "fecha_actualizacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comentarios_clases",
    "columna": "respuesta_a",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_clases",
    "columna": "likes",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "comentarios_cursos",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "uuid_generate_v4()"
  },
  {
    "tabla": "comentarios_cursos",
    "columna": "curso_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_cursos",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_cursos",
    "columna": "contenido",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_cursos",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comentarios_cursos",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comentarios_lecciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "uuid_generate_v4()"
  },
  {
    "tabla": "comentarios_lecciones",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_lecciones",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_lecciones",
    "columna": "contenido",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_lecciones",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comentarios_lecciones",
    "columna": "fecha_actualizacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comentarios_lecciones",
    "columna": "respuesta_a",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_lecciones",
    "columna": "likes",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "comentarios_tutorial",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "uuid_generate_v4()"
  },
  {
    "tabla": "comentarios_tutorial",
    "columna": "tutorial_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_tutorial",
    "columna": "seccion_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_tutorial",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_tutorial",
    "columna": "contenido",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comentarios_tutorial",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comentarios_tutorial",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comunidad_comentarios",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "comunidad_comentarios",
    "columna": "publicacion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_comentarios",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_comentarios",
    "columna": "usuario_nombre",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_comentarios",
    "columna": "usuario_avatar",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_comentarios",
    "columna": "comentario",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_comentarios",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "comunidad_comentarios",
    "columna": "comentario_padre_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_comentarios",
    "columna": "total_likes",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "comunidad_comentarios_likes",
    "columna": "id",
    "tipo": "bigint",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_comentarios_likes",
    "columna": "comentario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_comentarios_likes",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_comentarios_likes",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comunidad_encuesta_votos",
    "columna": "id",
    "tipo": "bigint",
    "nulo": "NO",
    "por_defecto": "nextval('comunidad_encuesta_votos_id_seq'::regclass)"
  },
  {
    "tabla": "comunidad_encuesta_votos",
    "columna": "publicacion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_encuesta_votos",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_encuesta_votos",
    "columna": "opcion",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_encuesta_votos",
    "columna": "fecha_voto",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "tipo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "url_imagen",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "url_video",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "url_gif",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "encuesta",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "me_gusta",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": "'{}'::uuid[]"
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "guardados",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": "'{}'::uuid[]"
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "visibilidad",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'publico'::text"
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'activo'::text"
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "usuario_nombre",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "total_likes",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "comunidad_publicaciones",
    "columna": "usuario_avatar",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_publicaciones_likes",
    "columna": "id",
    "tipo": "bigint",
    "nulo": "NO",
    "por_defecto": "nextval('comunidad_publicaciones_likes_id_seq'::regclass)"
  },
  {
    "tabla": "comunidad_publicaciones_likes",
    "columna": "publicacion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_publicaciones_likes",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "comunidad_publicaciones_likes",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "cursos",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "cursos",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "imagen_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "nivel",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "precio_normal",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "duracion_total",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "requisitos",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "objetivos",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "instructor_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "es_destacado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "cursos",
    "columna": "es_publico",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "cursos",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "cursos",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "cursos",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "duracion_estimada",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'borrador'::text"
  },
  {
    "tabla": "cursos",
    "columna": "tipo_acceso",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'gratuito'::text"
  },
  {
    "tabla": "cursos",
    "columna": "con_modulos",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "cursos",
    "columna": "conteo_lecciones",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "cursos",
    "columna": "slug",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "descripcion_corta",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "cursos",
    "columna": "creado_por",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "ultima_actualizacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "cursos",
    "columna": "fecha_actualizacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "cursos",
    "columna": "precio_rebajado",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "plantilla_vista",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'classic'::character varying"
  },
  {
    "tabla": "cursos",
    "columna": "fecha_expiracion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos",
    "columna": "estudiantes_inscritos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "cursos",
    "columna": "tipo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'Cursos'::text"
  },
  {
    "tabla": "cursos_publicados",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "imagen_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "nivel",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "precio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "duracion_total",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "requisitos",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "objetivos",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "instructor_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "es_destacado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "es_publico",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "duracion_estimada",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "cursos_publicados",
    "columna": "tipo_acceso",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "desafios_diarios",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "desafios_diarios",
    "columna": "titulo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "desafios_diarios",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "desafios_diarios",
    "columna": "tipo_desafio",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "desafios_diarios",
    "columna": "dificultad",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "desafios_diarios",
    "columna": "duracion_minutos",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "desafios_diarios",
    "columna": "objetivo_principal",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "desafios_diarios",
    "columna": "xp_completar",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "200"
  },
  {
    "tabla": "desafios_diarios",
    "columna": "monedas_completar",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "100"
  },
  {
    "tabla": "desafios_diarios",
    "columna": "activo",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "desafios_diarios",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "desafios_diarios",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "total_sesiones",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "tiempo_total_minutos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "precision_promedio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "lecciones_completadas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "canciones_aprendidas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "desafios_completados",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "racha_actual_dias",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "racha_maxima_dias",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "canciones_son",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "canciones_paseo",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "canciones_merengue",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "canciones_puya",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "estadisticas_acordeon",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "estadisticas_lecciones",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_lecciones",
    "columna": "total_usuarios_intentaron",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_lecciones",
    "columna": "total_usuarios_completaron",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_lecciones",
    "columna": "precision_promedio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_lecciones",
    "columna": "tiempo_promedio_segundos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_lecciones",
    "columna": "rating_promedio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_lecciones",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "estadisticas_lecciones",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "estadisticas_pagos",
    "columna": "total_pagos",
    "tipo": "bigint",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_pagos",
    "columna": "pagos_exitosos",
    "tipo": "bigint",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_pagos",
    "columna": "pagos_rechazados",
    "tipo": "bigint",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_pagos",
    "columna": "pagos_pendientes",
    "tipo": "bigint",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_pagos",
    "columna": "ingresos_totales",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_pagos",
    "columna": "ticket_promedio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_pagos",
    "columna": "usuarios_unicos",
    "tipo": "bigint",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "total_sesiones",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "tiempo_total_minutos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "primer_sesion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "ultima_sesion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "precision_maxima",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "precision_promedio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "notas_totales_tocadas",
    "tipo": "bigint",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "notas_correctas_totales",
    "tipo": "bigint",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "cursos_completados",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "tutoriales_completados",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "lecciones_completadas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "publicaciones_creadas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "likes_recibidos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "comentarios_hechos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "logros_totales",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "logros_faciles",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "logros_medios",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "logros_dificiles",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "logros_legendarios",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "racha_actual_dias",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "racha_maxima_dias",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "dias_activos_total",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "mejor_posicion_global",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "mejor_posicion_semanal",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "semanas_en_top_10",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "calculado_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "estadisticas_usuario",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "evaluaciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "evaluaciones",
    "columna": "titulo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "evaluaciones",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "evaluaciones",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "evaluaciones",
    "columna": "tipo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "evaluaciones",
    "columna": "puntos_maximos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "100"
  },
  {
    "tabla": "evaluaciones",
    "columna": "es_obligatorio",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "evaluaciones",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "evaluaciones",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "evaluaciones_practicas",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "evaluaciones_practicas",
    "columna": "evaluacion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "evaluaciones_practicas",
    "columna": "instrucciones",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "evaluaciones_practicas",
    "columna": "criterios_evaluacion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "evaluaciones_practicas",
    "columna": "tiempo_maximo_minutos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "evaluaciones_practicas",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "evaluaciones_practicas",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "eventos",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "eventos",
    "columna": "titulo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "descripcion_corta",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "slug",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "tipo_evento",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": "'masterclass'::character varying"
  },
  {
    "tabla": "eventos",
    "columna": "fecha_inicio",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "fecha_fin",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "es_todo_el_dia",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "eventos",
    "columna": "zona_horaria",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'America/Bogota'::character varying"
  },
  {
    "tabla": "eventos",
    "columna": "modalidad",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'online'::character varying"
  },
  {
    "tabla": "eventos",
    "columna": "ubicacion_fisica",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "link_transmision",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "enlace_grabacion",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "codigo_acceso",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "instructor_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "instructor_nombre",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "instructor_avatar",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "capacidad_maxima",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "100"
  },
  {
    "tabla": "eventos",
    "columna": "participantes_inscritos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "eventos",
    "columna": "precio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "eventos",
    "columna": "precio_rebajado",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "moneda",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'COP'::character varying"
  },
  {
    "tabla": "eventos",
    "columna": "es_gratuito",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "imagen_portada",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "imagen_banner",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "video_promocional",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "categoria",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "nivel_dificultad",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "tags",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "requiere_inscripcion",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "eventos",
    "columna": "acepta_invitados",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "eventos",
    "columna": "es_publico",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "eventos",
    "columna": "es_destacado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "eventos",
    "columna": "permite_grabacion",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "eventos",
    "columna": "estado",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'programado'::character varying"
  },
  {
    "tabla": "eventos",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "eventos",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "eventos",
    "columna": "creado_por",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "fecha_publicacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos",
    "columna": "total_visualizaciones",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "eventos",
    "columna": "calificacion_promedio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "eventos",
    "columna": "total_calificaciones",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "eventos_actividad",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "eventos_actividad",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_actividad",
    "columna": "tipo_evento",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "eventos_actividad",
    "columna": "pagina",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_actividad",
    "columna": "detalles",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_actividad",
    "columna": "timestamp_evento",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "eventos_actividad",
    "columna": "duracion_minutos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "1"
  },
  {
    "tabla": "eventos_comentarios",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "eventos_comentarios",
    "columna": "evento_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_comentarios",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_comentarios",
    "columna": "mensaje",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "eventos_comentarios",
    "columna": "tipo_mensaje",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'comentario'::character varying"
  },
  {
    "tabla": "eventos_comentarios",
    "columna": "mensaje_padre_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_comentarios",
    "columna": "es_destacado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "eventos_comentarios",
    "columna": "es_aprobado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "eventos_comentarios",
    "columna": "moderado_por",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_comentarios",
    "columna": "minuto_stream",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_comentarios",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "eventos_comentarios",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "evento_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "fecha_inscripcion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "estado_inscripcion",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'confirmado'::character varying"
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "pago_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "monto_pagado",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "fecha_pago",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "fecha_ultima_conexion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "tiempo_total_conectado",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "calificacion",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "comentario_calificacion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "fecha_calificacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "notas_usuario",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "notificaciones_habilitadas",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "eventos_inscripciones",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "eventos_materiales",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "eventos_materiales",
    "columna": "evento_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_materiales",
    "columna": "titulo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "eventos_materiales",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_materiales",
    "columna": "tipo_material",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_materiales",
    "columna": "url_archivo",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_materiales",
    "columna": "nombre_archivo",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_materiales",
    "columna": "tamano_archivo",
    "tipo": "bigint",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_materiales",
    "columna": "es_publico",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "eventos_materiales",
    "columna": "requiere_inscripcion",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "eventos_materiales",
    "columna": "disponible_antes_evento",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "eventos_materiales",
    "columna": "disponible_despues_evento",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "eventos_materiales",
    "columna": "orden_visualizacion",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "eventos_materiales",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "eventos_materiales",
    "columna": "subido_por",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_recordatorios",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "eventos_recordatorios",
    "columna": "evento_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_recordatorios",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_recordatorios",
    "columna": "tipo_recordatorio",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "eventos_recordatorios",
    "columna": "minutos_antes",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "eventos_recordatorios",
    "columna": "programado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "eventos_recordatorios",
    "columna": "enviado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "eventos_recordatorios",
    "columna": "fecha_programada",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_recordatorios",
    "columna": "fecha_envio",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_recordatorios",
    "columna": "mensaje_personalizado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_recordatorios",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "evento_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "numero_sesion",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "1"
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "titulo_sesion",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "descripcion_sesion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "hora_inicio",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "hora_fin",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "duracion_minutos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "link_streaming",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "link_grabacion",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "esta_activa",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "asistentes_pico",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "total_reproducciones",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "eventos_sesiones",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "nivel",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "1"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "xp_actual",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "xp_total",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "xp_siguiente_nivel",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "1000"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "xp_cursos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "xp_simulador",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "xp_comunidad",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "xp_logros",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "racha_dias",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "racha_maxima",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "ultima_sesion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "experiencia_usuario",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "grabaciones_estudiantes",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "grabaciones_estudiantes",
    "columna": "id_usuario",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "grabaciones_estudiantes",
    "columna": "evaluacion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "grabaciones_estudiantes",
    "columna": "titulo",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "grabaciones_estudiantes",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "grabaciones_estudiantes",
    "columna": "url_archivo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "grabaciones_estudiantes",
    "columna": "tipo_archivo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "grabaciones_estudiantes",
    "columna": "duracion_segundos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "grabaciones_estudiantes",
    "columna": "fecha_subida",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "grabaciones_estudiantes",
    "columna": "estado",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'pendiente'::character varying"
  },
  {
    "tabla": "grabaciones_estudiantes",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "grabaciones_estudiantes",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "inscripciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "uuid_generate_v4()"
  },
  {
    "tabla": "inscripciones",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "inscripciones",
    "columna": "curso_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "inscripciones",
    "columna": "fecha_inscripcion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "inscripciones",
    "columna": "porcentaje_completado",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "inscripciones",
    "columna": "completado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "inscripciones",
    "columna": "ultima_leccion_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "inscripciones",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "inscripciones",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "inscripciones",
    "columna": "estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'activo'::text"
  },
  {
    "tabla": "inscripciones",
    "columna": "ultima_actividad",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "inscripciones",
    "columna": "progreso",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "inscripciones",
    "columna": "tutorial_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "inscripciones",
    "columna": "tipo_acceso",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'gratuito'::character varying"
  },
  {
    "tabla": "inscripciones",
    "columna": "pago_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "inscripciones",
    "columna": "fecha_expiracion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "inscripciones",
    "columna": "paquete_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "insignias",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "insignias",
    "columna": "nombre",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "insignias",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "insignias",
    "columna": "imagen_url",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "insignias",
    "columna": "curso_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "insignias",
    "columna": "tipo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "insignias",
    "columna": "puntos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "10"
  },
  {
    "tabla": "insignias",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "insignias",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "insignias_usuarios",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "insignias_usuarios",
    "columna": "id_usuario",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "insignias_usuarios",
    "columna": "insignia_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "insignias_usuarios",
    "columna": "fecha_obtencion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "insignias_usuarios",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "leads_chat_anonimos",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "leads_chat_anonimos",
    "columna": "chat_id",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "leads_chat_anonimos",
    "columna": "nombre",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "leads_chat_anonimos",
    "columna": "email",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "leads_chat_anonimos",
    "columna": "whatsapp",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "leads_chat_anonimos",
    "columna": "tipo_consulta",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'general'::character varying"
  },
  {
    "tabla": "leads_chat_anonimos",
    "columna": "convertido_a_usuario",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "leads_chat_anonimos",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "leads_chat_anonimos",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "leads_chat_anonimos",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "lecciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "uuid_generate_v4()"
  },
  {
    "tabla": "lecciones",
    "columna": "curso_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "lecciones",
    "columna": "modulo_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "lecciones",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "lecciones",
    "columna": "tipo_contenido",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones",
    "columna": "contenido",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "lecciones",
    "columna": "video_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "lecciones",
    "columna": "orden",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones",
    "columna": "es_publicado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "lecciones",
    "columna": "created_at",
    "tipo": "timestamp without time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "lecciones",
    "columna": "updated_at",
    "tipo": "timestamp without time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "objetivo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "nivel",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "duracion_minutos",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "dificultad",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "status",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'borrador'::text"
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "secuencia_notas",
    "tipo": "ARRAY",
    "nulo": "NO",
    "por_defecto": "'{}'::text[]"
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "creador_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "lecciones_acordeon",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "lecciones_criterios",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "lecciones_criterios",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_criterios",
    "columna": "precision_minima",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_criterios",
    "columna": "tiempo_maximo_segundos",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_criterios",
    "columna": "intentos_maximos",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_criterios",
    "columna": "bonus_precision",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_criterios",
    "columna": "bonus_velocidad",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_criterios",
    "columna": "penalizacion_error",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_criterios",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "lecciones_estadisticas",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "lecciones_estadisticas",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_estadisticas",
    "columna": "total_usuarios_intentaron",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_estadisticas",
    "columna": "total_usuarios_completaron",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_estadisticas",
    "columna": "precision_promedio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_estadisticas",
    "columna": "tiempo_promedio_segundos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_estadisticas",
    "columna": "rating_promedio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_estadisticas",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "lecciones_progreso",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "lecciones_progreso",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_progreso",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_progreso",
    "columna": "estado",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'no_iniciada'::text"
  },
  {
    "tabla": "lecciones_progreso",
    "columna": "intentos_realizados",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_progreso",
    "columna": "mejor_precision",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_progreso",
    "columna": "mejor_tiempo",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_progreso",
    "columna": "fecha_completada",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_progreso",
    "columna": "xp_obtenido",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_progreso",
    "columna": "datos_sesion",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "lecciones_progreso",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "lecciones_progreso",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "progreso_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "intento_numero",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "duracion_segundos",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "notas_tocadas",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "notas_correctas",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "precision_final",
    "tipo": "numeric",
    "nulo": "NO",
    "por_defecto": "0"
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "completada",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "criterios_cumplidos",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "notas_detalle",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "lecciones_sesiones",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "logros_acordeon",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "logros_acordeon",
    "columna": "nombre",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "logros_acordeon",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "logros_acordeon",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "logros_acordeon",
    "columna": "dificultad",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'facil'::text"
  },
  {
    "tabla": "logros_acordeon",
    "columna": "condiciones",
    "tipo": "jsonb",
    "nulo": "NO",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "logros_acordeon",
    "columna": "xp_recompensa",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "100"
  },
  {
    "tabla": "logros_acordeon",
    "columna": "monedas_recompensa",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "50"
  },
  {
    "tabla": "logros_acordeon",
    "columna": "activo",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "logros_acordeon",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "logros_acordeon",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "logros_sistema",
    "columna": "id",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "logros_sistema",
    "columna": "nombre",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "logros_sistema",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "logros_sistema",
    "columna": "descripcion_corta",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "logros_sistema",
    "columna": "icono",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'🏆'::text"
  },
  {
    "tabla": "logros_sistema",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "logros_sistema",
    "columna": "dificultad",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "logros_sistema",
    "columna": "xp_recompensa",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "logros_sistema",
    "columna": "monedas_recompensa",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "logros_sistema",
    "columna": "titulo_especial",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "logros_sistema",
    "columna": "condiciones",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "logros_sistema",
    "columna": "activo",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "logros_sistema",
    "columna": "visible",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "logros_sistema",
    "columna": "orden_mostrar",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "logros_sistema",
    "columna": "fecha_inicio",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "logros_sistema",
    "columna": "fecha_fin",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "logros_sistema",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "logros_sistema",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "logros_usuario",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "logros_usuario",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "logros_usuario",
    "columna": "logro_id",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "logros_usuario",
    "columna": "conseguido",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "logros_usuario",
    "columna": "progreso_actual",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "logros_usuario",
    "columna": "progreso_objetivo",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "1"
  },
  {
    "tabla": "logros_usuario",
    "columna": "porcentaje_progreso",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0.0"
  },
  {
    "tabla": "logros_usuario",
    "columna": "datos_logro",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "logros_usuario",
    "columna": "conseguido_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "logros_usuario",
    "columna": "primer_progreso",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "logros_usuario",
    "columna": "ultimo_progreso",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "logros_usuario",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "logros_usuario",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "membresias",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "membresias",
    "columna": "nombre",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "membresias",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "membresias",
    "columna": "precio_mensual",
    "tipo": "numeric",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "membresias",
    "columna": "precio_anual",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "membresias",
    "columna": "color_hex",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'#6366f1'::text"
  },
  {
    "tabla": "membresias",
    "columna": "icono",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'🎵'::text"
  },
  {
    "tabla": "membresias",
    "columna": "orden",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "membresias",
    "columna": "activa",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "membresias",
    "columna": "destacada",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "membresias",
    "columna": "beneficios",
    "tipo": "jsonb",
    "nulo": "NO",
    "por_defecto": "'[]'::jsonb"
  },
  {
    "tabla": "membresias",
    "columna": "permisos",
    "tipo": "jsonb",
    "nulo": "NO",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "membresias",
    "columna": "tagline",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "membresias",
    "columna": "descuento_anual",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "20"
  },
  {
    "tabla": "membresias",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "membresias",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "mensajes",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "mensajes",
    "columna": "chat_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "mensajes",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "mensajes",
    "columna": "contenido",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "mensajes",
    "columna": "tipo",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'texto'::character varying"
  },
  {
    "tabla": "mensajes",
    "columna": "url_media",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "mensajes",
    "columna": "metadata",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "mensajes",
    "columna": "mensaje_padre_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "mensajes",
    "columna": "editado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "mensajes",
    "columna": "eliminado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "mensajes",
    "columna": "creado_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "mensajes",
    "columna": "editado_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "mensajes",
    "columna": "eliminado_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "mensajes_lectura",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "mensajes_lectura",
    "columna": "mensaje_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "mensajes_lectura",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "mensajes_lectura",
    "columna": "leido_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "mensajes_reacciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "mensajes_reacciones",
    "columna": "mensaje_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "mensajes_reacciones",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "mensajes_reacciones",
    "columna": "reaccion",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "mensajes_reacciones",
    "columna": "creado_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "miembros_chat",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "miembros_chat",
    "columna": "chat_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "miembros_chat",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "miembros_chat",
    "columna": "es_admin",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "miembros_chat",
    "columna": "puede_escribir",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "miembros_chat",
    "columna": "puede_invitar",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "miembros_chat",
    "columna": "unido_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "miembros_chat",
    "columna": "ultimo_acceso",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "miembros_chat",
    "columna": "notificaciones_activadas",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "miembros_chat",
    "columna": "mensajes_no_leidos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "miembros_chat",
    "columna": "estado_miembro",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'activo'::character varying"
  },
  {
    "tabla": "modulos",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "uuid_generate_v4()"
  },
  {
    "tabla": "modulos",
    "columna": "curso_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "modulos",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "modulos",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "modulos",
    "columna": "orden",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "modulos",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "modulos",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "monedas_usuario",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "monedas_usuario",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "monedas_usuario",
    "columna": "monedas_totales",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "monedas_usuario",
    "columna": "monedas_gastadas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "monedas_usuario",
    "columna": "monedas_disponibles",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "monedas_usuario",
    "columna": "monedas_logros",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "monedas_usuario",
    "columna": "monedas_ranking",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "monedas_usuario",
    "columna": "monedas_compradas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "monedas_usuario",
    "columna": "monedas_regaladas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "monedas_usuario",
    "columna": "transacciones_totales",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "monedas_usuario",
    "columna": "ultima_ganancia",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "monedas_usuario",
    "columna": "ultimo_gasto",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "monedas_usuario",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "monedas_usuario",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "notas_lecciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "notas_lecciones",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notas_lecciones",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notas_lecciones",
    "columna": "tipo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notas_lecciones",
    "columna": "contenido",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notas_lecciones",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "notas_lecciones",
    "columna": "fecha_actualizacion",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "notificaciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "notificaciones",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones",
    "columna": "tipo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones",
    "columna": "mensaje",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones",
    "columna": "icono",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'🔔'::text"
  },
  {
    "tabla": "notificaciones",
    "columna": "datos_adicionales",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "notificaciones",
    "columna": "url_accion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones",
    "columna": "entidad_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones",
    "columna": "entidad_tipo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones",
    "columna": "leida",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "notificaciones",
    "columna": "archivada",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "notificaciones",
    "columna": "prioridad",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'normal'::text"
  },
  {
    "tabla": "notificaciones",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "notificaciones",
    "columna": "fecha_lectura",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones",
    "columna": "fecha_expiracion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "ref_payco",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "estado_anterior",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "estado_nuevo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_cust_id_cliente",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_ref_payco",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_id_invoice",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_description",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_amount",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_amount_country",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_amount_ok",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_tax",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_amount_base",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_currency_code",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_date_transaction",
    "tipo": "timestamp without time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_approval_code",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_transaction_id",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_response",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_response_reason_text",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_cod_response",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_cod_transaction_state",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_signature",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_test_request",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_transaction_state",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_franchise",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_bank_name",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "x_cardnumber",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "ip_origen",
    "tipo": "inet",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "user_agent",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "datos_completos",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "procesado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "notificaciones_epayco",
    "columna": "processed_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "tipo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "titulo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "mensaje",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "icono",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'🎮'::character varying"
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "datos_notificacion",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "leida",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "mostrada",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "accion_realizada",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "prioridad",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'normal'::text"
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "estilo_visual",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'normal'::text"
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "fecha_expiracion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "leida_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "mostrada_en",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "notificaciones_gaming",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "notificaciones_plantillas",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "notificaciones_plantillas",
    "columna": "tipo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_plantillas",
    "columna": "titulo_plantilla",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_plantillas",
    "columna": "mensaje_plantilla",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_plantillas",
    "columna": "icono_default",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'🔔'::text"
  },
  {
    "tabla": "notificaciones_plantillas",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_plantillas",
    "columna": "activa",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "notificaciones_plantillas",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "notificaciones_preferencias",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "notificaciones_preferencias",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_preferencias",
    "columna": "tipo_notificacion",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "notificaciones_preferencias",
    "columna": "habilitado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "notificaciones_preferencias",
    "columna": "via_plataforma",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "notificaciones_preferencias",
    "columna": "via_email",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "notificaciones_preferencias",
    "columna": "via_push",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "notificaciones_preferencias",
    "columna": "frecuencia",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'inmediata'::text"
  },
  {
    "tabla": "notificaciones_preferencias",
    "columna": "horario_silencio_inicio",
    "tipo": "time without time zone",
    "nulo": "YES",
    "por_defecto": "'22:00:00'::time without time zone"
  },
  {
    "tabla": "notificaciones_preferencias",
    "columna": "horario_silencio_fin",
    "tipo": "time without time zone",
    "nulo": "YES",
    "por_defecto": "'08:00:00'::time without time zone"
  },
  {
    "tabla": "notificaciones_preferencias",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "notificaciones_preferencias",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "objetivos_admin",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "objetivos_admin",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "objetivos_admin",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "objetivos_admin",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "objetivos_admin",
    "columna": "estado",
    "tipo": "USER-DEFINED",
    "nulo": "NO",
    "por_defecto": "'pendiente'::estado_objetivo"
  },
  {
    "tabla": "objetivos_admin",
    "columna": "prioridad",
    "tipo": "USER-DEFINED",
    "nulo": "NO",
    "por_defecto": "'media'::prioridad_objetivo"
  },
  {
    "tabla": "objetivos_admin",
    "columna": "fecha_limite",
    "tipo": "date",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "objetivos_admin",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "objetivos_admin",
    "columna": "creado_por",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "opciones_respuesta",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "opciones_respuesta",
    "columna": "pregunta_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "opciones_respuesta",
    "columna": "texto",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "opciones_respuesta",
    "columna": "es_correcta",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "opciones_respuesta",
    "columna": "orden",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "opciones_respuesta",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "pagos_epayco",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "pagos_epayco",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "curso_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "tutorial_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "nombre_producto",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "valor",
    "tipo": "numeric",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "iva",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "pagos_epayco",
    "columna": "ico",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "pagos_epayco",
    "columna": "base_iva",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "pagos_epayco",
    "columna": "moneda",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'COP'::character varying"
  },
  {
    "tabla": "pagos_epayco",
    "columna": "ref_payco",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "factura",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "cod_respuesta",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "respuesta",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "estado",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'pendiente'::character varying"
  },
  {
    "tabla": "pagos_epayco",
    "columna": "metodo_pago",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "ip_cliente",
    "tipo": "inet",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "fecha_transaccion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "datos_adicionales",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "pagos_epayco",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "pagos_epayco",
    "columna": "documento_tipo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'CC'::text"
  },
  {
    "tabla": "pagos_epayco",
    "columna": "documento_numero",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "telefono",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "whatsapp",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "direccion_completa",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "ciudad",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "pais",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'Colombia'::text"
  },
  {
    "tabla": "pagos_epayco",
    "columna": "codigo_postal",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "fecha_nacimiento",
    "tipo": "date",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "profesion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "como_nos_conocio",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "user_agent",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "apellido",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "paquete_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "pagos_epayco",
    "columna": "membresia_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "descripcion_corta",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "imagen_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "precio_normal",
    "tipo": "numeric",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "precio_rebajado",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "descuento_porcentaje",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'borrador'::text"
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "nivel",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'principiante'::text"
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "destacado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "total_tutoriales",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "duracion_total_estimada",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "instructor_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "tipo_acceso",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'premium'::text"
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "fecha_expiracion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "objetivos",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "requisitos",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "incluye",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "ventajas",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "slug",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "meta_titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "meta_descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "tags",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "orden_mostrar",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "visible",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "paquetes_tutoriales",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "paquetes_tutoriales_items",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "paquetes_tutoriales_items",
    "columna": "paquete_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales_items",
    "columna": "tutorial_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales_items",
    "columna": "orden",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "1"
  },
  {
    "tabla": "paquetes_tutoriales_items",
    "columna": "incluido",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "paquetes_tutoriales_items",
    "columna": "precio_individual_referencia",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales_items",
    "columna": "notas",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "paquetes_tutoriales_items",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "partes_tutorial",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "partes_tutorial",
    "columna": "tutorial_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "partes_tutorial",
    "columna": "tipo_parte",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "partes_tutorial",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "partes_tutorial",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "partes_tutorial",
    "columna": "video_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "partes_tutorial",
    "columna": "orden",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "1"
  },
  {
    "tabla": "partes_tutorial",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "partes_tutorial",
    "columna": "slug",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "partes_tutorial",
    "columna": "contenido",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "partes_tutorial",
    "columna": "visible",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "partes_tutorial",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "partes_tutorial",
    "columna": "tipo_contenido",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'texto'::text"
  },
  {
    "tabla": "perfiles",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "nombre",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "apellido",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "nombre_usuario",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "url_foto_perfil",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "rol",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'user'::text"
  },
  {
    "tabla": "perfiles",
    "columna": "biografia",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "fecha_nacimiento",
    "tipo": "date",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "ciudad",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "pais",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "nivel_habilidad",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "instrumento",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "perfiles",
    "columna": "fecha_actualizacion",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "perfiles",
    "columna": "suscripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'free'::text"
  },
  {
    "tabla": "perfiles",
    "columna": "correo_electronico",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "portada_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "posicion_img_portada",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "eliminado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "perfiles",
    "columna": "nombre_completo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "whatsapp",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "objetivo_aprendizaje",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "ano_experiencia",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "estilo_favorito",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "estudios_musicales",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "documento_tipo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'CC'::text"
  },
  {
    "tabla": "perfiles",
    "columna": "documento_numero",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "direccion_completa",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "codigo_postal",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "profesion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "como_nos_conocio",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "membresia_activa_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "fecha_inicio_membresia",
    "tipo": "date",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "fecha_vencimiento_membresia",
    "tipo": "date",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "perfiles",
    "columna": "notificaciones_membresia",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "perfiles",
    "columna": "preferencias_membresia",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "perfiles",
    "columna": "nivel_usuario",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "1"
  },
  {
    "tabla": "perfiles",
    "columna": "experiencia_total",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "perfiles",
    "columna": "puntos_experiencia",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "perfiles",
    "columna": "racha_dias",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "perfiles",
    "columna": "logros_obtenidos",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'[]'::jsonb"
  },
  {
    "tabla": "perfiles",
    "columna": "insignias",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'[]'::jsonb"
  },
  {
    "tabla": "perfiles",
    "columna": "primera_vez",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "perfiles",
    "columna": "onboarding_completado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "perfiles",
    "columna": "ultima_actividad",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "perfiles",
    "columna": "configuracion_simulador",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{\"volumen\": 50, \"modo_practica\": \"libre\", \"mostrar_notas\": true, \"tono_favorito\": \"DO\", \"velocidad_metronomo\": 120, \"grabacion_automatica\": false}'::jsonb"
  },
  {
    "tabla": "perfiles",
    "columna": "preferencias_contenido",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{\"generos_favoritos\": [], \"artistas_favoritos\": [], \"dificultad_preferida\": \"intermedio\", \"notificaciones_contenido\": true}'::jsonb"
  },
  {
    "tabla": "perfiles",
    "columna": "updated_at",
    "tipo": "timestamp without time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "preguntas_quiz",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "preguntas_quiz",
    "columna": "evaluacion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "preguntas_quiz",
    "columna": "texto",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "preguntas_quiz",
    "columna": "tipo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "preguntas_quiz",
    "columna": "puntos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "10"
  },
  {
    "tabla": "preguntas_quiz",
    "columna": "orden",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "preguntas_quiz",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "preguntas_quiz",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "cancion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'iniciado'::text"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "mejor_precision",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "precision_actual",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "intentos_realizados",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "tiempo_practicado_minutos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "notas_totales_tocadas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "notas_correctas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "notas_incorrectas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "racha_maxima_notas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "promedio_timing_ms",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "errores_timing",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "cambios_fuelle_correctos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "progreso_secciones",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "xp_ganado",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "monedas_ganadas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "logros_desbloqueados",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": "'{}'::text[]"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "fecha_inicio",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "fecha_ultimo_intento",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "fecha_completado",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "fecha_perfecto",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_canciones_acordeon",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_canciones_vallenatas",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "progreso_canciones_vallenatas",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_canciones_vallenatas",
    "columna": "cancion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_canciones_vallenatas",
    "columna": "estado",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'no_iniciado'::text"
  },
  {
    "tabla": "progreso_canciones_vallenatas",
    "columna": "precision_maxima",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_vallenatas",
    "columna": "veces_tocada",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_vallenatas",
    "columna": "tiempo_practicado",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_canciones_vallenatas",
    "columna": "fecha_completado",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_canciones_vallenatas",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_canciones_vallenatas",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_desafios_diarios",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "progreso_desafios_diarios",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_desafios_diarios",
    "columna": "desafio_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_desafios_diarios",
    "columna": "estado",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'no_iniciado'::text"
  },
  {
    "tabla": "progreso_desafios_diarios",
    "columna": "precision_alcanzada",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_desafios_diarios",
    "columna": "tiempo_empleado",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_desafios_diarios",
    "columna": "puntuacion_final",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_desafios_diarios",
    "columna": "fecha_completado",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_desafios_diarios",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_desafios_diarios",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_estudiantes",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "uuid_generate_v4()"
  },
  {
    "tabla": "progreso_estudiantes",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_estudiantes",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_estudiantes",
    "columna": "completado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "progreso_estudiantes",
    "columna": "progreso",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_estudiantes",
    "columna": "tiempo_visto",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_estudiantes",
    "columna": "ultima_vista",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_estudiantes",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_estudiantes",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_lecciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "uuid_generate_v4()"
  },
  {
    "tabla": "progreso_lecciones",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_lecciones",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_lecciones",
    "columna": "estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_lecciones",
    "columna": "porcentaje_completado",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_lecciones",
    "columna": "tiempo_total",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_lecciones",
    "columna": "calificacion",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_lecciones",
    "columna": "notas",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_lecciones",
    "columna": "ultima_actividad",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_lecciones",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_lecciones",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_lecciones_acordeon",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "progreso_lecciones_acordeon",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_lecciones_acordeon",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_lecciones_acordeon",
    "columna": "estado",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'no_iniciado'::text"
  },
  {
    "tabla": "progreso_lecciones_acordeon",
    "columna": "precision_actual",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_lecciones_acordeon",
    "columna": "intentos_realizados",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_lecciones_acordeon",
    "columna": "tiempo_practicado",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_lecciones_acordeon",
    "columna": "fecha_completado",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_lecciones_acordeon",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_lecciones_acordeon",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "paquete_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "tutoriales_completados",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "tutoriales_totales",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "porcentaje_completado",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "ultimo_tutorial_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "ultima_actividad",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "completado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "fecha_completado",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "tiempo_total_visto",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_paquetes",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_retos",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "progreso_retos",
    "columna": "id_usuario",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_retos",
    "columna": "reto_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_retos",
    "columna": "progreso",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_retos",
    "columna": "completado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "progreso_retos",
    "columna": "fecha_completado",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_retos",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_retos",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_tutorial",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "uuid_generate_v4()"
  },
  {
    "tabla": "progreso_tutorial",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_tutorial",
    "columna": "tutorial_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_tutorial",
    "columna": "completado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "progreso_tutorial",
    "columna": "ultimo_acceso",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_tutorial",
    "columna": "tiempo_visto",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_tutorial",
    "columna": "parte_tutorial_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_tutorial",
    "columna": "fecha_inicio",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_tutorial",
    "columna": "fecha_actualizacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_usuario_lecciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "progreso_usuario_lecciones",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_usuario_lecciones",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "progreso_usuario_lecciones",
    "columna": "estado",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'no_iniciada'::text"
  },
  {
    "tabla": "progreso_usuario_lecciones",
    "columna": "intentos_realizados",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_usuario_lecciones",
    "columna": "mejor_precision",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_usuario_lecciones",
    "columna": "mejor_tiempo",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_usuario_lecciones",
    "columna": "xp_obtenido",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "progreso_usuario_lecciones",
    "columna": "fecha_completada",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "progreso_usuario_lecciones",
    "columna": "datos_sesion",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "progreso_usuario_lecciones",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "progreso_usuario_lecciones",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "ranking_global",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "ranking_global",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "ranking_global",
    "columna": "tipo_ranking",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "ranking_global",
    "columna": "puntuacion",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "ranking_global",
    "columna": "posicion",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "ranking_global",
    "columna": "posicion_anterior",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "ranking_global",
    "columna": "metricas",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "ranking_global",
    "columna": "periodo_inicio",
    "tipo": "date",
    "nulo": "YES",
    "por_defecto": "CURRENT_DATE"
  },
  {
    "tabla": "ranking_global",
    "columna": "periodo_fin",
    "tipo": "date",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "ranking_global",
    "columna": "temporada",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "ranking_global",
    "columna": "activo",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "ranking_global",
    "columna": "calculated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "ranking_global",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "ranking_global",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "reacciones_comentarios",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "reacciones_comentarios",
    "columna": "comentario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "reacciones_comentarios",
    "columna": "id_usuario",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "reacciones_comentarios",
    "columna": "tipo",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "reacciones_comentarios",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "retroalimentacion_grabaciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "retroalimentacion_grabaciones",
    "columna": "grabacion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "retroalimentacion_grabaciones",
    "columna": "instructor_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "retroalimentacion_grabaciones",
    "columna": "comentario",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "retroalimentacion_grabaciones",
    "columna": "calificacion",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "retroalimentacion_grabaciones",
    "columna": "fecha_revision",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "retroalimentacion_grabaciones",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "retroalimentacion_grabaciones",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "ritmos_vallenatos",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "ritmos_vallenatos",
    "columna": "nombre",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "ritmos_vallenatos",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "ritmos_vallenatos",
    "columna": "imagen_url",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "ritmos_vallenatos",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "ritmos_vallenatos",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "cancion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "nombre_secuencia",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'Secuencia principal'::character varying"
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "tolerancia_timing_ms",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "150"
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "auto_cuantizar",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "usar_metronomo",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "notas_secuencia",
    "tipo": "jsonb",
    "nulo": "NO",
    "por_defecto": "'[]'::jsonb"
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "marcadores_tiempo",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "total_notas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "duracion_total_ms",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "es_secuencia_principal",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "nivel_dificultad",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "1"
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'activa'::text"
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "secuencias_canciones_acordeon",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "cancion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "duracion_segundos",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "modo_practica",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'completa'::text"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "notas_tocadas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "notas_correctas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "precision_promedio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "errores_timing",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "cambios_fuelle",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "tempo_promedio",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "completado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "abandono_temprano",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "razon_abandono",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "datos_sesion",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "xp_ganado",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "monedas_ganadas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "sesiones_canciones_acordeon",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "leccion_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "progreso_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "intento_numero",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "duracion_segundos",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "notas_tocadas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "notas_correctas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "precision_final",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "completada",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "criterios_cumplidos",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "notas_detalle",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'[]'::jsonb"
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "sesiones_lecciones",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "duracion_minutos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "duracion_segundos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "tiempo_inicio",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "tiempo_fin",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "notas_tocadas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "notas_correctas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "notas_incorrectas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "precision_promedio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "bpm_promedio",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "escalas_practicadas",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "acordes_practicados",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "canciones_intentadas",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "afinacion_usada",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'FBE'::character varying"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "tipo_practica",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'libre'::text"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "xp_ganado",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "logros_desbloqueados",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "nivel_antes",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "1"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "nivel_despues",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "1"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "datos_sesion",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "sesiones_simulador",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "duracion_minutos",
    "tipo": "integer",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "tipo_sesion",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "notas_tocadas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "notas_correctas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "precision_promedio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "cambios_fuelle",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "afinacion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'FBE'::text"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "tempo_promedio",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "120"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "xp_ganado",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "monedas_ganadas",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "acordes_tocados",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "errores_timing",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_simulador_acordeon",
    "columna": "datos_sesion",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "sesiones_usuario",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "sesiones_usuario",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_usuario",
    "columna": "fecha",
    "tipo": "date",
    "nulo": "YES",
    "por_defecto": "CURRENT_DATE"
  },
  {
    "tabla": "sesiones_usuario",
    "columna": "tiempo_total_minutos",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_usuario",
    "columna": "sesiones_totales",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_usuario",
    "columna": "ultima_actividad",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "sesiones_usuario",
    "columna": "pagina_actual",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "sesiones_usuario",
    "columna": "esta_activo",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "sesiones_usuario",
    "columna": "tiempo_sesion_actual",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "sesiones_usuario",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "sesiones_usuario",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "membresia_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "estado",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'activa'::text"
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "fecha_inicio",
    "tipo": "date",
    "nulo": "NO",
    "por_defecto": "CURRENT_DATE"
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "fecha_vencimiento",
    "tipo": "date",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "fecha_cancelacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "fecha_pausada",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "precio_pagado",
    "tipo": "numeric",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "periodo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": "'mensual'::text"
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "auto_renovar",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "true"
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "intentos_renovacion",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "max_intentos_renovacion",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "3"
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "metodo_pago",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "transaction_id",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "ref_payco",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "datos_pago",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": "'{}'::jsonb"
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "notas_admin",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "razon_cancelacion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "origen_suscripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'web'::text"
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "suscripciones_usuario",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "tecnicas_acordeon",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "tecnicas_acordeon",
    "columna": "nombre",
    "tipo": "character varying",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "tecnicas_acordeon",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tecnicas_acordeon",
    "columna": "nivel_recomendado",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tecnicas_acordeon",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "tecnicas_acordeon",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "tutoriales",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "tutoriales",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "imagen_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "nivel",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "instructor_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "duracion_estimada",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "tutoriales",
    "columna": "estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'borrador'::text"
  },
  {
    "tabla": "tutoriales",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "tutoriales",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": "now()"
  },
  {
    "tabla": "tutoriales",
    "columna": "artista",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "acordeonista",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "tonalidad",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "precio_normal",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": "0"
  },
  {
    "tabla": "tutoriales",
    "columna": "tipo_acceso",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": "'pago'::text"
  },
  {
    "tabla": "tutoriales",
    "columna": "destacado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": "false"
  },
  {
    "tabla": "tutoriales",
    "columna": "duracion",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": "30"
  },
  {
    "tabla": "tutoriales",
    "columna": "video_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "precio_rebajado",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "plantilla_vista",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": "'classic'::character varying"
  },
  {
    "tabla": "tutoriales",
    "columna": "fecha_expiracion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "objetivos",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "requisitos",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "tutoriales",
    "columna": "descripcion_corta",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "usuario_imagenes",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "usuario_imagenes",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "usuario_imagenes",
    "columna": "url_imagen",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "usuario_imagenes",
    "columna": "tipo",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "usuario_imagenes",
    "columna": "fecha_subida",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "usuario_imagenes",
    "columna": "es_actual",
    "tipo": "boolean",
    "nulo": "NO",
    "por_defecto": "false"
  },
  {
    "tabla": "usuario_imagenes_comentarios",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": "gen_random_uuid()"
  },
  {
    "tabla": "usuario_imagenes_comentarios",
    "columna": "imagen_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "usuario_imagenes_comentarios",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "usuario_imagenes_comentarios",
    "columna": "usuario_nombre",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "usuario_imagenes_comentarios",
    "columna": "usuario_avatar",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "usuario_imagenes_comentarios",
    "columna": "comentario",
    "tipo": "text",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "usuario_imagenes_comentarios",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "usuario_imagenes_comentarios",
    "columna": "comentario_padre_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "usuario_imagenes_likes",
    "columna": "id",
    "tipo": "bigint",
    "nulo": "NO",
    "por_defecto": "nextval('usuario_imagenes_likes_id_seq'::regclass)"
  },
  {
    "tabla": "usuario_imagenes_likes",
    "columna": "imagen_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "usuario_imagenes_likes",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "NO",
    "por_defecto": null
  },
  {
    "tabla": "usuario_imagenes_likes",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "NO",
    "por_defecto": "now()"
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "imagen_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "nivel",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "precio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "duracion_total",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "requisitos",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "objetivos",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "instructor_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "es_destacado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "es_publico",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "duracion_estimada",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "tipo_acceso",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "con_modulos",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "leccion_count",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "slug",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "descripcion_corta",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "creado_por",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "ultima_actualizacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_completa",
    "columna": "fecha_actualizacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_minima",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_minima",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_minima",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_minima",
    "columna": "imagen_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_minima",
    "columna": "slug",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_cursos_minima",
    "columna": "precio",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "tipo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "mensaje",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "icono",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "datos_adicionales",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "url_accion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "entidad_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "entidad_tipo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "leida",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "archivada",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "prioridad",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "fecha_creacion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "fecha_lectura",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "fecha_expiracion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "nombre_completo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "url_foto_perfil",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "correo_electronico",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_notificaciones",
    "columna": "tiempo_transcurrido",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "curso_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "tutorial_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "nombre_producto",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "valor",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "iva",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "ico",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "base_iva",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "moneda",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "ref_payco",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "factura",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "cod_respuesta",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "respuesta",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "estado",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "metodo_pago",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "ip_cliente",
    "tipo": "inet",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "fecha_transaccion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "datos_adicionales",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "usuario_nombre",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "usuario_email",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "curso_titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "curso_slug",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "curso_imagen",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "tutorial_titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "tutorial_imagen",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_completa",
    "columna": "tipo_contenido",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_problematicos",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_problematicos",
    "columna": "ref_payco",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_problematicos",
    "columna": "nombre_producto",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_problematicos",
    "columna": "valor",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_problematicos",
    "columna": "estado",
    "tipo": "character varying",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_problematicos",
    "columna": "fecha_pago",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_problematicos",
    "columna": "nombre_usuario",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_problematicos",
    "columna": "correo_electronico",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_problematicos",
    "columna": "ultimo_update_epayco",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_pagos_problematicos",
    "columna": "alerta",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "descripcion_corta",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "imagen_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "precio_normal",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "precio_rebajado",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "descuento_porcentaje",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "categoria",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "nivel",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "destacado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "total_tutoriales",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "duracion_total_estimada",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "instructor_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "tipo_acceso",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "fecha_expiracion",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "objetivos",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "requisitos",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "incluye",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "ventajas",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "slug",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "meta_titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "meta_descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "tags",
    "tipo": "ARRAY",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "orden_mostrar",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "visible",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "tutoriales_incluidos",
    "tipo": "bigint",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "duracion_calculada",
    "tipo": "bigint",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "precio_total_individual",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_paquetes_completos",
    "columna": "porcentaje_ahorro_real",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "usuario_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "paquete_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "tutoriales_completados",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "tutoriales_totales",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "porcentaje_completado",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "ultimo_tutorial_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "ultima_actividad",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "completado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "fecha_completado",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "tiempo_total_visto",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "paquete_titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "paquete_imagen",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "total_tutoriales",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_progreso_usuario_paquetes",
    "columna": "porcentaje_real",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "user_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "nombre_usuario",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "nombre_completo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "correo_electronico",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "url_foto_perfil",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "suscripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "nombre",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "apellido",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "rol",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "biografia",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "ciudad",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "pais",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "nivel_habilidad",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "instrumento",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "whatsapp",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "objetivo_aprendizaje",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "ano_experiencia",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "estilo_favorito",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "membresia_nombre",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "membresia_descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "membresia_color",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "membresia_permisos",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "fecha_inicio_membresia",
    "tipo": "date",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "fecha_vencimiento_membresia",
    "tipo": "date",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "suscripcion_estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "precio_pagado",
    "tipo": "numeric",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "periodo_pago",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "dias_restantes",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "nivel_usuario",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "experiencia_total",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "puntos_experiencia",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "racha_dias",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "logros_obtenidos",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "insignias",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "primera_vez",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "onboarding_completado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "ultima_actividad",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "configuracion_simulador",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "preferencias_contenido",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "preferencias_membresia",
    "tipo": "jsonb",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vista_usuario_completo",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "curso_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "modulo_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "tipo_contenido",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "contenido",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "video_url",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "orden",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "es_publicado",
    "tipo": "boolean",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "created_at",
    "tipo": "timestamp without time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "updated_at",
    "tipo": "timestamp without time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "modulo_titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "modulo_curso_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_lecciones_completas",
    "columna": "curso_titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_modulos_con_cursos",
    "columna": "id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_modulos_con_cursos",
    "columna": "curso_id",
    "tipo": "uuid",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_modulos_con_cursos",
    "columna": "titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_modulos_con_cursos",
    "columna": "descripcion",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_modulos_con_cursos",
    "columna": "orden",
    "tipo": "integer",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_modulos_con_cursos",
    "columna": "created_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_modulos_con_cursos",
    "columna": "updated_at",
    "tipo": "timestamp with time zone",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_modulos_con_cursos",
    "columna": "curso_titulo",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_modulos_con_cursos",
    "columna": "curso_imagen",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  },
  {
    "tabla": "vw_modulos_con_cursos",
    "columna": "curso_estado",
    "tipo": "text",
    "nulo": "YES",
    "por_defecto": null
  }
]