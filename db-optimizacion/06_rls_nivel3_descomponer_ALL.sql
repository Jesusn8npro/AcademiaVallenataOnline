-- ============================================================================
-- 06 — RLS NIVEL 3: Descomponer políticas ALL en SELECT/INSERT/UPDATE/DELETE
-- Fecha: 2026-05-18
-- ============================================================================
-- Por qué: una política ALL crea 4 entradas internas en pg_policies (una por
-- operación). Si la tabla tiene ADEMÁS alguna política SELECT/INSERT/etc. específica,
-- Postgres evalúa DOS políticas permisivas para esa operación = multiple_permissive.
-- Descomponer ALL en 4 políticas explícitas elimina esa ambigüedad y permite
-- ajustar las condiciones de INSERT/DELETE (que no necesitan USING) con precisión.
--
-- ⚠️  ANTES DE EJECUTAR:
--   1. Probar en Supabase SQL Editor (no en migración directa)
--   2. Verificar acceso de usuario normal + admin después de cada tabla
--   3. Hacerlo en horario de bajo tráfico
--   4. Si algo falla, los DROP originales permiten re-crear la política ALL fácilmente
--
-- Total de políticas ALL a descomponer: 39 (en 35 tablas)
-- ============================================================================

-- Helper para verificar qué queda después:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname='public' AND cmd='ALL' ORDER BY tablename;

-- ============================================================================
-- acordes_hero
-- ============================================================================
DROP POLICY IF EXISTS "Admin gestiona acordes hero" ON public.acordes_hero;
CREATE POLICY "Admin gestiona acordes hero_select" ON public.acordes_hero
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  );
CREATE POLICY "Admin gestiona acordes hero_insert" ON public.acordes_hero
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  );
CREATE POLICY "Admin gestiona acordes hero_update" ON public.acordes_hero
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  );
CREATE POLICY "Admin gestiona acordes hero_delete" ON public.acordes_hero
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  );

-- ============================================================================
-- agente_chat_config
-- ============================================================================
DROP POLICY IF EXISTS "service_todo_config" ON public.agente_chat_config;
CREATE POLICY "service_todo_config_select" ON public.agente_chat_config FOR SELECT USING (true);
CREATE POLICY "service_todo_config_insert" ON public.agente_chat_config FOR INSERT WITH CHECK (true);
CREATE POLICY "service_todo_config_update" ON public.agente_chat_config FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "service_todo_config_delete" ON public.agente_chat_config FOR DELETE USING (true);

-- ============================================================================
-- canciones_hero
-- ============================================================================
DROP POLICY IF EXISTS "canciones_hero_admin_all" ON public.canciones_hero;
CREATE POLICY "canciones_hero_admin_all_select" ON public.canciones_hero
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  );
CREATE POLICY "canciones_hero_admin_all_insert" ON public.canciones_hero
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  );
CREATE POLICY "canciones_hero_admin_all_update" ON public.canciones_hero
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  );
CREATE POLICY "canciones_hero_admin_all_delete" ON public.canciones_hero
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  );

-- ============================================================================
-- chats_creador_productos
-- ============================================================================
DROP POLICY IF EXISTS "Solo admin ve chats creador productos" ON public.chats_creador_productos;
CREATE POLICY "Solo admin ve chats creador productos_select" ON public.chats_creador_productos
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "Solo admin ve chats creador productos_insert" ON public.chats_creador_productos
  FOR INSERT WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "Solo admin ve chats creador productos_update" ON public.chats_creador_productos
  FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  ) WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "Solo admin ve chats creador productos_delete" ON public.chats_creador_productos
  FOR DELETE USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );

-- ============================================================================
-- chats_envivo_academia
-- ============================================================================
DROP POLICY IF EXISTS "chats_admin_simple" ON public.chats_envivo_academia;
CREATE POLICY "chats_admin_simple_select" ON public.chats_envivo_academia
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['administrador'::text, 'admin'::text]))
  );
CREATE POLICY "chats_admin_simple_insert" ON public.chats_envivo_academia
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['administrador'::text, 'admin'::text]))
  );
