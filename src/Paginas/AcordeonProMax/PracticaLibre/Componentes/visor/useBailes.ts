import * as React from 'react'
import * as THREE from 'three'
import { RigRefs } from './useRigRefs'
import { CROSSFADE_BAILE, VELOCIDAD_BAILE } from '../../animaciones'

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
  },
) {
  const { mixer, scene, baile, clipsBaile } = deps
  const { baileAccion, accionesBaile, cuerpoAction } = refs

  React.useEffect(() => {
    if (!mixer) return
    const prev = baileAccion.current
    const clip = baile ? clipsBaile[baile] : null
    if (clip) {
      const acc = (accionesBaile.current[clip.name] ||= mixer.clipAction(clip, scene))
      if (acc === prev) return
      acc.timeScale = VELOCIDAD_BAILE
      acc.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(CROSSFADE_BAILE).play()
      if (prev) prev.fadeOut(CROSSFADE_BAILE)
      else cuerpoAction.current?.fadeOut(CROSSFADE_BAILE)
      baileAccion.current = acc
    } else if (prev) {
      prev.fadeOut(CROSSFADE_BAILE)
      const c = cuerpoAction.current
      if (c) {
        // al terminar su fadeOut el mixer la deshabilitó (enabled=false) → re-habilitar
        // SIN reset() (reset des-pausa y esta capa vive pausada/escrubada con Q)
        c.enabled = true
        c.paused = true
        c.fadeIn(CROSSFADE_BAILE)
      }
      baileAccion.current = null
    }
  }, [baile, clipsBaile, mixer, scene])
}
