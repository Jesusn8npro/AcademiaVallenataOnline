# Mis Pistas (Práctica Libre del alumno)

Feature dentro de `Acordeón Pro Max → Pistas y Estudio → Con pista → Mis pistas`.
Permite al alumno subir su propio MP3, bajar velocidad/tono, marcar secciones para
practicar en loop, y grabar su acordeón sobre la pista (estilo Moises + GarageBand).

Ruta del simulador: [/acordeon-pro-max/acordeon](../app/(protegido-admin)/acordeon-pro-max/acordeon/page.tsx)

---

## 1. Funcionalidades implementadas (Fase 1)

| Función | Estado |
|---|---|
| Subir MP3/WAV con compresión cliente a 96 kbps mono | ✅ |
| Detección automática de tonalidad al subir (FFT + HPCP + Albrecht-Shanahan + bass-tracking) | ✅ |
| Botón "Detectar tono" on-demand en el reproductor | ✅ |
| Edición manual del tono detectado (click en el chip) | ✅ |
| Sliders de velocidad (0.5x–1.5x) y tono (±12 semitonos) con SoundTouchJS | ✅ |
| Marcar secciones con A (inicio) y B (fin) sobre la timeline | ✅ |
| Reproducir sección en loop infinito hasta detener | ✅ |
| Guardar config (velocidad/tono/secciones) por canción | ✅ |
| **Grabar el acordeón sobre la pista (REC)** sincronizado vía AudioContext.currentTime | ✅ |
| **Reproducir grabación junto con la pista** (notas + audio mezclados) | ✅ |
| Ajustar volumen del acordeón en la mezcla | ✅ |
| Lista de grabaciones por pista (play / eliminar) | ✅ |
| Límites por plan independientes (3 pistas free, 3 grabaciones free) | ✅ |

## Pendientes (Fase 2)

- **Exportar grabación como MP3 descargable** (OfflineAudioContext + render del acordeón + lamejs encoding)
- **Subir BPM detectado** junto con el tono (algoritmo de onset detection)

---

## 2. Esquema Supabase

### Tabla `pistas_usuario`
```sql
id              uuid PK
user_id         uuid → auth.users (RLS por user_id)
titulo          text
storage_path    text   -- en bucket privado 'pistas-usuario'
duracion_seg    numeric
tamano_bytes    bigint
bpm             integer (futuro)
secciones       jsonb  -- [{id, nombre, tickInicio, tickFin}] en ms
config          jsonb  -- {velocidad, semitonos, loopActivo, ultimaSeccionId, tonalidad, tonalidadConfianza}
created_at      timestamptz
updated_at      timestamptz
```

### Tabla `grabaciones_pista_usuario`
```sql
id                uuid PK
user_id           uuid → auth.users (RLS por user_id)
pista_id          uuid → pistas_usuario (ON DELETE CASCADE)
titulo            text
secuencia_json    jsonb  -- [{ms, botonId, fuelle, accion: 'down'|'up'}]
duracion_seg      numeric
config            jsonb  -- {tonalidad, instrumentoId, velocidad, semitonos, volumenAcordeon, volumenPista}
mp3_storage_path  text NULL  -- futuro: ruta al MP3 exportado
created_at        timestamptz
updated_at        timestamptz
```

### Bucket Storage
- **Nombre**: `pistas-usuario`
- **Privado** (signed URLs con TTL 1h)
- **Convención de path**: `<user_id>/<timestamp>-<random>.mp3` (la RLS del bucket exige `auth.uid()::text === foldername(name)[1]`)
- **Tamaño máx**: 25 MB por archivo (post-compresión)

### RLS
Todas las tablas y el bucket: el usuario **solo ve/modifica lo suyo**, verificado contra `auth.uid()`.

---

## 3. Sistema de límites por plan

### Estado actual
Centralizado en [src/config/limitesPlan.ts](../src/config/limitesPlan.ts):

```ts
export const LIMITE_PISTAS_FREE = 3;
export const LIMITE_PISTAS_PREMIUM = Infinity;
export const LIMITE_GRABACIONES_FREE = 3;
export const LIMITE_GRABACIONES_PREMIUM = Infinity;
```

