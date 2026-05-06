# SimuladorApp · Modo Juego — Changelog & Inventario

Carpeta `src/Paginas/SimuladorApp/Juego/` — todo el flujo "elegir canción + jugar"
del SimuladorApp en una sola carpeta. Reutiliza dependencias de AcordeonProMax
(motor, hooks de progreso, score saving) sin modificarlas.

---

## Inventario · qué hace cada archivo

### Pantallas (entradas al juego)

#### `PantallaAprende.tsx` + `.css`
Pantalla de selección de canción (la "academia" del simulador).
- **Vista inicio** — 4 cards de categoría (Canciones · Escalas · Ejercicios · Acordes) con porcentaje de progreso por usuario.
- **Vista lista** — lista de canciones filtrable (Populares · No tocadas · Nombre · Dificultad) con buscador, dificultad por color, miniatura YouTube.
- Al hacer clic en JUGAR sobre una canción → abre `PantallaConfigCancion` como modal.
- Carga favoritos del usuario desde Supabase (`favoritos_acordeon_hero`).

#### `PantallaConfigCancion.tsx` + `.css`
Modal que aparece después de elegir canción. Configura modo + sección + audio antes de empezar.
- **Modo de juego** — 4 cards (Competitivo · Libre · Synthesia · Maestro) con tooltip flotante en long-press / hover.
- **Qué parte tocar** — cards de sección con badges de progreso: ✓ Completada · 🪙 monedas ganadas · Mejor X% · 🔒 Bloqueada (desbloqueo secuencial). Reutiliza `useProgresoSecciones` de ProMax.
- **Toggle** — guía de audio del maestro on/off.
- **Layout 2 columnas en landscape mobile** (modos+toggle | secciones) sin scroll, con cards `max-content` para que no se estiren con espacio vacío.
- Botones: Volver · EMPEZAR.

#### `useConfigCancion.ts`
Hook de estado para `PantallaConfigCancion`. Mantiene `modo`, `velocidad`,
`guiaAudio`, `seccionId` y construye el objeto `ConfigCancion` final que se
pasa a `JuegoSimuladorApp`. Tipos `ModoJuego` + `ConfigCancion` exportados.

---

### Pantalla principal del juego

#### `JuegoSimuladorApp.tsx` + `.css`
Componente raíz cuando el alumno está jugando. Recibe `config: ConfigCancion`.
- Instancia `useLogicaProMax()` → motor de juego compartido con ProMax.
- Inicializa: aplica `seccionId`, fuerza tono de la canción, llama `iniciarJuego`.
- **Guía visual del pito objetivo** — `useMemo` que calcula qué pitos resaltar:
  nota más próxima (ventana `[-5, 40]` ticks) + agrupación de acordes (`UMBRAL_ACORDE=30`)
  + sostenidos en curso + after-glow de 20 ticks tras pisar.
- **Switch de modo visual** Libre ↓ / Synth ☐ con persistencia en `localStorage`
  (`simulador_modo_visual`) + toast efímero al cambiar.
- **Zona táctil de fuelle** — div invisible entre header y pitos: presionar=empujar, soltar=halar.
- **Marca de agua** "Acordeón Pro Max" detrás de la pista.
- Renderiza: `HeaderJuegoSimulador` · `PistaNotasVertical` o `PistaNotasBoxed` ·
  acordeón (3 hileras de pitos) · `MenuPausaProMax` · `PantallaResultadosSimulador` o `PantallaGameOverSimulador`.
- Marca `body.juego-sim-activo` para CSS scoping del menú de pausa compacto.

#### `HeaderJuegoSimulador.tsx` + `.css`
Header durante la partida: botón pausa (izq) + título/autor (centro) + barra de
vida + multiplicador + puntos (der). Sin botón X de salida — toda la nav
va por el menú de pausa.

---

### Pista de notas (dos métodos visuales)

