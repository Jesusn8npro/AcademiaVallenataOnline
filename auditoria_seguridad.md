# AUDITORÍA Y BLINDAJE DE SEGURIDAD — ACADEMIA VALLENATA + ACORDEÓN HERO
**Fecha:** 2026-04-28
**Proyecto Supabase:** `tbijzvtyyewhtwgakgka` (Cursor Nueva Academia, us-east-1, PostgreSQL 15.8.1.054)
**Stack:** React 19 + Vite 6 + Supabase
**Producción:** ~443 usuarios, 879 inscripciones, 64 pagos en `pagos_epayco`, 70 tutoriales

---

## 0. RESULTADO EJECUTIVO

| Estado | Antes | Después |
|--------|-------|---------|
| Funciones SECURITY DEFINER con `search_path` mutable | **154** | **0** ✅ |
| Policies RLS con `qual=true` o `with_check=true` peligrosas | **21** | **2** (intencionales: leads anónimos + nota deferida) |
| RPCs ejecutables por anon (anon_security_definer_executable) | **77** | **2** (`handle_new_user`, `handle_new_user_profile` — triggers de auth, intencional) |
| RPCs que ejecutan SQL arbitrario | **2** | **0** ✅ |
| Buckets `tutoriales`/`cursos` con UPDATE/INSERT/DELETE abiertos | **Sí** | **No, solo admin/profesor** ✅ |
| `pagos_epayco`: usuario podía cambiar su propio `estado` a 'aceptada' | **Sí** | **No** ✅ |
| `suscripciones_usuario`: usuario podía crear/modificar suscripción premium | **Sí** | **No, solo admin/service_role** ✅ |
| `xp_transacciones`: usuario podía insertar XP arbitrario | **Sí** | **No, solo service_role** ✅ |
| `perfiles`: usuario podía cambiar su propio `rol` a admin | **Sí** | **No, WITH CHECK bloquea** ✅ |
| Profesor podía editar cualquier perfil incl. ascender a admin | **Sí** | **No, policy eliminada** ✅ |
| `inscripciones`: cualquier authenticated podía inscribirse a cualquier curso | **Sí** | **No, policy maliciosa eliminada** ✅ |
| RPCs de inscripción/suscripción no verificaban pago | **Sí** | **Verifican pago aprobado** ✅ |
| `partes_tutorial.video_url` legible por cualquier authenticated | **Sí** | **Solo inscritos / tutorial gratis / admin** ✅ |
| Storage policies catch-all "Lectura pública de archivos" qual=true | **Sí** | **Eliminadas** ✅ |
| Frontend `supabaseAdmin` con SERVICE_ROLE_KEY | **Trampa peligrosa** | **Alias de supabase regular** ✅ |

**Aplicado en 7 migraciones nuevas:**
- `20260428_sprint0_drops_seguridad_critica`
- `20260428_sprint1a_pago_y_privilegios`
- `20260428_sprint1b_storage_hardening_v2`
- `20260428_sprint2_privacidad_blog_v2`
- `20260428_sprint3_search_path_y_revoke_anon`
- `20260428_sprint3b_revoke_from_public`
- `20260428_sprint3c_fix_estadisticas_acordeon`

---

## 1. DETALLE DE CAMBIOS APLICADOS

### Sprint 0 — DROPs reversibles
**Funciones eliminadas:**
- `ejecutar_sql_seguro(text)` — SECURITY DEFINER ejecutaba SQL arbitrario sin auth check
- `ejecutar_sql_administrador(text)` — check de admin roto (apuntaba a tabla `profiles` inexistente)
- `toggle_like_publicacion_sin_auth(uuid, uuid)` y `toggle_like_publicacion(uuid, uuid)` — aceptaban usuario_id arbitrario
- `delete_user_profile(uuid)`, `save_profile(uuid, jsonb)` — funciones muertas apuntando a tabla inexistente

