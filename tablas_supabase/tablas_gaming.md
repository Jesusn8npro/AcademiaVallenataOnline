[
  {
    "table_name": "estadisticas_usuario",
    "constraint_name": "estadisticas_usuario_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id"
  },
  {
    "table_name": "estadisticas_usuario",
    "constraint_name": "estadisticas_usuario_usuario_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "usuario_id"
  },
  {
    "table_name": "experiencia_usuario",
    "constraint_name": "experiencia_usuario_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id"
  },
  {
    "table_name": "experiencia_usuario",
    "constraint_name": "experiencia_usuario_usuario_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "usuario_id"
  },
  {
    "table_name": "logros_sistema",
    "constraint_name": "logros_sistema_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id"
  },
  {
    "table_name": "logros_usuario",
    "constraint_name": "logros_usuario_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id"
  },
  {
    "table_name": "logros_usuario",
    "constraint_name": "logros_usuario_usuario_id_logro_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "logro_id"
  },
  {
    "table_name": "logros_usuario",
    "constraint_name": "logros_usuario_usuario_id_logro_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "usuario_id"
  },
  {
    "table_name": "monedas_usuario",
    "constraint_name": "monedas_usuario_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id"
  },
  {
    "table_name": "monedas_usuario",
    "constraint_name": "monedas_usuario_usuario_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "usuario_id"
  },
  {
    "table_name": "notificaciones_gaming",
    "constraint_name": "notificaciones_gaming_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id"
  },
  {
    "table_name": "ranking_global",
    "constraint_name": "ranking_global_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id"
  },
  {
    "table_name": "ranking_global",
    "constraint_name": "ranking_global_usuario_id_tipo_ranking_periodo_inicio_key",
    "constraint_type": "UNIQUE",
    "column_name": "periodo_inicio"
  },
  {
    "table_name": "ranking_global",
    "constraint_name": "ranking_global_usuario_id_tipo_ranking_periodo_inicio_key",
    "constraint_type": "UNIQUE",
    "column_name": "tipo_ranking"
  },
  {
    "table_name": "ranking_global",
    "constraint_name": "ranking_global_usuario_id_tipo_ranking_periodo_inicio_key",
    "constraint_type": "UNIQUE",
    "column_name": "usuario_id"
  },
  {
    "table_name": "sesiones_simulador",
    "constraint_name": "sesiones_simulador_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id"
  }
]