# Avances antes de coronar

Documentación de toda la sesión de trabajo del día. Lo que quedó funcionando, lo que está a medias, y lo que falta para "coronar" el SimuladorApp con las features de grabación.

---

## 1. Bug fix inicial — primera secuencia no sonaba en el juego

**Problema:** Al iniciar una canción en modo Maestro (o cualquier modo) por primera vez, el acordeón no sonaba. Sí sonaba al hacer REINICIAR / OTRA VEZ. Pasaba en TODOS los modos.

**Causa:** Closure stale. El `useEffect` inicial de `JuegoSimuladorApp` capturaba `hero.iniciarJuego` antes de que la config del acordeón terminara de bajar de la nube. Esa versión de `iniciarJuego` apuntaba a un banco de samples vacío. REINICIAR funcionaba porque usaba el `hero` del último render.

**Fix aplicado:**
- `src/Paginas/SimuladorApp/Juego/JuegoSimuladorApp.tsx` — el primer `iniciarJuego` ahora espera a `hero.logica.disenoCargado === true` antes de disparar.

**Estado:** ✅ FUNCIONANDO

---

## 2. Modo Libre — rediseño visual de notas que caen

### 2.1. Cola (sustain) más afuera del botón
**Antes:** la cola entraba dentro del pito (terminaba en el centro del botón).
**Ahora:** se corta en el borde superior del pito (radio real medido del DOM con `getBoundingClientRect`).

### 2.2. Notas como botones reales del acordeón
**Diseño final adoptado:**
- Mismo JPG (`blanca.JPG`) y borde negro que el `.pito-boton` real
- Tinte multiply de color del fuelle (azul para halar, rojo para cerrando)
- Inminente: borde grueso, glow interior fuerte, **halo cónico rotando alrededor** (mismo patrón que `.pito-boton.objetivo-halar` en synthesia)
- Pulso de brillo + saturación
- Rojo puro (`#ff0000`), NO rojo vino

### 2.3. Jerarquía por opacidad/escala
- Lejos: scale 0.82, opacity 0.15
- Cerca: scale crece, opacity se opacifica
- Inminente: scale 1.18, opacity 1.0
- Rampa lineal: opacity = 0.15 + (progreso/0.78) * 0.85

### 2.4. Sustain estilo Guitar Hero
- Cola gruesa al sostener (55% del ancho del pito)
- Glow externo intenso del color del fuelle
- Núcleo blanco brillante en la base
- Pulso de saturación 0.4s
- Sparks (anillo elíptico) pulsando en la base donde toca el pito

### 2.5. Toggle "Ver Notas"
**Componentes/hooks nuevos:**
- `src/Paginas/SimuladorApp/Juego/Hooks/useVerNotasPersistido.ts`
- Botón eye/eye-off en el header del juego

**Comportamiento:** Cuando está activo, lee el `<span class="nota-etiqueta">` del pito objetivo del DOM y lo muestra DENTRO de la nota cayendo. Aplica a los modos Libre y Synth (cayendo / boxed).

**Archivos clave modificados:**
- `src/Paginas/SimuladorApp/Juego/ModosVista/ModoVistaLibre.tsx` + `.css`
- `src/Paginas/SimuladorApp/Juego/ModosVista/PistaNotasBoxed.tsx`
- `src/Paginas/SimuladorApp/Juego/JuegoSimuladorApp.tsx` (toggle UI)

**Estado:** ✅ FUNCIONANDO

---

## 3. REC manual en SimuladorApp (Pasos 1 + 2)

### 3.1. Cableado del grabador
Se conectó `useGrabacionProMax` en `SimuladorAppNormal`. El `useLogicaAcordeon` ahora delega `onNotaPresionada/onNotaLiberada` a `registrarPresionHero/registrarLiberacionHero` vía refs estables.

### 3.2. Barra flotante REC + PLAY (esquina superior derecha)
**Componentes nuevos:**
- `src/Paginas/SimuladorApp/Componentes/BarraGrabacionFlotante.tsx` + `.css`

