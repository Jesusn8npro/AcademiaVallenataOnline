'use client'
import * as React from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei'
import { clone as cloneSkel } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as THREE from 'three'

// Montaje del acordeón RIGGED sobre el Pelao (prototipo, sin tocar el visor compartido de Pro Max).
// El Pelao trae 'AnclaAcordeon' (marco de la parrilla) + acción 'Cierre' con la mano izq horneada
// agarrando los bajos. Anclamos parrilla007 del acordeón rigged a ese marco, colgado de Spine2 →
// la mano cae sobre los bajos (es la MISMA escena de Blender). El fuelle se escruba con la caja.
const PELAO = '/modelos3d/personaje-pelao.glb?v=3'
const ACORDEON = '/modelos3d/acordeon-pelao-rigged-v7-opt.glb'
const DRAG_PX_FULL = 320
useGLTF.setDecoderPath('/draco/')

const EnvLocal: React.FC = () => {
  const { gl, scene } = useThree()
  React.useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = tex
    return () => { tex.dispose(); pmrem.dispose(); scene.environment = null }
  }, [gl, scene])
  return null
}

function Escena({ pos }: { pos: React.MutableRefObject<number> }) {
  const pelaoG = useGLTF(PELAO) as any
  const accG = useGLTF(ACORDEON) as any
  const persona = React.useMemo(() => cloneSkel(pelaoG.scene) as THREE.Group, [pelaoG.scene])
  const acordeon = React.useMemo(() => accG.scene.clone(true) as THREE.Group, [accG.scene])
  const { mixer: mixPersona } = useAnimations(pelaoG.animations, persona)
  const accAnim = useAnimations(accG.animations, acordeon)
  const dur = React.useRef(1)
  const { camera, controls } = useThree() as any

  React.useLayoutEffect(() => {
    // 1) posar al personaje en AGARRE y anclarlo al piso
    if (pelaoG.animations?.[0]) { const a = mixPersona.clipAction(pelaoG.animations[0], persona); a.reset(); a.play(); a.paused = true; a.time = 0 }
    mixPersona.update(0)
    persona.position.set(0, 0, 0); persona.updateMatrixWorld(true)
    const box0 = new THREE.Box3().setFromObject(persona)
    persona.position.y = -box0.min.y
    persona.updateMatrixWorld(true)

    // 2) acordeón rigged en 'cerrado' (t=0) + doble cara
    let d = 0
    for (const n of accAnim.names) { const a = accAnim.actions[n]; if (a) { a.reset(); a.play(); a.paused = true; a.time = 0; d = Math.max(d, a.getClip().duration) } }
    dur.current = d || 1
    acordeon.traverse((o: any) => { if (o.isMesh) { const m = Array.isArray(o.material) ? o.material : [o.material]; for (const x of m) if (x) x.side = THREE.DoubleSide } })
    acordeon.position.set(0, 0, 0); acordeon.quaternion.identity(); acordeon.scale.set(1, 1, 1)
    acordeon.matrixAutoUpdate = false; acordeon.matrix.identity(); acordeon.updateMatrixWorld(true)

    // 3) MATRIZ DIRECTA: parrilla007 → AnclaAcordeon (incluye escala 0.146/14.64 ≈ 0.01).
    //    Acordeón como HERMANO en el root → matrixWorld = mundoDeseado (sin escalas de huesos padres).
    const ancla = persona.getObjectByName('AnclaAcordeon')
    let parrilla: THREE.Object3D | null = null
    acordeon.traverse((o: any) => { if (!parrilla && /^parrilla007$/i.test(o.name)) parrilla = o })
    if (ancla && parrilla) {
      ancla.updateWorldMatrix(true, false)
      ;(parrilla as THREE.Object3D).updateWorldMatrix(true, false)
      const mundoDeseado = ancla.matrixWorld.clone().multiply((parrilla as THREE.Object3D).matrixWorld.clone().invert())
      acordeon.matrix.copy(mundoDeseado)
      acordeon.matrixWorldNeedsUpdate = true
      acordeon.updateMatrixWorld(true)
    }

    // 4) encuadre del personaje
    persona.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(persona)
    const c = box.getCenter(new THREE.Vector3()); const s = box.getSize(new THREE.Vector3())
    camera.position.set(0, c.y, Math.max(s.x, s.y, s.z) * 1.5)
    camera.near = 0.05; camera.far = 100; camera.updateProjectionMatrix(); camera.lookAt(0, c.y, 0)
    if (controls) { controls.target.set(0, c.y, 0); controls.update() }

    ;(window as any).__persona = persona
    ;(window as any).__acc = acordeon
    // eslint-disable-next-line no-console
    console.log('[MONTAJE] ancla', !!ancla, 'parrilla', !!parrilla)
  }, [persona, acordeon, pelaoG, accG, mixPersona, accAnim, camera, controls])

  // escrubar el fuelle (cerrado↔arqueado) con la posición
  useFrame(() => {
    const t = pos.current * dur.current
    for (const n of accAnim.names) { const a = accAnim.actions[n]; if (a && a.time !== t) a.time = t }
  })

  return (
    <>
      <primitive object={persona} />
      <primitive object={acordeon} />
    </>
  )
}

