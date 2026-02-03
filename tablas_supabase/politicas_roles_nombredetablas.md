[
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios",
    "policyname": "Permitir borrar solo propio comentario",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(auth.uid() = usuario_id)"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios",
    "policyname": "Permitir insertar comentarios comunidad",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios",
    "policyname": "Permitir leer comentarios comunidad",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios",
    "policyname": "Permitir modificar solo propio comentario",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = usuario_id)"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios",
    "policyname": "allow_update_from_trigger",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "true"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios",
    "policyname": "comentarios_delete_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "((usuario_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM perfiles\n  WHERE ((perfiles.id = auth.uid()) AND (perfiles.rol = 'admin'::text)))))"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios",
    "policyname": "comentarios_insert_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios",
    "policyname": "comentarios_select_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM comunidad_publicaciones cp\n  WHERE ((cp.id = comunidad_comentarios.publicacion_id) AND (cp.estado = 'activo'::text))))"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios",
    "policyname": "comentarios_update_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((usuario_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM perfiles\n  WHERE ((perfiles.id = auth.uid()) AND (perfiles.rol = 'admin'::text)))))"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios_likes",
    "policyname": "delete_own_like",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(auth.uid() = usuario_id)"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios_likes",
    "policyname": "insert_own_like",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios_likes",
    "policyname": "likes_delete_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(usuario_id = auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios_likes",
    "policyname": "likes_insert_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios_likes",
    "policyname": "likes_select_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_comentarios_likes",
    "policyname": "select_likes",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_publicaciones",
    "policyname": "Actualizar si soy el usuario",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = usuario_id)"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_publicaciones",
    "policyname": "Admin puede todo",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM perfiles\n  WHERE ((perfiles.id = auth.uid()) AND (perfiles.rol = 'admin'::text))))"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_publicaciones",
    "policyname": "Eliminar si soy el usuario",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "(auth.uid() = usuario_id)"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_publicaciones",
    "policyname": "Insertar si soy el usuario",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_publicaciones",
    "policyname": "Leer mis publicaciones",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = usuario_id)"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_publicaciones",
    "policyname": "Leer publicaciones públicas",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(visibilidad = 'publico'::text)"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_publicaciones",
    "policyname": "publicaciones_delete_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "DELETE",
    "qual": "((usuario_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM perfiles\n  WHERE ((perfiles.id = auth.uid()) AND (perfiles.rol = 'admin'::text)))))"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_publicaciones",
    "policyname": "publicaciones_insert_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_publicaciones",
    "policyname": "publicaciones_select_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((estado = 'activo'::text) OR (auth.uid() IS NOT NULL))"
  },
  {
    "schemaname": "public",
    "tablename": "comunidad_publicaciones",
    "policyname": "publicaciones_update_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "((usuario_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM perfiles\n  WHERE ((perfiles.id = auth.uid()) AND (perfiles.rol = 'admin'::text)))))"
  }
]