**3 modos de la barra:**
1. **Reposo** → PLAY (gris) + REC (rojo)
2. **Grabando** → STOP + cronómetro `0:06`
3. **Reproduciendo** → REWIND ⏪ + PAUSE/PLAY + STOP + FORWARD ⏩ + cronómetro `0:03 / 0:12` + barra de progreso

### 3.3. Modal de guardar compacto
**Componente nuevo:** `src/Paginas/SimuladorApp/Componentes/ModalGuardarSimulador.tsx` + `.css`

Centrado, NO fullscreen. Campos: título + descripción opcional. Botones Descartar / Guardar.

### 3.4. Toast "Grabación guardada"
**Componente nuevo:** `src/Paginas/SimuladorApp/Componentes/ToastGrabacionGuardada.tsx`

Píldora oscura con disquete + texto + X para cerrar. Auto-oculta a los 3s.

### 3.5. Lista inline de grabaciones (popup)
**Componente nuevo:** `src/Paginas/SimuladorApp/Componentes/PopupListaGrabaciones.tsx` + `.css`

Lee del Supabase con `obtenerMisGrabaciones`. Muestra título / fecha / duración. Click → reproduce inline. NO navega afuera del simulador.

### 3.6. Reproducción inline
- Se agregó `useReproductorHero` adicional en `SimuladorAppNormal`
- Las teclas del acordeón se iluminan solas siguiendo la grabación
- Pitos deshabilitados durante playback (`pointer-events: none`)
- Controles: pausa, stop, rewind 5s, forward 5s
- Cronómetro tick→segundos calculado con bpm + resolución

### 3.7. Botón GRABAR removido de la barra de herramientas
Ya no está en la toolbar inferior — todo se maneja desde la barra flotante de la esquina superior.

**Estado:** ✅ FUNCIONANDO

---

## 4. Step 3 — Tab "Loops/Pistas"

### 4.1. ModalLoops
**Componente nuevo:** `src/Paginas/SimuladorApp/Componentes/ModalLoops.tsx` + `.css`

- Lista de loops del catálogo de Supabase (mismo source que el ProMax)
- Click en una pista → reproduce
- Click otra vez → para (toggle)
- Volumen + Velocidad sliders globales (aplican a la pista activa en vivo)
- **NO hay toggle de metrónomo** (son pistas independientes)
- Animación de "ondas pulsantes" cuando hay pista activa

### 4.2. Botón LOOPS en la barra de herramientas
- Icono 🥁 al lado de APRENDE
- Cuando hay loop sonando: indicador visual (puntito azul pulsante + halo en el botón)

### 4.3. Hook `useReproductorLoops`
**Archivo nuevo:** `src/Paginas/SimuladorApp/Hooks/useReproductorLoops.ts`

State del audio vive en el padre, NO en el modal. Al cerrar el modal, el loop sigue sonando. Expone:
- `pistaActiva`, `volumen`, `velocidad`
- `reproducir(pista)`, `detener()`
- `obtenerPosicion()` para sync con grabación

### 4.4. Grabación captura el loop
Al detener REC con un loop activo, se guarda en metadata:
- `audio_fondo_url` (URL del MP3)
- `pista_id`, `pista_nombre`
- `pista_velocidad` (la velocidad a la que sonaba el loop)
- `pista_volumen`
- `pista_offset_segundos` (posición del audio AL EMPEZAR la grabación)

### 4.5. Velocidad bloqueada durante REC
El slider de velocidad se desactiva cuando `grabandoHero=true`. Aparece un chip rojo "🔒 Grabando".

**Razón:** Si la velocidad cambia durante REC, la matemática de sync rompe. Lockear = sync perfecto al replay.

### 4.6. Replay del audio_fondo
Tanto en SimuladorApp inline como en Mis Grabaciones:
- Se setea `audio.playbackRate = pista_velocidad` (después del canplay para que no se resetee)
- Se hace seek a `pista_offset_segundos` y se ESPERA el evento `seeked` antes de play
- Se espera el evento `playing` antes de arrancar las notas
- Se calcula `tickInicialOverride` para compensar el delta de tiempo del audio entre seek y playing
- Pause/play del replay sincronizan también el audio de fondo

**Estado:** ✅ MAYORMENTE FUNCIONANDO — pendiente afinación de sync (ver pendientes abajo)

---

