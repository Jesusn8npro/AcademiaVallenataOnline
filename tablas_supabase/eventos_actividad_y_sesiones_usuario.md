[
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
  }
]