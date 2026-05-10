# Seguridad — Documentación técnica

> **Fecha de consolidación:** 2026-05-10
> **Fuentes consolidadas:**
> - `auditoria_seguridad.md` (raíz, 469 líneas — sesión completa 2026-04-28)
> - `docs/readmes/SEGURIDAD_ANALISIS_COMPLETADO.md`
> - `src/utilidades/configuracionSMTP.md`
> - `src/utilidades/optimizacionesLogin.md`

---

## 0. Resultado ejecutivo

**13 vulnerabilidades CRÍTICAS cerradas el 2026-04-28.** La plataforma pasó de explotable trivialmente con `curl` a defensa en profundidad real con RLS estricta + JWT en Edge Functions + URLs firmadas + CSP + headers + sanitización XSS.

Cuando se activen P1 (Bunny block direct URL) y P2 (Auth leaked password protection), queda **production-ready blindado**.

| Categoría | Estado |
|---|---|
| Auditoría inicial (7 migraciones SQL) | ✅ |
| Signed URLs Bunny + Edge Function | ✅ EF v9 deployada |
| Headers de seguridad (CSP, HSTS, X-Frame, etc.) | ✅ `public/serve.json` |
| DOMPurify para XSS | ✅ 4 lugares |
| Bug bucle 81 requests/carga | ✅ resuelto |
| Bug "Video no disponible" con URL válida | ✅ |
| Mismatch BD `'activo'` vs EF `'activa'` | ✅ EF v9 acepta ambos |
| Bug `Cannot set 'Activity' undefined` (manualChunks circular) | ✅ |
| Cache LRU + preload Bunny | ✅ |

---

## 1. Resumen de cambios — Antes / Después

### Base de datos

| Vulnerabilidad | Antes | Ahora |
|---|---|---|
| Funciones SECURITY DEFINER con `search_path` mutable | **154** | **0** ✅ |
| Policies RLS con `qual=true` o `with_check=true` peligrosas | **21** | **2** (intencionales: leads anónimos, ranking_global) |
| RPCs ejecutables por anon | **77** | **2** (`handle_new_user*` triggers de auth) |
| RPCs que ejecutan SQL arbitrario | **2** (`ejecutar_sql_*`) | **0** ✅ |
| `pagos_epayco`: usuario marcaba pago como 'aceptada' | Sí | **No** ✅ |
| `suscripciones_usuario`: crear premium gratis | Sí | **Solo admin/service_role** |
| `xp_transacciones`: insertar XP arbitrario | Sí | **Solo service_role** |
| `perfiles`: cambiar propio rol a admin | Sí | **WITH CHECK bloquea** |
| Profesor editaba cualquier perfil | Sí | **No** |
| `inscripciones`: cualquiera se inscribía a cualquier curso | Sí | **Policy maliciosa eliminada** |
| RPCs de inscripción/suscripción no verificaban pago | Sí | **Verifican pago aprobado** |
| `partes_tutorial.video_url` legible por cualquier authenticated | Sí | **Solo inscritos / gratis / admin** |
| Storage policies catch-all `qual=true` | Sí | **Eliminadas** |
| Frontend con `supabaseAdmin` + `SERVICE_ROLE_KEY` | **Trampa peligrosa** | **Alias de supabase regular** |
| Buckets `tutoriales`/`cursos` con UPDATE/INSERT/DELETE abiertos | Sí | **Solo admin/profesor** |

### Aplicación

| Capa | Estado |
|---|---|
| Edge Function `obtener-video-firmado` validando inscripción server-side | ✅ EF v9 |
| URLs Bunny firmadas con SHA256 + TTL 2h | ✅ |
| Frontend usa hook `useVideoFirmado` con cache + dedupe | ✅ |
| Headers HSTS / CSP / X-Frame / X-Content / Referrer / Permissions | ✅ |
| DOMPurify en `dangerouslySetInnerHTML` (4 lugares) | ✅ |
| Trampa `supabaseAdmin` en frontend neutralizada | ✅ |

---

## 2. Migraciones SQL aplicadas

```
sprint0_drops_seguridad_critica
sprint1a_pago_y_privilegios
sprint1b_storage_hardening_v2
sprint2_privacidad_blog_v2
sprint3_search_path_y_revoke_anon
sprint3b_revoke_from_public
sprint3c_fix_estadisticas_acordeon
```

### Sprint 0 — DROPs reversibles

