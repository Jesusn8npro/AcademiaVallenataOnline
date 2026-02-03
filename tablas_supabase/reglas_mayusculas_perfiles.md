[
  {
    "nombre_de_la_regla": "profiles_id_check",
    "definicion_de_la_regla": "CHECK ((id IS NOT NULL))"
  },
  {
    "nombre_de_la_regla": "profiles_nivel_habilidad_check",
    "definicion_de_la_regla": "CHECK ((nivel_habilidad = ANY (ARRAY['principiante'::text, 'intermedio'::text, 'avanzado'::text])))"
  },
  {
    "nombre_de_la_regla": "profiles_rol_check",
    "definicion_de_la_regla": "CHECK ((rol = ANY (ARRAY['user'::text, 'admin'::text, 'student'::text, 'teacher'::text, 'moderator'::text, 'profesor'::text, 'estudiante'::text])))"
  },
  {
    "nombre_de_la_regla": "profiles_role_check",
    "definicion_de_la_regla": "CHECK ((rol = ANY (ARRAY['estudiante'::text, 'profesor'::text, 'admin'::text])))"
  }
]