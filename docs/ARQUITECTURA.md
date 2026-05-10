# Arquitectura — Academia Vallenata Online

> **Fecha de consolidación:** 2026-05-10
> **Fuentes consolidadas:**
> - `MDS/HOJA_DE_RUTA_ACORDEON.md`
> - `MDS/V-PRO_Ecosistema_Inteligente.md`
> - `MDS/VistaAbiertaProyecto_PasarAReal.md`
> - `MDS/CUESTIONARIO_VPRO_ACADEMIA.md`
> - `MDS/README.md`
> - `docs/readmes/README.md`
> - `docs/readmes/README_ANALISIS_COMPLETO.md`
> - `MDS/Camino al exito acordeon MIDI.md` (ausente, solo referido)
> - `NuevoMIDI/Prueba_modulos/IntegracionPantalla/GUIA_CALIBRACION_VPRO.md`

Este documento es la visión global del producto y su arquitectura técnica.

---

## 1. Producto

**Academia Vallenata Online** es un ecosistema educativo para acordeón vallenato que combina:

- Cursos estructurados (físicos y virtuales) con video Bunny Stream privado.
- Tutoriales individuales con sistema de partes (intro, pase intermedio, pase final, acompañamiento, extra).
- Simulador de acordeón web (estilo Guitar Hero) con grabación + replay.
- Suite Acordeón Pro Max (modos: Competitivo, Libre, Synthesia, Maestro Solo, Práctica Libre).
- Comunidad social con publicaciones, comentarios, likes, ranking.
- Blog y eventos en vivo.
- Mensajería privada y notificaciones realtime.
- Gamificación con XP, monedas, niveles, ranking global.
- Pagos integrados con ePayco.
- Panel administrativo completo.
- Hardware **V-PRO Digital**: acordeón electrónico físico ESP32 que se conecta a la academia (futuro).

---

## 2. Stack técnico

### Frontend
- **React 19** + **Vite 6** + **TypeScript**
- **CSS puro** (preferido) + **Tailwind CSS** donde aporta
- **react-router-dom** para rutas
- **react-i18next** para internacionalización (español por defecto)
- **react-helmet-async** para SEO
- **Three.js + React Three Fiber + Drei** para 3D
- **Web Audio API** (sin Howler.js — motor propio `AudioEnginePro.ts`)
- **DOMPurify** para sanitizar HTML (XSS)
- **framer-motion** y **recharts** donde aplique

### Backend
- **Supabase** (proyecto `tbijzvtyyewhtwgakgka`, us-east-1, Postgres 15.8.1.054)
  - Auth (email/password + OAuth Google/Facebook)
  - Storage (buckets: `avatars`, `cursos`, `tutoriales`, `comunidad`, `imagenes`, `imagenes-blog`, `imagenes_articulos`, `paquetes-imagenes`, `pistas_hero`, `sim-instrumentos`, `usuarios`, `fotoportada`, `grabaciones-daw` privado)
  - PostgreSQL con RLS estricto
  - Edge Functions (Deno):
    - `crear-usuario-admin` (verify_jwt: true, valida rol admin)
    - `epayco-webhook` (verify_jwt: false, valida firma SHA256)
    - `obtener-video-firmado` (verify_jwt: true, devuelve URL Bunny firmada)
    - `eliminar-usuario` (kill switch 503, pendiente rehabilitar)

### Servicios externos
- **Bunny Stream** para video con signed URLs (token + expires + SHA256, TTL 2h)
- **ePayco** para pagos (Colombia)
- **Cloudflare** delante (CDN + futuro WAF rate limiting)
- **EasyPanel** (Nixpacks → Docker → Caddy) para deploy
- **Google Tag Manager / GA4** para analítica
- **Cloudflare Insights** para métricas

### Build / Deploy
- `npm run build` (Vite)
- `npm run preview` o `serve` con `public/serve.json` (CSP + headers)
- Deploy en EasyPanel desde GitHub

---

## 3. Estructura de carpetas