CREATE POLICY "chats_admin_simple_update" ON public.chats_envivo_academia
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['administrador'::text, 'admin'::text]))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['administrador'::text, 'admin'::text]))
  );
CREATE POLICY "chats_admin_simple_delete" ON public.chats_envivo_academia
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['administrador'::text, 'admin'::text]))
  );

-- ============================================================================
-- comunidad_publicaciones
-- ============================================================================
DROP POLICY IF EXISTS "Admin puede todo" ON public.comunidad_publicaciones;
CREATE POLICY "Admin puede todo_select" ON public.comunidad_publicaciones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text)
  );
CREATE POLICY "Admin puede todo_insert" ON public.comunidad_publicaciones
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text)
  );
CREATE POLICY "Admin puede todo_update" ON public.comunidad_publicaciones
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text)
  );
CREATE POLICY "Admin puede todo_delete" ON public.comunidad_publicaciones
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text)
  );

-- ============================================================================
-- cupones
-- ============================================================================
DROP POLICY IF EXISTS "admin_cupones_full" ON public.cupones;
CREATE POLICY "admin_cupones_full_select" ON public.cupones
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_cupones_full_insert" ON public.cupones
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_cupones_full_update" ON public.cupones
  FOR UPDATE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_cupones_full_delete" ON public.cupones
  FOR DELETE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));

-- ============================================================================
-- cupones_uso
-- ============================================================================
DROP POLICY IF EXISTS "admin_cupones_uso" ON public.cupones_uso;
CREATE POLICY "admin_cupones_uso_select" ON public.cupones_uso
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_cupones_uso_insert" ON public.cupones_uso
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_cupones_uso_update" ON public.cupones_uso
  FOR UPDATE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_cupones_uso_delete" ON public.cupones_uso
  FOR DELETE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));

-- ============================================================================
-- cursos  (⚠️ política merged compleja — verificar acceso admin+profesor tras aplicar)
-- ============================================================================
DROP POLICY IF EXISTS "merged_cursos_all_public" ON public.cursos;
CREATE POLICY "merged_cursos_all_public_select" ON public.cursos
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'profesor'::text, 'instructor'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "merged_cursos_all_public_insert" ON public.cursos
  FOR INSERT WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'profesor'::text, 'instructor'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "merged_cursos_all_public_update" ON public.cursos
  FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'profesor'::text, 'instructor'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  ) WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'profesor'::text, 'instructor'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "merged_cursos_all_public_delete" ON public.cursos
  FOR DELETE USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'profesor'::text, 'instructor'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );

-- ============================================================================
-- desafios_diarios
-- ============================================================================
DROP POLICY IF EXISTS "Admin gestiona desafios" ON public.desafios_diarios;
CREATE POLICY "Admin gestiona desafios_select" ON public.desafios_diarios
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Admin gestiona desafios_insert" ON public.desafios_diarios
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Admin gestiona desafios_update" ON public.desafios_diarios
  FOR UPDATE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Admin gestiona desafios_delete" ON public.desafios_diarios
  FOR DELETE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));

-- ============================================================================
-- estadisticas_acordeon
-- ============================================================================
DROP POLICY IF EXISTS "Admin gestiona estadisticas acordeon" ON public.estadisticas_acordeon;
CREATE POLICY "Admin gestiona estadisticas acordeon_select" ON public.estadisticas_acordeon
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "Admin gestiona estadisticas acordeon_insert" ON public.estadisticas_acordeon
  FOR INSERT WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "Admin gestiona estadisticas acordeon_update" ON public.estadisticas_acordeon
  FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  ) WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "Admin gestiona estadisticas acordeon_delete" ON public.estadisticas_acordeon
  FOR DELETE USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );

-- ============================================================================
-- estadisticas_usuario
-- ============================================================================
DROP POLICY IF EXISTS "admin_gestiona_estadisticas" ON public.estadisticas_usuario;
CREATE POLICY "admin_gestiona_estadisticas_select" ON public.estadisticas_usuario
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_gestiona_estadisticas_insert" ON public.estadisticas_usuario
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_gestiona_estadisticas_update" ON public.estadisticas_usuario
  FOR UPDATE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_gestiona_estadisticas_delete" ON public.estadisticas_usuario
  FOR DELETE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));

