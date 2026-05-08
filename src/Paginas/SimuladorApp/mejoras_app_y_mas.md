# Mejoras de la app y más — Sesión 2026-05-07

Documento de toda la sesión de trabajo del día. Lo dejo aquí en `SimuladorApp/`
porque la mayoría de cambios giran alrededor del simulador, aunque también
tocamos clases, Práctica Libre y el motor de audio compartido.

---

## 1. Acordeón virtual embebido en clases (admin only)

**Por qué:** dar a los alumnos sin acordeón físico la opción de practicar lo
que ven en una clase de curso/tutorial sin salir de la página.

### Cambios
- **Componente nuevo** `componentes/VisualizadorDeLeccionesDeCursos/PanelAcordeonEnClase.tsx`
  + `.css`. Pestañas **Acordeón / Sonido**, dropdown de tonalidad (default
  `BES`), slider de tamaño que ajusta el ancho del sidebar entero, fader de
  fuelle (Halar / Empujar). Reusa `useLogicaAcordeon` y `SeccionPLSonido` del
  simulador, así suena exactamente igual.
- **`EncabezadoLeccion.tsx`**: botón **"Ver acordeón"** en desktop al lado de
  "Ver/Ocultar contenido". En mobile, ícono de acordeón al lado del menú de
  3-puntitos que navega a `/simulador-app?volverA=<url-clase>&t=<segundo>`.
- **`SimuladorApp.tsx`**: botón flotante **"Volver a la clase"** cuando llega
  con `?volverA=`. Sale de fullscreen, limpia la clase `bloquear-scroll-simulador`
  y navega a la URL devolviendo `?t=N`.
- **`ReproductorLecciones.tsx`**:
  - Captura `currentTime` del iframe Bunny / YouTube vía `postMessage`
    (listener pasivo + polling cada 2s pidiendo `getCurrentTime`).
  - Nuevas props `tiempoInicial` y `onTiempoActualizado`.
  - Reanuda el video añadiendo `&t=NN` (Bunny) o `&start=NN` (YouTube) al
    iframe + `autoplay=true` cuando hay tiempo guardado.
- **`ClaseCurso.tsx` / `ClaseTutorial.tsx`**: state `mostrarAcordeon`,
  `tiempoVideoRef`, lectura de `?t=` con `useSearchParams`. `useEffect` que
  fuerza `scrollTo(0,0)` con 5 retries (50ms / 200ms / 500ms / 1000ms) +
  `history.scrollRestoration='manual'` para vencer el rebote del autoplay
  del iframe.
- **Guard de admin**: el botón solo se renderiza si `usuario?.rol === 'admin'`
  (vía `useUsuario()` del `UsuarioContext`). Se libera al resto de roles
  cuando terminemos las pruebas.

### Por qué importa el guard
Estamos haciendo prueba de producción. Cuando todo esté validado, basta con
quitar el `{esAdmin && (...)}` en `EncabezadoLeccion.tsx` (busca el comentario
`Acordeón embebido en la clase: por ahora solo lo ven administradores`).

---

## 2. Limpieza profunda del visualizador de lecciones

**~239 líneas eliminadas** de `componentes/VisualizadorDeLeccionesDeCursos/`
sin cambiar comportamiento observable.

| Archivo | Qué se eliminó |
|---|---|
| `useReproductorLecciones.ts` | 3 funciones duplicadas (`procesarUrl`/`detectarTipoVideo`/`limpiarUrlVideo`) → 1 sola. 5 states muertos. 1 ref que no se usaba. -67% líneas |
| `BarraProgresoGeneral.tsx` | useState/useEffect zombi con `setTimeout(0)` (artefacto del Svelte original) → props directas con defaults. -43% |
| `PestañasLeccion.tsx` | 4 props nunca leídas + paso de 6 props muertas a hijos |
| `TarjetaInformacionCurso.tsx` | 3 props nunca usadas + 8 comentarios JSX banales |
| `BarraLateralCurso.tsx` | Prop `mostrarSidebar` desestructurada y nunca usada |
| `useBarraLateralCurso.ts` | 2 props muertas en interfaz + condición redundante `\|\| p === 100` |
| `NotasLeccion.tsx` | Branch inalcanzable en `cargarNotas` |
| `useEncabezadoLeccion.ts` | Export `cursoSlug` que nadie consumía |
| `useComentariosLeccion.ts` | Export `comentarios` muerto (los consumidores leen los derivados) |

`tsc -b` sin errores nuevos respecto a HEAD (los que persisten son tipos
generados de Supabase, ajenos a esta limpieza).

---

