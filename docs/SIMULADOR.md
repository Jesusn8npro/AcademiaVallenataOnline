# Simulador — Documentación técnica

> **Fecha de consolidación:** 2026-05-10
> **Fuentes consolidadas:**
> - `docs/GUIAS/FUNCIONAMIENTO_SIMULADOR_ANTIGUO.md`
> - `docs/GUIAS/MIGRACION_SIMULADOR.md`
> - `src/Paginas/SimuladorApp/CHANGELOG_SESION_GRABACIONES.md`
> - `src/Paginas/SimuladorApp/mejoras_app_y_mas.md`
> - `src/Paginas/SimuladorApp/SESION_2026-05-01.md`
> - `src/Paginas/SimuladorApp/SESION_2026-05-08.md`
> - `src/Paginas/SimuladorApp/SESION_2026-05-08_PARTE_2.md`
> - `src/Paginas/SimuladorApp/Juego/CHANGELOG_SESION.md`
> - `src/Paginas/SimuladorApp/Juego/CHANGELOG_SESION_06.md`
> - `src/Paginas/SimuladorApp/Juego/CHANGELOG_SESION_07.md`
> - `Avances_Registradoss/idea_grabacion_ya_funciona.md`
> - `Avances_Registradoss/GESTOR_PISTAS_RITMO.md`
> - `Problema sincronizacion.md`

---

## 1. Páginas del simulador

| Ruta | Carpeta | Uso |
|---|---|---|
| `/simulador-de-acordeon` | `src/Paginas/SimuladorDeAcordeon/` | Simulador clásico desktop + Acordeón Hero (juego) |
| `/simulador-app` | `src/Paginas/SimuladorApp/` | Simulador móvil/landscape. PWA-friendly. Modo principal en producción |
| `/acordeon-pro-max/acordeon` | `src/Paginas/AcordeonProMax/PracticaLibre/` | Práctica Libre estudiante (ver [`ACORDEON_PROMAX.md`](./ACORDEON_PROMAX.md)) |

---

## 2. Motor de audio (`AudioEnginePro`)

Archivo: `src/Core/audio/AudioEnginePro.ts`.

- **Web Audio API directa**, sin Howler.js.
- Pool de **10 voces simultáneas** con micro-fade anti-plop.
- **Sub-buses** TECLADO / BAJOS independientes con `Gain + StereoPanner`.
- **Detección automática de sección**: si `idSonido.includes('Bajos')` → bus bajos.
- **Conmutación de ruta** (`_conmutarRuta`) entre `directBus` y `mixBus` según haya filtros activos.
- **Métodos públicos:**
  - `reproducir(ruta, instrumentoId, volumen, ..., seccion?: 'teclado' | 'bajos')`
  - `setVolumenBusTeclado(0..1)` / `setVolumenBusBajos(0..1)`
  - `setPanTeclado(-1..1)` / `setPanBajos(-1..1)`
  - `cargarSonidoEnBanco(...)` — preload idempotente, usado en auto-play de replays
  - `cargarPresetReverb(presetId)` — regenera IR del reverb en vivo
- **Latencia agregada por sub-buses:** ~1ms (imperceptible).

### Reverb sintético (5 presets)
Generador `_generarIRSintetico(preset)` combina 4 técnicas (basado en paper Moorer):
1. Cuerpo: ruido blanco descorrelacionado + decay exponencial.
2. Pre-delay: silencio inicial.
3. Early reflections: pulsos discretos primeros 50-200ms.
4. Filtrado tonal IIR un polo.

| Preset | Duración | Pre-delay | Decay | Brillo | Sensación |
|---|---|---|---|---|---|
| Cuarto Mediano | 0.7s | 5ms | 3.5 | 1.0 | Sala ensayo seca |
| Cuarto Grande | 1.4s | 12ms | 2.6 | 0.95 | Sala con cuerpo (default) |
| Vestíbulo Mediano | 2.2s | 25ms | 2.0 | 0.85 | Lobby cálido |
| Vestíbulo Grande | 3.5s | 40ms | 1.7 | 0.78 | Iglesia/teatro |
| Escenario Abierto | 1.8s | 60ms | 1.6 | 1.1 | Aire libre brillante |

