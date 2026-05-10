# Problema de Sincronización Notas ↔ MP3

**Última actualización:** 2026-05-03
**Estado:** ❌ NO RESUELTO
**Archivos principales involucrados:**
- [src/Paginas/AcordeonProMax/PracticaLibre/Componentes/ReproductorCancionHero.tsx](src/Paginas/AcordeonProMax/PracticaLibre/Componentes/ReproductorCancionHero.tsx) (reproductor inline en Práctica Libre estudiante)
- [src/Paginas/AcordeonProMax/Admin/Paginas/EstudioAdmin.tsx](src/Paginas/AcordeonProMax/Admin/Paginas/EstudioAdmin.tsx) (reproductor en Admin)
- [src/Core/hooks/useReproductorHero.ts](src/Core/hooks/useReproductorHero.ts) (motor RAF compartido)
- [src/Core/audio/ReproductorMP3.ts](src/Core/audio/ReproductorMP3.ts) (wrapper AudioBufferSourceNode)
- [src/Core/audio/AudioEnginePro.ts](src/Core/audio/AudioEnginePro.ts) (motor de audio + reproducción de notas del acordeón)
- [src/Core/hooks/useLogicaAcordeon.ts](src/Core/hooks/useLogicaAcordeon.ts) (`reproducirTono` y `actualizarBotonActivo`)
- [src/Paginas/AcordeonProMax/PracticaLibre/Hooks/useAudioFondoPracticaLibre.ts](src/Paginas/AcordeonProMax/PracticaLibre/Hooks/useAudioFondoPracticaLibre.ts) (HTMLAudio anclado para Admin)

---

## 1. El problema

Cuando se reproduce una canción del repertorio con notas pre-grabadas:

- **Las notas iluminan los botones del acordeón correctamente.**
- **Las notas suenan.**
- **PERO suenan desfasadas respecto al MP3 de fondo.** El usuario percibe que las notas van **siempre atrasadas** respecto al audio, con un desfase **constante** (no crece con el tiempo) y **bastante perceptible** (estimado >50ms, posiblemente 100-200ms).

El objetivo central de la app es que el alumno pueda comparar SU ejecución contra la canción modelo en tiempo real. Si la sincronía no es exacta, el feedback es ruido — el alumno no puede saber si va adelantado, atrasado, o si el problema es la app. Esto destruye el producto.

---

## 2. Páginas afectadas

### 2.1 Práctica Libre estudiante — `/acordeon-pro-max/acordeon`
- Reproductor INLINE flotante (`ReproductorCancionHero.tsx`).
- Síntoma: notas atrasadas constantemente respecto al MP3.
- Estado actual del código: usa `ReproductorMP3` (AudioBufferSourceNode), versión limpia sin logs.

### 2.2 Admin práctica — `/acordeon-pro-max/admin/practica`
- Reproductor con `BarraTransporte` + `useReproductorHero` + `useAudioFondoPracticaLibre` o BarratimelineProMax  (HTMLAudio).
- Síntoma reportado: "Solo funciona cuando hago clic casi al final de la sección, de resto nunca funciona". Comportamiento errático.
- Estado actual: sin cambios desde antes de esta sesión.

### 2.3 Lo que SÍ funciona (referencia importante)
- **Modo Maestro / Competencia:** sincronía correcta según el usuario.
- **Reproducción inmediatamente después de grabar en Admin:** sincroniza perfecto. El usuario navega la barra y mantiene sincronía. Esto sugiere que el flujo de grabación + reproducción inmediata está bien calibrado, pero algo se pierde al re-abrir la canción más tarde en otros contextos.

---

## 3. Enfoques probados que NO resolvieron

### 3.1 HTMLAudio + listeners 'seeked'/'playing' (estado original)
- El RAF mantenía un checkpoint sincronizado vía eventos del HTMLAudio.
- Resultado: desfase variable, no determinístico.

### 3.2 Reescritura con ReproductorMP3 (AudioBufferSourceNode)
- Reemplazo completo de HTMLAudio por `AudioBufferSourceNode` con su propio AudioContext.
- El RAF lee `repro.currentTime * factor` cada frame.
- Resultado: notas se disparan correctamente, pero desfase **constante** respecto al MP3.

### 3.3 Anchor sample-accurate vía `programarReproduccion`
- El MP3 se programa con `repro.programarReproduccion(offsetSeg, ctx.currentTime + 80ms)`.
- El RAF deriva el tick desde el mismo `contextStartTime`: `tick = anchorTick + (ctx.currentTime − anchorContextTime) × factor`.
- Resultado: mismo desfase constante.

