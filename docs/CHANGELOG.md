# Changelog — Hitos del proyecto

> **Fecha de consolidación:** 2026-05-10
> **Fuentes consolidadas:**
> - `Avances_Registradoss/Archivo_de_hace_un_tiempo.md`
> - `Avances_Registradoss/2026-04-11-mejoras-panel-estudiante.md`
> - `error_deploy.md` (2026-04-27)
> - `error_deploy_2026_05_10.md`
> - `optimizacion-pro-2026-abril.md`
> - `avances_antes_de_coronar.md`
> - `Problema sincronizacion.md`
> - `MDS/CUESTIONARIO_VPRO_ACADEMIA.md`
> - `docs/GAMIFICACION_DOCUMENTACION.md`
> - `docs/readmes/README_COMUNIDAD.md`
> - `docs/readmes/README_RANKING.md`
> - `docs/readmes/README_panel_contenido.md`

Registro cronológico de hitos importantes (no sesiones detalladas — eso ya vive en los docs maestros).

---

## 2026-05 — Pulido pre-lanzamiento

### Mensajes y notificaciones
- **2026-05-10** — Doble border en input mensajes (override CSS global a `.em_textarea`). Click en `/notificaciones` ahora navega inmediato y marca leída en background (mismo patrón que dropdown).
- Avatar realtime en mensajes/notif. Fix 403 INSERT. Cache de avatares.
- Checkbox "Notificar tutorial" agregado al panel admin.

### Simulador / Pro Max
- **2026-05-08** — Rediseño completo barra de herramientas SimuladorApp (paleta cyan/slate "DAW pro"). Modo Foco premium/free con timer 60s. Galería de modelos visuales (3 modelos iniciales: Pro MAX, Rojo, Verde). Banner Ecosistema HERO carrusel rotativo 5s con 6 mensajes. Renombres: APRENDE→TUTORIALES, LOOPS→PISTAS.
- **2026-05-07** — REC manual + replay en SimuladorApp. Acordeón virtual embebido en clases (admin only). Limpieza profunda visualizador lecciones (~239 líneas eliminadas). Sub-buses TECLADO/BAJOS con StereoPanner. Reverb sintético 5 presets. Panel FX reusable.
- **2026-05-06** — CHANGELOG_SESION_07: Reorganización carpeta Juego/, modo Maestro al 100%, motor audio dual (`ReproductorMP3PreservaTono`). BPM no altera tono en Maestro.
- **2026-05-03** — Sesión sincronía notas↔MP3: 4 enfoques fallaron. **Bug NO resuelto**, hipótesis: bug en grabación o calibración manual por canción.
- **2026-05-01** — Bug fix iOS: bypass HTMLAudio → Web Audio API directa. Causa: Supabase sirve MP3 con `Content-Type: octet-stream`, iOS rechaza.

### Seguridad
- **2026-04-28** — Auditoría completa: **13 vulnerabilidades CRÍTICAS cerradas**. 7 migraciones SQL aplicadas. EF `obtener-video-firmado` v9 desplegada. Hook `useVideoFirmado` con cache LRU + dedupe. CSP en `public/serve.json`. DOMPurify en 4 lugares. Bug bucle 81 req/carga resuelto (`new Date(unix_seconds)` mal interpretado). Detalles en [`SEGURIDAD.md`](./SEGURIDAD.md).

---

## 2026-04 — Optimización Pro

### Reglas aplicadas globalmente
- **Máx 300 líneas por `.tsx`** — lógica a hooks `.ts`.
- **Cero `console.*`** en archivos tocados.
- **`alert()` / `confirm()` / `prompt()`** → estado React local + UI inline.
- Sin cambios a lógica/funcionalidad/estilos visuales.

### Patrones aplicados
- **Patrón A:** `alert()` → banner inline con `setMensajeAccion`.
- **Patrón B:** `confirm()` → estado pendiente + botones inline.
- **Patrón C:** `prompt()` → input inline con onBlur/onKeyDown.
- **Patrón D:** `confirm()` en hook → mover lógica de UX al componente (hook queda solo con lógica de datos).