-- ============================================================================
-- eventos_actividad
-- ============================================================================
DROP POLICY IF EXISTS "admin_all_events" ON public.eventos_actividad;
CREATE POLICY "admin_all_events_select" ON public.eventos_actividad
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_all_events_insert" ON public.eventos_actividad
  FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_all_events_update" ON public.eventos_actividad
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_all_events_delete" ON public.eventos_actividad
  FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));

-- ============================================================================
-- experiencia_usuario
-- ============================================================================
DROP POLICY IF EXISTS "admin_gestiona_experiencia" ON public.experiencia_usuario;
CREATE POLICY "admin_gestiona_experiencia_select" ON public.experiencia_usuario
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_gestiona_experiencia_insert" ON public.experiencia_usuario
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_gestiona_experiencia_update" ON public.experiencia_usuario
  FOR UPDATE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_gestiona_experiencia_delete" ON public.experiencia_usuario
  FOR DELETE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));

-- ============================================================================
-- favoritos
-- ============================================================================
DROP POLICY IF EXISTS "usuarios gestionan sus favoritos" ON public.favoritos;
CREATE POLICY "usuarios gestionan sus favoritos_select" ON public.favoritos
  FOR SELECT USING ((SELECT auth.uid()) = usuario_id);
CREATE POLICY "usuarios gestionan sus favoritos_insert" ON public.favoritos
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = usuario_id);
CREATE POLICY "usuarios gestionan sus favoritos_update" ON public.favoritos
  FOR UPDATE USING ((SELECT auth.uid()) = usuario_id) WITH CHECK ((SELECT auth.uid()) = usuario_id);
CREATE POLICY "usuarios gestionan sus favoritos_delete" ON public.favoritos
  FOR DELETE USING ((SELECT auth.uid()) = usuario_id);

-- ============================================================================
-- inscripciones (2 políticas ALL)
-- ============================================================================
DROP POLICY IF EXISTS "Los administradores tienen acceso total" ON public.inscripciones;
CREATE POLICY "Los administradores tienen acceso total_select" ON public.inscripciones
  FOR SELECT TO authenticated USING (
    (SELECT perfiles.rol FROM perfiles WHERE perfiles.id = (SELECT auth.uid())) = 'admin'::text
  );
CREATE POLICY "Los administradores tienen acceso total_insert" ON public.inscripciones
  FOR INSERT TO authenticated WITH CHECK (
    (SELECT perfiles.rol FROM perfiles WHERE perfiles.id = (SELECT auth.uid())) = 'admin'::text
  );
CREATE POLICY "Los administradores tienen acceso total_update" ON public.inscripciones
  FOR UPDATE TO authenticated USING (
    (SELECT perfiles.rol FROM perfiles WHERE perfiles.id = (SELECT auth.uid())) = 'admin'::text
  ) WITH CHECK (
    (SELECT perfiles.rol FROM perfiles WHERE perfiles.id = (SELECT auth.uid())) = 'admin'::text
  );
CREATE POLICY "Los administradores tienen acceso total_delete" ON public.inscripciones
  FOR DELETE TO authenticated USING (
    (SELECT perfiles.rol FROM perfiles WHERE perfiles.id = (SELECT auth.uid())) = 'admin'::text
  );

DROP POLICY IF EXISTS "Service role can manage all inscripciones" ON public.inscripciones;
CREATE POLICY "Service role can manage all inscripciones_select" ON public.inscripciones
  FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role can manage all inscripciones_insert" ON public.inscripciones
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can manage all inscripciones_update" ON public.inscripciones
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage all inscripciones_delete" ON public.inscripciones
  FOR DELETE TO service_role USING (true);

