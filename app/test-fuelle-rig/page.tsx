'use client'
import * as React from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls } from '@react-three/drei'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as THREE from 'three'

// POC robusto (GLB con JERARQUÍA real de Blender): la "Caja de los bajos" es UN nodo con sus 20 hijos
// -> se mueve como bloque, imposible que se separe. El fuelle (Fuelle20 skinned a 39 huesos) se arquea
// por la curva Bézier real de Blender entre la parrilla (fija) y la caja de bajos (que mueves).
// Agarras la bola (extremo de bajos): mueves el NODO de la caja + manejo los huesos. Cara siempre pegada.
const GLB = '/modelos3d/acordeon-rig-jerarquia-v1.glb'
const HLEN = 3.77 // longitud de handle Bézier medida en tu Blender
useGLTF.setDecoderPath('/draco/')
const norm = (s: string) => (s || '').replace(/[^a-z0-9]/gi, '').toLowerCase()

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

type Rest = {
  bones: THREE.Bone[]
  frac: number[]
  restDir: THREE.Vector3[]
  restWorldQuat: THREE.Quaternion[]
  restWorldScale: THREE.Vector3[]
  scratch: THREE.Vector3[]
  P0: THREE.Vector3
  P1: THREE.Vector3
  dirEnd: THREE.Vector3
  endRest: THREE.Vector3
  cajaNode: THREE.Object3D | null
  cajaRestWorld: THREE.Vector3
}

