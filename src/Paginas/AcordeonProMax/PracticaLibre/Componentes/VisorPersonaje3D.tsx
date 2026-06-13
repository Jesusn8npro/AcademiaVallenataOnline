'use client'
import * as React from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { PERSONAJES } from '../personajes'
import { usePersonajeEstudio } from '../contextoPersonajeEstudio'
import { Modelo } from './visor/Modelo'
import { Escenario } from './visor/Escenario'
import { DirectorCamara } from './visor/DirectorCamara'

const EnvmapLocal: React.FC = () => {
  const { gl, scene } = useThree()
  React.useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex
    return () => { envTex.dispose(); pmrem.dispose(); scene.environment = null }
  }, [gl, scene])
  return null
}

// Ancla el personaje al PISO: mide su caja envolvente y lo desplaza para que los PIES caigan en y=0
// y quede centrado en X/Z. Reemplaza al viejo <Center> (que lo dejaba flotando en el centro de su
// caja) — necesario para que se pare natural sobre el escenario. Re-mide al cambiar de personaje.
const PersonajePiso: React.FC<{ claveMedicion: string; children: React.ReactNode }> = ({ claveMedicion, children }) => {
  const ref = React.useRef<THREE.Group>(null!)
  React.useEffect(() => {
    let raf = 0
    const medir = () => {
      const g = ref.current
      if (!g) return
      g.position.set(0, 0, 0)
      g.updateWorldMatrix(true, true)
      const box = new THREE.Box3().setFromObject(g)
      if (box.isEmpty()) { raf = requestAnimationFrame(medir); return } // aún sin malla → reintenta
      const c = box.getCenter(new THREE.Vector3())
      g.position.x = -c.x          // centrar en X
      g.position.z = -c.z          // centrar en Z
      g.position.y = -box.min.y    // pies a y=0
    }
    raf = requestAnimationFrame(medir)
    return () => cancelAnimationFrame(raf)
  }, [claveMedicion])
  return <group ref={ref}>{children}</group>
}

const VisorPersonaje3D: React.FC = () => {
  // Estado compartido (selector, skin, baile, escenario, fuelle) vive en el contexto: los controles
  // están en el panel de la derecha. Acá solo se dibuja la escena, limpia, sin dock que tape al personaje.
  const { personajeId, skin, baile, escenarioId, tomaCamara, directorAuto, fuelleAbiertoRef, setFuelle } = usePersonajeEstudio()
  const glbActual = (PERSONAJES.find((p) => p.id === personajeId) ?? PERSONAJES[0]).archivo

  // La tecla Q cierra el fuelle (mismo control que el botón del panel). Sólo activa mientras el
  // visor está montado (= pestaña Personaje abierta).
  React.useEffect(() => {
    const onDown = (e: KeyboardEvent) => { if (e.key === 'q' || e.key === 'Q') setFuelle(true) }
    const onUp = (e: KeyboardEvent) => { if (e.key === 'q' || e.key === 'Q') setFuelle(false) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      setFuelle(false)
    }
  }, [setFuelle])

  return (
    <div className="visor-personaje-stage">
      <div className="visor-personaje-lienzo">
        {/* Cámara deliberada (ya no auto-Bounds): enmarca al personaje de cuerpo entero sobre el piso. */}
        <Canvas camera={{ position: [0, 1.15, 4.2], fov: 35 }} dpr={[1, 1.25]}>
          <React.Suspense fallback={null}>
            <EnvmapLocal />
            {/* Rig de estudio 3-point en tiempo real (ilumina el cove Y al personaje animado).
                Cámara en +Z (frente); el cove/telón queda en -Z (fondo). */}
            <ambientLight intensity={0.16} />
            {/* KEY: principal cálida, frente-izquierda-alta */}
            <directionalLight position={[-3.2, 4.2, 3.0]} intensity={2.2} color="#ffe7c9" />
            {/* FILL: relleno suave y frío, frente-derecha-baja → ablanda las sombras */}
            <directionalLight position={[3.5, 1.8, 2.5]} intensity={0.5} color="#d4e2ff" />
            {/* RIM / contra: cálida desde atrás-arriba → recorta al personaje contra el fondo */}
            <directionalLight position={[1.8, 4.0, -3.5]} intensity={2.4} color="#ffd2a1" />
            {/* HALO: pool de luz cálida sobre el cove, detrás del personaje (acento premium) */}
            <pointLight position={[0, 2.0, -2.4]} intensity={2.6} distance={8} decay={2} color="#ff9540" />
            {/* Escenario en su PROPIO Suspense → carga asíncrona: el personaje no espera por él. */}
            <React.Suspense fallback={null}>
              <Escenario id={escenarioId} />
            </React.Suspense>
            <PersonajePiso claveMedicion={personajeId}>
              <Modelo key={personajeId} fuelleAbiertoRef={fuelleAbiertoRef} skin={skin} glb={glbActual} baile={baile} />
            </PersonajePiso>
            {/* Control tipo Blender: orbitar (clic izq), encuadrar/pan (clic der), zoom (scroll). */}
            <OrbitControls
              makeDefault
              enablePan
              target={[0, 1, 0]}
              minDistance={0.6}
              maxDistance={20}
              enableDamping
              dampingFactor={0.1}
              zoomSpeed={0.9}
              panSpeed={0.8}
            />
            <DirectorCamara toma={tomaCamara} auto={directorAuto} />
          </React.Suspense>
        </Canvas>
      </div>
    </div>
  )
}

export default VisorPersonaje3D
