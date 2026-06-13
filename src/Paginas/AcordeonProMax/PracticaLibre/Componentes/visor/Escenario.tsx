'use client'
import * as React from 'react'
import { useGLTF } from '@react-three/drei'

// Escenarios "de código" (primitivas, cero descarga) sobre los que se para el personaje. El piso
// SIEMPRE tiene su cara superior en y=0 → el personaje (anclado por los pies a y=0) calza natural.
// 'estudio' = .glb real (infinity cove, ya exportado con su piso en y=0). El resto son placeholders.
export function Escenario({ id }: { id: string }) {
  if (id === 'estudio') return <EstudioCove />
  if (id === 'tarima') return <Tarima />
  if (id === 'plaza') return <Plaza />
  return null
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
