'use client'
import * as React from 'react'
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber'
import { useGLTF, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// /test-personaje-3d — ACORDEON COMPARTIDO: un solo acordeon para TODOS los personajes.
// Como todos los cuerpos estan posados igual gripando el acordeon en la misma pose, el acordeon se
// relaciona identico con cada cuerpo en el marco del ANCLA (parrilla). Por eso:
//   - 1 acordeon compartido (acordeon-compartido-v1.glb), exportado en marco-ancla.
//   - cada cuerpo SOLO (sin acordeon), tambien en marco-ancla.
//   - aqui se montan ambos en el mismo grupo (identidad) => la mano queda pegada igual que en Blender.
// Actualizas el acordeon (textura/forma) -> re-exportas SOLO ese 1 archivo -> global para todos.
const ACORDEON = '/modelos3d/acordeon-compartido-v1.glb?v=1b'
const BODIES: Record<string, string> = {
  pelao: '/modelos3d/pelao-cuerpo-v1.glb?v=1',
  muchacha: '/modelos3d/muchacha-cuerpo-v1.glb?v=1',
  sudadera: '/modelos3d/sudadera-cuerpo-v1.glb?v=1',
  gris: '/modelos3d/gris-cuerpo-v1.glb?v=1',
  rojo: '/modelos3d/rojo-cuerpo-v1.glb?v=1',
  vacana: '/modelos3d/vacana-cuerpo-v1.glb?v=1',
}
useGLTF.setDecoderPath('/draco/')

const EnvmapLocal: React.FC = () => {
  const { gl, scene } = useThree()
  React.useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const tex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = tex
    return () => { tex.dispose(); pmrem.dispose(); scene.environment = null }
  }, [gl, scene])
  return null
}

function arreglarMateriales(scene: THREE.Object3D) {
  scene.traverse((o: any) => {
    if (!o.isMesh) return
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    for (const m of mats) {
      if (!m) continue
      const nm: string = m.name || ''
      const necesitaAlpha = /hair|eyelash|beard|pesta|cabello/i.test(nm)
      if (/botones/i.test(nm)) { m.transparent = false; m.opacity = 1; m.depthWrite = true }
      else if (!necesitaAlpha && m.transparent && (m.opacity ?? 1) >= 0.98) { m.transparent = false; m.opacity = 1; m.depthWrite = true }
      if (/^acc_/.test(nm) && m.map && m.metalness === 1) { m.metalness = 0.0; if ((m.roughness ?? 1) > 0.95) m.roughness = 0.55 }
      if (/fuelle/i.test(nm)) m.side = THREE.DoubleSide
      m.needsUpdate = true
    }
  })
}

