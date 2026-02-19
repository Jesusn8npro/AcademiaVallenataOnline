# DIAGNÓSTICO LAG - Simulador de Acordeón

## ✅ SOLUCIÓN FINAL: MOTOR V18.0 — PointerEvents + setPointerCapture

### Causa Raíz Identificada
Chrome Android aplica **"Throttled Async Touchmove"** cuando detecta un único dedo en la pantalla.
El navegador asume que el gesto puede ser un scroll y retrasa los eventos `touchmove` **hasta 200ms**
en ciertos contextos (después de levantar un dedo, en la zona del fuelle, etc.).

### Por qué la solución anterior (V17 - TouchEvents) no era suficiente
- `preventDefault()` y `stopPropagation()` en TouchEvents no cancelan el delay del compositor.
- El CSS `touch-action: none` ayuda, pero Chrome aún puede activar throttling en ciertos estados.
- La capa de captura táctil extra añadía complejidad sin resolver el problema de pipeline.

### Solución Definitiva: PointerEvents (V18.0)

**Pipeline de eventos en Chrome Android:**
- `TouchEvents` → Hilo del compositor → Heurísticas de scroll → **Posible delay 200ms**
- `PointerEvents` → Hilo del compositor → **Sin heurísticas** → Entrega inmediata

**Técnicas implementadas:**

1. **`setPointerCapture(e.pointerId)`**: Cada dedo "captura" exclusivamente su puntero.
   - Equivalente al "Gaming Mode" de Android pero en el nivel del navegador.
   - El dedo "posee" el puntero — Chrome no puede interceptar esos eventos.
   - Si el dedo se mueve fuera del elemento, los eventos siguen llegando.

2. **Sin diferenciación 1 dedo vs 2 dedos**: PointerEvents siempre usa el modo interactivo,
   independientemente de cuántos punteros haya activos.

3. **Listeners en el marco, no en `window`**: Adjuntar al `marcoRef` en lugar de `window`
   reduce la superficie de interceptación del navegador.

4. **Fuelle migrado a `onPointerDown/Up`**: Coherencia total con el motor V18.

### Estado CSS (sin cambios, sigue siendo necesario)
- `touch-action: none !important` en `html`, `body`, `#root`, `.simulador-app-root`
- `overscroll-behavior-y: contain !important` en `body`
- Estas propiedades siguen siendo necesarias para prevenir gestos del sistema.

### Archivos modificados en V18.0
- `SimuladorApp.tsx` — Motor completo migrado a PointerEvents
- `DIAGNOSTICO_LAG.md` — Este archivo

### Para testear en Android
1. Abrir Chrome DevTools → Remote Debugging → Performance Tab
2. Buscar "Input Latency" en el timeline
3. Con V18.0 debería ser < 16ms (1 frame) vs ~200ms anterior
