[
  {
    "table_name": "chats",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "chats",
    "column_name": "nombre",
    "data_type": "text"
  },
  {
    "table_name": "chats",
    "column_name": "descripcion",
    "data_type": "text"
  },
  {
    "table_name": "chats",
    "column_name": "imagen_url",
    "data_type": "text"
  },
  {
    "table_name": "chats",
    "column_name": "es_grupal",
    "data_type": "boolean"
  },
  {
    "table_name": "chats",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "chats",
    "column_name": "actualizado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "chats",
    "column_name": "creado_por",
    "data_type": "uuid"
  },
  {
    "table_name": "chats",
    "column_name": "ultimo_mensaje_id",
    "data_type": "uuid"
  },
  {
    "table_name": "chats",
    "column_name": "ultimo_mensaje_fecha",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "chats",
    "column_name": "activo",
    "data_type": "boolean"
  },
  {
    "table_name": "chats",
    "column_name": "tipo_chat",
    "data_type": "character varying"
  },
  {
    "table_name": "chats",
    "column_name": "configuracion",
    "data_type": "jsonb"
  },
  {
    "table_name": "mensajes",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "mensajes",
    "column_name": "chat_id",
    "data_type": "uuid"
  },
  {
    "table_name": "mensajes",
    "column_name": "usuario_id",
    "data_type": "uuid"
  },
  {
    "table_name": "mensajes",
    "column_name": "contenido",
    "data_type": "text"
  },
  {
    "table_name": "mensajes",
    "column_name": "tipo",
    "data_type": "character varying"
  },
  {
    "table_name": "mensajes",
    "column_name": "url_media",
    "data_type": "text"
  },
  {
    "table_name": "mensajes",
    "column_name": "metadata",
    "data_type": "jsonb"
  },
  {
    "table_name": "mensajes",
    "column_name": "mensaje_padre_id",
    "data_type": "uuid"
  },
  {
    "table_name": "mensajes",
    "column_name": "editado",
    "data_type": "boolean"
  },
  {
    "table_name": "mensajes",
    "column_name": "eliminado",
    "data_type": "boolean"
  },
  {
    "table_name": "mensajes",
    "column_name": "creado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "mensajes",
    "column_name": "editado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "mensajes",
    "column_name": "eliminado_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "miembros_chat",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "miembros_chat",
    "column_name": "chat_id",
    "data_type": "uuid"
  },
  {
    "table_name": "miembros_chat",
    "column_name": "usuario_id",
    "data_type": "uuid"
  },
  {
    "table_name": "miembros_chat",
    "column_name": "es_admin",
    "data_type": "boolean"
  },
  {
    "table_name": "miembros_chat",
    "column_name": "puede_escribir",
    "data_type": "boolean"
  },
  {
    "table_name": "miembros_chat",
    "column_name": "puede_invitar",
    "data_type": "boolean"
  },
  {
    "table_name": "miembros_chat",
    "column_name": "unido_en",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "miembros_chat",
    "column_name": "ultimo_acceso",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "miembros_chat",
    "column_name": "notificaciones_activadas",
    "data_type": "boolean"
  },
  {
    "table_name": "miembros_chat",
    "column_name": "mensajes_no_leidos",
    "data_type": "integer"
  },
  {
    "table_name": "miembros_chat",
    "column_name": "estado_miembro",
    "data_type": "character varying"
  }
]