```
src/
├── App.tsx                              ← rutas raíz
├── main.tsx
├── Core/
│   ├── audio/
│   │   ├── AudioEnginePro.ts            ← motor de audio Web Audio API (sub-buses, reverb, pan)
│   │   ├── ReproductorMP3.ts            ← wrapper AudioBufferSourceNode (iOS-friendly)
│   │   └── _tipos.ts
│   ├── componentes/
│   │   ├── CuerpoAcordeon.tsx           ← render de pitos del acordeón
│   │   └── ContenedorBajos.tsx
│   └── hooks/
│       ├── useLogicaAcordeon.ts         ← cerebro del acordeón virtual
│       ├── useReproductorHero.ts        ← motor RAF de replay
│       └── useGrabadorHero.ts           ← grabador de eventos tick-based
├── Paginas/
│   ├── SimuladorApp/                    ← Simulador móvil/landscape (PWA-friendly)
│   ├── SimuladorDeAcordeon/             ← Simulador clásico desktop + Acordeón Hero
│   ├── AcordeonProMax/                  ← Pro Max: PracticaLibre, EstudioAdmin, GrabadorV2
│   ├── Cursos/, Tutoriales/             ← visualizador de lecciones
│   ├── Blog/, Eventos/, Comunidad/, Ranking/
│   ├── Membresias/, Paquetes/
│   ├── Pagos/                           ← PagoExitoso, PagoError, PagoConfirmacion
│   ├── Mensajes/, Notificaciones/
│   ├── Perfil/                          ← MisGrabaciones, MisCursos, configuración
│   ├── PanelEstudiante/
│   └── administrador/                   ← gestión cursos, usuarios, pagos, blog, contenido
├── componentes/                         ← compartidos (Pagos, Comunidad, Mensajeria, Navegacion, etc.)
├── servicios/                           ← lógica de negocio (gamificacion, pagos, notificaciones, etc.)
├── hooks/
├── utilidades/
├── contextos/                           ← UsuarioContext, etc.
├── tipos/
└── i18n/                                ← traducciones

public/
├── serve.json                           ← CSP + headers (HSTS, X-Frame, etc.)
├── acordeones/                          ← modelos visuales (pro-max, rojo, verde)
├── assets/, efectos/, modelos3d/

supabase/
└── functions/                           ← Edge Functions

docs/                                    ← esta documentación
```

---

## 4. Rutas principales

| Ruta | Descripción |
|---|---|
| `/` | Landing con HeroHome + beneficios |
| `/cursos` | Catálogo de cursos y tutoriales |
| `/curso/:slug` | Detalle del curso |
| `/curso/:slug/clase/:leccionId` | Visualizador de lección (video Bunny firmado) |
| `/tutorial/:slug` | Detalle del tutorial |
| `/tutorial/:slug/clase/:parteId` | Visualizador de tutorial |
| `/comunidad` | Feed social con likes y comentarios |
| `/blog`, `/blog/:slug` | Artículos |
| `/eventos`, `/eventos/:slug` | Calendario de eventos en vivo |
| `/ranking` | Ranking global gamificado (6 categorías, scroll infinito) |
| `/membresias`, `/paquetes` | Planes y paquetes |
| `/simulador-de-acordeon` | Simulador clásico desktop |
| `/simulador-app` | Simulador móvil/landscape (PWA-friendly) |
| `/acordeon-hero` | Juego Guitar Hero del acordeón |
| `/acordeon-pro-max` | Home de Pro Max |
| `/acordeon-pro-max/acordeon` | Práctica Libre estudiante |
| `/acordeon-pro-max/admin/practica` | Estudio Admin (grabador) |
| `/acordeon-3d-test` | Pruebas R3F (acordeón 3D) |
| `/grabaciones`, `/perfil/grabaciones` | Mis Grabaciones (replay) |
| `/mensajes`, `/notificaciones` | Sistema social |
| `/mi-perfil`, `/mis-cursos`, `/configuracion`, `/publicaciones` | Perfil del usuario |
| `/panel-estudiante` | Dashboard del alumno |
| `/administrador/*` | Panel admin (cursos, usuarios, pagos, blog, eventos, paquetes, contenido, notificaciones) |
| `/pago-exitoso`, `/pago-error`, `/pago-confirmacion` | Resultado pago ePayco |
| `/recuperar-contrasena`, `/sesion_cerrada`, `/contacto`, `/nuestra-academia` | Misc |
| `/api/*` | Endpoints (`pagos/*`, `proxy-bunny`, `health`) |

---

## 5. Autenticación y roles

- **Auth con Supabase Auth.** Email/password + OAuth (Google, Facebook).
- Trigger `handle_new_user` crea automáticamente `perfiles` al registrarse.
- **Roles:** `estudiante`, `profesor` (editor), `admin`. Stored en `perfiles.rol`.
- **Guard frontend:** `ProteccionAutenticacion` y `useUsuario()` desde `UsuarioContext`.
- **RLS:** todas las tablas públicas tienen RLS activo. Ver [`SEGURIDAD.md`](./SEGURIDAD.md).
- **Login optimizado:** redirige inmediatamente y carga datos en segundo plano (~400ms vs 2.9s antes).
- **SMTP custom configurado** (Resend o Gmail SMTP) — Supabase default solo manda a miembros de la organización. Ver [`SEGURIDAD.md`](./SEGURIDAD.md).

---

## 6. Base de datos (~50 tablas)