## 5. Step 4 — Toggle Vista Escritorio / Móvil en Mis Grabaciones

### 5.1. Toggle implementado
**Archivos nuevos:**
- `src/Paginas/Perfil/MisGrabaciones/Componentes/VisorReplaySimulador.tsx` + `.css`
- `src/Paginas/Perfil/MisGrabaciones/Componentes/useVistaReplayPersistida.ts`

**Archivos modificados:**
- `src/Paginas/Perfil/MisGrabaciones/Componentes/ModalReplayGrabacionHero.tsx` (toggle + render condicional)
- `src/Paginas/Perfil/MisGrabaciones/Componentes/ModalReplayGrabacionHero.css` (estilos del toggle)

**Comportamiento:**
- Toggle "🖥 Escritorio" / "📱 Móvil" arriba del escenario del replay
- Default automático según `metadata.vista_preferida`:
  - `'movil'` (grabaciones del SimuladorApp) → arranca en móvil
  - Resto → arranca en escritorio
- La elección manual se persiste en `localStorage`

### 5.2. Visor móvil
- Frame estilo iPhone landscape (esquinas redondeadas, doble borde oscuro, sombra)
- Background con el JPG real del simulador (`/Diapason con fondo firme.jpg`) que ya pinta el fuelle "Pro MAX" + el diapasón azul
- Tab BAJOS estática arriba a la izquierda
- Toolbar replica con APRENDE (amarillo), 🥁 LOOPS, 🪗, tonalidad, iconos varios
- 3 hileras de pitos blancos con misma estructura DOM que el simulador → el reproductor las ilumina automáticamente con `actualizarBotonActivo`
- Pitos con `pointer-events: none` (solo lectura)

**Estado:** ⚠️ PARCIAL — funciona pero la replicación visual no está al nivel pedido (ver pendientes)

---

# 🟥 LO QUE FALTA PARA CORONAR

## Pendientes del Step 4

### A. Replicación visual del SimuladorApp más fiel

El usuario quiere que el visor móvil sea una **copia exacta** del SimuladorApp real (imagen 1 de la conversación). Lo actual usa el JPG de fondo y un frame estilo iPhone, pero todavía no se ve idéntico.

**Lo que falta refinar:**
- Las **proporciones del frame**: el `aspect-ratio: 19.5/9` puede no calzar bien con la ratio del JPG de fondo.
- La **toolbar replica** es solo placeholder estilo `.vrs-tool-btn` — la real tiene el banner del ad "Acordeón Piano Cassotto", el botón de instalar, etc. Hay que decidir si replicar fielmente o quitar la toolbar (que el visor sea solo el acordeón sin elementos de marketing).
- La **posición vertical de los pitos** dentro del frame puede no estar perfectamente alineada con donde están en el simulador real.
- El **BAJOS tab** es un mockup — la versión real tiene el contenedor expandible.

**Acción sugerida:**
1. Tomar pantallazo del SimuladorApp real corriendo en `/simulador-app` en landscape.
2. Comparar lado a lado con el visor en `/grabaciones`.
3. Ajustar:
   - `margin-top` de `.visor-replay-sim-toolbar` (% que define dónde empieza la toolbar)
   - `padding` y `--vrs-pito-size` del `.visor-replay-sim-tren`
   - Ratios de los elementos para que matcheen píxel-perfect.
4. Posiblemente quitar la toolbar del visor (o hacerla mucho más simple) si distrae.

### B. Auto-redirect a SimuladorApp si el usuario está en móvil

El usuario pidió:
> "si estoy desde el celular que lo lleve y lo reproduzca desde la app movil directamente desde la pagina de Simulador App"

**Lo que falta implementar:**
1. Detectar si el dispositivo es móvil real (no Chrome DevTools en desktop).
2. Cuando se hace click en una grabación de SimuladorApp desde `/grabaciones`, en lugar de abrir el modal, navegar a `/simulador-app?reproducir=<grabacion_id>`.
3. En `SimuladorApp.tsx`, leer el query param `reproducir` al montar y, si existe, llamar `reproducirGrabacion(id)` directamente.
4. Permitir cerrar el replay con un X y quedarse en el simulador normal.

