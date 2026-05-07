# SimuladorApp + Grabaciones — Changelog de la sesión

Sesión completa de trabajo sobre el flujo de **grabación + replay del SimuladorApp**
y la integración con `/grabaciones` (modal de replay). Cubre desde fixes de
audio en iOS hasta el rediseño completo del modal con toggle Escritorio/Móvil
y el deep-link `?reproducir=<id>` en el simulador.

---

## Bloque A — Metrónomo grabado y sincronizado

**Problema:** al activar el metrónomo durante REC, los clicks no quedaban
guardados en la grabación. Al reproducir el replay no había metrónomo audible.

**Causa:** `useMetronomo` vivía dentro de `ModalMetronomo` → al cerrar el modal
se desmontaba (también el metrónomo se silenciaba). La metadata de la grabación
no incluía la config del metrónomo.

**Fix:**
- Lift de `useMetronomo` de `ModalMetronomo` a `SimuladorAppNormal`. El modal
  ahora recibe `met` como prop.
- Al iniciar REC con metrónomo activo: `metronomoVivo.detener() + iniciar()`
  para resetear a beat 0 (primer click coincide con t=0 de la grabación).
- Al detener REC: si había metrónomo, se guarda
  `metadata.metronomo = { activo, bpm, compas, subdivision, sonido, volumen }`.
- Instancia separada `metronomoReplay` para reproducir el metrónomo de la
  grabación sin pisar el del usuario.

**Archivos:** `SimuladorApp.tsx`, `ModalMetronomo.tsx`.

---

## Bloque B — Synthesia táctil en mobile

**Problema:** en el juego modo Synthesia, en mobile las notas se marcaban pero
al pisarlas no se consumían (el alumno no podía avanzar).

**Causa:** el gate de audio bloqueaba el touch cuando `estadoJuego === 'pausado_synthesia'`.
En desktop el teclado bypasea el gate, por eso solo fallaba en táctil.

**Fix:** permitir touch en `'pausado_synthesia'` (es el estado wait del modo
Synthesia, los presses son legítimos):

```ts
const estadoActivo = hero?.estadoJuego === 'jugando'
    || hero?.estadoJuego === 'pausado_synthesia';
const audioPitosGateado = !estadoActivo || menuPausaAbierto;
```

**Archivo:** `Juego/JuegoSimuladorApp.tsx`.

---

## Bloque C — Loops en mobile producción (iOS / iPhone real)

Bug que aparecía solo en dispositivo real (no en simulador desktop).

### C.1 — Diagnóstico iterativo

| Intento | Approach | Resultado |
|---|---|---|
| 1 | `motorAudioPro.conectarMediaElement(audio)` | iOS silenciaba el HTMLAudio |
| 2 | `audio.play()` síncrono dentro del gesto | `MediaError code 4` |
| 3 | `new Audio(url)` URL en constructor + `crossOrigin='anonymous'` | Sigue `MediaError code 4` |
| 4 | Pre-fetch + Blob URL con `type: 'audio/mpeg'` forzado | `NotSupportedError` |
| 5 | **Web Audio API directo** (fetch + decodeAudioData + AudioBufferSource) | ✅ FUNCIONA |

### C.2 — Causa raíz

Bug documentado de Supabase Storage: sirve los MP3 con `Content-Type:
application/octet-stream`. iOS Safari rechaza decodear cualquier media cuyo
Content-Type no sea `audio/*`.

Source: <https://github.com/orgs/supabase/discussions/35866>

### C.3 — Solución final

Bypass total de HTMLAudio. Implementación con **Web Audio API**:

```ts
const response = await fetch(url);
const arrayBuf = await response.arrayBuffer();
const audioBuf = await audioContext.decodeAudioData(arrayBuf);

const source = audioContext.createBufferSource();
source.buffer = audioBuf;
source.loop = true;
source.connect(gainNode);
source.start(0);
```

iOS no inspecciona Content-Type ni hace quirks de HTMLAudio: solo ve un buffer
decodificado y lo reproduce. Mismo motor que ya usa el acordeón.

### C.4 — UX adicional

- **Botón Play explícito** en cada fila del modal (44×44, ergonomía táctil).
- **Spinner por fila** mientras descarga el blob.
- **Banner de error visible** dentro del modal (no se puede ver consola en
  el iPhone del usuario).

**Archivos:** `Hooks/useReproductorLoops.ts`, `Componentes/ModalLoops.tsx` + `.css`.

---

## Bloque D — Replay del audio_fondo de grabaciones via Web Audio

