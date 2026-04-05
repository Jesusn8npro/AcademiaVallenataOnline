# Acordeón Hero — Modos de Práctica

## Resumen

Acordeón Hero tiene 4 modos de juego seleccionables en la pantalla de configuración antes de iniciar cada canción.

---

## Modo 1 — Competitivo (default)

**Ícono:** 🎮
**Tipo:** `ModoPractica = 'ninguno'`

El modo original. Máxima adrenalina.

- Barra de vida: 100 pts. Notas falladas → -2, notas perdidas → -1
- Multiplicador de combo: ×1 → ×2 (10) → ×3 (20) → ×4 (40)
- Game Over si la vida llega a 0
- Puntuación con pantalla de resultados y estrellas (1–3)
- Vignette roja en los bordes al tomar daño

---

## Modo 2 — Libre

**Ícono:** 🎵
**Tipo:** `ModoPractica = 'libre'`

Misma experiencia visual que el competitivo (dos acordeones, notas volando por el puente) pero sin presión.

- **Sin daño de vida** — la vida se mantiene en 100 siempre
- **Sin Game Over** — la canción siempre termina en resultados
- Las estadísticas (perfectas, bien, falladas) siguen contando para feedback
- El multiplicador y los puntos siguen funcionando como motivación suave
- Ideal para: primera vez con una canción nueva, calentamiento

---

## Modo 3 — Synthesia

**Ícono:** ⏸
**Tipo:** `ModoPractica = 'synthesia'`

El reproductor se **detiene automáticamente** en cada nota. El alumno debe presionar el botón correcto para avanzar.

### Mecánica paso a paso:

1. La canción reproduce normalmente — las notas viajan por el puente SVG
2. Cuando una nota llega a su tick exacto:
   - El reproductor se pausa internamente (`pausadoRef.current = true`)
   - El estado del juego pasa a `'pausado'`
   - Aparece el indicador de Synthesia (parte inferior de pantalla)
   - El botón del Maestro queda **iluminado** (permanece activo hasta que avance)
3. El alumno presiona el botón correcto:
   - Se registra como "Perfecto"
   - `notaEsperandoRef` se limpia
   - El reproductor se reanuda
   - La canción continúa hasta la siguiente nota
4. Si el alumno presiona un botón equivocado:
   - Se muestra el efecto "Fallada" pero **sin quitar vida** (modo práctica)
   - La nota sigue esperando — debe presionar el correcto

### Indicador visual:
- Panel pulsante con animación dorada en la parte inferior
- Muestra: `👆 Toca el botón iluminado` + número de botón + dirección del fuelle
- El botón en el Maestro permanece encendido hasta que el alumno lo toca

### Técnica interna:
- `notaEsperandoRef` (ref) y `notaEsperando` (state) guardan la nota actual
- El effect de "notas perdidas" detecta `tickActual >= nota.tick` y llama `reproductor.alternarPausa()`
- `_golpeHandlerRef` acepta input también en estado `'pausado'` cuando modo es `'synthesia'`
- El fix de `useReproductorHero` (rAF siempre vivo cuando pausado) garantiza que el loop pueda reanudar

---

## Modo 4 — Maestro Solo

**Ícono:** 🎹
**Tipo:** `ModoPractica = 'maestro_solo'`

Un único acordeón grande centrado en pantalla. El maestro ilumina los botones. El alumno practica directamente encima del mismo acordeón.

### Layout:
- **Sin puente de notas** (no hay SVG volando)
- **Sin acordeón del alumno** separado
- El acordeón central muestra: botones del maestro (secuencia) + botones del alumno (teclado)
- Tamaño: `min(72vh, 50vw)` — mucho más grande que en modo dual

### Barra de transporte (parte inferior):
| Botón | Función |
|-------|---------|
| ⏮ | Volver al tick 0 (inicio) |
| ⏸ / ▶ | Pausar / Reanudar |
| Slider | Buscar cualquier posición en la canción |
| Beat X / Y | Posición actual en beats |

### BPM:
El slider de BPM del HUD superior funciona normalmente. Ideal para bajar la velocidad al 40–50% y estudiar secciones difíciles.

### Sin scoring:
- `_golpeHandlerRef` retorna inmediatamente en este modo (no procesa golpes)
- No hay puntuación, racha ni multiplicador
- La canción termina en resultados (vacíos) — puede ignorarse y repetir

---

## Arquitectura técnica

### Archivos modificados:

| Archivo | Cambio |
|---------|--------|
| `tipos_AcordeonHero.ts` | Nuevo tipo `ModoPractica` |
| `useReproductorHero.ts` | Fix: rAF sigue vivo cuando pausado (permite resume) |
| `useLogicaHero.ts` | Estado `modoPractica`, `notaEsperando`, lógica de los 3 modos |
| `AcordeonHero.tsx` | Selector de modo en config, layouts condicionales |
| `AcordeonHero.css` | Estilos para grid de modos, transporte, indicador Synthesia |

### Flujo de selección de modo:

```
PantallaSeleccion
  → click canción
PantallaConfiguracion
  → elegir modo (grid de 4 cards)
  → ajustar velocidad y maestro
  → Empezar
Juego en el modo elegido
```

### Refs clave (sin closures stale):

```typescript
modoPracticaRef.current    // modo actual leído en callbacks sincrónicos
notaEsperandoRef.current   // nota que espera turno del alumno (Synthesia)
estadoJuegoRef.current     // estado actual sin esperar re-render
```

---

## Fecha de implementación

2026-03-28