### Fases completadas
| Fase | Zona | Estado |
|---|---|---|
| Fase 1–4 | `src/Paginas/AcordeonProMax/` (simulador completo) | ✅ |
| Fase 5 | `src/Paginas/administrador/Usuarios/` | ✅ |
| Fase 6 | `src/Paginas/administrador/` (15 archivos) | ✅ |
| Fase 7 | Eliminar huérfanos (`DetalleUsuario.tsx`, `CrearUsuario.tsx`) | ✅ |
| Fase 8 | Alerts/confirms en hooks y páginas (7 archivos) | ✅ |
| Fase 9 | `src/Core/componentes/` (4 archivos) | ✅ |
| Fase 10 — Grupos A/B/C/D | `src/componentes/` (completo) | ✅ |

### Sesiones notables
- **2026-04-27** — AcordeonProMax EditorSecuencia: `BarraTimelineProMax` reemplaza `BarraReproductorPracticaLibre`. Arquitectura Portal con `ReactDOM.createPortal`. Bug audio silencioso en "Revisando" corregido (6º arg de `actualizarBotonActivo` a `false`).
- **2026-04-13** — Reproductor `ReproductorRec.tsx` independiente reemplaza `BarraTransporte` con errores. Documentación de estilos `admin-rec-*`, `reproductor-rec-*`, `estudio-practica-libre-*`.
- **2026-04-11** — Mejoras PanelEstudiante: removido auto-play slider (89 líneas), eliminado loading simulation (28 líneas). 5 archivos `Pagos/Email*` agregados al repo (resolvió error de deploy "Could not resolve EmailCompletarWrapper").

---

## 2026-03 — Acordeón Hero (Guitar Hero del acordeón)

### 2026-03-28 — Modos de Práctica + Práctica Libre + Modo Guiado
- 4 modos: Competitivo, Libre, Synthesia, Maestro Solo.
- **Bug fix crítico** `useReproductorHero`: rAF loop ahora sigue vivo aunque pausado (antes hacía `return` sin reprogramar → reproductor congelado para siempre).
- **Bug fix** Synthesia no avanzaba: closure stale en `procesarGolpeAlumno` (`deps=[]` capturaba `alternarPausa` con `reproduciendo=false`). Fix con ref estable `_reproductoActionsRef`.
- Práctica Libre sin canción accesible desde selector.
- Modo Guiado como sub-toggle de Maestro Solo.
- Sin countdown 3-2-1 en modos práctica.

### 2026-03-27 — DevLog completo Acordeón Hero
- Layout dual Maestro + Alumno con SVG puente bezier.
- HUD superior con vida, combo, BPM slider.
- Beat indicator pulsando al BPM.
- 5 modelos visuales del acordeón.

### Gestor de pistas (BPM tap + conteo)
Componente `GestorPistasHero.tsx`. Tapear `P` (mín 3 taps) → BPM detectado + fase del audio. Conteo hacia atrás programado con `AudioContext.currentTime` (sample-accurate). Botón "⏺ Grabar con N clicks" arranca grabación cuando termina conteo. **Pendiente:** guardar `faseAudio` y `bpmDetectado` en `canciones_hero.beat_offset_seconds`.

---

## 2026-04-04 a 2026-04-10 — Pagos en debugging

- **2026-04-10** — Sesión debugging webhook ePayco. Logs detallados agregados a Edge Function. Validación de firma SHA256 **temporalmente comentada** para aislar problema. Pre-llenado de datos de usuario en `ModalPagoInteligente` con query a `perfiles`. Rediseño limpio de `PagoExitoso.css`. Bug `ref_payco` resuelto (`?invoice=` ahora viaja en URL response). Detalles en [`PAGOS.md`](./PAGOS.md).
- **2026-04** — Sistema XP + Monedas implementado. Tablas `scores_hero`, `xp_transacciones`, `xp_cancion_usuario`, `monedas_usuario`, `monedas_transacciones`, `monedas_cancion_usuario`, `validaciones_tutorial`. 9 triggers automáticos. Detalles en [`ACORDEON_PROMAX.md`](./ACORDEON_PROMAX.md) sección 6.

---

## 2026-04-27 — Error de deploy (resuelto)

`fix: corrige error de sintaxis en useSesionTracker.ts y actualiza log de error`. Build en Nixpacks → Caddy. Detalles del log en archivo original (no relevantes para mantener).

## 2026-05-10 — Error de deploy (en investigación)

Build siguió completo en EasyPanel. No hubo error explícito en el log capturado. Puede haber sido por commits intermedios (revert de `/acordeon-3d-test`, `Pruebas3D`).