**Funciones eliminadas:**
- `ejecutar_sql_seguro(text)` — SECURITY DEFINER ejecutaba SQL arbitrario sin auth check.
- `ejecutar_sql_administrador(text)` — check de admin roto (apuntaba a tabla `profiles` inexistente).
- `toggle_like_publicacion_sin_auth(uuid, uuid)` y `toggle_like_publicacion(uuid, uuid)` — aceptaban `usuario_id` arbitrario.
- `delete_user_profile(uuid)`, `save_profile(uuid, jsonb)` — funciones muertas.

**Policies eliminadas:**
- `inscripciones`: `Admin can manage all inscripciones` (qual=true → bypass total).
- `cursos`/`lecciones`/`modulos`: `Permitir acceso público a *` cmd=ALL qual=true.
- `lecciones`: usuarios autenticados pueden insertar/actualizar.
- `comunidad_comentarios`: `allow_update_from_trigger` qual=true.
- `comunidad_publicaciones_likes`: 3 policies qual=true.
- `blog_articulos`: insertar/actualizar qual=true.
- `perfiles`: 6 SELECT duplicadas qual=true + 8 UPDATE redundantes sin WITH CHECK.
- `perfiles`: `Profesores pueden editar perfiles de estudiantes` (escalación a admin).
- `canciones_hero`: 2 policies inseguras.
- `miembros_chat`: 4 policies con `auth.uid() IS NOT NULL`.
- `chats_envivo_academia`: `chats_insert_simple/all` con_check=true.
- 5 SELECT redundantes en `cursos`, 4 en `modulos`, 2 en `comentarios_lecciones`.

### Sprint 1A — Pago y privilegios

**`perfiles` UPDATE policy con WITH CHECK** que bloquea cambio de:
`rol`, `suscripcion`, `eliminado`, `membresia_activa_id`, `fecha_inicio_membresia`, `fecha_vencimiento_membresia`. Admin puede cambiar todo (policy separada).

**`pagos_epayco`:** UPDATE de usuario eliminado. Solo admin/service_role (vía webhook).

**`suscripciones_usuario`:** INSERT/UPDATE solo service_role o admin.

**`xp_transacciones`:** INSERT solo service_role (los triggers SECURITY DEFINER bypasean RLS).

**`miembros_chat`:** 4 policies recreadas — solo creador del chat o el propio miembro pueden modificar.

**`canciones_hero`:** solo admin puede INSERT/UPDATE/DELETE.

**RPCs reescritas con verificación de pago:**
- `inscripcion_directa(p_curso_id)` → si curso es pago, requiere `pagos_epayco.estado='aceptada'`. Si gratis, permite.
- `inscribir_a_curso(p_usuario_id, p_curso_id)` → admin/service_role para otros; uno mismo delega en `inscripcion_directa`.
- `inscribir_usuario_paquete` → solo admin/service_role.
- `crear_suscripcion` → solo admin/service_role.

**`partes_tutorial` SELECT:** solo si tutorial es gratis OR usuario inscrito directamente OR usuario en paquete OR admin/profesor.

### Sprint 1B — Storage hardening

**Policies catch-all eliminadas:**
- `Lectura pública de archivos` (cualquier rol leía cualquier objeto, incluyendo `grabaciones-daw`).
- `Lectura pública de objetos de storage`.
- `Usuarios autenticados pueden subir archivos/objetos`.

**Policies SELECT específicas creadas para buckets que dependían del catch-all:**
`comunidad_select_publico`, `imagenes_articulos_select_publico`, `sim_instrumentos_select_publico`.

**Buckets `tutoriales` y `cursos`:** INSERT/UPDATE/DELETE restringido a admin/profesor (6 policies recreadas).

**Frontend `_cliente.ts` neutralizado:** `supabaseAdmin` ahora es alias de `supabase` regular, sin SERVICE_ROLE_KEY. Compatibilidad mantenida con los 5 archivos que lo importan.

### Sprint 2 — Privacidad / Blog / Robustez

**Triggers convertidos a SECURITY DEFINER + `search_path = public`:**
`actualizar_xp_balanceado`, `actualizar_xp_simple`, `procesar_actividad_gamificacion`, `trigger_xp_balanceado`, `update_inscripcion_ultima_actividad`, `procesar_actividad_usuario`.

**Policies `with_check=true` peligrosas eliminadas:**
- `estadisticas_usuario`: `El sistema puede insertar estadísticas para cualquier usuario`.
- `experiencia_usuario`: `El sistema puede insertar experiencia para cualquier usuario`.
- `ranking_global`: `El sistema puede insertar ranking para cualquier usuario` + 2 SELECT permisivas.
- `notificaciones`: `Permitir insertar notificaciones de mensajería`.