-- ============================================================================
-- instrumentos_simulador
-- ============================================================================
DROP POLICY IF EXISTS "Solo administradores pueden modificar instrumentos" ON public.instrumentos_simulador;
CREATE POLICY "Solo administradores pueden modificar instrumentos_select" ON public.instrumentos_simulador
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "Solo administradores pueden modificar instrumentos_insert" ON public.instrumentos_simulador
  FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "Solo administradores pueden modificar instrumentos_update" ON public.instrumentos_simulador
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "Solo administradores pueden modificar instrumentos_delete" ON public.instrumentos_simulador
  FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));

-- ============================================================================
-- jesusgonzalezchats
-- ============================================================================
DROP POLICY IF EXISTS "Solo admin ve jesusgonzalezchats" ON public.jesusgonzalezchats;
CREATE POLICY "Solo admin ve jesusgonzalezchats_select" ON public.jesusgonzalezchats
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "Solo admin ve jesusgonzalezchats_insert" ON public.jesusgonzalezchats
  FOR INSERT WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "Solo admin ve jesusgonzalezchats_update" ON public.jesusgonzalezchats
  FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  ) WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "Solo admin ve jesusgonzalezchats_delete" ON public.jesusgonzalezchats
  FOR DELETE USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );

-- ============================================================================
-- logros_acordeon
-- ============================================================================
DROP POLICY IF EXISTS "Admin gestiona logros acordeon" ON public.logros_acordeon;
CREATE POLICY "Admin gestiona logros acordeon_select" ON public.logros_acordeon
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Admin gestiona logros acordeon_insert" ON public.logros_acordeon
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Admin gestiona logros acordeon_update" ON public.logros_acordeon
  FOR UPDATE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Admin gestiona logros acordeon_delete" ON public.logros_acordeon
  FOR DELETE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));

-- ============================================================================
-- membresias
-- ============================================================================
DROP POLICY IF EXISTS "Solo admins gestionan membresias" ON public.membresias;
CREATE POLICY "Solo admins gestionan membresias_select" ON public.membresias
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Solo admins gestionan membresias_insert" ON public.membresias
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Solo admins gestionan membresias_update" ON public.membresias
  FOR UPDATE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Solo admins gestionan membresias_delete" ON public.membresias
  FOR DELETE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));

-- ============================================================================
-- modulos  (⚠️ política merged — verificar acceso instructor tras aplicar)
-- ============================================================================
DROP POLICY IF EXISTS "merged_modulos_all_public" ON public.modulos;
CREATE POLICY "merged_modulos_all_public_select" ON public.modulos
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'instructor'::text, 'profesor'::text])))
    OR ((SELECT auth.uid()) IN (SELECT cursos.instructor_id FROM cursos WHERE cursos.id = modulos.curso_id))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "merged_modulos_all_public_insert" ON public.modulos
  FOR INSERT WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'instructor'::text, 'profesor'::text])))
    OR ((SELECT auth.uid()) IN (SELECT cursos.instructor_id FROM cursos WHERE cursos.id = modulos.curso_id))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "merged_modulos_all_public_update" ON public.modulos
  FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'instructor'::text, 'profesor'::text])))
    OR ((SELECT auth.uid()) IN (SELECT cursos.instructor_id FROM cursos WHERE cursos.id = modulos.curso_id))
    OR ((SELECT auth.role()) = 'service_role'::text)
  ) WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'instructor'::text, 'profesor'::text])))
    OR ((SELECT auth.uid()) IN (SELECT cursos.instructor_id FROM cursos WHERE cursos.id = modulos.curso_id))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "merged_modulos_all_public_delete" ON public.modulos
  FOR DELETE USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'instructor'::text, 'profesor'::text])))
    OR ((SELECT auth.uid()) IN (SELECT cursos.instructor_id FROM cursos WHERE cursos.id = modulos.curso_id))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );

-- ============================================================================
-- notas_musicales_simulador
-- ============================================================================
DROP POLICY IF EXISTS "Solo administradores pueden modificar notas" ON public.notas_musicales_simulador;
CREATE POLICY "Solo administradores pueden modificar notas_select" ON public.notas_musicales_simulador
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "Solo administradores pueden modificar notas_insert" ON public.notas_musicales_simulador
  FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "Solo administradores pueden modificar notas_update" ON public.notas_musicales_simulador
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "Solo administradores pueden modificar notas_delete" ON public.notas_musicales_simulador
  FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));

