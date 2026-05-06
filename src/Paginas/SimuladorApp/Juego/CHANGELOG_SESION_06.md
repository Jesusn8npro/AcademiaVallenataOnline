# Sesión 6 — Modos visuales nuevos, performance y modo Maestro en juego

Sesión enfocada en pulir el modo juego del SimuladorApp en mobile real
(iPhone + Android). Empezó con 4 problemas reportados (touch iPhone, lag
en competición, archivos gigantes, faltaban métodos visuales) y terminó
con 9 commits que cubren bugs, performance, refactor, 3 modos visuales
nuevos, modo Maestro integrado y recomendación al fallar.

---

## Tabla de commits

| Commit | Tipo | Descripción |
|---|---|---|
| `0389a75` | perf | Rompe cascada de re-renders en competición + fix touch iPhone |
| `a65769e` | fix | Nota larga visible al pisar + visual antes que motor + revierte split CSS |
| `808b292` | feat | Halo cónico rotando en pito objetivo + color saturado |
| `f7656d5` | perf | Elimina ~25ms de latencia táctil en Android |
| `11ec988` | feat | 3 modos visuales nuevos + selector unificado |
| `6f65a85` | fix | Cuatro bugs de los modos visuales reportados en mobile |
| `4b816d0` | fix | Rediseña FOCO + unifica z-index para que las notas vayan encima |
| `23b0e99` | feat | Barra de transporte Maestro + recomendación al fallar |
| `ce83b8a` | fix | Correcciones de Synth/Guía/Foco + BarraMaestroMobile compacta |

---

## 1. Bugs de mobile real

### Touch iPhone necesitaba fuelle pisado para notas rápidas (`0389a75`, `a65769e`)

**Síntoma**: en iPhone, sin un dedo permanente en la zona del fuelle,
los toques rápidos en pitos no registraban hits. Sólo "funcionaba"
cerrando (con dedo en la zona del fuelle como ancla).

**Diagnóstico inicial fallido**: pensé que era de scoring (la dirección
del fuelle afectando el hit). Un agente confirmó que `procesarGolpeAlumno`
NO compara dirección — solo el timestamp determina perfecto/bien/fallido.
Eso descartó la hipótesis.