**Lecciones de deploys anteriores:**
- Verificar archivos trackeados antes de hacer push (`git status`). Componentes nuevos sueltos rompen build.
- Imports relativos a archivos no trackeados → "Could not resolve" en producción.
- `manualChunks` mal configurado → circular deps en runtime, no en build.
- Ofuscador → no es seguridad real, mejor quitarlo (build 38% más rápido, bundle −256 KB).

---

## Comunidad — Estado al 2025

> Documentado original en español el 17 de junio de 2025.

### Tablas
- `comunidad_publicaciones` (campo `descripcion`, no `contenido`).
- `comunidad_comentarios` (campo `comentario`).
- `comunidad_publicaciones_likes`, `comunidad_comentarios_likes`.

### Componentes
- `FeedPublicaciones` — muestra publicaciones, botones (like, comentar, compartir), recarga reactiva.
- `ComunidadComentarios` — gestión por publicación.
- `ComunidadPublicar` — crear publicaciones (texto, imagen, video, audio).

### Lógica
- Likes: array de IDs de usuario que dieron like; UI optimista.
- Contador de comentarios: siempre real desde Supabase.
- Comentar enfoca input automáticamente.

### Drift conocido al cerrar audit
`comunidadService.ts` tenía nombres de campos desalineados con BD (`contenido` vs `descripcion`/`comentario`). Pendiente normalizar antes de meter grabaciones en feed.

---

## Ranking

Componente `RankingComunidadNuevo.tsx`. RPC `obtener_ranking_hibrido_completo` cruza `experiencia_usuario` + `perfiles` + `estadisticas_usuario`. 6 categorías (general, simulador, cursos, precisión, constancia, comunidad).

**Drift detectado al cerrar audit:** el widget visible usaba datos mock. La RPC ya estaba completa.

---

## Panel administrativo

### Panel de Contenido (`/administrador/panel-contenido`)
- Lista tutoriales: buscar, filtrar, editar, eliminar, ordenar.
- Visualización estado visible/no visible.

### Crear Contenido (`/administrador/crear-contenido`)
- Crear y editar tutoriales con sus partes (secciones).
- Cada parte tiene: `tipo_parte` (introducción, pase_intermedio, pase_final, acompañamiento, extra), `tipo_contenido` (video, texto, pdf), `titulo`, `descripcion`, `orden`, `visible`.
- Si `tipo_contenido='video'` → usa `video_url`.
- Si `texto`/`pdf` → usa `contenido` (HTML/markdown).
- Reordenar partes drag-and-drop.

### Cambios recientes
- Eliminado campo `recursos_adicionales`.
- Eliminado campo `duracion`.
- Agregado campo `tipo_contenido`.

### Mejoras pendientes
- Editor WYSIWYG para `contenido`.
- Preview en vivo.
- Subida de archivos multimedia inline.
- Edición colaborativa / historial de cambios.
- Notificaciones a admins.

---

## Visión V-PRO Digital (cuestionario estratégico)

Resumen de decisiones de producto del cuestionario 2026-04 (30 preguntas en 6 áreas). Detalles completos en [`ARQUITECTURA.md`](./ARQUITECTURA.md) sección 9.

### Hardware
- PCB profesional pendiente (hoy es prototipo de cables).
- Batería: UPS 12V + 18650 + LM2596 (autonomía completa).
- Amplificador 80W + 2 parlantes 5".
- Sensor fuelle: hoy fader analógico, objetivo BMP280.
- Botones: hoy pulsadores genéricos, objetivo botones reales de acordeón.

### Audio
- WAV 22050Hz en SD.
- Sin reverb/delay (sonido seco).
- Polifonía 10 voces, **necesita optimización** (PLOP/TAC al pisar notas).
- Bajos funcionan correctamente.

### Cloud
- Supabase no conectado aún al ESP32.
- Login objetivo: QR en pantalla del acordeón → web → autoriza dispositivo.
- OTA via WiFi pendiente.
- Modo offline: solo tonos de acordeón, sin academia.
- Conexión: serial USB → objetivo MIDI nativo.

### Simulador web
- Modelo 3D `.glb` en proceso (freelancer Blender, 1 semana).
- Avatar realista del usuario (sin derechos de autor).
- Notas en cascada Guitar Hero.