Wet factor `0.5 → 0.85` para que el slider se sienta.

### Bypass crítico iOS — `ReproductorMP3.ts`
Bug Supabase Storage: sirve MP3 con `Content-Type: application/octet-stream`. iOS Safari rechaza decodear cualquier media cuyo Content-Type no sea `audio/*`.

**Solución:** en lugar de `<audio>` HTMLAudio, usar Web Audio API directa:

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

iOS no inspecciona Content-Type ni hace quirks de HTMLAudio. **Aplicado en:** `useReproductorLoops`, `reproducirGrabacion` de SimuladorApp, `useReproductorHero`. **Pause/resume** requiere recrear el `AudioBufferSourceNode` desde el offset acumulado (no se pueden reusar tras stop).

---

## 3. Lógica del acordeón (`useLogicaAcordeon`)

Archivo: `src/Core/hooks/useLogicaAcordeon.ts`.

- **Cerebro del acordeón virtual.** Maneja botones activos, fuelle, tonalidad, timbre, instrumento.
- Emite eventos `onNotaPresionada(id, fuelle)` y `onNotaLiberada(id, fuelle)` que consumen los grabadores.
- Soporte **mapeo personalizado** de botones por usuario (sincronizado vía Supabase).
- **Tonalidades soportadas:** `F-Bb-Eb`, `Gb-B-E`, `GCF`, `ADG_FLAT`, `ADG`, `BES`, `BEA`, `CFB`, `DGB`, `GDC`, `ELR`, `EAD` y custom.
- **Timbres:** `Brillante`, `Armonizado`.
- **Instrumentos:** acordeón (varias variantes), saxo vallenato, guitarra acústica.
- `actualizarBotonActivo(id, 'add'|'remove', null, false, undefined, silencioso)` — el 6º arg controla si suena. **Bug histórico:** cuando se grababa en modo "revisando" del EstudioAdmin, `silencioso=true` hacía que las notas iluminaran pero no sonaran.
- **Sampler inteligente:** genera escalas completas (octavas 3-7) a partir de samples base, eliminando silencios.
- **Detección de altura real** por frecuencia (no por posición fija).
- **Protección anti-mezcla:** bloquea sonidos de acordeón cuando se usan otros instrumentos.

---

## 4. Grabación + Replay

### Modelo de datos

Tabla `grabaciones_estudiantes_hero`:
- `secuencia_grabada` jsonb: `[{ tick, botonId, duracion, fuelle }]` (formato compatible con `useReproductorHero`).
- `eventos_json` jsonb opcional: formato extendido tipo osu/Clone Hero (`press|release|correcto|fallada|perdida`).
- `metadata` jsonb: `{ tonalidad, timbre, instrumento_id, modelo_visual_id, pista_id, capas_activas, efectos, metronomo, vista_preferida }`.
- `audio_url` text opcional (DAW personal, futuro).
- `bpm`, `resolucion` (default 192), `tonalidad`, `duracion_ms`.
- `es_publica`, `publicacion_id` (FK a `comunidad_publicaciones`).

### Hooks

| Hook | Función |
|---|---|
| `useGrabadorHero` (`Core/hooks/`) | Captura `tick + botonId + duracion + fuelle`. Usado por simulador clásico |
| `useGrabacionProMax` (`AcordeonProMax/Hooks/`) | Versión Pro Max — guarda snapshot completo del estudio + soporta `cancion_hero` |
| `useReproductorHero` (`Core/hooks/`) | Motor RAF de replay. Loop **siempre vivo** (no termina aunque esté pausado, así puede reanudarse) |
| `useReproductorReplay` (`AcordeonProMax/`) | Wrapper que usa `ReproductorMP3` para evitar bug iOS |

