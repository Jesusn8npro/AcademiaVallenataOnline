[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "column_name": "usuario_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "titulo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "descripcion",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "url_imagen",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "url_video",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "url_gif",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "encuesta",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "me_gusta",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "column_default": "'{}'::uuid[]"
  },
  {
    "column_name": "guardados",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "column_default": "'{}'::uuid[]"
  },
  {
    "column_name": "fecha_creacion",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "column_name": "visibilidad",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'publico'::text"
  },
  {
    "column_name": "estado",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'activo'::text"
  },
  {
    "column_name": "usuario_nombre",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "usuario_avatar",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  }
]