#### `PistaNotasVertical.tsx` + `.css`  — Método 1: cayendo libre (Guitar Hero)
- Notas caen verticalmente sobre el pito real (posicionadas via `getBoundingClientRect`).
- Sigue el pan horizontal del tren-deslizable.
- Notas sólidas con gradiente radial 3D + cola de sostenidos cuando `duracion > 30 ticks`.
- Hit feedback: scale 1→1.9 + brightness burst + 6 partículas radiales.
- Notas ordenadas por progreso ASC → la inminente queda encima en z-stack con anillo blanco pulsante.
- Notas lejanas se atenúan a opacidad 0.35 cuando hay una inminente (progreso > 0.78).
- Filtra notas de bajos (`-bajo` en el botonId) — no se renderizan.

#### `PistaNotasBoxed.tsx` + `.css`  — Método 2: Synthesia clásico
- Cajita fija arriba (altura 25vh) con borde inferior gris grueso.
- Las notas caen DENTRO de la cajita; la inminente queda medio cortada en el borde.
- Fuerza `setModoPractica('synthesia')` → motor pausa en cada nota.
- Inminente con anillo blanco pulsante; demás (queue) bajan a opacidad 0.28.
- Cada nota se posiciona en X via `getBoundingClientRect` del pito real.

Ambos métodos:
- Calculan `mejorProgreso` y resaltan TODAS las notas dentro de margen 0.04 → acordes pulsan completos.
- Reciben `cancion`, `tickActual`, `notasImpactadas`, `rangoSeccion`.

---

### Pantallas de fin de partida

#### `PantallaResultadosSimulador.tsx` + `.css`
Pantalla cuando el alumno termina la canción/sección. Reutiliza
`usePantallaResultados` de ProMax para data + score saving.
- **Header** compacto: cerrar · título/autor/sección · 3 estrellas.
- **Banner sección completada** — verde con monedas ganadas, o pendiente con intentos restantes.
- **Badge Nuevo récord personal** cuando aplica.
- **Stats 4 col** (Perfectas · Bien · Fallidas · Perdidas) con colores semánticos.
- **Fila precisión** — porcentaje + barra rosa→morada + racha máx + total notas.
- **Frase motivación** + puntos grandes ámbar.
- **Panel XP/monedas** — XP del intento (positivo/negativo/dominada/neutro), monedas ganadas, saldo total, barra 0-100 XP por canción.
- **Avisos** — "Guardada" o "Necesitas X% para guardar".
- **Botones** — Elegir canción · Historial · Guardar · Siguiente sección · Otra vez.
- Panel angosto (max 580px) con borde claro `2px solid` + halo morado, scroll interno si excede.
- Abre los modales `ModalGuardarSimulador` y `ModalHistorialSimulador`.

#### `PantallaGameOverSimulador.tsx` + `.css`
Pantalla cuando se acabó la vida en modo competitivo.
- Mismo lenguaje visual que Resultados pero con acento rojo (`border: 2px solid rgba(239,68,68,0.45)`, halo rojo).
- Eyebrow "💀 GAME OVER" + título canción.
- Mensaje motivacional ("no te rindas").
- Stats 4 col + barra precisión + puntos.
- Botones: Elegir canción · Reintentar (gradiente rojo).
- Reemplaza al `PantallaGameOverProMax` que se desbordaba en landscape mobile.

---

### Modales independientes

#### `ModalGuardarSimulador.tsx` + `.css`
Modal para guardar una grabación (modo competencia ≥ 60% precisión).
- Header: cerrar · eyebrow "Guardar ejecución" · título canción · badge precisión rosa.
- Inputs: Título (obligatorio, 120 chars) + Descripción opcional (textarea, 500 chars).
- Estado guardando deshabilita campos y muestra "Guardando…".
- Footer: Ahora no · Guardar (primario gradiente morado).
- Componente "tonto": recibe valores y callbacks, no maneja estado propio salvo focus.