**Bug histórico fix:** el `requestAnimationFrame` en `useReproductorHero` se mataba al pausar (return sin reprogramar). Solución: el loop sigue vivo, solo no ejecuta lógica de ticks cuando `pausadoRef.current === true`.

```ts
const loop = () => {
  if (pausadoRef.current) {
    animFrameRef.current = requestAnimationFrame(loop); // sigue vivo
    return;
  }
  // ... trabajo ...
  animFrameRef.current = requestAnimationFrame(loop);
};
```

### Auto-play de replay con preload

Cuando el simulador recibe `?reproducir=<id>`:
1. Espera `isLandscape` (el SimuladorApp no funciona en vertical).
2. Espera `logica.disenoCargado === true` antes de disparar `iniciarJuego`.
3. Hace **preload manual** de samples para los `botonId` específicos del recording vía `motorAudioPro.cargarSonidoEnBanco` (idempotente).
4. Poll hasta 1.5s para que `tonalidadSeleccionada` matchee la tonalidad del recording (React commit no es síncrono).

Sin esto, las notas se marcaban visualmente pero **no sonaban** en auto-play (en manual sí, porque cuando el usuario tocaba el botón, los samples ya estaban en cache).

### `parsearExpiresAt()` y `expires_at` Unix

ePayco / Bunny / Supabase devuelven timestamps inconsistentes. Helper para distinguir:
```ts
function parsearExpiresAt(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') {
    return new Date(raw < 10_000_000_000 ? raw * 1000 : raw);
  }
  return new Date(raw);
}
```

Si no se distingue Unix segundos vs ms, `new Date(1777425393)` interpreta como ms → año 1970 → cache miss eterno → bucle 1 req cada 400ms hacia la EF. Bug histórico de `useVideoFirmado`. Ver [`SEGURIDAD.md`](./SEGURIDAD.md) sección bucle 81 requests.

---

## 5. Modos de juego (Acordeón Hero / Juego SimuladorApp)

Tipo `ModoPractica = 'ninguno' | 'libre' | 'synthesia' | 'maestro_solo'`.

### Modo Competitivo (`'ninguno'`)
- Vida 100. Notas falladas −2, perdidas −1.
- Multiplicador combo ×1 → ×2 (10) → ×3 (20) → ×4 (40).
- Game Over si vida = 0.
- Cuenta regresiva 3-2-1.
- Vignette roja al recibir daño.
- Pantalla resultados con estrellas (1–3) e inserta en `scores_hero`.

### Modo Libre (`'libre'`)
- Sin daño de vida (siempre 100).
- Sin Game Over.
- Estadísticas siguen contando (Perfectas, Bien, Falladas).
- Multiplicador y puntos como motivación suave.
- Sin countdown — arranque inmediato.
- Visualización: notas como **botones reales** del acordeón con tinte multiply (azul halar / rojo empujar), halo cónico rotando en el botón inminente, cola de sustain con glow externo.

### Modo Synthesia (`'synthesia'`)
- El reproductor **pausa automáticamente** en cada tick de nota.
- El botón del Maestro queda iluminado.
- Indicador pulsante dorado abajo: `👆 Toca el botón iluminado` + número + dirección fuelle.
- El alumno presiona correcto → reanuda.
- Botón equivocado → feedback visual, sin penalización.
- Touch en mobile: el gate de audio permite touch en `'pausado_synthesia'` (sin esto, el alumno mobile no podía consumir notas).

### Modo Maestro Solo (`'maestro_solo'`)
- **Un único acordeón centrado**, sin puente de notas.
- Maestro ilumina + alumno toca encima.
- Barra transporte: ⏮ Reset, ⏸/▶ Pausar, slider seek, beat counter.
- Sub-toggle 🎓 **Modo Guiado**: pausa en cada nota (igual que Synthesia pero en layout solo).
- BPM bajable 40–50% para estudiar secciones.
- Sin scoring (`_golpeHandlerRef` retorna inmediato).