Funciones de chequeo:
- `obtenerLimitePistas(userId)` → lee `perfiles.membresia_activa_id` y `fecha_vencimiento_membresia`. Si hay membresía activa no vencida → premium (∞). Sino → free (3).
- `obtenerLimiteGrabaciones(userId)` → mismo criterio.

### Cómo se aplica en la UI
- **Pistas subidas**: contador `X/3` arriba del botón "Subir canción". Si llega al límite, el botón se deshabilita y aparece un banner "Pasate a Premium".
- **Grabaciones**: el botón `REC` dentro del reproductor se deshabilita si llegó al límite, y el panel "Mis grabaciones" muestra el contador + el mismo banner.

### Para conectar al sistema real de membresías (cuando lo definas)

El cálculo del límite usa la columna `perfiles.membresia_activa_id` y `perfiles.fecha_vencimiento_membresia` que **ya existen**. La tabla `membresias` también ya existe con columnas `nombre`, `precio_mensual`, `precio_anual`, `permisos jsonb`, `beneficios jsonb`, etc.

**3 maneras de hacerlo según qué decidas:**

**(A) Más simple — Solo gratis vs premium**
Dejar el código como está. Cualquier `membresia_activa_id` no vencida cuenta como premium. Cuando crees los planes (Mensual / Anual / Lifetime), el código no necesita cambios — el alumno con CUALQUIER plan activo es "premium" para todos los features.

**(B) Distinguir planes — Por tipo de membresía**
Cambiar `obtenerLimitePistas`/`obtenerLimiteGrabaciones` para leer también el `nombre` de la membresía y aplicar límites distintos:

```ts
// Ej. si querés 3 planes con límites diferentes:
const LIMITES_POR_PLAN: Record<string, { pistas: number; grabaciones: number }> = {
  'Básico':    { pistas: 5,  grabaciones: 5  },
  'Avanzado':  { pistas: 20, grabaciones: 50 },
  'Premium':   { pistas: Infinity, grabaciones: Infinity },
};
```

**(C) Más flexible — Límites por plan en la BD**
Guardar los límites en `membresias.permisos jsonb`:

```json
{
  "mis_pistas": { "limite": 20, "compresion_max_mb": 50 },
  "grabaciones": { "limite": 50, "export_mp3": true }
}
```

Y modificar las funciones para leer ese JSON. Más mantenible — agregar/quitar features no requiere deploy.

**Recomendación**: empezar con (A) para lanzar este fin de semana. Migrar a (C) cuando estés cobrando y necesites más granularidad.

### Features candidatas a meter detrás del paywall

| Feature | Free | Premium |
|---|---|---|
| Subir pistas | 3 | ilimitadas / 20 |
| Grabaciones del acordeón | 3 | ilimitadas / 50 |
| Exportar MP3 (Fase 2) | ❌ | ✅ |
| Cambio de tono ±12 st | ±3 st | ±12 st |
| Velocidad 0.5–1.5x | 0.7–1.3x | 0.5–1.5x |
| Secciones por canción | 3 | ilimitadas |
| Detector de tono automático | ❌ | ✅ |
| Compresión MP3 con mayor calidad | 96 kbps | 192 kbps |

(estas son sugerencias — vos decidís cuáles)

---

## 4. Archivos clave creados / modificados

### Backend (Supabase)
- Migración: `crear_pistas_usuario_practica_libre`
- Migración: `crear_grabaciones_pista_usuario`
- Bucket: `pistas-usuario` (privado)

### Config y servicios
- [src/config/limitesPlan.ts](../src/config/limitesPlan.ts) — límites centralizados
- [src/Paginas/AcordeonProMax/PracticaLibre/Servicios/servicioPistasUsuario.ts](../src/Paginas/AcordeonProMax/PracticaLibre/Servicios/servicioPistasUsuario.ts) — CRUD + storage
- [src/Paginas/AcordeonProMax/PracticaLibre/Servicios/servicioGrabacionesUsuario.ts](../src/Paginas/AcordeonProMax/PracticaLibre/Servicios/servicioGrabacionesUsuario.ts) — CRUD grabaciones