#### `ModalHistorialSimulador.tsx` + `.css`
Modal mobile-first con el historial del usuario en esta canción.
- **Resumen 4 stat-cards**: Récord · Mejor precisión · Intentos · Tendencia (positiva/negativa según diferencia entre los 2 últimos intentos).
- **Lista de intentos** como cards apiladas con scroll interno: fecha relativa ("Hace 2 días"), badge "Récord", modo, barra de precisión visual, puntos.
- Reemplaza al `ModalHistorialHero` que usa recharts + tabla densa (no funciona bien en mobile).
- Estados: cargando (spinner), vacío (CTA), normal.

---

## Sesiones registradas

### Sesión 1 (commit `669a86e`) — Modo juego competente con dos métodos visuales

**Bugs base arreglados:**
- **Bug A** — `notasImpactadas` (Set mutado sin nueva referencia) → React no detectaba cambios en `useMemo`. Fix: `notasImpactadasSize` (`.size`) como dep adicional.
- **Bug B** — pseudo-elemento `::after` del velo objetivo tapaba el gradiente de `nota-activa`. Fix: eliminado `::after`, solo `border` + `box-shadow`.
- **Bug C** — `config.seccionId` se elegía pero nunca se llamaba `hero.seleccionarSeccion()`. Fix: llamada antes de `iniciarJuego`.
- **Bug D** — pre-highlight muy temprano (toda la trayectoria). Fix: ventana `[-5, 40]` ticks.
- **Bug del tono** — la nube sobrescribía el tono. Fix: `useEffect` que revierte siempre a `cancion.tonalidad`.
- **Touch del fuelle** — `.seccion-bajos-contenedor` faltaba en whitelist `SELECTORES_INTERACTIVOS`. Fix: añadido + nueva `.juego-sim-fuelle-zona`.

**Features:**
- Pista vertical (Guitar Hero) + Pista boxed (Synthesia clásico).
- Switch modo visual con persistencia + toast.
- Highlight del pito objetivo (acordes + sostenidos).
- Marca de agua "Acordeón Pro Max".
- Header sin botón X (todo via menú de pausa).
- Modal de configuración con cards compactas + tooltip long-press.

### Sesión 2 (commit `2778b01`) — After-glow, acordes inminentes, menú compacto

- Acordes inminentes pulsan TODOS los pitos (margen 0.04 sobre `mejorProgreso`).
- Menú de pausa abre solo con click manual (no con `pausado_synthesia` automático).
- Sostenido NO se pierde al pisar (selectores combinados con `!important` en animation/border/box-shadow).
- After-glow de 20 ticks para notas cortas impactadas.
- Press visual reforzado (anillo blanco 4px + glow blanco 16px + translateY/scale).
- Menú de pausa compacto scoped a `body.juego-sim-activo`.
- `UMBRAL_ACORDE` de 20 → 30 ticks para guía visual.

### Sesión 3 (commit `488019d`) — Modales mobile-first y CSS limpio

**PantallaResultadosSimulador (rediseño completo):**
- Panel angosto (820 → 580px) con borde claro `2px solid` y halo morado.
- Banner sección completada + monedas, badge nuevo récord personal.
- Panel XP/monedas/saldo, barra de precisión, total notas.
- Avisos "guardada" / "necesitas X% para guardar".
- Botones nuevos: Historial · Guardar · Siguiente sección.

**Modales independientes (nuevos):**
- `ModalHistorialSimulador` — mobile-first con stat-cards + lista de intentos con barras (reemplaza recharts + tabla del ModalHistorialHero).
- `ModalGuardarSimulador` — extraído de PantallaResultados a archivo propio para que no rompa estilos.

**PantallaGameOverSimulador (nuevo):**
- Reemplaza `PantallaGameOverProMax` que se desbordaba en landscape mobile.
- Mismo lenguaje visual que Resultados pero con acento rojo.