### Modo Práctica Libre (`'practica_libre'`)
- Acordeón interactivo solo, sin canción ni reproductor.
- Toggle Brillante / Armonizado.
- Grid de tonalidades.
- Modos de vista: Teclas / 123 / ♪ / ABC.
- Tecla `Q` invierte fuelle.

### Patrón técnico clave: refs estables para callbacks
Para evitar **closures stale** en `useCallback([])` que registran listeners de teclado:

```ts
const _accionRef = useRef(accion);
useEffect(() => { _accionRef.current = accion; }, [accion]);
// En el callback síncrono:
_accionRef.current(); // siempre la versión más reciente
```

Aplicado en `procesarGolpeAlumno`, `_reproductoActionsRef`, `modoPracticaRef`, `notaEsperandoRef`, `estadoJuegoRef`.

---

## 6. SimuladorApp (modo móvil/landscape)

### Estructura
```
src/Paginas/SimuladorApp/
├── SimuladorApp.tsx                     ← entry point (lee ?reproducir=, ?volverA=)
├── SimuladorAppNormal.tsx               ← UI normal del simulador
├── Componentes/
│   ├── BarraHerramientas/               ← TUTORIALES, Instrumento, Tono, PISTAS, FX, BOTONES, Vista, Tamaño, Metrónomo
│   ├── BannerEcosistemaHero.tsx         ← carrusel rotativo 5s con 6 mensajes de venta
│   ├── BarraGrabacionFlotante.tsx       ← REC/PLAY esquina superior derecha (3 modos: reposo, grabando, reproduciendo)
│   ├── ModalGuardarSimulador.tsx
│   ├── ToastGrabacionGuardada.tsx
│   ├── PopupListaGrabaciones.tsx
│   ├── ModalLoops.tsx + useReproductorLoops.ts
│   ├── ModalMetronomo.tsx + Hooks/useMetronomo.ts
│   ├── ContenedorBajos.tsx              ← prop imagenBajosUrl opcional
│   └── GaleriaAcordeones.tsx            ← modal con tabs Todos/Pro MAX/Originales/Personalizados
├── Datos/
│   └── temasAcordeon.ts                 ← catálogo de modelos visuales con localStorage
├── Hooks/
│   ├── useMetronomo.ts                  ← lift desde modal a SimuladorAppNormal (sobrevive cierre del modal)
│   ├── useReproductorLoops.ts           ← Web Audio API + StereoPannerNode persistente
│   ├── usePointerAcordeon.ts            ← gestión de bloqueadores (paneles que ocluyen pitos)
│   └── useVistaReplayPersistida.ts
└── Juego/
    ├── JuegoSimuladorApp.tsx            ← entry point del modo juego
    ├── Pantallas/                       ← Aprende, ConfigCancion, GameOver, Resultados (.xp.css)
    ├── Modales/                         ← Guardar, Historial
    ├── Piezas/                          ← BarraMaestroMobile, FuelleZonaJuego, HeaderJuegoSimulador, HilerasPitos
    ├── Hooks/                           ← useVerNotasPersistido, etc.
    └── ModosVista/                      ← ModoVistaLibre, PistaNotasBoxed
```

### Barra de herramientas — orden estratégico

**Izquierda (flujo natural del alumno):** TUTORIALES → Instrumento → Tono → PISTAS → FX
**Derecha (controles del simulador):** BOTONES → Vista → Tamaño → Metrónomo → 🛒 → ⋮

Botones tipo "botón físico de acordeón": gradient saliente normal, hundido al press (`translateY(1px)`), activo con gradient invertido + ring cyan + flecha indicadora cyan abajo. La flecha **NO usa transform** porque se ancla por `getBoundingClientRect()`.

### Modo Foco (premium / free)
- Botón flotante `FOCO` esquina superior izquierda (pestaña vertical slim, `writing-mode: vertical-rl`).
- **Premium / Admin:** toda la barra desaparece → acordeón puro.
- **Free:** botones laterales colapsan, banner Hero queda. Timer de **60s** → toast "Modo Foco gratuito terminó. Hazte Plus".
- Detección premium: `esAdmin || usuario?.plan_activo === true`.
- Animación: `cubic-bezier(0.76, 0, 0.24, 1)` 0.55s.
- Variable CSS `--espacio-barra` (default 62px → 0 en foco) para que el canvas se contraiga sin que crezcan los pitos.

