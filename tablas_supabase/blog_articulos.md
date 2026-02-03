| column_name        | data_type                | is_nullable | column_default    |
| ------------------ | ------------------------ | ----------- | ----------------- |
| id                 | uuid                     | NO          | gen_random_uuid() |
| slug               | text                     | NO          | null              |
| titulo             | text                     | NO          | null              |
| autor              | text                     | NO          | null              |
| autor_iniciales    | text                     | YES         | null              |
| fecha_publicacion  | timestamp with time zone | NO          | now()             |
| lectura_min        | integer                  | NO          | null              |
| calificacion       | numeric                  | YES         | null              |
| portada_url        | text                     | YES         | null              |
| resumen_breve      | text                     | YES         | null              |
| resumen_completo   | text                     | YES         | null              |
| secciones          | jsonb                    | NO          | null              |
| cta                | jsonb                    | YES         | null              |
| estado_publicacion | text                     | NO          | 'borrador'::text  |
| creado_en          | timestamp with time zone | NO          | now()             |
| actualizado_en     | timestamp with time zone | NO          | now()             |
| autor_id           | uuid                     | YES         | null              |
| meta_titulo        | text                     | YES         | null              |
| meta_descripcion   | text                     | YES         | null              |
| meta_keywords      | text                     | YES         | null              |
| canonical_url      | text                     | YES         | null              |
| og_titulo          | text                     | YES         | null              |
| og_descripcion     | text                     | YES         | null              |
| og_imagen_url      | text                     | YES         | null              |
| twitter_card       | text                     | YES         | null              |