-- ============================================================================
-- 02 — LIMPIEZA SEGURA  (basura confirmada, bajo riesgo)
-- ============================================================================
-- Revisa cada bloque y ejecútalo. Recomendado: hacer un backup/export antes.

-- 1) Índice DUPLICADO en public.cursos -------------------------------------
--    Hay 2 índices idénticos: cursos_slug_idx y cursos_slug_unique.
--    Mantener el UNIQUE (también valida unicidad). Borrar el duplicado:
DROP INDEX IF EXISTS public.cursos_slug_idx;

-- 2) Tablas de BACKUP viejas (perfiles borrados de abril 2026) -------------
--    backup_perfiles_eliminados_2026_04 (74 filas) + _backup_... (254 filas).
--    Son copias temporales de perfiles ya eliminados, no las usa la app.
--    DESCOMENTA para borrarlas (verifica antes que no las necesites):
-- DROP TABLE IF EXISTS public.backup_perfiles_eliminados_2026_04;
-- DROP TABLE IF EXISTS public._backup_perfiles_eliminados_2026_04;

-- 3) Tablas con 0 filas posiblemente muertas (CONFIRMAR antes de borrar) ----
--    Estas estaban vacías en el escaneo; algunas pueden ser features futuras
--    (DAW, simulador v2). NO borrar sin confirmar que no son funcionalidades
--    planeadas. Solo listadas para tu decisión:
--      instrumentos_simulador, notas_musicales_simulador,
--      daw_proyectos, daw_tracks, daw_sesiones_grabacion,
--      logros_acordeon, estadisticas_acordeon, pistas_acompanamiento
--    (si confirmas que son muertas: DROP TABLE IF EXISTS public.<tabla>;)