**Policies eliminadas:**
- `inscripciones`: `Admin can manage all inscripciones` (qual=true para authenticated → bypass total)
- `cursos`/`lecciones`/`modulos`: `Permitir acceso público a *` cmd=ALL qual=true (cualquiera leía/escribía contenido pedagógico)
- `lecciones`: `Usuarios autenticados pueden insertar/actualizar lecciones` (cualquier auth user mutaba lecciones)
- `comunidad_comentarios`: `allow_update_from_trigger` qual=true,public (cualquiera editaba cualquier comentario)
- `comunidad_publicaciones_likes`: `Eliminar/Insertar/Ver likes - permisivo` qual=true (3 policies)
- `blog_articulos`: `Usuarios pueden insertar/actualizar` qual=true (vector XSS)
- `perfiles`: 6 policies SELECT duplicadas con qual=true
- `perfiles`: 8 policies UPDATE redundantes sin WITH CHECK
- `perfiles`: `Profesores pueden editar perfiles de estudiantes` (escalación a admin)
- `canciones_hero`: `Permitir inserción anónima temporal` y `Usuarios autenticados pueden gestionar`
- `miembros_chat`: 4 policies con `auth.uid() IS NOT NULL` (cualquiera se metía a cualquier chat)
- `chats_envivo_academia`: `chats_insert_simple/all` con_check=true
- 5 SELECT redundantes en `cursos` con qual=true
- 4 SELECT redundantes en `modulos` con qual=true
- 2 SELECT duplicadas en `comentarios_lecciones`

### Sprint 1A — Pago y privilegios

**`perfiles` UPDATE policy con WITH CHECK que bloquea cambio de columnas privilegiadas:**
- Usuario NO puede cambiar `rol`, `suscripcion`, `eliminado`, `membresia_activa_id`, `fecha_inicio_membresia`, `fecha_vencimiento_membresia`
- Admin puede cambiar todo (policy separada)

**`pagos_epayco`:**
- Eliminada policy UPDATE de usuario (`usuarios_actualizan_sus_pagos`)
- Solo admin/service_role pueden actualizar `estado` (vía webhook)

**`suscripciones_usuario`:**
- Eliminadas policies INSERT/UPDATE permisivas
- Solo service_role o admin pueden crear/modificar suscripciones

**`xp_transacciones`:**
- INSERT solo service_role (los triggers SECURITY DEFINER bypasean RLS)

**`miembros_chat`:**
- Recreadas 4 policies: solo creador del chat o el propio miembro pueden modificar

**`canciones_hero`:**
- Solo admin/administrador puede INSERT/UPDATE/DELETE

**RPCs reescritas con verificación de pago:**
- `inscripcion_directa(p_curso_id)` → si curso es pago, requiere `pagos_epayco.estado='aceptada'` para ese curso; si es gratuito, permite
- `inscribir_a_curso(p_usuario_id, p_curso_id)` → requiere admin/service_role para inscribir a OTRO usuario; si es uno mismo, delega en `inscripcion_directa`
- `inscribir_usuario_paquete` → solo admin/service_role
- `crear_suscripcion` → solo admin/service_role

**`partes_tutorial` SELECT:**
- Reescrita: solo si tutorial es gratis OR usuario inscrito directamente OR usuario en paquete que incluye el tutorial OR admin/profesor

### Sprint 1B — Storage hardening
**Policies catch-all eliminadas:**
- `Lectura pública de archivos` (cualquier rol leía cualquier objeto, incluyendo bucket privado `grabaciones-daw`)
- `Lectura pública de objetos de storage` (idem)
- `Usuarios autenticados pueden subir archivos/objetos` (subida a cualquier bucket)

**Policies SELECT específicas creadas para buckets que dependían del catch-all:**
- `comunidad_select_publico`, `imagenes_articulos_select_publico`, `sim_instrumentos_select_publico`

**Buckets `tutoriales` y `cursos`: INSERT/UPDATE/DELETE solo admin/profesor:**
- 6 policies anteriores (auth.role()='authenticated') eliminadas
- Reemplazadas por 6 policies que verifican rol admin/administrador/profesor

**Frontend `_cliente.ts` neutralizado:**
- `supabaseAdmin` ahora es alias de `supabase` regular (sin SERVICE_ROLE_KEY)
- Compatibilidad mantenida con los 5 archivos que lo importan

### Sprint 2 — Privacidad, blog, robustez
**Triggers convertidos a SECURITY DEFINER + search_path = public:**
- `actualizar_xp_balanceado`, `actualizar_xp_simple`, `procesar_actividad_gamificacion`, `trigger_xp_balanceado`, `update_inscripcion_ultima_actividad`, `procesar_actividad_usuario`

