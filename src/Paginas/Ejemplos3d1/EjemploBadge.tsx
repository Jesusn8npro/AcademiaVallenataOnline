import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { 
  Environment, 
  Lightformer, 
  Text,
  ContactShadows,
  useCursor,
  Edges
} from '@react-three/drei'
import { 
  BallCollider, 
  CuboidCollider, 
  Physics, 
  RigidBody, 
  useRopeJoint, 
  useSphericalJoint 
} from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

extend({ MeshLineGeometry, MeshLineMaterial })

export default function EjemploBadge() {
  return (
    <div style={{ width: '100%', height: '100vh', background: 'radial-gradient(circle at center, #222 0%, #000 100%)' }}>
      <Canvas shadows camera={{ position: [0, 0, 13], fov: 25 }}>
        <color attach="background" args={['#000']} />
        <ambientLight intensity={0.5} />
        
        {/* Luces de estudio idénticas al demo de Vercel */}
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        
        <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
          <Band />
        </Physics>

        <Environment blur={0.75}>
          <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={3} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[10, 2, 1]} />
          <Lightformer intensity={3} rotation-y={Math.PI / 2} position={[-20, 1, 1]} scale={[20, 0.5, 1]} />
          <Lightformer intensity={3} rotation-y={-Math.PI / 2} position={[20, 1, 1]} scale={[20, 0.5, 1]} />
        </Environment>
        
        <ContactShadows opacity={0.6} scale={10} blur={2.5} far={10} resolution={256} color="#000" />
      </Canvas>
      
      {/* Overlay de interfaz en Español */}
      <div style={{ position: 'absolute', top: 40, left: 40, color: 'white', fontFamily: 'Inter, sans-serif', pointerEvents: 'none' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '2px', color: '#D662AD', marginBottom: '5px' }}>V-PRO DIGITAL</h1>
        <p style={{ opacity: 0.7, fontSize: '0.9rem', letterSpacing: '1px' }}>EXPERIENCIA 3D INTERACTIVA</p>
      </div>

      <div style={{ position: 'absolute', bottom: 40, right: 40, color: 'rgb(214, 98, 173)', opacity: 0.8, fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', letterSpacing: '1px' }}>
        ARRASTRA PARA SENTIR LA FÍSICA
      </div>
    </div>
  )
}

function Band() {
  const band = useRef<any>(), fixed = useRef<any>(), j1 = useRef<any>(), j2 = useRef<any>(), j3 = useRef<any>(), card = useRef<any>() // prettier-ignore
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3() // prettier-ignore
  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]))
  const [dragged, drag] = useState<THREE.Vector3 | false>(false)
  const [hovered, hover] = useState(false)
  useCursor(hovered)

  // Uniones físicas exactas
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1.2])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1.2])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1.2])
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]])

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z })
    }
    if (fixed.current) {
      // Cálculo de animación de cuerda
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.translation())
      curve.points[2].copy(j1.current.translation())
      curve.points[3].copy(fixed.current.translation())
      band.current.geometry.setPoints(curve.getPoints(32))
      
      // Estabilización de inclinación más suave para permitir más giros
      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.05, z: ang.z })
    }
  })

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} angularDamping={0.5} linearDamping={0.5} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} angularDamping={0.5} linearDamping={0.5}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} angularDamping={0.5} linearDamping={0.5}>
          <BallCollider args={[0.1]} />
        </RigidBody >
        <RigidBody position={[1.5, 0, 0]} ref={j3} angularDamping={0.5} linearDamping={0.5}>
          <BallCollider args={[0.1]} />
        </RigidBody >
        
        <RigidBody 
          position={[2, 0, 0]} 
          ref={card} 
          angularDamping={0.4} 
          linearDamping={0.4} 
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: any) => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={(e: any) => (e.target.setPointerCapture(e.pointerId), drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation()))))}
          >
            {/* CUERPO DE LA TARJETA CON BORDES DEFINIDOS */}
            <mesh castShadow receiveShadow>
              <planeGeometry args={[1.6, 2.25]} />
              <meshPhysicalMaterial 
                color="#050505" 
                metalness={0.9} 
                roughness={0.1} 
                clearcoat={1} 
                clearcoatRoughness={0.05}
                iridescence={1}
                iridescenceIOR={1.6}
                iridescenceThicknessRange={[100, 500]}
                side={THREE.DoubleSide} 
              />
              {/* LÍNEA BLANCA DEL BORDE PARA DIFERENCIAR DEL FONDO */}
              <Edges scale={1.0} threshold={15} color="#ffffff" />
            </mesh>

            {/* Contenido de la tarjeta en Español */}
            <group position={[0, 0, 0.02]}>
               <mesh position={[0, 0.65, 0]}>
                 <circleGeometry args={[0.25, 32]} />
                 <meshBasicMaterial color="#D662AD" />
               </mesh>
               <Text position={[0, 0.15, 0]} fontSize={0.11} color="white" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf">
                 ACADEMIA VALLENATA
               </Text>
               <Text position={[0, -0.15, 0]} fontSize={0.28} fontWeight="bold" color="white" letterSpacing={-0.02}>
                 V-PRO
               </Text>
               <Text position={[0, -0.45, 0]} fontSize={0.07} color="#D662AD" letterSpacing={0.3}>
                 ACORDEONISTA ÉLITE
               </Text>
               
               {/* Código QR Simulado */}
               <mesh position={[0, -0.8, 0]}>
                 <planeGeometry args={[0.3, 0.3]} />
                 <meshBasicMaterial color="white" />
               </mesh>
            </group>

            {/* Reverso de la tarjeta (Limpio) */}
            <mesh position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[1.6, 2.25]} />
              <meshStandardMaterial color="#111" metalness={1} roughness={0} />
              <Edges scale={1.0} threshold={15} color="#ffffff" />
            </mesh>
          </group>
        </RigidBody >
      </group >

      {/* LÍNEA QUE SOSTIENE EL CARNET (Visible y Fuerte) */}
      <mesh ref={band}>
        {/* @ts-ignore */}
        <meshLineGeometry />
        {/* @ts-ignore */}
        <meshLineMaterial 
          transparent 
          opacity={0.8} 
          color="#ffffff" 
          depthTest={false} 
          resolution={[width, height]} 
          lineWidth={0.2} 
        />
      </mesh>
    </>
  )
}
