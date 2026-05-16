-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - Academia Vallenata Online
-- ============================================================
-- Habilitar RLS en todas las tablas con datos de usuario.
-- Principio: cada usuario solo lee/modifica sus propios datos.
-- Admins (rol = 'admin') tienen acceso total via función helper.
-- ============================================================

-- Helper: verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.perfiles
        WHERE id = auth.uid() AND rol = 'admin'
    );
$$;

-- Helper: obtener el ID del usuario actual
CREATE OR REPLACE FUNCTION public.uid()
RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT auth.uid();
$$;


-- ─────────────────────────────────────────────
-- PERFILES
-- ─────────────────────────────────────────────
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer perfiles públicos
DROP POLICY IF EXISTS "perfiles_select_publico" ON public.perfiles;
CREATE POLICY "perfiles_select_publico"
    ON public.perfiles FOR SELECT
    USING (TRUE);

-- Solo el propio usuario o admin puede actualizar su perfil
DROP POLICY IF EXISTS "perfiles_update_propio" ON public.perfiles;
CREATE POLICY "perfiles_update_propio"
    ON public.perfiles FOR UPDATE
    USING (id = auth.uid() OR public.es_admin());

-- Solo el trigger de auth puede insertar (handle_new_user)
DROP POLICY IF EXISTS "perfiles_insert_service" ON public.perfiles;
CREATE POLICY "perfiles_insert_service"
    ON public.perfiles FOR INSERT
    WITH CHECK (id = auth.uid() OR public.es_admin());


