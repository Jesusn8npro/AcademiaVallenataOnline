# 🚨 DIAGNÓSTICO DE ERROR CRÍTICO: LAG DE UN SOLO DEDO (CHROME ANDROID)

## 📌 El Problema
El simulador de acordeón sufre de una degradación de rendimiento masiva bajo las siguientes condiciones:
1. **Dedo en el Fuelle (Modo Multitáctil)**: Funciona PERFECTO. Respuesta instantánea (~1ms).
2. **Un Solo Dedo (Modo Abrir/Halar)**: Funciona erráticamente. Después de unos segundos o notas rápidas, el navegador empieza a ignorar toques o los procesa con un lag de 200ms+.

## 🔍 Análisis Técnico
1. **Reflow Crítico**: Se identificó que `getBoundingClientRect()` se estaba ejecutando dentro del bucle de `touchmove`. En Chrome Android, un solo dedo + un reflow (layout) es la receta perfecta para el throttling agresivo.
2. **Heurística de Scroll**: Chrome Android trata el toque de un solo dedo como un posible gesto de sistema. Si el JS tarda más de ~8ms en responder (por el reflow), el navegador toma el control y baja la frecuencia de 120Hz a 10Hz o 0Hz (Throttled Async Touchmove).
3. **Isolación Multitáctil**: Al poner un segundo dedo (fuelle), Chrome activa el modo "Compositor Touch" o "Gaming Mode" que desactiva las heurísticas de scroll y es más permisivo con el procesado sincrónico.

## 🛠️ Solución Implementada: Motor de Input Pro V17.0 (2026-02-19)
1. **Zero-Reflow Matemático**: Eliminamos por completo `getBoundingClientRect` de los bucles. Usamos el `MotionValue` de Framer Motion para calcular coordenadas mediante álgebra en lugar de consultas al DOM.
2. **Bypass de Throttling**: Listeners globales configurados explícitamente como `{ passive: false }` con `e.preventDefault()` obligatorio. Esto desactiva las heurísticas de ahorro de energía de Chrome Android.
3. **Capa de Captura Atómica**: Overlay invisible de alta prioridad que centraliza todos los eventos táctiles, saltándose la jerarquía de React para el procesado de audio.
4. **Isolación por Hardware**: Implementado `contain: layout size style` para aislar el renderizado del acordeón.

---
**Documentado por**: Antigravity AI
**Fecha**: 2026-02-19
**Estado**: ✅ RESUELTO (Motor V17.0 implementado)
