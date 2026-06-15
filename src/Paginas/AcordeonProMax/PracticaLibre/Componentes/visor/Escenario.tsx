'use client'
import * as React from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { ESCENARIOS_GLB } from './escenarios'
import type { PosEscenario } from '../../Servicios/servicioEscenarioPos'

// Escenarios "de código" (primitivas, cero descarga) sobre los que se para el personaje. El piso
// SIEMPRE tiene su cara superior en y=0 → el personaje (anclado por los pies a y=0) calza natural.
// 'estudio' = .glb real (infinity cove, ya exportado con su piso en y=0). El resto son placeholders.
// Los .glb reales (concierto/neon/tarima-led/playa) usan ESCENARIOS_GLB (config por defecto) que el
// admin puede sobreescribir en vivo con `pos` (posición fija guardada en Supabase).
export function Escenario({ id, pos }: { id: string; pos?: PosEscenario | null }) {
  if (id === 'estudio') return <EstudioCove />
  if (id === 'tarima') return <Tarima />
  if (id === 'plaza') return <Plaza />
  const def = ESCENARIOS_GLB[id]
  if (def) {
    const escala = pos?.escala ?? def.escala
    const offset: [number, number, number] = pos ? [pos.x, pos.y, pos.z] : def.offset
    const rotY = pos ? pos.rotY : def.rotY
    const autoPiso = pos ? pos.autoPiso : def.autoPiso
    return <EscenarioGLBNorm key={id} glb={def.glb} escala={escala} offset={offset} rotY={rotY} autoPiso={autoPiso} />
  }
  return null
}
;(Object.values(ESCENARIOS_GLB)).forEach((e) => useGLTF.preload(e.glb))

// Altura de la superficie PISABLE más alta del escenario justo bajo el personaje (origen): raycast hacia
// abajo y nos quedamos con el impacto más alto cuya normal mira hacia ARRIBA (piso/plataforma), ignorando
// techos y caras inferiores (normal hacia abajo). Devuelve null si no hay piso sobre el origen.
const _ray = new THREE.Raycaster()
const _nm = new THREE.Matrix3()
const _n = new THREE.Vector3()
function superficiePisable(grupo: THREE.Object3D, desdeY: number): number | null {
  _ray.set(new THREE.Vector3(0, desdeY, 0), new THREE.Vector3(0, -1, 0))
  const hits = _ray.intersectObject(grupo, true)
  let top: number | null = null
  for (const h of hits) {
    if (!h.face) continue
    _nm.getNormalMatrix(h.object.matrixWorld)
    const ny = _n.copy(h.face.normal).applyNormalMatrix(_nm).normalize().y
    if (ny > 0.4 && (top === null || h.point.y > top)) top = h.point.y // cara hacia arriba = pisable
  }
  return top
}

function EscenarioGLBNorm({ glb, escala = 1, offset = [0, 0, 0], rotY = 0, autoPiso = true }: { glb: string; escala?: number; offset?: [number, number, number]; rotY?: number; autoPiso?: boolean }) {
  const { scene } = useGLTF(glb)
  const obj = React.useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o: any) => { if (o.isMesh) o.receiveShadow = true }) // recibe la sombra del personaje
    return c
  }, [scene])
  const ref = React.useRef<THREE.Group>(null!)
  React.useLayoutEffect(() => {
    const g = ref.current
    if (!g) return
    g.position.set(0, 0, 0); g.rotation.set(0, rotY, 0); g.scale.setScalar(escala)
    g.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(g)
    if (box.isEmpty()) return
    const c = box.getCenter(new THREE.Vector3())
    // 1) centra en XZ sobre el punto de parado (offset XZ corre el escenario para elegir el spot).
    g.position.set(-c.x + offset[0], -box.min.y, -c.z + offset[2])
    g.updateWorldMatrix(true, true)
    // 2) ATERRIZA: pone la plataforma pisable bajo el personaje en y=0 (robusto ante geometría outlier y
    //    techos). offset[1] queda como ajuste fino vertical sobre eso. autoPiso=false → solo offset manual
    //    (para mallas únicas gigantes donde el raycast agarra superficies altas equivocadas).
    if (autoPiso) {
      const surfY = superficiePisable(g, box.max.y - box.min.y + 5)
      if (surfY !== null) g.position.y -= surfY
    } else {
      g.position.y += offset[1] // altura MANUAL: solo cuando el aterrizaje automático está apagado
    }
  }, [obj, escala, rotY, offset, autoPiso])
  return <group ref={ref}><primitive object={obj} /></group>
}

// Estudio "High-End Minimalist": domo/túnel abovedado con costillas, video wall curvo emissive
// ("ACADEMIA VALLENATA ONLINE"), escenario circular y luces de piso cálidas (~8.9k tris, PBR, Y-up,
// piso en y=0). La iluminación de relleno NO viaja en el GLB (el personaje se mueve): el video wall
// y las luces de piso son emissive (KHR_materials_emissive_strength), y el rig 3-point en tiempo
// real del visor ilumina al personaje. Hecho en Estudio-Personaje.blend.
function EstudioCove() {
  const { scene } = useGLTF('/modelos3d/estudio-domo-v1.glb')
  return <primitive object={scene} />
}
useGLTF.preload('/modelos3d/estudio-domo-v1.glb')

// Tarima de concierto: piso de madera (top en y=0) + telón cálido de fondo + dos paneles laterales.
function Tarima() {
  return (
    <group>
      {/* piso de madera: caja de 0.2 de alto centrada en y=-0.1 → cara superior en y=0 */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[6, 0.2, 5]} />
        <meshStandardMaterial color="#6b4a2f" roughness={0.85} metalness={0} />
      </mesh>
      {/* telón de fondo (mira hacia la cámara) */}
      <mesh position={[0, 2.4, -2.4]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial color="#3a1d24" roughness={1} />
      </mesh>
      {/* paneles laterales sutiles */}
      <mesh position={[-3, 2.4, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[4, 5]} />
        <meshStandardMaterial color="#2c161c" roughness={1} />
      </mesh>
      <mesh position={[3, 2.4, -0.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[4, 5]} />
        <meshStandardMaterial color="#2c161c" roughness={1} />
      </mesh>
    </group>
  )
}

// Plaza exterior: disco de piedra claro al nivel del suelo (y=0) + un anillo de borde.
function Plaza() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[8, 48]} />
        <meshStandardMaterial color="#cdbf9e" roughness={1} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[2.2, 2.5, 48]} />
        <meshStandardMaterial color="#a8916a" roughness={1} />
      </mesh>
    </group>
  )
}