function Fuelle({ ctrlRef }: { ctrlRef: React.MutableRefObject<THREE.Object3D | null> }) {
  const { scene } = useGLTF(GLB) as any
  const { camera, controls } = useThree() as any
  const rest = React.useRef<Rest | null>(null)

  React.useLayoutEffect(() => {
    scene.traverse((o: any) => { if (o.isMesh) { const m = Array.isArray(o.material) ? o.material : [o.material]; for (const x of m) if (x) x.side = THREE.DoubleSide } })
    scene.updateMatrixWorld(true)

    const byName: Record<string, THREE.Bone> = {}
    scene.traverse((o: any) => { if (o.isBone) byName[o.name] = o })
    const bones: THREE.Bone[] = []
    for (let i = 0; i <= 18; i++) { const b = byName['C' + String(i).padStart(2, '0')]; if (b) bones.push(b) }
    if (byName['R19']) bones.push(byName['R19'])
    if (bones.length < 3) return

    const head = bones.map((b) => b.getWorldPosition(new THREE.Vector3()))
    const restWorldQuat = bones.map((b) => b.getWorldQuaternion(new THREE.Quaternion()))
    const restWorldScale = bones.map((b) => b.getWorldScale(new THREE.Vector3()))
    const restDir: THREE.Vector3[] = []
    for (let i = 0; i < bones.length; i++) {
      const a = head[i], b = head[Math.min(i + 1, bones.length - 1)]
      const d = b.clone().sub(a)
      if (d.lengthSq() < 1e-9 && i > 0) d.copy(restDir[i - 1]); else d.normalize()
      restDir.push(d)
    }
    const seg: number[] = [0]
    for (let i = 1; i < head.length; i++) seg.push(seg[i - 1] + head[i].distanceTo(head[i - 1]))
    const total = seg[seg.length - 1] || 1
    const frac = seg.map((s) => s / total)

    const P0 = head[0].clone()
    const P1 = P0.clone().addScaledVector(restDir[0], HLEN)
    const dirEnd = restDir[bones.length - 2].clone()
    // extremo de bajos = la CARA DE CONEXIÓN real (Ancla_Fuelle_Bajos, hija de la caja), NO R19.
    // Así el fuelle termina EXACTO en la caja (sin hueco) y el ancla se mueve con la caja.
    let anclaB: THREE.Object3D | null = null
    scene.traverse((o: any) => { if (!anclaB && /anclafuellebajos/.test(norm(o.name))) anclaB = o })
    const endRest = anclaB ? (anclaB as THREE.Object3D).getWorldPosition(new THREE.Vector3()) : head[head.length - 1].clone()

    // nodo de la caja de bajos (UN solo nodo con sus hijos)
    let cajaNode: THREE.Object3D | null = null
    scene.traverse((o: any) => { if (!cajaNode && /cajadelosbajos/.test(norm(o.name)) && (o.children || []).length > 3) cajaNode = o })
    const cajaRestWorld = cajaNode ? (cajaNode as THREE.Object3D).getWorldPosition(new THREE.Vector3()) : endRest.clone()

    rest.current = { bones, frac, restDir, restWorldQuat, restWorldScale, scratch: head.map(() => new THREE.Vector3()), P0, P1, dirEnd, endRest, cajaNode, cajaRestWorld }

    const box = new THREE.Box3().setFromObject(scene)
    const c = box.getCenter(new THREE.Vector3()); const s = box.getSize(new THREE.Vector3())
    const dist = Math.max(s.x, s.y, s.z) * 1.6
    camera.position.set(c.x, c.y + s.y * 0.05, c.z + dist)
    camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix(); camera.lookAt(c)
    if (controls) { controls.target.copy(c); controls.update() }
    ;(window as any).__acc = scene
    ;(window as any).__rest = rest.current
  }, [scene, camera, controls])

  const end = React.useRef(new THREE.Vector3()).current
  const delta = React.useRef(new THREE.Vector3()).current
  const tan = React.useRef(new THREE.Vector3()).current
  const dQ = React.useRef(new THREE.Quaternion()).current
  const wQ = React.useRef(new THREE.Quaternion()).current
  const pInv = React.useRef(new THREE.Matrix4()).current
  const m4 = React.useRef(new THREE.Matrix4()).current
  const sTmp = React.useRef(new THREE.Vector3()).current
  const wTmp = React.useRef(new THREE.Vector3()).current
  const cp2 = React.useRef(new THREE.Vector3()).current
  const bez = React.useRef(new THREE.CubicBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3())).current

  useFrame(() => {
    const R = rest.current; if (!R) return
    if (ctrlRef.current) ctrlRef.current.getWorldPosition(end); else end.copy(R.endRest)
    delta.copy(end).sub(R.endRest)
    // mover el NODO de la caja de bajos (todo el bloque) por traslación
    if (R.cajaNode) {
      wTmp.copy(R.cajaRestWorld).add(delta)
      if (R.cajaNode.parent) R.cajaNode.parent.worldToLocal(wTmp)
      R.cajaNode.position.copy(wTmp)
      R.cajaNode.updateMatrixWorld(true)
    }
    // Bézier fiel: P0,P1 fijos (parrilla); P3=extremo bajos (end); P2=end - tangente_reposo*HLEN
    cp2.copy(end).addScaledVector(R.dirEnd, -HLEN)
    bez.v0.copy(R.P0); bez.v1.copy(R.P1); bez.v2.copy(cp2); bez.v3.copy(end)
    bez.updateArcLengths()
    const n = R.bones.length
    for (let i = 0; i < n; i++) bez.getPointAt(R.frac[i], R.scratch[i])
    for (let i = 0; i < n; i++) {
      const bone = R.bones[i]
      if (i < n - 1) tan.copy(R.scratch[i + 1]).sub(R.scratch[i]); else tan.copy(R.scratch[i]).sub(R.scratch[i - 1])
      if (tan.lengthSq() < 1e-9) tan.copy(R.restDir[i]); else tan.normalize()
      dQ.setFromUnitVectors(R.restDir[i], tan)
      wQ.copy(dQ).multiply(R.restWorldQuat[i])
      bone.parent!.updateWorldMatrix(true, false)
      pInv.copy(bone.parent!.matrixWorld).invert()
      m4.compose(R.scratch[i], wQ, R.restWorldScale[i])
      m4.premultiply(pInv)
      m4.decompose(bone.position, bone.quaternion, sTmp)
      bone.updateMatrixWorld(true)
    }
  })

  return <primitive object={scene} />
}

