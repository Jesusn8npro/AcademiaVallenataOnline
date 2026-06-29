'use client'
import * as React from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { clone as clonarConEsqueleto } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { PERSONAJES, ACORDEON_GLB } from '../../personajes'
import { BAILES_GLB } from '../../animaciones'
import { RE_HUESOS_BRAZO, restPoseDe, rebasarClip } from './rigUtils'
import { MAPA_DEDO_ADMIN, RIGHT_SUF } from './mapas'
import type { HuesosPose } from '../../Servicios/servicioPosesDedos'
import { useRigRefs } from './useRigRefs'
import { useAcopleAcordeon } from './useAcopleAcordeon'
import { useArrastrarCaja } from './useArrastrarCaja'
import { useSetupPersonaje } from './useSetupPersonaje'
import { useBailes } from './useBailes'
import { usePielesAcordeon } from './usePielesAcordeon'
import { useDisenoEnAcordeon, usePielEfectiva } from './useDisenoEnAcordeon'
import { useNotasSuscripcion, FuenteNotas } from './useNotasSuscripcion'
import { useCalibracionDedo } from './useCalibracionDedo'
import { usePersonajeFrame } from './usePersonajeFrame'
import { useHeadLook } from './useHeadLook'
import { useBalanceoTocando } from './useBalanceoTocando'

// Arquitectura: personaje (GLB liviano, rig mixamorig:, acción 'Cierre' horneada con el brazo
// izquierdo siguiendo la tapa) + acordeón COMPARTIDO (acordeon-fino-v1, morph 'Cerrar' horneado
// en 22 piezas) acoplado en runtime al nodo 'AnclaAcordeon' por el marco de la pieza 'parrilla'.
// Q comprime el morph 'Cerrar' del fuelle; la mano queda fija en la pose de agarre.
//
// El componente carga los GLB y delega toda la lógica a hooks de ./visor (setup, bailes, pieles,
// suscripción de notas, frame). Las refs compartidas viven en useRigRefs.

useGLTF.setDecoderPath('/draco/')

// Editor admin de poses de dedos (solo pestaña Personaje): las refs compartidas con el contexto/panel/gizmo.
export type EdicionDedosModelo = {
  posesDedosRef: React.MutableRefObject<Record<string, HuesosPose>>
  adminPoseRef: React.MutableRefObject<HuesosPose | null>
  editandoDedosRef: React.MutableRefObject<boolean>
  edicionPoseRef: React.MutableRefObject<HuesosPose>
  bonesDedosRef: React.MutableRefObject<Record<string, THREE.Object3D>>
  botonEditandoRef: React.MutableRefObject<string[]>
  dedosBotonRef: React.MutableRefObject<Record<string, string>>
  guiaPorBotonRef: React.MutableRefObject<Record<string, HuesosPose>>
  guiaAnclaRef: React.MutableRefObject<Record<string, string>>
  posesListaRef: React.MutableRefObject<{ key: string; btns: string[] }[]>
}