## 3. Botones de la barra del simulador (escritorio)

### "BOTONES" (control de drag)
- **Bug original**: el ícono Move se salía del contenedor al arrastrar al
  máximo y el label se tapaba.
- **Fix** en `BarraHerramientas.tsx` + CSS:
  - `dragConstraints={{ left: -8, right: 8 }}` (espacio real del contenedor).
  - `dragElastic={0}` para que se detenga en seco (antes 0.25 dejaba que se
    estirara 25% más allá).
  - `dragSnapToOrigin` para que regrese al centro al soltar.
  - **Doble clic resetea la posición** del acordeón (`animate(x, 0, ...)`).
  - Factor de movimiento `4 / escala` (era 8, ahora más suave).
  - **Límite ±35% del ancho del viewport** — el acordeón ya no puede salir
    del cuadro visible.
  - Contenedor con `height: 46px` + `margin-top: 16px` para que el label
    "BOTONES" arriba no se solape con el ícono.

### "Vista" (antes ojo)
- Reemplazado el icono `Eye` por un mini-grid 2×2 con las letras `C / Re /
  E / Fa` que comunica visualmente las 4 modalidades de vista.

### "TAM" (Tamaño)
- Botones `−`/`+` agrandados de 20×20 a **32×32 px** con feedback `:active`.
- Label `TAM` → `Tamaño` (palabra completa).
- Tooltips "Reducir tamaño" / "Aumentar tamaño".
- Valor `100%` más grande y legible.

### "BAJOS"
- Rediseñado a **círculo translúcido** que se asoma desde el borde superior
  (cortado a la mitad). `backdrop-filter: blur(6px)` + `top: -50px` para el
  efecto. Visualmente coincide con apps móviles de acordeón referencia.

---

## 4. Panel de Efectos de Audio (FX)

**Componente nuevo y reusable** `componentes/Efectos/PanelEfectosAudio.tsx`
+ `.css` para SimuladorApp (modal flotante) y Práctica Libre (sección dentro
del sidebar lateral). Mismo aspecto, distinto montaje.

### Estructura
```
[ Header: Efectos de Audio | Avanzado | ✕ ]
┌──────────┬──────────┬──────────┬──────────────────────────────┐
│ REVERB🔘 │ ECO 🔘   │ DISTORS🔘│ ECUALIZADOR  [TECLAS][LOOPS] │
│ Preaj.   │ Knob     │ Preaj.   │ Preset / 5 sliders verticales │
│ Knob     │ Knob     │ Knob     │ +12 / 0 / -12 dB              │
└──────────┴──────────┴──────────┴──────────────────────────────┘
[ Volúmenes  Restaurar ]
┌──────────┬──────────┬──────────┬──────────────────────────────┐
│ TECLADO  │ BAJOS    │ LOOPS    │ METRÓNOMO                    │
│ Fader    │ Fader    │ Fader    │ Fader                        │
│ PAN knob │ PAN knob │ PAN knob │ PAN knob                     │
│ I    D   │ I    D   │ I    D   │ I    D                       │
└──────────┴──────────┴──────────┴──────────────────────────────┘
```

### Knobs estilo perilla real
- Fondo metálico gris radial.
- **Estrías radiales** con `repeating-conic-gradient` (pseudo `::before`).
- **Núcleo blanco brillante** con gradiente esférico (pseudo `::after`).
- Marca indicadora de color por acento (cyan/azul/naranja/verde/morado).
- Drag vía `<input type="range">` invisible superpuesto.

### Faders con visualizador estéreo
- Cada fader contiene **dos columnas L/R** con gradiente rojo→amarillo→verde
  tipo VU meter.
- Altura de cada columna calculada como `volumen × factorPan`:
  - `factorL = pan ≤ 0 ? 1 : 1 - pan/50`
  - `factorR = pan ≥ 0 ? 1 : 1 + pan/50`
- Resultado: al mover el knob PAN se ve cómo una columna se acorta y la otra
  crece — feedback visual idéntico a un mixer real.
- Marcas laterales con `repeating-linear-gradient` simulando reglas de fader.

### Previews de audio (mantener presionado)
Cada slider y cada knob de PAN dispara el sample correspondiente mientras se
mantiene pulsado:
- **TECLADO** → toca pito `1-3-halar`.
- **BAJOS** → toca bajo `1-1-halar-bajo`.
- **LOOPS** → arranca "Pista de chande sabor" automáticamente si no hay
  pista activa, la silencia al soltar (solo si fuimos nosotros quienes la
  encendimos).
- **METRÓNOMO** → arranca el metrónomo, lo apaga al soltar (preserva el
  estado si el alumno lo tenía prendido).

