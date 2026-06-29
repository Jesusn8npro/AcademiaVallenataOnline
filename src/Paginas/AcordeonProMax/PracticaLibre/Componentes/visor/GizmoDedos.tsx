'use client'
import * as React from 'react'
import * as THREE from 'three'
import { TransformControls } from '@react-three/drei'
import type { HuesosPose } from '../../Servicios/servicioPosesDedos'

// Gizmo 3D para posar el hueso seleccionado del brazo derecho (editor admin de poses de dedos). Vive
// DENTRO del Canvas → recibe todo por PROPS (el contexto de React no cruza al reconciliador de R3F).
// Mientras editas, el frame congela la mano en `edicionPoseRef`; aquí se rota el hueso con la manija y
// cada cambio se vuelca a `edicionPoseRef` → lo que se ve es lo que se guarda. (drei desactiva solo el
// OrbitControls `makeDefault` mientras arrastras la manija.)
const GizmoDedos: React.FC<{
  editando: boolean
  huesoSel: string
  bonesDedosRef: React.MutableRefObject<Record<string, THREE.Object3D>>
  edicionPoseRef: React.MutableRefObject<HuesosPose>
  onAntesDeMover: () => void
}> = ({ editando, huesoSel, bonesDedosRef, edicionPoseRef, onAntesDeMover }) => {
  const bone = editando ? bonesDedosRef.current[huesoSel] : null
  if (!bone) return null

  const capturar = () => {
    const q = bone.quaternion
    edicionPoseRef.current = { ...edicionPoseRef.current, [huesoSel]: [q.x, q.y, q.z, q.w] }
  }

  // onMouseDown = antes de arrastrar → guarda el estado para Deshacer.
  return <TransformControls object={bone} mode="rotate" space="local" size={0.9} onMouseDown={onAntesDeMover} onObjectChange={capturar} />
}

export default GizmoDedos