**Archivos involucrados:**
- `src/Paginas/Perfil/MisGrabaciones/VistaGrabacionesHero.tsx` (decidir si abrir modal o navegar)
- `src/Paginas/SimuladorApp/SimuladorApp.tsx` (leer query param + auto-reproducir)

### C. Botones del visor en movimiento durante reproducción

El usuario también dijo:
> "Y que se muevan los botones y funcione correctamente me entiendes?"

Esto YA pasa porque el `actualizarBotonActivo` agrega/quita la clase `.nota-activa` que tiene la animación `transform: translateY(...) scale(...)` y el cambio de color/glow. Pero **HAY QUE VERIFICAR** que efectivamente las teclas del visor móvil se animan correctamente al reproducir un replay, comparando con cómo se ven al pisar en el simulador real.

Si los botones no se mueven con el mismo "press" que en el real, hay que ajustar el CSS de `.visor-replay-sim.modo-halar .pito-boton.nota-activa` para que tenga las mismas transformaciones que `.modo-halar .pito-boton.nota-activa` del SimuladorApp.

---

## Pendientes del Step 3 (Loops/Pistas)

### D. Sync de la pista cuando velocidad ≠ 1.0x

**Estado actual:** Funciona a velocidad original (1.0x) en modo de práctica libre. A 0.7x, 1.25x, etc., todavía hay desfase entre las notas y el MP3.

**Lo que se intentó:**
- Capturar `pista_offset_segundos` al iniciar REC
- Bloquear velocidad durante REC
- Esperar evento `seeked` antes de play
- Esperar evento `playing` antes de arrancar el RAF de notas
- Compensar `audioDelta` con `tickInicialOverride`
- Re-aplicar `playbackRate` post-seek
- Aplicar mismo offset y velocidad en Mis Grabaciones (`useReproductorReplay.ts`)

**Lo que falta probar/diagnosticar:**
1. **Capturar el log `[Replay] arrancando | playbackRate efectivo: ...`** después del último fix y verificar que `playbackRate efectivo` realmente sea el valor guardado (`pista_velocidad`).
2. Si el playbackRate es correcto pero igual desincroniza, el problema está en cómo `HTMLAudioElement` aplica rates ≠ 1.0 (algunos navegadores quantizan o tienen drift).
3. **Migrar el playback del audio_fondo a `ReproductorMP3`** (AudioBufferSourceNode, sample-accurate) en lugar de HTMLAudio. Es el mismo motor que usa `useReproductorReplay` en Mis Grabaciones para competencia mode → sync perfecto.

**Archivos involucrados:**
- `src/Paginas/SimuladorApp/SimuladorApp.tsx` (función `reproducirGrabacion` — migrar HTMLAudio → ReproductorMP3)
- `src/Paginas/SimuladorApp/Hooks/useReproductorLoops.ts` (idem para reproducción del loop durante grabación)

### E. Velocidad variable durante grabación (opcional)

Por ahora la velocidad está LOCKEADA durante REC. Si el usuario quiere variar la velocidad mid-recording (más adelante), habría que:
1. Capturar timeline de eventos de velocidad: `[{tiempoMs: 0, velocidad: 1.0}, {tiempoMs: 5000, velocidad: 1.25}, ...]`
2. Guardarlos en `metadata.pista_velocidad_eventos`
3. Al replay, programar `setTimeout` para aplicar cada cambio de `playbackRate` en su tiempo.
4. Manejar pause/seek/stop para limpiar timeouts pendientes.

**Decisión:** Skipear hasta que el sync básico esté perfecto.

---

## Pendientes del Step 1+2 (REC en SimuladorApp)

### F. Sync inline del SimuladorApp con audio de fondo

Mismo problema que (D). El reproductor inline arranca el audio + las notas pero a velocidad ≠ 1.0 hay drift.

### G. Logs de diagnóstico todavía en el código

Hay varios `console.log` agregados para debug:
- `[REC start]`, `[REC stop] metadata a guardar:`, `[Replay] metadata leida:`, `[Replay] arrancando | playbackRate efectivo: ...`

**Acción:** Una vez que el sync esté resuelto, **quitar todos estos logs** antes de ir a producción.

---

## Limpieza general pendiente