### 3.4 Compensación de latencia con `outputLatency + baseLatency`
- Adelantar el reloj virtual del RAF por la latencia reportada por el AudioContext.
- En el dispositivo del usuario: `outputLatency=48ms | baseLatency=10ms` → compensación ~53ms.
- Resultado: mismo desfase. El problema no es la latencia técnica del audio.

### 3.5 Otros bugs reales que SÍ se resolvieron en el camino
- **Bug del cleanup useEffect:** el RAF se autocancelaba al primer `setBotonesActivos` por dep inestable. **Fix aplicada y mantenida** en `ReproductorCancionHero.tsx` (dep `[]` en cleanup useEffect).
- Limpieza de logs de debug en todos los archivos tocados.

---

## 4. Análisis técnico — por qué los enfoques fallaron

### Lo que documentan las fuentes oficiales (MDN, W3C, Web Audio API)
- `AudioBufferSourceNode` es la API recomendada para timing sample-accurate.
- `MediaElementAudioSourceNode` (que es lo que conectaba el HTMLAudio al AudioContext) tiene bugs de timing conocidos en Firefox y Safari.
- `HTMLAudio.currentTime` reporta lo que se OYÓ (con outputLatency aplicado).
- `AudioBufferSourceNode` permite programar `start(when, offset)` con precisión de microsegundos.

### Por qué el cambio a `ReproductorMP3` no resolvió
A pesar de usar la API "correcta" para sample-accurate playback, el desfase persiste. Esto sugiere que **la causa raíz NO está en el reproductor MP3 ni en el RAF de notas**, porque:

1. El RAF avanza correctamente (verificado con logs).
2. El cálculo `tick = currentTime × factor` es matemáticamente exacto.
3. Las notas se disparan en el momento correcto según el reloj del AudioContext.
4. El AudioContext clock es el mismo para el MP3 y para las notas.

### Hipótesis fuerte sobre la causa real
**El offset puede estar en cómo se GRABARON originalmente las notas.** Cuando el usuario presiona un botón durante la grabación, `useGrabadorHero` captura el `tick` actual contra `audio.currentTime`. Si en ese momento se usaba HTMLAudio, `currentTime` reportaba "lo que se oyó" (con outputLatency YA aplicado). Cuando reproducimos esas notas con ReproductorMP3 (que reporta "lo que se procesa", sin outputLatency), las notas quedan desplazadas por outputLatency respecto al audio audible.

Pero esta hipótesis no se pudo verificar empíricamente todavía. Es prioridad #1 para la próxima sesión.

---

## 5. Hipótesis pendientes para investigar (en orden de prioridad)

### 5.1 PRIORIDAD ALTA — Auditar el flujo de grabación
- Leer [useGrabadorHero.ts](src/Core/hooks/useGrabadorHero.ts) y entender exactamente qué timestamp se captura cuando el usuario presiona un botón durante la grabación.
- ¿Es contra `audio.currentTime` (HTMLAudio) o contra `motorAudioPro.tiempoActual` (AudioContext)?
- ¿Hay algún offset implícito de outputLatency aplicado?
- Si los timestamps están "shifted" por outputLatency en grabación, hay que aplicar el mismo shift en reproducción O re-grabar las canciones existentes con la lógica corregida.

### 5.2 PRIORIDAD ALTA — Test empírico para confirmar dónde está el desfase
**Hacer ANTES de tocar código:**
1. En Maestro/Competencia: abrir una canción con beat fuerte (bombo en el "1"). Aplaudir/golpear la mesa al beat. ¿Coincide?
2. Misma canción en Práctica Libre. ¿Coincide?
3. Si Maestro coincide y Práctica no → confirma que es la implementación de Práctica.
4. Si AMBOS no coinciden → el desfase real es menor del que se cree y puede ser percepción del fondo visual; o el problema está en las notas grabadas mismas.

### 5.3 PRIORIDAD MEDIA — Comparar exhaustivamente flujos Maestro vs Práctica
Maestro funciona. ¿Qué tiene Maestro que Práctica no? Diferencias conocidas:
- Maestro tiene **lead-in de 3 segundos** (audio arranca 3s antes del tickInicio, da tiempo al decoder a estabilizar).
- Maestro usa **`rangoTicks`** para silenciar notas pre-tickInicio durante el lead-in.
- Maestro espera el evento **'playing'** del HTMLAudio antes de soltar la secuencia.
- Maestro lee `audio.currentTime` (HTMLAudio) en el RAF.

¿Algunas de estas diferencias compensan accidentalmente el offset de grabación? Investigar.

### 5.4 PRIORIDAD BAJA / SOLUCIÓN PRAGMÁTICA — Calibración manual por canción
Si las hipótesis técnicas no llegan a una solución limpia:
- Agregar slider de calibración (-200ms a +200ms) por canción en el reproductor.
- Persistir el valor en la canción (Supabase).
- El usuario ajusta hasta sincronizar a su oído.
- No técnicamente "elegante" pero resuelve el síntoma definitivo y permite seguir trabajando.

