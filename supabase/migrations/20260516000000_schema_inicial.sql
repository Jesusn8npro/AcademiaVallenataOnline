-- ============================================================
-- SCHEMA INICIAL - Academia Vallenata Online
-- Generado: 2026-05-16
-- Proyecto Supabase: tbijzvtyyewhtwgakgka
-- ============================================================
-- Este archivo documenta el schema completo extraído del código
-- fuente. Usar como base para reproducir la base de datos.
-- Todas las sentencias usan IF NOT EXISTS para ser idempotentes.
-- ============================================================

-- ───────────────────────────────────────────────────────────
-- EXTENSIONES
-- ───────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ───────────────────────────────────────────────────────────
-- 1. PERFILES (extiende auth.users de Supabase)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.perfiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre              TEXT,
    apellido            TEXT,
    nombre_completo     TEXT,
    nombre_usuario      TEXT UNIQUE,
    correo_electronico  TEXT,
    url_foto_perfil     TEXT,
    rol                 TEXT NOT NULL DEFAULT 'estudiante'
                            CHECK (rol IN ('estudiante', 'instructor', 'admin')),
    nivel_habilidad     TEXT,
    suscripcion         TEXT DEFAULT 'gratuito',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_perfiles') THEN
        CREATE TRIGGER set_updated_at_perfiles
            BEFORE UPDATE ON public.perfiles
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Trigger: crear perfil automáticamente al registrarse un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.perfiles (id, correo_electronico, nombre)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;


-- ───────────────────────────────────────────────────────────
-- 2. SESIONES DE USUARIO
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sesiones_usuario (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id              UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    ultima_actividad        TIMESTAMPTZ DEFAULT NOW(),
    pagina_actual           TEXT,
    esta_activo             BOOLEAN DEFAULT TRUE,
    tiempo_sesion_actual    INTEGER DEFAULT 0,
    tiempo_total_minutos    INTEGER DEFAULT 0,
    sesiones_totales        INTEGER DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id)
);


