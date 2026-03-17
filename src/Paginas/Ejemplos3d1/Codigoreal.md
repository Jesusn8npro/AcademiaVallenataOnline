import * as THREE from 'three'
import { useRef, useState } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

extend({ MeshLineGeometry, MeshLineMaterial })

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 13], fov: 25 }}>
      <Physics debug interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
        <Band />
      </Physics>
    </Canvas>
  )
}

function Band() {
  const band = useRef(), fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef() // prettier-ignore
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3() // prettier-ignore
  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]))
  const [dragged, drag] = useState(false)

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]) // prettier-ignore
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]) // prettier-ignore

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
        ;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }
    if (fixed.current) {
      // Calculate catmul curve      
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.translation())
      curve.points[2].copy(j1.current.translation())
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))
      // Tilt it back towards the screen
      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
    }
  })

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} angularDamping={2} linearDamping={2} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} angularDamping={2} linearDamping={2}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} angularDamping={2} linearDamping={2}>
          <BallCollider args={[0.1]} />
        </RigidBody >
        <RigidBody position={[1.5, 0, 0]} ref={j3} angularDamping={2} linearDamping={2}>
          <BallCollider args={[0.1]} />
        </RigidBody >
        <RigidBody position={[2, 0, 0]} ref={card} angularDamping={2} linearDamping={2} type={dragged ? 'kinematicPosition' : 'dynamic'} >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <mesh
            onPointerUp={(e) => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={(e) => (e.target.setPointerCapture(e.pointerId), drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation()))))}>
            <planeGeometry args={[0.8 * 2, 1.125 * 2]} />
            <meshBasicMaterial transparent opacity={0.25} color="white" side={THREE.DoubleSide} />
          </mesh>
        </RigidBody >
      </group >
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial transparent opacity={0.25} color="white" depthTest={false} resolution={[width, height]} lineWidth={1} />
      </mesh>
    </>
  )
}

import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')).render(<App />)


* {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background-color: #111;
}



import * as THREE from 'three'
import { useRef, useState } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'


extend({ MeshLineGeometry, MeshLineMaterial })


export default function App() {
  return (
    <Canvas>
      <Physics>
        {/* ... */}
      </Physics>
    </Canvas>
  )
}


function Band() {
  // References for the band and the joints
  const band = useRef()
  const fixed = useRef()
  const j1 = useRef()
  const j2 = useRef()
  const j3 = useRef()
  // Canvas size
  const { width, height } = useThree((state) => state.size)
  // A Catmull-Rom curve
  const [curve] = useState(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()
  ]))


    useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])


    useFrame(() => {
    curve.points[0].copy(j3.current.translation())
    curve.points[1].copy(j2.current.translation())
    curve.points[2].copy(j1.current.translation())
    curve.points[3].copy(fixed.current.translation())
    band.current.geometry.setPoints(curve.getPoints(32))
  })


    return (
    <>
      <RigidBody ref={fixed} type="fixed" />
      <RigidBody position={[0.5, 0, 0]} ref={j1}>
        <BallCollider args={[0.1]} />
      </RigidBody>
      <RigidBody position={[1, 0, 0]} ref={j2}>
        <BallCollider args={[0.1]} />
      </RigidBody >
      <RigidBody position={[1.5, 0, 0]} ref={j3}>
        <BallCollider args={[0.1]} />
      </RigidBody >
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial color="white" resolution={[width, height]} lineWidth={1} />
      </mesh>
    </>
  )
}


  const card = useRef()
  const vec = new THREE.Vector3()
  const ang = new THREE.Vector3()
  const rot = new THREE.Vector3()
  const dir = new THREE.Vector3()
  const [dragged, drag] = useState(false)

  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]])


    useFrame((state) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      card.current.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }

    // Calculate Catmull curve      
    curve.points[0].copy(j3.current.translation())
    curve.points[1].copy(j2.current.translation())
    curve.points[2].copy(j1.current.translation())
    curve.points[3].copy(fixed.current.translation())
    band.current.geometry.setPoints(curve.getPoints(32))
    // Tilt the card back towards the screen
    ang.copy(card.current.angvel())
    rot.copy(card.current.rotation())
    card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z })
  })


        <RigidBody ref={card} type={dragged ? 'kinematicPosition' : 'dynamic'} >
        <CuboidCollider args={[0.8, 1.125, 0.01]} />
        <mesh
          onPointerUp={(e) => drag(false)}
          onPointerDown={(e) => drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))}>
          <planeGeometry args={[0.8 * 2, 1.125 * 2]} />
          <meshBasicMaterial color="white" side={THREE.DoubleSide} />
        </mesh>
      </RigidBody>


      <PerspectiveCamera makeDefault manual aspect={1.05} position={[0.49, 0.22, 2]} />
<mesh>
  <planeGeometry args={[planeWidth, -planeWidth / textureAspect]} />
  <meshBasicMaterial transparent alphaMap={texture} side={THREE.BackSide} />
</mesh>



<Center bottom right>
  <Resize key={resizeId} maxHeight={0.45} maxWidth={0.925}>
    <Text3D
      bevelEnabled={false}
      bevelSize={0}
      font="/ship/2024/badge/Geist_Regular.json"
      height={0}
      rotation={[0, Math.PI, Math.PI]}>
      {user.firstName}
    </Text3D>
    <Text3D
      bevelEnabled={false}
      bevelSize={0}
      font="/ship/2024/badge/Geist_Regular.json"
      height={0}
      position={[0, 1.4, 0]}
      rotation={[0, Math.PI, Math.PI]}>
      {user.lastName}
    </Text3D>
  </Resize>
</Center>


<mesh geometry={nodes.card.geometry}>
  <meshPhysicalMaterial
    clearcoat={1}
    clearcoatRoughness={0.15}
    iridescence={1}
    iridescenceIOR={1}
    iridescenceThicknessRange={[0, 2400]}
    metalness={0.5}
    roughness={0.3}
  >
    <RenderTexture attach="map" height={2000} width={2000}>
      <BadgeTexture user={user} />
    </RenderTexture>
  </meshPhysicalMaterial>
</mesh>