# Sesión 7 — Reorganización de carpetas, modo Maestro al 100%, motor de audio dual

Sesión enfocada en reorganizar la carpeta `Juego/`, refinar Modo Libre, integrar
una guía visual del Carril en Libre, conectar el flujo Practicar→Maestro,
gatear el audio durante modales/resultados, y resolver el bug del tono al bajar
el BPM en modo Maestro mediante un motor de audio dual.

---

## Tabla resumen

| Tema | Estado |
|---|---|
| Reorganización en subcarpetas (Pantallas/Modales/Piezas/Hooks/ModosVista) | ✅ |
| Rename `PistaNotasVertical` → `ModoVistaLibre` | ✅ |
| Inline `SelectorModoVisual.css` dentro del `.tsx` | ✅ |
| `React.memo` en componentes del hot path | ✅ |
| Modo Libre: linea de juicio (descartada) + cola fade + opacidad escalonada | ✅ |
| Modo Libre: pito objetivo + activo (gris ilegible) | ✅ |
| Modo Libre: guía Carril (tinte + ABRE/CIERRA) portada como badge | ✅ |
| Practicar → Maestro: preserva sección, auto-play | ✅ |
| Audio gateado durante modales/resultados/gameOver | ✅ |
| Header: badge de modo activo al lado del pause | ✅ |
| Header: combo "EN FUEGO" con racha ≥ 20 | ✅ |
| Hit feedback `¡PERFECTO!` / `¡BIEN!` / `¡TARDE!` | ✅ |
| Watermark se atenúa durante gameplay activo | ✅ |
| Modo Maestro: notas opacas y limpias (sin burst-fade fantasma) | ✅ |
| Tinte ABRE/CIERRA confinado al área del watermark | ✅ |
| **BPM no altera el tono** — solo en Maestro (vía `ReproductorMP3PreservaTono`) | ✅ Maestro |
| **BPM no altera el tono** — universal (Competencia/Synthesia/Replays) | ⏳ Pendiente |

---

## 1. Reorganización de la carpeta Juego/

**Antes:** 30 archivos sueltos en `src/Paginas/SimuladorApp/Juego/`.
**Ahora:** 4 archivos raíz + 5 subcarpetas:

```
src/Paginas/SimuladorApp/Juego/
├── JuegoSimuladorApp.tsx + .css     ← entry point
├── CHANGELOG_SESION.md              ← docs
├── CHANGELOG_SESION_06.md
├── CHANGELOG_SESION_07.md           ← este
│
├── Pantallas/   (4 vistas full-screen)
│   ├── PantallaAprende.tsx + .css
│   ├── PantallaConfigCancion.tsx + .css
│   ├── PantallaGameOverSimulador.tsx + .css
│   └── PantallaResultadosSimulador.tsx + .css + .xp.css
│
├── Modales/   (2 overlays)
│   ├── ModalGuardarSimulador.tsx + .css
│   └── ModalHistorialSimulador.tsx + .css
│
├── Piezas/   (7 piezas in-game)
│   ├── BarraMaestroMobile.tsx + .css
│   ├── FuelleZonaJuego.tsx
│   ├── HeaderJuegoSimulador.tsx + .css
│   ├── HilerasPitos.tsx
│   ├── JuicioJuego.tsx           (nuevo)
│   ├── RecomendacionMaestro.tsx + .css
│   └── SelectorModoVisual.tsx    (.css inline)
│
├── Hooks/   (3 hooks)
│   ├── useConfigCancion.ts
│   ├── useGuiaPitoObjetivo.ts
│   └── useModoVisualPersistido.ts
│
└── ModosVista/   (5 modos visuales)
    ├── ModoVistaLibre.tsx + .css   (renombrado desde PistaNotasVertical)
    ├── PistaNotasBoxed.tsx + .css
    ├── PistaNotasGuia.tsx + .css
    ├── PistaNotasFoco.tsx + .css
    └── PistaNotasCarril.tsx + .css
```

24 archivos movidos con `git mv` (preserva historial). 18 imports actualizados
en 11 archivos. `npx tsc --noEmit` exit 0.

---

## 2. Modo Libre — refinamientos