const Piso: React.FC<{ children: React.ReactNode; frameKey: string }> = ({ children, frameKey }) => {
  const ref = React.useRef<THREE.Group>(null!)
  React.useEffect(() => {
    let raf = 0
    // Muestrea los vértices del CUERPO (ignora acordeón ACC_/parrilla). Las mallas Mixamo/CC tienen
    // una "cola" de vértices estirados en z que infla el bbox -> centramos por MEDIANA (el grueso del
    // cuerpo) y escalamos por la ALTURA robusta (percentiles), inmune a esa cola.
    const pct = (arr: number[], p: number) => arr[Math.floor(p * (arr.length - 1))]
    const muestrear = (g: THREE.Object3D) => {
      const xs: number[] = [], ys: number[] = [], zs: number[] = []
      const v = new THREE.Vector3()
      g.traverse((o: any) => {
        if (!o.isMesh) return
        const n: string = o.name || ''
        if (/^ACC_/.test(n) || n === 'parrilla') return
        const pos = o.geometry.attributes.position
        if (!pos) return
        const step = Math.max(1, Math.floor(pos.count / 2000))
        for (let i = 0; i < pos.count; i += step) {
          v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld)
          xs.push(v.x); ys.push(v.y); zs.push(v.z)
        }
      })
      xs.sort((a, b) => a - b); ys.sort((a, b) => a - b); zs.sort((a, b) => a - b)
      return { xs, ys, zs }
    }
    const medir = (): boolean => {
      const g = ref.current
      if (!g) return false
      g.scale.setScalar(1); g.position.set(0, 0, 0); g.updateWorldMatrix(true, true)
      let m = muestrear(g)
      if (!m.ys.length) return false
      const h = pct(m.ys, 0.97) - pct(m.ys, 0.03)   // altura robusta del cuerpo
      g.scale.setScalar(1.7 / (h || 1))
      g.updateWorldMatrix(true, true)
      m = muestrear(g)
      g.traverse((o: any) => { if (o.isMesh) o.castShadow = true })
      const cx = pct(m.xs, 0.5), cz = pct(m.zs, 0.5), minY = pct(m.ys, 0.03)  // mediana x/z, pie robusto
      g.position.x = -cx; g.position.z = -cz; g.position.y = -minY
      return true
    }
    // re-medir durante ~50 frames: evita la condición de carrera (las matrices del modelo se estabilizan
    // tras varios frames). La última medición, con todo cargado, es la que queda.
    let medidos = 0
    const tick = () => {
      if (medir()) medidos++
      if (medidos < 50) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [frameKey])
  return <group ref={ref}>{children}</group>
}

// Acordeon compartido (se carga una sola vez). Anclado en origen (marco-ancla).
const AcordeonCompartido: React.FC = () => {
  const { scene } = useGLTF(ACORDEON) as any
  React.useEffect(() => { arreglarMateriales(scene) }, [scene])
  return <primitive object={scene} />
}

// Cuerpo del personaje seleccionado (sin acordeon), tambien en marco-ancla.
const Cuerpo: React.FC<{ glb: string }> = ({ glb }) => {
  const { scene } = useGLTF(glb) as any
  React.useEffect(() => { arreglarMateriales(scene) }, [scene])
  return <primitive object={scene} />
}

const VisorPelaoFuelleLibre: React.FC = () => {
  const [slug, setSlug] = React.useState<keyof typeof BODIES>('muchacha')
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas shadows camera={{ position: [0, 1.15, 4.2], fov: 35 }} dpr={[1, 1.25]} gl={{ preserveDrawingBuffer: true }}>
        <React.Suspense fallback={null}>
          <EnvmapLocal />
          <ambientLight intensity={0.16} />
          <directionalLight position={[-3.2, 4.2, 3.0]} intensity={2.2} color="#ffe7c9" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-near={0.5} shadow-camera-far={16} shadow-camera-left={-3.5} shadow-camera-right={3.5} shadow-camera-top={4} shadow-camera-bottom={-3.5} shadow-bias={-0.0004} shadow-normalBias={0.02} />
          <directionalLight position={[3.5, 1.8, 2.5]} intensity={0.5} color="#d4e2ff" />
          <directionalLight position={[1.8, 4.0, -3.5]} intensity={2.4} color="#ffd2a1" />
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} receiveShadow><planeGeometry args={[10, 10]} /><shadowMaterial transparent opacity={0.3} /></mesh>
          <Piso frameKey={slug}>
            <Cuerpo glb={BODIES[slug]} />
            <AcordeonCompartido />
          </Piso>
          <OrbitControls makeDefault enablePan target={[0, 1, 0]} minDistance={0.6} maxDistance={20} enableDamping dampingFactor={0.1} />
        </React.Suspense>
      </Canvas>
      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 'calc(100% - 32px)' }}>
        {(Object.keys(BODIES) as (keyof typeof BODIES)[]).map((k) => (
          <button key={k} onClick={() => setSlug(k)} style={{ padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'system-ui', fontSize: 13, fontWeight: 600, background: slug === k ? '#ff7a18' : 'rgba(0,0,0,.5)', color: '#fff', textTransform: 'capitalize' }}>{k}</button>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 16, bottom: 16, background: 'rgba(0,0,0,.55)', padding: '10px 16px', borderRadius: 12, color: '#fff', fontFamily: 'system-ui', fontSize: 12, opacity: 0.85 }}>
        🪗 Acordeón compartido (1 archivo para los 6). Actualizas ese archivo → cambia en todos.
      </div>
    </div>
  )
}

export default VisorPelaoFuelleLibre