### Utilidades
- [src/Paginas/AcordeonProMax/PracticaLibre/Utilidades/compresorMP3.ts](../src/Paginas/AcordeonProMax/PracticaLibre/Utilidades/compresorMP3.ts) — compresor con `@breezystack/lamejs`
- [src/Paginas/AcordeonProMax/PracticaLibre/Utilidades/detectorTono.ts](../src/Paginas/AcordeonProMax/PracticaLibre/Utilidades/detectorTono.ts) — FFT + HPCP + bass-tracking + Albrecht-Shanahan

### Core de audio
- [src/Core/audio/ReproductorSoundTouch.ts](../src/Core/audio/ReproductorSoundTouch.ts) — wrapper sobre `soundtouchjs` (velocidad/tono independientes + loop A-B + seek limpio)
- [src/Core/audio/emisorNotasAcordeon.ts](../src/Core/audio/emisorNotasAcordeon.ts) — pub/sub global de teclas (para que el grabador escuche sin prop drilling)
- [src/Core/hooks/useLogicaAcordeon.ts](../src/Core/hooks/useLogicaAcordeon.ts) — modificado: emite via `emitirNota()` además de los callbacks legacy

### Hooks
- [src/Paginas/AcordeonProMax/PracticaLibre/Hooks/useCapturaGrabacionPista.ts](../src/Paginas/AcordeonProMax/PracticaLibre/Hooks/useCapturaGrabacionPista.ts) — captura sincronizada con AudioContext.currentTime
- [src/Paginas/AcordeonProMax/PracticaLibre/Hooks/useReproduccionGrabacion.ts](../src/Paginas/AcordeonProMax/PracticaLibre/Hooks/useReproduccionGrabacion.ts) — RAF que dispara notas en el tiempo correcto

### Context
- [src/Paginas/AcordeonProMax/PracticaLibre/contextoLogicaAcordeon.tsx](../src/Paginas/AcordeonProMax/PracticaLibre/contextoLogicaAcordeon.tsx) — provider ESTABLE (ref) para evitar re-renders en cascada

### UI
- [src/Paginas/AcordeonProMax/PracticaLibre/Componentes/MisPistasUsuario.tsx](../src/Paginas/AcordeonProMax/PracticaLibre/Componentes/MisPistasUsuario.tsx) — listado + subir + límite
- [src/Paginas/AcordeonProMax/PracticaLibre/Componentes/ReproductorPistaUsuario.tsx](../src/Paginas/AcordeonProMax/PracticaLibre/Componentes/ReproductorPistaUsuario.tsx) — reproductor inline (sliders + secciones + REC + grabaciones)
- [src/Paginas/AcordeonProMax/PracticaLibre/Componentes/SeccionPLPistas.tsx](../src/Paginas/AcordeonProMax/PracticaLibre/Componentes/SeccionPLPistas.tsx) — tabs Catálogo/Mis pistas, oculta header al activar reproductor

### Dependencias nuevas en package.json
- `@breezystack/lamejs` — encoder MP3 mantenido
- `soundtouchjs` — phase vocoder JS puro para velocidad/tono independientes

---

## 5. Flujo de usuario completo

```
1. Alumno entra a /acordeon-pro-max/acordeon
2. Click en "Pistas y Estudio" → modo "Con pista" → tab "Mis pistas"
3. Click "Subir canción" → elige MP3/WAV (≤50 MB)
   ├─ Comprime cliente a 96 kbps mono (~50% menos peso)
   ├─ Detecta tonalidad con FFT + bass-tracking + Albrecht-Shanahan
   ├─ Sube al bucket privado pistas-usuario
   └─ Inserta fila en pistas_usuario
4. Click ▶ en la pista → reproductor inline TAPA todo el panel
   ├─ Sliders velocidad (0.5x–1.5x) y tono (±12 st) en tiempo real (SoundTouch)
   ├─ Timeline con secciones de colores + cabeza verde
   ├─ Marcar A/B + nombrar → "Agregar sección"
   ├─ Click 🔁 en sección → loop infinito hasta detener
   ├─ Detectar tono → analiza el AudioBuffer ya cargado
   ├─ Editar tono manualmente → click en el chip
   ├─ Botón REC → seek(0) + play + captura notas con anchor AudioContext.currentTime
   ├─ Detener REC → diálogo nombrar + guardar
   └─ Tab "Mis grabaciones" → play vuelve a oír pista + acordeón sintetizado en sincronía
5. Click ← Volver → vuelve a la lista con las tabs y header
```