**PantallaConfigCancion (rediseño landscape mobile):**
- Layout 2 columnas (modos+toggle | secciones) sin scroll en landscape.
- Cards de modo con `grid-template-columns: repeat(2, max-content)` para ajustarse al contenido en lugar de estirarse.
- Cards de sección con `space-between` (nombre izq, tags der) → sin espacio vacío.
- Integrado `useProgresoSecciones` para mostrar badges por sección.

**JuegoSimuladorApp:**
- Pasa `guardandoGrabacion` + `errorGuardado` a Resultados.
- Usa `PantallaGameOverSimulador` en lugar de `PantallaGameOverProMax`.

### Sesión 4 (commit `7e4c75a`) — Reorganización + limpieza

- **Reorganización**: `Aprende/` consolidada dentro de `Juego/`. Toda la
  ruta canción→config→juego→fin vive en una sola carpeta.
- Imports actualizados: `SimuladorApp.tsx` (×2) y `JuegoSimuladorApp.tsx` (×1).
- Imports muertos removidos (`TICKS_VIAJE` en `JuegoSimuladorApp.tsx` no se usaba).
- CSS de `PantallaConfigCancion.css` limpiado: removido bloque `.config-select` no usado, restauradas bases para portrait/desktop, leve bump de padding.
- Estilos de modal inline removidos de `PantallaResultadosSimulador.css` (ahora viven en sus archivos propios).
- Este CHANGELOG reescrito como inventario + log.

### Sesión 5 — Cuatro fixes críticos de touch en mobile

Cuatro bugs táctiles encadenados, descubiertos al probar en mobile real. Cada
fix abrió la puerta para detectar el siguiente.

#### 5a — Táctil bloqueado tras navegación (commit `a3ac5e1`)
**Síntoma**: en mobile, después de cierto tiempo navegando, el táctil se
quedaba muerto. Recargar la página era la única salida.

**Causa**: `usePointerAcordeon` atachaba listeners globales en `window`
(`touchstart`/`touchmove` con `passive:false, capture:true`) que llamaban
`preventDefault()` sobre cualquier touch FUERA de una whitelist
(`SELECTORES_INTERACTIVOS`). El propósito era evitar el throttling de iOS,
pero la whitelist era frágil — cada modal/overlay nuevo (`sim-resultados-overlay`,
`sim-go-overlay`, `sim-hist-overlay`, `sim-guardar-overlay`) que no se
añadiera explícitamente quedaba con touch bloqueado.

**Fix**: invertir la lógica de **opt-out** a **opt-in**. Ahora el
`preventDefault()` global solo se aplica cuando el target está dentro del
área jugable (`.pito-boton, .diapason-marco, .seccion-bajos-contenedor`).
Cualquier UI fuera del área jugable funciona automáticamente sin
mantenimiento. iOS throttling fix se preserva donde importa.

#### 5b — Multi-touch limitado a 3 dedos + fuelle se traba (commit `87fa805`)
**Síntoma**: en Android no se podían tocar más de 3 dedos a la vez en los
pitos. Y al poner dedo en la zona del fuelle se trababa la respuesta.

**Causa 1 (multi-touch)**: los elementos jugables tenían
`touch-action: manipulation`. Chrome Android interpreta multi-touch en
elementos con `manipulation` como gestos del sistema (pinch-zoom, pan),
limitando los dedos a ~3 y bajando la frecuencia de `touchmove`.

**Causa 2 (fuelle)**: la zona del fuelle usaba `onPointerDown`/`onPointerUp`.
En Chrome Android el browser captura implícitamente el pointer al elemento
donde inició — con multi-touch concurrente esa captura podía interferir
con la liberación del evento, dejando el fuelle "trabado" en empujar.

**Fix 1**: CSS scoped a `.juego-sim-root` con `touch-action: none` en
`.diapason-marco`, `.tren-botones-deslizable` y `.pito-boton`. El simulador
normal preserva `manipulation` para compat iOS. Inline `touchAction` quitado
del JSX.

**Fix 2**: zona del fuelle migrada a touch events nativos con un
**contador de toques activos**. Empujar mientras haya ≥1 dedo en la zona,
halar cuando se levanta el último. Pointer events quedan solo para mouse
desktop (`e.pointerType === 'mouse'`).

