[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "column_name": "categoria",
    "data_type": "text",
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
    "column_name": "estado",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'pendiente'::estado_objetivo"
  },
  {
    "column_name": "prioridad",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": "'media'::prioridad_objetivo"
  },
  {
    "column_name": "fecha_limite",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "fecha_creacion",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "column_name": "creado_por",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  }
]