import * as THREE from 'three'
import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { 
  PerspectiveCamera, 
  Environment, 
  Lightformer, 
  Float, 
  ContactShadows, 
  RoundedBox, 
  Text,
  useCursor
} from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider, usePrismaticJoint } from '@react-three/rapier'

// --- COMPONENTE DE ONDAS DE SONIDO ---
function SoundWave({ position }: { position: THREE.Vector3 }) {
  const meshRef = useRef<any>()
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.x += delta * 4
      meshRef.current.scale.y += delta * 4
      meshRef.current.scale.z += delta * 4
      meshRef.current.material.opacity -= delta * 1.5
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#D662AD" transparent opacity={0.6} wireframe />
    </mesh>
  )
}

// --- EL FUELLE (CONCEPTUAL 3D) ---
function Bellows({ leftPos, rightPos }: { leftPos: number, rightPos: number }) {
  const meshRef = useRef<any>()
  const width = Math.abs(rightPos - leftPos)
  const midPoint = (leftPos + rightPos) / 2

  return (
    <mesh position={[midPoint, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[1.1, 1.1, width, 12, 10, true]} />
      <meshStandardMaterial 
        color="#111" 
        wireframe={false} 
        flatShading 
        metalness={0.5}
        roughness={0.5}
      />
    </mesh>
  )
}

// --- ACORDEÓN V-PRO PROTOTYPE ---
function VProAccordion() {
  const leftHandle = useRef<any>()
  const rightHandle = useRef<any>()
  const [leftX, setLeftX] = useState(-2)
  const [rightX, setRightX] = useState(2)
  const [waves, setWaves] = useState<any[]>([])
  const [dragged, setDragged] = useState<'left' | 'right' | null>(null)
  
  const vec = new THREE.Vector3()
  useCursor(!!dragged)

  useFrame((state) => {
    if (dragged === 'right' && rightHandle.current) {
      vec.set(state.pointer.x * 10, 0, 0)
      if (vec.x < leftX + 1) vec.x = leftX + 1 // Limite minimo
      if (vec.x > 8) vec.x = 8 // Limite maximo
      rightHandle.current.setNextKinematicTranslation({ x: vec.x, y: 0, z: 0 })
      setRightX(vec.x)
    }
    if (dragged === 'left' && leftHandle.current) {
      vec.set(state.pointer.x * 10, 0, 0)
      if (vec.x > rightX - 1) vec.x = rightX - 1
      if (vec.x < -8) vec.x = -8
      leftHandle.current.setNextKinematicTranslation({ x: vec.x, y: 0, z: 0 })
      setLeftX(vec.x)
    }
  })

  const emitWave = (pos: number) => {
    const id = Date.now()
    setWaves(prev => [...prev, { id, pos: new THREE.Vector3(pos, 0, 0) }])
    setTimeout(() => {
      setWaves(prev => prev.filter(w => w.id !== id))
    }, 1000)
  }

  return (
    <>
      <Physics gravity={[0, 0, 0]}>
        {/* PARTE IZQUIERDA (BAJOS) */}
        <RigidBody 
          ref={leftHandle} 
          type="kinematicPosition" 
          position={[leftX, 0, 0]}
          onPointerDown={() => setDragged('left')}
          onPointerUp={() => setDragged(null)}
        >
          <RoundedBox args={[1.5, 2.5, 1.2]} radius={0.1} smoothness={4} onClick={() => emitWave(leftX)}>
            <meshPhysicalMaterial color="#400" metalness={0.8} roughness={0.2} clearcoat={1} />
            <Text position={[0, 0, 0.61]} fontSize={0.15} color="white">BAJOS V-PRO</Text>
          </RoundedBox>
        </RigidBody>

        {/* PARTE DERECHA (PITOS) */}
        <RigidBody 
          ref={rightHandle} 
          type="kinematicPosition" 
          position={[rightX, 0, 0]}
          onPointerDown={() => setDragged('right')}
          onPointerUp={() => setDragged(null)}
        >
          <RoundedBox args={[1.5, 2.5, 1.2]} radius={0.1} smoothness={4} onClick={() => emitWave(rightX)}>
            <meshPhysicalMaterial color="#400" metalness={0.8} roughness={0.2} clearcoat={1} />
            <Text position={[0, 0, 0.61]} fontSize={0.15} color="white">TECLADO V-PRO</Text>
          </RoundedBox>
        </RigidBody>

        {/* FUELLE DINÁMICO */}
        <Bellows leftPos={leftX} rightPos={rightX} />
      </Physics>

      {/* ONDAS DE SONIDO */}
      {waves.map(w => <SoundWave key={w.id} position={w.pos} />)}
    </>
  )
}

export default function EjemploAcordeon3D() {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#050505' }}>
      <Canvas shadows camera={{ position: [0, 5, 15], fov: 35 }}>
        <color attach="background" args={['#050505']} />
        <PerspectiveCamera makeDefault position={[0, 5, 15]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        
        <VProAccordion />

        <Environment preset="city">
          <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
        </Environment>
        
        <ContactShadows opacity={0.4} scale={20} blur={2} far={10} color="#000" />
      </Canvas>

      <div style={{ position: 'absolute', top: 40, width: '100%', textAlign: 'center', color: 'white', fontFamily: 'Inter, sans-serif', pointerEvents: 'none' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '4px', color: '#D662AD' }}>V-PRO ACORDEÓN PROTOTYPE</h1>
        <p style={{ opacity: 0.6 }}>ARRASTRA LOS CABEZALES PARA ABRIR EL FUELLE | TOCA PARA GENERAR ONDAS</p>
      </div>
    </div>
  )
}