#### 5c — Coalescing de touchstarts en Android (commit `bd90107`)
**Síntoma**: con dedo en el fuelle no se podían agregar más de 2 dedos a
los pitos (4 fingers totales máximo). En iPhone funcionaba sin problema.

**Causa**: `handleTouchStart` y `handleTouchMove` filtraban por `e.target`
del evento. Chrome Android **coalesce** varios touchstarts en un solo
evento cuando ocurren en el mismo tick (dedo en fuelle + dedos en pitos
casi simultáneos). En ese caso `e.target` es solo del primer toque del
evento — si era el fuelle, `enAreaJuego` fallaba y se descartaba el
evento entero, ignorando los pitos.

**Fix**: iterar cada touch individualmente y filtrar por `t.target` en
lugar de `e.target`. Así los toques del fuelle se ignoran (no son área
de juego) pero los toques de pitos en el mismo evento sí se procesan.
`handleTouchMove` también refactorizado: en lugar de filtrar por target,
solo procesa touches que ya estén en `pointersMap`.

iPhone funcionaba porque iOS Safari no coalesce touchstarts del mismo modo.

#### 5d — Touch no registraba hits ni puntaje en competencia (commit `41a5e69`)
**Síntoma**: desde el computador el teclado registraba notas estilo
Guitar Hero correctamente. Desde mobile el touch funcionaba (los pitos
sonaban) pero el motor no detectaba los hits y no sumaba puntaje.

**Causa raíz**: `usePointerAcordeon` llamaba a `actualizarBotonActivo`
con `silencioso=true` (4to parámetro). En `useLogicaAcordeon`,
`silencioso=true` SALTA el callback `onNotaPresionada`. Como
`useLogicaProMax` engancha la detección de hits a través de
`onNotaPresionada` → `_golpeHandlerRef` → `procesarGolpeAlumno`, el touch
nunca disparaba la evaluación.

El teclado funcionaba porque `manejarEventoTeclado` llama
`actualizarBotonActivo` con `silencioso` por defecto (`false`), así que
`onNotaPresionada` SÍ se disparaba y la cadena del juego se completaba.

**Fix**: cambiar las 6 llamadas a `actualizarBotonActivo` en
`usePointerAcordeon` de `silencioso=true` a `silencioso=false`
(`registrarInicio`, `procesarPunto` en los dos sentidos, `registrarFin`,
watchdog y `limpiarTodo`). Ahora el touch hace el mismo flujo que el
teclado: dispara `onNotaPresionada`/`onNotaLiberada`, el motor evalúa
el hit contra la nota que cae, y suma puntaje.

El `silencioso=true` era una optimización histórica para evitar
re-renders. El costo (~1-2ms por touch) es despreciable para frecuencia
de toques humanos.

---

## Pendientes conocidos

- **Bug del Synthesia "notas pasan derecho"** — `UMBRAL_ACORDE` del motor (`useLogicaProMax.ts:378`) es 15 ticks; si las notas de un acorde están más espaciadas no se agrupan. Toca también en ProMax — fuera de scope de SimuladorApp.
- **Métodos 3 (carriles verticales) y 4 (flecha minimalista)** — diseñados pero no implementados.
- **Service worker** — `sw.js:114 Partial response (status code 206) is unsupported` al cachear streaming de audio. No afecta la funcionalidad.

---

## Sin tocar (intencional)

- `src/Paginas/AcordeonProMax/**` — ProMax queda intacto. SimuladorApp/Juego reutiliza `useLogicaProMax`, `usePantallaResultados`, `useProgresoSecciones`, `seccionesConEstado`, `MenuPausaProMax` y `scoresHeroService` como dependencias compartidas.
- `src/Paginas/SimuladorApp/Componentes/**` y `Hooks/**` — son del simulador general (no del juego), por eso no se movieron a `Juego/`.
