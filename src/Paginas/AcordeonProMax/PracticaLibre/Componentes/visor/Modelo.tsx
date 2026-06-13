'use client'
import * as React from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { clone as clonarConEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { PERSONAJES, ACORDEON_GLB } from '../../personajes'
import { BAILES_GLB } from '../../animaciones'
import { RE_HUESOS_BRAZO, restPoseDe, rebasarClip } from './rigUtils'
import { MAPA_DEDO_ADMIN } from './mapas'
import { useRigRefs } from './useRigRefs'
import { useAcopleAcordeon } from './useAcopleAcordeon'
import { useSetupPersonaje } from './useSetupPersonaje'
import { useBailes } from './useBailes'
import { usePielesAcordeon } from './usePielesAcordeon'
import { useNotasSuscripcion, FuenteNotas } from './useNotasSuscripcion'
import { usePersonajeFrame } from './usePersonajeFrame'

// Arquitectura: personaje (GLB liviano, rig mixamorig:, acción 'Cierre' horneada con el brazo
// izquierdo siguiendo la tapa) + acordeón COMPARTIDO (acordeon-fino-v1, morph 'Cerrar' horneado
// en 22 piezas) acoplado en runtime al nodo 'AnclaAcordeon' por el marco de la pieza 'parrilla'.
// Q comprime el morph 'Cerrar' del fuelle; la mano queda fija en la pose de agarre.
//
// El componente carga los GLB y delega toda la lógica a hooks de ./visor (setup, bailes, pieles,
// suscripción de notas, frame). Las refs compartidas viven en useRigRefs.

useGLTF.setDecoderPath('/draco/')

export function Modelo({ fuelleAbiertoRef, skin, glb, baile, fuenteNotas }: { fuelleAbiertoRef: React.MutableRefObject<boolean>; skin: string; glb: string; baile: string | null; fuenteNotas?: FuenteNotas }) {
  const grupo = React.useRef<THREE.Group>(null!)
  const { scene: sceneCacheada, animations } = useGLTF(glb) as any
  // useGLTF cachea y devuelve la MISMA escena por URL. En el mundo multijugador varios avatares pueden
  // usar el mismo personaje (o un remoto recién entrado cae en el personaje por defecto antes de recibir
  // el suyo): montar esa única escena en dos <primitive> hace que three.js solo la coloque en UNO → el
  // otro DESAPARECE; además los hooks de setup mutan la escena compartida. Clonamos por instancia
  // (SkeletonUtils preserva huesos y nombres → los clips se siguen ligando por nombre).
  const scene = React.useMemo(() => clonarConEsqueleto(sceneCacheada) as THREE.Group, [sceneCacheada])
  const acordeonGltf = useGLTF(ACORDEON_GLB) as any
  const bailesGltf = useGLTF(BAILES_GLB) as any
  const { mixer } = useAnimations(animations, scene)
  const camera = useThree((s) => s.camera)
  const refs = useRigRefs()

  // Capas del cierre: el clip 'Cierre' partido en BRAZOS (agarre, siempre activa) y CUERPO
  // (idle que se cruza con los bailes). Memo en el primer render = rest pose aún prístina.
  const { clipBrazos, clipCuerpo, clipsBaile } = React.useMemo(() => {
    const restB = restPoseDe(scene)
    const restA = restPoseDe(bailesGltf.scene)
    // matrices de mundo al día para la conversión de deltas de posición entre rigs
    bailesGltf.scene.updateMatrixWorld(true)
    scene.updateMatrixWorld(true)
    const clip: THREE.AnimationClip | undefined = animations?.[0]
    const brazos: THREE.KeyframeTrack[] = [], cuerpo: THREE.KeyframeTrack[] = []
    for (const t of clip?.tracks ?? []) (RE_HUESOS_BRAZO.test(t.name) ? brazos : cuerpo).push(t)
    const clips: Record<string, THREE.AnimationClip> = {}
    for (const c of (bailesGltf.animations ?? []) as THREE.AnimationClip[]) {
      clips[c.name] = rebasarClip(c, bailesGltf.scene, scene, restA, restB)
    }
    return {
      clipBrazos: clip ? new THREE.AnimationClip('CierreBrazos', clip.duration, brazos) : null,
      clipCuerpo: clip ? new THREE.AnimationClip('CierreCuerpo', clip.duration, cuerpo) : null,
      clipsBaile: clips,
    }
  }, [scene, animations, bailesGltf])

  // Clon del acordeón compartido: la geometría se comparte (sin costo GPU extra), pero los
  // materiales que mutamos (pieles/glow) se clonan para no contaminar la pestaña "Acordeón 3D".
  const acordeon = React.useMemo(() => {
    const esc: THREE.Object3D = acordeonGltf.scene.clone(true)
    const clones = new Map<string, THREE.Material>()
    esc.traverse((o: any) => {
      // Las "bases para parar el acordeón" (patas blancas para la pestaña 3D) sobran
      // cuando el personaje lo sostiene — se ven como un manchón blanco flotante.
      if (/Bases.?para.?parar/i.test(o.name || '')) o.visible = false
      if (!o.isMesh) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const nuevos = mats.map((m: any) => {
        if (!m) return m
        if (!clones.has(m.uuid)) {
          const c = m.clone()
          c.userData.orig = { map: c.map, roughnessMap: c.roughnessMap, metalnessMap: c.metalnessMap, normalMap: c.normalMap }
          clones.set(m.uuid, c)
        }
        return clones.get(m.uuid)
      })
      o.material = Array.isArray(o.material) ? nuevos : nuevos[0]
    })
    return esc
  }, [acordeonGltf.scene])

  // Handle de medición/tuneo de poses. SOLO en desarrollo: en producción no se expone el estado
  // interno (escena, refs, cámara) al objeto global window (hardening).
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    ;(window as any).__pm = { scene, acordeon, mixer, clipsBaile, camera, MAPA_DEDO_ADMIN, ...refs }
  })

  useAcopleAcordeon(scene, acordeon, mixer, clipBrazos, clipCuerpo)
  useSetupPersonaje(refs, { scene, acordeon, mixer, clipBrazos, clipCuerpo, camera })
  useBailes(refs, { mixer, scene, baile, clipsBaile })
  usePielesAcordeon(refs, acordeon, skin)
  useNotasSuscripcion(refs, fuenteNotas)
  usePersonajeFrame(refs, fuelleAbiertoRef, mixer)

  return <primitive ref={grupo} object={scene} />
}

useGLTF.preload(PERSONAJES[0].archivo)
useGLTF.preload(ACORDEON_GLB)
useGLTF.preload(BAILES_GLB)
