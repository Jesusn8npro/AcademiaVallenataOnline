import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// Balanceo musical: cuando el avatar está TOCANDO, el torso (Spine1) se mece suave de lado a lado con un
// leve bob, ENCIMA de la pose de agarre → se ve "tocando con sentimiento" sin soltar el acordeón (que
// cuelga del torso, así que se mece con él). Es por código (no necesita Blender) y se desvanece al parar.
//
// ORDEN CRÍTICO: igual que useHeadLook, este useFrame DEBE registrarse DESPUÉS de usePersonajeFrame
// (mixer.update). Captura la pose de agarre del Spine UNA vez (base) y le SUMA el vaivén → no acumula.
// Si no se pasa tocandoRef (ej. el estudio), no hace nada (degradación limpia).

const RATE = 4          // suavizado de la amplitud (sube al tocar, baja al parar)
const FREQ = 2.3        // rad/s del vaivén
const AMP_LEAN = 0.075  // ~4° de inclinación lateral (roll)
const AMP_TURN = 0.04   // leve giro
const AMP_BOB = 0.03    // leve cabeceo adelante/atrás

export function useBalanceoTocando(scene: THREE.Object3D, tocandoRef?: React.MutableRefObject<boolean>) {
  const spine = React.useRef<THREE.Object3D | null>(null)
  const base = React.useRef<THREE.Quaternion | null>(null) // pose de agarre del torso (1 captura)
  const t = React.useRef(0)
  const amp = React.useRef(0) // 0..1
  const _e = React.useRef(new THREE.Euler())
  const _q = React.useRef(new THREE.Quaternion())

  React.useEffect(() => {
    let s: THREE.Object3D | null = null
    // Preferir Spine1/Spine2 (mece el tronco superior + acordeón); fallback a Spine.
    scene.traverse((o: any) => { if (o.isBone && /Spine[12]$/.test(o.name || '')) { if (!s || /Spine1$/.test(o.name)) s = o } })
    if (!s) scene.traverse((o: any) => { if (!s && o.isBone && /Spine$/.test(o.name || '')) s = o })
    spine.current = s
    base.current = null // recapturar para el nuevo personaje
  }, [scene])

  useFrame((_, dt) => {
    const s = spine.current
    if (!s || !tocandoRef) return
    if (!base.current) base.current = s.quaternion.clone()
    const objetivo = tocandoRef.current ? 1 : 0
    amp.current = THREE.MathUtils.damp(amp.current, objetivo, RATE, dt)
    // Sin balanceo → pose de agarre intacta (no interfiere con nada).
    if (amp.current < 1e-3) { s.quaternion.copy(base.current); return }
    t.current += dt
    const k = amp.current
    _e.current.set(
      Math.sin(t.current * FREQ * 2) * AMP_BOB * k,   // X: bob
      Math.sin(t.current * FREQ * 0.5) * AMP_TURN * k, // Y: giro
      Math.sin(t.current * FREQ) * AMP_LEAN * k,        // Z: inclinación lateral
    )
    _q.current.setFromEuler(_e.current)
    s.quaternion.copy(base.current).multiply(_q.current)
  })
}