### H. Código legacy en SimuladorApp

En `SimuladorApp.tsx` quedó código viejo del grabador legacy:
```ts
const [grabando, setGrabando] = useState(false);
const secuenciaRef = useRef<any[]>([]);
const tiempoInicioRef = useRef<number>(0);
const registrarEvento = useCallback(...);
```

`grabando` se usa solo para sincronizar la barra (legacy ya no la muestra) y `registrarEvento` se pasa a `usePointerAcordeon` pero no persiste. **Acción:** limpiar esto cuando todo lo demás esté sólido.

### I. Imports no usados / props no usados

- En `BarraHerramientas.tsx`, las props `grabando` y `toggleGrabacion` ya no se usan (el botón se removió). Hay que limpiar la interfaz.
- Posibles imports stale en otros archivos.

---

# Lista corta de "qué falta para coronar"

Por orden de impacto/prioridad:

| # | Tarea | Tamaño | Prioridad |
|---|-------|--------|-----------|
| 1 | Afinar visor móvil para que sea **copia exacta** del SimuladorApp (proporción + posición pitos + toolbar simplificada) | M | Alta |
| 2 | Migrar replay de audio_fondo a `ReproductorMP3` (AudioBufferSourceNode) para sync sample-accurate a cualquier velocidad | M-L | Alta |
| 3 | Auto-redirect a SimuladorApp en móvil al hacer click en grabación | S | Media |
| 4 | Verificar animación de botones del visor móvil ("press" idéntico al real) | S | Media |
| 5 | Quitar todos los `console.log` de diagnóstico | S | Baja (al final) |
| 6 | Limpiar código legacy de `SimuladorApp.tsx` (`grabando`, `secuenciaRef`, `registrarEvento`) | S | Baja |

---

# Archivos creados o modificados hoy

## Nuevos
- `src/Paginas/SimuladorApp/Juego/Hooks/useVerNotasPersistido.ts`
- `src/Paginas/SimuladorApp/Hooks/useReproductorLoops.ts`
- `src/Paginas/SimuladorApp/Componentes/BarraGrabacionFlotante.tsx` + `.css`
- `src/Paginas/SimuladorApp/Componentes/ToastGrabacionGuardada.tsx`
- `src/Paginas/SimuladorApp/Componentes/ModalGuardarSimulador.tsx` + `.css`
- `src/Paginas/SimuladorApp/Componentes/PopupListaGrabaciones.tsx` + `.css`
- `src/Paginas/SimuladorApp/Componentes/ModalLoops.tsx` + `.css`
- `src/Paginas/Perfil/MisGrabaciones/Componentes/VisorReplaySimulador.tsx` + `.css`
- `src/Paginas/Perfil/MisGrabaciones/Componentes/useVistaReplayPersistida.ts`

## Modificados
- `src/Paginas/SimuladorApp/SimuladorApp.tsx` (cableado grabador + reproductor + state de loops + render de modales)
- `src/Paginas/SimuladorApp/Juego/JuegoSimuladorApp.tsx` (gate `disenoCargado` + toggle Ver Notas)
- `src/Paginas/SimuladorApp/Juego/ModosVista/ModoVistaLibre.tsx` + `.css` (rediseño completo)
- `src/Paginas/SimuladorApp/Juego/ModosVista/PistaNotasBoxed.tsx` (Ver Notas)
- `src/Paginas/SimuladorApp/Componentes/BarraHerramientas/BarraHerramientas.tsx` + `.css` (botón LOOPS + indicador, removido GRABAR)
- `src/Paginas/SimuladorApp/SimuladorApp.css` (clase `.reproduciendo` para deshabilitar pitos)
- `src/Paginas/AcordeonProMax/Hooks/useLogicaProMax.ts` (precarga samples al iniciar — del bug fix inicial, fue revertido al final)
- `src/Paginas/Perfil/MisGrabaciones/Componentes/ModalReplayGrabacionHero.tsx` + `.css` (toggle + render condicional)
- `src/Paginas/Perfil/MisGrabaciones/Componentes/useReproductorReplay.ts` (soporte `pista_velocidad` + `pista_offset_segundos`)

---

**Última actualización:** sesión del día, antes del cierre.
