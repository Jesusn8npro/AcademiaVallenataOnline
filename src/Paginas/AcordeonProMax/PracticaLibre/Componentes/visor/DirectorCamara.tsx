'use client'
import * as React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { subscribirNotas } from '../../../../../Core/audio/emisorNotasAcordeon'
import { TOMAS, TOMAS_AUTO, FOV_DEFAULT, TomaCamara } from './camaras'

const tomaPorId = (id: string): TomaCamara => TOMAS.find((t) => t.id === id) || TOMAS[0]

const _vPos = new THREE.Vector3()
const _vTar = new THREE.Vector3()
const CORTE_MS = 4500   // cada cuánto corta el director en modo auto (durante el replay)
const RATE = 3.5        // velocidad del tween de cámara (damp exponencial)
const TOCANDO_MS = 1500 // ventana tras la última nota para considerar "una grabación está sonando"
const IDLE_VOLVER_MS = 2500 // silencio tras el cual el director vuelve a la toma General

// Director de cámaras. Mueve la cámara + el target de OrbitControls hacia la toma seleccionada con un
// tween suave (lerp position+target+fov, luego controls.update() → no pelea con OrbitControls, que es
// idempotente sin input del usuario). En modo AUTO, mientras una grabación suena (detectado por el
// emisor de notas, sin acoplarse al componente de replay), corta entre tomas; en silencio vuelve a
// General. WebXR/primera persona = capa futura: un XR session tomaría la cámara aquí mismo.
export function DirectorCamara({ toma, auto }: { toma: string; auto: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const controls = useThree((s) => s.controls) as any
  const destino = React.useRef<TomaCamara>(TOMAS[0])
  const animando = React.useRef(false)
  const notasMs = React.useRef(0)
  const idxAuto = React.useRef(0)
  const ultimoCorte = React.useRef(0)

  // Latido del replay: marca de tiempo de la última nota (cualquier fuente que emita al global).
  React.useEffect(() => subscribirNotas(() => { notasMs.current = performance.now() }), [])

  // Selección MANUAL de toma → animar hacia ella.
  React.useEffect(() => {
    destino.current = tomaPorId(toma)
    const i = TOMAS_AUTO.indexOf(toma)
    if (i >= 0) idxAuto.current = i
    animando.current = true
  }, [toma])

  // En auto el usuario no orbita (el director manda); en libre, OrbitControls recibe input normal.
  React.useEffect(() => {
    if (controls) controls.enabled = !auto
  }, [auto, controls])

  useFrame((_, dt) => {
    if (auto) {
      const ahora = performance.now()
      const tocando = ahora - notasMs.current < TOCANDO_MS
      if (tocando && ahora - ultimoCorte.current > CORTE_MS) {
        idxAuto.current = (idxAuto.current + 1) % TOMAS_AUTO.length
        destino.current = tomaPorId(TOMAS_AUTO[idxAuto.current])
        animando.current = true
        ultimoCorte.current = ahora
      } else if (!tocando && destino.current.id !== 'general' && ahora - notasMs.current > IDLE_VOLVER_MS) {
        // entre canciones, vuelve a la toma general
        idxAuto.current = 0
        destino.current = TOMAS[0]
        animando.current = true
      }
    }
    if (!animando.current) return
    const d = destino.current
    const k = 1 - Math.exp(-RATE * dt)
    _vPos.set(d.pos[0], d.pos[1], d.pos[2])
    _vTar.set(d.target[0], d.target[1], d.target[2])
    camera.position.lerp(_vPos, k)
    if (controls) controls.target.lerp(_vTar, k)
    const fovObj = d.fov ?? FOV_DEFAULT
    camera.fov = THREE.MathUtils.lerp(camera.fov, fovObj, k)
    camera.updateProjectionMatrix()
    if (controls) controls.update()
    if (camera.position.distanceTo(_vPos) < 0.01 && Math.abs(camera.fov - fovObj) < 0.1) animando.current = false
  })
  return null
}