---

## 6. Lo que YA está confirmado (no re-debatir)

- ✅ El RAF avanza a la velocidad correcta (verificado: 60 frames del RAF = ~0.37s en monitor 162Hz, consistente con factor matemático).
- ✅ Las notas se disparan continuamente, no solo la primera (la fix del cleanup useEffect resolvió ese bug).
- ✅ `actualizarBotonActivo` ilumina los botones correctamente.
- ✅ `motorAudioPro.reproducir(idSonido, banco, vol, pitch, ...)` programa cada nota con `start(cTime, offset)` donde `cTime = ctx.currentTime`. El sample del acordeón puede tener su propio `offset` interno por banco.
- ✅ El AudioContext del usuario reporta: `sampleRate=48000Hz | baseLatency=10.0ms | outputLatency=48.0ms | state=running`.
- ✅ TypeScript compila limpio en el estado actual.
- ✅ El `ReproductorMP3` ya estaba implementado en el codebase con `AudioBufferSourceNode` y método `programarReproduccion` para scheduling sample-accurate. NO hay que reimplementarlo.

---

## 7. Estado actual del código (al cerrar la sesión 2026-05-03)

### Modificado
- `ReproductorCancionHero.tsx` — versión limpia con `ReproductorMP3` simple. Lee `repro.currentTime * factor`. Mantiene fix del `useEffect` cleanup con dep `[]`. Sin logs de debug.

### Reescrito durante la sesión pero revertido
- Anchor sample-accurate con `programarReproduccion` y compensación de latencia → revertido a la versión simple por no resolver el desfase.

### NO modificados
- `/admin/practica` (`EstudioAdmin.tsx`) — usa el flujo HTMLAudio + lead-in original. Logs de debug removidos.
- `useReproductorHero.ts` — sin cambios funcionales, logs de debug removidos.
- `ReproductorMP3.ts` — sin cambios. Es la API correcta a usar cuando se vuelva a intentar.

---

## 8. Lecciones aprendidas (no repetir errores)

1. **15+ intentos parche-y-prueba sin diagnóstico real es señal de que la hipótesis subyacente está mal.** Parar y pedir info concreta del usuario antes de seguir tocando código.
2. **Antes de reescribir un componente entero, validar la hipótesis con instrumentación mínima** (logs específicos en los puntos sospechosos).
3. **Si un flujo similar funciona (Maestro), comparar AMBOS exhaustivamente antes de inventar nuevos enfoques.** La diferencia entre "funciona" y "no funciona" suele estar en detalles pequeños del flujo, no en la arquitectura.
4. **El AudioContext clock + sample-accurate scheduling NO compensa errores en los datos grabados.** Si las notas tienen un offset implícito en su tick, ningún reproductor lo arregla solo.
5. **Los sliders de calibración manual son una solución legítima** cuando el problema técnico es ambiguo y la fix automática no llega. Los DAWs profesionales tienen sliders de offset también.

---

## 9. Recomendación para la próxima sesión

**No tocar código en los primeros 15 minutos.**

1. Ejecutar el test empírico de la sección 5.2 (aplaudir contra el beat en Maestro vs Práctica). Documentar resultado concreto.
2. Leer `useGrabadorHero.ts` y entender qué timestamp captura. Documentar.
3. Solo después de eso, decidir entre:
   - Fix de la lógica de reproducción para compensar el offset de grabación.
   - Re-grabar las canciones existentes con lógica corregida.
   - Implementar slider de calibración manual.

**Sin esos dos pasos previos, cualquier nuevo intento de fix va a ser otro parche a ciegas.**

---

## 10. Fuentes consultadas

- [AudioBufferSourceNode — MDN](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode)
- [Web Audio API 1.1 — W3C](https://www.w3.org/TR/webaudio-1.1/)
- [Perfect Timing and Latency — Web Audio API book (Boris Smus, O'Reilly)](https://webaudioapi.com/book/Web_Audio_API_Boris_Smus_html/ch02.html)
- [Audio for Web games — MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games)
- [Rhythm Quest Devlog 4 — Music/Game Synchronization (DDRKirby ISQ)](https://ddrkirbyisq.medium.com/rhythm-quest-devlog-4-music-game-synchronization-7ae97a2ff9d5)
- [Web Audio API best practices — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [MediaElementAudioSourceNode vs AudioBufferSourceNode — wavesurfer.js issue #170](https://github.com/katspaugh/wavesurfer.js/issues/170)
- [Tone.js (referencia de implementación profesional)](https://tonejs.github.io/)

De esto depende finalizar el proyecto revisa todo y consulta par que encontremos el verdadero error! 