### Banner Ecosistema Hero
Carrusel rotativo (5s) con 6 mensajes de venta:

| # | Mensaje | Ruta | Acento |
|---|---|---|---|
| 1 | 🎮 Acordeón HERO — Juega notas en cascada | `/acordeon-pro-max` | morado→cyan |
| 2 | 👑 Hazte Plus | `/paquetes` | dorado |
| 3 | 🎓 Aprende desde cero | `/tutoriales-de-acordeon` | verde |
| 4 | 🏆 Compite en el Ranking | `/ranking` | naranja |
| 5 | 👥 +5,000 acordeoneros | `/comunidad` | rosa |
| 6 | 📲 Agrégalo a tu pantalla (PWA) | popup iOS/Android | azul (solo mobile sin PWA instalada) |

Hover pausa la rotación. Detección PWA: `display-mode: standalone`.

### Galería de acordeones
Estructura `public/acordeones/<id>/{diapason.jpg, bajos.jpg, preview.png}`. Para agregar modelo nuevo:
1. Crear carpeta con esos 3 archivos.
2. Agregar entrada en `Datos/temasAcordeon.ts`.
3. Aparece automáticamente.

3 modelos iniciales: **Pro MAX** (default), **Rojo Clásico**, **Verde Vallenato**. Soporte `premiumOnly` y `colores: {cuerpo, botones, fuelle}` listos para editor en vivo (F2). Variable CSS `--imagen-diapason` aplicada inline al canvas.

### Acordeón embebido en clases (admin only)
Componente `componentes/VisualizadorDeLeccionesDeCursos/PanelAcordeonEnClase.tsx`:
- Pestañas Acordeón / Sonido.
- Reusa `useLogicaAcordeon` y `SeccionPLSonido`.
- Botón "Ver acordeón" en `EncabezadoLeccion.tsx` (desktop). En mobile, ícono al lado del menú 3-puntitos que navega a `/simulador-app?volverA=<url-clase>&t=<segundo>`.
- `ReproductorLecciones.tsx` captura `currentTime` del iframe (Bunny / YouTube) vía `postMessage` cada 2s.
- Volver de simulador → reanuda video con `&t=NN` o `&start=NN`.
- Guard `{esAdmin && (...)}` — liberar al resto cuando termine prueba.

---

## 7. Editor de canciones (admin) — flujo histórico Svelte

> **Estado:** plan documentado, no migrado completamente. El admin actual graba inline desde `EstudioAdmin` de Pro Max.

Wizard original Svelte de 4 pasos:
1. **Subir Audio** → MP3, metadata (título, artista, BPM, dificultad).
2. **Grabar Notas** → mientras suena el MP3, el creador toca el acordeón virtual; sistema captura `{nota_id, timestamp_ms, duracion_ms}`.
3. **Vista Previa** → control de calidad reproduciendo audio + notas voladoras.
4. **Publicación** → MP3 a Storage, JSON a `partituras_simulador`, registro en `canciones_simulador_acordeon` (en producción actual: `canciones_hero`), recompensas XP.

### Plan migración React (Fases)
1. Verificar tablas `canciones_hero`, `partituras_simulador`. Crear tipos `Cancion`, `Partitura` en `src/types/simulador.ts`.
2. Componente `CreadorCanciones.tsx` (admin) simplificado: input MP3 + botón REC + array `notasGrabadas` + guardado.
3. Selector de canciones en juego: pantalla `SeleccionCanciones.tsx` que liste `canciones_hero`. Al elegir, descargar JSON y pasárselo a `useReproductorHero`.
4. Sincronización audio: `<audio>` o `Howler.js` (en producción se usa `ReproductorMP3` Web Audio API).