**`blog_articulos`:** INSERT/UPDATE/DELETE restringido a admin/editor (mitiga vector XSS).

**Vista `perfiles_publica`** sin `correo_electronico`, `whatsapp`, `documento_*`, `direccion_completa`.

### Sprint 3 — Endurecimiento general

- 60 funciones SECURITY DEFINER recibieron `SET search_path = public` vía DO block.
- `REVOKE EXECUTE FROM PUBLIC` + `GRANT EXECUTE TO authenticated, service_role` en todas excepto `handle_new_user*`.
- Eliminadas funciones peligrosas: `crear_politicas_bucket_cursos()`, `verificar_politicas_bucket(text)`, `verificar_politicas_cursos()`.
- `estadisticas_acordeon` INSERT restringido a `auth.uid() = usuario_id`.

---

## 3. Edge Functions

| Slug | verify_jwt | Estado |
|---|---|---|
| `crear-usuario-admin` | true | ✅ Valida JWT + rol admin |
| `epayco-webhook` | false | ✅ Valida firma SHA256 (pendiente: idempotencia, ver `PAGOS.md` P5) |
| `eliminar-usuario` | false | ✅ KILL SWITCH 503 (rehabilitar con auth correcta) |
| `obtener-video-firmado` | true | ✅ v9 — JWT + admin/inscripción/gratis. Acepta `estado IN ('activo','activa','completada')` |

### `obtener-video-firmado` v9
- Valida JWT del usuario.
- Permite acceso si: rol admin/editor, tutorial/curso gratis, inscripción directa, o paquete que incluye el tutorial.
- Para lecciones: resuelve `curso_id` desde `lecciones.modulo_id → modulos.curso_id` cuando `lecciones.curso_id` es NULL.
- Devuelve URL Bunny firmada con SHA256 + TTL 2h.

### Hook frontend `useVideoFirmado` (`src/hooks/useVideoFirmado.ts`)
- Cache module-level `Map<clave, EntradaCache>` (sobrevive entre montajes).
- Dedupe global: N instancias simultáneas comparten 1 fetch real.
- Cache LRU limitado a 50 entradas (`podarCache()` tras cada `set`).
- Errores tipados: `sin_acceso`, `no_autenticado`, `no_encontrado`, `desconocido`.
- Función `refrescar()` para forzar refetch.

### Componentes refactorizados
- `src/componentes/VisualizadorDeLeccionesDeCursos/ReproductorLecciones.tsx` — acepta `parteId` y `leccionId`, muestra CTA "Contenido bloqueado" cuando `error.codigo === 'sin_acceso'`.
- `src/Paginas/Tutoriales/ClaseTutorial.tsx` — pasa `parteId={clase.id}`.
- `src/Paginas/Cursos/ClaseCurso.tsx` — pasa `leccionId={leccion.id}`.

### Decisión técnica clave
Cuando hay URL firmada, se usa **directamente como `src` del iframe** sin pasarla por `useReproductorLecciones.procesarUrl()`. Si lo procesa, los query params del token (`?token=...&expires=...`) se descartan y el iframe falla.

---

## 4. Headers de seguridad (CSP)

Archivo: **`public/serve.json`** (Vite copia a `dist/serve.json` en build, leído por `serve` en producción).

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(self), geolocation=()
Content-Security-Policy: <ver abajo>
```

### CSP completo
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval'
  https://checkout.epayco.co
  https://www.googletagmanager.com
  https://www.google-analytics.com
  https://static.cloudflareinsights.com
  https://*.cloudflareinsights.com;
script-src-elem 'self' 'unsafe-inline'
  https://checkout.epayco.co
  https://www.googletagmanager.com
  https://www.google-analytics.com
  https://static.cloudflareinsights.com
  https://*.cloudflareinsights.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' https: data: blob:;
media-src 'self' https://iframe.mediadelivery.net https://*.b-cdn.net https://*.youtube.com;
frame-src 'self' https://iframe.mediadelivery.net https://*.youtube.com
  https://www.youtube.com https://checkout.epayco.co;
connect-src 'self'
  https://tbijzvtyyewhtwgakgka.supabase.co
  wss://tbijzvtyyewhtwgakgka.supabase.co
  https://www.google-analytics.com
  https://*.google-analytics.com
  https://*.analytics.google.com
  https://www.googletagmanager.com
  https://*.cloudflareinsights.com
  https://api.epayco.co;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self' https://checkout.epayco.co;
```

