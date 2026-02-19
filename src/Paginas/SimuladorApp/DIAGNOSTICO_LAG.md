# 🚨 DIAGNÓSTICO DE ERROR CRÍTICO: LAG DE UN SOLO DEDO (CHROME ANDROID)

## 📌 El Problema
El simulador de acordeón sufre de una degradación de rendimiento masiva bajo las siguientes condiciones:
1. **Dedo en el Fuelle (Modo Multitáctil)**: Funciona PERFECTO. Respuesta instantánea (~1ms).
2. **Un Solo Dedo (Modo Abrir/Halar)**: Funciona erráticamente. Después de unos segundos o notas rápidas, el navegador empieza a ignorar toques o los procesa con un lag de 200ms+.

## 🔍 Análisis Técnico
1. **Reflow Crítico**: Se identificó que `getBoundingClientRect()` se estaba ejecutando dentro del bucle de `touchmove`. En Chrome Android, un solo dedo + un reflow (layout) es la receta perfecta para el throttling agresivo.
2. **Heurística de Scroll**: Chrome Android trata el toque de un solo dedo como un posible gesto de sistema. Si el JS tarda más de ~8ms en responder (por el reflow), el navegador toma el control y baja la frecuencia de 120Hz a 10Hz o 0Hz (Throttled Async Touchmove).
3. **Isolación Multitáctil**: Al poner un segundo dedo (fuelle), Chrome activa el modo "Compositor Touch" o "Gaming Mode" que desactiva las heurísticas de scroll y es más permisivo con el procesado sincrónico.

## 🛠️ Plan de Acción para Mañana (Cerebros en Frío)
1. **Eliminar Reflows Definitivamente**: Migrar a una arquitectura donde las coordenadas de los botones se calculen UNA SOLA VEZ al cargar o redimensionar.
2. **Sensor de Alta Prioridad**: Probar un receptor táctil que no dependa de la herencia del DOM para evitar que Chrome lo categorice como "Scrollable".
3. **requestAnimationFrame**: Implementar un loop de renderizado musical independiente de los eventos del navegador.

---
**Documentado por**: Antigravity AI
**Fecha**: 2026-02-18
**Estado**: Fallo persistente en V16.0 / Intento fallido en V17.0
