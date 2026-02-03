[
  {
    "table_name": "eventos",
    "column_name": "creado_por",
    "foreign_table_name": "perfiles",
    "foreign_column_name": "id",
    "constraint_name": "eventos_creado_por_fkey"
  },
  {
    "table_name": "eventos",
    "column_name": "instructor_id",
    "foreign_table_name": "perfiles",
    "foreign_column_name": "id",
    "constraint_name": "eventos_instructor_id_fkey"
  },
  {
    "table_name": "eventos_inscripciones",
    "column_name": "evento_id",
    "foreign_table_name": "eventos",
    "foreign_column_name": "id",
    "constraint_name": "eventos_inscripciones_evento_id_fkey"
  },
  {
    "table_name": "eventos_inscripciones",
    "column_name": "pago_id",
    "foreign_table_name": "pagos_epayco",
    "foreign_column_name": "id",
    "constraint_name": "eventos_inscripciones_pago_id_fkey"
  },
  {
    "table_name": "eventos_inscripciones",
    "column_name": "usuario_id",
    "foreign_table_name": "perfiles",
    "foreign_column_name": "id",
    "constraint_name": "eventos_inscripciones_usuario_id_fkey"
  },
  {
    "table_name": "eventos_recordatorios",
    "column_name": "evento_id",
    "foreign_table_name": "eventos",
    "foreign_column_name": "id",
    "constraint_name": "eventos_recordatorios_evento_id_fkey"
  },
  {
    "table_name": "eventos_recordatorios",
    "column_name": "usuario_id",
    "foreign_table_name": "perfiles",
    "foreign_column_name": "id",
    "constraint_name": "eventos_recordatorios_usuario_id_fkey"
  },
  {
    "table_name": "eventos_sesiones",
    "column_name": "evento_id",
    "foreign_table_name": "eventos",
    "foreign_column_name": "id",
    "constraint_name": "eventos_sesiones_evento_id_fkey"
  },
  {
    "table_name": "eventos_materiales",
    "column_name": "evento_id",
    "foreign_table_name": "eventos",
    "foreign_column_name": "id",
    "constraint_name": "eventos_materiales_evento_id_fkey"
  },
  {
    "table_name": "eventos_materiales",
    "column_name": "subido_por",
    "foreign_table_name": "perfiles",
    "foreign_column_name": "id",
    "constraint_name": "eventos_materiales_subido_por_fkey"
  },
  {
    "table_name": "eventos_comentarios",
    "column_name": "evento_id",
    "foreign_table_name": "eventos",
    "foreign_column_name": "id",
    "constraint_name": "eventos_comentarios_evento_id_fkey"
  },
  {
    "table_name": "eventos_comentarios",
    "column_name": "mensaje_padre_id",
    "foreign_table_name": "eventos_comentarios",
    "foreign_column_name": "id",
    "constraint_name": "eventos_comentarios_mensaje_padre_id_fkey"
  },
  {
    "table_name": "eventos_comentarios",
    "column_name": "moderado_por",
    "foreign_table_name": "perfiles",
    "foreign_column_name": "id",
    "constraint_name": "eventos_comentarios_moderado_por_fkey"
  },
  {
    "table_name": "eventos_comentarios",
    "column_name": "usuario_id",
    "foreign_table_name": "perfiles",
    "foreign_column_name": "id",
    "constraint_name": "eventos_comentarios_usuario_id_fkey"
  },
  {
    "table_name": "inscripciones",
    "column_name": "curso_id",
    "foreign_table_name": "cursos",
    "foreign_column_name": "id",
    "constraint_name": "fk_inscripciones_curso"
  },
  {
    "table_name": "inscripciones",
    "column_name": "pago_id",
    "foreign_table_name": "pagos_epayco",
    "foreign_column_name": "id",
    "constraint_name": "inscripciones_pago_id_fkey"
  },
  {
    "table_name": "inscripciones",
    "column_name": "paquete_id",
    "foreign_table_name": "paquetes_tutoriales",
    "foreign_column_name": "id",
    "constraint_name": "inscripciones_paquete_id_fkey"
  },
  {
    "table_name": "inscripciones",
    "column_name": "usuario_id",
    "foreign_table_name": "perfiles",
    "foreign_column_name": "id",
    "constraint_name": "inscripciones_usuario_id_fkey"
  }
]