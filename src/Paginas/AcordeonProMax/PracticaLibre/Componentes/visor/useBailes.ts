import * as React from 'react'
import * as THREE from 'three'
import { RigRefs } from './useRigRefs'
import { CROSSFADE_BAILE, CROSSFADE_SALTO, VELOCIDAD_BAILE, BAILES } from '../../animaciones'

// Entrar/salir/cambiar de baile con crossfade: el baile (capa cuerpo del pack, ya rebasada al
// esqueleto de ESTE personaje) se cruza con la capa CUERPO del cierre — los BRAZOS no se tocan,
// así el agarre y el cierre con Q siguen vivos mientras baila.
export function useBailes(
  refs: RigRefs,
  deps: {
    mixer: THREE.AnimationMixer | undefined
    scene: THREE.Object3D
    baile: string | null
    clipsBaile: Record<string, THREE.AnimationClip>
    velocidad?: number // timeScale del baile; default VELOCIDAD_BAILE. El salto lo sube (pose sincronizada al arco).
  },
) {
  const { mixer, scene, baile, clipsBaile, velocidad } = deps
  const { baileAccion, accionesBaile, cuerpoAction } = refs

  React.useEffect(() => {
    if (!mixer) return
    const prev = baileAccion.current
    const clip = baile ? clipsBaile[baile] : null
    const esUnaVez = (a: THREE.AnimationAction) => { try { return BAILES.some((b) => b.clip === a.getClip().name && (b.unaVez || b.mantener)) } catch { return false } }
    // Vuelve suave a la pose de PIE (capa cuerpo del cierre): cruza el baile a la izquierda y reactiva
    // el idle. Se usa al salir de un baile (baile=null) y al TERMINAR un clip de una-vez (salto).
    const volverAlIdle = (acc: THREE.AnimationAction) => {
      if (esUnaVez(acc)) acc.paused = true // congelar para que no avance mientras se desvanece
      acc.fadeOut(CROSSFADE_BAILE)
      const c = cuerpoAction.current
      if (c) { c.enabled = true; c.paused = true; c.fadeIn(CROSSFADE_BAILE) }
      if (baileAccion.current === acc) baileAccion.current = null
    }
    if (clip) {
      const acc = (accionesBaile.current[clip.name] ||= mixer.clipAction(clip, scene))
      if (acc === prev) return
      acc.timeScale = velocidad ?? VELOCIDAD_BAILE
      // Clips de UNA sola vez (p. ej. el salto): se reproducen COMPLETOS una sola vez (LoopOnce) y, al
      // terminar, VUELVEN a la pose de pie (no se quedan congelados en el último frame = pose rara, ni
      // se repiten/doblan). clampWhenFinished mantiene la última pose SOLO hasta que el crossfade al idle
      // toma el control (sin esto el mixer la resetea al frame 0 = brinco). El resto de bailes va en loop.
      const def = BAILES.find((b) => b.clip === clip.name)
      const unaVez = !!def?.unaVez       // salto: una vez y al terminar VUELVE a estar de pie
      const mantener = !!def?.mantener   // sentarse: una vez y MANTIENE la pose final (no vuelve a estar de pie)
      const unaSola = unaVez || mantener // ambos: LoopOnce + clamp (se quedan en el último frame)
      // El salto entra con crossfade CORTO → arranca de golpe como en Blender. Sentarse va suave (normal).
      const fadeEntrada = unaVez ? CROSSFADE_SALTO : CROSSFADE_BAILE
      acc.clampWhenFinished = unaSola
      acc.reset().setLoop(unaSola ? THREE.LoopOnce : THREE.LoopRepeat, unaSola ? 1 : Infinity).fadeIn(fadeEntrada).play()
      if (prev) {
        // Si salimos de un clip de UNA-VEZ (salto) a media reproducción (p. ej. saltar caminando → vuelve a
        // 'Caminata'), lo CONGELAMOS para que su agachada de aterrizaje NO se cuele durante el crossfade →
        // la caminata vuelve fluida, sin la pausa de "se queda quieto y luego camina".
        if (esUnaVez(prev)) prev.paused = true
        prev.fadeOut(fadeEntrada) // al entrar al salto, sacar lo anterior igual de rápido → arranque limpio
      } else cuerpoAction.current?.fadeOut(fadeEntrada)
      baileAccion.current = acc
      if (unaVez) {
        const onFin = (e: { action: THREE.AnimationAction }) => {
          if (e.action !== acc) return
          mixer.removeEventListener('finished', onFin as any)
          volverAlIdle(acc)
        }
        mixer.addEventListener('finished', onFin as any)
        return () => mixer.removeEventListener('finished', onFin as any)
      }
    } else if (prev) {
      volverAlIdle(prev)
    }
  }, [baile, clipsBaile, mixer, scene])
}