### Educación
- Grabación de eventos (botón ID + tiempo) pendiente en ambos lados.
- Evaluación: web Guitar Hero / ESP32 detecta presión correcta + timing.
- Multi-plataforma: web principal + app nativa Android/iOS futura.
- Feedback en V-PRO: luz hoy, vibración futuro.

### Negocio
- Lanzamiento: 2 unidades funcionales primero. Después escalar.
- Precio: $1,790,000 COP solo hardware. Suscripción separada.
- Webinar 3 días: problema → tecnología → lanzamiento + preventa 50 unidades.

### "Mierdero mental" actual
1. Sonido al pisar notas (PLOP/TAC).
2. Fuelle fluido sin entrecortar notas.
3. Acordeón se sienta robusto, no juguete.

---

## Sistema de gamificación (visión)

### Concepto
- **XP:** se gana por casi cualquier acción.
- **Niveles:** curva exponencial.
- **Ranking:** ligas General, Simulador, Constancia.
- **Logros:** medallas desbloqueables (sistema implementado parcialmente).
- **Monedas:** economía virtual (1 = $100 COP).

### Servicios core
- `gamificacionServicio.ts` — XP, niveles, ranking. Falta lógica de `verificarLogros` (logros automáticos).
- `logicaJuego.ts` (Svelte legacy, ya migrado a `useReproductorHero.ts`) — Motor Guitar Hero. Calcula Perfect (±50ms), Good (±100ms), Miss.

### Estado actual
| Característica | Estado React |
|---|---|
| Servicio Base XP | ✅ Completo |
| Ranking UI | ⚠️ Parcial (RPC OK, frontend usa mock en algunos lugares) |
| Motor de Juego | ✅ Migrado a `useReproductorHero` |
| Sistema Logros automático | ❌ Falta `verificarLogros` |
| Ranking Backend | ✅ Completo (RPC `obtener_ranking_hibrido_completo`) |

---

## Pendientes destacados al 2026-05-10

### Críticos
1. ❌ **Sincronía notas↔MP3** en `ReproductorCancionHero` y `EstudioAdmin`. Ver [`SIMULADOR.md`](./SIMULADOR.md) sección 9.
2. 🟡 Re-habilitar validación de firma SHA256 del webhook ePayco una vez confirmado que llega.
3. 🟡 P5 — Webhook ePayco idempotente con activación de membresía/inscripción dentro del webhook.

### Altos
4. P1 Bunny "Block direct URL" tras 24-48h.
5. P2 Auth leaked password protection ON.
6. P3 Upgrade Postgres.
7. P4 Cloudflare WAF rate limiting.
8. PWA real con service worker offline.
9. Liberar acordeón embebido en clases a todos los roles (hoy admin only).

### Medios
10. Conectar reverb/ecualizador al motor real (hoy solo se guardan en metadata).
11. Crear tablas `sim_pistas_practica_libre` + capas.
12. Premium gating limpio.
13. P6 Limpiar funciones BD duplicadas (3 versiones de `registrar_progreso_leccion`, etc.).
14. P7 Mover ePayco public keys a env.
15. F2-F4 GaleriaAcordeones (editor colores, premium gating, marca de agua).
16. EQ 5 bandas reales (hoy mapea a 3).
17. Eco y Distorsión funcionales (hoy UI placeholder).
18. Sistema `verificarLogros` automático.
19. Normalizar `comunidadService.ts` con BD real (`contenido` vs `descripcion`/`comentario`).

### Bajos
20. Quitar `console.log` con prefix `[Replay]` / `[Loops]` antes de go-live.
21. Detectar actividad real en Modo Foco (reset timer si toca).
22. P8 Mover extensiones a schema `extensions`.

---

## Checklist mínimo lanzamiento (referencia)

- [ ] Probar TODO en mobile real, no solo desktop.
- [ ] Verificar pagos end-to-end con tarjeta de prueba en producción.
- [ ] Plausible / Google Analytics configurado para conversión.
- [ ] Llenar `canciones_hero` con 10-20 canciones vallenatas reales.
- [ ] Tomar 1 video de 30s del simulador en acción para redes.
- [ ] Bunny "Block direct URL" activado.
- [ ] Auth leaked password protection ON.
- [ ] Webhook ePayco con firma re-habilitada.