-- ============================================================================
-- notificaciones
-- ============================================================================
DROP POLICY IF EXISTS "merged_notificaciones_all_authenticated" ON public.notificaciones;
CREATE POLICY "merged_notificaciones_all_authenticated_select" ON public.notificaciones
  FOR SELECT TO authenticated USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.uid()) = usuario_id)
  );
CREATE POLICY "merged_notificaciones_all_authenticated_insert" ON public.notificaciones
  FOR INSERT TO authenticated WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.uid()) = usuario_id)
  );
CREATE POLICY "merged_notificaciones_all_authenticated_update" ON public.notificaciones
  FOR UPDATE TO authenticated USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.uid()) = usuario_id)
  ) WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.uid()) = usuario_id)
  );
CREATE POLICY "merged_notificaciones_all_authenticated_delete" ON public.notificaciones
  FOR DELETE TO authenticated USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.uid()) = usuario_id)
  );

-- ============================================================================
-- notificaciones_plantillas
-- ============================================================================
DROP POLICY IF EXISTS "Admin gestiona plantillas" ON public.notificaciones_plantillas;
CREATE POLICY "Admin gestiona plantillas_select" ON public.notificaciones_plantillas
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Admin gestiona plantillas_insert" ON public.notificaciones_plantillas
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Admin gestiona plantillas_update" ON public.notificaciones_plantillas
  FOR UPDATE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Admin gestiona plantillas_delete" ON public.notificaciones_plantillas
  FOR DELETE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));

-- ============================================================================
-- notificaciones_preferencias
-- ============================================================================
DROP POLICY IF EXISTS "usuarios_ven_sus_preferencias" ON public.notificaciones_preferencias;
CREATE POLICY "usuarios_ven_sus_preferencias_select" ON public.notificaciones_preferencias
  FOR SELECT USING ((SELECT auth.uid()) = usuario_id);
CREATE POLICY "usuarios_ven_sus_preferencias_insert" ON public.notificaciones_preferencias
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = usuario_id);
CREATE POLICY "usuarios_ven_sus_preferencias_update" ON public.notificaciones_preferencias
  FOR UPDATE USING ((SELECT auth.uid()) = usuario_id) WITH CHECK ((SELECT auth.uid()) = usuario_id);
CREATE POLICY "usuarios_ven_sus_preferencias_delete" ON public.notificaciones_preferencias
  FOR DELETE USING ((SELECT auth.uid()) = usuario_id);

-- ============================================================================
-- objetivos_admin
-- ============================================================================
DROP POLICY IF EXISTS "Solo admins gestionan objetivos" ON public.objetivos_admin;
CREATE POLICY "Solo admins gestionan objetivos_select" ON public.objetivos_admin
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Solo admins gestionan objetivos_insert" ON public.objetivos_admin
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Solo admins gestionan objetivos_update" ON public.objetivos_admin
  FOR UPDATE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));
CREATE POLICY "Solo admins gestionan objetivos_delete" ON public.objetivos_admin
  FOR DELETE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])));

-- ============================================================================
-- pagos_epayco
-- ============================================================================
DROP POLICY IF EXISTS "Administradores acceso completo" ON public.pagos_epayco;
CREATE POLICY "Administradores acceso completo_select" ON public.pagos_epayco
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "Administradores acceso completo_insert" ON public.pagos_epayco
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "Administradores acceso completo_update" ON public.pagos_epayco
  FOR UPDATE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "Administradores acceso completo_delete" ON public.pagos_epayco
  FOR DELETE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));

-- ============================================================================
-- paquetes_tutoriales  (usa función is_admin())
-- ============================================================================
DROP POLICY IF EXISTS "Admin puede gestionar paquetes" ON public.paquetes_tutoriales;
CREATE POLICY "Admin puede gestionar paquetes_select" ON public.paquetes_tutoriales
  FOR SELECT USING (is_admin());
