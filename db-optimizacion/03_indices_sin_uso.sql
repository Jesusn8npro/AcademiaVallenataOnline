-- ============================================================================
-- 03 — ÍNDICES SIN USO  (42 detectados) — REVISAR con cuidado
-- ============================================================================
-- Índices que nunca se usaron en la ventana medida => ocupan espacio y
-- RALENTIZAN las escrituras (cada INSERT/UPDATE actualiza el índice).
--
-- ⚠️ PRECAUCIÓN: "sin uso" se midió en una ventana de tiempo. Un índice puede
-- ser estacional (reportes mensuales, etc.). NO borrar a ciegas. Recomendado:
-- esperar a tener estadísticas de un ciclo completo de tráfico y revisar.
--
-- PASO A — lista los índices sin uso reales con su tamaño (ejecuta y revisa):
SELECT
  s.schemaname,
  s.relname        AS tabla,
  s.indexrelname   AS indice,
  pg_size_pretty(pg_relation_size(s.indexrelid)) AS tamano,
  s.idx_scan       AS veces_usado
FROM pg_stat_user_indexes s
JOIN pg_index i ON i.indexrelid = s.indexrelid
WHERE s.schemaname = 'public'
  AND s.idx_scan = 0
  AND NOT i.indisprimary
  AND NOT i.indisunique          -- no tocar índices que validan unicidad
ORDER BY pg_relation_size(s.indexrelid) DESC;

-- PASO B — para los que CONFIRMES que sobran, genera los DROP (revisa antes):
-- SELECT 'DROP INDEX CONCURRENTLY IF EXISTS public.' || quote_ident(s.indexrelname) || ';'
-- FROM pg_stat_user_indexes s
-- JOIN pg_index i ON i.indexrelid = s.indexrelid
-- WHERE s.schemaname='public' AND s.idx_scan=0
--   AND NOT i.indisprimary AND NOT i.indisunique;
-- (ejecuta los DROP uno por uno; CONCURRENTLY no va en transacción)