### Servicios externos detectados e incluidos
- Google Tag Manager / GA4
- Cloudflare Insights
- Bunny Stream (`iframe.mediadelivery.net`, `*.b-cdn.net`)
- ePayco Checkout
- Supabase (HTTPS + WSS)
- YouTube embeds
- Google Fonts
- flagcdn.com (cubierto por `img-src https:`)

---

## 5. DOMPurify para XSS

**Dependencia:** `dompurify@3.4.1` + `@types/dompurify`.

Archivo: `src/utilidades/sanitizar.ts`
- `sanitizarHTML(html)` — whitelist de tags incluyendo SVG (para iconos).
- `sanitizarTextoConSaltos(texto)` — convierte `\n` a `<br>` y sanitiza.

Aplicado en:
- `src/Paginas/Blog/ArticuloIndividual.tsx:120` — contenido del blog.
- `src/Paginas/Eventos/DetalleEvento.tsx:75` — descripción del evento.
- `src/componentes/Perfil/PestanasPerfil.tsx:114` — iconos SVG hardcodeados.
- `src/Paginas/Inicio/Componentes/HeroHome.tsx:58` — i18n estático.

---

## 6. Bugs críticos resueltos durante audit

### Bug 1 — `Cannot set 'Activity' undefined` (manualChunks circular)
**Síntoma:** TypeError en producción, `react-vendor` y `vendor` chunks fallaban.

**Causa raíz:** warnings de build ignorados:
```
Circular chunk: vendor -> react-vendor -> vendor
Circular chunk: vendor -> react-vendor -> three-vendor -> vendor
```
`manualChunks` en `vite.config.ts` usaba `id.includes('react')` que matcheaba `@react-three/*`, `react-i18next`, `react-helmet-async` → ciclos. Al inicializarse, `Fe.Activity = b` con `Fe = undefined`.

**Fix:** regex con path exacto del paquete.
```js
if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store)[\\/]/.test(id))
```

**Resultado:**
- `react-vendor`: 514 KB → 235 KB (−54%).
- 0 circular chunks.
- Build time: 13.49s → 8.77s (−35%).

Después se quitó `charts-vendor`, `animation-vendor`, `media-vendor` por más circulares. Solo `react-vendor`, `three-vendor`, `supabase-vendor`, `i18n-vendor` quedan separados.

### Bug 2 — Bucle infinito 81 requests/carga a `obtener-video-firmado`
**Síntoma:** 1 request cada 400-500ms continuamente al abrir cualquier clase.

**Causa raíz (detectada al 3er intento):** la EF devolvía `expires_at: 1777425393` (Unix segundos) pero el código hacía:
```js
expiresAt: data.expires_at ? new Date(data.expires_at) : null
```
`new Date(1777425393)` interpreta como **milisegundos** → año 1970 → `entradaValida()` siempre false → cache MISS eterno → re-render del padre dispara nuevo fetch.

**Fix:** función `parsearExpiresAt()` con heurística:
```js
function parsearExpiresAt(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') {
    return new Date(raw < 10_000_000_000 ? raw * 1000 : raw);
  }
  return new Date(raw);
}
```

### Bug 3 — "Video no disponible" con URL válida
EF v9 devolvía URL firmada (200 OK) pero `ReproductorLecciones.tsx` mostraba error.

**Causa:** se pasaba `videoUrl: ''` al hook legacy `useReproductorLecciones`, que tiene `setTieneError(true)` para strings vacíos. El render evaluaba `errorFirmado || tieneError || !srcIframe` y mostraba error.

**Fix:**
```diff
- } : errorFirmado || tieneError || !srcIframe ? (
+ } : errorFirmado || (!usarFirmado && tieneError) || !srcIframe ? (
```

### Bug 4 — EF v8 mismatch `'activo'` vs `'activa'`
```sql
SELECT estado, COUNT(*) FROM inscripciones GROUP BY estado;
-- activo:  875
-- activa:    4
```

EF v8 buscaba la convención minoritaria. **875 inscritos legítimos sin acceso.**

**Fix v9:**
```js
const ESTADOS_VALIDOS = ['activo', 'activa', 'completada'];
if (insTut && ESTADOS_VALIDOS.includes(insTut.estado) && ...
```

---

## 7. Configuración SMTP (recuperación de contraseña)

### Problema
Supabase por defecto **solo envía emails a miembros de la organización**. Por eso recuperar contraseña fallaba para usuarios externos.

