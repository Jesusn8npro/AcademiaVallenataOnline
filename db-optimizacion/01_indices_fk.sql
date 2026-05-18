-- ============================================================================
-- 01 — ÍNDICES PARA FOREIGN KEYS SIN COBERTURA  (45 FKs detectadas)
-- ============================================================================
-- Problema: 45 foreign keys sin índice => JOINs y borrados lentos en tablas
-- calientes (inscripciones, mensajes, pagos_epayco, eventos_actividad 8.5k...).
-- Impacto: consultas más rápidas. Comportamiento de datos IDÉNTICO (un índice
-- no cambia resultados, solo acelera).
--
-- CÓMO USAR (seguro, en 2 pasos):
--   PASO A: ejecuta SOLO el SELECT de abajo. Te DEVUELVE los CREATE INDEX
--           exactos (auto-generados desde el catálogo: nunca se equivoca de
--           columna).
--   PASO B: revisa esa lista y ejecútala. Usa CREATE INDEX CONCURRENTLY =>
--           NO bloquea las tablas en producción (los usuarios siguen usando
--           la app mientras se crea el índice).
--
-- Nota: CONCURRENTLY no puede correr dentro de una transacción; ejecútalos
-- uno por uno o en un script sin BEGIN/COMMIT.
-- ============================================================================

-- PASO A — genera los comandos (ejecuta esto y copia el resultado):
SELECT
  format(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS %I ON %I.%I (%s);',
    'idx_' || c.conrelid::regclass::text || '_' ||
      array_to_string(array(
        SELECT a.attname FROM pg_attribute a
        WHERE a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
        ORDER BY array_position(c.conkey, a.attnum)
      ), '_'),
    n.nspname,
    rel.relname,
    (SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY array_position(c.conkey, a.attnum))
       FROM pg_attribute a
      WHERE a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey))
  ) AS comando_crear_indice
FROM pg_constraint c
JOIN pg_class rel ON rel.oid = c.conrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE c.contype = 'f'
  AND n.nspname = 'public'
  -- solo FKs que NO tienen ya un índice que cubra sus columnas:
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid
      AND (c.conkey::int[]) <@ (i.indkey::int[])
  )
ORDER BY rel.relname;

-- PASO B — pega aquí (o ejecuta) la salida del SELECT anterior.
-- Ejemplo de cómo se verán (NO ejecutar estos a ciegas, usa los generados):
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chats_creado_por ON public.chats (creado_por);
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mensajes_chat_id ON public.mensajes (chat_id);
