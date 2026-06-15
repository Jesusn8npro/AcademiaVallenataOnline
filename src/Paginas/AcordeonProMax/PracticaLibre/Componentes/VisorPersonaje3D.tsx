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
import { esEscenarioGLB } from './visor/escenarios'
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
      g.traverse((o: any) => { if (o.isMesh) o.castShadow = true }) // el personaje proyecta sombra
      // Centrar por el hueso HIPS (caderas), NO por el centro del bbox: el bbox incluye el ACORDEÓN (sale
      // al frente) y su tamaño/centro varía por personaje → centrar por bbox dejaba el CUERPO en un punto
      // distinto en cada personaje (se "desubicaba" al cambiar). Con las caderas, todos quedan EXACTO igual.
      let hips: THREE.Object3D | null = null
      g.traverse((o: any) => { if (!hips && o.isBone && /Hips$/.test(o.name || '')) hips = o })
      const eje = new THREE.Vector3()
      if (hips) (hips as THREE.Object3D).getWorldPosition(eje)
      else box.getCenter(eje)
      g.position.x = -eje.x          // caderas centradas en X (consistente entre personajes)
      g.position.z = -eje.z          // caderas centradas en Z
      g.position.y = -box.min.y      // pies a y=0
    }
    raf = requestAnimationFrame(medir)
    return () => cancelAnimationFrame(raf)
  }, [claveMedicion])
  return <group ref={ref}>{children}</group>
}

// rotarVista: gira la VISTA 90° (roll de cámara) sin deformar — útil en el Simulador App para ver al
// personaje de cuerpo entero llenando pantallas anchas. Opcional, por defecto false → Pro Max intacto.
// El roll se hace por el vector `up` de la cámara (no por CSS, que deformaría el render 3D).
const VisorPersonaje3D: React.FC<{ rotarVista?: boolean }> = ({ rotarVista = false }) => {
  // Estado compartido (selector, skin, baile, escenario, fuelle) vive en el contexto: los controles
  // están en el panel de la derecha. Acá solo se dibuja la escena, limpia, sin dock que tape al personaje.
  const { personajeId, skin, baile, escenarioId, tomaCamara, directorAuto, fuelleAbiertoRef, setFuelle, posEscenario, posCargado } = usePersonajeEstudio()
  const glbActual = (PERSONAJES.find((p) => p.id === personajeId) ?? PERSONAJES[0]).archivo
  const posActual = posEscenario(escenarioId)
  // Para escenarios .glb esperamos a que carguen las posiciones guardadas antes de dibujar → así
  // aparece YA en la posición fija (sin el "salto" de la posición por defecto a la guardada).
  const mostrarEscenario = !esEscenarioGLB(escenarioId) || posCargado

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
        <Canvas shadows camera={{ position: [0, 1.15, 4.2], fov: 35, up: rotarVista ? [1, 0, 0] : [0, 1, 0] }} dpr={[1, 1.25]}>
          <React.Suspense fallback={null}>
            <EnvmapLocal />
            {/* Rig de estudio 3-point en tiempo real (ilumina el cove Y al personaje animado).
                Cámara en +Z (frente); el cove/telón queda en -Z (fondo). */}
            <ambientLight intensity={0.16} />
            {/* KEY: principal cálida, frente-izquierda-alta. Es la que PROYECTA la sombra del personaje
                (frustum ajustado alrededor del origen, donde está anclado el personaje). */}
            <directionalLight
              position={[-3.2, 4.2, 3.0]} intensity={2.2} color="#ffe7c9" castShadow
              shadow-mapSize-width={2048} shadow-mapSize-height={2048}
              shadow-camera-near={0.5} shadow-camera-far={16}
              shadow-camera-left={-3.5} shadow-camera-right={3.5} shadow-camera-top={4} shadow-camera-bottom={-3.5}
              shadow-bias={-0.0004} shadow-normalBias={0.02}
            />
            {/* FILL: relleno suave y frío, frente-derecha-baja → ablanda las sombras */}
            <directionalLight position={[3.5, 1.8, 2.5]} intensity={0.5} color="#d4e2ff" />
            {/* RIM / contra: cálida desde atrás-arriba → recorta al personaje contra el fondo */}
            <directionalLight position={[1.8, 4.0, -3.5]} intensity={2.4} color="#ffd2a1" />
            {/* HALO: pool de luz cálida sobre el cove, detrás del personaje (acento premium) */}
            <pointLight position={[0, 2.0, -2.4]} intensity={2.6} distance={8} decay={2} color="#ff9540" />
            {/* Escenario en su PROPIO Suspense → carga asíncrona: el personaje no espera por él. */}
            <React.Suspense fallback={null}>
              {mostrarEscenario && <Escenario id={escenarioId} pos={posActual} />}
            </React.Suspense>
            {/* Piso receptor de sombra (transparente, solo oscurece donde cae la sombra). El personaje
                siempre está anclado a y=0, así que esta sombra de contacto cae justo a sus pies en
                CUALQUIER escenario (y aterriza al personaje cuando no hay piso, p.ej. 'ninguno'). */}
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} receiveShadow>
              <planeGeometry args={[10, 10]} />
              <shadowMaterial transparent opacity={0.3} />
            </mesh>
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