-- ─────────────────────────────────────────────
-- SESIONES DE USUARIO
-- ─────────────────────────────────────────────
ALTER TABLE public.sesiones_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sesiones_select_propio" ON public.sesiones_usuario;
CREATE POLICY "sesiones_select_propio"
    ON public.sesiones_usuario FOR SELECT
    USING (usuario_id = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "sesiones_insert_propio" ON public.sesiones_usuario;
CREATE POLICY "sesiones_insert_propio"
    ON public.sesiones_usuario FOR INSERT
    WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "sesiones_update_propio" ON public.sesiones_usuario;
CREATE POLICY "sesiones_update_propio"
    ON public.sesiones_usuario FOR UPDATE
    USING (usuario_id = auth.uid());


-- ─────────────────────────────────────────────
-- INSCRIPCIONES
-- ─────────────────────────────────────────────
ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inscripciones_select_propio" ON public.inscripciones;
CREATE POLICY "inscripciones_select_propio"
    ON public.inscripciones FOR SELECT
    USING (usuario_id = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "inscripciones_insert_admin" ON public.inscripciones;
CREATE POLICY "inscripciones_insert_admin"
    ON public.inscripciones FOR INSERT
    WITH CHECK (public.es_admin());

DROP POLICY IF EXISTS "inscripciones_update_admin" ON public.inscripciones;
CREATE POLICY "inscripciones_update_admin"
    ON public.inscripciones FOR UPDATE
    USING (public.es_admin());


-- ─────────────────────────────────────────────
-- PROGRESO LECCIONES
-- ─────────────────────────────────────────────
ALTER TABLE public.progreso_lecciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progreso_select_propio" ON public.progreso_lecciones;
CREATE POLICY "progreso_select_propio"
    ON public.progreso_lecciones FOR SELECT
    USING (usuario_id = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "progreso_insert_propio" ON public.progreso_lecciones;
CREATE POLICY "progreso_insert_propio"
    ON public.progreso_lecciones FOR INSERT
    WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "progreso_update_propio" ON public.progreso_lecciones;
CREATE POLICY "progreso_update_propio"
    ON public.progreso_lecciones FOR UPDATE
    USING (usuario_id = auth.uid());


-- ─────────────────────────────────────────────
-- CURSOS / TUTORIALES / PAQUETES / EVENTOS (solo lectura pública)
-- ─────────────────────────────────────────────
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cursos_select_publico" ON public.cursos;
CREATE POLICY "cursos_select_publico"
    ON public.cursos FOR SELECT USING (estado = 'publicado' OR public.es_admin());

DROP POLICY IF EXISTS "cursos_write_admin" ON public.cursos;
CREATE POLICY "cursos_write_admin"
    ON public.cursos FOR ALL USING (public.es_admin());

ALTER TABLE public.tutoriales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tutoriales_select_publico" ON public.tutoriales;
CREATE POLICY "tutoriales_select_publico"
    ON public.tutoriales FOR SELECT USING (estado = 'publicado' OR public.es_admin());

DROP POLICY IF EXISTS "tutoriales_write_admin" ON public.tutoriales;
CREATE POLICY "tutoriales_write_admin"
    ON public.tutoriales FOR ALL USING (public.es_admin());

ALTER TABLE public.paquetes_tutoriales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "paquetes_select_publico" ON public.paquetes_tutoriales;
CREATE POLICY "paquetes_select_publico"
    ON public.paquetes_tutoriales FOR SELECT USING (estado = 'publicado' OR public.es_admin());

DROP POLICY IF EXISTS "paquetes_write_admin" ON public.paquetes_tutoriales;
CREATE POLICY "paquetes_write_admin"
    ON public.paquetes_tutoriales FOR ALL USING (public.es_admin());

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eventos_select_publico" ON public.eventos;
CREATE POLICY "eventos_select_publico"
    ON public.eventos FOR SELECT USING (estado = 'publicado' OR estado = 'en_vivo' OR public.es_admin());

DROP POLICY IF EXISTS "eventos_write_admin" ON public.eventos;
CREATE POLICY "eventos_write_admin"
    ON public.eventos FOR ALL USING (public.es_admin());


-- ─────────────────────────────────────────────
-- PAGOS EPAYCO
-- ─────────────────────────────────────────────
ALTER TABLE public.pagos_epayco ENABLE ROW LEVEL SECURITY;

-- El usuario solo ve sus propios pagos
DROP POLICY IF EXISTS "pagos_select_propio" ON public.pagos_epayco;
CREATE POLICY "pagos_select_propio"
    ON public.pagos_epayco FOR SELECT
    USING (usuario_id = auth.uid() OR public.es_admin());

-- Solo el webhook (service_role) puede insertar/actualizar pagos
DROP POLICY IF EXISTS "pagos_insert_service" ON public.pagos_epayco;
CREATE POLICY "pagos_insert_service"
    ON public.pagos_epayco FOR INSERT
    WITH CHECK (usuario_id = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "pagos_update_admin" ON public.pagos_epayco;
CREATE POLICY "pagos_update_admin"
    ON public.pagos_epayco FOR UPDATE
    USING (public.es_admin());


-- ─────────────────────────────────────────────
-- NOTIFICACIONES
-- ─────────────────────────────────────────────
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notificaciones_select_propio" ON public.notificaciones;
CREATE POLICY "notificaciones_select_propio"
    ON public.notificaciones FOR SELECT
    USING (usuario_id = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "notificaciones_update_propio" ON public.notificaciones;
CREATE POLICY "notificaciones_update_propio"
    ON public.notificaciones FOR UPDATE
    USING (usuario_id = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "notificaciones_insert_admin" ON public.notificaciones;
CREATE POLICY "notificaciones_insert_admin"
    ON public.notificaciones FOR INSERT
    WITH CHECK (public.es_admin());

DROP POLICY IF EXISTS "notificaciones_delete_propio" ON public.notificaciones;
CREATE POLICY "notificaciones_delete_propio"
    ON public.notificaciones FOR DELETE
    USING (usuario_id = auth.uid() OR public.es_admin());


-- ─────────────────────────────────────────────
-- CANCIONES HERO (solo lectura para todos los autenticados)
-- ─────────────────────────────────────────────
ALTER TABLE public.canciones_hero ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "canciones_select_auth" ON public.canciones_hero;
CREATE POLICY "canciones_select_auth"
    ON public.canciones_hero FOR SELECT
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "canciones_write_admin" ON public.canciones_hero;
CREATE POLICY "canciones_write_admin"
    ON public.canciones_hero FOR ALL
    USING (public.es_admin());


-- ─────────────────────────────────────────────
-- SCORES HERO
-- ─────────────────────────────────────────────
ALTER TABLE public.scores_hero ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scores_select_auth" ON public.scores_hero;
CREATE POLICY "scores_select_auth"
    ON public.scores_hero FOR SELECT
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "scores_insert_propio" ON public.scores_hero;
CREATE POLICY "scores_insert_propio"
    ON public.scores_hero FOR INSERT
    WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "scores_update_admin" ON public.scores_hero;
CREATE POLICY "scores_update_admin"
    ON public.scores_hero FOR UPDATE
    USING (public.es_admin());


-- ─────────────────────────────────────────────
-- GRABACIONES HERO
-- ─────────────────────────────────────────────
ALTER TABLE public.grabaciones_hero ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grabaciones_select_propio_o_publico" ON public.grabaciones_hero;
CREATE POLICY "grabaciones_select_propio_o_publico"
    ON public.grabaciones_hero FOR SELECT
    USING (es_publica = TRUE OR usuario_id = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "grabaciones_insert_propio" ON public.grabaciones_hero;
CREATE POLICY "grabaciones_insert_propio"
    ON public.grabaciones_hero FOR INSERT
    WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "grabaciones_update_propio" ON public.grabaciones_hero;
CREATE POLICY "grabaciones_update_propio"
    ON public.grabaciones_hero FOR UPDATE
    USING (usuario_id = auth.uid() OR public.es_admin());

DROP POLICY IF EXISTS "grabaciones_delete_propio" ON public.grabaciones_hero;
CREATE POLICY "grabaciones_delete_propio"
    ON public.grabaciones_hero FOR DELETE
    USING (usuario_id = auth.uid() OR public.es_admin());


-- ─────────────────────────────────────────────
-- EXPERIENCIA / MONEDAS / GAMIFICACIÓN (solo propio)
-- ─────────────────────────────────────────────
ALTER TABLE public.experiencia_usuario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "experiencia_select_propio" ON public.experiencia_usuario;
CREATE POLICY "experiencia_select_propio"
    ON public.experiencia_usuario FOR SELECT
    USING (usuario_id = auth.uid() OR public.es_admin());
DROP POLICY IF EXISTS "experiencia_write_propio" ON public.experiencia_usuario;
CREATE POLICY "experiencia_write_propio"
    ON public.experiencia_usuario FOR ALL
    USING (usuario_id = auth.uid() OR public.es_admin());

ALTER TABLE public.monedas_usuario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "monedas_select_propio" ON public.monedas_usuario;
CREATE POLICY "monedas_select_propio"
    ON public.monedas_usuario FOR SELECT
    USING (usuario_id = auth.uid() OR public.es_admin());
DROP POLICY IF EXISTS "monedas_write_admin" ON public.monedas_usuario;
CREATE POLICY "monedas_write_admin"
    ON public.monedas_usuario FOR ALL
    USING (public.es_admin());


-- ─────────────────────────────────────────────
-- RANKING GLOBAL (lectura pública)
-- ─────────────────────────────────────────────
ALTER TABLE public.ranking_global ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ranking_select_publico" ON public.ranking_global;
CREATE POLICY "ranking_select_publico"
    ON public.ranking_global FOR SELECT
    USING (activo = TRUE OR public.es_admin());
DROP POLICY IF EXISTS "ranking_write_admin" ON public.ranking_global;
CREATE POLICY "ranking_write_admin"
    ON public.ranking_global FOR ALL
    USING (public.es_admin());


-- ─────────────────────────────────────────────
-- COMUNIDAD (publicaciones y comentarios)
-- ─────────────────────────────────────────────
ALTER TABLE public.comunidad_publicaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "publicaciones_select_auth" ON public.comunidad_publicaciones;
CREATE POLICY "publicaciones_select_auth"
    ON public.comunidad_publicaciones FOR SELECT
    USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "publicaciones_insert_auth" ON public.comunidad_publicaciones;
CREATE POLICY "publicaciones_insert_auth"
    ON public.comunidad_publicaciones FOR INSERT
    WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS "publicaciones_update_propio" ON public.comunidad_publicaciones;
CREATE POLICY "publicaciones_update_propio"
    ON public.comunidad_publicaciones FOR UPDATE
    USING (usuario_id = auth.uid() OR public.es_admin());
DROP POLICY IF EXISTS "publicaciones_delete_propio" ON public.comunidad_publicaciones;
CREATE POLICY "publicaciones_delete_propio"
    ON public.comunidad_publicaciones FOR DELETE
    USING (usuario_id = auth.uid() OR public.es_admin());

ALTER TABLE public.comunidad_comentarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comentarios_select_auth" ON public.comunidad_comentarios;
CREATE POLICY "comentarios_select_auth"
    ON public.comunidad_comentarios FOR SELECT
    USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "comentarios_insert_auth" ON public.comunidad_comentarios;
CREATE POLICY "comentarios_insert_auth"
    ON public.comunidad_comentarios FOR INSERT
    WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS "comentarios_delete_propio" ON public.comunidad_comentarios;
CREATE POLICY "comentarios_delete_propio"
    ON public.comunidad_comentarios FOR DELETE
    USING (usuario_id = auth.uid() OR public.es_admin());

ALTER TABLE public.comunidad_publicaciones_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "likes_select_auth" ON public.comunidad_publicaciones_likes;
CREATE POLICY "likes_select_auth"
    ON public.comunidad_publicaciones_likes FOR SELECT
    USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "likes_insert_auth" ON public.comunidad_publicaciones_likes;
CREATE POLICY "likes_insert_auth"
    ON public.comunidad_publicaciones_likes FOR INSERT
    WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS "likes_delete_propio" ON public.comunidad_publicaciones_likes;
CREATE POLICY "likes_delete_propio"
    ON public.comunidad_publicaciones_likes FOR DELETE
    USING (usuario_id = auth.uid());


-- ─────────────────────────────────────────────
-- CHATS Y MENSAJES
-- ─────────────────────────────────────────────
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chats_select_miembro" ON public.chats;
CREATE POLICY "chats_select_miembro"
    ON public.chats FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.miembros_chat
            WHERE chat_id = chats.id AND usuario_id = auth.uid()
        ) OR public.es_admin()
    );

ALTER TABLE public.miembros_chat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "miembros_chat_select_propio" ON public.miembros_chat;
CREATE POLICY "miembros_chat_select_propio"
    ON public.miembros_chat FOR SELECT
    USING (usuario_id = auth.uid() OR public.es_admin());

ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mensajes_select_miembro" ON public.mensajes;
CREATE POLICY "mensajes_select_miembro"
    ON public.mensajes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.miembros_chat
            WHERE chat_id = mensajes.chat_id AND usuario_id = auth.uid()
        ) OR public.es_admin()
    );
DROP POLICY IF EXISTS "mensajes_insert_miembro" ON public.mensajes;
CREATE POLICY "mensajes_insert_miembro"
    ON public.mensajes FOR INSERT
    WITH CHECK (
        usuario_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.miembros_chat
            WHERE chat_id = mensajes.chat_id
            AND usuario_id = auth.uid()
            AND puede_escribir = TRUE
        )
    );