**Problema:** mismo bug de Supabase + iOS, pero ahora en el `reproducirGrabacion`
del SimuladorApp. Al reproducir una grabación con loop guardado, el MP3 de
fondo no sonaba.

**Fix:** migración de HTMLAudio (`new Audio(audioFondoUrl)`) a Web Audio API.
Estructura del ref:

```ts
audioFondoReplayRef = useRef<{
    buffer: AudioBuffer;
    gain: GainNode;
    source: AudioBufferSourceNode | null;
    startContextTime: number;
    offsetActual: number;
    velocidad: number;
} | null>(null);
```

Pause/resume requiere recrear el source desde el offset acumulado (los
AudioBufferSourceNode no se pueden reusar tras stop).

**Bonus:** se elimina toda la coreografía de `canplay/seeked/playing` events +
`tickInicialOverride` que era necesaria con HTMLAudio. Web Audio es
sample-accurate desde la primera muestra.

**Archivo:** `SimuladorApp.tsx`.

---

## Bloque E — Toggle Escritorio / Móvil en `/grabaciones`

**Pedido:** poder ver el replay de una grabación con la forma del SimuladorApp
móvil (cuando se grabó desde mobile), manteniendo la vista Escritorio actual
como alternativa.

### E.1 — `VisorReplaySimulador` (componente nuevo)

Vista móvil del replay:

- Fondo: `Marco acordeon simulador app.png` (cuerpo azul "Pro MAX").
- Encima: 3 hileras de pitos en las posiciones del SimuladorApp real.
- Lee `logica.botonesActivos` → los pitos se iluminan automáticamente
  durante el replay (azul halar / rojo empujar).
- Etiquetas (`Sol`, `Sib`, `Reb`...) según la tonalidad del recording, soporta
  modos `notas` y `cifrado`.
- Estilos prefijados con `vrs-` para no chocar con `SimuladorApp.css`.

### E.2 — `useVistaReplayPersistida` (hook nuevo)

Persiste la elección Escritorio/Móvil en `localStorage`. Default automático:

- `metadata.vista_preferida === 'movil'` (grabaciones del SimuladorApp) →
  arranca en Móvil.
- Resto → arranca en Escritorio.

### E.3 — `ModalReplayGrabacionHero` — rediseño completo

Layout completamente flexbox + clamp() para escalar suave en cualquier viewport
(antes había media queries discretas con escalas que dejaban al CuerpoAcordeon
overflow-eando entre 960-1220px):

```css
.grabaciones-hero-replay-escenario .disposicion-acordeon {
    --grabaciones-replay-scale: clamp(0.30, calc(100vw / 1500px), 0.85);
}
```

| Viewport | Scale calculado |
|---|---|
| ≥1500px | 0.85 (~833px de acordeón) |
| 1300px | 0.867 → clamp 0.85 |
| 1000px | 0.667 (~653px) |
| 720px | 0.480 (~470px) |
| 414px | 0.276 → clamp 0.30 (~294px) |

Single break en 840px: pasa a 1 columna (escenario arriba, panel abajo).

Métricas en `grid auto-fit minmax(110px, 1fr)` → se reorganizan solas (4→2→1).
Tipografía con `clamp()` para fluido.

`min-height` del escenario también con clamp para que el acordeón a 0.30 quepa
sin overflow vertical.

### E.4 — Botón "Reproducir en simulador"

Botón verde dentro del modal (visible solo en vista Móvil). Click → cierra
modal + navega a `/simulador-app?reproducir=<id>`.

### E.5 — Labels de hileras ocultas en pantallas chicas

`<h4>` de "Afuera (1) / Medio (2) / Adentro (3)" del `CuerpoAcordeon` tiene
ahora `className="cuerpo-acordeon-fila-label"` y se oculta:

- En `@media (max-width: 720px)`.
- Siempre dentro de `.grabaciones-hero-replay-escenario`.

Sin esto, las labels rompían el layout en mobile y dentro del modal.

**Archivos nuevos:**
- `Perfil/MisGrabaciones/Componentes/VisorReplaySimulador.tsx` + `.css`
- `Perfil/MisGrabaciones/Componentes/useVistaReplayPersistida.ts`

**Archivos modificados:**
- `Perfil/MisGrabaciones/Componentes/ModalReplayGrabacionHero.tsx` + `.css`
- `Perfil/MisGrabaciones/VistaGrabacionesHero.tsx`
- `Core/componentes/CuerpoAcordeon.tsx` + `.css`

