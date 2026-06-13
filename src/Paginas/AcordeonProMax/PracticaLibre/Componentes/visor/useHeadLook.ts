import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// Head-look: la CABEZA gira (yaw en mundo) hacia donde mira el jugador, hasta un límite, ENCIMA de la
// animación (estilo videojuego). El controlador (local = cámara; remoto = 'mira' de la red) escribe en
// headYawRef el DESFASE ya en radianes respecto al cuerpo; aquí solo lo suavizamos, clampeamos y lo
// aplicamos al hueso de la cabeza. Si el rig no tiene hueso 'Head', no hace nada (degradación limpia).
//
// ORDEN CRÍTICO: este useFrame DEBE registrarse DESPUÉS del de usePersonajeFrame (que hace mixer.update
// y deja la pose animada de la cabeza); así cada frame parte de la pose animada y le sumamos el giro
// (no es acumulativo). Por eso en Modelo se llama al final.

const UP = new THREE.Vector3(0, 1, 0)
const LIMITE = 1.2 // ~69° a cada lado (más allá, la cabeza no sigue; el cuerpo debería girar)
const RATE = 9

export function useHeadLook(scene: THREE.Object3D, headYawRef?: React.MutableRefObject<number>) {
  const head = React.useRef<THREE.Object3D | null>(null)
  const base = React.useRef<THREE.Quaternion | null>(null) // pose local NEUTRAL de la cabeza (1 captura)
  const suave = React.useRef(0)
  const _qP = React.useRef(new THREE.Quaternion())
  const _qD = React.useRef(new THREE.Quaternion())
  const _qY = React.useRef(new THREE.Quaternion())

  React.useEffect(() => {
    let h: THREE.Object3D | null = null
    scene.traverse((o: any) => { if (!h && o.isBone && /Head$/.test(o.name || '')) h = o })
    head.current = h
    base.current = null // recapturar para el nuevo personaje
  }, [scene])

  useFrame((_, dt) => {
    const h = head.current
    if (!h || !headYawRef) return
    // Captura la pose neutral UNA vez (primer frame, antes de tocar nada).
    if (!base.current) base.current = h.quaternion.clone()
    const objetivo = THREE.MathUtils.clamp(headYawRef.current, -LIMITE, LIMITE)
    suave.current = THREE.MathUtils.damp(suave.current, objetivo, RATE, dt)
    // CLAVE: partir SIEMPRE de la pose neutral → NO acumula. Antes, si la animación activa no keyea
    // la cabeza (varios bailes/caminata no traen huesos de cabeza), mixer.update no la reseteaba y el
    // giro se sumaba frame a frame → la cabeza giraba sola hasta dar vueltas. (bug "se voltea sola").
    h.quaternion.copy(base.current)
    const a = suave.current
    if (Math.abs(a) < 1e-4) return
    const padre = h.parent
    if (!padre) return
    // Aplica un giro `a` sobre el eje Y de MUNDO encima de la pose neutral:
    // local_new = (qPadreInv · qYaw · qPadre) · local_base  →  worldQuat_new = qYaw · worldQuat_old.
    padre.getWorldQuaternion(_qP.current)
    _qY.current.setFromAxisAngle(UP, a)
    _qD.current.copy(_qP.current).invert().multiply(_qY.current).multiply(_qP.current)
    h.quaternion.premultiply(_qD.current)
  })
}