### 2.1 Pito objetivo + activo se veía gris ilegible
El selector requería `.modo-* .pito-boton.nota-activa.objetivo-*` (mode +
target del usuario tenían que coincidir). En acordes con direcciones distintas
un pito quedaba con el inset oscuro `rgba(0,0,0,0.9)` que tragaba el color.

**Fix** ([ModoVistaLibre.css](src/Paginas/SimuladorApp/Juego/ModosVista/ModoVistaLibre.css)):
- Quitado el requisito `.modo-*` del selector. Ahora basta `.nota-activa.objetivo-*`.
- Fondo decidido por el **objetivo** (no el modo del usuario): radial azul si
  pide abrir, radial rojo si pide cerrar.
- Inset reducido de `rgba(0,0,0,0.9)` a `rgba(0,0,0,0.35)`.
- Etiqueta del pito forzada a blanco con sombra para legibilidad.

### 2.2 Cola de sostenido sin corte rectangular
Antes: `border-radius: 6px` + gradient `0.35 → 0.85` con borde visible →
recta dura al tope.

**Fix:** `border-radius: 50% 50% 4px 4px / 70% 70% 4px 4px` + `mask-image`
linear-gradient con primer 22% transparente → look "estela de cometa".
Sin border. Gradiente inline complementario `rgba(rgb,0) 0% → 0.4 28% → 0.95 100%`.

### 2.3 Opacidad escalonada según urgencia
Convención de juegos rítmicos (Beat Saber/Piano Tiles/osu!mania): solo lo
que toca pisar AHORA está a 100%, el resto a ~40%.

```js
const opacidad = renderImpactada
    ? (colaConsumida ? fade : 1)
    : n.progresoCrudo > 1.05  ? fadeOut
    : esModoMaestro           ? 1                  // Maestro: todas opacas
    : esInminente             ? 1
    : 0.4;                                          // resto translucido
```

### 2.4 Guía del Carril (tinte + ABRE/CIERRA) portada a Libre
Cálculo de `fuelleInminente` (mismo algoritmo que `PistaNotasGuia` y `PistaNotasCarril`):
- Tinte de fondo azul/rojo (alpha 0.18 → 0.10 → 0). Confinado al **área del
  watermark** (band entre 18% y 50% del alto de la pista, no full-pista).
- Badge compacto `↑ ABRE` / `↓ CIERRA` en `top: 12px`, `font-size: 0.78rem`,
  píldora con `backdrop-filter: blur(4px)` y borde del color del fuelle.
  (Antes era texto a `7.5vh` que ocupaba media pantalla.)

### 2.5 Modo Maestro — notas crudas, sin animación de impacto
**Problema:** la maestra "toca" las notas → motor las marca como `impactada` →
animación `nota-burst` (white + scale + opacity 0). El alumno veía solo una
"sombra" porque la nota ya estaba en su animación de salida.

**Fix:** en `modoPractica === 'maestro_solo'` el flag `impactada` se ignora
visualmente:
```js
const renderImpactada = !esModoMaestro && n.impactada;
```
- Sin animación burst.
- Sin partículas de hit.
- Sin clase `inminente` (urgencia no aplica cuando solo observas).
- Notas siguen su trayectoria normal con opacity 1.0 hasta que pasan
  `progresoCrudo > 1.05` y hacen fade-out limpio.

---

## 3. Header del juego (`HeaderJuegoSimulador`)

### 3.1 Badge de modo activo al lado del pause
Recibe nuevo prop `modoEtiqueta`:
- `MAESTRO` (Maestro)
- `LIBRE` (Libre)
- `SYNTH` (Synthesia)
- `COMP` (Competencia)