function ArrastreFuelle({ pos }: { pos: React.MutableRefObject<number> }) {
  const gl = useThree((s) => s.gl); const camera = useThree((s) => s.camera); const controls = useThree((s) => s.controls) as any
  React.useEffect(() => {
    const dom = gl.domElement; const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2()
    let st: null | { x: number; p: number } = null
    const toca = (e: PointerEvent) => {
      const acc = (window as any).__acc as THREE.Object3D | undefined; if (!acc) return false
      const r = dom.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      for (const h of ray.intersectObject(acc, true)) { for (let o: any = h.object; o; o = o.parent) if (/bajos|Boton_I|CORONA/i.test(o.name)) return true }
      return false
    }
    const onDown = (e: PointerEvent) => { if (e.button !== 0 || st || !toca(e)) return; st = { x: e.clientX, p: pos.current }; if (controls) controls.enabled = false }
    const onMove = (e: PointerEvent) => { if (!st) return; pos.current = THREE.MathUtils.clamp(st.p + (e.clientX - st.x) / DRAG_PX_FULL, 0, 1) }
    const onUp = () => { if (!st) return; st = null; if (controls) controls.enabled = true }
    dom.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
    return () => { dom.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); if (controls) controls.enabled = true }
  }, [gl, camera, controls, pos])
  return null
}

export default function Page() {
  const pos = React.useRef(0)
  React.useEffect(() => { (window as any).__fp = pos }, [])
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0b0e16' }}>
      <div style={{ position: 'absolute', zIndex: 10, top: 12, left: 12, color: '#cdd6f4', font: '13px sans-serif', background: '#0008', padding: '8px 12px', borderRadius: 8 }}>
        Pelao + acordeón rigged. Arrastra la caja de bajos (izq↔der) para abrir/cerrar. Orbita con clic en vacío.
      </div>
      <Canvas camera={{ fov: 35 }} dpr={[1, 1.5]}>
        <EnvLocal />
        <ambientLight intensity={0.2} />
        <directionalLight position={[-3.2, 4.2, 3.0]} intensity={2.2} color="#ffe7c9" />
        <directionalLight position={[3.5, 1.8, 2.5]} intensity={0.5} color="#d4e2ff" />
        <directionalLight position={[1.8, 4.0, -3.5]} intensity={1.8} color="#ffd2a1" />
        <React.Suspense fallback={null}>
          <Escena pos={pos} />
          <ArrastreFuelle pos={pos} />
        </React.Suspense>
        <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
      </Canvas>
    </div>
  )
}