> **NO copiar y pegar** el código Svelte. La lógica de estado es muy diferente. Reescribir con hooks React. El motor matemático (`logicaJuego.ts` → `useReproductorHero.ts`) ya está portado.

---

## 8. Gestor de pistas (BPM tap + conteo)

Archivo: `src/Paginas/SimuladorDeAcordeon/Componentes/GestorPistasHero.tsx`.

### Flujo
1. Cargar MP3/WAV → reproductor.
2. Play → escucha la canción.
3. Tapear `P` al ritmo (mín 3 taps, ideal 6-8) → detecta BPM + captura fase.
4. Elegir clicks: 4, 8 o 12.
5. **▶ Escuchar** → preview: audio retrocede + clicks suenan sincronizados.
6. **✓ Aplicar BPM** → manda BPM al simulador.
7. **⏺ Grabar con N clicks** → conteo → grabación arranca automáticamente.

### Detección de BPM
```ts
const ahora = Date.now();                  // reloj sistema → BPM
const audioAhora = audioRef.current?.currentTime; // posición audio → fase
// BPM = 60000 / promedio(intervalos)
```

`faseAudio` = posición del audio en el último tap. Permite colocar clicks hacia atrás desde ese punto. Reset automático si pasan >3s sin tocar.

### Conteo hacia atrás
```
faseAudio=8.0s, BPM=120, numClicks=8
audioStart = 8.0 - (8 × 0.5) = 4.0s ← seek del audio
🟡 click agudo 1200Hz (beat 1)  🟣 click grave 800Hz (beats 2-4)
```

Clicks pre-programados con `AudioContext.currentTime` (sample-accurate, no `setInterval`).

### Pendientes
- Guardar `faseAudio` y `bpmDetectado` en Supabase (columna `beat_offset_seconds` en `canciones_hero`).
- En playback estudiante, usar `beat_offset_seconds` para arrancar audio en punto correcto después del conteo.

---

## 9. Sincronía notas ↔ MP3 (NO RESUELTO)

**Estado:** ❌ NO RESUELTO al 2026-05-03 (4 enfoques fallaron).

### Problema
Cuando se reproduce una canción del repertorio con notas pre-grabadas:
- Notas iluminan correctamente.
- Notas suenan.
- **Pero suenan desfasadas respecto al MP3 de fondo** (atrasadas, constante, ~50–200ms).

Destruye el producto: el alumno no puede comparar su ejecución contra modelo.

### Páginas afectadas
- `/acordeon-pro-max/acordeon` — `ReproductorCancionHero.tsx` inline. Usa `ReproductorMP3` (Web Audio).
- `/acordeon-pro-max/admin/practica` — `EstudioAdmin.tsx` con `BarraTransporte` o `BarraTimelineProMax` + `useAudioFondoPracticaLibre` (HTMLAudio).

### Lo que SÍ funciona (referencia)
- Modo Maestro/Competencia.
- Reproducción inmediatamente después de grabar en Admin.

### Enfoques probados (todos fallaron)
1. HTMLAudio + listeners `seeked`/`playing` → desfase variable.
2. Calibración manual con offset (`tickInicialOverride`) → no determinístico.
3. Web Audio API directa (igual que el motor) → mismo desfase.
4. Sincronizar `tickActual` al inicio del RAF con `audio.currentTime` → no resuelve.

### Hipótesis para mañana
- Bug en grabación (timestamp captura) más que en reproducción.
- Calibración manual por canción (`offset_audio_ms` jsonb en metadata).

Archivos involucrados:
- `src/Paginas/AcordeonProMax/PracticaLibre/Componentes/ReproductorCancionHero.tsx`
- `src/Paginas/AcordeonProMax/Admin/Paginas/EstudioAdmin.tsx`
- `src/Core/hooks/useReproductorHero.ts`
- `src/Core/audio/ReproductorMP3.ts`
- `src/Core/audio/AudioEnginePro.ts`
- `src/Core/hooks/useLogicaAcordeon.ts`
- `src/Paginas/AcordeonProMax/PracticaLibre/Hooks/useAudioFondoPracticaLibre.ts`