Tanto los Faders como los Knobs comparten los mismos handlers `onPreviewIniciar`/
`onPreviewDetener` con un `enPreviewRef` que evita arranques duplicados de
eventos `pointerdown` + `touchstart` simultáneos en mobile.

---

## 5. Motor de audio: sub-buses + pan stereo

**Modificación quirúrgica de `Core/audio/AudioEnginePro.ts`** sin afectar
la latencia de ninguna pantalla existente.

### Sub-buses TECLADO / BAJOS
```
voz pool ─→ busTeclado (Gain) ─→ panTeclado (StereoPanner) ─┐
                                                             ├→ directBus / mixBus
voz pool ─→ busBajos (Gain)   ─→ panBajos (StereoPanner)   ─┘
```

- En `_inicializarPool` cada voz se conecta a `busTeclado` por default.
- `reproducir(..., seccion?: 'teclado' | 'bajos')` reconecta la voz al bus
  correcto si la sección difiere de la última.
- Detección automática como fallback: si `idSonido.includes('Bajos')` →
  `bajos` (preserva compatibilidad con replays/grabaciones que no pasan
  el flag).
- `_conmutarRuta` ahora reconecta los **pan nodes** (no el pool) entre
  `directBus` y `mixBus` según haya filtros activos.

**Métodos públicos nuevos en el motor:**
- `setVolumenBusTeclado(0..1)` / `setVolumenBusBajos(0..1)`
- `setPanTeclado(-1..1)` / `setPanBajos(-1..1)`

Costo de latencia agregado: ~1 ms por path (2 nodos extra). Imperceptible
en Android low-end.

### Detección de sección en `useLogicaAcordeon.reproducirTono`
```ts
const esBajo = id.includes('bajo');
const seccion: 'teclado' | 'bajos' = esBajo ? 'bajos' : 'teclado';
motorAudioPro.reproducir(ruta, instrumentoId, volume, ..., seccion);
```

Sin esto los pitos y bajos compartían el `nodoGananciaPrincipal` y los
sliders de volumen movían ambos juntos.

### Pan en LOOPS y METRÓNOMO
Estos hooks crean su propio pipeline separado del motor — agregamos
StereoPannerNode persistente:

- `useReproductorLoops`: routing `source → gain → panNode → destination`.
  Nuevo state `pan` y método `setPan(p)`. `useEffect` con
  `setTargetAtTime(p, ctx.currentTime, 0.03)` para evitar zipper noise.
- `useMetronomo`: igual patrón. El panNode persiste mientras vive el hook;
  cada `playClick` conecta el envelope al panNode (no al destination
  directo).

---

## 6. Reverb mejorado — 5 presets con IR sintético