### Usuarios
- `perfiles` (auth.users.id ← FK), `perfiles_publica` (vista sin datos sensibles)
- `experiencia_usuario`, `estadisticas_usuario`, `xp_transacciones`
- `monedas_usuario`, `monedas_transacciones`

### Contenido
- `cursos`, `modulos`, `lecciones`, `progreso_lecciones`, `inscripciones`
- `tutoriales`, `partes_tutorial`, `progreso_tutorial`
- `paquetes`, `paquete_tutoriales`, `inscripciones_paquete`
- `blog_articulos`, `blog_comentarios`, `blog_categorias`
- `eventos`, `eventos_inscripciones`

### Simulador / Acordeón Hero / Pro Max
- `canciones_hero` (catálogo, 74 registros aprox., con `secuencia_json`, `audio_fondo_url`, `tonalidad`, `bpm`, `youtube_id`, `slug`)
- `grabaciones_estudiantes_hero` (grabaciones de usuarios, con metadata jsonb)
- `scores_hero` (resultados de partidas)
- `xp_cancion_usuario`, `monedas_cancion_usuario` (techo 100 XP / 10 monedas por canción)
- `validaciones_tutorial` (videos de alumno aprobados por profesor)
- `sim_ajustes_usuario` (preferencias del simulador, `preferencias_practica_libre` jsonb)
- `sim_instrumentos`, `estadisticas_acordeon`

### Comunidad
- `comunidad_publicaciones` (campo `descripcion`, no `contenido`)
- `comunidad_comentarios` (campo `comentario`, no `contenido`)
- `comunidad_publicaciones_likes`, `comunidad_comentarios_likes`

### Mensajería / Notificaciones
- `conversaciones`, `mensajes`, `miembros_chat`
- `notificaciones`, `chats_envivo_academia`, `leads_chat_anonimos`

### Pagos
- `pagos_epayco` (PK `ref_payco`, estado: `pendiente|aceptada|rechazada|fallida`)
- `suscripciones_usuario`, `membresias`

### Gamificación
- `ranking_global`, `logros`, `usuario_logros`

### Otros
- `usuario_configuraciones`, `usuario_geolocalizacion`, `monitoreo_uso_ipapi_espanol`

> Drift conocido: `simuladorAcordeonService.ts` usa `sesiones_simulador_acordeon` que no aparece en la API. Revisar antes de tocar ese código.

---

## 7. i18n

- **react-i18next** instalado.
- Idioma por defecto: **español**.
- Traducciones en `src/i18n/locales/`.
- `HeroHome.tsx` usa contenido i18n estático sanitizado con DOMPurify.

---

## 8. Convenciones de desarrollo

- **Nombres de variables, funciones y archivos:** español (`useLogicaAcordeon`, `obtenerGrabacion`, `Pagos/`).
- **Componentes:** `PascalCase`.
- **Hooks:** `useNombreEnCamel`.
- **Archivos de hook:** mismo nombre que el hook (`useLogicaAcordeon.ts`).
- **CSS:** `Componente.css` al lado del `Componente.tsx`. Clases con prefix por componente (`.barra-herramientas-*`, `.estudio-practica-libre-*`).
- **Reglas de simplicidad** (de `CLAUDE.md` raíz):
  - Máximo 300 líneas por `.tsx` — lógica extraída a hooks.
  - Cero `console.*` en producción.
  - `alert()`/`confirm()`/`prompt()` → estado React local + UI inline.
  - Cambios quirúrgicos: no refactorizar lo que no se rompe.

---

## 9. Ecosistema V-PRO Digital (hardware ESP32)

Acordeón electrónico físico que se integra con la academia. **Estado: prototipo de laboratorio** (no producto aún).

### Hardware actual
- **ESP32** (motor central)
- 43 botones (mano derecha 31 pitos + mano izquierda 12 bajos)
- 3 multiplexores `CD74HC4067` (escaneo 40µs)
- DAC `PCM5102A` + amplificador clase D 80W + 2 parlantes 5"
- Sensor de fuelle: actualmente fader analógico (objetivo: BMP280 barométrico)
- Pantalla ILI9341
- SD para samples WAV (22050Hz)
- Reproducción autónoma de samples (10 voces simultáneas, polifonía)
- Sistema energía: UPS 12V + 18650 + LM2596

### Software actual
- Polifonía 10 voces, buffers, debounce
- Mapeo de tonalidades (GCF, ADG, BES, etc.)
- Inversión de notas por fuelle (halar/empujar)
- Sin reverb/delay (sonido seco aún)
- Conexión: serial USB (objetivo: MIDI nativo + WiFi para academia)