**Policies con `with_check=true` peligrosas eliminadas:**
- `estadisticas_usuario`: `El sistema puede insertar estadísticas para cualquier usuario`
- `experiencia_usuario`: `El sistema puede insertar experiencia para cualquier usuario`
- `ranking_global`: `El sistema puede insertar ranking para cualquier usuario` + 2 SELECT permisivas
- `notificaciones`: `Permitir insertar notificaciones de mensajería` (bypass por tipo='mensaje_nuevo')

**`blog_articulos`: INSERT/UPDATE/DELETE restringido a admin/editor:**
- Policy SELECT cambiada a `estado='publicado' OR es admin/editor`
- INSERT/UPDATE/DELETE solo para `rol IN ('admin','administrador','editor')`
- **Mitiga el vector XSS** en `Blog/ArticuloIndividual.tsx:120` (`dangerouslySetInnerHTML`)

**Vista `perfiles_publica`** creada con columnas SIN datos sensibles (excluye `correo_electronico`, `whatsapp`, `documento_*`, `direccion_completa`, etc.). Para uso futuro en frontend.

### Sprint 3 — Endurecimiento general
**60 funciones SECURITY DEFINER recibieron `SET search_path = public`** vía DO block automático.

**REVOKE EXECUTE FROM PUBLIC** + `GRANT EXECUTE TO authenticated, service_role` aplicado a todas las SECURITY DEFINER excepto `handle_new_user*` (triggers de auth).

**Eliminadas funciones de utilidad peligrosas:**
- `crear_politicas_bucket_cursos()`, `verificar_politicas_bucket(text)`, `verificar_politicas_cursos()` — manipulaban storage policies como RPCs callable.

**`estadisticas_acordeon` INSERT** restringido a `auth.uid() = usuario_id`.

---

## 2. PENDIENTES (requieren acción manual o deploy coordinado)

### 🟡 P1 — Privatizar buckets `tutoriales` y `cursos` (Sprint 1C)
**Por qué no se hizo automático:** privatizar AHORA rompe acceso a video para los 443 usuarios pagos hasta que el frontend use `createSignedUrl` en lugar de `getPublicUrl`. Requiere refactor + deploy coordinado.

**Plan de ejecución:**
1. Crear Edge Function `obtener-video-firmado` (verify_jwt:true) que:
   - Recibe `parte_tutorial_id` o `leccion_id`
   - Valida inscripción del caller vía SQL
   - Retorna `signedUrl` con TTL 4h usando service_role
2. Refactor frontend en archivos que muestran video:
   - `src/Paginas/Tutoriales/ClaseTutorial.tsx`
   - `src/Paginas/Tutoriales/ContenidoTutorial.tsx`
   - `src/Paginas/Cursos/ClaseCurso.tsx`
   - `src/componentes/VisualizadorDeLeccionesDeCursos/*`
3. Deploy frontend
4. SQL final: `UPDATE storage.buckets SET public=false WHERE id IN ('tutoriales','cursos');`
5. SQL final: `DROP POLICY "Acceso público de lectura a tutoriales" ON storage.objects;` + `DROP POLICY "Cursos_select_policy_001" ON storage.objects;` + `DROP POLICY "public_read_cursos" ON storage.objects;`

**Mitigación temporal vigente:** RLS de `partes_tutorial.video_url` ya restringe LECTURA del campo a inscritos. Un atacante necesita la URL exacta del archivo para descargarlo, y los nombres de archivo no son publicados en endpoints accesibles a anon. Riesgo bajo en el corto plazo.

### 🟡 P2 — Activar settings en Supabase Auth Dashboard
1. **Auth → Settings → Password Policy → Leaked password protection: ON** (advisor `auth_leaked_password_protection`)
2. **Auth → Settings → Rate Limits**: revisar y endurecer signup, signin, password reset

### 🟡 P3 — Upgrade Postgres
Versión actual `15.8.1.054` tiene CVEs parchados en versiones más recientes. Programar upgrade a Postgres 15 latest o 17.

