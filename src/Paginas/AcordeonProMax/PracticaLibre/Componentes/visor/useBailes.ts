import * as React from 'react'
import * as THREE from 'three'
import { RigRefs } from './useRigRefs'
import { CROSSFADE_BAILE, VELOCIDAD_BAILE, BAILES } from '../../animaciones'

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
    // Vuelve suave a la pose de PIE (capa cuerpo del cierre): cruza el baile a la izquierda y reactiva
    // el idle. Se usa al salir de un baile (baile=null) y al TERMINAR un clip de una-vez (salto).
    const volverAlIdle = (acc: THREE.AnimationAction) => {
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
      const unaVez = BAILES.some((b) => b.clip === clip.name && b.unaVez)
      acc.clampWhenFinished = unaVez
      acc.reset().setLoop(unaVez ? THREE.LoopOnce : THREE.LoopRepeat, unaVez ? 1 : Infinity).fadeIn(CROSSFADE_BAILE).play()
      if (prev) prev.fadeOut(CROSSFADE_BAILE)
      else cuerpoAction.current?.fadeOut(CROSSFADE_BAILE)
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