**Causa real**: era un síntoma del bug de re-renders en competición. iOS
Safari hace throttling (WebKit #199803) de touchstarts aislados sin gesto
sostenido. Con el main thread saturado de re-renders cada tick, el
throttling se sentía peor. Con un dedo "ancla" en la zona del fuelle,
había gesto sostenido y los toches cortos llegaban a frecuencia normal.

**Fixes aplicados:**

- `.juego-sim-fuelle-zona` agregada a `ZONAS_JUGABLES` en
  `usePointerAcordeon.ts` (preventDefault global ahora la cubre).
- Pre-unlock del AudioContext de iOS al montar el juego con
  `setFuelleVirtual(true)` (antes esperaba el primer toque).
- Bug de notas largas que desaparecían al pisar: `progresoMax` extendido
  por duración (`1.1 + duracion / TICKS_VIAJE`) en `PistaNotasVertical`
  para que sostenidos no se recortaran prematuramente.

### Lag/jank en modo competición (`0389a75`)

**Diagnóstico**: `reproductor.tickActual` expuesto como state reactivo a
60Hz. Cada cambio re-renderizaba el árbol entero de `JuegoSimuladorApp`
(563 líneas) + `HeaderJuegoSimulador` (sin React.memo) + 90 pitos. Con
ráfagas rápidas, `procesarGolpeAlumno` disparaba 6 setStates en cascada
sin batching → 6 renders consecutivos del árbol completo.

**Fixes aplicados:**

- `React.memo(HeaderJuegoSimulador)`.
- Componente `<Pito>` extraído y memoizado (props primitivos: `pos`,
  `label`, `claseLabel`, `claseObjetivo`).
- `pitosPorHilera` movido a `useMemo` con deps reales (config, dirección,
  modo vista, objetivos) — `tickActual` NO en deps.
- Bug bonus: `useMemo(rangoSeccion)` movido antes de `if (!hero) return null`
  (Rules of Hooks).

### Latencia táctil ~25ms en Android (`f7656d5`)

**Diagnóstico** (con investigación de fuentes web — Chrome devs,
Smashing, Nolan Lawson):

- `actualizarGeometria()` se llamaba en cada `touchstart`. Iteraba ~33
  pitos con `getBoundingClientRect` — costo ~15ms en low-end.
- `elementFromPoint` adicional: 5-10ms.
- Los setStates en cascada de `actualizarBotonActivo` cedían el main
  thread durante React reconciliation antes del paint visual.

**Fixes aplicados:**

- Quitado `actualizarGeometria()` de `registrarInicio`. Los listeners de
  resize/orientation ya mantienen el cache fresco.
- Match exacto sobre `rectsCache` antes de `elementFromPoint` en
  `encontrarPosEnPunto`.
- `startTransition` envuelve `actualizarBotonActivo` en `registrarInicio`,
  `registrarFin` y `procesarPunto` — los setStates del motor se marcan
  como non-urgent y no bloquean el paint del DOM imperativo
  (`actualizarVisualBoton`).

---

## 2. Tres modos visuales nuevos (`11ec988`, `6f65a85`, `4b816d0`, `ce83b8a`)

Antes había 2 modos: **Libre** (caída tipo Guitar Hero) y **Synth**
(cajita Synthesia clásica). Investigación con un agente sobre 10 juegos
rítmicos (Synthesia, Beat Saber, Piano Tiles 2, Guitar Hero, DDR, Cytus,
Deemo, Rhythm Heaven, osu!mania, Skoove) sugirió 3 modos
complementarios. Cada uno fue iterado al menos una vez tras feedback.

### Modo GUÍA (Skoove + tutorial)

Rehecho dos veces. Versión final:

- Reusa `PistaNotasVertical` para el render de notas (mismo timing,
  animaciones y consumo de cola que modo Libre).
- Añade un banner overlay arriba al centro: **"↑ ABRIENDO"** o
  **"↓ CERRANDO"** según la nota más próxima al impacto.
- Pensado para principiantes que aún no asocian colores azul/rojo con
  dirección del fuelle.

### Modo FOCO (Piano Tiles + Deemo)

Rehecho dos veces. Versión final:

- UNA sola tarjeta grande centrada arriba.
- Contiene: indicador de dirección con flecha (`↑ ABRIENDO` /
  `↓ CERRANDO`), los nombres del pito o del acorde en cuadritos, y una
  flecha grande `▼` parpadeante hacia abajo.
- La tarjeta crece (`scale`) conforme se acerca el momento del impacto.
- Cero clutter — no se ven notas en camino, solo lo que toca pisar AHORA.
- Las versiones anteriores fueron descartadas: la primera tapaba los
  nombres de los pitos con tiles enormes; la segunda tenía múltiples
  tiles + conectores que se cruzaban en acordes.

### Modo CARRIL (Beat Saber + DDR)

- El fondo entero de la pista cambia de color (azul tenue para abriendo,
  rojo tenue para cerrando) según el fuelle inminente.
- Detrás aparece la palabra **"ABRE"** o **"CIERRA"** muy grande,
  semi-transparente, con animación de pulso.
- Las notas no inminentes se atenúan al 28% para que el peso visual
  esté en el fondo + la nota próxima.
- Asociación: espacio físico de la pantalla = dirección del fuelle.

### SelectorModoVisual (`11ec988`)

- Reemplaza los 2 botones del switch viejo por un selector compacto.
- Botón trigger muestra el modo activo (icono + título + flecha).
- Al tocarlo abre un popup con las 5 opciones (título + descripción de
  1 línea). Cierra al tocar fuera.
- `useModoVisualPersistido` extendido a 5 valores con validación de
  localStorage para no romper si hay un valor antiguo.

### Z-index unificado (`4b816d0`)

GUÍA, FOCO y CARRIL estaban en `z-index: 5` — las notas se veían
detrás de los pitos. Vertical y Boxed estaban en 50/600. Unificado a
50 (excepto Boxed que sigue en 600).

### Línea de Synth pegada al acordeón (`ce83b8a`)

Antes: `height: 50vh` dejaba un hueco negro entre la cajita y los
pitos. Ahora: `bottom: 38vh` (mismo valor que `.juego-sim-fuelle-zona`)
ancla la línea inferior justo donde empiezan los pitos.

---

## 3. Modo Maestro en el juego del simulador (`23b0e99`, `ce83b8a`)

Antes el modo Maestro existía solo en AcordeonProMax. Ahora también
disponible al elegir "Maestro" en la configuración de la canción.

### BarraMaestroMobile (componente nuevo)

Primera versión (`23b0e99`) importaba `BarraTransporte` de ProMax tal
cual — funcional pero ocupaba ~80px y tenía muchos labels. Por feedback
del usuario, en `ce83b8a` se reescribió como componente nuevo:

- 38px de altura (34px en `<480px`).
- Una sola fila horizontal mobile-first.
- Controles esenciales: atrás 500 ticks, play/pause, adelante 500 ticks,
  scrubber, BPM compacto (slider + valor), loop cíclico de un solo
  botón (cicla `A → B → activar → limpiar`), reset al inicio.

### CSS recalcula offsets

Cuando la barra Maestro está visible, las pistas y la zona del fuelle
bajan 38/34px usando `:has()`:

```css
.juego-sim-root:has(.juego-sim-barra-maestro) .pista-notas-vertical {
    top: calc(48px + 38px);
}
```

### Recomendación al fallar (`23b0e99`)

Cuando precisión < 60% en la pantalla de Resultados o GameOver:

- Banner morado con icono de gorro de graduación.
- Mensaje varía según severidad: <30% / <50% / <60%.
- Botón "Practicar" cambia automáticamente a `modoPractica = 'maestro_solo'`
  y reinicia la canción.
- Componente `RecomendacionMaestro` reutilizable en ambas pantallas.

---

## 4. Refactor (`0389a75`, `a65769e`)

Lineamiento del proyecto: archivos ≤350 líneas. `JuegoSimuladorApp.tsx`
estaba en 597, `PantallaConfigCancion.css` en 634, etc.

### Archivos extraídos de `JuegoSimuladorApp.tsx` (597 → 330)

- `useGuiaPitoObjetivo.ts` (93) — hook que calcula qué pitos resaltar
  cada frame: notas inminentes, sostenidos en curso, after-glow,
  highlight del maestro.
- `HilerasPitos.tsx` (103) — componente con el `<Pito>` memo + lógica
  de `pitosPorHilera`.
- `FuelleZonaJuego.tsx` (49) — la zona táctil invisible entre header y
  pitos con multi-touch contado.
- `useModoVisualPersistido.ts` (37) — state + persistencia + toast del
  modo visual activo.

### CSS

- `PantallaResultadosSimulador.css` 481 → 299 + 154 (split en `.xp.css`).
- `PantallaConfigCancion.css` se intentó split pero el `@import` causó
  dudas visuales en mobile; se revirtió al archivo único de 634 (a65769e).
- `usePointerAcordeon.ts` 354 → 332 (comentarios condensados).

---

## 5. Otras mejoras

### Halo girando en pito objetivo (`808b292`)

Antes el highlight del pito objetivo era gris/tenue. Ahora:

- Color del fuelle saturado (azul `#3b82f6` / rojo `#ef4444`).
- Pseudo-elemento `::before` con `conic-gradient` (2 picos) animado a
  1.4s rotando 360° alrededor del borde del pito.
- `mask` radial deja un agujero central para que el botón blanco de
  fondo se siga viendo.
- `pointer-events: none` para no bloquear el touch.

### Cola de sostenidos se consume al pisar (`6f65a85`)

`progresoFinal` usaba `progreso` (clamp a 1.05), así que durante el
sustain quedaba congelada en `~0.842 × targetY` y nunca llegaba al
pito. Fix: usar `progresoCrudo` sin clamp para que la cola avance hasta
consumirse cuando termina la duración.

### Notas pasadas hacen fade out (`6f65a85`)

El check `n.progreso > 1.05` para fade-out nunca se cumplía porque
`progreso` está clamp a 1.05. Fix: comparar con `progresoCrudo`. Notas
impactadas con cola consumida también hacen fade limpio.

---

## 6. Pendientes conocidos

- **Bug global del tono al cambiar BPM**: al bajar/subir BPM en modo
  Maestro (y también en AcordeonProMax), el tono del MP3 también cambia.
  Vive en el motor compartido (`useReproductorHero` o el reproductor
  MP3). No tocado en esta sesión.
- **Servicio worker error de cache 206**: `sw.js:114 Partial response
  (status code 206) is unsupported` al cachear streaming de audio. No
  afecta funcionalidad. Documentado desde sesión 1.

---

## 7. Sin tocar (intencional)

- `src/Paginas/AcordeonProMax/**` — la frontera con ProMax establecida en
  la sesión 4 se mantuvo. Las optimizaciones de re-renders se absorbieron
  en el lado del consumidor (`JuegoSimuladorApp` y `usePointerAcordeon`)
  sin tocar `useLogicaProMax` ni `useLogicaAcordeon`.
- `BarraTransporte.tsx` de ProMax — sigue intacto, en el simulador se
  usa el componente nuevo `BarraMaestroMobile.tsx`.

---

## 8. Inventario de archivos nuevos

```
src/Paginas/SimuladorApp/Juego/
├── BarraMaestroMobile.tsx + .css         — Barra Maestro mobile-first
├── FuelleZonaJuego.tsx                   — Refactor desde JuegoSimuladorApp
├── HilerasPitos.tsx                      — Refactor desde JuegoSimuladorApp
├── PistaNotasCarril.tsx + .css           — Modo CARRIL
├── PistaNotasFoco.tsx + .css             — Modo FOCO
├── PistaNotasGuia.tsx + .css             — Modo GUÍA
├── RecomendacionMaestro.tsx + .css       — Banner puntaje bajo
├── SelectorModoVisual.tsx + .css         — Selector único de modo visual
├── useGuiaPitoObjetivo.ts                — Refactor desde JuegoSimuladorApp
└── useModoVisualPersistido.ts            — Refactor desde JuegoSimuladorApp
```

Y `PantallaResultadosSimulador.xp.css` (split CSS XP/avisos/responsive).

---

## 9. Métricas

- **9 commits** en `main` desde `62629ff` hasta `ce83b8a`.
- **JuegoSimuladorApp.tsx**: 597 → 330 líneas (-45%).
- **Latencia táctil Android**: ~50-100ms → ~25-30ms estimado (3 fixes
  combinados, no medido empíricamente).
- **Modos visuales**: 2 → 5.
- **Re-renders por tick en competición**: árbol completo + 90 pitos →
  solo árbol mínimo (pitos memoizados con props primitivos).

---

## 10. Cómo probar todo

1. Recargar la app en mobile (iPhone + Android).
2. Abrir una canción en **modo Competitivo** y tocar pitos rápidos sin
   dedo en la zona del fuelle → debe registrar hits y combo.
3. Abrir una canción **larga** y verificar que no haya jank visible.
4. Tocar el selector de modo (arriba a la derecha) y probar los 5 modos:
   - **Libre**: notas cayendo sobre los pitos, cola de sostenidos se
     consume al pisar.
   - **Synth**: cajita arriba con línea inferior pegada a los pitos.
   - **Guía**: notas cayendo (igual que Libre) + banner ABRIENDO/CERRANDO
     arriba al centro.
   - **Foco**: una sola tarjeta arriba con dirección + nombres + flecha.
   - **Carril**: fondo azul/rojo con palabra "ABRE/CIERRA" detrás.
5. Elegir **modo Maestro** en la config de la canción → debe aparecer
   barra compacta arriba con scrubber, BPM, loop A/B.
6. Fallar a propósito una canción (precisión < 60%) → al final debe
   aparecer banner "Recomendación · Practica en modo Maestro" con
   botón que cambia el modo y reinicia.