function ControlBajos({ ctrlRef }: { ctrlRef: React.MutableRefObject<THREE.Object3D | null> }) {
  const { camera, gl, controls } = useThree() as any
  const ref = React.useRef<THREE.Mesh>(null!)
  React.useEffect(() => {
    const R = (window as any).__rest as Rest | undefined
    if (R && R.endRest && ref.current) ref.current.position.copy(R.endRest)
    ctrlRef.current = ref.current
  })
  React.useEffect(() => {
    const dom = gl.domElement
    const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2()
    const plane = new THREE.Plane(); const hit = new THREE.Vector3(); const off = new THREE.Vector3(); const nrm = new THREE.Vector3()
    let drag = false
    const pick = (e: PointerEvent) => {
      const r = dom.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      return ray.intersectObject(ref.current, false).length > 0
    }
    const planeAt = (e: PointerEvent) => {
      const r = dom.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      camera.getWorldDirection(nrm)
      plane.setFromNormalAndCoplanarPoint(nrm, ref.current.position)
      ray.ray.intersectPlane(plane, hit)
      return hit
    }
    const onDown = (e: PointerEvent) => { if (e.button !== 0 || !pick(e)) return; drag = true; if (controls) controls.enabled = false; dom.style.cursor = 'grabbing'; off.copy(ref.current.position).sub(planeAt(e)) }
    const onMove = (e: PointerEvent) => { if (!drag) return; ref.current.position.copy(planeAt(e)).add(off) }
    const onUp = () => { drag = false; if (controls) controls.enabled = true; dom.style.cursor = '' }
    const onWheel = (e: WheelEvent) => { if (!pick(e as unknown as PointerEvent)) return; e.preventDefault(); camera.getWorldDirection(nrm); ref.current.position.addScaledVector(nrm, -Math.sign(e.deltaY) * 2) }
    dom.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp)
    dom.addEventListener('wheel', onWheel, { passive: false })
    return () => { dom.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); dom.removeEventListener('wheel', onWheel); if (controls) controls.enabled = true }
  }, [camera, gl, controls])
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[2.4, 18, 18]} />
      <meshStandardMaterial color="#ff7a18" emissive="#ff7a18" emissiveIntensity={0.5} />
    </mesh>
  )
}

export default function Page() {
  const ctrlRef = React.useRef<THREE.Object3D | null>(null)
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0b0e16' }}>
      <div style={{ position: 'absolute', zIndex: 10, top: 12, left: 12, color: '#cdd6f4', font: '13px sans-serif', background: '#0008', padding: '8px 12px', borderRadius: 8, maxWidth: 360 }}>
        GLB con jerarquía real: la caja de bajos es UN bloque. Agarra la <b>bola naranja</b> y muévela en cualquier
        dirección: la caja entera la sigue (no se separa) y el fuelle se arquea con los huesos, cara pegada. Rueda = adentro/afuera. Orbita en vacío.
      </div>
      <Canvas camera={{ fov: 35 }} dpr={[1, 1.5]}>
        <EnvLocal />
        <ambientLight intensity={0.18} />
        <directionalLight position={[-3.2, 4.2, 3.0]} intensity={2.2} color="#ffe7c9" />
        <directionalLight position={[3.5, 1.8, 2.5]} intensity={0.5} color="#d4e2ff" />
        <directionalLight position={[1.8, 4.0, -3.5]} intensity={1.6} color="#ffd2a1" />
        <React.Suspense fallback={null}>
          <Fuelle ctrlRef={ctrlRef} />
          <ControlBajos ctrlRef={ctrlRef} />
        </React.Suspense>
        <OrbitControls makeDefault enablePan enableDamping dampingFactor={0.1} />
      </Canvas>
    </div>
  )
}