---

## Bloque F — Deep-link `?reproducir=<id>` en SimuladorApp

**Pedido:** desde `/grabaciones`, click en "Reproducir en simulador" debe
llevar al simulador y reproducir la grabación allí automáticamente.

### F.1 — Auto-arranque en SimuladorApp

`SimuladorApp.tsx` lee el query param `?reproducir=<id>` al montar.

### F.2 — Overlay "← Volver a Grabaciones"

Botón flotante arriba a la izquierda mientras dura el replay. Solo aparece
cuando se entró por `?reproducir=` (no en uso normal del simulador).

### F.3 — Countdown al fin REAL de la grabación

Al terminar el replay, popup centrado con:

- Countdown "Volviendo en 3s..." → auto-redirect a `/grabaciones`.
- "Volver ahora" → redirect inmediato.
- "Quedarme aquí" → cancela countdown, limpia el query param, el overlay
  desaparece para siempre. El simulador queda en modo normal.

**Importante:** "fin REAL" significa la duración completa (`metadata.duracion_ms`),
no el tick de la última nota. Si grabó 30s pero la última nota fue en el 8s,
el countdown espera hasta el segundo 30. Sin esto, el alumno se sentía sacado
a medias.

### F.4 — Espera landscape antes de auto-arrancar

El SimuladorApp solo funciona en horizontal. Sin esperar `isLandscape`, el
replay arrancaba con el celular vertical (alumno no veía nada).

### F.5 — Espera `disenoCargado` + preload de samples

**Bug crítico:** las notas se marcaban visualmente pero NO sonaban en
auto-play. Manual play (botón Play del simulador) sí funcionaba.

**Causa:** `setTonalidadSeleccionada(g.tonalidad)` dispara una recarga de
samples (useEffect interno con debounce 80ms). Si `reproducirSecuencia` corre
antes de que el banco esté lleno, `motorAudioPro.reproducir` devuelve `null`
silencioso.

En manual play funciona porque `logica.disenoCargado === true` cuando el
alumno toca el botón (samples ya en cache).

**Fix triple:**

1. **Auto-arrange espera `disenoCargado`**: replica el `replayListo` flag
   que ya usa el modal de `/grabaciones` para esperar.
2. **Poll en `reproducirGrabacion`**: hasta 1.5s espera que
   `logicaRef.current.tonalidadSeleccionada` matchee la tonalidad del
   recording (React commit de `setState` no es síncrono).
3. **Preload manual** de samples para los `botonId` específicos del recording
   via `motorAudioPro.cargarSonidoEnBanco` (idempotente, cache interno).

### F.6 — Race condition: countdown prematuro

**Bug:** el countdown aparecía inmediatamente al entrar con `?reproducir=`,
antes de que el replay arrancara siquiera.

**Causa:** `setAutoArrancado(true)` corre síncrono pero `replayStartTimeRef.current`
se setea DESPUÉS del `await obtenerGrabacion()`. En el gap, el effect del
countdown veía `autoArrancado=true` + `enReproduccion=false` y disparaba
`setCountdownVolver(3)` porque `dur===null`.

**Fix:** guard explícito en el effect:

```ts
const startedAt = replayStartTimeRef.current;
if (startedAt === null) return;  // todavia no arranco, esperar
```

**Archivo:** `SimuladorApp.tsx`.

---

## Sin tocar

- `useReproductorReplay.ts` (motor del modal `/grabaciones`) — ya usaba
  `ReproductorMP3` (Web Audio API) → no tenía el bug iOS.
- `useGrabacionProMax.ts` — el grabador en sí no cambió, solo cómo lo
  cableamos en `SimuladorAppNormal`.
- ProMax/PracticaLibre — intactos.

---

## Pendientes conocidos

- **Bug de cambio de pestaña en mobile** — al volver de background, el
  AudioContext queda suspended y a veces el simulador requiere un tap antes
  de volver a sonar. Diagnosticado al inicio de la sesión, no abordado.
- **Logs de diagnóstico** — quedan algunos `console.log` con prefix `[Replay]`
  / `[Loops]` en producción. Útiles para debug; quitar antes del go-live final.
- **Auto-play en iOS sin tap** — la SPA navigation desde `/grabaciones` puede
  preservar user activation en algunos browsers, pero iOS es estricto. Si
  falla, el primer touch en la pantalla activa todo.

---

**Última actualización:** sesión completa de trabajo sobre grabaciones + replay
desde la conversación inicial sobre `avances_antes_de_coronar.md`.