### Roadmap V-PRO
1. **PCB profesional** (KiCad → JLCPCB/PCBWay) — eliminar cables.
2. **Botones reales de acordeón** (hoy son pulsadores genéricos).
3. **Estructura física** (madera, fuelle real, correas cuero).
4. **Conexión Supabase**: login en pantalla del acordeón vía QR → web → autoriza dispositivo.
5. **OTA WiFi** para firmware updates.
6. **Modo offline**: el acordeón suena solo (sin academia, sin gamificación, sin tutoriales).
7. **Modo online**: integrado con la academia, gamificación, lecciones cayendo en pantalla del propio acordeón (estilo Guitar Hero).
8. **Webinar 3 días** para lanzamiento (problema, tecnología, lanzamiento + preventa 50 unidades).

### Modelo de negocio V-PRO
- Hardware solo: $1,790,000 COP (sin acceso a academia).
- Hardware + suscripción academia: precio variable según plan.
- Suscripción sirve para: tutoriales web, app móvil, lecciones en el V-PRO físico.

### Pendientes técnicos críticos
- Eliminar PLOP/TAC al pisar notas.
- Fuelle más fluido (notas no se entrecortan al cambiar dirección).
- Sonido robusto, no de juguete.

---

## 10. Acordeón 3D (Three.js / R3F)

Modelo 3D del acordeón para integrar en la web (carpeta `src/Paginas/Ejemplos3d1/`, `Pruebas3D/AcordeonDiapason3D` y `/acordeon-3d-test`).

### Plan técnico
- Modelado en **Blender**, exportado a **GLB con compresión Draco**.
- Cargado con `useGLTF` + `useAnimations` de `@react-three/drei`.
- Botones independientes con naming `Btn_Row1_01...Btn_Row3_10`, `Bass_1...Bass_12`.
- Fuelle riggeado con bones (no shape keys) para deformación realista.
- Avatar con dedos independientes para visualizar digitación.
- Texturas PBR 2K máximo. Polígonos < 120k total.
- Material swap para cambiar colores en runtime.

### Estado actual
- Freelancer 3D en proceso (presupuesto $100-150 USD).
- Componentes R3F preparados con MeshLine + Rapier physics (ver `src/Paginas/Ejemplos3d1/Codigoreal.md` original como ejemplo de uso de drei + rapier).
- Pendiente: integración con `useLogicaAcordeon` (botones reaccionan a `botonesActivos`).

### Servicios MCP / IA usados
- **3D AI Studio** API (skill instalado, ver `MDS/Acordeon3d/SKILL_3daistudio.md` original) para generación de modelos.
- **Blender MCP** oficial para automatizaciones (limpieza de escenas, geometry nodes, baking, LODs).

### Galería de modelos visuales (ya implementada en SimuladorApp)
- Estructura `public/acordeones/<id>/{diapason.jpg, bajos.jpg, preview.png}`.
- Catálogo en `src/Paginas/SimuladorApp/Datos/temasAcordeon.ts`.
- 3 modelos iniciales: Pro MAX (default), Rojo Clásico, Verde Vallenato.
- Soporte `premiumOnly` y `colores` listo para editor en vivo.

---

## 11. PWA / App nativa

**Estado actual:** PWA parcial (`public/manifest.json` básico, falta service worker offline).

### Por qué PWA
- 0% comisión App Store / Play Store.
- Update instantáneo (sin review Apple).
- Acceso por link, sin descarga.
- SEO orgánico.

### Roadmap PWA
- [ ] `manifest.json` completo con splash screens.
- [ ] Service worker para cachear samples del acordeón offline.
- [ ] Banner "Agregar a pantalla" (ya está en `BannerEcosistemaHero` mensaje #6).
- [ ] Detect `display-mode: standalone` para no mostrar el banner si ya está instalada.

### App nativa Android/iOS (futuro)
- Conectaría al V-PRO ESP32 como dispositivo MIDI.
- Permite tocar desde móvil, web o V-PRO autónomo con la misma cuenta.

---

## 12. Versión de Postgres y advisors pendientes

- Postgres `15.8.1.054` — programar upgrade con Supabase (CVEs parchados en 15.x más recientes).
- `extension_in_public` advisor → mover extensiones a schema `extensions`.
- Auth dashboard:
  - **Activar Leaked Password Protection.**
  - Endurecer rate limits signup/signin/recover.
- Bunny Stream: **activar "Block direct URL file access"** después de 24-48h de validación de signed URLs.
- Cloudflare WAF rate limiting:
  - `auth/*` → 5 req/min/IP
  - RPCs sensibles → 30 req/min/IP
  - `obtener-video-firmado` → 60 req/min/IP
  - `scores_hero` INSERT → 6 req/min/usuario (anti-farmeo)