**Investigación**: basado en el paper [Moorer "About This Reverberation
Business"](https://github.com/adelespinasse/reverbGen) y la librería
[Reverb.js](http://reverbjs.org/). El método estándar para IR sintético
convincente es **ruido blanco con decay exponencial**, mejorado con
pre-delay y early reflections.

### Generador `_generarIRSintetico(preset)`
Combina 4 técnicas:
1. **Cuerpo**: ruido blanco descorrelacionado por canal con decay exponencial
   `Math.pow(1 - t, decayShape)`.
2. **Pre-delay**: silencio al inicio (sensación de distancia/espacio
   grande).
3. **Early reflections**: pulsos discretos en los primeros 50-200 ms con
   amplitud decreciente, descorrelacionados estéreo.
4. **Filtrado tonal**: IIR de un polo (lowpass simple) que modula el
   "color" según `brillo` (<1 cálido, >1 brillante).

### 5 presets

| Preset | Duración | Pre-delay | Decay | Brillo | Sensación |
|---|---|---|---|---|---|
| Cuarto Mediano | 0.7s | 5ms | 3.5 | 1.0 | Sala de ensayo seca |
| Cuarto Grande | 1.4s | 12ms | 2.6 | 0.95 | Sala con cuerpo |
| Vestíbulo Mediano | 2.2s | 25ms | 2.0 | 0.85 | Lobby cálido |
| Vestíbulo Grande | 3.5s | 40ms | 1.7 | 0.78 | Iglesia / teatro |
| Escenario Abierto | 1.8s | 60ms | 1.6 | 1.1 | Aire libre brillante |

### Otros ajustes
- **Intensidad efectiva**: factor del wet `0.5 → 0.85` para que el alumno
  sienta el efecto al subir el slider.
- Default al arrancar la app: `cuarto_grande` (perfil balanceado).
- Cuando el alumno elige un preset desde el dropdown, se regenera el
  `reverbNode.buffer` y se aplica la intensidad sugerida del preset.

### Método público nuevo
`motorAudioPro.cargarPresetReverb(presetId)` → regenera el IR en vivo.

---

## Archivos creados / modificados

### Nuevos
- `src/componentes/VisualizadorDeLeccionesDeCursos/PanelAcordeonEnClase.tsx`
- `src/componentes/VisualizadorDeLeccionesDeCursos/PanelAcordeonEnClase.css`
- `src/componentes/Efectos/PanelEfectosAudio.tsx`
- `src/componentes/Efectos/PanelEfectosAudio.css`
- `.claude/launch.json`
- `src/Paginas/SimuladorApp/mejoras_app_y_mas.md` (este archivo)

### Modificados
- `src/Core/audio/AudioEnginePro.ts` (sub-buses, pan, presets reverb)
- `src/Core/audio/_tipos.ts` (campo `seccion` en `VozPooled`)
- `src/Core/hooks/useLogicaAcordeon.ts` (paso de `seccion` al motor)
- `src/Paginas/SimuladorApp/SimuladorApp.tsx` (botón FX, modal, states,
  preview chande sabor, scroll fix al volver del simulador)
- `src/Paginas/SimuladorApp/Componentes/BarraHerramientas/BarraHerramientas.tsx`
  + `.css` (botón FX, drag refinado, icono Vistas, TAM agrandado)
- `src/Paginas/SimuladorApp/Componentes/ContenedorBajos.css` (botón círculo
  translúcido)
- `src/Paginas/SimuladorApp/SimuladorApp.css` (botón "Volver a la clase")
- `src/Paginas/SimuladorApp/Hooks/useReproductorLoops.ts` (pan stereo)
- `src/Paginas/SimuladorApp/Hooks/useMetronomo.ts` (pan stereo)
- `src/Paginas/AcordeonProMax/PracticaLibre/Componentes/PanelLateralEstudiante.tsx`
  (uso del nuevo PanelEfectosAudio)
- `src/componentes/VisualizadorDeLeccionesDeCursos/EncabezadoLeccion.tsx`
  + `.css` (botón "Ver acordeón" admin only, ícono mobile)
- `src/componentes/VisualizadorDeLeccionesDeCursos/ReproductorLecciones.tsx`
  (captura/restauración del tiempo del video)
- `src/Paginas/Cursos/ClaseCurso.tsx` y `src/Paginas/Tutoriales/ClaseTutorial.tsx`
  (state `mostrarAcordeon`, scroll fix, render condicional del panel)
- `src/Paginas/Tutoriales/contenido-tutorial.css` (sidebar más ancho con
  acordeón abierto)
- Limpieza en `BarraLateralCurso.tsx`, `BarraProgresoGeneral.tsx`,
  `NotasLeccion.tsx`, `PestañasLeccion.tsx`, `TarjetaInformacionCurso.tsx`,
  `useBarraLateralCurso.ts`, `useComentariosLeccion.ts`,
  `useEncabezadoLeccion.ts`, `useReproductorLecciones.ts`

---

## Lo que quedó pendiente / fase 2

1. **Eco y Distorsión funcionales**: hoy son UI placeholder. Hace falta
   `DelayNode` (eco) y `WaveShaperNode` (distorsión) en el motor + cableado
   con preset de curvas.
2. **EQ 5 bandas reales**: el motor mapea internamente las 5 bandas de UI
   a las 3 reales (60+230 → graves, 910 → medios, 3.6k+14k → agudos). Para
   bandas independientes de verdad hay que pasar el motor a 5 BiquadFilter
   en serie.
3. **Pan de loops/metrónomo más fino**: hoy va a 1 polo cada uno. Si en
   algún momento agregamos múltiples capas o pistas paralelas, cada una
   necesitará su propio sub-bus.
4. **Sample preview de teclado/bajos por tonalidad**: actualmente usa IDs
   hardcoded `1-3-halar` y `1-1-halar-bajo`. En tonalidades muy raras
   podría no existir alguno; agregar fallback que busque el primer
   botón disponible de `configTonalidad`.
5. **Práctica Libre — previews completos**: el panel se monta en su sidebar
   pero sin handlers de preview de teclado/bajos/metrónomo (el `loops` y
   `metronomoVivo` viven en SimuladorApp). Para integrar previews ahí
   habría que exponer la lógica equivalente desde `useEstudioPracticaLibre`.
6. **Liberar el botón de acordeón en clases al resto de roles** cuando
   terminen las pruebas con cuentas admin.