Badge violeta (`rgba(139,92,246,...)`), uppercase, tracking amplio. Calculado
en [JuegoSimuladorApp.tsx:180-184](src/Paginas/SimuladorApp/Juego/JuegoSimuladorApp.tsx#L180-L184) desde `modoActual`.

### 3.2 Combo unificado con efecto fuego
**Antes:** dos fuentes de combo (header `x4 67combo` + overlay flotante grande
`x35 EN FUEGO`). El overlay tapaba el título.

**Ahora:** una sola fuente — el header. Cuando `racha >= 20`:
- Cuadrito amarillo se vuelve naranja (`rgba(249,115,22,...)`).
- "67 combo" cambia a "67 🔥".
- Animación de pulso en el box-shadow.

El `JuicioJuego` ya solo muestra hit feedback, no combo.

---

## 4. Hit feedback (`Piezas/JuicioJuego.tsx`)

Nuevo componente que reusa `efectosVisuales` (que ya emite el motor en
`useScoringProMax.registrarResultado`). Renderiza texto flotante sobre el pito
impactado durante 700ms:
- `¡PERFECTO!` verde `#22c55e`
- `¡BIEN!` amarillo `#facc15`
- `¡TARDE!` naranja `#fb923c`

Animación pop+flotar con `key={efecto.id}`. CSS inline en el `.tsx`.

Se monta en JuegoSimuladorApp solo cuando `enJuego` (jugando|pausado).

---

## 5. Practicar → Maestro

[JuegoSimuladorApp.tsx:209-220](src/Paginas/SimuladorApp/Juego/JuegoSimuladorApp.tsx#L209-L220):
```js
const practicarEnModoMaestro = () => {
    const cancion = hero.cancionSeleccionada;
    if (!cancion) return;
    hero.setModoPractica('maestro_solo');
    if (hero.seccionSeleccionada && typeof hero.seleccionarSeccion === 'function') {
        hero.seleccionarSeccion(hero.seccionSeleccionada);
    }
    setTimeout(() => hero.iniciarJuego(cancion, false, 'maestro_solo'), 80);
};
```

**Bug encontrado y arreglado:** el `useEffect` que sincronizaba `modoPractica`
tenía `hero` como dep. Como `useLogicaProMax` retorna un objeto literal nuevo
cada render, la dep se consideraba "cambiada" siempre → el effect corría en
cada render y pisaba el `setModoPractica('maestro_solo')`.

**Fix:** depender del setter (estable, useCallback) en vez de `hero`:
```js
const heroSetModoPractica = hero?.setModoPractica;
useEffect(() => {
    ...
    heroSetModoPractica(modoPM);
}, [modoVisual, config.modo, heroSetModoPractica]);
```

---

## 6. Audio gateado durante modales/resultados/gameOver

[JuegoSimuladorApp.tsx:121-131](src/Paginas/SimuladorApp/Juego/JuegoSimuladorApp.tsx#L121-L131):
```js
const audioPitosGateado = hero?.estadoJuego !== 'jugando' || menuPausaAbierto;
```

Tocar pitos no produce sonido durante: pantalla de resultados, gameOver,
contando (cuenta regresiva), pausado, selección, ni cuando el menú de pausa
está abierto. Solo suena durante `'jugando'`.

---

## 7. Watermark "Acordeón Pro Max" se atenúa en gameplay

[JuegoSimuladorApp.css:233-238](src/Paginas/SimuladorApp/Juego/JuegoSimuladorApp.css#L233-L238):
```css
.juego-sim-root:has(.nota-cayendo) .juego-sim-marca {
    opacity: 0.18;
}
```

Selector `:has()` — cuando hay notas en vuelo el watermark baja de
`opacity 1` a `0.18` con transición suave de 0.4s.

---

## 8. BPM preserva tono — motor de audio dual

### 8.1 El bug de raíz
El commit `530c80c` migró `HTMLAudioElement` → `AudioBufferSourceNode` en
`ReproductorMP3` para ganar sample-accurate sync (las secciones no-intro tenían
drift). Pero perdió `preservesPitch` porque la Web Audio API **no** lo tiene
nativamente para `AudioBufferSourceNode` — `playbackRate` y `detune` son
parámetros compuestos sobre la misma rate de resampling, no se pueden
desacoplar para preservar tono al cambiar velocidad.

### 8.2 Intentos descartados
- **HTMLAudio universal con preservesPitch** — funcionó para tono, pero
  reintrodujo el drift de secciones no-intro. Revertido.
- **SoundTouchJS via AudioWorklet** — instalado, integrado, build verde, pero
  el AudioWorklet introdujo latencia adicional que no compensaba el
  re-anclaje al evento `'playing'` → secciones quedaron corridas. Revertido y
  desinstalado.

### 8.3 Solución final: motor dual por modo
Nuevo archivo [ReproductorMP3PreservaTono.ts](src/Core/audio/ReproductorMP3PreservaTono.ts) — wrapper
con la **misma API pública** que `ReproductorMP3` pero internamente usa
`HTMLAudioElement` con `preservesPitch = true` ruteado por
`motorAudioPro.conectarMediaElement` (`MediaElementAudioSourceNode`).

[useLogicaProMax.ts:644-651](src/Paginas/AcordeonProMax/Hooks/useLogicaProMax.ts#L644-L651) elige el player según el modo:

```ts
const audioPrecargado: AudioFondoPlayer | null = urlFondo
  ? (modoActual === 'maestro_solo'
      ? new ReproductorMP3PreservaTono(...)   // tono preservado
      : new ReproductorMP3(...))              // sample-accurate
  : null;
```

| Modo | Player | Sync | Tono al cambiar BPM |
|---|---|---|---|
| Competencia | ReproductorMP3 | ✅ sample-accurate | N/A (BPM fijo) |
| Synthesia | ReproductorMP3 | ✅ sample-accurate | N/A (BPM fijo) |
| Replays | ReproductorMP3 | ✅ sample-accurate | N/A |
| GrabadorV2 | ReproductorMP3 | ✅ sample-accurate | N/A |
| **Maestro** | **PreservaTono** | ⚠️ ~30ms jitter (aceptable) | ✅ **preservado** |

El timing de las secciones no-intro queda intacto en Competencia/Synthesia
porque ese fix vive en `ReproductorMP3` que es el que se usa en esos modos.
En Maestro el jitter de 16-50ms de HTMLAudio.currentTime es inaudible porque
el alumno toca a su propio ritmo siguiendo lo que oye.

---

## 9. Componentes memoizados (hot path)

`React.memo` agregado a:
- `Piezas/FuelleZonaJuego.tsx`
- `Piezas/BarraMaestroMobile.tsx`
- `Piezas/SelectorModoVisual.tsx`
- `Piezas/JuicioJuego.tsx`

Combinado con los memos previos (`HeaderJuegoSimulador`, `HilerasPitos`,
`<Pito>`, todos los `PistaNotas*`), todo el árbol del hot path está blindado
contra re-renders innecesarios cuando avanza el tick.

---

## 10. Pendientes para próxima sesión

### 10.1 Tono universal en TODOS los modos al cambiar BPM
Hoy `ReproductorMP3PreservaTono` solo se usa en Maestro. Si en el futuro
queremos slider de BPM en otros modos (Competencia/Synthesia con velocidad
variable), hay que decidir entre:

**Opción A — Extender el switch híbrido**
Si Synthesia tiene slider, también instanciar `ReproductorMP3PreservaTono`
para ese modo. Cero código nuevo, solo agregar al condicional.

**Opción B — SoundTouchJS done right**
Integración con AudioWorklet pero compensando la latencia del worklet en el
re-anclaje del reloj de notas. Requiere medir empíricamente la latencia del
processor (típicamente 4-8 frames de 128 samples = ~12-23ms).

**Opción C — Phaze / Tone.js GrainPlayer**
Otras libs de time-stretch que evalúan en lugar de SoundTouchJS si éste
no se logra estabilizar.

### 10.2 Notas conocidas
- Service Worker error 206 al cachear streaming de audio (sin impacto
  funcional, documentado desde sesión 1).
- `JuicioJuego` muestra solo el último efecto — si hay 6 hits en 100ms
  (acordes grandes) solo se ve el último. Comportamiento intencional para
  evitar saturación visual.

---

## 11. Archivos nuevos en esta sesión

```
src/Core/audio/
└── ReproductorMP3PreservaTono.ts   ← motor HTMLAudio + preservesPitch para Maestro

src/Paginas/SimuladorApp/Juego/
├── CHANGELOG_SESION_07.md           ← este documento
└── Piezas/JuicioJuego.tsx           ← hit feedback overlay
```

## 12. Métricas

- **Archivos movidos** (rename con `git mv`): 24
- **Imports actualizados**: 18 en 11 archivos
- **Líneas en `ModoVistaLibre.tsx`**: 263 → 222 (cleanup)
- **Líneas en `ModoVistaLibre.css`**: 320 → ~225 (cleanup, sin media queries)
- **Bugs cerrados**: 8
- **Bugs pendientes**: 1 (tono universal en BPM change)
