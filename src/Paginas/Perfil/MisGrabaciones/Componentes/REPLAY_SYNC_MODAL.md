## Replay sync modal

Archivo principal: `ModalReplayGrabacionHero.tsx`

### Problema real

- El modal no arrancaba igual que `AcordeonProMax`.
- La secuencia y el audio de fondo se lanzaban con logica distinta.
- Ademas habia una correccion por intervalo que empujaba el audio cada 100ms y podia volver a desfasarlo despues del arranque.

### Como quedo funcionando

1. El modal ahora prepara las muestras del acordeon antes de reproducir.
2. Si existe pista original, primero crea el `Audio`, lo posiciona en el tick correcto y espera a que el audio este listo (`canplay`, `loadeddata`, `load`).
3. En el mismo instante de arranque dispara:
   - `reproductor.reproducirSecuencia(...)`
   - `audio.play()`
4. Cuando el navegador confirma `playing`, se llama `sincronizarRelojConPista()` para que el reloj musical quede alineado con el instante real en que la pista empezo a sonar.

### Cambios clave

- Se copio al modal el patron de arranque de Pro Max.
- Se agrego `registrarSyncCuandoSuene()` para enganchar la compensacion real del audio.
- Se elimino la sincronizacion por `setInterval`, porque peleaba con el arranque y podia introducir drift artificial.
- La reanudacion de pausa ahora sigue el mismo orden de Pro Max.
- El seek manual mantiene el audio y la secuencia en el mismo tick sin re-sincronizar el reloj de forma agresiva.

### Resumen tecnico

La clave no fue "mover mas el audio", sino arrancar audio + secuencia con el mismo bootstrap que usa Pro Max y dejar que `playing` marque el cero real de sincronizacion.

### Si vuelve a fallar

Revisar en este orden:

1. `grabacion.bpm`
2. `grabacion.resolucion`
3. `grabacion.metadata.bpm_original`
4. `grabacion.canciones_hero.bpm`
5. `grabacion.metadata.audio_fondo_url` o `grabacion.canciones_hero.audio_fondo_url`

Si esos datos vienen mal, el modal puede arrancar bien pero reproducir una referencia ya guardada con tiempos incorrectos.