---

## 10. Replay de grabaciones (`/grabaciones`)

### Vistas
- **Escritorio:** `ModalReplayGrabacionHero.tsx` (rediseñado 2026-05-07): flexbox + `clamp()` para escala suave 0.30–0.85 según viewport. Single break en 840px (1 columna). Métricas en `grid auto-fit minmax(110px, 1fr)`.
- **Móvil:** `VisorReplaySimulador.tsx`: marco "Pro MAX", 3 hileras de pitos, lee `logica.botonesActivos` → pitos se iluminan automáticamente (azul halar / rojo empujar).

### Hook `useVistaReplayPersistida`
Persiste preferencia Escritorio/Móvil en localStorage. Default automático: `metadata.vista_preferida === 'movil'` arranca en Móvil.

### Botón "Reproducir en simulador"
Visible solo en vista Móvil. Click → cierra modal + navega a `/simulador-app?reproducir=<id>`.

### Auto-play en simulador
Ver sección 4 (preload + espera disenoCargado + poll tonalidad). Countdown al fin REAL de la grabación (`metadata.duracion_ms`, no última nota): "Volviendo en 3s..." → auto-redirect, "Volver ahora", "Quedarme aquí".

### Bugs corregidos durante la sesión 2026-05-07
- `metronomoVivo`: lift de `useMetronomo` desde el modal a `SimuladorAppNormal` para que sobreviva al cierre.
- Metadata `metronomo` se guarda al detener REC: `{ activo, bpm, compas, subdivision, sonido, volumen }`.
- Instancia separada `metronomoReplay` para reproducir el metrónomo de la grabación sin pisar el del usuario.

---

## 11. Pendientes conocidos del simulador

### Críticos
- ❌ **Sincronía notas↔MP3** (sección 9).
- 🟡 **Bug cambio de pestaña en mobile**: AudioContext queda suspended al volver de background; requiere un tap antes de volver a sonar.
- 🟡 **Auto-play en iOS sin tap**: SPA navigation desde `/grabaciones` puede preservar user activation pero iOS es estricto.

### Mejoras / fase 2
1. **Eco y Distorsión funcionales** (hoy son UI placeholder). Falta `DelayNode` (eco) y `WaveShaperNode` (distorsión) en motor.
2. **EQ 5 bandas reales**: hoy mapea 5 UI a 3 internas. Pasar a 5 `BiquadFilter` en serie.
3. **Pan de loops/metrónomo más fino** si en algún momento hay múltiples capas paralelas.
4. **Sample preview por tonalidad**: hoy IDs hardcoded `1-3-halar` y `1-1-halar-bajo`. Fallback al primer botón disponible.
5. **Práctica Libre — previews completos** en su sidebar (loops y metronomoVivo viven en SimuladorApp; exponer desde `useEstudioPracticaLibre`).
6. **Punch-in con timeline visual** para re-grabar secciones (`mezclarPunchIn` ya existe en el servicio).
7. **PWA real**: `manifest.json` + service worker offline + splash screen.
8. **Detectar actividad real en Modo Foco**: si toca pitos durante los 60s, reiniciar timer.
9. **F2: Editor de colores en vivo** en GaleriaAcordeones (color pickers + `mix-blend-mode: multiply` sobre grayscale).
10. **F3: Premium gating de modelos** (badge PLUS ya existe).
11. **F4: Marca de agua** sutil en cuerpo del acordeón (`pointer-events: none`).
12. Quitar `console.log` con prefix `[Replay]` / `[Loops]` antes del go-live.

### Cómo retomar trabajo en SimuladorApp
1. `npm run dev`.
2. Login admin (o forzar `localStorage.usuario_actual.rol='admin'`).
3. `/simulador-app`.
4. Probar:
   - Modo foco (botón cyan FOCO arriba izquierda).
   - Galería (menú ⋮ → "Galería de Acordeones").
   - Banner Hero rotando.
   - Modal admin de grabación.
   - Panel FX con eco/distorsión + presets.