---

## 6. Decisiones técnicas importantes (por qué cada cosa)

### SoundTouchJS para velocidad/tono
- Web Audio nativo (`playbackRate` + `detune`) cambia tono al cambiar velocidad y vice-versa.
- SoundTouch implementa WSOLA + phase vocoder → independencia total. Calidad tipo Moises hasta ±12 semitonos.
- Costo: ~30% CPU extra vs nativo. Aceptable para pista de fondo.
- Bug fix: el SoundTouch tiene un buffer interno que NO se limpia al setear `percentagePlayed` → seek "trababa". **Reconstruimos el shifter completo en cada seek**.

### Sincronización con AudioContext.currentTime (no SoundTouch.currentTime)
- El `timePlayed` del SoundTouchNode tiene jitter y latencia variable del buffer interno.
- AudioContext es **sample-accurate** y crece continuo — mismo reloj que usan los modos competitivos del simulador.
- **Anchor explícito**: al pulsar REC o PLAY, `anchor = ctx.currentTime`. Cada evento: `ms = (ctx.currentTime - anchor) * 1000`. Sincronía garantizada.

### Pub/sub de notas del acordeón
- `useLogicaAcordeon` ya tenía `onNotaPresionada/onNotaLiberada` props, pero atados al grabador legacy del componente raíz.
- Para que el grabador del reproductor inline capture sin prop drilling de 4 niveles, agregamos `emitirNota()` ADITIVO (no rompe lo legacy).
- Cualquier consumer hace `subscribirNotas(cb)` y recibe los eventos.

### Provider de Logica con ref estable
- Pasar `value={logica}` directo causaba "Maximum update depth exceeded" por re-renders en cascada que disparaban un bug latente en `PanelEfectosSimulador.tsx:256`.
- El provider ahora pasa **un ref** que es estable entre renders. Los consumers leen `useLogicaAcordeonCtx()?.current`.

### Bucket privado con signed URLs
- Las pistas del alumno pueden tener copyright. URL firmada con TTL 1h evita que se compartan/indexen.
- RLS del bucket: convención `<user_id>/<file>` permite que `storage.foldername(name)[1] === auth.uid()::text`.

### Detector de tono — algoritmo elegido
- v1 Goertzel: fallaba con armónicos.
- v2 HPCP + Krumhansl: mejor, pero Krumhansl es académico (no popular).
- **v3 actual**: FFT real + HPCP + perfiles **Albrecht-Shanahan (2013)** + **bass-tracking** (línea de bajo pesa 50% de la decisión final → en pop/vallenato el bajo casi siempre marca la tónica).
- Para precisión 95%+ tipo Moises real, requiere CRNN entrenado (~50 MB modelo) — fuera del alcance JS puro. Si se quiere, irse a una API externa.

---

## 7. Bugs conocidos y limitaciones

- El detector puede dar confianza baja (<50%) en música con muchos armónicos o instrumentación densa. UX: chip ámbar + el alumno edita a mano.
- El export MP3 de grabaciones aún NO está (Fase 2). Hoy las grabaciones solo se reproducen, no se descargan.
- Al cambiar velocidad/tono durante la reproducción de grabación, las notas pueden desincronizar levemente porque el SoundTouch necesita reajustar buffers.
- El slider "Volumen acordeón en mezcla" usa el master del motor, así que afecta también al acordeón cuando NO está reproduciéndose una grabación. Se restaura cuando el `useEffect` del estudio dispara siguiente.