**Síntomas:**
- Emails no registrados aparecen como "enviados".
- Emails registrados externos no reciben nada.
- AuthRetryableFetchError ocasional.
- Ocurre en localhost y producción.

### Solución: SMTP custom
Tres opciones documentadas:

#### Opción 1: Gmail SMTP (gratis, dev)
1. Google Account → 2-Step Verification ON → App passwords → generar para "Mail" (16 chars).
2. Supabase → Authentication → Settings → SMTP Settings → Enable custom SMTP:
   ```
   Host: smtp.gmail.com
   Port: 587
   User: tu-email@gmail.com
   Password: <16 chars>
   ```

#### Opción 2: Resend (gratis, recomendado producción)
1. Resend.com → API Keys → Create.
2. Domains → Add `academiavallenataonline.com` → DNS records.
3. Supabase SMTP:
   ```
   Host: smtp.resend.com
   Port: 587
   User: resend
   Password: <api_key>
   ```

#### Opción 3: SendGrid (gratis, 100/día)
```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: <api_key>
```

### URLs de redirección (Supabase Auth)
**Site URL:** `https://academiavallenataonline.com`

**Redirect URLs:**
```
https://academiavallenataonline.com/**
https://academiavallenataonline.com/recuperar-contrasena
http://localhost:5173/**
http://localhost:5173/recuperar-contrasena
```

### Email Template "Reset Password"
```html
<h2>Restablecer Contraseña - Academia Vallenata</h2>
<p>Haz clic en el enlace para restablecer tu contraseña:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer Contraseña</a></p>
<p>Este enlace expira en 1 hora.</p>
<p>Si no solicitaste este cambio, ignora este email.</p>
```

---

## 8. Optimización de login (no es seguridad estricta, pero relacionado)

### Antes
Login → consultar sesiones históricas → actualizar sesión → tracking → geoloc → goto. **~2.9s.**

### Ahora
Login → perfil básico → `goto('/panel-estudiante')` **inmediato (~400ms)**. Datos completos cargan en `setTimeout(..., 100)` en segundo plano.

```ts
// ANTES (bloqueante)
await consultarSesionesHistoricas();
await actualizarSesion();
await inicializarTracking();
await geolocalizacion();
goto('/panel-estudiante');

// AHORA
const { data } = await supabase.auth.signInWithPassword();
const perfil = await obtenerPerfilBasico();
setUsuario(perfil);
goto('/panel-estudiante');
setTimeout(() => cargarDatosCompletos(), 100);
```

`ProteccionAutenticacion`: `cargandoAuth = false` desde el inicio (era `true` bloqueante).

`+layout.svelte` / equivalente React: `servicioGeoEspanol.rastreoCompleto()` ahora corre en `setTimeout(..., 100)` no bloquea navegación.

---

## 9. Buckets Storage

| Bucket | public | Acción admin | Pendiente |
|---|---|---|---|
| `avatars` | true | own-folder restriction | OK |
| `comunidad` | true | — | OK |
| **`cursos`** | **true** | INSERT/UPDATE/DELETE solo admin | **P1: privatizar via Bunny toggle** |
| `fotoportada` | true | — | OK |
| `grabaciones-daw` | false | own-folder | OK |
| `imagenes` | true | admin/profesor manage | OK |
| `imagenes_articulos` | true | — | OK |
| `imagenes-blog` | true | owner update/delete | OK |
| `paquetes-imagenes` | true | authenticated insert | OK |
| `pistas_hero` | true | — | OK |
| `sim-instrumentos` | true | — | OK |
| **`tutoriales`** | **true** | INSERT/UPDATE/DELETE solo admin | **P1: privatizar via Bunny toggle** |
| `usuarios` | true | own-folder | OK |

---

## 10. Pendientes (no urgentes)

### P1 — Activar "Block direct URL file access" en Bunny Stream
**Cuándo:** después de 24-48h de uso confirmado de signed URLs.
**Cómo:** Bunny dashboard → Library "Cursor Nueva Academia" → Settings → Security → Block direct URL file access: ON.
**Efecto:** URLs sin token firmado responden 401. Cierra el último vector C2 del audit.

### P2 — Activar settings en Supabase Auth Dashboard
1. Auth → Settings → Password Policy → **Leaked password protection: ON** (advisor `auth_leaked_password_protection`).
2. Auth → Settings → Rate Limits → endurecer signup, signin, recover.

### P3 — Upgrade Postgres
Versión actual `15.8.1.054` con CVEs parchados en versiones más nuevas. Programar upgrade con Supabase support, ~30 min downtime.