export function Modelo({ fuelleAbiertoRef, fuellePosRef, skin, glb, baile, fuenteNotas, headYawRef, tocandoRef, ligero, velocidadBaile, velocidadLocoRef, edicionDedos }: { fuelleAbiertoRef: React.MutableRefObject<boolean>; fuellePosRef?: React.MutableRefObject<number>; skin: string; glb: string; baile: string | null; fuenteNotas?: FuenteNotas; headYawRef?: React.MutableRefObject<number>; tocandoRef?: React.MutableRefObject<boolean>; ligero?: boolean; velocidadBaile?: number; velocidadLocoRef?: React.MutableRefObject<number | undefined>; edicionDedos?: EdicionDedosModelo }) {
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
  // true mientras se arrastra la caja de bajos (compartida entre el arrastre y el bucle del fuelle).
  const arrastrandoCajaRef = React.useRef(false)

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
    esc.traverse((o: any) => {
      // Las "bases para parar el acordeón" (patas blancas para la pestaña 3D) sobran
      // cuando el personaje lo sostiene — se ven como un manchón blanco flotante.
      if (/Bases.?para.?parar/i.test(o.name || '')) o.visible = false
      if (!o.isMesh) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      // Clon de material POR MALLA (no compartido entre mallas). CLAVE para que el DISEÑO por partes
      // funcione igual que el acordeón solo: si dos mallas comparten el mismo material, pintar una pinta
      // las dos (el color por pieza se colapsa). Por eso antes solo "funcionaban" los botones (todos del
      // mismo color); las cajas/cuerpo compartían material y quedaban en un solo color.
      const nuevos = mats.map((m: any) => {
        if (!m) return m
        const c = m.clone()
        c.userData.orig = { map: c.map, roughnessMap: c.roughnessMap, metalnessMap: c.metalnessMap, normalMap: c.normalMap }
        return c
      })
      o.material = Array.isArray(o.material) ? nuevos : nuevos[0]
    })
    return esc
  }, [acordeonGltf.scene])

  // Tras montar: calienta los otros personajes en segundo plano (idle) → cambio de personaje sin freeze.
  React.useEffect(() => { calentarPersonajesEnIdle() }, [])

  // Handle de medición/tuneo de poses. SOLO en desarrollo: en producción no se expone el estado
  // interno (escena, refs, cámara) al objeto global window (hardening).
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    ;(window as any).__pm = { scene, acordeon, mixer, clipsBaile, camera, MAPA_DEDO_ADMIN, fuellePosRef, ...refs }
  })

  useAcopleAcordeon(scene, acordeon, mixer, clipBrazos, clipCuerpo)
  useSetupPersonaje(refs, { scene, acordeon, mixer, clipBrazos, clipCuerpo, camera, ligero })
  useBailes(refs, { mixer, scene, baile, clipsBaile, velocidad: velocidadBaile })
  // Piel EFECTIVA: si el diseño elegido se guardó sobre una piel de fábrica (_piel), esa es la textura
  // de base; si no, la piel/skin tal cual. Así un diseño "azul (piel) + fuelle pintado" muestra el azul.
  const pielEfectiva = usePielEfectiva(!ligero, skin)
  usePielesAcordeon(refs, acordeon, pielEfectiva)
  // Diseño por partes guardado del usuario (color por parte) → se ve igual en Personaje y Mundo 3D.
  // Solo el jugador local (!ligero); se aplica DESPUÉS de las pieles para tintar sobre la textura.
  // `pielEfectiva` también va acá: al terminar de cargar la piel, re-aplica los colores encima (sin carrera).
  useDisenoEnAcordeon(acordeon, !ligero, skin, pielEfectiva)
  useNotasSuscripcion(refs, fuenteNotas, edicionDedos ? { posesDedosRef: edicionDedos.posesDedosRef, adminPoseRef: edicionDedos.adminPoseRef } : undefined)
  // Calibración de la punta del dedo (F2 + flechas). Carga los ajustes guardados SIEMPRE (para que el
  // IK los aplique); el teclado de tuneo solo se engancha en la pestaña Personaje (no en remotos).
  useCalibracionDedo(refs, !ligero)
  usePersonajeFrame(refs, fuelleAbiertoRef, mixer, ligero, velocidadLocoRef, fuellePosRef, arrastrandoCajaRef,
    edicionDedos ? { adminPoseRef: edicionDedos.adminPoseRef, posesDedosRef: edicionDedos.posesDedosRef, editandoDedosRef: edicionDedos.editandoDedosRef, edicionPoseRef: edicionDedos.edicionPoseRef, botonEditandoRef: edicionDedos.botonEditandoRef, dedosBotonRef: edicionDedos.dedosBotonRef, guiaPorBotonRef: edicionDedos.guiaPorBotonRef, guiaAnclaRef: edicionDedos.guiaAnclaRef, posesListaRef: edicionDedos.posesListaRef } : undefined)
  // Registrar los huesos VIVOS del brazo derecho (del clon de este personaje) para el gizmo y el guardado.
  React.useEffect(() => {
    if (!edicionDedos) return
    const m: Record<string, THREE.Object3D> = {}
    scene.traverse((o: any) => { if (o.isBone) { const nm = o.name || ''; for (const suf of RIGHT_SUF) if (nm.endsWith(suf)) m[suf] = o } })
    edicionDedos.bonesDedosRef.current = m
  }, [scene, edicionDedos])
  // Arrastrar la caja de los bajos con el mouse (abre/cierra el fuelle, la mano sigue sola). Solo en
  // la pestaña Personaje (donde llega fuellePosRef) y no en avatares remotos del mundo (ligero).
  useArrastrarCaja(refs, acordeon, fuellePosRef, !ligero, arrastrandoCajaRef)
  // DESPUÉS de usePersonajeFrame (que hace mixer.update): la cabeza gira hacia donde mira el jugador.
  useHeadLook(scene, headYawRef)
  // Balanceo musical del torso mientras toca (encima de la pose de agarre; no acumula).
  useBalanceoTocando(scene, tocandoRef)

  return <primitive ref={grupo} object={scene} />
}

// Precarga del primer render: SOLO lo imprescindible (personaje por defecto + acordeón + bailes). Los
// otros 5 personajes (~2.7MB) NO se cargan acá: harían competir 2.7MB en paralelo con el primer render
// y en móvil/red lenta lo harían tartamudear.
useGLTF.preload(PERSONAJES[0].archivo)
useGLTF.preload(ACORDEON_GLB)
useGLTF.preload(BAILES_GLB)

// Calienta los OTROS personajes en segundo plano, cuando el navegador está OCIOSO (tras el primer render),
// de a uno por tick para no saturar la red. Así el arranque es fluido Y el cambio en el selector es
// instantáneo (el GLB ya está en caché). Una sola vez por sesión, aunque se monten varios <Modelo>.
let personajesCalentados = false
function calentarPersonajesEnIdle(): void {
  if (personajesCalentados || typeof window === 'undefined') return
  personajesCalentados = true
  const idle: (cb: () => void) => void = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1200))
  const pendientes = PERSONAJES.filter((p) => !p.bloqueado).slice(1).map((p) => p.archivo) // solo activos; el [0] ya se precargó
  const siguiente = () => {
    const url = pendientes.shift()
    if (!url) return
    useGLTF.preload(url)
    idle(siguiente)
  }
  idle(siguiente)
}
