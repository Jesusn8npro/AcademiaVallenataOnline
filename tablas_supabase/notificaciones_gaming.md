[
  {
    "tabla": "notificaciones_gaming",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "usuario_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "tipo",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "titulo",
    "data_type": "character varying",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "mensaje",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "icono",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": "'🎮'::character varying"
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "datos_notificacion",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": "'{}'::jsonb"
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "leida",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "mostrada",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "accion_realizada",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "prioridad",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'normal'::text"
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "estilo_visual",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'normal'::text"
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "fecha_expiracion",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "leida_en",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "mostrada_en",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "tabla": "notificaciones_gaming",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  }
]