-- ───────────────────────────────────────────────────────────
-- 3. CURSOS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cursos (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo      TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    estado      TEXT NOT NULL DEFAULT 'borrador'
                    CHECK (estado IN ('publicado', 'borrador', 'archivado')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_cursos') THEN
        CREATE TRIGGER set_updated_at_cursos
            BEFORE UPDATE ON public.cursos
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;


-- ───────────────────────────────────────────────────────────
-- 4. MÓDULOS DE CURSO
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.modulos (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id    UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    titulo      TEXT NOT NULL,
    slug        TEXT NOT NULL,
    orden       INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────
-- 5. LECCIONES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lecciones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id    UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
    modulo_id   UUID REFERENCES public.modulos(id) ON DELETE SET NULL,
    titulo      TEXT NOT NULL,
    slug        TEXT NOT NULL,
    orden       INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────
-- 6. TUTORIALES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tutoriales (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo                TEXT NOT NULL,
    slug                  TEXT UNIQUE,
    descripcion_corta     TEXT,
    imagen_url            TEXT,
    duracion_estimada     INTEGER,
    precio_normal         NUMERIC(10,2),
    nivel                 TEXT,
    categoria             TEXT,
    artista               TEXT,
    tonalidad             TEXT,
    estado                TEXT DEFAULT 'borrador'
                              CHECK (estado IN ('publicado', 'borrador', 'archivado')),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_tutoriales') THEN
        CREATE TRIGGER set_updated_at_tutoriales
            BEFORE UPDATE ON public.tutoriales
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;


-- ───────────────────────────────────────────────────────────
-- 7. PAQUETES DE TUTORIALES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.paquetes_tutoriales (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo                      TEXT NOT NULL,
    slug                        TEXT UNIQUE NOT NULL,
    descripcion                 TEXT,
    descripcion_corta           TEXT,
    imagen_url                  TEXT,
    precio_normal               NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_rebajado             NUMERIC(10,2),
    descuento_porcentaje        INTEGER,
    estado                      TEXT NOT NULL DEFAULT 'borrador'
                                    CHECK (estado IN ('borrador', 'publicado', 'archivado')),
    categoria                   TEXT,
    nivel                       TEXT CHECK (nivel IN ('principiante', 'intermedio', 'avanzado')),
    destacado                   BOOLEAN DEFAULT FALSE,
    total_tutoriales            INTEGER,
    duracion_total_estimada     INTEGER,
    instructor_id               UUID REFERENCES public.perfiles(id),
    tipo_acceso                 TEXT DEFAULT 'premium'
                                    CHECK (tipo_acceso IN ('gratuito', 'premium', 'vip')),
    fecha_expiracion            TIMESTAMPTZ,
    objetivos                   TEXT,
    requisitos                  TEXT,
    incluye                     TEXT,
    ventajas                    TEXT,
    meta_titulo                 TEXT,
    meta_descripcion            TEXT,
    tags                        TEXT[],
    orden_mostrar               INTEGER DEFAULT 0,
    visible                     BOOLEAN DEFAULT TRUE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_paquetes') THEN
        CREATE TRIGGER set_updated_at_paquetes
            BEFORE UPDATE ON public.paquetes_tutoriales
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;


-- ───────────────────────────────────────────────────────────
-- 8. ITEMS DE PAQUETES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.paquetes_tutoriales_items (
    id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paquete_id                      UUID NOT NULL REFERENCES public.paquetes_tutoriales(id) ON DELETE CASCADE,
    tutorial_id                     UUID NOT NULL REFERENCES public.tutoriales(id) ON DELETE CASCADE,
    orden                           INTEGER DEFAULT 0,
    incluido                        BOOLEAN DEFAULT TRUE,
    precio_individual_referencia    NUMERIC(10,2),
    notas                           TEXT,
    UNIQUE (paquete_id, tutorial_id)
);


-- ───────────────────────────────────────────────────────────
-- 9. MEMBRESÍAS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.membresias (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre          TEXT NOT NULL,
    precio_mensual  NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_anual    NUMERIC(10,2) NOT NULL DEFAULT 0,
    descripcion     TEXT,
    activa          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────
-- 10. INSCRIPCIONES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inscripciones (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id              UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    curso_id                UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
    tutorial_id             UUID REFERENCES public.tutoriales(id) ON DELETE SET NULL,
    paquete_id              UUID REFERENCES public.paquetes_tutoriales(id) ON DELETE SET NULL,
    membresia_id            UUID REFERENCES public.membresias(id) ON DELETE SET NULL,
    fecha_inscripcion       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    progreso                INTEGER DEFAULT 0,
    porcentaje_completado   INTEGER DEFAULT 0,
    completado              BOOLEAN DEFAULT FALSE,
    estado                  TEXT DEFAULT 'activo'
                                CHECK (estado IN ('activo', 'pausado', 'completado')),
    ultima_actividad        TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_inscripciones') THEN
        CREATE TRIGGER set_updated_at_inscripciones
            BEFORE UPDATE ON public.inscripciones
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;


-- ───────────────────────────────────────────────────────────
-- 11. PROGRESO DE LECCIONES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.progreso_lecciones (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id              UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    leccion_id              UUID NOT NULL REFERENCES public.lecciones(id) ON DELETE CASCADE,
    estado                  TEXT DEFAULT 'no_iniciada'
                                CHECK (estado IN ('completada', 'en_progreso', 'no_iniciada')),
    porcentaje_completado   INTEGER DEFAULT 0,
    tiempo_total            INTEGER DEFAULT 0,
    calificacion            NUMERIC(5,2),
    notas                   TEXT,
    ultima_actividad        TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, leccion_id)
);


-- ───────────────────────────────────────────────────────────
-- 12. EVENTOS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.eventos (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo                      TEXT NOT NULL,
    slug                        TEXT UNIQUE NOT NULL,
    descripcion                 TEXT,
    descripcion_corta           TEXT,
    categoria                   TEXT,
    tipo_evento                 TEXT CHECK (tipo_evento IN ('masterclass','workshop','concierto','concurso','webinar','reunion')),
    modalidad                   TEXT CHECK (modalidad IN ('virtual','presencial','híbrido')),
    nivel_dificultad            TEXT CHECK (nivel_dificultad IN ('principiante','intermedio','avanzado','profesional')),
    es_publico                  BOOLEAN DEFAULT TRUE,
    es_gratuito                 BOOLEAN DEFAULT TRUE,
    precio                      NUMERIC(10,2) DEFAULT 0,
    imagen_portada              TEXT,
    imagen_banner               TEXT,
    video_promocional           TEXT,
    participantes_inscritos     INTEGER DEFAULT 0,
    calificacion_promedio       NUMERIC(3,2) DEFAULT 0,
    total_calificaciones        INTEGER DEFAULT 0,
    estado                      TEXT DEFAULT 'borrador'
                                    CHECK (estado IN ('borrador','publicado','en_vivo','finalizado','cancelado')),
    fecha_inicio                TIMESTAMPTZ NOT NULL,
    fecha_fin                   TIMESTAMPTZ,
    es_todo_el_dia              BOOLEAN DEFAULT FALSE,
    ubicacion_fisica            TEXT,
    link_transmision            TEXT,
    enlace_grabacion            TEXT,
    codigo_acceso               TEXT,
    capacidad_maxima            INTEGER,
    requiere_inscripcion        BOOLEAN DEFAULT TRUE,
    es_destacado                BOOLEAN DEFAULT FALSE,
    permite_grabacion           BOOLEAN DEFAULT FALSE,
    zona_horaria                TEXT DEFAULT 'America/Bogota',
    moneda                      TEXT DEFAULT 'COP',
    instructor_id               UUID REFERENCES public.perfiles(id),
    instructor_nombre           TEXT,
    instructor_avatar           TEXT,
    creado_por                  UUID REFERENCES public.perfiles(id),
    fecha_publicacion           TIMESTAMPTZ,
    total_visualizaciones       INTEGER DEFAULT 0,
    acepta_invitados            BOOLEAN DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_eventos') THEN
        CREATE TRIGGER set_updated_at_eventos
            BEFORE UPDATE ON public.eventos
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;


-- ───────────────────────────────────────────────────────────
-- 13. INSCRIPCIONES A EVENTOS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.eventos_inscripciones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id           UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    usuario_id          UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    fecha_inscripcion   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (evento_id, usuario_id)
);


-- ───────────────────────────────────────────────────────────
-- 14. CANCIONES HERO (para el simulador AcordeonProMax)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.canciones_hero (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo                      TEXT NOT NULL,
    slug                        TEXT UNIQUE,
    autor                       TEXT NOT NULL,
    descripcion                 TEXT,
    youtube_id                  TEXT,
    tipo                        TEXT,
    dificultad                  TEXT,
    secuencia_json              JSONB NOT NULL DEFAULT '[]',
    bpm                         NUMERIC(6,2) NOT NULL DEFAULT 120,
    tonalidad                   TEXT NOT NULL DEFAULT 'La',
    audio_fondo_url             TEXT,
    secciones                   JSONB,
    duracion_segundos           INTEGER,
    desbloqueo_secuencial       BOOLEAN DEFAULT FALSE,
    umbral_precision_seccion    NUMERIC(5,2) DEFAULT 70,
    intentos_para_moneda        INTEGER DEFAULT 3,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_canciones_hero') THEN
        CREATE TRIGGER set_updated_at_canciones_hero
            BEFORE UPDATE ON public.canciones_hero
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;


-- ───────────────────────────────────────────────────────────
-- 15. SCORES HERO
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scores_hero (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id              UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    cancion_id              UUID NOT NULL REFERENCES public.canciones_hero(id) ON DELETE CASCADE,
    puntuacion              NUMERIC(12,2) NOT NULL DEFAULT 0,
    precision_porcentaje    NUMERIC(5,2) DEFAULT 0,
    notas_totales           INTEGER DEFAULT 0,
    notas_correctas         INTEGER DEFAULT 0,
    notas_falladas          INTEGER DEFAULT 0,
    racha_maxima            INTEGER DEFAULT 0,
    multiplicador_maximo    NUMERIC(4,2) DEFAULT 1,
    modo                    TEXT CHECK (modo IN ('competencia','libre','synthesia')),
    tonalidad               TEXT,
    duracion_ms             INTEGER DEFAULT 0,
    abandono                BOOLEAN DEFAULT FALSE,
    porcentaje_completado   NUMERIC(5,2) DEFAULT 0,
    es_mejor_personal       BOOLEAN DEFAULT FALSE,
    xp_ganado               INTEGER DEFAULT 0,
    seccion_id              UUID,
    seccion_nombre          TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────
-- 16. GRABACIONES HERO
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grabaciones_hero (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id              UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    cancion_id              UUID REFERENCES public.canciones_hero(id) ON DELETE SET NULL,
    modo                    TEXT CHECK (modo IN ('practica_libre','competencia')),
    origen                  TEXT,
    titulo                  TEXT,
    descripcion             TEXT,
    secuencia_grabada       JSONB NOT NULL DEFAULT '[]',
    secuencia_json          JSONB,
    bpm                     NUMERIC(6,2) DEFAULT 120,
    resolucion              INTEGER DEFAULT 192,
    tonalidad               TEXT,
    duracion_ms             INTEGER,
    precision_porcentaje    NUMERIC(5,2),
    puntuacion              NUMERIC(12,2),
    notas_totales           INTEGER,
    notas_correctas         INTEGER,
    es_publica              BOOLEAN DEFAULT FALSE,
    publicacion_id          UUID,  -- FK a comunidad_publicaciones se agrega abajo con ALTER TABLE
    metadata                JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_grabaciones_hero') THEN
        CREATE TRIGGER set_updated_at_grabaciones_hero
            BEFORE UPDATE ON public.grabaciones_hero
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;


-- ───────────────────────────────────────────────────────────
-- 17. EXPERIENCIA DE USUARIO (Gamificación)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.experiencia_usuario (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id          UUID NOT NULL UNIQUE REFERENCES public.perfiles(id) ON DELETE CASCADE,
    nivel               INTEGER NOT NULL DEFAULT 1,
    xp_actual           INTEGER NOT NULL DEFAULT 0,
    xp_total            INTEGER NOT NULL DEFAULT 0,
    xp_siguiente_nivel  INTEGER NOT NULL DEFAULT 100,
    xp_cursos           INTEGER DEFAULT 0,
    xp_simulador        INTEGER DEFAULT 0,
    xp_comunidad        INTEGER DEFAULT 0,
    xp_logros           INTEGER DEFAULT 0,
    racha_dias          INTEGER DEFAULT 0,
    racha_maxima        INTEGER DEFAULT 0,
    ultima_sesion       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_experiencia') THEN
        CREATE TRIGGER set_updated_at_experiencia
            BEFORE UPDATE ON public.experiencia_usuario
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;


-- ───────────────────────────────────────────────────────────
-- 18. MONEDAS DE USUARIO
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.monedas_usuario (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id  UUID NOT NULL UNIQUE REFERENCES public.perfiles(id) ON DELETE CASCADE,
    saldo       INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────
-- 19. XP POR CANCIÓN
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.xp_cancion_usuario (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    cancion_id      UUID NOT NULL REFERENCES public.canciones_hero(id) ON DELETE CASCADE,
    xp_acumulado    INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, cancion_id)
);


-- ───────────────────────────────────────────────────────────
-- 20. MONEDAS POR CANCIÓN
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.monedas_cancion_usuario (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id          UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    cancion_id          UUID NOT NULL REFERENCES public.canciones_hero(id) ON DELETE CASCADE,
    monedas_ganadas     INTEGER DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, cancion_id)
);


-- ───────────────────────────────────────────────────────────
-- 21. LOGROS DEL SISTEMA
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logros_sistema (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre              TEXT NOT NULL,
    descripcion         TEXT,
    descripcion_corta   TEXT,
    icono               TEXT,
    categoria           TEXT CHECK (categoria IN ('constancia','progreso','precision','social','especial','simulador','cursos','comunidad')),
    dificultad          TEXT CHECK (dificultad IN ('facil','medio','dificil','legendario')),
    xp_recompensa       INTEGER DEFAULT 0,
    monedas_recompensa  INTEGER DEFAULT 0,
    titulo_especial     TEXT,
    condiciones         JSONB DEFAULT '{}',
    activo              BOOLEAN DEFAULT TRUE,
    visible             BOOLEAN DEFAULT TRUE,
    orden_mostrar       INTEGER DEFAULT 0,
    fecha_inicio        TIMESTAMPTZ,
    fecha_fin           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────
-- 22. LOGROS DE USUARIO
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.logros_usuario (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id          UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    logro_id            UUID NOT NULL REFERENCES public.logros_sistema(id) ON DELETE CASCADE,
    conseguido          BOOLEAN DEFAULT FALSE,
    progreso_actual     INTEGER DEFAULT 0,
    progreso_objetivo   INTEGER DEFAULT 1,
    porcentaje_progreso NUMERIC(5,2) DEFAULT 0,
    datos_logro         JSONB DEFAULT '{}',
    conseguido_en       TIMESTAMPTZ,
    primer_progreso     TIMESTAMPTZ,
    ultimo_progreso     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (usuario_id, logro_id)
);


-- ───────────────────────────────────────────────────────────
-- 23. RANKING GLOBAL
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ranking_global (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id          UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    tipo_ranking        TEXT NOT NULL CHECK (tipo_ranking IN ('general','semanal','mensual','simulador','cursos','precision','constancia','comunidad','especial')),
    puntuacion          NUMERIC(15,2) NOT NULL DEFAULT 0,
    posicion            INTEGER,
    posicion_anterior   INTEGER,
    metricas            JSONB DEFAULT '{}',
    periodo_inicio      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    periodo_fin         TIMESTAMPTZ,
    temporada           TEXT,
    activo              BOOLEAN DEFAULT TRUE,
    calculated_at       TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────
-- 24. NOTIFICACIONES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id          UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    tipo                TEXT,
    titulo              TEXT NOT NULL,
    mensaje             TEXT NOT NULL,
    icono               TEXT,
    categoria           TEXT CHECK (categoria IN ('contenido','pago','comunidad','progreso','sistema','promocion')),
    prioridad           TEXT DEFAULT 'normal' CHECK (prioridad IN ('alta','normal','baja')),
    leida               BOOLEAN DEFAULT FALSE,
    archivada           BOOLEAN DEFAULT FALSE,
    url_accion          TEXT,
    entidad_id          TEXT,
    entidad_tipo        TEXT,
    datos_adicionales   JSONB DEFAULT '{}',
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_lectura       TIMESTAMPTZ,
    fecha_expiracion    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON public.notificaciones(usuario_id, leida, fecha_creacion DESC);


-- ───────────────────────────────────────────────────────────
-- 25. PREFERENCIAS DE NOTIFICACIONES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.preferencias_notificaciones (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id              UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    tipo_notificacion       TEXT NOT NULL,
    habilitado              BOOLEAN DEFAULT TRUE,
    via_plataforma          BOOLEAN DEFAULT TRUE,
    via_email               BOOLEAN DEFAULT FALSE,
    via_push                BOOLEAN DEFAULT FALSE,
    frecuencia              TEXT DEFAULT 'inmediata'
                                CHECK (frecuencia IN ('inmediata','diaria','semanal','nunca')),
    UNIQUE (usuario_id, tipo_notificacion)
);


-- ───────────────────────────────────────────────────────────
-- 26. PUBLICACIONES DE COMUNIDAD
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comunidad_publicaciones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    titulo          TEXT,
    descripcion     TEXT NOT NULL,
    url_imagen      TEXT,
    url_video       TEXT,
    url_gif         TEXT,
    tipo            TEXT DEFAULT 'texto' CHECK (tipo IN ('texto','imagen','video')),
    encuesta        JSONB,
    fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ
);


-- ───────────────────────────────────────────────────────────
-- 27. COMENTARIOS DE COMUNIDAD
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comunidad_comentarios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publicacion_id  UUID NOT NULL REFERENCES public.comunidad_publicaciones(id) ON DELETE CASCADE,
    usuario_id      UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    contenido       TEXT NOT NULL,
    fecha_creacion  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────
-- 28. LIKES DE PUBLICACIONES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comunidad_publicaciones_likes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publicacion_id  UUID NOT NULL REFERENCES public.comunidad_publicaciones(id) ON DELETE CASCADE,
    usuario_id      UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (publicacion_id, usuario_id)
);


-- ───────────────────────────────────────────────────────────
-- 29. CHATS
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chats (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre                  TEXT,
    descripcion             TEXT,
    imagen_url              TEXT,
    es_grupal               BOOLEAN DEFAULT FALSE,
    tipo_chat               TEXT DEFAULT 'privado' CHECK (tipo_chat IN ('privado','grupo','canal')),
    creado_en               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creado_por              UUID REFERENCES public.perfiles(id),
    ultimo_mensaje_id       UUID,
    ultimo_mensaje_fecha    TIMESTAMPTZ,
    activo                  BOOLEAN DEFAULT TRUE,
    configuracion           JSONB DEFAULT '{}'
);


-- ───────────────────────────────────────────────────────────
-- 30. MIEMBROS DE CHAT
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.miembros_chat (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id                     UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    usuario_id                  UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    es_admin                    BOOLEAN DEFAULT FALSE,
    puede_escribir              BOOLEAN DEFAULT TRUE,
    puede_invitar               BOOLEAN DEFAULT FALSE,
    unido_en                    TIMESTAMPTZ DEFAULT NOW(),
    ultimo_acceso               TIMESTAMPTZ,
    notificaciones_activadas    BOOLEAN DEFAULT TRUE,
    mensajes_no_leidos          INTEGER DEFAULT 0,
    estado_miembro              TEXT DEFAULT 'activo'
                                    CHECK (estado_miembro IN ('activo','silenciado','bloqueado','salido')),
    UNIQUE (chat_id, usuario_id)
);


-- ───────────────────────────────────────────────────────────
-- 31. MENSAJES
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mensajes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id             UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    usuario_id          UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    contenido           TEXT,
    tipo                TEXT DEFAULT 'texto'
                            CHECK (tipo IN ('texto','imagen','audio','video','archivo','sistema','ubicacion','contacto')),
    url_media           TEXT,
    metadata            JSONB DEFAULT '{}',
    mensaje_padre_id    UUID,
    editado             BOOLEAN DEFAULT FALSE,
    eliminado           BOOLEAN DEFAULT FALSE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    editado_en          TIMESTAMPTZ,
    eliminado_en        TIMESTAMPTZ
);


-- ───────────────────────────────────────────────────────────
-- 32. PAGOS EPAYCO
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pagos_epayco (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id          UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    curso_id            UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
    tutorial_id         UUID REFERENCES public.tutoriales(id) ON DELETE SET NULL,
    paquete_id          UUID REFERENCES public.paquetes_tutoriales(id) ON DELETE SET NULL,
    membresia_id        UUID REFERENCES public.membresias(id) ON DELETE SET NULL,
    nombre_producto     TEXT NOT NULL,
    descripcion         TEXT,
    valor               NUMERIC(12,2) NOT NULL,
    iva                 NUMERIC(12,2) DEFAULT 0,
    ico                 NUMERIC(12,2) DEFAULT 0,
    base_iva            NUMERIC(12,2) DEFAULT 0,
    moneda              TEXT DEFAULT 'COP',
    ref_payco           TEXT NOT NULL UNIQUE,
    factura             TEXT,
    estado              TEXT NOT NULL DEFAULT 'pendiente'
                            CHECK (estado IN ('pendiente','aceptada','rechazada','fallida','cancelada','expirada')),
    cod_respuesta       TEXT,
    respuesta           TEXT,
    metodo_pago         TEXT,
    fecha_transaccion   TIMESTAMPTZ,
    datos_adicionales   JSONB DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_pagos') THEN
        CREATE TRIGGER set_updated_at_pagos
            BEFORE UPDATE ON public.pagos_epayco
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pagos_epayco_ref ON public.pagos_epayco(ref_payco);
CREATE INDEX IF NOT EXISTS idx_pagos_epayco_usuario ON public.pagos_epayco(usuario_id, created_at DESC);


-- ───────────────────────────────────────────────────────────
-- ÍNDICES ADICIONALES (performance)
-- ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inscripciones_usuario ON public.inscripciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_scores_hero_cancion ON public.scores_hero(cancion_id, puntuacion DESC);
CREATE INDEX IF NOT EXISTS idx_scores_hero_usuario ON public.scores_hero(usuario_id);
CREATE INDEX IF NOT EXISTS idx_grabaciones_hero_usuario ON public.grabaciones_hero(usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comunidad_publicaciones_fecha ON public.comunidad_publicaciones(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_mensajes_chat ON public.mensajes(chat_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_tipo ON public.ranking_global(tipo_ranking, activo, puntuacion DESC);

-- FK diferida: grabaciones_hero -> comunidad_publicaciones
-- (no se pudo declarar inline porque comunidad_publicaciones se define después)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'grabaciones_hero_publicacion_id_fkey'
    ) THEN
        ALTER TABLE public.grabaciones_hero
            ADD CONSTRAINT grabaciones_hero_publicacion_id_fkey
            FOREIGN KEY (publicacion_id)
            REFERENCES public.comunidad_publicaciones(id)
            ON DELETE SET NULL;
    END IF;
END $$;