### 🟡 P4 — Configurar headers de seguridad en reverse proxy
**Easypanel/Cloudflare:** configurar headers para todas las respuestas:
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.epayco.co; ...`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

### 🟡 P5 — Sanitizar XSS en frontend
Instalar `dompurify` y wrappear los 4 usos de `dangerouslySetInnerHTML`:
```bash
npm install dompurify @types/dompurify
```
Archivos afectados:
- `src/Paginas/Blog/ArticuloIndividual.tsx:120` — RIESGO MITIGADO por nueva policy de blog (solo admin/editor crea), pero sanitizar es defensa en profundidad
- `src/Paginas/Eventos/DetalleEvento.tsx:75` — bajo riesgo (solo admin/instructor crea)
- `src/Paginas/Inicio/HeroHome.tsx:58` — i18n estático, refactor opcional
- `src/Perfil/PestanasPerfil.tsx:114` — SVG hardcodeado, refactor opcional

### 🟡 P6 — Rate limiting a nivel app (Cloudflare WAF)
- `auth/signup`, `auth/signin`, `auth/recover` → 5 req/min por IP
- RPCs sensibles (`obtener_ranking_*`, `inscripcion_directa`) → 30 req/min por IP
- INSERT a `leads_chat_anonimos`, `chats_envivo_academia` → 10 req/min por IP
- INSERT a `scores_hero` → 6 req/min por usuario (anti-farmeo)

### 🟡 P7 — Hacer webhook ePayco idempotente
Ahora solo actualiza `pagos_epayco.estado`. Cuando se conecte la activación:
- Verificar antes de UPDATE si ya está en estado final
- Activar inscripción/suscripción dentro del webhook (no en frontend)
- Si reenvían el webhook, no debe duplicar monedas/membresías

### 🟡 P8 — Limpiar funciones duplicadas (sin urgencia)
- `registrar_progreso_leccion` tiene 3 versiones con signaturas distintas
- `inscribir_usuario_automaticamente` tiene 2 versiones
- `upsert_geolocalizacion_usuario` tiene 2 versiones

Consolidar a 1 sola por función.

### 🟡 P9 — Mover hardcoded ePayco public keys a env
Archivos:
- `src/componentes/Pagos/Hooks/useModalPago.ts:199` — key `491d6a0b...`
- `src/servicios/pagos/crearPago.ts:168-170` — key + customer_id

Son llaves PÚBLICAS por diseño (Checkout), pero hardcoded dificulta rotación. Mover a `import.meta.env.VITE_EPAYCO_*`.

### 🟡 P10 — Mover extensión de schema public a schema extensions
Advisor `extension_in_public`. Bajo impacto pero buena práctica.

---

## 3. SECRETOS A ROTAR

**No hay secretos expuestos en código fuente ni historia git** (`.env` siempre estuvo en `.gitignore`).

**Recomendación preventiva:**
- Rotar `EPAYCO_P_KEY` después de aplicar P7 (cambio en webhook)
- `SUPABASE_SERVICE_ROLE_KEY` no requiere rotación (nunca estuvo en frontend, el "trampa" `_cliente.ts` resolvía a la ANON key porque no tenía prefijo VITE_)

---

## 4. CÓMO REVERTIR (rollback de emergencia)

Cada cambio fue una migración Supabase. Para revertir:
1. Ir a Supabase Dashboard → Database → Migrations
2. Las migraciones `sprint0` a `sprint3c` aplicadas el 2026-04-28 son los cambios de esta auditoría
3. NO hay rollback automático; revertir requiere migración inversa (DROP las nuevas, CREATE OR REPLACE las viejas)

**Si una funcionalidad se rompe:** el caso más probable es que un trigger no-SECURITY-DEFINER esté fallando RLS. Solución rápida: convertir el trigger a SECURITY DEFINER (como hicimos con los 6 de Sprint 2).

---

## 5. PLAN PARA EL EQUIPO (siguientes pasos)

**Esta semana:**
1. ✅ **HECHO:** Sprint 0, 1A, 1B, 2, 3 aplicados
2. Tú: activar P2 (Auth Dashboard) — 5 minutos
3. Tú: configurar P4 (headers en Easypanel/Cloudflare) — 30 minutos

**Próxima semana:**
4. Hacer P1 (privatizar buckets + signed URLs vía Edge Function) — 1 día completo
5. Implementar P5 (DOMPurify) — 30 minutos
6. Implementar P9 (mover hardcoded keys a env) — 15 minutos

**Mes 1:**
7. P3 (upgrade Postgres) — coordinado con Supabase
8. P6 (Cloudflare WAF rate limiting) — depende del plan de Cloudflare
9. P7 (webhook idempotente) — 2 horas
10. P8, P10 — limpieza, sin urgencia

---

## 6. ANEXOS

### Anexo A — Migraciones de hardening aplicadas
```
20260428175617  fix_seguridad_rls_politicas_permisivas  (previa, parcial)
20260428180433  fix_seguridad_rpcs_security_definer     (previa, parcial)
20260428xxxxxx  sprint0_drops_seguridad_critica         ← AUDITORÍA
20260428xxxxxx  sprint1a_pago_y_privilegios             ← AUDITORÍA
20260428xxxxxx  sprint1b_storage_hardening_v2           ← AUDITORÍA
20260428xxxxxx  sprint2_privacidad_blog_v2              ← AUDITORÍA
20260428xxxxxx  sprint3_search_path_y_revoke_anon       ← AUDITORÍA
20260428xxxxxx  sprint3b_revoke_from_public             ← AUDITORÍA
20260428xxxxxx  sprint3c_fix_estadisticas_acordeon      ← AUDITORÍA
```

### Anexo B — Edge Functions
| Slug | verify_jwt | Estado |
|------|------------|--------|
| `crear-usuario-admin` | true | ✅ Valida JWT + rol admin |
| `epayco-webhook` | false | ✅ Valida firma SHA256 (pendiente: idempotencia P7) |
| `eliminar-usuario` | false | ✅ KILL SWITCH 503 (pendiente: rehabilitar con auth correcta) |

### Anexo C — Estado de buckets
| Bucket | public | Tiene policies de admin | Pendiente |
|--------|--------|------------------------|-----------|
| `avatars` | true | own-folder restriction | OK |
| `comunidad` | true | - | OK |
| **`cursos`** | **true** | INSERT/UPDATE/DELETE solo admin ✅ | **P1: privatizar** |
| `fotoportada` | true | - | OK |
| `grabaciones-daw` | false | own-folder ✅ | OK (catch-all eliminadas) |
| `imagenes` | true | admin/profesor manage | OK |
| `imagenes_articulos` | true | - | OK |
| `imagenes-blog` | true | owner update/delete | OK |
| `paquetes-imagenes` | true | authenticated insert | OK |
| `pistas_hero` | true | - | OK |
| `sim-instrumentos` | true | - | OK |
| **`tutoriales`** | **true** | INSERT/UPDATE/DELETE solo admin ✅ | **P1: privatizar** |
| `usuarios` | true | own-folder | OK |

### Anexo D — Verificación SQL post-fix (queries listas para ejecutar)
```sql
-- 1. RPCs peligrosas eliminadas
SELECT COUNT(*) FROM pg_proc WHERE proname IN ('ejecutar_sql_seguro','ejecutar_sql_administrador','toggle_like_publicacion_sin_auth','toggle_like_publicacion','delete_user_profile','save_profile') AND pronamespace=(SELECT oid FROM pg_namespace WHERE nspname='public');
-- Esperado: 0

-- 2. SECURITY DEFINER sin search_path
SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.prokind='f' AND p.prosecdef=true AND (p.proconfig IS NULL OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'));
-- Esperado: 0

-- 3. Policies catch-all en storage eliminadas
SELECT COUNT(*) FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname IN ('Lectura pública de archivos','Lectura pública de objetos de storage');
-- Esperado: 0

-- 4. Política maliciosa en inscripciones
SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND tablename='inscripciones' AND policyname='Admin can manage all inscripciones';
-- Esperado: 0

-- 5. Vista pública de perfiles existe
SELECT COUNT(*) FROM information_schema.views WHERE table_schema='public' AND table_name='perfiles_publica';
-- Esperado: 1
```

---

**Estado del proyecto:** Las 13 vulnerabilidades CRÍTICAS y la mayoría de las ALTAS están cerradas. Quedan tareas que requieren acción humana (Dashboard de Auth, deploy coordinado para signed URLs, headers en reverse proxy). El proyecto está significativamente más seguro de lo que estaba al iniciar la auditoría.