CREATE POLICY "Admin puede gestionar paquetes_insert" ON public.paquetes_tutoriales
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin puede gestionar paquetes_update" ON public.paquetes_tutoriales
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin puede gestionar paquetes_delete" ON public.paquetes_tutoriales
  FOR DELETE USING (is_admin());

-- ============================================================================
-- paquetes_tutoriales_items  (usa función is_admin())
-- ============================================================================
DROP POLICY IF EXISTS "Admin puede gestionar items" ON public.paquetes_tutoriales_items;
CREATE POLICY "Admin puede gestionar items_select" ON public.paquetes_tutoriales_items
  FOR SELECT USING (is_admin());
CREATE POLICY "Admin puede gestionar items_insert" ON public.paquetes_tutoriales_items
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin puede gestionar items_update" ON public.paquetes_tutoriales_items
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin puede gestionar items_delete" ON public.paquetes_tutoriales_items
  FOR DELETE USING (is_admin());

-- ============================================================================
-- perfiles
-- ============================================================================
DROP POLICY IF EXISTS "Service role puede gestionar perfiles" ON public.perfiles;
CREATE POLICY "Service role puede gestionar perfiles_select" ON public.perfiles
  FOR SELECT USING ((SELECT auth.role()) = 'service_role'::text);
CREATE POLICY "Service role puede gestionar perfiles_insert" ON public.perfiles
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'service_role'::text);
CREATE POLICY "Service role puede gestionar perfiles_update" ON public.perfiles
  FOR UPDATE USING ((SELECT auth.role()) = 'service_role'::text)
  WITH CHECK ((SELECT auth.role()) = 'service_role'::text);
CREATE POLICY "Service role puede gestionar perfiles_delete" ON public.perfiles
  FOR DELETE USING ((SELECT auth.role()) = 'service_role'::text);

-- ============================================================================
-- pistas_acompanamiento
-- ============================================================================
DROP POLICY IF EXISTS "pistas_admin_todo" ON public.pistas_acompanamiento;
CREATE POLICY "pistas_admin_todo_select" ON public.pistas_acompanamiento
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "pistas_admin_todo_insert" ON public.pistas_acompanamiento
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "pistas_admin_todo_update" ON public.pistas_acompanamiento
  FOR UPDATE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "pistas_admin_todo_delete" ON public.pistas_acompanamiento
  FOR DELETE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));

-- ============================================================================
-- progreso_lecciones
-- ============================================================================
DROP POLICY IF EXISTS "progreso_admin_all" ON public.progreso_lecciones;
CREATE POLICY "progreso_admin_all_select" ON public.progreso_lecciones
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  );
CREATE POLICY "progreso_admin_all_insert" ON public.progreso_lecciones
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  );
CREATE POLICY "progreso_admin_all_update" ON public.progreso_lecciones
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  );
CREATE POLICY "progreso_admin_all_delete" ON public.progreso_lecciones
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text]))
  );

-- ============================================================================
-- ranking_global
-- ============================================================================
DROP POLICY IF EXISTS "admin_gestiona_ranking" ON public.ranking_global;
CREATE POLICY "admin_gestiona_ranking_select" ON public.ranking_global
  FOR SELECT USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_gestiona_ranking_insert" ON public.ranking_global
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_gestiona_ranking_update" ON public.ranking_global
  FOR UPDATE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "admin_gestiona_ranking_delete" ON public.ranking_global
  FOR DELETE USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));

-- ============================================================================
-- sesiones_usuario
-- ============================================================================
DROP POLICY IF EXISTS "merged_sesiones_usuario_all_authenticated" ON public.sesiones_usuario;
CREATE POLICY "merged_sesiones_usuario_all_authenticated_select" ON public.sesiones_usuario
  FOR SELECT TO authenticated USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
    OR (usuario_id = (SELECT auth.uid()))
  );
CREATE POLICY "merged_sesiones_usuario_all_authenticated_insert" ON public.sesiones_usuario
  FOR INSERT TO authenticated WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
    OR (usuario_id = (SELECT auth.uid()))
  );
