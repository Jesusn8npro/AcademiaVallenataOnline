-- ============================================================================
-- 05 — SEGURIDAD  (113 hallazgos; aquí lo accionable y prioritario)
-- ============================================================================

-- 🔴 ERROR — Vista con SECURITY DEFINER (riesgo de escalada de privilegios)
--    public.vista_consulta_reclamos corre con permisos del creador, no del
--    usuario que consulta. Revisar si es necesario; si no, recrear como
--    SECURITY INVOKER:
SELECT pg_get_viewdef('public.vista_consulta_reclamos'::regclass, true);
-- Luego (si aplica):
-- ALTER VIEW public.vista_consulta_reclamos SET (security_invoker = true);

-- 🟠 function_search_path_mutable (3 funciones) — vector de inyección.
--    Fijar search_path explícito en estas funciones:
--    trigger_xp_balanceado, trigger_xp_tutorial, fn_validacion_actualizada
-- Ejemplo (ajusta la firma exacta de cada función):
-- ALTER FUNCTION public.trigger_xp_balanceado()    SET search_path = public, pg_temp;
-- ALTER FUNCTION public.trigger_xp_tutorial()      SET search_path = public, pg_temp;
-- ALTER FUNCTION public.fn_validacion_actualizada() SET search_path = public, pg_temp;
--   (ver firmas reales:)
SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('trigger_xp_balanceado','trigger_xp_tutorial','fn_validacion_actualizada');

-- 🟠 rls_policy_always_true (4) — políticas con USING (true) = SIN protección
--    real de filas. Revisar estas (lista las sospechosas):
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND (qual = 'true' OR qual IS NULL)
ORDER BY tablename;
--    Para cada una: o es intencional (tabla pública) o hay que restringirla.
--    (leads_chat_anonimos ya está documentada como intencional.)

-- 🟠 Acciones desde el Dashboard de Supabase (no SQL):
--    1. Auth > Providers/Policies: activar "Leaked Password Protection"
--       (HaveIBeenPwned) — hoy está desactivada.
--    2. Settings > Infrastructure: actualizar Postgres (15.8 tiene parches
--       de seguridad pendientes). Hacer en ventana de mantenimiento.
--    3. Storage: revisar los 12 buckets públicos que permiten LISTAR
--       archivos (public_bucket_allows_listing). Si no necesitas que se
--       listen, desactiva el listado público del bucket.

-- 🟡 88 funciones SECURITY DEFINER ejecutables por authenticated/anon:
--    revisar si alguna no debería serlo (mayoría suele ser intencional para
--    triggers/RPC controlados). Listado:
SELECT n.nspname, p.proname, p.prosecdef
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.prosecdef = true
ORDER BY p.proname;