### P4 — Cloudflare WAF rate limiting
- `auth/signup`, `auth/signin`, `auth/recover` → 5 req/min/IP.
- RPCs sensibles (`obtener_ranking_*`, `inscripcion_directa`) → 30 req/min/IP.
- INSERT a `leads_chat_anonimos`, `chats_envivo_academia` → 10 req/min/IP.
- INSERT a `scores_hero` → 6 req/min/usuario (anti-farmeo).
- `obtener-video-firmado` → 60 req/min/IP.

### P5 — Webhook ePayco idempotente
Ver [`PAGOS.md`](./PAGOS.md) sección 12.

### P6 — Limpiar funciones BD duplicadas
- `registrar_progreso_leccion` (3 versiones).
- `inscribir_usuario_automaticamente` (2 versiones).
- `upsert_geolocalizacion_usuario` (2 versiones).

### P7 — Mover hardcoded ePayco public keys a env
Ver [`PAGOS.md`](./PAGOS.md) sección 3.

### P8 — Mover extensión de schema public a schema extensions
Advisor `extension_in_public`. Bajo impacto.

---

## 11. Riesgos reales aún existentes

1. **Hasta P1 activado**, URLs públicas viejas siguen sirviendo videos. Mitigación temporal: RLS de `partes_tutorial.video_url` ya restringe LECTURA a inscritos.
2. **Frontend siempre será reverse-engineerable.** Quitamos el ofuscador (no era seguridad real). La defensa real está en BD/RLS/EF que NO confían en el cliente.
3. **`leads_chat_anonimos` permite INSERT abierto** (intencional para chat de visitantes). Sin rate limit, alguien puede hacer spam.
4. **3 RPCs SECURITY DEFINER aún ejecutables por anon** (`handle_new_user*`, `monitoreo_uso_ipapi_espanol`). Triggers de auth o no críticas.

---

## 12. Verificación SQL post-fix

```sql
-- 1. RPCs peligrosas eliminadas (esperado: 0)
SELECT COUNT(*) FROM pg_proc
WHERE proname IN ('ejecutar_sql_seguro','ejecutar_sql_administrador',
                  'toggle_like_publicacion_sin_auth','toggle_like_publicacion',
                  'delete_user_profile','save_profile')
AND pronamespace=(SELECT oid FROM pg_namespace WHERE nspname='public');

-- 2. SECURITY DEFINER sin search_path (esperado: 0)
SELECT COUNT(*) FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace=n.oid
WHERE n.nspname='public' AND p.prokind='f' AND p.prosecdef=true
AND (p.proconfig IS NULL OR NOT EXISTS (
  SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%'
));

-- 3. Storage catch-all eliminadas (esperado: 0)
SELECT COUNT(*) FROM pg_policies
WHERE schemaname='storage' AND tablename='objects'
AND policyname IN ('Lectura pública de archivos','Lectura pública de objetos de storage');

-- 4. Vista pública de perfiles existe (esperado: 1)
SELECT COUNT(*) FROM information_schema.views
WHERE table_schema='public' AND table_name='perfiles_publica';

-- 5. EF v9 simulación de inscripción
WITH u AS (SELECT id FROM perfiles WHERE correo_electronico = 'rambo@gmail.com')
SELECT i.estado,
  (i.estado IN ('activo','activa','completada')) AS pasa_v9
FROM inscripciones i JOIN u ON u.id = i.usuario_id
WHERE i.tutorial_id = '8c8fadcf-f6ef-43ce-81ef-15481eb110fb';
```

---

## 13. Lecciones aprendidas

1. **Los warnings del build son señales reales.** Se ignoró 4 veces el warning `Circular chunk: vendor -> react-vendor -> vendor`. Era la causa del bug `Activity undefined`.
2. **Diagnóstico hipotético vs evidencia objetiva.** Se asumió 3 veces que el bucle de requests era timer/dependencies/desmontajes. La evidencia objetiva (response capturado en Network: `expires_at: 1777425393` como NUMBER) reveló que era `new Date(unix_seconds)` mal interpretado.
3. **Ofuscación de JS no es seguridad.** Quitarla mejoró build time (38% más rápido) y bundle size (−256 KB).
4. **Cuando el usuario dice "sigue fallando" pero los logs/datos dicen otra cosa, los datos ganan.**
5. **La causa raíz es 1, los efectos son muchos.** El bucle de 81 requests parecía 5 causas; era 1: `new Date(1777425393)` = año 1970.