CREATE POLICY "merged_sesiones_usuario_all_authenticated_update" ON public.sesiones_usuario
  FOR UPDATE TO authenticated USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
    OR (usuario_id = (SELECT auth.uid()))
  ) WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
    OR (usuario_id = (SELECT auth.uid()))
  );
CREATE POLICY "merged_sesiones_usuario_all_authenticated_delete" ON public.sesiones_usuario
  FOR DELETE TO authenticated USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
    OR (usuario_id = (SELECT auth.uid()))
  );

-- ============================================================================
-- sim_ajustes_usuario
-- ============================================================================
DROP POLICY IF EXISTS "Ajustes privados por usuario" ON public.sim_ajustes_usuario;
CREATE POLICY "Ajustes privados por usuario_select" ON public.sim_ajustes_usuario
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = usuario_id);
CREATE POLICY "Ajustes privados por usuario_insert" ON public.sim_ajustes_usuario
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = usuario_id);
CREATE POLICY "Ajustes privados por usuario_update" ON public.sim_ajustes_usuario
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = usuario_id)
  WITH CHECK ((SELECT auth.uid()) = usuario_id);
CREATE POLICY "Ajustes privados por usuario_delete" ON public.sim_ajustes_usuario
  FOR DELETE TO authenticated USING ((SELECT auth.uid()) = usuario_id);

-- ============================================================================
-- suscripciones_usuario
-- ============================================================================
DROP POLICY IF EXISTS "Admin gestiona suscripciones" ON public.suscripciones_usuario;
CREATE POLICY "Admin gestiona suscripciones_select" ON public.suscripciones_usuario
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "Admin gestiona suscripciones_insert" ON public.suscripciones_usuario
  FOR INSERT WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "Admin gestiona suscripciones_update" ON public.suscripciones_usuario
  FOR UPDATE USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  ) WITH CHECK (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );
CREATE POLICY "Admin gestiona suscripciones_delete" ON public.suscripciones_usuario
  FOR DELETE USING (
    (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = ANY (ARRAY['admin'::text, 'administrador'::text])))
    OR ((SELECT auth.role()) = 'service_role'::text)
  );

-- ============================================================================
-- tutoriales (2 políticas ALL)
-- ============================================================================
DROP POLICY IF EXISTS "Service role gestiona tutoriales" ON public.tutoriales;
CREATE POLICY "Service role gestiona tutoriales_select" ON public.tutoriales
  FOR SELECT USING ((SELECT auth.role()) = 'service_role'::text);
CREATE POLICY "Service role gestiona tutoriales_insert" ON public.tutoriales
  FOR INSERT WITH CHECK ((SELECT auth.role()) = 'service_role'::text);
CREATE POLICY "Service role gestiona tutoriales_update" ON public.tutoriales
  FOR UPDATE USING ((SELECT auth.role()) = 'service_role'::text)
  WITH CHECK ((SELECT auth.role()) = 'service_role'::text);
CREATE POLICY "Service role gestiona tutoriales_delete" ON public.tutoriales
  FOR DELETE USING ((SELECT auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "Solo admin gestiona tutoriales" ON public.tutoriales;
CREATE POLICY "Solo admin gestiona tutoriales_select" ON public.tutoriales
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "Solo admin gestiona tutoriales_insert" ON public.tutoriales
  FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "Solo admin gestiona tutoriales_update" ON public.tutoriales
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text))
  WITH CHECK (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));
CREATE POLICY "Solo admin gestiona tutoriales_delete" ON public.tutoriales
  FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM perfiles WHERE perfiles.id = (SELECT auth.uid()) AND perfiles.rol = 'admin'::text));

-- ============================================================================
-- VERIFICACIÓN FINAL: confirmar que no quedan políticas ALL
-- ============================================================================
-- Ejecutar después de aplicar el script:
-- SELECT tablename, policyname, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public' AND cmd = 'ALL'
-- ORDER BY tablename;
-- Resultado esperado: 0 filas
