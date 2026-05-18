-- ============================================================================
-- 04 — RLS LENTO  (EL MAYOR IMPACTO EN VELOCIDAD DE LA APP) — Nivel 2
-- ============================================================================
-- Dos problemas que afectan CADA consulta que hace la web:
--
--  A) auth_rls_initplan (215 casos): las políticas RLS recalculan auth.uid()
--     / current_setting() POR CADA FILA en vez de una vez por consulta.
--     En tablas con muchas filas (eventos_actividad 8.5k, notificaciones 1.5k)
--     esto es lentísimo.
--     FIX (no cambia la seguridad, solo la hace rápida): envolver las llamadas
--     en un sub-SELECT para que Postgres las evalúe UNA vez:
--          auth.uid()                ->  (select auth.uid())
--          auth.role()               ->  (select auth.role())
--          current_setting('...')    ->  (select current_setting('...'))
--
--  B) multiple_permissive_policies (348): varias políticas PERMISSIVE para el
--     mismo rol+acción en la misma tabla; Postgres evalúa TODAS. (cursos,
--     comunidad_publicaciones, modulos tienen ~24 c/u). Consolidar en una
--     sola política por rol+acción.
--
-- ⚠️ RIESGO: tocar políticas RLS en producción puede cambiar QUIÉN ve QUÉ si
-- se hace mal. Por eso NO se incluye un script masivo automático aquí. Plan
-- recomendado y seguro:
--
-- 1) Exporta las políticas actuales para tenerlas de respaldo:
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2) Identifica las políticas con el patrón lento (auth.uid() sin subselect):
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual       ~ '(?<!select )auth\.(uid|role|jwt)\(\)' OR
    with_check ~ '(?<!select )auth\.(uid|role|jwt)\(\)'
  )
ORDER BY tablename;

-- 3) Para CADA política listada, recréala cambiando auth.uid() por
--    (select auth.uid()) — MISMA lógica, misma seguridad, mucho más rápida.
--    Ejemplo (NO ejecutar tal cual; adapta a tu política real):
--
--    -- ANTES (lento):
--    --   CREATE POLICY "p_select" ON public.notificaciones FOR SELECT
--    --     USING (usuario_id = auth.uid());
--    -- DESPUÉS (rápido, misma seguridad):
--    --   DROP POLICY "p_select" ON public.notificaciones;
--    --   CREATE POLICY "p_select" ON public.notificaciones FOR SELECT
--    --     USING (usuario_id = (select auth.uid()));
--
-- 4) Para multiple_permissive_policies: revisa las tablas top (cursos,
--    comunidad_publicaciones, modulos, perfiles, chats) y fusiona las
--    políticas redundantes del mismo rol+cmd en una sola con OR.
--
-- Recomendación: hacerlo tabla por tabla, en horario de bajo tráfico,
-- probando el acceso (un usuario normal y un admin) después de cada tabla.
-- Empezar por las de mayor impacto: cursos, comunidad_publicaciones,
-- modulos, notificaciones, eventos_actividad, perfiles, inscripciones.
